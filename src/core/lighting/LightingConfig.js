export const LIGHTING_QUALITY_PRESETS = {
    high: {
        id: 'high',
        bufferScale: 0.45,
        shadowRays: 112,
        gradientSteps: 10,
        glowSteps: 7,
        maxTotalLights: 72,
        maxDynamicLights: 32,
        maxStaticLights: 56,
        maxParticleLights: 20,
        maxBlockersPerLight: 96,
        staticUpdateInterval: 3,
        ambientBrightness: 60,
        glowStrength: 0.38,
        overBudgetMs: 6.2,
        underBudgetMs: 2.8,
        downgradeFrames: 50,
        upgradeFrames: 280
    },
    medium: {
        id: 'medium',
        bufferScale: 0.35,
        shadowRays: 80,
        gradientSteps: 8,
        glowSteps: 5,
        maxTotalLights: 56,
        maxDynamicLights: 24,
        maxStaticLights: 40,
        maxParticleLights: 12,
        maxBlockersPerLight: 64,
        staticUpdateInterval: 4,
        ambientBrightness: 54,
        glowStrength: 0.32,
        overBudgetMs: 4.8,
        underBudgetMs: 2.2,
        downgradeFrames: 35,
        upgradeFrames: 220
    },
    low: {
        id: 'low',
        bufferScale: 0.28,
        shadowRays: 56,
        gradientSteps: 6,
        glowSteps: 4,
        maxTotalLights: 36,
        maxDynamicLights: 16,
        maxStaticLights: 24,
        maxParticleLights: 6,
        maxBlockersPerLight: 40,
        staticUpdateInterval: 6,
        ambientBrightness: 62,
        glowStrength: 0.24,
        overBudgetMs: 4.2,
        underBudgetMs: 1.8,
        downgradeFrames: 26,
        upgradeFrames: 280
    }
};

export const DEFAULT_LIGHTING_QUALITY = 'medium';

export function cloneLightingPreset(quality = DEFAULT_LIGHTING_QUALITY) {
    const preset = LIGHTING_QUALITY_PRESETS[quality] || LIGHTING_QUALITY_PRESETS[DEFAULT_LIGHTING_QUALITY];
    return { ...preset };
}

export function clampRadius(radius) {
    if (!Number.isFinite(radius)) return 0;
    return Math.max(8, Math.min(240, radius));
}
