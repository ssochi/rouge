// Gargoyle 雕像态：4 帧微动——收翼低头的真石雕（含基座/风化/青苔），
// 偶尔眼缝闪过一丝红光（伪装破绽的恐怖感）。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_DORMANT_FRAMES = [];

for (let i = 0; i < 4; i++) {
    // 第 2 帧：眼缝一闪红光 + 石身极轻一沉（几不可察的“活物破绽”）
    const flick = i === 2;
    GARGOYLE_DORMANT_FRAMES.push(generator.generateFrame({
        bodySquash: flick ? 1 : 0,
        legFrame: 0,
        wingSpread: 0,        // 收翼贴背
        headBow: 1,           // 低垂头颅
        eyeGlow: 0,
        eyeFlicker: flick ? 0.8 : 0, // 仅第 2 帧眼缝泛红
        hover: 0,
        crack: 0,
        dormant: true
    }));
}
