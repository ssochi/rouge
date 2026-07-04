// RelicIcons.js
// 纯美术：18 个遗物的 12×12 程序化像素图标。严禁游戏逻辑。

import { PixelDraw } from '../../utils/PixelDraw.js';

const OUT = '#1a1220'; // 通用描边暗色

function icon(fn) {
    const d = new PixelDraw(12, 12);
    fn(d);
    return d.getCanvas();
}

const DRAWERS = {
    // 疾行之靴：棕色长靴 + 蓝色速度线
    swift_boots: d => {
        d.rect(4, 2, 3, 6, '#8b5a2b');
        d.rect(4, 8, 6, 2, '#6e4520');
        d.rect(4, 2, 1, 8, OUT);
        d.hLine(1, 4, 2, '#74b9ff');
        d.hLine(0, 6, 3, '#74b9ff');
    },
    // 速射手套：黄色手套三指
    rapid_gloves: d => {
        d.rect(3, 4, 6, 5, '#f1c40f');
        d.rect(3, 2, 2, 3, '#f1c40f');
        d.rect(6, 1, 2, 4, '#f1c40f');
        d.rect(9, 2, 1, 3, '#f39c12');
        d.rect(3, 9, 6, 1, '#b8860b');
        d.pixel(4, 5, '#fff3b0');
    },
    // 力量核心：红色菱形核心 + 光点
    power_core: d => {
        for (let i = 0; i < 5; i++) {
            d.hLine(5 - i, 2 + i, 1 + i * 2, i === 4 ? '#922b21' : '#e74c3c');
        }
        for (let i = 0; i < 4; i++) {
            d.hLine(2 + i, 7 + i, 9 - i * 2, '#c0392b');
        }
        d.pixel(5, 4, '#fadbd8');
    },
    // 生命之心：红心
    vital_heart: d => {
        d.rect(2, 3, 3, 3, '#e74c3c');
        d.rect(7, 3, 3, 3, '#e74c3c');
        d.rect(3, 5, 6, 3, '#e74c3c');
        d.hLine(4, 8, 4, '#c0392b');
        d.hLine(5, 9, 2, '#922b21');
        d.pixel(3, 4, '#fadbd8');
    },
    // 磁力指环：金色圆环 + 蓝色磁力弧
    magnet_ring: d => {
        d.rect(4, 3, 4, 1, '#f1c40f');
        d.rect(4, 8, 4, 1, '#b8860b');
        d.vLine(3, 4, 4, '#f1c40f');
        d.vLine(8, 4, 4, '#d4a017');
        d.pixel(4, 3, '#fff3b0');
        d.pixel(10, 2, '#74b9ff');
        d.pixel(11, 4, '#74b9ff');
        d.pixel(1, 8, '#74b9ff');
        d.pixel(0, 6, '#74b9ff');
    },
    // 幸运骰子：白色骰子 3 点
    lucky_dice: d => {
        d.rect(2, 2, 8, 8, '#ecf0f1');
        d.rect(2, 2, 8, 1, '#ffffff');
        d.vLine(9, 2, 8, '#bdc3c7');
        d.hLine(2, 9, 8, '#95a5a6');
        d.pixel(4, 4, OUT);
        d.pixel(6, 6, OUT);
        d.pixel(8, 8, OUT);
    },
    // 余烬弹头：子弹 + 火焰尾
    ember_rounds: d => {
        d.rect(6, 4, 4, 3, '#95a5a6');
        d.pixel(10, 5, '#bdc3c7');
        d.rect(2, 4, 4, 3, '#e67e22');
        d.pixel(1, 5, '#f39c12');
        d.pixel(0, 4, '#f1c40f');
        d.pixel(3, 3, '#f39c12');
        d.pixel(2, 8, '#e74c3c');
    },
    // 霜寒弹头：子弹 + 冰晶
    frost_rounds: d => {
        d.rect(6, 4, 4, 3, '#95a5a6');
        d.pixel(10, 5, '#bdc3c7');
        d.vLine(3, 2, 7, '#74d0f0');
        d.hLine(1, 5, 5, '#74d0f0');
        d.pixel(2, 3, '#aee6f7');
        d.pixel(4, 7, '#aee6f7');
        d.pixel(4, 3, '#dff6fc');
        d.pixel(2, 7, '#dff6fc');
    },
    // 穿甲尖端：青色箭头贯穿墙
    piercing_tip: d => {
        d.vLine(6, 1, 10, '#6d5a65');
        for (let i = 0; i < 4; i++) {
            d.hLine(2 + i, 3 + i, 1, '#00cec9');
            d.hLine(2 + i, 8 - i, 1, '#00cec9');
        }
        d.hLine(2, 5, 8, '#00cec9');
        d.hLine(2, 6, 8, '#00a8a3');
        d.pixel(10, 5, '#dff6fc');
    },
    // 弹性外壳：弹跳球 + 轨迹
    rubber_shell: d => {
        d.rect(7, 7, 3, 3, '#e84393');
        d.pixel(7, 7, '#fd79a8');
        d.pixel(2, 2, '#fd79a8');
        d.pixel(3, 4, '#fd79a8');
        d.pixel(4, 6, '#fd79a8');
        d.pixel(5, 8, '#fd79a8');
        d.hLine(1, 10, 10, '#6d5a65');
    },
    // 爆裂火药：炸弹 + 火花
    blast_powder: d => {
        d.rect(3, 5, 5, 5, '#2d3436');
        d.pixel(4, 6, '#636e72');
        d.vLine(7, 3, 2, '#8b5a2b');
        d.pixel(8, 2, '#f39c12');
        d.pixel(9, 1, '#f1c40f');
        d.pixel(10, 3, '#e74c3c');
    },
    // 分裂弹膛：一颗分裂为两颗
    split_chamber: d => {
        d.rect(1, 5, 3, 2, '#95a5a6');
        d.pixel(4, 5, '#bdc3c7');
        d.rect(7, 2, 3, 2, '#f1c40f');
        d.rect(7, 8, 3, 2, '#f1c40f');
        d.pixel(6, 4, '#d4a017');
        d.pixel(6, 7, '#d4a017');
        d.pixel(5, 5, '#d4a017');
        d.pixel(5, 6, '#d4a017');
    },
    // 重型口径：大号子弹
    heavy_caliber: d => {
        d.rect(2, 4, 6, 5, '#b8860b');
        d.rect(8, 4, 2, 5, '#f1c40f');
        d.pixel(10, 5, '#f1c40f');
        d.pixel(10, 7, '#f1c40f');
        d.pixel(11, 6, '#fff3b0');
        d.rect(2, 4, 1, 5, '#8a6d1a');
        d.hLine(3, 4, 4, '#e6c14d');
    },
    // 反应装甲：盾牌 + 冲击弧
    reactive_plate: d => {
        d.rect(4, 2, 4, 6, '#4a7fb5');
        d.vLine(3, 3, 4, '#4a7fb5');
        d.vLine(8, 3, 4, '#2f5a8a');
        d.hLine(5, 8, 2, '#2f5a8a');
        d.pixel(5, 3, '#7fa8d4');
        d.pixel(10, 4, '#f1c40f');
        d.pixel(11, 6, '#f1c40f');
        d.pixel(1, 4, '#f1c40f');
        d.pixel(0, 6, '#f1c40f');
    },
    // 汲血獠牙：白色獠牙 ×2 + 血滴
    leech_fang: d => {
        d.vLine(3, 2, 5, '#ecf0f1');
        d.vLine(4, 2, 3, '#bdc3c7');
        d.pixel(3, 7, '#ecf0f1');
        d.vLine(8, 2, 5, '#ecf0f1');
        d.vLine(7, 2, 3, '#bdc3c7');
        d.pixel(8, 7, '#ecf0f1');
        d.pixel(6, 9, '#e74c3c');
        d.pixel(6, 10, '#c0392b');
    },
    // 狂战图腾：图腾面具
    berserker_totem: d => {
        d.rect(3, 1, 6, 10, '#8b5a2b');
        d.rect(3, 1, 6, 1, '#a8713a');
        d.rect(4, 3, 1, 2, '#e74c3c');
        d.rect(7, 3, 1, 2, '#e74c3c');
        d.hLine(4, 7, 4, OUT);
        d.pixel(5, 8, OUT);
        d.pixel(6, 8, OUT);
        d.vLine(3, 1, 10, '#6e4520');
    },
    // 黄金神像：金色小雕像
    golden_idol: d => {
        d.rect(5, 1, 2, 2, '#f1c40f');
        d.rect(4, 3, 4, 4, '#f1c40f');
        d.rect(3, 4, 1, 2, '#d4a017');
        d.rect(8, 4, 1, 2, '#d4a017');
        d.rect(4, 7, 4, 1, '#b8860b');
        d.rect(3, 9, 6, 2, '#b8860b');
        d.pixel(5, 3, '#fff3b0');
        d.pixel(5, 1, '#fff3b0');
    },
    // 寻宝透镜：放大镜
    treasure_scope: d => {
        d.rect(3, 2, 4, 1, '#4a7fb5');
        d.rect(3, 6, 4, 1, '#2f5a8a');
        d.vLine(2, 3, 3, '#4a7fb5');
        d.vLine(7, 3, 3, '#2f5a8a');
        d.rect(3, 3, 4, 3, '#aee6f7');
        d.pixel(4, 3, '#dff6fc');
        d.pixel(8, 7, '#8b5a2b');
        d.pixel(9, 8, '#8b5a2b');
        d.pixel(10, 9, '#6e4520');
    },
};

/**
 * 生成全部遗物图标。
 * @returns {Object<string, HTMLCanvasElement>} id → 12×12 Canvas
 */
export function createRelicIcons() {
    const icons = {};
    for (const [id, fn] of Object.entries(DRAWERS)) {
        icons[id] = icon(fn);
    }
    return icons;
}
