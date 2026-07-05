// FlailWarden 抡击动画：8 帧——前 4 帧后引蓄力（链球上举），后 4 帧 360° 横扫（链球绕体）。
import { FlailWardenGenerator } from './FlailWardenGenerator.js';

const generator = new FlailWardenGenerator();

export const FLAIL_WARDEN_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    if (i < 4) {
        // 蓄力：链球从体侧上举到后方过顶
        const t = i / 3;
        FLAIL_WARDEN_ATTACK_FRAMES.push(generator.generateFrame({
            bodySquash: -Math.round(t * 1),
            legFrame: 0,
            flailAngle: 2.4 - t * 3.9,
            flailRadius: 8 + Math.round(t * 2),
            tension: t
        }));
    } else {
        // 横扫：链球高速绕体一周
        const t = (i - 4) / 3;
        FLAIL_WARDEN_ATTACK_FRAMES.push(generator.generateFrame({
            bodySquash: 1,
            legFrame: 0,
            flailAngle: -1.5 + t * (Math.PI * 2 + 0.8),
            flailRadius: 11,
            tension: 1
        }));
    }
}
