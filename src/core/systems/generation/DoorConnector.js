import {
    buildRoomLookup,
    chooseRandom,
    forEachSegmentTile,
    randomInt,
    tileKey
} from './GenerationUtils.js';

function getRoomPairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function getPairDoorLimit(roomA, roomB, roomAreaMap, doorConfig) {
    const areaA = roomAreaMap.get(roomA) || 0;
    const areaB = roomAreaMap.get(roomB) || 0;
    const largeThreshold = doorConfig.largeRoomAreaThreshold;
    const isLargePair = areaA >= largeThreshold || areaB >= largeThreshold;
    if (!isLargePair) return 1;
    return Math.max(1, doorConfig.maxDoorsForLargePair || 1);
}

function canAddDoorForPair(candidate, pairDoorCounts, roomAreaMap, doorConfig) {
    const a = candidate.connects && candidate.connects[0];
    const b = candidate.connects && candidate.connects[1];
    if (!a || !b) return true;

    const key = getRoomPairKey(a, b);
    const count = pairDoorCounts.get(key) || 0;
    const limit = getPairDoorLimit(a, b, roomAreaMap, doorConfig);
    return count < limit;
}

function markDoorPairCount(candidate, pairDoorCounts) {
    const a = candidate.connects && candidate.connects[0];
    const b = candidate.connects && candidate.connects[1];
    if (!a || !b) return;

    const key = getRoomPairKey(a, b);
    pairDoorCounts.set(key, (pairDoorCounts.get(key) || 0) + 1);
}

function addOuterWallTiles(footprint, wallTiles) {
    const x0 = footprint.x;
    const y0 = footprint.y;
    const x1 = footprint.x + footprint.w - 1;
    const y1 = footprint.y + footprint.h - 1;

    for (let x = x0; x <= x1; x++) {
        wallTiles.add(tileKey(x, y0));
        wallTiles.add(tileKey(x, y1));
    }
    for (let y = y0; y <= y1; y++) {
        wallTiles.add(tileKey(x0, y));
        wallTiles.add(tileKey(x1, y));
    }
}

function addInternalWallTiles(splitSegments, wallTiles) {
    for (const segment of splitSegments) {
        forEachSegmentTile(segment, (x, y) => {
            wallTiles.add(tileKey(x, y));
        });
    }
}

function isNearDoor(x, y, usedDoorTiles) {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (usedDoorTiles.has(tileKey(x + dx, y + dy))) return true;
        }
    }
    return false;
}

function getSegmentScanRange(segment, edgeMargin) {
    const length = segment.to - segment.from + 1;
    if (length <= edgeMargin * 2) {
        return { start: segment.from, end: segment.to };
    }
    return { start: segment.from + edgeMargin, end: segment.to - edgeMargin };
}

function collectInternalDoorCandidates({ segment, roomLookup, usedDoorTiles, edgeMargin }) {
    const candidates = [];
    const { start, end } = getSegmentScanRange(segment, edgeMargin);

    if (segment.orientation === 'v') {
        for (let y = start; y <= end; y++) {
            const x = segment.x;
            const leftId = roomLookup.get(tileKey(x - 1, y));
            const rightId = roomLookup.get(tileKey(x + 1, y));
            if (!leftId || !rightId || leftId === rightId) continue;
            if (isNearDoor(x, y, usedDoorTiles)) continue;

            candidates.push({
                x,
                y,
                type: 'door_v',
                connects: [leftId, rightId],
                kind: 'internal'
            });
        }
        return candidates;
    }

    for (let x = start; x <= end; x++) {
        const y = segment.y;
        const topId = roomLookup.get(tileKey(x, y - 1));
        const bottomId = roomLookup.get(tileKey(x, y + 1));
        if (!topId || !bottomId || topId === bottomId) continue;
        if (isNearDoor(x, y, usedDoorTiles)) continue;

        candidates.push({
            x,
            y,
            type: 'door_h',
            connects: [topId, bottomId],
            kind: 'internal'
        });
    }

    return candidates;
}

