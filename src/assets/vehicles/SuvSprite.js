import { PixelDraw } from '../../utils/PixelDraw.js';

export function createSuvSprite() {
    // Shared Colors (Tactical Blue-Grey Palette)
    const c_body_base = '#2a363b';
    const c_body_shadow = '#263238';
    const c_body_main = '#37474f';
    const c_body_light = '#455a64';
    const c_body_highlight = '#546e7a';
    const c_body_specular = '#627d8a';
    const c_glass_dark = '#141d26';
    const c_glass_mid = '#2a4b61';
    const c_glass_light = '#487c9b';
    const c_glass_flare = '#81d4fa';
    const c_tire_base = '#151515';
    const c_tire_ridge = '#0a0a0a';

    // 1. Wheel Sprite (6x10)
    const wheel = new PixelDraw(6, 10);
    // Tire base and shading
    wheel.rect(1, 0, 4, 10, c_tire_base)
         .rect(0, 1, 6, 8, '#1a1a1a')
         .rect(1, 1, 4, 8, '#212121'); // Tire highlight

    // Treads (rugged off-road pattern)
    wheel.hLine(0, 2, 6, c_tire_ridge)
         .hLine(0, 5, 6, c_tire_ridge)
         .hLine(0, 8, 6, c_tire_ridge)
         .pixel(1, 3, '#2a2a2a')
         .pixel(4, 6, '#2a2a2a');

    // Rim and hubcap
    wheel.rect(2, 2, 2, 6, '#3a3a3a')
         .rect(2, 3, 2, 4, '#4a5459')
         .pixel(2, 3, '#788c96') // Specular rim reflection
         .pixel(3, 6, '#1a1d1f'); // Inner shadow


    // 2. Chassis (44x24) - Undercarriage & Reinforced Bumpers
    const w = 44;
    const h = 24;
    const chassis = new PixelDraw(w, h);

    // Core undercarriage
    chassis.rect(4, 1, w-8, h-2, '#1b2226');

    // Tactical side steps
    chassis.rect(14, 0, 16, h, '#111518')
           .rect(15, 0, 14, 1, '#333b40') // Step highlight top
           .rect(15, h-1, 14, 1, '#333b40'); // Step highlight bottom

    // Wheel wells shading (deep shadows)
    const shadowColor = '#060809';
    chassis.rect(5, 0, 10, 2, shadowColor)
           .rect(5, h-2, 10, 2, shadowColor)
           .rect(30, 0, 10, 2, shadowColor)
           .rect(30, h-2, 10, 2, shadowColor);

    // Rear Bumper (Heavy duty)
    chassis.rect(0, 3, 4, h-6, '#242a2e')
           .rect(0, 4, 2, h-8, '#181d20')
           .rect(1, 4, 1, h-8, '#3c454a'); // Metallic edge

    // Front Bumper (Bull bar & Winch base)
    chassis.rect(w-4, 2, 4, h-4, '#242a2e')
           .rect(w-3, 3, 3, h-6, '#181d20')
           .rect(w-5, 5, 5, 2, '#3c454a') // Bull bar struts top
           .rect(w-5, h-7, 5, 2, '#3c454a'); // Bull bar struts bottom


    // 3. Body (40x22) - Main Armor Shell
    const bodyW = 40;
    const bodyH = 22;
    const body = new PixelDraw(bodyW, bodyH);

    // Form block & antialiased corners
    body.rect(2, 0, bodyW-6, bodyH, c_body_base)
        .rect(1, 1, bodyW-4, bodyH-2, c_body_base)
        .rect(0, 3, bodyW-2, bodyH-6, c_body_base);

    // Base painting and global top lighting
    body.rect(3, 1, bodyW-7, bodyH-2, c_body_main)
        .rect(3, 3, bodyW-8, bodyH-6, c_body_light)
        .rect(3, 5, bodyW-10, bodyH-10, c_body_highlight);

    // Hood detail (Engine Bulge on the right)
    body.rect(26, 4, 10, bodyH-8, c_body_light)
        .rect(26, 6, 9, bodyH-12, c_body_specular) // Bulge ridge highlight
        .vLine(28, 8, bodyH-16, c_body_shadow) // Engine cooling vent
        .vLine(30, 8, bodyH-16, c_body_shadow);

    // Rear Trunk / Spare tire mount area (Left)
    body.rect(2, 4, 8, bodyH-8, c_body_main)
        .rect(3, 5, 6, bodyH-10, c_body_shadow)
        .hLine(4, 11, 4, '#1a2327');

    // Side panel bevels and armor seams
    body.hLine(4, 1, bodyW-12, c_body_highlight) // Top bevel highlight
        .hLine(4, 2, bodyW-10, c_body_light)
        .hLine(4, bodyH-2, bodyW-12, '#1d262a') // Bottom dark shadow
        .hLine(4, bodyH-3, bodyW-10, c_body_shadow); // Bottom transition

    // Flared Wheel Arches (Fenders)
    const archColor = '#1e272c';
    body.rect(5, 0, 8, 2, archColor)
        .rect(5, bodyH-2, 8, 2, archColor)
        .rect(28, 0, 8, 2, archColor)
        .rect(28, bodyH-2, 8, 2, archColor)
        .hLine(6, 1, 6, '#28343b')   // Arch highlight top
        .hLine(29, 1, 6, '#28343b'); // Arch highlight front

    // Headlights (Modern horizontal block housing)
    body.rect(bodyW-4, 2, 2, 4, '#151b1e')
        .rect(bodyW-4, bodyH-6, 2, 4, '#151b1e')
        .rect(bodyW-3, 3, 2, 2, '#fff176') // LED core
        .rect(bodyW-3, bodyH-5, 2, 2, '#fff176')
        .pixel(bodyW-2, 3, '#ffffff') // Intense glare
        .pixel(bodyW-2, bodyH-5, '#ffffff')
        .rect(bodyW-3, 2, 1, 1, '#ff9800') // Turn signals
        .rect(bodyW-3, bodyH-3, 1, 1, '#ff9800');

    // Taillights
    body.rect(0, 3, 2, 4, '#6a0000') // Housing
        .rect(0, bodyH-7, 2, 4, '#6a0000')
        .vLine(1, 4, 2, '#e53935') // Brake lights
        .vLine(1, bodyH-6, 2, '#e53935')
        .pixel(0, 4, '#ff8a80') // Reflective point
        .pixel(0, bodyH-6, '#ff8a80');

    // Grille (Front intake)
    body.rect(bodyW-3, 6, 3, 10, '#151b1e')
        .rect(bodyW-2, 7, 2, 8, '#0b0e0f')
        .hLine(bodyW-2, 9, 2, '#212a2f')  // Mesh details
        .hLine(bodyW-2, 11, 2, '#212a2f')
        .hLine(bodyW-2, 13, 2, '#212a2f');


    // 4. Roof (24x18) - Glass Canopy and Equipment
    const roofW = 24;
    const roofH = 18;
    const roof = new PixelDraw(roofW, roofH);

    // Main Window Glass Shadow Backing
    roof.rect(roofW-6, 1, 6, roofH-2, c_glass_dark)  // Windshield area
        .rect(0, 3, 3, roofH-6, c_glass_dark)        // Rear window area
        .rect(3, 1, roofW-8, 2, c_glass_dark)        // Top Side window
        .rect(3, roofH-3, roofW-8, 2, c_glass_dark); // Bottom Side window

    // Windshield (Layered reflection for angled glass)
    roof.rect(roofW-5, 2, 3, roofH-4, '#1c3444')
        .rect(roofW-4, 3, 1, roofH-6, c_glass_mid)
        .rect(roofW-3, 4, 1, roofH-8, c_glass_light)
        .pixel(roofW-3, 5, c_glass_flare)
        .pixel(roofW-4, 4, c_glass_flare);

    // Rear Window Reflection
    roof.rect(1, 4, 1, roofH-8, '#1c3444')
        .rect(2, 5, 1, roofH-10, c_glass_mid);

    // Side Windows (Reflections & Tint)
    roof.hLine(3, 1, 12, '#1c3444')
        .hLine(5, 1, 8, c_glass_mid)
        .hLine(3, roofH-2, 12, '#1c3444')
        .hLine(5, roofH-2, 8, c_glass_mid);

    // A/B/C Pillars separating the glass
    roof.vLine(12, 0, 3, c_body_main)        // B-pillar top
        .vLine(12, roofH-3, 3, c_body_main)  // B-pillar bottom
        .vLine(17, 1, 2, c_body_main)        // A/C pillar blend top
        .vLine(17, roofH-3, 2, c_body_main); // A/C pillar blend bottom

    // Main Roof Armor Panel
    roof.rect(3, 2, roofW-7, roofH-4, c_body_shadow)
        .rect(4, 3, roofW-9, roofH-6, c_body_main)
        .rect(5, 4, roofW-11, roofH-8, c_body_light); // Center dome highlight

    // Roof Rack / Rails
    roof.hLine(5, 3, 12, '#151515') // Rail base
        .hLine(5, roofH-4, 12, '#151515')
        .hLine(6, 3, 10, '#3f4b52') // Rail glint top
        .hLine(6, roofH-4, 10, '#3f4b52'); // Rail glint bottom

    // Tactical Sunroof / Drone Hatch
    roof.rect(10, 6, 6, 6, '#1e272c')
        .rect(11, 7, 4, 4, c_glass_dark) // Internal shadow
        .hLine(11, 7, 4, c_glass_mid)    // Edge lighting
        .pixel(11, 7, c_glass_flare);    // Corner glare

    return {
        wheel: wheel.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        roof: roof.getCanvas()
    };
}
