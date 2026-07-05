// 电弧双子放电：8 帧——电弧节点拉满蓄能（attackPhase 0~1）：核心炽亮、双眼睁大、火花缠绕。
import { ArcTwinGenerator } from './ArcTwinGenerator.js';

const blue = new ArcTwinGenerator('blue');
const purple = new ArcTwinGenerator('purple');

function build(gen) {
    const frames = [];
    for (let i = 0; i < 8; i++) {
        const attackPhase = i / 7;
        const pulse = Math.sin(attackPhase * Math.PI * 3);
        frames.push(gen.generateFrame({
            bob: 0,
            flare: 0.6,
            eyeGlow: 0.85,
            charge: 0.6 + Math.abs(pulse) * 0.4,
            wisp: attackPhase
        }));
    }
    return frames;
}

export const ARC_TWIN_ATTACK_FRAMES = build(blue);
export const ARC_TWIN_ATTACK_FRAMES_PURPLE = build(purple);
