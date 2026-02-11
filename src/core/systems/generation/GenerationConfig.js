export const FURNITURE_CATALOG = Object.freeze({
    sofa: {
        variants: [{ type: 'sofa', w: 2, h: 1 }]
    },
    tv_stand: {
        variants: [{ type: 'tv_stand', w: 2, h: 1 }]
    },
    table: {
        variants: [{ type: 'table', w: 1, h: 1 }]
    },
    bookshelf: {
        variants: [{ type: 'bookshelf', w: 1, h: 1 }]
    },
    bed: {
        variants: [
            { type: 'bed', w: 1, h: 2 },
            { type: 'bed_h', w: 2, h: 1 }
        ]
    },
    nightstand: {
        variants: [{ type: 'nightstand', w: 1, h: 1 }]
    },
    wardrobe: {
        variants: [{ type: 'wardrobe', w: 1, h: 1 }]
    },
    toilet: {
        variants: [{ type: 'toilet', w: 1, h: 1 }]
    },
    bathtub: {
        variants: [{ type: 'bathtub', w: 2, h: 1 }]
    },
    sink: {
        variants: [{ type: 'sink', w: 1, h: 1 }]
    },
    armchair: {
        variants: [{ type: 'armchair', w: 1, h: 1 }]
    },
    floor_lamp: {
        variants: [{ type: 'floor_lamp', w: 1, h: 1 }]
    },
    potted_plant: {
        variants: [{ type: 'potted_plant', w: 1, h: 1 }]
    },
    cabinet: {
        variants: [{ type: 'cabinet', w: 2, h: 1 }]
    },
    fridge: {
        variants: [{ type: 'fridge', w: 1, h: 1 }]
    },
    stove: {
        variants: [{ type: 'stove', w: 1, h: 1 }]
    },
    kitchen_counter: {
        variants: [{ type: 'kitchen_counter', w: 2, h: 1 }]
    },
    kitchen_sink: {
        variants: [{ type: 'kitchen_sink', w: 1, h: 1 }]
    }
});

export const ROOM_TEMPLATE_REQUIREMENTS = Object.freeze({
    living_room: { minW: 5, minH: 4 },
    bedroom: { minW: 4, minH: 4 },
    study: { minW: 3, minH: 3 },
    bathroom: { minW: 3, minH: 3 },
    kitchen: { minW: 3, minH: 3 },
    storage: { minW: 3, minH: 3 },
    corridor: { minW: 2, minH: 3 },
    foyer: { minW: 3, minH: 3 }
});

export const ROOM_FURNITURE_TEMPLATES = Object.freeze({
    living_room: {
        required: [
            { item: 'sofa', requireWall: true, tag: 'sofa' },
            { item: 'tv_stand', requireWall: true, preferFarFromTag: 'sofa', tag: 'tv' }
        ],
        optional: [
            { item: 'table', chance: 0.6, preferCenter: true },
            { item: 'bookshelf', chance: 0.5, requireWall: true },
            { item: 'armchair', chance: 0.4 },
            { item: 'floor_lamp', chance: 0.35, nearTag: 'sofa' },
            { item: 'potted_plant', chance: 0.3, nearTag: 'sofa' },
            { item: 'cabinet', chance: 0.3, requireWall: true }
        ]
    },
    bedroom: {
        required: [
            { item: 'bed', requireWall: true, tag: 'bed' },
            { item: 'nightstand', nearTag: 'bed', tag: 'nightstand' }
        ],
        optional: [
            { item: 'wardrobe', chance: 0.7, requireWall: true },
            { item: 'table', chance: 0.35 },
            { item: 'floor_lamp', chance: 0.25, nearTag: 'nightstand' }
        ]
    },
    study: {
        required: [
            { item: 'table', requireWall: true, tag: 'desk' },
            { item: 'bookshelf', requireWall: true, preferFarFromTag: 'desk' }
        ],
        optional: [
            { item: 'nightstand', chance: 0.25, requireWall: true },
            { item: 'armchair', chance: 0.3 },
            { item: 'potted_plant', chance: 0.25, nearTag: 'desk' }
        ]
    },
    storage: {
        required: [],
        optional: [
            { item: 'bookshelf', chance: 0.8, requireWall: true },
            { item: 'wardrobe', chance: 0.45, requireWall: true }
        ]
    },
    corridor: {
        required: [],
        optional: [
            { item: 'cabinet', chance: 0.2, requireWall: true }
        ]
    },
    foyer: {
        required: [],
        optional: [
            { item: 'table', chance: 0.25, tag: 'foyer_table' },
            { item: 'potted_plant', chance: 0.35, nearTag: 'foyer_table' }
        ]
    },
    bathroom: {
        required: [
            { item: 'toilet', requireWall: true, tag: 'toilet' }
        ],
        optional: [
            { item: 'bathtub', chance: 0.5, requireWall: true, preferFarFromTag: 'toilet' },
            { item: 'sink', chance: 0.6, requireWall: true, nearTag: 'toilet' }
        ]
    },
    kitchen: {
        required: [
            { item: 'fridge', requireWall: true, tag: 'fridge' },
            { item: 'stove', requireWall: true, preferFarFromTag: 'fridge', tag: 'stove' }
        ],
        optional: [
            { item: 'kitchen_counter', chance: 0.5, requireWall: true },
            { item: 'kitchen_sink', chance: 0.55, requireWall: true, nearTag: 'stove' }
        ]
    }
});

