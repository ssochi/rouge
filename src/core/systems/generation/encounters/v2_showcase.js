// v2_showcase —— 房间系统 V2 代码构建器示范房（5 间）。
//
// 全部是「字符画做不出来」的形态：圆厅、放射对称、参数化列数、同心环、逐格地板画。
// 每间至少用到 1 个种子变体参数（count 区间 / scatter 落点），同 id 不同种子产生可见差异。
// 故事贴三层主题：F1 监狱 / F2 圣殿 / F3 实验室（floors 亲和 + tier 分布）。
//
// 授权前端为 RoomBuilder（见 rooms/RoomBuilder.js），产物为 RoomPlan（IR），
// 经 EncounterTemplates 的选池与 placeEncounter 进入与字符模板完全相同的下游管线。

import { defineRoom } from '../rooms/RoomBuilder.js';

// ══════════════════════════════════════════════════════════════════
// 1) 圆形大厅（F2 圣殿）—— ellipse 圆厅 + 环形烛台 + 中央祭坛 + 放射出怪
//    邪教把监狱中层的圆形集会堂改成圣殿：红毯镶边的青石圆厅，一圈落地烛台
//    绕着中央血祭石，堕落法师沿放射线诵咒，僧侣自四缘涌上。
//    变体：外圈烛台留缺口位随种子偏移，波2 僧侣数量 5-7。
// ══════════════════════════════════════════════════════════════════
export const showcase_circular_hall = defineRoom('v2_circular_hall',
    { tier: 'mid', floors: [2], weight: 1.5, w: 15, h: 15, floorType: 'TEMPLE_TILES',
      story: '圆形集会堂改成的圣殿，烛火绕着中央血祭石' },
    (R) => {
        R.shape.ellipse();                                        // 圆厅（字符画做不到）
        R.floor.fill('TEMPLE_TILES').border('TEMPLE_CARPET', 2);  // 青石地 + 双圈红毯镶边
        R.objects.place('sacrifice_slab', 0.5, 0.5);             // 中央血祭石
        // 外圈落地烛台（留一处缺口作入口感，缺口位随种子偏移）
        const gap = 6 + Math.floor(R.rng() * 6);                  // 变体：缺口起始索引 6-11
        R.objects.ring('temple_candelabra', { radius: 0.74, count: 12, skip: [gap, (gap + 1) % 12] });
        R.objects.ring('dungeon_altar', { radius: 0.4, count: 4 }); // 内圈四座小祭坛
        // 放射出怪：波1 法师沿内环诵咒
        R.spawns.wave(1).ring('r', { radius: 0.52, count: 4 });
        R.spawns.wave(1).at('e', 0.5, 0.2);                       // 台前召唤师
        // 波2 僧侣自四缘涌上（数量随种子 5-7）
        R.spawns.wave(2).cluster('m', { count: [5, 7], near: 'edges' });
    });

// ══════════════════════════════════════════════════════════════════
// 2) 放射对称八向柱阵（F3 实验室）—— rot4 对称 + 参数化柱环留缺口
//    实验区中枢的反应堆芯外，八根承重柱呈放射列阵。rot4 把一条「辐条」
//    （柱列 + 哨戒位 + 掩体）旋转成四向全等，配合八向柱环围出对称杀场。
//    变体：柱环缺口数量随种子（1 或 2 处），改变突入路线。
// ══════════════════════════════════════════════════════════════════
export const showcase_radial_pillars = defineRoom('v2_radial_pillars',
    { tier: 'mid', floors: [3], weight: 1.4, w: 13, h: 13, floorType: 'LAB_TILE',
      story: '反应堆芯外的八向承重柱放射列阵' },
    (R) => {
        R.shape.rect();                                           // 方厅（rot4 需方形）
        R.floor.fill('LAB_TILE').border('LAB_GRATE', 1);          // 白瓷砖 + 格栅镶边
        R.objects.place('f3_reactor_core', 0.5, 0.5);            // 中央反应堆芯
        // 参数化八向柱环，缺口位随种子旋转（对向双缺口，改变突入路线）
        const g = Math.floor(R.rng() * 8);
        R.objects.ring('dungeon_pillar', { radius: 0.62, count: 8, skip: [g, (g + 4) % 8] });
        // 一条辐条：柱列外的掩体 + 哨戒炮位，rot4 复制成四向全等
        R.objects.cover(2, 2);
        R.spawns.wave(1).at('r', 1, 1);                          // 角落哨戒炮（塔防位）
        R.spawns.wave(2).at('m', 3, 1);
        R.rot4();                                                 // 放射对称：四向全等
        R.objects.scatter('dungeon_rubble', { count: [2, 4] });  // 变体：崩落碎石散布
        R.spawns.wave(2).at('e', 0.5, 0.5);                     // 芯前精英压轴
    });

