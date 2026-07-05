// Summoner 施法动画：8 帧——抬手→胸前结印→双掌展开，符文逐个亮起，脚下召唤光圈后期显现。
import { SummonerGenerator } from './SummonerGenerator.js';

const generator = new SummonerGenerator();

export const SUMMONER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7; // 0 → 1 施法推进

    SUMMONER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: -Math.round(Math.sin(t * Math.PI) * 1.5), // 结印时挺身
        headOffset: { x: 0, y: -Math.round(t * 1) },
        robeWave: 0.25 + t * 0.4,
        armStage: t,                                          // 分段法印全程推进
        runeGlow: t,                                          // 符文逐个点亮（0→4 枚）
        circleProgress: Math.max(0, (t - 0.45) / 0.55),       // 中段起脚下光圈渐显
        eyeFlicker: 0.5 + t * 0.5                             // 眼焰随施法增强
    }));
}
