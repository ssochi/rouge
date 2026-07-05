// Wraith 追击动画：12 帧——前倾疾漂 + 拖尾高频甩动 + 断链大幅甩摆（性格=怨）。
import { WraithGenerator } from './WraithGenerator.js';

const generator = new WraithGenerator();

export const WRAITH_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;

    // 疾漂：高频小幅上下颠簸
    const floatY = Math.round(Math.sin(rad * 2) * 1.5);
    // 前倾：追击姿态整体前探
    const lean = 2;
    // 呼吸随疾漂加速
    const breathe = Math.sin(rad * 2);
    // 拖尾走两个循环，甩得更急
    const tailWave = (phase * 2) % 1;
    // 断链大幅甩摆（移动惯性）
    const chainSwing = Math.sin(rad * 2) * 1.2;
    // 追击时目光锁定，眼略微前移不眨
    const eyeDrift = -0.6;

    WRAITH_RUN_FRAMES.push(generator.generateFrame({
        floatY,
        lean,
        breathe,
        tailWave,
        chainSwing,
        eyeDrift,
        eyeBlink: 0,
        flare: 0.3 // 追击时怨气微溢
    }));
}