// ══════════════════════════════════════════════════════════════════
// 3) 参数化柱廊（F1 监狱）—— row 柱列数随种子 2-4 列 + scatter 杂物
//    废弃的监区通廊，成列铁柱把长厅切成穿行窄道。柱列数量每局不同，
//    骨堆与瓦砾散落其间，远程囚徒藏在柱后放冷枪，狱卒随后清场。
//    变体：柱列数 2-4（列数变则走位路线全变）；骨堆散布 2-5 个。
// ══════════════════════════════════════════════════════════════════
export const showcase_colonnade = defineRoom('v2_colonnade',
    { tier: 'shallow', floors: [1], weight: 1.5, w: 13, h: 11, floorType: 'PRISON_WET',
      story: '成列铁柱切出穿行窄道的监区通廊' },
    (R) => {
        R.shape.rect();
        R.floor.fill('PRISON_WET').border('PRISON_CELLBLOCK', 1);
        // 参数化柱列：2-4 列（种子变体），每列一竖排铁柱
        const cols = 2 + Math.floor(R.rng() * 3);                 // 变体：2/3/4 列
        for (let c = 0; c < cols; c++) {
            const t = cols === 1 ? 0.5 : c / (cols - 1);
            const x = 2 + Math.round(t * (R.w - 5));              // 柱列均匀分布于内区
            R.objects.row('dungeon_pillar', { from: [x, 1], to: [x, R.h - 2], count: 4 });
        }
        R.objects.scatter('dungeon_bone_pile', { count: [2, 5] }); // 变体：骨堆散布
        // 远程囚徒藏柱后 + 近战涌入
        R.spawns.wave(1).at('r', 1, 0.3);
        R.spawns.wave(1).at('r', 11, 0.7);
        R.spawns.wave(1).cluster('m', { count: [3, 4], near: 'center' });
        R.spawns.wave(2).cluster('m', { count: [4, 6], near: 'edges' });
        R.spawns.wave(2).at('h', 0.5, 0.5);
    });

