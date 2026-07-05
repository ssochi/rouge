// 怨眼移动：12 帧——漂移升降加大 + 触须甩动 + 瞳孔随移动微偏（警觉注视）。
import { WeeperGenerator } from './WeeperGenerator.js';

const generator = new WeeperGenerator();

export const WEEPER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const sway = Math.sin(phase * Math.PI * 2);
    WEEPER_RUN_FRAMES.push(generator.generateFrame({
        blink: 0,
        tearFlow: 0.4,
        pupil: 0.9,
        tendrilWave: (phase * 1.5) % 1,
        bob: Math.round(sway * 2),
        gaze: Math.round(sway * 1.5), // 瞳孔随漂移方向轻扫
        wide: 0
    }));
}
