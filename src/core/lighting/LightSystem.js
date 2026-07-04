import { cloneLightingPreset, DEFAULT_LIGHTING_QUALITY } from './LightingConfig.js';
import { LightEmitterRegistry } from './LightEmitterRegistry.js';
import { ShadowCasterBuilder } from './ShadowCasterBuilder.js';
import { LightBufferRenderer } from './LightBufferRenderer.js';
import { FrameScratchPool } from './FrameScratchPool.js';
import { resolvePlayerLightOccluders, resolveEntityLightOccluders } from './EntityLightOccluderResolver.js';

const QUALITY_ORDER = ['low', 'medium', 'high'];
const SHADOW_MODE_ORDER = ['none', 'walls', 'all'];

function isAliveEnemy(enemy) {
    return enemy && Number.isFinite(enemy.hp) && enemy.hp > 0;
}

function clampShadowMode(mode) {
    return SHADOW_MODE_ORDER.includes(mode) ? mode : 'none';
}

export class LightSystem {
    constructor({
        player,
        handSystem,
        enemies,
        vehicles,
        bullets,
        particles,
        breakableObjects,
        worldSystem,
        costumeSystem,
        blackHoles,
        acidPuddles,
        quality = DEFAULT_LIGHTING_QUALITY
    }) {
        this.player = player;
        this.handSystem = handSystem;
        this.enemies = enemies || [];
        this.vehicles = vehicles || [];
        this.bullets = bullets || [];
        this.particles = particles || [];
        this.breakableObjects = breakableObjects || [];
        this.worldSystem = worldSystem || null;
        this.costumeSystem = costumeSystem || null;
        this.blackHoles = blackHoles || [];
        this.acidPuddles = acidPuddles || [];

        this.quality = quality;
        this.config = cloneLightingPreset(quality);

        this.emitterRegistry = new LightEmitterRegistry();
        this.shadowBuilder = new ShadowCasterBuilder();
        this.bufferRenderer = new LightBufferRenderer(this.config);

        this._frame = 0;
        this._forceStaticRefresh = true;
        this._lastCamera = null;
        this._scratchPool = new FrameScratchPool();
        this._occluderGroupPool = [];
        this._occluderGroupCount = 0;
        this._lightScoreIndexScratch = [];
        this._lightScoreValueScratch = [];
        this._prioritizedDynamicLights = [];
        this._prioritizedStaticLights = [];
        this._mergedLights = [];
        this._mergedCappedLights = [];
        this._sortedVisibleLights = [];

        this.staticLights = [];
        this.dynamicLights = [];
        this.visibleLights = [];

        this.lastRenderMs = 0;
        this._overBudgetFrames = 0;
        this._underBudgetFrames = 0;
        this._shadowModeCounts = { all: 0, walls: 0, none: 0 };
    }