// ══════════════════════════════════════════════════════════════════
// 4) 同心环回廊（F2 圣殿）—— 双层 carveEllipse 嵌套环形走道 + 环上出怪
//    圆形圣殿的核心：外圈 ellipse 圈出圆厅，carveEllipse 掏空中央成深渊井口
//    （坑），留下一圈环形走道；一圈立柱把回廊分作内外双线，缺口处才能穿越。
//    信徒绕环巡游，法师踞守环线，逼你在双线间的缺口抢位。
//    变体：立柱环缺口位随种子偏移；环上巡游者 4-6。
// ══════════════════════════════════════════════════════════════════
export const showcase_concentric_ring = defineRoom('v2_concentric_ring',
    { tier: 'mid', floors: [2], weight: 1.4, w: 15, h: 15, floorType: 'RITUAL_DARK',
      story: '中央深渊井环绕的圆形回廊，立柱分作内外双线' },
    (R) => {
        // 双层 carveEllipse 嵌套：外盘→挖中盘留外环→加回内盘→挖中心留内环，
        // 再用十字连廊把内外双环接通（避免封死），形成真正的「同心双环回廊」。
        // 半径用整数=绝对 tile（15x15，中心 7,7，外盘半径 7.5）
        R.shape.ellipse();                                        // 外盘（满圆）
        R.shape.carveEllipse(0.5, 0.5, 5, 5);                   // 挖中盘 → 外环走道 [5..7.5]
        R.shape.union((s) => s.ellipse(0.5, 0.5, 4, 4));        // 加回内盘（嵌套椭圆），墙带 [4..5]
        R.shape.carveEllipse(0.5, 0.5, 2, 2);                  // 挖中心 → 内环走道 [2..4]
        R.shape.union((s) => s.rect(7, 0, 1, 15));             // 竖向连廊接通内外环
        R.shape.union((s) => s.rect(0, 7, 15, 1));             // 横向连廊接通内外环
        R.floor.fill('RITUAL_DARK').border('TEMPLE_CARPET', 1);  // 祭阵黑石 + 红毯外沿
        // 环上立柱与烛台（外环立柱缺口随种子偏移）
        const g = Math.floor(R.rng() * 8);
        R.objects.ring('dungeon_pillar', { radius: 0.86, count: 8, skip: [g, (g + 4) % 8] });
        R.objects.ring('temple_candelabra', { radius: 0.42, count: 4 });
        R.objects.scatter('dungeon_bone_pile', { count: [2, 4] }); // 变体：环上骨堆散布
        // 环上出怪：外环巡游者 + 内环法师
        R.spawns.wave(1).ring('r', { radius: 0.44, count: 4 });
        R.spawns.wave(2).ring('m', { radius: 0.86, count: [4, 6] });
        R.spawns.wave(2).at('e', 0.5, 0.5);
    });

// ══════════════════════════════════════════════════════════════════
// 5) 渐变污渍大厅（F1 监狱）—— floor.scatter 血渍 + checker 拼花
//    逐格地板层的首秀：铁锈格栅与湿石板棋盘拼花铺满全厅，中央一滩浓血向外
//    飞溅渐稀——「地板本身就是一张像素画」。刑场中央围观席环列，处刑者当场行刑。
//    变体：血渍飞溅数量 12-24（每局污渍图案不同）。
// ══════════════════════════════════════════════════════════════════
export const showcase_stain_hall = defineRoom('v2_stain_hall',
    { tier: 'mid', floors: [1], weight: 1.5, w: 14, h: 11,
      story: '格栅湿石拼花铺地、中央浓血外溅的刑场大厅' },
    (R) => {
        R.shape.rect();
        // 逐格地板画：棋盘拼花打底
        R.floor.checker('PRISON_CELLBLOCK', 'PRISON_WET');
        // 中央浓血滩 + 向外飞溅渐稀（渐变污渍）
        R.floor.rect('PRISON_BLOOD', 0.32, 0.32, 0.36, 0.36);
        R.floor.scatter('PRISON_BLOOD', { count: [12, 24] });    // 变体：飞溅点数
        // 中央刑架 + 四角围观掩体
        R.objects.place('dungeon_rack', 0.5, 0.5);
        R.objects.cover(2, 2); R.objects.cover(11, 2);
        R.objects.cover(2, 8); R.objects.cover(11, 8);
        // 处刑者居中 + 围观人潮两波
        R.spawns.wave(1).at('h', 0.5, 0.28);
        R.spawns.wave(1).cluster('m', { count: [3, 4], near: 'edges' });
        R.spawns.wave(2).cluster('m', { count: [4, 6], near: 'edges' });
        R.spawns.wave(2).at('e', 0.5, 0.72);
    });

// 汇总导出（EncounterTemplates 选池聚合消费）
export const V2_SHOWCASE_ROOMS = [
    showcase_circular_hall,
    showcase_radial_pillars,
    showcase_colonnade,
    showcase_concentric_ring,
    showcase_stain_hall
];
