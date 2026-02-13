import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for Pet 2B (NieR: Automata)
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: YoRHa No. 2 Type B — silver bob hair, black blindfold, gothic dress, thigh-high boots
 * Canvas: 32x32
 */
export class Nier2bGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // Hair (silver-white)
        this.cHair = '#e0d8d0';
        this.cHairDark = '#c8c0b8';
        this.cHairLight = '#f0ece8';

        // Skin (pale, cool tone)
        this.cSkin = '#f0ddd0';
        this.cSkinDark = '#e0ccbe';
        this.cSkinLight = '#f8ebe0';

        // Blindfold
        this.cBlindfold = '#1a1a20';
        this.cBlindfoldEdge = '#2a2a30';

        // Dress (dark black with slight blue tint)
        this.cDress = '#2a2a30';
        this.cDressDark = '#1a1a20';
        this.cDressLight = '#3a3a42';
        this.cDressLining = '#404048';

        // Boots & gloves
        this.cBoot = '#1a1a20';
        this.cBootHighlight = '#2a2a30';

        // Mole
        this.cMole = '#3a2a20';

        // Lips
        this.cLips = '#d4a898';

        // Weapon (katana on back)
        this.cBlade = '#b8b0a8';
        this.cBladeDark = '#9a9490';
        this.cHilt = '#6a6060';
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { bodyBob, hairFlow, skirtFlutter, legFrame, armSwing }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const groundY = 29;

        const bodyBob = pose.bodyBob || 0;
        const hairFlow = pose.hairFlow || 0;
        const skirtFlutter = pose.skirtFlutter || 0;
        const armSwing = pose.armSwing || 0;

        // Body center
        const bodyY = 20 + bodyBob;

        // Draw order (back to front):
        // 1. Weapon on back
        // 2. Hair back layer
        // 3. Back legs (boots)
        // 4. Skirt back layer
        // 5. Body/dress torso
        // 6. Front legs (boots)
        // 7. Arms (gloves)
        // 8. Skirt front layer
        // 9. Head (face → blindfold → lips → mole → hair front/bangs)

        this.drawWeapon(drawer, cx, bodyY);
        this.drawHairBack(drawer, cx, bodyY - 7 + bodyBob * 0.5, hairFlow);
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', true);
        this.drawSkirt(drawer, cx, bodyY, skirtFlutter, true);
        this.drawBody(drawer, cx, bodyY);
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', false);
        this.drawArms(drawer, cx, bodyY, armSwing);
        this.drawSkirt(drawer, cx, bodyY, skirtFlutter, false);
        this.drawHead(drawer, cx, bodyY - 7 + bodyBob * 0.5, hairFlow);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, hairFlow = 0) {
        const headCX = cx;
        const headCY = cy;
        const hf = Math.round(hairFlow);

        // --- Face shape (oval, pale skin) ---
        drawer.ellipse(headCX, headCY, 6, 5, this.cSkin);

        // Skin shading (sides)
        drawer.pixel(headCX - 5, headCY, this.cSkinDark);
        drawer.pixel(headCX + 5, headCY, this.cSkinDark);
        drawer.pixel(headCX - 4, headCY + 3, this.cSkinDark);
        drawer.pixel(headCX + 4, headCY + 3, this.cSkinDark);

        // Forehead highlight
        drawer.pixel(headCX - 1, headCY - 3, this.cSkinLight);
        drawer.pixel(headCX, headCY - 3, this.cSkinLight);

        // --- Blindfold (THE signature feature) ---
        // Wide black band across eyes, slightly curved
        drawer.hLine(headCX - 5, headCY - 1, 10, this.cBlindfold);
        drawer.hLine(headCX - 5, headCY, 10, this.cBlindfold);
        // Top edge slightly darker
        drawer.hLine(headCX - 4, headCY - 2, 8, this.cBlindfoldEdge);
        // Bottom edge
        drawer.hLine(headCX - 4, headCY + 1, 8, this.cBlindfoldEdge);
        // Blindfold knot/ties (trailing at sides)
        drawer.pixel(headCX + 5, headCY - 1, this.cBlindfold);
        drawer.pixel(headCX + 6, headCY, this.cBlindfold);
        drawer.pixel(headCX + 6, headCY + 1, this.cBlindfoldEdge);

        // --- Lips (small, subtle) ---
        drawer.pixel(headCX - 1, headCY + 3, this.cLips);
        drawer.pixel(headCX, headCY + 3, this.cLips);

        // --- Mole (left of mouth, iconic detail) ---
        drawer.pixel(headCX - 2, headCY + 3, this.cMole);

        // --- Hair front (bangs) ---
        // Bangs cover forehead down to blindfold
        // Left side longer (2B's asymmetric cut)
        drawer.hLine(headCX - 4, headCY - 4, 8, this.cHair);
        drawer.hLine(headCX - 5, headCY - 3, 9, this.cHair);
        drawer.hLine(headCX - 5, headCY - 2, 4, this.cHair); // Left bangs longer
        drawer.hLine(headCX + 1, headCY - 2, 3, this.cHair);  // Right bangs shorter

        // Hair highlights
        drawer.pixel(headCX - 2, headCY - 4, this.cHairLight);
        drawer.pixel(headCX + 1, headCY - 4, this.cHairLight);
        drawer.pixel(headCX - 3, headCY - 3, this.cHairLight);

        // Hair shadow
        drawer.pixel(headCX - 4, headCY - 2, this.cHairDark);
        drawer.pixel(headCX + 3, headCY - 2, this.cHairDark);

        // --- Side hair (framing face, bob cut) ---
        // Left side (longer with hairFlow)
        drawer.pixel(headCX - 5, headCY - 1, this.cHair);
        drawer.pixel(headCX - 5, headCY, this.cHair);
        drawer.pixel(headCX - 5, headCY + 1, this.cHair);
        drawer.pixel(headCX - 5, headCY + 2, this.cHair);
        drawer.pixel(headCX - 5 + hf, headCY + 3, this.cHairDark);

        // Right side
        drawer.pixel(headCX + 5, headCY - 1, this.cHair);
        drawer.pixel(headCX + 5, headCY, this.cHair);
        drawer.pixel(headCX + 5, headCY + 1, this.cHair);
        drawer.pixel(headCX + 5 - hf, headCY + 2, this.cHairDark);
    }

    drawHairBack(drawer, cx, cy, hairFlow = 0) {
        const hf = Math.round(hairFlow);

        // Back of hair (bob cut, hangs behind head)
        // Wider than head to frame it
        drawer.hLine(cx - 5, cy - 5, 10, this.cHairDark);
        drawer.hLine(cx - 6, cy - 4, 12, this.cHairDark);
        drawer.hLine(cx - 6, cy - 3, 12, this.cHair);
        drawer.hLine(cx - 6, cy - 2, 12, this.cHair);

        // Hair tips at sides/back with flow
        drawer.pixel(cx - 6 + hf, cy + 3, this.cHairDark);
        drawer.pixel(cx - 6 + hf, cy + 4, this.cHairDark);
        drawer.pixel(cx + 6 - hf, cy + 3, this.cHairDark);
        drawer.pixel(cx + 6 - hf, cy + 4, this.cHairDark);

        // Nape hair
        drawer.hLine(cx - 3, cy + 3, 6, this.cHairDark);
        drawer.hLine(cx - 2 + hf, cy + 4, 4, this.cHairDark);
    }

    drawBody(drawer, cx, cy) {
        // Upper dress (fitted black bodice)
        const bodyTop = cy + 2;

        // Torso (narrow, fitted)
        drawer.rect(cx - 3, bodyTop, 6, 4, this.cDress);

        // Neckline (high collar, slightly lighter)
        drawer.hLine(cx - 2, bodyTop - 1, 4, this.cDressLight);
        drawer.hLine(cx - 2, bodyTop, 4, this.cDressLight);

        // Neck skin
        drawer.pixel(cx - 1, bodyTop - 2, this.cSkin);
        drawer.pixel(cx, bodyTop - 2, this.cSkin);
        drawer.pixel(cx + 1, bodyTop - 2, this.cSkin);

        // Dress seam / detail line
        drawer.vLine(cx, bodyTop + 1, 3, this.cDressDark);

        // Waist definition
        drawer.hLine(cx - 3, bodyTop + 3, 6, this.cDressDark);

        // Side shadows
        drawer.pixel(cx - 3, bodyTop + 1, this.cDressDark);
        drawer.pixel(cx + 3, bodyTop + 1, this.cDressDark);
    }

    drawSkirt(drawer, cx, cy, skirtFlutter = 0, isBack) {
        const waistY = cy + 6;
        const sf = Math.round(skirtFlutter);

        if (isBack) {
            // Back layer of skirt (drawn before body)
            // Wider, slightly darker
            drawer.fillPath([
                { x: cx - 4, y: waistY },
                { x: cx + 4, y: waistY },
                { x: cx + 5 + sf, y: waistY + 4 },
                { x: cx - 5 - sf, y: waistY + 4 }
            ], this.cDressDark);
        } else {
            // Front layer of skirt (drawn after body)
            // Main skirt shape - flared A-line
            drawer.fillPath([
                { x: cx - 3, y: waistY },
                { x: cx + 3, y: waistY },
                { x: cx + 5 + sf, y: waistY + 5 },
                { x: cx - 5 - sf, y: waistY + 5 }
            ], this.cDress);

            // Skirt edge highlight (lace/hem detail)
            drawer.hLine(cx - 5 - sf, waistY + 5, 10 + sf * 2, this.cDressLight);

            // Skirt fold lines
            drawer.pixel(cx - 2, waistY + 2, this.cDressDark);
            drawer.pixel(cx + 1, waistY + 3, this.cDressDark);
            drawer.pixel(cx - 1, waistY + 4, this.cDressLining);

            // Lining flash (when skirt flutters)
            if (Math.abs(sf) > 0) {
                drawer.pixel(cx + 4 + sf, waistY + 4, this.cDressLining);
            }
        }
    }

    drawArms(drawer, cx, cy, armSwing = 0) {
        const armY = cy + 3;
        const swing = Math.round(armSwing);

        // Left arm (gloved, dark)
        drawer.pixel(cx - 4, armY + swing, this.cDress);
        drawer.pixel(cx - 4, armY + 1 + swing, this.cBoot);
        drawer.pixel(cx - 4, armY + 2 + swing, this.cBoot);
        // Skin at upper arm
        drawer.pixel(cx - 4, armY - 1 + swing, this.cSkin);

        // Right arm
        drawer.pixel(cx + 4, armY - swing, this.cDress);
        drawer.pixel(cx + 4, armY + 1 - swing, this.cBoot);
        drawer.pixel(cx + 4, armY + 2 - swing, this.cBoot);
        drawer.pixel(cx + 4, armY - 1 - swing, this.cSkin);
    }

    drawWeapon(drawer, cx, cy) {
        // Katana strapped diagonally on back
        const startX = cx + 3;
        const startY = cy - 5;

        // Blade (thin diagonal line going up-right)
        drawer.pixel(startX, startY + 6, this.cHilt);
        drawer.pixel(startX, startY + 5, this.cHilt);
        drawer.pixel(startX + 1, startY + 4, this.cBladeDark);
        drawer.pixel(startX + 1, startY + 3, this.cBlade);
        drawer.pixel(startX + 1, startY + 2, this.cBlade);
        drawer.pixel(startX + 2, startY + 1, this.cBlade);
        drawer.pixel(startX + 2, startY, this.cBlade);
        drawer.pixel(startX + 2, startY - 1, this.cBladeDark);
    }

    drawLegs(drawer, cx, groundY, pose, isBack) {
        let leftPose = 'idle';
        let rightPose = 'idle';

        if (typeof pose === 'string') {
            leftPose = pose;
            rightPose = pose;
        } else if (pose && typeof pose === 'object') {
            leftPose = pose.left || 'idle';
            rightPose = pose.right || 'idle';
        }

        if (isBack) {
            this.drawOneLeg(drawer, cx - 3, groundY, leftPose, true);
            this.drawOneLeg(drawer, cx + 1, groundY, rightPose, true);
        } else {
            this.drawOneLeg(drawer, cx - 2, groundY, leftPose, false);
            this.drawOneLeg(drawer, cx + 1, groundY, rightPose, false);
        }
    }

    drawOneLeg(drawer, x, groundY, pose, isBack) {
        const color = isBack ? this.cDressDark : this.cBoot;
        const bootColor = this.cBoot;
        const highlight = this.cBootHighlight;
        const hipY = groundY - 6;

        // Human legs: 2px wide, longer than animal pets
        // Thigh-high boots cover most of the leg
        if (pose === 'idle' || pose === 'stand') {
            // Thigh (skin or dress for back legs)
            drawer.rect(x, hipY, 2, 2, isBack ? this.cDressDark : this.cDressLining);
            // Boot shaft
            drawer.rect(x, hipY + 2, 2, 3, bootColor);
            // Boot highlight (inner edge)
            drawer.pixel(x, hipY + 2, highlight);
            // Boot foot
            drawer.rect(x, hipY + 5, 2, 1, bootColor);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, 2, 1, isBack ? this.cDressDark : this.cDressLining);
            drawer.pixel(x - 1, hipY + 1, bootColor);
            drawer.pixel(x, hipY + 1, bootColor);
            drawer.rect(x - 1, hipY + 2, 2, 3, bootColor);
            drawer.pixel(x - 1, hipY + 2, highlight);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, 2, 1, isBack ? this.cDressDark : this.cDressLining);
            drawer.pixel(x - 1, hipY + 1, bootColor);
            drawer.pixel(x - 2, hipY + 2, bootColor);
            drawer.rect(x - 2, hipY + 3, 2, 2, bootColor);
            drawer.pixel(x - 2, hipY + 3, highlight);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, 2, 1, isBack ? this.cDressDark : this.cDressLining);
            drawer.pixel(x + 1, hipY + 1, bootColor);
            drawer.pixel(x + 2, hipY + 1, bootColor);
            drawer.rect(x + 1, hipY + 2, 2, 3, bootColor);
            drawer.pixel(x + 1, hipY + 2, highlight);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, 2, 1, isBack ? this.cDressDark : this.cDressLining);
            drawer.pixel(x + 2, hipY + 1, bootColor);
            drawer.pixel(x + 3, hipY + 2, bootColor);
            drawer.rect(x + 2, hipY + 3, 2, 2, bootColor);
            drawer.pixel(x + 2, hipY + 3, highlight);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, 2, 1, isBack ? this.cDressDark : this.cDressLining);
            drawer.pixel(x + 1, hipY + 1, bootColor);
            drawer.rect(x + 1, hipY + 2, 2, 2, bootColor);
            drawer.pixel(x + 1, hipY + 2, highlight);
        }
    }
}
