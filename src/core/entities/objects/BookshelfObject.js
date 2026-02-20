import { Assets } from '../../../graphics/Assets.js';

export const BookshelfObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 16, width: 32, height: 16 };
        obj.hp = 60;
        obj.shadow = { type: 'rect', x: 0, y: 16, w: 32, h: 16 };
        obj.drawOffset = { x: 0, y: -16 };
        
        // Pick a random variant
        const sprites = Assets.objects.bookshelf;
        if (Array.isArray(sprites)) {
            obj.frameIndex = Math.floor(Math.random() * sprites.length);
            obj.noAnimation = true; // Disable animation for this object
        }
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y + obj.drawOffset.y,
            width: obj.hitbox.width,
            height: 48
        };
    }
};

