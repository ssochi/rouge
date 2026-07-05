// Wraith 怨爆动画：8 帧——怨气自体内涌出：内影外翻扩张 + 双眼放大 + 上浮聚力后爆散。
import { WraithGenerator } from './WraithGenerator.js';

const generator = new WraithGenerator();

export const WRAITH_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7; // 0~1 攻击进度

    // 蓄力上浮（前段）→ 爆散回落（后段）
    const floatY = i < 5 ? -Math.round(t * 3) : -Math.round((1 - t) * 4);
    // 怨气外放：前段骤增，末帧最盛
    const flare = Math.min(1, t * 1.25);
    // 内影外翻靠 flare 驱动，此处补一次呼吸胀大配合
    const breathe = Math.sin(t * Math.PI); // 0→1→0 躯体先胀后收
    // 拖尾被怨气上卷
    const tailWave = t;
    // 略前倾扑向目标
    const lean = 1;
    // 眼在爆发时放大（flare>0.5 触发），此处让目光死盯前方
    const eyeDrift = -0.4;

    WRAITH_ATTACK_FRAMES.push(generator.generateFrame({
        floatY,
        flare,
        breathe,
        tailWave,
        lean,
        eyeDrift,
        eyeBlink: 0,
        chainSwing: Math.sin(t * Math.PI * 2) * 1.5 // 怨气震得断链狂甩
    }));
}
