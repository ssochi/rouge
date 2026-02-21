import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createWardrobeSprite() {
    const w = 32;
    const h = 56;
    const drawer = new PixelDraw(w, h);

    const {
        cWood, cWoodDark, cWoodLight, cWoodHighlight,
        cWoodGrain, cGold, cGoldDark, cShadow, cShadowDeep
    } = FurniturePalette;

    // === 1. 后置背景层（柜体本身，含基础光影与转角） ===
    // 整个主柜体范围：宽26 (x=3..28)，高36 (y=15..50)
    drawer.rect(3, 15, 26, 36, cWood);

    // 柜体两侧立柱的光影转角（体现长方体的圆润圆柱感）
    drawer.vLine(3, 15, 36, cWoodHighlight);
    drawer.vLine(4, 15, 36, cWoodLight);
    drawer.vLine(27, 15, 36, cWoodDark);
    drawer.vLine(28, 15, 36, cShadowDeep);

    // 柜体上方被顶盖遮挡的投影
    drawer.rect(3, 15, 26, 2, cShadow);
    drawer.hLine(3, 15, 26, cShadowDeep);

    // === 2. 顶盖 (Cornice - 2.5D 俯视面) ===
    // 顶盖顶面：宽30 (x=1..30)，高9 (y=3..11)
    drawer.rect(1, 3, 30, 9, cWoodLight);
    // 顶面边缘高光与背光外沿
    drawer.hLine(1, 3, 30, cWoodHighlight);
    drawer.vLine(1, 3, 9, cWoodHighlight);
    drawer.vLine(30, 3, 9, cWoodDark);
    drawer.hLine(1, 11, 30, cWoodDark);
    // 顶面木纹结构（横向板材或拼缝细节）
    drawer.hLine(5, 5, 14, cWood);
    drawer.hLine(18, 7, 10, cWood);
    drawer.hLine(3, 9, 8, cWood);

    // 顶盖正面厚度层：宽30 (x=1..30)，高3 (y=12..14)
    drawer.rect(1, 12, 30, 3, cWood);
    drawer.hLine(1, 12, 30, cWoodHighlight); // 前沿上高光
    drawer.hLine(1, 14, 30, cWoodDark);      // 前沿下侧暗部投射
    drawer.pixel(1, 13, cWoodHighlight);     // 左侧受光点
    drawer.pixel(30, 13, cShadowDeep);       // 右侧背光点

    // === 3. 底部底座 (Plinth) ===
    // 柜体跟底座衔接处的过渡阴影色（产生受光面交界）
    drawer.hLine(3, 49, 26, cWoodDark);
    drawer.hLine(3, 50, 26, cShadow);

    // 底座主体：宽30 (x=1..30)，高4 (y=51..54)
    drawer.rect(1, 51, 30, 4, cWood);

    // 底座顶面向前凸出的光边缘
    drawer.hLine(1, 51, 30, cWoodLight);
    drawer.hLine(1, 51, 8, cWoodHighlight); // 左侧迎光更亮
    drawer.vLine(1, 52, 3, cWoodHighlight); // 左外沿亮边
    drawer.vLine(30, 52, 3, cShadowDeep);   // 右背光暗边

    // 底座下半部的中间镂空造型
    drawer.hLine(4, 53, 24, cWoodDark);
    drawer.hLine(6, 54, 20, cShadowDeep);
    // 加固四角支撑
    drawer.pixel(3, 54, cWood);
    drawer.pixel(28, 54, cWoodDark);

    // === 4. 左门面 (Left Door) ===
    // 门体：宽11 (x=5..15), 高31 (y=18..48)
    drawer.rect(5, 18, 11, 31, cWood);
    drawer.hLine(5, 18, 10, cWoodHighlight); // 上方受光
    drawer.vLine(5, 18, 31, cWoodHighlight); // 左侧迎光
    drawer.vLine(15, 18, 31, cShadowDeep);   // 中接缝（暗）
    drawer.hLine(5, 48, 11, cShadowDeep);    // 底部阴影

    // 左门内陷浮雕面板
    drawer.rect(7, 21, 7, 25, cWoodDark);
    drawer.rect(8, 22, 5, 23, cWood);
    drawer.hLine(7, 21, 7, cShadowDeep);  // 上内缘暗
    drawer.vLine(7, 21, 25, cShadowDeep); // 左内缘暗
    drawer.hLine(7, 45, 7, cWoodLight);   // 下内缘亮（反射受光）
    drawer.vLine(13, 21, 25, cWoodLight); // 右内缘亮
    // 左门面板木纹
    drawer.vLine(9, 24, 7, cWoodGrain);
    drawer.vLine(9, 36, 5, cWoodGrain);
    drawer.vLine(11, 28, 10, cWoodGrain);

    // 左门金漆把手（边缘外框处）
    drawer.vLine(14, 32, 4, cGold);
    drawer.pixel(14, 32, cWoodHighlight); // 顶部闪光
    drawer.pixel(13, 33, cShadowDeep);    // 左下侧投射阴影

    // === 5. 右门面 (Right Door) ===
    // 门体：宽11 (x=16..26), 高31 (y=18..48)
    drawer.rect(16, 18, 11, 31, cWood);
    drawer.hLine(16, 18, 10, cWoodHighlight); // 上方受光
    drawer.vLine(16, 18, 31, cWoodLight);     // 左迎光(凸出显接缝)
    drawer.vLine(26, 18, 31, cShadowDeep);    // 右轮廓暗
    drawer.hLine(16, 48, 11, cShadowDeep);    // 底部阴影

    // 右门内陷浮雕面板
    drawer.rect(18, 21, 7, 25, cWoodDark);
    drawer.rect(19, 22, 5, 23, cWood);
    drawer.hLine(18, 21, 7, cShadowDeep);
    drawer.vLine(18, 21, 25, cShadowDeep);
    drawer.hLine(18, 45, 7, cWoodLight);
    drawer.vLine(24, 21, 25, cWoodLight);
    // 右门面板木纹
    drawer.vLine(20, 26, 9, cWoodGrain);
    drawer.vLine(22, 23, 6, cWoodGrain);
    drawer.vLine(22, 35, 7, cWoodGrain);

    // 右门金漆把手
    drawer.vLine(17, 32, 4, cGold);
    drawer.pixel(17, 32, cWoodHighlight);
    drawer.pixel(18, 33, cShadowDeep);

    // === 6. 后期打光与细节强化 ===
    // 顶上左右留出的空间深度
    drawer.pixel(15, 17, cShadowDeep);
    drawer.pixel(16, 17, cShadowDeep);

    return drawer.getCanvas();
}
