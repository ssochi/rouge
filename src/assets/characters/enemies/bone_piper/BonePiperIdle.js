// 骨笛吹手待机：16 帧——平稳呼吸起伏 + 袍摆轻曳 + 头部缓慢俯仰 + 金瞳明灭（垂笛不吹）。
import { BonePiperGenerator } from './BonePiperGenerator.js';

const generator = new BonePiperGenerator();

export const BONE_PIPER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    BONE_PIPER_IDLE_FRAMES.push(generator.generateFrame({
        bodyY: breath * 0.6,
        legPhase: 0,
        cloakWave: phase,
        play: 0,
        headBob: breath * 0.4,
        glow: 0.4 + (breath + 1) * 0.15
    }));
}
