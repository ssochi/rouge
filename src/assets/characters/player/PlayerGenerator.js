import { PixelDraw } from '../../../utils/PixelDraw.js';
import { PALETTE } from '../../Palette.js';
import { DEFAULT_COSTUME } from './costumes/DefaultPieces.js';

/**
 * Procedural Generator for the Player Character
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Canvas: 32x32
 *
 * Supports costume system: each visual layer can be swapped via costume config.
 * Render layers (bottom to top):
 *   0. Legs (drawLegs) - colors from clothes
 *   1. Body base (drawBodyBase) - shirt strip, colors from clothes
 *   2. Clothes upper (costume.clothes.drawUpper)
 *   3. Hair back (costume.hairstyle.drawBack)
 *   4. Face (drawFace) - fixed: skin + eyes
 *   5. Beard (costume.beard.draw) - optional
 *   6. Glasses (costume.glasses.draw) - optional
 *   7. Hair front (costume.hairstyle.drawFront)
 *   8. Hat (costume.hat.draw) - optional
 */
// Bare body colors (when no clothes equipped)
const BARE_COLORS = { shirt: '#95a5a6', pants: '#5d6d7e', boots: '#1a1a1a' };

export class PlayerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;
        // Fixed colors (face/skin - never change with costume)
        this.cSkin = PALETTE['s'];
        this.cSkinShadow = PALETTE['S'];
        this.cBeard = '#2c1a0e';
    }

    /**
     * Generate a frame with default costume (backward compatible)
     */
    generateFrame(pose = {}) {
        return this.generateFrameWithCostume(pose, DEFAULT_COSTUME);
    }

    /**
     * Generate a frame with specified costume config
     * @param {Object} pose - { headOffset, bodySquash, legFrame, hairWave, coatWave }
     * @param {Object} costume - { hairstyle, hat, clothes, glasses, beard }
     */
    generateFrameWithCostume(pose = {}, costume) {
        const drawer = new PixelDraw(this.width, this.height);
        const px = 16;
        const py = 29;
        const bodyY = 22 + (pose.bodySquash || 0);
        const headY = 14 + (pose.headOffset?.y || 0);

        const clothesColors = costume.clothes ? costume.clothes.colors : BARE_COLORS;

        // 0. Legs
        this.drawLegs(drawer, px, py, pose.legFrame || 'idle', clothesColors);

        // 1. Body base
        if (costume.clothes) {
            this.drawBodyBase(drawer, px, bodyY, clothesColors);
        } else {
            this.drawBareBody(drawer, px, bodyY);
        }

        // 2. Clothes upper body
        if (costume.clothes) {
            costume.clothes.drawUpper(drawer, px, bodyY, pose.coatWave || 0, clothesColors);
        }

        // 3. Hair back layer
        if (costume.hairstyle) {
            costume.hairstyle.drawBack(drawer, px, headY, pose.hairWave || 0, costume.hairstyle.colors);
        }

        // 4. Face + bare head dome when no hair
        this.drawFace(drawer, px, headY, !costume.hairstyle);

        // 5. Beard (optional)
        if (costume.beard) {
            costume.beard.draw(drawer, px, headY, costume.beard.colors);
        }

        // 6. Glasses (optional)
        if (costume.glasses) {
            costume.glasses.draw(drawer, px, headY, costume.glasses.colors);
        }

        // 7. Hair front layer
        if (costume.hairstyle) {
            costume.hairstyle.drawFront(drawer, px, headY, pose.hairWave || 0, costume.hairstyle.colors);
        }

        // 8. Hat (optional)
        if (costume.hat) {
            costume.hat.draw(drawer, px, headY, costume.hat.colors);
        }

        return drawer.getCanvas();
    }

    /**
     * Draw Face (skin + eyes + optional bare head dome)
     * @param {boolean} bareHead - if true, draw scalp dome (no hair equipped)
     */
    drawFace(drawer, cx, headY, bareHead = false) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;

        // Bare head dome (when no hair)
        if (bareHead) {
            drawer.fillQuadCurve(x - 1, y + 4, cx, y - 5, x + w + 1, y + 4, this.cSkin);
            drawer.rect(x, y + 2, w, 3, this.cSkin);
        }

        // Face Shape — rounded chin
        drawer.fillQuadCurve(x, y + 2, x - 1, y + h - 2, cx, y + h, this.cSkin);
        drawer.fillQuadCurve(x + w, y + 2, x + w + 1, y + h - 2, cx, y + h, this.cSkin);
        drawer.rect(x + 1, y + 2, w - 2, h - 4, this.cSkin);
        // Rounded jaw
        drawer.fillQuadCurve(x + 2, y + h - 3, cx, y + h, x + w - 2, y + h - 3, this.cSkin);

        // Nose
        drawer.pixel(cx, y + h - 5, this.cSkinShadow);
        drawer.pixel(cx + 1, y + h - 5, this.cSkinShadow);

        // Mouth
        drawer.hLine(cx - 1, y + h - 2, 3, this.cSkinShadow);

        // Eyes
        const eyeY = y + 6;
        const eyeColor = '#1a1a1a';
        drawer.rect(cx - 5, eyeY, 2, 2, eyeColor);
        drawer.pixel(cx - 4, eyeY, '#ffffff');
        drawer.rect(cx + 3, eyeY, 2, 2, eyeColor);
        drawer.pixel(cx + 4, eyeY, '#ffffff');

        // Eyebrows
        const browY = eyeY - 2;
        drawer.hLine(cx - 5, browY, 3, '#2c1a0e');
        drawer.hLine(cx + 3, browY, 3, '#2c1a0e');
    }

    /**
     * Draw Body Base - just the shirt strip (under clothes)
     */
    drawBodyBase(drawer, cx, bodyY, colors) {
        const h = 7;
        const y = bodyY - h + 2;
        drawer.rect(cx - 2, y, 4, h, colors.shirt);
    }

    /**
     * Draw bare body (no clothes equipped) - wider torso with skin
     */
    drawBareBody(drawer, cx, bodyY) {
        const h = 7;
        const y = bodyY - h + 2;
        // Wider torso
        drawer.fillPath([
            { x: cx - 5, y: y },
            { x: cx + 5, y: y },
            { x: cx + 6, y: y + 3 },
            { x: cx + 5, y: y + h },
            { x: cx - 5, y: y + h },
            { x: cx - 6, y: y + 3 }
        ], this.cSkin);
        // Shadow for depth
        drawer.rect(cx - 4, y + 1, 2, h - 2, this.cSkinShadow);
        drawer.rect(cx + 2, y + 1, 2, h - 2, this.cSkinShadow);
        // Neckline
        drawer.hLine(cx - 2, y, 4, this.cSkinShadow);
    }

    /**
     * Draw Legs with dynamic poses
     * @param {string|Object} pose - leg pose or { left, right }
     * @param {Object} colors - { pants, boots } from clothes
     */
    drawLegs(drawer, cx, cy, pose, colors) {
        let leftPose = 'idle';
        let rightPose = 'idle';

        if (typeof pose === 'string') {
            leftPose = pose;
            rightPose = pose;
        } else if (pose && typeof pose === 'object') {
            leftPose = pose.left || 'idle';
            rightPose = pose.right || 'idle';
        }

        // Left Leg (Back Layer)
        this.drawOneLeg(drawer, cx - 4, cy, leftPose, true, colors.pants, colors.boots);
        // Right Leg (Front Layer)
        this.drawOneLeg(drawer, cx + 1, cy, rightPose, false, colors.pants, colors.boots);
    }

    /**
     * Draw a single leg based on pose
     */
    drawOneLeg(drawer, x, y, pose, isBack, pantsColor, bootsColor) {
        const legW = 3;
        const legH = 4;
        const P = pantsColor;
        const B = bootsColor;
        const hipY = y - legH;

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.rect(x, hipY + legH - 1, legW, 2, B);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.pixel(x - 1, hipY + 3, P);
            drawer.rect(x - 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.pixel(x - 2, hipY + 2, P);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.rect(x - 3, hipY + 3, legW, 2, B);
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
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.rect(x - 1, hipY + 2, legW, 2, B);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x + 2, hipY + 1, P);
            drawer.pixel(x + 3, hipY + 2, P);
            drawer.rect(x + 2, hipY + 1, legW, 2, B);
        }
    }
}
