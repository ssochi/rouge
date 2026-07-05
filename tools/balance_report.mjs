#!/usr/bin/env node
// balance_report.mjs —— 战斗数值审计报告（只读，不改任何游戏文件）。
// 方法论见 docs/feature/COMBAT_BALANCE_METHODOLOGY.md：锚点=初始手枪，
// 武器用「有效DPS」统一度量并按稀有度带宽检查；敌人用「锚枪数TTK」按角色档检查。
// 用法：node tools/balance_report.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { WEAPONS } = await import(join(ROOT, 'src/assets/weapons/WeaponData.js'));
const { FLOOR_CONFIGS } = await import(join(ROOT, 'src/core/dungeon/FloorConfigs.js'));

// ── 方法论目标参数（调整平衡目标时改这里） ──────────────────────────────

// 稀有度 → 有效DPS 带宽（锚：初始手枪 ≈38）。带特效（AOE/控制/穿透）的武器应取带宽下限。
const RARITY_EDPS_BAND = {
    common: [30, 48],
    uncommon: [42, 60],
    rare: [52, 75],
    epic: [65, 95],
    legendary: [85, 125],
};
// AOE / 控制 / 特殊机制武器的等效乘数假设（单体EDPS × 乘数 = 等效EDPS）。
// blastRadius 视为平均命中 2.2 个敌人；控制类给固定等效加值。
const AOE_AVG_TARGETS = 2.2;
const UTILITY_EDPS_CREDIT = { freeze_ray: 25, black_hole_gun: 60, force_gun: 20, teleport_gun: 15, turret_deployer: 40 };
// 近战贴脸风险补偿：无需弹药+但承担贴身风险，允许比同稀有度枪械低 15%（乘 1/0.85 折回）。
const MELEE_RISK_DISCOUNT = 0.85;

// 敌人角色档：锚武器（手枪25伤）击杀枪数 → 档位。
const ANCHOR_DMG = 25;
const ENEMY_TIERS = [
    { name: '炮灰 fodder', shots: [1, 1] },
    { name: '标准 standard', shots: [2, 3] },
    { name: '重装 heavy', shots: [4, 6] },
    { name: '精英体格 elite-body', shots: [7, 10] },
    { name: 'Boss', shots: [24, 60] }, // 600-1500 HP
];

// ── 武器表 ──────────────────────────────────────────────────────────────

function effectiveDps(w) {
    const pellets = w.pelletCount ?? 1;
    if (!w.damage || !w.fireRate) return 0;
    const burst = (w.damage * pellets * 1000) / w.fireRate;
    if (!w.magazineSize || !w.reloadTime) return burst; // 近战/无换弹
    const cycle = w.magazineSize * w.fireRate + w.reloadTime;
    return (w.damage * pellets * w.magazineSize * 1000) / cycle;
}

const weaponRows = [];
for (const [id, w] of Object.entries(WEAPONS)) {
    if (!w.damage || !w.fireRate || !w.rarity) continue; // 工具/消耗品跳过
    const raw = effectiveDps(w);
    let equivalent = raw;
    const notes = [];
    // DoT 折算：单发施加的燃烧/中毒总伤按命中频率折入（帧单位 60fps，duration/tickInterval 为帧数）
    const dotTotal = (w.burnDamage ? w.burnDamage * Math.floor(w.burnDuration / w.burnTickInterval) : 0)
        + (w.poisonDamage ? w.poisonDamage * Math.floor(w.poisonDuration / w.poisonTickInterval) : 0);
    if (dotTotal > 0 && w.fireRate) {
        // DoT 不叠加时按 min(攻速, DoT持续) 的施加频率计——保守取每 max(fireRate, 500ms) 一次全额
        const dotDps = dotTotal * 1000 / Math.max(w.fireRate, 500);
        equivalent += dotDps;
        notes.push(`DoT+${dotDps.toFixed(0)}`);
    }
    if (w.blastRadius) { equivalent = equivalent * AOE_AVG_TARGETS; notes.push(`AOE×${AOE_AVG_TARGETS}`); }
    if (UTILITY_EDPS_CREDIT[id]) { equivalent += UTILITY_EDPS_CREDIT[id]; notes.push(`功能+${UTILITY_EDPS_CREDIT[id]}`); }
    const isMelee = !w.magazineSize && !w.reloadTime;
    if (isMelee) { equivalent = equivalent / MELEE_RISK_DISCOUNT; notes.push('近战折算'); }
    weaponRows.push({ id, rarity: w.rarity, raw, equivalent, notes: notes.join(' ') });
}