export const DEFAULT_GENERATION_CONFIG = Object.freeze({
    generation: {
        globalAttempts: 240
    },
    buildings: {
        minCount: 6,
        maxCount: 12,
        minWidth: 10,
        maxWidth: 16,
        minHeight: 8,
        maxHeight: 14,
        edgePadding: 3,
        gap: 2,
        placementAttempts: 300
    },
    rooms: {
        minSize: 3,
        targetMin: 4,
        targetMax: 8,
        splitAttempts: 80
    },
    doors: {
        edgeMargin: 1,
        maxExtraInternalPerBuilding: 2,
        largeRoomAreaThreshold: 56,
        maxDoorsForLargePair: 2
    },
    furniture: {
        roomPlacementAttempts: 8,
        doorClearanceDepth: 2,
        minWalkableRatio: 0.35
    },
    semantic: {
        // Per-building semantic retries before the whole attempt is abandoned.
        maxSemanticAttemptsPerBuilding: 8,
        // Interior area thresholds (excluding outer walls) for tiering.
        tierThresholds: {
            smallMaxInteriorArea: 70,
            mediumMaxInteriorArea: 115
        },
        // Required semantic roles by building tier.
        tierRequiredRoles: {
            small: ['living_room', 'bedroom'],
            medium: ['living_room', 'bedroom'],
            large: ['living_room', 'bedroom', 'study']
        },
        // Preferred roles are attempted but non-fatal for a single building.
        tierPreferredRoles: {
            small: ['study'],
            medium: ['study', 'bathroom', 'kitchen'],
            large: ['bathroom', 'kitchen']
        },
        // Map-level semantic quality guarantees.
        globalRoleQuota: {
            living_room: { minCount: 2, minRatio: 0.95 },
            bedroom: { minCount: 2, minRatio: 0.95 },
            study: { minCount: 2, minRatio: 0.35 }
        },
        // Candidate semantics that can be promoted to satisfy global quota.
        promotionSourceSemantics: ['storage', 'corridor', 'foyer']
    },
    outdoor: {
        treeChance: 0.06,
        treeSmallChance: 0.08,
        bushChance: 0.10,
        grassChance: 0.12,
        buildingBuffer: 4,
        minSpacing: 1,
        clutterEnabled: true,
        clutterChanceNearBuilding: 0.025,
        clutterNearBuildingMinDist: 4,
        clutterNearBuildingMaxDist: 8,
        clutterMaxSearchDist: 14,
        clutterSearchExpandStep: 2,
        clutterMinSpacing: 2,
        clutterMinCount: 6,
        clutterTypes: ['box', 'barrel', 'vase'],
        clutterWeights: {
            box: 0.4,
            barrel: 0.35,
            vase: 0.25
        }
    },
    reservedRects: [
        // Keep the construction-map return portal neighborhood clear.
        { x: 1, y: 1, w: 8, h: 8 }
    ]
});
