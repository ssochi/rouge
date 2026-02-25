import { Assets } from '../../../graphics/Assets.js';

export const DoorVObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 0, width: 12, height: 32 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 10, y: 0, w: 12, h: 32 };
        obj.drawOffset = { x: 0, y: -16 };
        obj.baseType = 'door_v';
        obj.isOpen = false;
        obj.openFactor = 0;
        obj.isLocked = false;
    },
    update(obj, player) {
        if (player) {
            const cx = obj.x + (obj.width || 32) / 2;
            const cy = obj.y + (obj.height || 32) / 2;
            const dx = player.x - cx;
            const dy = player.y - cy;
            obj.showHint = Math.sqrt(dx * dx + dy * dy) < 50;
        } else {
            obj.showHint = false;
        }

        const target = obj.isOpen ? 1 : 0;
        if (obj.openFactor < target) {
            obj.openFactor += 0.1;
            if (obj.openFactor > target) obj.openFactor = target;
        } else if (obj.openFactor > target) {
            obj.openFactor -= 0.1;
            if (obj.openFactor < target) obj.openFactor = target;
        }
    },
    getHitboxes(obj) {
        if (obj.isOpen) {
            // No movement hitboxes when open - adjacent walls handle boundaries.
            // This avoids the visual-collision gap mismatch caused by drawOffset.y=-16.
            return [];
        }
        return [obj.getHitbox()];
    },
    getHurtboxes(obj) {
        // Extend 16px upward to cover the visual area (drawOffset.y = -16)
        if (obj.isOpen) {
            // Frame posts still hittable by bullets when open
            return [
                { x: obj.x + 10, y: obj.y - 16, width: 12, height: 20 },
                { x: obj.x + 10, y: obj.y + 12, width: 12, height: 20 }
            ];
        }
        return [{
            x: obj.x + 10,
            y: obj.y - 16,
            width: 12,
            height: 48
        }];
    },
    getHurtbox(obj) {
        const boxes = this.getHurtboxes(obj);
        if (boxes.length === 1) return boxes[0];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const hb of boxes) {
            minX = Math.min(minX, hb.x);
            minY = Math.min(minY, hb.y);
            maxX = Math.max(maxX, hb.x + hb.width);
            maxY = Math.max(maxY, hb.y + hb.height);
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    },
    interact(obj) {
        if (obj.isLocked) return false;
        obj.isOpen = !obj.isOpen;
        if (obj.isOpen) {
            obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
            obj.shadow = null;
        } else {
            obj.hitbox = { offsetX: 10, offsetY: 0, width: 12, height: 32 };
            obj.shadow = { type: 'rect', x: 10, y: 0, w: 12, h: 32 };
        }
        return true;
    },
    lock(obj) {
        obj.isLocked = true;
        if (obj.isOpen) {
            obj.isOpen = false;
            obj.hitbox = { offsetX: 10, offsetY: 0, width: 12, height: 32 };
            obj.shadow = { type: 'rect', x: 10, y: 0, w: 12, h: 32 };
        }
    },
    unlock(obj) {
        obj.isLocked = false;
    },
    draw(obj, ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        if (obj.shadow) {
            ctx.fillRect(obj.shadow.x, obj.shadow.y, obj.shadow.w, obj.shadow.h);
        }

        const frameSprite = Assets.objects.door_v_frame;
        const panelSprite = Assets.objects.door_v_panel;
        const dx = obj.drawOffset ? obj.drawOffset.x : 0;
        const dy = obj.drawOffset ? obj.drawOffset.y : 0;

        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy + 4, 32, 24);
        ctx.clip();
        const slideY = -24 * obj.openFactor;
        ctx.drawImage(panelSprite, dx, dy + slideY);
        ctx.restore();

        ctx.drawImage(frameSprite, dx, dy);

        // Hit flash effect
        if (obj.hitFlashTimer > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.5;
            ctx.drawImage(frameSprite, dx, dy);
            ctx.restore();
        }

        if (obj.isLocked) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
            ctx.fillRect(dx, dy, 32, 48);
            ctx.restore();
        }

        if (obj.showHint) {
            ctx.fillStyle = obj.isLocked ? '#e74c3c' : '#f1c40f';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            const label = obj.isLocked ? '[LOCKED]' : (obj.isOpen ? '[E] CLOSE' : '[E] OPEN');
            ctx.fillText(label, 16, -10);
        }
    }
};
