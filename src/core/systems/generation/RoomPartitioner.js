import { randomInt } from './GenerationUtils.js';

function canSplitVert(room, minSize) {
    return room.w >= minSize * 2 + 1;
}

function canSplitHorz(room, minSize) {
    return room.h >= minSize * 2 + 1;
}

function pickSplitOrientation(room, minSize, rng) {
    const allowV = canSplitVert(room, minSize);
    const allowH = canSplitHorz(room, minSize);

    if (!allowV && !allowH) return null;
    if (allowV && !allowH) return 'v';
    if (!allowV && allowH) return 'h';

    const verticalBias = room.w / (room.w + room.h);
    return rng() < verticalBias ? 'v' : 'h';
}

function splitRoom(room, minSize, rng, segmentId) {
    const orientation = pickSplitOrientation(room, minSize, rng);
    if (!orientation) return null;

    if (orientation === 'v') {
        const minCut = room.x + minSize;
        const maxCut = room.x + room.w - minSize - 1;
        if (maxCut < minCut) return null;

        const wallX = randomInt(rng, minCut, maxCut);
        const left = {
            x: room.x,
            y: room.y,
            w: wallX - room.x,
            h: room.h
        };
        const right = {
            x: wallX + 1,
            y: room.y,
            w: room.x + room.w - wallX - 1,
            h: room.h
        };

        if (left.w < minSize || right.w < minSize) return null;

        return {
            rooms: [left, right],
            segment: {
                id: `seg_${segmentId}`,
                orientation: 'v',
                x: wallX,
                from: room.y,
                to: room.y + room.h - 1,
                mandatoryDoor: true
            }
        };
    }

    const minCut = room.y + minSize;
    const maxCut = room.y + room.h - minSize - 1;
    if (maxCut < minCut) return null;

    const wallY = randomInt(rng, minCut, maxCut);
    const top = {
        x: room.x,
        y: room.y,
        w: room.w,
        h: wallY - room.y
    };
    const bottom = {
        x: room.x,
        y: wallY + 1,
        w: room.w,
        h: room.y + room.h - wallY - 1
    };

    if (top.h < minSize || bottom.h < minSize) return null;

    return {
        rooms: [top, bottom],
        segment: {
            id: `seg_${segmentId}`,
            orientation: 'h',
            y: wallY,
            from: room.x,
            to: room.x + room.w - 1,
            mandatoryDoor: true
        }
    };
}

export function partitionBuildingRooms({ footprint, config, rng }) {
    const interior = {
        x: footprint.x + 1,
        y: footprint.y + 1,
        w: footprint.w - 2,
        h: footprint.h - 2
    };

    if (interior.w < config.rooms.minSize || interior.h < config.rooms.minSize) {
        return null;
    }

    const minSize = config.rooms.minSize;
    const area = interior.w * interior.h;
    const roughRoomCap = Math.max(1, Math.floor(area / (minSize * minSize + 1)));
    const targetMax = Math.min(config.rooms.targetMax, roughRoomCap);
    const targetMin = Math.min(config.rooms.targetMin, targetMax);
    const targetRooms = randomInt(rng, targetMin, targetMax);

    const rooms = [interior];
    const splitSegments = [];

    let splitCounter = 0;
    let attempts = 0;

    while (rooms.length < targetRooms && attempts < config.rooms.splitAttempts) {
        attempts++;

        const candidates = rooms
            .map((room, index) => ({ room, index }))
            .filter(({ room }) => canSplitVert(room, minSize) || canSplitHorz(room, minSize));

        if (candidates.length === 0) break;

        candidates.sort((a, b) => (b.room.w * b.room.h) - (a.room.w * a.room.h));
        const pickWindow = Math.min(3, candidates.length);
        const picked = candidates[Math.floor(rng() * pickWindow)];

        const result = splitRoom(picked.room, minSize, rng, splitCounter);
        splitCounter++;

        if (!result) continue;

        rooms.splice(picked.index, 1, result.rooms[0], result.rooms[1]);
        splitSegments.push(result.segment);
    }

    const finalizedRooms = rooms.map((room, index) => ({
        ...room,
        id: `${footprint.id}_room_${index + 1}`,
        buildingId: footprint.id,
        area: room.w * room.h
    }));

    return {
        rooms: finalizedRooms,
        splitSegments,
        interior
    };
}
