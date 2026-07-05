// RoomPlan —— 房间系统 V2 的分层中间表示（IR）。
// 「一切后端只认它」：字符模板经适配器、代码构建器（P2）都产出 RoomPlan，
// placeEncounter 只消费 RoomPlan。本文件是纯数据 + 纯函数，不依赖 Canvas / DOM。
//
// 结构（docs/feature/ROOM_SYSTEM_V2.md §1.1）：
//   w, h        —— 房间模板栅格尺寸（tile）
//   mask        —— 形状层 Uint8Array(w*h)：1=房内地板，0=虚空/内墙（字符画的 # 挖除）
//   floor       —— 地板层 Uint8Array(w*h)：逐 tile 的 FLOOR_TYPES id，0=沿用楼层默认
//                  （字符模板无逐格地板画，恒为全 0；整房材质走 meta.floorType）
//   objects     —— 物件层 [{ x, y, kind, type? }]
//                    kind='cover' 战斗掩体（具体箱/桶在放置期随机，type 缺省）
//                    kind='decor' 主题装饰（具体件在放置期按主题权重抽，type 缺省）
//                    kind='prop'  叙事道具（type 为具体物件 id，如 'table'/'dungeon_bars'）
//   spawns      —— 出怪层 [{ x, y, role:'m|r|h|e', wave: 1|2 }]（1=首波，2=第二波）
//   pits        —— 危险层 [{ x, y }]（坑；尖刺等机关走 objects）
//   doorSlots   —— 开门位建议 [{ side:'N|S|E|W', offset }]（连接算法消费，缺省=空）
//   meta        —— { id, tier, weight, floors, floorType, story }
//
// 注意波次口径：IR 用 1/2（与 P2 RoomBuilder 的 spawns.wave(1)/wave(2) 授权 API 对齐）。
// 下游 DungeonManager 按 0/1 分波，转换在 placeEncounter 输出边界完成。

export const FLOOR_DEFAULT = 0;

// 物件语义类别
export const OBJECT_COVER = 'cover';
export const OBJECT_DECOR = 'decor';
export const OBJECT_PROP = 'prop';
export const OBJECT_KINDS = [OBJECT_COVER, OBJECT_DECOR, OBJECT_PROP];

// 出怪角色与波次
export const SPAWN_ROLES = ['m', 'r', 'h', 'e'];
export const WAVE_FIRST = 1;
export const WAVE_SECOND = 2;

/** 栅格线性索引。 */
export function maskIndex(w, x, y) {
    return y * w + x;
}

/**
 * 构造 RoomPlan，补齐缺省层。
 * mask 缺省=全 1（满形状），floor 缺省=全 0（沿用楼层默认），各表缺省=空。
 * 传入的 mask/floor 若为普通数组会转成 Uint8Array。
 */
export function createRoomPlan(spec) {
    const { w, h } = spec;
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
        throw new Error(`createRoomPlan: 非法尺寸 w=${w} h=${h}`);
    }
    const size = w * h;

    let mask;
    if (spec.mask == null) {
        mask = new Uint8Array(size).fill(1);
    } else if (spec.mask instanceof Uint8Array) {
        mask = spec.mask;
    } else {
        mask = Uint8Array.from(spec.mask);
    }

    let floor;
    if (spec.floor == null) {
        floor = new Uint8Array(size); // 默认全 0
    } else if (spec.floor instanceof Uint8Array) {
        floor = spec.floor;
    } else {
        floor = Uint8Array.from(spec.floor);
    }

    return {
        w,
        h,
        mask,
        floor,
        objects: spec.objects ? spec.objects.slice() : [],
        spawns: spec.spawns ? spec.spawns.slice() : [],
        pits: spec.pits ? spec.pits.slice() : [],
        doorSlots: spec.doorSlots ? spec.doorSlots.slice() : [],
        meta: {
            id: null,
            tier: null,
            weight: 1,
            floors: null,
            floorType: null,
            story: null,
            ...(spec.meta || {})
        }
    };
}

/** 坐标是否在房内地板（mask===1）。 */
export function isInside(plan, x, y) {
    if (x < 0 || x >= plan.w || y < 0 || y >= plan.h) return false;
    return plan.mask[maskIndex(plan.w, x, y)] === 1;
}

/** mask===0 的挖除格 → 内墙坐标表（row-major）。placeEncounter 用它还原墙 tile。 */
export function maskToWallCoords(plan) {
    const walls = [];
    for (let y = 0; y < plan.h; y++) {
        for (let x = 0; x < plan.w; x++) {
            if (plan.mask[maskIndex(plan.w, x, y)] === 0) walls.push({ x, y });
        }
    }
    return walls;
}