    _toFallbackOccluders(entity) {
        if (!entity) return [];
        const result = [];

        const tryPushRect = (raw) => {
            if (!raw) return;
            const width = raw.width ?? raw.w;
            const height = raw.height ?? raw.h;
            if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y) || !Number.isFinite(width) || !Number.isFinite(height)) return;
            if (width <= 0 || height <= 0) return;
            result.push({
                kind: 'rect',
                x: raw.x,
                y: raw.y,
                width,
                height
            });
        };

        if (typeof entity.getBulletHurtbox === 'function') {
            tryPushRect(entity.getBulletHurtbox());
        } else if (typeof entity.getHitbox === 'function') {
            tryPushRect(entity.getHitbox());
        }

        return result;
    }

    _collectDynamicOccluders() {
        const groups = this._scratchPool.takeArray();
        this._occluderGroupCount = 0;
        const pushGroup = (owner, occluders) => {
            if (!owner || !Array.isArray(occluders) || occluders.length === 0) return;
            const index = this._occluderGroupCount++;
            let group = this._occluderGroupPool[index];
            if (!group) {
                group = { owner: null, occluders: null };
                this._occluderGroupPool[index] = group;
            }
            group.owner = owner;
            group.occluders = occluders;
            groups.push(group);
        };

        pushGroup(this.player, resolvePlayerLightOccluders(this.player, this.costumeSystem));

        for (const enemy of this.enemies) {
            if (!isAliveEnemy(enemy)) continue;
            const occluders = resolveEntityLightOccluders(enemy);
            if (occluders.length > 0) {
                pushGroup(enemy, occluders);
            } else {
                pushGroup(enemy, this._toFallbackOccluders(enemy));
            }
        }

        for (const vehicle of this.vehicles) {
            if (!vehicle || vehicle.isDead) continue;
            const occluders = resolveEntityLightOccluders(vehicle);
            if (occluders.length > 0) {
                pushGroup(vehicle, occluders);
            } else {
                pushGroup(vehicle, this._toFallbackOccluders(vehicle));
            }
        }

        return groups;
    }

    _pushEmitter(list, emitter) {
        if (!emitter) return;
        if (Array.isArray(emitter)) {
            for (const e of emitter) this._pushEmitter(list, e);
            return;
        }
        if (!Number.isFinite(emitter.x) || !Number.isFinite(emitter.y)) return;
        if (!Number.isFinite(emitter.radius) || emitter.radius <= 0) return;
        if (!Number.isFinite(emitter.intensity) || emitter.intensity <= 0) return;
        list.push(emitter);
    }

    _scoreLight(light, focusX, focusY) {
        const dx = light.x - focusX;
        const dy = light.y - focusY;
        const dist = Math.hypot(dx, dy);
        return (light.priority || 0) * 3 + light.radius * 0.22 + light.intensity * 120 - dist * 0.35;
    }

    _prioritizeLights(lights, maxCount, focusX, focusY, out = []) {
        out.length = 0;
        if (!Array.isArray(lights) || lights.length === 0 || maxCount <= 0) return out;

        if (lights.length <= maxCount) {
            for (const light of lights) out.push(light);
            return out;
        }

        const count = lights.length;
        const indices = this._lightScoreIndexScratch;
        const scores = this._lightScoreValueScratch;
        if (indices.length < count) indices.length = count;
        if (scores.length < count) scores.length = count;

        for (let i = 0; i < count; i++) {
            indices[i] = i;
            scores[i] = this._scoreLight(lights[i], focusX, focusY);
        }
        indices.length = count;
        indices.sort((a, b) => scores[b] - scores[a]);

        const limit = Math.min(maxCount, count);
        for (let i = 0; i < limit; i++) {
            out.push(lights[indices[i]]);
        }
        return out;
    }

    _sortLightsByScore(lights, focusX, focusY, out = []) {
        out.length = 0;
        if (!Array.isArray(lights) || lights.length === 0) return out;

        const count = lights.length;
        const indices = this._lightScoreIndexScratch;
        const scores = this._lightScoreValueScratch;
        if (indices.length < count) indices.length = count;
        if (scores.length < count) scores.length = count;

        for (let i = 0; i < count; i++) {
            const score = this._scoreLight(lights[i], focusX, focusY);
            indices[i] = i;
            scores[i] = score;
            lights[i].renderCostScore = score;
        }
        indices.length = count;
        indices.sort((a, b) => scores[b] - scores[a]);

        for (let i = 0; i < count; i++) {
            out.push(lights[indices[i]]);
        }

        return out;
    }

    _cullLightsByViewport(lights, camera, viewportWidth, viewportHeight, out = []) {
        const pad = 96;
        const left = camera.x - pad;
        const top = camera.y - pad;
        const right = camera.x + viewportWidth + pad;
        const bottom = camera.y + viewportHeight + pad;

        out.length = 0;
        for (const light of lights) {
            if (light.x + light.radius < left) continue;
            if (light.x - light.radius > right) continue;
            if (light.y + light.radius < top) continue;
            if (light.y - light.radius > bottom) continue;
            out.push(light);
        }

        return out;
    }

    _rebuildStaticLights(timeMs) {
        this.staticLights.length = 0;

        for (const obj of this.breakableObjects) {
            if (!this.emitterRegistry.hasObjectEmitter(obj?.type)) continue;
            this._pushEmitter(this.staticLights, this.emitterRegistry.getObjectEmitters(obj, timeMs));
        }

        const portals = this.worldSystem?.portals || [];
        for (const portal of portals) {
            this._pushEmitter(this.staticLights, this.emitterRegistry.getPortalEmitters(portal, timeMs));
        }
    }

    _collectDynamicLights(timeMs) {
        this.dynamicLights.length = 0;

        this._pushEmitter(this.dynamicLights, this.emitterRegistry.getMuzzleFlashEmitter(this.handSystem, timeMs, this.player));

        for (const enemy of this.enemies) {
            if (!isAliveEnemy(enemy)) continue;
            if (!enemy.handSystem) continue;
            this._pushEmitter(this.dynamicLights, this.emitterRegistry.getMuzzleFlashEmitter(enemy.handSystem, timeMs, enemy));
        }

        for (const vehicle of this.vehicles) {
            this._pushEmitter(this.dynamicLights, this.emitterRegistry.getVehicleEmitters(vehicle, timeMs));
        }

        for (const bullet of this.bullets) {
            this._pushEmitter(this.dynamicLights, this.emitterRegistry.getBulletEmitter(bullet, timeMs));
        }

        let particleLightCount = 0;
        const maxParticleLights = this.config.maxParticleLights;
        for (const particle of this.particles) {
            if (particleLightCount >= maxParticleLights) break;
            const emitters = this.emitterRegistry.getParticleEmitters(particle, timeMs);
            if (emitters.length === 0) continue;
            for (const emitter of emitters) {
                if (particleLightCount >= maxParticleLights) break;
                this._pushEmitter(this.dynamicLights, emitter);
                particleLightCount++;
            }
        }

        for (const blackHole of this.blackHoles) {
            this._pushEmitter(this.dynamicLights, this.emitterRegistry.getBlackHoleEmitter(blackHole, timeMs));
        }

        for (const puddle of this.acidPuddles) {
            this._pushEmitter(this.dynamicLights, this.emitterRegistry.getAcidPuddleEmitter(puddle, timeMs));
        }
    }

    _qualityRank(quality = this.quality) {
        const index = QUALITY_ORDER.indexOf(quality);
        return index >= 0 ? index : 0;
    }

    _degradeShadowMode(mode) {
        const current = SHADOW_MODE_ORDER.indexOf(clampShadowMode(mode));
        if (current <= 0) return 'none';
        return SHADOW_MODE_ORDER[current - 1];
    }

    _resolveShadowMode(light) {
        let mode = clampShadowMode(light.preferredShadowMode || (light.castsShadows ? 'all' : 'none'));

        if (mode !== 'none' && light.lifetimeClass === 'transient' && this.config.allowShadowedTransientLights !== true) {
            mode = 'none';
        }

        if (mode !== 'none' && light.minQualityForWallsShadow) {
            const currentRank = this._qualityRank(this.quality);
            const requiredRank = this._qualityRank(light.minQualityForWallsShadow);
            if (currentRank < requiredRank) {
                mode = 'none';
            }
        }

        return mode;
    }

    _assignVisibleLights(lights, focusX, focusY, out = []) {
        out.length = 0;

        const sortedLights = this._sortLightsByScore(lights, focusX, focusY, this._sortedVisibleLights);
        const maxAll = Number.isFinite(this.config.maxAllShadowLights) ? this.config.maxAllShadowLights : 0;
        const maxWalls = Number.isFinite(this.config.maxWallShadowLights) ? this.config.maxWallShadowLights : 0;
        const maxCheap = Number.isFinite(this.config.maxCheapLights) ? this.config.maxCheapLights : this.config.maxTotalLights;

        let allCount = 0;
        let wallCount = 0;
        let cheapCount = 0;

        for (const light of sortedLights) {
            let mode = this._resolveShadowMode(light);
            let accepted = false;

            while (!accepted) {
                if (mode === 'all') {
                    if (allCount < maxAll) {
                        allCount++;
                        accepted = true;
                    } else {
                        mode = this._degradeShadowMode(mode);
                    }
                    continue;
                }

                if (mode === 'walls') {
                    if (wallCount < maxWalls) {
                        wallCount++;
                        accepted = true;
                    } else {
                        mode = this._degradeShadowMode(mode);
                    }
                    continue;
                }

                if (mode === 'none') {
                    if (light.preferredShadowMode === 'none' && light.allowCheapRender !== true) break;
                    if (cheapCount >= maxCheap) break;
                    cheapCount++;
                    accepted = true;
                }
            }

            if (!accepted) continue;

            light.shadowMode = mode;
            light.renderTier = mode === 'all' ? 'hero' : (mode === 'walls' ? 'standard' : 'cheap');
            out.push(light);
        }

        this._shadowModeCounts.all = allCount;
        this._shadowModeCounts.walls = wallCount;
        this._shadowModeCounts.none = cheapCount;
        return out;
    }

    _setQuality(nextQuality) {
        if (!nextQuality || nextQuality === this.quality) return;

        this.quality = nextQuality;
        this.config = cloneLightingPreset(nextQuality);
        this.bufferRenderer.updateConfig(this.config);

        this._forceStaticRefresh = true;
        this._overBudgetFrames = 0;
        this._underBudgetFrames = 0;
    }

    _stepQuality(delta) {
        const index = QUALITY_ORDER.indexOf(this.quality);
        if (index < 0) return;
        const nextIndex = Math.max(0, Math.min(QUALITY_ORDER.length - 1, index + delta));
        if (nextIndex === index) return;
        this._setQuality(QUALITY_ORDER[nextIndex]);
    }

    _adaptQuality(renderMs) {
        if (renderMs > this.config.overBudgetMs) {
            this._overBudgetFrames++;
            this._underBudgetFrames = 0;
        } else if (renderMs < this.config.underBudgetMs) {
            this._underBudgetFrames++;
            this._overBudgetFrames = 0;
        } else {
            this._overBudgetFrames = 0;
            this._underBudgetFrames = 0;
        }

        if (this._overBudgetFrames >= this.config.downgradeFrames) {
            this._stepQuality(-1);
            return;
        }

        if (this._underBudgetFrames >= this.config.upgradeFrames) {
            this._stepQuality(1);
        }
    }

    update({ camera, viewportWidth, viewportHeight, now = performance.now() }) {
        this._frame++;
        this._scratchPool.reset();

        const walls = this.worldSystem?.walls || [];
        const shadowObjects = this._scratchPool.takeArray();
        for (const obj of this.breakableObjects) {
            if (!obj || obj.isBroken || obj.blocksLight === false) continue;
            shadowObjects.push(obj);
        }
        const dynamicOccluders = this._collectDynamicOccluders();
        const castersChanged = this.shadowBuilder.rebuildIfNeeded(walls, shadowObjects, dynamicOccluders);
        if (castersChanged) {
            this._forceStaticRefresh = true;
        }

        if (this._forceStaticRefresh || this._frame % this.config.staticUpdateInterval === 0) {
            this._rebuildStaticLights(now);
            this._forceStaticRefresh = false;
        }

        this._collectDynamicLights(now);

        const focusX = this.player.x;
        const focusY = this.player.y;

        const dynamic = this._prioritizeLights(
            this.dynamicLights,
            this.config.maxDynamicLights,
            focusX,
            focusY,
            this._prioritizedDynamicLights
        );

        const staticLights = this._prioritizeLights(
            this.staticLights,
            this.config.maxStaticLights,
            focusX,
            focusY,
            this._prioritizedStaticLights
        );

        const merged = this._mergedLights;
        merged.length = 0;
        for (const light of dynamic) merged.push(light);
        for (const light of staticLights) merged.push(light);

        let visibleSource = merged;
        if (merged.length > this.config.maxTotalLights) {
            visibleSource = this._prioritizeLights(
                merged,
                this.config.maxTotalLights,
                focusX,
                focusY,
                this._mergedCappedLights
            );
        }

        const viewportLights = this._scratchPool.takeArray();
        this._cullLightsByViewport(visibleSource, camera, viewportWidth, viewportHeight, viewportLights);
        this._assignVisibleLights(viewportLights, focusX, focusY, this.visibleLights);

        this._lastCamera = {
            x: camera.x,
            y: camera.y,
            width: viewportWidth,
            height: viewportHeight
        };
    }

    render(ctx, { camera, viewportWidth, viewportHeight, screenScale }) {
        // 地牢楼层主题环境光覆盖（压暗+染色，非地牢为 null 走默认灰度）
        this.bufferRenderer.ambientOverride = this.worldSystem?.dungeonTheme?.ambient || null;
        this.lastRenderMs = this.bufferRenderer.render({
            ctx,
            camera,
            viewportWidth,
            viewportHeight,
            lights: this.visibleLights,
            shadowBuilder: this.shadowBuilder,
            screenScale
        });

        this._adaptQuality(this.lastRenderMs);
        return this.lastRenderMs;
    }

    getStats() {
        return {
            quality: this.quality,
            visibleLights: this.visibleLights.length,
            staticLights: this.staticLights.length,
            dynamicLights: this.dynamicLights.length,
            renderMs: this.lastRenderMs,
            allShadowLights: this._shadowModeCounts.all,
            wallShadowLights: this._shadowModeCounts.walls,
            cheapLights: this._shadowModeCounts.none
        };
    }
}
