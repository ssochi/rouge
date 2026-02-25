import { PixelDraw } from '../../utils/PixelDraw.js';

export function createSpiderSprite() {
    // Enhanced color palette for deep sci-fi contrast and bright neon lights
    const c_shadow = '#080c10';
    const c_hull_darkest = '#131e29';
    const c_hull_dark = '#1e2d3d';
    const c_hull_base = '#2a3a4a';
    const c_hull_mid = '#3d5060';
    const c_hull_light = '#506878';
    const c_hull_spec = '#607888';
    const c_metal_darkest = '#1e2426';
    const c_metal_dark = '#2d3436';
    const c_metal_mid = '#636e72';
    const c_metal_light = '#8a9299';
    const c_metal_shine = '#b2bec3';
    const c_accent_bright = '#ffffff';
    const c_accent = '#00e5ff';
    const c_accent_dim = '#0097a7';
    const c_accent_dark = '#004d56';
    const c_eye_red = '#ff1744';
    const c_eye_bright = '#ff8a80';
    const c_eye_dark = '#8a001a';
    const c_joint = '#121415';

    // ===== 1. Body (48x36) =====
    const body = new PixelDraw(48, 36);

    // Ground ambient occlusion shadow
    body.ellipse(24, 20, 22, 14, c_shadow);

    // Armor Layer 1 (Darkest outer base)
    body.fillPath([
        {x: 10, y: 4}, {x: 38, y: 4},
        {x: 44, y: 10}, {x: 44, y: 26},
        {x: 38, y: 32}, {x: 10, y: 32},
        {x: 4, y: 26}, {x: 4, y: 10}
    ], c_hull_darkest);

    // Armor Layer 2 (Raised structural shelf)
    body.fillPath([
        {x: 12, y: 6}, {x: 36, y: 6},
        {x: 42, y: 12}, {x: 42, y: 24},
        {x: 36, y: 30}, {x: 12, y: 30},
        {x: 6, y: 24}, {x: 6, y: 12}
    ], c_hull_dark);

    // Armor Layer 3 (Highest deck)
    body.fillPath([
        {x: 15, y: 9}, {x: 33, y: 9},
        {x: 39, y: 15}, {x: 39, y: 21},
        {x: 33, y: 27}, {x: 15, y: 27},
        {x: 9, y: 21}, {x: 9, y: 15}
    ], c_hull_base);

    // Bevels for 3D depth and specular highlights
    body.fillPath([{x: 15, y: 9}, {x: 33, y: 9}, {x: 24, y: 13}], c_hull_light);
    body.hLine(16, 9, 16, c_hull_spec);
    body.fillPath([{x: 15, y: 27}, {x: 33, y: 27}, {x: 24, y: 23}], c_hull_darkest);
    body.fillPath([{x: 9, y: 15}, {x: 9, y: 21}, {x: 15, y: 18}], c_hull_mid);
    body.fillPath([{x: 39, y: 15}, {x: 39, y: 21}, {x: 33, y: 18}], c_hull_mid);
    body.vLine(38, 16, 4, c_hull_light);

    // Turret Mount Ring
    body.circle(24, 18, 9, c_shadow);
    body.circle(24, 18, 8, c_metal_darkest);
    body.circle(24, 18, 7, c_hull_dark);
    body.circle(24, 18, 6, c_metal_mid);
    body.circle(24, 18, 5, c_shadow);
    body.hLine(20, 12, 8, c_metal_light);
    body.hLine(22, 11, 4, c_metal_shine);

    // Front sensor visor array (X+)
    body.rect(40, 14, 5, 8, c_metal_darkest);
    body.vLine(40, 14, 8, c_hull_darkest);
    body.pixel(42, 15, c_eye_red); body.pixel(43, 15, c_eye_bright);
    body.pixel(42, 17, c_eye_dark); body.pixel(43, 17, c_eye_red);
    body.pixel(42, 19, c_eye_red); body.pixel(43, 19, c_eye_bright);
    body.pixel(41, 16, c_accent_dim); body.pixel(44, 16, c_accent);
    body.pixel(41, 20, c_accent_dim); body.pixel(44, 20, c_accent);

    // Rear engine exhaust vents (X-)
    body.rect(2, 13, 6, 10, c_metal_darkest);
    for (let y = 14; y <= 20; y += 2) {
        body.hLine(2, y, 6, c_metal_mid);
        body.hLine(2, y+1, 6, c_shadow);
        body.pixel(3, y, c_accent);
        body.pixel(4, y, c_accent_bright);
    }

    // Top shell neon energy lines
    body.hLine(18, 11, 4, c_accent_dark);
    body.hLine(19, 11, 2, c_accent);
    body.hLine(18, 25, 4, c_accent_dark);
    body.hLine(19, 25, 2, c_accent);
    body.vLine(30, 11, 3, c_accent_dark);
    body.pixel(30, 12, c_accent);
    body.vLine(30, 22, 3, c_accent_dark);
    body.pixel(30, 23, c_accent);

    // Heavy joint sockets
    const joints = [
        {x: 34, y: 30}, {x: 24, y: 32}, {x: 14, y: 30},
        {x: 34, y: 6},  {x: 24, y: 4},  {x: 14, y: 6}
    ];
    for (const j of joints) {
        body.circle(j.x, j.y, 4, c_metal_darkest);
        body.circle(j.x, j.y, 3, c_joint);
        body.circle(j.x, j.y, 2, c_metal_mid);
        body.pixel(j.x - 1, j.y - 1, c_metal_shine);
        body.pixel(j.x, j.y, c_shadow);
    }

    // ===== 2. Turret (32x32, rotation center at 10, 16) =====
    const turret = new PixelDraw(32, 32);

    // Rotation platform
    turret.circle(10, 16, 7, c_shadow);
    turret.circle(10, 16, 6, c_hull_darkest);
    turret.circle(10, 16, 5, c_hull_base);
    turret.circle(10, 16, 3, c_hull_mid);
    turret.pixel(8, 14, c_hull_spec);

    // Main weapon housing block
    turret.rect(5, 12, 10, 8, c_hull_darkest);
    turret.rect(6, 13, 8, 6, c_hull_base);
    turret.hLine(6, 13, 8, c_hull_light);
    turret.vLine(6, 14, 4, c_hull_spec);
    turret.pixel(7, 14, c_accent_dim);
    turret.pixel(7, 17, c_accent_dim);
    turret.hLine(13, 14, 2, c_metal_mid);
    turret.hLine(13, 17, 2, c_metal_mid);

    // Forward armor sloping
    turret.rect(14, 13, 6, 6, c_hull_dark);
    turret.rect(14, 14, 6, 4, c_metal_darkest);

    // Laser barrel core
    turret.rect(20, 14, 8, 4, c_metal_dark);
    turret.rect(20, 15, 8, 2, c_metal_mid);
    turret.hLine(20, 14, 8, c_metal_shine);

    // High-tech cooling coils with intense glow
    for(let x = 21; x <= 25; x += 2) {
        turret.vLine(x, 13, 6, c_metal_darkest);
        turret.vLine(x, 14, 4, c_accent_dark);
        turret.vLine(x, 15, 2, c_accent);
        turret.pixel(x, 15, c_accent_bright);
    }

    // Muzzle compensator
    turret.rect(27, 12, 3, 8, c_hull_darkest);
    turret.rect(28, 13, 2, 6, c_hull_mid);
    turret.vLine(28, 13, 6, c_hull_light);

    // Emitter node & pure energy tip
    turret.rect(30, 14, 2, 4, c_metal_darkest);
    turret.pixel(30, 15, c_accent_dim);
    turret.pixel(30, 16, c_accent_dim);
    turret.pixel(31, 15, c_accent_bright);
    turret.pixel(31, 16, c_accent_bright);

    // Auxiliary targeting pods on sides
    turret.rect(8, 10, 6, 2, c_hull_mid);
    turret.pixel(13, 10, c_eye_red);
    turret.pixel(13, 11, c_eye_red);
    turret.rect(8, 20, 6, 2, c_hull_mid);
    turret.pixel(13, 20, c_eye_red);
    turret.pixel(13, 21, c_eye_red);

    // ===== 3. Leg Upper (20x6) =====
    const legUpper = new PixelDraw(20, 6);

    // Core structure
    legUpper.rect(4, 2, 12, 2, c_hull_dark);
    legUpper.hLine(4, 2, 12, c_hull_mid);
    legUpper.hLine(4, 3, 12, c_hull_base);

    // Sub-hydraulics
    legUpper.rect(4, 1, 7, 1, c_metal_mid);
    legUpper.hLine(4, 1, 7, c_metal_shine);
    legUpper.hLine(11, 1, 5, c_metal_light);

    legUpper.rect(9, 4, 7, 1, c_metal_mid);
    legUpper.hLine(9, 4, 7, c_metal_shine);
    legUpper.hLine(4, 4, 5, c_metal_light);

    // Side mounts and rotating caps
    legUpper.rect(0, 1, 4, 4, c_metal_darkest);
    legUpper.circle(2, 3, 2, c_metal_dark);
    legUpper.circle(2, 3, 1, c_metal_mid);

    legUpper.rect(16, 1, 4, 4, c_metal_darkest);
    legUpper.circle(18, 3, 2, c_metal_dark);
    legUpper.circle(18, 3, 1, c_metal_mid);

    // Joint neon status
    legUpper.pixel(10, 2, c_accent_dim);
    legUpper.pixel(11, 2, c_accent);
    legUpper.pixel(10, 3, c_accent);
    legUpper.pixel(11, 3, c_accent_bright);

    // ===== 4. Leg Lower (18x5) =====
    const legLower = new PixelDraw(18, 5);

    // Thin inner actuator
    legLower.rect(3, 1, 12, 3, c_metal_dark);
    legLower.hLine(3, 1, 12, c_metal_light);
    legLower.hLine(3, 2, 12, c_metal_mid);
    legLower.hLine(3, 3, 12, c_metal_darkest);

    // Exposed chrome piston
    legLower.hLine(5, 2, 8, c_metal_shine);
    legLower.hLine(4, 2, 1, c_hull_dark);
    legLower.hLine(13, 2, 1, c_hull_dark);

    // Layered top shielding
    legLower.hLine(4, 0, 8, c_hull_dark);
    legLower.hLine(5, 0, 6, c_hull_mid);
    legLower.hLine(6, 0, 4, c_hull_light);

    // Ankle and Knee brackets
    legLower.rect(0, 1, 3, 3, c_metal_darkest);
    legLower.circle(1, 2, 1, c_metal_mid);
    legLower.rect(15, 1, 3, 3, c_metal_darkest);
    legLower.circle(16, 2, 1, c_metal_mid);

    // ===== 5. Foot (6x6) =====
    const foot = new PixelDraw(6, 6);

    // Central heavy socket
    foot.circle(3, 2, 2, c_metal_darkest);
    foot.circle(3, 2, 1, c_metal_mid);

    // Sharp tungsten claws grabbing ground
    foot.pixel(2, 1, c_metal_shine);
    foot.pixel(1, 0, c_metal_mid);
    foot.pixel(0, 0, c_accent); // Ground contact trace

    foot.pixel(4, 1, c_metal_shine);
    foot.pixel(5, 0, c_metal_mid);
    foot.pixel(5, 1, c_accent);

    foot.pixel(3, 3, c_metal_shine);
    foot.pixel(3, 4, c_metal_mid);
    foot.pixel(3, 5, c_accent);

    // Sizzling core emission
    foot.pixel(3, 2, c_accent_bright);

    return {
        body: body.getCanvas(),
        turret: turret.getCanvas(),
        legUpper: legUpper.getCanvas(),
        legLower: legLower.getCanvas(),
        foot: foot.getCanvas()
    };
}