/** 取某类物件（保持 objects 原始 row-major 相对顺序，决定放置期 rng 序列）。 */
export function objectsOfKind(plan, kind) {
    return plan.objects.filter((o) => o.kind === kind);
}

/**
 * 连通性检查：把 mask===0 与坑视为阻挡，其余（房内地板）必须全连通。
 * 复用 encounter-templates.test.js 的「墙/坑不得封死区域」思想。
 * @returns { reachable, totalOpen, connected }
 */
export function checkConnectivity(plan) {
    const { w, h } = plan;
    const blocked = new Set();
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (plan.mask[maskIndex(w, x, y)] === 0) blocked.add(`${x},${y}`);
        }
    }
    for (const p of plan.pits) blocked.add(`${p.x},${p.y}`);

    const totalOpen = w * h - blocked.size;
    if (totalOpen <= 0) return { reachable: 0, totalOpen: 0, connected: true };

    let start = null;
    for (let y = 0; y < h && !start; y++) {
        for (let x = 0; x < w; x++) {
            if (!blocked.has(`${x},${y}`)) { start = [x, y]; break; }
        }
    }
    const visited = new Set([`${start[0]},${start[1]}`]);
    const queue = [start];
    while (queue.length) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const key = `${nx},${ny}`;
            if (visited.has(key) || blocked.has(key)) continue;
            visited.add(key);
            queue.push([nx, ny]);
        }
    }
    return { reachable: visited.size, totalOpen, connected: visited.size === totalOpen };
}

/**
 * 校验 RoomPlan 自洽性：尺寸一致、各层坐标在 mask 内、连通不封死。
 * @param {Object} plan
 * @param {Object} [opts] { requireConnected=true }
 * @returns { ok: boolean, errors: string[] }
 */
export function validateRoomPlan(plan, opts = {}) {
    const { requireConnected = true } = opts;
    const errors = [];
    const id = plan?.meta?.id ?? '(anon)';

    if (!plan || !Number.isInteger(plan.w) || !Number.isInteger(plan.h) || plan.w <= 0 || plan.h <= 0) {
        errors.push(`${id}: 非法尺寸`);
        return { ok: false, errors };
    }
    const { w, h } = plan;
    const size = w * h;

    if (!plan.mask || plan.mask.length !== size) errors.push(`${id}: mask 长度应为 ${size}，实为 ${plan.mask && plan.mask.length}`);
    if (!plan.floor || plan.floor.length !== size) errors.push(`${id}: floor 长度应为 ${size}，实为 ${plan.floor && plan.floor.length}`);

    const inBounds = (x, y) => x >= 0 && x < w && y >= 0 && y < h;

    // 物件/出怪/坑必须落在房内（不越界、不压在虚空/内墙上）
    for (const o of plan.objects) {
        if (!inBounds(o.x, o.y)) { errors.push(`${id}: 物件越界 (${o.x},${o.y})`); continue; }
        if (plan.mask[maskIndex(w, o.x, o.y)] !== 1) errors.push(`${id}: 物件压墙 (${o.x},${o.y}) kind=${o.kind}`);
        if (!OBJECT_KINDS.includes(o.kind)) errors.push(`${id}: 未知物件类别 ${o.kind}`);
        if (o.kind === OBJECT_PROP && !o.type) errors.push(`${id}: prop 缺 type (${o.x},${o.y})`);
    }
    for (const s of plan.spawns) {
        if (!inBounds(s.x, s.y)) { errors.push(`${id}: 出怪越界 (${s.x},${s.y})`); continue; }
        if (plan.mask[maskIndex(w, s.x, s.y)] !== 1) errors.push(`${id}: 出怪压墙 (${s.x},${s.y})`);
        if (!SPAWN_ROLES.includes(s.role)) errors.push(`${id}: 未知出怪角色 ${s.role}`);
        if (s.wave !== WAVE_FIRST && s.wave !== WAVE_SECOND) errors.push(`${id}: 非法波次 ${s.wave}`);
    }
    for (const p of plan.pits) {
        if (!inBounds(p.x, p.y)) { errors.push(`${id}: 坑越界 (${p.x},${p.y})`); continue; }
        if (plan.mask[maskIndex(w, p.x, p.y)] !== 1) errors.push(`${id}: 坑压墙 (${p.x},${p.y})`);
    }

    if (requireConnected && errors.length === 0) {
        const conn = checkConnectivity(plan);
        if (!conn.connected) errors.push(`${id}: 存在封死区域（可达 ${conn.reachable}/${conn.totalOpen}）`);
    }

    return { ok: errors.length === 0, errors };
}
