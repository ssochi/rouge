// Warlock 待机动画：16 帧——呼吸起伏 + 袍摆/兜帽垂角同相摆动 + 宝珠内漩涡缓慢旋转 + 挂坠轻晃。
import { WarlockGenerator } from './WarlockGenerator.js';

const generator = new WarlockGenerator();

export const WARLOCK_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad); // 呼吸主相位

    WARLOCK_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(breath * 0.8),               // 缓慢升降
        headOffset: { x: 0, y: Math.round(breath * 0.5) },  // 头随躯干微沉
        robeWave: phase,                                     // 袍摆整周期一次
        staffRaise: 0.05 + 0.05 * breath,                   // 杖头随呼吸微起伏
        orbPulse: 0.28 + 0.14 * Math.sin(rad * 2),          // 宝珠低频微光（不到光晕阈值）
        swirlPhase: phase,                                   // 漩涡每周期旋转一圈
        castArm: 0
    }));
}
