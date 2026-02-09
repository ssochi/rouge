import { PixelDraw } from '../../utils/PixelDraw.js';
import { WALL_COLORS, addBlockTexture } from './WallTexture.js';

export function createDoorSprites() {
    const { cTop, cFront, cOutline, cHighlight, cMortarTop, cMortarFront } = WALL_COLORS;

    // Wood colors
    const cWoodLight = '#8d6e63';
    const cWoodDark = '#5d4037';
    const cWoodGrain = '#6d4c41';
    const cWoodHighlight = '#a1887f';
    const cWoodShadow = '#4e342e';

    // Handle colors (brass)
    const cHandle = '#c0a030';
    const cHandleLight = '#e0c860';
    const cHandleDark = '#907020';

    // --- Horizontal Door ---
    const hFrame = new PixelDraw(32, 48);
    const hPanel = new PixelDraw(32, 48);

    // 1. Horizontal Frame
    // Left Post - Top Face (x=0..4, y=10..22)
    hFrame.rect(0, 10, 4, 12, cTop);
    addBlockTexture(hFrame, 0, 10, 4, 12, cMortarTop, 8, 4);
    hFrame.hLine(0, 10, 4, cHighlight);
    hFrame.vLine(0, 10, 12, cHighlight);
    // Left Post - Front Face (y=22..38)
    hFrame.rect(0, 22, 4, 16, cFront);
    addBlockTexture(hFrame, 0, 22, 4, 16, cMortarFront, 8, 4);
    hFrame.vLine(0, 22, 16, cOutline);
    hFrame.vLine(3, 22, 16, cOutline);
    hFrame.hLine(0, 37, 4, cOutline);

    // Right Post - Top Face (x=28..32, y=10..22)
    hFrame.rect(28, 10, 4, 12, cTop);
    addBlockTexture(hFrame, 28, 10, 4, 12, cMortarTop, 8, 4);
    hFrame.hLine(28, 10, 4, cHighlight);
    // Right Post - Front Face (y=22..38)
    hFrame.rect(28, 22, 4, 16, cFront);
    addBlockTexture(hFrame, 28, 22, 4, 16, cMortarFront, 8, 4);
    hFrame.vLine(28, 22, 16, cOutline);
    hFrame.vLine(31, 22, 16, cOutline);
    hFrame.hLine(28, 37, 4, cOutline);

    // Lintel - Top Face (x=4..28, y=10..14)
    hFrame.rect(4, 10, 24, 4, cTop);
    addBlockTexture(hFrame, 4, 10, 24, 4, cMortarTop, 8, 4);
    hFrame.hLine(4, 10, 24, cHighlight);
    // Lintel - Front Face (y=14..18, 4px drop)
    hFrame.rect(4, 14, 24, 4, cFront);
    hFrame.hLine(4, 14, 24, cOutline);
    hFrame.hLine(4, 17, 24, cOutline);

    // 2. Horizontal Panel
    // Top face (thin wood strip visible from above)
    hPanel.rect(4, 12, 24, 2, cWoodLight);
    hPanel.hLine(4, 12, 24, cWoodHighlight);

    // Front face - dark wood border frame
    hPanel.rect(4, 14, 24, 24, cWoodDark);
    // Inner panel (lighter wood, inset 2px)
    hPanel.rect(6, 16, 20, 20, cWoodLight);

    // Cross rail (horizontal divider bar)
    hPanel.rect(6, 25, 20, 2, cWoodDark);

    // Upper panel bevels
    hPanel.hLine(6, 16, 20, cWoodHighlight);
    hPanel.hLine(6, 24, 20, cWoodGrain);
    // Lower panel bevels
    hPanel.hLine(6, 27, 20, cWoodHighlight);
    hPanel.hLine(6, 35, 20, cWoodGrain);

    // Vertical plank divider
    hPanel.vLine(16, 16, 20, cWoodGrain);

    // Wood grain (subtle horizontal lines)
    for (let y = 19; y < 24; y += 3) {
        hPanel.hLine(7, y, 8, cWoodGrain);
        hPanel.hLine(17, y, 8, cWoodGrain);
    }
    for (let y = 30; y < 35; y += 3) {
        hPanel.hLine(7, y, 8, cWoodGrain);
        hPanel.hLine(17, y, 8, cWoodGrain);
    }

    // Handle (brass knob, 3x3)
    hPanel.rect(23, 25, 3, 3, cHandle);
    hPanel.pixel(23, 25, cHandleLight);
    hPanel.pixel(25, 27, cHandleDark);

    // --- Vertical Door ---
    const vFrame = new PixelDraw(32, 48);
    const vPanel = new PixelDraw(32, 48);

    // 1. Vertical Frame
    // Top Post (x=10..22, y=0..4)
    vFrame.rect(10, 0, 12, 4, cTop);
    addBlockTexture(vFrame, 10, 0, 12, 4, cMortarTop, 8, 4);
    vFrame.vLine(10, 0, 4, cHighlight);

    // Bottom Post (x=10..22, y=28..32)
    vFrame.rect(10, 28, 12, 4, cTop);
    addBlockTexture(vFrame, 10, 28, 12, 4, cMortarTop, 8, 4);
    vFrame.vLine(10, 28, 4, cHighlight);
    // Bottom Post - Front Face (y=32..48)
    vFrame.rect(10, 32, 12, 16, cFront);
    addBlockTexture(vFrame, 10, 32, 12, 16, cMortarFront, 8, 4);
    vFrame.vLine(10, 32, 16, cOutline);
    vFrame.vLine(21, 32, 16, cOutline);
    vFrame.hLine(10, 47, 12, cOutline);

    // Lintel beam (x=10..22, y=4..6)
    vFrame.rect(10, 4, 12, 2, cFront);
    vFrame.hLine(10, 5, 12, cOutline);

    // 2. Vertical Panel
    // Dark border frame
    vPanel.rect(11, 4, 10, 24, cWoodDark);
    // Inner wood
    vPanel.rect(12, 5, 8, 22, cWoodLight);
    // Edge highlight
    vPanel.hLine(12, 5, 8, cWoodHighlight);

    // Horizontal plank lines
    vPanel.hLine(12, 11, 8, cWoodGrain);
    vPanel.hLine(12, 17, 8, cWoodGrain);
    vPanel.hLine(12, 23, 8, cWoodGrain);

    // Vertical center divider
    vPanel.vLine(16, 5, 22, cWoodGrain);

    // Handle
    vPanel.rect(13, 13, 2, 3, cHandle);
    vPanel.pixel(13, 13, cHandleLight);

    return {
        door_h_frame: hFrame.getCanvas(),
        door_h_panel: hPanel.getCanvas(),
        door_v_frame: vFrame.getCanvas(),
        door_v_panel: vPanel.getCanvas()
    };
}
