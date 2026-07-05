// Summoner 待机动画：16 帧——呼吸 + 袍摆 + 眼焰明灭 + 首枚符文低频微亮。
import { SummonerGenerator } from './SummonerGenerator.js';

const generator = new SummonerGenerator();

export const SUMMONER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);

    SUMMONER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(breath * 0.8),
        headOffset: { x: 0, y: Math.round(breath * 0.5) },
        robeWave: phase,
        armStage: 0.08,                                   // 双手低垂微抬
        runeGlow: 0.12 + 0.1 * Math.abs(breath),          // 仅首枚符文低频呼吸微亮
        circleProgress: 0,
        eyeFlicker: 0.4 + 0.35 * (Math.sin(rad * 2) * 0.5 + 0.5) // 眼焰闪动
    }));
}
