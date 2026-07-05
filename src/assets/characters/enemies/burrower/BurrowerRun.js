// 掘地虫翻涌：12 帧——半出土的剧烈churn（体节强波动 + 泥屑），用于出土/潜地过渡表现。
import { BurrowerGenerator } from './BurrowerGenerator.js';

const generator = new BurrowerGenerator();

export const BURROWER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    BURROWER_RUN_FRAMES.push(generator.generateFrame({
        rear: 0.55 + Math.sin(phase * Math.PI * 2) * 0.15,
        undulate: (phase * 1.5) % 1,
        mandible: 0.3,
        burst: 0.35,
        glow: 0.5
    }));
}
