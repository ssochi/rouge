// 尸群蹒跚者奔走：12 帧——东倒西歪的踉跄步（大幅左右摇摆 + 沉重落步 + 头随身甩 + 垂臂乱摆）。
import { ShamblerGenerator } from './ShamblerGenerator.js';

const generator = new ShamblerGenerator();

export const SHAMBLER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    // 摇摆频率略高于步频，制造醉汉式失衡感
    const sway = Math.sin(phase * Math.PI * 2);
    const bob = Math.abs(Math.sin(phase * Math.PI * 4)); // 每半步一次落步下沉
    SHAMBLER_RUN_FRAMES.push(generator.generateFrame({
        bodyY: bob * 1.4,
        sway: sway * 0.9,
        legPhase: Math.floor(phase * 4),
        armSwing: phase,
        headTilt: 0.4 + sway * 0.4,
        mouthOpen: 0.3 + bob * 0.3,
        attackPhase: -1
    }));
}
