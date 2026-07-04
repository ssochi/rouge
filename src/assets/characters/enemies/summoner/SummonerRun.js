// Summoner 移动动画：12 帧——前倾滑行 + 袍摆加速。
import { SummonerGenerator } from './SummonerGenerator.js';

const generator = new SummonerGenerator();

export const SUMMONER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;
    const bob = Math.sin(rad * 2);

    SUMMONER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        headOffset: { x: 0, y: Math.floor(bob * 0.6) },
        robeWave: phase * 2 % 1,
        lean: 1,
        armRaise: 0,
        runeGlow: 0.1
    }));
}
