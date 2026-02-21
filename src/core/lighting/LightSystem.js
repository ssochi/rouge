import { cloneLightingPreset, DEFAULT_LIGHTING_QUALITY } from './LightingConfig.js';
import { LightEmitterRegistry } from './LightEmitterRegistry.js';
import { ShadowCasterBuilder } from './ShadowCasterBuilder.js';
import { LightBufferRenderer } from './LightBufferRenderer.js';

const QUALITY_ORDER = ['low', 'medium', 'high'];

function isAliveEnemy(enemy) {
    return enemy && Number.isFinite(enemy.hp) && enemy.hp > 0;
}

export class LightSystem {
    constructor({
        player,
        handSystem,
        enemies,
        bullets,
        particles,
        breakableObjects,
        worldSystem,
        blackHoles,
        acidPuddles,
        quality = DEFAULT_LIGHTING_QUALITY
    }) {
        this.player = player;
        this.handSystem = handSystem;
        this.enemies = enemies || [];
        this.bullets = bullets || [];
        this.particles = particles || [];
        this.breakableObjects = breakableObjects || [];
        this.worldSystem = worldSystem || null;
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

        this.staticLights = [];
        this.dynamicLights = [];
        this.visibleLights = [];

        this.lastRenderMs = 0;
        this._overBudgetFrames = 0;
        this._underBudgetFrames = 0;
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

    _prioritizeLights(lights, maxCount, focusX, focusY) {
        if (!Array.isArray(lights) || lights.length <= maxCount) return lights.slice();

        return lights
            .map(light => ({
                light,
                score: this._scoreLight(light, focusX, focusY)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, maxCount)
            .map(item => item.light);
    }

    _cullLightsByViewport(lights, camera, viewportWidth, viewportHeight) {
        const pad = 96;
        const left = camera.x - pad;
        const top = camera.y - pad;
        const right = camera.x + viewportWidth + pad;
        const bottom = camera.y + viewportHeight + pad;

        const visible = [];
        for (const light of lights) {
            if (light.x + light.radius < left) continue;
            if (light.x - light.radius > right) continue;
            if (light.y + light.radius < top) continue;
            if (light.y - light.radius > bottom) continue;
            visible.push(light);
        }

        return visible;
    }

    _rebuildStaticLights(timeMs) {
        this.staticLights.length = 0;

        for (const obj of this.breakableObjects) {
            this._pushEmitter(this.staticLights, this.emitterRegistry.getObjectEmitters(obj, timeMs));
        }

        const portals = this.worldSystem?.portals || [];
        for (const portal of portals) {
            this._pushEmitter(this.staticLights, this.emitterRegistry.getPortalEmitters(portal, timeMs));
        }
    }

    _collectDynamicLights(timeMs) {
        this.dynamicLights.length = 0;

        // Player personal light — dim ambient glow.
        this._pushEmitter(this.dynamicLights, {
            x: this.player.x,
            y: this.player.y + 8,
            radius: 69,
            color: '#ffe8c1',
            intensity: 0.5,
            castsShadows: true,
            priority: 50,
            owner: this.player,
            ignoreSelfShadow: true,
            kind: 'player'
        });

        // Player flashlight — cone light following aim direction.
        const aimAngle = this.handSystem?.angle ?? 0;
        this._pushEmitter(this.dynamicLights, {
            x: this.player.x,
            y: this.player.y + 4,
            radius: 400,
            color: '#ffe8c1',
            intensity: 1.0,
            castsShadows: true,
            priority: 95,
            owner: this.player,
            ignoreSelfShadow: true,
            kind: 'flashlight',
            coneAngle: Math.PI / 6,
            coneDirection: aimAngle
        });

        this._pushEmitter(this.dynamicLights, this.emitterRegistry.getMuzzleFlashEmitter(this.handSystem, timeMs, this.player));

        for (const enemy of this.enemies) {
            if (!isAliveEnemy(enemy)) continue;
            if (!enemy.handSystem) continue;
            this._pushEmitter(this.dynamicLights, this.emitterRegistry.getMuzzleFlashEmitter(enemy.handSystem, timeMs, enemy));
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
            for (const e of emitters) {
                if (particleLightCount >= maxParticleLights) break;
                this._pushEmitter(this.dynamicLights, e);
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

        const walls = this.worldSystem?.walls || [];
        const wallObjects = this.breakableObjects.filter(obj =>
            obj && !obj.isBroken && (obj.type === 'wall' || obj.type === 'door_h' || obj.type === 'door_v')
        );
        const castersChanged = this.shadowBuilder.rebuildIfNeeded(walls, wallObjects);
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
            focusY
        );

        const staticLights = this._prioritizeLights(
            this.staticLights,
            this.config.maxStaticLights,
            focusX,
            focusY
        );

        let merged = dynamic.concat(staticLights);
        if (merged.length > this.config.maxTotalLights) {
            merged = this._prioritizeLights(
                merged,
                this.config.maxTotalLights,
                focusX,
                focusY
            );
        }

        this.visibleLights = this._cullLightsByViewport(merged, camera, viewportWidth, viewportHeight);
        this._lastCamera = {
            x: camera.x,
            y: camera.y,
            width: viewportWidth,
            height: viewportHeight
        };
    }

    render(ctx, { camera, viewportWidth, viewportHeight }) {
        this.lastRenderMs = this.bufferRenderer.render({
            ctx,
            camera,
            viewportWidth,
            viewportHeight,
            lights: this.visibleLights,
            shadowBuilder: this.shadowBuilder
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
            renderMs: this.lastRenderMs
        };
    }
}
