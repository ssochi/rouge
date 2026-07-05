export class Enemy {
    constructor(x, y, width, height, hp, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Bottom-aligned hitbox
        this.hitboxWidth = 14;
        this.hitboxHeight = 8;
        this.hitboxOffsetY = 12; // Offset to feet

        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.blocksLight = true;
        
        this.vx = 0;
        this.vy = 0;
        
        this.facingRight = false;
        this.state = 'idle'; 
        this.animationTimer = 0;
        
        // Knockback
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.friction = 0.9;
        
        // Flash effect
        this.hitFlashTimer = 0;
        
        // HP Bar Timer (Show for 2 seconds after hit)
        this.hpBarTimer = 0;

        // Boss 承伤 DPS 上限（0=无上限；Boss 子类设置。方法论见 COMBAT_BALANCE_METHODOLOGY.md §3.4：
        // 借鉴挺进地牢按 3 秒窗口限制玩家输出，保证神装下 Boss 战最短约 35 秒）
        this.dpsCap = 0;
        this._capUsed = 0;
        this._capWindow = 0;
    }

    /** 承伤上限结算：返回本次实际允许的伤害。Boss 子类在 takeDamage 首行调用。 */
    _applyDpsCap(amount) {
        if (!this.dpsCap || this.dpsCap <= 0) return amount;
        const budget = this.dpsCap * 3; // 3 秒窗口总预算
        const allowed = Math.min(amount, Math.max(0, budget - this._capUsed));
        this._capUsed += allowed;
        return allowed;
    }

    /** 每帧由 WorldSystem 更新循环调用：3 秒（180 帧）窗口重置承伤预算。 */
    tickDpsCap() {
        if (!this.dpsCap || this.dpsCap <= 0) return;
        this._capWindow++;
        if (this._capWindow >= 180) {
            this._capWindow = 0;
            this._capUsed = 0;
        }
    }

    update(player, walls, wallQuery) {
        // Apply knockback
        if (Math.abs(this.knockbackX) > 0.1 || Math.abs(this.knockbackY) > 0.1) {
            const nextX = this.x + this.knockbackX;
            const nextY = this.y + this.knockbackY;
            
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
            
            this.knockbackX *= this.friction;
            this.knockbackY *= this.friction;
        } else {
            this.knockbackX = 0;
            this.knockbackY = 0;
        }

        if (this.hitFlashTimer > 0) this.hitFlashTimer--;
        if (this.hpBarTimer > 0) this.hpBarTimer--;
        this.animationTimer++;
    }

    getEffectiveSpeed() {
        if (this.frozenTimer > 0) return 0;
        if (this.slowTimer > 0) return this.speed * Math.max(0, 1 - (this.slowAmount || 0));
        return this.speed;
    }

    takeDamage(amount, knockback) {
        this.hp -= amount;
        this.hitFlashTimer = 5; // Flash for 5 frames
        this.hpBarTimer = 120; // Show HP bar for 2 seconds (assuming 60fps)
        if (knockback) {
            this.knockbackX = knockback.x;
            this.knockbackY = knockback.y;
        }
    }

    checkRectCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.w &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.h &&
                rect1.y + rect1.height > rect2.y);
    }

    getMovementHitboxAt(x = this.x, y = this.y) {
        const w = this.hitboxWidth || this.width;
        const h = this.hitboxHeight || this.height;
        const oy = this.hitboxOffsetY || 0;
        return {
            x: x - w / 2,
            y: y + oy - h / 2,
            width: w,
            height: h
        };
    }

    resolveWallCollision(newX, newY, walls, wallQuery) {
        let collidedX = false;
        const testRectX = this.getMovementHitboxAt(newX, this.y);
        
        if (wallQuery) {
            collidedX = wallQuery(testRectX);
        } else {
            for (const wall of walls) {
                if (this.checkRectCollision(testRectX, wall)) {
                    collidedX = true;
                    break;
                }
            }
        }
        if (!collidedX) this.x = newX;

        let collidedY = false;
        const testRectY = this.getMovementHitboxAt(this.x, newY);
        
        if (wallQuery) {
            collidedY = wallQuery(testRectY);
        } else {
            for (const wall of walls) {
                if (this.checkRectCollision(testRectY, wall)) {
                    collidedY = true;
                    break;
                }
            }
        }
        if (!collidedY) this.y = newY;
    }

    draw(ctx, camera) {
        // Base draw implementation or empty
    }

    getLightOccluderSprites() {
        return [];
    }

    // Unified enemy hurtbox used by bullet hit detection.
    // Align bottom to the sprite feet area and include lower body.
    getBulletHurtbox() {
        const width = this.width || 20;
        const height = 32;
        const bottomY = this.y + 16;
        return {
            x: this.x - width / 2,
            y: bottomY - height,
            width,
            height
        };
    }
}
