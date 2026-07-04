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
    floor_lamp_warm: {
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
    floor_lamp_cool: {
        offsetX: 16,
        offsetY: 6,
        radius: 138,
        color: '#b8e9ff',
        intensity: 0.92,
        flicker: 0.03,
        castsShadows: true,
        priority: 90,
        ignoreSelfShadow: true
    },
    floor_lamp_mint: {
        offsetX: 16,
        offsetY: 6,
        radius: 138,
        color: '#c8ffcf',
        intensity: 0.9,
        flicker: 0.03,
        castsShadows: true,
        priority: 90,
        ignoreSelfShadow: true
    },
    floor_lamp_rose: {
        offsetX: 16,
        offsetY: 6,
        radius: 138,
        color: '#ffc1de',
        intensity: 0.88,
        flicker: 0.025,
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
    },
    tv_stand: {
        offsetX: 20,
        offsetY: 8,
        radius: 80,
        color: '#4a5568',
        intensity: 0.65,
        flicker: 0.03,
        castsShadows: true,
        priority: 65,
        ignoreSelfShadow: true
    },
    computer_desk: {
        offsetX: 16,
        offsetY: 2,
        radius: 88,
        color: '#7ec8ff',
        intensity: 0.58,
        flicker: 0.025,
        castsShadows: true,
        priority: 68,
        ignoreSelfShadow: true
    },
    // 地牢壁挂火把：对象放在墙 tile 上，光心下移到墙南侧地板（offsetY 40 > TILE 32），
    // 避免光源落在墙体遮挡体内部被自遮蔽；楼层色差由实例 lightColor 覆盖。
    dungeon_torch: {
        offsetX: 16,
        offsetY: 40,
        radius: 122,
        color: '#ffbe72',
        intensity: 0.85,
        flicker: 0.09,
        castsShadows: true,
        priority: 74,
        ignoreSelfShadow: true
    },
    dungeon_brazier: {
        offsetX: 16,
        offsetY: 18,
        radius: 146,
        color: '#ffa85c',
        intensity: 0.95,
        flicker: 0.07,
        castsShadows: true,
        priority: 78,
        ignoreSelfShadow: true
    }
};

