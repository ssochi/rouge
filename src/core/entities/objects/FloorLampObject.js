const FLOOR_LAMP_LIGHT_PRESETS = Object.freeze([
    { key: 'warm', lightColor: '#ffd9a3', intensity: 1.0, flicker: 0.04 },
    { key: 'cool', lightColor: '#b8e9ff', intensity: 0.92, flicker: 0.03 },
    { key: 'mint', lightColor: '#c8ffcf', intensity: 0.9, flicker: 0.03 },
    { key: 'rose', lightColor: '#ffc1de', intensity: 0.88, flicker: 0.025 }
]);

function resolveLampPreset(obj) {
    const suffix = typeof obj?.type === 'string' && obj.type.startsWith('floor_lamp_')
        ? obj.type.slice('floor_lamp_'.length)
        : null;
    if (suffix) {
        const bySuffix = FLOOR_LAMP_LIGHT_PRESETS.find(p => p.key === suffix);
        if (bySuffix) return bySuffix;
    }

    if (typeof obj?.floorLampColor === 'string') {
        const byKey = FLOOR_LAMP_LIGHT_PRESETS.find(p => p.key === obj.floorLampColor);
        if (byKey) return byKey;
    }

    const x = Math.floor(obj?.x || 0);
    const y = Math.floor(obj?.y || 0);
    const hash = (((x * 73856093) ^ (y * 19349663)) >>> 0);
    return FLOOR_LAMP_LIGHT_PRESETS[hash % FLOOR_LAMP_LIGHT_PRESETS.length];
}

export const FloorLampObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 28, width: 12, height: 12 };
        obj.hp = 15;
        obj.shadow = { type: 'rect', x: 10, y: 30, w: 12, h: 8 };
        obj.drawOffset = { x: 8, y: -8 };

        const preset = resolveLampPreset(obj);
        obj.floorLampColor = preset.key;
        if (obj.lightColor === undefined) obj.lightColor = preset.lightColor;
        if (obj.lightIntensity === undefined) obj.lightIntensity = preset.intensity;
        if (obj.lightFlicker === undefined) obj.lightFlicker = preset.flicker;
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 10,
            y: obj.y + obj.drawOffset.y,
            width: 12,
            height: 40
        };
    }
};
