/**
 * Game2048App - Classic 2048 sliding puzzle game
 */
import { App } from './App.js';

const TILE_COLORS = {
    0:    '#cdc1b4',
    2:    '#eee4da',
    4:    '#ede0c8',
    8:    '#f2b179',
    16:   '#f59563',
    32:   '#f67c5f',
    64:   '#f65e3b',
    128:  '#edcf72',
    256:  '#edcc61',
    512:  '#edc850',
    1024: '#edc53f',
    2048: '#edc22e',
};

const TEXT_COLORS = {
    2: '#776e65', 4: '#776e65',
};

export class Game2048App extends App {
    constructor() {
        super('game2048', '2048');
        this._newGame();
    }

    _newGame() {
        this.grid = Array.from({ length: 4 }, () => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this._spawnTile();
        this._spawnTile();
        this.hoveredNewGame = false;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 130, y: 30,
            width: 120, height: 140,
            title: '2048',
            appId: this.id,
            app: this
        });
    }

    draw(r, x, y, w, h) {
        r.fillRect(x, y, w, h, '#faf8ef');

        // Score
        r.drawText('Score:', x + 4, y + 3, '#776e65');
        r.drawText(String(this.score), x + 38, y + 3, '#776e65');

        // Grid
        const gridSize = Math.min(w - 8, h - 28);
        const cellSize = Math.floor(gridSize / 4);
        const gridW = cellSize * 4;
        const gx = x + Math.floor((w - gridW) / 2);
        const gy = y + 14;

        // Grid background
        r.fillRoundRect(gx - 2, gy - 2, gridW + 4, gridW + 4, 2, '#bbada0');

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const val = this.grid[row][col];
                const cx = gx + col * cellSize + 1;
                const cy = gy + row * cellSize + 1;
                const cs = cellSize - 2;

                const bgColor = TILE_COLORS[val] || '#3c3a32';
                r.fillRoundRect(cx, cy, cs, cs, 1, bgColor);

                if (val > 0) {
                    const textColor = TEXT_COLORS[val] || '#f9f6f2';
                    const text = String(val);
                    r.drawTextCentered(text, cx + cs / 2, cy + (cs - 5) / 2, textColor);
                }
            }
        }

        // Game over / Win overlay
        if (this.gameOver || this.won) {
            r.fillRect(gx - 2, gy - 2, gridW + 4, gridW + 4, 'rgba(238,228,218,0.7)');
            const msg = this.won ? 'You Win!' : 'Game Over';
            r.drawTextCentered(msg, x + w / 2, gy + gridW / 2 - 10, '#776e65');

            // New Game button
            const btnW = 50;
            const btnH = 12;
            const btnX = x + (w - btnW) / 2;
            const btnY = gy + gridW / 2 + 4;
            const btnColor = this.hoveredNewGame ? '#9f8b77' : '#8f7a66';
            r.fillRoundRect(btnX, btnY, btnW, btnH, 2, btnColor);
            r.drawTextCentered('New Game', btnX + btnW / 2, btnY + 3, '#f9f6f2');
        }
    }

    onKeyDown(key) {
        if (this.gameOver || this.won) return;

        let moved = false;
        switch (key) {
            case 'ArrowLeft':  moved = this._move('left'); break;
            case 'ArrowRight': moved = this._move('right'); break;
            case 'ArrowUp':    moved = this._move('up'); break;
            case 'ArrowDown':  moved = this._move('down'); break;
        }

        if (moved) {
            this._spawnTile();
            if (this._checkWin()) {
                this.won = true;
            } else if (this._checkGameOver()) {
                this.gameOver = true;
            }
        }
    }

    onMouseDown(lx, ly) {
        if (this.gameOver || this.won) {
            // Check "New Game" button
            const w = this.window ? this.window.contentWidth : 120;
            const h = this.window ? this.window.contentHeight : 128;
            const gridSize = Math.min(w - 8, h - 28);
            const cellSize = Math.floor(gridSize / 4);
            const gridW = cellSize * 4;
            const gx = Math.floor((w - gridW) / 2);
            const gy = 14;

            const btnW = 50;
            const btnH = 12;
            const btnX = (w - btnW) / 2;
            const btnY = gy + gridW / 2 + 4;

            if (lx >= btnX && lx < btnX + btnW && ly >= btnY && ly < btnY + btnH) {
                this._newGame();
            }
        }
    }

    onMouseMove(lx, ly) {
        this.hoveredNewGame = false;
        if (this.gameOver || this.won) {
            const w = this.window ? this.window.contentWidth : 120;
            const h = this.window ? this.window.contentHeight : 128;
            const gridSize = Math.min(w - 8, h - 28);
            const cellSize = Math.floor(gridSize / 4);
            const gridW = cellSize * 4;
            const gy = 14;

            const btnW = 50;
            const btnH = 12;
            const btnX = (w - btnW) / 2;
            const btnY = gy + gridW / 2 + 4;

            if (lx >= btnX && lx < btnX + btnW && ly >= btnY && ly < btnY + btnH) {
                this.hoveredNewGame = true;
            }
        }
    }

    _spawnTile() {
        const empty = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 0) empty.push([r, c]);
            }
        }
        if (empty.length === 0) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    _move(dir) {
        const g = this.grid;
        let moved = false;

        const getLine = (i) => {
            switch (dir) {
                case 'left':  return g[i].slice();
                case 'right': return g[i].slice().reverse();
                case 'up':    return [g[0][i], g[1][i], g[2][i], g[3][i]];
                case 'down':  return [g[3][i], g[2][i], g[1][i], g[0][i]];
            }
        };

        const setLine = (i, line) => {
            switch (dir) {
                case 'left':  g[i] = line; break;
                case 'right': g[i] = line.reverse(); break;
                case 'up':    for (let j = 0; j < 4; j++) g[j][i] = line[j]; break;
                case 'down':  for (let j = 0; j < 4; j++) g[3 - j][i] = line[j]; break;
            }
        };

        for (let i = 0; i < 4; i++) {
            const line = getLine(i);
            const result = this._mergeLine(line);
            if (result.moved) moved = true;
            setLine(i, result.line);
        }

        return moved;
    }

    _mergeLine(line) {
        // Remove zeros, slide left
        let tiles = line.filter(v => v !== 0);
        let moved = tiles.length !== line.filter(v => v !== 0).length || false;

        // Merge adjacent equal tiles
        const merged = [];
        let i = 0;
        while (i < tiles.length) {
            if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
                const val = tiles[i] * 2;
                merged.push(val);
                this.score += val;
                i += 2;
                moved = true;
            } else {
                merged.push(tiles[i]);
                i++;
            }
        }

        // Pad with zeros
        while (merged.length < 4) merged.push(0);

        // Check if anything actually moved
        if (!moved) {
            for (let j = 0; j < 4; j++) {
                if (line[j] !== merged[j]) { moved = true; break; }
            }
        }

        return { line: merged, moved };
    }

    _checkWin() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 2048) return true;
            }
        }
        return false;
    }

    _checkGameOver() {
        // Any empty cell?
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        // Any adjacent merge possible?
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const v = this.grid[r][c];
                if (c + 1 < 4 && this.grid[r][c + 1] === v) return false;
                if (r + 1 < 4 && this.grid[r + 1][c] === v) return false;
            }
        }
        return true;
    }
}
