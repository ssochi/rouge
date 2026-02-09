import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Zombie Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Undead Office Worker (Tattered Suit, Loose Tie, Broken Glasses)
 * Canvas: 32x32
 */
export class ZombieGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // Skin (Rotten Green - from PALETTE)
        this.cSkin = PALETTE['z'];          // #82e0aa Zombie Skin
        this.cSkinShadow = PALETTE['Z'];    // #27ae60 Zombie Skin Shadow
        this.cSkinLight = '#a9dfbf';        // Lighter green highlight

        // Blood & Gore (from PALETTE)
        this.cBlood = PALETTE['x'];         // #922b21 Blood
        this.cBloodDark = PALETTE['X'];     // #641e16 Dark Blood

        // Bone
        this.cBone = '#e8dcc8';             // Bone White
        this.cBrainMatter = '#ffcdd2';      // Pinkish brain

        // Tattered Dress Shirt
        this.cShirt = '#d5d0c8';            // Dirty White
        this.cShirtShadow = '#b0a89e';      // Shirt Shadow
        this.cShirtStain = '#8b7355';       // Brown stain

        // Tie
        this.cTie = '#8b0000';             // Dark Red Tie
        this.cTieShadow = '#5c0000';       // Tie Shadow

        // Blazer/Jacket (Torn)
        this.cJacket = '#4a4a4a';          // Dark Grey Jacket
        this.cJacketDark = '#2d2d2d';      // Jacket Shadow
        this.cJacketLight = '#636363';     // Jacket Highlight

        // Pants & Shoes
        this.cPants = '#3d4f5f';           // Dark Blue-Grey Dress Pants
        this.cShoes = '#1a1a1a';           // Black Dress Shoes

        // Face Details
        this.cEyeWhite = '#fff9c4';        // Yellowish White
        this.cHair = '#424242';            // Grey/Black
        this.cGlasses = '#333333';         // Broken Glasses Frame
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset, bodySquash, legFrame, headTwitch, jawOpen, tieAngle, coatWave, armSwing }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const cy = 29; // Ground Y

        const bodyY = 22 + (pose.bodySquash || 0);
        const headX = cx + (pose.headTwitch?.x || 0);
        const headY = 15 + (pose.headOffset?.y || 0) + (pose.headTwitch?.y || 0);

        // 1. Draw Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');

        // 2. Draw Body (Tattered Jacket + Shirt + Tie)
        this.drawBody(drawer, cx, bodyY, pose);

        // 3. Draw Arms (Outstretched Zombie Pose)
        this.drawArms(drawer, cx, bodyY, pose.armSwing || 0);

        // 4. Draw Head
        this.drawHead(drawer, headX, headY, pose.jawOpen || 0);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, jawOpen = 0) {
        const w = 16;
        const h = 14;
        const x = cx - w / 2;
        const y = cy - h + 4;

        // -- Face Shape (Organic / Rounded) --
        // Main cranium: wide ellipse for the upper head
        drawer.ellipse(cx, y + 5, 8, 6, this.cSkin);
        // Lower face / jaw: narrower, tapering toward chin
        drawer.fillPath([
            {x: x + 1, y: y + 6},       // Left cheekbone
            {x: x + w - 1, y: y + 6},   // Right cheekbone
            {x: x + w - 3, y: y + h - 1}, // Right jaw
            {x: cx, y: y + h + 1},       // Chin point (narrow)
            {x: x + 3, y: y + h - 1}    // Left jaw
        ], this.cSkin);

        // -- Skin Shadow (Cheekbones & Jaw edges) --
        // Left cheek shadow (curved)
        drawer.pixel(x + 1, y + 7, this.cSkinShadow);
        drawer.pixel(x + 1, y + 8, this.cSkinShadow);
        drawer.pixel(x + 2, y + 9, this.cSkinShadow);
        drawer.pixel(x + 3, y + 10, this.cSkinShadow);
        // Right cheek shadow
        drawer.pixel(x + w - 2, y + 7, this.cSkinShadow);
        drawer.pixel(x + w - 2, y + 8, this.cSkinShadow);
        drawer.pixel(x + w - 3, y + 9, this.cSkinShadow);
        drawer.pixel(x + w - 4, y + 10, this.cSkinShadow);
        // Under-chin shadow
        drawer.hLine(cx - 2, y + h, 4, this.cSkinShadow);

        // -- Rotting Patches --
        drawer.pixel(x + 3, y + 8, this.cSkinShadow);
        drawer.pixel(x + w - 4, y + 3, this.cSkinLight);
        drawer.pixel(x + 5, y + 10, this.cSkinShadow);

        // -- Exposed Skull/Brain (Top Right) --
        drawer.fillPath([
            {x: x + w - 5, y: y},
            {x: x + w - 2, y: y + 1},
            {x: x + w - 1, y: y + 3},
            {x: x + w - 4, y: y + 3}
        ], this.cBone);
        drawer.pixel(x + w - 3, y + 1, this.cBrainMatter);
        drawer.pixel(x + w - 3, y + 2, this.cBrainMatter);
        // Blood drip from wound
        drawer.pixel(x + w - 2, y + 4, this.cBlood);

        // -- Hair (Sparse / Balding Comb-over) --
        drawer.hLine(x + 2, y, 4, this.cHair);
        drawer.pixel(x + 3, y - 1, this.cHair);
        drawer.pixel(x + 6, y + 1, this.cHair);
        // Side hair (follows ellipse curve)
        drawer.pixel(x, y + 4, this.cHair);
        drawer.pixel(x - 1, y + 5, this.cHair);
        drawer.pixel(x + w, y + 4, this.cHair);
        drawer.pixel(x + w + 1, y + 5, this.cHair);

        // -- Eyes (Asymmetric) --
        // Left Eye: Big, bulging, red pupil
        drawer.rect(x + 3, y + 4, 4, 4, this.cSkinShadow); // Socket shadow
        drawer.rect(x + 3, y + 4, 3, 3, this.cEyeWhite);   // White
        drawer.pixel(x + 4, y + 5, '#d50000');              // Red pupil
        drawer.pixel(x + 5, y + 5, '#d50000');              // Red pupil wide

        // Right Eye: Damaged/Missing with broken glasses
        drawer.rect(x + 10, y + 4, 4, 4, this.cSkinShadow); // Socket shadow
        drawer.pixel(x + 11, y + 5, '#1a1a1a');              // Empty/dark socket
        drawer.pixel(x + 12, y + 6, '#1a1a1a');

        // -- Broken Glasses --
        // Left frame (intact half)
        drawer.pixel(x + 2, y + 4, this.cGlasses);
        drawer.pixel(x + 7, y + 4, this.cGlasses);
        drawer.hLine(x + 2, y + 7, 5, this.cGlasses);
        // Bridge (bent)
        drawer.pixel(x + 8, y + 5, this.cGlasses);
        drawer.pixel(x + 9, y + 6, this.cGlasses);
        // Right frame (broken)
        drawer.pixel(x + 10, y + 4, this.cGlasses);
        drawer.pixel(x + 14, y + 5, this.cGlasses);
        // Cracked lens fragment
        drawer.pixel(x + 11, y + 4, 'rgba(255,255,255,0.3)');

        // Glasses arms (going to ears)
        drawer.pixel(x + 1, y + 5, this.cGlasses);
        drawer.pixel(x + w - 1, y + 5, this.cGlasses);

        // -- Mouth (Gaping) --
        const mouthY = y + 9;
        const mouthH = 2 + jawOpen;
        drawer.rect(cx - 2, mouthY, 5, mouthH, '#2e1c11'); // Dark mouth cavity (narrower)
        // Teeth (Scattered)
        drawer.pixel(cx - 2, mouthY, this.cBone);       // Top left tooth
        drawer.pixel(cx, mouthY, this.cBone);            // Top center tooth
        drawer.pixel(cx + 2, mouthY, this.cBone);        // Top right tooth
        drawer.pixel(cx - 1, mouthY + mouthH - 1, this.cBone); // Bottom tooth
        drawer.pixel(cx + 1, mouthY + mouthH - 1, this.cBone);

        // Blood drips from mouth
        if (jawOpen > 0) {
            drawer.pixel(cx - 1, mouthY + mouthH, this.cBlood);
            drawer.pixel(cx + 1, mouthY + mouthH + 1, this.cBloodDark);
        }
    }

    drawBody(drawer, cx, cy, pose) {
        const w = 10;
        const h = 7;
        const x = cx - w / 2;
        const y = cy - h + 2;

        const coatWave = pose.coatWave || 0;
        const tieAngle = pose.tieAngle || 0;

        // -- Shirt (Visible in middle, dirty white) --
        drawer.rect(cx - 2, y, 4, h, this.cShirt);
        // Shirt stains
        drawer.pixel(cx - 1, y + 3, this.cShirtStain);
        drawer.pixel(cx + 1, y + 5, this.cShirtStain);
        // Blood splatter on shirt
        drawer.pixel(cx, y + 1, this.cBlood);

        // -- Jacket Left Panel --
        drawer.fillPath([
            {x: x, y: y},
            {x: x + 3, y: y},
            {x: x + 3, y: y + h},
            {x: x - 1, y: y + h},
            {x: x - 2, y: y + 2}  // Shoulder
        ], this.cJacket);
        // Panel shadow
        drawer.vLine(x, y + 1, h - 1, this.cJacketDark);

        // -- Jacket Right Panel --
        drawer.fillPath([
            {x: x + w, y: y},
            {x: x + w - 3, y: y},
            {x: x + w - 3, y: y + h},
            {x: x + w + 1, y: y + h},
            {x: x + w + 2, y: y + 2}  // Shoulder
        ], this.cJacket);
        // Panel shadow
        drawer.vLine(x + w - 1, y + 1, h - 1, this.cJacketDark);

        // -- Jacket Lapels (Torn, one side folded) --
        drawer.fillPath([
            {x: x + 2, y: y},
            {x: x + 4, y: y},
            {x: x + 3, y: y + 3}
        ], this.cJacketLight);
        drawer.fillPath([
            {x: x + w - 4, y: y},
            {x: x + w - 2, y: y},
            {x: x + w - 3, y: y + 3}
        ], this.cJacketLight);

        // -- Torn Hole (Exposed Ribs) --
        drawer.rect(x + 1, y + 4, 2, 2, this.cBloodDark); // Torn fabric hole
        drawer.pixel(x + 2, y + 4, this.cBone);            // Rib bone visible
        drawer.pixel(x + 2, y + 5, this.cBone);

        // -- Tie (Dynamic, hanging loose) --
        const tieSwing = tieAngle * 2;
        // Knot
        drawer.rect(cx - 1, y + 1, 2, 2, this.cTie);
        // Tie body (swaying)
        drawer.pixel(cx + Math.round(tieSwing * 0.3), y + 3, this.cTie);
        drawer.pixel(cx + Math.round(tieSwing * 0.6), y + 4, this.cTie);
        drawer.pixel(cx + Math.round(tieSwing * 0.8), y + 5, this.cTieShadow);
        drawer.pixel(cx + Math.round(tieSwing), y + 6, this.cTie);
        // Tie tip (extends past body)
        drawer.pixel(cx + Math.round(tieSwing * 1.2), y + 7, this.cTie);

        // -- Jacket Tails (Dynamic Sway, matching Player/Hunter pattern) --
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        const flare = Math.abs(swing) * 0.5;

        const tailY = y + h;
        const tailH = 5;

        // Left Tail (tattered)
        drawer.fillPath([
            {x: x - 1, y: tailY},
            {x: x + 2, y: tailY},
            {x: x + 1 + swing + flare, y: tailY + tailH},
            {x: x - 3 + swing - flare, y: tailY + tailH}
        ], this.cJacket);
        // Tattered edge detail
        drawer.pixel(x - 2 + swing, y + h + tailH - 1, this.cJacketDark);

        // Right Tail (tattered)
        drawer.fillPath([
            {x: x + w + 1, y: tailY},
            {x: x + w - 2, y: tailY},
            {x: x + w - 1 + swing - flare, y: tailY + tailH},
            {x: x + w + 3 + swing + flare, y: tailY + tailH}
        ], this.cJacket);
        // Tattered edge detail
        drawer.pixel(x + w + 2 + swing, y + h + tailH - 1, this.cJacketDark);
    }

    drawArms(drawer, cx, cy, armSwing = 0) {
        const sy = cy - 4;

        // -- Left Arm (Reaching out, zombie pose) --
        const lx = cx - 6;
        // Jacket sleeve
        drawer.fillPath([
            {x: lx + 1, y: sy},
            {x: lx + 4, y: sy},
            {x: lx + 2, y: sy + 3},
            {x: lx - 1, y: sy + 2}
        ], this.cJacket);
        // Torn sleeve edge
        drawer.pixel(lx, sy + 2, this.cJacketDark);
        // Exposed skin (forearm)
        drawer.fillPath([
            {x: lx - 1, y: sy + 2},
            {x: lx + 2, y: sy + 3},
            {x: lx - 1, y: sy + 5},  // Hand
            {x: lx - 3, y: sy + 4}
        ], this.cSkin);
        // Skin shadow
        drawer.pixel(lx - 2, sy + 4, this.cSkinShadow);
        // Fingers (claw-like)
        drawer.pixel(lx - 2, sy + 5, this.cSkin);
        drawer.pixel(lx - 1, sy + 6, this.cSkin);
        drawer.pixel(lx, sy + 5, this.cSkinShadow);

        // -- Right Arm (Slightly lower, dangling) --
        const rx = cx + 6;
        const rSwing = Math.round(armSwing * 1.5);
        // Jacket sleeve
        drawer.fillPath([
            {x: rx - 3, y: sy},
            {x: rx, y: sy},
            {x: rx + 1, y: sy + 3},
            {x: rx - 2, y: sy + 3}
        ], this.cJacket);
        // Exposed skin (forearm)
        drawer.fillPath([
            {x: rx - 2, y: sy + 3},
            {x: rx + 1, y: sy + 3},
            {x: rx + 2 + rSwing, y: sy + 5},
            {x: rx - 1 + rSwing, y: sy + 5}
        ], this.cSkin);
        // Wound on forearm
        drawer.pixel(rx, sy + 4, this.cBlood);
        // Hand
        drawer.pixel(rx + 1 + rSwing, sy + 6, this.cSkin);
        drawer.pixel(rx + 2 + rSwing, sy + 5, this.cSkinShadow);
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
        const S = this.cShoes;
        const hipY = y - legH;

        // Map legacy poses
        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.rect(x, hipY + legH - 1, legW, 2, S);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.pixel(x - 1, hipY + 3, P);
            drawer.rect(x - 2, hipY + 3, legW, 2, S);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.pixel(x - 2, hipY + 2, P);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.rect(x - 3, hipY + 3, legW, 2, S);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 1, hipY + 2, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.rect(x + 1, hipY + 3, legW, 2, S);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 1, hipY + 1, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.pixel(x + 3, hipY + 2, P);
            drawer.rect(x + 2, hipY + 3, legW, 2, S);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.rect(x - 1, hipY + 2, legW, 2, S);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 2, hipY + 1, P);
            drawer.pixel(x + 3, hipY + 2, P);
            drawer.rect(x + 2, hipY + 1, legW, 2, S);
        }
    }
}
