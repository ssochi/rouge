// Warlock 施法动画：8 帧——举杖挺身蓄力，第二只手抬起结印+袍袖上卷，宝珠暗→亮→溢出电弧后收势。
import { WarlockGenerator } from './WarlockGenerator.js';

const generator = new WarlockGenerator();

export const WARLOCK_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;                        // 0 → 1
    const raise = Math.sin(t * Math.PI);    // 举杖：升起后收回（钟形）
    // 充能：0→0.85 持续攀升至第 6 帧爆闪，末帧回落（释放）
    const pulse = t < 0.82 ? t / 0.82 : 1 - (t - 0.82) / 0.18 * 0.7;
    // 第二只手：前段抬起结印，末帧随释放略回收
    const castArm = t < 0.85 ? Math.min(1, t / 0.5) : 0.7;

    WARLOCK_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: -Math.round(raise * 1.5),               // 蓄力挺身拔高
        headOffset: { x: 0, y: -Math.round(raise) },
        robeWave: 0.25 + t * 0.5,                            // 施法时袍摆前掀
        staffRaise: raise,                                   // 举杖
        orbPulse: Math.min(1, Math.max(0, pulse)),          // 分阶充能
        swirlPhase: (t * 2) % 1,                             // 充能时漩涡飞转
        castArm                                              // 第二只手抬起
    }));
}
