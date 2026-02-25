import { PixelDraw } from '../../utils/PixelDraw.js';

export function createTankSprite() {
    // Enhanced military color palette
    const c_armor = '#41522b';
    const c_armor_dark = '#2c381d';
    const c_armor_light = '#5c723f';
    const c_armor_spec = '#7f9c57';
    const c_track = '#111111';
    const c_track_link = '#222222';
    const c_track_detail = '#333333';
    const c_metal = '#4a544a';
    const c_metal_dark = '#2b332b';
    const c_metal_light = '#778577';
    const c_barrel = '#3b4237';
    const c_barrel_light = '#586153';
    const c_barrel_dark = '#1f241d';
    const c_shadow = '#151b0e';
    const c_glass = '#4c738f';
    const c_glass_glint = '#8dbfe3';
    const c_light_on = '#ffebb5';
    const c_tail_on = '#ff4d4d';

    // 1. Track Sprite (8x32)
    const tracks = new PixelDraw(8, 32);

    tracks.rect(0, 0, 8, 32, c_track);
    tracks.rect(1, 0, 6, 32, c_track_link);

    // Drive sprocket and rear idler mechanism
    tracks.rect(1, 1, 6, 4, c_metal_dark);
    tracks.hLine(2, 2, 4, c_metal_light);
    tracks.rect(1, 27, 6, 4, c_metal_dark);
    tracks.hLine(2, 29, 4, c_metal_light);

    // Hidden road wheels depth
    for (let y = 6; y < 26; y += 4) {
        tracks.rect(2, y, 4, 3, c_track);
        tracks.vLine(3, y, 3, '#1c1c1c');
    }

    // Track links, guides, and highlights
    for (let y = 0; y < 32; y += 2) {
        tracks.hLine(0, y, 8, '#080808');
        tracks.hLine(1, y + 1, 6, c_track_link);
        tracks.hLine(4, y + 1, 2, c_track_detail);
        tracks.pixel(3, y + 1, '#444444');
    }

    // Rubber padding / edge shadowing
    tracks.vLine(0, 0, 32, '#050505');
    tracks.vLine(7, 0, 32, '#050505');


    // 2. Chassis (56x36)
    const chassis = new PixelDraw(56, 36);

    // Core undercarriage shadow
    chassis.rect(4, 2, 48, 32, c_shadow);

    // Fenders/mudguards (Top & Bottom)
    chassis.rect(2, 0, 52, 4, c_armor_dark);
    chassis.rect(2, 32, 52, 4, c_armor_dark);

    // Fender highlights and inner depths
    chassis.hLine(2, 1, 52, c_armor);
    chassis.hLine(2, 34, 52, c_armor);
    chassis.hLine(2, 3, 52, '#0a0d07');
    chassis.hLine(2, 32, 52, '#0a0d07');

    // Angled mudguard corners
    chassis.rect(50, 0, 4, 4, c_shadow);
    chassis.rect(50, 32, 4, 4, c_shadow);
    chassis.rect(2, 0, 3, 4, c_shadow);
    chassis.rect(2, 32, 3, 4, c_shadow);

    // Lower front glacis plate
    chassis.rect(52, 6, 4, 24, c_armor_dark);
    chassis.vLine(52, 6, 24, c_shadow);
    chassis.vLine(55, 7, 22, c_armor);

    // Lower rear plate
    chassis.rect(0, 8, 4, 20, c_shadow);
    chassis.vLine(3, 8, 20, '#050703');
    chassis.vLine(0, 9, 18, c_armor_dark);

    // Suspension and hull mechanical base
    chassis.rect(10, 4, 36, 28, '#0a0c08');
    for (let x = 12; x < 46; x += 6) {
        chassis.rect(x, 4, 2, 28, '#12170f');
        chassis.pixel(x, 5, c_metal_dark);
        chassis.pixel(x, 30, c_metal_dark);
    }


    // 3. Body (52x32)
    const body = new PixelDraw(52, 32);

    // Main hull base layers
    body.rect(2, 3, 48, 26, c_armor);
    body.rect(4, 4, 44, 24, c_armor_dark);
    body.rect(6, 6, 40, 20, c_armor);

    // Hull structural outline highlight
    body.strokeRect(5, 5, 42, 22, c_armor_light);

    // Side Skirts rendering
    const drawSkirt = (yTop) => {
        body.rect(4, yTop, 44, 4, c_armor);
        body.hLine(4, yTop, 44, c_armor_spec);
        body.hLine(4, yTop + 3, 44, c_shadow);
        for (let x = 10; x < 46; x += 8) {
            body.vLine(x, yTop, 4, c_shadow);
            body.vLine(x + 1, yTop, 4, c_armor_light);
        }
    };
    drawSkirt(0);
    drawSkirt(28);

    // Front Upper Glacis (heavy angled armor catching light)
    body.rect(42, 4, 8, 24, c_armor_spec);
    body.rect(43, 5, 7, 22, c_armor_light);
    body.rect(45, 6, 5, 20, c_armor);
    body.vLine(42, 4, 24, '#9ec46a');
    body.vLine(51, 6, 20, c_armor_dark);

    // Front hull add-on armor plates
    body.rect(44, 8, 4, 16, c_armor_dark);
    body.rect(45, 9, 2, 14, c_armor);
    body.vLine(45, 9, 14, c_armor_light);

    // Driver's Hatch complex
    body.rect(36, 12, 5, 8, c_armor_dark);
    body.rect(37, 13, 4, 6, c_armor);
    body.hLine(37, 13, 4, c_armor_light);
    body.vLine(36, 13, 6, c_armor_spec);
    body.rect(38, 14, 2, 4, c_glass);
    body.vLine(39, 14, 4, c_glass_glint);

    // Engine Deck
    body.rect(2, 6, 14, 20, '#263318');
    body.rect(3, 7, 12, 18, c_armor);
    body.vLine(15, 6, 20, c_armor_light);

    // Engine heat dissipation grilles
    for (let y = 8; y < 24; y += 3) {
        body.hLine(4, y, 10, c_shadow);
        body.hLine(4, y + 1, 10, '#11170a');
        body.hLine(4, y + 2, 10, c_armor_light);
    }

    // Engine dual cooling fans / vents
    body.rect(4, 9, 8, 4, c_shadow);
    body.rect(4, 19, 8, 4, c_shadow);
    for (let x = 4; x < 12; x += 2) {
        body.vLine(x, 9, 4, c_metal_dark);
        body.vLine(x, 19, 4, c_metal_dark);
    }

    // Heavy exhaust pipes (Rear corners)
    body.rect(0, 8, 3, 5, c_metal_dark);
    body.rect(0, 19, 3, 5, c_metal_dark);
    body.vLine(2, 8, 5, c_metal);
    body.vLine(2, 19, 5, c_metal);
    body.pixel(1, 10, '#111111');
    body.pixel(1, 21, '#111111');

    // Turret Ring mount
    body.circle(21, 16, 11, c_armor_dark);
    body.circle(21, 16, 10, c_shadow);
    body.circle(21, 16, 9, '#070a04');

    // Headlights
    body.rect(48, 1, 3, 3, c_armor_dark);
    body.rect(49, 2, 2, 2, c_light_on);
    body.pixel(49, 2, '#ffffff');
    body.rect(48, 28, 3, 3, c_armor_dark);
    body.rect(49, 29, 2, 2, c_light_on);
    body.pixel(49, 29, '#ffffff');

    // Tail lights
    body.rect(1, 1, 3, 3, '#1a1a1a');
    body.rect(2, 2, 2, 2, c_tail_on);
    body.pixel(3, 2, '#ffb3b3');
    body.rect(1, 28, 3, 3, '#1a1a1a');
    body.rect(2, 29, 2, 2, c_tail_on);
    body.pixel(3, 29, '#ffb3b3');

    // Tow hooks
    body.rect(50, 6, 2, 2, c_metal);
    body.pixel(51, 6, c_metal_light);
    body.rect(50, 24, 2, 2, c_metal);
    body.pixel(51, 24, c_metal_light);

    // Weathering & details
    body.pixel(14, 10, c_shadow);
    body.pixel(15, 26, c_shadow);
    body.pixel(28, 8, c_armor_dark);
    body.pixel(30, 24, c_armor_dark);


    // 4. Turret (48x48) - Center (16, 24), forward -> right
    const turret = new PixelDraw(48, 48);

    // Cast turret bottom shadow onto hull
    turret.circle(14, 25, 12, c_shadow);

    // Modern angular composite armor profile (Hexagonal)
    turret.fillPath([
        {x: 6, y: 15}, {x: 18, y: 12}, {x: 28, y: 16},
        {x: 28, y: 32}, {x: 18, y: 36}, {x: 6, y: 33}
    ], c_armor_dark);

    turret.fillPath([
        {x: 7, y: 16}, {x: 17, y: 14}, {x: 25, y: 17},
        {x: 25, y: 31}, {x: 17, y: 34}, {x: 7, y: 32}
    ], c_armor);

    // 3D Angled Facets rendering
    turret.fillPath([
        {x: 17, y: 14}, {x: 25, y: 17}, {x: 17, y: 17}
    ], c_armor_light); // Front-left top angled plane

    turret.fillPath([
        {x: 25, y: 17}, {x: 25, y: 23}, {x: 17, y: 23}, {x: 17, y: 14}
    ], c_armor_spec); // Front-left strong lit plane

    turret.fillPath([
        {x: 25, y: 25}, {x: 25, y: 31}, {x: 17, y: 34}, {x: 17, y: 25}
    ], '#344521'); // Front-right shaded plane

    // Hard surface chamfer lines
    turret.line(17, 17, 25, 17, c_armor_light);
    turret.line(17, 31, 25, 31, c_shadow);
    turret.line(17, 14, 17, 34, c_armor_light);

    // Rear Bustle & counterweight
    turret.rect(3, 18, 5, 12, c_armor_dark);
    turret.rect(4, 19, 4, 10, c_armor);
    turret.vLine(3, 18, 12, c_shadow);
    turret.hLine(4, 19, 4, c_armor_spec);

    // Bustle storage rack frame
    turret.strokeRect(1, 19, 3, 10, c_metal_dark);
    turret.line(2, 21, 4, 21, c_metal);
    turret.line(2, 27, 4, 27, c_metal);

    // Heavy Gun Mantlet
    turret.rect(24, 21, 6, 7, c_armor_dark);
    turret.rect(25, 22, 5, 5, c_metal_dark);
    turret.rect(26, 23, 5, 3, c_metal);
    turret.vLine(30, 23, 3, c_metal_light);
    turret.hLine(25, 21, 5, c_armor_light);

    // Main Gun Barrel
    turret.rect(31, 23, 17, 3, c_barrel_dark);
    turret.hLine(31, 23, 17, c_barrel_light);
    turret.hLine(31, 24, 17, c_barrel);

    // Fume Extractor
    turret.rect(36, 22, 6, 5, c_barrel_dark);
    turret.hLine(36, 22, 6, c_barrel_light);
    turret.hLine(36, 23, 6, c_barrel);
    turret.hLine(36, 24, 6, c_barrel);
    turret.vLine(36, 22, 5, c_metal_dark);
    turret.vLine(41, 22, 5, c_metal_dark);

    // Muzzle Reference Sensor / Deflector
    turret.rect(45, 22, 3, 5, c_barrel_dark);
    turret.rect(46, 23, 2, 3, c_barrel);
    turret.vLine(46, 23, 3, c_barrel_light);
    turret.pixel(47, 24, '#0e120d');

    // Commander's Cupola
    turret.circle(11, 20, 4, c_armor_dark);
    turret.circle(11, 20, 3, c_armor);
    turret.circle(11, 20, 2, c_armor_light);
    turret.pixel(13, 20, c_glass_glint);
    turret.pixel(11, 18, c_glass_glint);
    turret.pixel(9, 20, c_glass);
    turret.pixel(11, 22, c_glass);

    // Remote Controlled Weapon Station (RCWS / .50 Cal)
    turret.rect(12, 19, 8, 2, '#1a1a1a');
    turret.hLine(13, 19, 7, '#333333');
    turret.hLine(20, 19, 3, '#555555');
    turret.pixel(14, 18, c_metal);

    // Loader's Hatch
    turret.circle(11, 28, 3, c_armor_dark);
    turret.circle(11, 28, 2, c_armor);
    turret.hLine(10, 28, 3, c_armor_light);

    // Gunner's Primary Sight (GPS)
    turret.rect(19, 26, 4, 3, c_armor_dark);
    turret.rect(20, 27, 2, 2, c_armor);
    turret.pixel(21, 27, '#a62b2b');
    turret.pixel(20, 27, '#5e1717');

    // Explosive Reactive Armor (ERA) Blocks
    const drawERA = (x, y) => {
        turret.rect(x, y, 3, 2, c_armor_dark);
        turret.hLine(x, y, 2, c_armor_light);
        turret.pixel(x + 1, y + 1, c_armor);
    };
    drawERA(19, 14); drawERA(22, 15); drawERA(25, 16);
    drawERA(19, 32); drawERA(22, 31); drawERA(25, 30);

    // Smoke Grenade Launchers
    const drawSmokeLauncher = (cx, cy) => {
        turret.rect(cx, cy, 2, 3, '#2a331e');
        turret.pixel(cx, cy, '#111');
        turret.pixel(cx + 1, cy + 1, '#111');
        turret.pixel(cx, cy + 2, '#111');
    };
    drawSmokeLauncher(14, 12);
    drawSmokeLauncher(14, 33);

    // Communications Antenna
    turret.vLine(6, 22, 2, '#1a1a1a');
    turret.pixel(6, 22, c_metal_light);
    turret.line(5, 21, 2, 18, '#333333');

    // Turret Weathering
    turret.pixel(18, 16, c_armor_dark);
    turret.pixel(22, 28, c_armor_dark);
    turret.pixel(9, 24, c_armor_dark);

    return {
        tracks: tracks.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        turret: turret.getCanvas()
    };
}