const BULLET_LIGHTS = {
    rocket: { radius: 82, color: '#ff9f43', intensity: 0.95, castsShadows: false, priority: 95, preferredShadowMode: 'walls', minQualityForWallsShadow: 'medium', lifetimeClass: 'transient', allowCheapRender: true },
    grenade: { radius: 46, color: '#c8d6e5', intensity: 0.35, castsShadows: false, priority: 28, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    flame: { radius: 72, color: '#ffb347', intensity: 0.8, castsShadows: false, priority: 98, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    black_hole_projectile: { radius: 66, color: '#a66bff', intensity: 0.76, castsShadows: false, priority: 94, preferredShadowMode: 'walls', minQualityForWallsShadow: 'high', lifetimeClass: 'transient', allowCheapRender: true },
    teleport: { radius: 70, color: '#71c7ff', intensity: 0.78, castsShadows: false, priority: 92, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    lightning: { radius: 68, color: '#fff27a', intensity: 0.84, castsShadows: false, priority: 98, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    ice_shard: { radius: 54, color: '#b8e9ff', intensity: 0.55, castsShadows: false, priority: 60, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    ricochet: { radius: 58, color: '#7eff96', intensity: 0.62, castsShadows: false, priority: 66, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    boomerang: { radius: 34, color: '#f0cd8c', intensity: 0.3, castsShadows: false, priority: 18, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    plasma: { radius: 64, color: '#59ffd0', intensity: 0.78, castsShadows: false, priority: 90, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    homing: { radius: 62, color: '#ff8a80', intensity: 0.74, castsShadows: false, priority: 86, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    acid: { radius: 62, color: '#9dff5f', intensity: 0.74, castsShadows: false, priority: 86, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    cluster: { radius: 56, color: '#ffbd59', intensity: 0.68, castsShadows: false, priority: 80, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    force: { radius: 52, color: '#90cfff', intensity: 0.62, castsShadows: false, priority: 72, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    vampyre: { radius: 58, color: '#ff6e6e', intensity: 0.7, castsShadows: false, priority: 84, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    needle: { radius: 34, color: '#dde6ee', intensity: 0.26, castsShadows: false, priority: 12, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    railgun: { radius: 70, color: '#67f0ff', intensity: 0.88, castsShadows: false, priority: 96, preferredShadowMode: 'walls', minQualityForWallsShadow: 'high', lifetimeClass: 'transient', allowCheapRender: true },
    laser_bolt: { radius: 60, color: '#00e5ff', intensity: 0.72, castsShadows: false, priority: 92, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    standard: { radius: 36, color: '#ffe082', intensity: 0.22, castsShadows: false, priority: 10, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true },
    bolt: { radius: 40, color: '#cfd8dc', intensity: 0.28, castsShadows: false, priority: 14, preferredShadowMode: 'none', lifetimeClass: 'transient', allowCheapRender: true }
};

const VEHICLE_HEADLIGHT_CONFIG = {
    suv: {
        radius: 210,
        color: '#f2f6ff',
        intensity: 0.72,
        coneAngle: 0.62,
        frontFactor: 0.52,
        lateralFactor: 0.34,
        priority: 88
    },
    police: {
        radius: 212,
        color: '#f2f6ff',
        intensity: 0.74,
        coneAngle: 0.62,
        frontFactor: 0.52,
        lateralFactor: 0.34,
        priority: 90
    },
    truck: {
        radius: 228,
        color: '#f2f6ff',
        intensity: 0.78,
        coneAngle: 0.58,
        frontFactor: 0.54,
        lateralFactor: 0.36,
        priority: 90
    },
    spider: {
        radius: 192,
        color: '#9deeff',
        intensity: 0.68,
        coneAngle: 0.68,
        frontFactor: 0.45,
        lateralFactor: 0.28,
        priority: 90,
        visualYOffset: -8
    }
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
    shadowMask = 'all',
    disableAmbientPointSplit = false,
    preferredShadowMode = null,
    minQualityForWallsShadow = null,
    lifetimeClass = 'persistent',
    allowCheapRender = false,
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

    const shadowMode = preferredShadowMode || (emitter.castsShadows ? (shadowMask === 'walls' ? 'walls' : 'all') : 'none');
    emitter.preferredShadowMode = shadowMode;
    emitter.lifetimeClass = lifetimeClass === 'transient' ? 'transient' : 'persistent';
    emitter.allowCheapRender = allowCheapRender === true;

    if (shadowMask === 'walls') {
        emitter.shadowMask = 'walls';
    }
    if (disableAmbientPointSplit === true) {
        emitter.disableAmbientPointSplit = true;
    }
    if (minQualityForWallsShadow) {
        emitter.minQualityForWallsShadow = minQualityForWallsShadow;
    }

    if (coneAngle > 0) {
        emitter.coneAngle = coneAngle;
        emitter.coneDirection = coneDirection;
    }

    return emitter;
}

export class LightEmitterRegistry {
    hasObjectEmitter(type) {
        return !!OBJECT_LIGHTS[type];
    }

    getObjectEmitters(obj, timeMs = 0) {
        if (!obj || obj.isBroken) return [];

        const def = OBJECT_LIGHTS[obj.type];
        if (!def) return [];

        // Skip light for objects with explicit off state (e.g. TV turned off)
        if (obj.lightColor === null && obj.lightIntensity === null) return [];

        const emitter = createEmitter({
            x: obj.x + def.offsetX,
            y: obj.y + def.offsetY,
            radius: def.radius,
            color: obj.lightColor || def.color,
            intensity: obj.lightIntensity != null ? obj.lightIntensity : def.intensity,
            castsShadows: def.castsShadows,
            flicker: obj.lightFlicker != null ? obj.lightFlicker : (def.flicker || 0),
            owner: obj,
            ignoreSelfShadow: def.ignoreSelfShadow,
            priority: def.priority,
            kind: 'object',
            preferredShadowMode: 'all',
            lifetimeClass: 'persistent',
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
            preferredShadowMode: 'all',
            lifetimeClass: 'persistent',
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
            kind: 'portal',
            preferredShadowMode: 'all',
            lifetimeClass: 'persistent'
        }, timeMs);

        return [core, rim].filter(Boolean);
    }

    getVehicleEmitters(vehicle, timeMs = 0) {
        if (!vehicle || vehicle.isDead || !vehicle.controlled) return [];

        const profile = VEHICLE_HEADLIGHT_CONFIG[vehicle.type];
        if (!profile) return [];

        const angle = Number.isFinite(vehicle.angle) ? vehicle.angle : 0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hitboxWidth = vehicle.hitbox?.width || vehicle.width || 36;
        const hitboxHeight = vehicle.hitbox?.height || vehicle.height || 20;

        const frontOffset = hitboxWidth * profile.frontFactor;
        const lateralOffset = hitboxHeight * profile.lateralFactor;
        const forwardX = cos;
        const forwardY = sin;
        const rightX = -sin;
        const rightY = cos;

        const emitters = [];

        if (vehicle.type === 'spider') {
            const centerX = vehicle.x + forwardX * frontOffset;
            const visualYOffset = profile.visualYOffset || 0;
            const centerY = vehicle.y + forwardY * frontOffset + visualYOffset + (vehicle.suspensionOffset || 0);
            emitters.push(...this._buildHeadlightEmitters({
                x: centerX,
                y: centerY,
                angle,
                profile,
                vehicle,
                sideIntensityScale: 1.0,
                seedOffset: 1.66
            }, timeMs));
        } else {
            const leftX = vehicle.x + forwardX * frontOffset - rightX * lateralOffset;
            const leftY = vehicle.y + forwardY * frontOffset - rightY * lateralOffset;
            const rightXPos = vehicle.x + forwardX * frontOffset + rightX * lateralOffset;
            const rightYPos = vehicle.y + forwardY * frontOffset + rightY * lateralOffset;

            emitters.push(...this._buildHeadlightEmitters({
                x: leftX,
                y: leftY,
                angle,
                profile,
                vehicle,
                sideIntensityScale: 1.0,
                seedOffset: 1.11
            }, timeMs));
            emitters.push(...this._buildHeadlightEmitters({
                x: rightXPos,
                y: rightYPos,
                angle,
                profile,
                vehicle,
                sideIntensityScale: 0.95,
                seedOffset: 2.22
            }, timeMs));
        }

        if (vehicle.type === 'police') {
            emitters.push(...this._getPoliceSirenEmitters(vehicle, timeMs, angle, hitboxWidth, hitboxHeight));
        }

        return emitters;
    }

    _buildHeadlightEmitters({
        x,
        y,
        angle,
        profile,
        vehicle,
        sideIntensityScale,
        seedOffset
    }, timeMs) {
        const sideIntensity = profile.intensity * sideIntensityScale;

        const core = createEmitter({
            x,
            y,
            radius: profile.radius,
            color: profile.color,
            intensity: sideIntensity * 0.7,
            castsShadows: true,
            flicker: 0.01,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: profile.priority,
            kind: 'vehicle',
            preferredShadowMode: 'walls',
            lifetimeClass: 'persistent',
            seed: vehicle.x * 0.021 + vehicle.y * 0.013 + seedOffset,
            coneAngle: profile.coneAngle * 0.82,
            coneDirection: angle
        }, timeMs);

        const spill = createEmitter({
            x,
            y,
            radius: profile.radius * 0.76,
            color: profile.color,
            intensity: sideIntensity * 0.45,
            castsShadows: false,
            flicker: 0.015,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: profile.priority - 4,
            kind: 'vehicle',
            preferredShadowMode: 'none',
            lifetimeClass: 'persistent',
            allowCheapRender: true,
            seed: vehicle.x * 0.019 + vehicle.y * 0.017 + seedOffset + 0.7,
            coneAngle: profile.coneAngle * 1.38,
            coneDirection: angle
        }, timeMs);

        const nearFill = createEmitter({
            x,
            y,
            radius: Math.max(50, profile.radius * 0.23),
            color: profile.color,
            intensity: sideIntensity * 0.24,
            castsShadows: false,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: profile.priority - 8,
            kind: 'vehicle',
            preferredShadowMode: 'none',
            lifetimeClass: 'persistent',
            allowCheapRender: true,
            seed: vehicle.x * 0.015 + vehicle.y * 0.011 + seedOffset + 1.3
        }, timeMs);

        return [core, spill, nearFill].filter(Boolean);
    }

    _getPoliceSirenEmitters(vehicle, timeMs, angle, hitboxWidth, hitboxHeight) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const forwardX = cos;
        const forwardY = sin;
        const rightX = -sin;
        const rightY = cos;

        const barForwardOffset = -hitboxWidth * 0.08;
        const barLateralOffset = hitboxHeight * 0.28;
        const baseX = vehicle.x + forwardX * barForwardOffset;
        const baseY = vehicle.y + forwardY * barForwardOffset;
        const redX = baseX - rightX * barLateralOffset;
        const redY = baseY - rightY * barLateralOffset;
        const blueX = baseX + rightX * barLateralOffset;
        const blueY = baseY + rightY * barLateralOffset;

        const phase = (Math.sin(timeMs * 0.022) + 1) * 0.5;
        const redIntensity = 0.22 + phase * 0.92;
        const blueIntensity = 0.22 + (1 - phase) * 0.92;

        const redAmbient = createEmitter({
            x: redX,
            y: redY,
            radius: 122,
            color: '#ff4d59',
            intensity: redIntensity * 0.7,
            castsShadows: true,
            flicker: 0.04,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: 96,
            kind: 'vehicle',
            seed: vehicle.x * 0.031 + vehicle.y * 0.023 + 3.33,
            shadowMask: 'walls',
            disableAmbientPointSplit: true,
            preferredShadowMode: 'walls',
            lifetimeClass: 'persistent'
        }, timeMs);

        const redPoint = createEmitter({
            x: redX,
            y: redY,
            radius: 122,
            color: '#ff4d59',
            intensity: redIntensity * 0.3,
            castsShadows: true,
            flicker: 0.08,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: 96,
            kind: 'vehicle',
            seed: vehicle.x * 0.033 + vehicle.y * 0.021 + 3.88,
            shadowMask: 'all',
            disableAmbientPointSplit: true,
            preferredShadowMode: 'all',
            lifetimeClass: 'persistent'
        }, timeMs);

        const blueAmbient = createEmitter({
            x: blueX,
            y: blueY,
            radius: 122,
            color: '#4da3ff',
            intensity: blueIntensity * 0.7,
            castsShadows: true,
            flicker: 0.04,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: 96,
            kind: 'vehicle',
            seed: vehicle.x * 0.029 + vehicle.y * 0.027 + 4.44,
            shadowMask: 'walls',
            disableAmbientPointSplit: true,
            preferredShadowMode: 'walls',
            lifetimeClass: 'persistent'
        }, timeMs);

        const bluePoint = createEmitter({
            x: blueX,
            y: blueY,
            radius: 122,
            color: '#4da3ff',
            intensity: blueIntensity * 0.3,
            castsShadows: true,
            flicker: 0.08,
            owner: vehicle,
            ignoreSelfShadow: true,
            priority: 96,
            kind: 'vehicle',
            seed: vehicle.x * 0.027 + vehicle.y * 0.029 + 4.99,
            shadowMask: 'all',
            disableAmbientPointSplit: true,
            preferredShadowMode: 'all',
            lifetimeClass: 'persistent'
        }, timeMs);

        return [redAmbient, redPoint, blueAmbient, bluePoint].filter(Boolean);
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
            kind: 'black_hole',
            preferredShadowMode: 'none',
            lifetimeClass: 'persistent',
            allowCheapRender: true
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
            kind: 'puddle',
            preferredShadowMode: 'none',
            lifetimeClass: 'persistent',
            allowCheapRender: true
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
            kind: 'muzzle',
            preferredShadowMode: 'none',
            lifetimeClass: 'transient',
            allowCheapRender: true
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
            kind: 'bullet',
            preferredShadowMode: profile.preferredShadowMode || null,
            minQualityForWallsShadow: profile.minQualityForWallsShadow || null,
            lifetimeClass: profile.lifetimeClass || 'transient',
            allowCheapRender: profile.allowCheapRender === true
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
                kind: 'particle',
                preferredShadowMode: 'none',
                lifetimeClass: 'transient',
                allowCheapRender: true
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
                kind: 'particle',
                preferredShadowMode: 'none',
                lifetimeClass: 'transient',
                allowCheapRender: true
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
                kind: 'particle',
                preferredShadowMode: 'none',
                lifetimeClass: 'transient',
                allowCheapRender: true
            }, timeMs);
            const impact = createEmitter({
                x: particle.x2,
                y: particle.y2,
                radius: 52,
                color: '#ffffff',
                intensity: 0.56,
                castsShadows: false,
                priority: 88,
                kind: 'particle',
                preferredShadowMode: 'none',
                lifetimeClass: 'transient',
                allowCheapRender: true
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
                kind: 'particle',
                preferredShadowMode: 'none',
                lifetimeClass: 'transient',
                allowCheapRender: true
            }, timeMs);
            const e2 = createEmitter({
                x: particle.x2,
                y: particle.y2,
                radius: 50,
                color: '#fff59d',
                intensity: 0.44,
                castsShadows: false,
                priority: 86,
                kind: 'particle',
                preferredShadowMode: 'none',
                lifetimeClass: 'transient',
                allowCheapRender: true
            }, timeMs);
            return [e1, e2].filter(Boolean);
        }

        return [];
    }
}
