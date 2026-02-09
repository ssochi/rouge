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

        // 3. Draw Arms (Outstretched Zombie Pose or Attack)
        if (pose.attackPhase !== undefined) {
            this.drawAttackArms(drawer, cx, bodyY, pose.attackPhase);
        } else {
            this.drawArms(drawer, cx, bodyY, pose.armSwing || 0);
        }

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

    /**
     * Draw arms in attack pose based on phase (0~1)
     * 0~0.2: Wind-up (arms pull back right)
     * 0.3~0.6: Lunge (arms thrust forward left)
     * 0.6~0.8: Strike (arms at max extension, claws spread)
     * 0.8~1.0: Recovery (arms return)
     */
    drawAttackArms(drawer, cx, cy, phase) {
        const sy = cy - 4;

        // Interpolate arm positions based on phase
        let lArmX, lHandX, lHandY, rArmX, rHandX, rHandY;

        if (phase < 0.2) {
            // Wind-up: arms pull back (toward right)
            const t = phase / 0.2;
            lArmX = cx - 6 + t * 4;       // Pull left arm right (cx-6 → cx-2)
            lHandX = cx - 8 + t * 6;      // Hand pulls back
            lHandY = sy + 4 - t * 1;      // Slightly raise
            rArmX = cx + 6;
            rHandX = cx + 7 + t * 1;
            rHandY = sy + 5 - t * 1;
        } else if (phase < 0.5) {
            // Lunge: arms thrust forward (toward left)
            const t = (phase - 0.2) / 0.3;
            lArmX = cx - 2 - t * 8;       // Thrust left arm forward (cx-2 → cx-10)
            lHandX = cx - 2 - t * 10;     // Hand reaches far
            lHandY = sy + 3 + t * 2;      // Extend downward
            rArmX = cx + 7 - t * 10;      // Right arm also swings forward
            rHandX = cx + 8 - t * 12;     // Right hand reaches
            rHandY = sy + 4 + t * 1;
        } else if (phase < 0.75) {
            // Strike: arms at max extension
            const t = (phase - 0.5) / 0.25;
            lArmX = cx - 10;
            lHandX = cx - 12 - t * 1;     // Slight extra push
            lHandY = sy + 5 + t * 1;      // Claw sweeps down
            rArmX = cx - 3;
            rHandX = cx - 4 - t * 1;
            rHandY = sy + 5 + t * 1;
        } else {
            // Recovery: arms return to normal
            const t = (phase - 0.75) / 0.25;
            lArmX = cx - 10 + t * 4;      // Pull back toward normal
            lHandX = cx - 13 + t * 5;
            lHandY = sy + 6 - t * 1;
            rArmX = cx - 3 + t * 9;
            rHandX = cx - 5 + t * 11;
            rHandY = sy + 6 - t * 1;
        }

        // Round all positions
        lArmX = Math.round(lArmX);
        lHandX = Math.round(lHandX);
        lHandY = Math.round(lHandY);
        rArmX = Math.round(rArmX);
        rHandX = Math.round(rHandX);
        rHandY = Math.round(rHandY);

        // -- Left Arm (Primary attack arm) --
        // Jacket sleeve
        drawer.fillPath([
            {x: lArmX + 1, y: sy},
            {x: lArmX + 4, y: sy},
            {x: lArmX + 2, y: sy + 3},
            {x: lArmX - 1, y: sy + 2}
        ], this.cJacket);
        drawer.pixel(lArmX, sy + 2, this.cJacketDark);
        // Forearm skin
        drawer.fillPath([
            {x: lArmX - 1, y: sy + 2},
            {x: lArmX + 2, y: sy + 3},
            {x: lHandX + 2, y: lHandY},
            {x: lHandX, y: lHandY - 1}
        ], this.cSkin);
        drawer.pixel(lHandX + 1, lHandY - 1, this.cSkinShadow);
        // Claws/Fingers (more spread during strike)
        if (phase >= 0.3 && phase < 0.8) {
            // Spread claws during attack
            drawer.pixel(lHandX - 1, lHandY - 1, this.cSkin);
            drawer.pixel(lHandX, lHandY + 1, this.cSkin);
            drawer.pixel(lHandX + 1, lHandY + 1, this.cSkinShadow);
            drawer.pixel(lHandX - 1, lHandY + 1, this.cSkin);
        } else {
            drawer.pixel(lHandX, lHandY, this.cSkin);
            drawer.pixel(lHandX + 1, lHandY + 1, this.cSkinShadow);
        }

        // -- Right Arm (Secondary) --
        // Jacket sleeve
        drawer.fillPath([
            {x: rArmX - 3, y: sy},
            {x: rArmX, y: sy},
            {x: rArmX + 1, y: sy + 3},
            {x: rArmX - 2, y: sy + 3}
        ], this.cJacket);
        // Forearm skin
        drawer.fillPath([
            {x: rArmX - 2, y: sy + 3},
            {x: rArmX + 1, y: sy + 3},
            {x: rHandX + 2, y: rHandY},
            {x: rHandX, y: rHandY - 1}
        ], this.cSkin);
        drawer.pixel(rHandX + 1, rHandY, this.cSkinShadow);
        // Hand
        if (phase >= 0.3 && phase < 0.8) {
            drawer.pixel(rHandX - 1, rHandY, this.cSkin);
            drawer.pixel(rHandX, rHandY + 1, this.cSkinShadow);
        } else {
            drawer.pixel(rHandX + 1, rHandY + 1, this.cSkin);
        }
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
