import { Assets } from '../../graphics/Assets.js';

export class Carpet {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // e.g., 'carpet_rug_large'
        
        // Dimensions based on sprite
        const sprite = Assets.objects[type];
        if (sprite) {
            this.width = sprite.width;
            this.height = sprite.height;
        } else {
            this.width = 32;
            this.height = 32;
        }
    }

    draw(ctx) {
        const sprite = Assets.objects[this.type];
        if (sprite) {
            // Draw directly at position (Top-Left)
            ctx.drawImage(sprite, this.x, this.y);
        }
    }
}
