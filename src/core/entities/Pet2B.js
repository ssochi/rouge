import { Assets } from '../../graphics/Assets.js';

export class Pet2B {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.petType = '2b';

        // 独特技能「支援斩击」参数
        this.worldSystem = null;       // 召唤时注入，读取 enemies
        this.slashState = 'idle';      // idle | slashing
        this.slashTarget = null;       // 当前冲刺目标敌人
        this.slashTimer = 0;           // 单次冲刺已用帧数（防卡死上限）
        this.slashCooldown = 0;        // 冷却计时（帧）
        this.slashInterval = 480;      // 冷却时长（8s）
        this.slashRange = 130;         // 触发探测半径（px）
        this.slashDashSpeed = 10;      // 冲刺速度（px/帧）
        this.slashDamage = 15;         // 命中伤害
        this.slashHitDist = 20;        // 到达该距离即判定命中
        this.slashMaxFrames = 24;      // 冲刺最长帧数（够不到目标则放弃）

        // Movement hitbox (bottom-aligned, for wall collision)
        this.hitboxWidth = 8;
        this.hitboxHeight = 5;
        this.hitboxOffsetY = 10;

        this.maxSpeed = 4.8;
        this.currentSpeed = 0;
        this.accel = 0.38;
        this.decel = 0.28;
        this.state = 'idle'; // idle | run
        this.animationTimer = 0;
        this.facingRight = false;
        this.vx = 0;
        this.vy = 0;

