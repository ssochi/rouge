/**
 * MarioApp - Super Mario Bros style platformer with one complete level
 */
import { App } from './App.js';

// ── Constants ──
const TILE = 8;
const HUD_H = 10;
const VIEW_W = 180;

// Physics (pixels/frame at ~60fps)
const GRAVITY = 0.35;
const JUMP_HOLD_GRAVITY = 0.18;
const JUMP_VEL = -4.2;
const MAX_FALL = 4.0;
const RUN_ACCEL = 0.3;
const RUN_DECEL = 0.4;
const MAX_SPEED = 1.5;
const STOMP_BOUNCE = -3.0;

// Key hold timeout (frames)
const KEY_TIMEOUT = 10;

// Palette
const C = {
    SKY:   '#6b8cff',
    RED:   '#e52521',
    BLUE:  '#3032d6',
    SKIN:  '#fbb040',
    HAIR:  '#6b3e08',
    BRICK: '#c84c0c',
    MORTAR:'#e8a010',
    QBLOCK:'#e8a010',
    QDARK: '#c87800',
    QBRIGHT:'#f8d830',
    USED:  '#886644',
    PIPE:  '#30b020',
    PIPELT:'#60e040',
    PIPEDK:'#186010',
    STONE: '#808080',
    STONLT:'#a0a0a0',
    STONDK:'#606060',
    COIN:  '#e8a010',
    COINLT:'#f8d830',
    WHITE: '#ffffff',
    BLACK: '#000000',
    GROUND:'#c84c0c',
    FLAG:  '#00aa00',
    POLE:  '#888888',
};

// ── Sprite data (color-coded 2D arrays, null = transparent) ──
const _=null, R=C.RED, B=C.BLUE, S=C.SKIN, H=C.HAIR, W=C.WHITE;

const MARIO_STAND = [
    [_,_,R,R,R,_,_,_],
    [_,R,R,R,R,R,_,_],
    [_,H,H,S,S,H,_,_],
    [H,S,H,S,H,S,S,_],
    [_,S,S,S,S,S,_,_],
    [_,_,B,R,B,_,_,_],
    [_,B,B,R,B,B,_,_],
    [_,B,B,B,B,B,_,_],
    [_,H,_,_,_,H,_,_],
    [_,H,_,_,_,H,_,_],
];

const MARIO_WALK1 = [
    [_,_,R,R,R,_,_,_],
    [_,R,R,R,R,R,_,_],
    [_,H,H,S,S,H,_,_],
    [H,S,H,S,H,S,S,_],
    [_,S,S,S,S,S,_,_],
    [_,_,B,R,B,_,_,_],
    [_,B,B,R,B,B,_,_],
    [_,B,B,B,B,B,_,_],
    [_,_,H,_,H,_,_,_],
    [_,_,H,_,_,H,_,_],
];

const MARIO_WALK2 = [
    [_,_,R,R,R,_,_,_],
    [_,R,R,R,R,R,_,_],
    [_,H,H,S,S,H,_,_],
    [H,S,H,S,H,S,S,_],
    [_,S,S,S,S,S,_,_],
    [_,_,B,R,B,_,_,_],
    [_,B,B,R,B,B,_,_],
    [_,B,B,B,B,B,_,_],
    [_,H,_,_,H,_,_,_],
    [H,_,_,_,_,H,_,_],
];

const MARIO_JUMP = [
    [_,_,R,R,R,_,_,_],
    [_,R,R,R,R,R,_,_],
    [_,H,H,S,S,H,_,_],
    [H,S,H,S,H,S,S,_],
    [_,S,S,S,S,S,_,_],
    [S,_,B,R,B,_,S,_],
    [_,B,B,R,B,B,_,_],
    [_,B,B,B,B,B,_,_],
    [_,H,_,_,_,H,_,_],
    [H,_,_,_,_,_,H,_],
];

