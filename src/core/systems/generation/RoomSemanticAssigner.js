import { ROOM_TEMPLATE_REQUIREMENTS } from './GenerationConfig.js';

function normalizeRoleList(roles, fallback = []) {
    if (!Array.isArray(roles) || roles.length === 0) return [...fallback];
    const out = [];
    const seen = new Set();
    for (const role of roles) {
        if (typeof role !== 'string') continue;
        if (seen.has(role)) continue;
        seen.add(role);
        out.push(role);
    }
    return out;
}

export function roomFitsRequirement(room, requirement) {
    return (
        (room.w >= requirement.minW && room.h >= requirement.minH) ||
        (room.w >= requirement.minH && room.h >= requirement.minW)
    );
}

function pickLargestCandidate(candidates) {
    if (candidates.length === 0) return null;
    const sorted = [...candidates].sort((a, b) => b.area - a.area);
    return sorted[0];
}

export function assignRoomSemantics({
    rooms,
    entranceDoor,
    requiredRoles: requiredRolesInput = null,
    preferredRoles: preferredRolesInput = null
}) {
    const defaultRequiredRoles = ['living_room', 'bedroom', 'study'];
    const requiredRoles = normalizeRoleList(requiredRolesInput, defaultRequiredRoles);
    const preferredRoles = normalizeRoleList(preferredRolesInput, [])
        .filter(role => !requiredRoles.includes(role));

    const resultRooms = rooms.map(room => ({ ...room, semantic: null }));
    const byId = new Map(resultRooms.map(room => [room.id, room]));
    const unassigned = new Set(resultRooms.map(room => room.id));
    const assignedRoles = new Set();
    const missingPreferredRoles = [];

    const entranceRoomId = entranceDoor && entranceDoor.connects ? entranceDoor.connects[0] : null;

    for (const role of requiredRoles) {
        const req = ROOM_TEMPLATE_REQUIREMENTS[role];
        if (!req) continue;

        const candidates = resultRooms.filter(room =>
            unassigned.has(room.id) && roomFitsRequirement(room, req)
        );

        if (candidates.length === 0) {
            return {
                ok: false,
                reason: `No candidate room for semantic role: ${role}`
            };
        }

        let picked = null;
        if (role === 'living_room' && entranceRoomId && unassigned.has(entranceRoomId)) {
            const entranceRoom = byId.get(entranceRoomId);
            if (entranceRoom && roomFitsRequirement(entranceRoom, req)) {
                picked = entranceRoom;
            }
        }

        if (!picked) {
            picked = pickLargestCandidate(candidates);
        }

        picked.semantic = role;
        unassigned.delete(picked.id);
        assignedRoles.add(role);
    }

    for (const role of preferredRoles) {
        const req = ROOM_TEMPLATE_REQUIREMENTS[role];
        if (!req) continue;

        const candidates = resultRooms.filter(room =>
            unassigned.has(room.id) && roomFitsRequirement(room, req)
        );

        if (candidates.length === 0) {
            missingPreferredRoles.push(role);
            continue;
        }

        const picked = pickLargestCandidate(candidates);
        if (!picked) {
            missingPreferredRoles.push(role);
            continue;
        }

        picked.semantic = role;
        unassigned.delete(picked.id);
        assignedRoles.add(role);
    }

    if (entranceRoomId && unassigned.has(entranceRoomId) && resultRooms.length >= 5) {
        const entranceRoom = byId.get(entranceRoomId);
        if (entranceRoom && roomFitsRequirement(entranceRoom, ROOM_TEMPLATE_REQUIREMENTS.foyer)) {
            entranceRoom.semantic = 'foyer';
            unassigned.delete(entranceRoom.id);
        }
    }

    for (const roomId of unassigned) {
        const room = byId.get(roomId);
        if (!room) continue;

        const minSide = Math.min(room.w, room.h);
        const maxSide = Math.max(room.w, room.h);
        const aspect = maxSide / Math.max(1, minSide);

        if (aspect >= 2.2 || (minSide <= 3 && room.area <= 18)) {
            room.semantic = 'corridor';
        } else {
            room.semantic = 'storage';
        }
    }

    return {
        ok: true,
        rooms: resultRooms,
        assignedRoles: [...assignedRoles],
        missingPreferredRoles
    };
}
