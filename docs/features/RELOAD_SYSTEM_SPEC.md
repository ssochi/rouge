# 换弹系统设计文档

## 目标与范围
- 为每把武器引入弹匣容量与剩余弹药
- 子弹耗尽后必须换弹才能继续射击
- 换弹时角色头顶显示像素风换弹进度条
- UI 与逻辑解耦，便于后续扩展不同武器换弹节奏

## 关键术语
- **弹匣容量**: 当前武器一次可装填的子弹数量
- **弹匣剩余**: 当前武器还可射击的子弹数量
- **备用弹药**: 该武器在背包中的剩余子弹总量
- **换弹时长**: 从开始换弹到装填完成的时间
- **换弹条**: 显示换弹进度的像素风 UI 条

## 数据结构调整
### WeaponData 扩展
- `magazineSize`: 弹匣容量
- `reloadTime`: 换弹时长（ms）
- `reserveAmmo`: 该武器初始备用弹药数

### 运行时武器状态
为每把武器实例维护以下运行态字段：
- `currentAmmo`: 当前弹匣剩余
- `reserveAmmo`: 备用弹药剩余
- `isReloading`: 是否处于换弹中
- `reloadStartAt`: 换弹开始时间戳

## 系统职责与模块边界
### PlayerSystem
- 处理换弹输入（如按 R）
- 控制换弹状态机的开始与取消逻辑
- 在射击请求前检查弹匣状态

### CombatSystem
- 在发射子弹时扣除 `currentAmmo`
- 命中与子弹逻辑保持不变

### Renderer / UIManager
- 绘制角色头顶换弹条
- 进度条样式与动画完全由渲染层控制

## 状态机设计
### 状态
1. **可射击**：`isReloading = false` 且 `currentAmmo > 0`
2. **需换弹**：`currentAmmo === 0` 且 `reserveAmmo > 0`
3. **换弹中**：`isReloading = true`
4. **弹药耗尽**：`currentAmmo === 0` 且 `reserveAmmo === 0`

### 触发逻辑
- 射击时 `currentAmmo === 0`：若 `reserveAmmo > 0`，自动开始换弹
- 手动换弹（按 R）：`currentAmmo < magazineSize` 且 `reserveAmmo > 0`
- 换弹完成：按 `reloadTime` 结算并补充弹匣

## 换弹流程
1. 进入换弹中：记录 `reloadStartAt = now`
2. 计算进度：`progress = (now - reloadStartAt) / reloadTime`
3. 完成装填：根据 `magazineSize` 与 `reserveAmmo` 结算补弹
4. 退出换弹中：清理状态并允许射击

## UI 设计
### 换弹条表现
- 位置：角色头顶偏上
- 形态：像素风扁平条 + 细边框 + 动态闪烁高光
- 动效：进度填充由左到右，末端像素火花粒子

### 颜色建议
- 背景：深灰 `#2c3e50`
- 边框：浅灰 `#bdc3c7`
- 进度：亮黄 `#f1c40f` 到 橙色 `#e67e22` 渐变
- 高光：白 `#ffffff` 低透明度

### 视觉规则
- 当 `isReloading` 为真时显示
- 进度小于 20% 时加入轻微闪烁
- 完成瞬间可有一次扩散光晕

## 输入与交互
- 默认按键：`R` 触发换弹
- 射击键：若可射击则正常发射，否则触发自动换弹
- 换弹期间禁止射击

## 兼容性与扩展
- 支持未来增加不同武器换弹方式（如单发装填、泵动）
- 支持未来加入被动技能影响 `reloadTime`
- 支持未来 UI 换成条形或圆形进度样式

## 接入步骤
1. 扩展 `WeaponData` 字段并初始化运行态
2. 在 PlayerSystem 中加入换弹状态机
3. CombatSystem 射击扣弹并触发自动换弹
4. Renderer/UI 绘制头顶换弹条
5. 调整 TECH_OVERVIEW.md 的职责描述