const MARIO_DEAD = [
    [_,_,R,R,R,_,_,_],
    [_,R,R,R,R,R,_,_],
    [_,H,H,S,S,H,_,_],
    [S,H,S,H,S,H,S,_],
    [_,S,S,S,S,S,_,_],
    [S,_,B,R,B,_,S,_],
    [_,B,B,R,B,B,_,_],
    [_,B,B,B,B,B,_,_],
    [_,H,_,_,_,H,_,_],
    [H,_,_,_,_,_,H,_],
];

const MARIO_FRAMES = [MARIO_STAND, MARIO_WALK1, MARIO_WALK2, MARIO_JUMP, MARIO_DEAD];

const GB = '#c08050', GD = '#602810', GW = '#ffffff';
const GOOMBA = [
    [_,_,GB,GB,GB,GB,_,_],
    [_,GB,GB,GB,GB,GB,GB,_],
    [_,GB,GW,GB,GB,GW,GB,_],
    [GB,GB,GB,GB,GB,GB,GB,GB],
    [GB,GB,GB,GB,GB,GB,GB,GB],
    [_,_,GD,GB,GB,GD,_,_],
    [_,GD,GD,_,_,GD,GD,_],
    [GD,GD,_,_,_,_,GD,GD],
];

const GOOMBA_FLAT = [
    [_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_],
    [_,GB,GB,GB,GB,GB,GB,_],
    [GB,GB,GB,GB,GB,GB,GB,GB],
    [_,GD,GD,_,_,GD,GD,_],
];

// ── Level data (50 cols × 15 rows) ──
// # = ground, B = brick, ? = question block, P/p = pipe top, [/] = pipe body
// G = goomba, o = coin, S = stair, f = flagpole, F = flag base, | = flag top
const LEVEL_DATA = [
    '                                                  ', // 0
    '                                                  ', // 1
    '                                                  ', // 2
    '                                            |     ', // 3
    '    o  o                    o o o            f     ', // 4
    '   B?B?B                                    f     ', // 5
    '                      B?B                   f     ', // 6
    '                                            f     ', // 7
    '          Pp                        Pp      f     ', // 8
    '   G      []   ?          G         []      f     ', // 9
    '          []                         []    Sf     ', // 10
    ' G        []  G     Pp   G    G      []   SSf     ', // 11
    '          []        []               []  SSSf     ', // 12
    '          []        []               [] SSSSf     ', // 13
    '####  #########  #####  ########  ####SSSSSF     ', // 14
];

// Solid tile characters
const SOLID_CHARS = '#BSPp[]?XF';

export class MarioApp extends App {
    constructor() {
        super('mario', 'Mario');
        this._keyState = { left: 0, right: 0, jump: 0 };
        this._jumpPressed = false;
        this._initLevel();
    }

