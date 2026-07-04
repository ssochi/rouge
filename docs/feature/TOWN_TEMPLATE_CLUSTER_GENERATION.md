# 大规模模板化小镇生成

## 目标
- 将 `construction/game` 地图升级为大规模聚落型小镇。
- 地图尺寸从原先的小型固定世界切换到 `420x420 tiles`，总面积约为旧地图的 10 倍。
- 建筑不再主要依赖随机外框 + BSP 切房，而是改为“建筑模板 + 房间模板”的组合生成。
- 在地图变大的同时，运行时性能不能明显劣化。

## 总体结构

### 1. 地图 profile
`src/core/maps/MapProfiles.js` 按地图类型定义：
- 世界 tile 宽高
- 导航网格粒度
- 局部流场半径
- 是否启用地板 chunk cache
- 使用哪条生成 preset

当前配置：
- `hub/test/dungeon/dungeon_f2`: `130x130`
- `construction/game`: `420x420`

### 2. 小镇生成主链路
`construction/game` 现在走 `TownLayoutGenerator.js`：

1. `TownDistrictPlanner`
   - 生成中心广场
   - 生成十字主街
   - 生成外圈次级道路
   - 划分商业、混合住宅、外圈住宅、服务边缘 block
2. `TownBlockAllocator`
   - 按 block 类型和密度分配建筑簇
   - 支持 `street_row / mixed_row / paired_houses / courtyard_cluster`
3. `BuildingTemplateLibrary`
   - 选择建筑模板
4. `BuildingTemplateAssembler`
   - 将模板旋转到目标朝向
   - 生成房间、门、墙 tile
   - 调用 `FurniturePlacer` 补室内家具
   - 调用 `LayoutValidator` 做连通性和家具约束校验
5. `LayoutCompiler`
   - 输出 breakable 定义
6. `FloorMapGenerator`
   - 生成地板
   - 额外绘制广场、道路和建筑入口到道路的步道
7. `OutdoorPlacer`
   - 在自然地表补植被和户外杂物

## 模板体系

### 房间模板
房间模板在 `RoomTemplateLibrary.js` 中定义，目前覆盖：
- `entry_foyer`
- `common_living`
- `common_inn`
- `bedroom_standard`
- `bedroom_compact`
- `kitchen_service`
- `bathroom_compact`
- `study_nook`
- `office_front`
- `retail_front`
- `workshop_floor`
- `clinic_bay`
- `storage_stock`
- `central_hall`

房间模板负责声明：
- 房间语义
- 最小尺寸约束

建筑模板只需要声明：
- 房间槽位的矩形尺寸
- 每个槽位引用哪个房间模板

### 建筑模板
建筑模板在 `BuildingTemplateLibrary.js` 中定义，共 24 套：
- 住宅 10 套
- 商业 8 套
- 服务 6 套

每套模板包含：
- 建筑 footprint
- 房间槽位
- 门位
- 适用 district
- 权重

模板支持四向旋转，因此同一套模板可以适配不同街道朝向。

## 聚落骨架

### 中心区域
- 中央固定生成一个广场
- 广场穿过十字主街
- 广场四周优先生成高密度商业街

### 中圈
- 主街外侧生成混合住宅 block
- 混合区同时允许住宅、少量商业和服务建筑混排

### 外圈
- 四角区域生成成对住宅簇
- 上下左右边缘生成服务区 block
- 外圈保留更多自然地表，用于形成聚落边界感

## 性能策略

### 1. 动态世界尺寸
`WorldSystem` 不再把所有地图都绑定到全局 `MAP_WIDTH/MAP_HEIGHT`：
- 切图时读取 `MapProfiles`
- 动态重建 Camera 边界
- 动态重建 `NavigationGrid`
- 动态重建 `ObstacleSpatialIndex`

### 2. 局部流场
`NavigationGrid.updateLocalFlowField()` 只对玩家附近窗口计算流场：
- 避免大地图整图 BFS
- 保持敌人寻路开销稳定

### 3. 地板分块缓存
420×420 小镇地图默认启用 `FloorChunkCache`：
- 不再构建单张超大 `floorCanvas`
- 只渲染和缓存当前可见区域附近 chunk
- Renderer 优先绘制 chunk cache

### 4. 建筑数量预算
`TownBlockAllocator` 会控制全图建筑预算，当前生成结果大致在 33~36 栋：
- 保持聚落密度
- 避免运行时对象数失控

### 5. 户外装饰数量上限
大镇地图不能再沿用“小地图按全图概率铺草木”的方式，否则会一次性实例化数万对象。

当前做法：
- `TownLayoutGenerator` 对 `OutdoorPlacer` 传入大镇专用低密度配置
- `OutdoorPlacer` 新增：
  - `vegetationSampleStep`
  - `maxTreeCount`
  - `maxSmallTreeCount`
  - `maxBushCount`
  - `maxGrassCount`
  - `maxOutdoorTotal`
- 目标是把整图 `breakableObjects` 控制在几千级，而不是两万级以上

这意味着大镇的植被改成“点缀型”，不再追求把所有空地都铺满。

### 6. 视口裁剪
运行时增加了两层直接裁剪：
- `Game.update()` 中的 `breakableObjects` 只更新相机附近对象
- `Renderer.draw()` 中的墙体、可破坏物、敌人、载具、传送门、宠物、地毯都先做视口可见性判断，再进入排序/绘制

这样可以显著减少大镇场景下的逐帧排序和对象更新开销。

### 7. 植被不参与光照遮挡
树、灌木、草丛类户外装饰现在统一：
- `blocksLight = false`

对应效果：
- 不再进入 `ShadowCasterBuilder` 的静态遮挡 hash/重建主链路
- 光照系统仍保留建筑、门、家具等关键遮挡
- 夜景下会损失少量树木阴影，但换来更稳定的帧率

## 运行时接入

### construction
- 使用大镇 profile
- 生成结束后，Hub 返回传送门会放在广场南侧道路附近

### game
- 复用同一套小镇生成
- 继续使用 `meta.indoorSpawnTiles` 和 `meta.indoorRooms`
- 房间枪支掉落和室内刷怪逻辑不需要改协议

## 关键文件
- `src/core/maps/MapProfiles.js`
- `src/core/systems/generation/TownDistrictPlanner.js`
- `src/core/systems/generation/TownBlockAllocator.js`
- `src/core/systems/generation/RoomTemplateLibrary.js`
- `src/core/systems/generation/BuildingTemplateLibrary.js`
- `src/core/systems/generation/BuildingTemplateAssembler.js`
- `src/core/systems/generation/TownLayoutGenerator.js`
- `src/core/systems/FloorChunkCache.js`

## 注意事项
- 旧 `ConstructionLayoutGenerator.js` 仍保留，主要用于兼容和回退。
- 新增房间语义 `office / retail / workshop / clinic` 时，必须同步更新 `GenerationConfig.js` 的家具模板，否则 `FurniturePlacer` 无法为这些房间正确摆放内容。
- 如果后续继续扩展 town 模板，优先新增建筑模板，不要把复杂逻辑重新塞回单文件随机生成器。
