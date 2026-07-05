// 盗宝地精待机：16 帧——轻呼吸颠簸 + 麻袋微晃 + 偶尔耳朵抽动与偷笑。
import { LootGoblinGenerator } from './LootGoblinGenerator.js';

const generator = new LootGoblinGenerator();

export const LOOT_GOBLIN_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    const flick = (i % 8 === 4) ? 1 : 0; // 每半圈抽一下耳朵
    LOOT_GOBLIN_IDLE_FRAMES.push(generator.generateFrame({
        bob: Math.round(breath * 0.8),
        legPhase: -1,
        armSwing: breath * 0.2,
        sackSway: Math.round(Math.sin(phase * Math.PI * 2 + 1) * 1),
        grin: 0.4 + Math.abs(breath) * 0.2,
        earFlick: flick
    }));
}
