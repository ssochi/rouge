// EncounterAdapter —— 字符模板 → RoomPlan 适配器。
// 存量 70 个字符画模板零迁移：字符画降级为「另一种授权前端」，产物同为 RoomPlan。
// 一字不漏地保留 parseEncounter 的原始语义（见 EncounterTemplates.js 头注释图例）：
//   .   空地（不落任何层）
//   #   内墙  → mask 挖除（该格 mask=0）
//   p   坑    → pits
//   c   掩体  → objects{kind:'cover'}（具体箱/桶放置期随机）
//   d   装饰  → objects{kind:'decor'}（具体件放置期按主题权重抽）
//   m/r/h/e   波1 出怪 → spawns{wave:1}
//   M/R/H/E   波2 出怪 → spawns{wave:2}（小写归一 role）
//   其余字符  → legend 映射的具体物件 → objects{kind:'prop', type}
//   floorType → meta.floorType（整房地板覆写，非逐格）
//
// 字符判定优先级与旧 parseEncounter 完全一致：保留字（./#/p/c/d/mrhe/MRHE）先判，
// legend 兜底最后判——故 legend 即便映射到保留字也不会覆盖保留语义；
// 既非保留字又不在 legend 的未知字符静默忽略（与旧行为一致）。

import {
    createRoomPlan,
    maskToWallCoords,
    objectsOfKind,
    maskIndex,
    OBJECT_COVER,
    OBJECT_DECOR,
    OBJECT_PROP,
    WAVE_FIRST,
    WAVE_SECOND
} from './RoomPlan.js';

/**
 * 字符模板 → RoomPlan。纯确定性（无 rng）：rng 只在选模板/放置阶段用。
 * @param {Object} template { id, tier, weight, rows, legend?, floors?, floorType?, story? }
 * @returns {Object} RoomPlan
 */
export function encounterToRoomPlan(template) {
    const rows = template.rows;
    const legend = template.legend || {};
    const h = rows.length;
    const w = rows[0].length;

    const mask = new Uint8Array(w * h).fill(1);
    const objects = [];
    const spawns = [];
    const pits = [];

    // row-major 扫描：objects/spawns/pits 的相对顺序即字符画阅读顺序，
    // 放置期按类别 filter 时该顺序被保留，决定掩体/装饰的 rng 抽取序列（零回归关键）。
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x];
            if (ch === '.') continue;
            if (ch === '#') {
                mask[maskIndex(w, x, y)] = 0;
            } else if (ch === 'p') {
                pits.push({ x, y });
            } else if (ch === 'c') {
                objects.push({ x, y, kind: OBJECT_COVER });
            } else if (ch === 'd') {
                objects.push({ x, y, kind: OBJECT_DECOR });
            } else if (ch === 'm' || ch === 'r' || ch === 'h' || ch === 'e') {
                spawns.push({ x, y, role: ch, wave: WAVE_FIRST });
            } else if (ch === 'M' || ch === 'R' || ch === 'H' || ch === 'E') {
                spawns.push({ x, y, role: ch.toLowerCase(), wave: WAVE_SECOND });
            } else if (legend[ch]) {
                objects.push({ x, y, kind: OBJECT_PROP, type: legend[ch] });
            }
            // else: 未知字符，静默忽略（与旧 parseEncounter 一致）
        }
    }

    return createRoomPlan({
        w,
        h,
        mask,
        objects,
        spawns,
        pits,
        meta: {
            id: template.id,
            tier: template.tier ?? null,
            weight: template.weight ?? 1,
            floors: template.floors ?? null,
            floorType: template.floorType || null,
            story: template.story ?? null
        }
    });
}

/**
 * RoomPlan → 旧 parseEncounter 产物形状（向后兼容视图）。
 * 供 parseEncounter 复用（现存模板测试零改动）与黄金测试对照 fixture。
 * 波次口径由 IR 的 1|2 还原为旧 0|1。
 * @returns {{id, w, h, walls, pits, covers, decors, spawns, props, floorType}}
 */
export function roomPlanToParsed(plan) {
    return {
        id: plan.meta.id,
        w: plan.w,
        h: plan.h,
        walls: maskToWallCoords(plan),
        pits: plan.pits.map((p) => ({ x: p.x, y: p.y })),
        covers: objectsOfKind(plan, OBJECT_COVER).map((o) => ({ x: o.x, y: o.y })),
        decors: objectsOfKind(plan, OBJECT_DECOR).map((o) => ({ x: o.x, y: o.y })),
        spawns: plan.spawns.map((s) => ({ x: s.x, y: s.y, role: s.role, wave: s.wave - 1 })),
        props: objectsOfKind(plan, OBJECT_PROP).map((o) => ({ x: o.x, y: o.y, type: o.type })),
        floorType: plan.meta.floorType || null
    };
}
