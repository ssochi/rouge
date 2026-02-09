import { Assets } from '../../graphics/Assets.js';
import { getObjectDef } from './objects/ObjectRegistry.js';

export class BreakableObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'box', 'barrel', 'vase'
        
        // Visual Size
        this.width = 32;
        this.height = 32;

        this.hitbox = { offsetX: 5, offsetY: 20, width: 22, height: 10 };
        this.hp = 20;
        this.shadow = { rx: 12, ry: 6, y: 30 };

        this.def = getObjectDef(type);
        if (this.def && this.def.configure) {
            this.def.configure(this);
        }
        
        this.isBroken = false;
        this.hitFlashTimer = 0;
        
        this.showHint = false;
    }

    getHitbox() {
        return {
            x: this.x + this.hitbox.offsetX,
            y: this.y + this.hitbox.offsetY,
            w: this.hitbox.width,
            h: this.hitbox.height,
            width: this.hitbox.width,
            height: this.hitbox.height
        };
    }

    // New: Full body hitbox for bullet impact
    getHurtbox() {
        if (this.def && this.def.getHurtbox) {
            return this.def.getHurtbox(this);
        }

        // Approximate full visual body
        return {
            x: this.x + this.hitbox.offsetX,
            y: this.y + 4, // Start from near top
            width: this.hitbox.width,
            height: 28 // Cover most of the sprite height (32)
        };
    }

    update(player) {
        if (this.hitFlashTimer > 0) this.hitFlashTimer--;
        this.showHint = false;
        
        // Handle Animation
        const sprite = Assets.objects[this.type];
        if (Array.isArray(sprite)) {
            if (!this.frameTimer) this.frameTimer = 0;
            this.frameTimer++;
            
            // Default 10 frames per image? Or passed in?
            // Let's use a standard speed for now (e.g. 10 ticks per frame)
            // Or maybe randomize it slightly to desync
            const speed = 10; 
            
            if (this.frameTimer >= speed) {
                this.frameTimer = 0;
                if (!this.frameIndex) this.frameIndex = 0;
                this.frameIndex = (this.frameIndex + 1) % sprite.length;
            }
        }

        if (this.def && this.def.update) {
            this.def.update(this, player);
        }
    }

    takeDamage(amount, knockback) {
        if (this.isBroken) return;
        
        this.hp -= amount;
        this.hitFlashTimer = 5;
        
        // Simple shake effect? Handled by Game camera shake if heavy hit
        
        if (this.hp <= 0) {
            this.break();
        }
    }

    break() {
        this.isBroken = true;
        // The Game loop should handle spawning debris when this happens
        // or we can return debris data
    }

    setWallMask(mask) {
        if (this.def && this.def.setWallMask) {
            this.def.setWallMask(this, mask);
        }
    }
    
    getHitboxes() {
        if (this.def && this.def.getHitboxes) {
            return this.def.getHitboxes(this);
        }

        if (this.hitboxes && this.hitboxes.length > 0) {
            return this.hitboxes.map(hb => ({
                x: this.x + hb.offsetX,
                y: this.y + hb.offsetY,
                width: hb.width,
                height: hb.height,
                w: hb.width,
                h: hb.height
            }));
        }
        // Fallback to single hitbox in array
        return [this.getHitbox()];
    }

    interact() {
        if (this.def && this.def.interact) {
            return this.def.interact(this);
        }
        return false;
    }

    draw(ctx) {
        if (this.isBroken) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        
        if (this.def && this.def.draw) {
            this.def.draw(this, ctx);
            ctx.restore();
            return;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        if (this.shadow) {
            if (this.shadow.type === 'rect') {
                ctx.fillRect(this.shadow.x, this.shadow.y, this.shadow.w, this.shadow.h);
            } else {
                ctx.ellipse(16, this.shadow.y, this.shadow.rx, this.shadow.ry, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.ellipse(16, 30, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const sprite = Assets.objects[this.type];
        if (sprite) {
            const dx = this.drawOffset ? this.drawOffset.x : 0;
            const dy = this.drawOffset ? this.drawOffset.y : 0;
            
            let frame = sprite;
            if (Array.isArray(sprite)) {
                if (!this.frameIndex) this.frameIndex = 0;
                frame = sprite[this.frameIndex];
            }
            
            ctx.drawImage(frame, dx, dy);
            
            if (this.hitFlashTimer > 0) {
                let flashSprite = Assets.objects[this.type + '_flash'];
                if (Array.isArray(flashSprite)) {
                    flashSprite = flashSprite[this.frameIndex || 0];
                }
                
                if (flashSprite) {
                    ctx.save();
                    ctx.globalAlpha = 0.7;
                    ctx.drawImage(flashSprite, dx, dy);
                    ctx.restore();
                }
            }
        }

        ctx.restore();
    }
}
