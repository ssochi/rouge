import { PixelDraw } from '../../utils/PixelDraw.js';

// ==========================================
// 1. 垂直方向的床 (竖向, 床头在上, 床尾在下)
// Canvas: 32x48
// ==========================================
export function createBedSprite() {
    const drawer = new PixelDraw(32, 48);

    // 🎨 巅峰级室内软装调色板
    const cWoodTop = '#8c5a35';      // 木板顶部受光 (体现35度视角)
    const cWood = '#704424';         // 胡桃木主色
    const cWoodDark = '#4a2a14';     // 木头阴影
    const cWoodHigh = '#aa7648';     // 木头高光

    // 地毯已被移除
    
    const cBlanket = '#2471a3';      // 皇家蓝主被子
    const cBlanketHigh = '#5dade2';  // 被子高光
    const cBlanketDark = '#1a5276';  // 被子暗部/褶皱
    
    const cThrow = '#b03a2e';        // 铁锈红搭毯 (冷暖撞色)
    const cThrowDark = '#7b241c';    // 搭毯阴影
    const cThrowHigh = '#e74c3c';    // 搭毯高光

    const cPillow = '#fdfefe';       // 纯白枕头
    const cPillowDark = '#d5dbdb';   // 枕头暗部
    // const cAccent = '#f1c40f';    // 芥末黄腰枕 (已移除)

    const cShadow = 'rgba(0,0,0,0.15)';
    const cShadowDeep = 'rgba(0,0,0,0.35)';

    const cx = 16;
    const bedW = 22; // 缩小一点床宽，露出地毯
    const L = cx - bedW / 2;  // 5
    const R = cx + bedW / 2;  // 27

    // --- 0. 底部投影 (无地毯) ---
    // 床在地板上的总投影
    drawer.rect(L, 12, bedW + 2, 34, cShadowDeep);

    // --- 1. 豪华床头板 (Luxury Headboard) ---
    const hY = 2;
    // 左右两根高耸的实木床柱 (Bedposts)
    drawer.rect(L, hY, 3, 12, cWood);
    drawer.rect(L + 1, hY - 1, 1, 1, cWoodTop); // 左圆柱顶端
    drawer.rect(R - 3, hY, 3, 12, cWood);
    drawer.rect(R - 2, hY - 1, 1, 1, cWoodTop); // 右圆柱顶端
    
    // 床头板主背板与内凹镶板 (Panels)
    drawer.rect(L + 3, hY + 3, bedW - 6, 9, cWood);
    drawer.rect(L + 4, hY + 4, bedW - 8, 7, cWoodDark); // 内凹边框
    drawer.rect(L + 5, hY + 5, bedW - 10, 5, cWood);    // 内凹浮雕
    // 背板顶部的高光倒角 (35度视觉核心)
    drawer.hLine(L + 3, hY + 3, bedW - 6, cWoodTop);
    drawer.hLine(L + 3, hY + 4, bedW - 6, cWoodHigh);

    // --- 2. 床垫与枕头组 (Mattress & Pillows) ---
    const mY = 12;
    // 调整颜色：床单改为浅灰色，增加对比度
    drawer.rect(L + 2, mY, bedW - 4, 10, '#d5dbdb'); // 床单 (原 #f0f4f8)
    drawer.vLine(L + 2, mY, 10, '#cfd8dc'); // 床垫左侧厚度

    const drawPillow = (px, py) => {
        drawer.rect(px, py + 1, 8, 5, cShadow); // 枕头投影
        drawer.rect(px, py, 8, 5, cPillow);
        drawer.rect(px, py, 1, 1, '#f0f4f8'); // 软化圆角
        drawer.rect(px + 7, py, 1, 1, '#f0f4f8'); 
        drawer.rect(px, py + 4, 1, 1, cPillowDark);
        drawer.rect(px + 7, py + 4, 1, 1, cPillowDark);
        drawer.hLine(px + 1, py + 4, 6, cPillowDark); // 底部厚度
        drawer.hLine(px + 1, py + 2, 6, '#f8f9f9');   // 中间凹陷折痕
    };
    drawPillow(L + 3, mY + 1); // 左枕
    drawPillow(cx + 1, mY + 1); // 右枕

    // (芥末黄腰枕已移除)

    // --- 3. 皇家蓝绗缝被 (Quilted Blanket) ---
    const bY = 21;
    const bH = 17;
    // 白色翻折内衬 - 调整为浅灰白以区分
    drawer.rect(L + 1, bY, bedW - 2, 3, '#ecf0f1'); // 原 #f0f4f8
    drawer.hLine(L + 1, bY + 2, bedW - 2, '#cfd8dc');
    drawer.hLine(L + 1, bY + 3, bedW - 2, cShadow);

    // 被子主体
    drawer.rect(L, bY + 3, bedW, bH, cBlanket);
    
    // ✨ 精美的菱形绗缝纹理 (Diamond Quilted Grid)
    for (let i = 0; i < 6; i++) {
        drawer.line(L + 2, bY + 5 + i * 3, R - 2, bY + 11 + i * 3, 'rgba(255,255,255,0.15)');
        drawer.line(L + 2, bY + 11 + i * 3, R - 2, bY + 5 + i * 3, 'rgba(255,255,255,0.15)');
    }

    // 被子两侧的立体下垂
    drawer.vLine(L, bY + 3, bH, cBlanketDark);
    drawer.vLine(L + 1, bY + 3, bH, cBlanketHigh);
    drawer.vLine(R - 1, bY + 3, bH, cBlanketDark);
    drawer.vLine(R - 2, bY + 3, bH, cShadowDeep);

    // --- 4. 铁锈红搭毯 (Chunky Knit Throw) ---
    const tY = 31;
    drawer.rect(L - 1, tY, bedW + 2, 6, cThrow);
    drawer.hLine(L - 1, tY, bedW + 2, cThrowHigh); // 搭毯高光边
    drawer.hLine(L, tY + 5, bedW, cThrowDark);     // 搭毯底部厚度
    
    // 搭毯垂在两侧的自然褶皱
    drawer.rect(L - 1, tY + 6, 2, 2, cThrowDark);
    drawer.rect(R - 1, tY + 6, 2, 3, cThrowDark);
    drawer.rect(R - 2, tY + 6, 1, 1, cThrowHigh);
    // 粗线针织的纵向纹理
    drawer.vLine(cx - 6, tY + 1, 4, cThrowDark);
    drawer.vLine(cx - 2, tY + 1, 5, cThrowDark);
    drawer.vLine(cx + 4, tY + 1, 5, cThrowDark);
    drawer.vLine(cx + 8, tY + 1, 4, cThrowDark);

    // --- 5. 熟睡的猫咪 (Sleeping Cat) ---
    // 蜷缩在床中心偏左侧
    const catX = 10;
    const catY = 24;
    drawer.rect(catX - 1, catY + 1, 8, 5, cShadow); // 猫的柔软投影
    drawer.rect(catX, catY, 6, 4, '#ffffff'); // 白猫蜷缩的身体
    drawer.rect(catX + 1, catY - 1, 1, 1, '#ffffff'); // 左耳
    drawer.rect(catX + 4, catY - 1, 1, 1, '#ffffff'); // 右耳
    drawer.rect(catX + 3, catY + 1, 3, 2, '#f5b041'); // 背上的橘色大斑块
    drawer.rect(catX + 4, catY + 2, 1, 1, '#e67e22'); // 橘毛暗部
    drawer.hLine(catX + 1, catY + 3, 4, '#d5dbdb');   // 猫咪底部的体积阴影

    // --- 6. 床尾板与床脚 (Footboard) ---
    const fY = 40;
    // 床尾板正面
    drawer.rect(L + 1, fY + 2, bedW - 2, 4, cWood);
    // 顶部平面与高光倒角 (35度视觉核心)
    drawer.rect(L + 1, fY, bedW - 2, 2, cWoodTop);
    drawer.hLine(L + 1, fY + 2, bedW - 2, cWoodHigh);
    // 下方阴影
    drawer.hLine(L + 1, fY + 5, bedW - 2, cWoodDark);

    // 床头/床尾粗脚
    drawer.rect(L + 1, fY + 6, 2, 2, cWoodDark);
    drawer.rect(R - 3, fY + 6, 2, 2, cWoodDark);

    // 给整个床的右侧叠加统一的环境暗角，增强纵深感
    drawer.rect(R, 12, 1, 30, cShadow);

    return drawer.getCanvas();
}


