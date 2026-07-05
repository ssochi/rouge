// Hellhound 前扑动画：8 帧——低伏蓄势弓身（前段）→ 后蹬前扑、前爪张开、焰鬃暴涨（后段）。
import { HellhoundGenerator } from './HellhoundGenerator.js';

const generator = new HellhoundGenerator();

export const HELLHOUND_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7; // 0~1 扑击进度

    // 前段(0~0.4)：压低蓄势、背脊弓起；后段：骤然前扑、身体压低前冲
    const crouch = t < 0.4;
    const lunge = crouch ? 0 : Math.min(1, (t - 0.4) / 0.6 * 1.2);
    const bob = crouch ? 1 : -Math.round((t - 0.4) * 3);
    // 蓄势时背脊高高弓起（狂暴弹压），扑出时舒展
    const spineArc = crouch ? 0.8 : 0.8 - (t - 0.4) * 2;
    // 焰鬃暴涨：扑击时冲到最盛
    const ember = 0.6 + t * 0.4;
    // 前爪：扑出瞬间撑开
    const clawSpread = crouch ? 0 : Math.min(1, (t - 0.4) / 0.3);
    // 狂喘：扑击张口咆哮到最大
    const pant = crouch ? 0.5 : 1;

    HELLHOUND_ATTACK_FRAMES.push(generator.generateFrame({
        legPhase: crouch ? 0.5 : 0,
        bob,
        lunge,
        ember,
        spineArc,
        pant,
        clawSpread
    }));
}
