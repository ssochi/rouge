// 盗宝地精奔跑：12 帧——张扬疾跑，大摆臂 + 明显颠簸 + 麻袋乱晃、金币外溢。
import { LootGoblinGenerator } from './LootGoblinGenerator.js';

const generator = new LootGoblinGenerator();

export const LOOT_GOBLIN_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const stride = Math.sin(phase * Math.PI * 2);
    LOOT_GOBLIN_RUN_FRAMES.push(generator.generateFrame({
        bob: Math.round(Math.abs(stride) * -1.6),     // 跨步腾空上颠
        legPhase: phase,
        armSwing: stride,                              // 大摆臂
        sackSway: Math.round(Math.sin(phase * Math.PI * 2 + Math.PI * 0.5) * 3),
        grin: 0.7,                                     // 得意坏笑
        earFlick: Math.abs(stride) > 0.7 ? 1 : 0
    }));
}
