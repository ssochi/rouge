// ArcTwin —— 电弧双子：成对浮空幽体，两者之间拉一道伤害电弧封锁走位。
// 双子绕到玩家两侧让电弧扫人；间距过大电弧断开（会重新靠拢）；一只死亡另一只狂暴。
// 成对生成与互相引用由 WorldSystem 生成特判负责（见 [depth-batch:enemies]）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { steerToward } from './behaviors/BehaviorUtils.js';
import { TILE_SIZE } from '../../utils/Constants.js';

const ORBIT_R = 82;                    // 绕侧半径（让玩家处于双子之间）
const ARC_INTERVAL = 30;               // 电弧判伤间隔 0.5s
const ARC_DAMAGE = 8;
const ARC_HIT_RADIUS = 15;             // 玩家中心到电弧线段的命中距离
const ARC_MAX_DIST = 12 * TILE_SIZE;   // 间距超此电弧断开
const RECLOSE_DIST = 10 * TILE_SIZE;   // 间距超此优先重新靠拢
const TOUCH_RANGE = 22;
const TOUCH_DAMAGE = 5;
const TOUCH_COOLDOWN = 52;

export class ArcTwin extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 24, 28, 1.5);

        this.spriteScale = 1.2;
        this.variant = 'blue';   // 'blue'(index0) | 'purple'(index1)
        this.twinIndex = 0;
        this.twin = null;        // 伴生体引用（WorldSystem 注入）
        this.enraged = false;
        this.baseSpeed = 1.5;
        this.arcTimer = 0;
        this.touchCooldown = 0;
        this.touchCdMax = TOUCH_COOLDOWN;
        this.attackAnimTimer = 0;
        this.arcActive = false;  // 当前是否有电弧（供绘制）
        this.combatSystem = null;
    }

    /** WorldSystem 成对生成时配置镜像身份。 */
    setTwinIdentity(index, partner) {
        this.twinIndex = index;
        this.variant = index === 0 ? 'blue' : 'purple';
        this.twin = partner;
    }

    _enrage() {
        if (this.enraged) return;
        this.enraged = true;
        this.speed = this.baseSpeed * 1.4;
        this.touchCdMax = Math.round(TOUCH_COOLDOWN * 0.7);
    }

    _isArcMaster() {
        return this.twinIndex === 0;
    }

    _pointSegDist(px, py, ax, ay, bx, by) {
        const dx = bx - ax;
        const dy = by - ay;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) return Math.hypot(px - ax, py - ay);
        let t = ((px - ax) * dx + (py - ay) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;

        // 伴生体死亡 → 电弧消失 + 狂暴
        if (this.twin && this.twin.hp <= 0) {
            this.twin = null;
            this._enrage();
        }

        if (this.frozenTimer > 0) { this.arcActive = false; return; }

        if (this.touchCooldown > 0) this.touchCooldown--;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;
        this.facingRight = player.x > this.x;

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };

        // ---- 移动：绕到玩家对侧（与伴生体夹住玩家），过远则重新靠拢 ----
        const twinAlive = this.twin && this.twin.hp > 0;
        if (twinAlive) {
            const twinDist = Math.hypot(this.twin.x - this.x, this.twin.y - this.y);
            if (twinDist > RECLOSE_DIST) {
                steerToward(ctx, this.twin.x, this.twin.y, 1.1, false); // 靠拢重连电弧
            } else {
                // 目标 = 玩家在"伴生体→玩家"延长线上的对侧点
                let ox = player.x - this.twin.x;
                let oy = player.y - this.twin.y;
                const ol = Math.hypot(ox, oy) || 1;
                ox /= ol; oy /= ol;
                const tx = player.x + ox * ORBIT_R;
                const ty = player.y + oy * ORBIT_R;
                steerToward(ctx, tx, ty, 1, false);
            }
        } else {
            steerToward(ctx, player.x, player.y, 1, true); // 落单：直扑玩家
        }
        this.state = 'run';

        // ---- 电弧：仅 master 处理，且双子俱在、间距在范围内 ----
        this.arcActive = false;
        if (this._isArcMaster() && twinAlive) {
            const dist = Math.hypot(this.twin.x - this.x, this.twin.y - this.y);
            if (dist <= ARC_MAX_DIST) {
                this.arcActive = true;
                this.arcTimer++;
                if (this.arcTimer >= ARC_INTERVAL) {
                    this.arcTimer = 0;
                    this._arcDamage(player);
                }
            }
        }

        // ---- 接触电击（落单狂暴时的主要威胁）----
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < TOUCH_RANGE * TOUCH_RANGE
            && this.touchCooldown <= 0
            && player.state !== 'roll' && player.state !== 'driving'
            && player.takeDamage) {
            const a = Math.atan2(dy, dx);
            const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
            player.takeDamage(Math.round(TOUCH_DAMAGE * mult), { x: Math.cos(a) * 4, y: Math.sin(a) * 4 });
            this.touchCooldown = this.touchCdMax;
            this.attackAnimTimer = 20;
        }
    }

    _arcDamage(player) {
        if (!this.twin || player.state === 'roll' || player.state === 'driving' || !player.takeDamage) return;
        const d = this._pointSegDist(player.x, player.y, this.x, this.y, this.twin.x, this.twin.y);
        if (d > ARC_HIT_RADIUS) return;
        const mid = { x: (this.x + this.twin.x) / 2, y: (this.y + this.twin.y) / 2 };
        const a = Math.atan2(player.y - mid.y, player.x - mid.x);
        const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
        player.takeDamage(Math.round(ARC_DAMAGE * mult), { x: Math.cos(a) * 3, y: Math.sin(a) * 3 });
        this.attackAnimTimer = 16;
    }

    _currentFrames() {
        const set = Assets.arcTwin && Assets.arcTwin[this.variant];
        if (!set) return null;
        if (this.attackAnimTimer > 0) return set.attack;
        return set.run;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 先画电弧（master 且双子俱在）——世界坐标折线闪电
        if (this.arcActive && this.twin && this.twin.hp > 0) {
            this._drawArc(ctx, this.twin);
        }

        const frames = this._currentFrames();
        if (!frames || frames.length === 0) { this.drawHpBar(ctx); return; }
        const frameIndex = Math.floor(this.animationTimer / 6) % frames.length;
        const sprite = frames[frameIndex];

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);
        ctx.drawImage(sprite, -16, -16);
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            ctx.drawImage(sprite, -16, -16);
            ctx.restore();
        }
        ctx.restore();

        // 狂暴红化叠加（运行时，不额外生成帧）
        if (this.enraged) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.28 + 0.12 * Math.sin(this.animationTimer * 0.4);
            ctx.fillStyle = '#ff3b30';
            ctx.beginPath();
            ctx.ellipse(Math.floor(this.x), Math.floor(this.y), 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        this.drawHpBar(ctx);
    }

    /** 双子之间的折线闪电（抖动分段 + 双色芯 + 外辉）。 */
    _drawArc(ctx, twin) {
        const x1 = this.x, y1 = this.y - 2;
        const x2 = twin.x, y2 = twin.y - 2;
        const segs = 8;
        const pts = [];
        for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const jitter = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * 8;
            // 垂直于连线方向抖动
            const nx = -(y2 - y1);
            const ny = (x2 - x1);
            const nl = Math.hypot(nx, ny) || 1;
            pts.push({
                x: x1 + (x2 - x1) * t + (nx / nl) * jitter,
                y: y1 + (y2 - y1) * t + (ny / nl) * jitter
            });
        }
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // 外辉
        ctx.strokeStyle = 'rgba(150,200,255,0.35)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        // 紫辉
        ctx.strokeStyle = 'rgba(200,150,255,0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // 炽白芯
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
    }

    getLightOccluderSprites() {
        return []; // 半透幽体不参与光照遮挡
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 20;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 22);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = this.enraged ? '#ff5a4a' : (this.variant === 'purple' ? '#c99cff' : '#8fd0ff');
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
