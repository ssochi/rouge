import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Defense Turret Sprite - Pseudo-3D layered rendering
 * Returns { base, gun } canvases
 *
 * Design: Clean silhouette that reads as "turret" at small scale
 * - Base: Solid circular metal platform with raised dome
 * - Gun: Clear horizontal barrel with small receiver block
 */
export function createTurretSprite() {
    // --- Color Palette ---
    // Military olive green
    const gLight = '#7a8c65';
    const gMid   = '#5a6b48';
    const gDark  = '#3d4a30';
    const gDeep  = '#2a331f';

    // Gunmetal / Steel
    const mShine = '#dfe6e9';
    const mHi    = '#b2bec3';
    const mLight = '#8a9299';
    const mMid   = '#636e72';
    const mDark  = '#3d4448';
    const mDeep  = '#2d3436';
    const mBlack = '#1a1c1d';

    // Accents
    const ledOn  = '#55efc4';
    const ledMid = '#00b894';
    const black  = '#000000';

    // === BASE (24x24) ===
    const base = new PixelDraw(24, 24);

    // -- Ground shadow --
    base.ellipse(12, 20, 9, 3, 'rgba(0,0,0,0.35)');

    // -- Three stubby support legs (simple, readable) --
    // Left leg
    base.rect(3, 15, 3, 5, mDeep);
    base.rect(4, 15, 2, 4, mDark);
    base.pixel(4, 15, mMid);
    // Right leg
    base.rect(18, 15, 3, 5, mDeep);
    base.rect(18, 15, 2, 4, mDark);
    base.pixel(19, 15, mMid);
    // Front-center leg
    base.rect(10, 18, 4, 4, mDeep);
    base.rect(10, 18, 3, 3, mDark);
    base.hLine(10, 18, 3, mMid);

    // -- Connecting arms (legs to platform) --
    base.hLine(6, 16, 4, mDeep);
    base.hLine(6, 15, 4, mDark);
    base.hLine(14, 16, 4, mDeep);
    base.hLine(14, 15, 4, mDark);
    base.vLine(11, 15, 3, mDeep);
    base.vLine(12, 15, 3, mDeep);

    // -- Main circular platform (stacked ellipses for 2.5D depth) --
    // Side thickness (visible rim)
    base.ellipse(12, 14, 7, 4, mBlack);
    base.ellipse(12, 13, 7, 4, mDeep);
    base.ellipse(12, 12, 7, 4, mDark);

    // Top surface
    base.ellipse(12, 11, 7, 3, gDark);
    base.ellipse(12, 10, 6, 3, gMid);
    base.ellipse(12, 10, 5, 2, gLight);

    // Inner ring groove
    base.ellipse(12, 10, 3, 1, gDark);

    // -- Raised dome / turret housing --
    base.circle(12, 9, 3, mDark);
    base.circle(12, 9, 2, mMid);
    base.ellipse(12, 8, 2, 1, mLight);
    base.pixel(12, 7, mHi);     // top highlight
    base.pixel(12, 9, mBlack);  // pivot hole

    // -- Status LED --
    base.pixel(12, 13, ledOn);
    base.pixel(11, 13, ledMid);
    base.pixel(13, 13, ledMid);

    // === GUN (28x12) - Anchor at (14,6) ===
    const gun = new PixelDraw(28, 12);

    // -- Receiver housing (around pivot point) --
    gun.rect(8, 2, 8, 8, mBlack);    // outer shadow
    gun.rect(8, 2, 8, 7, mDeep);     // body
    gun.rect(9, 2, 6, 6, mDark);     // inner
    gun.rect(9, 2, 6, 5, mMid);      // lit area
    gun.hLine(9, 2, 6, mLight);      // top edge highlight
    gun.hLine(9, 8, 6, mBlack);      // bottom shadow

    // Receiver side detail
    gun.vLine(8, 3, 5, mMid);        // left edge lit
    gun.vLine(15, 3, 5, mBlack);     // right edge shadow

    // LED on receiver
    gun.pixel(11, 4, ledOn);
    gun.pixel(10, 4, ledMid);

    // -- Main barrel --
    gun.rect(15, 4, 11, 4, mBlack);  // barrel shadow outline
    gun.rect(15, 4, 11, 3, mDeep);   // barrel body
    gun.hLine(15, 4, 11, mLight);    // top cylindrical highlight
    gun.hLine(15, 5, 11, mMid);      // upper mid
    gun.hLine(15, 6, 11, mDark);     // lower mid / core shadow

    // Barrel detail lines (suggest segmented barrel)
    gun.vLine(19, 4, 3, mDeep);
    gun.vLine(23, 4, 3, mDeep);

    // -- Muzzle brake --
    gun.rect(25, 3, 3, 6, mBlack);   // muzzle block
    gun.rect(25, 3, 2, 5, mDeep);
    gun.vLine(25, 4, 3, mMid);       // front face highlight
    gun.pixel(27, 5, black);         // bore hole center
    gun.pixel(27, 6, black);
    // Side vents
    gun.pixel(26, 3, mMid);
    gun.pixel(26, 8, mMid);

    return {
        base: base.getCanvas(),
        gun: gun.getCanvas()
    };
}
