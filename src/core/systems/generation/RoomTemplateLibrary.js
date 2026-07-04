const ROOM_TEMPLATE_DEFS = [
    ['entry_foyer', 'foyer', 3, 3],
    ['common_living', 'living_room', 4, 4],
    ['common_inn', 'living_room', 5, 4],
    ['bedroom_standard', 'bedroom', 4, 4],
    ['bedroom_compact', 'bedroom', 4, 3],
    ['kitchen_service', 'kitchen', 3, 3],
    ['bathroom_compact', 'bathroom', 3, 3],
    ['study_nook', 'study', 3, 3],
    ['office_front', 'office', 3, 3],
    ['retail_front', 'retail', 4, 4],
    ['workshop_floor', 'workshop', 4, 3],
    ['clinic_bay', 'clinic', 4, 3],
    ['storage_stock', 'storage', 3, 3],
    ['central_hall', 'corridor', 3, 3]
];

export const ROOM_TEMPLATES = Object.freeze(
    Object.fromEntries(
        ROOM_TEMPLATE_DEFS.map(([id, semantic, minW, minH]) => [
            id,
            Object.freeze({ id, semantic, minW, minH })
        ])
    )
);

export function getRoomTemplate(templateId) {
    return ROOM_TEMPLATES[templateId] || null;
}
