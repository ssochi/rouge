import { PixelDraw } from '../../utils/PixelDraw.js';

export function createTruckSprite() {
    // Truck Dimensions (Larger)
    const w = 64;
    const h = 28;
    
    // Colors
    const c_tire = '#1a1a1a';
    const c_chassis = '#37474f';
    const c_cab = '#c62828'; // Red Cab
    const c_cab_dark = '#b71c1c';
    const c_cargo = '#eeeeee'; // White Cargo
    const c_cargo_dark = '#e0e0e0';
    const c_cargo_detail = '#bdbdbd';
    const c_window = '#81d4fa';
    const c_chrome = '#cfd8dc';

    // 1. Wheel Sprite (Larger, Heavy Duty)
    const wheel = new PixelDraw(8, 12);
    wheel.rect(1, 0, 6, 12, c_tire)
         .rect(0, 1, 8, 10, c_tire)
         .rect(2, 2, 4, 8, '#78909c') // Steel Rim
         .rect(3, 4, 2, 4, '#263238') // Hub
         .pixel(2, 2, '#fff') // Highlight
         .pixel(5, 9, '#37474f'); // Shadow

    // 2. Chassis (Long frame)
    const chassis = new PixelDraw(w, h);
    // Main Rails
    chassis.rect(0, 4, w, h-8, c_chassis) 
           .rect(1, 5, w-2, h-10, '#263238'); // Inner shadow
           
    // Front Bumper (Heavy Chrome)
    chassis.rect(w-4, 2, 4, h-4, c_chrome)
           .rect(w-3, 4, 3, h-8, '#b0bec5'); // Detail
           
    // Rear Bumper (Steel bar)
    chassis.rect(0, 4, 2, h-8, '#263238')
           .rect(0, 4, 1, h-8, '#cfd8dc'); // Highlight
           
    // Fuel Tanks (Side)
    chassis.rect(w-24, 0, 12, 4, c_chrome) // Left Tank
           .rect(w-24, h-4, 12, 4, c_chrome) // Right Tank
           .hLine(w-24, 1, 12, '#eceff1') // Highlight
           .hLine(w-24, h-2, 12, '#eceff1');
           
    // Mudguards
    // Front Wheels (x ~ w-12)
    chassis.rect(w-15, 1, 12, 3, '#111')
           .rect(w-15, h-4, 12, 3, '#111');
           
    // Rear Wheels (Dual Axle area)
    chassis.rect(4, 1, 22, 3, '#111')
           .rect(4, h-4, 22, 3, '#111');

    // 3. Body (Cab + Cargo)
    const bodyW = 60;
    const bodyH = 24;
    const body = new PixelDraw(bodyW, bodyH);
    
    // Cab (Front)
    const cabW = 18;
    const cabX = bodyW - cabW;
    
    // Cab Base
    body.rect(cabX, 0, cabW, bodyH, c_cab)
        .rect(cabX, 0, cabW, 2, c_cab_dark) // Side shadow
        .rect(cabX, bodyH-2, cabW, 2, c_cab_dark);
        
    // Cab Door Details
    body.rect(cabX + 4, 2, 1, bodyH-4, c_cab_dark) // Door gap
        .rect(cabX + 8, 1, 3, 1, '#8d6e63') // Handle
        .rect(cabX + 8, bodyH-2, 3, 1, '#8d6e63');
        
    // Front Grille
    body.rect(cabX + 14, 4, 4, bodyH-8, '#212121')
        .hLine(cabX + 14, 6, 4, '#bdbdbd')
        .hLine(cabX + 14, 9, 4, '#bdbdbd')
        .hLine(cabX + 14, 12, 4, '#bdbdbd')
        .hLine(cabX + 14, 15, 4, '#bdbdbd');
        
    // Headlights (Vertical Stack)
    body.rect(cabX + 15, 1, 3, 3, '#fff176') // Top Left
    body.rect(cabX + 15, bodyH-4, 3, 3, '#fff176') // Top Right
        .rect(cabX + 16, 1, 1, 1, '#fff') // Glint
        .rect(cabX + 16, bodyH-4, 1, 1, '#fff');
        
    // Exhaust Pipes (Behind Cab)
    body.rect(cabX - 2, 0, 2, 6, c_chrome)
        .rect(cabX - 2, bodyH-6, 2, 6, c_chrome);
        
    // Cargo Container (Rear)
    const cargoW = 40;
    // Corrugated Metal Texture
    body.rect(0, 0, cargoW, bodyH, c_cargo);
    
    for(let i=0; i<cargoW; i+=4) {
        body.vLine(i, 0, bodyH, c_cargo_dark);
        body.vLine(i+1, 0, bodyH, '#fff'); // Highlight
    }
    
    // Cargo Frame
    body.rect(0, 0, cargoW, 2, c_cargo_detail)
        .rect(0, bodyH-2, cargoW, 2, c_cargo_detail)
        .rect(0, 0, 2, bodyH, c_cargo_detail)
        .rect(cargoW-2, 0, 2, bodyH, c_cargo_detail);
        
    // Taillights on Cargo
    body.rect(0, 2, 1, 4, '#d32f2f')
        .rect(0, bodyH-6, 1, 4, '#d32f2f');

    // 4. Roof (Cab Roof + Cargo Top)
    const roofW = 60;
    const roofH = 20;
    const roof = new PixelDraw(roofW, roofH);
    
    // Cargo Roof (Textured)
    roof.rect(0, 0, 40, roofH, '#e0e0e0');
    for(let i=0; i<40; i+=4) {
        roof.vLine(i, 0, roofH, '#f5f5f5');
    }
    
    // Cab Roof
    const cabRoofX = 42;
    roof.rect(cabRoofX, 2, 14, roofH-4, c_cab)
        .rect(cabRoofX+2, 4, 10, roofH-8, c_cab_dark); // Top definition
        
    // Windshield
    roof.rect(cabRoofX + 10, 3, 3, roofH-6, c_window)
        .rect(cabRoofX + 11, 4, 1, roofH-8, '#b3e5fc'); // Glint
        
    // Air Horns
    roof.rect(cabRoofX + 4, 4, 4, 2, c_chrome)
        .rect(cabRoofX + 4, roofH-6, 4, 2, c_chrome);

    return {
        wheel: wheel.getCanvas(),
        chassis: chassis.getCanvas(),
        body: body.getCanvas(),
        roof: roof.getCanvas()
    };
}
