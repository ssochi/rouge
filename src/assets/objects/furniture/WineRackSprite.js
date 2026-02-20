import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createWineRackSprite() {
    // 尺寸: 32x48
    const w = 32;
    const h = 48;
    const drawer = new PixelDraw(w, h);

    // 🎨 高级调色板：胡桃木与酒类玻璃
    const cWoodTop = '#8c5a35';      // 顶部受光面 (体现35度俯视)
    const cWoodFront = '#704424';    // 正面主体色
    const cWoodDark = '#4a2a14';     // 阴影与暗部
    const cWoodHigh = '#aa7648';     // 边缘高光
    
    const cShadow = 'rgba(0, 0, 0, 0.3)';
    const cShadowDeep = 'rgba(0, 0, 0, 0.6)';

    // === 1. 地面投影 (Floor Shadow) ===
    drawer.hLine(4, 44, 24, cShadowDeep);
    drawer.hLine(3, 45, 26, cShadow);

    // === 2. 柜体外框与 35 度顶部平面 (Frame & Top Surface) ===
    // 顶部平面 (Top Surface: y = 6 to 11) 表现 35 度俯视
    drawer.rect(2, 6, 28, 6, cWoodTop);
    drawer.hLine(2, 6, 28, cWoodDark); // 顶部后边缘
    
    // 钻石级细节：前置高光倒角 (Leading Edge Highlight)
    drawer.hLine(2, 11, 28, cWoodHigh);

    // 柜体侧壁 (Side Walls)
    drawer.rect(2, 12, 2, 28, cWoodDark);  // 左侧壁
    drawer.vLine(2, 12, 28, cWoodHigh);    // 左侧受光高光
    drawer.rect(28, 12, 2, 28, cWoodDark); // 右侧壁
    
    // 底部基座 (Base)
    drawer.rect(2, 40, 28, 4, cWoodFront);
    drawer.hLine(2, 40, 28, cWoodHigh);    // 基座顶边高光
    drawer.hLine(2, 43, 28, cWoodDark);    // 基座触地阴影

    // === 3. 柜体内部背景 (Inner Dark Background) ===
    drawer.rect(4, 12, 24, 28, '#1a0f0a');
    
    // === 4. X 型酒架分隔板 (X-Pattern Dividers) ===
    const drawXGrid = (yStart, yEnd) => {
        // 顶部的极深内阴影
        drawer.hLine(4, yStart, 24, cShadowDeep);
        
        // 绘制交叉的木板 (利用线条呈现 2.5D 立体感)
        // \ 方向对角线
        drawer.line(4, yStart, 27, yEnd, cWoodFront);
        drawer.line(4, yStart + 1, 27, yEnd + 1, cWoodDark);
        // / 方向对角线
        drawer.line(27, yStart, 4, yEnd, cWoodFront);
        drawer.line(27, yStart + 1, 4, yEnd + 1, cWoodDark);
    };

    // 上层隔间 (y: 12 到 25)
    drawXGrid(12, 24);
    // 中间的分隔横板
    drawer.hLine(4, 25, 24, cWoodFront);
    drawer.hLine(4, 26, 24, cWoodDark);
    // 下层隔间 (y: 27 到 40)
    drawXGrid(27, 39);

    // === 5. 水平放置的酒瓶 (Horizontal Wine Bottles) ===
    // 表现 2.5D 景深：瓶身在后(高)，瓶颈和瓶帽在前(低)
    const drawBottle = (bx, by, cBody, cFoil) => {
        drawer.rect(bx, by + 4, 4, 1, cShadow); // 瓶子投下的阴影
        
        // 瓶身本体 (Body - 后方)
        drawer.rect(bx, by, 4, 3, cBody);
        drawer.hLine(bx + 1, by, 2, 'rgba(255,255,255,0.15)'); // 玻璃圆弧反光
        
        // 瓶肩 (Shoulder - 过渡)
        drawer.rect(bx + 1, by + 3, 2, 1, cBody);
        
        // 瓶颈与金属箔帽 (Neck & Foil - 最前方)
        drawer.rect(bx + 1, by + 4, 2, 2, cFoil);
        // 箔帽正面的高光闪点
        drawer.rect(bx + 1, by + 5, 1, 1, 'rgba(255,255,255,0.6)'); // 替换 setPixel
    };

    // 酒的配色 [瓶身色, 箔帽色]
    const cBordeaux = ['#3b1c20', '#a41e22'];  // 波尔多红
    const cChardonnay = ['#1e4d2b', '#f1c40f']; // 霞多丽白 (绿瓶金帽)
    const cChampagne = ['#4a5d23', '#d4af37'];  // 香槟 (橄榄绿瓶)
    const cRiesling = ['#1a4862', '#bdc3c7'];   // 雷司令 (蓝瓶银帽)
    const cPinot = ['#2c3e50', '#111111'];      // 黑皮诺 (深灰瓶黑帽)

    // 上层隔间填充
    drawBottle(14, 13, ...cBordeaux);    // 上
    drawBottle(10, 20, ...cChardonnay);  // 下左
    drawBottle(18, 20, ...cPinot);       // 下右
    drawBottle(6, 17, ...cRiesling);     // 左
    drawBottle(22, 17, ...cChampagne);   // 右

    // 下层隔间填充
    drawBottle(15, 28, ...cChardonnay);  // 上
    drawBottle(11, 35, ...cChampagne);   // 下左
    drawBottle(17, 35, ...cBordeaux);    // 下右
    drawBottle(6, 32, ...cBordeaux);     // 左
    drawBottle(22, 32, ...cRiesling);    // 右


    // === 6. 顶部摆件：醒酒器与高脚杯 (Decanter & Wine Glasses) ===
    
    // --- 绘制半透明高脚杯的辅助函数 ---
    const drawGlass = (gx, gy) => {
        // 玻璃杯肚 (半透明白)
        drawer.rect(gx, gy, 4, 3, 'rgba(212,238,247,0.35)');
        drawer.rect(gx + 1, gy + 3, 2, 1, 'rgba(212,238,247,0.35)');
        // 杯中的红酒
        drawer.rect(gx + 1, gy + 1, 2, 2, '#a41e22');
        // 纤细的杯柄与底座
        drawer.rect(gx + 1, gy + 4, 1, 2, 'rgba(255,255,255,0.5)'); // 柄
        drawer.hLine(gx, gy + 6, 3, 'rgba(255,255,255,0.4)');       // 底座
        // 玻璃杯的锐利高光
        drawer.rect(gx, gy + 1, 1, 1, '#ffffff'); // 替换 setPixel
    };

    // 放置两只高脚杯
    drawGlass(6, 4);
    drawGlass(11, 5);

    // --- 绘制红酒醒酒器 (Decanter) ---
    const dx = 20;
    const dy = 2;
    // 醒酒器的投影
    drawer.hLine(dx + 1, dy + 8, 4, cShadow);
    // 玻璃瓶身 (宽大圆润)
    drawer.rect(dx, dy + 4, 6, 4, 'rgba(212,238,247,0.3)');
    drawer.rect(dx + 1, dy + 8, 4, 1, 'rgba(212,238,247,0.3)');
    // 内部的红酒 (底层深，上层透)
    drawer.rect(dx + 1, dy + 5, 4, 3, '#a41e22');
    drawer.hLine(dx + 2, dy + 8, 2, '#7b1619');
    // 细长的玻璃瓶颈
    drawer.rect(dx + 2, dy, 2, 4, 'rgba(212,238,247,0.4)');
    // 水晶瓶塞
    drawer.rect(dx + 2, dy - 1, 2, 1, '#ffffff');
    // 醒酒器侧边玻璃高光反光
    drawer.vLine(dx + 1, dy + 5, 2, '#ffffff');

    // 全局右侧边角环境阴影，统一整体立体感
    drawer.rect(28, 12, 2, 28, 'rgba(0,0,0,0.15)');

    return drawer.getCanvas();
}