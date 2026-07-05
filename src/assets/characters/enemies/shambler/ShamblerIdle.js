// 尸群蹒跚者待机：16 帧——迟缓喘息起伏 + 头颅缓慢耷拉 + 偶发抽搐张嘴 + 双臂无力垂摆。
import { ShamblerGenerator } from './ShamblerGenerator.js';

const generator = new ShamblerGenerator();

export const SHAMBLER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    // 第 9-11 帧抽搐（张嘴 + 轻颤）
    const twitch = (i >= 9 && i <= 11) ? 1 : 0;
    SHAMBLER_IDLE_FRAMES.push(generator.generateFrame({
        bodyY: breath * 0.6,
        sway: Math.sin(phase * Math.PI * 2) * 0.25,
        legPhase: 0,
        armSwing: phase,
        headTilt: 0.3 + breath * 0.2,
        mouthOpen: twitch ? 0.6 : 0.15,
        attackPhase: -1
    }));
}
