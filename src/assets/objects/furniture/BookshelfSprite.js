import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createBookshelfSprite() {
    const variants = [];
    const count = 6; // Generate 6 variants
    for (let i = 0; i < count; i++) {
        variants.push(createSingleBookshelf());
    }
    return variants;
}

function createSingleBookshelf() {
    const w = 32;
    const h = 48;
    const drawer = new PixelDraw(w, h);

    const { 
        cWood, cWoodDark, cWoodLight, cWoodHighlight, 
        cGold, cGoldDark, cShadow, cShadowDeep 
    } = FurniturePalette;

    // 🎨 高级做旧书籍调色板 [主色, 暗色/书脊色]
    const bookColors = [
        ['#a93226', '#7b241c'], // 绯红
        ['#2471a3', '#1a5276'], // 海蓝
        ['#1e8449', '#145a32'], // 墨绿
        ['#7d3c98', '#5b2c6f'], // 紫罗兰
        ['#f39c12', '#b9770e'], // 琥珀黄
        ['#1a252f', '#11171d'], // 深夜蓝
        ['#34495e', '#2c3e50']  // 灰蓝
    ];
    const cPages = '#fdf2e9';
    const cPagesDark = '#e5e7e9';

    // === 🛠 随机生成工具函数 ===
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randColorPair = () => bookColors[randInt(0, bookColors.length - 1)];

    // 绘制直立书排
    function drawStandingBooks(startX, baseY, maxW) {
        let count = randInt(1, Math.min(4, maxW)); // 生成1-4本书
        let currX = startX;
        for (let i = 0; i < count; i++) {
            let bw = randInt(1, Math.min(3, maxW - (currX - startX)));
            if (bw < 1) break;
            
            let bh = randInt(5, 10);
            let [cMain] = randColorPair();
            let topY = baseY - bh + 1;
            
            drawer.rect(currX, topY, bw, bh, cMain); // 书脊
            drawer.vLine(currX, topY, bh, 'rgba(255,255,255,0.15)'); // 立体高光
            drawer.hLine(currX, topY, bw, cPagesDark); // 书页顶端
            
            // 随机烫金线
            if (bh >= 7 && Math.random() > 0.4) {
                drawer.hLine(currX, topY + 2, bw, cGold);
                if (bh > 8) drawer.hLine(currX, baseY - 2, bw, cGold);
            }
            currX += bw;
        }
        return currX - startX;
    }

    // 绘制横向叠放的书
    function drawStackedBooks(x, baseY, maxW) {
        let bw = randInt(5, Math.min(8, maxW));
        let count = randInt(2, 3);
        let currY = baseY;
        for (let i = 0; i < count; i++) {
            let [cMain, cDark] = randColorPair();
            drawer.rect(x, currY - 1, bw, 2, cMain); // 书封面
            drawer.hLine(x + 1, currY - 1, bw - 1, cPages); // 书页侧面
            drawer.rect(x, currY - 1, 1, 2, cDark); // 书脊
            
            currY -= 2;
            bw -= randInt(0, 1); // 上面的书可能更短
            if (bw < 4) break;
        }
        return (baseY - currY) * 2; // 估算占据宽度
    }

    // 绘制倾斜的书
    function drawLeaningBook(x, baseY) {
        let [cMain, cDark] = randColorPair();
        drawer.line(x, baseY, x + 3, baseY - 6, cDark);      // 书脊
        drawer.line(x + 1, baseY, x + 4, baseY - 6, cPages); // 书页
        drawer.line(x + 2, baseY, x + 5, baseY - 6, cPagesDark);
        drawer.line(x + 3, baseY, x + 6, baseY - 6, cMain);  // 封面
    }

    // 绘制常春藤盆栽
    function drawPlant(x, baseY) {
        drawer.rect(x + 1, baseY - 2, 3, 3, '#a04000'); // 盆身
        drawer.hLine(x, baseY - 3, 5, '#d35400'); // 盆沿
        drawer.rect(x + 2, baseY - 1, 2, 1, '#873600'); // 盆暗部
        // 随机叶子
        const leaves = ['#27ae60', '#2ecc71', '#1e8449'];
        for (let i = 0; i < 6; i++) {
            let lx = x + randInt(0, 4);
            let ly = baseY - randInt(3, 6);
            drawer.rect(lx, ly, 1, 1, leaves[randInt(0, 2)]);
        }
        // 随机下垂的藤蔓
        if (Math.random() > 0.3) drawer.rect(x - 1, baseY - 2, 1, 2, '#27ae60');
        if (Math.random() > 0.3) drawer.rect(x + 5, baseY - 2, 1, 1, '#2ecc71');
    }

    // 绘制魔法药水瓶
    function drawPotion(x, baseY) {
        let pColors = ['#e74c3c', '#9b59b6', '#2ecc71', '#3498db', '#f1c40f'];
        let cLiquid = pColors[randInt(0, pColors.length - 1)];
        drawer.rect(x, baseY - 2, 3, 3, cLiquid); // 瓶底液体
        drawer.rect(x + 1, baseY - 4, 1, 2, '#2471a3'); // 玻璃瓶颈
        drawer.rect(x + 1, baseY - 5, 1, 1, '#d35400'); // 软木塞
        drawer.rect(x, baseY - 2, 1, 1, 'rgba(255,255,255,0.6)'); // 玻璃高光
    }

    // 绘制复古皮质收纳箱
    function drawBox(x, baseY) {
        let bw = randInt(7, 9);
        let bh = randInt(5, 7);
        let topY = baseY - bh + 1;
        drawer.rect(x, topY, bw, bh, '#6e2c00'); // 箱体
        drawer.hLine(x, topY, bw, '#873600');    // 顶盖高光
        drawer.vLine(x, topY, bh, '#421a00');    // 左包边
        drawer.vLine(x + bw - 1, topY, bh, '#421a00'); // 右包边
        drawer.rect(x, topY, 1, 1, cGold);       // 左角铜饰
        drawer.rect(x + bw - 1, topY, 1, 1, cGold); // 右角铜饰
        drawer.rect(x + Math.floor(bw / 2), topY + 2, 1, 2, cGold); // 锁扣
    }

    // ==========================================
    // 1. 书架背板 (随机垂直护墙板)
    // ==========================================
    drawer.rect(2, 4, w - 4, 36, '#2a1a12');
    for (let x = 3; x < w - 2; x += randInt(3, 5)) {
        drawer.vLine(x, 4, 36, '#1e110b'); 
        drawer.vLine(x + 1, 4, 36, '#382319');
    }

    // ==========================================
    // 2. 书架外框与顶冠
    // ==========================================
    drawer.rect(1, 0, w - 2, h, cWood);
    drawer.rect(0, 0, w, 4, cWoodDark);
    drawer.rect(0, 2, w, 2, cWood);
    drawer.hLine(1, 0, w - 2, cWoodHighlight);
    drawer.hLine(0, 2, w, cWoodHighlight);
    drawer.hLine(0, 4, w, cShadowDeep);

    // ==========================================
    // 3. 隔板与随机物品填充
    // ==========================================
    const shelfYs = [14, 26, 38];
    // 全局限制特殊物品数量，防止太杂乱
    let specialLimit = { plant: 1, potion: randInt(0, 1), box: 1 };

    shelfYs.forEach(y => {
        // 绘制隔板
        drawer.hLine(2, y - 1, w - 4, '#1c100a'); // 阴影
        drawer.rect(2, y, w - 4, 2, cWood); // 板
        drawer.hLine(2, y, w - 4, cWoodHighlight); // 高光
        drawer.hLine(2, y + 2, w - 4, cShadowDeep); // 底侧暗面

        // --- 开始随机填充这一层 ---
        let currX = 3;
        const baseY = y - 1;

        while (currX < w - 4) {
            let space = (w - 3) - currX;
            if (space <= 1) break;

            // 决定要生成的物品种类列表
            let choices = ['standing', 'standing']; // 增加直立书籍的权重作为基础填充
            if (space >= 6) choices.push('stacked');
            if (space >= 6) choices.push('leaning');
            if (space >= 6 && specialLimit.plant > 0) choices.push('plant');
            if (space >= 4 && specialLimit.potion > 0) choices.push('potion');
            if (space >= 9 && specialLimit.box > 0) choices.push('box');

            let choice = choices[randInt(0, choices.length - 1)];

            // 根据选择生成物品，并推进 X 坐标
            if (choice === 'plant') {
                drawPlant(currX, baseY);
                specialLimit.plant--;
                currX += randInt(6, 7);
            } else if (choice === 'potion') {
                drawPotion(currX, baseY);
                specialLimit.potion--;
                currX += randInt(4, 6);
            } else if (choice === 'box') {
                drawBox(currX, baseY);
                specialLimit.box--;
                currX += randInt(8, 10);
            } else if (choice === 'stacked') {
                drawStackedBooks(currX, baseY, space);
                currX += randInt(6, 8);
            } else if (choice === 'leaning') {
                drawLeaningBook(currX, baseY);
                currX += 6 + randInt(0, 2);
            } else {
                let usedW = drawStandingBooks(currX, baseY, space);
                currX += usedW + randInt(0, 2); // 加上随机间隙
            }
        }
    });

    // ==========================================
    // 4. 底部储物柜
    // ==========================================
    drawer.rect(2, 40, w - 4, h - 42, cWoodDark);
    const mid = Math.floor(w / 2);
    
    // 左柜门
    drawer.rect(3, 41, mid - 4, 5, cWood);
    drawer.hLine(3, 41, mid - 4, cWoodHighlight); 
    drawer.vLine(3, 41, 5, cWoodHighlight);
    drawer.rect(5, 43, mid - 8, 2, cWoodDark); 
    drawer.hLine(5, 44, mid - 8, cWoodHighlight);

    // 右柜门
    drawer.rect(mid + 1, 41, mid - 4, 5, cWood);
    drawer.hLine(mid + 1, 41, mid - 4, cWoodHighlight);
    drawer.vLine(mid + 1, 41, 5, cWoodHighlight);
    drawer.rect(mid + 3, 43, mid - 8, 2, cWoodDark);
    drawer.hLine(mid + 3, 44, mid - 8, cWoodHighlight);

    // 中缝阴影与把手
    drawer.vLine(mid, 40, 6, cShadowDeep);
    drawer.rect(mid - 3, 42, 1, 1, cGold);
    drawer.rect(mid - 3, 43, 1, 1, cGoldDark);
    drawer.rect(mid + 2, 42, 1, 1, cGold);
    drawer.rect(mid + 2, 43, 1, 1, cGoldDark);

    // ==========================================
    // 5. 全局边缘与右侧半透明阴影 (统一 3D 纵深)
    // ==========================================
    drawer.vLine(0, 4, h - 4, cWoodHighlight);
    drawer.vLine(w - 1, 4, h - 4, cWoodDark);
    drawer.hLine(1, h - 1, w - 2, cWoodDark);

    // 利用半透明黑色叠加在刚生成的书本上，形成统一的内阴影
    drawer.rect(w - 3, 4, 1, 36, 'rgba(0,0,0,0.2)');
    drawer.rect(w - 2, 4, 1, 36, 'rgba(0,0,0,0.5)');

    return drawer.getCanvas();
}