console.log('══════════ 武器有效DPS审计（等效值含AOE/功能折算） ══════════');
console.log('id\t稀有度\t裸EDPS\t等效EDPS\t带宽\t判定\t备注');
const weaponWarnings = [];
weaponRows.sort((a, b) => b.equivalent - a.equivalent);
for (const r of weaponRows) {
    const band = RARITY_EDPS_BAND[r.rarity] || [0, Infinity];
    const verdict = r.equivalent < band[0] ? '⚠️过弱' : r.equivalent > band[1] ? '⚠️过强' : 'OK';
    if (verdict !== 'OK') weaponWarnings.push(`${r.id}(${r.rarity}) 等效EDPS ${r.equivalent.toFixed(0)} 超出带宽 [${band}]${r.notes ? '（' + r.notes + '）' : ''}`);
    console.log([r.id, r.rarity, r.raw.toFixed(0), r.equivalent.toFixed(0), `${band[0]}-${band[1]}`, verdict, r.notes].join('\t'));
}

// ── 敌人表（扫描实体文件的 super(x, y, w, h, hp, speed)） ────────────────

const entityDir = join(ROOT, 'src/core/entities');
const enemyRows = [];
for (const file of readdirSync(entityDir)) {
    if (!file.endsWith('.js')) continue;
    const src = readFileSync(join(entityDir, file), 'utf8');
    if (!/extends\s+Enemy/.test(src)) continue;
    const m = src.match(/super\(x,\s*y,\s*\d+,\s*\d+,\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/);
    if (!m) continue;
    enemyRows.push({ name: file.replace('.js', ''), hp: parseFloat(m[1]), speed: parseFloat(m[2]) });
}

console.log('\n══════════ 敌人TTK审计（锚=手枪25伤；各层含hpMult） ══════════');
console.log('敌人\t基础HP\t速度\tF1枪数\tF2枪数\tF3枪数\t角色档(F1)');
const enemyWarnings = [];
enemyRows.sort((a, b) => a.hp - b.hp);
for (const e of enemyRows) {
    const shots = (floor) => Math.ceil((e.hp * (FLOOR_CONFIGS[floor]?.hpMult ?? 1)) / ANCHOR_DMG);
    const s1 = shots(1);
    const tier = ENEMY_TIERS.find(t => s1 >= t.shots[0] && s1 <= t.shots[1]);
    if (!tier) enemyWarnings.push(`${e.name} F1 需 ${s1} 枪，落在角色档空隙（档间断层或数值漂移）`);
    console.log([e.name, e.hp, e.speed, s1, shots(2), shots(3), tier ? tier.name : '⚠️档外'].join('\t'));
}

// ── Boss 跨层单调性 ──────────────────────────────────────────────────────

const BOSSES = { 1: 'MutantBeast', 2: 'SnakeBoss', 3: 'MechaGolem' };
let prev = 0;
for (const [floor, name] of Object.entries(BOSSES)) {
    const row = enemyRows.find(r => r.name === name);
    if (!row) continue;
    const ehp = row.hp * (FLOOR_CONFIGS[floor]?.hpMult ?? 1);
    if (ehp < prev) enemyWarnings.push(`Boss 有效HP倒挂：F${floor} ${name} ${ehp} < 上一层 ${prev}`);
    prev = ehp;
}

// ── 汇总 ────────────────────────────────────────────────────────────────

console.log('\n══════════ 告警汇总 ══════════');
if (!weaponWarnings.length && !enemyWarnings.length) console.log('全部通过 ✅');
for (const w of weaponWarnings) console.log('武器: ' + w);
for (const w of enemyWarnings) console.log('敌人: ' + w);
console.log(`\n武器 ${weaponRows.length} 把，告警 ${weaponWarnings.length}；敌人 ${enemyRows.length} 个，告警 ${enemyWarnings.length}`);
