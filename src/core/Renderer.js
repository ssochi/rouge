import { Assets } from '../graphics/Assets.js';
import { TILE_SIZE, COLORS } from '../utils/Constants.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';
import { AFFIXES } from './dungeon/EnemyAffixSystem.js';

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

    _isWorldRectVisible(x, y, width, height, pad = 0) {
        const left = this.camera.x - pad;
        const top = this.camera.y - pad;
        const right = this.camera.x + this.canvas.width / this.scale + pad;
        const bottom = this.camera.y + this.canvas.height / this.scale + pad;
        return (
            x < right &&
            x + width > left &&
            y < bottom &&
            y + height > top
        );
    }

    _isEntityVisible(entity, pad = 64) {
        if (!entity) return false;
        const width = entity.width || TILE_SIZE;
        const height = entity.height || TILE_SIZE;
        return this._isWorldRectVisible(
            entity.x - width * 0.5,
            entity.y - height,
            width,
            height,
            pad
        );
    }

    _isBreakableVisible(obj, pad = 64) {
        if (!obj || obj.isBroken) return false;
        const boxes = obj.getHurtboxes
            ? obj.getHurtboxes()
            : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()].filter(Boolean);
        if (boxes.length === 0) {
            return this._isWorldRectVisible(obj.x, obj.y, obj.width || TILE_SIZE, obj.height || TILE_SIZE, pad);
        }
        for (const box of boxes) {
            const width = box.width ?? box.w ?? 0;
            const height = box.height ?? box.h ?? 0;
            if (this._isWorldRectVisible(box.x, box.y, width, height, pad)) {
                return true;
            }
        }
        return false;
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

        if (this.worldSystem && this.worldSystem.floorChunkCache) {
            this.worldSystem.floorChunkCache.draw(
                this.ctx,
                this.camera.x,
                this.camera.y,
                viewportW,
                viewportH
            );
        } else if (this.worldSystem && this.worldSystem.floorCanvas) {
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
             this.worldSystem.carpets.forEach(c => {
                 if (!this._isWorldRectVisible(c.x, c.y, c.width || TILE_SIZE, c.height || TILE_SIZE, 48)) return;
                 c.draw(this.ctx);
             });
        }

        const renderList = [];

        // 地牢楼层主题墙体贴图集（非地牢地图为 null，走平涂路径）
        const dungeonWallSet = (this.worldSystem && this.worldSystem.dungeonTheme && Assets.dungeonWalls)
            ? Assets.dungeonWalls[this.worldSystem.dungeonTheme.id]
            : null;

        this.walls.forEach(w => {
            // 能量屏障占位墙不绘制墙体（屏障视觉由 _drawEnergyBarrier 负责）
            if (w.isGateBarrier) return;
            if (!this._isWorldRectVisible(w.x, w.y - 16, w.w, w.h + 26, 48)) return;
            const useSprite = dungeonWallSet && w.w === TILE_SIZE && w.h === TILE_SIZE;
            renderList.push({
                y: w.y + w.h,
                draw: () => {
                    if (useSprite) {
                        const tx = (w.x / TILE_SIZE) | 0;
                        const ty = (w.y / TILE_SIZE) | 0;
                        const vi = ((tx * 7 + ty * 13) & 0xFFFF) % dungeonWallSet.tops.length;
                        // 顶面覆盖 [y-16, y+16]，前脸覆盖底部 16px
                        this.ctx.drawImage(dungeonWallSet.tops[vi], w.x, w.y - 16);
                        this.ctx.drawImage(dungeonWallSet.fronts[vi], w.x, w.y + 16);
                    } else {
                        this.ctx.fillStyle = COLORS.WALL_FRONT;
                        this.ctx.fillRect(w.x, w.y, w.w, w.h);
                        this.ctx.fillStyle = COLORS.WALL_TOP;
                        this.ctx.fillRect(w.x, w.y - 16, w.w, w.h);
                    }
                    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    this.ctx.fillRect(w.x, w.y + w.h, w.w, 10);
                }
            });
        });

        // [horde:enemies] 延迟 AoE 预警圈（雨幕射手箭雨）：画在地面层（实体之下），
        // 仅在危害最后 warnFrames 帧显示——红圈随倒计时收缩逼近 + 脉冲，落箭前给出躲避窗口。
        if (this.worldSystem && this.worldSystem.groundHazards && this.worldSystem.groundHazards.length > 0) {
            const ctxH = this.ctx;
            for (const h of this.worldSystem.groundHazards) {
                if (h.timer > h.warnFrames) continue; // 抛射滞空段不显示
                if (!this._isWorldRectVisible(h.x - h.radius, h.y - h.radius, h.radius * 2, h.radius * 2, 32)) continue;
                const prog = 1 - h.timer / h.warnFrames; // 0→1 逼近落点
                const pulse = 0.5 + 0.5 * Math.sin(prog * Math.PI * 8);
                ctxH.save();
                // 外圈（收缩指示落点将至）
                ctxH.globalAlpha = 0.4 + prog * 0.45;
                ctxH.strokeStyle = h.color || '#ff5040';
                ctxH.lineWidth = prog > 0.75 ? 2 : 1;
                ctxH.beginPath();
                ctxH.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
                ctxH.stroke();
                // 内圈（随倒计时向落点收拢）
                ctxH.globalAlpha = 0.35 + prog * 0.4;
                ctxH.beginPath();
                ctxH.arc(h.x, h.y, h.radius * (1 - prog * 0.7), 0, Math.PI * 2);
                ctxH.stroke();
                // 底色填充微光（临近落点转亮）
                ctxH.globalAlpha = (0.06 + prog * 0.16) * (0.7 + pulse * 0.3);
                ctxH.fillStyle = h.color || '#ff5040';
                ctxH.beginPath();
                ctxH.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
                ctxH.fill();
                ctxH.restore();
            }
        }

        // Draw dungeon energy barrier gates
        if (this.worldSystem && this.worldSystem.dungeonManager) {
            const dm = this.worldSystem.dungeonManager;

            // 出生魔法阵：出怪点地面符环（画在地面层，实体之下；波1 青白/增援红）
            if (dm.getWaveTelegraphs) {
                const now = performance.now();
                for (const t of dm.getWaveTelegraphs()) {
                    const color = t.color || '#ff5040';
                    const radius = 13 * (1.25 - t.progress * 0.35);
                    const ctx2 = this.ctx;
                    ctx2.save();

                    // 外环
                    ctx2.globalAlpha = 0.35 + t.progress * 0.5;
                    ctx2.strokeStyle = color;
                    ctx2.lineWidth = t.progress > 0.7 ? 2 : 1;
                    ctx2.beginPath();
                    ctx2.arc(t.x, t.y, radius, 0, Math.PI * 2);
                    ctx2.stroke();

                    // 内环（反向脉冲）
                    ctx2.globalAlpha = 0.25 + t.progress * 0.35;
                    ctx2.beginPath();
                    ctx2.arc(t.x, t.y, radius * 0.55, 0, Math.PI * 2);
                    ctx2.stroke();

                    // 旋转符文刻线（四向短线）
                    const spin = now * 0.003;
                    ctx2.globalAlpha = 0.5 + t.progress * 0.4;
                    for (let k = 0; k < 4; k++) {
                        const a = spin + (k / 4) * Math.PI * 2;
                        const r1 = radius * 0.7;
                        const r2 = radius * 1.05;
                        ctx2.beginPath();
                        ctx2.moveTo(t.x + Math.cos(a) * r1, t.y + Math.sin(a) * r1);
                        ctx2.lineTo(t.x + Math.cos(a) * r2, t.y + Math.sin(a) * r2);
                        ctx2.stroke();
                    }

                    // 底色微光
                    ctx2.globalAlpha = 0.08 + t.progress * 0.15;
                    ctx2.fillStyle = color;
                    ctx2.beginPath();
                    ctx2.arc(t.x, t.y, radius, 0, Math.PI * 2);
                    ctx2.fill();
                    ctx2.restore();
                }
            }

            for (const gate of dm.gates) {
                if (gate.alpha <= 0) continue;
                const firstTile = gate.tiles[0];
                if (!firstTile) continue;
                const gateX = firstTile.x * TILE_SIZE;
                const gateY = firstTile.y * TILE_SIZE;
                const isHorizontal = gate.orientation === 'horizontal';
                const gateW = isHorizontal ? gate.tiles.length * TILE_SIZE : TILE_SIZE;
                const gateH = isHorizontal ? TILE_SIZE : gate.tiles.length * TILE_SIZE;
                if (!this._isWorldRectVisible(gateX, gateY, gateW, gateH, 64)) continue;
                // Use the first tile's y for sort order
                const sortY = firstTile.y * TILE_SIZE + TILE_SIZE;
                renderList.push({
                    y: sortY,
                    draw: () => this._drawEnergyBarrier(gate)
                });
            }
        }

        this.breakableObjects.forEach(obj => {
            if (!obj.isBroken && this._isBreakableVisible(obj, 96)) {
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
            if (!this._isEntityVisible(e, 96)) return;
            renderList.push({
                y: e.y + e.height/2,
                draw: () => {
                    // [tension-batch:verbs] 猎杀目标怪：金色光环标记（画在精英光环/本体之下）
                    if (e.isHuntTarget) this._drawHuntTargetMark(e);
                    // 精英词缀视觉：体型放大 + 脚下光环 + 头顶词缀名
                    if (e.isElite && e.eliteScale && e.eliteScale !== 1) {
                        this._drawEliteAura(e);
                        this.ctx.save();
                        this.ctx.translate(e.x, e.y);
                        this.ctx.scale(e.eliteScale, e.eliteScale);
                        this.ctx.translate(-e.x, -e.y);
                        e.draw(this.ctx);
                        this.ctx.restore();
                        this._drawEliteLabel(e);
                    } else {
                        e.draw(this.ctx);
                    }
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
            if (!this._isEntityVisible(v, 128)) return;
            renderList.push({
                y: v.y + v.height/2,
                draw: () => v.draw(this.ctx)
            });
        });

        // Draw Portals
        if (this.worldSystem && this.worldSystem.portals) {
            this.worldSystem.portals.forEach(p => {
                if (!this._isWorldRectVisible(p.x, p.y, p.width || TILE_SIZE * 2, p.height || TILE_SIZE * 2, 64)) return;
                renderList.push({
                    y: p.y + p.height, // Sort by bottom
                    draw: () => p.draw(this.ctx)
                });
            });
        }

        // Draw Dungeon Chests
        if (this.worldSystem && this.worldSystem.chests) {
            this.worldSystem.chests.forEach(chest => {
                if (!this._isWorldRectVisible(chest.x, chest.y - 16, chest.width, chest.height + 16, 32)) return;
                renderList.push({
                    y: chest.y + chest.height, // Sort by bottom
                    draw: () => chest.draw(this.ctx)
                });
            });
        }

        // Draw Shop (merchant + items)
        if (this.worldSystem && this.worldSystem.merchants && this.worldSystem.merchants.length > 0) {
            const coins = this.worldSystem.dungeonRunState ? this.worldSystem.dungeonRunState.coins : 0;
            this.worldSystem.merchants.forEach(m => {
                if (!this._isWorldRectVisible(m.x - 16, m.y - 16, 32, 40, 32)) return;
                renderList.push({
                    y: m.y + 16,
                    draw: () => {
                        const sprite = Assets.dungeonMerchant;
                        this.ctx.fillStyle = 'rgba(0,0,0,0.35)';
                        this.ctx.beginPath();
                        this.ctx.ellipse(m.x, m.y + 15, 11, 4, 0, 0, Math.PI * 2);
                        this.ctx.fill();
                        if (sprite) this.ctx.drawImage(sprite, Math.floor(m.x - 16), Math.floor(m.y - 16));
                    }
                });
            });
            this.worldSystem.shopItems.forEach(item => {
                if (!this._isWorldRectVisible(item.x - 14, item.y - 20, 28, 44, 32)) return;
                renderList.push({
                    y: item.y + 12,
                    draw: () => item.draw(this.ctx, coins)
                });
            });
        }

        // [depth-batch:gamble] Draw Slot Machines（老虎机，Y 轴 Z-Sort 同宝箱）
        if (this.worldSystem && this.worldSystem.slotMachines) {
            this.worldSystem.slotMachines.forEach(m => {
                if (!this._isWorldRectVisible(m.x, m.y - 16, m.width, m.height + 16, 32)) return;
                renderList.push({
                    y: m.y + m.height,
                    draw: () => m.draw(this.ctx)
                });
            });
        }

        // [tension-batch:power] Draw Relic Altars（遗物三选一祭坛，三座横排 + 悬浮图标，Y 轴 Z-Sort）
        if (this.worldSystem && this.worldSystem.relicAltars) {
            this.worldSystem.relicAltars.forEach(altar => {
                if (!this._isWorldRectVisible(altar.x - 90, altar.y - 48, 180, 80, 48)) return;
                renderList.push({
                    y: altar.y + 18, // 底座底部
                    draw: () => altar.draw(this.ctx)
                });
            });
        }

        // Draw Pets
        this.pets.forEach(pet => {
            if (!this._isEntityVisible(pet, 96)) return;
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

                    // 受击无敌帧闪烁：每 8 帧半透明一次（提示玩家当前免伤窗口）
                    if (this.player.invulnTimer > 0 && Math.floor(this.player.invulnTimer / 4) % 2 === 0) {
                        this.ctx.globalAlpha = 0.45;
                    }

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

        // Dungeon pickups (coins / keys). Small items — no Y-sort, viewport-culled.
        if (this.worldSystem && this.worldSystem.pickups) {
            const pickups = this.worldSystem.pickups;
            for (let i = 0; i < pickups.length; i++) {
                const p = pickups[i];
                if (p.collected) continue;
                if (!this._isWorldRectVisible(p.x - 8, p.y - 16, 16, 20, 32)) continue;
                p.draw(this.ctx, this.camera);
            }
        }

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
            } else if (b.ghostRelic) {
                // [depth-batch:relics] 幽灵弹头：蓝色发光弹体（穿墙穿敌）
                this.ctx.save();
                this.ctx.globalAlpha = 0.35;
                this.ctx.fillStyle = '#74d0f0';
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, (b.size || 5) * 2.2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = b.color || '#4db8ff';
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.size || 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#dff6fc';
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, Math.max(1, (b.size || 5) * 0.4), 0, Math.PI * 2);
                this.ctx.fill();
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

        // [depth-batch:relics] 环绕护刃：绕玩家旋转的银色利刃（世界空间，位于子弹层之上）
        if (this.relicSystem && this.relicSystem.has && this.relicSystem.has('orbit_blade') && this.player) {
            const conf = this.relicSystem.orbitBladeConfig();
            const angle = this.relicSystem.orbitBladeAngle();
            const bx = this.player.x + Math.cos(angle) * conf.radius;
            const by = this.player.y + Math.sin(angle) * conf.radius;
            this.ctx.save();
            this.ctx.translate(bx, by);
            this.ctx.rotate(angle + Math.PI / 2);
            // 冷光拖影
            this.ctx.globalAlpha = 0.25;
            this.ctx.fillStyle = '#aee6f7';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
            // 刀身
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fillRect(-2, -10, 4, 14);
            // 刀尖
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.moveTo(-2, -10);
            this.ctx.lineTo(2, -10);
            this.ctx.lineTo(0, -15);
            this.ctx.closePath();
            this.ctx.fill();
            // 护柄
            this.ctx.fillStyle = '#b8860b';
            this.ctx.fillRect(-4, 3, 8, 2);
            this.ctx.restore();
        }

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

        // [tension-batch:verbs] 门口预告漂浮图标（世界内，绘于光照之上——即便相邻房间尚在暗雾中也能预告类型）
        this._drawDoorPreviews(this.ctx);

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

        // [tension-batch:verbs] 玩法动词房倒计时条（生存/猎杀）
        this.drawVerbTimerHud(this.ctx);

        // Dungeon Minimap
        this.drawDungeonMinimap(this.ctx);

        // Profiler Overlay
        if (this.profiler && this.profiler.visible) {
            this.drawProfiler(this.ctx);
        }

        this.uiManager.updatePlayerStatus(this.player);
        this.uiManager.updateWeapon(this.handSystem.currentWeapon, this.handSystem.getWeaponState());
        this.uiManager.updateDungeonStatus();
    }

    /** [tension-batch:verbs] 门口预告漂浮图标：世界内浮于门口，指示相邻房间类型（生存/猎杀/契约/精英/宝藏/商店/Boss）。 */
    _drawDoorPreviews(ctx) {
        const dm = this.worldSystem && this.worldSystem.dungeonManager;
        if (!dm || !dm.getDoorPreviews) return;
        const icons = Assets.doorPreviewIcons;
        if (!icons) return;
        const previews = dm.getDoorPreviews();
        if (!previews || previews.length === 0) return;
        const bob = Math.sin(Date.now() / 320) * 2;
        for (const p of previews) {
            const icon = icons[p.kind];
            if (!icon) continue;
            const drawX = p.x - icon.width / 2;
            const drawY = p.y - 22 + bob;
            if (!this._isWorldRectVisible(drawX, drawY, icon.width, icon.height + 6, 48)) continue;
            ctx.save();
            ctx.drawImage(icon, Math.round(drawX), Math.round(drawY));
            // 指向门口的小三角（把图标"钉"在门上）
            ctx.fillStyle = 'rgba(20,18,28,0.72)';
            ctx.beginPath();
            ctx.moveTo(p.x - 3, drawY + icon.height);
            ctx.lineTo(p.x + 3, drawY + icon.height);
            ctx.lineTo(p.x, drawY + icon.height + 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    /** [tension-batch:verbs] 生存/猎杀倒计时条（顶部居中，复用 Boss 血条视觉语言）。 */
    drawVerbTimerHud(ctx) {
        const dm = this.worldSystem && this.worldSystem.dungeonManager;
        if (!dm || !dm.getVerbTimer) return;
        const t = dm.getVerbTimer();
        if (!t) return;

        const canvasW = this.canvas.width;
        const BAR_W = 260;
        const BAR_H = 12;
        const x = (canvasW - BAR_W) / 2;
        const y = 54; // Boss 条下方，二者并存也不重叠

        const secs = Math.ceil(t.remaining / 60);
        const ratio = Math.max(0, Math.min(1, t.remaining / t.total));
        const isSurvival = t.kind === 'survival';
        const label = isSurvival ? '生存 · 撑住' : '猎杀 · 击杀目标';
        const fill = isSurvival ? '#e0aa4a' : '#e0605a';

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(label, canvasW / 2, y - 5);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x - 2, y - 2, BAR_W + 4, BAR_H + 4);
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, BAR_W * ratio, BAR_H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${secs}s`, canvasW / 2, y + BAR_H - 2);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, BAR_W, BAR_H);
        ctx.restore();
    }

    /** [tension-batch:verbs] 猎杀目标怪金色地面光环 + 头顶靶标（醒目标记）。 */
    _drawHuntTargetMark(e) {
        const ctx = this.ctx;
        const t = Date.now() / 240;
        const pulse = 0.5 + 0.5 * Math.sin(t);
        ctx.save();
        // 脚下金色光环
        ctx.globalAlpha = 0.35 + pulse * 0.35;
        ctx.strokeStyle = '#ffd24a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + e.height / 2 - 2, e.width * 0.7, e.width * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.16 + pulse * 0.14;
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + e.height / 2 - 2, e.width * 0.7, e.width * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    /** 楼层名（结合层号与故事主题）。 */
    _dungeonFloorName(floor) {
        const NAMES = { 1: '监狱层', 2: '圣殿层', 3: '实验室层' };
        return NAMES[floor] || '地牢';
    }

    /** 房间填充色（小地图/大地图共用）。 */
    _roomFillColor(room) {
        if (room.type === 'boss') return room.state === 'cleared' ? 'rgba(130, 88, 92, 0.85)' : 'rgba(188, 74, 84, 0.9)';
        if (room.state === 'active') return 'rgba(226, 183, 68, 0.9)';
        if (room.category === 'treasure') return 'rgba(86, 184, 189, 0.88)';
        if (room.category === 'shop') return 'rgba(203, 172, 66, 0.88)';
        if (room.category === 'elite' && room.state !== 'cleared') return 'rgba(176, 84, 148, 0.9)';
        // [tension-batch:verbs] 玩法动词房底色（未清时突出，便于选路）
        if (room.state !== 'cleared') {
            if (room.category === 'survival') return 'rgba(224, 170, 74, 0.9)';
            if (room.category === 'hunt') return 'rgba(214, 96, 90, 0.9)';
            if (room.category === 'pact') return 'rgba(160, 108, 208, 0.9)';
        }
        if (room.state === 'cleared') return room.type === 'start' ? 'rgba(91, 145, 212, 0.82)' : 'rgba(96, 156, 110, 0.85)';
        return 'rgba(96, 112, 130, 0.85)';
    }

    /** 房间类别键（决定图标），无特殊类别返回 null。 */
    _roomIconKind(room) {
        if (room.type === 'boss') return 'boss';
        if (room.category === 'treasure') return 'treasure';
        if (room.category === 'shop') return 'shop';
        if (room.category === 'elite') return 'elite';
        // [tension-batch:verbs] 玩法动词房图标（生存/猎杀/契约）
        if (room.category === 'survival') return 'survival';
        if (room.category === 'hunt') return 'hunt';
        if (room.category === 'pact') return 'pact';
        return null;
    }

    /**
     * 房型手绘像素微图标：骷髅/宝箱/金币/星，居中于 (cx, cy)，边长 s。
     * s 过小的场景由调用方回退字符。
     */
    _drawRoomIcon(ctx, kind, cx, cy, s) {
        ctx.save();
        ctx.lineWidth = Math.max(1, s * 0.09);
        if (kind === 'boss') {
            // 骷髅：颅骨圆顶 + 下颌 + 黑眼窝 + 鼻
            const r = s * 0.42;
            ctx.fillStyle = '#f2ede4';
            ctx.beginPath(); ctx.arc(cx, cy - s * 0.08, r, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(cx - r * 0.62, cy + s * 0.1, r * 1.24, s * 0.3, r * 0.35); ctx.fill();
            ctx.fillStyle = '#17121c';
            const ey = cy - s * 0.1;
            const ex = r * 0.44;
            ctx.beginPath(); ctx.arc(cx - ex, ey, r * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + ex, ey, r * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx, ey + r * 0.18);
            ctx.lineTo(cx - r * 0.18, ey + r * 0.56);
            ctx.lineTo(cx + r * 0.18, ey + r * 0.56);
            ctx.closePath(); ctx.fill();
        } else if (kind === 'treasure') {
            // 宝箱：木箱身 + 拱盖 + 金箍 + 锁扣
            const hw = s * 0.42;
            ctx.fillStyle = '#7a4f28';
            ctx.beginPath(); ctx.roundRect(cx - hw, cy - s * 0.14, hw * 2, s * 0.42, 1.4); ctx.fill();
            ctx.fillStyle = '#96622f';
            ctx.beginPath(); ctx.roundRect(cx - hw * 1.04, cy - s * 0.36, hw * 2.08, s * 0.26, s * 0.12); ctx.fill();
            ctx.fillStyle = '#e8c14a';
            ctx.fillRect(cx - s * 0.05, cy - s * 0.36, s * 0.1, s * 0.64);
            ctx.beginPath(); ctx.arc(cx, cy - s * 0.02, s * 0.09, 0, Math.PI * 2); ctx.fill();
        } else if (kind === 'shop') {
            // 金币：金盘 + 内圈 + 中心竖槽 + 高光
            ctx.fillStyle = '#e0aa2c';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f6d873';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#a5720f';
            ctx.fillRect(cx - s * 0.06, cy - s * 0.2, s * 0.12, s * 0.4);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.beginPath(); ctx.arc(cx - s * 0.14, cy - s * 0.15, s * 0.08, 0, Math.PI * 2); ctx.fill();
        } else if (kind === 'elite') {
            // 精英：四角星（闪光），紫粉呼应精英底色
            const R = s * 0.5;
            const r = s * 0.16;
            ctx.fillStyle = '#e79cf4';
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const ang = (Math.PI / 4) * i - Math.PI / 2;
                const rad = i % 2 === 0 ? R : r;
                const px = cx + Math.cos(ang) * rad;
                const py = cy + Math.sin(ang) * rad;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.1, 0, Math.PI * 2); ctx.fill();
        } else if (kind === 'survival') {
            // [tension-batch:verbs] 生存：沙漏（琥珀）——上下三角 + 横框 + 落沙
            const hw = s * 0.34;
            ctx.strokeStyle = '#caa03a';
            ctx.beginPath();
            ctx.moveTo(cx - hw, cy - s * 0.42); ctx.lineTo(cx + hw, cy - s * 0.42);
            ctx.moveTo(cx - hw, cy + s * 0.42); ctx.lineTo(cx + hw, cy + s * 0.42);
            ctx.stroke();
            ctx.fillStyle = '#f2c94c';
            ctx.beginPath();
            ctx.moveTo(cx - hw, cy - s * 0.4); ctx.lineTo(cx + hw, cy - s * 0.4); ctx.lineTo(cx, cy);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx, cy); ctx.lineTo(cx - hw, cy + s * 0.4); ctx.lineTo(cx + hw, cy + s * 0.4);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff2b0';
            ctx.fillRect(cx - s * 0.05, cy - s * 0.02, s * 0.1, s * 0.14);
        } else if (kind === 'hunt') {
            // [tension-batch:verbs] 猎杀：靶心（红白同心环）
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f6f2ee';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f6f2ee';
            ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, Math.PI * 2); ctx.fill();
        } else if (kind === 'pact') {
            // [tension-batch:verbs] 契约：手掌（紫）——掌心 + 五指剪影
            ctx.fillStyle = '#b070e0';
            ctx.beginPath(); ctx.roundRect(cx - s * 0.26, cy - s * 0.02, s * 0.52, s * 0.32, s * 0.1); ctx.fill();
            const fingerW = s * 0.11;
            for (let i = 0; i < 4; i++) {
                const fx = cx - s * 0.24 + i * s * 0.16;
                const fh = (i === 1 || i === 2) ? s * 0.42 : s * 0.34;
                ctx.fillRect(fx, cy - s * 0.02 - fh, fingerW, fh);
            }
            // 拇指
            ctx.fillRect(cx - s * 0.34, cy + s * 0.06, s * 0.1, s * 0.14);
            ctx.fillStyle = '#d9a6ff';
            ctx.beginPath(); ctx.arc(cx, cy + s * 0.14, s * 0.08, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    /** 玩家朝向箭头（小地图/大地图共用）。 */
    _drawMapPlayerArrow(ctx, px, py, facing, radius) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(facing);
        ctx.fillStyle = 'rgba(255,255,255,0.98)';
        ctx.strokeStyle = 'rgba(20,24,32,0.9)';
        ctx.lineWidth = Math.max(1, radius * 0.22);
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(-radius, -radius * 0.7);
        ctx.lineTo(-radius * 0.6, 0);
        ctx.lineTo(-radius, radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /** 可见房间 tile 包围盒。 */
    _dungeonMapBounds(rooms) {
        let minTX = Infinity, minTY = Infinity, maxTX = -Infinity, maxTY = -Infinity;
        for (const room of rooms) {
            minTX = Math.min(minTX, room.x);
            minTY = Math.min(minTY, room.y);
            maxTX = Math.max(maxTX, room.x + room.w);
            maxTY = Math.max(maxTY, room.y + room.h);
        }
        return { minTX, minTY, rangeW: Math.max(1, maxTX - minTX), rangeH: Math.max(1, maxTY - minTY) };
    }

    /**
     * 渲染地牢布局（走廊折线 + 房间块 + 图标 + 玩家箭头）到给定视图。
     * @param {Object} view - { ox, oy, scale, minTX, minTY, big }
     */
    _renderDungeonMap(ctx, data, view) {
        const { ox, oy, scale, minTX, minTY, big } = view;
        const toPx = (tx, ty) => ({ x: ox + (tx - minTX) * scale, y: oy + (ty - minTY) * scale });
        const roomById = new Map(data.rooms.map(r => [r.id, r]));

        // 走廊：正交折线（L 形肘线），垫底
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (const edge of data.edges || []) {
            const a = roomById.get(edge.a);
            const b = roomById.get(edge.b);
            if (!a || !b) continue;
            const aVisited = a.visibilityState === 'visited';
            const bVisited = b.visibilityState === 'visited';
            if (!aVisited && !bVisited) continue;

            // 优先真实门位折线；缺失时回退房心-房心正交肘线
            let pts = edge.path;
            if (!pts || pts.length < 2) {
                const c1 = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
                const c2 = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
                pts = [c1, { x: c2.x, y: c1.y }, c2];
            }
            if (aVisited && bVisited) {
                ctx.strokeStyle = 'rgba(130, 170, 200, 0.6)';
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = 'rgba(120, 130, 150, 0.42)';
                ctx.setLineDash(big ? [6, 5] : [3, 3]);
            }
            ctx.lineWidth = big ? Math.max(2, scale * 0.5) : 2;
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) {
                const p = toPx(pts[i].x, pts[i].y);
                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // 房间块
        const minBlock = big ? 12 : 6;
        const iconMin = big ? 16 : 8;
        const radius = big ? 4 : 2;
        for (const room of data.rooms) {
            const p = toPx(room.x, room.y);
            const rw = Math.max(minBlock, room.w * scale - (big ? 3 : 1.5));
            const rh = Math.max(minBlock, room.h * scale - (big ? 3 : 1.5));
            const rx = p.x;
            const ry = p.y;

            if (room.visibilityState === 'frontier') {
                // Boss 房：邻接即揭示身份（暗红底 + 骷髅 + 红色脉冲虚框），
                // 让玩家提前判断、决定是否此刻进门，避免误闯 Boss。
                if (room.type === 'boss') {
                    ctx.fillStyle = 'rgba(150, 60, 68, 0.55)';
                    ctx.beginPath();
                    ctx.roundRect(rx, ry, rw, rh, radius);
                    ctx.fill();
                    const wp = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(Date.now() / 260));
                    ctx.strokeStyle = `rgba(232, 92, 98, ${wp.toFixed(3)})`;
                    ctx.lineWidth = big ? 2 : 1.2;
                    ctx.setLineDash([3, 2]);
                    ctx.beginPath();
                    ctx.roundRect(rx, ry, rw, rh, radius);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    const shortB = Math.min(rw, rh);
                    if (shortB >= iconMin) {
                        this._drawRoomIcon(ctx, 'boss', rx + rw / 2, ry + rh / 2, Math.min(shortB * 0.78, big ? 26 : 13));
                    } else if (rh >= 9) {
                        ctx.fillStyle = 'rgba(255,255,255,0.92)';
                        ctx.font = `bold ${Math.min(10, Math.floor(rh - 2))}px monospace`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('B', rx + rw / 2, ry + rh / 2);
                    }
                    continue;
                }

                ctx.fillStyle = 'rgba(86, 97, 120, 0.28)';
                ctx.beginPath();
                ctx.roundRect(rx, ry, rw, rh, radius);
                ctx.fill();
                ctx.strokeStyle = 'rgba(142, 157, 182, 0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
                // 未探索问号（大地图上更明显）
                if (big && Math.min(rw, rh) >= 18) {
                    ctx.fillStyle = 'rgba(180, 192, 214, 0.55)';
                    ctx.font = `bold ${Math.min(20, rh * 0.55)}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', rx + rw / 2, ry + rh / 2 + 1);
                }
                continue;
            }

            ctx.fillStyle = this._roomFillColor(room);
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, radius);
            ctx.fill();

            ctx.strokeStyle = 'rgba(30, 36, 48, 0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 当前房间：白色呼吸脉冲边框（与锁定橙框区分）
            if (room.id === data.currentRoomId) {
                const bp = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(Date.now() / 480));
                ctx.strokeStyle = `rgba(255, 255, 255, ${bp.toFixed(3)})`;
                ctx.lineWidth = big ? 2.5 : 1.8;
                ctx.beginPath();
                ctx.roundRect(rx - 0.5, ry - 0.5, rw + 1, rh + 1, radius);
                ctx.stroke();
            }

            // 锁定：橙色脉冲外框
            if (room.locked) {
                const lp = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(Date.now() / 220));
                ctx.strokeStyle = `rgba(240, 150, 70, ${lp.toFixed(3)})`;
                ctx.lineWidth = big ? 2 : 1;
                ctx.beginPath();
                ctx.roundRect(rx - 2, ry - 2, rw + 4, rh + 4, radius + 1);
                ctx.stroke();
            }

            const kind = this._roomIconKind(room);
            if (kind) {
                const short = Math.min(rw, rh);
                if (short >= iconMin) {
                    this._drawRoomIcon(ctx, kind, rx + rw / 2, ry + rh / 2, Math.min(short * 0.78, big ? 26 : 13));
                } else if (rh >= 9) {
                    // 回退字符（含玩法动词房：生存/猎杀/契约）
                    const GLYPHS = { boss: 'B', treasure: '+', shop: '$', survival: 'S', hunt: 'H', pact: 'P' };
                    const glyph = GLYPHS[kind] || '!';
                    ctx.fillStyle = 'rgba(255,255,255,0.92)';
                    ctx.font = `bold ${Math.min(10, Math.floor(rh - 2))}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(glyph, rx + rw / 2, ry + rh / 2 + 0.5);
                }
            }
        }

        // 玩家箭头
        const playerP = toPx(data.playerTileX + 0.5, data.playerTileY + 0.5);
        const facing = Number.isFinite(data.playerFacingAngle)
            ? data.playerFacingAngle
            : (this.player.facingRight ? 0 : Math.PI);
        this._drawMapPlayerArrow(ctx, playerP.x, playerP.y, facing, big ? 8 : 4.5);
    }

    drawDungeonMinimap(ctx) {
        const dm = this.worldSystem && this.worldSystem.dungeonManager;
        if (!dm) return;

        const data = dm.getMinimapData(this.player, this.handSystem?.angle);
        if (!data.rooms.length) return;

        const MINIMAP_SIZE = 168;
        const PANEL_PADDING = 10;
        const INNER_PADDING = 14;
        const INFO_BAR_H = 14;
        const canvasW = this.canvas.width;
        const mx = canvasW - MINIMAP_SIZE - PANEL_PADDING;
        const my = PANEL_PADDING;

        ctx.save();

        // 圆角面板
        ctx.fillStyle = 'rgba(10, 12, 18, 0.82)';
        ctx.beginPath();
        ctx.roundRect(mx - 4, my - 4, MINIMAP_SIZE + 8, MINIMAP_SIZE + 8, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150, 165, 190, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 布局：预留底部信息条，等比缩放
        const { minTX, minTY, rangeW, rangeH } = this._dungeonMapBounds(data.rooms);
        const usableW = MINIMAP_SIZE - INNER_PADDING * 2;
        const usableH = MINIMAP_SIZE - INNER_PADDING * 2 - INFO_BAR_H;
        const scale = Math.min(usableW / rangeW, usableH / rangeH, 3.2);
        const ox = mx + (MINIMAP_SIZE - rangeW * scale) / 2;
        const oy = my + INNER_PADDING + (usableH - rangeH * scale) / 2;

        // 裁剪到面板内，避免走廊/箭头溢出
        ctx.save();
        ctx.beginPath();
        ctx.rect(mx - 2, my - 2, MINIMAP_SIZE + 4, MINIMAP_SIZE + 4 - INFO_BAR_H);
        ctx.clip();
        this._renderDungeonMap(ctx, data, { ox, oy, scale, minTX, minTY, big: false });
        ctx.restore();

        // 底部信息条：楼层名 + 探索度
        const barY = my + MINIMAP_SIZE - INFO_BAR_H + 1;
        ctx.strokeStyle = 'rgba(150, 165, 190, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx + 2, barY);
        ctx.lineTo(mx + MINIMAP_SIZE - 2, barY);
        ctx.stroke();

        const floorName = this._dungeonFloorName(data.floor);
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(214, 224, 242, 0.9)';
        ctx.textAlign = 'left';
        ctx.fillText(`F${data.floor || 1} ${floorName}`, mx + 4, barY + INFO_BAR_H / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(150, 200, 168, 0.95)';
        ctx.fillText(`${data.visitedCount}/${data.totalRooms}`, mx + MINIMAP_SIZE - 4, barY + INFO_BAR_H / 2);

        ctx.restore();

        // 全屏大地图覆盖层
        if (this.input && this.input.bigMapOpen) {
            this._drawDungeonBigMap(ctx, data);
        }
    }

    /** 全屏大地图覆盖层（Tab / 移动端点小地图开关；游戏不暂停）。 */
    _drawDungeonBigMap(ctx, data) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.save();
        // 半透明暗底
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, cw, ch);

        // 标题
        const floorName = this._dungeonFloorName(data.floor);
        const seed = this.worldSystem && Number.isFinite(this.worldSystem.debugDungeonSeed)
            ? this.worldSystem.debugDungeonSeed : null;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(236, 242, 255, 0.96)';
        ctx.font = 'bold 26px monospace';
        ctx.fillText(`第 ${data.floor || 1} 层 · ${floorName}`, cw / 2, 26);
        ctx.font = '13px monospace';
        ctx.fillStyle = 'rgba(160, 200, 176, 0.92)';
        const sub = `探索度 ${data.visitedCount}/${data.totalRooms}` + (seed !== null ? `    种子 ${seed}` : '');
        ctx.fillText(sub, cw / 2, 56);

        // 关闭提示（标题区内，避开底部快捷栏）
        const isTouch = typeof navigator !== 'undefined'
            && (((navigator.maxTouchPoints || 0) > 0) || ('ontouchstart' in window));
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(200, 210, 228, 0.7)';
        ctx.fillText(isTouch ? '点击任意处关闭' : 'Tab 关闭地图', cw / 2, 76);

        // 地图绘制区（预留标题/图例边距）
        const marginTop = 100;
        const marginBottom = 44;
        const marginX = 70;
        const areaW = cw - marginX * 2;
        const areaH = ch - marginTop - marginBottom;
        const { minTX, minTY, rangeW, rangeH } = this._dungeonMapBounds(data.rooms);
        const scale = Math.min(areaW / rangeW, areaH / rangeH, 16);
        const ox = marginX + (areaW - rangeW * scale) / 2;
        const oy = marginTop + (areaH - rangeH * scale) / 2;

        this._renderDungeonMap(ctx, data, { ox, oy, scale, minTX, minTY, big: true });

        // 图例
        this._drawBigMapLegend(ctx, ch);

        ctx.restore();
    }

    /** 大地图图例：色块 + 图标 + 文字（锚定左下）。 */
    _drawBigMapLegend(ctx, ch) {
        const items = [
            { kind: 'boss', color: 'rgba(188, 74, 84, 0.9)', label: 'Boss' },
            { kind: 'treasure', color: 'rgba(86, 184, 189, 0.88)', label: '宝藏' },
            { kind: 'shop', color: 'rgba(203, 172, 66, 0.88)', label: '商店' },
            { kind: 'elite', color: 'rgba(176, 84, 148, 0.9)', label: '精英' },
            // [tension-batch:verbs] 玩法动词房图例
            { kind: 'survival', color: 'rgba(224, 170, 74, 0.9)', label: '生存' },
            { kind: 'hunt', color: 'rgba(214, 96, 90, 0.9)', label: '猎杀' },
            { kind: 'pact', color: 'rgba(160, 108, 208, 0.9)', label: '契约' },
            { kind: null, color: 'rgba(86, 97, 120, 0.5)', label: '未探索' }
        ];
        const sw = 16;
        const rowH = 22;
        const x0 = 24;
        let y = ch - 40 - (items.length - 1) * rowH;

        ctx.textBaseline = 'middle';
        for (const it of items) {
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.roundRect(x0, y - sw / 2, sw, sw, 3);
            ctx.fill();
            ctx.strokeStyle = 'rgba(30,36,48,0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();
            if (it.kind) {
                this._drawRoomIcon(ctx, it.kind, x0 + sw / 2, y, sw * 0.82);
            } else {
                ctx.fillStyle = 'rgba(180, 192, 214, 0.8)';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('?', x0 + sw / 2, y + 0.5);
            }
            ctx.fillStyle = 'rgba(224, 232, 246, 0.9)';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(it.label, x0 + sw + 8, y + 0.5);
            y += rowH;
        }
    }

    /** 精英光环：脚下椭圆描边（首词缀色）+ 微光填充。 */
    _drawEliteAura(e) {
        const affixId = e.affixIds && e.affixIds[0];
        const color = (AFFIXES[affixId] && AFFIXES[affixId].color) || '#ffd54f';
        const pulse = 0.55 + 0.25 * Math.sin(performance.now() * 0.005);
        this.ctx.save();
        this.ctx.globalAlpha = 0.2 * pulse;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(e.x, e.y + 13, 13, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 0.75 * pulse;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(e.x, e.y + 13, 13, 5, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    /** 头顶词缀名（多词缀以 · 连接）+ 坚韧护盾条。 */
    _drawEliteLabel(e) {
        if (!e.affixIds || e.affixIds.length === 0) return;
        const label = e.affixIds.map(id => (AFFIXES[id] ? AFFIXES[id].name : id)).join('·');
        const color = (AFFIXES[e.affixIds[0]] && AFFIXES[e.affixIds[0]].color) || '#ffd54f';
        this.ctx.save();
        this.ctx.font = 'bold 7px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
        this.ctx.fillText(label, Math.floor(e.x) + 1, Math.floor(e.y) - 28);
        this.ctx.fillStyle = color;
        this.ctx.fillText(label, Math.floor(e.x), Math.floor(e.y) - 29);

        // 坚韧护盾条（血条上方细黄条）
        if (Number.isFinite(e.affixShieldMax) && e.affixShieldMax > 0 && e.affixShield > 0) {
            const w = 24;
            const x = Math.floor(e.x - w / 2);
            const y = Math.floor(e.y) - 27;
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(x, y, w, 2);
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillRect(x, y, w * (e.affixShield / e.affixShieldMax), 2);
        }
        this.ctx.restore();
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
        const isWide = bw >= bh;
        const theme = this.worldSystem && this.worldSystem.dungeonTheme;
        const stone = theme ? theme.wall : { top: '#6a7288', highlight: '#828aa0', frontMortar: '#3d4254' };

        // 能量色：冷青蓝（与火光暖色形成冷暖对比）
        const C_CORE = '#7df4ff';
        const C_MID = '#38bdf8';
        const C_DIM = '#1f6fae';

        ctx.save();
        ctx.translate(minX, minY);

        if (isWide) {
            // ── 横向门：地面能量槽 + 一排呼吸光栅柱 ──
            const baseY = bh - 5;
            ctx.globalAlpha = alpha * 0.35;
            ctx.fillStyle = C_DIM;
            ctx.fillRect(1, 2, bw - 2, bh - 4); // 半透光幕底
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = C_MID;
            ctx.fillRect(2, baseY, bw - 4, 3);
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = C_DIM;
            ctx.fillRect(2, baseY + 3, bw - 4, 1);

            for (let x = 5; x < bw - 6; x += 10) {
                const phase = Math.sin(t * 0.06 + x * 0.45);
                const h = Math.max(10, (bh - 10) * (0.72 + 0.28 * phase));
                const topY = baseY - h;
                ctx.globalAlpha = alpha * 0.65;
                ctx.fillStyle = C_MID;
                ctx.fillRect(x, topY + 4, 3, h - 4);
                ctx.globalAlpha = alpha * 0.95;
                ctx.fillStyle = C_CORE;
                ctx.fillRect(x, topY, 3, 4);
            }

            // 上升微粒
            ctx.fillStyle = C_CORE;
            for (let i = 0; i < 3; i++) {
                const px = ((i * 37 + 11) % Math.max(1, bw - 8)) + 4;
                const py = baseY - ((t * 0.6 + i * (bh / 3)) % Math.max(1, bh - 8));
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
            }

            this._drawGatePylon(ctx, -4, bh - 21, stone, alpha);
            this._drawGatePylon(ctx, bw - 4, bh - 21, stone, alpha);
        } else {
            // ── 竖向门：中央能量脊 + 沿 y 的呼吸横光条 ──
            const baseX = Math.floor(bw / 2);
            ctx.globalAlpha = alpha * 0.35;
            ctx.fillStyle = C_DIM;
            ctx.fillRect(baseX - 6, 1, 12, bh - 2); // 半透光幕底
            ctx.globalAlpha = alpha * 0.55;
            ctx.fillStyle = C_DIM;
            ctx.fillRect(baseX - 3, 2, 6, bh - 4);
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = C_MID;
            ctx.fillRect(baseX - 1, 2, 3, bh - 4);

            for (let y = 5; y < bh - 5; y += 10) {
                const phase = Math.sin(t * 0.06 + y * 0.45);
                const w = Math.max(10, (bw - 8) * (0.7 + 0.3 * phase));
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = C_MID;
                ctx.fillRect(Math.floor(baseX - w / 2), y, Math.floor(w), 3);
                ctx.globalAlpha = alpha * 0.95;
                ctx.fillStyle = C_CORE;
                ctx.fillRect(baseX - 1, y, 3, 3);
            }

            ctx.fillStyle = C_CORE;
            for (let i = 0; i < 3; i++) {
                const py = ((i * 37 + 11) % Math.max(1, bh - 8)) + 4;
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillRect(baseX + (i % 2 === 0 ? -4 : 3), Math.floor(py + Math.sin(t * 0.08 + i) * 3), 1, 1);
            }

            this._drawGatePylon(ctx, baseX - 4, -12, stone, alpha);
            this._drawGatePylon(ctx, baseX - 4, bh - 12, stone, alpha);
        }

        ctx.restore();
    }

    /** 门端石墩：小石柱 + 顶端能量宝石（给能量门以实体锚点）。 */
    _drawGatePylon(ctx, x, y, stone, alpha) {
        ctx.globalAlpha = Math.min(1, alpha * 1.3);
        ctx.fillStyle = stone.frontMortar;
        ctx.fillRect(x - 1, y + 16, 10, 5);
        ctx.fillStyle = stone.top;
        ctx.fillRect(x, y, 8, 17);
        ctx.fillStyle = stone.highlight;
        ctx.fillRect(x, y, 8, 2);
        ctx.fillRect(x, y, 2, 17);
        ctx.fillStyle = stone.frontMortar;
        ctx.fillRect(x + 6, y + 2, 2, 15);
        // 顶端能量宝石（大颗 + 白核）
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 2, y - 4, 4, 4);
        ctx.fillStyle = '#e0fbff';
        ctx.fillRect(x + 3, y - 3, 2, 2);
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
