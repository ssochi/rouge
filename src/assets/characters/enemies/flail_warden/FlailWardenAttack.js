// FlailWarden 抡击动画：8 帧——前 3 帧拧身蓄力（铁球后引过顶），后 5 帧铁球沿完整圆弧高速绕体横扫。
import { FlailWardenGenerator } from './FlailWardenGenerator.js';

const generator = new FlailWardenGenerator();

export const FLAIL_WARDEN_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    if (i < 3) {
        // 蓄力：身体拧转，铁球从体侧上举到后方过顶
        const t = i / 2;
        FLAIL_WARDEN_ATTACK_FRAMES.push(generator.generateFrame({
            bodySquash: -Math.round(t * 1),
            legFrame: 0,
            flailAngle: 2.5 - t * 4.0,                    // 由左下摆向后上过顶
            flailRadius: 8 + Math.round(t * 2),
            tension: 0.4 + t * 0.4,                       // 蓄力张力上升（甲缝/盔眼发光）
            twist: -t * 2,                                // 反向拧身蓄力
            ballDrag: 0
        }));
    } else {
        // 横扫：铁球沿完整圆弧高速绕体一周（用角度序列画出圆弧轨迹）
        const t = (i - 3) / 4;
        FLAIL_WARDEN_ATTACK_FRAMES.push(generator.generateFrame({
            bodySquash: 1,
            legFrame: 0,
            flailAngle: -1.6 + t * (Math.PI * 2 + 0.6),   // 绕体一整圈
            flailRadius: 11,                              // 甩至最大半径
            tension: 1,                                   // 满张力（拖影）
            twist: 1 - t,                                 // 拧身释放转为前送
            ballDrag: 0
        }));
    }
}
