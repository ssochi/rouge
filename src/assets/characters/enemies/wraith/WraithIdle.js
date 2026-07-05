// Wraith 待机动画：16 帧——浮沉呼吸 + 三缕拖尾摆动 + 双眼漂移眨灭（性格=怨）。
import { WraithGenerator } from './WraithGenerator.js';

const generator = new WraithGenerator();

export const WRAITH_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // 浮沉：正弦上下漂（负值向上）
    const floatY = Math.round(Math.sin(rad) * 2);
    // 呼吸涨缩：与浮沉错相，帽体一张一敛
    const breathe = Math.sin(rad + Math.PI / 2);
    // 双眼横向漂移：低频游移，怨灵目光飘忽不定
    const eyeDrift = Math.sin(phase * Math.PI * 2 + 0.6);
    // 眨灭：第 6 帧眼灭、第 7 帧复亮（特定帧的“性格动作”）
    let eyeBlink = 0;
    if (i === 6) eyeBlink = 1;
    if (i === 13) eyeBlink = 1; // 第二次短促眨灭
    // 断链随浮沉微甩
    const chainSwing = Math.sin(rad) * 0.6;

    WRAITH_IDLE_FRAMES.push(generator.generateFrame({
        floatY,
        tailWave: phase,
        breathe,
        eyeDrift,
        eyeBlink,
        chainSwing,
        flare: 0
    }));
}
