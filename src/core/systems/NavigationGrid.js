export class NavigationGrid {
    constructor(gridCols, gridRows, gridSize) {
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
        const total = this.gridCols * this.gridRows;
        this.flowDist.fill(-1);
        const queueX = new Int16Array(total);
        const queueY = new Int16Array(total);
        let head = 0;
        let tail = 0;

        const cell = this.getCell(playerX, playerY);
        this.flowPlayerCellX = cell.x;
        this.flowPlayerCellY = cell.y;
        const startIndex = cell.y * this.gridCols + cell.x;
        if (this.wallBlocked[startIndex] === 0) {
            this.flowDist[startIndex] = 0;
            queueX[tail] = cell.x;
            queueY[tail] = cell.y;
            tail++;
        }

        const dirsX = [1, -1, 0, 0];
        const dirsY = [0, 0, 1, -1];

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

        for (let y = 0; y < this.gridRows; y++) {
            for (let x = 0; x < this.gridCols; x++) {
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

        for (const cand of candidates) {
            if (!cand || (cand.x === 0 && cand.y === 0)) continue;
            const testRect = {
                x: x + cand.x * lookahead - width / 2,
                y: y + cand.y * lookahead - height / 2,
                width,
                height
            };
            if (this.isWallRectCollision(testRect)) continue;

            const cell = this.getCell(x + cand.x * this.gridSize * 0.9, y + cand.y * this.gridSize * 0.9);
            const idx = cell.y * this.gridCols + cell.x;
            const dist = this.flowDist[idx];
            if (dist < 0) continue;
            if (currentDist >= 0 && dist > currentDist + 2) continue;

            const dot = cand.x * dx + cand.y * dy;
            if (dist < bestDist || (dist === bestDist && dot > bestDot)) {
                bestDist = dist;
                bestDot = dot;
                best = cand;
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
        for (let ox = -1; ox <= 1; ox++) {
            const nx = cell.x + ox;
            if (nx < 0 || nx >= this.gridCols) continue;
            for (let oy = -1; oy <= 1; oy++) {
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
