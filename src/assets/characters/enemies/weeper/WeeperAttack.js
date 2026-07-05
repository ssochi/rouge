// 怨眼施法：8 帧——眼睑猛睁大、瞳孔收缩锁定、泪如泉涌（tearFlow 拉满）。
import { WeeperGenerator } from './WeeperGenerator.js';

const generator = new WeeperGenerator();

export const WEEPER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;
    // 前段睁大蓄势，后段泪涌
    const wide = Math.min(1, t * 1.4);
    WEEPER_ATTACK_FRAMES.push(generator.generateFrame({
        blink: 0,
        tearFlow: 0.4 + t * 0.6,
        pupil: 1 - t * 0.35,     // 瞳孔收缩（凝视）
        tendrilWave: i / 8,
        bob: 0,
        gaze: 0,
        wide
    }));
}
