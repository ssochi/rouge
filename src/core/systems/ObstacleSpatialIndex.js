export class ObstacleSpatialIndex {
    constructor({ gridSize = 32, gridCols = 1, gridRows = 1 } = {}) {
        this.gridSize = Math.max(1, gridSize | 0);
        this.gridCols = Math.max(1, gridCols | 0);
        this.gridRows = Math.max(1, gridRows | 0);
        this.cells = new Map();
        this.entries = [];
        this._queryToken = 1;
    }

    resize({ gridSize = this.gridSize, gridCols = this.gridCols, gridRows = this.gridRows } = {}) {
        this.gridSize = Math.max(1, gridSize | 0);
        this.gridCols = Math.max(1, gridCols | 0);
        this.gridRows = Math.max(1, gridRows | 0);
        this.clear();
    }

    clear() {
        this.cells.clear();
        this.entries.length = 0;
        this._queryToken = 1;
    }

    rebuild({ walls = [], breakableObjects = [] } = {}) {
        this.clear();

        for (const wall of walls) {
            if (!wall) continue;
            this._insertRect({
                x: wall.x,
                y: wall.y,
                width: wall.w,
                height: wall.h,
                object: null
            });
        }

        for (const obj of breakableObjects) {
            if (!obj || obj.isBroken) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
            for (const hb of hitboxes) {
                this._insertRect({
                    x: hb.x,
                    y: hb.y,
                    width: hb.width ?? hb.w,
                    height: hb.height ?? hb.h,
                    object: obj
                });
            }
        }
    }

    queryRect(rect, options = {}) {
        if (!rect) return [];
        const width = rect.width ?? rect.w ?? 0;
        const height = rect.height ?? rect.h ?? 0;
        if (width <= 0 || height <= 0) return [];

        const rawMinCellX = Math.floor(rect.x / this.gridSize);
        const rawMaxCellX = Math.floor((rect.x + width - 1) / this.gridSize);
        const rawMinCellY = Math.floor(rect.y / this.gridSize);
        const rawMaxCellY = Math.floor((rect.y + height - 1) / this.gridSize);
        if (rawMaxCellX < 0 || rawMaxCellY < 0 || rawMinCellX >= this.gridCols || rawMinCellY >= this.gridRows) {
            return [];
        }

        const minCellX = this._clampCellX(rawMinCellX);
        const maxCellX = this._clampCellX(rawMaxCellX);
        const minCellY = this._clampCellY(rawMinCellY);
        const maxCellY = this._clampCellY(rawMaxCellY);

        const objectsOnly = !!options.objectsOnly;
        const wallsOnly = !!options.wallsOnly;
        const token = this._nextToken();
        const out = [];

        for (let cy = minCellY; cy <= maxCellY; cy++) {
            for (let cx = minCellX; cx <= maxCellX; cx++) {
                const key = cx + cy * this.gridCols;
                const list = this.cells.get(key);
                if (!list) continue;

                for (const index of list) {
                    const entry = this.entries[index];
                    if (!entry) continue;
                    if (entry._token === token) continue;
                    entry._token = token;

                    const isObject = !!entry.object;
                    if (objectsOnly && !isObject) continue;
                    if (wallsOnly && isObject) continue;
                    out.push(entry);
                }
            }
        }
        return out;
    }

    queryCircle(x, y, radius, options = {}) {
        const r = Math.max(0, radius || 0);
        const rect = {
            x: x - r,
            y: y - r,
            width: r * 2,
            height: r * 2
        };
        const candidates = this.queryRect(rect, options);
        if (candidates.length === 0) return candidates;

        const rSq = r * r;
        const out = [];
        for (const entry of candidates) {
            if (this._distanceSqPointToRect(x, y, entry.rect) <= rSq) {
                out.push(entry);
            }
        }
        return out;
    }

    _insertRect({ x, y, width, height, object }) {
        const w = width ?? 0;
        const h = height ?? 0;
        if (!Number.isFinite(x) || !Number.isFinite(y) || w <= 0 || h <= 0) return;

        const rect = { x, y, width: w, height: h };
        const rawMinCellX = Math.floor(rect.x / this.gridSize);
        const rawMaxCellX = Math.floor((rect.x + rect.width - 1) / this.gridSize);
        const rawMinCellY = Math.floor(rect.y / this.gridSize);
        const rawMaxCellY = Math.floor((rect.y + rect.height - 1) / this.gridSize);
        if (rawMaxCellX < 0 || rawMaxCellY < 0 || rawMinCellX >= this.gridCols || rawMinCellY >= this.gridRows) {
            return;
        }

        const entry = {
            rect,
            object: object || null,
            _token: 0
        };
        const index = this.entries.length;
        this.entries.push(entry);

        const minCellX = this._clampCellX(rawMinCellX);
        const maxCellX = this._clampCellX(rawMaxCellX);
        const minCellY = this._clampCellY(rawMinCellY);
        const maxCellY = this._clampCellY(rawMaxCellY);

        for (let cy = minCellY; cy <= maxCellY; cy++) {
            for (let cx = minCellX; cx <= maxCellX; cx++) {
                const key = cx + cy * this.gridCols;
                let list = this.cells.get(key);
                if (!list) {
                    list = [];
                    this.cells.set(key, list);
                }
                list.push(index);
            }
        }
    }

    _distanceSqPointToRect(px, py, rect) {
        const nearX = Math.max(rect.x, Math.min(px, rect.x + rect.width));
        const nearY = Math.max(rect.y, Math.min(py, rect.y + rect.height));
        const dx = px - nearX;
        const dy = py - nearY;
        return dx * dx + dy * dy;
    }

    _clampCellX(cellX) {
        if (cellX < 0) return 0;
        if (cellX >= this.gridCols) return this.gridCols - 1;
        return cellX;
    }

    _clampCellY(cellY) {
        if (cellY < 0) return 0;
        if (cellY >= this.gridRows) return this.gridRows - 1;
        return cellY;
    }

    _nextToken() {
        this._queryToken++;
        if (this._queryToken >= 2147483646) {
            this._queryToken = 1;
            for (const entry of this.entries) {
                entry._token = 0;
            }
        }
        return this._queryToken;
    }
}
