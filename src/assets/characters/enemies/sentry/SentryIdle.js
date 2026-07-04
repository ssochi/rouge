// Sentry 待机动画：16 帧——炮管扫描摆动 + 目镜呼吸。
import { SentryGenerator } from './SentryGenerator.js';

const generator = new SentryGenerator();

export const SENTRY_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    SENTRY_IDLE_FRAMES.push(generator.generateFrame({
        scanOffset: Math.round(Math.sin(rad) * 2),
        charge: 0,
        recoil: 0,
        firing: false
    }));
}
