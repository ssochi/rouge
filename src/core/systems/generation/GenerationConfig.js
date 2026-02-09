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
    }
});

export const ROOM_TEMPLATE_REQUIREMENTS = Object.freeze({
    living_room: { minW: 5, minH: 4 },
    bedroom: { minW: 4, minH: 4 },
    study: { minW: 3, minH: 3 },
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
            { item: 'bookshelf', chance: 0.5, requireWall: true }
        ]
    },
    bedroom: {
        required: [
            { item: 'bed', requireWall: true, tag: 'bed' },
            { item: 'nightstand', nearTag: 'bed', tag: 'nightstand' }
        ],
        optional: [
            { item: 'wardrobe', chance: 0.7, requireWall: true },
            { item: 'table', chance: 0.35 }
        ]
    },
    study: {
        required: [
            { item: 'table', requireWall: true, tag: 'desk' },
            { item: 'bookshelf', requireWall: true, preferFarFromTag: 'desk' }
        ],
        optional: [
            { item: 'nightstand', chance: 0.25, requireWall: true }
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
        optional: []
    },
    foyer: {
        required: [],
        optional: [
            { item: 'table', chance: 0.25 }
        ]
    }
});

export const DEFAULT_GENERATION_CONFIG = Object.freeze({
    generation: {
        globalAttempts: 24
    },
    buildings: {
        minCount: 2,
        maxCount: 4,
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
