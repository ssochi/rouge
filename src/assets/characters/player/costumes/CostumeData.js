/**
 * Costume Data Registry
 * Central registry of all costume pieces organized by slot.
 * Each piece defines: id, name, slot, colors, draw functions.
 */
import { DEFAULT_HAIR, DEFAULT_GLASSES, DEFAULT_CLOTHES, DEFAULT_BEARD } from './DefaultPieces.js';
import { MESSY_HAIR } from './hairstyles/MessyHair.js';
import { SHORT_HAIR } from './hairstyles/ShortHair.js';
import { BERET_HAT } from './hats/Beret.js';
import { BANDANA_HAT } from './hats/Bandana.js';
import { HOODIE_CLOTHES } from './clothes/Hoodie.js';
import { VEST_CLOTHES } from './clothes/Vest.js';
import { SANTA_SUIT } from './clothes/SantaSuit.js';
import { ROUND_GLASSES } from './glasses/RoundGlasses.js';
import { GOGGLES } from './glasses/Goggles.js';
import { SANTA_HAT } from './hats/SantaHat.js';
import { CLOWN_HAT } from './hats/ClownHat.js';
import { SANTA_BEARD } from './beards/SantaBeard.js';
import { CLOWN_SUIT } from './clothes/ClownSuit.js';
import { CLOWN_HAIR } from './hairstyles/ClownHair.js';
import { CYBER_HAIR } from './hairstyles/CyberHair.js';
import { CYBER_JACKET } from './clothes/CyberJacket.js';
import { CYBER_VISOR } from './glasses/CyberVisor.js';
import { KNIGHT_HELMET } from './hats/KnightHelmet.js';
import { KNIGHT_ARMOR } from './clothes/KnightArmor.js';

// ============================================================
// Costume Pieces Registry
// ============================================================
export const COSTUME_PIECES = {
    hairstyle: {
        'hair_long': DEFAULT_HAIR,
        'hair_messy': MESSY_HAIR,
        'hair_short': SHORT_HAIR,
        'hair_clown': CLOWN_HAIR,
        'hair_cyber': CYBER_HAIR,
    },
    hat: {
        'hat_beret': BERET_HAT,
        'hat_bandana': BANDANA_HAT,
        'hat_santa': SANTA_HAT,
        'hat_clown': CLOWN_HAT,
        'hat_knight': KNIGHT_HELMET,
    },
    clothes: {
        'clothes_coat': DEFAULT_CLOTHES,
        'clothes_hoodie': HOODIE_CLOTHES,
        'clothes_vest': VEST_CLOTHES,
        'clothes_santa': SANTA_SUIT,
        'clothes_clown': CLOWN_SUIT,
        'clothes_cyber': CYBER_JACKET,
        'clothes_knight': KNIGHT_ARMOR,
    },
    glasses: {
        'glasses_sun': DEFAULT_GLASSES,
        'glasses_round': ROUND_GLASSES,
        'glasses_goggles': GOGGLES,
        'glasses_cyber': CYBER_VISOR,
    },
    beard: {
        'beard_full': DEFAULT_BEARD,
        'beard_santa': SANTA_BEARD,
    },
};

/**
 * Get a costume piece by slot and id
 * @param {string} slot - 'hairstyle' | 'hat' | 'clothes' | 'glasses'
 * @param {string} pieceId - The piece id
 * @returns {Object|null} The costume piece definition, or null
 */
export function getCostumePiece(slot, pieceId) {
    return COSTUME_PIECES[slot]?.[pieceId] || null;
}

/**
 * Get all pieces for a given slot
 * @param {string} slot
 * @returns {Object} Map of pieceId -> piece definition
 */
export function getCostumePiecesBySlot(slot) {
    return COSTUME_PIECES[slot] || {};
}

/**
 * Register a new costume piece
 * @param {Object} piece - { id, name, slot, colors, draw functions }
 */
export function registerCostumePiece(piece) {
    if (!COSTUME_PIECES[piece.slot]) {
        COSTUME_PIECES[piece.slot] = {};
    }
    COSTUME_PIECES[piece.slot][piece.id] = piece;
}
