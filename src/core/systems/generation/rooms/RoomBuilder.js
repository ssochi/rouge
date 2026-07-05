// RoomBuilder —— 房间系统 V2 的 PixelDraw 式代码化房间构建器（新授权前端）。
//
// 类比 PixelDraw「每个 tile 是一个像素」：房间被拆成多层——
//   形状层(mask) / 地板层(floor) / 物件层(objects) / 出怪层(spawns) / 危险层(pits)——
//   每层都能用链式工具逐格「作画」，且能产任意形状（圆/环/放射对称），
//   这是字符画前端做不到的。产物统一是 RoomPlan（IR），交给 placeEncounter 消费。
//
// 核心增益：构建函数接收「种子 rng」，count 区间 / scatter 落点等每局不同——
//   手工结构 + 程序化变体，同一模板每局长得不一样。
//
// 授权 API（见 docs/feature/ROOM_SYSTEM_V2.md §1.2，可增不可少）：
//   defineRoom(id, opts, build(R))  产出「模板工厂」descriptor（每次 build(rng) 产一个变体）
//   R.shape  : rect / ellipse / carve / carveEllipse / union      —— 操作 mask 层
//   R.floor  : fill / rect / border / checker / scatter           —— 逐格地板层（FLOOR_TYPES 键名）
//   R.objects: place / cover / decor / row / ring / scatter       —— prop(具体件)/cover/decor(抽象)
//   R.spawns : wave(1|2).at / .ring / .cluster                    —— 波次口径必须 1|2
//   R.pits   : rect / ring
//   对称     : R.mirrorX() / R.mirrorY() / R.rot4()               —— 已产内容镜像/旋转复制
//   R.door(side, offset)                                          —— 开门位建议（P3 连接消费）
//
// 坐标写法（归一化与绝对双写）：
//   整数 => 绝对 tile 坐标；非整数小数 => 归一化（相对房间尺寸，坐标乘 (w-1)/(h-1)）。
//   例：R.objects.place(t, 0.5, 0.5) = 房间中心；place(t, 6, 4) = tile(6,4)。
//   count / skip / thickness 恒为整数；ring/pits 的 radius 也遵循归一化规则
//   （小数 = 相对「中心到最近边」的比例，整数 = 绝对 tile）。

import {
    createRoomPlan,
    validateRoomPlan,
    maskIndex,
    OBJECT_COVER,
    OBJECT_DECOR,
    OBJECT_PROP,
    WAVE_FIRST,
    WAVE_SECOND
} from './RoomPlan.js';
import { FLOOR_TYPES } from '../../../../utils/FloorTypes.js';

