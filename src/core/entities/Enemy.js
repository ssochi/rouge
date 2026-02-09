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

    resolveWallCollision(newX, newY, walls, wallQuery) {
        let collidedX = false;
        const testRectX = {x: newX - this.width/2, y: this.y - this.height/2, width: this.width, height: this.height};
        
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
        const testRectY = {x: this.x - this.width/2, y: newY - this.height/2, width: this.width, height: this.height};
        
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
