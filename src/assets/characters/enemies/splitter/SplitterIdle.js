// 裂弹僧待机：16 帧——袍身微呼吸 + 袍摆轻曳 + 法典符文缓脉。
import { SplitterGenerator } from './SplitterGenerator.js';

const generator = new SplitterGenerator();

export const SPLITTER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    SPLITTER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.7),
        robeWave: phase,
        cast: 0,
        pageFlutter: 0,
        orbCharge: 0
    }));
}
