import { PixelDraw } from '../../../utils/PixelDraw.js';
import { PALETTE } from '../../Palette.js';

/**
 * Procedural Generator for the Player Character
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Cool Guy (Long Hair, Sunglasses, Beard, Trench Coat)
 * Canvas: 32x32
 */
export class PlayerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;
        // Colors
        this.cSkin = PALETTE['s'];      // Skin Base
        this.cSkinShadow = PALETTE['S']; // Skin Shadow
        
        // Hair & Face
        this.cHair = '#2c1a0e';         // Dark Brown/Black Hair
        this.cHairHighlight = '#4e342e';
        this.cBeard = '#2c1a0e';        // Matching Beard
        this.cGlasses = '#111111';      // Black Sunglasses
        this.cGlassesRim = '#333333';   // Frame
        
        // Outfit (Trench Coat)
        this.cCoat = '#455a64';         // Blue Grey Coat (High contrast with beard)
        this.cCoatDark = '#263238';     // Coat Shadow/Inside
        this.cCoatLight = '#607d8b';    // Coat Highlight
        this.cShirt = '#95a5a6';        // Grey Shirt
        this.cPants = '#3949ab';        // Indigo/Denim Blue Jeans (Contrast with coat)
        this.cBoots = '#1a1a1a';        // Black Boots
    }

    /**
     * Generate a single frame based on pose parameters
     * @param {Object} pose - { headOffset: {x,y}, bodySquash: 1.0, legFrame: 0..N, hairWave: 0..1, coatWave: 0..1 }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);
        
        // Default Pose (Centered at bottom)
        const px = 16; 
        const py = 29; 
        
        // Super Chibi Proportions: Giant Head, Tiny Body
        const bodyY = 22 + (pose.bodySquash || 0);   
        const headY = 14 + (pose.headOffset?.y || 0); 

        // 1. Draw Legs (Behind coat)
        this.drawLegs(drawer, px, py, pose.legFrame || 'idle');

        // 2. Draw Body (Trench Coat)
        this.drawBody(drawer, px, bodyY, pose.coatWave || 0);

        // 3. Draw Head (Long Hair + Sunglasses)
        this.drawHead(drawer, px, headY, pose.hairWave || 0);

        return drawer.getCanvas();
    }

    /**
     * Draw the Head
     * Features: Long flowing hair, Sunglasses, Beard
     */
    drawHead(drawer, cx, cy, wavePhase) {
        // Head Dimensions (Giant ~16px wide)
        const w = 16;
        const h = 14;
        const x = cx - w/2;
        const y = cy - h + 4; 

        // -- Hair (Back Layer) --
        // Long hair flowing behind shoulders
        const hairY = y + 4;
        const wave = Math.sin(wavePhase * Math.PI * 2) * 1.5;
        
        drawer.fillPath([
            {x: x - 2 + wave, y: hairY + 8},
            {x: x, y: y + 2},
            {x: x + w, y: y + 2},
            {x: x + w + 2 + wave, y: hairY + 8},
            {x: x + w + wave, y: hairY + 12}, // Tips
            {x: x + wave, y: hairY + 12}
        ], this.cHair);

        // -- Face Shape --
        drawer.fillQuadCurve(x, y + 2, x - 1, y + h - 2, cx, y + h, this.cSkin); 
        drawer.fillQuadCurve(x + w, y + 2, x + w + 1, y + h - 2, cx, y + h, this.cSkin); 
        drawer.rect(x + 1, y + 2, w - 2, h - 3, this.cSkin); 
        
        // -- Beard --
        // Full beard covering chin and jaw
        drawer.fillPath([
            {x: x + 1, y: y + h - 5}, // Sideburn L
            {x: x + 1, y: y + h - 1}, // Jaw L
            {x: cx, y: y + h + 1},    // Chin point
            {x: x + w - 1, y: y + h - 1}, // Jaw R
            {x: x + w - 1, y: y + h - 5}, // Sideburn R
            {x: x + w - 3, y: y + h - 3}, // Cheek R
            {x: x + 3, y: y + h - 3}      // Cheek L
        ], this.cBeard);
        // Mustache
        drawer.rect(cx - 3, y + h - 4, 6, 2, this.cBeard);

        // -- Sunglasses --
        const glassesY = y + 5;
        // Lenses
        drawer.rect(x + 2, glassesY, 5, 3, this.cGlasses); // Left
        drawer.rect(x + 9, glassesY, 5, 3, this.cGlasses); // Right
        // Bridge
        drawer.hLine(x + 7, glassesY + 1, 2, this.cGlassesRim);
        // Frame/Arms
        drawer.pixel(x + 1, glassesY + 1, this.cGlassesRim);
        drawer.pixel(x + 14, glassesY + 1, this.cGlassesRim);
        // Reflection
        drawer.pixel(x + 3, glassesY, '#ffffff'); // Bright highlight
        drawer.pixel(x + 10, glassesY, '#ffffff');

        // -- Hair (Front/Top Layer) --
        // Top Dome
        drawer.fillQuadCurve(
            x - 1, y + 4,
            cx, y - 4,
            x + w + 1, y + 4,
            this.cHair
        );
        // Bangs/Side Framing
        drawer.fillPath([
            {x: x - 1, y: y + 2},
            {x: x + 2, y: y + 2},
            {x: x + 1, y: y + 8}, // Left strand
            {x: x - 2, y: y + 6}
        ], this.cHair);
        drawer.fillPath([
            {x: x + w + 1, y: y + 2},
            {x: x + w - 2, y: y + 2},
            {x: x + w - 1, y: y + 8}, // Right strand
            {x: x + w + 2, y: y + 6}
        ], this.cHair);
        
        // Hair Highlight
        drawer.hLine(cx - 3, y, 6, this.cHairHighlight);
    }

    /**
     * Draw the Body (Trench Coat)
     */
    drawBody(drawer, cx, cy, coatWave = 0) {
        // Torso Box
        const w = 10;
        const h = 7; 
        const x = cx - w/2;
        const y = cy - h + 2; 

        // Shirt (Visible in middle)
        drawer.rect(cx - 2, y, 4, h, this.cShirt);

        // Trench Coat (Upper)
        // Left Panel
        drawer.fillPath([
            {x: x, y: y},
            {x: x + 3, y: y},
            {x: x + 3, y: y + h},
            {x: x - 1, y: y + h},
            {x: x - 2, y: y + 2} // Shoulder
        ], this.cCoat);
        
        // Right Panel
        drawer.fillPath([
            {x: x + w, y: y},
            {x: x + w - 3, y: y},
            {x: x + w - 3, y: y + h},
            {x: x + w + 1, y: y + h},
            {x: x + w + 2, y: y + 2} // Shoulder
        ], this.cCoat);

        // Coat Collar (Pop up)
        drawer.fillPath([
            {x: x - 1, y: y + 2},
            {x: x + 2, y: y + 4},
            {x: x, y: y}
        ], this.cCoatLight);
        drawer.fillPath([
            {x: x + w + 1, y: y + 2},
            {x: x + w - 2, y: y + 4},
            {x: x + w, y: y}
        ], this.cCoatLight);

        // Coat Tails (Long, covering sides of legs)
        // Dynamic sway: 
        // We want the tails to swing opposite to movement or just wave in the wind.
        // Assuming character moves Left (-X), air drag pushes coat Right (+X).
        // Let's use coatWave (0..1) to drive a sine wave.
        // If coatWave is based on run cycle (0..1), we can map it to swing.
        
        // Swing Amplitude: +/- 2 pixels
        // Use Sin(coatWave * 2PI)
        
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        // Also flare out a bit?
        const flare = Math.abs(swing) * 0.5;

        const tailY = y + h;
        const tailH = 6;
        
        // Left Tail (Back/Left side)
        // Base X points: x-3, x+2. 
        // Add swing to bottom X points.
        // MODIFIED: Shift inner point from x+2 to x+1 to expose more leg
        drawer.fillPath([
            {x: x - 1, y: tailY}, // Top Left
            {x: x + 2, y: tailY}, // Top Right (Join) -> Reduced overlap
            {x: x + 1 + swing + flare, y: tailY + tailH}, // Bottom Right -> Opened up
            {x: x - 3 + swing - flare, y: tailY + tailH}  // Bottom Left
        ], this.cCoat);

        // Right Tail (Front/Right side)
        // Base X points: x+w-2, x+w+3.
        // Add swing to bottom X points.
        // MODIFIED: Shift inner point from x+w-2 to x+w-1 to expose more leg
        drawer.fillPath([
            {x: x + w + 1, y: tailY}, // Top Right
            {x: x + w - 2, y: tailY}, // Top Left (Join) -> Reduced overlap
            {x: x + w - 1 + swing - flare, y: tailY + tailH}, // Bottom Left -> Opened up
            {x: x + w + 3 + swing + flare, y: tailY + tailH}  // Bottom Right
        ], this.cCoat);
    }

    /**
     * Draw Legs with dynamic poses
     * @param {Object|string} pose - {left: string, right: string} or 'idle'
     */
    drawLegs(drawer, cx, cy, pose) {
        let leftPose = 'idle';
        let rightPose = 'idle';

        if (typeof pose === 'string') {
            leftPose = pose;
            rightPose = pose;
        } else if (pose && typeof pose === 'object') {
            leftPose = pose.left || 'idle';
            rightPose = pose.right || 'idle';
        }

        // Left Leg (Back Layer) - x-4
        this.drawOneLeg(drawer, cx - 4, cy, leftPose, true);

        // Right Leg (Front Layer) - x+1
        this.drawOneLeg(drawer, cx + 1, cy, rightPose, false);
    }

    /**
     * Draw a single leg based on pose
     */
    drawOneLeg(drawer, x, y, pose, isBack) {
        const legW = 3;
        const legH = 4;
        const P = this.cPants;
        const B = this.cBoots;

        // Base Top (Thigh) - always at x, y-legH
        // But running moves the feet.
        // Actually, let's treat (x,y) as the Hip pivot point approx.
        // cy passed in is 29 (bottom of feet in idle).
        // So Hip Y is approx 29 - 4 = 25.
        
        const hipY = y - legH; 

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.rect(x, hipY + legH - 1, legW, 2, B);
        }
        else if (pose === 'fwd1') { // Slight Forward
            // Hip
            drawer.rect(x, hipY, legW, 2, P);
            // Shin (Diagonal Fwd)
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.pixel(x - 1, hipY + 3, P);
            // Boot
            drawer.rect(x - 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'fwd2') { // Full Forward (Contact)
            // Hip
            drawer.rect(x, hipY, legW, 2, P);
            // Shin (More Diagonal)
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.pixel(x - 2, hipY + 2, P);
            drawer.pixel(x - 1, hipY + 2, P);
            // Boot
            drawer.rect(x - 3, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back1') { // Slight Back
            // Hip
            drawer.rect(x, hipY, legW, 2, P);
            // Shin
            drawer.pixel(x + 1, hipY + 2, P);
            drawer.pixel(x + 2, hipY + 2, P);
            // Boot
            drawer.rect(x + 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back2') { // Full Back (Push)
            // Hip
            drawer.rect(x, hipY, legW, 2, P);
            // Shin
            drawer.pixel(x + 1, hipY + 1, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.pixel(x + 3, hipY + 2, P);
            // Boot
            drawer.rect(x + 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'knee') { // Knee Up (Pass)
            // Thigh (Horizontal-ish)
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 1, P); // Knee bulge
            // Shin (Vertical down from knee)
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            // Boot (High)
            drawer.rect(x - 1, hipY + 2, legW, 2, B);
        }
        else if (pose === 'tuck') { // Tucked Back (Air)
            // Thigh
            drawer.rect(x, hipY, legW, 2, P);
            // Shin (Back)
            drawer.pixel(x + 2, hipY + 1, P);
            drawer.pixel(x + 3, hipY + 2, P);
            // Boot (High Back)
            drawer.rect(x + 2, hipY + 1, legW, 2, B);
        }
    }
}
