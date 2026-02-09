import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for the Soldier Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Elite Tactical Operator (Big Helmet, Tactical Shades, Plate Carrier)
 * Canvas: 32x32
 * No arms drawn — weapon & hands rendered by EnemyHandSystem at runtime
 *
 * Visual Hooks: Green-glow NVG on helmet + wraparound tactical sunglasses + antenna
 * Color Strategy: Dark tactical black/grey base + green NVG + reflective shades
 */
export class SoldierGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // Tactical Helmet (Big, dominant Ops-Core style)
        this.cHelmet = '#2d3436';          // Dark Charcoal
        this.cHelmetLight = '#4d5356';     // Highlight
        this.cHelmetDark = '#1a1d1e';      // Shadow
        this.cHelmetRim = '#222628';       // Edge
        this.cHelmetEar = '#262a2c';       // Ear protector

        // NVG Monocle — Signature accent
        this.cNVGBody = '#1a1a1a';         // Housing
        this.cNVGLens = '#00e64d';         // Green Glow
        this.cNVGGlow = '#66ff99';         // Bright Spot
        this.cNVGMount = '#3d3d3d';        // Mount

        // Tactical Sunglasses
        this.cShades = '#111111';          // Dark Lens
        this.cShadesFrame = '#1a1a1a';     // Frame
        this.cShadesReflect1 = '#5588cc';  // Blue reflection
        this.cShadesReflect2 = '#ffffff';  // White highlight

        // Face / Skin
        this.cSkin = '#d4a574';            // Warm Tan
        this.cSkinShadow = '#b8845a';      // Shadow
        this.cSkinLight = '#e8c098';       // Highlight
        this.cStubble = '#a07050';         // Stubble

        // Plate Carrier / Tactical Vest
        this.cVest = '#2d2d2d';            // Dark Tactical Grey
        this.cVestDark = '#1a1a1a';        // Shadow
        this.cVestLight = '#444444';       // Highlight
        this.cPlate = '#383838';           // Front Plate
        this.cMolle = '#353535';           // MOLLE webbing

        // Gear details
        this.cPouch = '#2a2a2a';           // Mag pouch
        this.cPouchBuckle = '#666666';     // Buckle/snap
        this.cKnife = '#778899';           // Knife blade
        this.cKnifeHandle = '#3a2a1a';     // Knife grip

        // Undershirt
        this.cShirt = '#3a4a3a';           // OD Green

        // Radio / Comms
        this.cRadio = '#1a1a1a';           // Body
        this.cAntenna = '#555555';         // Antenna
        this.cAntennaTip = '#777777';      // Tip

        // Accent Patch
        this.cPatch = '#4a7c3f';           // OD Green Patch
        this.cPatchDark = '#2a4a22';       // Patch Shadow

        // Pants & Boots
        this.cPants = '#2d3436';           // Dark Tactical
        this.cPantsDark = '#1a1d1e';       // Shadow
        this.cBoots = '#1a1a1a';           // Black Boots
        this.cBootsSole = '#111111';       // Sole
        this.cBootStrap = '#333333';       // Strap
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset, bodySquash, legFrame }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const cy = 29;

        const bodyY = 22 + (pose.bodySquash || 0);
        const headY = 14 + (pose.headOffset?.y || 0);
        const headX = cx + (pose.headOffset?.x || 0);

        // 1. Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');

        // 2. Body (Plate Carrier + Gear)
        this.drawBody(drawer, cx, bodyY, pose);

        // 3. Head (Big Helmet + NVG + Shades + Face)
        this.drawHead(drawer, headX, headY);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy) {
        const w = 18;
        const h = 16;
        const x = cx - w / 2;
        const y = cy - h + 4;

        // ===== BIG TACTICAL HELMET (Ops-Core, dominant) =====
        // Main dome (taller, more coverage)
        drawer.fillQuadCurve(x, y + 6, cx, y - 3, x + w, y + 6, this.cHelmet);
        // Helmet body (extends lower for more coverage)
        drawer.rect(x, y + 3, w, 4, this.cHelmet);
        // Top highlight
        drawer.hLine(cx - 4, y - 1, 8, this.cHelmetLight);
        drawer.hLine(cx - 3, y - 2, 6, this.cHelmetLight);
        drawer.hLine(cx - 2, y - 3, 4, this.cHelmetLight);
        // Side creases (shape detail)
        drawer.vLine(x + 1, y + 2, 4, this.cHelmetDark);
        drawer.vLine(x + w - 2, y + 2, 4, this.cHelmetDark);
        // Accessory rails (side)
        drawer.hLine(x + 1, y + 4, 3, this.cHelmetDark);
        drawer.hLine(x + w - 4, y + 4, 3, this.cHelmetDark);
        // Front velcro patch area
        drawer.rect(cx - 3, y + 2, 6, 2, this.cHelmetDark);
        // Rim (thick, protective)
        drawer.hLine(x - 1, y + 6, w + 2, this.cHelmetRim);
        drawer.hLine(x, y + 7, w, this.cHelmetRim);

        // Ear protectors (side cutouts)
        drawer.rect(x, y + 5, 2, 4, this.cHelmetEar);
        drawer.rect(x + w - 2, y + 5, 2, 4, this.cHelmetEar);

        // ===== NVG Monocle (flipped up on right side) =====
        // Mount arm
        drawer.rect(x + w - 4, y + 3, 2, 3, this.cNVGMount);
        // NVG tube
        drawer.rect(x + w - 3, y, 3, 3, this.cNVGBody);
        // Green lens (signature glow)
        drawer.rect(x + w - 2, y, 2, 2, this.cNVGLens);
        drawer.pixel(x + w - 2, y, this.cNVGGlow);

        // ===== FACE (Visible below helmet rim) =====
        // Main face area
        drawer.rect(x + 2, y + 7, w - 4, 6, this.cSkin);
        // Strong jaw
        drawer.fillPath([
            {x: x + 3, y: y + 10},
            {x: x + w - 3, y: y + 10},
            {x: x + w - 4, y: y + h - 1},
            {x: x + 4, y: y + h - 1}
        ], this.cSkin);
        // Chin
        drawer.hLine(cx - 2, y + h - 1, 4, this.cSkin);
        // Face shadow under helmet brim
        drawer.hLine(x + 2, y + 7, w - 4, this.cSkinShadow);
        drawer.hLine(x + 3, y + 8, w - 6, this.cSkinShadow);
        // Cheek contour
        drawer.vLine(x + 2, y + 8, 3, this.cSkinShadow);
        drawer.vLine(x + w - 3, y + 8, 3, this.cSkinShadow);
        // Jaw shadow
        drawer.hLine(x + 5, y + h - 2, w - 10, this.cSkinShadow);

        // ===== TACTICAL WRAPAROUND SUNGLASSES =====
        // Frame spans full face width
        drawer.rect(x + 3, y + 8, w - 6, 3, this.cShadesFrame);
        // Dark lens (left)
        drawer.rect(x + 4, y + 9, 4, 2, this.cShades);
        // Dark lens (right)
        drawer.rect(x + w - 8, y + 9, 4, 2, this.cShades);
        // Bridge
        drawer.hLine(cx - 1, y + 9, 2, this.cShadesFrame);
        // Reflective streaks (left lens)
        drawer.pixel(x + 5, y + 9, this.cShadesReflect1);
        drawer.pixel(x + 6, y + 10, this.cShadesReflect1);
        drawer.pixel(x + 4, y + 9, this.cShadesReflect2);
        // Reflective streaks (right lens)
        drawer.pixel(x + w - 7, y + 9, this.cShadesReflect1);
        drawer.pixel(x + w - 6, y + 10, this.cShadesReflect1);
        drawer.pixel(x + w - 8, y + 9, this.cShadesReflect2);
        // Temple arms (going to ears)
        drawer.pixel(x + 2, y + 9, this.cShadesFrame);
        drawer.pixel(x + w - 3, y + 9, this.cShadesFrame);

        // ===== NOSE =====
        drawer.pixel(cx, y + 11, this.cSkinShadow);
        drawer.pixel(cx - 1, y + 11, this.cSkinShadow);

        // ===== MOUTH (firm, tight) =====
        drawer.hLine(cx - 1, y + 12, 3, this.cStubble);

        // ===== STUBBLE =====
        drawer.pixel(x + 5, y + 12, this.cStubble);
        drawer.pixel(x + w - 6, y + 12, this.cStubble);
        drawer.pixel(x + 6, y + 13, this.cStubble);
        drawer.pixel(x + w - 7, y + 13, this.cStubble);

        // ===== HEADSET (left side) =====
        // Earpiece on ear protector
        drawer.rect(x, y + 7, 2, 3, this.cRadio);
        drawer.pixel(x, y + 8, this.cHelmetLight);
        // Mic boom
        drawer.pixel(x + 1, y + 10, this.cRadio);
        drawer.pixel(x + 2, y + 11, this.cRadio);
        drawer.pixel(x + 3, y + 12, this.cRadio);
    }

    drawBody(drawer, cx, cy, pose) {
        const w = 14;
        const h = 9;
        const x = cx - w / 2;
        const y = cy - h + 2;

        // ===== OD GREEN UNDERSHIRT (collar/edges) =====
        drawer.rect(x, y, w, h, this.cShirt);
        // Collar V-neck
        drawer.pixel(cx - 1, y - 1, this.cShirt);
        drawer.pixel(cx, y - 1, this.cShirt);

        // ===== TACTICAL PLATE CARRIER =====
        drawer.rect(x + 1, y + 1, w - 2, h - 1, this.cVest);

        // Front SAPI plate
        drawer.rect(cx - 3, y + 1, 6, h - 2, this.cPlate);
        // Plate edge highlights
        drawer.vLine(cx - 3, y + 2, h - 4, this.cVestLight);
        drawer.vLine(cx + 2, y + 2, h - 4, this.cVestLight);
        // Plate center stitch
        drawer.vLine(cx, y + 2, h - 4, this.cVestDark);

        // MOLLE webbing (3 rows, both sides)
        for (let row = 0; row < 3; row++) {
            const ry = y + 2 + row * 2;
            drawer.hLine(x + 2, ry, 3, this.cMolle);
            drawer.hLine(x + w - 5, ry, 3, this.cMolle);
        }

        // ===== SHOULDER PADS (wider, more defined) =====
        drawer.rect(x - 1, y, 3, 3, this.cVest);
        drawer.rect(x + w - 2, y, 3, 3, this.cVest);
        // Shoulder highlight (top edge)
        drawer.hLine(x - 1, y, 3, this.cVestLight);
        drawer.hLine(x + w - 2, y, 3, this.cVestLight);
        // Shoulder velcro patch area
        drawer.pixel(x, y + 1, this.cHelmetDark);
        drawer.pixel(x + w - 1, y + 1, this.cHelmetDark);

        // ===== FRONT MAG POUCHES (on vest) =====
        // Left mag pouch
        drawer.rect(x + 2, y + 4, 2, 3, this.cPouch);
        drawer.pixel(x + 2, y + 4, this.cPouchBuckle);
        drawer.pixel(x + 3, y + 4, this.cPouchBuckle);
        // Right mag pouch
        drawer.rect(x + w - 4, y + 4, 2, 3, this.cPouch);
        drawer.pixel(x + w - 4, y + 4, this.cPouchBuckle);
        drawer.pixel(x + w - 3, y + 4, this.cPouchBuckle);

        // ===== OD GREEN UNIT PATCH (right chest) =====
        drawer.rect(x + w - 5, y + 1, 3, 2, this.cPatch);
        drawer.pixel(x + w - 4, y + 2, this.cPatchDark);

        // ===== KNIFE (left side, handle visible) =====
        drawer.vLine(x + 1, y + 5, 3, this.cKnifeHandle);
        drawer.pixel(x + 1, y + 4, this.cKnife);

        // Side shadows
        drawer.vLine(x + 1, y + 1, 3, this.cVestDark);
        drawer.vLine(x + w - 2, y + 1, h - 1, this.cVestDark);

        // ===== SHOULDER RADIO + ANTENNA =====
        drawer.rect(x - 1, y - 1, 2, 2, this.cRadio);
        // Antenna
        drawer.vLine(x - 1, y - 4, 3, this.cAntenna);
        drawer.pixel(x - 1, y - 5, this.cAntennaTip);

        // ===== BELT LINE (tactical belt with buckle) =====
        drawer.hLine(x + 1, y + h - 1, w - 2, this.cVestDark);
        drawer.pixel(cx, y + h - 1, this.cPouchBuckle);
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
        this.drawOneLeg(drawer, cx - 4, cy, leftPose);
        // Right Leg (Front)
        this.drawOneLeg(drawer, cx + 1, cy, rightPose);
    }

    drawOneLeg(drawer, x, y, pose) {
        const legW = 3;
        const legH = 4;
        const P = this.cPants;
        const PD = this.cPantsDark;
        const B = this.cBoots;
        const BS = this.cBootsSole;
        const hipY = y - legH;

        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.vLine(x, hipY, legH, PD);
            // Knee pad
            drawer.hLine(x, hipY + 2, legW, this.cVestDark);
            drawer.rect(x, hipY + legH - 1, legW, 2, B);
            drawer.hLine(x, hipY + legH, legW, BS);
            // Boot strap
            drawer.hLine(x, hipY + legH - 1, legW, this.cBootStrap);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.pixel(x - 1, hipY + 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.rect(x - 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.pixel(x - 2, hipY + 2, P);
            drawer.rect(x - 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.pixel(x + 1, hipY + 2, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.rect(x + 1, hipY + 3, legW, 2, B);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.pixel(x + 1, hipY + 1, P);
            drawer.pixel(x + 2, hipY + 2, P);
            drawer.rect(x + 2, hipY + 3, legW, 2, B);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.pixel(x - 1, hipY + 1, P);
            drawer.rect(x - 1, hipY + 2, legW, 2, B);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 2, P);
            drawer.vLine(x, hipY, 2, PD);
            drawer.pixel(x + 2, hipY + 1, P);
            drawer.rect(x + 2, hipY + 1, legW, 2, B);
        }
    }
}
