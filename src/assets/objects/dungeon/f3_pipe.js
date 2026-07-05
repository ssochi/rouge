// 纯美术：F3 管线阀门段（32×32，横贯钢管 + 法兰 + 红色阀轮）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const PIPE_D = '#2f353d';
const PIPE = '#5a6470';
const PIPE_L = '#79838f';
const VALVE_D = '#7a2a22';
const VALVE = '#b23a2f';
const SPOKE = '#8a8f99';
const RUST = '#6d4a2c';

export function createF3PipeSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 29, 12, 3, 'rgba(0,0,0,0.22)');

    // 主管（横贯）
    d.rect(2, 18, 28, 7, PIPE_D);
    d.rect(2, 18, 28, 5, PIPE);
    d.hLine(2, 18, 28, PIPE_L);     // 顶高光
    d.hLine(2, 24, 28, PIPE_D);     // 底阴影

    // 法兰（两处环座）
    d.rect(9, 16, 3, 11, PIPE_D);
    d.rect(9, 16, 3, 2, PIPE_L);
    d.rect(20, 16, 3, 11, PIPE_D);
    d.rect(20, 16, 3, 2, PIPE_L);

    // 阀门轮（中央）
    d.circle(16, 13, 4, VALVE_D);
    d.circle(16, 13, 3, VALVE);
    d.pixel(16, 9, SPOKE);
    d.pixel(16, 17, SPOKE);
    d.pixel(12, 13, SPOKE);
    d.pixel(20, 13, SPOKE);
    d.vLine(16, 13, 5, SPOKE);      // 阀杆接管

    // 锈斑
    d.pixel(5, 21, RUST);
    d.pixel(26, 22, RUST);
    d.pixel(14, 23, RUST);
    return d.getCanvas();
}
