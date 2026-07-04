export const LIGHTING_QUALITY_PRESETS = {
    high: {
        id: 'high',
        bufferScale: 0.45,
        shadowRays: 112,
        gradientSteps: 10,
        glowSteps: 7,
        enableContourGlow: false,
        maxTotalLights: 72,
        maxDynamicLights: 32,
        maxStaticLights: 56,
        maxParticleLights: 20,
        maxBlockersPerLight: 320,
        maxAllShadowLights: 8,
        maxWallShadowLights: 12,
        maxCheapLights: 52,
        allowShadowedTransientLights: true,
        staticUpdateInterval: 3,
        ambientBrightness: 115,
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
        enableContourGlow: false,
        maxTotalLights: 56,
        maxDynamicLights: 24,
        maxStaticLights: 40,
        maxParticleLights: 12,
        maxBlockersPerLight: 220,
        maxAllShadowLights: 4,
        maxWallShadowLights: 10,
        maxCheapLights: 42,
        allowShadowedTransientLights: false,
        staticUpdateInterval: 4,
        ambientBrightness: 115,
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
        enableContourGlow: false,
        maxTotalLights: 36,
        maxDynamicLights: 16,
        maxStaticLights: 24,
        maxParticleLights: 6,
        maxBlockersPerLight: 140,
        maxAllShadowLights: 2,
        maxWallShadowLights: 6,
        maxCheapLights: 28,
        allowShadowedTransientLights: false,
        staticUpdateInterval: 6,
        ambientBrightness: 115,
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
    return Math.max(8, Math.min(480, radius));
}
