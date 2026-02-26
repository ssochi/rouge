# 车辆前灯光锥功能说明

## 需求目标

为车辆增加“启动后灯光点亮”的视觉反馈。玩家上车控制车辆时，车头前方出现前灯光锥；常规车辆为双前灯，蜘蛛载具为单前灯；警车额外启用车顶警灯动态光效；离车后立即熄灭。

## 生效范围

- 车型：`suv`、`police`、`truck`、`spider`
- 不生效车型：`tank`
- 触发条件：`vehicle.controlled === true`
- 关闭条件：`vehicle.controlled === false` 或车辆死亡（`isDead === true`）
- 全局遮挡规则：所有光源至少受墙/门遮挡，不允许穿墙；是否受物体遮挡由光源类型配置决定。

## 实现方案

### 1. 发光体注册

在 `src/core/lighting/LightEmitterRegistry.js` 新增：

- `getVehicleEmitters(vehicle, timeMs)`

该方法根据车辆当前中心点和朝向，生成车型对应的锥形发光体（常规车辆双灯，`spider` 单灯）。其中 `police` 车型额外生成车顶警灯红蓝交替点光。

### 2. 光锥参数（写实白光）

- `color`: `#f2f6ff`
- `radius`: `210`
- `intensity`: 左灯 `0.72`，右灯 `0.684`（左灯 * 0.95）
- `castsShadows`: `true`
- `priority`: `88`
- `ignoreSelfShadow`: `true`
- `coneAngle`: `0.62`（弧度）
- `coneDirection`: 车辆 `angle`
- 车灯渲染采用三层叠加：`核心聚焦锥` + `外扩柔光锥` + `近场泛光`，用于弱化硬边和提升体积感

补充车型差异：

- `spider` 使用偏冷蓝车灯（`#9deeff`），范围与角度略收敛，保持机甲风格。
- `spider` 灯位为车头中轴单灯，不走左右双灯分离逻辑；位置锚定到蜘蛛模型抬升层（`bodyElevation` 对齐），避免灯位视觉歪斜。
- `truck` 车灯半径与强度略高于轿车类车型。

### 3. 警车警灯参数（红蓝交替）

- 灯位：车体中部附近、左右分离（沿车辆横向向量分布）
- 颜色：左侧红 `#ff4d59`，右侧蓝 `#4da3ff`
- 半径：`122`
- 强度：按正弦相位互补交替（红强时蓝弱，蓝强时红弱）
- `priority`: `96`
- `castsShadows`: `true`
- 光照分层：与台灯一致采用 `70% 环境层 + 30% 点光层`。
- 遮挡规则：`70%` 层仅受墙/门遮挡，`30%` 层受墙/门+物体遮挡。

### 4. 车灯平滑策略

- 核心锥：窄角度、长半径，负责主照明与远端可见性
- 柔光锥：更宽角度、较短半径，负责过渡边缘，减少“硬切”观感
- 近场泛光：无锥角点光，补充车头附近亮度与质感
- 通过低幅度 `flicker` 打散完全静态边缘，避免画面过于机械

### 5. 灯位计算

基于车辆 hitbox：

- `frontOffset = hitbox.width * 0.52`
- `lateralOffset = hitbox.height * 0.34`

方向向量：

- 前向：`(cos(angle), sin(angle))`
- 右向：`(-sin(angle), cos(angle))`

左右灯坐标（双灯车型）：

- 左灯：`base + forward * frontOffset - right * lateralOffset`
- 右灯：`base + forward * frontOffset + right * lateralOffset`

单灯坐标（`spider`）：

- 中灯：`base + forward * frontOffset`

### 6. 动态光系统接入

在 `src/core/lighting/LightSystem.js`：

- 构造参数新增 `vehicles`
- 在 `_collectDynamicLights()` 中遍历车辆并调用 `getVehicleEmitters`

在 `src/core/Game.js`：

- 初始化 `LightSystem` 时传入 `vehicles: this.vehicles`

## 验收标准

1. 玩家按 `E` 上车后，`suv/police/truck` 为双前灯，`spider` 为单前灯，且都能跟随车头方向旋转。
2. 车辆离开后光锥立刻消失。
3. 光锥会被墙体与物体遮挡，符合现有光照遮挡规则。
4. 警车车顶红蓝警灯在驾驶时持续交替闪烁。
5. `tank` 不出现前灯光锥。
6. `npm run build` 构建成功。
