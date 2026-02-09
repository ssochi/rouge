import { PixelDraw } from '../../utils/PixelDraw.js';

export function createDoorSprites() {
    // Match AdaptiveWall colors
    const cTop = '#95a5a6'; // Light Concrete
    const cFront = '#7f8c8d'; // Dark Concrete (Shadow)
    const cOutline = '#546e7a';
    const cHighlight = '#bdc3c7';
    
    // Wood Colors for Door Panel
    const cWoodLight = '#8d6e63';
    const cWoodDark = '#5d4037';
    const cWoodGrain = '#6d4c41';
    const cHandle = '#ffd700';

    const wallHeight = 16;
    const thickness = 12;
    const centerStart = 10;
    const centerEnd = 22;

    // --- Horizontal Door ---
    // Canvas 32x48
    // Frame: Left/Right Posts + Top Lintel
    // Panel: Moving part
    
    const hFrame = new PixelDraw(32, 48);
    const hPanel = new PixelDraw(32, 48);

    // 1. Horizontal Frame
    // Left Post (x=0..4, y=10..22)
    // Top Face
    hFrame.rect(0, 10, 4, 12, cTop);
    hFrame.hLine(0, 10, 4, cHighlight); // Top High
    hFrame.vLine(0, 10, 12, cHighlight); // Left High
    // Front Face (y=22..38)
    hFrame.rect(0, 22, 4, 16, cFront);
    hFrame.strokeRect(0, 22, 4, 16, cOutline);

    // Right Post (x=28..32, y=10..22)
    // Top Face
    hFrame.rect(28, 10, 4, 12, cTop);
    hFrame.hLine(28, 10, 4, cHighlight);
    // Front Face
    hFrame.rect(28, 22, 4, 16, cFront);
    hFrame.strokeRect(28, 22, 4, 16, cOutline);

    // Lintel (Header) (x=4..28, y=10..14)
    // A beam across the top.
    // Top Face
    hFrame.rect(4, 10, 24, 4, cTop);
    hFrame.hLine(4, 10, 24, cHighlight);
    // Front Face (Small drop) (y=14..18)
    hFrame.rect(4, 14, 24, 4, cFront);
    hFrame.rect(4, 14, 24, 1, cOutline); // Shadow under lip
    hFrame.hLine(4, 18, 24, cOutline); // Bottom edge of lintel

    // Threshold (Floor)
    // Removed "earth-colored rectangle" as per user request
    // hFrame.rect(4, 22, 24, 12, '#3e2723'); 

    // 2. Horizontal Panel (Closed)
    // Fits in x=4..28
    // Top Face (y=12..14) - Slightly recessed
    hPanel.rect(4, 12, 24, 2, cWoodLight);
    // Front Face (y=14..38) - Down to ground
    hPanel.rect(4, 14, 24, 24, cWoodLight);
    
    // Details
    hPanel.rect(4, 14, 24, 24, cWoodDark); // Outline (Dark Wood)
    // Wood Planks
    hPanel.vLine(10, 14, 24, cWoodGrain);
    hPanel.vLine(16, 14, 24, cWoodGrain);
    hPanel.vLine(22, 14, 24, cWoodGrain);
    // Handle
    hPanel.rect(24, 24, 2, 2, cHandle);


    // --- Vertical Door ---
    // Canvas 12x48 (Matches vertical wall segment width)
    // Actually, sprite needs to be full 32x48 to align easily if we want, 
    // but wall_v is 8x32.
    // Let's make it 32x48 to handle the full tile space, centering the 12px door.
    
    const vFrame = new PixelDraw(32, 48);
    const vPanel = new PixelDraw(32, 48);

    // Vertical Frame
    // Top Post (x=10..22, y=0..4)
    // Top Face
    vFrame.rect(10, 0, 12, 4, cTop);
    vFrame.vLine(10, 0, 4, cHighlight);
    // No Front Face (Hidden by Top)

    // Bottom Post (x=10..22, y=28..32)
    // Top Face
    vFrame.rect(10, 28, 12, 4, cTop);
    vFrame.vLine(10, 28, 4, cHighlight);
    // Front Face (y=32..48) - Exposed South Face
    vFrame.rect(10, 32, 12, 16, cFront);
    vFrame.strokeRect(10, 32, 12, 16, cOutline);

    // Lintel (Header) (x=10..22, y=4..28)
    // Just a beam at the top?
    // Hard to see in top-down. 
    // Maybe a thin cross bar at y=4..6?
    vFrame.rect(10, 4, 12, 2, cFront); // Dark beam

    // Threshold
    // Removed
    // vFrame.rect(10, 4, 12, 24, '#3e2723');

    // Vertical Panel
    // x=11..21 (Slightly inset width?), y=4..28
    // Top Face at y=4
    vPanel.rect(11, 4, 10, 24, cWoodLight);
    // Wood Grain (Horizontal)
    vPanel.hLine(11, 10, 10, cWoodGrain);
    vPanel.hLine(11, 16, 10, cWoodGrain);
    vPanel.hLine(11, 22, 10, cWoodGrain);
    // Handle
    vPanel.rect(12, 14, 2, 2, cHandle);

    return {
        door_h_frame: hFrame.getCanvas(),
        door_h_panel: hPanel.getCanvas(),
        door_v_frame: vFrame.getCanvas(),
        door_v_panel: vPanel.getCanvas()
    };
}
