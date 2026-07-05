// FlailWarden 待机动画：16 帧——沉重呼吸 + 链球在体侧轻晃。
import { FlailWardenGenerator } from './FlailWardenGenerator.js';

const generator = new FlailWardenGenerator();

export const FLAIL_WARDEN_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    FLAIL_WARDEN_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(Math.sin(phase * Math.PI * 2) * 0.6),
        legFrame: 0,
        // 链球垂于左下侧，微幅摆动
        flailAngle: 2.4 + Math.sin(phase * Math.PI * 2) * 0.15,
        flailRadius: 8,
        tension: 0
    }));
}
