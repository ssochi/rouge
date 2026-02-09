import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../utils/Constants.js';

export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.lerp = 0.3; // Increased from 0.1 to reduce aim drift when moving
    }

    follow(target) {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;

        this.x += (targetX - this.x) * this.lerp;
        this.y += (targetY - this.y) * this.lerp;

        // Clamp
        this.x = Math.max(0, Math.min(this.x, MAP_WIDTH * TILE_SIZE - this.width));
        this.y = Math.max(0, Math.min(this.y, MAP_HEIGHT * TILE_SIZE - this.height));
    }
}
