import { Assets } from '../../graphics/Assets.js';
import { InputHandler } from '../Input.js';

export class Vehicle {
    constructor(x, y, type = 'suv') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Stats Config
        const stats = this._getStats(type);
        
        this.width = stats.width; 
        this.height = stats.height;
        
        // Physics
        this.angle = 0; // Radians, 0 = Right
        this.speed = 0;
        this.maxSpeed = stats.maxSpeed;
        this.acceleration = stats.acceleration;
        this.friction = 0.95;
        this.turnSpeed = stats.turnSpeed;
        this.steeringAngle = 0;
        
        // Combat Stats
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.ramDamage = stats.ramDamage;
        this.isDead = false;
        
        // HP Bar Timer
        this.hpBarTimer = 0;
        this.hitFlashTimer = 0;
        
        // Animation & Effects
        this.suspensionOffset = 0;
        this.dustTimer = 0;
        
        // State
        this.controlled = false;
        this.driver = null; // Player reference
        
        // Assets
        this.sprites = Assets.vehicle[type] || Assets.vehicle.suv;
        
        // Collision Box
        this.hitbox = stats.hitbox;
        
        this.showHint = false;
    }
    
    _getStats(type) {
        switch(type) {
            case 'truck':
                return {
                    width: 64,
                    height: 28,
                    maxSpeed: 6,
                    acceleration: 0.1,
                    turnSpeed: 0.04,
                    hp: 400,
                    ramDamage: 200,
                    hitbox: { width: 56, height: 24 }
                };
            case 'police':
                return {
                    width: 44,
                    height: 24,
                    maxSpeed: 10, // Faster
                    acceleration: 0.25,
                    turnSpeed: 0.07,
                    hp: 200,
                    ramDamage: 100,
                    hitbox: { width: 36, height: 20 }
                };
            case 'suv':
            default:
                return {
                    width: 44,
                    height: 24,
                    maxSpeed: 8,
                    acceleration: 0.2,
                    turnSpeed: 0.06,
                    hp: 200,
                    ramDamage: 100,
                    hitbox: { width: 36, height: 20 }
                };
        }
    }

    update(input, walls, particles, breakableObjects, enemies, player, camera, combatSystem, vehicles, dt = 1) {
        if (this.isDead) return;

        if (this.controlled && input) {
            this._handleInput(input);
            
            // Sync driver position to vehicle for enemy targeting
            if (this.driver) {
                this.driver.x = this.x;
                this.driver.y = this.y;
            }
            this.showHint = false;
        } else {
            // Friction when uncontrolled
            this.speed *= this.friction;
            
            // Check interaction hint
            if (player && !this.isDead) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                this.showHint = dist < 60; // Slightly larger radius for vehicles
            } else {
                this.showHint = false;
            }
        }
        
        // Suspension Animation (Bobbing)
        if (Math.abs(this.speed) > 0.5) {
            this.suspensionOffset = Math.sin(Date.now() / 50) * 1.5; // +/- 1.5px
        } else {
            this.suspensionOffset *= 0.8; // Damping
        }

        // Apply physics
        if (Math.abs(this.speed) > 0.05) { // Lower threshold to allow slow movement start
            // Calculate velocity vector
            const vx = Math.cos(this.angle) * this.speed;
            const vy = Math.sin(this.angle) * this.speed;

            // Wall Collision
            const nextX = this.x + vx;
            const nextY = this.y + vy;
            
            // Check Walls
            let blocked = this._checkCollision(nextX, nextY, walls);

            // Check Vehicles
            if (!blocked && vehicles) {
                blocked = this._checkVehicles(nextX, nextY, vehicles, particles);
            }

            // Check Breakables
            if (!blocked && breakableObjects) {
                blocked = this._checkBreakables(nextX, nextY, breakableObjects, particles, combatSystem);
            }
            
            // Check Enemies
            if (!blocked && enemies) {
                 blocked = this._checkEnemies(nextX, nextY, enemies, particles, combatSystem);
            }
            
            // Check Player (if not driving)
            if (!blocked && player && !this.controlled) {
                blocked = this._checkPlayer(nextX, nextY, player);
            }

            if (!blocked) {
                this.x = nextX;
                this.y = nextY;
            } else {
                // High speed impact logic (Walls/Indestructibles)
                if (Math.abs(this.speed) > 4 && camera) {
                    camera.x += (Math.random() - 0.5) * this.speed * 2;
                    camera.y += (Math.random() - 0.5) * this.speed * 2;
                    this._spawnImpactParticles(particles, this.x + vx*5, this.y + vy*5);
                }
                // Bounce / Stop
                this.speed *= -0.5;
            }
            
            // Breakable Objects Collision (Can destroy them)
            // Already handled in blocking check, but destruction logic is there.
            // If we blocked, we stopped. If we destroyed, we continued (speed reduced).

            // Dust Effects
            if (Math.abs(this.speed) > 2 && particles) {
                this.dustTimer++;
                if (this.dustTimer > 4) {
                    this.dustTimer = 0;
                    this._spawnDust(particles);
                }
            }

            // Turning (only when moving)
            // Reverse steering when going backward for natural feel
            const turnFactor = (this.speed > 0 ? 1 : -1); 
            
            if (this.controlled && input) {
                 if (input.keys.a) {
                     this.angle -= this.turnSpeed * turnFactor;
                     this.steeringAngle = -0.5;
                 } else if (input.keys.d) {
                     this.angle += this.turnSpeed * turnFactor;
                     this.steeringAngle = 0.5;
                 } else {
                     this.steeringAngle = 0;
                 }
            } else {
                this.steeringAngle = 0;
            }
        } else {
            this.speed = 0;
            this.steeringAngle = 0;
        }

        if (this.hpBarTimer > 0) this.hpBarTimer--;
        if (this.hitFlashTimer > 0) this.hitFlashTimer--;

        if (this.hp <= 0 && !this.isDead) {
            this.explode(combatSystem);
        }
    }
    
    _checkVehicles(x, y, vehicles, particles) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        
        // Create OBB for self at proposed position
        const selfPoly = this._getPolygon(x, y, this.angle, hw, hh);

        for (const v of vehicles) {
            if (v === this || v.isDead) continue;
            
            const vhw = v.hitbox.width / 2;
            const vhh = v.hitbox.height / 2;
            
            // Optimization: Circle Check first
            const dx = x - v.x;
            const dy = y - v.y;
            const r = Math.sqrt(hw*hw + hh*hh) + Math.sqrt(vhw*vhw + vhh*vhh);
            if (dx*dx + dy*dy > r*r) continue;

            // OBB Check
            const otherPoly = this._getPolygon(v.x, v.y, v.angle, vhw, vhh);
            
            if (this._polygonIntersect(selfPoly, otherPoly)) {
                // Collision!
                
                // Ramming logic?
                if (Math.abs(this.speed) > 3) {
                     this._spawnImpactParticles(particles, (x + v.x)/2, (y + v.y)/2);
                     
                     // Damage both
                     const dmg = Math.abs(this.speed) * 10;
                     v.takeDamage(dmg);
                     this.takeDamage(dmg/2);
                     
                     // Push other vehicle?
                     v.speed += this.speed * 0.5;
                     v.angle = this.angle; // Spin it?
                }
                
                return true;
            }
        }
        return false;
    }
    
    _checkEnemies(x, y, enemies, particles, combatSystem) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        
        for (const e of enemies) {
            const ehw = (e.width || 24) / 2;
            const ehh = (e.height || 24) / 2;
            const enemyX = e.x - ehw;
            const enemyY = e.y - ehh;
            
            if (this._obbIntersectsAabb(x, y, hw, hh, this.angle, enemyX, enemyY, ehw * 2, ehh * 2)) {
                
                // Ramming logic
                if (Math.abs(this.speed) > 3) {
                    if (e.hp <= this.ramDamage) {
                        // Kill enemy
                        e.takeDamage(this.ramDamage);
                        // Visuals
                        this._spawnImpactParticles(particles, e.x, e.y);
                        if (combatSystem && combatSystem.spawnBloodExplosion) {
                            combatSystem.spawnBloodExplosion(e.x, e.y);
                        }
                        // Slow down slightly
                        this.speed *= 0.9;
                        return false; // Not blocked, ran over
                    } else {
                        // Enemy survives, blocks car
                        e.takeDamage(this.ramDamage);
                        this._spawnImpactParticles(particles, e.x, e.y);
                        if (combatSystem && combatSystem.spawnBloodSplatter) {
                            const impactAngle = Math.atan2(e.y - y, e.x - x);
                            combatSystem.spawnBloodSplatter(e.x, e.y, impactAngle);
                        }
                        return true; // Blocked
                    }
                } else {
                    // Too slow to damage, just blocked
                    return true;
                }
            }
        }
        return false;
    }
    
    _checkPlayer(x, y, player) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        const phw = (player.hitboxWidth || player.width || 24) / 2;
        const phh = (player.hitboxHeight || player.height || 24) / 2;
        const pOffsetY = player.hitboxOffsetY || 0;
        const playerX = player.x - phw;
        const playerY = player.y + pOffsetY - phh;
        
        if (this._obbIntersectsAabb(x, y, hw, hh, this.angle, playerX, playerY, phw * 2, phh * 2)) {
            return true;
        }
        return false;
    }

    _checkBreakables(x, y, breakableObjects, particles, combatSystem) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        
        for (const obj of breakableObjects) {
            if (obj.isBroken) continue;
            
            const hb = obj.getHitbox ? obj.getHitbox() : {
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height
            };
            
            if (this._obbIntersectsAabb(x, y, hw, hh, this.angle, hb.x, hb.y, hb.width, hb.height)) {
                if (Math.abs(this.speed) > 3) {
                    obj.takeDamage(100);
                    if (obj.isBroken) {
                        this.speed *= 0.8;
                        if (combatSystem && combatSystem.spawnDebris) {
                            combatSystem.spawnDebris(hb.x + hb.width / 2, hb.y + hb.height / 2, obj.type);
                        }
                        if (particles) {
                            for (let i = 0; i < 5; i++) {
                                particles.push({
                                    x: hb.x + hb.width / 2,
                                    y: hb.y + hb.height / 2,
                                    vx: (Math.random() - 0.5) * 4,
                                    vy: (Math.random() - 0.5) * 4,
                                    life: 30,
                                    color: '#fff',
                                    size: Math.random() * 3,
                                    type: 'particle'
                                });
                            }
                        }
                        return false;
                    }
                }
                
                this.speed *= -0.5;
                return true;
            }
        }
        return false;
    }
    
    takeDamage(amount) {
        if (this.isDead) return;
        
        this.hp -= amount;
        this.hpBarTimer = 120; // Show HP bar for 2 seconds
        this.hitFlashTimer = 5;
    }
    
    explode(combatSystem) {
        this.isDead = true;
        this.speed = 0;
        
        // Eject driver first (so they can be damaged by explosion)
        this.exit();
        
        if (combatSystem && combatSystem.spawnExplosion) {
            // Damage 80, Radius 100, Knockback 10
            combatSystem.spawnExplosion(this.x, this.y, 80, 100, 10);
        }
    }
    
    _spawnDust(particles) {
        // Spawn at rear wheels
        // Rear wheels are at x = -14 (relative)
        // Need to rotate relative position
        const rx = -14;
        const ry1 = -10;
        const ry2 = 10;
        
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // Wheel 1
        particles.push({
            x: this.x + rx * cos - ry1 * sin,
            y: this.y + rx * sin + ry1 * cos,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5),
            life: 20 + Math.random() * 10,
            color: '#795548', // Brownish dust
            size: Math.random() * 3 + 2,
            type: 'smoke', // Reuse smoke type for fading circle
            alpha: 0.6
        });
        
        // Wheel 2
        particles.push({
            x: this.x + rx * cos - ry2 * sin,
            y: this.y + rx * sin + ry2 * cos,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5),
            life: 20 + Math.random() * 10,
            color: '#795548',
            size: Math.random() * 3 + 2,
            type: 'smoke',
            alpha: 0.6
        });
    }
    
    _spawnImpactParticles(particles, x, y) {
        for(let i=0; i<8; i++) {
            particles.push({
                x: x + (Math.random()-0.5)*10,
                y: y + (Math.random()-0.5)*10,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 30,
                color: '#bdc3c7', // Dust/Sparks
                size: Math.random() * 3 + 1,
                type: 'particle'
            });
        }
    }

    _handleInput(input) {
        // Acceleration
        if (input.keys.w) {
            this.speed += this.acceleration;
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        } else if (input.keys.s) {
            this.speed -= this.acceleration;
            if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;
        } else {
            this.speed *= this.friction;
        }
    }

    _checkCollision(x, y, walls) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        
        // Check against walls
        for (const wall of walls) {
            const wx = wall.x;
            const wy = wall.y;
            const ww = wall.w ?? wall.width;
            const wh = wall.h ?? wall.height;
            
            if (this._obbIntersectsAabb(x, y, hw, hh, this.angle, wx, wy, ww, wh)) {
                return true;
            }
        }
        return false;
    }

    intersectsAabb(aabbX, aabbY, aabbW, aabbH, centerX = this.x, centerY = this.y) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        return this._obbIntersectsAabb(centerX, centerY, hw, hh, this.angle, aabbX, aabbY, aabbW, aabbH);
    }

    containsPoint(px, py, centerX = this.x, centerY = this.y) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        return this._pointInObb(px, py, centerX, centerY, hw, hh, this.angle);
    }

    getHitboxCorners(centerX = this.x, centerY = this.y) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        return [
            { x: centerX + (-hw * cos - -hh * sin), y: centerY + (-hw * sin + -hh * cos) },
            { x: centerX + (hw * cos - -hh * sin), y: centerY + (hw * sin + -hh * cos) },
            { x: centerX + (hw * cos - hh * sin), y: centerY + (hw * sin + hh * cos) },
            { x: centerX + (-hw * cos - hh * sin), y: centerY + (-hw * sin + hh * cos) }
        ];
    }

    _getPolygon(x, y, angle, hw, hh) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        return [
            { x: x + (-hw * cos - -hh * sin), y: y + (-hw * sin + -hh * cos) },
            { x: x + (hw * cos - -hh * sin), y: y + (hw * sin + -hh * cos) },
            { x: x + (hw * cos - hh * sin), y: y + (hw * sin + hh * cos) },
            { x: x + (-hw * cos - hh * sin), y: y + (-hw * sin + hh * cos) }
        ];
    }

    _polygonIntersect(p1, p2) {
        // Separating Axis Theorem (SAT)
        const polygons = [p1, p2];
        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            for (let j = 0; j < polygon.length; j++) {
                const p1 = polygon[j];
                const p2 = polygon[(j + 1) % polygon.length];
                
                const normal = { x: -(p2.y - p1.y), y: p2.x - p1.x };
                // Normalize normal (optional for SAT bool check, but good for stability)
                const len = Math.sqrt(normal.x*normal.x + normal.y*normal.y);
                normal.x /= len; normal.y /= len;
                
                let minA = Infinity, maxA = -Infinity;
                for (const p of polygons[0]) {
                    const projected = normal.x * p.x + normal.y * p.y;
                    if (projected < minA) minA = projected;
                    if (projected > maxA) maxA = projected;
                }
                
                let minB = Infinity, maxB = -Infinity;
                for (const p of polygons[1]) {
                    const projected = normal.x * p.x + normal.y * p.y;
                    if (projected < minB) minB = projected;
                    if (projected > maxB) maxB = projected;
                }
                
                if (maxA < minB || maxB < minA) {
                    return false;
                }
            }
        }
        return true;
    }

    _pointInObb(px, py, cx, cy, hw, hh, angle) {
        const dx = px - cx;
        const dy = py - cy;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
    }

    _obbIntersectsAabb(ocx, ocy, ohw, ohh, angle, ax, ay, aw, ah) {
        const acx = ax + aw / 2;
        const acy = ay + ah / 2;
        const ahw = aw / 2;
        const ahh = ah / 2;
        
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const ux1 = cos;
        const uy1 = sin;
        const ux2 = -sin;
        const uy2 = cos;
        
        const dx = acx - ocx;
        const dy = acy - ocy;
        
        const axes = [
            { x: ux1, y: uy1 },
            { x: ux2, y: uy2 },
            { x: 1, y: 0 },
            { x: 0, y: 1 }
        ];
        
        for (const axis of axes) {
            const proj = Math.abs(dx * axis.x + dy * axis.y);
            const rObb = ohw * Math.abs(ux1 * axis.x + uy1 * axis.y) +
                ohh * Math.abs(ux2 * axis.x + uy2 * axis.y);
            const rAabb = ahw * Math.abs(axis.x) + ahh * Math.abs(axis.y);
            if (proj > rObb + rAabb) return false;
        }
        return true;
    }

    enter(player) {
        this.controlled = true;
        this.driver = player;
        // Hide player or set state
        // The Game/PlayerSystem will handle removing player control
    }

    exit() {
        if (!this.driver) return null;
        
        this.controlled = false;
        const player = this.driver;
        this.driver = null;
        
        // Calculate exit position (Driver side / Left)
        // Left vector relative to car: rotate angle - 90 deg
        const exitDist = 30;
        const exitAngle = this.angle - Math.PI / 2;
        player.x = this.x + Math.cos(exitAngle) * exitDist;
        player.y = this.y + Math.sin(exitAngle) * exitDist;
        
        return player;
    }

    draw(ctx) {
        // Draw Shadow
        ctx.save();
        ctx.translate(this.x + 4, this.y + 4);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();

        ctx.save();
        if (this.hitFlashTimer > 0) {
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
        }

        // 2.5D Layering Logic
        // Layer 1: Wheels (Rotate with steering)
        // Wheels stick to ground, NO suspension offset
        this._drawLayer(ctx, 0, (ctx) => {
            const wx = 14; // wheel x offset
            const wy = 10; // wheel y offset
            
            // Front Wheels (Steerable)
            this._drawWheel(ctx, wx, -wy, this.steeringAngle); // Front Right
            this._drawWheel(ctx, wx, wy, this.steeringAngle);  // Front Left
            
            // Rear Wheels (Fixed)
            this._drawWheel(ctx, -wx, -wy, 0); // Rear Right
            this._drawWheel(ctx, -wx, wy, 0);  // Rear Left
        });

        // Layer 2: Chassis (Base) - Apply half suspension
        this._drawLayer(ctx, 0 + this.suspensionOffset * 0.5, (ctx) => {
             ctx.drawImage(this.sprites.chassis, -this.sprites.chassis.width/2, -this.sprites.chassis.height/2);
        });

        // Layer 3: Body (Offset Up 4px) - Apply full suspension
        this._drawLayer(ctx, -4 + this.suspensionOffset, (ctx) => {
            ctx.drawImage(this.sprites.body, -this.sprites.body.width/2, -this.sprites.body.height/2);
        });

        // Layer 4: Roof (Offset Up 8px) - Apply full suspension
        this._drawLayer(ctx, -8 + this.suspensionOffset, (ctx) => {
            ctx.drawImage(this.sprites.roof, -this.sprites.roof.width/2, -this.sprites.roof.height/2);
        });

        ctx.restore();

        // Interaction Hint
        if (this.showHint) {
            ctx.fillStyle = '#f1c40f'; // Yellow
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] DRIVE', Math.floor(this.x), Math.floor(this.y - 32));
        }

        this.drawHpBar(ctx);
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        
        const barWidth = 32;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 32 + this.suspensionOffset); // Position above vehicle

        // Draw Background
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw Health
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#e74c3c'; // Red
        ctx.fillRect(x + 1, y + 1, Math.floor((barWidth - 2) * hpPercent), barHeight - 2);
    }

    _drawLayer(ctx, yOffset, drawFn) {
        ctx.save();
        // Translate to position + screen offset (Pseudo-3D)
        ctx.translate(this.x, this.y + yOffset);
        ctx.rotate(this.angle);
        drawFn(ctx);
        ctx.restore();
    }

    _drawWheel(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        if (angle) ctx.rotate(angle); 
        ctx.drawImage(this.sprites.wheel, -this.sprites.wheel.width/2, -this.sprites.wheel.height/2);
        ctx.restore();
    }
}