// 确定性 PRNG（defineRoom 定义期做 dry-run 校验用；与游戏主 rng 无关）。
function mulberry32(a) {
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashStr(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

// FLOOR_TYPES 键名 → 数值 id（floor 层存数值，占位期由 placeEncounter 反查回键名）。
function floorId(typeKey) {
    if (typeKey == null) return 0;
    const id = FLOOR_TYPES[typeKey];
    if (id === undefined) {
        throw new Error(`未知地板类型 '${typeKey}'（应为 FLOOR_TYPES 键名，如 'PRISON_WET'）`);
    }
    return id;
}

function insideEllipse(x, y, cx, cy, rx, ry) {
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    return nx * nx + ny * ny <= 1.0001;
}

/**
 * 房间构建上下文。每次 defineRoom 的 build(rng) 都 new 一个新的 R，
 * 逐层「作画」，最后 toRoomPlan() 校验并产出 RoomPlan。
 */
class RoomBuilder {
    constructor(w, h, rng, meta) {
        this.w = w;
        this.h = h;
        this.rng = typeof rng === 'function' ? rng : Math.random;
        this.meta = meta;
        // 浮点中心（形状/环阵数学用；解析出的坐标恒取整）
        this.cx = (w - 1) / 2;
        this.cy = (h - 1) / 2;

        this.mask = new Uint8Array(w * h).fill(1); // 默认全矩形
        this.floorLayer = new Uint8Array(w * h);   // 默认全 0 = 沿用楼层默认
        this._objects = [];
        this._spawns = [];
        this._pits = [];
        this._doorSlots = [];

        // 链式子构建器（工具命名空间）
        this.shape = new ShapeTool(this);
        this.floor = new FloorTool(this);
        this.objects = new ObjectsTool(this);
        this.spawns = new SpawnTool(this);
        this.pits = new PitTool(this);
    }

    // ── 坐标解析 ──────────────────────────────────────────────
    _rx(v) { return Number.isInteger(v) ? v : Math.round(v * (this.w - 1)); }
    _ry(v) { return Number.isInteger(v) ? v : Math.round(v * (this.h - 1)); }
    // 半径：整数=绝对 tile；小数=相对「中心到最近边」的比例
    _rRadius(v) { return Number.isInteger(v) ? v : v * (Math.min(this.w, this.h) / 2); }
    // 长度（矩形宽高等）：整数=绝对；小数=相对该轴尺寸
    _rw(v) { return Number.isInteger(v) ? v : Math.round(v * this.w); }
    _rh(v) { return Number.isInteger(v) ? v : Math.round(v * this.h); }
    // 浮点坐标（环阵中心用，不取整）
    _fx(v) { return Number.isInteger(v) ? v : v * (this.w - 1); }
    _fy(v) { return Number.isInteger(v) ? v : v * (this.h - 1); }
    // count 支持 [min,max] 种子区间
    _count(spec) {
        if (Array.isArray(spec)) {
            const [lo, hi] = spec;
            return lo + Math.floor(this.rng() * (hi - lo + 1));
        }
        return spec;
    }

    _idx(x, y) { return maskIndex(this.w, x, y); }
    _inBounds(x, y) { return x >= 0 && x < this.w && y >= 0 && y < this.h; }
    _inside(x, y) { return this._inBounds(x, y) && this.mask[this._idx(x, y)] === 1; }

    _occupied() {
        const s = new Set();
        for (const o of this._objects) s.add(`${o.x},${o.y}`);
        for (const o of this._spawns) s.add(`${o.x},${o.y}`);
        for (const o of this._pits) s.add(`${o.x},${o.y}`);
        return s;
    }

    // 物件工厂：type==='cover'/'decor' → 抽象件；否则 → 具体 prop
    _mkObj(type, x, y) {
        if (type === OBJECT_COVER) return { x, y, kind: OBJECT_COVER };
        if (type === OBJECT_DECOR) return { x, y, kind: OBJECT_DECOR };
        return { x, y, kind: OBJECT_PROP, type };
    }

    // 「内部 tile 到房外（mask=0 或越界）的最短步数」距离场（仅 inside tile 有值，其余 -1）
    _edgeDistanceField() {
        const { w, h } = this;
        const dist = new Int16Array(w * h).fill(-1);
        const queue = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (!this._inside(x, y)) continue;
                let edge = false;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    if (!this._inside(x + dx, y + dy)) { edge = true; break; }
                }
                if (edge) { dist[this._idx(x, y)] = 1; queue.push([x, y]); }
            }
        }
        let head = 0;
        while (head < queue.length) {
            const [x, y] = queue[head++];
            const d = dist[this._idx(x, y)];
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy;
                if (!this._inside(nx, ny)) continue;
                const ni = this._idx(nx, ny);
                if (dist[ni] === -1) { dist[ni] = d + 1; queue.push([nx, ny]); }
            }
        }
        return dist;
    }

    // 环阵落点通用逻辑（objects/spawns/pits 复用）
    _ringInto(placeFn, opts) {
        const cxF = opts.cx != null ? this._fx(opts.cx) : this.cx;
        const cyF = opts.cy != null ? this._fy(opts.cy) : this.cy;
        const radius = this._rRadius(opts.radius ?? 0.5);
        const count = Math.max(1, this._count(opts.count ?? 1));
        const skip = new Set(opts.skip || []);
        const rot = opts.rotate ?? -Math.PI / 2; // 默认从正上方起始
        for (let i = 0; i < count; i++) {
            if (skip.has(i)) continue;
            const ang = rot + (2 * Math.PI * i) / count;
            const x = Math.round(cxF + radius * Math.cos(ang));
            const y = Math.round(cyF + radius * Math.sin(ang));
            if (this._inside(x, y)) placeFn(x, y);
        }
    }

    _freeCells(occ, edgeAvoid = 0) {
        const cells = [];
        const dist = edgeAvoid > 0 ? this._edgeDistanceField() : null;
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (!this._inside(x, y)) continue;
                if (occ.has(`${x},${y}`)) continue;
                if (dist && dist[this._idx(x, y)] < edgeAvoid) continue;
                cells.push([x, y]);
            }
        }
        return cells;
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ── 对称工具 ─────────────────────────────────────────────
    // 沿垂直中轴镜像已产内容（x → w-1-x）。mask/floor/objects/spawns/pits 全含。
    mirrorX() { return this._replicate([(x, y) => [this.w - 1 - x, y]]); }
    // 沿水平中轴镜像（y → h-1-y）。
    mirrorY() { return this._replicate([(x, y) => [x, this.h - 1 - y]]); }
    // 四向旋转复制（90/180/270°，绕中心）。要求方形栅格 w===h。
    rot4() {
        if (this.w !== this.h) {
            throw new Error(`rot4 需要方形栅格（当前 ${this.w}x${this.h}）`);
        }
        const n = this.w;
        const rot90 = (x, y) => [n - 1 - y, x];
        this._replicate([
            (x, y) => rot90(x, y),
            (x, y) => { const [a, b] = rot90(x, y); return rot90(a, b); },
            (x, y) => { let [a, b] = rot90(x, y);[a, b] = rot90(a, b); return rot90(a, b); }
        ]);
        return this;
    }

    // 把当前内容按一组坐标映射复制叠加（去重，避免轴上/中心重叠双放）。
    _replicate(mapFns) {
        const { w, h } = this;
        const baseMask = this.mask.slice();
        const baseFloor = this.floorLayer.slice();
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = this._idx(x, y);
                for (const f of mapFns) {
                    const [mx, my] = f(x, y);
                    if (!this._inBounds(mx, my)) continue;
                    const mi = this._idx(mx, my);
                    if (baseMask[i] === 1) this.mask[mi] = 1;
                    if (baseFloor[i] !== 0 && this.floorLayer[mi] === 0) this.floorLayer[mi] = baseFloor[i];
                }
            }
        }
        this._objects = this._replicateList(this._objects, mapFns, (o) => `${o.x},${o.y},${o.kind},${o.type || ''}`);
        this._spawns = this._replicateList(this._spawns, mapFns, (o) => `${o.x},${o.y},${o.role},${o.wave}`);
        this._pits = this._replicateList(this._pits, mapFns, (o) => `${o.x},${o.y}`);
        return this;
    }

    _replicateList(list, mapFns, keyOf) {
        const seen = new Set(list.map(keyOf));
        const out = list.slice();
        for (const item of list) {
            for (const f of mapFns) {
                const [mx, my] = f(item.x, item.y);
                if (!this._inBounds(mx, my)) continue;
                const clone = { ...item, x: mx, y: my };
                const k = keyOf(clone);
                if (seen.has(k)) continue;
                seen.add(k);
                out.push(clone);
            }
        }
        return out;
    }

    // ── 开门位（P3 连接消费）────────────────────────────────
    door(side, offset = 0.5) {
        this._doorSlots.push({ side, offset });
        return this;
    }

    // ── 产出 ─────────────────────────────────────────────────
    toRoomPlan() {
        const plan = createRoomPlan({
            w: this.w,
            h: this.h,
            mask: this.mask,
            floor: this.floorLayer,
            objects: this._objects,
            spawns: this._spawns,
            pits: this._pits,
            doorSlots: this._doorSlots,
            meta: { ...this.meta }
        });
        const { ok, errors } = validateRoomPlan(plan);
        if (!ok) throw new Error(`产物非法: ${errors.join('; ')}`);
        return plan;
    }
}

