import { clampRadius } from './LightingConfig.js';

const OBJECT_LIGHTS = {
    floor_lamp: {
        offsetX: 16,
        offsetY: 6,
        radius: 138,
        color: '#ffd9a3',
        intensity: 1.0,
        flicker: 0.04,
        castsShadows: true,
        priority: 90,
        ignoreSelfShadow: true
    },
    fish_tank: {
        offsetX: 16,
        offsetY: -2,
        radius: 94,
        color: '#7de8ff',
        intensity: 0.72,
        flicker: 0.02,
        castsShadows: true,
        priority: 70,
        ignoreSelfShadow: true
    },
    explosive_barrel: {
        offsetX: 16,
        offsetY: 11,
        radius: 54,
        color: '#ff6b5a',
        intensity: 0.52,
        flicker: 0.05,
        castsShadows: true,
        priority: 55,
        ignoreSelfShadow: true
    },
    stove: {
        offsetX: 16,
        offsetY: 16,
        radius: 44,
        color: '#ffb46e',
        intensity: 0.36,
        flicker: 0.02,
        castsShadows: true,
        priority: 40,
        ignoreSelfShadow: true
    }
};

const BULLET_LIGHTS = {
    rocket: { radius: 82, color: '#ff9f43', intensity: 0.95, castsShadows: false, priority: 95 },
    grenade: { radius: 46, color: '#c8d6e5', intensity: 0.35, castsShadows: false, priority: 28 },
    flame: { radius: 72, color: '#ffb347', intensity: 0.8, castsShadows: false, priority: 98 },
    black_hole_projectile: { radius: 66, color: '#a66bff', intensity: 0.76, castsShadows: false, priority: 94 },
    teleport: { radius: 70, color: '#71c7ff', intensity: 0.78, castsShadows: false, priority: 92 },
    lightning: { radius: 68, color: '#fff27a', intensity: 0.84, castsShadows: false, priority: 98 },
    ice_shard: { radius: 54, color: '#b8e9ff', intensity: 0.55, castsShadows: false, priority: 60 },
    ricochet: { radius: 58, color: '#7eff96', intensity: 0.62, castsShadows: false, priority: 66 },
    boomerang: { radius: 34, color: '#f0cd8c', intensity: 0.3, castsShadows: false, priority: 18 },
    plasma: { radius: 64, color: '#59ffd0', intensity: 0.78, castsShadows: false, priority: 90 },
    homing: { radius: 62, color: '#ff8a80', intensity: 0.74, castsShadows: false, priority: 86 },
    acid: { radius: 62, color: '#9dff5f', intensity: 0.74, castsShadows: false, priority: 86 },
    cluster: { radius: 56, color: '#ffbd59', intensity: 0.68, castsShadows: false, priority: 80 },
    force: { radius: 52, color: '#90cfff', intensity: 0.62, castsShadows: false, priority: 72 },
    vampyre: { radius: 58, color: '#ff6e6e', intensity: 0.7, castsShadows: false, priority: 84 },
    needle: { radius: 34, color: '#dde6ee', intensity: 0.26, castsShadows: false, priority: 12 },
    railgun: { radius: 70, color: '#67f0ff', intensity: 0.88, castsShadows: false, priority: 96 },
    standard: { radius: 36, color: '#ffe082', intensity: 0.22, castsShadows: false, priority: 10 },
    bolt: { radius: 40, color: '#cfd8dc', intensity: 0.28, castsShadows: false, priority: 14 }
};

function withFlicker(baseIntensity, flicker = 0, timeMs = 0, seed = 0) {
    if (!flicker) return baseIntensity;
    const phase = timeMs * 0.008 + seed * 12.9898;
    const wave = Math.sin(phase) * 0.5 + Math.sin(phase * 0.7 + 0.8) * 0.5;
    return Math.max(0, baseIntensity + wave * flicker);
}

function createEmitter({
    x,
    y,
    radius,
    color,
    intensity,
    castsShadows,
    flicker = 0,
    owner = null,
    ignoreSelfShadow = false,
    priority = 0,
    kind = 'generic',
    seed = 0,
    coneAngle = 0,
    coneDirection = 0
}, timeMs = 0) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    const emitter = {
        x,
        y,
        radius: clampRadius(radius),
        color: color || '#ffffff',
        intensity: Math.max(0, Math.min(2.0, withFlicker(intensity ?? 0.5, flicker, timeMs, seed))),
        castsShadows: castsShadows !== false,
        owner,
        ignoreSelfShadow: ignoreSelfShadow === true,
        priority,
        kind
    };

    if (coneAngle > 0) {
        emitter.coneAngle = coneAngle;
        emitter.coneDirection = coneDirection;
    }

    return emitter;
}

export class LightEmitterRegistry {
    getObjectEmitters(obj, timeMs = 0) {
        if (!obj || obj.isBroken) return [];

        const def = OBJECT_LIGHTS[obj.type];
        if (!def) return [];

        const emitter = createEmitter({
            x: obj.x + def.offsetX,
            y: obj.y + def.offsetY,
            radius: def.radius,
            color: def.color,
            intensity: def.intensity,
            castsShadows: def.castsShadows,
            flicker: def.flicker,
            owner: obj,
            ignoreSelfShadow: def.ignoreSelfShadow,
            priority: def.priority,
            kind: 'object',
            seed: (obj.x * 13.37 + obj.y * 3.17) * 0.01
        }, timeMs);

        return emitter ? [emitter] : [];
    }

