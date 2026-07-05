// 盗宝地精偷窃：8 帧——探爪抓取（attackPhase 0~1），前爪由收到探满再回收。
import { LootGoblinGenerator } from './LootGoblinGenerator.js';

const generator = new LootGoblinGenerator();

export const LOOT_GOBLIN_ATTACK_FRAMES = [];

// drawAttackArms 语义：attackPhase 0→0.5 探爪伸出，0.5→1 收回（抓走赃物）
for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    const reach = Math.sin(attackPhase * Math.PI); // 0→1→0
    LOOT_GOBLIN_ATTACK_FRAMES.push(generator.generateFrame({
        bob: Math.round(-reach * 1),
        legPhase: -1,
        armSwing: -0.3,
        grab: reach,
        sackSway: Math.round(reach * 2),
        grin: 0.9,
        earFlick: reach > 0.6 ? 1 : 0
    }));
}