// ==========================================
// 2. 水平方向的床 (横向, 床头在左, 床尾在右)
// Canvas: 48x32
// ==========================================
export function createBedHorizontalSprite() {
    const drawer = new PixelDraw(48, 32);

    // 🎨 复用高级调色板
    const cWoodTop = '#8c5a35', cWood = '#704424', cWoodDark = '#4a2a14', cWoodHigh = '#aa7648';
    // const cRug = '#e5e8e8', cRugDark = '#ccd1d1'; // 地毯已移除
    const cBlanket = '#2471a3', cBlanketHigh = '#5dade2', cBlanketDark = '#1a5276';
    const cThrow = '#b03a2e', cThrowDark = '#7b241c', cThrowHigh = '#e74c3c';
    const cPillow = '#ffffff', cPillowDark = '#e2e8f0'; // cAccent 移除
    const cShadow = 'rgba(0,0,0,0.15)', cShadowDeep = 'rgba(0,0,0,0.4)';

    const topY = 6;
    const botY = 21; // 床垫表面的底边
    const frontH = 5; // 正面厚度增强，突出立体感
    
    const hX = 2; // 床头板
    const fX = 42; // 床尾板
    const mX = hX + 4; // 床垫起点
    const mW = fX - mX; // 床宽

    // --- 0. 底部投影 (无地毯) ---
    // 床在地板上的总投影
    drawer.rect(hX + 2, botY + 2, fX - hX + 1, frontH + 2, cShadowDeep);
    drawer.rect(hX + 4, botY + frontH + 2, fX - hX - 1, 2, cShadow);

    // --- 1. 左侧豪华床头板 ---
    // 床柱
    drawer.rect(hX, topY - 4, 3, botY - topY + frontH + 4, cWood);
    drawer.rect(hX, topY - 5, 2, 1, cWoodTop); // 柱顶
    // 正面与顶面
    drawer.rect(hX, topY - 2, 4, botY - topY + frontH + 2, cWood);
    drawer.rect(hX, topY - 4, 4, 2, cWoodTop);
    drawer.hLine(hX, topY - 2, 4, cWoodHigh); // 顶面倒角
    drawer.vLine(hX + 3, topY - 2, botY - topY + frontH, cWoodDark); // 靠床侧深阴影

    // --- 2. 床垫与被子主体 (Mattress & Blanket) ---
    // 床垫亮部 - 调整为浅灰 #d5dbdb
    drawer.rect(mX, topY, mW, botY - topY, '#d5dbdb');
    // 床垫下方的木质床架正面厚度 (Front Face - 2.5D 核心)
    drawer.rect(mX, botY + 1, mW, 2, cWood);
    drawer.hLine(mX, botY + 1, mW, cWoodHigh);
    drawer.hLine(mX, botY + 2, mW, cWoodDark);
    
    // 皇家蓝被子
    const bX = mX + 12;
    const bW = fX - bX;
    drawer.rect(bX, topY, bW, botY - topY, cBlanket);
    
    // 翻折的被角 - 调整为浅灰白 #ecf0f1
    drawer.rect(bX, topY, 4, botY - topY, '#ecf0f1');
    drawer.vLine(bX + 3, topY, botY - topY, '#cfd8dc');
    drawer.vLine(bX + 4, topY, botY - topY, cShadow);
    
    // ✨ 菱形绗缝纹理 (水平被子上的网格)
    for (let i = 0; i < 4; i++) {
        drawer.line(bX + 4 + i * 4, topY + 2, bX + 10 + i * 4, botY - 2, 'rgba(255,255,255,0.15)');
        drawer.line(bX + 10 + i * 4, topY + 2, bX + 4 + i * 4, botY - 2, 'rgba(255,255,255,0.15)');
    }

    // ⭐ 被子自然垂坠的正面厚度 (Draping Front Face)
    drawer.rect(bX, botY, bW, frontH, cBlanketDark);
    drawer.hLine(bX, botY, bW, cBlanket); // 顶部折角
    drawer.hLine(bX, botY + 1, bW, cBlanketHigh); // 转折高光
    // 垂坠下摆的不规则褶皱
    drawer.rect(bX + 2, botY + frontH, 3, 1, cBlanketDark);
    drawer.rect(bX + 8, botY + frontH, 4, 1, cBlanketDark);
    drawer.vLine(bX + 6, botY + 2, 3, cBlanket); // 垂坠高光凸起

    // --- 3. 铁锈红搭毯 (Throw Blanket) ---
    const tX = fX - 8;
    // 表面平铺
    drawer.rect(tX, topY, 6, botY - topY, cThrow);
    drawer.vLine(tX, topY, botY - topY, cThrowHigh);
    drawer.vLine(tX + 5, topY, botY - topY, cThrowDark);
    // 搭毯下垂到床边的厚度 (遮挡被子)
    drawer.rect(tX, botY, 6, frontH + 2, cThrowDark);
    drawer.hLine(tX, botY, 6, cThrowHigh); // 搭毯边缘高光
    drawer.rect(tX + 1, botY + frontH + 2, 2, 1, cThrowDark); // 搭毯最底端的下垂尖角
    drawer.vLine(tX + 2, botY + 1, frontH, cThrow); // 纵向褶皱高光

    // --- 4. 枕头与熟睡的猫咪 ---
    // 双枕头
    const drawHPillow = (py) => {
        drawer.rect(mX + 1, py + 1, 6, 5, cShadow);
        drawer.rect(mX, py, 6, 5, cPillow);
        drawer.hLine(mX, py + 4, 6, cPillowDark);
        drawer.vLine(mX + 5, py + 1, 3, cPillowDark);
    };
    drawHPillow(topY + 1);
    drawHPillow(topY + 7);
    
    // (腰枕已移除)

    // 睡在床尾横向的猫
    const catX = bX + 6;
    const catY = topY + 8;
    drawer.rect(catX, catY + 1, 7, 4, cShadowDeep);
    drawer.rect(catX + 1, catY, 6, 4, '#ffffff'); // 身体
    drawer.rect(catX + 1, catY - 1, 1, 1, '#ffffff'); // 耳朵
    drawer.rect(catX + 3, catY - 1, 1, 1, '#ffffff');
    drawer.rect(catX + 4, catY + 1, 2, 2, '#f5b041'); // 橘色斑
    drawer.hLine(catX + 2, catY + 3, 4, '#d5dbdb');   // 肚子阴影

    // --- 5. 右侧床尾板与床脚 ---
    // 床尾柱
    drawer.rect(fX, topY - 2, 3, botY - topY + frontH + 2, cWood);
    drawer.rect(fX, topY - 3, 2, 1, cWoodTop);
    drawer.hLine(fX, topY - 2, 3, cWoodHigh); // 顶角高光
    // 右侧边背光阴影
    drawer.vLine(fX + 2, topY - 2, botY - topY + frontH + 2, cWoodDark);
    
    // 粗壮的床脚底座
    drawer.rect(mX + 2, botY + 3, 3, 3, cWoodDark);
    drawer.rect(fX, botY + frontH, 3, 3, cWoodDark);

    // --- 6. 氛围细节：踢落的毛绒拖鞋 (Fuzzy Slippers) ---
    // 放在床边地毯上 (x:24, y:28)
    const slX = 22;
    const slY = botY + 5;
    drawer.rect(slX, slY, 3, 2, '#e67e22'); // 左拖鞋
    drawer.rect(slX + 1, slY, 1, 1, '#d35400'); // 拖鞋洞口
    drawer.rect(slX + 5, slY + 1, 3, 2, '#e67e22'); // 右拖鞋 (稍稍错开)
    drawer.rect(slX + 6, slY + 1, 1, 1, '#d35400');
    // 拖鞋阴影
    drawer.hLine(slX - 1, slY + 2, 4, cShadowDeep);
    drawer.hLine(slX + 4, slY + 3, 4, cShadowDeep);

    return drawer.getCanvas();
}
