import { Assets } from '../../graphics/Assets.js';
import { FLOOR_TILE_SIZE, FLOOR_TYPE_KEYS, FLOOR_TYPES } from '../../utils/FloorTypes.js';

export class FloorChunkCache {
    constructor({
        floorMap,
        width,
        height,
        chunkSize = 48,
        maxCachedChunks = 40
    }) {
        this.floorMap = floorMap;
        this.width = width;
        this.height = height;
        this.chunkSize = Math.max(8, chunkSize | 0);
        this.maxCachedChunks = Math.max(8, maxCachedChunks | 0);
        this._chunkCache = new Map();
    }

    clear() {
        this._chunkCache.clear();
    }

    draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight) {
        if (!this.floorMap || this.width <= 0 || this.height <= 0) return;

        const tileSize = FLOOR_TILE_SIZE;
        const chunkPixelSize = this.chunkSize * tileSize;
        const minChunkX = Math.max(0, Math.floor(cameraX / chunkPixelSize));
        const minChunkY = Math.max(0, Math.floor(cameraY / chunkPixelSize));
        const maxChunkX = Math.min(
            Math.ceil(this.width / this.chunkSize) - 1,
            Math.floor((cameraX + viewportWidth) / chunkPixelSize)
        );
        const maxChunkY = Math.min(
            Math.ceil(this.height / this.chunkSize) - 1,
            Math.floor((cameraY + viewportHeight) / chunkPixelSize)
        );

        for (let cy = minChunkY; cy <= maxChunkY; cy++) {
            for (let cx = minChunkX; cx <= maxChunkX; cx++) {
                const chunk = this._getChunkCanvas(cx, cy);
                if (!chunk) continue;
                ctx.drawImage(chunk.canvas, chunk.x, chunk.y);
            }
        }
    }

    _getChunkCanvas(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        const cached = this._chunkCache.get(key);
        if (cached) {
            this._chunkCache.delete(key);
            this._chunkCache.set(key, cached);
            return cached;
        }

        const chunk = this._renderChunk(chunkX, chunkY);
        this._chunkCache.set(key, chunk);

        while (this._chunkCache.size > this.maxCachedChunks) {
            const oldestKey = this._chunkCache.keys().next().value;
            this._chunkCache.delete(oldestKey);
        }

        return chunk;
    }

    _renderChunk(chunkX, chunkY) {
        const startSX = chunkX * this.chunkSize;
        const startSY = chunkY * this.chunkSize;
        const subWidth = Math.min(this.chunkSize, this.width - startSX);
        const subHeight = Math.min(this.chunkSize, this.height - startSY);
        const canvas = document.createElement('canvas');
        canvas.width = subWidth * FLOOR_TILE_SIZE;
        canvas.height = subHeight * FLOOR_TILE_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let sy = 0; sy < subHeight; sy++) {
            const globalSY = startSY + sy;
            for (let sx = 0; sx < subWidth; sx++) {
                const globalSX = startSX + sx;
                const type = this.floorMap[globalSY * this.width + globalSX];
                if (type === FLOOR_TYPES.NONE) continue;
                const key = FLOOR_TYPE_KEYS[type];
                const variants = Assets.floors[key];
                if (!variants || variants.length === 0) continue;
                const variantIndex = ((globalSX * 7 + globalSY * 13) & 0xffff) % variants.length;
                ctx.drawImage(
                    variants[variantIndex],
                    sx * FLOOR_TILE_SIZE,
                    sy * FLOOR_TILE_SIZE
                );
            }
        }

        return {
            canvas,
            x: startSX * FLOOR_TILE_SIZE,
            y: startSY * FLOOR_TILE_SIZE
        };
    }
}
