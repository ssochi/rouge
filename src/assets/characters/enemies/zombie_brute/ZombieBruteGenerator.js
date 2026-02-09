import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Zombie Brute Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Undead Construction Worker (Torn Hi-Vis Vest, Heavy Boots, Massive Build)
 * Canvas: 40x40 (larger than standard 32x32 to accommodate bulk)
 */
export class ZombieBruteGenerator {
    constructor() {
        this.width = 40;
        this.height = 40;

        // Skin (Rotten Green - from PALETTE)
        this.cSkin = PALETTE['z'];          // #82e0aa
        this.cSkinShadow = PALETTE['Z'];    // #27ae60
        this.cSkinLight = '#a9dfbf';

        // Blood & Gore
        this.cBlood = PALETTE['x'];         // #922b21
        this.cBloodDark = PALETTE['X'];     // #641e16

        // Bone
        this.cBone = '#e8dcc8';
        this.cBrainMatter = '#ffcdd2';

        // Hi-Vis Vest (Torn)
        this.cVest = '#c6a800';             // Faded Safety Yellow
        this.cVestBright = '#e8c800';       // Brighter yellow
        this.cVestDark = '#8a7500';         // Dark yellow shadow
        this.cReflective = '#c0c0c0';       // Silver reflective strip
        this.cReflectiveBright = '#e8e8e8'; // Strip highlight

        // Undershirt (Tank Top)
        this.cShirt = '#b0a89e';            // Dirty grey tank top
        this.cShirtDark = '#8a8278';        // Shirt shadow

        // Pants (Work Cargo)
        this.cPants = '#5c4a3a';            // Brown work pants
        this.cPantsDark = '#3e3228';        // Pants shadow

        // Boots (Heavy Work Boots)
        this.cBoots = '#2a2a2a';            // Dark steel-toe boots
        this.cBootsSole = '#1a1a1a';        // Sole

        // Hard Hat Remains
        this.cHardHat = '#d4a017';          // Yellow hard hat
        this.cHardHatDark = '#a07a10';      // Hat shadow

        // Face
        this.cEyeWhite = '#fff9c4';
        this.cScar = '#6b3a3a';             // Scar tissue
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset, bodySquash, legFrame, headTwitch, jawOpen, coatWave, armSwing }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 20;  // Center of 40px canvas
        const cy = 37;  // Ground Y (slightly higher for bigger sprite)

        const bodyY = 28 + (pose.bodySquash || 0);
        const headX = cx + (pose.headTwitch?.x || 0);
        const headY = 18 + (pose.headOffset?.y || 0) + (pose.headTwitch?.y || 0);

        // 1. Draw Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');

        // 2. Draw Body (Vest + Tank Top)
        this.drawBody(drawer, cx, bodyY, pose);

        // 3. Draw Arms (Thick, powerful zombie arms)
        this.drawArms(drawer, cx, bodyY, pose.armSwing || 0);

