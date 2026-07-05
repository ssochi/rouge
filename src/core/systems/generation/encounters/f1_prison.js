// F1 监狱层主题模板 —— 「深渊监狱」上层：囚区、刑房、狱卒岗哨。
// 故事主线见 docs/feature/DUNGEON_ROOM_STORY_OVERHAUL.md。
// 本文件由 F1 房间设计 agent 独占编辑，全部模板需带 floors: [1]。
//
// 图例（EncounterTemplates.js 头注释）：# 内墙 / p 坑 / c 掩体 / d 装饰 / . 空地；
//   m r h e 波1（近战/远程/重装/精英） MRHE 波2；其余字符由 legend 映射为具体物件。
// 本层专属地板：PRISON_CELLBLOCK 铁锈格栅 / PRISON_WET 湿滑石板 / PRISON_BLOOD 血渍石板。
// 本层新物件：prison_cell_door 铁栏牢门 / prison_file_cabinet 档案柜 / prison_locker 储物柜 /
//   prison_dirt_mound 越狱土堆 / prison_visit_booth 探视隔离台 / prison_watchtower 瞭望塔基座 / prison_bunk 囚室铁床。
import { T } from './defineTemplate.js';

export const F1_PRISON_TEMPLATES = [
    // ═══════════ 浅层 ═══════════

    // 双排囚区·破栏：两排牢门夹一条走道，中段两扇栏杆被从内侧硬生生撞弯——
    // 囚魂从这里破笼涌出，牢口散落着啃剩的骨堆，狱卒亡骨随后从两端合围。
    T('f1_cell_block_breakout', 'shallow', 1.7, [
        '.n.n.n..n.n.n.',
        '..............',
        '..m..b.b..m...',
        '...j......j...',
        '..c........c..',
        '.....r..r.....',
        '..M........M..',
        '..............',
        '.....H..H.....',
        '.n.n.n..n.n.n.'
    ], { n: 'prison_cell_door', b: 'dungeon_bars', j: 'dungeon_bone_pile' },
        { floors: [1], floorType: 'PRISON_CELLBLOCK' }),

    // 狱卒休息室：牌桌上的牌局散了一半，一排储物柜靠墙立着。
    // 换岗的狱卒亡骨闻声而起，弩手从柜子后面探头压制。木地板是这里少有的暖意。
    T('f1_guard_lounge', 'shallow', 1.6, [
        '.l.l.l.l.l.l.',
        '.............',
        '...tq.qt.....',
        '..m.......m..',
        '.....q.q.....',
        '..c.......c..',
        '.....r.r.....',
        '..M.......M..',
        '.....HH......',
        '.l.l.l.l.l.l.'
    ], { l: 'prison_locker', t: 'table', q: 'chair' },
        { floors: [1], floorType: 'WOOD' }),

    // 探视室（异形·一分为二）：一道隔栏把房间劈成探视区与受审区，
    // 防砸玻璃碎了满地，隔离台还立着。探视者与囚犯都留在了各自那侧——如今两边一起涌来。
    T('f1_visitation_room', 'shallow', 1.5, [
        '..q.q.#.q.q..',
        '......#......',
        '..m...#...m..',
        '..s...#...s..',
        '..c.......c..',
        '..........r..',
        '..M...#...M..',
        '..s...#...s..',
        '....H...H....',
        '..q.q.#.q.q..'
    ], { s: 'prison_visit_booth', q: 'chair' },
        { floors: [1], floorType: 'PRISON_WET' }),

    // ═══════════ 中层 ═══════════

    // 放风场（异形·环形）：中央瞭望塔在暴动里坍成一截孤零零的石基（实体岛），
    // 塔身斜插其上；四周锈铁围栏圈着操场。囚魂绕塌塔围攻，狱卒自残塔哨位向下压制。
    T('f1_exercise_yard', 'mid', 1.6, [
        '.............',
        '..m.......m..',
        '....r...r....',
        '.....###.....',
        '.....###.....',
        '......w......',
        '..c.......c..',
        '....M...M....',
        '.b.........b.',
        '..M...H...M..',
        '.............'
    ], { w: 'prison_watchtower', b: 'dungeon_bars' },
        { floors: [1], floorType: 'DIRT' }),

    // 刑讯室：两侧 X 形刑架与铁笼列队，中央审讯台上器械未收，脚下是常年不干的湿石板。
    // 狱卒亡骨还在对着空椅“行刑”——你一踏入，它们齐齐转向。
    T('f1_torture_room', 'mid', 1.6, [
        '.x..i....i..x.',
        '..............',
        '..m........m..',
        '...c......c...',
        '.....t..t.....',
        '......r.......',
        '..M........M..',
        '.....j..j.....',
        '.x..i.HH.i..x.',
        '..............'
    ], { x: 'dungeon_rack', i: 'dungeon_iron_cage', t: 'table', j: 'dungeon_bone_pile' },
        { floors: [1], floorType: 'PRISON_WET' }),

    // 档案室：成排铁皮档案柜夹着查阅桌，散落的卷宗记着一个个实验编号。
    // 潜伏的禁术研究者（精英）不许你翻看，增援的弩手随后从柜阵后齐射。
    T('f1_archive_room', 'mid', 1.6, [
        '.k.k.k..k.k.k.',
        '..............',
        '..m........m..',
        '...tq....qt...',
        '..c........c..',
        '.....e........',
        '..............',
        '.....R..R.....',
        '..M........M..',
        '.k.k.k..k.k.k.',
        '....H....H....'
    ], { k: 'prison_file_cabinet', t: 'table', q: 'chair' },
        { floors: [1], floorType: 'PRISON_CELLBLOCK' }),

    // ═══════════ 深层 ═══════════

    // 越狱现场（异形·L 型）：一间被凿穿的囚室，墙角在越狱中整个塌垮（实体废墟占角），
    // 墙下是挖洞掏出的新土堆，铁床被拖到洞口挡人。逃犯走了，惊动的东西没走。
    T('f1_jailbreak_tunnel', 'deep', 1.6, [
        '..........####',
        '.u.....m..####',
        '..........####',
        '....z.........',
        '..m.....r.....',
        '.....c...c....',
        '..b...........',
        '.....M...R....',
        '..z...........',
        '....M.....H...',
        '.u............'
    ], { z: 'prison_dirt_mound', b: 'dungeon_bars', u: 'prison_bunk' },
        { floors: [1], floorType: 'PRISON_CELLBLOCK' }),

    // D 区禁闭室（异形·十字）：D 区最底的单独禁闭室，四角封死逼出十字形空间，
    // 血渍从中央漫开。挣脱刑架的“实验体”前身伏在正中（精英），铁笼与刑架环绕，弩手据高压制。
    T('f1_d_block_solitary', 'deep', 1.5, [
        '####......####',
        '####..r...####',
        '####......####',
        '..c.......c...',
        '...i..M...i...',
        '.....m..m.....',
        '......e.......',
        '.....x..x.....',
        '####..M...####',
        '####.R..R.####',
        '####..j.j.####'
    ], { i: 'dungeon_iron_cage', x: 'dungeon_rack', j: 'dungeon_bone_pile' },
        { floors: [1], floorType: 'PRISON_BLOOD' }),

    // 监控中枢：监视器墙还在放着雪花噪讯，控制台后狱卒亡骨死守岗位。
    // 你一进门，弩手从台后齐射，铁栏围出的岗哨挡着你的走位。
    T('f1_surveillance_room', 'deep', 1.5, [
        '.v.v.v..v.v.v.',
        '..............',
        '..o.o....o.o..',
        '...m......m...',
        '..c........c..',
        '.....r..r.....',
        '..............',
        '..M........M..',
        '.....HH.......',
        '.b.b......b.b.'
    ], { o: 'computer_desk', v: 'tv_stand', b: 'dungeon_bars' },
        { floors: [1], floorType: 'PRISON_CELLBLOCK' })
];
