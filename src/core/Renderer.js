import { Assets } from '../graphics/Assets.js';
import { TILE_SIZE, COLORS } from '../utils/Constants.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

export class Renderer {
    constructor({ canvas, ctx, scale, camera, input, uiManager, handSystem, player, walls, enemies, breakableObjects, particles, droppedItems, bullets, worldSystem, vehicles, buildSystem, blackHoles, acidPuddles, profiler, pets, costumeSystem, lightSystem }) {
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
        this.acidPuddles = acidPuddles || [];
        this.profiler = profiler || null;
        this.pets = pets || [];
        this.costumeSystem = costumeSystem || null;
        this.lightSystem = lightSystem || null;
        this.debugMode = 0; // 0: off, 1: collision boxes, 2: hurtboxes, 3: flow field
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
            this.debugMode = (this.debugMode + 1) % 4;
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

        // Draw dungeon energy barrier gates
        if (this.worldSystem && this.worldSystem.dungeonManager) {
            const dm = this.worldSystem.dungeonManager;
            for (const gate of dm.gates) {
                if (gate.alpha <= 0) continue;
                // Use the first tile's y for sort order
                const sortY = gate.tiles[0].y * TILE_SIZE + TILE_SIZE;
                renderList.push({
                    y: sortY,
                    draw: () => this._drawEnergyBarrier(gate)
                });
            }
        }

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
                    // Ice effect overlay (boss handles its own overlays)
                    if (e.frozenTimer > 0 && !e.isBoss) {
                        const hb = e.getBulletHurtbox ? e.getBulletHurtbox() :
                            { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                        if (hb) {
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
                        }
                    } else if (e.slowTimer > 0 && !e.isBoss) {
                        const hb = e.getBulletHurtbox ? e.getBulletHurtbox() :
                            { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                        if (hb) {
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
                    // Bleed overlay (Battle Axe DOT) - boss handles its own
                    if (e.bleedTimer > 0 && !e.isBoss) {
                        const bleedHb = e.getBulletHurtbox ? e.getBulletHurtbox() :
                            { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                        if (bleedHb) {
                        this.ctx.save();
                        const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
                        this.ctx.globalAlpha = pulse;
                        this.ctx.fillStyle = '#c0392b';
                        this.ctx.fillRect(bleedHb.x, bleedHb.y, bleedHb.width, bleedHb.height);
                        this.ctx.restore();
                        }
                    }
                    // Needle stacks indicator
                    if (e.needleStacks > 0 && e.needleTimer > 0) {
                        const hb = e.getBulletHurtbox ? e.getBulletHurtbox() :
                            { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                        if (!hb) { /* underground or dead — skip */ }
                        else {
                        this.ctx.save();
                        const topY = hb.y - 6;
                        const centerX = hb.x + hb.width / 2;
                        const spacing = 3;
                        const startX = centerX - (e.needleStacks - 1) * spacing / 2;
                        for (let s = 0; s < e.needleStacks; s++) {
                            const sx = startX + s * spacing;
                            this.ctx.globalAlpha = 0.9;
                            this.ctx.fillStyle = '#bdc3c7';
                            this.ctx.fillRect(sx, topY, 1, 4);
                            this.ctx.fillStyle = '#ecf0f1';
                            this.ctx.fillRect(sx, topY, 1, 1);
                        }
                        this.ctx.restore();
                        }
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

        // Draw Pets
        this.pets.forEach(pet => {
            renderList.push({
                y: pet.y + pet.height / 2,
                draw: () => pet.draw(this.ctx)
            });
        });

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

                    // Get frames from CostumeSystem (or fallback to Assets)
                    const playerFrames = this.costumeSystem
                        ? this.costumeSystem.getPlayerFrames(this.player.costume)
                        : Assets.player;

                    if (this.player.state === 'roll') {
                        const maxDuration = 15;
                        const progress = (maxDuration - this.player.rollDuration) / maxDuration;
                        const moveX = Math.cos(this.player.angle);
                        const direction = moveX >= 0 ? 1 : -1;
                        const rotation = direction * progress * Math.PI * 2;
                        const sprite = playerFrames.run[0];

                        // --- Squash & Stretch ---
                        let scaleX = 1, scaleY = 1;
                        if (progress < 0.15) {
                            const t = progress / 0.15;
                            scaleX = 1 - 0.3 * t;
                            scaleY = 1 + 0.3 * t;
                        } else if (progress > 0.85) {
                            const t = (progress - 0.85) / 0.15;
                            scaleX = 1 + 0.3 * t;
                            scaleY = 1 - 0.3 * t;
                        }

                        // --- Main body with rotation + scale ---
                        this.ctx.rotate(rotation);
                        this.ctx.scale(scaleX, scaleY);
                        this.ctx.drawImage(sprite, -16, -32);

                    } else {
                        if (!this.player.facingRight) this.ctx.scale(-1, 1);

                        let sprite;
                        if (this.player.state === 'run') {
                            const frameIndex = Math.floor(this.player.animationTimer / 3) % playerFrames.run.length;
                            sprite = playerFrames.run[frameIndex];
                        } else {
                            const frameIndex = Math.floor(this.player.animationTimer / 10) % playerFrames.idle.length;
                            sprite = playerFrames.idle[frameIndex];
                        }
                        this.ctx.drawImage(sprite, -16, -32);
                    }

                    if (this.player.state !== 'roll') {
                        if (!this.player.facingRight) this.ctx.scale(-1, 1);
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

        this.acidPuddles.forEach(puddle => {
            renderList.push({
                y: puddle.y,
                draw: () => {
                    const progress = puddle.life / puddle.maxLife;
                    this.ctx.save();
                    this.ctx.translate(puddle.x, puddle.y);
                    this.ctx.globalAlpha = 0.4 * progress;
                    this.ctx.fillStyle = '#76ff03';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, puddle.radius, puddle.radius * 0.6, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 0.6 * progress;
                    this.ctx.fillStyle = '#64dd17';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, puddle.radius * 0.5, puddle.radius * 0.3, 0, 0, Math.PI * 2);
                    this.ctx.fill();
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
                    } else if (p.type === 'slash_trail') {
                        this.ctx.save();
                        this.ctx.globalAlpha = Math.max(0, p.alpha);
                        this.ctx.strokeStyle = p.color;
                        this.ctx.lineWidth = p.width || 3;
                        this.ctx.lineCap = 'round';
                        this.ctx.beginPath();
                        this.ctx.arc(p.originX, p.originY, p.radius, p.startAngle, p.endAngle, p.anticlockwise || false);
                        this.ctx.stroke();
                        this.ctx.restore();
                    } else if (p.type === 'thrust_trail') {
                        this.ctx.save();
                        this.ctx.globalAlpha = Math.max(0, p.alpha);
                        this.ctx.strokeStyle = p.color;
                        this.ctx.lineWidth = p.width || 3;
                        this.ctx.lineCap = 'round';
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.startX, p.startY);
                        this.ctx.lineTo(p.endX, p.endY);
                        this.ctx.stroke();
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
            } else if (b.type === 'plasma') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#00e676';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 1.8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#00e5ff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'homing') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                const hmAngle = Math.atan2(b.vy, b.vx);
                this.ctx.rotate(hmAngle);
                // Missile body
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.fillRect(-5, -2, 10, 4);
                // Nose cone
                this.ctx.fillStyle = '#c0392b';
                this.ctx.beginPath();
                this.ctx.moveTo(5, -2);
                this.ctx.lineTo(8, 0);
                this.ctx.lineTo(5, 2);
                this.ctx.closePath();
                this.ctx.fill();
                // Fins
                this.ctx.fillStyle = '#95a5a6';
                this.ctx.fillRect(-5, -4, 3, 2);
                this.ctx.fillRect(-5, 2, 3, 2);
                // Exhaust glow
                this.ctx.globalAlpha = 0.6;
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(-5, 0, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'acid') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#76ff03';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#64dd17';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ccff90';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'cluster') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#ff9800';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#ff9800';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                // Inner cluster dots
                this.ctx.fillStyle = '#ffb74d';
                for (let d = 0; d < 3; d++) {
                    const clA = (Math.PI * 2 / 3) * d + ((b.maxLife - b.life) * 0.1);
                    this.ctx.beginPath();
                    this.ctx.arc(
                        Math.cos(clA) * b.size * 0.4,
                        Math.sin(clA) * b.size * 0.4,
                        1.5, 0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
                this.ctx.restore();
            } else if (b.type === 'force') {
                this.ctx.save();
                const forceLifeRatio = b.life / (b.maxLife || 15);
                this.ctx.globalAlpha = Math.max(0.2, forceLifeRatio);
                this.ctx.translate(b.x, b.y);
                this.ctx.strokeStyle = '#42a5f5';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 1.5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.fillStyle = '#90caf9';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ffffff';
                this.ctx.globalAlpha = forceLifeRatio;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'vampyre') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                const pulse = 0.3 + Math.sin((b.maxLife - b.life) * 0.3) * 0.15;
                this.ctx.globalAlpha = pulse;
                this.ctx.fillStyle = '#8b0000';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 1.8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'needle') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.rotate(Math.atan2(b.vy, b.vx));
                this.ctx.fillStyle = '#e0e0e0';
                this.ctx.fillRect(-5, -0.5, 10, 1);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(4, -1, 2, 2);
                this.ctx.fillStyle = '#78909c';
                this.ctx.fillRect(-5, -1, 2, 2);
                this.ctx.restore();
            } else if (b.type === 'railgun') {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const maxSpd = b.railMaxSpeed || 25;
                const intensity = Math.min(1.0, speed / maxSpd);
                const rAngle = Math.atan2(b.vy, b.vx);
                this.ctx.rotate(rAngle);
                // Speed trail
                const trailLen = 3 + intensity * 12;
                this.ctx.globalAlpha = 0.3 * intensity;
                this.ctx.fillStyle = '#00bcd4';
                this.ctx.fillRect(-trailLen, -2, trailLen, 4);
                // Core
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = intensity > 0.6 ? '#ffffff' : '#00bcd4';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * (0.8 + intensity * 0.4), 0, Math.PI * 2);
                this.ctx.fill();
                // Outer glow
                this.ctx.globalAlpha = 0.3 + intensity * 0.3;
                this.ctx.fillStyle = '#4dd0e1';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, b.size * 1.5 + intensity * 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (b.type === 'laser_bolt') {
                // Star Wars style laser bolt — elongated glowing projectile
                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                const bAngle = Math.atan2(b.vy, b.vx);
                this.ctx.rotate(bAngle);
                const boltLen = 10;
                const boltW = 2;
                // Outer glow
                this.ctx.globalAlpha = 0.25;
                this.ctx.fillStyle = b.color || '#00e5ff';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, boltLen + 4, boltW + 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                // Main body
                this.ctx.globalAlpha = 0.7;
                this.ctx.fillStyle = b.color || '#00e5ff';
                this.ctx.fillRect(-boltLen, -boltW, boltLen * 2, boltW * 2);
                // Bright core
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(-boltLen + 1, -1, boltLen * 2 - 2, 2);
                // Leading tip glow
                this.ctx.beginPath();
                this.ctx.arc(boltLen - 1, 0, boltW, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fill();
                // Trailing fade
                this.ctx.globalAlpha = 0.4;
                this.ctx.fillStyle = b.color || '#00e5ff';
                this.ctx.fillRect(-boltLen - 4, -1, 5, 2);
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

        // Pixel lighting pass (world-space, before debug overlays and UI).
        if (this.lightSystem) {
            if (this.profiler) this.profiler.begin('LightingRender');
            this.lightSystem.render(this.ctx, {
                camera: this.camera,
                viewportWidth: viewportW,
                viewportHeight: viewportH,
                screenScale: this.scale
            });
            if (this.profiler) this.profiler.end('LightingRender');
        }

        // Debug Drawing
        if (this.debugMode === 1) {
            this.drawCollisionDebug(this.ctx);
        } else if (this.debugMode === 2) {
            this.drawHurtboxDebug(this.ctx);
        } else if (this.debugMode === 3) {
            this.drawFlowFieldDebug(this.ctx);
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

        // Boss HP Bar
        this.drawBossHpBar(this.ctx);

        // Dungeon Minimap
        this.drawDungeonMinimap(this.ctx);

        // Profiler Overlay
        if (this.profiler && this.profiler.visible) {
            this.drawProfiler(this.ctx);
        }

        this.uiManager.updatePlayerStatus(this.player);
        this.uiManager.updateWeapon(this.handSystem.currentWeapon, this.handSystem.getWeaponState());
    }

    drawBossHpBar(ctx) {
        const boss = this.enemies.find(e => e.isBoss && e.hp > 0);
        if (!boss) return;

        const canvasW = this.canvas.width;
        const BAR_W = 300;
        const BAR_H = 14;
        const x = (canvasW - BAR_W) / 2;
        const y = 20;

        // Read boss config or use defaults (backward compatible)
        const bossName = boss.name || 'BOSS';
        const defaultPhaseColors = ['#4a7c59', '#8b3a3a', '#5c2d82'];
        const defaultPhaseNames = ['I', 'II', 'III'];
        const defaultPhaseMarkers = [0.6, 0.25];
        const bossPhaseColors = boss.phaseColors || defaultPhaseColors;
        const bossPhaseNames = boss.phaseNames || defaultPhaseNames;
        const bossPhaseMarkers = boss.phaseMarkers || defaultPhaseMarkers;

        ctx.save();

        // Name
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(bossName, canvasW / 2, y - 4);

        // Phase indicator
        ctx.font = '10px monospace';
        ctx.fillStyle = bossPhaseColors[boss.phase - 1] || '#fff';
        const phaseName = bossPhaseNames[boss.phase - 1] || boss.phase;
        ctx.fillText('Phase ' + phaseName, canvasW / 2, y + BAR_H + 14);

        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 2, y - 2, BAR_W + 4, BAR_H + 4);

        // HP fill
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);
        const fillColor = bossPhaseColors[boss.phase - 1] || '#4a7c59';
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, BAR_W * hpRatio, BAR_H);

        // Phase transition markers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (const marker of bossPhaseMarkers) {
            const mx = x + BAR_W * marker;
            ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx, y + BAR_H); ctx.stroke();
        }

        // Border
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, BAR_W, BAR_H);

        ctx.restore();
    }

    drawDungeonMinimap(ctx) {
        const dm = this.worldSystem && this.worldSystem.dungeonManager;
        if (!dm) return;

        const data = dm.getMinimapData(this.player);
        if (!data.rooms.length) return;

        const MINIMAP_SIZE = 140;
        const PADDING = 10;
        const canvasW = this.canvas.width;
        const mx = canvasW - MINIMAP_SIZE - PADDING;
        const my = PADDING;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(mx - 4, my - 4, MINIMAP_SIZE + 8, MINIMAP_SIZE + 8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - 4, my - 4, MINIMAP_SIZE + 8, MINIMAP_SIZE + 8);

        // Calculate bounds of all rooms for fitting
        let minRX = Infinity, minRY = Infinity, maxRX = -Infinity, maxRY = -Infinity;
        for (const room of dm.layout.rooms) {
            minRX = Math.min(minRX, room.x);
            minRY = Math.min(minRY, room.y);
            maxRX = Math.max(maxRX, room.x + room.w);
            maxRY = Math.max(maxRY, room.y + room.h);
        }

        const worldW = maxRX - minRX;
        const worldH = maxRY - minRY;
        const scale = Math.min(
            (MINIMAP_SIZE - 16) / worldW,
            (MINIMAP_SIZE - 16) / worldH
        );
        const offsetX = mx + (MINIMAP_SIZE - worldW * scale) / 2;
        const offsetY = my + (MINIMAP_SIZE - worldH * scale) / 2;

        const toMiniX = (tx) => offsetX + (tx - minRX) * scale;
        const toMiniY = (ty) => offsetY + (ty - minRY) * scale;

        // Draw corridors (only between visited rooms)
        ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
        ctx.lineWidth = Math.max(1, scale * 2);
        for (const corridor of data.corridors) {
            const [rid1, rid2] = corridor.connectsRooms;
            const r1 = dm.rooms.get(rid1);
            const r2 = dm.rooms.get(rid2);
            if (!r1 || !r2) continue;
            if (!r1.visited && !r2.visited) continue;

            const cx1 = toMiniX(r1.x + r1.w / 2);
            const cy1 = toMiniY(r1.y + r1.h / 2);
            const cx2 = toMiniX(r2.x + r2.w / 2);
            const cy2 = toMiniY(r2.y + r2.h / 2);
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.lineTo(cx2, cy2);
            ctx.stroke();
        }

        // Draw rooms
        for (const room of data.rooms) {
            const rx = toMiniX(room.x);
            const ry = toMiniY(room.y);
            const rw = room.w * scale;
            const rh = room.h * scale;

            // Room fill color based on state
            if (room.state === 'unknown') {
                ctx.fillStyle = 'rgba(60, 60, 70, 0.6)';
            } else if (room.id === data.currentRoomId) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            } else if (room.state === 'cleared') {
                ctx.fillStyle = room.type === 'start' ? 'rgba(80, 140, 200, 0.7)' : 'rgba(80, 180, 80, 0.7)';
            } else if (room.state === 'active') {
                ctx.fillStyle = 'rgba(220, 180, 50, 0.7)';
            } else if (room.type === 'boss') {
                ctx.fillStyle = 'rgba(180, 50, 50, 0.7)';
            } else {
                ctx.fillStyle = 'rgba(100, 100, 110, 0.7)';
            }

            ctx.fillRect(rx, ry, rw, rh);

            // Room border
            ctx.strokeStyle = room.id === data.currentRoomId ? '#fff' : 'rgba(150, 150, 160, 0.6)';
            ctx.lineWidth = room.id === data.currentRoomId ? 2 : 1;
            ctx.strokeRect(rx, ry, rw, rh);

            // Boss room skull indicator
            if (room.type === 'boss' && room.state !== 'unknown') {
                ctx.fillStyle = '#fff';
                ctx.font = `${Math.max(8, Math.floor(rw * 0.4))}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('B', rx + rw / 2, ry + rh / 2);
            }
        }

        // Draw player dot
        const px = toMiniX(data.playerTileX);
        const py = toMiniY(data.playerTileY);
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        // Title with floor label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const floorLabel = data.floor ? `DUNGEON F${data.floor}` : 'DUNGEON';
        ctx.fillText(floorLabel, mx + MINIMAP_SIZE / 2, my - 2);

        ctx.restore();
    }

    _drawEnergyBarrier(gate) {
        const ctx = this.ctx;
        const alpha = gate.alpha;
        const t = gate.animTimer;
        const tiles = gate.tiles;

        // Compute bounding box of all tiles
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const tile of tiles) {
            const px = tile.x * TILE_SIZE;
            const py = tile.y * TILE_SIZE;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px + TILE_SIZE > maxX) maxX = px + TILE_SIZE;
            if (py + TILE_SIZE > maxY) maxY = py + TILE_SIZE;
        }

        const bw = maxX - minX;
        const bh = maxY - minY;

        ctx.save();
        ctx.translate(minX, minY);

        // Outer glow
        ctx.globalAlpha = alpha * 0.12;
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(-6, -6, bw + 12, bh + 12);

        // Main barrier body
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, 0, bw, bh);

        // Pulsing scanlines along the longer axis
        const isWide = bw >= bh;
        const stripeCount = Math.max(4, Math.floor((isWide ? bw : bh) / 5));
        for (let i = 0; i < stripeCount; i++) {
            const pulse = 0.3 + 0.3 * Math.sin(t * 0.1 + i * 1.0);
            ctx.globalAlpha = alpha * pulse;
            ctx.fillStyle = '#a78bfa';
            if (isWide) {
                const sw = bw / stripeCount;
                ctx.fillRect(i * sw + 1, 0, sw - 2, bh);
            } else {
                const sh = bh / stripeCount;
                ctx.fillRect(0, i * sh + 1, bw, sh - 2);
            }
        }

        // Scrolling energy bands perpendicular to stripes
        const bandCount = 4;
        for (let i = 0; i < bandCount; i++) {
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = '#c4b5fd';
            if (isWide) {
                const bandY = ((t * 0.5 + i * (bh / bandCount)) % bh);
                ctx.fillRect(0, bandY, bw, 2);
            } else {
                const bandX = ((t * 0.5 + i * (bw / bandCount)) % bw);
                ctx.fillRect(bandX, 0, 2, bh);
            }
        }

        // Bright edge glow
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, bw, bh);

        // Corner sparkles
        const sparkle = alpha * (0.4 + 0.4 * Math.sin(t * 0.15));
        ctx.globalAlpha = sparkle;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 3, 3);
        ctx.fillRect(bw - 2, -1, 3, 3);
        ctx.fillRect(-1, bh - 2, 3, 3);
        ctx.fillRect(bw - 2, bh - 2, 3, 3);

        ctx.restore();
    }

    drawProfiler(ctx) {
        const profiler = this.profiler;
        const canvasW = this.canvas.width;

        // Layout
        const MARGIN = 16;
        const PAD = 12;
        const PANEL_W = 420;
        const GRAPH_H = 120;
        const ROW_H = 18;
        const BAR_W = 160;
        const BAR_H = 12;

        const history = profiler.getHistory();
        const latest = profiler.getLatestFrame();
        const systemOrder = profiler.getSystemOrder();

        const breakdownH = systemOrder.length * ROW_H + 30;
        const PANEL_H = 40 + GRAPH_H + 16 + breakdownH + PAD * 2;

        const px = canvasW - PANEL_W - MARGIN;
        const py = MARGIN;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(px, py, PANEL_W, PANEL_H);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, PANEL_W, PANEL_H);

        // Header: FPS + frame time
        const fps = profiler.fps;
        const frameMs = latest ? latest.total.toFixed(1) : '0.0';
        const fpsColor = fps >= 55 ? '#2ecc71' : fps >= 30 ? '#f1c40f' : '#e74c3c';

        ctx.font = '16px monospace';
        ctx.fillStyle = fpsColor;
        ctx.fillText(`${fps} FPS`, px + PAD, py + PAD + 14);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`${frameMs} ms`, px + PAD + 90, py + PAD + 14);

        ctx.fillStyle = '#666';
        ctx.fillText(`(${history.length} frames)`, px + PAD + 170, py + PAD + 14);

        // Frame time graph
        const gx = px + PAD;
        const gy = py + PAD + 28;
        const gw = PANEL_W - PAD * 2;
        const gh = GRAPH_H;
        const maxMs = 50;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(gx, gy, gw, gh);

        // Reference lines: 60fps (16.67ms) and 30fps (33.33ms)
        const y60 = gy + gh - (16.67 / maxMs) * gh;
        const y30 = gy + gh - (33.33 / maxMs) * gh;

        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;

        ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.beginPath();
        ctx.moveTo(gx, y60);
        ctx.lineTo(gx + gw, y60);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
        ctx.beginPath();
        ctx.moveTo(gx, y30);
        ctx.lineTo(gx + gw, y30);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reference labels
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(46, 204, 113, 0.6)';
        ctx.fillText('60', gx + gw + 2, y60 + 3);
        ctx.fillStyle = 'rgba(241, 196, 15, 0.6)';
        ctx.fillText('30', gx + gw + 2, y30 + 3);

        // History bars (stacked per system)
        if (history.length > 0) {
            const barW = Math.max(1, gw / profiler.HISTORY_SIZE);
            const startX = gx + gw - history.length * barW;

            for (let i = 0; i < history.length; i++) {
                const frame = history[i];
                const bx = startX + i * barW;

                // Stacked system bars (bottom-up)
                let stackY = gy + gh;
                for (const label of systemOrder) {
                    const ms = frame.systems[label] || 0;
                    const h = (ms / maxMs) * gh;
                    if (h < 0.5) continue;
                    stackY -= h;
                    ctx.fillStyle = profiler.getSystemColor(label);
                    ctx.fillRect(bx, stackY, barW - 0.2, h);
                }

                // Remaining unlabeled time (gray)
                let labeledMs = 0;
                for (const l of systemOrder) labeledMs += (frame.systems[l] || 0);
                const otherMs = frame.total - labeledMs;
                if (otherMs > 0.5) {
                    const otherH = (otherMs / maxMs) * gh;
                    stackY -= otherH;
                    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
                    ctx.fillRect(bx, stackY, barW - 0.2, otherH);
                }
            }
        }

        // System breakdown (latest frame)
        const bdY = gy + gh + 16;

        ctx.font = '10px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('SYSTEM BREAKDOWN', gx, bdY);

        if (latest) {
            const totalMs = latest.total;

            for (let i = 0; i < systemOrder.length; i++) {
                const label = systemOrder[i];
                const ms = latest.systems[label] || 0;
                const pct = totalMs > 0 ? (ms / totalMs) * 100 : 0;
                const rowY = bdY + 16 + i * ROW_H;

                // Color swatch
                ctx.fillStyle = profiler.getSystemColor(label);
                ctx.fillRect(gx, rowY, 8, BAR_H);

                // Label
                ctx.fillStyle = '#ccc';
                ctx.font = '10px monospace';
                ctx.fillText(label, gx + 14, rowY + 10);

                // Proportional bar
                const barX = gx + 120;

                // Background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
                ctx.fillRect(barX, rowY, BAR_W, BAR_H);

                // Fill
                const fillW = Math.max(1, (pct / 100) * BAR_W);
                ctx.fillStyle = profiler.getSystemColor(label);
                ctx.globalAlpha = 0.7;
                ctx.fillRect(barX, rowY, fillW, BAR_H);
                ctx.globalAlpha = 1.0;

                // ms + percentage
                ctx.fillStyle = '#aaa';
                ctx.fillText(`${ms.toFixed(2)}ms (${pct.toFixed(0)}%)`, barX + BAR_W + 8, rowY + 10);
            }
        }

        ctx.restore();
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

    drawFlowFieldDebug(ctx) {
        const navGrid = this.worldSystem && this.worldSystem.navGrid;
        if (!navGrid) return;

        const gs = navGrid.gridSize;
        const viewportW = this.canvas.width / this.scale;
        const viewportH = this.canvas.height / this.scale;
        const startCol = Math.max(0, Math.floor(this.camera.x / gs));
        const endCol = Math.min(navGrid.gridCols - 1, Math.ceil((this.camera.x + viewportW) / gs));
        const startRow = Math.max(0, Math.floor(this.camera.y / gs));
        const endRow = Math.min(navGrid.gridRows - 1, Math.ceil((this.camera.y + viewportH) / gs));

        // Find max reachable distance for color mapping
        let maxDist = 1;
        for (let gy = startRow; gy <= endRow; gy++) {
            for (let gx = startCol; gx <= endCol; gx++) {
                const d = navGrid.flowDist[gy * navGrid.gridCols + gx];
                if (d > maxDist) maxDist = d;
            }
        }

        for (let gy = startRow; gy <= endRow; gy++) {
            for (let gx = startCol; gx <= endCol; gx++) {
                const idx = gy * navGrid.gridCols + gx;
                const dist = navGrid.flowDist[idx];
                const px = gx * gs;
                const py = gy * gs;

                // Wall blocked cells
                if (navGrid.wallBlocked[idx] === 1) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
                    ctx.fillRect(px, py, gs, gs);
                    continue;
                }

                // Unreachable cells
                if (dist < 0) {
                    ctx.fillStyle = 'rgba(80, 80, 80, 0.3)';
                    ctx.fillRect(px, py, gs, gs);
                    continue;
                }

                // Distance heatmap: green (close) → yellow → red (far)
                const t = Math.min(1, dist / maxDist);
                const r = Math.floor(t < 0.5 ? t * 2 * 255 : 255);
                const g = Math.floor(t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255);
                ctx.fillStyle = `rgba(${r}, ${g}, 0, 0.2)`;
                ctx.fillRect(px, py, gs, gs);

                // Draw flow direction arrow
                const dirX = navGrid.flowDirX[idx];
                const dirY = navGrid.flowDirY[idx];
                if (dirX === 0 && dirY === 0) continue;

                const cx = px + gs / 2;
                const cy = py + gs / 2;
                const arrowLen = gs * 0.35;
                const tipX = cx + dirX * arrowLen;
                const tipY = cy + dirY * arrowLen;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - dirX * arrowLen * 0.3, cy - dirY * arrowLen * 0.3);
                ctx.lineTo(tipX, tipY);
                ctx.stroke();

                // Arrowhead
                const headLen = 3;
                const angle = Math.atan2(dirY, dirX);
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - Math.cos(angle - 0.5) * headLen, tipY - Math.sin(angle - 0.5) * headLen);
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - Math.cos(angle + 0.5) * headLen, tipY - Math.sin(angle + 0.5) * headLen);
                ctx.stroke();
            }
        }

        // Mark player cell
        const pcx = navGrid.flowPlayerCellX;
        const pcy = navGrid.flowPlayerCellY;
        if (pcx >= 0 && pcy >= 0) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(pcx * gs + 1, pcy * gs + 1, gs - 2, gs - 2);
        }
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
