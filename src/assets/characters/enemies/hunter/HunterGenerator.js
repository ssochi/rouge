import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Hunter Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Bandit / Rogue Mercenary
 * Canvas: 32x32
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
        this.cCoatLight = '#6d4c41';    // Vest Highlight
        this.cShirt = '#455a64';        // Grey Shirt
        this.cScarf = '#c62828';        // Red Scarf (Darker red)
        this.cScarfLight = '#e53935';   // Scarf Highlight

        this.cPants = '#424242';        // Dark Grey Pants
        this.cBoots = '#212121';        // Black Boots
        this.cSkin = '#e0a880';         // Warm Tan Skin
        this.cSkinShadow = '#a1887f';   // Skin Shadow

        // Gear
        this.cBandolier = '#212121';    // Black strap
        this.cBullets = '#ffb74d';      // Gold bullet tips
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset, bodySquash, legFrame, coatWave, scarfWave, hairWave }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const cy = 29; // Ground Y

        const bodyY = 22 + (pose.bodySquash || 0);
        const headY = 14 + (pose.headOffset?.y || 0);
        const headX = cx + (pose.headOffset?.x || 0);

        // 1. Draw Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');

        // 2. Draw Body (Leather Vest + Scarf)
        this.drawBody(drawer, cx, bodyY, pose);

        // 3. Draw Head (Hood + Hair + Goggles + Mask)
        this.drawHead(drawer, headX, headY, pose.hairWave || 0);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, hairWave = 0) {
        const w = 18;
        const h = 16;
        const x = cx - w / 2;
        const y = cy - h + 4;

        const wave = Math.sin(hairWave * Math.PI * 2) * 1.5;

        // -- Hair (Back Layer - Long messy hair under hood) --
        // Left side hair flowing down
        drawer.fillPath([
            {x: x - 1, y: y + 6},
            {x: x + 2, y: y + 4},
            {x: x + 2, y: y + 12},
            {x: x - 1 + wave, y: y + 14},
            {x: x - 2 + wave, y: y + 12}
        ], this.cHair);
        // Right side hair flowing down
        drawer.fillPath([
            {x: x + w + 1, y: y + 6},
            {x: x + w - 2, y: y + 4},
            {x: x + w - 2, y: y + 12},
            {x: x + w + 1 + wave, y: y + 14},
            {x: x + w + 2 + wave, y: y + 12}
        ], this.cHair);
        // Hair highlights
        drawer.pixel(x, y + 8, this.cHairHighlight);
        drawer.pixel(x + w, y + 8, this.cHairHighlight);
        drawer.pixel(x - 1 + wave, y + 12, this.cHairHighlight);
        drawer.pixel(x + w + 1 + wave, y + 12, this.cHairHighlight);

        // -- Hood / Headwrap (Textured) --
        drawer.fillQuadCurve(x, y + 5, cx, y - 2, x + w, y + 5, this.cHood);
        // Texture/Folds on Hood
        drawer.hLine(x + 4, y + 1, 3, this.cHoodLight);
        drawer.hLine(x + 10, y + 2, 4, this.cHoodLight);
        drawer.pixel(cx, y, this.cHoodLight);
        // Shadow under rim
        drawer.hLine(x + 2, y + 4, w - 4, this.cHoodShadow);

        // -- Face Area (Skin) --
        drawer.rect(x + 2, y + 4, w - 4, 6, this.cSkin);
        // Skin Shadow (Top under hood)
        drawer.hLine(x + 2, y + 4, w - 4, this.cSkinShadow);
        // Skin Shadow (Sides)
        drawer.vLine(x + 2, y + 5, 5, this.cSkinShadow);
        drawer.vLine(x + w - 3, y + 5, 5, this.cSkinShadow);
        // Brow ridge (depth)
        drawer.hLine(x + 3, y + 5, 4, this.cSkinShadow);
        drawer.hLine(x + 11, y + 5, 4, this.cSkinShadow);

        // -- Mask (Lower Face - Tactical Cloth Mask) --
        const maskY = y + 9;
        // Main mask shape (tapered jaw)
        drawer.fillPath([
            {x: x + 2, y: maskY},
            {x: cx, y: maskY - 1},        // Nose bridge up
            {x: x + w - 2, y: maskY},
            {x: x + w - 3, y: y + h - 1}, // Jaw R (narrower)
            {x: cx, y: y + h + 1},         // Chin point
            {x: x + 3, y: y + h - 1}      // Jaw L (narrower)
        ], this.cMask);
        // Mask folds / wrinkles (fabric texture)
        drawer.hLine(x + 4, maskY + 1, 10, this.cMaskShadow);
        drawer.hLine(x + 5, maskY + 3, 8, this.cMaskShadow);
        // Nose bump (subtle 3D)
        drawer.pixel(cx - 1, maskY, this.cMaskShadow);
        drawer.pixel(cx + 1, maskY, this.cMaskShadow);
        // Mouth area outline
        drawer.hLine(cx - 2, maskY + 4, 5, this.cMaskShadow);
        // Mask stitching pattern (cross-stitch detail)
        drawer.pixel(x + 4, maskY + 2, this.cMaskPattern);
        drawer.pixel(x + 6, maskY + 4, this.cMaskPattern);
        drawer.pixel(x + w - 4, maskY + 2, this.cMaskPattern);
        drawer.pixel(x + w - 6, maskY + 4, this.cMaskPattern);

        // -- Goggles (Detailed) --
        const gY = y + 5;
        // Strap (Dark, going behind head)
        drawer.rect(x, gY + 2, w, 2, this.cGogglesRim);
        // Frames
        drawer.rect(x + 2, gY, 6, 5, this.cGogglesRim);
        drawer.rect(x + 10, gY, 6, 5, this.cGogglesRim);
        // Lenses (Amber)
        drawer.rect(x + 3, gY + 1, 4, 3, this.cGoggles);
        drawer.rect(x + 11, gY + 1, 4, 3, this.cGoggles);
        // Lens Highlights (Reflections)
        drawer.pixel(x + 4, gY + 1, this.cGogglesHigh);
        drawer.pixel(x + 12, gY + 1, this.cGogglesHigh);
        drawer.pixel(x + 5, gY + 2, this.cGogglesHigh);
        drawer.pixel(x + 13, gY + 2, this.cGogglesHigh);
        // Bridge
        drawer.hLine(x + 8, gY + 2, 2, this.cGogglesRim);

        // -- Hood Sides (Draping over hair) --
        drawer.fillPath([
            {x: x - 1, y: y + 5},
            {x: x + 2, y: y + 4},
            {x: x + 2, y: y + 9},
            {x: x - 1, y: y + 10}
        ], this.cHood);
        drawer.vLine(x, y + 6, 3, this.cHoodLight);

        drawer.fillPath([
            {x: x + w + 1, y: y + 5},
            {x: x + w - 2, y: y + 4},
            {x: x + w - 2, y: y + 9},
            {x: x + w + 1, y: y + 10}
        ], this.cHood);
        drawer.vLine(x + w, y + 6, 3, this.cHoodLight);
    }

    drawBody(drawer, cx, cy, pose) {
        const w = 14;
        const h = 9;
        const x = cx - w / 2;
        const y = cy - h + 2;

        const coatWave = pose.coatWave || 0;
        const scarfWave = pose.scarfWave || 0;

        // -- Scarf (Red, Dynamic) --
        const scarfSwing = Math.sin(scarfWave * Math.PI * 2) * 1.5;
        drawer.fillPath([
            {x: x + 1, y: y - 1},
            {x: x + w - 1, y: y - 1},
            {x: x + w + 1, y: y + 2},
            {x: cx + scarfSwing, y: y + 6},
            {x: x - 1, y: y + 2}
        ], this.cScarf);
        // Scarf Highlight/Folds
        drawer.hLine(x + 3, y + 1, 2, this.cScarfLight);
        drawer.pixel(cx + 1, y + 3, this.cScarfLight);
        // Scarf tail (hanging, dynamic)
        drawer.fillPath([
            {x: x + w - 2, y: y},
            {x: x + w + 1, y: y},
            {x: x + w + 2 + scarfSwing, y: y + 4},
            {x: x + w - 1 + scarfSwing, y: y + 5}
        ], this.cScarf);
        drawer.pixel(x + w + scarfSwing, y + 4, this.cScarfLight);

        // -- Leather Vest --
        // Shoulders (wider, more defined)
        drawer.rect(x - 1, y + 1, 4, 3, this.cCoat);
        drawer.rect(x + w - 3, y + 1, 4, 3, this.cCoat);
        drawer.hLine(x, y + 1, 2, this.cCoatLight);
        drawer.hLine(x + w - 2, y + 1, 2, this.cCoatLight);

        // Main Body
        drawer.rect(x + 1, y + 2, w - 2, h - 2, this.cCoat);
        // Vest Shadow (Sides)
        drawer.vLine(x + 1, y + 2, h - 2, this.cCoatDark);
        drawer.vLine(x + w - 2, y + 2, h - 2, this.cCoatDark);

        // Shirt visible in middle
        drawer.rect(cx - 2, y + 2, 4, h - 2, this.cShirt);

        // -- Coat Tails (Dynamic) --
        const tailY = y + h - 2;
        const tailH = 6;
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        const flare = Math.abs(swing) * 0.5;

        // Left Tail
        drawer.fillPath([
            {x: x + 1, y: tailY},
            {x: x + 5, y: tailY},
            {x: x + 4 + swing + flare, y: tailY + tailH},
            {x: x + swing - flare, y: tailY + tailH}
        ], this.cCoat);
        // Tail edge highlight
        drawer.pixel(x + 2 + swing, tailY + tailH - 1, this.cCoatDark);

        // Right Tail
        drawer.fillPath([
            {x: x + w - 5, y: tailY},
            {x: x + w - 1, y: tailY},
            {x: x + w + swing + flare, y: tailY + tailH},
            {x: x + w - 4 + swing - flare, y: tailY + tailH}
        ], this.cCoat);
        drawer.pixel(x + w - 2 + swing, tailY + tailH - 1, this.cCoatDark);

        // -- Bandolier (Diagonal) --
        drawer.line(x + 2, y + 2, x + w - 2, y + h, this.cBandolier);
        drawer.pixel(x + 4, y + 3, this.cBullets);
        drawer.pixel(x + 7, y + 5, this.cBullets);
        drawer.pixel(x + 10, y + 7, this.cBullets);
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

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.rect(x, hipY + legH - 1, legW, 2, B);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.rect(x - 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.pixel(x - 2, hipY + 2, P);
            drawer.rect(x - 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 1, hipY + 2, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.rect(x + 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 1, hipY + 1, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.pixel(x + 3, hipY + 2, P);
            drawer.rect(x + 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.rect(x - 1, hipY + 2, legW, 2, B);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 2, hipY + 1, P);
            drawer.rect(x + 2, hipY + 1, legW, 2, B);
        }
    }
}
