import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Turret Deployer Gun - Chunky tube launcher, military green/grey
 * Dimensions: 30x14
 */
export function generateTurretDeployer() {
    const width = 30;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // --- High-Fidelity Color Palette ---
    // Military Camo Greens
    const gSpec  = '#8aa879'; // Extreme edge highlight
    const gLight = '#607d53'; // Top lit area
    const gBase  = '#475e3c'; // Base midtone
    const gCamo  = '#3b5032'; // Camo breaking pattern
    const gShad  = '#2a3b22'; // Core shadow
    const gDeep  = '#192613'; // Underneath shadow
    const gBounc = '#324528'; // Reflected ground light

    // Gunmetal / Dark Steels
    const mSpec  = '#b6c2c9'; // Shiny metal top
    const mLight = '#78868f'; // Metal lit
    const mBase  = '#546066'; // Metal midtone
    const mShad  = '#313a3f'; // Metal shadow
    const mBounc = '#414e54'; // Metal reflected light
    const mDark  = '#181d22'; // Deepest metal

    // Polymers / Grip Plastics
    const pLight = '#494d50';
    const pBase  = '#2b2d30';
    const pShad  = '#151718';
    const blk    = '#090a0b';

    // UI & Accents
    const ledGlow = '#48ffd1'; // Center neon
    const ledMid  = '#00b894'; // Aura
    const ledBg   = '#00362c'; // Dark screen back
    const wSpec   = '#ffeaa7'; // Yellow caution highlight
    const wYel    = '#e1b12c'; // Yellow base
    const wOkre   = '#a57d15'; // Yellow shadow

    // --- 1. Background / Under-Elements ---
    // Rear Grip / Trigger Handle
    drawer.rect(9, 10, 4, 4, pBase);
    drawer.vLine(9, 11, 3, pLight);   // Grip highlight
    drawer.rect(10, 13, 2, 1, pShad); // Base shadowing
    drawer.pixel(9, 13, blk); drawer.pixel(12, 13, blk); // Roundting

    // Trigger Guard & Trigger
    drawer.vLine(13, 11, 2, pShad);
    drawer.pixel(13, 10, pLight);
    drawer.pixel(14, 11, pBase); // Guard extension
    drawer.pixel(14, 12, pShad);

    // Front Grip (Angled tactical block)
    drawer.rect(17, 10, 4, 4, pShad);
    drawer.rect(18, 10, 3, 3, pBase);
    drawer.vLine(18, 11, 2, pLight);
    drawer.pixel(20, 13, blk);

    // --- 2. Main Tube Body (Cylindrical Lighting) ---
    // Extends from x: 4 to 19, y: 3 to 10
    // Shading bands to create roundness
    drawer.hLine(4, 3, 16, gSpec);  // Top rim light
    drawer.rect(4, 4, 16, 2, gLight); // Upper bright
    drawer.hLine(4, 6, 16, gBase);  // Mid section
    drawer.hLine(4, 7, 16, gCamo);  // Transition/Shadow zone
    drawer.hLine(4, 8, 16, gShad);  // Core cylindrical shadow
    drawer.hLine(4, 9, 15, gDeep);  // Deep underside
    drawer.hLine(5, 10, 14, gBounc); // Reflected bounce light (CRITICAL for 3D feel)

    // Detailing: Camo Patches & Wear
    drawer.pixel(7, 5, gCamo); drawer.pixel(8, 4, gCamo);
    drawer.pixel(15, 5, gShad); drawer.pixel(16, 6, gShad);
    drawer.pixel(10, 5, gBase); drawer.pixel(11, 4, gBase);
    drawer.pixel(6, 6, gLight);
    drawer.pixel(17, 8, blk); // Scratch

    // Detailing: Structural Panel Bands
    drawer.vLine(8, 3, 8, gDeep); drawer.vLine(9, 3, 8, gLight);
    drawer.vLine(15, 3, 8, gDeep); drawer.vLine(16, 3, 8, gLight);

    // Detailing: Caution Striping (x: 19, 20) before muzzle
    drawer.rect(19, 3, 2, 8, wYel);
    drawer.hLine(19, 3, 2, wSpec); // Specular on yellow
    drawer.hLine(19, 8, 2, wOkre); // Shadow on yellow
    drawer.hLine(19, 9, 2, gDeep); // Deep under
    drawer.hLine(19, 10, 2, gBounc); // Bounce
    // Hazard diagonal stripes (Black over yellow)
    drawer.pixel(19, 4, blk); drawer.pixel(20, 5, blk);
    drawer.pixel(19, 7, blk); drawer.pixel(20, 8, blk);

    // --- 3. Rear Stock Assembly ---
    // Adjustable military stock padding
    drawer.rect(0, 4, 3, 6, pBase);
    drawer.vLine(0, 4, 6, pShad); // Back pad curve/shadow
    drawer.pixel(0, 4, blk); drawer.pixel(0, 9, blk); // Smooth ends
    drawer.rect(1, 5, 2, 4, pLight); // Inner cheek rest

    // Metal connecting rod to main tube
    drawer.rect(2, 4, 2, 6, mBase);
    drawer.hLine(2, 4, 2, mSpec);
    drawer.hLine(2, 8, 2, mShad);
    drawer.hLine(2, 9, 2, blk);

    // --- 4. Chunky Muzzle / Launcher End ---
    // Massive metallic block (x: 21 to 28)
    drawer.rect(21, 2, 7, 10, mBase); // Base block
    drawer.hLine(21, 2, 7, mLight);
    drawer.hLine(21, 3, 7, mSpec); // Glinting top edge
    drawer.hLine(21, 4, 7, mBase); // Mid
    drawer.rect(21, 5, 7, 3, mShad); // Curve down
    drawer.hLine(21, 8, 7, mDark); // Core metal shadow
    drawer.hLine(21, 9, 6, blk); // Pit
    drawer.hLine(21, 10, 5, mBounc); // Metal bounce light
    drawer.hLine(22, 11, 4, mDark); // Lowest bevel

    // Muzzle Ribbing/Grooves
    drawer.vLine(23, 2, 10, mDark); drawer.vLine(24, 2, 8, mLight);
    drawer.vLine(25, 2, 10, mDark); drawer.vLine(26, 2, 8, mLight);

    // Front Opening / Bore
    // creating a recessed, dark inner barrel
    drawer.vLine(27, 3, 8, mShad);
    drawer.rect(28, 4, 2, 5, blk); // Inner black void
    drawer.vLine(28, 4, 5, '#151515'); // Gradient into hole
    drawer.pixel(27, 4, mSpec); // Catch light on the front rim top
    drawer.pixel(27, 8, mDark); // Shadow on rim bottom
    drawer.pixel(29, 6, '#000'); // Deepest part of the barrel

    // --- 5. Tactical Rails & Sights ---
    // Picatinny Rail Top (x: 5 to 13)
    drawer.hLine(5, 2, 9, mDark);
    for (let i = 5; i <= 13; i += 2) {
        drawer.pixel(i, 2, mLight); // Rail teeth
    }

    // Rear Holo Sight
    drawer.rect(7, 0, 3, 3, pBase);
    drawer.pixel(7, 0, pLight); // Frame highlight
    drawer.pixel(9, 2, pShad);
    drawer.pixel(8, 1, 'rgba(0, 255, 160, 0.4)'); // Glass tint
    drawer.pixel(9, 1, mLight); // Reticle housing detail

    // Front Iron Sight (Folding leaf)
    drawer.rect(25, 0, 2, 2, pBase);
    drawer.pixel(25, 0, pLight);
    drawer.pixel(26, 1, blk);

    // --- 6. Ammunition Status Screen (Focal glow point) ---
    // Housing / Bezel embedded in the tube
    drawer.rect(11, 4, 4, 4, pShad);
    drawer.rect(11, 4, 1, 4, pBase); // Left lip
    drawer.hLine(12, 4, 3, pBase); // Top lip

    // The digital display panel
    drawer.rect(12, 5, 3, 3, ledBg); // Deep screen background

    // High-tech UI elements
    drawer.hLine(12, 6, 2, ledMid); // Bar graph or text base
    drawer.pixel(13, 6, ledGlow);   // Bright hot-center (Neon effect)
    drawer.pixel(14, 7, ledMid);    // Secondary dot/counter

    // Glass glare reflection (Top-left to imply glossy finish)
    drawer.pixel(12, 5, 'rgba(255, 255, 255, 0.5)');
    drawer.pixel(14, 5, ledBg); // Ensure upper right is dark for contrast

    return drawer.getCanvas();
}
