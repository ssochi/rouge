// 电弧双子游走：12 帧——横向漂移绕侧 + 披风扩张 + 电弧节点半蓄能。蓝/紫两套。
import { ArcTwinGenerator } from './ArcTwinGenerator.js';

const blue = new ArcTwinGenerator('blue');
const purple = new ArcTwinGenerator('purple');

function build(gen) {
    const frames = [];
    for (let i = 0; i < 12; i++) {
        const phase = i / 12;
        const sway = Math.sin(phase * Math.PI * 2);
        frames.push(gen.generateFrame({
            bob: Math.round(Math.cos(phase * Math.PI * 2) * 1),
            flare: 0.55,
            eyeGlow: 0.55,
            charge: 0.35,
            lean: Math.round(sway * 2),
            wisp: (phase * 1.4) % 1
        }));
    }
    return frames;
}

export const ARC_TWIN_RUN_FRAMES = build(blue);
export const ARC_TWIN_RUN_FRAMES_PURPLE = build(purple);
