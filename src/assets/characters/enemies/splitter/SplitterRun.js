// 裂弹僧移动：12 帧——袍摆前倾滑步 + 微抱书上抬（护住法典）。
import { SplitterGenerator } from './SplitterGenerator.js';

const generator = new SplitterGenerator();

export const SPLITTER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));
    SPLITTER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        robeWave: (phase * 2) % 1,
        lean: 2,
        cast: 0.2,
        pageFlutter: 0,
        orbCharge: 0
    }));
}
