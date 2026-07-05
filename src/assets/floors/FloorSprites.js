import { PixelDraw } from '../../utils/PixelDraw.js';
import { FloorPalette as P } from './FloorPalette.js';

/**
 * Deterministic pseudo-random scatter for pixel placement.
 * Returns array of {x, y} positions within [0, w) × [0, h).
 */
function scatter(seed, count, w, h) {
    const pts = [];
    let s = seed;
    for (let i = 0; i < count; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const x = s % w;
        s = (s * 1664525 + 1013904223) >>> 0;
        const y = s % h;
        pts.push({ x, y });
    }
    return pts;
}

function createGrassVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.grassBase);

    // Light patches (3-5 pixels)
    const lights = scatter(seed, 4, 16, 16);
    lights.forEach(p => d.pixel(p.x, p.y, P.grassLight));

    // Dark shadow spots
    const darks = scatter(seed + 100, 3, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.grassDark));

    // Blade tips (bright highlights)
    const blades = scatter(seed + 200, 2, 16, 16);
    blades.forEach(p => d.pixel(p.x, p.y, P.grassBlade));

    // Deep shadow
    const shadows = scatter(seed + 300, 2, 16, 16);
    shadows.forEach(p => d.pixel(p.x, p.y, P.grassShadow));

    return d.getCanvas();
}

function createWoodVariant(seed) {
    const d = new PixelDraw(16, 16);

    // 1. Base fill
    d.rect(0, 0, 16, 16, P.woodBase);

    // Define planks: [yStart, yEnd]
    // Plank 1: 0-4
    // Plank 2: 6-10
    // Plank 3: 12-15
    const planks = [
        { start: 0, end: 4 },
        { start: 6, end: 10 },
        { start: 12, end: 15 }
    ];

    // 2. Horizontal gaps (Fixed position for continuity)
    d.hLine(0, 5, 16, P.woodGap);
    d.hLine(0, 11, 16, P.woodGap);

    // 3. Process each plank
    planks.forEach((plank, i) => {
        // Plank specific seed derived from main seed and plank index
        let ps = seed + i * 100;

        // A. Edge Highlights/Shadows (Bevel effect for depth)
        d.hLine(0, plank.start, 16, P.woodLight); // Top edge highlight
        d.hLine(0, plank.end, 16, P.woodDark);    // Bottom edge shadow

        // B. Wood Grain (Random short lines, avoiding edges)
        // Draw 2-4 grain lines per plank
        const grainCount = 2 + (ps % 3);
        for (let g = 0; g < grainCount; g++) {
            ps = (ps * 1664525 + 1013904223) >>> 0;
            // Y position: avoid overwriting top/bottom bevels if possible, but mainly keep inside
            const gy = plank.start + 1 + (ps % (plank.end - plank.start - 1)); 
            
            ps = (ps * 1664525 + 1013904223) >>> 0;
            const gw = 2 + (ps % 6); // Width 2-7
            
            ps = (ps * 1664525 + 1013904223) >>> 0;
            const gx = 2 + (ps % (12 - gw)); // Start x between 2 and (12-gw), ensures strictly inside [2, 14]
            
            // Choose color: mostly grain, sometimes light or dark
            const colorType = g % 3;
            const color = colorType === 0 ? P.woodGrain : (colorType === 1 ? P.woodDark : P.woodLight);
            
            d.hLine(gx, gy, gw, color);
        }

        // C. Vertical Joint (Staggered plank ends)
        // Reduce probability to ~30% to create longer perceived planks across tiles
        ps = (ps * 1664525 + 1013904223) >>> 0;
        if ((ps % 100) < 30) { 
            ps = (ps * 1664525 + 1013904223) >>> 0;
            const jx = 2 + (ps % 12); // Joint between 2 and 13
            
            for (let jy = plank.start; jy <= plank.end; jy++) {
                d.pixel(jx, jy, P.woodGap);
                if (jx < 15) d.pixel(jx + 1, jy, P.woodLight); // Highlight edge of the joint
            }
        }
    });

    return d.getCanvas();
}

function createConcreteVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.concreteBase);

    // Light noise pixels
    const lights = scatter(seed, 3, 16, 16);
    lights.forEach(p => d.pixel(p.x, p.y, P.concreteLight));

    // Dark noise pixels
    const darks = scatter(seed + 50, 2, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.concreteDark));

    // Patch pixels
    const patches = scatter(seed + 150, 2, 16, 16);
    patches.forEach(p => d.pixel(p.x, p.y, P.concretePatch));

    // Optional small crack (1 variant in 2)
    if (seed % 2 === 0) {
        const cx = 4 + (seed % 8);
        const cy = 4 + ((seed >> 3) % 8);
        d.pixel(cx, cy, P.concreteCrack);
        d.pixel(cx + 1, cy + 1, P.concreteCrack);
    }

    return d.getCanvas();
}

function createDirtVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.dirtBase);

    // Light pebble pixels
    const pebbles = scatter(seed, 3, 16, 16);
    pebbles.forEach(p => d.pixel(p.x, p.y, P.dirtLight));

    // Dark shadow spots
    const darks = scatter(seed + 80, 2, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.dirtDark));

    // Highlight stone
    const stones = scatter(seed + 160, 1, 16, 16);
    stones.forEach(p => d.pixel(p.x, p.y, P.dirtPebble));

    // Deep shadow
    const shadows = scatter(seed + 240, 2, 16, 16);
    shadows.forEach(p => d.pixel(p.x, p.y, P.dirtShadow));

    return d.getCanvas();
}

function createStoneVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.stoneBase);

    // Brick pattern: 2 rows of bricks
    // Row 1 (top half): bricks at y=0..6, gap at y=7
    // Row 2 (bottom half): bricks at y=8..14, gap at y=15
    d.hLine(0, 7, 16, P.stoneGap);
    d.hLine(0, 15, 16, P.stoneGap);

    // Vertical joints - staggered between rows
    let ps = seed;
    ps = (ps * 1664525 + 1013904223) >>> 0;
    const joint1 = 6 + (ps % 5); // Row 1 joint at x=6..10
    ps = (ps * 1664525 + 1013904223) >>> 0;
    const joint2 = (joint1 + 5 + (ps % 4)) % 16; // Row 2 offset by ~half brick

    for (let y = 0; y <= 6; y++) {
        d.pixel(joint1, y, P.stoneGap);
        if (joint1 < 15) d.pixel(joint1 + 1, y, P.stoneDark);
    }
    for (let y = 8; y <= 14; y++) {
        d.pixel(joint2, y, P.stoneGap);
        if (joint2 < 15) d.pixel(joint2 + 1, y, P.stoneDark);
    }

    // Top-edge highlight per brick row
    d.hLine(0, 0, 16, P.stoneHighlight);
    d.hLine(0, 8, 16, P.stoneHighlight);

    // Bottom-edge shadow per brick row
    d.hLine(0, 6, 16, P.stoneDark);
    d.hLine(0, 14, 16, P.stoneDark);

    // Scatter noise
    const lights = scatter(seed + 50, 3, 16, 16);
    lights.forEach(p => d.pixel(p.x, p.y, P.stoneLight));

    const darks = scatter(seed + 100, 2, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.stoneDark));

    // Optional crack
    if (seed % 3 === 0) {
        const cx = 3 + (seed % 10);
        const cy = 2 + ((seed >> 2) % 10);
        d.pixel(cx, cy, P.stoneCrack);
        if (cx < 15) d.pixel(cx + 1, cy + 1, P.stoneCrack);
    }

    return d.getCanvas();
}

// ══════════ F1 监狱层专属地板（room-f1 独占，边缝在右/下 → 无缝拼接）══════════

/** PRISON_CELLBLOCK 铁锈钢板：8px 铆接钢板 + 右/下凹缝 + 排水格栅细节 + 锈斑（安静背景）。 */
function createPrisonCellblockVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.cellBase);

    // 8px 钢板：仅右/下凹缝（低对比，安静不喧宾夺主）
    d.hLine(0, 7, 16, P.cellGap);
    d.hLine(0, 15, 16, P.cellGap);
    d.vLine(7, 0, 16, P.cellGap);
    d.vLine(15, 0, 16, P.cellGap);
    // 板缝上缘 1px 暗化（厚度感）
    d.hLine(0, 6, 16, P.cellDark);
    d.hLine(0, 14, 16, P.cellDark);
    // 铆钉（每板左上角一枚高光点，固定位→规整安静）
    for (const [rx, ry] of [[1, 1], [9, 1], [1, 9], [9, 9]]) {
        d.pixel(rx, ry, P.cellHi);
    }
    // 排水格栅细节（每块一处，seed 定位；三道短暗槽）
    const gx = (seed & 1) ? 2 : 10;
    const gy = (seed & 2) ? 2 : 10;
    d.pixel(gx, gy, P.cellGap);
    d.pixel(gx + 2, gy, P.cellGap);
    d.pixel(gx + 4, gy, P.cellGap);
    // 锈斑（低频）
    scatter(seed + 20, 2, 16, 16).forEach(p => d.pixel(p.x, p.y, P.cellRust));
    return d.getCanvas();
}

