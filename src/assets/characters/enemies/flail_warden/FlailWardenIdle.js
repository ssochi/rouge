// FlailWarden 待机动画：16 帧——沉重呼吸 + 铁球垂于体侧近地轻晃 + 盔眼红光明灭。
import { FlailWardenGenerator } from './FlailWardenGenerator.js';

const generator = new FlailWardenGenerator();

export const FLAIL_WARDEN_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    FLAIL_WARDEN_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(Math.sin(rad) * 0.6),
        legFrame: 0,
        flailAngle: 2.5 + Math.sin(rad) * 0.12,           // 铁球垂于左下侧微摆
        flailRadius: 8,
        tension: 0.15 + 0.15 * (Math.sin(rad * 2) * 0.5 + 0.5), // 盔眼红光呼吸
        twist: 0,
        ballDrag: 0.85                                     // 铁球贴地垂放
    }));
}