// ── 形状层 R.shape ──────────────────────────────────────────
class ShapeTool {
    constructor(R) { this.R = R; }

    // rect()：无参 = 全矩形（重置为满形状）；有参 = 只保留该矩形（其余置空）
    rect(x, y, w, h) {
        const R = this.R;
        if (x == null) { R.mask.fill(1); return this; }
        const x0 = R._rx(x), y0 = R._ry(y), rw = R._rw(w), rh = R._rh(h);
        R.mask.fill(0);
        for (let yy = y0; yy < y0 + rh; yy++) {
            for (let xx = x0; xx < x0 + rw; xx++) {
                if (R._inBounds(xx, yy)) R.mask[R._idx(xx, yy)] = 1;
            }
        }
        return this;
    }

    // ellipse()：无参 = 内切椭圆；有参 = 指定中心/半径（只保留椭圆内）
    ellipse(cx, cy, rx, ry) {
        const R = this.R;
        const ccx = cx != null ? R._fx(cx) : R.cx;
        const ccy = cy != null ? R._fy(cy) : R.cy;
        const rrx = rx != null ? R._rRadius(rx) : R.w / 2;
        const rry = ry != null ? R._rRadius(ry) : R.h / 2;
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                R.mask[R._idx(x, y)] = insideEllipse(x, y, ccx, ccy, rrx, rry) ? 1 : 0;
            }
        }
        return this;
    }

    // carve：挖除矩形（置 0）
    carve(x, y, w, h) {
        const R = this.R;
        const x0 = R._rx(x), y0 = R._ry(y), rw = R._rw(w), rh = R._rh(h);
        for (let yy = y0; yy < y0 + rh; yy++) {
            for (let xx = x0; xx < x0 + rw; xx++) {
                if (R._inBounds(xx, yy)) R.mask[R._idx(xx, yy)] = 0;
            }
        }
        return this;
    }

    // carveEllipse：挖除椭圆（置 0）—— 同心环/环形走道靠它嵌套
    carveEllipse(cx, cy, rx, ry) {
        const R = this.R;
        const ccx = cx != null ? R._fx(cx) : R.cx;
        const ccy = cy != null ? R._fy(cy) : R.cy;
        const rrx = rx != null ? R._rRadius(rx) : R.w / 4;
        const rry = ry != null ? R._rRadius(ry) : R.h / 4;
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                if (insideEllipse(x, y, ccx, ccy, rrx, rry)) R.mask[R._idx(x, y)] = 0;
            }
        }
        return this;
    }

    // union：把另一形状（回调里操作一个临时 shape）并入当前 mask（置 1）
    union(shapeFn) {
        const R = this.R;
        const tmp = new RoomBuilder(R.w, R.h, R.rng, R.meta);
        tmp.mask.fill(0);
        shapeFn(tmp.shape);
        for (let i = 0; i < R.mask.length; i++) {
            if (tmp.mask[i] === 1) R.mask[i] = 1;
        }
        return this;
    }
}

