// 裂弹僧施法：8 帧——举书蓄力、书页翻飞、裂弹球自法典升起（末帧待发）。
import { SplitterGenerator } from './SplitterGenerator.js';

const generator = new SplitterGenerator();

export const SPLITTER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = Math.min(1, i / 6);
    SPLITTER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: 0,
        robeWave: i / 8,
        cast: t,
        pageFlutter: i / 8,
        orbCharge: t * t     // 后段迅速膨大
    }));
}
