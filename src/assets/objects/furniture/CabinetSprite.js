import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createCabinetSprite() {
    // 尺寸: 48x24 (2x1 tile)
    const w = 48;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    // 🎨 高级调色板：胡桃木 (Walnut) 与 中世纪现代软装
    const cWoodTop = '#8c5a35';      // 顶部受光面 (体现35度俯视)
    const cWoodFront = '#704424';    // 正面主体色 (略暗)
    const cWoodDark = '#4a2a14';     // 阴影与暗部
    const cWoodHigh = '#aa7648';     // 边缘高光
    
    const cGold = '#f1c40f';         // 黄铜高光
    const cGoldDark = '#b7950b';     // 黄铜暗部
    
    const cShadow = 'rgba(0, 0, 0, 0.25)';
    const cShadowDeep = 'rgba(0, 0, 0, 0.45)';

    // === 1. 地面投影 (Ground Shadow) ===
    // 定位柜子在地面的锚点，增强重量感
    drawer.hLine(4, 22, 40, cShadowDeep);
    drawer.hLine(3, 23, 42, cShadow);

    // === 2. 黄铜木腿 (Front Legs) ===
    // 左腿
    drawer.rect(5, 20, 2, 2, cWoodDark);
    drawer.rect(5, 22, 2, 1, cGold);       // 黄铜脚垫
    drawer.rect(6, 22, 1, 1, cGoldDark);   // 脚垫暗部
    // 右腿
    drawer.rect(41, 20, 2, 2, cWoodDark);
    drawer.rect(41, 22, 2, 1, cGold);
    drawer.rect(42, 22, 1, 1, cGoldDark);

    // === 3. 柜子正面主体 (Front Face: y = 12 to 20) ===
    const fY = 12;
    const fH = 8;
    drawer.rect(2, fY, 44, fH, cWoodFront);
    drawer.hLine(2, fY + fH, 44, cWoodDark); // 底部收边阴影
    
    // 侧边厚度与阴影
    drawer.vLine(2, fY, fH, cWoodHigh);  // 左侧受光
    drawer.vLine(45, fY, fH, cWoodDark); // 右侧背光

    // === 4. 双开门与内凹细节 (Cabinet Doors) ===
    const dY = 13;
    const dH = 6;
    const dW = 19;
    // 左门
    drawer.rect(4, dY, dW, dH, cWoodDark); // 内凹暗面
    drawer.rect(5, dY + 1, dW - 2, dH - 2, cWoodFront); // 门板
    drawer.hLine(5, dY + dH - 1, dW - 2, cWoodHigh); // 门板底高光
    drawer.vLine(4 + dW - 2, dY + 1, dH - 2, cWoodHigh); // 门板右高光
    
    // 右门
    const rdX = 25;
    drawer.rect(rdX, dY, dW, dH, cWoodDark);
    drawer.rect(rdX + 1, dY + 1, dW - 2, dH - 2, cWoodFront);
    drawer.hLine(rdX + 1, dY + dH - 1, dW - 2, cWoodHigh);
    drawer.vLine(rdX + dW - 2, dY + 1, dH - 2, cWoodHigh);

    // 柜门中缝与把手
    drawer.vLine(24, fY, fH, cWoodDark); // 中缝深色
    // 左把手
    drawer.rect(20, 15, 1, 2, cGold);
    drawer.rect(21, 15, 1, 2, cShadowDeep);
    // 右把手
    drawer.rect(27, 15, 1, 2, cGold);
    drawer.rect(28, 15, 1, 2, cShadowDeep);

    // === 5. 35度视角的顶部平面 (Top Surface: y = 8 to 11) ===
    // 这是体现俯视角的关键，顶部平面需要占据 4 像素高度
    drawer.rect(2, 8, 44, 4, cWoodTop);
    drawer.hLine(2, 8, 44, cWoodDark); // 顶部后边缘 (远端深色)
    
    // 钻石级细节：前置高光倒角 (Leading Edge Highlight)
    // 它是区分顶部和正面的最重要光影分界线
    drawer.hLine(2, 11, 44, cWoodHigh);
    drawer.rect(2, 11, 1, 1, cWoodTop); // 圆角过渡
    drawer.rect(45, 11, 1, 1, cWoodTop);

    // 顶部右侧环境暗角
    drawer.rect(44, 9, 2, 2, cShadow);

    // === 6. 顶部摆件 - 左侧：蘑菇台灯 (Mushroom Lamp) ===
    const lampX = 6;
    // 底座
    drawer.rect(lampX + 2, 8, 2, 2, cGoldDark);
    drawer.rect(lampX + 2, 8, 1, 2, cGold);
    // 散发暖光的灯罩
    drawer.rect(lampX, 6, 6, 2, '#fdfefe'); // 白玻璃
    drawer.rect(lampX + 1, 5, 4, 1, '#fdfefe');
    drawer.rect(lampX + 2, 4, 2, 1, '#fdfefe');
    drawer.rect(lampX + 2, 6, 2, 1, '#f1c40f'); // 灯泡暖光内透

    // === 7. 顶部摆件 - 右侧：复古精装书 (Stacked Books) ===
    const bkX = 35;
    // 底层红书
    drawer.rect(bkX - 1, 9, 8, 2, '#c0392b');
    drawer.hLine(bkX, 9, 6, '#fdf2e9'); // 书页顶边 (体现35度俯视)
    // 中层绿书
    drawer.rect(bkX, 7, 6, 2, '#27ae60');
    drawer.hLine(bkX + 1, 7, 4, '#fdf2e9');
    // 顶层蓝书
    drawer.rect(bkX, 5, 5, 2, '#2980b9');
    drawer.hLine(bkX + 1, 5, 3, '#fdf2e9');
    // 书本投下的微小阴影
    drawer.hLine(bkX - 2, 11, 10, cShadow);

    // === 8. 顶部摆件 - 中间：垂坠绿植 (Trailing Pothos) ===
    // 植物跨越了顶部和正面，打破了僵硬的直线，极大提升了立体纵深感
    const plX = 22;
    // 赤陶花盆
    drawer.rect(plX, 6, 5, 4, '#d35400');
    drawer.hLine(plX - 1, 6, 7, '#a04000'); // 盆沿
    drawer.rect(plX, 10, 5, 1, cShadowDeep); // 花盆在地面的压暗
    
    // 顶部茂密的叶子集群
    const leafColors = ['#2ecc71', '#27ae60', '#1e8449'];
    for(let i=0; i<12; i++) {
        drawer.rect(plX - 2 + (i%7), 4 + (i%4), 1, 1, leafColors[i%3]);
        drawer.rect(plX + 1 + (i%4), 3 + (i%3), 1, 1, leafColors[(i+1)%3]);
    }
    
    // 垂坠下来的藤蔓 (Trailing down the front face)
    // 左侧藤蔓
    drawer.rect(plX - 1, 9, 1, 2, '#27ae60');
    drawer.rect(plX - 2, 11, 1, 2, '#1e8449');
    drawer.rect(plX - 1, 13, 1, 2, '#2ecc71'); // 悬垂到柜门前
    drawer.rect(plX - 2, 15, 1, 1, '#1e8449');
    // 右侧藤蔓
    drawer.rect(plX + 4, 10, 1, 2, '#27ae60');
    drawer.rect(plX + 5, 12, 1, 3, '#1e8449'); // 悬垂到柜门前
    drawer.rect(plX + 6, 14, 1, 1, '#2ecc71');
    // 中间短藤蔓
    drawer.rect(plX + 2, 11, 1, 3, '#27ae60');

    // 藤蔓在柜子正面投下的极细微阴影
    drawer.rect(plX, 14, 1, 2, cShadow);
    drawer.rect(plX + 6, 15, 1, 2, cShadow);

    return drawer.getCanvas();
}