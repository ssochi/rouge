import { PixelDraw } from '../../../utils/PixelDraw.js';
import { BathroomPalette } from './BathroomPalette.js';

export function createToiletSprite() {
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cPorcelain, cPorcelainLight, cPorcelainShadow,
        cPorcelainDark, cPorcelainOutline,
        cChrome, cChromeDark,
        cShadow, cShadowDeep
    } = BathroomPalette;

    // --- 🎨 增加的专属细节颜色 ---
    const cSeat = '#ffffff';           // 座圈的纯白色 (比陶瓷亮)
    const cSeatShadow = '#e2e8f0';     // 座圈阴影
    
    const cWaterLight = '#60a5fa';     // 浅色水面
    const cWater = '#3b82f6';          // 水体主体
    const cWaterDark = '#1e3a8a';      // 深水区

    // === 绘制顺序：从下到上，从后到前 (Back-to-Front) ===

    // 1. 地面投影 (Floor Drop Shadow)
    drawer.hLine(4, 22, 8, cShadowDeep);
    drawer.rect(5, 23, 6, 1, cShadowDeep);
    // 右侧环境阴影扩散
    drawer.rect(12, 22, 2, 1, cShadow);

    // 2. 马桶底座/承重柱 (Pedestal)
    drawer.rect(5, 19, 6, 4, cPorcelainDark);
    drawer.hLine(6, 19, 4, cPorcelain);
    drawer.hLine(6, 20, 4, cPorcelain);
    // 底座光影
    drawer.vLine(5, 19, 3, cPorcelainShadow); // 左侧暗部
    drawer.vLine(10, 19, 3, cShadow);         // 右侧深阴影

    // 3. 进水管与角阀 (Water Supply Line - 极微小的高级细节)
    drawer.vLine(3, 19, 4, cChrome);
    drawer.rect(4, 21, 1, 1, cChromeDark); // 替换 setPixel: 角阀旋钮

    // 4. 水箱主体 (Tank Body - 后方)
    const tankX = 3;
    const tankY = 4;
    drawer.rect(tankX, tankY, 10, 7, cPorcelain);
    drawer.vLine(tankX, tankY, 7, cPorcelainLight);   // 左侧受光面
    drawer.vLine(12, tankY, 7, cPorcelainShadow);     // 右侧背光面
    drawer.vLine(13, 5, 5, cShadow);                  // 右侧环境投射阴影
    drawer.hLine(tankX, 10, 10, cPorcelainShadow);    // 水箱底部的交界阴影

    // 5. 水箱顶盖 (Tank Lid)
    drawer.rect(2, 2, 12, 2, cPorcelain);
    drawer.hLine(3, 1, 10, cPorcelainLight);          // 顶盖最亮的高光边
    drawer.rect(2, 2, 1, 2, cPorcelainLight);         // 顶盖左侧边
    drawer.rect(13, 2, 1, 2, cPorcelainShadow);       // 顶盖右侧边
    drawer.hLine(2, 4, 12, cPorcelainShadow);         // 顶盖下方的悬浮阴影

    // 水箱顶部的镀铬双按冲水键 (Dual-flush button)
    drawer.rect(10, 1, 2, 1, cChrome);
    drawer.rect(11, 1, 1, 1, cChromeDark); // 替换 setPixel: 按钮立体感

    // 6. 掀起的马桶盖 (Open Lid - 靠在水箱上，营造 3D 纵深感)
    drawer.hLine(5, 5, 6, cPorcelainDark);
    drawer.hLine(4, 6, 8, cPorcelainShadow);
    drawer.rect(3, 7, 10, 4, cPorcelain);
    // 盖板内圈的立体凹陷
    drawer.rect(4, 7, 8, 3, cPorcelainLight);
    // 水箱投射在盖板上的半透明阴影
    drawer.hLine(4, 7, 8, 'rgba(0,0,0,0.1)');

    // 7. 马桶便盆外壁 (Bowl Exterior - 前方)
    drawer.rect(2, 14, 12, 4, cPorcelain);
    drawer.hLine(3, 13, 10, cPorcelain);
    drawer.hLine(3, 18, 10, cPorcelain);
    drawer.hLine(4, 19, 8, cPorcelainShadow); // 底部收口阴影
    
    // 便盆的光影塑造体积感
    drawer.vLine(2, 14, 4, cPorcelainLight);      // 左侧弧面高光
    drawer.rect(3, 18, 1, 1, cPorcelainLight);    // 替换 setPixel
    drawer.vLine(13, 14, 4, cPorcelainShadow);    // 右侧弧面阴影
    drawer.rect(12, 18, 1, 1, cPorcelainShadow);  // 替换 setPixel
    drawer.vLine(14, 14, 4, cShadow);             // 右侧极深阴影边缘

    // 8. 便盆内部与积水 (Inside the Bowl & Water)
    drawer.hLine(5, 13, 6, cPorcelainDark);       // 内壁后方深坑阴影
    drawer.rect(4, 14, 8, 3, cPorcelainShadow);   // 内壁两侧与底部过渡
    
    // 注入灵魂的蓝色水体
    drawer.hLine(5, 15, 6, cWaterLight);          // 水的透视远端
    drawer.hLine(4, 16, 8, cWater);               // 水体主色调
    drawer.hLine(5, 17, 6, cWaterDark);           // 水的透视近端 (深邃感)
    // 水面波光反光 (纯白点)
    drawer.rect(8, 16, 1, 1, cSeat);              // 替换 setPixel: 高亮闪光
    drawer.rect(9, 16, 2, 1, 'rgba(255,255,255,0.4)'); // 柔和泛光

    // 9. 马桶座圈 (Seat Ring - 最上层，接触人体的部分)
    // 使用纯白 (cSeat) 突出它的独立结构
    drawer.hLine(5, 12, 6, cSeat);                // 座圈后段
    drawer.hLine(4, 13, 2, cSeat);                // 左后弯角
    drawer.hLine(10, 13, 2, cSeat);               // 右后弯角
    drawer.vLine(3, 14, 4, cSeat);                // 左侧宽边
    drawer.vLine(12, 14, 4, cSeatShadow);         // 右侧宽边 (背光偏灰)
    drawer.hLine(4, 18, 8, cSeat);                // 座圈前段
    
    // 座圈外侧边缘厚度 (3D 倒角)
    drawer.hLine(5, 19, 6, cSeatShadow);          // 前侧厚度
    drawer.rect(4, 18, 1, 1, cSeatShadow);        // 替换 setPixel: 左前过渡
    drawer.rect(11, 18, 1, 1, cSeatShadow);       // 替换 setPixel: 右前过渡

    return drawer.getCanvas();
}