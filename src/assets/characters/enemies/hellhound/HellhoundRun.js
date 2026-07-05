// Hellhound 奔跑动画：12 帧——四足双相位疾奔 + 背脊拱伸起伏 + 焰鬃焰尾拉扬（性格=狂暴）。
import { HellhoundGenerator } from './HellhoundGenerator.js';

const generator = new HellhoundGenerator();

export const HELLHOUND_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;

    // 背脊起伏：伸展（脊拱）与收拢（脊缩）交替，与步态同步——奔腾的“弓身-舒展”
    const spineArc = Math.sin(rad);
    // 身体随奔腾上下颠簸（步频两倍）
    const bob = Math.round(Math.abs(Math.sin(rad)) * 2);

    HELLHOUND_RUN_FRAMES.push(generator.generateFrame({
        legPhase: phase,          // 驱动四足双相位循环
        bob,
        lunge: 0,
        ember: 0.6 + Math.sin(rad * 2) * 0.3, // 疾奔时焰鬃被风拉扬明灭
        spineArc,
        pant: 0.3,                // 奔跑中仍急促喘息
        clawSpread: 0
    }));
}