        this.teleportDistance = 600;
    }

    getMovementHitboxAt(x = this.x, y = this.y) {
        return {
            x: x - this.hitboxWidth / 2,
            y: y + this.hitboxOffsetY - this.hitboxHeight / 2,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }

    update(player, getFlowDirection, getNavDirection, moveResolver, particles) {
        this.animationTimer++;
        if (this.slashCooldown > 0) this.slashCooldown--;

        // 独特技能「支援斩击」：冲刺中则接管移动，返回后走常规跟随
        if (this.slashState === 'slashing') {
            this._updateSlash(moveResolver, particles);
            return;
        }
        // 冷却就绪且范围内有敌人 → 进入冲刺
        if (this.slashCooldown <= 0) {
            const target = this._findNearestEnemy(this.slashRange);
            if (target) {
                this.slashState = 'slashing';
                this.slashTarget = target;
                this.slashTimer = 0;
                this._updateSlash(moveResolver, particles);
                return;
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Teleport if too far
        if (dist > this.teleportDistance && particles) {
            this._teleportTo(player.x, player.y, particles);
            return;
        }

        // Hysteresis zone
        let wantsToRun = this.state === 'run';
        if (dist > 58) wantsToRun = true;
        else if (dist <= 38) wantsToRun = false;

        // Compute desired direction
        let dirX = 0, dirY = 0;
        if (wantsToRun) {
            if (getFlowDirection) {
                const flow = getFlowDirection(this.x, this.y);
                if (flow && (flow.x !== 0 || flow.y !== 0)) {
                    dirX = flow.x;
                    dirY = flow.y;
                }
            }
            if (dirX === 0 && dirY === 0 && dist > 0) {
                dirX = dx / dist;
                dirY = dy / dist;
            }
            if (getNavDirection) {
                const nav = getNavDirection(this, dirX, dirY);
                if (nav && (nav.x !== 0 || nav.y !== 0)) {
                    dirX = nav.x;
                    dirY = nav.y;
                }
            }
            const len = Math.sqrt(dirX * dirX + dirY * dirY);
            if (len > 0) { dirX /= len; dirY /= len; }
        }

        // Smooth acceleration / deceleration
        if (wantsToRun) {
            const targetSpeed = Math.min(this.maxSpeed, this.maxSpeed * (dist / 75));
            this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + this.accel);
            this.vx += (dirX - this.vx) * 0.22;
            this.vy += (dirY - this.vy) * 0.22;
            this.state = 'run';
        } else {
            this.currentSpeed = Math.max(0, this.currentSpeed - this.decel);
            if (this.currentSpeed < 0.1) {
                this.currentSpeed = 0;
                this.state = 'idle';
            }
        }

        // Apply movement
        if (this.currentSpeed > 0) {
            const vLen = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            let mvx = this.vx, mvy = this.vy;
            if (vLen > 0) { mvx /= vLen; mvy /= vLen; }

            if (mvx > 0.1) this.facingRight = true;
            else if (mvx < -0.1) this.facingRight = false;

            const nextX = this.x + mvx * this.currentSpeed;
            const nextY = this.y + mvy * this.currentSpeed;

            if (moveResolver) {
                moveResolver(this, nextX, nextY, mvx, mvy);
            } else {
                this.x = nextX;
                this.y = nextY;
            }
        } else {
            if (dx > 5) this.facingRight = true;
            else if (dx < -5) this.facingRight = false;
        }
    }

    /**
     * 在 worldSystem.enemies 中查找 range 内、存活（hp>0）的最近敌人。
     * @returns {object|null}
     */
    _findNearestEnemy(range) {
        const ws = this.worldSystem;
        if (!ws || !ws.enemies) return null;
        const r2 = range * range;
        let best = null;
        let bestD2 = r2;
        for (const e of ws.enemies) {
            if (!e || e.hp <= 0) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= bestD2) {
                bestD2 = d2;
                best = e;
            }
        }
        return best;
    }

    /**
     * 冲刺阶段逐帧推进：直线冲向目标（slashDashSpeed），到达 slashHitDist 判定命中
     * （slashDamage 伤害 + 击退 + 白色剑光弧粒子）；目标消失或超时则放弃。命中/结束后进入冷却。
     */
    _updateSlash(moveResolver, particles) {
        this.slashTimer++;
        const target = this.slashTarget;

        // 目标已死亡/移除 → 结束
        if (!target || target.hp <= 0) {
            this._endSlash();
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.state = 'run';
        this.facingRight = dx > 0;

        // 到达命中距离 → 造成伤害 + 击退 + 剑光弧
        if (dist <= this.slashHitDist) {
            this._doStrike(target, dx, dy, dist, particles);
            this._endSlash();
            return;
        }
        // 超时够不到（被墙隔断等）→ 放弃并进冷却
        if (this.slashTimer > this.slashMaxFrames) {
            this._endSlash();
            return;
        }

        // 直线冲刺（经 moveResolver 做墙体解析，避免穿墙）
        const inv = dist > 0 ? 1 / dist : 0;
        const nextX = this.x + dx * inv * this.slashDashSpeed;
        const nextY = this.y + dy * inv * this.slashDashSpeed;
        if (moveResolver) {
            moveResolver(this, nextX, nextY, dx * inv, dy * inv);
        } else {
            this.x = nextX;
            this.y = nextY;
        }
    }

    _doStrike(target, dx, dy, dist, particles) {
        const inv = dist > 0 ? 1 / dist : 0;
        const kb = 8;
        const knockback = { x: dx * inv * kb, y: dy * inv * kb };
        if (typeof target.takeDamage === 'function') {
            target.takeDamage(this.slashDamage, knockback);
        } else {
            target.hp -= this.slashDamage;
        }
        this._spawnSlashArc(target.x, target.y, Math.atan2(dy, dx), particles);
    }

    _spawnSlashArc(x, y, angle, particles) {
        if (!particles) return;
        // 白色剑光弧
        particles.push({
            type: 'slash_trail',
            originX: x,
            originY: y,
            radius: 20,
            startAngle: angle - 0.9,
            endAngle: angle + 0.9,
            color: '#ffffff',
            width: 4,
            alpha: 0.95,
            fadeRate: 0.12,
            life: 12,
            anticlockwise: false
        });
        // 溅射白色火花碎点
        for (let i = 0; i < 6; i++) {
            const a = angle + (Math.random() - 0.5) * 1.6;
            const sp = 1.2 + Math.random() * 1.8;
            particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp,
                life: 10 + Math.random() * 8,
                color: Math.random() < 0.5 ? '#ffffff' : '#cfe4ff',
                size: 1.5 + Math.random(),
                alpha: 0.9,
                friction: 0.9
            });
        }
    }

    _endSlash() {
        this.slashState = 'idle';
        this.slashTarget = null;
        this.slashTimer = 0;
        this.slashCooldown = this.slashInterval;
    }

    _teleportTo(playerX, playerY, particles) {
        // Disappear VFX — white/blue tech particles (YoRHa style)
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                type: 'smoke',
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * 0.5,
                vy: -Math.random() * 1.5 - 0.5,
                life: 20 + Math.random() * 10,
                color: '#c0d8ff',
                size: 2 + Math.random() * 2,
                alpha: 0.7
            });
        }

        // Move to near player
        const offsetAngle = Math.random() * Math.PI * 2;
        this.x = playerX + Math.cos(offsetAngle) * 30;
        this.y = playerY + Math.sin(offsetAngle) * 20;
        this.currentSpeed = 0;
        this.state = 'idle';
        this.vx = 0;
        this.vy = 0;

        // Appear VFX — white/light blue (sci-fi feel)
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            particles.push({
                type: 'smoke',
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.0,
                life: 15 + Math.random() * 10,
                color: i % 2 === 0 ? '#ffffff' : '#a0c8ff',
                size: 2 + Math.random() * 2,
                alpha: 0.8
            });
        }
    }

    draw(ctx) {
        const s = 0.65; // Slightly larger scale for humanoid detail
        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scale sprite down
        ctx.scale(s, s);

        let frames;
        let frameDelay;
        if (this.state === 'run') {
            frames = Assets.nier2b.run;
            frameDelay = 5;
        } else {
            frames = Assets.nier2b.idle;
            frameDelay = 8;
        }

        if (frames && frames.length > 0) {
            const frameIndex = Math.floor(this.animationTimer / frameDelay) % frames.length;
            ctx.drawImage(frames[frameIndex], -16, -10);
        }

        ctx.restore();
    }
}