// ── 地板层 R.floor（逐格像素画）────────────────────────────
class FloorTool {
    constructor(R) { this.R = R; }

    // 整房填充（仅 mask 内 tile）
    fill(typeKey) {
        const R = this.R, id = floorId(typeKey);
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                if (R._inside(x, y)) R.floorLayer[R._idx(x, y)] = id;
            }
        }
        return this;
    }

    // 矩形区域上色
    rect(typeKey, x, y, w, h) {
        const R = this.R, id = floorId(typeKey);
        const x0 = R._rx(x), y0 = R._ry(y), rw = R._rw(w), rh = R._rh(h);
        for (let yy = y0; yy < y0 + rh; yy++) {
            for (let xx = x0; xx < x0 + rw; xx++) {
                if (R._inside(xx, yy)) R.floorLayer[R._idx(xx, yy)] = id;
            }
        }
        return this;
    }

    // 沿形状边界的镶边（thickness 圈，随形状轮廓）
    border(typeKey, thickness = 1) {
        const R = this.R, id = floorId(typeKey);
        const dist = R._edgeDistanceField();
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                const d = dist[R._idx(x, y)];
                if (d >= 1 && d <= thickness) R.floorLayer[R._idx(x, y)] = id;
            }
        }
        return this;
    }

    // 棋盘拼花（两色交替，仅 mask 内）
    checker(typeKeyA, typeKeyB) {
        const R = this.R, a = floorId(typeKeyA), b = floorId(typeKeyB);
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                if (!R._inside(x, y)) continue;
                R.floorLayer[R._idx(x, y)] = (x + y) % 2 === 0 ? a : b;
            }
        }
        return this;
    }

    // 散布上色（血渍/污渍等；count 支持 [min,max]，或 density 0-1 比例）
    scatter(typeKey, opts = {}) {
        const R = this.R, id = floorId(typeKey);
        const cells = [];
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                if (R._inside(x, y)) cells.push([x, y]);
            }
        }
        let n;
        if (opts.density != null) n = Math.round(cells.length * opts.density);
        else n = R._count(opts.count ?? 1);
        n = Math.min(cells.length, Math.max(0, n));
        R._shuffle(cells);
        for (let i = 0; i < n; i++) {
            const [x, y] = cells[i];
            R.floorLayer[R._idx(x, y)] = id;
        }
        return this;
    }
}

