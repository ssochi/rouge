import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createGrandfatherClockSprite() {
    // 尺寸: 16x48
    const w = 16;
    const h = 48;
    const drawer = new PixelDraw(w, h);

    // 🎨 高级调色板：桃花心木 (Mahogany) 与 黄铜 (Brass)
    const cWoodTop = '#8c5a35';      // 顶部受光面 (体现35度俯视)
    const cWoodFront = '#704424';    // 正面主体色
    const cWoodDark = '#4a2a14';     // 阴影与暗部
    const cWoodHigh = '#aa7648';     // 边缘高光
    
    const cGold = '#f1c40f';         // 黄铜高光
    const cGoldDark = '#b7950b';     // 黄铜重锤/暗部
    const cDial = '#fdf2e9';         // 象牙白表盘
    const cMoonPhase = '#2c3e50';    // 月相盘深蓝
    
    const cShadow = 'rgba(0,0,0,0.3)';
    const cShadowDeep = 'rgba(0,0,0,0.6)';

    // === 1. 地面投影 (Floor Shadow) ===
    drawer.hLine(2, 45, 12, cShadowDeep);
    drawer.hLine(1, 46, 14, cShadow);

    // ==========================================
    // 2. 底部基座 (Base Section: y = 35 to 44)
    // ==========================================
    // 底座的 35 度顶部平面 (体现腰部到底部的台阶阶梯感)
    drawer.rect(1, 35, 14, 3, cWoodTop);
    drawer.hLine(1, 35, 14, cWoodDark); // 靠墙的后边缘
    drawer.hLine(1, 37, 14, cWoodHigh); // 💎 前置高光倒角 (Leading Edge Highlight)
    
    // 底座正面主体
    drawer.rect(1, 38, 14, 7, cWoodFront);
    // 底座木板浮雕细节 (内凹框)
    drawer.rect(3, 39, 10, 5, cWoodDark);
    drawer.rect(4, 40, 8, 3, cWoodFront);
    drawer.hLine(4, 43, 8, cWoodHigh);  // 浮雕下边缘受光
    
    // 底座侧边立体感
    drawer.vLine(1, 38, 7, cWoodHigh);
    drawer.vLine(14, 38, 7, cWoodDark);

    // ==========================================
    // 3. 中间腰部柜体 (Waist/Trunk: y = 16 to 35)
    // ==========================================
    // 腰部比头部和底座窄
    const trunkX = 3;
    const trunkW = 10;
    drawer.rect(trunkX, 16, trunkW, 20, cWoodFront);
    drawer.vLine(trunkX, 16, 20, cWoodHigh);
    drawer.vLine(trunkX + trunkW - 1, 16, 20, cWoodDark);
    
    // 头部在腰部投下的环境光遮蔽阴影
    drawer.hLine(trunkX, 16, trunkW, cShadowDeep);
    drawer.hLine(trunkX, 17, trunkW, cShadow);

    // --- 玻璃门与内部机械结构 (Glass Door & Mechanism) ---
    const glassX = 5;
    const glassY = 18;
    const glassW = 6;
    const glassH = 15;
    // 深邃的内部暗腔
    drawer.rect(glassX, glassY, glassW, glassH, '#1a110a');
    
    // 左右两根黄铜重锤 (Weights)
    drawer.vLine(glassX + 1, glassY + 2, 7, cGoldDark);
    drawer.rect(glassX + 1, glassY + 6, 1, 3, cGold); // 重锤底部高光
    
    drawer.vLine(glassX + 4, glassY + 2, 7, cGoldDark);
    drawer.rect(glassX + 4, glassY + 6, 1, 3, cGold); 

    // 中央大钟摆 (Pendulum Bob)
    drawer.vLine(7, glassY, 11, cGoldDark); // 钟摆杆
    drawer.rect(6, glassY + 9, 3, 3, cGoldDark); // 钟摆圆盘底色
    drawer.rect(6, glassY + 10, 2, 2, cGold);    // 圆盘受光面
    drawer.rect(6, glassY + 10, 1, 1, '#ffffff'); // 替换 setPixel: 钟摆锐利反光

    // 玻璃门反光 (Glass Glare - 斜向半透明白线)
    drawer.line(glassX, glassY + 10, glassX + 3, glassY + 7, 'rgba(255,255,255,0.25)');
    drawer.line(glassX, glassY + 13, glassX + 5, glassY + 8, 'rgba(255,255,255,0.15)');

    // ==========================================
    // 4. 头部与表盘 (Head & Clock Face: y = 2 to 16)
    // ==========================================
    // 头部的 35 度顶部平面 (Cornice Top Surface)
    drawer.rect(1, 2, 14, 4, cWoodTop);
    drawer.hLine(1, 2, 14, cWoodDark);
    drawer.hLine(1, 5, 14, cWoodHigh); // 💎 前置高光倒角

    // 顶部的木质小尖塔装饰 (Finial)
    drawer.rect(7, 0, 2, 2, cWoodFront);
    drawer.rect(8, 0, 1, 2, cWoodHigh);
    drawer.rect(7, 1, 2, 1, cWoodDark);

    // 头部正面主体
    drawer.rect(1, 6, 14, 10, cWoodFront);
    drawer.vLine(1, 6, 10, cWoodHigh);
    drawer.vLine(14, 6, 10, cWoodDark);

    // --- 精美的表盘 (Clock Face) ---
    // 黄铜表圈 (Brass Bezel)
    drawer.rect(3, 7, 10, 8, cGoldDark);
    drawer.rect(4, 8, 8, 6, cGold);
    
    // 象牙白复古表盘
    drawer.rect(5, 9, 6, 4, cDial);
    drawer.hLine(6, 8, 4, cDial);
    drawer.hLine(6, 13, 4, cDial);

    // 顶部的月相盘 (Moon Phase - 深蓝半圆)
    drawer.hLine(6, 8, 4, cMoonPhase);
    drawer.hLine(7, 9, 2, cMoonPhase);
    drawer.rect(7, 8, 1, 1, cGold); // 替换 setPixel: 金色小月亮

    // 表盘指针与刻度 (Hands & Numerals)
    // 12点、3点、6点、9点的小刻度
    drawer.rect(7, 9, 2, 1, cWoodDark); 
    drawer.rect(5, 10, 1, 2, cWoodDark);
    drawer.rect(10, 10, 1, 2, cWoodDark);
    drawer.rect(7, 12, 2, 1, cWoodDark);
    
    // 指针 (时间约 10:10)
    drawer.rect(6, 10, 2, 1, '#111111'); // 时针
    drawer.rect(8, 9, 1, 2, '#111111');  // 分针
    drawer.rect(7, 10, 1, 1, cGoldDark); // 替换 setPixel: 中央黄铜轴钉

    // 全局右侧阴影，统一整体立体感
    drawer.rect(14, 6, 1, 38, 'rgba(0,0,0,0.15)');

    return drawer.getCanvas();
}