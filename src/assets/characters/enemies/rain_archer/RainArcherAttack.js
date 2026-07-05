// 雨幕射手抛射：8 帧——弯弓朝天蓄力(attackPhase 0~1)：
// 举弓仰头(0~0.5)→满拉朝天(0.5~0.9)→撒放(0.9~1)。实体在撒放帧登记玩家区域的延迟箭雨。
import { RainArcherGenerator } from './RainArcherGenerator.js';

const generator = new RainArcherGenerator();

export const RAIN_ARCHER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    // 举弓朝天：前段抬起，中段满拉，末帧撒放（弦回弹→draw 骤降）
    const aimUp = Math.min(1, attackPhase * 1.6);
    const draw = attackPhase < 0.9 ? Math.min(1, attackPhase * 1.3) : 0.1;
    RAIN_ARCHER_ATTACK_FRAMES.push(generator.generateFrame({
        bodyY: -attackPhase * 0.6,
        legFrame: 0,
        aimUp,
        draw,
        headUp: Math.min(1, attackPhase * 1.4),
        wrapWave: attackPhase * 0.4,
        glow: 0.6 + attackPhase * 0.4
    }));
}