// ── 物件层 R.objects ────────────────────────────────────────
class ObjectsTool {
    constructor(R) { this.R = R; }

    // 直接放一个具体物件（type 为 ObjectRegistry id，如 'dungeon_pillar'）
    place(type, x, y) {
        const R = this.R;
        R._objects.push(R._mkObj(type, R._rx(x), R._ry(y)));
        return this;
    }
    // 抽象掩体/装饰（具体件由 placeEncounter 放置期随机/按主题权重抽）
    cover(x, y) { const R = this.R; R._objects.push(R._mkObj(OBJECT_COVER, R._rx(x), R._ry(y))); return this; }
    decor(x, y) { const R = this.R; R._objects.push(R._mkObj(OBJECT_DECOR, R._rx(x), R._ry(y))); return this; }

    // 直线排布：from→to 之间均匀放 count 个（含端点）。out-of-mask 点跳过。
    row(type, opts = {}) {
        const R = this.R;
        const from = opts.from || [opts.x ?? 0, opts.y ?? 0];
        const to = opts.to || from;
        const count = Math.max(1, R._count(opts.count ?? 1));
        const fx = R._rx(from[0]), fy = R._ry(from[1]);
        const tx = R._rx(to[0]), ty = R._ry(to[1]);
        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0 : i / (count - 1);
            const x = Math.round(fx + (tx - fx) * t);
            const y = Math.round(fy + (ty - fy) * t);
            if (R._inside(x, y)) R._objects.push(R._mkObj(type, x, y));
        }
        return this;
    }

    // 环阵：绕 center 均匀放 count 个；skip=[索引] 留缺口；out-of-mask 跳过。
    ring(type, opts = {}) {
        const R = this.R;
        R._ringInto((x, y) => R._objects.push(R._mkObj(type, x, y)), opts);
        return this;
    }

    // 散布：随机在 mask 内、未占用 tile 上放 count 个（count 支持 [min,max] 种子区间）。
    scatter(type, opts = {}) {
        const R = this.R;
        const occ = R._occupied();
        const cells = R._freeCells(occ, opts.avoidEdges ? 2 : 0);
        const n = Math.min(cells.length, Math.max(0, R._count(opts.count ?? 1)));
        R._shuffle(cells);
        for (let i = 0; i < n; i++) {
            const [x, y] = cells[i];
            R._objects.push(R._mkObj(type, x, y));
            occ.add(`${x},${y}`);
        }
        return this;
    }
}

// ── 危险层 R.pits ───────────────────────────────────────────
class PitTool {
    constructor(R) { this.R = R; }

    rect(x, y, w, h) {
        const R = this.R;
        const x0 = R._rx(x), y0 = R._ry(y), rw = R._rw(w), rh = R._rh(h);
        const occ = R._occupied();
        for (let yy = y0; yy < y0 + rh; yy++) {
            for (let xx = x0; xx < x0 + rw; xx++) {
                if (R._inside(xx, yy) && !occ.has(`${xx},${yy}`)) {
                    R._pits.push({ x: xx, y: yy });
                    occ.add(`${xx},${yy}`);
                }
            }
        }
        return this;
    }

