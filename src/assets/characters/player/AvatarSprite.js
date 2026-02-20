import { PixelDraw } from '../../../utils/PixelDraw.js';
import { PALETTE } from '../../Palette.js';
import { DEFAULT_COSTUME } from './costumes/DefaultPieces.js';
import { getCostumePiece } from './costumes/CostumeData.js';

/**
 * Procedural Avatar Generator (Face Close-up)
 * Dimensions: 32x32
 * Supports costume system: draws avatar with current costume pieces.
 */

// Fixed colors (face/skin - never change)
const cSkin = PALETTE['s'];
const cSkinShadow = PALETTE['S'];
const cBeard = '#2c1a0e';

/**
 * Generate avatar with costume support
 * @param {Object} costumeState - { hairstyle, hat, clothes, glasses } (IDs or null)
 */
export function generateAvatar(costumeState) {
    const drawer = new PixelDraw(32, 32);
    const cx = 16;

    // Resolve costume pieces
    const costume = costumeState ? {
        hairstyle: costumeState.hairstyle ? getCostumePiece('hairstyle', costumeState.hairstyle) : null,
        hat: costumeState.hat ? getCostumePiece('hat', costumeState.hat) : null,
        clothes: costumeState.clothes ? getCostumePiece('clothes', costumeState.clothes) : null,
        glasses: costumeState.glasses ? getCostumePiece('glasses', costumeState.glasses) : null,
        beard: costumeState.beard ? getCostumePiece('beard', costumeState.beard) : null,
    } : DEFAULT_COSTUME;

    const headW = 20;
    const headH = 22;
    const hx = cx - headW / 2;
    const hy = 4;

    // -- Shoulders/Collar (Bottom) --
    if (costume.clothes && costume.clothes.drawAvatar) {
        costume.clothes.drawAvatar(drawer, cx, costume.clothes.colors);
    } else if (!costume.clothes) {
        // Bare shoulders (no clothes)
        drawer.fillPath([
            { x: 4, y: 32 }, { x: 8, y: 25 }, { x: 12, y: 26 },
            { x: 20, y: 26 }, { x: 24, y: 25 }, { x: 28, y: 32 }
        ], cSkin);
    } else {
        // Fallback: default coat shoulders
        drawer.fillPath([
            { x: 2, y: 32 }, { x: 6, y: 24 }, { x: 12, y: 26 },
            { x: 20, y: 26 }, { x: 26, y: 24 }, { x: 30, y: 32 }
        ], '#455a64');
        drawer.fillPath([
            { x: 12, y: 26 }, { x: 16, y: 32 }, { x: 20, y: 26 }
        ], '#95a5a6');
    }

    // -- Neck --
    drawer.rect(12, 22, 8, 6, cSkin);
    drawer.rect(12, 23, 8, 2, cSkinShadow);

    // -- Hair Back --
    if (costume.hairstyle && costume.hairstyle.drawAvatarBack) {
        costume.hairstyle.drawAvatarBack(drawer, hx, hy, headW, headH, costume.hairstyle.colors);
    }

    // -- Bare head dome (no hair) --
    if (!costume.hairstyle) {
        drawer.fillQuadCurve(hx - 1, hy + 6, cx, hy - 4, hx + headW + 1, hy + 6, cSkin);
        drawer.rect(hx, hy + 3, headW, 4, cSkin);
    }

    // -- Face (rounded chin) --
    drawer.fillQuadCurve(hx, hy + 4, hx - 2, hy + headH - 4, cx, hy + headH, cSkin);
    drawer.fillQuadCurve(hx + headW, hy + 4, hx + headW + 2, hy + headH - 4, cx, hy + headH, cSkin);
    drawer.rect(hx + 1, hy + 4, headW - 2, headH - 6, cSkin);
    drawer.fillQuadCurve(hx + 2, hy + headH - 4, cx, hy + headH, hx + headW - 2, hy + headH - 4, cSkin);

    // -- Nose + Mouth (visible when no beard) --
    drawer.pixel(cx, hy + headH - 7, cSkinShadow);
    drawer.pixel(cx + 1, hy + headH - 7, cSkinShadow);
    drawer.hLine(cx - 2, hy + headH - 3, 4, cSkinShadow);

    // -- Beard --
    if (costume.beard && costume.beard.drawAvatar) {
        costume.beard.drawAvatar(drawer, hx, hy, headW, headH, costume.beard.colors);
    }

    // -- Glasses --
    if (costume.glasses && costume.glasses.drawAvatar) {
        costume.glasses.drawAvatar(drawer, hx, hy, headW, headH, costume.glasses.colors);
    }

    // -- Hair Front --
    if (costume.hairstyle && costume.hairstyle.drawAvatarFront) {
        costume.hairstyle.drawAvatarFront(drawer, hx, hy, headW, headH, costume.hairstyle.colors);
    }

    // -- Hat --
    if (costume.hat && costume.hat.drawAvatar) {
        costume.hat.drawAvatar(drawer, hx, hy, headW, headH, costume.hat.colors);
    }

    return drawer.getCanvas();
}

// Default avatar (backward compatible)
export const AVATAR_SPRITE = generateAvatar(null);
