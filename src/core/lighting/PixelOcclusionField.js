function toRect(raw) {
    if (!raw) return null;
    const width = raw.width ?? raw.w;
    const height = raw.height ?? raw.h;
    if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        return null;
    }
    if (width <= 0 || height <= 0) return null;
    return {
        x: raw.x,
        y: raw.y,
        width,
        height
    };
}

export class PixelOcclusionField {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.solid = new Uint8Array(0);
        this.ownerIds = new Int32Array(0);
    }

    ensureSize(width, height) {
        const w = Math.max(1, width | 0);
        const h = Math.max(1, height | 0);
        if (w === this.width && h === this.height) return;

        this.width = w;
        this.height = h;
        this.solid = new Uint8Array(w * h);
        this.ownerIds = new Int32Array(w * h);
    }

    clear() {
        this.solid.fill(0);
        this.ownerIds.fill(0);
    }

    rasterizeWorldRect(rawRect, viewX, viewY, scale, ownerId = 0) {
        const rect = toRect(rawRect);
        if (!rect) return;

        const x0 = Math.floor((rect.x - viewX) * scale);
        const y0 = Math.floor((rect.y - viewY) * scale);
        const x1 = Math.ceil((rect.x + rect.width - viewX) * scale) - 1;
        const y1 = Math.ceil((rect.y + rect.height - viewY) * scale) - 1;

        if (x1 < 0 || y1 < 0 || x0 >= this.width || y0 >= this.height) return;

        const minX = Math.max(0, x0);
        const minY = Math.max(0, y0);
        const maxX = Math.min(this.width - 1, x1);
        const maxY = Math.min(this.height - 1, y1);

        for (let y = minY; y <= maxY; y++) {
            const rowOffset = y * this.width;
            for (let x = minX; x <= maxX; x++) {
                const idx = rowOffset + x;
                this.solid[idx] = 1;
                this.ownerIds[idx] = ownerId;
            }
        }
    }

    rasterizeSpriteMask({
        spriteX,
        spriteY,
        mask,
        maskWidth,
        maskHeight,
        localBounds
    }, viewX, viewY, scale, ownerId = 0) {
        if (!mask || !Number.isFinite(maskWidth) || !Number.isFinite(maskHeight)) return;
        if (maskWidth <= 0 || maskHeight <= 0) return;

        const minX = Math.max(0, localBounds?.minX ?? 0);
        const minY = Math.max(0, localBounds?.minY ?? 0);
        const maxX = Math.min(maskWidth - 1, localBounds?.maxX ?? (maskWidth - 1));
        const maxY = Math.min(maskHeight - 1, localBounds?.maxY ?? (maskHeight - 1));
        if (maxX < minX || maxY < minY) return;

        for (let sy = minY; sy <= maxY; sy++) {
            const srcRow = sy * maskWidth;
            for (let sx = minX; sx <= maxX; sx++) {
                if (!mask[srcRow + sx]) continue;

                const worldX = spriteX + sx;
                const worldY = spriteY + sy;
                const bx = Math.floor((worldX - viewX) * scale);
                const by = Math.floor((worldY - viewY) * scale);

                if (bx < 0 || by < 0 || bx >= this.width || by >= this.height) continue;

                const idx = by * this.width + bx;
                this.solid[idx] = 1;
                this.ownerIds[idx] = ownerId;
            }
        }
    }

    getOwnerAt(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
        const idx = y * this.width + x;
        return this.ownerIds[idx] | 0;
    }

    traceRay(ox, oy, dx, dy, maxDist) {
        const limit = Math.max(1, Math.ceil(maxDist));
        let lastFreeX = ox;
        let lastFreeY = oy;

        for (let step = 1; step <= limit; step++) {
            const px = ox + dx * step;
            const py = oy + dy * step;
            const ix = Math.floor(px);
            const iy = Math.floor(py);

            if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
                return { hit: false, ownerId: 0, dist: Math.min(step, maxDist), x: lastFreeX, y: lastFreeY };
            }

            const idx = iy * this.width + ix;
            if (this.solid[idx] !== 0) {
                return {
                    hit: true,
                    ownerId: this.ownerIds[idx] | 0,
                    dist: Math.min(step, maxDist),
                    x: lastFreeX,
                    y: lastFreeY
                };
            }

            lastFreeX = px;
            lastFreeY = py;
        }

        const px = ox + dx * maxDist;
        const py = oy + dy * maxDist;
        return { hit: false, ownerId: 0, dist: maxDist, x: px, y: py };
    }
}
