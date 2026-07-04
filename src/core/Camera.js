import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../utils/Constants.js';

export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.lerp = 0.3; // Increased from 0.1 to reduce aim drift when moving
        this.worldWidth = MAP_WIDTH * TILE_SIZE;
        this.worldHeight = MAP_HEIGHT * TILE_SIZE;
    }

    setWorldBounds(width, height) {
        this.worldWidth = Math.max(this.width, Number.isFinite(width) ? width : this.width);
        this.worldHeight = Math.max(this.height, Number.isFinite(height) ? height : this.height);
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    }

    follow(target) {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;

        this.x += (targetX - this.x) * this.lerp;
        this.y += (targetY - this.y) * this.lerp;

        // Clamp
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    }
}
