// F2 教团圣殿层主题模板 —— 「深渊监狱」中层：裂渊会据点。
// 邪教把废弃监狱中层改成圣殿，暗青石、成片烛火、挂毯、血祭阵——
// 越往里越会发现：他们不是主人，是被最深处之物引来的祭品。
// 故事主线见 docs/feature/DUNGEON_ROOM_STORY_OVERHAUL.md。
// 本文件由 F2 房间设计 agent 独占编辑，全部模板带 floors: [2]。
//
// 图例（复用 EncounterTemplates 头注释）：# 内墙  p 坑  c 掩体  d 装饰  .空地
//   m/r/h/e 波1  M/R/H/E 波2（角色→敌人由 FloorConfigs.roleMap[2] 映射：
//   m=炼狱僧侣近战  r=堕落法师/弹幕怨眼  h=重装护卫  e=召唤师）。
// legend 叙事物件：
//   w 教团长椅  l 讲坛  a 烛坛  b 挂毯  n 落地烛台  k 书架
//   u 炼金坩埚  s 药剂架  v 工作台  g 管风琴残骸  y 圣物展柜  z 血祭石  i 铁囚笼
import { T } from './defineTemplate.js';

export const F2_TEMPLE_TEMPLATES = [

    // ═══════════ 浅层：入圣热身（波1 4 → 波2 4） ═══════════

    // 入圣道（仪式前厅）：一条红毯直道两侧列满长椅与落地烛台，尽头供着烛坛与双挂毯。
    // 信徒本在长椅间垂首默祷，闯入者一到，僧侣纷纷从椅列起身合围。
    T('temple_processional', 'shallow', 1.5, [
        '.b..n.a.n..b..',
        '..............',
        '.ww......ww...',
        '..m......m....',
        '.ww......ww...',
        '....m..m......',
        '.ww......ww...',
        '..M..MM..M....',
        '.n........n...'
    ], { w: 'temple_pew', n: 'temple_candelabra', a: 'dungeon_altar', b: 'dungeon_banner' },
        { floors: [2], floorType: 'TEMPLE_CARPET' }),

    // 烛室（光海）：数十落地烛台排成方阵，烛影里僧侣贴着光柱游走突进。
    // 无远程、纯近战的开阔混战——考验的是在光海间穿行走位。
    T('temple_candle_vigil', 'shallow', 1.5, [
        '.n.n.n.n.n.n..',
        '..............',
        '..m.......m...',
        '.n.n.n.n.n.n..',
        '......mm......',
        '.n.n.n.n.n.n..',
        '..M.......M...',
        '....M...M.....',
        '.n.n.n.n.n.n..'
    ], { n: 'temple_candelabra' },
        { floors: [2], floorType: 'TEMPLE_TILES' }),

    // ═══════════ 中层：组合威胁（波1 4 → 波2 4，含法师弹幕） ═══════════

    // 大礼拜堂（异形·凹龛圣坛）：后墙 # 围出内凹的圣坛龛，龛内烛坛夹讲坛、垂两幅挂毯；
    // 长厅红毯通道两侧长椅成排。堕落法师立于龛前诵咒，僧侣自椅列间起身涌上。
    T('temple_grand_chapel', 'mid', 1.6, [
        '..#........#..',
        '..#.a.l.a..#..',
        '..#.r....r.#..',
        '..#b......b#..',
        '.ww.c..c.ww...',
        '..m......m....',
        '.wwww..wwww...',
        '...M....M.....',
        '.wwww..wwww...',
        '..R......R....',
        '.b........b...'
    ], { w: 'temple_pew', l: 'temple_pulpit', a: 'dungeon_altar', b: 'dungeon_banner' },
        { floors: [2], floorType: 'TEMPLE_CARPET' }),

    // 藏书馆（禁书迷宫）：书架成列切出穿行窄道，散落几座诵读烛坛。
    // 堕落法师藏在书列后放冷术冷箭，绕架推进才能贴脸。
    T('temple_forbidden_library', 'mid', 1.5, [
        '.kk.kk.kk.kk..',
        '..............',
        '.r.k....k..r..',
        '.kk......kk...',
        '....k..k......',
        '.m..c..c..m...',
        '.kk......kk...',
        '...a....a.....',
        '.R.k....k..R..',
        '.kk.kk.kk.kk..',
        '......MM......'
    ], { k: 'bookshelf', a: 'dungeon_altar' },
        { floors: [2], floorType: 'TEMPLE_TILES' }),

    // 炼金室：翻沸的坩埚与列墙的药剂架，中央并排工作台。
    // 试剂桶（掩体）遍布，近战冲阵易引燃、法师随后压制。
    T('temple_alchemy_lab', 'mid', 1.5, [
        '.sss....sss...',
        '..............',
        '.u..c..c..u...',
        '...r....r.....',
        '.v..........v.',
        '....m..m......',
        '.u...vv...u...',
        '..............',
        '.s.R......R.s.',
        '...M......M...',
        '.sss....sss...'
    ], { s: 'potion_shelf', u: 'alchemy_cauldron', v: 'workbench' },
        { floors: [2], floorType: 'TEMPLE_TILES' }),

    // 唱诗席（异形·阶梯坛）：# 阶梯把厅堂雕成金字塔形高台，顶端是仍在自鸣的管风琴残骸。
    // 堕落诗班居高放术，僧侣自阶前长椅间起身；掉落的圣诗集（掩体）散在阶下。
    T('temple_choir_ruin', 'mid', 1.5, [
        '####.gggg.####',
        '###.r....r.###',
        '##wwww..wwww##',
        '#...wwww.ww..#',
        '..c........c..',
        '....m....m....',
        '..............',
        '...M......M...',
        '......MM......',
        '..............',
        '.b........b...'
    ], { w: 'temple_pew', g: 'broken_organ', b: 'dungeon_banner' },
        { floors: [2], floorType: 'TEMPLE_CARPET' }),

    // 忏悔间（异形·囚牢阵）：上下两排 # 砌成的忏悔小间，每间锁着铁囚笼或烛坛——
    // 被引来的"祭品"就关在这里。法师看守长廊，僧侣从间隙涌出。
    T('temple_penitent_cells', 'mid', 1.5, [
        '.###..###.###.',
        '.#i#..#a#.#i#.',
        '..m......m....',
        '.r..c..c..r...',
        '..............',
        '...M......M...',
        '....M..M......',
        '.#i#..#a#.#i#.',
        '.###..###.###.',
        '..b..n..n..b..',
        '..............'
    ], { i: 'dungeon_iron_cage', a: 'dungeon_altar', b: 'dungeon_banner', n: 'temple_candelabra' },
        { floors: [2], floorType: 'RITUAL_DARK' }),

    // ═══════════ 深层：高压仪式（波1 3-4 → 波2 4，含召唤师） ═══════════

    // 血祭坛（异形·环坑法阵）：中央血祭石被一圈深渊坑环绕，四向仅留窄桥；
    // 召唤师立于阵心引渊，两侧烛台照着祭台，僧侣绕坑扑来——打断仪式会激怒全场。
    T('temple_blood_altar', 'deep', 1.6, [
        '..............',
        '..m......m....',
        '.....n..n.....',
        '...ppp..ppp...',
        '...p......p...',
        '......ze......',
        '...p......p...',
        '...ppp..ppp...',
        '..M......M....',
        '....E..E......',
        '..............'
    ], { n: 'temple_candelabra', z: 'sacrifice_slab' },
        { floors: [2], floorType: 'RITUAL_DARK' }),

    // 圣物库（异形·十字库）：四角封 #、走道成十字，四臂玻璃展柜陈列圣骨遗物，
    // 中央供着最珍贵的一具。法师守臂、精英镇心，闯入者要在交叉火力下夺宝。
    T('temple_reliquary_vault', 'deep', 1.5, [
        '####y.rr.y####',
        '####y....y####',
        '####..yy..####',
        '####..aa..####',
        'y..m....m..y..',
        '....c.aa.c....',
        'y..M....M..y..',
        '####..RR..####',
        '####y....y####',
        '####..yy..####',
        '####..aa..####'
    ], { y: 'reliquary_case', a: 'dungeon_altar' },
        { floors: [2], floorType: 'TEMPLE_TILES' }),

    // 深渊之喉（异形·献祭井）：厅心是一口通往深渊的巨井（大片坑），仅十字窄道横跨；
    // 井口血祭石旁立着烛台，召唤师在窄道上引渊低语，祭品被推入井中。
    T('temple_abyss_maw', 'deep', 1.6, [
        '..............',
        '..m......m....',
        '....n.zz.n....',
        '...ppp..ppp...',
        '...ppp..ppp...',
        '....e....e....',
        '...ppp..ppp...',
        '...ppp..ppp...',
        '..M......M....',
        '...M......M...',
        '..............'
    ], { n: 'temple_candelabra', z: 'sacrifice_slab' },
        { floors: [2], floorType: 'RITUAL_DARK' })
];
