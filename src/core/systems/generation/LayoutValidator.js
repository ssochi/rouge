import { ROOM_FURNITURE_TEMPLATES } from './GenerationConfig.js';
import { tileKey } from './GenerationUtils.js';

function validateRoomConnectivity(rooms, doors) {
    if (rooms.length <= 1) return { ok: true };

    const adjacency = new Map();
    for (const room of rooms) {
        adjacency.set(room.id, new Set());
    }

    for (const door of doors) {
        if (door.kind !== 'internal') continue;
        const a = door.connects && door.connects[0];
        const b = door.connects && door.connects[1];
        if (!a || !b) continue;
        if (!adjacency.has(a) || !adjacency.has(b)) {
            return { ok: false, reason: `Door references unknown room: ${a},${b}` };
        }
        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
    }

    const startId = rooms[0].id;
    const visited = new Set([startId]);
    const queue = [startId];

    while (queue.length > 0) {
        const cur = queue.shift();
        for (const next of adjacency.get(cur)) {
            if (!visited.has(next)) {
                visited.add(next);
                queue.push(next);
            }
        }
    }

    if (visited.size !== rooms.length) {
        return {
            ok: false,
            reason: `Room graph disconnected: ${visited.size}/${rooms.length}`
        };
    }

    return { ok: true };
}

function validateFurniture(rooms, furniture) {
    const roomById = new Map(rooms.map(r => [r.id, r]));
    const occupied = new Set();
    const roomItems = new Map();

    for (const item of furniture) {
        const room = roomById.get(item.roomId);
        if (!room) {
            return { ok: false, reason: `Furniture has unknown roomId: ${item.roomId}` };
        }

        if (
            item.x < room.x ||
            item.y < room.y ||
            item.x + item.w > room.x + room.w ||
            item.y + item.h > room.y + room.h
        ) {
            return {
                ok: false,
                reason: `Furniture out of room bounds: ${item.type} in ${item.roomId}`
            };
        }

        for (let y = item.y; y < item.y + item.h; y++) {
            for (let x = item.x; x < item.x + item.w; x++) {
                const key = tileKey(x, y);
                if (occupied.has(key)) {
                    return {
                        ok: false,
                        reason: `Furniture overlap at tile ${key}`
                    };
                }
                occupied.add(key);
            }
        }

        if (!roomItems.has(item.roomId)) {
            roomItems.set(item.roomId, []);
        }
        roomItems.get(item.roomId).push(item.item);
    }

    for (const room of rooms) {
        const template = ROOM_FURNITURE_TEMPLATES[room.semantic] || ROOM_FURNITURE_TEMPLATES.storage;
        const items = roomItems.get(room.id) || [];

        for (const required of template.required) {
            if (!items.includes(required.item)) {
                return {
                    ok: false,
                    reason: `Missing required item ${required.item} in room ${room.id}`
                };
            }
        }
    }

    return { ok: true };
}

function validateDoors(doors) {
    const doorTiles = new Set();
    let entranceCount = 0;

    for (const door of doors) {
        const key = tileKey(door.x, door.y);
        if (doorTiles.has(key)) {
            return {
                ok: false,
                reason: `Duplicated door tile: ${key}`
            };
        }
        doorTiles.add(key);

        if (door.kind === 'entrance') entranceCount++;
    }

    if (entranceCount !== 1) {
        return {
            ok: false,
            reason: `Entrance door count must be 1, got ${entranceCount}`
        };
    }

    return { ok: true };
}

export function validateBuildingLayout({ rooms, doors, furniture }) {
    const semanticsMissing = rooms.some(room => !room.semantic);
    if (semanticsMissing) {
        return {
            ok: false,
            reason: 'Room semantics not fully assigned'
        };
    }

    const doorCheck = validateDoors(doors);
    if (!doorCheck.ok) return doorCheck;

    const connectivityCheck = validateRoomConnectivity(rooms, doors);
    if (!connectivityCheck.ok) return connectivityCheck;

    const furnitureCheck = validateFurniture(rooms, furniture);
    if (!furnitureCheck.ok) return furnitureCheck;

    return { ok: true };
}
