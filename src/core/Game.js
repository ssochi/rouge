import { Assets } from '../graphics/Assets.js';
import { TILE_SIZE, COLORS, MAP_WIDTH, MAP_HEIGHT } from '../utils/Constants.js';
import { InputHandler } from './Input.js';
import { Camera } from './Camera.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Fullscreen and Scaling
        this.scale = 1.5;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new InputHandler(this.canvas);
        this.camera = new Camera(this.canvas.width / this.scale, this.canvas.height / this.scale);

        this.walls = [];
        this.enemies = [];
        this.bullets = [];
        this.particles = [];

        this.player = {
            x: 400,
            y: 300,
            width: 24,
            height: 24,
            speed: 4,
            rollSpeed: 8,
            hp: 100,
            maxHp: 100,
            angle: 0,
            state: 'idle',
            rollDuration: 0,
            rollCooldown: 0,
            facingRight: true,
            animationTimer: 0
        };

        this.initMap();
        this.lastShotTime = 0;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Turn off image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        
        if (this.camera) {
            this.camera.width = this.canvas.width / this.scale;
            this.camera.height = this.canvas.height / this.scale;
        }
    }

    initMap() {
        // Border walls
        this.walls.push({x: 0, y: 0, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: (MAP_HEIGHT - 1) * TILE_SIZE, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
        this.walls.push({x: (MAP_WIDTH - 1) * TILE_SIZE, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});

        // Random pillars
        for (let i = 0; i < 20; i++) {
            const wx = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2) * TILE_SIZE;
            const wy = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE;
            this.walls.push({x: wx, y: wy, w: TILE_SIZE * 2, h: TILE_SIZE * 2});
        }

        // Add enemies
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        const ex = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2) * TILE_SIZE;
        const ey = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE;
        this.enemies.push({
            x: ex,
            y: ey,
            width: 32,
            height: 32,
            hp: 30,
            speed: 2
        });
    }

    checkRectCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.w &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.h &&
                rect1.y + rect1.height > rect2.y);
    }

    resolveWallCollision(entity, newX, newY) {
        let collidedX = false;
        const testRectX = {x: newX - entity.width/2, y: entity.y - entity.height/2, width: entity.width, height: entity.height};
        
        for (const wall of this.walls) {
            if (this.checkRectCollision(testRectX, wall)) {
                collidedX = true;
                break;
            }
        }
        if (!collidedX) entity.x = newX;

        let collidedY = false;
        const testRectY = {x: entity.x - entity.width/2, y: newY - entity.height/2, width: entity.width, height: entity.height};
        
        for (const wall of this.walls) {
            if (this.checkRectCollision(testRectY, wall)) {
                collidedY = true;
                break;
            }
        }
        if (!collidedY) entity.y = newY;
    }

    update() {
        // Pass scaled camera position for input handling?
        // Actually InputHandler gets raw client coordinates.
        // We need to convert them to world coordinates taking scale into account.
        // InputHandler logic: mouse.worldX = mouse.x + camera.x;
        // But mouse.x is screen pixel.
        // With scale=1.5, screen pixel 150 corresponds to logical pixel 100.
        // So we need to divide input mouse by scale.
        
        const scaledMouseX = this.input.mouse.x / this.scale;
        const scaledMouseY = this.input.mouse.y / this.scale;

        this.input.mouse.worldX = scaledMouseX + this.camera.x;
        this.input.mouse.worldY = scaledMouseY + this.camera.y;

        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.camera.follow(this.player);
    }

    updatePlayer() {
        const keys = this.input.keys;
        const mouse = this.input.mouse;
        const startState = this.player.state;

        if (this.player.state === 'roll') {
            this.player.rollDuration--;
            if (this.player.rollDuration <= 0) {
                this.player.state = 'idle';
                this.player.rollCooldown = 30;
            }
            const speed = this.player.rollSpeed;
            const nextX = this.player.x + Math.cos(this.player.angle) * speed;
            const nextY = this.player.y + Math.sin(this.player.angle) * speed;
            this.resolveWallCollision(this.player, nextX, nextY);
            
            if (this.player.state !== startState) this.player.animationTimer = 0;
            else this.player.animationTimer++;
            return;
        }

        if (this.player.rollCooldown > 0) this.player.rollCooldown--;

        let dx = 0;
        let dy = 0;
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;

        const isMoving = dx !== 0 || dy !== 0;

        if (isMoving) {
            this.player.state = 'run';
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
            const nextX = this.player.x + dx * this.player.speed;
            const nextY = this.player.y + dy * this.player.speed;
            this.resolveWallCollision(this.player, nextX, nextY);
        } else {
            this.player.state = 'idle';
        }

        if (mouse.worldX < this.player.x) this.player.facingRight = false;
        else this.player.facingRight = true;

        if (keys.space && this.player.rollCooldown <= 0 && isMoving) {
            this.player.state = 'roll';
            this.player.rollDuration = 15;
            this.player.angle = Math.atan2(dy, dx);
        } else {
            this.player.angle = Math.atan2(mouse.worldY - this.player.y, mouse.worldX - this.player.x);
        }

        if (this.player.state !== startState) {
            this.player.animationTimer = 0;
        } else {
            this.player.animationTimer++;
        }

        if (mouse.down && this.player.state !== 'roll') {
            this.tryShoot();
        }
    }

    tryShoot() {
        const now = Date.now();
        const FIRE_RATE = 150;
        if (now - this.lastShotTime > FIRE_RATE) {
            const gunDist = 20;
            const bx = this.player.x + Math.cos(this.player.angle) * gunDist;
            const by = this.player.y + Math.sin(this.player.angle) * gunDist;

            this.bullets.push({
                x: bx,
                y: by,
                vx: Math.cos(this.player.angle) * 12,
                vy: Math.sin(this.player.angle) * 12,
                life: 60,
                damage: 10
            });
            
            this.camera.x += (Math.random() - 0.5) * 5;
            this.camera.y += (Math.random() - 0.5) * 5;

            this.lastShotTime = now;
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            let hitWall = false;
            for (const wall of this.walls) {
                if (b.x > wall.x && b.x < wall.x + wall.w && b.y > wall.y && b.y < wall.y + wall.h) {
                    hitWall = true;
                    break;
                }
            }

            if (hitWall || b.life <= 0) {
                this.bullets.splice(i, 1);
                continue;
            }

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 16) {
                    e.hp -= b.damage;
                    this.bullets.splice(i, 1);
                    e.x += b.vx * 0.5;
                    e.y += b.vy * 0.5;
                    if (e.hp <= 0) {
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }

    updateEnemies() {
        this.enemies.forEach(e => {
            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 300 && dist > 32) {
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
            }
            
            this.enemies.forEach(other => {
                if (e === other) return;
                const odx = e.x - other.x;
                const ody = e.y - other.y;
                const odist = Math.sqrt(odx*odx + ody*ody);
                if (odist < 32) {
                    e.x += (odx / odist);
                    e.y += (ody / odist);
                }
            });
        });
    }

    draw() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Draw Floor
        const gridSize = TILE_SIZE;
        // Viewport in logical pixels
        const viewportW = this.canvas.width / this.scale;
        const viewportH = this.canvas.height / this.scale;

        const startCol = Math.floor(this.camera.x / gridSize);
        const endCol = startCol + (viewportW / gridSize) + 1;
        const startRow = Math.floor(this.camera.y / gridSize);
        const endRow = startRow + (viewportH / gridSize) + 1;

        for (let x = startCol; x < endCol; x++) {
            for (let y = startRow; y < endRow; y++) {
                if ((x + y) % 2 === 0) this.ctx.fillStyle = COLORS.FLOOR_CHECKER_1;
                else this.ctx.fillStyle = COLORS.FLOOR_CHECKER_2;
                this.ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
        }

        // Render List (Z-Sorting)
        const renderList = [];

        this.walls.forEach(w => {
            renderList.push({
                y: w.y + w.h,
                draw: () => {
                    this.ctx.fillStyle = COLORS.WALL_FRONT;
                    this.ctx.fillRect(w.x, w.y, w.w, w.h);
                    this.ctx.fillStyle = COLORS.WALL_TOP;
                    this.ctx.fillRect(w.x, w.y - 16, w.w, w.h);
                    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    this.ctx.fillRect(w.x, w.y + w.h, w.w, 10);
                }
            });
        });

        this.enemies.forEach(e => {
            renderList.push({
                y: e.y + e.height/2,
                draw: () => {
                    this.ctx.save();
                    this.ctx.translate(e.x, e.y);
                    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI*2);
                    this.ctx.fill();

                    if (this.player.x < e.x) this.ctx.scale(-1, 1);
                    // Use new Asset
                    this.ctx.drawImage(Assets.enemy, -16, -16);

                    this.ctx.fillStyle = 'red';
                    this.ctx.fillRect(-16, -24, 32, 4);
                    this.ctx.fillStyle = 'green';
                    this.ctx.fillRect(-16, -24, 32 * (e.hp / 30), 4);
                    this.ctx.restore();
                }
            });
        });

        renderList.push({
            y: this.player.y + this.player.height/2,
            draw: () => {
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y);
                
                this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI*2);
                this.ctx.fill();

                if (this.player.state === 'roll') {
                    // Roll logic handled in sprite selection below
                    // Determine direction based on movement vector (stored in angle)
                    // If rolling RIGHT, flip sprite (because default sprite is LEFT)
                    const moveX = Math.cos(this.player.angle);
                    if (moveX > 0) this.ctx.scale(-1, 1);
                } else {
                    // Default sprite is facing LEFT
                    // If facingRight is true, we must FLIP
                    if (this.player.facingRight) this.ctx.scale(-1, 1);
                }

                // Select Sprite based on state
                let sprite;
                if (this.player.state === 'run') {
                    // Run animation speed: change every 5 frames (faster run)
                    const frameIndex = Math.floor(this.player.animationTimer / 5) % Assets.player.run.length;
                    sprite = Assets.player.run[frameIndex];
                } else if (this.player.state === 'roll') {
                     // Roll animation: 8 frames over 15 ticks (approx 2 ticks per frame)
                     const totalFrames = Assets.player.roll.length;
                     // Map 0-15 duration to 0-7 frames
                     // rollDuration counts DOWN from 15 to 0.
                     // We want frame 0 at start (15) and frame 7 at end (0).
                     // Progress: (15 - rollDuration) / 15
                     const maxDuration = 15;
                     const progress = (maxDuration - this.player.rollDuration) / maxDuration;
                     let frameIndex = Math.floor(progress * totalFrames);
                     if (frameIndex >= totalFrames) frameIndex = totalFrames - 1;
                     sprite = Assets.player.roll[frameIndex];
                } else {
                    // Idle animation speed: change every 10 frames
                    const frameIndex = Math.floor(this.player.animationTimer / 10) % Assets.player.idle.length;
                    sprite = Assets.player.idle[frameIndex];
                }

                this.ctx.drawImage(sprite, -16, -16);

                if (this.player.state !== 'roll') {
                    // Unflip if we flipped above (to restore coordinate system for gun)
                    if (this.player.facingRight) this.ctx.scale(-1, 1);
                    this.ctx.save();
                    this.ctx.rotate(this.player.angle);
                    if (Math.abs(this.player.angle) > Math.PI / 2) {
                        this.ctx.scale(1, -1);
                    }
                    // Use new Asset
                    // Draw Gun Image centered on barrel
                    this.ctx.drawImage(Assets.gun, 0, -5); 
                    
                    this.ctx.restore();
                }
                this.ctx.restore();
            }
        });

        renderList.sort((a, b) => a.y - b.y);
        renderList.forEach(item => item.draw());

        this.bullets.forEach(b => {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#e67e22';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        this.ctx.restore();

        // Cursor
        const mouse = this.input.mouse;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2); // Screen space
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(mouse.x, mouse.y - 12);
        this.ctx.lineTo(mouse.x, mouse.y + 12);
        this.ctx.moveTo(mouse.x - 12, mouse.y);
        this.ctx.lineTo(mouse.x + 12, mouse.y);
        this.ctx.stroke();

        // UI Updates
        document.getElementById('health-bar').innerText = `HP: ${this.player.hp} / ${this.player.maxHp}`;
        const cdText = this.player.rollCooldown > 0 ? " (COOLDOWN)" : " (READY)";
        document.getElementById('ammo-bar').innerText = `DODGE: ${cdText}`;
    }

    start() {
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        loop();
    }
}
