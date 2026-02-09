import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Female Zombie Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Undead Office Lady (Tattered Cardigan, Pencil Skirt, Long Hair)
 * Canvas: 32x32
 */
export class ZombieFemaleGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // Skin (Rotten Green - from PALETTE)
        this.cSkin = PALETTE['z'];          // #82e0aa
        this.cSkinShadow = PALETTE['Z'];    // #27ae60
        this.cSkinLight = '#a9dfbf';

        // Blood & Gore (from PALETTE)
        this.cBlood = PALETTE['x'];         // #922b21
        this.cBloodDark = PALETTE['X'];     // #641e16

        // Bone
        this.cBone = '#e8dcc8';

        // Hair (Dark, long, messy)
        this.cHair = '#1a1a2e';             // Very Dark Blue-Black
        this.cHairHighlight = '#3d3d5c';    // Dark Purple highlight

        // Cardigan (Torn)
        this.cCardigan = '#6a5acd';         // Faded Purple/Lavender
        this.cCardiganDark = '#483d8b';     // Cardigan Shadow
        this.cCardiganLight = '#8378db';    // Cardigan Highlight

        // Blouse/Inner
        this.cBlouse = '#d5d0c8';           // Dirty White Blouse
        this.cBlouseStain = '#8b7355';      // Stain

        // Skirt
        this.cSkirt = '#2f2f3f';            // Dark Pencil Skirt
        this.cSkirtDark = '#1a1a2e';        // Skirt Shadow

        // Shoes
        this.cShoes = '#4a0e0e';            // Dark Red Heels (one broken)

        // Face Details
        this.cEyeWhite = '#fff9c4';
        this.cLipstick = '#c62828';         // Smeared Red Lipstick
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset, bodySquash, legFrame, headTwitch, jawOpen, hairWave, coatWave, armSwing }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const cy = 29;

        const bodyY = 22 + (pose.bodySquash || 0);
        const headX = cx + (pose.headTwitch?.x || 0);
        const headY = 15 + (pose.headOffset?.y || 0) + (pose.headTwitch?.y || 0);

        // 1. Draw Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');

        // 2. Draw Body (Cardigan + Blouse)
        this.drawBody(drawer, cx, bodyY, pose);

        // 3. Draw Arms (Zombie reaching pose)
        this.drawArms(drawer, cx, bodyY, pose.armSwing || 0);

        // 4. Draw Head (Hair + Face)
        this.drawHead(drawer, headX, headY, pose.hairWave || 0, pose.jawOpen || 0);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, hairWave = 0, jawOpen = 0) {
        const w = 15;
        const h = 13;
        const x = cx - w / 2;
        const y = cy - h + 4;

        const wave = Math.sin(hairWave * Math.PI * 2) * 1.5;

        // -- Hair (Back Layer - Long flowing) --
        // Left side
        drawer.fillPath([
            {x: x - 1, y: y + 3},
            {x: x + 3, y: y + 1},
            {x: x + 2, y: y + 12},
            {x: x - 2 + wave, y: y + 16},
            {x: x - 3 + wave, y: y + 14}
        ], this.cHair);
        // Right side
        drawer.fillPath([
            {x: x + w + 1, y: y + 3},
            {x: x + w - 3, y: y + 1},
            {x: x + w - 2, y: y + 12},
            {x: x + w + 2 + wave, y: y + 16},
            {x: x + w + 3 + wave, y: y + 14}
        ], this.cHair);
        // Back hair (center)
        drawer.fillPath([
            {x: x + 3, y: y + 2},
            {x: x + w - 3, y: y + 2},
            {x: x + w - 4 + wave, y: y + 14},
            {x: x + 4 + wave, y: y + 14}
        ], this.cHair);
        // Hair highlights
        drawer.pixel(x, y + 8, this.cHairHighlight);
        drawer.pixel(x + w, y + 8, this.cHairHighlight);
        drawer.pixel(x - 1 + wave, y + 14, this.cHairHighlight);
        drawer.pixel(x + w + 1 + wave, y + 14, this.cHairHighlight);

        // -- Face Shape (Rounder, softer than male zombie) --
        drawer.ellipse(cx, y + 5, 7, 6, this.cSkin);
        // Jaw (narrower, more feminine)
        drawer.fillPath([
            {x: x + 2, y: y + 6},
            {x: x + w - 2, y: y + 6},
            {x: x + w - 4, y: y + h - 1},
            {x: cx, y: y + h},
            {x: x + 4, y: y + h - 1}
        ], this.cSkin);

        // Skin shadow (cheeks)
        drawer.pixel(x + 2, y + 7, this.cSkinShadow);
        drawer.pixel(x + w - 3, y + 7, this.cSkinShadow);
        drawer.pixel(x + 3, y + 9, this.cSkinShadow);
        drawer.pixel(x + w - 4, y + 9, this.cSkinShadow);
        // Under-chin shadow
        drawer.hLine(cx - 1, y + h - 1, 3, this.cSkinShadow);

        // Rot patches
        drawer.pixel(x + w - 3, y + 4, this.cSkinLight);
        drawer.pixel(x + 3, y + 8, this.cSkinShadow);

        // -- Eyes --
        // Left Eye: Intact but glassy
        drawer.rect(x + 3, y + 4, 3, 3, this.cSkinShadow);
        drawer.rect(x + 3, y + 4, 2, 2, this.cEyeWhite);
        drawer.pixel(x + 4, y + 5, '#880000');     // Dull red pupil

        // Right Eye: Damaged, half-closed
        drawer.rect(x + 9, y + 4, 3, 3, this.cSkinShadow);
        drawer.pixel(x + 10, y + 5, '#1a1a1a');    // Dark socket
        drawer.pixel(x + 10, y + 4, this.cSkinShadow); // Drooping eyelid
        drawer.pixel(x + 11, y + 4, this.cSkinShadow);

        // -- Smeared Lipstick / Mouth --
        const mouthY = y + 9;
        const mouthH = 1 + jawOpen;
        // Lipstick smear (extends past mouth)
        drawer.hLine(cx - 3, mouthY, 6, this.cLipstick);
        drawer.pixel(cx + 3, mouthY, this.cLipstick);       // Smear right
        drawer.pixel(cx + 3, mouthY + 1, this.cBlood);      // Blood drip from smear
        // Mouth cavity
        if (jawOpen > 0) {
            drawer.rect(cx - 2, mouthY, 4, mouthH, '#2e1c11');
            drawer.pixel(cx - 1, mouthY, this.cBone);       // Tooth
            drawer.pixel(cx + 1, mouthY, this.cBone);       // Tooth
            drawer.pixel(cx, mouthY + mouthH, this.cBlood); // Blood drip
        }

        // -- Hair (Front Layer - Top + Bangs) --
        drawer.fillQuadCurve(x, y + 4, cx, y - 3, x + w, y + 4, this.cHair);
        // Bangs (messy, covering forehead)
        drawer.fillPath([
            {x: x + 1, y: y + 2},
            {x: x + 5, y: y + 1},
            {x: x + 4, y: y + 5},
            {x: x, y: y + 4}
        ], this.cHair);
        // Right bangs (shorter, uneven)
        drawer.fillPath([
            {x: x + w - 4, y: y + 1},
            {x: x + w - 1, y: y + 2},
            {x: x + w, y: y + 4},
            {x: x + w - 3, y: y + 4}
        ], this.cHair);
        // Top highlight
        drawer.hLine(cx - 2, y, 4, this.cHairHighlight);
    }

    drawBody(drawer, cx, cy, pose) {
        const w = 9;
        const h = 7;
        const x = cx - w / 2;
        const y = cy - h + 2;

        const coatWave = pose.coatWave || 0;

        // -- Blouse (Inner, dirty white) --
        drawer.rect(cx - 2, y, 4, h, this.cBlouse);
        drawer.pixel(cx, y + 2, this.cBlouseStain);
        drawer.pixel(cx + 1, y + 4, this.cBlood);

        // -- Cardigan Left Panel --
        drawer.fillPath([
            {x: x, y: y},
            {x: x + 3, y: y},
            {x: x + 3, y: y + h},
            {x: x - 1, y: y + h},
            {x: x - 1, y: y + 1}
        ], this.cCardigan);
        drawer.vLine(x, y + 1, h - 1, this.cCardiganDark);

        // -- Cardigan Right Panel --
        drawer.fillPath([
            {x: x + w, y: y},
            {x: x + w - 3, y: y},
            {x: x + w - 3, y: y + h},
            {x: x + w + 1, y: y + h},
            {x: x + w + 1, y: y + 1}
        ], this.cCardigan);
        drawer.vLine(x + w - 1, y + 1, h - 1, this.cCardiganDark);

        // Collar detail
        drawer.pixel(x + 2, y, this.cCardiganLight);
        drawer.pixel(x + w - 2, y, this.cCardiganLight);

        // Blood stain on cardigan
        drawer.pixel(x + 1, y + 3, this.cBlood);

        // -- Cardigan Hem (Dynamic, shorter than male jacket) --
        const swing = Math.sin(coatWave * Math.PI * 2) * 1.5;
        const flare = Math.abs(swing) * 0.3;

        const hemY = y + h;
        const hemH = 3;

        // Left hem
        drawer.fillPath([
            {x: x - 1, y: hemY},
            {x: x + 2, y: hemY},
            {x: x + 1 + swing + flare, y: hemY + hemH},
            {x: x - 2 + swing - flare, y: hemY + hemH}
        ], this.cCardigan);

        // Right hem
        drawer.fillPath([
            {x: x + w + 1, y: hemY},
            {x: x + w - 2, y: hemY},
            {x: x + w - 1 + swing - flare, y: hemY + hemH},
            {x: x + w + 2 + swing + flare, y: hemY + hemH}
        ], this.cCardigan);
    }

    drawArms(drawer, cx, cy, armSwing = 0) {
        const sy = cy - 4;

        // -- Left Arm (Reaching forward) --
        const lx = cx - 5;
        // Cardigan sleeve
        drawer.fillPath([
            {x: lx, y: sy},
            {x: lx + 3, y: sy},
            {x: lx + 1, y: sy + 3},
            {x: lx - 2, y: sy + 2}
        ], this.cCardigan);
        // Skin (forearm, thin)
        drawer.fillPath([
            {x: lx - 2, y: sy + 2},
            {x: lx + 1, y: sy + 3},
            {x: lx - 1, y: sy + 5},
            {x: lx - 3, y: sy + 4}
        ], this.cSkin);
        // Fingers
        drawer.pixel(lx - 2, sy + 5, this.cSkin);
        drawer.pixel(lx - 1, sy + 5, this.cSkinShadow);

        // -- Right Arm (Dangling) --
        const rx = cx + 5;
        const rSwing = Math.round(armSwing * 1.2);
        // Cardigan sleeve
        drawer.fillPath([
            {x: rx - 2, y: sy},
            {x: rx + 1, y: sy},
            {x: rx + 2, y: sy + 3},
            {x: rx - 1, y: sy + 2}
        ], this.cCardigan);
        // Skin (forearm)
        drawer.fillPath([
            {x: rx - 1, y: sy + 2},
            {x: rx + 2, y: sy + 3},
            {x: rx + 1 + rSwing, y: sy + 5},
            {x: rx - 1 + rSwing, y: sy + 4}
        ], this.cSkin);
        drawer.pixel(rx + rSwing, sy + 5, this.cSkinShadow);
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
        this.drawOneLeg(drawer, cx - 3, cy, leftPose, true);
        // Right Leg (Front)
        this.drawOneLeg(drawer, cx + 1, cy, rightPose, false);
    }

    drawOneLeg(drawer, x, y, pose, isBack) {
        const legW = 2;
        const legH = 4;
        const SK = this.cSkirt;
        const S = this.cShoes;
        const hipY = y - legH;

        // Map legacy poses
        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, SK);
            // One heel intact, one broken
            if (isBack) {
                drawer.rect(x, hipY + legH - 1, legW, 2, S);
            } else {
                drawer.rect(x, hipY + legH - 1, legW, 1, S);
                drawer.pixel(x, hipY + legH, '#2f2f3f'); // Flat (broken heel)
            }
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 2, SK);
            drawer.pixel(x - 1, hipY + 2, SK);
            drawer.rect(x - 1, hipY + 3, legW, 2, S);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, SK);
            drawer.pixel(x - 1, hipY + 1, SK);
            drawer.pixel(x - 2, hipY + 2, SK);
            drawer.rect(x - 2, hipY + 3, legW, 2, S);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, legW, 2, SK);
            drawer.pixel(x + 1, hipY + 2, SK);
            drawer.rect(x + 1, hipY + 3, legW, 2, S);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, legW, 2, SK);
            drawer.pixel(x + 1, hipY + 1, SK);
            drawer.pixel(x + 2, hipY + 2, SK);
            drawer.rect(x + 2, hipY + 3, legW, 2, S);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 2, SK);
            drawer.pixel(x - 1, hipY + 1, SK);
            drawer.rect(x - 1, hipY + 2, legW, 2, S);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, SK);
            drawer.pixel(x + 1, hipY + 1, SK);
            drawer.rect(x + 1, hipY + 1, legW, 2, S);
        }
    }
}
