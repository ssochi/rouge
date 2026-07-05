// 骨笛吹手走位：12 帧——保持距离的碎步游走（步态循环 + 袍摆飘动 + 头随身微晃，笛垂于身侧）。
import { BonePiperGenerator } from './BonePiperGenerator.js';

const generator = new BonePiperGenerator();

export const BONE_PIPER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));
    BONE_PIPER_RUN_FRAMES.push(generator.generateFrame({
        bodyY: bob * 1,
        legPhase: Math.floor(phase * 4),
        cloakWave: (phase * 1.5) % 1,
        play: 0,
        headBob: 0.3 + bob * 0.3,
        glow: 0.5
    }));
}