    getPortalEmitters(portal, timeMs = 0) {
        if (!portal) return [];
        const cx = portal.x + portal.width / 2;
        const cy = portal.y + portal.height / 2;

        const core = createEmitter({
            x: cx,
            y: cy,
            radius: 104,
            color: portal.color || '#7eb8ff',
            intensity: 0.78,
            flicker: 0.05,
            castsShadows: true,
            priority: 86,
            kind: 'portal',
            seed: 0.31 + cx * 0.001
        }, timeMs);

        const rim = createEmitter({
            x: cx,
            y: cy + 6,
            radius: 64,
            color: '#d8f3ff',
            intensity: 0.35,
            flicker: 0.03,
            castsShadows: true,
            priority: 72,
            kind: 'portal'
        }, timeMs);

        return [core, rim].filter(Boolean);
    }

    getBlackHoleEmitter(blackHole, timeMs = 0) {
        if (!blackHole) return null;
        const lifeRatio = blackHole.maxLife > 0 ? blackHole.life / blackHole.maxLife : 1;
        return createEmitter({
            x: blackHole.x,
            y: blackHole.y,
            radius: Math.max(56, blackHole.radius * 0.8),
            color: '#b287ff',
            intensity: 0.7 * lifeRatio,
            flicker: 0.06,
            castsShadows: false,
            priority: 88,
            kind: 'black_hole'
        }, timeMs);
    }

    getAcidPuddleEmitter(puddle, timeMs = 0) {
        if (!puddle) return null;
        const lifeRatio = puddle.maxLife > 0 ? puddle.life / puddle.maxLife : 1;
        return createEmitter({
            x: puddle.x,
            y: puddle.y,
            radius: Math.max(38, puddle.radius * 1.4),
            color: '#98ff78',
            intensity: 0.52 * lifeRatio,
            flicker: 0.04,
            castsShadows: false,
            priority: 65,
            kind: 'puddle'
        }, timeMs);
    }

    getMuzzleFlashEmitter(handSystem, timeMs = 0, owner = null) {
        if (!handSystem || !handSystem.showFlash) return null;

        const muzzle = handSystem.getMuzzleWorldPosition(timeMs);
        if (!muzzle) return null;

        const weapon = handSystem.currentWeapon || null;
        const bulletType = weapon?.bulletType || 'standard';
        const bulletProfile = BULLET_LIGHTS[bulletType] || BULLET_LIGHTS.standard;

        return createEmitter({
            x: muzzle.x,
            y: muzzle.y,
            radius: Math.max(42, (bulletProfile.radius || 44) * 0.6),
            color: '#ffd79e',
            intensity: 0.95,
            flicker: 0.12,
            castsShadows: true,
            priority: 100,
            owner,
            kind: 'muzzle'
        }, timeMs);
    }

    getBulletEmitter(bullet, timeMs = 0) {
        if (!bullet || !Number.isFinite(bullet.x) || !Number.isFinite(bullet.y)) return null;

        const profile = BULLET_LIGHTS[bullet.type] || null;
        if (!profile) return null;

        const speed = Math.hypot(bullet.vx || 0, bullet.vy || 0);
        const speedBoost = Math.min(1.25, 0.7 + speed / 18);
        const lifeRatio = bullet.maxLife > 0 ? Math.max(0.2, bullet.life / bullet.maxLife) : 1;

        return createEmitter({
            x: bullet.x,
            y: bullet.y,
            radius: (profile.radius || 40) * speedBoost,
            color: bullet.color || profile.color,
            intensity: (profile.intensity || 0.4) * lifeRatio,
            castsShadows: profile.castsShadows,
            priority: profile.priority || 0,
            kind: 'bullet'
        }, timeMs);
    }

    getParticleEmitters(particle, timeMs = 0) {
        if (!particle) return [];

        if (particle.type === 'flash') {
            const e = createEmitter({
                x: particle.x,
                y: particle.y,
                radius: (particle.size || 12) * 5,
                color: particle.color || '#fff4c9',
                intensity: Math.max(0.35, particle.alpha || 0.6),
                castsShadows: false,
                priority: 92,
                kind: 'particle'
            }, timeMs);
            return e ? [e] : [];
        }

        if (particle.type === 'fire') {
            const e = createEmitter({
                x: particle.x,
                y: particle.y,
                radius: (particle.size || 6) * 4,
                color: particle.color || '#ffad66',
                intensity: 0.48,
                flicker: 0.08,
                castsShadows: false,
                priority: 52,
                kind: 'particle'
            }, timeMs);
            return e ? [e] : [];
        }

        if (particle.type === 'laser_beam') {
            const mx = (particle.x1 + particle.x2) * 0.5;
            const my = (particle.y1 + particle.y2) * 0.5;
            const mid = createEmitter({
                x: mx,
                y: my,
                radius: 78,
                color: particle.color || '#74f9ff',
                intensity: 0.38,
                castsShadows: false,
                priority: 84,
                kind: 'particle'
            }, timeMs);
            const impact = createEmitter({
                x: particle.x2,
                y: particle.y2,
                radius: 52,
                color: '#ffffff',
                intensity: 0.56,
                castsShadows: false,
                priority: 88,
                kind: 'particle'
            }, timeMs);
            return [mid, impact].filter(Boolean);
        }

        if (particle.type === 'lightning_arc') {
            const e1 = createEmitter({
                x: particle.x1,
                y: particle.y1,
                radius: 50,
                color: '#fff59d',
                intensity: 0.44,
                castsShadows: false,
                priority: 86,
                kind: 'particle'
            }, timeMs);
            const e2 = createEmitter({
                x: particle.x2,
                y: particle.y2,
                radius: 50,
                color: '#fff59d',
                intensity: 0.44,
                castsShadows: false,
                priority: 86,
                kind: 'particle'
            }, timeMs);
            return [e1, e2].filter(Boolean);
        }

        return [];
    }
}
