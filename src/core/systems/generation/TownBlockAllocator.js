import { randomInt } from './GenerationUtils.js';
import { getFacingFootprint, pickBuildingTemplate } from './BuildingTemplateLibrary.js';

function rectFromBounds(left, top, right, bottom) {
    return {
        x: Math.floor(left),
        y: Math.floor(top),
        w: Math.max(0, Math.floor(right - left)),
        h: Math.max(0, Math.floor(bottom - top))
    };
}

function oppositeFacing(facing) {
    switch (facing) {
        case 'north':
            return 'south';
        case 'east':
            return 'west';
        case 'west':
            return 'east';
        default:
            return 'north';
    }
}

function chooseCategory(categoryMix, rng) {
    if (!Array.isArray(categoryMix) || categoryMix.length === 0) {
        return 'residential';
    }

    let total = 0;
    for (const entry of categoryMix) {
        total += Math.max(0, entry.weight || 0);
    }
    if (total <= 0) {
        return categoryMix[0].category;
    }

    let roll = rng() * total;
    for (const entry of categoryMix) {
        roll -= Math.max(0, entry.weight || 0);
        if (roll <= 0) {
            return entry.category;
        }
    }
    return categoryMix[categoryMix.length - 1].category;
}

function densityGap(density, rng) {
    if (density === 'dense') return randomInt(rng, 2, 3);
    if (density === 'medium') return randomInt(rng, 3, 4);
    return randomInt(rng, 4, 6);
}

function desiredCountForBlock(block) {
    if (block.strategy === 'courtyard_cluster') return block.density === 'medium' ? 4 : 3;
    if (block.strategy === 'paired_houses') return block.density === 'sparse' ? 4 : 5;
    if (block.strategy === 'mixed_row') return block.density === 'dense' ? 4 : 3;
    return block.density === 'dense' ? 4 : (block.density === 'medium' ? 3 : 2);
}

function pickTemplateForSlot({
    block,
    facing,
    maxWidth,
    maxHeight,
    categoryMix,
    recentTemplateIds,
    rng
}) {
    const orderedCategories = [
        chooseCategory(categoryMix, rng),
        ...categoryMix.map((entry) => entry.category)
    ].filter((value, index, list) => list.indexOf(value) === index);

    for (const category of orderedCategories) {
        const template = pickBuildingTemplate({
            category,
            districtType: block.type,
            facing,
            maxWidth,
            maxHeight,
            recentTemplateIds,
            rng
        });
        if (template) return template;
    }

    return null;
}

function registerRecent(recentTemplateIds, templateId) {
    recentTemplateIds.push(templateId);
    while (recentTemplateIds.length > 6) {
        recentTemplateIds.shift();
    }
}

function placeSingleRow({
    block,
    rect,
    facing,
    density,
    categoryMix,
    maxBuildings,
    recentTemplateIds,
    rng
}) {
    const placements = [];
    if (!rect || rect.w < 10 || rect.h < 10 || maxBuildings <= 0) return placements;

    const horizontal = facing === 'north' || facing === 'south';
    const spanStart = horizontal ? rect.x : rect.y;
    const spanEnd = horizontal ? (rect.x + rect.w) : (rect.y + rect.h);
    let cursor = spanStart + 1 + randomInt(rng, 0, 1);

    while (cursor < spanEnd - 8 && placements.length < maxBuildings) {
        const remainingSpan = spanEnd - cursor - 1;
        const maxWidth = horizontal ? remainingSpan : rect.w - 2;
        const maxHeight = horizontal ? rect.h - 2 : remainingSpan;

        const template = pickTemplateForSlot({
            block,
            facing,
            maxWidth,
            maxHeight,
            categoryMix,
            recentTemplateIds,
            rng
        });
        if (!template) break;

        const footprint = getFacingFootprint(template, facing);
        let x = rect.x + 1;
        let y = rect.y + 1;

        if (horizontal) {
            x = cursor;
            y = facing === 'north'
                ? rect.y + 1
                : rect.y + rect.h - footprint.height - 1;
        } else {
            x = facing === 'west'
                ? rect.x + 1
                : rect.x + rect.w - footprint.width - 1;
            y = cursor;
        }

        if (x < rect.x + 1 || y < rect.y + 1) break;
        if (x + footprint.width > rect.x + rect.w - 1 || y + footprint.height > rect.y + rect.h - 1) break;

        placements.push({
            templateId: template.id,
            category: template.category,
            facing,
            x,
            y,
            blockId: block.id,
            districtType: block.type
        });
        registerRecent(recentTemplateIds, template.id);

        cursor += (horizontal ? footprint.width : footprint.height) + densityGap(density, rng);
    }

    return placements;
}

