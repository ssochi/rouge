// 电弧双子待机：16 帧——悬浮升降 + 尾焰摆动 + 双眼脉动。蓝/紫两套镜像色。
import { ArcTwinGenerator } from './ArcTwinGenerator.js';

const blue = new ArcTwinGenerator('blue');
const purple = new ArcTwinGenerator('purple');

function build(gen) {
    const frames = [];
    for (let i = 0; i < 16; i++) {
        const phase = i / 16;
        const breath = Math.sin(phase * Math.PI * 2);
        frames.push(gen.generateFrame({
            bob: Math.round(breath * 1.4),
            flare: 0.35 + Math.abs(breath) * 0.12,
            eyeGlow: 0.45 + Math.abs(breath) * 0.2,
            charge: 0.1,
            wisp: phase
        }));
    }
    return frames;
}

export const ARC_TWIN_IDLE_FRAMES = build(blue);
export const ARC_TWIN_IDLE_FRAMES_PURPLE = build(purple);
