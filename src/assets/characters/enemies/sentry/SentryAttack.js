// Sentry 攻击动画：8 帧——前 5 帧蓄力聚能，后 3 帧开火后坐。
import { SentryGenerator } from './SentryGenerator.js';

const generator = new SentryGenerator();

export const SENTRY_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const isFiring = i >= 5;

    SENTRY_ATTACK_FRAMES.push(generator.generateFrame({
        scanOffset: 0,
        charge: isFiring ? 0 : (i + 1) / 5,
        recoil: isFiring ? (i % 2 === 1 ? 2 : 1) : 0,
        firing: isFiring
    }));
}
