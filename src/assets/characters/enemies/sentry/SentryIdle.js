// Sentry 待机动画：16 帧——炮管+目镜联动扫描摆动 + 目镜待机橙光 + 绿指示灯闪烁。
import { SentryGenerator } from './SentryGenerator.js';

const generator = new SentryGenerator();

export const SENTRY_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    SENTRY_IDLE_FRAMES.push(generator.generateFrame({
        scanOffset: Math.round(Math.sin(rad) * 2),   // 炮管缓慢上下扫描
        charge: 0,
        recoil: 0,
        firing: false,
        indicator: phase * 2,                         // 指示灯每周期闪 2 次
        steam: 0,
        shellEject: 0
    }));
}