    _initLevel() {
        this.state = 'title';
        this.score = 0;
        this.coins = 0;
        this.time = 300;
        this.timeTimer = 0;
        this.animTimer = 0;
        this.hoveredRetry = false;

        // Parse level
        this.tiles = LEVEL_DATA.map(row => {
            const arr = [];
            for (let i = 0; i < 50; i++) {
                arr.push(i < row.length ? row[i] : ' ');
            }
            return arr;
        });
        this.levelCols = 50;
        this.levelRows = 15;

        // Mario
        this.mario = {
            x: 16, y: 14 * TILE - 10,
            vx: 0, vy: 0,
            w: 6, h: 10,
            grounded: false,
            facing: 1,
            frame: 0,
            animTimer: 0,
        };

        // Spawn enemies & coins from level data
        this.enemies = [];
        this.floatingCoins = [];
        this.coinPopups = [];

        for (let row = 0; row < this.levelRows; row++) {
            for (let col = 0; col < this.levelCols; col++) {
                const ch = this.tiles[row][col];
                if (ch === 'G') {
                    this.enemies.push({
                        x: col * TILE, y: row * TILE,
                        vx: -0.5, w: 8, h: 8,
                        alive: true, squishTimer: 0,
                        animTimer: 0,
                    });
                    this.tiles[row][col] = ' ';
                } else if (ch === 'o') {
                    this.floatingCoins.push({
                        x: col * TILE + 2, y: row * TILE + 1,
                        collected: false,
                        bobTimer: (col * 7) % 60,
                    });
                    this.tiles[row][col] = ' ';
                }
            }
        }

        this.cameraX = 0;
        this.hitBlocks = new Set();

        // Reset key state
        this._keyState = { left: 0, right: 0, jump: 0 };
        this._jumpPressed = false;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 90, y: 15,
            width: 180, height: 152,
            title: 'Mario',
            appId: this.id,
            app: this
        });
    }

    // ── Input ──
    onKeyDown(key) {
        if (this.state === 'title') {
            if (key === ' ' || key === 'Enter') {
                this._initLevel();
                this.state = 'playing';
            }
            return;
        }

        if (this.state === 'playing') {
            switch (key) {
                case 'ArrowLeft':
                    this._keyState.left = KEY_TIMEOUT;
                    break;
                case 'ArrowRight':
                    this._keyState.right = KEY_TIMEOUT;
                    break;
                case 'ArrowUp':
                case ' ':
                    if (this._keyState.jump <= 0) {
                        this._jumpPressed = true;
                    }
                    this._keyState.jump = KEY_TIMEOUT;
                    break;
            }
        }
    }

    onMouseDown(lx, ly) {
        if (this.state === 'gameover' || this.state === 'complete') {
            // Retry button
            const w = this.window ? this.window.contentWidth : 180;
            const h = this.window ? this.window.contentHeight : 140;
            const btnW = 50;
            const btnH = 12;
            const btnX = (w - btnW) / 2;
            const btnY = h / 2 + 16;
            if (lx >= btnX && lx < btnX + btnW && ly >= btnY && ly < btnY + btnH) {
                this._initLevel();
                this.state = 'title';
            }
        }
    }

    onMouseMove(lx, ly) {
        this.hoveredRetry = false;
        if (this.state === 'gameover' || this.state === 'complete') {
            const w = this.window ? this.window.contentWidth : 180;
            const h = this.window ? this.window.contentHeight : 140;
            const btnW = 50;
            const btnH = 12;
            const btnX = (w - btnW) / 2;
            const btnY = h / 2 + 16;
            if (lx >= btnX && lx < btnX + btnW && ly >= btnY && ly < btnY + btnH) {
                this.hoveredRetry = true;
            }
        }
    }

    // ── Update ──
    update() {
        // Decrement key hold timers
        const ks = this._keyState;
        for (const k in ks) {
            if (ks[k] > 0) ks[k]--;
        }

        switch (this.state) {
            case 'playing': this._updatePlaying(); break;
            case 'dying':   this._updateDying(); break;
            case 'win':     this._updateWin(); break;
        }
    }

    _updatePlaying() {
        const m = this.mario;
        const ks = this._keyState;

        // Horizontal
        if (ks.left > 0 && ks.right <= 0) {
            m.vx = Math.max(m.vx - RUN_ACCEL, -MAX_SPEED);
            m.facing = -1;
        } else if (ks.right > 0 && ks.left <= 0) {
            m.vx = Math.min(m.vx + RUN_ACCEL, MAX_SPEED);
            m.facing = 1;
        } else {
            if (m.vx > 0) m.vx = Math.max(0, m.vx - RUN_DECEL);
            else if (m.vx < 0) m.vx = Math.min(0, m.vx + RUN_DECEL);
        }

        // Jump (edge triggered)
        if (this._jumpPressed && m.grounded) {
            m.vy = JUMP_VEL;
            m.grounded = false;
        }
        this._jumpPressed = false;

        // Gravity
        if (m.vy < 0 && ks.jump > 0) {
            m.vy += JUMP_HOLD_GRAVITY;
        } else {
            m.vy += GRAVITY;
        }
        m.vy = Math.min(m.vy, MAX_FALL);

        // Move + collide
        this._moveAndCollide();

        // Animation
        if (m.grounded && Math.abs(m.vx) > 0.1) {
            m.animTimer++;
            if (m.animTimer > 6) {
                m.animTimer = 0;
                m.frame = m.frame === 1 ? 2 : 1;
            }
        } else if (!m.grounded) {
            m.frame = 3;
        } else {
            m.frame = 0;
            m.animTimer = 0;
        }

        // Camera
        this._updateCamera();

        // Enemies
        this._updateEnemies();
        this._checkEnemyCollisions();

        // Coins
        this._checkCoins();

        // Flagpole
        this._checkFlagpole();

        // Pit death
        if (m.y > this.levelRows * TILE + 20) {
            this._die();
        }

        // Coin popups
        this.coinPopups = this.coinPopups.filter(p => {
            p.y -= 1;
            p.timer--;
            return p.timer > 0;
        });

        // Time
        this.timeTimer++;
        if (this.timeTimer >= 60) {
            this.timeTimer = 0;
            this.time--;
            if (this.time <= 0) this._die();
        }
    }

    _updateDying() {
        this.animTimer++;
        // Mario flies up then falls
        if (this.animTimer < 15) {
            this.mario.vy = -3;
        } else {
            this.mario.vy += GRAVITY;
        }
        this.mario.y += this.mario.vy;

        if (this.animTimer > 80) {
            this.state = 'gameover';
        }
    }

    _updateWin() {
        this.animTimer++;
        // Mario slides down flagpole
        if (this.mario.vy >= 0 && this.mario.y < 14 * TILE - 10) {
            this.mario.y += 1;
        }
        if (this.animTimer > 90) {
            this.state = 'complete';
        }
    }

    _die() {
        this.state = 'dying';
        this.animTimer = 0;
        this.mario.vy = -2;
        this.mario.frame = 4; // dead frame
    }

    // ── Physics ──
    _moveAndCollide() {
        const m = this.mario;

        // Horizontal
        m.x += m.vx;
        m.x = Math.max(0, Math.min(m.x, this.levelCols * TILE - m.w));
        this._resolveHorizontal();

        // Vertical
        m.y += m.vy;
        m.grounded = false;
        this._resolveVertical();
    }

    _resolveHorizontal() {
        const m = this.mario;
        const left   = Math.floor(m.x / TILE);
        const right  = Math.floor((m.x + m.w - 1) / TILE);
        const top    = Math.floor(m.y / TILE);
        const bottom = Math.floor((m.y + m.h - 1) / TILE);

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (this._isSolid(col, row)) {
                    if (m.vx > 0) {
                        m.x = col * TILE - m.w;
                    } else if (m.vx < 0) {
                        m.x = (col + 1) * TILE;
                    }
                    m.vx = 0;
                    return;
                }
            }
        }
    }

    _resolveVertical() {
        const m = this.mario;
        const left   = Math.floor(m.x / TILE);
        const right  = Math.floor((m.x + m.w - 1) / TILE);
        const top    = Math.floor(m.y / TILE);
        const bottom = Math.floor((m.y + m.h - 1) / TILE);

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (this._isSolid(col, row)) {
                    if (m.vy > 0) {
                        m.y = row * TILE - m.h;
                        m.vy = 0;
                        m.grounded = true;
                    } else if (m.vy < 0) {
                        m.y = (row + 1) * TILE;
                        m.vy = 0;
                        this._hitBlock(col, row);
                    }
                    return;
                }
            }
        }
    }

    _isSolid(col, row) {
        if (col < 0 || col >= this.levelCols || row < 0 || row >= this.levelRows) return false;
        return SOLID_CHARS.includes(this.tiles[row][col]);
    }

    _hitBlock(col, row) {
        const key = `${col},${row}`;
        const ch = this.tiles[row][col];
        if (ch === '?' && !this.hitBlocks.has(key)) {
            this.hitBlocks.add(key);
            this.tiles[row][col] = 'X';
            this.coins++;
            this.score += 100;
            this.coinPopups.push({ x: col * TILE, y: row * TILE - 8, timer: 20 });
        } else if (ch === 'B') {
            this.tiles[row][col] = ' ';
            this.score += 50;
        }
    }

    // ── Camera ──
    _updateCamera() {
        const target = this.mario.x - 60;
        this.cameraX = Math.max(0, Math.min(target, this.levelCols * TILE - VIEW_W));
    }

    // ── Enemies ──
    _updateEnemies() {
        for (const e of this.enemies) {
            if (!e.alive) {
                if (e.squishTimer > 0) e.squishTimer--;
                continue;
            }

            // Gravity
            if (e.vy === undefined) e.vy = 0;
            e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
            e.grounded = false;

            // Horizontal movement
            e.x += e.vx;
            e.animTimer++;

            // Wall collision (check at enemy body height)
            const frontCol = e.vx > 0
                ? Math.floor((e.x + e.w - 1) / TILE)
                : Math.floor(e.x / TILE);
            const bodyTop = Math.floor(e.y / TILE);
            const bodyBot = Math.floor((e.y + e.h - 1) / TILE);
            for (let r = bodyTop; r <= bodyBot; r++) {
                if (this._isSolid(frontCol, r)) {
                    if (e.vx > 0) e.x = frontCol * TILE - e.w;
                    else e.x = (frontCol + 1) * TILE;
                    e.vx = -e.vx;
                    break;
                }
            }

            // Vertical movement + ground collision
            e.y += e.vy;
            const left = Math.floor(e.x / TILE);
            const right = Math.floor((e.x + e.w - 1) / TILE);
            const bottom = Math.floor((e.y + e.h - 1) / TILE);
            for (let c = left; c <= right; c++) {
                if (this._isSolid(c, bottom) && e.vy >= 0) {
                    e.y = bottom * TILE - e.h;
                    e.vy = 0;
                    e.grounded = true;
                    break;
                }
            }

            // Edge detection — reverse if no ground ahead (only when grounded)
            if (e.grounded) {
                const footCol = e.vx > 0
                    ? Math.floor((e.x + e.w) / TILE)
                    : Math.floor((e.x - 1) / TILE);
                const belowRow = Math.floor((e.y + e.h) / TILE);
                if (belowRow < this.levelRows && !this._isSolid(footCol, belowRow)) {
                    e.vx = -e.vx;
                }
            }
        }
    }

    _checkEnemyCollisions() {
        const m = this.mario;
        for (const e of this.enemies) {
            if (!e.alive) continue;

            // AABB overlap
            if (m.x + m.w > e.x && m.x < e.x + e.w &&
                m.y + m.h > e.y && m.y < e.y + e.h) {

                // Stomp: mario falling and bottom above enemy center
                if (m.vy > 0 && m.y + m.h < e.y + e.h * 0.6) {
                    e.alive = false;
                    e.squishTimer = 30;
                    m.vy = STOMP_BOUNCE;
                    this.score += 200;
                } else {
                    this._die();
                    return;
                }
            }
        }
    }

    // ── Coins ──
    _checkCoins() {
        const m = this.mario;
        for (const c of this.floatingCoins) {
            if (c.collected) continue;
            const cx = c.x;
            const cy = c.y + Math.sin(c.bobTimer * 0.1) * 2;
            if (m.x + m.w > cx && m.x < cx + 4 &&
                m.y + m.h > cy && m.y < cy + 6) {
                c.collected = true;
                this.coins++;
                this.score += 50;
            }
        }
    }

    // ── Flagpole ──
    _checkFlagpole() {
        const m = this.mario;
        // Check for 'f', 'F', or '|' tiles near mario
        const col = Math.floor((m.x + m.w / 2) / TILE);
        const row = Math.floor((m.y + m.h / 2) / TILE);
        for (let r = row - 1; r <= row + 1; r++) {
            if (r < 0 || r >= this.levelRows) continue;
            const ch = this.tiles[r][col];
            if (ch === 'f' || ch === 'F' || ch === '|') {
                this.state = 'win';
                this.animTimer = 0;
                this.mario.vx = 0;
                this.score += this.time * 10;
                return;
            }
        }
    }

    // ── Drawing ──
    draw(r, x, y, w, h) {
        switch (this.state) {
            case 'title':
                this._drawTitle(r, x, y, w, h);
                break;
            case 'playing':
            case 'dying':
            case 'win':
                this._drawGame(r, x, y, w, h);
                break;
            case 'gameover':
            case 'complete':
                this._drawEndScreen(r, x, y, w, h);
                break;
        }
    }

    _drawTitle(r, x, y, w, h) {
        r.fillRect(x, y, w, h, C.SKY);

        // Ground
        r.fillRect(x, y + h - 16, w, 16, C.GROUND);
        for (let gx = 0; gx < w; gx += 8) {
            r.fillRect(x + gx, y + h - 16, 8, 1, C.MORTAR);
            r.fillRect(x + gx + 3, y + h - 12, 1, 4, C.MORTAR);
        }

        // Title
        r.drawTextCentered('SUPER', x + w / 2, y + 20, C.WHITE);
        r.drawTextCentered('MARIO', x + w / 2, y + 30, C.RED);

        // Clouds (decorative)
        r.fillRoundRect(x + 20, y + 10, 16, 6, 2, C.WHITE);
        r.fillRoundRect(x + 120, y + 15, 20, 7, 2, C.WHITE);

        // Mario sprite
        this._drawSprite(r, MARIO_STAND, x + Math.floor(w / 2) - 4, y + h - 26, false);

        // Prompt
        r.drawTextCentered('Press SPACE', x + w / 2, y + 55, C.WHITE);
        r.drawTextCentered('to start!', x + w / 2, y + 65, C.WHITE);

        // Controls hint
        r.drawTextCentered('Arrow keys', x + w / 2, y + 85, C.MORTAR);
        r.drawTextCentered('to move/jump', x + w / 2, y + 93, C.MORTAR);
    }

    _drawGame(r, x, y, w, h) {
        const gameY = y + HUD_H;

        // Sky
        r.fillRect(x, y, w, h, C.SKY);

        // Decorative clouds (parallax)
        const cloudOffset = this.cameraX * 0.3;
        this._drawCloud(r, x + 30 - (cloudOffset % 200), gameY + 5);
        this._drawCloud(r, x + 130 - (cloudOffset % 200), gameY + 12);
        this._drawCloud(r, x + 230 - (cloudOffset % 200), gameY + 3);

        // Visible tile range
        const startCol = Math.floor(this.cameraX / TILE);
        const endCol = Math.min(startCol + Math.ceil(w / TILE) + 2, this.levelCols);

        // Draw tiles
        for (let row = 0; row < this.levelRows; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const sx = x + col * TILE - this.cameraX;
                const sy = gameY + row * TILE;
                if (sx < x - TILE || sx > x + w + TILE) continue;
                this._drawTile(r, this.tiles[row][col], sx, sy);
            }
        }

        // Floating coins
        for (const c of this.floatingCoins) {
            if (c.collected) continue;
            const sx = x + c.x - this.cameraX;
            const sy = gameY + c.y + Math.sin(c.bobTimer * 0.1) * 2;
            c.bobTimer++;
            if (sx > x - 8 && sx < x + w + 8) {
                this._drawCoin(r, sx, sy);
            }
        }

        // Enemies
        for (const e of this.enemies) {
            if (!e.alive && e.squishTimer <= 0) continue;
            const sx = x + e.x - this.cameraX;
            const sy = gameY + e.y;
            if (sx > x - 16 && sx < x + w + 16) {
                const sprite = e.alive ? GOOMBA : GOOMBA_FLAT;
                this._drawSprite(r, sprite, sx, sy, false);
            }
        }

        // Mario
        if (this.state !== 'dying' || this.animTimer % 4 < 3) {
            const mx = x + this.mario.x - this.cameraX;
            const my = gameY + this.mario.y;
            const frameIdx = Math.min(this.mario.frame, MARIO_FRAMES.length - 1);
            this._drawSprite(r, MARIO_FRAMES[frameIdx], mx - 1, my, this.mario.facing < 0);
        }

        // Coin popups
        for (const p of this.coinPopups) {
            const sx = x + p.x - this.cameraX;
            const alpha = p.timer / 20;
            if (alpha > 0.3) {
                r.drawText('+100', sx, gameY + p.y, C.WHITE);
            }
        }

        // HUD
        this._drawHUD(r, x, y, w);
    }

    _drawHUD(r, x, y, w) {
        r.fillRect(x, y, w, HUD_H, C.BLACK);

        // Score
        r.drawText('SCR:' + this.score, x + 2, y + 2, C.WHITE);

        // Coins
        r.fillRect(x + 72, y + 3, 3, 4, C.COIN);
        r.drawText('x' + this.coins, x + 77, y + 2, C.WHITE);

        // Time
        r.drawTextRight('T:' + this.time, x + w - 2, y + 2, C.WHITE);
    }

    _drawEndScreen(r, x, y, w, h) {
        // Draw frozen game frame
        this._drawGame(r, x, y, w, h);

        // Overlay
        r.fillRect(x, y, w, h, 'rgba(0,0,0,0.6)');

        if (this.state === 'complete') {
            r.drawTextCentered('LEVEL', x + w / 2, y + h / 2 - 20, C.COINLT);
            r.drawTextCentered('CLEAR!', x + w / 2, y + h / 2 - 10, C.COINLT);
            r.drawTextCentered('Score:' + this.score, x + w / 2, y + h / 2 + 2, C.WHITE);
        } else {
            r.drawTextCentered('GAME', x + w / 2, y + h / 2 - 16, C.RED);
            r.drawTextCentered('OVER', x + w / 2, y + h / 2 - 6, C.RED);
        }

        // Retry button
        const btnW = 50;
        const btnH = 12;
        const btnX = x + (w - btnW) / 2;
        const btnY = y + h / 2 + 16;
        const btnColor = this.hoveredRetry ? '#555566' : '#333344';
        r.fillRoundRect(btnX, btnY, btnW, btnH, 2, btnColor);
        r.drawTextCentered('Retry', btnX + btnW / 2, btnY + 3, C.WHITE);
    }

    // ── Tile drawing ──
    _drawTile(r, ch, x, y) {
        switch (ch) {
            case '#': this._drawGroundBlock(r, x, y); break;
            case 'B': this._drawBrickBlock(r, x, y); break;
            case '?': this._drawQuestionBlock(r, x, y); break;
            case 'X': this._drawUsedBlock(r, x, y); break;
            case 'S': this._drawStoneBlock(r, x, y); break;
            case 'P': this._drawPipeTopLeft(r, x, y); break;
            case 'p': this._drawPipeTopRight(r, x, y); break;
            case '[': this._drawPipeBodyLeft(r, x, y); break;
            case ']': this._drawPipeBodyRight(r, x, y); break;
            case 'f': this._drawFlagPole(r, x, y); break;
            case 'F': this._drawFlagBase(r, x, y); break;
            case '|': this._drawFlagTop(r, x, y); break;
        }
    }

    _drawGroundBlock(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.BRICK);
        r.fillRect(x, y, TILE, 1, C.MORTAR);
        r.fillRect(x + 3, y + 1, 1, 3, C.MORTAR);
        r.fillRect(x, y + 4, TILE, 1, C.MORTAR);
        r.fillRect(x + 6, y + 5, 1, 3, C.MORTAR);
        r.fillRect(x + 1, y + 5, 1, 3, C.MORTAR);
    }

    _drawBrickBlock(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.BRICK);
        r.fillRect(x, y, TILE, 1, C.MORTAR);
        r.fillRect(x, y + 3, TILE, 1, C.MORTAR);
        r.fillRect(x, y + 7, TILE, 1, C.MORTAR);
        r.fillRect(x + 3, y, 1, 3, C.MORTAR);
        r.fillRect(x + 6, y + 4, 1, 3, C.MORTAR);
        r.fillRect(x + 1, y + 4, 1, 3, C.MORTAR);
    }

    _drawQuestionBlock(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.QBLOCK);
        r.fillRect(x, y, TILE, 1, C.QBRIGHT);
        r.fillRect(x, y, 1, TILE, C.QBRIGHT);
        r.fillRect(x, y + 7, TILE, 1, C.QDARK);
        r.fillRect(x + 7, y, 1, TILE, C.QDARK);
        // ? mark
        r.pixel(x + 3, y + 2, C.WHITE);
        r.pixel(x + 4, y + 2, C.WHITE);
        r.pixel(x + 4, y + 3, C.WHITE);
        r.pixel(x + 3, y + 4, C.WHITE);
        r.pixel(x + 3, y + 6, C.WHITE);
    }

    _drawUsedBlock(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.USED);
        r.fillRect(x, y, TILE, 1, '#997755');
        r.fillRect(x, y, 1, TILE, '#997755');
        r.fillRect(x, y + 7, TILE, 1, '#665533');
        r.fillRect(x + 7, y, 1, TILE, '#665533');
    }

    _drawStoneBlock(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.STONE);
        r.fillRect(x, y, TILE, 1, C.STONLT);
        r.fillRect(x, y, 1, TILE, C.STONLT);
        r.fillRect(x, y + 7, TILE, 1, C.STONDK);
        r.fillRect(x + 7, y, 1, TILE, C.STONDK);
    }

    _drawPipeTopLeft(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.PIPE);
        r.fillRect(x, y, TILE, 1, C.PIPELT);
        r.fillRect(x, y, 2, TILE, C.PIPELT);
        r.fillRect(x, y + 7, TILE, 1, C.PIPEDK);
    }

    _drawPipeTopRight(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.PIPE);
        r.fillRect(x, y, TILE, 1, C.PIPELT);
        r.fillRect(x + 6, y, 2, TILE, C.PIPEDK);
        r.fillRect(x, y + 7, TILE, 1, C.PIPEDK);
    }

    _drawPipeBodyLeft(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.PIPE);
        r.fillRect(x, y, 2, TILE, C.PIPELT);
    }

    _drawPipeBodyRight(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.PIPE);
        r.fillRect(x + 6, y, 2, TILE, C.PIPEDK);
    }

    _drawFlagPole(r, x, y) {
        r.fillRect(x + 3, y, 2, TILE, C.POLE);
    }

    _drawFlagBase(r, x, y) {
        r.fillRect(x, y, TILE, TILE, C.STONE);
        r.fillRect(x + 3, y - 2, 2, 2, C.POLE);
    }

    _drawFlagTop(r, x, y) {
        r.fillRect(x + 3, y, 2, TILE, C.POLE);
        // Flag triangle
        r.fillCircle(x + 4, y + 1, 2, C.FLAG);
        r.fillRect(x - 3, y + 2, 6, 4, C.FLAG);
    }

    _drawCoin(r, x, y) {
        r.fillRect(x + 1, y, 2, 6, C.COIN);
        r.fillRect(x, y + 1, 4, 4, C.COIN);
        r.pixel(x + 1, y + 1, C.COINLT);
        r.pixel(x + 2, y + 1, C.COINLT);
    }

    _drawCloud(r, x, y) {
        r.fillRoundRect(x, y, 16, 6, 2, 'rgba(255,255,255,0.7)');
    }

    // ── Sprite rendering ──
    _drawSprite(r, sprite, x, y, flip) {
        for (let row = 0; row < sprite.length; row++) {
            const cols = sprite[row];
            for (let col = 0; col < cols.length; col++) {
                const color = cols[col];
                if (color) {
                    const px = flip ? x + (cols.length - 1 - col) : x + col;
                    r.pixel(px, y + row, color);
                }
            }
        }
    }
}
