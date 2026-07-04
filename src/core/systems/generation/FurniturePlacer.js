import {
    chooseRandom,
    manhattan,
    shuffle,
    tileKey,
    touchesWall
} from './GenerationUtils.js';
import { FURNITURE_CATALOG, ROOM_FURNITURE_TEMPLATES } from './GenerationConfig.js';

function getDoorEntryForRoom(room, door) {
    const withinY = door.y >= room.y && door.y < room.y + room.h;
    const withinX = door.x >= room.x && door.x < room.x + room.w;

    if (door.x === room.x - 1 && withinY) {
        return {
            entry: { x: room.x, y: door.y },
            dir: { x: 1, y: 0 }
        };
    }

    if (door.x === room.x + room.w && withinY) {
        return {
            entry: { x: room.x + room.w - 1, y: door.y },
            dir: { x: -1, y: 0 }
        };
    }

    if (door.y === room.y - 1 && withinX) {
        return {
            entry: { x: door.x, y: room.y },
            dir: { x: 0, y: 1 }
        };
    }

    if (door.y === room.y + room.h && withinX) {
        return {
            entry: { x: door.x, y: room.y + room.h - 1 },
            dir: { x: 0, y: -1 }
        };
    }

    return null;
}

function isInsideRoom(room, x, y) {
    return x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h;
}

function markFootprint(set, x, y, w, h) {
    for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
            set.add(tileKey(xx, yy));
        }
    }
}

function canPlaceFootprint(room, x, y, w, h, occupied, reserved) {
    if (!isInsideRoom(room, x, y) || !isInsideRoom(room, x + w - 1, y + h - 1)) {
        return false;
    }

    for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
            const key = tileKey(xx, yy);
            if (occupied.has(key) || reserved.has(key)) return false;
        }
    }

    return true;
}

function footprintCenter(x, y, w, h) {
    return {
        x: x + (w - 1) / 2,
        y: y + (h - 1) / 2
    };
}

function isAdjacentRect(a, b) {
    const horizontalTouch = a.x + a.w === b.x || b.x + b.w === a.x;
    const verticalOverlap = a.y < b.y + b.h && a.y + a.h > b.y;

    const verticalTouch = a.y + a.h === b.y || b.y + b.h === a.y;
    const horizontalOverlap = a.x < b.x + b.w && a.x + a.w > b.x;

    return (horizontalTouch && verticalOverlap) || (verticalTouch && horizontalOverlap);
}

function getCandidates({ room, variant, occupied, reserved, options, tags, rng }) {
    const out = [];
    const roomCenter = {
        x: room.x + (room.w - 1) / 2,
        y: room.y + (room.h - 1) / 2
    };

    const nearTarget = options.nearTag ? tags.get(options.nearTag) : null;
    if (options.nearTag && !nearTarget) {
        return out;
    }

    const farTarget = options.preferFarFromTag ? tags.get(options.preferFarFromTag) : null;

    for (let y = room.y; y <= room.y + room.h - variant.h; y++) {
        for (let x = room.x; x <= room.x + room.w - variant.w; x++) {
            if (!canPlaceFootprint(room, x, y, variant.w, variant.h, occupied, reserved)) continue;

            const touches = touchesWall(room, x, y, variant.w, variant.h);
            if (options.requireWall && !touches) continue;

            const rect = { x, y, w: variant.w, h: variant.h };
            if (nearTarget && !isAdjacentRect(rect, nearTarget)) continue;

            let score = rng();
            if (options.requireWall && touches) score += 40;
            if (options.preferWall && touches) score += 10;

            const center = footprintCenter(x, y, variant.w, variant.h);
            if (options.preferCenter) {
                score -= manhattan(center.x, center.y, roomCenter.x, roomCenter.y) * 0.7;
            }

            if (farTarget) {
                const farCenter = footprintCenter(farTarget.x, farTarget.y, farTarget.w, farTarget.h);
                score += manhattan(center.x, center.y, farCenter.x, farCenter.y) * 0.8;
            }

            out.push({ x, y, score });
        }
    }

    out.sort((a, b) => b.score - a.score);
    return out;
}

function attemptPlaceItem({ room, rule, occupied, reserved, tags, rng }) {
    const catalog = FURNITURE_CATALOG[rule.item];
    if (!catalog || !catalog.variants || catalog.variants.length === 0) {
        return null;
    }

    const variants = shuffle(rng, catalog.variants);
    for (const variant of variants) {
        const candidates = getCandidates({
            room,
            variant,
            occupied,
            reserved,
            options: {
                requireWall: !!rule.requireWall,
                preferWall: !!rule.preferWall,
                preferCenter: !!rule.preferCenter,
                preferFarFromTag: rule.preferFarFromTag || null,
                nearTag: rule.nearTag || null
            },
            tags,
            rng
        });

        if (candidates.length === 0) continue;

        const pickPoolSize = Math.min(3, candidates.length);
        const picked = chooseRandom(rng, candidates.slice(0, pickPoolSize));
        if (!picked) continue;

        markFootprint(occupied, picked.x, picked.y, variant.w, variant.h);

        const placement = {
            roomId: room.id,
            buildingId: room.buildingId,
            semantic: room.semantic,
            item: rule.item,
            type: variant.type,
            x: picked.x,
            y: picked.y,
            w: variant.w,
            h: variant.h,
            tag: rule.tag || rule.item
        };

        tags.set(placement.tag, { x: placement.x, y: placement.y, w: placement.w, h: placement.h });
        return placement;
    }

    return null;
}

