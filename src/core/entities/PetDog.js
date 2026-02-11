import { Assets } from '../../graphics/Assets.js';

export class PetDog {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;

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
    }

    getMovementHitboxAt(x = this.x, y = this.y) {
        return {
            x: x - this.hitboxWidth / 2,
            y: y + this.hitboxOffsetY - this.hitboxHeight / 2,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }

    update(player, getFlowDirection, getNavDirection, moveResolver) {
        this.animationTimer++;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

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
