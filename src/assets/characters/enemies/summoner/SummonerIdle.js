// Summoner 待机动画：16 帧——呼吸 + 袍摆 + 眼焰微光。
import { SummonerGenerator } from './SummonerGenerator.js';

const generator = new SummonerGenerator();

export const SUMMONER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);

    SUMMONER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.8),
        headOffset: { x: 0, y: Math.floor(breath * 0.5) },
        robeWave: phase,
        armRaise: 0.1,
        runeGlow: 0.15 + 0.1 * Math.sin(rad * 2)
    }));
}
