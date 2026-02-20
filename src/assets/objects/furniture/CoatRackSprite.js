import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createCoatRackSprite() {
    const w = 16;
    const h = 40;
    const drawer = new PixelDraw(w, h);

    const { 
        cWood, cWoodDark, cWoodLight, cWoodHighlight, 
        cShadow, cShadowDeep 
    } = FurniturePalette;

    // 🎨 高级服装与配件调色板
    const cBrass = '#d4af37';      // 黄铜挂钩/雨伞扣
    const cBrassDark = '#996515';  // 黄铜暗部
    const cSilver = '#bdc3c7';     // 雨伞伞骨
    
    const cHat = '#2c3e50';        // 礼帽深蓝
    const cHatLight = '#34495e';   // 礼帽高光
    const cHatBand = '#e74c3c';    // 礼帽红丝带
    
    const cCoat = '#d4a373';       // 卡其色风衣
    const cCoatLight = '#faedcd';  // 风衣受光面
    const cCoatDark = '#a67c52';   // 风衣褶皱阴影
    
    const cScarf = '#7d3c98';      // 紫罗兰围巾
    const cScarfStripe = '#f1c40f';// 围巾金条纹
    const cScarfDark = '#5b2c6f';  // 围巾阴影

    // === 1. 地面投影 (Floor Shadow) ===
    drawer.hLine(5, 38, 6, cShadowDeep);
    drawer.hLine(4, 39, 8, 'rgba(0,0,0,0.15)');

    // === 2. 靠在旁边的长柄雨伞 (Rolled Umbrella) ===
    // 放在杆子后方/侧面，增加画面丰富度
    const umbX = 3;
    // 弯曲的木质手柄
    drawer.rect(umbX, 20, 2, 1, cWoodDark);
    drawer.rect(umbX - 1, 21, 1, 2, cWoodDark);
    drawer.rect(umbX, 23, 1, 1, cWoodDark);
    // 银色伞骨主干
    drawer.vLine(umbX + 1, 21, 4, cSilver);
    // 深绿色伞盖 (卷起状态)
    drawer.rect(umbX, 25, 3, 11, '#145a32');
    drawer.vLine(umbX + 1, 25, 11, '#27ae60'); // 伞叶高光折痕
    drawer.vLine(umbX + 2, 26, 9, '#0a361c');  // 伞叶阴影
    // 黄铜绑带
    drawer.hLine(umbX, 30, 3, cBrass);
    // 银色伞尖
    drawer.rect(umbX + 1, 36, 1, 2, cSilver);
    drawer.rect(umbX + 1, 38, 1, 1, cShadowDeep); // 伞尖触地阴影

    // === 3. 主杆与三脚架 (Base & Pole) ===
    // 后腿 (被挡住部分)
    drawer.line(8, 33, 10, 36, cWoodDark);
    
    // 主杆 (带有圆柱体的高光与背光)
    drawer.rect(7, 5, 2, 31, cWood);
    drawer.vLine(7, 5, 31, cWoodHighlight); // 左侧受光
    drawer.vLine(8, 5, 31, cWoodDark);      // 右侧背光

    // 左前腿
    drawer.line(7, 34, 4, 38, cWood);
    drawer.line(7, 35, 4, 39, cWoodDark); // 腿部厚度
    // 右前腿
    drawer.line(8, 34, 12, 38, cWood);
    drawer.line(8, 35, 12, 39, cWoodDark);

    // === 4. 黄铜挂钩 (Brass Hooks) ===
    // 中间固定木块
    drawer.rect(6, 7, 4, 3, cWoodDark);
    drawer.hLine(6, 7, 4, cWoodHighlight);
    
    // 左挂钩
    drawer.rect(5, 6, 1, 2, cBrass);
    drawer.rect(4, 5, 1, 1, cBrass); // 替换 setPixel
    // 右挂钩
    drawer.rect(10, 6, 1, 2, cBrass);
    drawer.rect(11, 5, 1, 1, cBrass); // 替换 setPixel
    // 正面小挂钩
    drawer.rect(7, 8, 2, 1, cBrassDark);

    // === 5. 顶部的绅士礼帽 (Fedora Hat) ===
    const hatY = 1;
    // 帽檐 (弯曲感)
    drawer.hLine(4, hatY + 3, 8, cHat);
    drawer.rect(3, hatY + 2, 1, 1, cHat); // 替换 setPixel
    drawer.rect(12, hatY + 2, 1, 1, cHat); // 替换 setPixel
    drawer.hLine(5, hatY + 3, 6, cHatLight); // 帽檐受光
    // 帽冠
    drawer.rect(5, hatY, 6, 3, cHat);
    drawer.hLine(6, hatY - 1, 4, cHatLight); // 顶部高光
    // 红色丝带
    drawer.hLine(5, hatY + 2, 6, cHatBand);
    drawer.rect(6, hatY + 2, 1, 1, '#c0392b'); // 丝带暗部结

    // === 6. 左侧的格纹围巾 (Striped Scarf) ===
    // 挂在左侧，层叠缠绕
    drawer.rect(4, 6, 3, 3, cScarfDark); // 缠绕在挂钩上的内侧
    drawer.rect(4, 9, 2, 9, cScarf);     // 垂下的主体
    drawer.vLine(4, 9, 9, '#9b59b6');    // 围巾高光
    
    // 金色条纹
    drawer.hLine(4, 11, 2, cScarfStripe);
    drawer.hLine(4, 14, 2, cScarfStripe);
    drawer.hLine(4, 17, 2, cScarfStripe);
    
    // 流苏细节
    drawer.rect(4, 18, 1, 2, cScarfDark);
    drawer.rect(5, 18, 1, 1, cScarf);

    // === 7. 右侧的卡其风衣 (Trench Coat) ===
    // 肩部 (挂在右侧挂钩上)
    drawer.rect(10, 5, 2, 1, cCoat);
    drawer.rect(9, 6, 4, 3, cCoat);
    // 衣身 (逐渐变宽垂下)
    drawer.rect(9, 9, 5, 6, cCoat);
    drawer.rect(8, 15, 6, 6, cCoat);
    drawer.rect(8, 21, 6, 5, cCoat);
    
    // 衣服细节与光影 (立体剪裁感)
    drawer.vLine(12, 6, 15, cCoatLight); // 右侧袖口受光面
    drawer.vLine(13, 10, 11, cCoatLight); 
    
    // 翻领细节 (Lapel)
    drawer.rect(10, 6, 1, 4, cCoatLight);
    drawer.vLine(9, 7, 10, cCoatDark);   // 门襟阴影
    
    // 腰带与口袋褶皱
    drawer.hLine(9, 15, 4, cCoatDark);   // 腰部收紧的横向褶皱
    drawer.rect(10, 16, 1, 4, cShadow);  // 衣服下摆打开的深色内衬投影
    
    // 底部衣摆自然阴影
    drawer.hLine(8, 25, 6, cCoatDark);
    // 底部参差不齐的下垂感
    drawer.rect(8, 26, 2, 1, cCoatDark);
    drawer.rect(12, 26, 2, 1, cCoatDark);

    return drawer.getCanvas();
}