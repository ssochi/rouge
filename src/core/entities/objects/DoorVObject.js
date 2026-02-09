import { Assets } from '../../../graphics/Assets.js';
import { toWorldRects } from './ObjectUtils.js';

export const DoorVObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 0, width: 12, height: 32 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 10, y: 0, w: 12, h: 32 };
        obj.drawOffset = { x: 0, y: -16 };
        obj.baseType = 'door_v';
        obj.isOpen = false;
        obj.openFactor = 0;
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
            return toWorldRects(obj, [
                { offsetX: 10, offsetY: 0, width: 12, height: 4 },
                { offsetX: 10, offsetY: 28, width: 12, height: 4 }
            ]);
        }
        return [obj.getHitbox()];
    },
    interact(obj) {
        obj.isOpen = !obj.isOpen;
        if (obj.isOpen) {
            obj.hitbox = { offsetX: 10, offsetY: 28, width: 12, height: 4 };
            obj.shadow = null;
        } else {
            obj.hitbox = { offsetX: 10, offsetY: 0, width: 12, height: 32 };
            obj.shadow = { type: 'rect', x: 10, y: 0, w: 12, h: 32 };
        }
        return true;
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

        if (obj.showHint) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            const label = obj.isOpen ? '[E] CLOSE' : '[E] OPEN';
            ctx.fillText(label, 16, -10);
        }
    }
};

