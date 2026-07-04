export class NavigationGrid {
    constructor(gridCols, gridRows, gridSize) {
        this.walls = [];
        this._initStorage(gridCols, gridRows, gridSize);
    }

    _initStorage(gridCols, gridRows, gridSize) {
        this.gridCols = gridCols;
        this.gridRows = gridRows;
        this.gridSize = gridSize;
        this.wallGrid = new Map();
        this.wallBlocked = new Uint8Array(this.gridCols * this.gridRows);
        this.enemyGrid = new Map();
        this.flowDist = new Int32Array(this.gridCols * this.gridRows);
        this.flowDirX = new Float32Array(this.gridCols * this.gridRows);
        this.flowDirY = new Float32Array(this.gridCols * this.gridRows);
        this.flowPlayerCellX = -1;
        this.flowPlayerCellY = -1;
        // Pre-allocate BFS queue to avoid per-frame allocation
        this._queueX = new Int16Array(this.gridCols * this.gridRows);
        this._queueY = new Int16Array(this.gridCols * this.gridRows);
    }

    resize(gridCols, gridRows, gridSize = this.gridSize) {
        const nextCols = Math.max(1, Math.floor(gridCols));
        const nextRows = Math.max(1, Math.floor(gridRows));
        const nextSize = Math.max(1, Math.floor(gridSize));
        if (nextCols === this.gridCols && nextRows === this.gridRows && nextSize === this.gridSize) {
            return;
        }

        const walls = this.walls || [];
        this._initStorage(nextCols, nextRows, nextSize);
        this.walls = walls;
        if (walls.length > 0) {
            this.buildWallGrid();
        }
    }

    getCell(x, y) {
        const gx = Math.max(0, Math.min(this.gridCols - 1, Math.floor(x / this.gridSize)));
        const gy = Math.max(0, Math.min(this.gridRows - 1, Math.floor(y / this.gridSize)));
        return { x: gx, y: gy };
    }

    setWalls(walls) {
        this.walls = walls;
        this.buildWallGrid();
    }

    buildWallGrid() {
        this.wallGrid.clear();
        this.wallBlocked.fill(0);
        for (const wall of this.walls) {
            const startX = Math.floor(wall.x / this.gridSize);
            const endX = Math.floor((wall.x + wall.w - 1) / this.gridSize);
            const startY = Math.floor(wall.y / this.gridSize);
            const endY = Math.floor((wall.y + wall.h - 1) / this.gridSize);
            for (let gx = startX; gx <= endX; gx++) {
                if (gx < 0 || gx >= this.gridCols) continue;
                for (let gy = startY; gy <= endY; gy++) {
                    if (gy < 0 || gy >= this.gridRows) continue;
                    const key = gx + gy * this.gridCols;
                    let list = this.wallGrid.get(key);
                    if (!list) {
                        list = [];
                        this.wallGrid.set(key, list);
                    }
                    list.push(wall);
                    this.wallBlocked[key] = 1;
                }
            }
        }
    }

    getWallCandidatesForRect(rect) {
        const left = Math.floor(rect.x / this.gridSize);
        const right = Math.floor((rect.x + rect.width - 1) / this.gridSize);
        const top = Math.floor(rect.y / this.gridSize);
        const bottom = Math.floor((rect.y + rect.height - 1) / this.gridSize);
        const candidates = [];
        for (let gx = left; gx <= right; gx++) {
            if (gx < 0 || gx >= this.gridCols) continue;
            for (let gy = top; gy <= bottom; gy++) {
                if (gy < 0 || gy >= this.gridRows) continue;
                const key = gx + gy * this.gridCols;
                const list = this.wallGrid.get(key);
                if (list) {
                    for (const wall of list) {
                        candidates.push(wall);
                    }
                }
            }
        }
        return candidates;
    }

    isWallRectCollision(rect) {
        const candidates = this.getWallCandidatesForRect(rect);
        for (const wall of candidates) {
            if (rect.x < wall.x + wall.w &&
                rect.x + rect.width > wall.x &&
                rect.y < wall.y + wall.h &&
                rect.y + rect.height > wall.y) {
                return true;
            }
        }
        return false;
    }

    updateFlowField(playerX, playerY) {
        this.updateLocalFlowField(playerX, playerY, null);
    }

    updateLocalFlowField(playerX, playerY, radiusCells = null) {
        const total = this.gridCols * this.gridRows;
        this.flowDist.fill(-1);
        this.flowDirX.fill(0);
        this.flowDirY.fill(0);
        const queueX = this._queueX;
        const queueY = this._queueY;
        let head = 0;
        let tail = 0;

        const cell = this.getCell(playerX, playerY);
        this.flowPlayerCellX = cell.x;
        this.flowPlayerCellY = cell.y;
        const startIndex = cell.y * this.gridCols + cell.x;
        // Always seed player cell — player is physically here even if
        // a breakable object partially overlaps this cell
        this.flowDist[startIndex] = 0;
        queueX[tail] = cell.x;
        queueY[tail] = cell.y;
        tail++;

        const dirsX = [1, -1, 0, 0];
        const dirsY = [0, 0, 1, -1];
        const minX = radiusCells == null ? 0 : Math.max(0, cell.x - radiusCells);
        const maxX = radiusCells == null ? this.gridCols - 1 : Math.min(this.gridCols - 1, cell.x + radiusCells);
        const minY = radiusCells == null ? 0 : Math.max(0, cell.y - radiusCells);
        const maxY = radiusCells == null ? this.gridRows - 1 : Math.min(this.gridRows - 1, cell.y + radiusCells);

        while (head < tail) {
            const x = queueX[head];
            const y = queueY[head];
            head++;
            const baseIndex = y * this.gridCols + x;
            const baseDist = this.flowDist[baseIndex];
            for (let i = 0; i < 4; i++) {
                const nx = x + dirsX[i];
                const ny = y + dirsY[i];
                if (nx < 0 || ny < 0 || nx >= this.gridCols || ny >= this.gridRows) continue;
                if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
                const nIndex = ny * this.gridCols + nx;
                if (this.wallBlocked[nIndex] === 1) continue;
                if (this.flowDist[nIndex] === -1) {
                    this.flowDist[nIndex] = baseDist + 1;
                    queueX[tail] = nx;
                    queueY[tail] = ny;
                    tail++;
                }
            }
        }

        const neighX = [1, -1, 0, 0, 1, 1, -1, -1];
        const neighY = [0, 0, 1, -1, 1, -1, 1, -1];

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const idx = y * this.gridCols + x;
                if (this.wallBlocked[idx] === 1 || this.flowDist[idx] < 0) {
                    this.flowDirX[idx] = 0;
                    this.flowDirY[idx] = 0;
                    continue;
                }
                let bestDist = this.flowDist[idx];
                let bestX = 0;
                let bestY = 0;
                for (let i = 0; i < 8; i++) {
                    const nx = x + neighX[i];
                    const ny = y + neighY[i];
                    if (nx < 0 || ny < 0 || nx >= this.gridCols || ny >= this.gridRows) continue;
                    const nIndex = ny * this.gridCols + nx;
                    const nd = this.flowDist[nIndex];
                    if (nd >= 0 && nd < bestDist) {
                        bestDist = nd;
                        bestX = nx - x;
                        bestY = ny - y;
                    }
                }
                if (bestX === 0 && bestY === 0) {
                    this.flowDirX[idx] = 0;
                    this.flowDirY[idx] = 0;
                } else {
                    const len = Math.sqrt(bestX * bestX + bestY * bestY);
                    this.flowDirX[idx] = bestX / len;
                    this.flowDirY[idx] = bestY / len;
                }
            }
        }
    }

    getFlowDirection(x, y) {
        const cell = this.getCell(x, y);
        const idx = cell.y * this.gridCols + cell.x;
        return { x: this.flowDirX[idx], y: this.flowDirY[idx] };
    }

    getFlowDistance(x, y) {
        const cell = this.getCell(x, y);
        const idx = cell.y * this.gridCols + cell.x;
        return this.flowDist[idx];
    }

    findNavigableDirection(x, y, width, height, desiredX, desiredY) {
        let dx = desiredX;
        let dy = desiredY;
        const dLen = Math.sqrt(dx * dx + dy * dy);
        if (dLen > 0) {
            dx /= dLen;
            dy /= dLen;
        } else {
            const flow = this.getFlowDirection(x, y);
            dx = flow.x;
            dy = flow.y;
        }

        const candidates = [];
        if (dx !== 0 || dy !== 0) {
            const leftX = -dy;
            const leftY = dx;
            const rightX = dy;
            const rightY = -dx;
            const mix = 0.7;
            candidates.push({ x: dx, y: dy });
            candidates.push(this._normalize(dx + leftX * mix, dy + leftY * mix));
            candidates.push(this._normalize(dx + rightX * mix, dy + rightY * mix));
            candidates.push({ x: leftX, y: leftY });
            candidates.push({ x: rightX, y: rightY });
            candidates.push({ x: -dx, y: -dy });
        }

        candidates.push(
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 },
            { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 }
        );

        const currentDist = this.getFlowDistance(x, y);
        let best = { x: 0, y: 0 };
        let bestDist = Number.POSITIVE_INFINITY;
        let bestDot = -Infinity;
        const lookahead = Math.max(10, Math.min(this.gridSize * 0.6, 16));
        // Scale look-ahead and tolerance to maintain ~64px in world space
        const flowLook = Math.max(24, this.gridSize);
        const maxDetour = Math.max(2, Math.ceil(64 / this.gridSize));

        for (const cand of candidates) {
            if (!cand || (cand.x === 0 && cand.y === 0)) continue;
            const testRect = {
                x: x + cand.x * lookahead - width / 2,
                y: y + cand.y * lookahead - height / 2,
                width,
                height
            };
            if (this.isWallRectCollision(testRect)) continue;

            const cell = this.getCell(x + cand.x * flowLook, y + cand.y * flowLook);
            const idx = cell.y * this.gridCols + cell.x;
            const dist = this.flowDist[idx];
            if (dist < 0) continue;
            if (currentDist >= 0 && dist > currentDist + maxDetour) continue;

            const dot = cand.x * dx + cand.y * dy;
            if (dist < bestDist || (dist === bestDist && dot > bestDot)) {
                bestDist = dist;
                bestDot = dot;
                best = cand;
            }
        }

        // Fallback: all candidates blocked (e.g. stuck at door edge).
        // Compute gradient from nearby flow field cells to steer toward
        // the center of passable gaps. Use short lookahead for micro-adjustments.
        if (best.x === 0 && best.y === 0 && currentDist >= 0) {
            const cell = this.getCell(x, y);
            const searchR = 3;
            let gradX = 0, gradY = 0;
            for (let ox = -searchR; ox <= searchR; ox++) {
                const nx = cell.x + ox;
                if (nx < 0 || nx >= this.gridCols) continue;
                for (let oy = -searchR; oy <= searchR; oy++) {
                    if (ox === 0 && oy === 0) continue;
                    const ny = cell.y + oy;
                    if (ny < 0 || ny >= this.gridRows) continue;
                    const nIdx = ny * this.gridCols + nx;
                    const nd = this.flowDist[nIdx];
                    if (nd < 0 || nd >= currentDist) continue;
                    const weight = currentDist - nd;
                    const len = Math.sqrt(ox * ox + oy * oy);
                    gradX += (ox / len) * weight;
                    gradY += (oy / len) * weight;
                }
            }
            const gradLen = Math.sqrt(gradX * gradX + gradY * gradY);
            if (gradLen > 0) {
                gradX /= gradLen;
                gradY /= gradLen;
                const shortLook = 3;
                const testRect = {
                    x: x + gradX * shortLook - width / 2,
                    y: y + gradY * shortLook - height / 2,
                    width,
                    height
                };
                if (!this.isWallRectCollision(testRect)) {
                    best = { x: gradX, y: gradY };
                }
            }
        }

        return best;
    }

    _normalize(x, y) {
        const len = Math.sqrt(x * x + y * y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    }

    buildEnemyGrid(enemies) {
        this.enemyGrid.clear();
        for (const enemy of enemies) {
            const cell = this.getCell(enemy.x, enemy.y);
            const key = cell.x + cell.y * this.gridCols;
            let list = this.enemyGrid.get(key);
            if (!list) {
                list = [];
                this.enemyGrid.set(key, list);
            }
            list.push(enemy);
        }
    }

    getNearbyEnemies(enemy) {
        const cell = this.getCell(enemy.x, enemy.y);
        const neighbors = [];
        // Search radius in cells: cover at least 32px for separation checks
        const range = Math.max(1, Math.ceil(32 / this.gridSize));
        for (let ox = -range; ox <= range; ox++) {
            const nx = cell.x + ox;
            if (nx < 0 || nx >= this.gridCols) continue;
            for (let oy = -range; oy <= range; oy++) {
                const ny = cell.y + oy;
                if (ny < 0 || ny >= this.gridRows) continue;
                const key = nx + ny * this.gridCols;
                const list = this.enemyGrid.get(key);
                if (list) {
                    for (const other of list) {
                        neighbors.push(other);
                    }
                }
            }
        }
        return neighbors;
    }
}
