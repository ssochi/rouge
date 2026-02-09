import { PixelDraw } from '../../utils/PixelDraw.js';

export function createSuvSprite() {
    // Colors
    const c_tire = '#1a1a1a';
    const c_chassis = '#263238'; // Blue-Grey Dark
    const c_body = '#37474f'; // Blue-Grey Medium (Military/Tactical look)
    const c_body_light = '#455a64';
    const c_body_dark = '#263238';
    const c_roof = '#455a64';
    const c_window = '#81d4fa';
    const c_window_dark = '#4fc3f7';
    
    // 1. Wheel Sprite (Single wheel, 6x10)
    const wheel = new PixelDraw(6, 10);
    wheel.rect(1, 0, 4, 10, c_tire) // Rounded top/bottom
         .rect(0, 1, 6, 8, c_tire)
         .rect(2, 2, 2, 6, '#424242') // Rim
         .rect(2, 2, 1, 1, '#616161') // Highlight
         .pixel(2, 3, '#212121') // Detail
         .pixel(3, 6, '#212121');

    // 2. Chassis (Undercarriage + Bumpers)
    // Size: 44x24
    const w = 44;
    const h = 24;
    const chassis = new PixelDraw(w, h);
    
    // Rounded Rectangle Base
    chassis.rect(2, 0, w-4, h, c_chassis)
           .rect(0, 2, w, h-4, c_chassis)
           .rect(1, 1, w-2, h-2, c_chassis);
           
    // Bumpers (Reinforced)
    chassis.rect(0, 2, 3, h-4, '#111') // Rear Bumper
           .rect(0, 4, 2, h-8, '#333') // Rear Detail
           .rect(w-3, 2, 3, h-4, '#111') // Front Bumper
           .rect(w-2, 4, 2, h-8, '#333'); // Front Detail
           
    // Wheel Wells (Darker areas where wheels are)
    // Wheels are approx at x=8 and x=32
    chassis.rect(6, 0, 10, 2, '#000')
           .rect(6, h-2, 10, 2, '#000')
           .rect(w-14, 0, 10, 2, '#000')
           .rect(w-14, h-2, 10, 2, '#000');

    // 3. Body (Main Shell)
    // Size: 40x22 (Slightly smaller than chassis)
    const bodyW = 40;
    const bodyH = 22;
    const body = new PixelDraw(bodyW, bodyH);
    
    // Sculpted Body Shape
    // Main Block
    body.rect(2, 0, bodyW-6, bodyH, c_body) // Main length
        .rect(0, 2, bodyW-2, bodyH-4, c_body) // Width
        .rect(1, 1, bodyW-4, bodyH-2, c_body); // Smoothing
        
    // Hood (Front) - Lower/Tapered
    // Front starts at x=bodyW-10
    body.rect(bodyW-10, 1, 8, bodyH-2, c_body_light) // Hood highlight
        .rect(bodyW-10, 3, 8, bodyH-6, c_body); // Hood recessed center
        
    // Side Skirts / Door Line
    body.rect(0, bodyH-2, bodyW-4, 2, c_body_dark) // Right side shadow
        .rect(0, 0, bodyW-4, 2, c_body_dark); // Left side shadow (top in 2D)
        
    // Headlights
    body.rect(bodyW-2, 2, 1, 4, '#fff59d') // Left Light (Top)
        .rect(bodyW-2, bodyH-6, 1, 4, '#fff59d') // Right Light (Bottom)
        .rect(bodyW-1, 2, 1, 4, 'rgba(255, 255, 255, 0.5)') // Glow
        .rect(bodyW-1, bodyH-6, 1, 4, 'rgba(255, 255, 255, 0.5)');
        
    // Taillights
    body.rect(0, 2, 2, 4, '#b71c1c')
        .rect(0, bodyH-6, 2, 4, '#b71c1c');
        
    // Grille (Front)
    body.rect(bodyW-2, 8, 2, 6, '#212121')
        .hLine(bodyW-2, 9, 2, '#424242')
        .hLine(bodyW-2, 11, 2, '#424242');

    // 4. Roof (Top + Windows)
    // Size: 24x18 (Much smaller to simulate taper)
    const roofW = 24;
    const roofH = 18;
    const roof = new PixelDraw(roofW, roofH);
    
    // Tapered Roof Shape (Rounded)
    roof.rect(2, 0, roofW-4, roofH, c_roof)
        .rect(0, 2, roofW, roofH-4, c_roof)
        .rect(1, 1, roofW-2, roofH-2, c_roof);
        
    // Windshield (Front)
    // Angled look by drawing it slightly set back
    roof.rect(roofW-5, 2, 3, roofH-4, c_window)
        .rect(roofW-3, 3, 1, roofH-6, c_window_dark); // Reflection
        
    // Rear Window
    roof.rect(1, 3, 2, roofH-6, c_window);
    
    // Side Windows
    // Left
    roof.rect(4, 1, 14, 2, c_window)
        .rect(10, 1, 2, 2, c_roof); // Pillar
    // Right
    roof.rect(4, roofH-3, 14, 2, c_window)
        .rect(10, roofH-3, 2, 2, c_roof); // Pillar
        
    // Roof Rails
    roof.rect(4, 4, 14, 1, c_body_dark)
        .rect(4, roofH-5, 14, 1, c_body_dark);

    return {
        wheel: wheel.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        roof: roof.getCanvas()
    };
}