    ring(opts = {}) {
        const R = this.R;
        const occ = R._occupied();
        R._ringInto((x, y) => {
            if (!occ.has(`${x},${y}`)) { R._pits.push({ x, y }); occ.add(`${x},${y}`); }
        }, opts);
        return this;
    }
}

// ── 出怪层 R.spawns ─────────────────────────────────────────
class SpawnTool {
    constructor(R) { this.R = R; }

    // wave(1|2) → 波次作用域子构建器
    wave(n) {
        if (n !== WAVE_FIRST && n !== WAVE_SECOND) {
            throw new Error(`spawns.wave 只接受 1 或 2（收到 ${n}）`);
        }
        return new WaveScope(this.R, n);
    }
}

class WaveScope {
    constructor(R, wave) { this.R = R; this.wave = wave; }

    _push(role, x, y) {
        if (this.R._inside(x, y)) this.R._spawns.push({ x, y, role, wave: this.wave });
        return this;
    }

    at(role, x, y) { return this._push(role, this.R._rx(x), this.R._ry(y)); }

    ring(role, opts = {}) {
        this.R._ringInto((x, y) => this.R._spawns.push({ x, y, role, wave: this.wave }), opts);
        return this;
    }

    // 成团出怪：near='edges' 贴边 / 'center' 居中；count 支持 [min,max]
    cluster(role, opts = {}) {
        const R = this.R;
        const near = opts.near || 'center';
        const dist = R._edgeDistanceField();
        const occ = R._occupied();
        let maxD = 1;
        for (let i = 0; i < dist.length; i++) if (dist[i] > maxD) maxD = dist[i];
        const cells = [];
        for (let y = 0; y < R.h; y++) {
            for (let x = 0; x < R.w; x++) {
                if (!R._inside(x, y)) continue;
                if (occ.has(`${x},${y}`)) continue;
                const d = dist[R._idx(x, y)];
                if (near === 'edges' && d > Math.max(2, Math.ceil(maxD * 0.4))) continue;
                if (near === 'center' && d < Math.ceil(maxD * 0.5)) continue;
                cells.push([x, y]);
            }
        }
        R._shuffle(cells);
        const n = Math.min(cells.length, Math.max(0, R._count(opts.count ?? 1)));
        for (let i = 0; i < n; i++) {
            const [x, y] = cells[i];
            R._spawns.push({ x, y, role, wave: this.wave });
            occ.add(`${x},${y}`);
        }
        return this;
    }
}

/**
 * 定义一个代码化房间「模板工厂」。
 * @param {string} id 模板 id
 * @param {Object} opts { tier, floors?, weight?, w, h, floorType?, story? }
 *                       w/h 为栅格尺寸（形状在此固定网格上作画，用于选池尺寸过滤）
 * @param {Function} buildFn (R) => void 逐层作画（种子 rng 通过 R.rng / count 区间生效）
 * @returns {Object} descriptor { id, tier, weight, floors, w, h, __code:true, meta, build(rng) }
 */
export function defineRoom(id, opts = {}, buildFn) {
    const { tier = null, floors = null, weight = 1, floorType = null, story = null } = opts;
    const w = opts.w ?? (opts.size ? opts.size[0] : undefined);
    const h = opts.h ?? (opts.size ? opts.size[1] : undefined);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
        throw new Error(`defineRoom[${id}] 需要正整数尺寸（opts.w/opts.h 或 opts.size）`);
    }
    if (typeof buildFn !== 'function') {
        throw new Error(`defineRoom[${id}] 缺少 build 函数`);
    }
    const meta = { id, tier, weight, floors, floorType, story };

    const descriptor = {
        id, tier, weight, floors, w, h,
        __code: true,
        meta,
        build(rng) {
            const R = new RoomBuilder(w, h, rng, meta);
            buildFn(R);
            return R.toRoomPlan();
        }
    };

    // 定义期 fail-fast：用确定性 rng 做一次 dry-run，构建/校验错误在模块加载时就暴露。
    try {
        descriptor.build(mulberry32(hashStr(id) ^ 0x9e3779b9));
    } catch (e) {
        throw new Error(`defineRoom[${id}] 定义校验失败：${e.message}`);
    }

    return descriptor;
}

export { RoomBuilder };