function placeMixedRow(block, recentTemplateIds, rng, blockBudget) {
    if (blockBudget <= 0) return [];
    const laneGap = 4;
    const placements = [];
    const facing = block.facing;
    const frontDepth = (facing === 'north' || facing === 'south')
        ? Math.max(12, Math.floor((block.rect.h - laneGap) * 0.5))
        : Math.max(12, Math.floor((block.rect.w - laneGap) * 0.5));

    let frontRect = null;
    let backRect = null;
    if (facing === 'north') {
        frontRect = rectFromBounds(block.rect.x, block.rect.y, block.rect.x + block.rect.w, block.rect.y + frontDepth);
        backRect = rectFromBounds(block.rect.x, block.rect.y + frontDepth + laneGap, block.rect.x + block.rect.w, block.rect.y + block.rect.h);
    } else if (facing === 'south') {
        frontRect = rectFromBounds(block.rect.x, block.rect.y + block.rect.h - frontDepth, block.rect.x + block.rect.w, block.rect.y + block.rect.h);
        backRect = rectFromBounds(block.rect.x, block.rect.y, block.rect.x + block.rect.w, block.rect.y + block.rect.h - frontDepth - laneGap);
    } else if (facing === 'east') {
        frontRect = rectFromBounds(block.rect.x + block.rect.w - frontDepth, block.rect.y, block.rect.x + block.rect.w, block.rect.y + block.rect.h);
        backRect = rectFromBounds(block.rect.x, block.rect.y, block.rect.x + block.rect.w - frontDepth - laneGap, block.rect.y + block.rect.h);
    } else {
        frontRect = rectFromBounds(block.rect.x, block.rect.y, block.rect.x + frontDepth, block.rect.y + block.rect.h);
        backRect = rectFromBounds(block.rect.x + frontDepth + laneGap, block.rect.y, block.rect.x + block.rect.w, block.rect.y + block.rect.h);
    }

    const frontCount = Math.min(blockBudget, 2);
    placements.push(...placeSingleRow({
        block,
        rect: frontRect,
        facing,
        density: block.density,
        categoryMix: block.categoryMix,
        maxBuildings: frontCount,
        recentTemplateIds,
        rng
    }));

    const remaining = blockBudget - placements.length;
    if (remaining > 0) {
        placements.push(...placeSingleRow({
            block,
            rect: backRect,
            facing: oppositeFacing(facing),
            density: 'sparse',
            categoryMix: block.categoryMix,
            maxBuildings: Math.min(remaining, 2),
            recentTemplateIds,
            rng
        }));
    }

    return placements;
}

