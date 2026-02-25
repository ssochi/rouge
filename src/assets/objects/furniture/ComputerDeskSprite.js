import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createComputerDeskSprite() {
    const w = 40;
    const h = 40;
    const drawer = new PixelDraw(w, h);

    const {
        cWood, cWoodDark, cWoodLight,
        cWoodHighlight, cWoodGrain,
        cShadow, cShadowDeep
    } = FurniturePalette;

    // ==============================
    // 1. 桌子暗面及桌下结构 (透视纵深区域)
    // ==============================
    // 底部大面积背板及暗区
    drawer.rect(5, 29, 30, 11, cWoodDark);
    drawer.rect(5, 29, 30, 4, cShadowDeep); // 桌下深色渐层阴影

    // 左侧储物抽屉柜 x: 6~16, y: 30~38
    const drawDrawer = (dx, dy, dw, dh) => {
        drawer.rect(dx, dy, dw, dh, cWood);
        drawer.hLine(dx, dy, dw, cWoodLight);      // 抽屉顶受光
        drawer.hLine(dx, dy + dh - 1, dw, cShadow); // 抽屉底暗面
        drawer.vLine(dx + dw - 1, dy + 1, dh - 2, cShadow); // 右边缘转折
        // 金属把手
        const hx = dx + Math.floor(dw / 2) - 2;
        const hy = dy + Math.floor(dh / 2);
        drawer.hLine(hx, hy, 4, '#999999');
        drawer.hLine(hx, hy + 1, 4, '#555555');
    };
    drawDrawer(6, 30, 11, 4); // 上抽屉
    drawDrawer(6, 35, 11, 4); // 下抽屉
    drawer.vLine(17, 30, 9, cShadowDeep); // 抽屉旁边的立体侧影

    // 右侧底置高性能主机箱
    const pcX = 25;
    const pcY = 30;
    drawer.rect(pcX, pcY, 8, 9, '#1a1a1c'); // 底色
    drawer.hLine(pcX, pcY, 8, '#3d3d40');   // 顶边受光
    drawer.vLine(pcX, pcY, 9, '#303033');   // 左侧面受光
    drawer.hLine(pcX, pcY + 8, 8, '#0a0a0c'); // 底部暗场

    // 机箱侧透玻璃和内部RGB
    drawer.rect(26, 32, 6, 6, '#0f0f12');
    drawer.hLine(27, 34, 4, '#58a6ff'); // 显卡蓝灯
    drawer.hLine(27, 33, 2, '#bf40ff'); // 内存紫灯
    drawer.hLine(28, 36, 3, '#ff0055'); // 底部红灯氛围
    drawer.pixel(30, 32, 'rgba(255,255,255,0.15)'); // 玻璃反光点
    drawer.pixel(29, 33, 'rgba(255,255,255,0.1)');
    drawer.pixel(26, 31, '#00ffcc'); // 前部电源指示灯

    // 左右承重桌腿
    // 左腿
    drawer.rect(2, 29, 3, 11, cWoodDark);
    drawer.vLine(2, 29, 11, cWoodHighlight); // 最左侧光源直射边缘极亮
    drawer.vLine(3, 29, 11, cWood);
    drawer.hLine(2, 39, 3, cShadowDeep);     // 接触地面的驻影
    // 右腿
    drawer.rect(35, 29, 3, 11, cWoodDark);
    drawer.vLine(35, 29, 11, cWood);         // 右侧距光远，光较暗
    drawer.hLine(35, 39, 3, cShadowDeep);

    // ==============================
    // 2. 桌面主体结构 (俯视透视)
    // ==============================
    // 桌面顶平面
    drawer.rect(1, 19, 38, 7, cWoodLight);
    drawer.hLine(2, 19, 36, cWoodHighlight); // 桌面后顶边缘逆光亮边
    drawer.vLine(1, 19, 7, cWoodHighlight);  // 桌面左边缘亮边
    drawer.hLine(2, 25, 36, cWood);          // 结构转角处色彩过渡
    drawer.vLine(38, 19, 7, cWood);          // 右边缘背光偏暗

    // 桌面木纹细节
    drawer.hLine(8, 20, 5, cWoodGrain);
    drawer.hLine(28, 21, 4, cWoodGrain);
    drawer.hLine(14, 24, 6, cWoodGrain);
    drawer.hLine(2, 22, 3, cWoodGrain);
    drawer.hLine(34, 23, 3, cWoodGrain);

    // 桌面正面厚度 (立体立面)
    drawer.rect(1, 26, 38, 3, cWood);
    drawer.hLine(1, 26, 38, cWoodHighlight); // 平面转立面的高光倒角
    drawer.hLine(1, 28, 38, cWoodDark);      // 立面底部暗面
    drawer.pixel(1, 26, cWoodLight);         // 左切角极致高光

    // ==============================
    // 3. 桌面投射阴影
    // ==============================
    // 显示器柱子投影
    drawer.rect(19, 19, 5, 2, 'rgba(0,0,0,0.15)');
    drawer.pixel(24, 20, 'rgba(0,0,0,0.1)');
    // 键鼠投影
    drawer.hLine(6, 25, 16, 'rgba(0,0,0,0.2)');
    drawer.vLine(22, 22, 3, 'rgba(0,0,0,0.15)');
    drawer.hLine(24, 25, 10, 'rgba(0,0,0,0.15)');
    drawer.vLine(34, 21, 4, 'rgba(0,0,0,0.15)');

    // ==============================
    // 4. 显示器底座与承重支柱
    // ==============================
    const standY = 18;
    drawer.rect(16, standY, 8, 2, '#2a2a2c');
    drawer.hLine(16, standY, 8, '#5a5a5c');  // 顶边受光
    drawer.hLine(16, standY + 1, 8, '#1a1a1c'); // 底边暗
    // 支柱
    drawer.rect(19, 15, 2, 4, '#202022');
    drawer.vLine(19, 15, 4, '#404044'); // 左侧光柱高亮
    drawer.vLine(20, 15, 4, '#101012'); // 右侧柱背光

    // ==============================
    // 5. 极致薄边框显示器
    // ==============================
    const monX = 6, monY = 3, monW = 28, monH = 15;
    drawer.rect(monX, monY, monW, monH, '#0a0a0c'); // 显示器背底漏色防穿

    // 外框拉丝金属材质光影
    drawer.hLine(monX + 1, monY, monW - 2, '#4a4a4d'); // 顶部更亮
    drawer.hLine(monX + 2, monY, 5, '#6a6a6d');    // 左上极高光点
    drawer.hLine(monX, monY + 1, monW, '#18181c');   // 顶部内嵌细框
    drawer.vLine(monX, monY + 1, monH - 2, '#2a2a2d'); // 左侧极细金属边
    drawer.vLine(monX + monW - 1, monY + 1, monH - 2, '#050505'); // 右侧深暗面
    drawer.hLine(monX, monY + monH - 1, monW, '#111112'); // 底部大下巴外框
    drawer.hLine(monX, monY + monH - 2, monW, '#1e1e22'); // 下巴上倾倒角受光
    drawer.pixel(monX, monY, '#5a5a5d');         // 左上圆角像素
    drawer.pixel(monX + monW - 1, monY, '#2a2a2d'); // 右上暗圆角像素

    // === 内部屏幕与UI (黑色主题代码编辑器) ===
    const scrX = monX + 1, scrY = monY + 1, scrW = monW - 2, scrH = monH - 3;
    drawer.rect(scrX, scrY, scrW, scrH, '#0d1117'); // 屏幕玻璃底色背景

    // UI窗体标题栏
    drawer.hLine(scrX, scrY, scrW, '#161b22');
    drawer.pixel(scrX + 1, scrY, '#ff5f56'); // Mac红圈
    drawer.pixel(scrX + 3, scrY, '#ffbd2e'); // Mac黄圈
    drawer.pixel(scrX + 5, scrY, '#27c93f'); // Mac绿圈
    drawer.hLine(scrX + 8, scrY, 10, '#30363d'); // 编辑器Tab卡片底色
    drawer.hLine(scrX + 8, scrY, 4, '#58a6ff');  // 激活Tab的高光指示丝带

    // UI左侧边栏与文件树结构
    drawer.rect(scrX, scrY + 1, 4, scrH - 1, '#161b22');
    drawer.vLine(scrX + 4, scrY + 1, scrH - 1, '#21262d');
    drawer.hLine(scrX + 1, scrY + 2, 2, '#58a6ff');
    drawer.hLine(scrX + 1, scrY + 4, 1, '#8b949e');
    drawer.hLine(scrX + 2, scrY + 5, 1, '#8b949e');
    drawer.hLine(scrX + 1, scrY + 7, 2, '#8b949e');
    drawer.hLine(scrX + 2, scrY + 8, 1, '#8b949e');
    drawer.hLine(scrX + 2, scrY + 9, 1, '#8b949e');

    // 代码区高亮语法条块
    const codeX = scrX + 6, codeY = scrY + 2;
    drawer.hLine(codeX, codeY, 3, '#ff7b72');
    drawer.hLine(codeX + 4, codeY, 5, '#d2a8ff');
    drawer.hLine(codeX + 2, codeY + 2, 2, '#ff7b72');
    drawer.hLine(codeX + 5, codeY + 2, 6, '#a5d6ff');
    drawer.hLine(codeX + 12, codeY + 2, 4, '#89d185');
    drawer.hLine(codeX + 2, codeY + 4, 4, '#89d185');
    drawer.hLine(codeX + 7, codeY + 4, 3, '#79c0ff');
    drawer.hLine(codeX + 2, codeY + 5, 4, '#89d185');
    drawer.hLine(codeX + 7, codeY + 5, 2, '#79c0ff');
    drawer.hLine(codeX + 2, codeY + 7, 9, '#8b949e'); // 灰色注释块
    drawer.hLine(codeX + 2, codeY + 8, 6, '#8b949e');
    drawer.hLine(codeX, codeY + 10, 1, '#ff7b72');

    // 代码悬浮提示/自动补全窗体
    drawer.rect(scrX + 11, scrY + 5, 6, 4, '#30363d');
    drawer.hLine(scrX + 12, scrY + 6, 4, '#c9d1d9');
    drawer.hLine(scrX + 12, scrY + 7, 2, '#c9d1d9');
    drawer.vLine(scrX + 11, scrY + 5, 4, '#484f58'); // 浮窗左边框投影

    // 屏幕玻璃质感大面积对角线斜扫反光
    for (let i = 0; i < scrH; i++) {
        let rx = scrX + 16 - i;
        if (rx >= scrX && rx < scrX + scrW) {
            drawer.pixel(rx, scrY + i, 'rgba(255, 255, 255, 0.08)');
            if (rx + 1 < scrX + scrW) drawer.pixel(rx + 1, scrY + i, 'rgba(255, 255, 255, 0.05)');
            if (rx + 4 < scrX + scrW) drawer.pixel(rx + 4, scrY + i, 'rgba(255, 255, 255, 0.03)');
        }
    }

    // 下巴处的厂商Logo点阵与电源指示灯
    drawer.pixel(monX + Math.floor(monW / 2), monY + monH - 1, '#444444');
    drawer.pixel(monX + monW - 2, monY + monH - 1, '#00ffcc');

    // ==============================
    // 6. 键鼠外设交互区
    // ==============================
    // 超大号鼠标垫
    drawer.rect(24, 20, 10, 5, '#1a1b1e');
    drawer.hLine(24, 20, 10, '#2b2c30'); // 布面顶缘受光
    drawer.vLine(24, 21, 4, '#25262a');  // 左侧微光
    drawer.pixel(32, 24, '#ff0055');     // 信仰红签

    // 机械流线型鼠标
    drawer.fillPath([
        {x: 29, y: 21}, {x: 31, y: 21},
        {x: 32, y: 22}, {x: 31, y: 24},
        {x: 29, y: 24}, {x: 28, y: 22}
    ], '#252527');
    drawer.pixel(29, 22, '#4a4a4e'); // 左点击按键区光泽
    drawer.pixel(31, 22, '#18181a'); // 右指搭放区
    drawer.pixel(31, 23, '#101012'); // 右裙边暗角
    drawer.pixel(30, 22, '#00ffcc'); // 滚轮RGB灯

    // 机械键盘壳体
    const kbX = 6, kbY = 21;
    drawer.rect(kbX, kbY, 16, 4, '#151517');
    drawer.rect(kbX + 1, kbY, 14, 3, '#222224');
    drawer.hLine(kbX + 1, kbY, 14, '#38383a'); // 上边缘金属亮边
    drawer.vLine(kbX, kbY, 4, '#303033');
    drawer.hLine(kbX + 1, kbY + 3, 14, '#111111');

    // 键帽精细布局
    for (let i = kbX + 1; i <= kbX + 13; i += 2) drawer.pixel(i, kbY, '#4c4c50');
    drawer.pixel(kbX + 14, kbY, '#404040');
    for (let i = kbX + 2; i <= kbX + 14; i += 2) drawer.pixel(i, kbY + 1, '#56565a');
    for (let i = kbX + 1; i <= kbX + 13; i += 2) drawer.pixel(i, kbY + 2, '#505054');
    drawer.hLine(kbX + 5, kbY + 3, 6, '#66666a'); // 空格
    drawer.pixel(kbX + 2, kbY + 3, '#4c4c50');
    drawer.pixel(kbX + 12, kbY + 3, '#4c4c50');
    drawer.pixel(kbX + 14, kbY + 3, '#4c4c50');

    // 键盘底部RGB透射
    drawer.hLine(kbX, kbY + 4, 16, 'rgba(0, 255, 204, 0.15)');
    drawer.hLine(kbX + 2, kbY + 4, 12, 'rgba(88, 166, 255, 0.2)');

    // ==============================
    // 7. 桌面微型景观与日常饮品
    // ==============================
    // 小盆栽
    const plX = 2, plY = 19;
    drawer.hLine(plX + 1, plY, 3, 'rgba(0,0,0,0.2)');
    drawer.rect(plX, plY - 2, 4, 3, '#922b21');
    drawer.hLine(plX, plY - 2, 4, '#e74c3c');
    drawer.hLine(plX, plY, 4, '#641e16');
    drawer.vLine(plX + 3, plY - 1, 2, '#7b241c');
    // 绿叶
    drawer.pixel(plX + 1, plY - 3, '#27ae60');
    drawer.pixel(plX + 2, plY - 3, '#2ecc71');
    drawer.pixel(plX, plY - 4, '#27ae60');
    drawer.pixel(plX + 2, plY - 4, '#2ecc71');
    drawer.pixel(plX + 1, plY - 5, '#2ecc71');
    drawer.pixel(plX + 3, plY - 5, '#27ae60');

    // 咖啡杯
    const cupX = 35, cupY = 20;
    drawer.hLine(cupX + 1, cupY + 2, 4, 'rgba(0,0,0,0.15)');
    drawer.rect(cupX, cupY - 1, 3, 3, '#eaeaea');
    drawer.hLine(cupX, cupY - 1, 3, '#ffffff');
    drawer.hLine(cupX, cupY + 1, 3, '#b0b0b0');
    drawer.vLine(cupX + 2, cupY, 2, '#cccccc');
    drawer.pixel(cupX - 1, cupY, '#d0d0d0');
    drawer.pixel(cupX - 1, cupY + 1, '#aaaaaa');
    // 蒸汽
    drawer.pixel(cupX + 1, cupY - 3, 'rgba(255,255,255,0.4)');
    drawer.pixel(cupX + 2, cupY - 4, 'rgba(255,255,255,0.2)');

    return drawer.getCanvas();
}
