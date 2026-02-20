import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createPianoSprite() {
    const w = 64;
    const h = 32;
    const drawer = new PixelDraw(w, h);

    // 🎨 优化后的高级调色板
    const cShadow = '#0d1117';     // 最深阴影 (环境光遮蔽)
    const cBlackDark = '#161b22';  // 钢琴暗部
    const cBlack = '#21262d';      // 钢琴主体色 (乌木黑)
    const cBlackLight = '#30363d'; // 受光面
    const cHighlight = '#8b949e';  // 烤漆高光反光
    
    const cWhite = '#f0f6fc';      // 白键/琴谱
    const cWhiteDim = '#c9d1d9';   // 白键阴影/纸张暗部
    
    const cGold = '#e3b341';       // 黄铜高光 (踏板/轮子)
    const cGoldDark = '#9e7a27';   // 黄铜暗部
    
    const cRed = '#a41e22';        // 丝绒红
    const cRedBright = '#d22c31';  // 丝绒高光
    const cRedDark = '#5c1013';    // 丝绒阴影

    // 1. 背景与下半部分 (Lower Body & Back)
    const lowerY = 22;
    drawer.rect(8, lowerY, 48, 10, cShadow); // 键盘下方的深邃阴影区
    drawer.rect(12, lowerY, 40, 8, cBlackDark); // 下挡板

    // 2. 上半部分琴体 (Upper Panel)
    const upperY = 4;
    drawer.rect(8, upperY, 48, 13, cBlack); 
    // 上挡板的烤漆对角线高光 (抛光质感)
    drawer.line(14, 6, 22, 14, cBlackLight);
    drawer.line(18, 6, 24, 12, cBlackLight);
    drawer.rect(15, 6, 1, 1, cHighlight); // 替换 setPixel 烤漆高光点

    // 3. 顶盖 (Top Lid)
    drawer.rect(6, 2, 52, 3, cBlackDark);
    drawer.hLine(6, 2, 52, cBlackLight); // 顶盖受光面
    drawer.hLine(7, 2, 10, cHighlight);  // 顶盖边缘高光

    // 4. 乐谱架与琴谱 (Music Stand & Sheet Music)
    const standX = 20;
    const standY = 7;
    // 谱架
    drawer.rect(standX, standY, 24, 10, cShadow);
    // 乐谱 (左侧蓝色封面，右侧白色内页)
    drawer.rect(standX + 2, standY + 1, 10, 9, '#1f6feb'); // 蓝色封面
    drawer.vLine(standX + 4, standY + 3, 5, '#58a6ff');    // 封面装饰纹
    drawer.rect(standX + 12, standY + 1, 10, 9, cWhite);   // 白色内页
    drawer.hLine(standX + 13, standY + 3, 6, cWhiteDim);   // 音符线条1
    drawer.hLine(standX + 13, standY + 5, 8, cWhiteDim);   // 音符线条2
    drawer.hLine(standX + 13, standY + 7, 5, cWhiteDim);   // 音符线条3
    drawer.rect(standX + 14, standY + 4, 1, 1, cRedBright); // 替换 setPixel 乐谱红色标记

    // 5. 键盘盖/防尘呢毡 (Fallboard & Felt)
    drawer.rect(6, 15, 52, 3, cBlackLight); // 倾斜的键盘盖
    drawer.hLine(8, 17, 48, cRedBright);    // 琴键底部的红色防尘毡
    drawer.rect(32, 16, 1, 1, cGold);       // 替换 setPixel 键盘盖中央的金色Logo

    // 6. 琴键区域 (Keyboard)
    const keyY = 18;
    const keyW = 48; // 总宽度
    const keyX = 8;
    
    // 铺底白键
    drawer.rect(keyX, keyY, keyW, 4, cWhite);
    drawer.hLine(keyX, keyY + 3, keyW, cWhiteDim); // 白键下边缘立体感

    // 精准绘制黑键与白键缝隙 (2-3-2-3 模式)
    let gapIndex = 0;
    const blackKeyPattern = [1, 1, 0, 1, 1, 1, 0]; // 1:有黑键, 0:无黑键
    for (let x = keyX + 2; x < keyX + keyW; x += 2) {
        // 白键之间的缝隙
        drawer.vLine(x, keyY, 4, cWhiteDim);
        
        // 判断是否需要画黑键
        if (blackKeyPattern[gapIndex % 7] === 1) {
            drawer.vLine(x, keyY, 2, cShadow); // 黑键本体
        }
        gapIndex++;
    }

    // 7. 琴键托板与侧边琴耳 (Keybed & Cheek Blocks)
    drawer.rect(4, 21, 56, 2, cBlackLight); // 承托键盘的底板
    drawer.hLine(4, 22, 56, cShadow);       // 底板下方的阴影
    
    // 左琴耳 (立体切割感)
    drawer.rect(4, 15, 4, 6, cBlackDark);
    drawer.vLine(7, 15, 6, cBlackLight); // 内侧受光
    // 右琴耳
    drawer.rect(56, 15, 4, 6, cBlackDark);
    drawer.vLine(56, 15, 6, cBlackLight);

    // 8. 琴腿与黄铜琴轮 (Front Legs & Casters)
    const legY = 23;
    // 左腿
    drawer.rect(5, legY, 3, 7, cBlackDark);
    drawer.vLine(7, legY, 7, cBlackLight); // 腿部高光
    drawer.rect(5, 30, 3, 2, cGoldDark);   // 左琴轮底座
    drawer.rect(6, 31, 1, 1, cGold);       // 替换 setPixel 左琴轮高光
    // 右腿
    drawer.rect(56, legY, 3, 7, cBlackDark);
    drawer.vLine(56, legY, 7, cBlackLight);
    drawer.rect(56, 30, 3, 2, cGoldDark);  // 右琴轮底座
    drawer.rect(57, 31, 1, 1, cGold);      // 替换 setPixel 右琴轮高光

    // 9. 踏板 (Pedals - 放置在中间偏下)
    const pedX = 29;
    const pedY = 28;
    drawer.rect(pedX - 2, pedY, 10, 4, cShadow);     // 踏板凹槽背景
    drawer.vLine(pedX, pedY + 1, 3, cGold);          // 左踏板 (柔音)
    drawer.vLine(pedX + 3, pedY + 1, 3, cGoldDark);  // 中踏板 (消音)
    drawer.vLine(pedX + 6, pedY + 1, 3, cGold);      // 右踏板 (延音)

    // 10. 前景：红丝绒琴凳 (Piano Bench - Creates Depth)
    // 琴凳刚好跨在踏板前方，腿部空隙漏出踏板
    const benchX = 16;
    const benchY = 25;
    
    // 琴凳深色木腿
    drawer.rect(benchX + 2, benchY + 2, 2, 5, cBlackDark);
    drawer.rect(benchX + 28, benchY + 2, 2, 5, cBlackDark);
    drawer.vLine(benchX + 3, benchY + 2, 5, cBlack);
    
    // 琴凳软垫主体
    drawer.rect(benchX, benchY, 32, 3, cRed);
    // 软垫顶部受光
    drawer.hLine(benchX + 1, benchY, 30, cRedBright);
    // 软垫底部阴影
    drawer.hLine(benchX + 1, benchY + 2, 30, cRedDark);
    
    // 软垫的纽扣拉花细节 (Tufted texture)
    for(let bx = benchX + 4; bx < benchX + 30; bx += 4) {
        drawer.rect(bx, benchY + 1, 1, 1, cRedDark);     // 替换 setPixel 纽扣阴影
        drawer.rect(bx + 1, benchY + 1, 1, 1, cRedBright); // 替换 setPixel 纽扣高光
    }

    return drawer.getCanvas();
}