function placePairedHouses(block, recentTemplateIds, rng, blockBudget) {
    if (blockBudget <= 0) return [];
    const horizontal = block.facing === 'north' || block.facing === 'south';
    const laneGap = 6;

    if (horizontal) {
        const midX = Math.floor(block.rect.x + block.rect.w / 2);
        const leftRect = rectFromBounds(block.rect.x, block.rect.y, midX - Math.floor(laneGap / 2), block.rect.y + block.rect.h);
        const rightRect = rectFromBounds(midX + Math.ceil(laneGap / 2), block.rect.y, block.rect.x + block.rect.w, block.rect.y + block.rect.h);
        return [
            ...placeSingleRow({
                block,
                rect: leftRect,
                facing: block.facing,
                density: 'sparse',
                categoryMix: block.categoryMix,
                maxBuildings: Math.min(2, blockBudget),
                recentTemplateIds,
                rng
            }),
            ...placeSingleRow({
                block,
                rect: rightRect,
                facing: block.facing,
                density: 'sparse',
                categoryMix: block.categoryMix,
                maxBuildings: Math.min(2, Math.max(0, blockBudget - 2)),
                recentTemplateIds,
                rng
            })
        ];
    }

    const midY = Math.floor(block.rect.y + block.rect.h / 2);
    const topRect = rectFromBounds(block.rect.x, block.rect.y, block.rect.x + block.rect.w, midY - Math.floor(laneGap / 2));
    const bottomRect = rectFromBounds(block.rect.x, midY + Math.ceil(laneGap / 2), block.rect.x + block.rect.w, block.rect.y + block.rect.h);
    return [
        ...placeSingleRow({
            block,
            rect: topRect,
            facing: block.facing,
            density: 'sparse',
            categoryMix: block.categoryMix,
            maxBuildings: Math.min(2, blockBudget),
            recentTemplateIds,
            rng
        }),
        ...placeSingleRow({
            block,
            rect: bottomRect,
            facing: block.facing,
            density: 'sparse',
            categoryMix: block.categoryMix,
            maxBuildings: Math.min(2, Math.max(0, blockBudget - 2)),
            recentTemplateIds,
            rng
        })
    ];
}

function placeCourtyardCluster(block, recentTemplateIds, rng, blockBudget) {
    if (blockBudget <= 0) return [];
    const courtInset = 10;
    const courtRect = rectFromBounds(
        block.rect.x + courtInset,
        block.rect.y + courtInset,
        block.rect.x + block.rect.w - courtInset,
        block.rect.y + block.rect.h - courtInset
    );

    const strips = [
        {
            rect: rectFromBounds(block.rect.x, block.rect.y, block.rect.x + block.rect.w, Math.max(block.rect.y + 12, courtRect.y - 2)),
            facing: 'south'
        },
        {
            rect: rectFromBounds(block.rect.x, Math.min(block.rect.y + block.rect.h - 12, courtRect.y + courtRect.h + 2), block.rect.x + block.rect.w, block.rect.y + block.rect.h),
            facing: 'north'
        },
        {
            rect: rectFromBounds(block.rect.x, block.rect.y, Math.max(block.rect.x + 12, courtRect.x - 2), block.rect.y + block.rect.h),
            facing: 'east'
        },
        {
            rect: rectFromBounds(Math.min(block.rect.x + block.rect.w - 12, courtRect.x + courtRect.w + 2), block.rect.y, block.rect.x + block.rect.w, block.rect.y + block.rect.h),
            facing: 'west'
        }
    ];

    const placements = [];
    for (const strip of strips) {
        if (placements.length >= blockBudget) break;
        placements.push(...placeSingleRow({
            block,
            rect: strip.rect,
            facing: strip.facing,
            density: 'sparse',
            categoryMix: block.categoryMix,
            maxBuildings: 1,
            recentTemplateIds,
            rng
        }));
    }
    return placements.slice(0, blockBudget);
}

export function allocateTownBuildings({ blocks, rng = Math.random }) {
    const placements = [];
    const recentTemplateIds = [];
    let remainingBudget = 34 + randomInt(rng, -2, 4);

    for (const block of blocks) {
        if (remainingBudget <= 0) break;

        const blockBudget = Math.min(remainingBudget, desiredCountForBlock(block));
        let blockPlacements = [];

        if (block.strategy === 'mixed_row') {
            blockPlacements = placeMixedRow(block, recentTemplateIds, rng, blockBudget);
        } else if (block.strategy === 'paired_houses') {
            blockPlacements = placePairedHouses(block, recentTemplateIds, rng, blockBudget);
        } else if (block.strategy === 'courtyard_cluster') {
            blockPlacements = placeCourtyardCluster(block, recentTemplateIds, rng, blockBudget);
        } else {
            blockPlacements = placeSingleRow({
                block,
                rect: block.rect,
                facing: block.facing,
                density: block.density,
                categoryMix: block.categoryMix,
                maxBuildings: blockBudget,
                recentTemplateIds,
                rng
            });
        }

        if (blockPlacements.length === 0) continue;

        placements.push(...blockPlacements);
        remainingBudget -= blockPlacements.length;
    }

    return placements;
}
