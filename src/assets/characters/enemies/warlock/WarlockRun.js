// Warlock 移动动画：12 帧——前倾滑行 + 袍摆双倍频加速 + 双频浮沉 + 宝珠漩涡加速旋转。
import { WarlockGenerator } from './WarlockGenerator.js';

const generator = new WarlockGenerator();

export const WARLOCK_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;
    const bob = Math.sin(rad * 2); // 步频浮沉（双倍频）

    WARLOCK_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(bob * 1.2),                    // 明显起伏
        headOffset: { x: 0, y: Math.round(bob * 0.6) },
        robeWave: (phase * 2) % 1,                            // 袍摆双倍频，滑行感
        lean: 2,                                              // 前倾滑行
        staffRaise: 0.18,                                     // 略举杖前伸
        orbPulse: 0.22,                                       // 移动中宝珠压暗
        swirlPhase: (phase * 3) % 1,                          // 漩涡随速度加速
        castArm: 0
    }));
}
