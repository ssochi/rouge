import { Assets } from '../../graphics/Assets.js';

export class PetDog {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.petType = 'dog';

        // 独特技能「寻宝嗅觉」参数
        this.worldSystem = null;      // 召唤时注入，读取 droppedItems / pickups
        this.scentRadius = 90;        // 嗅探半径（px）
        this.scentPull = 1.2;         // 每帧向玩家轻拽距离（px）

        // Movement hitbox (bottom-aligned, for wall collision)
        this.hitboxWidth = 10;
        this.hitboxHeight = 6;
        this.hitboxOffsetY = 10;

        this.maxSpeed = 4.5;
        this.currentSpeed = 0;
        this.accel = 0.35;      // Acceleration per frame
        this.decel = 0.25;      // Deceleration per frame (slower for slide-to-stop)
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

        // 独特技能「寻宝嗅觉」：将附近掉落物/金币轻拽向玩家
        this._treasureScent(player, particles);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Teleport if too far
        if (dist > this.teleportDistance && particles) {
            this._teleportTo(player.x, player.y, particles);
            return;
        }

        // Hysteresis zone: run when far, idle when close
        let wantsToRun = this.state === 'run';
        if (dist > 60) wantsToRun = true;
        else if (dist <= 40) wantsToRun = false;

        // Compute desired direction
        let dirX = 0, dirY = 0;
        if (wantsToRun) {
            // Use flow field for pathfinding
            if (getFlowDirection) {
                const flow = getFlowDirection(this.x, this.y);
                if (flow && (flow.x !== 0 || flow.y !== 0)) {
                    dirX = flow.x;
                    dirY = flow.y;
                }
            }
            // Fallback: direct path when very close
            if (dirX === 0 && dirY === 0 && dist > 0) {
                dirX = dx / dist;
                dirY = dy / dist;
            }
            // Navigate around obstacles
            if (getNavDirection) {
                const nav = getNavDirection(this, dirX, dirY);
                if (nav && (nav.x !== 0 || nav.y !== 0)) {
                    dirX = nav.x;
                    dirY = nav.y;
                }
            }
            // Normalize
            const len = Math.sqrt(dirX * dirX + dirY * dirY);
            if (len > 0) { dirX /= len; dirY /= len; }
        }

        // Smooth acceleration / deceleration
        if (wantsToRun) {
            // Speed up: faster when further from player
            const targetSpeed = Math.min(this.maxSpeed, this.maxSpeed * (dist / 80));
            this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + this.accel);
            // Blend direction smoothly
            this.vx += (dirX - this.vx) * 0.2;
            this.vy += (dirY - this.vy) * 0.2;
            this.state = 'run';
        } else {
            // Decelerate to stop
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

            // Update facing
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
            // Face toward player when idle
            if (dx > 5) this.facingRight = true;
            else if (dx < -5) this.facingRight = false;
        }
    }

    /**
     * 独特技能「寻宝嗅觉」：把狗身周 scentRadius 内的地牢掉落物与金币拾取物
     * 每帧向玩家方向轻拽 scentPull 像素（直接改写目标 x/y），并低频冒出淡金色嗅探粒子。
     * 依赖召唤时注入的 worldSystem.droppedItems / worldSystem.pickups。
     */
    _treasureScent(player, particles) {
        const ws = this.worldSystem;
        if (!ws || !player) return;

        const r2 = this.scentRadius * this.scentRadius;
        const pull = this.scentPull;

        const tug = (obj) => {
            const sdx = obj.x - this.x;
            const sdy = obj.y - this.y;
            if (sdx * sdx + sdy * sdy > r2) return; // 超出嗅探半径
            const pdx = player.x - obj.x;
            const pdy = player.y - obj.y;
            const d = Math.sqrt(pdx * pdx + pdy * pdy);
            if (d > 4) {
                obj.x += (pdx / d) * pull;
                obj.y += (pdy / d) * pull;
            }
        };

        if (ws.droppedItems) {
            for (const it of ws.droppedItems) tug(it);
        }
        if (ws.pickups) {
            for (const p of ws.pickups) {
                if (p.kind === 'coin' && !p.collected) tug(p);
            }
        }

        // 淡金色嗅探粒子（低频，避免刷屏）
        if (particles && this.animationTimer % 24 === 0) {
            particles.push({
                type: 'smoke',
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y - 2 - Math.random() * 3,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.25 - Math.random() * 0.3,
                life: 16 + Math.random() * 8,
                color: Math.random() < 0.5 ? '#ffe9a8' : '#f7d774',
                size: 1.5 + Math.random(),
                alpha: 0.5
            });
        }
    }

    _teleportTo(playerX, playerY, particles) {
        // Disappear VFX at old position
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                type: 'smoke',
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * 0.5,
                vy: -Math.random() * 1.5 - 0.5,
                life: 20 + Math.random() * 10,
                color: '#b0d0ff',
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

        // Appear VFX at new position
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            particles.push({
                type: 'smoke',
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.0,
                life: 15 + Math.random() * 10,
                color: i % 2 === 0 ? '#ffffff' : '#ffe066',
                size: 2 + Math.random() * 2,
                alpha: 0.8
            });
        }
    }

    draw(ctx) {
        const s = 0.6; // Scale down for small dog look
        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) ctx.scale(-1, 1);

        // Shadow (aligned with sprite feet)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scale sprite down, shift Y so feet land on shadow
        ctx.scale(s, s);

        // Select animation frames
        let frames;
        let frameDelay;
        if (this.state === 'run') {
            frames = Assets.dog.run;
            frameDelay = 4;
        } else {
            frames = Assets.dog.idle;
            frameDelay = 8;
        }

        if (frames && frames.length > 0) {
            const frameIndex = Math.floor(this.animationTimer / frameDelay) % frames.length;
            // -12 instead of -16: shifts sprite down so feet (row 29) align with shadow at y=10
            ctx.drawImage(frames[frameIndex], -16, -12);
        }

        ctx.restore();
    }
}
