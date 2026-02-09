import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Hunter Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Bandit / Rogue Mercenary
 */
export class HunterGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;
        
        // Colors - Bandit/Rogue Theme (Bad Guy)
        this.cHood = '#37474f';         // Dark Blue-Grey Hood/Bandana
        this.cHoodLight = '#546e7a';    // Hood Highlight (Texture)
        this.cHoodShadow = '#263238';   // Hood Shadow
        
        this.cMask = '#d32f2f';         // Red Bandana Mask
        this.cMaskPattern = '#ffffff';  // White Polka Dots
        this.cMaskShadow = '#b71c1c';   // Mask Shadow
        
        this.cHair = '#212121';         // Black Long Hair
        this.cHairHighlight = '#424242'; // Hair Highlight
        
        this.cGoggles = '#ff9800';      // Amber/Orange Goggles
        this.cGogglesHigh = '#ffcc80';  // Lens Highlight
        this.cGogglesRim = '#212121';   // Dark Frame
        
        this.cCoat = '#5d4037';         // Brown Leather Vest
        this.cCoatDark = '#3e2723';     // Vest Shadow
        this.cShirt = '#455a64';        // Grey Shirt
        this.cScarf = '#c62828';        // Red Scarf (Darker red)
        this.cScarfLight = '#e53935';   // Scarf Highlight
        
        this.cPants = '#424242';        // Dark Grey Pants
        this.cBoots = '#212121';        // Black Boots
        this.cSkin = '#e0a880';         // Warm Tan Skin (Not pale/white)
        this.cSkinShadow = '#a1887f';   // Skin Shadow
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset: {x,y}, bodySquash: number, legFrame: string|object, coatWave: number }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);
        
        const cx = 16;
        const cy = 29; // Ground Y
        
        const bodyY = 22 + (pose.bodySquash || 0);
        // Head Position
        const headY = 14 + (pose.headOffset?.y || 0);
        
        // 1. Draw Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');
        
        // 2. Draw Body (Leather Vest) - Now with dynamic coat tails
        this.drawBody(drawer, cx, bodyY, pose.coatWave || 0);
        
        // 3. Draw Head (Bandana/Hood & Goggles)
        this.drawHead(drawer, cx, headY);

        return drawer.getCanvas();
    }
    
    // Removed drawHairBack

    drawHead(drawer, cx, cy) {
        const w = 18;
        const h = 16;
        const x = cx - w/2;
        const y = cy - h + 4;
        
        // -- Hood / Headwrap (Textured) --
        // Base Shape
        drawer.fillQuadCurve(x, y + 5, cx, y - 2, x + w, y + 5, this.cHood);
        // Texture/Folds on Hood
        drawer.hLine(x + 4, y + 1, 3, this.cHoodLight);
        drawer.hLine(x + 10, y + 2, 4, this.cHoodLight);
        drawer.pixel(cx, y, this.cHoodLight);
        // Shadow under rim
        drawer.hLine(x + 2, y + 4, w - 4, this.cHoodShadow);

        // -- Face Area (Skin) --
        // Forehead / Eye area
        drawer.rect(x + 2, y + 4, w - 4, 6, this.cSkin);
        // Skin Shadow (Top under hood)
        drawer.hLine(x + 2, y + 4, w - 4, this.cSkinShadow);
        // Skin Shadow (Sides)
        drawer.vLine(x + 2, y + 4, 6, this.cSkinShadow);
        drawer.vLine(x + w - 3, y + 4, 6, this.cSkinShadow);

        // -- Mask (Lower Face - Red with White Dots) --
        // Curved top edge for mask (nose bridge)
        const maskY = y + 9;
        drawer.fillPath([
            {x: x + 2, y: maskY},
            {x: cx, y: maskY - 1}, // Nose bridge up
            {x: x + w - 2, y: maskY},
            {x: x + w - 2, y: y + h - 1}, // Jaw R
            {x: cx, y: y + h + 1},        // Chin
            {x: x + 2, y: y + h - 1}      // Jaw L
        ], this.cMask);
        
        // Mask Pattern (White Dots)
        drawer.pixel(x + 4, maskY + 2, this.cMaskPattern);
        drawer.pixel(x + 7, maskY + 3, this.cMaskPattern);
        drawer.pixel(x + 10, maskY + 2, this.cMaskPattern);
        drawer.pixel(x + 13, maskY + 4, this.cMaskPattern);
        drawer.pixel(cx, maskY + 5, this.cMaskPattern);

        // -- Goggles (Detailed) --
        const gY = y + 5;
        // Strap (Dark, going behind)
        drawer.rect(x, gY + 2, w, 2, '#212121'); 

        // Frames (Dark Grey)
        // Left
        drawer.rect(x + 2, gY, 6, 5, this.cGogglesRim);
        // Right
        drawer.rect(x + 10, gY, 6, 5, this.cGogglesRim);
        
        // Lenses (Amber)
        drawer.rect(x + 3, gY + 1, 4, 3, this.cGoggles);
        drawer.rect(x + 11, gY + 1, 4, 3, this.cGoggles);
        
        // Lens Highlights (Reflections)
        drawer.pixel(x + 4, gY + 1, this.cGogglesHigh);
        drawer.pixel(x + 12, gY + 1, this.cGogglesHigh);

        // -- Hood Sides (Draping down) --
        drawer.fillPath([
            {x: x - 1, y: y + 5},
            {x: x + 2, y: y + 4},
            {x: x + 2, y: y + 10},
            {x: x - 2, y: y + 12}
        ], this.cHood);
        // Side Highlights
        drawer.vLine(x, y + 6, 4, this.cHoodLight);

        drawer.fillPath([
            {x: x + w + 1, y: y + 5},
            {x: x + w - 2, y: y + 4},
            {x: x + w - 2, y: y + 10},
            {x: x + w + 2, y: y + 12}
        ], this.cHood);
    }

    drawBody(drawer, cx, cy, coatWave = 0) {
        // Burly Body
        const w = 14; 
        const h = 9;
        const x = cx - w/2;
        const y = cy - h + 2;
        
        // Scarf (Red, Textured)
        drawer.fillPath([
            {x: x + 1, y: y - 1},
            {x: x + w - 1, y: y - 1},
            {x: x + w + 1, y: y + 2},
            {x: cx, y: y + 6}, // Point down lower
            {x: x - 1, y: y + 2}
        ], this.cScarf);
        // Scarf Highlight/Folds
        drawer.hLine(x + 3, y + 1, 2, this.cScarfLight);
        drawer.pixel(cx + 1, y + 3, this.cScarfLight);
        
        // Leather Coat/Vest (Longer now to replace hair)
        // Shoulders
        drawer.rect(x - 1, y + 1, 4, 3, this.cCoat);
        drawer.rect(x + w - 3, y + 1, 4, 3, this.cCoat);
        // Shoulder Highlight
        drawer.hLine(x, y + 1, 2, '#6d4c41');
        drawer.hLine(x + w - 2, y + 1, 2, '#6d4c41');
        
        // Main Body
        drawer.rect(x + 1, y + 2, w - 2, h - 2, this.cCoat);
        // Vest Shadow (Sides)
        drawer.vLine(x + 1, y + 2, h - 2, this.cCoatDark);
        drawer.vLine(x + w - 2, y + 2, h - 2, this.cCoatDark);
        
        // Shirt visible in middle
        drawer.rect(cx - 2, y + 2, 4, h - 2, this.cShirt);
        
        // Coat Tails (Dynamic)
        // Replaces the "Hair" physics with "Coat" physics
        // Two long tails draping down the back
        const tailY = y + h - 2;
        const tailH = 6;
        
        // Swing physics (sine wave from pose)
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        const flare = Math.abs(swing) * 0.5;
        
        // Left Tail (Back)
        drawer.fillPath([
            {x: x + 1, y: tailY},
            {x: x + 5, y: tailY},
            {x: x + 4 + swing + flare, y: tailY + tailH},
            {x: x + swing - flare, y: tailY + tailH}
        ], this.cCoat);
        
        // Right Tail (Back)
        drawer.fillPath([
            {x: x + w - 5, y: tailY},
            {x: x + w - 1, y: tailY},
            {x: x + w + swing + flare, y: tailY + tailH},
            {x: x + w - 4 + swing - flare, y: tailY + tailH}
        ], this.cCoat);
        
        // Bandolier (Diagonal)
        drawer.line(x + 2, y + 2, x + w - 2, y + h, '#212121');
        drawer.pixel(x + 4, y + 3, '#ffb74d'); // Gold
        drawer.pixel(x + 7, y + 5, '#ffb74d');
        drawer.pixel(x + 10, y + 7, '#ffb74d');
    }

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

        // Left Leg (Back)
        this.drawOneLeg(drawer, cx - 4, cy, leftPose, true);
        // Right Leg (Front)
        this.drawOneLeg(drawer, cx + 1, cy, rightPose, false);
    }

    drawOneLeg(drawer, x, y, pose, isBack) {
        const legW = 3;
        const legH = 4;
        const P = this.cPants;
        const B = this.cBoots;
        const hipY = y - legH;
        
        // Rugged Pants + Old Boots (No Kneepads)
        if (pose === 'idle') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.rect(x, hipY + legH - 1, legW, 2, B);
        }
        else if (pose === 'fwd1' || pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.rect(x - 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back1' || pose === 'back2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 1, hipY + 2, P);
            drawer.rect(x + 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.rect(x, hipY + 2, legW, 2, B);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.rect(x + 2, hipY + 1, legW, 2, B);
        }
    }
}
