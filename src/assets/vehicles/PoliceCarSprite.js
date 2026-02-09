import { PixelDraw } from '../../utils/PixelDraw.js';

export function createPoliceCarSprite() {
    // Similar to SUV but Police colors
    const w = 44;
    const h = 24;
    
    const c_tire = '#1a1a1a';
    const c_chassis = '#212121';
    const c_body_black = '#212121'; // Darker black for contrast
    const c_body_white = '#f5f5f5'; // Bright white
    const c_window = '#81d4fa';
    const c_window_dark = '#4fc3f7';

    // 1. Wheel (Performance Tires)
    const wheel = new PixelDraw(6, 10);
    wheel.rect(1, 0, 4, 10, c_tire)
         .rect(0, 1, 6, 8, c_tire)
         .rect(2, 2, 2, 6, '#bdbdbd') // Silver Rim
         .rect(2, 2, 1, 1, '#fff') // Shine
         .pixel(2, 3, '#424242'); // Detail

    // 2. Chassis
    const chassis = new PixelDraw(w, h);
    // Base Frame
    chassis.rect(2, 0, w-4, h, c_chassis)
           .rect(0, 2, w, h-4, c_chassis)
           .rect(1, 1, w-2, h-2, c_chassis);
           
    // Bullbar (Front) - Reinforced
    chassis.rect(w-2, 6, 2, h-12, '#424242') // Main bar
           .rect(w-1, 8, 1, h-16, '#616161') // Highlight
           .rect(w-4, 6, 2, 2, '#424242') // Mounts
           .rect(w-4, h-8, 2, 2, '#424242');
           
    // Wheel Wells
    chassis.rect(6, 0, 10, 2, '#000')
           .rect(6, h-2, 10, 2, '#000')
           .rect(w-14, 0, 10, 2, '#000')
           .rect(w-14, h-2, 10, 2, '#000');

    // 3. Body
    const bodyW = 40;
    const bodyH = 22;
    const body = new PixelDraw(bodyW, bodyH);
    
    // Black Front and Rear
    body.rect(0, 0, bodyW, bodyH, c_body_black);
    
    // White Doors Section (Curved)
    body.rect(12, 0, 16, bodyH, c_body_white)
        .rect(12, 1, 16, bodyH-2, '#fff');
        
    // "POLICE" Text (Simplified as blue stripe/logo)
    body.rect(14, 8, 12, 6, '#fff') // Clear area
        .rect(15, 10, 10, 2, '#0d47a1'); // Blue Stripe
        
    // Shield / Logo
    body.rect(19, 9, 2, 4, '#fdd835'); // Gold Badge
    
    // Headlights (Aggressive)
    body.rect(bodyW-2, 2, 2, 4, '#e0e0e0')
        .rect(bodyW-2, bodyH-6, 2, 4, '#e0e0e0')
        .rect(bodyW-1, 2, 1, 4, '#fff') // Bright
        .rect(bodyW-1, bodyH-6, 1, 4, '#fff');
        
    // Taillights
    body.rect(0, 2, 2, 4, '#b71c1c')
        .rect(0, bodyH-6, 2, 4, '#b71c1c');
        
    // Flashing Lights (Front/Rear embedded)
    body.pixel(bodyW-2, 6, '#f44336') // Front Red
        .pixel(bodyW-2, 15, '#2196f3') // Front Blue
        .pixel(0, 6, '#f44336') // Rear Red
        .pixel(0, 15, '#2196f3'); // Rear Blue

    // 4. Roof (Siren)
    const roofW = 24;
    const roofH = 18;
    const roof = new PixelDraw(roofW, roofH);
    
    // Roof Shape (Aerodynamic)
    roof.rect(2, 0, roofW-4, roofH, c_body_white)
        .rect(0, 2, roofW, roofH-4, c_body_white)
        .rect(1, 1, roofW-2, roofH-2, c_body_white);
        
    // Windows
    roof.rect(roofW-5, 2, 3, roofH-4, c_window) // Front
        .rect(roofW-3, 3, 1, roofH-6, c_window_dark)
        .rect(2, 3, 2, roofH-6, c_window); // Rear
        
    // Side Windows
    roof.rect(5, 1, 14, 2, c_window) // Left
        .rect(5, roofH-3, 14, 2, c_window); // Right
        
    // Pillars (Black)
    roof.rect(11, 1, 2, 2, '#000')
        .rect(11, roofH-3, 2, 2, '#000');
        
    // Siren Lightbar (Detailed)
    const midX = 10;
    const midY = 6;
    roof.rect(midX, midY, 4, 6, '#212121') // Mount
        .rect(midX, midY, 4, 2, '#d32f2f') // Red (Left)
        .rect(midX, midY+4, 4, 2, '#1976d2') // Blue (Right)
        .pixel(midX+1, midY+1, '#ffcdd2') // Highlight
        .pixel(midX+1, midY+4, '#bbdefb'); // Highlight

    return {
        wheel: wheel.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        roof: roof.getCanvas()
    };
}