/** PRISON_WET 湿滑石板：暗石板 + 错缝 + 深色积水 + 一处水光反照。 */
function createPrisonWetVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.wetBase);

    // 石板砖缝（右/下 + 中横），错缝竖缝
    d.hLine(0, 15, 16, P.wetGap);
    d.vLine(15, 0, 16, P.wetGap);
    d.hLine(0, 7, 16, P.wetGap);
    const ps = (seed * 1664525 + 1013904223) >>> 0;
    const joint = 5 + (ps % 6);
    d.vLine(joint, 0, 8, P.wetGap);
    d.vLine((joint + 8) % 16, 8, 7, P.wetGap);

    // 暗湿洼（深色积水底）
    scatter(seed + 40, 5, 16, 16).forEach(p => d.pixel(p.x, p.y, P.wetPool));

    // 水光反照（成簇亮点，定位一处水洼）
    const px = 3 + (seed % 8);
    const py = 3 + ((seed >> 2) % 8);
    d.pixel(px, py, P.wetSheen);
    d.pixel(px + 1, py, P.wetSheen);
    d.pixel(px, py + 1, P.wetSheen);
    d.pixel(px + 2, py + 1, P.wetLight);
    d.pixel(px + 1, py + 2, P.wetLight);
    return d.getCanvas();
}

/** PRISON_BLOOD 血渍石板：灰石板 + 明暗噪点 + 干涸血渍与溅点。 */
function createPrisonBloodVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.bloodBase);

    // 石板砖缝
    d.hLine(0, 15, 16, P.bloodGap);
    d.vLine(15, 0, 16, P.bloodGap);
    d.hLine(0, 7, 16, P.bloodGap);
    const ps = (seed * 1664525 + 1013904223) >>> 0;
    const joint = 4 + (ps % 7);
    d.vLine(joint, 0, 8, P.bloodGap);
    d.vLine((joint + 7) % 16, 8, 7, P.bloodGap);

    // 明暗噪点
    scatter(seed + 30, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.bloodLight));
    scatter(seed + 70, 2, 16, 16).forEach(p => d.pixel(p.x, p.y, P.bloodDark));

    // 干涸血渍（一处主渍 + 周边溅点）
    const bx = 4 + (seed % 7);
    const by = 4 + ((seed >> 3) % 7);
    d.pixel(bx, by, P.bloodStain);
    d.pixel(bx + 1, by, P.bloodStain);
    d.pixel(bx, by + 1, P.bloodStain);
    d.pixel(bx + 1, by + 1, P.bloodStainDk);
    d.pixel(bx + 2, by + 1, P.bloodStain);
    d.pixel(bx - 1, by + 2, P.bloodStainDk);
    scatter(seed + 130, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.bloodStainDk));
    return d.getCanvas();
}

// ══════════ F3 实验室层专属地板（room-f3 独占，结构 4/8px 周期→无缝拼接）══════════

/** LAB_GRATE 金属格栅：钢制网格板 + 规则格孔 + 锈斑。 */
function createLabGrateVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.grateBase);

    // 格栅棱线（顶面高光，周期 4px 无缝）
    for (let i = 0; i < 16; i += 4) {
        d.hLine(0, i, 16, P.grateLight);
        d.vLine(i, 0, 16, P.grateLight);
    }
    // 格孔：右下内凹阴影 + 中央黑洞
    for (let gy = 0; gy < 16; gy += 4) {
        for (let gx = 0; gx < 16; gx += 4) {
            d.rect(gx + 1, gy + 1, 3, 3, P.grateDark);
            d.rect(gx + 1, gy + 1, 2, 2, P.grateHole);
            d.pixel(gx + 1, gy + 1, P.grateHi); // 孔口左上高光
        }
    }
    // 锈斑与磨损
    scatter(seed, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.grateRust));
    scatter(seed + 90, 2, 16, 16).forEach(p => d.pixel(p.x, p.y, P.grateHi));
    return d.getCanvas();
}

