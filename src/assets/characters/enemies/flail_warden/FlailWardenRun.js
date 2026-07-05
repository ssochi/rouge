// FlailWarden 移动动画：12 帧——重步迈进 + 铁球随步伐在地面拖曳（拖痕火星）。
import { FlailWardenGenerator } from './FlailWardenGenerator.js';

const generator = new FlailWardenGenerator();

export const FLAIL_WARDEN_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;

    FLAIL_WARDEN_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(Math.abs(Math.sin(rad)) * 1),
        legFrame: Math.floor(phase * 4),
        flailAngle: 2.4 + Math.sin(rad) * 0.25,           // 铁球随步伐前后摆
        flailRadius: 9,
        tension: 0.2,
        twist: 0,
        ballDrag: 0.9                                      // 拖地滑行
    }));
}
