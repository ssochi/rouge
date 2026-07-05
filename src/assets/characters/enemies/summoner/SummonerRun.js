// Summoner 移动动画：12 帧——前倾滑行 + 袍摆加速 + 双手收拢于身前（护焰）+ 眼焰稳定。
import { SummonerGenerator } from './SummonerGenerator.js';

const generator = new SummonerGenerator();

export const SUMMONER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;
    const bob = Math.sin(rad * 2);

    SUMMONER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(bob * 1.2),
        headOffset: { x: 0, y: Math.round(bob * 0.6) },
        robeWave: (phase * 2) % 1,
        lean: 2,
        armStage: 0,                                      // 移动中双手垂放
        runeGlow: 0.1,
        circleProgress: 0,
        eyeFlicker: 0.6
    }));
}
