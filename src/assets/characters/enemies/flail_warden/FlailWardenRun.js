// FlailWarden 移动动画：12 帧——重步迈进 + 链球随步伐拖曳。
import { FlailWardenGenerator } from './FlailWardenGenerator.js';

const generator = new FlailWardenGenerator();

export const FLAIL_WARDEN_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    FLAIL_WARDEN_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(Math.abs(Math.sin(phase * Math.PI * 2)) * 1),
        legFrame: Math.floor(phase * 4),
        flailAngle: 2.3 + Math.sin(phase * Math.PI * 2) * 0.3,
        flailRadius: 8,
        tension: 0
    }));
}
