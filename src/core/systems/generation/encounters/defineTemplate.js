// defineTemplate —— 遭遇战模板定义助手（楼层主题模板文件共用）。
// 字符画图例见 EncounterTemplates.js 头注释。
//
// opts 可选字段：
//   floors:    [1] / [2] / [3]  楼层亲和，只在对应楼层出现
//   floorType: 'WOOD' 等 FLOOR_TYPES 键名 —— 该房间内部整体替换地板材质
export const T = (id, tier, weight, rows, legend, opts = {}) =>
    ({ id, tier, weight, rows, legend, ...opts });
