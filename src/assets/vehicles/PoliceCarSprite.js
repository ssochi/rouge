import { PixelDraw } from '../../utils/PixelDraw.js';

export function createPoliceCarSprite() {
    const w = 44;
    const h = 24;

    // Core color palette
    const c_body_black = '#141417';
    const c_door_white = '#eceff1';
    const c_door_highlight = '#ffffff';

    // 1. Wheel (Performance Tires with 2.5D Depth & Alloy Rims)
    const wheel = new PixelDraw(6, 10);
    wheel.rect(1, 0, 4, 10, '#0a0a0a')    // Deep shadow base
         .rect(0, 1, 5, 8, '#18181a')     // Main rubber
         .rect(1, 1, 4, 2, '#2a2a2e')     // Tire shoulder top reflection
         .rect(2, 3, 2, 4, '#050505')     // Inner hub shadow
         .rect(2, 4, 2, 3, '#757575')     // Silver alloy core
         .pixel(2, 4, '#ffffff')          // Top-left rim highlight
         .pixel(3, 5, '#e0e0e0')          // Center cap detail
         .pixel(2, 6, '#424242');         // Bottom rim shadow

    // 2. Chassis (Heavy reinforced frame + aggressive bullbar)
    const chassis = new PixelDraw(w, h);
    // Undercarriage dark base
    chassis.rect(1, 1, 42, 22, '#0c0c0e')
           .rect(2, 0, 40, 24, '#0c0c0e');

    // Wheel wells (black voids to absorb wheels)
    chassis.rect(6, 0, 10, 3, '#040404')
           .rect(6, 21, 10, 3, '#040404')
           .rect(28, 0, 10, 3, '#040404')
           .rect(28, 21, 10, 3, '#040404');

    // Lower sidestep / rocker panel shadow under doors
    chassis.rect(16, 22, 12, 2, '#080808');

    // Rear Bumper + Dual Exhausts
    chassis.rect(1, 4, 3, 16, '#151515')
           .rect(0, 5, 2, 14, '#1e1e1e')
           .rect(0, 6, 2, 2, '#546e7a')  // Top Exhaust
           .pixel(0, 6, '#111')
           .rect(0, 16, 2, 2, '#546e7a') // Bottom Exhaust
           .pixel(0, 17, '#111');

    // Front Bullbar (Reinforced metal rig)
    chassis.rect(40, 4, 2, 16, '#1a1a1c') // Structural mounts
           .rect(42, 5, 2, 14, '#0d0d0f') // Main vertical ram guards
           .rect(43, 5, 1, 14, '#263238') // Metallic top face
           .hLine(42, 7, 2, '#78909c')    // Horizontal strut 1
           .hLine(42, 11, 2, '#78909c')   // Horizontal strut 2
           .hLine(42, 16, 2, '#78909c')   // Horizontal strut 3
           .rect(43, 8, 1, 2, '#000000')  // Rubber ram pad 1
           .rect(43, 14, 1, 2, '#000000'); // Rubber ram pad 2

    // 3. Body (Curved 2.5D black/white police livery)
    const bodyW = 40;
    const bodyH = 22;
    const body = new PixelDraw(bodyW, bodyH);

    // Body base shapes with top/bottom 2.5D shading
    body.rect(1, 0, 38, 22, c_body_black)
        .rect(0, 1, 40, 20, c_body_black)
        .hLine(2, 0, 36, '#0f0f12')       // Far-side shadow curve
        .hLine(1, 1, 38, '#18181c')       // Far-side transition
        .rect(2, 2, 36, 17, '#1f1f25')    // Flat top base (hood/trunk)
        .hLine(1, 20, 38, '#25252b')      // Near-side glossy reflection
        .hLine(2, 21, 36, '#08080a');     // Shadow under near-side edge

    // Hood & Trunk Panel Details
    body.rect(29, 3, 10, 14, '#15151a')   // Hood
        .vLine(28, 3, 14, '#0d0d10')      // Hood panel gap
        .hLine(29, 16, 10, '#363640')     // Hood edge highlight
        .rect(2, 3, 8, 14, '#15151a')     // Trunk
        .vLine(10, 3, 14, '#0d0d10')      // Trunk panel gap
        .rect(2, 17, 8, 1, '#2c2c34');    // Trunk edge highlight

    // White Door Section (Curved)
    body.rect(12, 0, 15, 22, '#cfd8dc')   // Far curve backplate
        .rect(12, 2, 15, 16, c_door_highlight) // Flat bright side
        .rect(12, 18, 15, 3, c_door_white)// Near side rollover
        .hLine(12, 20, 15, '#78909c')     // Near side bottom trim
        .vLine(19, 1, 20, '#b0bec5');     // Front/Rear door gap

    // Police "POLICE" Decal & Badges (Side profiles)
    // Left/Far side (Y=0, 1)
    body.hLine(10, 1, 19, '#0d47a1')
        .rect(18, 0, 2, 2, '#b8860b');
    // Right/Near side (Y=18, 19)
    body.hLine(8, 18, 24, '#1976d2')
        .hLine(8, 19, 24, '#0d47a1')
        .rect(18, 18, 3, 2, '#fbc02d')    // Gold Badge
        .pixel(19, 18, '#fff9c4');        // Badge glimmer

    // Side Mirrors with embedded strobes
    body.rect(23, 0, 2, 2, '#141417').pixel(23, 0, '#2979ff').pixel(24, 1, '#e0e0e0');
    body.rect(23, 20, 2, 2, '#141417').pixel(23, 21, '#ff1744').pixel(24, 20, '#e0e0e0');

    // Advanced Front Grille
    body.vLine(39, 5, 10, '#000')         // Grille intake void
        .vLine(39, 6, 8, '#2c2c34')       // Grille mesh texture
        .vLine(39, 8, 4, '#111')          // Deep center gap
        .pixel(39, 9, '#e0e0e0');         // Car maker badge

    // High-Intensity Headlights
    body.rect(38, 2, 2, 4, '#607d8b')
        .rect(38, 15, 2, 4, '#607d8b')
        .rect(39, 3, 1, 2, '#ffffff')     // Inner LED flare
        .rect(39, 16, 1, 2, '#ffffff')
        .pixel(38, 2, '#ffca28')          // Top amber marker
        .pixel(38, 18, '#ffca28');        // Bottom amber marker

    // Deep Red Taillights
    body.rect(0, 2, 2, 4, '#8e0000')
        .rect(0, 14, 2, 4, '#8e0000')
        .rect(1, 3, 1, 2, '#ff1744')      // Core brake light
        .rect(1, 15, 1, 2, '#ff1744')
        .pixel(0, 4, '#ff9e80')           // Glare scatter
        .pixel(0, 16, '#ff9e80');

    // Embedded Interceptor Strobes
    body.pixel(39, 6, '#2979ff').pixel(0, 6, '#2979ff'); // Far side Blue
    body.pixel(39, 13, '#ff1744').pixel(0, 13, '#ff1744'); // Near side Red

    // 4. Roof (Aerodynamic dome + detailed lightbar)
    const roofW = 24;
    const roofH = 18;
    const roof = new PixelDraw(roofW, roofH);

    // Smooth roof dome shading
    roof.rect(2, 1, 20, 16, c_door_white)
        .rect(1, 2, 22, 14, '#f5f5f5')
        .rect(3, 2, 18, 12, '#ffffff')    // Bright central highlight
        .hLine(2, 1, 20, '#b0bec5')       // Far edge rolloff
        .hLine(2, 16, 20, '#cfd8dc');     // Near edge rolloff

    // Windshield (Sleek curve & aggressive gloss)
    roof.rect(18, 2, 4, 14, '#102027')    // Base tint
        .rect(19, 3, 2, 12, '#1c313a')    // Inner clarity
        .pixel(19, 4, '#4fc3f7').pixel(20, 5, '#4fc3f7') // Diagonal reflections
        .pixel(19, 11, '#4fc3f7').pixel(20, 12, '#4fc3f7').pixel(21, 13, '#4fc3f7');

    // Rear Window
    roof.rect(2, 2, 3, 14, '#102027')
        .rect(3, 3, 1, 12, '#1c313a')
        .pixel(3, 4, '#4fc3f7').pixel(4, 5, '#4fc3f7');

    // Side Windows + B-Pillars for stability
    roof.hLine(5, 1, 12, '#0c161c')       // Far side glass
        .hLine(6, 1, 4, '#37474f')
        .vLine(12, 1, 2, '#000');         // Far B-Pillar

    roof.hLine(5, 16, 12, '#1c313a')      // Near side glass
        .hLine(7, 16, 4, '#4fc3f7')       // Crisp bright reflection
        .vLine(12, 15, 2, '#111');        // Near B-Pillar

    // Center-Mounted Police Lightbar (Proportional red/blue flash)
    roof.rect(10, 3, 3, 12, '#151515');   // Mounting rack

    // Far Side Red Module (Y: 3 to 6)
    roof.rect(10, 3, 2, 4, '#b71c1c')
        .rect(11, 3, 1, 3, '#ff1744')
        .pixel(11, 4, '#ffffff');         // Searing strobe core

    // Center Siren Speaker (Y: 7 to 10)
    roof.rect(10, 7, 2, 4, '#212121')
        .pixel(11, 8, '#757575')
        .pixel(11, 9, '#e0e0e0');         // Metallic grille texture

    // Near Side Blue Module (Y: 11 to 14)
    roof.rect(10, 11, 2, 4, '#0d47a1')
        .rect(11, 12, 1, 3, '#2979ff')
        .pixel(11, 13, '#ffffff');        // Searing strobe core

    return {
        wheel: wheel.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        roof: roof.getCanvas()
    };
}