function collectEntranceCandidates({ footprint, roomLookup, usedDoorTiles, edgeMargin, mapWidth, mapHeight }) {
    const list = [];

    const x0 = footprint.x;
    const y0 = footprint.y;
    const x1 = footprint.x + footprint.w - 1;
    const y1 = footprint.y + footprint.h - 1;

    const sideMargin = Math.max(1, edgeMargin + 1);

    for (let x = x0 + sideMargin; x <= x1 - sideMargin; x++) {
        if (!isNearDoor(x, y0, usedDoorTiles)) {
            const insideRoomId = roomLookup.get(tileKey(x, y0 + 1));
            const outside = { x, y: y0 - 1 };
            if (insideRoomId && outside.y > 0) {
                list.push({
                    x,
                    y: y0,
                    type: 'door_h',
                    side: 'top',
                    kind: 'entrance',
                    connects: [insideRoomId, null],
                    outside
                });
            }
        }

        if (!isNearDoor(x, y1, usedDoorTiles)) {
            const insideRoomId = roomLookup.get(tileKey(x, y1 - 1));
            const outside = { x, y: y1 + 1 };
            if (insideRoomId && outside.y < mapHeight - 1) {
                list.push({
                    x,
                    y: y1,
                    type: 'door_h',
                    side: 'bottom',
                    kind: 'entrance',
                    connects: [insideRoomId, null],
                    outside
                });
            }
        }
    }

    for (let y = y0 + sideMargin; y <= y1 - sideMargin; y++) {
        if (!isNearDoor(x0, y, usedDoorTiles)) {
            const insideRoomId = roomLookup.get(tileKey(x0 + 1, y));
            const outside = { x: x0 - 1, y };
            if (insideRoomId && outside.x > 0) {
                list.push({
                    x: x0,
                    y,
                    type: 'door_v',
                    side: 'left',
                    kind: 'entrance',
                    connects: [insideRoomId, null],
                    outside
                });
            }
        }

        if (!isNearDoor(x1, y, usedDoorTiles)) {
            const insideRoomId = roomLookup.get(tileKey(x1 - 1, y));
            const outside = { x: x1 + 1, y };
            if (insideRoomId && outside.x < mapWidth - 1) {
                list.push({
                    x: x1,
                    y,
                    type: 'door_v',
                    side: 'right',
                    kind: 'entrance',
                    connects: [insideRoomId, null],
                    outside
                });
            }
        }
    }

    return list;
}

export function connectBuildingDoors({ footprint, rooms, splitSegments, config, rng, mapWidth, mapHeight }) {
    const wallTiles = new Set();
    addOuterWallTiles(footprint, wallTiles);
    addInternalWallTiles(splitSegments, wallTiles);

    const roomLookup = buildRoomLookup(rooms);
    const roomAreaMap = new Map(rooms.map(room => [room.id, room.area || (room.w * room.h)]));
    const pairDoorCounts = new Map();
    const usedDoorTiles = new Set();
    const doors = [];

    for (const segment of splitSegments) {
        if (!segment.mandatoryDoor) continue;

        const candidates = collectInternalDoorCandidates({
            segment,
            roomLookup,
            usedDoorTiles,
            edgeMargin: config.doors.edgeMargin
        });

        if (candidates.length === 0) {
            return {
                ok: false,
                reason: `No mandatory internal door candidate for ${segment.id}`
            };
        }

        const candidatesWithinLimit = candidates.filter(candidate =>
            canAddDoorForPair(candidate, pairDoorCounts, roomAreaMap, config.doors)
        );

        if (candidatesWithinLimit.length === 0) {
            // If this partition pair already has enough doors (default 1),
            // we can skip adding another one for the same room pair.
            continue;
        }

        const selected = chooseRandom(rng, candidatesWithinLimit);
        if (!selected) continue;

        selected.buildingId = footprint.id;
        doors.push(selected);
        usedDoorTiles.add(tileKey(selected.x, selected.y));
        wallTiles.delete(tileKey(selected.x, selected.y));
        markDoorPairCount(selected, pairDoorCounts);
    }

    const extraCandidates = [];
    for (const segment of splitSegments) {
        const candidates = collectInternalDoorCandidates({
            segment,
            roomLookup,
            usedDoorTiles,
            edgeMargin: config.doors.edgeMargin
        });
        extraCandidates.push(...candidates);
    }

    const maxExtra = config.doors.maxExtraInternalPerBuilding;
    const extraCount = randomInt(rng, 0, maxExtra);
    let placedExtraDoors = 0;
    let safety = extraCandidates.length * 3;
    while (placedExtraDoors < extraCount && safety > 0) {
        safety--;
        const pick = chooseRandom(rng, extraCandidates);
        if (!pick) break;
        const key = tileKey(pick.x, pick.y);
        if (usedDoorTiles.has(key) || isNearDoor(pick.x, pick.y, usedDoorTiles)) {
            continue;
        }
        if (!canAddDoorForPair(pick, pairDoorCounts, roomAreaMap, config.doors)) {
            continue;
        }

        pick.buildingId = footprint.id;
        doors.push(pick);
        usedDoorTiles.add(key);
        wallTiles.delete(key);
        markDoorPairCount(pick, pairDoorCounts);
        placedExtraDoors++;
    }

    const entranceCandidates = collectEntranceCandidates({
        footprint,
        roomLookup,
        usedDoorTiles,
        edgeMargin: config.doors.edgeMargin,
        mapWidth,
        mapHeight
    });

    const entranceDoor = chooseRandom(rng, entranceCandidates);
    if (!entranceDoor) {
        return {
            ok: false,
            reason: `No entrance door candidate for ${footprint.id}`
        };
    }

    entranceDoor.buildingId = footprint.id;
    doors.push(entranceDoor);
    usedDoorTiles.add(tileKey(entranceDoor.x, entranceDoor.y));
    wallTiles.delete(tileKey(entranceDoor.x, entranceDoor.y));

    return {
        ok: true,
        wallTiles,
        doors,
        roomLookup,
        entranceDoor
    };
}