/** LAB_TILE 无菌白瓷砖：苍白瓷面 + 冷缝 + 陈旧污渍。 */
function createLabTileVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.tileBase);

    // 瓷砖缝（上/左边框，邻砖拼出完整缝）
    d.hLine(0, 0, 16, P.tileGrout);
    d.vLine(0, 0, 16, P.tileGrout);
    // 内斜面：左上高光、右下阴影（瓷面光泽）
    d.hLine(1, 1, 15, P.tileHi);
    d.vLine(1, 1, 15, P.tileHi);
    d.hLine(1, 15, 15, P.tileDark);
    d.vLine(15, 1, 15, P.tileDark);
    // 污渍与反光噪点
    scatter(seed, 3, 14, 14).forEach(p => d.pixel(p.x + 1, p.y + 1, P.tileStain));
    scatter(seed + 40, 2, 14, 14).forEach(p => d.pixel(p.x + 1, p.y + 1, P.tileLight));
    return d.getCanvas();
}

/** LAB_HAZARD 警示条纹：褪色工业警示漆刷在脏污地面上（斜纹 + 侵蚀剥落，周期 8px 无缝）。
 *  设计意图：它是"地面材质"而非"警告标语"——低饱和、低对比、大量磨损，让视线落在物件而非地板。 */
function createLabHazardVariant(seed) {
    const d = new PixelDraw(16, 16);
    // 脏污钢/混凝土基底（漆面剥落处露出）
    d.rect(0, 0, 16, 16, P.hazardBase);

    // 斜向警示漆条（褪色芥末黄 / 暖黑），带侵蚀空洞露出基底
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            // 逐像素确定性噪声：控制漆面剥落与漆内明暗
            let hsh = ((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)) >>> 0;
            hsh = (hsh ^ (hsh >>> 13)) >>> 0;
            if ((hsh % 100) < 20) continue; // ~20% 漆面剥落，露出脏底
            const band = Math.floor((x + y) / 4) % 2;
            if (band === 0) {
                const t = (hsh >>> 5) % 12;
                d.pixel(x, y, t < 2 ? P.hazardYellowDk : (t === 2 ? P.hazardYellowHi : P.hazardYellow));
            } else {
                d.pixel(x, y, P.hazardBlack);
            }
        }
    }

    // 漆条边缝：稀疏暗磨损缝（取代原来整齐的亮高光线，避免"崭新胶带"观感）
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if ((x + y) % 4 === 0 && ((x * 5 + y * 3) & 3) === 0) {
                d.pixel(x, y, P.hazardYellowDk);
            }
        }
    }

    // 油污锈渍 + 磨损露底
    scatter(seed + 11, 5, 16, 16).forEach(p => d.pixel(p.x, p.y, P.hazardGrime));
    scatter(seed + 61, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.hazardWear));
    return d.getCanvas();
}

/**
 * Generate all floor tile sprites.
 * @returns {{ grass: HTMLCanvasElement[], wood: HTMLCanvasElement[], concrete: HTMLCanvasElement[], dirt: HTMLCanvasElement[], stone: HTMLCanvasElement[] }}
 */
export function createFloorSprites() {
    const seeds = [7, 31, 53, 89]; // 4 deterministic seeds per variant

    return {
        grass: seeds.map(s => createGrassVariant(s)),
        wood: seeds.map(s => createWoodVariant(s)),
        concrete: seeds.map(s => createConcreteVariant(s)),
        dirt: seeds.map(s => createDirtVariant(s)),
        stone: seeds.map(s => createStoneVariant(s)),
        // ── F1 监狱层地板变体（room-f1 独占）──
        prison_cellblock: seeds.map(s => createPrisonCellblockVariant(s)),
        prison_wet: seeds.map(s => createPrisonWetVariant(s)),
        prison_blood: seeds.map(s => createPrisonBloodVariant(s)),
        // ── F3 实验室层地板变体（room-f3 独占）──
        lab_grate: seeds.map(s => createLabGrateVariant(s)),
        lab_tile: seeds.map(s => createLabTileVariant(s)),
        lab_hazard: seeds.map(s => createLabHazardVariant(s))
    };
}

