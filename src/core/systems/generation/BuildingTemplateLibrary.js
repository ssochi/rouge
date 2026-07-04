function room(alias, x, y, w, h) {
    return { alias, x, y, w, h };
}

function door(kind, type, x, y, connects) {
    return { kind, type, x, y, connects };
}

const SHAPES = Object.freeze({
    cottage_grid: Object.freeze({
        footprintW: 14,
        footprintH: 10,
        rooms: [
            room('frontLeft', 1, 1, 5, 4),
            room('frontRight', 7, 1, 4, 4),
            room('rearLeft', 1, 6, 3, 3),
            room('rearMid', 5, 6, 3, 3),
            room('rearRight', 9, 6, 4, 3)
        ],
        doors: [
            door('entrance', 'door_h', 2, 9, ['rearLeft']),
            door('internal', 'door_h', 2, 5, ['rearLeft', 'frontLeft']),
            door('internal', 'door_v', 4, 7, ['rearLeft', 'rearMid']),
            door('internal', 'door_v', 8, 7, ['rearMid', 'rearRight']),
            door('internal', 'door_v', 6, 3, ['frontLeft', 'frontRight'])
        ]
    }),
    hall_cross: Object.freeze({
        footprintW: 15,
        footprintH: 11,
        rooms: [
            room('northWest', 1, 1, 4, 4),
            room('northCenter', 6, 1, 3, 4),
            room('northEast', 10, 1, 4, 4),
            room('southWest', 1, 6, 4, 4),
            room('southCenter', 6, 6, 3, 4),
            room('southEast', 10, 6, 4, 4)
        ],
        doors: [
            door('entrance', 'door_h', 7, 10, ['southCenter']),
            door('internal', 'door_h', 7, 5, ['northCenter', 'southCenter']),
            door('internal', 'door_v', 5, 3, ['northWest', 'northCenter']),
            door('internal', 'door_v', 9, 3, ['northCenter', 'northEast']),
            door('internal', 'door_v', 5, 7, ['southWest', 'southCenter']),
            door('internal', 'door_v', 9, 7, ['southCenter', 'southEast'])
        ]
    }),
    frontage_row: Object.freeze({
        footprintW: 16,
        footprintH: 10,
        rooms: [
            room('frontHall', 1, 1, 14, 4),
            room('backLeft', 1, 6, 4, 3),
            room('backCenter', 6, 6, 3, 3),
            room('backRight', 10, 6, 5, 3)
        ],
        doors: [
            door('entrance', 'door_h', 7, 9, ['backCenter']),
            door('internal', 'door_h', 7, 5, ['frontHall', 'backCenter']),
            door('internal', 'door_v', 5, 7, ['backLeft', 'backCenter']),
            door('internal', 'door_v', 9, 7, ['backCenter', 'backRight'])
        ]
    }),
    family_block: Object.freeze({
        footprintW: 16,
        footprintH: 12,
        rooms: [
            room('northWest', 1, 1, 5, 4),
            room('northCenter', 7, 1, 3, 4),
            room('northEast', 11, 1, 4, 4),
            room('southWest', 1, 6, 5, 5),
            room('southCenter', 7, 6, 3, 5),
            room('southEast', 11, 6, 4, 5)
        ],
        doors: [
            door('entrance', 'door_h', 8, 11, ['southCenter']),
            door('internal', 'door_h', 8, 5, ['northCenter', 'southCenter']),
            door('internal', 'door_v', 6, 3, ['northWest', 'northCenter']),
            door('internal', 'door_v', 10, 3, ['northCenter', 'northEast']),
            door('internal', 'door_v', 6, 8, ['southWest', 'southCenter']),
            door('internal', 'door_v', 10, 8, ['southCenter', 'southEast'])
        ]
    }),
    compact_frontage: Object.freeze({
        footprintW: 13,
        footprintH: 10,
        rooms: [
            room('frontHall', 1, 1, 11, 4),
            room('backLeft', 1, 6, 3, 3),
            room('backCenter', 5, 6, 3, 3),
            room('backRight', 9, 6, 3, 3)
        ],
        doors: [
            door('entrance', 'door_h', 6, 9, ['backCenter']),
            door('internal', 'door_h', 6, 5, ['frontHall', 'backCenter']),
            door('internal', 'door_v', 4, 7, ['backLeft', 'backCenter']),
            door('internal', 'door_v', 8, 7, ['backCenter', 'backRight'])
        ]
    }),
    warehouse_split: Object.freeze({
        footprintW: 14,
        footprintH: 11,
        rooms: [
            room('mainBay', 1, 1, 7, 5),
            room('topRight', 9, 1, 4, 4),
            room('frontLeft', 1, 7, 3, 3),
            room('frontRight', 5, 7, 6, 3)
        ],
        doors: [
            door('entrance', 'door_h', 2, 10, ['frontLeft']),
            door('internal', 'door_h', 2, 6, ['mainBay', 'frontLeft']),
            door('internal', 'door_v', 4, 8, ['frontLeft', 'frontRight']),
            door('internal', 'door_v', 8, 3, ['mainBay', 'topRight'])
        ]
    })
});

