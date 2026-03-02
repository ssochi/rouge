import { Assets } from '../../graphics/Assets.js';

function hasCanvasShape(value) {
    return !!value && Number.isFinite(value.width) && Number.isFinite(value.height);
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function pickPlayerFrames(player, costumeSystem) {
    if (costumeSystem && player?.costume) {
        const frames = costumeSystem.getPlayerFrames(player.costume);
        if (frames) return frames;
    }
    return Assets.player;
}

function pickPlayerSprite(player, frames) {
    if (!frames) return null;

    if (player.state === 'roll') {
        const sprite = frames.run?.[0] || frames.idle?.[0] || null;
        if (!sprite) return null;

        const maxDuration = 15;
        const raw = (maxDuration - (player.rollDuration || 0)) / maxDuration;
        const progress = clamp01(raw);
        const moveX = Math.cos(player.angle || 0);
        const direction = moveX >= 0 ? 1 : -1;

        return {
            sprite,
            rotation: direction * progress * Math.PI * 2,
            flipX: false
        };
    }

    if (player.state === 'run') {
        const runFrames = frames.run || [];
        if (runFrames.length > 0) {
            const frameIndex = Math.floor((player.animationTimer || 0) / 3) % runFrames.length;
            return {
                sprite: runFrames[frameIndex],
                rotation: 0,
                flipX: player.facingRight === false
            };
        }
    }

    const idleFrames = frames.idle || [];
    if (idleFrames.length === 0) return null;

    const frameIndex = Math.floor((player.animationTimer || 0) / 10) % idleFrames.length;
    return {
        sprite: idleFrames[frameIndex],
        rotation: 0,
        flipX: player.facingRight === false
    };
}

export function resolvePlayerLightOccluders(player, costumeSystem) {
    if (!player || player.state === 'driving' || player.blocksLight === false) return [];
    if (Number.isFinite(player.hp) && player.hp <= 0) return [];

    const frames = pickPlayerFrames(player, costumeSystem);
    const picked = pickPlayerSprite(player, frames);
    if (!picked || !hasCanvasShape(picked.sprite)) return [];

    return [{
        kind: 'sprite',
        sprite: picked.sprite,
        pivotX: player.x,
        pivotY: player.y,
        originX: 16,
        originY: 32,
        rotation: picked.rotation || 0,
        flipX: picked.flipX === true
    }];
}

export function resolveEntityLightOccluders(entity) {
    if (!entity || entity.blocksLight === false) return [];

    if (typeof entity.getLightOccluderSprites !== 'function') return [];
    const list = entity.getLightOccluderSprites();
    if (!Array.isArray(list) || list.length === 0) return [];

    const result = [];
    for (const item of list) {
        if (!item) continue;

        if (item.kind === 'rect') {
            if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) continue;
            const width = item.width ?? item.w;
            const height = item.height ?? item.h;
            if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;
            result.push({
                kind: 'rect',
                x: item.x,
                y: item.y,
                width,
                height
            });
            continue;
        }

        if (!hasCanvasShape(item.sprite)) continue;
        if (!Number.isFinite(item.pivotX) || !Number.isFinite(item.pivotY)) continue;

        result.push({
            kind: 'sprite',
            sprite: item.sprite,
            pivotX: item.pivotX,
            pivotY: item.pivotY,
            originX: Number.isFinite(item.originX) ? item.originX : 0,
            originY: Number.isFinite(item.originY) ? item.originY : 0,
            rotation: Number.isFinite(item.rotation) ? item.rotation : 0,
            flipX: item.flipX === true,
            forceMaskRefresh: item.forceMaskRefresh === true,
            maskVersion: Number.isFinite(item.maskVersion) ? item.maskVersion : undefined
        });
    }

    return result;
}