// ══════════ F2 圣殿层专属地板（room-f2 独占，边缝在右/下 → 无缝拼接） ══════════
// 变体在 Assets.js 内以 floorSprites.temple_tiles = createTempleTilesVariants() 并入（与 pit 同法）。

const F2_SEEDS = [7, 31, 53, 89];

/** TEMPLE_TILES 青石菱纹：暗青石板 + 居中菱形嵌纹 + 金心，四边中点接缝拼出连续菱格。 */
function createTempleTilesVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.templeBase);

    // 石板接缝（右/下）
    d.hLine(0, 15, 16, P.templeGap);
    d.vLine(15, 0, 16, P.templeGap);

    // 居中菱形（|dx|+|dy|=7，顶点落在四边中点 → 平铺成连续菱格）
    const r = 7;
    for (let t = 0; t < r; t++) {
        d.pixel(8 - r + t, 8 - t, P.templeDiamond); // 左上边
        d.pixel(8 + t, 8 - r + t, P.templeDiamond); // 上右边
        d.pixel(8 + r - t, 8 + t, P.templeDark);    // 右下边（阴影侧）
        d.pixel(8 - t, 8 + r - t, P.templeDark);    // 下左边（阴影侧）
    }
    // 菱心金点
    d.pixel(8, 8, P.templeGold);
    d.pixel(7, 8, P.templeLight);
    d.pixel(8, 7, P.templeLight);

    // 低频噪点
    scatter(seed + 20, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.templeLight));
    scatter(seed + 60, 2, 16, 16).forEach(p => d.pixel(p.x, p.y, P.templeDark));
    return d.getCanvas();
}

/** TEMPLE_CARPET 仪式红毯：深绯绒面 + 竖向绒毛明暗 + 四点金织锦纹 + 磨损。 */
function createTempleCarpetVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.carpetBase);

    // 竖向绒毛（隔列微明暗，绒面质感）
    for (let x = 0; x < 16; x += 2) {
        d.vLine(x, 0, 16, P.carpetLight);
        d.vLine(x + 1, 0, 16, P.carpetDark);
    }
    // 金织锦纹（中心 + 四角小十字 → 平铺成连续菱形花样）
    const damask = (cx, cy) => {
        d.pixel(cx, cy - 1, P.carpetGold);
        d.pixel(cx - 1, cy, P.carpetGold);
        d.pixel(cx + 1, cy, P.carpetGold);
        d.pixel(cx, cy + 1, P.carpetGold);
        d.pixel(cx, cy, P.carpetGoldDk);
    };
    damask(8, 8);
    damask(0, 0);
    damask(16, 0);
    damask(0, 16);
    damask(16, 16);

    // 磨损/踩踏痕（低频）
    scatter(seed + 15, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.carpetWear));
    return d.getCanvas();
}

/** RITUAL_DARK 祭阵黑石：近墨黑石 + 接缝 + 幽紫符阵微光刻线。 */
function createRitualDarkVariant(seed) {
    const d = new PixelDraw(16, 16);
    d.rect(0, 0, 16, 16, P.ritualBase);

    // 接缝（右/下）+ 一处错缝
    d.hLine(0, 15, 16, P.ritualGap);
    d.vLine(15, 0, 16, P.ritualGap);
    const ps = (seed * 1664525 + 1013904223) >>> 0;
    const joint = 4 + (ps % 7);
    d.vLine(joint, 0, 8, P.ritualGap);

    // 明暗噪点（粗糙黑石）
    scatter(seed + 25, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.ritualLight));
    scatter(seed + 65, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, P.ritualDark));

    // 幽紫符阵刻线（每块一处小角形符文 + 高光）
    const gx = 3 + (seed % 8);
    const gy = 3 + ((seed >> 2) % 8);
    d.pixel(gx, gy, P.ritualRune);
    d.pixel(gx + 1, gy, P.ritualRune);
    d.pixel(gx + 1, gy + 1, P.ritualRune);
    d.pixel(gx + 1, gy + 2, P.ritualRune);
    d.pixel(gx, gy, P.ritualRuneHi);
    return d.getCanvas();
}

export function createTempleTilesVariants() { return F2_SEEDS.map(createTempleTilesVariant); }
export function createTempleCarpetVariants() { return F2_SEEDS.map(createTempleCarpetVariant); }
export function createRitualDarkVariants() { return F2_SEEDS.map(createRitualDarkVariant); }