function buildTemplate({
    id,
    shapeId,
    category,
    districtAffinity,
    roomMap,
    weight = 1
}) {
    const shape = SHAPES[shapeId];
    if (!shape) {
        throw new Error(`Unknown building shape: ${shapeId}`);
    }

    return Object.freeze({
        id,
        shapeId,
        category,
        weight,
        districtAffinity,
        footprintW: shape.footprintW,
        footprintH: shape.footprintH,
        rooms: shape.rooms.map((item) => ({
            ...item,
            roomTemplateId: roomMap[item.alias]
        })),
        doors: shape.doors.map((item) => ({ ...item }))
    });
}

export const BUILDING_TEMPLATES = Object.freeze([
    buildTemplate({
        id: 'house_cottage_a',
        shapeId: 'cottage_grid',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            frontLeft: 'common_living',
            frontRight: 'bedroom_standard',
            rearLeft: 'entry_foyer',
            rearMid: 'kitchen_service',
            rearRight: 'bathroom_compact'
        }
    }),
    buildTemplate({
        id: 'house_cottage_b',
        shapeId: 'cottage_grid',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            frontLeft: 'common_living',
            frontRight: 'study_nook',
            rearLeft: 'entry_foyer',
            rearMid: 'kitchen_service',
            rearRight: 'storage_stock'
        },
        weight: 0.95
    }),
    buildTemplate({
        id: 'house_cottage_c',
        shapeId: 'cottage_grid',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            frontLeft: 'bedroom_standard',
            frontRight: 'common_living',
            rearLeft: 'entry_foyer',
            rearMid: 'kitchen_service',
            rearRight: 'bathroom_compact'
        },
        weight: 0.85
    }),
    buildTemplate({
        id: 'house_longhall_a',
        shapeId: 'hall_cross',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            northWest: 'common_living',
            northCenter: 'study_nook',
            northEast: 'bedroom_standard',
            southWest: 'kitchen_service',
            southCenter: 'entry_foyer',
            southEast: 'bathroom_compact'
        }
    }),
    buildTemplate({
        id: 'house_longhall_b',
        shapeId: 'hall_cross',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            northWest: 'bedroom_standard',
            northCenter: 'study_nook',
            northEast: 'common_living',
            southWest: 'bedroom_compact',
            southCenter: 'entry_foyer',
            southEast: 'bathroom_compact'
        },
        weight: 0.9
    }),
    buildTemplate({
        id: 'house_duplex_a',
        shapeId: 'hall_cross',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            northWest: 'bedroom_standard',
            northCenter: 'central_hall',
            northEast: 'bedroom_standard',
            southWest: 'common_living',
            southCenter: 'entry_foyer',
            southEast: 'bathroom_compact'
        },
        weight: 0.85
    }),
    buildTemplate({
        id: 'house_family_a',
        shapeId: 'family_block',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            northWest: 'common_living',
            northCenter: 'study_nook',
            northEast: 'bedroom_standard',
            southWest: 'bedroom_standard',
            southCenter: 'entry_foyer',
            southEast: 'kitchen_service'
        }
    }),
    buildTemplate({
        id: 'house_family_b',
        shapeId: 'family_block',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            northWest: 'common_living',
            northCenter: 'central_hall',
            northEast: 'bedroom_standard',
            southWest: 'kitchen_service',
            southCenter: 'entry_foyer',
            southEast: 'bedroom_standard'
        }
    }),
    buildTemplate({
        id: 'house_compact_a',
        shapeId: 'frontage_row',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            frontHall: 'common_living',
            backLeft: 'bedroom_compact',
            backCenter: 'entry_foyer',
            backRight: 'kitchen_service'
        },
        weight: 0.9
    }),
    buildTemplate({
        id: 'house_compact_b',
        shapeId: 'compact_frontage',
        category: 'residential',
        districtAffinity: ['mixed_residential', 'residential_outer'],
        roomMap: {
            frontHall: 'common_living',
            backLeft: 'bedroom_compact',
            backCenter: 'entry_foyer',
            backRight: 'bathroom_compact'
        },
        weight: 0.8
    }),
    buildTemplate({
        id: 'shop_frontage_a',
        shapeId: 'frontage_row',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'mixed_residential'],
        roomMap: {
            frontHall: 'retail_front',
            backLeft: 'storage_stock',
            backCenter: 'entry_foyer',
            backRight: 'office_front'
        }
    }),
    buildTemplate({
        id: 'shop_frontage_b',
        shapeId: 'frontage_row',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'mixed_residential'],
        roomMap: {
            frontHall: 'retail_front',
            backLeft: 'storage_stock',
            backCenter: 'entry_foyer',
            backRight: 'workshop_floor'
        }
    }),
    buildTemplate({
        id: 'corner_store_a',
        shapeId: 'compact_frontage',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'mixed_residential'],
        roomMap: {
            frontHall: 'retail_front',
            backLeft: 'storage_stock',
            backCenter: 'entry_foyer',
            backRight: 'office_front'
        },
        weight: 0.9
    }),
    buildTemplate({
        id: 'workshop_store_a',
        shapeId: 'cottage_grid',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'service_edge'],
        roomMap: {
            frontLeft: 'retail_front',
            frontRight: 'office_front',
            rearLeft: 'entry_foyer',
            rearMid: 'storage_stock',
            rearRight: 'workshop_floor'
        }
    }),
    buildTemplate({
        id: 'inn_small_a',
        shapeId: 'family_block',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'mixed_residential'],
        roomMap: {
            northWest: 'common_inn',
            northCenter: 'office_front',
            northEast: 'bedroom_standard',
            southWest: 'bedroom_standard',
            southCenter: 'entry_foyer',
            southEast: 'kitchen_service'
        },
        weight: 0.8
    }),
    buildTemplate({
        id: 'clinic_house_a',
        shapeId: 'family_block',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'mixed_residential'],
        roomMap: {
            northWest: 'clinic_bay',
            northCenter: 'office_front',
            northEast: 'storage_stock',
            southWest: 'clinic_bay',
            southCenter: 'entry_foyer',
            southEast: 'bathroom_compact'
        },
        weight: 0.75
    }),
    buildTemplate({
        id: 'arcade_office_a',
        shapeId: 'hall_cross',
        category: 'commercial',
        districtAffinity: ['main_street_commercial'],
        roomMap: {
            northWest: 'retail_front',
            northCenter: 'office_front',
            northEast: 'retail_front',
            southWest: 'storage_stock',
            southCenter: 'entry_foyer',
            southEast: 'office_front'
        },
        weight: 0.75
    }),
    buildTemplate({
        id: 'cafe_row_a',
        shapeId: 'frontage_row',
        category: 'commercial',
        districtAffinity: ['main_street_commercial', 'mixed_residential'],
        roomMap: {
            frontHall: 'common_inn',
            backLeft: 'kitchen_service',
            backCenter: 'entry_foyer',
            backRight: 'storage_stock'
        },
        weight: 0.85
    }),
    buildTemplate({
        id: 'warehouse_a',
        shapeId: 'warehouse_split',
        category: 'service',
        districtAffinity: ['service_edge'],
        roomMap: {
            mainBay: 'storage_stock',
            topRight: 'office_front',
            frontLeft: 'entry_foyer',
            frontRight: 'workshop_floor'
        }
    }),
    buildTemplate({
        id: 'warehouse_b',
        shapeId: 'warehouse_split',
        category: 'service',
        districtAffinity: ['service_edge'],
        roomMap: {
            mainBay: 'workshop_floor',
            topRight: 'office_front',
            frontLeft: 'entry_foyer',
            frontRight: 'storage_stock'
        }
    }),
    buildTemplate({
        id: 'guard_post_a',
        shapeId: 'compact_frontage',
        category: 'service',
        districtAffinity: ['service_edge', 'mixed_residential'],
        roomMap: {
            frontHall: 'office_front',
            backLeft: 'storage_stock',
            backCenter: 'entry_foyer',
            backRight: 'bathroom_compact'
        },
        weight: 0.85
    }),
    buildTemplate({
        id: 'utility_house_a',
        shapeId: 'compact_frontage',
        category: 'service',
        districtAffinity: ['service_edge', 'residential_outer'],
        roomMap: {
            frontHall: 'workshop_floor',
            backLeft: 'storage_stock',
            backCenter: 'entry_foyer',
            backRight: 'bathroom_compact'
        },
        weight: 0.9
    }),
    buildTemplate({
        id: 'repair_depot_a',
        shapeId: 'hall_cross',
        category: 'service',
        districtAffinity: ['service_edge'],
        roomMap: {
            northWest: 'workshop_floor',
            northCenter: 'office_front',
            northEast: 'storage_stock',
            southWest: 'storage_stock',
            southCenter: 'entry_foyer',
            southEast: 'workshop_floor'
        }
    }),
    buildTemplate({
        id: 'storage_yard_office_a',
        shapeId: 'hall_cross',
        category: 'service',
        districtAffinity: ['service_edge', 'mixed_residential'],
        roomMap: {
            northWest: 'storage_stock',
            northCenter: 'office_front',
            northEast: 'storage_stock',
            southWest: 'workshop_floor',
            southCenter: 'entry_foyer',
            southEast: 'bathroom_compact'
        },
        weight: 0.9
    })
]);

