import { Assets } from '../../graphics/Assets.js';

export class PetCat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;

        // Movement hitbox (bottom-aligned, for wall collision)
        this.hitboxWidth = 8;
        this.hitboxHeight = 5;
        this.hitboxOffsetY = 10;

        this.maxSpeed = 5.0;
        this.currentSpeed = 0;
        this.accel = 0.4;
        this.decel = 0.3;
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
        if (dist > 55) wantsToRun = true;
        else if (dist <= 35) wantsToRun = false;

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
            const targetSpeed = Math.min(this.maxSpeed, this.maxSpeed * (dist / 70));
            this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + this.accel);
            this.vx += (dirX - this.vx) * 0.25;
            this.vy += (dirY - this.vy) * 0.25;
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
        const s = 0.55;
        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 4.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scale sprite down
        ctx.scale(s, s);

        let frames;
        let frameDelay;
        if (this.state === 'run') {
            frames = Assets.cat.run;
            frameDelay = 4;
        } else {
            frames = Assets.cat.idle;
            frameDelay = 8;
        }

        if (frames && frames.length > 0) {
            const frameIndex = Math.floor(this.animationTimer / frameDelay) % frames.length;
            ctx.drawImage(frames[frameIndex], -16, -11);
        }

        ctx.restore();
    }
}
