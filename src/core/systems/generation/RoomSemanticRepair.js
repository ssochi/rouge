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

function roomFitsRequirement(room, requirement) {
    if (!room || !requirement) return false;
    return (
        (room.w >= requirement.minW && room.h >= requirement.minH) ||
        (room.w >= requirement.minH && room.h >= requirement.minW)
    );
}

function getInteriorArea(footprint) {
    const iw = Math.max(1, (footprint.w || 0) - 2);
    const ih = Math.max(1, (footprint.h || 0) - 2);
    return iw * ih;
}

function getTierThresholds(config) {
    const thresholds = config?.semantic?.tierThresholds || {};
    return {
        smallMaxInteriorArea: Number.isFinite(thresholds.smallMaxInteriorArea) ? thresholds.smallMaxInteriorArea : 70,
        mediumMaxInteriorArea: Number.isFinite(thresholds.mediumMaxInteriorArea) ? thresholds.mediumMaxInteriorArea : 115
    };
}

function buildRoleCounts(buildingPlans) {
    const counts = new Map();
    for (const building of buildingPlans) {
        for (const room of building.rooms || []) {
            if (!room || !room.semantic) continue;
            counts.set(room.semantic, (counts.get(room.semantic) || 0) + 1);
        }
    }
    return counts;
}

export function resolveBuildingSemanticProfile({ footprint, config }) {
    const tierRules = config?.semantic?.tierRequiredRoles || {};
    const preferredRules = config?.semantic?.tierPreferredRoles || {};
    const thresholds = getTierThresholds(config);
    const interiorArea = getInteriorArea(footprint);

    let tier = 'large';
    if (interiorArea <= thresholds.smallMaxInteriorArea) {
        tier = 'small';
    } else if (interiorArea <= thresholds.mediumMaxInteriorArea) {
        tier = 'medium';
    }

    const requiredFallback = ['living_room', 'bedroom', 'study'];
    const requiredRoles = normalizeRoleList(tierRules[tier], requiredFallback);
    const preferredRoles = normalizeRoleList(preferredRules[tier], [])
        .filter(role => !requiredRoles.includes(role));

    return {
        tier,
        interiorArea,
        requiredRoles,
        preferredRoles
    };
}

export function computeGlobalRoleQuota({ buildingCount, config }) {
    const quotaConfig = config?.semantic?.globalRoleQuota || {};
    const out = new Map();

    for (const [role, settings] of Object.entries(quotaConfig)) {
        const minCount = Number.isFinite(settings?.minCount) ? settings.minCount : 0;
        const minRatio = Number.isFinite(settings?.minRatio) ? settings.minRatio : 0;
        const byRatio = Math.ceil(Math.max(0, buildingCount) * Math.max(0, minRatio));
        const target = Math.max(0, minCount, byRatio);
        if (target > 0) {
            out.set(role, target);
        }
    }

    return out;
}

function collectPromotionCandidates({ buildingPlans, role, sourceSemantics }) {
    const req = ROOM_TEMPLATE_REQUIREMENTS[role];
    if (!req) return [];

    const candidates = [];

    for (const building of buildingPlans) {
        const hasRole = (building.rooms || []).some(room => room.semantic === role);
        const tier = building.semanticTier || 'medium';

        for (const room of building.rooms || []) {
            if (!room || !sourceSemantics.has(room.semantic)) continue;
            if (!roomFitsRequirement(room, req)) continue;

            let score = room.area || (room.w * room.h);
            if (tier === 'large') score += 24;
            else if (tier === 'medium') score += 12;

            if (!hasRole) score += 14;
            if (room.semantic === 'storage') score += 4;
            if (room.semantic === 'foyer') score -= 4;
            if (role === 'study') score += Math.min(8, Math.max(0, Math.floor((room.area || 0) / 8)));

            candidates.push({
                room,
                score
            });
        }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates;
}

export function promoteGlobalMissingRoles({ buildingPlans, globalRoleQuota, config }) {
    const counts = buildRoleCounts(buildingPlans);
    const sourceSemantics = new Set(
        normalizeRoleList(config?.semantic?.promotionSourceSemantics, ['storage', 'corridor', 'foyer'])
    );

    let adjustments = 0;
    const remaining = {};

    for (const [role, target] of globalRoleQuota.entries()) {
        const current = counts.get(role) || 0;
        if (current >= target) continue;

        let missing = target - current;
        const candidates = collectPromotionCandidates({
            buildingPlans,
            role,
            sourceSemantics
        });

        let idx = 0;
        while (missing > 0 && idx < candidates.length) {
            const candidate = candidates[idx++];
            if (!candidate || !candidate.room) continue;
            if (!sourceSemantics.has(candidate.room.semantic)) continue;

            candidate.room.semantic = role;
            counts.set(role, (counts.get(role) || 0) + 1);
            missing--;
            adjustments++;
        }

        if (missing > 0) {
            remaining[role] = missing;
        }
    }

    if (Object.keys(remaining).length > 0) {
        return {
            ok: false,
            reason: 'global_semantic_quota_unsatisfied',
            missingRoles: remaining,
            adjustments
        };
    }

    return {
        ok: true,
        adjustments,
        roleCounts: Object.fromEntries(counts.entries())
    };
}
