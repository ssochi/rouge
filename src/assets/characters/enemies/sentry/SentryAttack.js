// Sentry 攻击动画：8 帧——前 5 帧蓄力（散热格渐亮+蒸汽），后 3 帧开火后坐+抛壳。
import { SentryGenerator } from './SentryGenerator.js';

const generator = new SentryGenerator();

export const SENTRY_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const isFiring = i >= 5;
    const chargeT = (i + 1) / 5; // 蓄力进度

    SENTRY_ATTACK_FRAMES.push(generator.generateFrame({
        scanOffset: 0,                                   // 锁定目标，停止扫描
        charge: isFiring ? 0 : chargeT,                  // 散热格渐亮聚能
        recoil: isFiring ? (i % 2 === 1 ? 3 : 1) : 0,    // 交替后坐抖动
        firing: isFiring,
        indicator: 0,
        steam: isFiring ? 0.9 : chargeT * 0.7,           // 蓄力升温冒汽，开火时爆汽
        shellEject: isFiring ? (i - 5 + 1) / 3 : 0       // 开火后弹壳抛出
    }));
}
