import { tileKey } from './GenerationUtils.js';
import { getRoomTemplate } from './RoomTemplateLibrary.js';
import { placeFurnitureForBuilding } from './FurniturePlacer.js';
import { validateBuildingLayout } from './LayoutValidator.js';
import { getFacingFootprint } from './BuildingTemplateLibrary.js';

function rotationForFacing(facing) {
    switch (facing) {
        case 'east':
            return 90;
        case 'north':
            return 180;
        case 'west':
            return 270;
        default:
            return 0;
    }
}

function rotatePoint(x, y, width, height, rotation) {
    switch (rotation) {
        case 90:
            return { x: height - 1 - y, y: x };
        case 180:
            return { x: width - 1 - x, y: height - 1 - y };
        case 270:
            return { x: y, y: width - 1 - x };
        default:
            return { x, y };
    }
}

function rotateRect(x, y, w, h, width, height, rotation) {
    switch (rotation) {
        case 90:
            return { x: height - (y + h), y: x, w: h, h: w };
        case 180:
            return { x: width - (x + w), y: height - (y + h), w, h };
        case 270:
            return { x: y, y: width - (x + w), w: h, h: w };
        default:
            return { x, y, w, h };
    }
}

function rotateDoorType(type, rotation) {
    if (rotation !== 90 && rotation !== 270) return type;
    if (type === 'door_h') return 'door_v';
    if (type === 'door_v') return 'door_h';
    return type;
}

function computeEntranceOutside(worldX, worldY, facing) {
    switch (facing) {
        case 'north':
            return { x: worldX, y: worldY - 1 };
        case 'east':
            return { x: worldX + 1, y: worldY };
        case 'west':
            return { x: worldX - 1, y: worldY };
        default:
            return { x: worldX, y: worldY + 1 };
    }
}

export function assembleBuildingPlan({
    template,
    x,
    y,
    facing = 'south',
    buildingId,
    config,
    rng = Math.random
}) {
    if (!template) {
        return { ok: false, reason: 'Missing building template' };
    }

    const rotation = rotationForFacing(facing);
    const footprint = getFacingFootprint(template, facing);
    const aliasToRoomId = new Map();
    const roomTileSet = new Set();
    const rooms = [];

    for (const roomDef of template.rooms) {
        const roomTemplate = getRoomTemplate(roomDef.roomTemplateId);
        if (!roomTemplate) {
            return {
                ok: false,
                reason: `Unknown room template ${roomDef.roomTemplateId} in ${template.id}`
            };
        }
        if (roomDef.w < roomTemplate.minW || roomDef.h < roomTemplate.minH) {
            return {
                ok: false,
                reason: `Room ${roomDef.alias} is smaller than ${roomTemplate.id} minimum`
            };
        }

        const localRect = rotateRect(
            roomDef.x,
            roomDef.y,
            roomDef.w,
            roomDef.h,
            template.footprintW,
            template.footprintH,
            rotation
        );
        const roomId = `${buildingId}_${roomDef.alias}`;
        aliasToRoomId.set(roomDef.alias, roomId);

        for (let ty = localRect.y; ty < localRect.y + localRect.h; ty++) {
            for (let tx = localRect.x; tx < localRect.x + localRect.w; tx++) {
                const key = tileKey(tx, ty);
                if (roomTileSet.has(key)) {
                    return {
                        ok: false,
                        reason: `Overlapping room tiles in template ${template.id}`
                    };
                }
                roomTileSet.add(key);
            }
        }

        rooms.push({
            id: roomId,
            buildingId,
            x: x + localRect.x,
            y: y + localRect.y,
            w: localRect.w,
            h: localRect.h,
            area: localRect.w * localRect.h,
            semantic: roomTemplate.semantic
        });
    }

    const wallTiles = new Set();
    for (let localY = 0; localY < footprint.height; localY++) {
        for (let localX = 0; localX < footprint.width; localX++) {
            if (roomTileSet.has(tileKey(localX, localY))) continue;
            wallTiles.add(tileKey(x + localX, y + localY));
        }
    }

    const doors = [];
    let entranceDoor = null;

    for (const doorDef of template.doors) {
        const localPoint = rotatePoint(
            doorDef.x,
            doorDef.y,
            template.footprintW,
            template.footprintH,
            rotation
        );
        const worldX = x + localPoint.x;
        const worldY = y + localPoint.y;
        wallTiles.delete(tileKey(worldX, worldY));

        const connects = (doorDef.connects || []).map((alias) => (
            alias ? aliasToRoomId.get(alias) || null : null
        ));
        const doorEntry = {
            x: worldX,
            y: worldY,
            type: rotateDoorType(doorDef.type, rotation),
            kind: doorDef.kind,
            buildingId,
            connects
        };

        if (doorDef.kind === 'entrance') {
            doorEntry.outside = computeEntranceOutside(worldX, worldY, facing);
            entranceDoor = doorEntry;
        }

        doors.push(doorEntry);
    }

    const furnitureResult = placeFurnitureForBuilding({
        rooms,
        doors,
        config,
        rng
    });

    if (!furnitureResult.ok) {
        return furnitureResult;
    }

    const validation = validateBuildingLayout({
        rooms,
        doors,
        furniture: furnitureResult.placements
    });
    if (!validation.ok) {
        return validation;
    }

    return {
        ok: true,
        buildingPlan: {
            id: buildingId,
            templateId: template.id,
            category: template.category,
            facing,
            x,
            y,
            w: footprint.width,
            h: footprint.height,
            rooms,
            wallTiles,
            doors,
            entranceDoor,
            furniture: furnitureResult.placements
        }
    };
}
