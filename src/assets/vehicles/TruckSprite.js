import { PixelDraw } from '../../utils/PixelDraw.js';

export function createTruckSprite() {
    // Truck Dimensions (Larger)
    const w = 64;
    const h = 28;

    // Core Colors
    const c_tire = '#111111';
    const c_chassis = '#263238';
    const c_chassis_dark = '#11171a';
    const c_cab = '#c62828';
    const c_cab_light = '#e53935';
    const c_cab_dark = '#7f0000';
    const c_cargo = '#eeeeee';
    const c_cargo_dark = '#b0bec5';
    const c_cargo_detail = '#cfd8dc';
    const c_chrome = '#eceff1';
    const c_chrome_dark = '#90a4ae';
    const c_highlight = '#ffffff';

    // 1. Wheel Sprite (8x12) - Heavy duty tread
    const wheel = new PixelDraw(8, 12);
    wheel.rect(0, 1, 8, 10, c_tire)
         .rect(1, 0, 6, 12, c_tire)
         .rect(1, 1, 6, 10, '#212121'); // Base roundness

    // Heavy tire tread pattern
    for(let y = 1; y < 11; y += 2) {
        wheel.hLine(2, y, 4, '#000000')
             .pixel(1, y, '#0a0a0a')
             .pixel(6, y, '#0a0a0a');
    }

    // Axle/Hub detail
    wheel.vLine(3, 2, 8, '#37474f')
         .vLine(4, 2, 8, '#546e7a')
         .pixel(4, 4, c_chrome)
         .pixel(4, 7, c_chrome);

    // 2. Chassis (64x28) - Frame, tanks, bumpers
    const chassis = new PixelDraw(w, h);

    // Core foundation & shadows
    chassis.rect(2, 2, 60, 24, c_chassis_dark);

    // Main longitudinal rails
    chassis.rect(2, 8, 58, 3, c_chassis)
           .rect(2, 17, 58, 3, c_chassis)
           .hLine(2, 8, 58, '#455a64')
           .hLine(2, 17, 58, '#455a64');

    // Cross members
    for(let x = 10; x < 52; x += 8) {
        chassis.rect(x, 8, 3, 12, '#1c262b')
               .vLine(x, 8, 12, '#37474f');
    }

    // Heavy mudguards (Front & Rear sets)
    const mudC = '#0a0a0a';
    // Rear mudguards
    chassis.rect(6, 0, 24, 3, mudC)
           .rect(6, h-3, 24, 3, mudC)
           .hLine(6, 1, 24, '#1a1a1a')
           .hLine(6, h-2, 24, '#1a1a1a')
           .hLine(6, 2, 24, '#37474f') // Relective bead
           .hLine(6, h-3, 24, '#37474f');
    // Front mudguards
    chassis.rect(48, 0, 11, 3, mudC)
           .rect(48, h-3, 11, 3, mudC)
           .hLine(48, 1, 11, '#1a1a1a')
           .hLine(48, h-2, 11, '#1a1a1a');

    // Cylinder fuel tanks (Left & Right sides)
    // Top side tank
    chassis.rect(32, 0, 14, 4, c_chrome_dark)
           .rect(32, 1, 14, 2, c_chrome)
           .hLine(32, 1, 14, c_highlight)
           .rect(34, 0, 1, 4, '#111') // Straps
           .rect(43, 0, 1, 4, '#111');
    // Bottom side tank
    chassis.rect(32, h-4, 14, 4, c_chrome_dark)
           .rect(32, h-3, 14, 2, c_chrome)
           .hLine(32, h-3, 14, c_highlight)
           .rect(34, h-4, 1, 4, '#111')
           .rect(43, h-4, 1, 4, '#111');

    // Heavy duty front chrome bumper
    chassis.rect(60, 2, 3, h-4, c_chrome_dark)
           .rect(61, 3, 2, h-6, c_chrome)
           .hLine(61, 3, 2, c_highlight)
           .vLine(62, 4, h-8, c_highlight)
           .rect(63, 6, 1, 16, c_chrome_dark) // Bullbar
           .pixel(63, 6, c_highlight)
           .pixel(63, 21, c_highlight);

    // Rear collision bar
    chassis.rect(0, 8, 2, 12, '#212121')
           .vLine(1, 8, 12, '#424242');

    // 3. Body (60x24) - Cab and Cargo exterior
    const bodyW = 60;
    const bodyH = 24;
    const body = new PixelDraw(bodyW, bodyH);

    // Cargo Container (Corrugated texture)
    body.rect(0, 0, 40, bodyH, c_cargo)
        .rect(0, 0, 40, 2, c_cargo_dark) // Top shading
        .rect(0, bodyH-2, 40, 2, c_cargo_dark); // Bottom shading

    for(let i = 1; i < 39; i += 3) { // Wall ripples
        body.vLine(i, 0, bodyH, c_cargo_detail)
            .vLine(i+1, 0, bodyH, c_highlight);
    }

    // Cargo container frame edges
    body.rect(0, 0, 2, bodyH, '#78909c')
        .rect(38, 0, 2, bodyH, '#78909c')
        .vLine(1, 0, bodyH, '#b0bec5')
        .vLine(39, 0, bodyH, '#b0bec5');

    // Cargo tail lights mounts
    body.rect(0, 2, 2, 4, '#212121')
        .rect(0, 18, 2, 4, '#212121')
        .rect(0, 3, 1, 2, '#d32f2f')
        .rect(0, 19, 1, 2, '#d32f2f')
        .pixel(0, 4, '#ff8a80')
        .pixel(0, 20, '#ff8a80');

    // Exhaust pipes behind cab (Slightly poking out)
    body.rect(40, 0, 3, 3, c_chrome)
        .rect(40, 1, 3, 2, c_chrome_dark)
        .pixel(41, 1, '#111') // Smoke hole
        .pixel(40, 1, c_highlight)
        .rect(40, bodyH-3, 3, 3, c_chrome)
        .rect(40, bodyH-3, 3, 2, c_chrome_dark)
        .pixel(41, bodyH-2, '#111')
        .pixel(40, bodyH-2, c_highlight);

    // Red Truck Cab
    body.rect(43, 2, 17, 20, c_cab)
        .rect(43, 2, 17, 2, c_cab_dark)
        .rect(43, 20, 17, 2, c_cab_dark)
        .hLine(44, 4, 12, c_cab_light) // Shoulder sheen
        .hLine(44, 19, 12, c_cab_light)
        .vLine(56, 4, 16, c_cab_light); // Hood highlight

    // Deep inset step platforms
    body.hLine(46, 1, 4, '#424242')
        .hLine(46, 22, 4, '#424242');

    // Cab doors and handles
    body.rect(47, 2, 5, 1, c_cab_dark)
        .rect(49, 2, 2, 1, c_highlight)
        .rect(47, 21, 5, 1, c_cab_dark)
        .rect(49, 21, 2, 1, c_highlight);

    // Aggressive black front grille
    body.rect(57, 5, 3, 14, '#111')
        .rect(58, 6, 2, 12, '#212121')
        .hLine(58, 7, 2, c_chrome)
        .hLine(58, 9, 2, c_chrome)
        .hLine(58, 11, 2, c_chrome)
        .hLine(58, 13, 2, c_chrome)
        .hLine(58, 15, 2, c_chrome);

    // Dual front squared headlights
    body.rect(57, 1, 3, 3, '#ffb300')
        .rect(58, 2, 2, 2, '#fff59d')
        .pixel(59, 2, c_highlight)
        .rect(57, 20, 3, 3, '#ffb300')
        .rect(58, 21, 2, 2, '#fff59d')
        .pixel(59, 21, c_highlight);

    // 4. Roof (60x20) - Direct Top illumination
    const roofW = 60;
    const roofH = 20;
    const roof = new PixelDraw(roofW, roofH);

    // Cargo Box Top
    roof.rect(0, 0, 40, roofH, '#f5f5f5')
        .rect(0, 0, 40, 1, c_cargo_dark)
        .rect(0, roofH-1, 40, 1, c_cargo_dark)
        .vLine(39, 0, roofH, c_cargo_dark)
        .vLine(0, 0, roofH, c_cargo_dark);

    // Roof reinforced structural strips
    for(let i = 3; i < 38; i += 5) {
        roof.vLine(i, 1, roofH-2, '#e0e0e0')
            .vLine(i+1, 1, roofH-2, c_highlight);
    }
    // Wide top center stripe
    roof.hLine(2, 9, 36, '#e0e0e0')
        .hLine(2, 10, 36, c_highlight);

    // Cab Roof Deflector Crown
    roof.rect(42, 1, 14, 18, c_cab)
        .rect(42, 1, 14, 2, c_cab_dark)
        .rect(42, 17, 14, 2, c_cab_dark)
        .vLine(56, 3, 14, '#1a1a1a') // Windshield visor shadow
        .rect(44, 3, 8, 14, c_cab_light) // Inner peak
        .rect(45, 5, 4, 10, '#ef5350')
        .vLine(46, 7, 6, '#ffcdd2'); // Highest reflection

    // Blue tilted windshield
    roof.rect(53, 3, 3, 14, '#1565c0')
        .rect(53, 3, 1, 14, '#0d47a1') // Top glass shadow under peak
        .rect(54, 3, 2, 1, '#111') // A-Pillar L
        .rect(54, 16, 2, 1, '#111') // A-Pillar R
        .line(54, 4, 55, 12, '#64b5f6') // Glare sweep 1
        .line(54, 8, 55, 16, '#e3f2fd') // Glare sweep 2
        .pixel(55, 5, c_highlight)
        .pixel(55, 13, c_highlight);

    // Air Horns (Top Mounted, Dual)
    roof.rect(43, 2, 8, 2, c_chrome_dark)
        .hLine(44, 2, 7, c_chrome)
        .hLine(45, 2, 5, c_highlight)
        .vLine(51, 1, 4, c_chrome) // Left Horn Flange
        .vLine(52, 2, 2, '#111')

        .rect(43, 16, 8, 2, c_chrome_dark)
        .hLine(44, 16, 7, c_chrome)
        .hLine(45, 16, 5, c_highlight)
        .vLine(51, 15, 4, c_chrome) // Right Horn Flange
        .vLine(52, 16, 2, '#111');

    // Roof A/C / Ventilation Unit
    roof.rect(44, 7, 5, 6, '#37474f')
        .rect(45, 8, 3, 4, '#78909c')
        .hLine(45, 8, 3, c_chrome_dark)
        .vLine(46, 9, 2, '#111'); // Vents

    return {
        wheel: wheel.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        roof: roof.getCanvas()
    };
}