        // 4. Draw Head
        this.drawHead(drawer, headX, headY, pose.jawOpen || 0);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, jawOpen = 0) {
        const w = 18;
        const h = 15;
        const x = cx - w / 2;
        const y = cy - h + 4;

        // -- Hard Hat Fragment (Back, tilted) --
        drawer.fillPath([
            {x: x + w - 6, y: y - 3},
            {x: x + w + 1, y: y - 2},
            {x: x + w + 2, y: y + 1},
            {x: x + w - 3, y: y + 2},
            {x: x + w - 5, y: y}
        ], this.cHardHat);
        // Hat brim fragment
        drawer.hLine(x + w - 5, y + 2, 7, this.cHardHatDark);
        // Crack on hat
        drawer.pixel(x + w - 2, y - 1, this.cHardHatDark);

        // -- Face Shape (Broad, blocky jaw) --
        // Wide cranium
        drawer.ellipse(cx, y + 5, 9, 7, this.cSkin);
        // Heavy jaw (wider than other zombies, brutish)
        drawer.fillPath([
            {x: x + 1, y: y + 6},
            {x: x + w - 1, y: y + 6},
            {x: x + w - 2, y: y + h},
            {x: x + 2, y: y + h}
        ], this.cSkin);

        // Skin shadow (deep-set brow, heavy jaw)
        drawer.hLine(x + 2, y + 3, w - 4, this.cSkinShadow); // Brow ridge
        drawer.pixel(x + 1, y + 7, this.cSkinShadow);
        drawer.pixel(x + w - 2, y + 7, this.cSkinShadow);
        drawer.pixel(x + 2, y + 9, this.cSkinShadow);
        drawer.pixel(x + w - 3, y + 9, this.cSkinShadow);
        // Chin shadow
        drawer.hLine(x + 3, y + h - 1, w - 6, this.cSkinShadow);

        // -- Bald/Buzz cut (just stubble dots) --
        drawer.pixel(x + 3, y, this.cSkinShadow);
        drawer.pixel(x + 6, y - 1, this.cSkinShadow);
        drawer.pixel(x + 9, y - 1, this.cSkinShadow);
        drawer.pixel(x + w - 5, y, this.cSkinShadow);

        // -- Scar (Left cheek, long diagonal) --
        drawer.pixel(x + 3, y + 6, this.cScar);
        drawer.pixel(x + 4, y + 7, this.cScar);
        drawer.pixel(x + 5, y + 8, this.cScar);
        drawer.pixel(x + 4, y + 9, this.cScar);

        // -- Exposed skull/wound (top left) --
        drawer.fillPath([
            {x: x + 2, y: y},
            {x: x + 5, y: y - 1},
            {x: x + 6, y: y + 2},
            {x: x + 3, y: y + 2}
        ], this.cBone);
        drawer.pixel(x + 4, y + 1, this.cBrainMatter);
        drawer.pixel(x + 3, y + 2, this.cBlood);

        // Rotting patches
        drawer.pixel(x + w - 4, y + 5, this.cSkinLight);
        drawer.pixel(x + 5, y + 10, this.cSkinShadow);

        // -- Eyes (Small, deep-set, asymmetric) --
        // Left Eye: Small, sunken
        drawer.rect(x + 4, y + 4, 3, 3, this.cSkinShadow); // Deep socket
        drawer.rect(x + 4, y + 4, 2, 2, this.cEyeWhite);
        drawer.pixel(x + 5, y + 5, '#d50000');               // Red pupil

        // Right Eye: Swollen shut / damaged
        drawer.rect(x + 11, y + 4, 4, 3, this.cSkinShadow);
        drawer.pixel(x + 12, y + 5, '#880000');               // Barely visible
        drawer.pixel(x + 13, y + 4, this.cSkinShadow);        // Swollen lid
        // Blood from brow
        drawer.pixel(x + 14, y + 3, this.cBlood);

        // -- Mouth (Wide, heavy jaw) --
        const mouthY = y + 10;
        const mouthH = 2 + jawOpen;
        drawer.rect(cx - 3, mouthY, 7, mouthH, '#2e1c11');
        // Teeth (broken, scattered)
        drawer.pixel(cx - 3, mouthY, this.cBone);
        drawer.pixel(cx - 1, mouthY, this.cBone);
        drawer.pixel(cx + 2, mouthY, this.cBone);
        drawer.pixel(cx, mouthY + mouthH - 1, this.cBone);
        drawer.pixel(cx + 3, mouthY + mouthH - 1, this.cBone);
        // Blood
        if (jawOpen > 0) {
            drawer.pixel(cx - 1, mouthY + mouthH, this.cBlood);
            drawer.pixel(cx + 1, mouthY + mouthH, this.cBloodDark);
            drawer.pixel(cx, mouthY + mouthH + 1, this.cBlood);
        }
    }

    drawBody(drawer, cx, cy, pose) {
        const w = 14;
        const h = 9;
        const x = cx - w / 2;
        const y = cy - h + 2;

        const coatWave = pose.coatWave || 0;

        // -- Tank Top (Dirty grey undershirt, visible in middle) --
        drawer.rect(cx - 3, y, 6, h, this.cShirt);
        drawer.pixel(cx - 2, y + 1, this.cShirtDark);
        // Blood splatter
        drawer.pixel(cx + 1, y + 3, this.cBlood);
        drawer.pixel(cx - 1, y + 5, this.cBloodDark);

        // -- Hi-Vis Vest Left Panel --
        drawer.fillPath([
            {x: x, y: y},
            {x: x + 4, y: y},
            {x: x + 4, y: y + h},
            {x: x - 1, y: y + h},
            {x: x - 2, y: y + 2}
        ], this.cVest);
        drawer.vLine(x, y + 1, h - 1, this.cVestDark);
        // Bright edge
        drawer.pixel(x + 1, y, this.cVestBright);
        drawer.pixel(x + 1, y + 1, this.cVestBright);

        // -- Hi-Vis Vest Right Panel --
        drawer.fillPath([
            {x: x + w, y: y},
            {x: x + w - 4, y: y},
            {x: x + w - 4, y: y + h},
            {x: x + w + 1, y: y + h},
            {x: x + w + 2, y: y + 2}
        ], this.cVest);
        drawer.vLine(x + w - 1, y + 1, h - 1, this.cVestDark);
        // Bright edge
        drawer.pixel(x + w - 2, y, this.cVestBright);

        // -- Reflective Strips (Horizontal, across chest) --
        drawer.hLine(x + 1, y + 3, w - 2, this.cReflective);
        drawer.hLine(x + 1, y + 6, w - 2, this.cReflective);
        // Highlight on strips
        drawer.pixel(x + 3, y + 3, this.cReflectiveBright);
        drawer.pixel(x + w - 4, y + 3, this.cReflectiveBright);
        drawer.pixel(x + 5, y + 6, this.cReflectiveBright);

        // -- Torn section (ripped vest, exposed muscle/skin) --
        drawer.rect(x + w - 3, y + 4, 3, 3, this.cSkin);
        drawer.pixel(x + w - 2, y + 5, this.cSkinShadow); // Muscle definition
        drawer.pixel(x + w - 3, y + 5, this.cBlood);       // Wound edge

        // -- Vest Bottom Flaps (Dynamic, shorter/stiffer than jacket) --
        const swing = Math.sin(coatWave * Math.PI * 2) * 1.5;
        const flare = Math.abs(swing) * 0.3;

        const flapY = y + h;
        const flapH = 3;

        // Left flap
        drawer.fillPath([
            {x: x - 1, y: flapY},
            {x: x + 3, y: flapY},
            {x: x + 2 + swing + flare, y: flapY + flapH},
            {x: x - 2 + swing - flare, y: flapY + flapH}
        ], this.cVest);

        // Right flap
        drawer.fillPath([
            {x: x + w + 1, y: flapY},
            {x: x + w - 3, y: flapY},
            {x: x + w - 2 + swing - flare, y: flapY + flapH},
            {x: x + w + 2 + swing + flare, y: flapY + flapH}
        ], this.cVest);

        // Reflective strip on flaps
        drawer.pixel(x + 1 + Math.round(swing * 0.5), flapY + 1, this.cReflective);
        drawer.pixel(x + w - 1 + Math.round(swing * 0.5), flapY + 1, this.cReflective);
    }

    drawArms(drawer, cx, cy, armSwing = 0) {
        const sy = cy - 5;

        // -- Left Arm (Thick, reaching forward) --
        const lx = cx - 8;
        // Vest sleeve edge
        drawer.fillPath([
            {x: lx + 2, y: sy},
            {x: lx + 6, y: sy},
            {x: lx + 4, y: sy + 3},
            {x: lx, y: sy + 2}
        ], this.cVest);
        // Thick exposed arm (skin)
        drawer.fillPath([
            {x: lx, y: sy + 2},
            {x: lx + 4, y: sy + 3},
            {x: lx + 2, y: sy + 6},
            {x: lx - 2, y: sy + 5}
        ], this.cSkin);
        // Muscle shadow
        drawer.pixel(lx, sy + 3, this.cSkinShadow);
        drawer.pixel(lx + 1, sy + 4, this.cSkinShadow);
        // Blood/wound
        drawer.pixel(lx + 2, sy + 4, this.cBlood);
        // Fist (bigger than zombie claws)
        drawer.rect(lx - 2, sy + 5, 3, 3, this.cSkin);
        drawer.pixel(lx - 2, sy + 6, this.cSkinShadow);
        drawer.pixel(lx, sy + 7, this.cSkinShadow);

        // -- Right Arm (Thick, dangling/swaying) --
        const rx = cx + 8;
        const rSwing = Math.round(armSwing * 1.5);
        // Vest sleeve edge
        drawer.fillPath([
            {x: rx - 4, y: sy},
            {x: rx, y: sy},
            {x: rx + 2, y: sy + 3},
            {x: rx - 2, y: sy + 3}
        ], this.cVest);
        // Thick exposed arm
        drawer.fillPath([
            {x: rx - 2, y: sy + 3},
            {x: rx + 2, y: sy + 3},
            {x: rx + 3 + rSwing, y: sy + 6},
            {x: rx - 1 + rSwing, y: sy + 6}
        ], this.cSkin);
        // Muscle shadow
        drawer.pixel(rx + 1, sy + 4, this.cSkinShadow);
        // Wound
        drawer.pixel(rx, sy + 5, this.cBlood);
        // Fist
        drawer.rect(rx + rSwing, sy + 6, 3, 3, this.cSkin);
        drawer.pixel(rx + rSwing, sy + 7, this.cSkinShadow);
        drawer.pixel(rx + 2 + rSwing, sy + 8, this.cSkinShadow);
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

        // Left Leg (Back) - wider spacing for beefy body
        this.drawOneLeg(drawer, cx - 5, cy, leftPose);
        // Right Leg (Front)
        this.drawOneLeg(drawer, cx + 1, cy, rightPose);
    }

    drawOneLeg(drawer, x, y, pose) {
        const legW = 4;
        const legH = 5;
        const P = this.cPants;
        const PD = this.cPantsDark;
        const B = this.cBoots;
        const BS = this.cBootsSole;
        const hipY = y - legH;

        // Map legacy poses
        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.vLine(x, hipY, legH, PD); // Inner shadow
            drawer.rect(x, hipY + legH - 1, legW, 2, B);
            drawer.hLine(x, hipY + legH, legW, BS); // Sole
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.rect(x - 1, hipY + 2, legW, 2, P);
            drawer.rect(x - 2, hipY + 4, legW, 2, B);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.rect(x - 2, hipY + 2, legW, 2, P);
            drawer.rect(x - 3, hipY + 4, legW, 2, B);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.rect(x + 1, hipY + 2, legW, 2, P);
            drawer.rect(x + 2, hipY + 4, legW, 2, B);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.rect(x + 2, hipY + 2, legW, 2, P);
            drawer.rect(x + 3, hipY + 4, legW, 2, B);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.rect(x - 1, hipY + 1, legW, 2, P);
            drawer.rect(x - 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.rect(x + 2, hipY + 1, legW, 2, P);
            drawer.rect(x + 2, hipY + 2, legW, 2, B);
        }
    }
}