function buildDoorEntries(room, doors) {
    const entries = [];
    for (const door of doors) {
        const entry = getDoorEntryForRoom(room, door);
        if (entry) entries.push(entry);
    }
    return entries;
}

function reserveDoorClearance(room, entries, reserved, depth) {
    for (const item of entries) {
        for (let i = 0; i < depth; i++) {
            const x = item.entry.x + item.dir.x * i;
            const y = item.entry.y + item.dir.y * i;
            if (isInsideRoom(room, x, y)) {
                reserved.add(tileKey(x, y));
            }
        }
    }
}

function collectWalkableTiles(room, occupied) {
    const tiles = [];
    for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
            const key = tileKey(x, y);
            if (!occupied.has(key)) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
}

function validateWalkability(room, occupied, entries, minWalkableRatio) {
    const walkable = collectWalkableTiles(room, occupied);
    if (walkable.length === 0) return false;

    const walkableSet = new Set(walkable.map(t => tileKey(t.x, t.y)));

    let start = null;
    for (const item of entries) {
        const k = tileKey(item.entry.x, item.entry.y);
        if (walkableSet.has(k)) {
            start = { ...item.entry };
            break;
        }
    }

    if (!start) {
        start = walkable[0];
    }

    const queue = [start];
    const visited = new Set([tileKey(start.x, start.y)]);

    while (queue.length > 0) {
        const cur = queue.shift();
        const neighbors = [
            { x: cur.x + 1, y: cur.y },
            { x: cur.x - 1, y: cur.y },
            { x: cur.x, y: cur.y + 1 },
            { x: cur.x, y: cur.y - 1 }
        ];

        for (const n of neighbors) {
            const key = tileKey(n.x, n.y);
            if (!walkableSet.has(key) || visited.has(key)) continue;
            visited.add(key);
            queue.push(n);
        }
    }

    for (const item of entries) {
        const k = tileKey(item.entry.x, item.entry.y);
        if (walkableSet.has(k) && !visited.has(k)) {
            return false;
        }
    }

    const minWalkableTiles = Math.max(1, Math.floor(room.area * minWalkableRatio));
    return visited.size >= minWalkableTiles;
}

function placeRoomFurnitureAttempt(room, doors, config, rng) {
    const template = ROOM_FURNITURE_TEMPLATES[room.semantic] || ROOM_FURNITURE_TEMPLATES.storage;
    const occupied = new Set();
    const reserved = new Set();
    const tags = new Map();

    const doorEntries = buildDoorEntries(room, doors);
    reserveDoorClearance(room, doorEntries, reserved, config.furniture.doorClearanceDepth);

    const placements = [];

    for (const rule of template.required) {
        const placement = attemptPlaceItem({ room, rule, occupied, reserved, tags, rng });
        if (!placement) {
            return { ok: false, reason: `Required furniture missing in room ${room.id}: ${rule.item}` };
        }
        placements.push(placement);
    }

    for (const optionalRule of template.optional) {
        if (rng() > optionalRule.chance) continue;
        const placement = attemptPlaceItem({ room, rule: optionalRule, occupied, reserved, tags, rng });
        if (placement) {
            placements.push(placement);
        }
    }

    if (!validateWalkability(room, occupied, doorEntries, config.furniture.minWalkableRatio)) {
        return {
            ok: false,
            reason: `Walkability check failed in room ${room.id}`
        };
    }

    return {
        ok: true,
        placements
    };
}

function buildRoomDoorMap(rooms, doors) {
    const map = new Map();
    for (const room of rooms) {
        map.set(room.id, []);
    }

    for (const door of doors) {
        for (const room of rooms) {
            if (getDoorEntryForRoom(room, door)) {
                const list = map.get(room.id);
                list.push(door);
            }
        }
    }

    return map;
}

function roomSortWeight(room) {
    const priority = {
        living_room: 4,
        bedroom: 3,
        retail: 3,
        study: 2,
        office: 2,
        workshop: 2,
        clinic: 2,
        bathroom: 1,
        foyer: 1,
        storage: 0,
        corridor: -1
    };
    return (priority[room.semantic] || 0) * 10000 + room.area;
}

export function placeFurnitureForBuilding({ rooms, doors, config, rng }) {
    const placements = [];
    const roomDoorMap = buildRoomDoorMap(rooms, doors);

    const orderedRooms = [...rooms].sort((a, b) => roomSortWeight(b) - roomSortWeight(a));

    for (const room of orderedRooms) {
        const roomDoors = roomDoorMap.get(room.id) || [];

        let roomResult = null;
        for (let attempt = 0; attempt < config.furniture.roomPlacementAttempts; attempt++) {
            roomResult = placeRoomFurnitureAttempt(room, roomDoors, config, rng);
            if (roomResult.ok) break;
        }

        if (!roomResult || !roomResult.ok) {
            return {
                ok: false,
                reason: roomResult ? roomResult.reason : `Unknown furniture placement failure in ${room.id}`
            };
        }

        placements.push(...roomResult.placements);
    }

    return {
        ok: true,
        placements
    };
}
