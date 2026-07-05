// 骨笛吹手吹奏：8 帧——唤潮前摇的「吹笛」动作（attackPhase 0~1）：
// 抬笛抵唇(0~0.4)→满吹指孔金光大盛+音符涌出(0.4~1)。实体在此前摇段结束时唤起 shambler。
import { BonePiperGenerator } from './BonePiperGenerator.js';

const generator = new BonePiperGenerator();

export const BONE_PIPER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    // 抬笛：前段快速抬到位并保持满吹
    const play = Math.min(1, attackPhase * 2.2);
    // 满吹时轻微前俯（发力感）
    BONE_PIPER_ATTACK_FRAMES.push(generator.generateFrame({
        bodyY: play * 0.6,
        legPhase: 0,
        cloakWave: attackPhase * 0.5,
        play,
        headBob: 0.2 + play * 0.5,
        glow: 0.5 + play * 0.5
    }));
}
