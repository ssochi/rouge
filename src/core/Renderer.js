import { Assets } from '../graphics/Assets.js';
import { TILE_SIZE, COLORS } from '../utils/Constants.js';

export class Renderer {
    constructor({ canvas, ctx, scale, camera, input, uiManager, handSystem, player, walls, enemies, breakableObjects, particles, droppedItems, bullets, worldSystem, vehicles, buildSystem }) {
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
                // Sort by hitbox bottom if available, otherwise use visual height
                // This handles "3D" objects like walls where the visual bottom (32) 
                // is lower than the physical footprint (22)
                let sortY = obj.y + obj.height;
                
                if (obj.getHitboxes) {
                    // Support multiple hitboxes (e.g. Open Door Frames)
                    // Use the lowest point (Max Y) of any hitbox for sorting
                    const hitboxes = obj.getHitboxes();
                    let maxY = -Infinity;
                    hitboxes.forEach(hb => {
                        // hb is in world coordinates
                        const bottom = hb.y + hb.height;
                        if (bottom > maxY) maxY = bottom;
                    });
                    if (maxY !== -Infinity) {
                        sortY = maxY;
                    }
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
                const hb = obj.getHitbox();
                ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
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
            const hb = obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox();
            ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
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
            const dist = this.rayRectIntersect(start, dir, {x: w.x, y: w.y, width: w.w, height: w.h});
            if (dist !== null && dist < minDist) minDist = dist;
        });

        // 2. Vehicles
        this.vehicles.forEach(v => {
            if (v.isDead) return;
            const rect = { x: v.x - v.width/2, y: v.y - v.height/2, width: v.width, height: v.height };
            const dist = this.rayRectIntersect(start, dir, rect);
            if (dist !== null && dist < minDist) minDist = dist;
        });

        // 3. Breakable objects
        this.breakableObjects.forEach(obj => {
            if (obj.isBroken) return;
            const box = obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox();
            const dist = this.rayRectIntersect(start, dir, box);
            if (dist !== null && dist < minDist) minDist = dist;
        });

        // 4. Enemies
        let hitEnemy = null;
        let hitEnemyDist = minDist;
        this.enemies.forEach(e => {
            const rect = e.getBulletHurtbox
                ? e.getBulletHurtbox()
                : { x: e.x - e.width/2, y: e.y - e.height, width: e.width, height: e.height };
            const dist = this.rayRectIntersect(start, dir, rect);
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
    
    // Helper: Ray vs Rect Intersection (Returns distance or null)
    rayRectIntersect(origin, dir, rect) {
        // Slab method
        let tMin = 0;
        let tMax = Infinity;
        
        // X slab
        if (Math.abs(dir.x) < 1e-6) {
            // Parallel to X axis
            if (origin.x < rect.x || origin.x > rect.x + rect.width) return null;
        } else {
            const t1 = (rect.x - origin.x) / dir.x;
            const t2 = (rect.x + rect.width - origin.x) / dir.x;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }
        
        // Y slab
        if (Math.abs(dir.y) < 1e-6) {
             if (origin.y < rect.y || origin.y > rect.y + rect.height) return null;
        } else {
            const t1 = (rect.y - origin.y) / dir.y;
            const t2 = (rect.y + rect.height - origin.y) / dir.y;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }
        
        if (tMax < tMin || tMax < 0) return null;
        
        return tMin > 0 ? tMin : 0; 
    }
}
