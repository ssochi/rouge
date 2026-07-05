// tests/room-plan-golden.test.js
// 房间系统 V2 · P1 黄金回归：字符模板 → 适配器 → RoomPlan 的解析产物，
// 必须与【改造前】当前代码 dump 的 fixture 逐模板完全一致（70/70）。
//
// fixture（tests/fixtures/room-plan-golden.json）由改造前的 parseEncounter 生成，
// 捕获每个模板的 内墙(walls)/坑(pits)/掩体(covers)/装饰(decors)/道具(props)/
// 出怪点(spawns)/地板覆写(floorType)，坐标集合规范化排序。
// 解析层确定性（无 rng），故无需固定种子。
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    ENCOUNTER_TEMPLATES,
    encounterToRoomPlan
} from '../src/core/systems/generation/EncounterTemplates.js';
import { roomPlanToParsed } from '../src/core/systems/generation/rooms/EncounterAdapter.js';
import { validateRoomPlan } from '../src/core/systems/generation/rooms/RoomPlan.js';

const golden = JSON.parse(
    readFileSync(fileURLToPath(new URL('./fixtures/room-plan-golden.json', import.meta.url)), 'utf8')
);

const key = (p) => `${p.x},${p.y}`;
const sorted = (arr, f) => arr.map(f).sort();

// 与 fixture 生成脚本同口径的规范化（roomPlanToParsed 已把 wave 还原为旧 0/1）。
function normalize(plan) {
    const p = roomPlanToParsed(plan);
    return {
        w: p.w,
        h: p.h,
        floorType: p.floorType,
        walls: sorted(p.walls, key),
        pits: sorted(p.pits, key),
        covers: sorted(p.covers, key),
        decors: sorted(p.decors, key),
        props: sorted(p.props, (o) => `${o.x},${o.y}|${o.type}`),
        spawns: sorted(p.spawns, (s) => `${s.x},${s.y}|${s.role}|${s.wave}`)
    };
}

describe('RoomPlan 黄金回归（字符模板 → 适配器）', () => {
    it('fixture 覆盖全部模板（70/70），无遗漏无多余', () => {
        const fixtureIds = new Set(Object.keys(golden));
        const templateIds = new Set(ENCOUNTER_TEMPLATES.map((t) => t.id));
        expect(fixtureIds.size).toBe(templateIds.size);
        for (const id of templateIds) expect(fixtureIds.has(id), `fixture 缺 ${id}`).toBe(true);
        for (const id of fixtureIds) expect(templateIds.has(id), `fixture 多余 ${id}`).toBe(true);
    });

    for (const template of ENCOUNTER_TEMPLATES) {
        it(`模板 ${template.id}：适配器产物 === 改造前 fixture`, () => {
            const plan = encounterToRoomPlan(template);
            expect(normalize(plan)).toEqual(golden[template.id]);
        });
    }

    it('全部模板的 RoomPlan 自洽（validateRoomPlan 无错误）', () => {
        for (const template of ENCOUNTER_TEMPLATES) {
            const plan = encounterToRoomPlan(template);
            const { ok, errors } = validateRoomPlan(plan);
            expect(ok, `${template.id}: ${errors.join('; ')}`).toBe(true);
        }
    });
});
