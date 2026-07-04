// DungeonPickup.js
// 地牢掉落拾取物（金币 / 钥匙）。
//
// 生命周期：散开（初速+摩擦，约 0.4s）→ 悬浮 bob → 玩家 <64px 时磁吸加速飞向玩家
// → <14px 收集入账（coin→addCoins(value)，key→addKeys(1)），collected=true。
// 不参与碰撞解析（无墙检测，纯视觉飞行）。

import { Assets } from '../../graphics/Assets.js';

// 阶段 / 手感常量（60fps 语义）
const SPREAD_FRAMES = 24;    // 散开阶段时长 ≈ 0.4s
const FRICTION = 0.86;       // 散开摩擦（每帧速度衰减）
const BOB_SPEED = 0.14;      // 悬浮 bob 角速度
const BOB_AMPLITUDE = 1.6;   // 悬浮 bob 幅度（px）
const MAGNET_RADIUS = 64;    // 磁吸触发半径
const COLLECT_RADIUS = 14;   // 收集半径
const MAGNET_ACCEL = 0.45;   // 磁吸每帧加速
const MAGNET_MAX = 6.5;      // 磁吸最大速度（px/frame）
const COIN_ANIM_TICKS = 8;   // 金币两帧微闪切换间隔（帧）

export class DungeonPickup {
    /**
     * @param {number} x
     * @param {number} y
     * @param {'coin'|'key'} kind
     * @param {number} value 金币面值（key 忽略，恒计 1 把）
     */
    constructor(x, y, kind, value = 1) {
        this.x = x;
        this.y = y;
        this.kind = kind;
        this.value = value;
        this.collected = false;

        // 初速由 spawn 端设置（散开方向/速度）
        this.vx = 0;
        this.vy = 0;

        this.age = 0;
        // bob 相位随机化，避免整簇同步抖动
        this.bobTimer = Math.random() * Math.PI * 2;
        this.floatY = 0;
        this.animTimer = Math.floor(Math.random() * COIN_ANIM_TICKS);
        this.magnetSpeed = 0;

        // 供 Renderer 视口裁剪的粗略尺寸
        this.width = 12;
        this.height = 12;
    }

    /**
     * @param {{x:number,y:number}|null} player
     * @param {import('../dungeon/DungeonRunState.js').DungeonRunState|null} runState
     */
    update(player, runState) {
        if (this.collected) return;
        this.age++;
        this.animTimer++;

        let magneting = false;

        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);

            // 收集：任何阶段进入收集半径立即入账
            if (dist < COLLECT_RADIUS) {
                this.collect(runState);
                return;
            }

            // 磁吸：散开结束后，玩家进入磁吸半径则加速飞向玩家
            if (this.age > SPREAD_FRAMES && dist < MAGNET_RADIUS && dist > 0.0001) {
                magneting = true;
                this.magnetSpeed = Math.min(this.magnetSpeed + MAGNET_ACCEL, MAGNET_MAX);
                const inv = 1 / dist;
                this.x += dx * inv * this.magnetSpeed;
                this.y += dy * inv * this.magnetSpeed;
            }
        }

        if (!magneting) {
            this.magnetSpeed = 0;
            // 散开阶段：按初速位移 + 摩擦衰减
            if (this.age <= SPREAD_FRAMES) {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= FRICTION;
                this.vy *= FRICTION;
            }
            // 悬浮 bob
            this.bobTimer += BOB_SPEED;
        }

        this.floatY = Math.sin(this.bobTimer) * BOB_AMPLITUDE;
    }

    /**
     * 立即收集入账并标记移除。防御性检查 runState 存在（拾取物仅在地牢生成，
     * 但仍防御 hub / 异常路径下 runState 缺失）。
     * @param {import('../dungeon/DungeonRunState.js').DungeonRunState|null} runState
     */
    collect(runState) {
        if (this.collected) return;
        this.collected = true;
        if (!runState) return;
        if (this.kind === 'coin') {
            runState.addCoins(this.value);
        } else if (this.kind === 'key') {
            runState.addKeys(1);
        }
    }

    _sprite() {
        if (this.kind === 'coin') {
            const frames = Assets.dungeonCoin;
            if (!frames || frames.length === 0) return null;
            const idx = Math.floor(this.animTimer / COIN_ANIM_TICKS) % frames.length;
            return frames[idx];
        }
        return Assets.dungeonKey || null;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 已平移至世界坐标系
     * @param {*} camera 未使用（Renderer 已处理相机变换），保留签名一致
     */
    draw(ctx, camera) {
        if (this.collected) return;
        const sprite = this._sprite();

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        // 地面椭圆阴影
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath();
        const shadowRx = this.kind === 'key' ? 7 : 5;
        ctx.ellipse(0, 3, shadowRx, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (sprite) {
            const yOff = -5 + this.floatY;
            ctx.drawImage(sprite, -Math.floor(sprite.width / 2), -Math.floor(sprite.height / 2) + yOff);
        }

        ctx.restore();
    }
}
