import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createDresserSprite() {
    const w = 32;
    const h = 40;
    const drawer = new PixelDraw(w, h);

    // 🎨 高级调色板：胡桃木 (Walnut) 与 黄铜 (Brass)
    const cWoodTop = '#8c5a35';      // 顶部受光面 (体现35度俯视)
    const cWoodFront = '#704424';    // 正面主体色 (略暗)
    const cWoodDark = '#4a2a14';     // 阴影与暗部厚度
    const cWoodHigh = '#aa7648';     // 边缘亮部高光
    
    const cGold = '#f1c40f';         // 黄铜高光
    const cGoldDark = '#b7950b';     // 黄铜暗部
    
    const cMirror = '#8baebf';       // 镜面底色
    const cMirrorDark = '#5c7f92';   // 镜面深色反光
    const cMirrorHigh = '#dcf2fa';   // 镜面高光亮条
    
    const cShadow = 'rgba(0,0,0,0.2)';
    const cShadowDeep = 'rgba(0,0,0,0.45)';

    // === 1. 地面投影与柜腿 (Floor Shadow & Legs) ===
    // 地面阴影，稳住重心
    drawer.hLine(4, 38, 24, cShadowDeep);
    drawer.hLine(3, 39, 26, cShadow);

    // 左柜腿 (带有黄铜脚垫)
    drawer.rect(4, 36, 2, 3, cWoodDark);
    drawer.rect(4, 38, 2, 1, cGold);
    drawer.rect(5, 38, 1, 1, cGoldDark); // 替换 setPixel
    // 右柜腿
    drawer.rect(26, 36, 2, 3, cWoodDark);
    drawer.rect(26, 38, 2, 1, cGold);
    drawer.rect(27, 38, 1, 1, cGoldDark); // 替换 setPixel

    // === 2. 化妆镜背部支架 (Mirror Supports) ===
    // 支架位于桌面后方，需要先画，以便被桌面物品遮挡
    drawer.rect(9, 14, 2, 5, cWoodDark);
    drawer.rect(21, 14, 2, 5, cWoodDark);

    // === 3. 3D 圆角梳妆镜 (Rounded 3D Mirror) ===
    // 镜框外层阴影与厚度 (Back Frame / Thickness)
    drawer.rect(8, 3, 16, 13, cWoodDark);
    drawer.rect(7, 4, 18, 11, cWoodDark);
    
    // 镜框正面 (Front Frame)
    drawer.rect(8, 2, 16, 13, cWoodFront);
    drawer.rect(7, 3, 18, 11, cWoodFront);
    
    // 镜框立体高光 (左侧与顶部受光)
    drawer.hLine(9, 2, 14, cWoodHigh);
    drawer.vLine(7, 4, 9, cWoodHigh);

    // 镜面玻璃 (Glass)
    drawer.rect(9, 4, 14, 9, cMirror);
    drawer.rect(8, 5, 16, 7, cMirror);
    
    // 镜面环境反光细节
    // 右下角深色折射
    drawer.rect(18, 10, 4, 2, cMirrorDark);
    drawer.rect(20, 8, 2, 2, cMirrorDark);
    // 斜向明亮高光条纹 (Classic glass glint)
    drawer.line(10, 9, 13, 6, cMirrorHigh);
    drawer.line(11, 11, 17, 5, cMirrorHigh);
    drawer.rect(14, 11, 1, 1, '#ffffff'); // 最亮闪光点 (替换 setPixel)

    // === 4. 正面主体 (Front Body: y = 22 to 37) ===
    drawer.rect(2, 22, 28, 16, cWoodFront);
    // 柜体边缘立体感
    drawer.vLine(2, 22, 16, cWoodHigh);   // 左边缘受光
    drawer.vLine(29, 22, 16, cWoodDark);  // 右边缘背光
    drawer.hLine(2, 37, 28, cWoodDark);   // 底部收边

    // === 5. 浮雕抽屉组 (Embossed Drawers) ===
    // 绘制单个凸起抽屉的辅助函数
    const drawDrawer = (dx, dy, dw, dh) => {
        drawer.rect(dx, dy, dw, dh, cWoodFront);
        drawer.hLine(dx, dy, dw, cWoodHigh);               // 顶部高光
        drawer.vLine(dx, dy, dh, cWoodHigh);               // 左侧高光
        drawer.hLine(dx, dy + dh - 1, dw, cWoodDark);      // 底部阴影
        drawer.vLine(dx + dw - 1, dy, dh, cWoodDark);      // 右侧阴影
    };

    // 第一排：两个小抽屉
    drawDrawer(4, 24, 11, 4);  // 左小抽屉
    drawDrawer(17, 24, 11, 4); // 右小抽屉
    // 第二排：大抽屉
    drawDrawer(4, 29, 24, 4);
    // 第三排：大抽屉
    drawDrawer(4, 34, 24, 3);

    // 抽屉的黄铜拉环 (Brass Ring Pulls)
    const drawPull = (x, y) => {
        drawer.rect(x, y, 1, 1, cGold);         // 替换 setPixel
        drawer.rect(x, y + 1, 1, 1, cGoldDark); // 替换 setPixel
    };
    drawPull(9, 25);   // 左小拉手
    drawPull(22, 25);  // 右小拉手
    
    drawPull(10, 30);  // 中大拉手1
    drawPull(21, 30);  // 中大拉手2
    
    drawPull(10, 35);  // 下大拉手1
    drawPull(21, 35);  // 下大拉手2

    // === 6. 35度视角的顶部平面 (Top Surface: y = 17 to 21) ===
    // 占据 5 像素的高度，完美构建 35 度俯视折角
    drawer.rect(2, 17, 28, 5, cWoodTop);
    // 后边缘阴影 (与背景交界)
    drawer.hLine(2, 17, 28, cWoodDark);
    
    // ✨ 核心灵魂细节：前置高光倒角 (Leading Edge Highlight)
    // 它是区分顶部和正面的最重要光影分界线
    drawer.hLine(2, 21, 28, cWoodHigh);

    // 镜子在桌面投下的阴影
    drawer.hLine(8, 18, 16, cShadow);
    drawer.hLine(9, 19, 14, 'rgba(0,0,0,0.1)');

    // === 7. 桌面摆件 (Top Clutter - Enhances depth) ===
    // 左侧：复古红丝绒珠宝盒
    const boxX = 5;
    const boxY = 17;
    drawer.rect(boxX, boxY + 1, 6, 3, '#a41e22');  // 盒子正面
    drawer.rect(boxX, boxY, 6, 2, '#d22c31');      // 盒子顶部受光 (透视)
    drawer.rect(boxX + 2, boxY + 2, 2, 1, cGold);  // 黄铜锁扣
    drawer.rect(boxX + 6, boxY, 1, 4, cShadowDeep);// 盒子右侧背光

    // 右侧：粉色优雅香水瓶
    const botX = 24;
    const botY = 16;
    drawer.rect(botX, botY + 2, 3, 3, '#e84393');  // 瓶身主体
    drawer.vLine(botX, botY + 2, 3, '#fd79a8');    // 瓶身左侧玻璃高光
    drawer.rect(botX + 1, botY + 1, 1, 1, cGold);  // 瓶颈金边 (替换 setPixel)
    drawer.rect(botX + 1, botY, 1, 1, '#fdfefe');  // 钻石瓶盖 (替换 setPixel)
    
    // 香水瓶的微小地面阴影
    drawer.hLine(botX - 1, botY + 4, 2, cShadow);

    return drawer.getCanvas();
}