const BUILDING_TEMPLATE_MAP = new Map(BUILDING_TEMPLATES.map((template) => [template.id, template]));

export function getBuildingTemplate(templateId) {
    return BUILDING_TEMPLATE_MAP.get(templateId) || null;
}

export function getFacingFootprint(template, facing = 'south') {
    if (!template) {
        return { width: 0, height: 0 };
    }
    const swap = facing === 'east' || facing === 'west';
    return {
        width: swap ? template.footprintH : template.footprintW,
        height: swap ? template.footprintW : template.footprintH
    };
}

export function pickBuildingTemplate({
    category,
    districtType,
    facing = 'south',
    maxWidth,
    maxHeight,
    rng = Math.random,
    recentTemplateIds = []
}) {
    const recentSet = new Set(recentTemplateIds);
    const candidates = BUILDING_TEMPLATES
        .map((template) => {
            const footprint = getFacingFootprint(template, facing);
            return { template, footprint };
        })
        .filter(({ template, footprint }) => {
            if (template.category !== category) return false;
            if (footprint.width > maxWidth || footprint.height > maxHeight) return false;
            return true;
        });

    if (candidates.length === 0) return null;

    let totalWeight = 0;
    const weighted = candidates.map((entry) => {
        let weight = entry.template.weight || 1;
        if (Array.isArray(entry.template.districtAffinity) && entry.template.districtAffinity.includes(districtType)) {
            weight *= 1.35;
        }
        if (recentSet.has(entry.template.id)) {
            weight *= 0.45;
        }
        totalWeight += weight;
        return { ...entry, weight };
    });

    let roll = rng() * totalWeight;
    for (const entry of weighted) {
        roll -= entry.weight;
        if (roll <= 0) {
            return entry.template;
        }
    }

    return weighted[weighted.length - 1].template;
}
