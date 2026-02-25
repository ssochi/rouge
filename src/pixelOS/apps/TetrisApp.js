/**
 * TetrisApp - Classic Tetris game with 10x20 grid
 */
import { App } from './App.js';

// 7 standard tetrominoes: I, O, T, S, Z, J, L
const PIECES = [
    { // I - cyan
        shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        color: '#00f0f0'
    },
    { // O - yellow
        shape: [[1,1],[1,1]],
        color: '#f0f000'
    },
    { // T - purple
        shape: [[0,1,0],[1,1,1],[0,0,0]],
        color: '#a000f0'
    },
    { // S - green
        shape: [[0,1,1],[1,1,0],[0,0,0]],
        color: '#00f000'
    },
    { // Z - red
        shape: [[1,1,0],[0,1,1],[0,0,0]],
        color: '#f00000'
    },
    { // J - blue
        shape: [[1,0,0],[1,1,1],[0,0,0]],
        color: '#0000f0'
    },
    { // L - orange
        shape: [[0,0,1],[1,1,1],[0,0,0]],
        color: '#f0a000'
    },
];

export class TetrisApp extends App {
    constructor() {
        super('tetris', 'Tetris');
        this._newGame();
    }

    _newGame() {
        this.cols = 10;
        this.rows = 20;
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.hoveredNewGame = false;

        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.nextPiece = this._randomPiece();
        this._spawnPiece();

        this.dropTimer = 0;
        this.dropInterval = 45; // frames between drops
        this.fastDrop = false;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 120, y: 15,
            width: 110, height: 160,
            title: 'Tetris',
            appId: this.id,
            app: this
        });
    }

    update() {
        if (this.gameOver) return;

        this.dropTimer++;
        const interval = this.fastDrop ? 3 : Math.max(5, this.dropInterval - this.level * 4);

        if (this.dropTimer >= interval) {
            this.dropTimer = 0;
            if (!this._tryMove(0, 1)) {
                this._lockPiece();
                this._clearLines();
                this._spawnPiece();
            }
        }
    }

    draw(r, x, y, w, h) {
        r.fillRect(x, y, w, h, '#1a1a2e');

        const cellSize = Math.min(
            Math.floor((w - 36) / this.cols),
            Math.floor((h - 4) / this.rows)
        );
        const boardW = cellSize * this.cols;
        const boardH = cellSize * this.rows;
        const bx = x + 2;
        const by = y + 2;

        // Board background
        r.fillRect(bx, by, boardW, boardH, '#0a0a1e');

        // Grid lines
        for (let row = 0; row <= this.rows; row++) {
            r.fillRect(bx, by + row * cellSize, boardW, 1, '#1a1a3e');
        }
        for (let col = 0; col <= this.cols; col++) {
            r.fillRect(bx + col * cellSize, by, 1, boardH, '#1a1a3e');
        }

        // Placed blocks
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this._drawCell(r, bx + col * cellSize, by + row * cellSize, cellSize, this.board[row][col]);
                }
            }
        }

        // Current piece
        if (this.currentPiece && !this.gameOver) {
            const shape = this.currentPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const px = this.currentX + col;
                        const py = this.currentY + row;
                        if (py >= 0) {
                            this._drawCell(r, bx + px * cellSize, by + py * cellSize, cellSize, this.currentPiece.color);
                        }
                    }
                }
            }
        }

        // Right sidebar
        const sx = bx + boardW + 4;
        const sw = w - boardW - 10;

        // Score
        r.drawText('Score', sx, y + 3, '#888888');
        r.drawText(String(this.score), sx, y + 11, '#ffffff');

        // Lines
        r.drawText('Lines', sx, y + 23, '#888888');
        r.drawText(String(this.lines), sx, y + 31, '#ffffff');

        // Level
        r.drawText('Level', sx, y + 43, '#888888');
        r.drawText(String(this.level), sx, y + 51, '#ffffff');

        // Next piece preview
        r.drawText('Next', sx, y + 65, '#888888');
        if (this.nextPiece) {
            const previewSize = 4;
            const shape = this.nextPiece.shape;
            const pvx = sx;
            const pvy = y + 74;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this._drawCell(r, pvx + col * previewSize, pvy + row * previewSize, previewSize, this.nextPiece.color);
                    }
                }
            }
        }

        // Game over overlay
        if (this.gameOver) {
            r.fillRect(bx, by, boardW, boardH, 'rgba(0,0,0,0.6)');
            r.drawTextCentered('GAME', bx + boardW / 2, by + boardH / 2 - 12, '#ff4444');
            r.drawTextCentered('OVER', bx + boardW / 2, by + boardH / 2 - 2, '#ff4444');

            const btnW = boardW - 4;
            const btnH = 10;
            const btnX = bx + 2;
            const btnY = by + boardH / 2 + 12;
            const btnColor = this.hoveredNewGame ? '#444466' : '#333355';
            r.fillRoundRect(btnX, btnY, btnW, btnH, 2, btnColor);
            r.drawTextCentered('Retry', btnX + btnW / 2, btnY + 2, '#ffffff');
        }
    }

    _drawCell(r, x, y, size, color) {
        r.fillRect(x + 1, y + 1, size - 1, size - 1, color);
        // Highlight
        r.fillRect(x + 1, y + 1, size - 1, 1, 'rgba(255,255,255,0.3)');
        r.fillRect(x + 1, y + 1, 1, size - 1, 'rgba(255,255,255,0.2)');
    }

    onKeyDown(key) {
        if (this.gameOver) return;

        switch (key) {
            case 'ArrowLeft':
                this._tryMove(-1, 0);
                break;
            case 'ArrowRight':
                this._tryMove(1, 0);
                break;
            case 'ArrowDown':
                this.fastDrop = true;
                break;
            case 'ArrowUp':
                this._rotate();
                break;
            case ' ':
                // Hard drop
                while (this._tryMove(0, 1)) {}
                this._lockPiece();
                this._clearLines();
                this._spawnPiece();
                break;
        }
    }

    onKeyUp(key) {
        if (key === 'ArrowDown') {
            this.fastDrop = false;
        }
    }

    onMouseDown(lx, ly) {
        if (this.gameOver) {
            const w = this.window ? this.window.contentWidth : 110;
            const h = this.window ? this.window.contentHeight : 148;
            const cellSize = Math.min(
                Math.floor((w - 36) / this.cols),
                Math.floor((h - 4) / this.rows)
            );
            const boardW = cellSize * this.cols;
            const boardH = cellSize * this.rows;
            const bx = 2;
            const by = 2;

            const btnW = boardW - 4;
            const btnH = 10;
            const btnX = bx + 2;
            const btnY = by + boardH / 2 + 12;

            if (lx >= btnX && lx < btnX + btnW && ly >= btnY && ly < btnY + btnH) {
                this._newGame();
            }
        }
    }

    onMouseMove(lx, ly) {
        this.hoveredNewGame = false;
        if (this.gameOver) {
            const w = this.window ? this.window.contentWidth : 110;
            const h = this.window ? this.window.contentHeight : 148;
            const cellSize = Math.min(
                Math.floor((w - 36) / this.cols),
                Math.floor((h - 4) / this.rows)
            );
            const boardW = cellSize * this.cols;
            const boardH = cellSize * this.rows;
            const bx = 2;
            const by = 2;

            const btnW = boardW - 4;
            const btnH = 10;
            const btnX = bx + 2;
            const btnY = by + boardH / 2 + 12;

            if (lx >= btnX && lx < btnX + btnW && ly >= btnY && ly < btnY + btnH) {
                this.hoveredNewGame = true;
            }
        }
    }

    _randomPiece() {
        const idx = Math.floor(Math.random() * PIECES.length);
        return {
            shape: PIECES[idx].shape.map(row => [...row]),
            color: PIECES[idx].color
        };
    }

    _spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this._randomPiece();
        this.currentX = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
        this.currentY = -1;
        this.fastDrop = false;

        if (!this._isValid(this.currentPiece.shape, this.currentX, this.currentY)) {
            this.gameOver = true;
        }
    }

    _tryMove(dx, dy) {
        if (!this.currentPiece) return false;
        const nx = this.currentX + dx;
        const ny = this.currentY + dy;
        if (this._isValid(this.currentPiece.shape, nx, ny)) {
            this.currentX = nx;
            this.currentY = ny;
            return true;
        }
        return false;
    }

    _rotate() {
        if (!this.currentPiece) return;
        const shape = this.currentPiece.shape;
        const size = shape.length;
        const rotated = Array.from({ length: size }, () => Array(size).fill(0));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                rotated[c][size - 1 - r] = shape[r][c];
            }
        }

        // Try rotation with wall kicks
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
            if (this._isValid(rotated, this.currentX + kick, this.currentY)) {
                this.currentPiece.shape = rotated;
                this.currentX += kick;
                return;
            }
        }
    }

    _isValid(shape, px, py) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const bx = px + c;
                const by = py + r;
                if (bx < 0 || bx >= this.cols || by >= this.rows) return false;
                if (by >= 0 && this.board[by][bx] !== null) return false;
            }
        }
        return true;
    }

    _lockPiece() {
        if (!this.currentPiece) return;
        const shape = this.currentPiece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const bx = this.currentX + c;
                const by = this.currentY + r;
                if (by >= 0 && by < this.rows && bx >= 0 && bx < this.cols) {
                    this.board[by][bx] = this.currentPiece.color;
                }
            }
        }
    }

    _clearLines() {
        let cleared = 0;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r].every(cell => cell !== null)) {
                this.board.splice(r, 1);
                this.board.unshift(Array(this.cols).fill(null));
                cleared++;
                r++; // re-check this row
            }
        }

        if (cleared > 0) {
            // Scoring: 100, 300, 500, 800 for 1-4 lines
            const points = [0, 100, 300, 500, 800];
            this.score += (points[cleared] || 0) * this.level;
            this.lines += cleared;
            this.level = Math.floor(this.lines / 10) + 1;
        }
    }
}
