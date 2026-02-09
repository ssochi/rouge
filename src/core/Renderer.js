import { Assets } from '../graphics/Assets.js';
import { TILE_SIZE, COLORS } from '../utils/Constants.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

export class Renderer {
    constructor({ canvas, ctx, scale, camera, input, uiManager, handSystem, player, walls, enemies, breakableObjects, particles, droppedItems, bullets, worldSystem, vehicles, buildSystem, blackHoles }) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scale = scale;
        this.camera = camera;
        this.input = input;
        this.uiManager = uiManager;
        this.handSystem = handSystem;
        this.player = player;
        this.walls = walls;
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.particles = particles;
        this.droppedItems = droppedItems;
        this.bullets = bullets;
        this.worldSystem = worldSystem; // To access portals
        this.vehicles = vehicles || []; // Add vehicles
        this.buildSystem = buildSystem;
        this.blackHoles = blackHoles || [];
        this.debugMode = 0; // 0: off, 1: collision boxes, 2: hurtboxes
        this.pPressed = false;
    }

    drawPixelCircle(ctx, cx, cy, radius, color, pixelSize = 4) {
        ctx.fillStyle = color;
        const centerX = Math.floor(cx / pixelSize) * pixelSize;
        const centerY = Math.floor(cy / pixelSize) * pixelSize;
        const r2 = radius * radius;
        
        for (let y = -radius; y <= radius; y += pixelSize) {
            const halfWidth = Math.sqrt(Math.max(0, r2 - y * y));
            if (halfWidth <= 0) continue;
            
            const w = Math.floor(halfWidth * 2 / pixelSize) * pixelSize;
            if (w <= 0) continue;
            
            const x = centerX - w / 2;
            ctx.fillRect(x, centerY + y, w, pixelSize);
        }
    }

    drawPixelRing(ctx, cx, cy, radius, thickness, color, pixelSize = 4) {
        ctx.fillStyle = color;
        const centerX = Math.floor(cx / pixelSize) * pixelSize;
        const centerY = Math.floor(cy / pixelSize) * pixelSize;
        const outerR2 = radius * radius;
        const innerR = Math.max(0, radius - thickness);
        const innerR2 = innerR * innerR;
        
        for (let y = -radius; y <= radius; y += pixelSize) {
            const outerHalfWidth = Math.sqrt(Math.max(0, outerR2 - y * y));
            if (outerHalfWidth <= 0) continue;
            
            const outerW = Math.floor(outerHalfWidth * 2 / pixelSize) * pixelSize;
            
            let innerW = 0;
            if (Math.abs(y) < innerR) {
                 const innerHalfWidth = Math.sqrt(Math.max(0, innerR2 - y * y));
                 innerW = Math.floor(innerHalfWidth * 2 / pixelSize) * pixelSize;
            }
            
            const leftX = centerX - outerW / 2;
            const segmentW = (outerW - innerW) / 2;
            
            if (segmentW > 0) {
                ctx.fillRect(leftX, centerY + y, segmentW, pixelSize);
                ctx.fillRect(centerX + innerW / 2, centerY + y, segmentW, pixelSize);
            }
        }
    }

    draw() {
        // Toggle Debug Mode
        if (this.input.keys.p && !this.pPressed) {
            this.debugMode = (this.debugMode + 1) % 3;
            this.pPressed = true;
        } else if (!this.input.keys.p) {
            this.pPressed = false;
        }

        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        // Disable image smoothing for pixel art look
        this.ctx.imageSmoothingEnabled = false;
        
        this.ctx.scale(this.scale, this.scale);
        // Snap camera to screen pixels to avoid sub-pixel rendering gaps
        // Translate X = -Math.floor(camera.x * scale) / scale
        const tx = Math.floor(this.camera.x * this.scale) / this.scale;
        const ty = Math.floor(this.camera.y * this.scale) / this.scale;
        this.ctx.translate(-tx, -ty);

        const gridSize = TILE_SIZE;
        const viewportW = this.canvas.width / this.scale;
        const viewportH = this.canvas.height / this.scale;

        if (this.worldSystem && this.worldSystem.floorCanvas) {
            // Draw pre-rendered floor canvas (single drawImage)
            const fc = this.worldSystem.floorCanvas;
            const sx = Math.max(0, Math.floor(this.camera.x));
            const sy = Math.max(0, Math.floor(this.camera.y));
            const sw = Math.min(Math.ceil(viewportW) + 1, fc.width - sx);
            const sh = Math.min(Math.ceil(viewportH) + 1, fc.height - sy);
            if (sw > 0 && sh > 0) {
                this.ctx.drawImage(fc, sx, sy, sw, sh, sx, sy, sw, sh);
            }
        } else {
            // Fallback: original checkerboard for maps without floor data
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
        }

        // Draw Carpets (Below everything else, on top of floor)
        if (this.worldSystem && this.worldSystem.carpets) {
             this.worldSystem.carpets.forEach(c => c.draw(this.ctx));
        }

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

        this.breakableObjects.forEach(obj => {
            if (!obj.isBroken) {
                let sortY = obj.y + obj.height;

                const occlusionHitboxes = obj.getOcclusionHitboxes
                    ? obj.getOcclusionHitboxes()
                    : (obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()]);

                if (occlusionHitboxes && occlusionHitboxes.length > 0) {
                    let maxY = -Infinity;
                    occlusionHitboxes.forEach(hb => {
                        const h = hb.height ?? hb.h ?? 0;
                        const bottom = hb.y + h;
                        if (bottom > maxY) maxY = bottom;
                    });
                    if (maxY !== -Infinity) {
                        sortY = maxY;
                    }
                } else if (Number.isFinite(obj.occlusionSortY)) {
                    sortY = obj.y + obj.occlusionSortY;
                } else if (obj.hitbox) {
                    sortY = obj.y + obj.hitbox.offsetY + obj.hitbox.height;
                }

                renderList.push({
                    y: sortY,
                    draw: () => obj.draw(this.ctx)
                });
            }
        });

        this.enemies.forEach(e => {
            renderList.push({
                y: e.y + e.height/2,
                draw: () => {
                    e.draw(this.ctx);
                    // Ice effect overlay
                    if (e.frozenTimer > 0) {
                        const hb = e.getBulletHurtbox ? e.getBulletHurtbox() :
                            { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                        this.ctx.save();
                        // Ice block body
                        this.ctx.globalAlpha = 0.45;
                        this.ctx.fillStyle = '#a8d8ea';
                        const pad = 3;
                        const bx = hb.x - pad, by = hb.y - pad;
                        const bw = hb.width + pad * 2, bh = hb.height + pad * 2;
                        this.ctx.fillRect(bx, by, bw, bh);
                        // Ice block highlight (top edge)
                        this.ctx.globalAlpha = 0.6;
                        this.ctx.fillStyle = '#dfe6e9';
                        this.ctx.fillRect(bx + 1, by, bw - 2, 2);
                        this.ctx.fillRect(bx, by, 2, bh / 2);
                        // Ice block border
                        this.ctx.globalAlpha = 0.7;
                        this.ctx.strokeStyle = '#74b9ff';
                        this.ctx.lineWidth = 1.5;
                        this.ctx.strokeRect(bx, by, bw, bh);
                        // Ice crystal decorations at corners
                        this.ctx.globalAlpha = 0.8;
                        this.ctx.fillStyle = '#ffffff';
                        // Top-left crystal
                        this.ctx.fillRect(bx - 1, by - 2, 2, 3);
                        this.ctx.fillRect(bx - 2, by - 1, 3, 2);
                        // Top-right crystal
                        this.ctx.fillRect(bx + bw - 1, by - 2, 2, 3);
                        this.ctx.fillRect(bx + bw - 1, by - 1, 3, 2);
                        // Bottom-left crystal
                        this.ctx.fillRect(bx - 1, by + bh - 1, 2, 3);
                        this.ctx.fillRect(bx - 2, by + bh, 3, 2);
                        // Inner frost cracks
                        this.ctx.globalAlpha = 0.3;
                        this.ctx.strokeStyle = '#dfe6e9';
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bx + bw * 0.3, by + 2);
                        this.ctx.lineTo(bx + bw * 0.4, by + bh * 0.5);
                        this.ctx.lineTo(bx + bw * 0.3, by + bh - 2);
                        this.ctx.moveTo(bx + bw * 0.6, by + 3);
                        this.ctx.lineTo(bx + bw * 0.7, by + bh * 0.4);
                        this.ctx.stroke();
                        this.ctx.restore();
                    } else if (e.slowTimer > 0) {
                        const hb = e.getBulletHurtbox ? e.getBulletHurtbox() :
                            { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                        const slowRatio = e.slowAmount || 0;
                        this.ctx.save();
                        // Frost overlay scales with slow amount
                        this.ctx.globalAlpha = 0.1 + slowRatio * 0.3;
                        this.ctx.fillStyle = '#a8d8ea';
                        this.ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
                        // Frost border grows with stacks
                        if (slowRatio > 0.3) {
                            this.ctx.globalAlpha = slowRatio * 0.5;
                            this.ctx.strokeStyle = '#74b9ff';
                            this.ctx.lineWidth = 1;
                            this.ctx.strokeRect(hb.x - 1, hb.y - 1, hb.width + 2, hb.height + 2);
                        }
                        // Ice crystals forming at high stacks
                        if (slowRatio > 0.6) {
                            this.ctx.globalAlpha = (slowRatio - 0.6) * 2;
                            this.ctx.fillStyle = '#dfe6e9';
                            this.ctx.fillRect(hb.x - 1, hb.y - 1, 2, 2);
                            this.ctx.fillRect(hb.x + hb.width - 1, hb.y - 1, 2, 2);
                        }
                        this.ctx.restore();
                    }
                }
            });
        });

        // Vehicles
        this.vehicles.forEach(v => {
            renderList.push({
                y: v.y + v.height/2,
                draw: () => v.draw(this.ctx)
            });
        });

        // Draw Portals
        if (this.worldSystem && this.worldSystem.portals) {
            this.worldSystem.portals.forEach(p => {
                renderList.push({
                    y: p.y + p.height, // Sort by bottom
                    draw: () => p.draw(this.ctx)
                });
            });
        }

        if (this.player.state !== 'driving') {
            renderList.push({
                y: this.player.y + this.player.height/2,
                draw: () => {
                    this.ctx.save();
                    this.ctx.translate(this.player.x, this.player.y);
                    
                    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI*2);
                    this.ctx.fill();

                    let isBehind = false;
                    if (this.player.state !== 'roll') {
                        isBehind = this.handSystem.isBehind();
                        if (isBehind) {
                            this.ctx.restore();
                            this.handSystem.draw(this.ctx);
                            this.ctx.save();
                            this.ctx.translate(this.player.x, this.player.y);
                        }
                    }

                    if (this.player.state === 'roll') {
                        const maxDuration = 15;
                        const progress = (maxDuration - this.player.rollDuration) / maxDuration;
                        
                        const moveX = Math.cos(this.player.angle);
                        const rotation = (moveX >= 0 ? 1 : -1) * progress * Math.PI * 2;

                        this.ctx.rotate(rotation);

                        if (this.player.rollDuration % 2 === 0) {
                            this.ctx.globalAlpha = 0.3;
                        }
                        
                        const sprite = Assets.player.run[0]; 
                        this.ctx.drawImage(sprite, -16, -16);
                        
                        this.ctx.globalAlpha = 1.0;

                    } else {
                        if (this.player.facingRight) this.ctx.scale(-1, 1);
                        
                        let sprite;
                        if (this.player.state === 'run') {
                            const frameIndex = Math.floor(this.player.animationTimer / 3) % Assets.player.run.length;
                            sprite = Assets.player.run[frameIndex];
                        } else {
                            const frameIndex = Math.floor(this.player.animationTimer / 10) % Assets.player.idle.length;
                            sprite = Assets.player.idle[frameIndex];
                        }
                        this.ctx.drawImage(sprite, -16, -16);
                    }

                    if (this.player.state !== 'roll') {
                        if (this.player.facingRight) this.ctx.scale(-1, 1);
                    }
                    this.ctx.restore();
                    
                    if (this.player.state !== 'roll') {
                        const isBehind = this.handSystem.isBehind();
                        if (!isBehind) {
                            this.handSystem.draw(this.ctx);
                        }
                    }

                    // Draw Reload Bar
                    if (this.handSystem.isReloading) {
                        this.ctx.save();
                        this.ctx.translate(this.player.x, this.player.y - 25);
                        
                        const progress = 1 - (this.handSystem.reloadTimer / this.handSystem.reloadDuration);
                        
                        // Draw Bullet Shape (Reduced size by ~40%)
                        // Original: 24x8 -> New: ~14x5
                        // Scale factor: 0.6
                        
                        const scale = 0.6;
                        
                        this.ctx.scale(scale, scale);
                        
                        // Define Path (Same coords, scaled by context)
                        this.ctx.beginPath();
                        this.ctx.moveTo(-12, -4); // Top Left
                        this.ctx.lineTo(6, -4);   // Top Right (start of tip)
                        this.ctx.quadraticCurveTo(12, 0, 6, 4); // Tip curve
                        this.ctx.lineTo(-12, 4);  // Bottom Left
                        this.ctx.lineTo(-12, -4); // Close
                        
                        // Background (Empty)
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        this.ctx.fill();
                        
                        // Border
                        this.ctx.strokeStyle = '#ffffff';
                        this.ctx.lineWidth = 1.5; // Slightly thicker relative to scale
                        this.ctx.stroke();
                        
                        // Fill Progress
                        this.ctx.clip(); // Clip to bullet shape
                        
                        // Draw Fill Rect
                        const totalWidth = 24;
                        const currentWidth = totalWidth * progress;
                        
                        this.ctx.fillStyle = '#f1c40f'; // Gold/Yellow
                        this.ctx.fillRect(-12, -4, currentWidth, 8);
                        
                        // Draw Shine/Highlight
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.fillRect(-12, -2, 24, 2);

                        this.ctx.restore();
                    }
                }
            });
        }

        renderList.push({
            y: Infinity,
            draw: () => {
            }
        });
        
        // Black holes (drawn on ground, before entities)
        this.blackHoles.forEach(bh => {
            renderList.push({
                y: bh.y,
                draw: () => {
                    const progress = bh.life / bh.maxLife;
                    this.ctx.save();
                    this.ctx.translate(bh.x, bh.y);

                    // Outer pull ring
                    this.ctx.globalAlpha = 0.15 * progress;
                    this.ctx.fillStyle = '#9b59b6';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, bh.radius * progress, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Swirling arcs (4 arms)
                    this.ctx.globalAlpha = 0.6 * progress;
                    for (let j = 0; j < 4; j++) {
                        const armAngle = bh.angle + (Math.PI / 2) * j;
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, bh.damageRadius * 0.7, armAngle, armAngle + 1.2);
                        this.ctx.strokeStyle = '#4a0e6e';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                    }

                    // Inner dark core
                    this.ctx.globalAlpha = 0.9;
                    this.ctx.fillStyle = '#0a0a0a';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Purple ring
                    this.ctx.strokeStyle = '#9b59b6';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    this.ctx.stroke();

                    this.ctx.restore();
                }
            });
        });

        this.particles.forEach(p => {
             renderList.push({
                 y: p.y,
                 draw: () => {
                     if (p.type === 'shockwave') {
                        this.ctx.save();
                        this.ctx.globalAlpha = Math.max(0, p.alpha);
                        this.drawPixelRing(this.ctx, p.x, p.y, p.size, 4, p.color, 4);
                        this.ctx.restore();
                    } else if (p.type === 'flash') {
                        this.ctx.save();
                        this.ctx.globalAlpha = Math.max(0, p.alpha);
                        this.drawPixelCircle(this.ctx, p.x, p.y, p.size, p.color, 4);
                        this.ctx.restore();
                    } else if (p.type === 'fire' || p.type === 'smoke') {
                        this.ctx.save();
                        this.ctx.globalAlpha = Math.max(0, p.alpha);
                        this.drawPixelCircle(this.ctx, p.x, p.y, p.size, p.color, 4);
                        this.ctx.restore();
                    } else if (p.type === 'explosion_anim') {
                         const sprite = p.sprites[p.frame];
                         if (sprite) {
                             this.ctx.drawImage(sprite, p.x - sprite.width/2, p.y - sprite.height/2);
                         }
                     } else if (p.type === 'black_hole_orbit') {
                        this.ctx.save();
                        this.ctx.globalAlpha = Math.max(0, (p.alpha || 0.8) * (p.life / 30));
                        this.ctx.fillStyle = p.color;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    } else if (p.type === 'shell' || p.type === 'debris') {
                        this.ctx.save();
                        if (p.z > 0) {
                            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                            this.ctx.beginPath();
                            this.ctx.ellipse(p.x, p.y, 2, 1, 0, 0, Math.PI * 2);
                            this.ctx.fill();
                        }

                        const drawY = p.y - (p.z || 0);
                        
                        this.ctx.translate(p.x, drawY);
                        this.ctx.rotate(p.angle);
                        this.ctx.fillStyle = p.color;
                        if (p.type === 'debris') {
                             this.ctx.fillRect(-p.size/2, -p.width/2, p.size, p.width);
                        } else {
                             this.ctx.fillRect(-p.size/2, -p.width/2, p.size, p.width);
                        }
                        this.ctx.restore();
                     } else {
                        this.ctx.fillStyle = p.color;
                        this.ctx.fillRect(p.x, p.y, p.size, p.size);
                     }
                 }
             });
        });

        renderList.sort((a, b) => a.y - b.y);
        renderList.forEach(item => item.draw());
        
        // Draw Laser Sight
        this.drawLaserSight(this.ctx);

        this.droppedItems.forEach(item => {
             item.draw(this.ctx);
        });

        this.bullets.forEach(b => {
            if (b.type === 'rocket') {
                const sprite = Assets.rocket_projectile;
                if (sprite) {
                    this.ctx.save();
                    this.ctx.translate(b.x, b.y);
                    const angle = Math.atan2(b.vy, b.vx);
                    this.ctx.rotate(angle);
                    this.ctx.drawImage(sprite, -sprite.width/2, -sprite.height/2);
                    this.ctx.restore();
                }
            } else if (b.type === 'bolt') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.rotate(Math.atan2(b.vy, b.vx));
                this.ctx.fillStyle = b.color || '#95a5a6';
                this.ctx.fillRect(-6, -1, 12, 2);
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.fillRect(-6, -2, 3, 4);
                this.ctx.restore();
            } else if (b.type === 'grenade') {
                // Draw Shadow
                if (b.z > 0) {
                    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    this.ctx.beginPath();
                    this.ctx.ellipse(b.x, b.y, 4, 2, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                const drawY = b.y - (b.z || 0);
                this.ctx.fillStyle = '#556b2f';
                this.ctx.beginPath();
                this.ctx.arc(b.x, drawY, b.size || 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#3b4d23';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            } else if (b.type === 'flame') {
                this.ctx.save();
                const lifeRatio = b.life / (b.maxLife || 30);
                this.ctx.globalAlpha = Math.max(0.2, lifeRatio);
                let color = '#f1c40f';
                if (lifeRatio < 0.5) color = '#e67e22';
                if (lifeRatio < 0.25) color = '#e74c3c';
                this.drawPixelCircle(this.ctx, b.x, b.y, b.size, color, 4);
                this.ctx.restore();
            } else if (b.type === 'black_hole_projectile') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.fillStyle = '#1a1a2e';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#9b59b6';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                this.ctx.restore();
            } else if (b.type === 'teleport') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                // Outer glow
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#5dade2';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 2, 0, Math.PI * 2);
                this.ctx.fill();
                // Core
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                // White center
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'lightning') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                // Outer electric glow
                this.ctx.globalAlpha = 0.4;
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 2, 0, Math.PI * 2);
                this.ctx.fill();
                // Core
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                // Yellow ring
                this.ctx.strokeStyle = '#f1c40f';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                this.ctx.restore();
            } else if (b.type === 'ice_shard') {
                this.ctx.save();
                const lifeRatio = b.life / (b.maxLife || 25);
                this.ctx.globalAlpha = Math.max(0.3, lifeRatio);
                this.ctx.translate(b.x, b.y);
                this.ctx.rotate(Math.atan2(b.vy, b.vx));
                // Diamond / crystal shape
                this.ctx.fillStyle = '#74b9ff';
                this.ctx.beginPath();
                this.ctx.moveTo(-b.size * 0.5, 0);
                this.ctx.lineTo(0, -b.size * 0.3);
                this.ctx.lineTo(b.size * 0.5, 0);
                this.ctx.lineTo(0, b.size * 0.3);
                this.ctx.closePath();
                this.ctx.fill();
                // White center
                this.ctx.fillStyle = '#dfe6e9';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.15, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'ricochet') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                const bounceProgress = 1 - ((b.bounceCount || 0) / (b.maxBounces || 3));
                const glowSize = b.size * (1.5 + bounceProgress);
                // Glow gets brighter with bounces
                this.ctx.globalAlpha = 0.3 + bounceProgress * 0.3;
                this.ctx.fillStyle = '#2ecc71';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
                this.ctx.fill();
                // Core
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#2ecc71';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                // White center
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'boomerang') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                // Spinning rotation
                const spinAngle = ((b.maxLife || 150) - b.life) * 0.3;
                this.ctx.rotate(spinAngle);
                // V-shape boomerang
                this.ctx.fillStyle = '#8d6e63';
                this.ctx.beginPath();
                this.ctx.moveTo(-6, -2);
                this.ctx.lineTo(0, -1);
                this.ctx.lineTo(6, -6);
                this.ctx.lineTo(6, -4);
                this.ctx.lineTo(1, 1);
                this.ctx.lineTo(6, 6);
                this.ctx.lineTo(4, 6);
                this.ctx.lineTo(-1, 1);
                this.ctx.lineTo(-6, 0);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.strokeStyle = '#5d4037';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                this.ctx.restore();
            } else {
                this.ctx.fillStyle = b.color || '#f1c40f';
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.size || 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#e67e22';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });

        // Draw laser beam particles (on top of everything)
        this.particles.forEach(p => {
            if (p.type !== 'laser_beam') return;
            const progress = p.life / p.maxLife;
            const alpha = progress;
            const width = 2 + progress * 3;
            this.ctx.save();
            // Outer glow
            this.ctx.globalAlpha = alpha * 0.3;
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = width * 3;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x1, p.y1);
            this.ctx.lineTo(p.x2, p.y2);
            this.ctx.stroke();
            // Core beam
            this.ctx.globalAlpha = alpha;
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            // Impact flash
            if (progress > 0.5) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(p.x2, p.y2, 4 * progress, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });

        // Draw lightning arc particles
        this.particles.forEach(p => {
            if (p.type !== 'lightning_arc') return;
            const progress = p.life / p.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = progress;

            const dx = p.x2 - p.x1;
            const dy = p.y2 - p.y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const segments = Math.max(3, Math.floor(dist / 15));

            // Outer yellow glow
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x1, p.y1);
            for (let s = 1; s < segments; s++) {
                const t = s / segments;
                const mx = p.x1 + dx * t + (Math.random() - 0.5) * 10;
                const my = p.y1 + dy * t + (Math.random() - 0.5) * 10;
                this.ctx.lineTo(mx, my);
            }
            this.ctx.lineTo(p.x2, p.y2);
            this.ctx.stroke();

            // White core
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x1, p.y1);
            for (let s = 1; s < segments; s++) {
                const t = s / segments;
                const mx = p.x1 + dx * t + (Math.random() - 0.5) * 6;
                const my = p.y1 + dy * t + (Math.random() - 0.5) * 6;
                this.ctx.lineTo(mx, my);
            }
            this.ctx.lineTo(p.x2, p.y2);
            this.ctx.stroke();

            this.ctx.restore();
        });

        // Draw Blueprint
        if (this.buildSystem) {
            this.buildSystem.drawPreview(this.ctx, this.camera);
        }

        // Debug Drawing
        if (this.debugMode === 1) {
            this.drawCollisionDebug(this.ctx);
        } else if (this.debugMode === 2) {
            this.drawHurtboxDebug(this.ctx);
        }

        this.ctx.restore();

        const mouse = this.input.mouse;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(mouse.x, mouse.y - 12);
        this.ctx.lineTo(mouse.x, mouse.y + 12);
        this.ctx.moveTo(mouse.x - 12, mouse.y);
        this.ctx.lineTo(mouse.x + 12, mouse.y);
        this.ctx.stroke();

        this.uiManager.updatePlayerStatus(this.player);
        this.uiManager.updateWeapon(this.handSystem.currentWeapon, this.handSystem.getWeaponState());
    }

    drawCollisionDebug(ctx) {
        ctx.lineWidth = 1;
        
        // Draw Wall Hitboxes (Red)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.walls.forEach(w => {
            ctx.strokeRect(w.x, w.y, w.w, w.h);
        });

        // Draw Player Hitbox (Green)
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        const phbWidth = this.player.hitboxWidth || this.player.width;
        const phbHeight = this.player.hitboxHeight || this.player.height;
        const phbOffsetY = this.player.hitboxOffsetY || 0;
        
        ctx.strokeRect(
            this.player.x - phbWidth / 2,
            this.player.y + phbOffsetY - phbHeight / 2,
            phbWidth,
            phbHeight
        );

        // Draw Enemy Hitboxes (Orange)
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
        this.enemies.forEach(e => {
            const ehbWidth = e.hitboxWidth || e.width;
            const ehbHeight = e.hitboxHeight || e.height;
            const ehbOffsetY = e.hitboxOffsetY || 0;
            
            ctx.strokeRect(
                e.x - ehbWidth / 2,
                e.y + ehbOffsetY - ehbHeight / 2,
                ehbWidth,
                ehbHeight
            );
        });

        // Draw Breakable Object Hitboxes (Blue)
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
        this.breakableObjects.forEach(obj => {
            if (!obj.isBroken) {
                const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
                hitboxes.forEach(hb => {
                    const w = hb.width ?? hb.w;
                    const h = hb.height ?? hb.h;
                    ctx.strokeRect(hb.x, hb.y, w, h);
                });
            }
        });

        // Draw Vehicle Hitboxes (Purple)
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.8)';
        this.vehicles.forEach(v => {
            if (!v.isDead) {
                if (v.getHitboxCorners) {
                    const corners = v.getHitboxCorners();
                    ctx.beginPath();
                    ctx.moveTo(corners[0].x, corners[0].y);
                    for (let i = 1; i < corners.length; i++) {
                        ctx.lineTo(corners[i].x, corners[i].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    const vw = v.hitbox.width;
                    const vh = v.hitbox.height;
                    ctx.strokeRect(v.x - vw/2, v.y - vh/2, vw, vh);
                }
            }
        });

        // Draw Portal Hitboxes (Purple)
        if (this.worldSystem && this.worldSystem.portals) {
            ctx.strokeStyle = 'rgba(200, 0, 255, 0.8)';
            this.worldSystem.portals.forEach(p => {
                const hb = p.getHitbox();
                ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
            });
        }
    }

    drawHurtboxDebug(ctx) {
        ctx.lineWidth = 1;

        // Player bullet hurtbox (Green).
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
        const phb = this.player.getBulletHurtbox
            ? this.player.getBulletHurtbox()
            : {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };
        ctx.strokeRect(phb.x, phb.y, phb.width, phb.height);

        // Enemy bullet hurtboxes (Yellow) - same source used by CombatSystem.
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
        this.enemies.forEach(e => {
            const hb = e.getBulletHurtbox
                ? e.getBulletHurtbox()
                : {
                    x: e.x - e.width / 2,
                    y: e.y - e.height,
                    width: e.width,
                    height: e.height
                };
            ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
        });

        // Breakable object hurtboxes used for bullet collision (Cyan).
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
        this.breakableObjects.forEach(obj => {
            if (obj.isBroken) return;
            const hurtboxes = obj.getHurtboxes
                ? obj.getHurtboxes()
                : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()];
            hurtboxes.forEach(hb => {
                const w = hb.width ?? hb.w;
                const h = hb.height ?? hb.h;
                ctx.strokeRect(hb.x, hb.y, w, h);
            });
        });
    }

    drawLaserSight(ctx) {
        const weapon = this.handSystem.currentWeapon;
        if (!weapon || !weapon.laserSight) return;

        const now = Date.now();

        // Use HandSystem's angle directly to guarantee laser matches gun orientation
        const angle = this.handSystem.angle;
        const gunScale = weapon.scale || 1;
        const laserOffset = weapon.laserOffset || { x: 0, y: 0 };

        // Recalculate Pivot (same as HandSystem.draw)
        let bobY = 0;
        if (this.player.state === 'idle') {
            bobY = Math.sin(now / 300) * 0.5;
        } else if (this.player.state === 'run') {
            bobY = Math.sin(now / 100) * 1.0;
        }

        const currentDist = (weapon.orbitRadius || 16) - (this.handSystem.recoilOffset || 0);
        const pivotX = this.player.x + Math.cos(angle) * currentDist;
        const pivotY = this.player.y + Math.sin(angle) * currentDist + bobY;

        let lx = laserOffset.x * gunScale;
        let ly = laserOffset.y * gunScale;

        // Flip logic if facing left
        const isFlipped = Math.abs(angle) > Math.PI / 2;
        if (isFlipped) ly = -ly;

        const rx = lx * Math.cos(angle) - ly * Math.sin(angle);
        const ry = lx * Math.sin(angle) + ly * Math.cos(angle);

        const start = {
            x: pivotX + rx,
            y: pivotY + ry
        };

        // Laser direction parallel to barrel (same as bullet direction)
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        
        const maxDist = 800;
        let minDist = maxDist;

        // Check all collidable surfaces (same order as bullet collision)

        // 1. Walls
        this.walls.forEach(w => {
            const dist = CollisionUtils.rayRectIntersect(start, dir, {x: w.x, y: w.y, width: w.w, height: w.h}, minDist);
            if (dist !== null && dist < minDist) minDist = dist;
        });

        // 2. Vehicles
        this.vehicles.forEach(v => {
            if (v.isDead) return;
            const rect = { x: v.x - v.width/2, y: v.y - v.height/2, width: v.width, height: v.height };
            const dist = CollisionUtils.rayRectIntersect(start, dir, rect, minDist);
            if (dist !== null && dist < minDist) minDist = dist;
        });

        // 3. Breakable objects
        this.breakableObjects.forEach(obj => {
            if (obj.isBroken) return;
            const boxes = obj.getHurtboxes
                ? obj.getHurtboxes()
                : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()];
            const dist = CollisionUtils.rayIntersectsRects(start, dir, boxes, minDist);
            if (dist !== null && dist < minDist) minDist = dist;
        });

        // 4. Enemies
        let hitEnemy = null;
        let hitEnemyDist = minDist;
        this.enemies.forEach(e => {
            const rect = e.getBulletHurtbox
                ? e.getBulletHurtbox()
                : { x: e.x - e.width/2, y: e.y - e.height, width: e.width, height: e.height };
            const dist = CollisionUtils.rayRectIntersect(start, dir, rect, hitEnemyDist);
            if (dist !== null && dist < hitEnemyDist) {
                hitEnemyDist = dist;
                hitEnemy = e;
            }
        });
        if (hitEnemy) minDist = hitEnemyDist;

        const end = {
            x: start.x + dir.x * minDist,
            y: start.y + dir.y * minDist
        };

        ctx.save();
        ctx.strokeStyle = weapon.laserColor || 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;

        // Draw Laser Line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw Dot at end
        ctx.fillStyle = hitEnemy ? 'rgba(255, 50, 50, 1.0)' : 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(end.x, end.y, hitEnemy ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
