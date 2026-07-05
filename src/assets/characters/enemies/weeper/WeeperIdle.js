// 怨眼待机：16 帧——悬浮升降 + 触须轻摆 + 偶尔眨眼 + 泪痕缓垂。
import { WeeperGenerator } from './WeeperGenerator.js';

const generator = new WeeperGenerator();

export const WEEPER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    // 在第 6~8 帧完成一次眨眼
    const blink = (i >= 6 && i <= 8) ? Math.sin((i - 6) / 2 * Math.PI) : 0;
    WEEPER_IDLE_FRAMES.push(generator.generateFrame({
        blink: blink * 0.9,
        tearFlow: 0.3 + Math.abs(breath) * 0.1,
        pupil: 1,
        tendrilWave: phase,
        bob: Math.round(breath * 1.4),
        gaze: 0,
        wide: 0
    }));
}
