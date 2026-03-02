function getRectWidth(entry) {
    return entry.w ?? entry.width ?? 0;
}

function getRectHeight(entry) {
    return entry.h ?? entry.height ?? 0;
}

export class OccluderSpatialIndex {
    constructor(cellSize = 64) {
        this.cellSize = Math.max(8, Math.floor(cellSize) || 64);
        this._cells = new Map();
        this._queryMarks = new WeakMap();
        this._queryToken = 1;
    }

    clear() {
        this._cells.clear();
        this._queryMarks = new WeakMap();
        this._queryToken = 1;
    }

    build(entries = []) {
        this.clear();
        if (!Array.isArray(entries) || entries.length === 0) return;

        const cellSize = this.cellSize;
        for (const entry of entries) {
            if (!entry) continue;
            const width = getRectWidth(entry);
            const height = getRectHeight(entry);
            if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y) || width <= 0 || height <= 0) continue;

            const minCellX = Math.floor(entry.x / cellSize);
            const maxCellX = Math.floor((entry.x + width - 1) / cellSize);
            const minCellY = Math.floor(entry.y / cellSize);
            const maxCellY = Math.floor((entry.y + height - 1) / cellSize);

            for (let cy = minCellY; cy <= maxCellY; cy++) {
                for (let cx = minCellX; cx <= maxCellX; cx++) {
                    const key = cx + ',' + cy;
                    let bucket = this._cells.get(key);
                    if (!bucket) {
                        bucket = [];
                        this._cells.set(key, bucket);
                    }
                    bucket.push(entry);
                }
            }
        }
    }

    queryCircle(x, y, radius, out = []) {
        out.length = 0;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) {
            return out;
        }

        const left = x - radius;
        const right = x + radius;
        const top = y - radius;
        const bottom = y + radius;
        const cellSize = this.cellSize;

        const minCellX = Math.floor(left / cellSize);
        const maxCellX = Math.floor(right / cellSize);
        const minCellY = Math.floor(top / cellSize);
        const maxCellY = Math.floor(bottom / cellSize);

        const token = this._nextToken();
        for (let cy = minCellY; cy <= maxCellY; cy++) {
            for (let cx = minCellX; cx <= maxCellX; cx++) {
                const bucket = this._cells.get(cx + ',' + cy);
                if (!bucket) continue;

                for (const entry of bucket) {
                    if (!entry) continue;
                    if (this._queryMarks.get(entry) === token) continue;
                    this._queryMarks.set(entry, token);

                    const width = getRectWidth(entry);
                    const height = getRectHeight(entry);
                    if (entry.x > right || entry.x + width < left || entry.y > bottom || entry.y + height < top) {
                        continue;
                    }
                    out.push(entry);
                }
            }
        }
        return out;
    }

    _nextToken() {
        this._queryToken++;
        if (this._queryToken >= 2147483646) {
            this._queryToken = 1;
            this._queryMarks = new WeakMap();
        }
        return this._queryToken;
    }
}
