// Summoner 施法动画：8 帧——双手渐举，绿焰汇聚至头顶符环。
import { SummonerGenerator } from './SummonerGenerator.js';

const generator = new SummonerGenerator();

export const SUMMONER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;

    SUMMONER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: -Math.floor(attackPhase * 2),
        headOffset: { x: 0, y: -Math.floor(attackPhase) },
        robeWave: attackPhase,
        armRaise: attackPhase,
        runeGlow: attackPhase
    }));
}
