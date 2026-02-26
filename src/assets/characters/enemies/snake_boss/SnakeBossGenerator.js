import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for the SnakeBoss — Mechanical Serpent
 * Style: 35-degree Top-Down 2.5D Pixel Art
 * Archetype: Armored mechanical snake — angular head with optical sensors,
 *            segmented body with energy rings, drill-tip tail
 *
 * Generates: Head (48×48), Body segment (36×36), Tail (28×28)
 * Phases: 2 color phases (Armed Protocol / Overload)
 */
export class SnakeBossGenerator {
    constructor() {
        this.phases = {
            // Phase 1: Steel blue-gray — cold mechanical
            1: {
                armor: '#4a5a6a',
                armorDark: '#2a3544',
                armorLight: '#6a8a9a',
                core: '#3498db',
                coreGlow: '#5dade2',
                coreRing: '#2980b9',
                joint: '#636e72',
                jointGlow: '#8a9a9a',
                eye: '#3498db',
                eyeBright: '#85c1e9',
                rivet: '#556a7a',
                belly: '#5a6a7a',
                bellyLight: '#7a8a9a',
                jaw: '#34495e',
                jawDark: '#1a2a3a',
                fang: '#d0d0d0',
                crack: null,
                spark: null
            },
            // Phase 2: Overheated — reds/oranges, damaged
            2: {
                armor: '#6a4a3a',
                armorDark: '#3a2a1a',
                armorLight: '#8a6a5a',
                core: '#e74c3c',
                coreGlow: '#ff6b6b',
                coreRing: '#c0392b',
                joint: '#d35400',
                jointGlow: '#f39c12',
                eye: '#e74c3c',
                eyeBright: '#ff9999',
                rivet: '#7a5a4a',
                belly: '#7a5a4a',
                bellyLight: '#9a7a6a',
                jaw: '#5a3a2a',
                jawDark: '#2a1a0a',
                fang: '#e0c0a0',
                crack: '#2c3e50',
                spark: '#f39c12'
            }
        };
    }

    getColors(phase) {
        return this.phases[phase || 1];
    }

    // ========== HEAD (48×48) ==========

    generateHead(pose = {}, phase = 1) {
        const drawer = new PixelDraw(48, 48);
        const c = this.getColors(phase);
        const cx = 24;
        const groundY = 42;

        const headY = groundY - 26 + (pose.headOffset?.y || 0);

        // Shadow
        drawer.ellipse(cx, groundY, 12, 5, 'rgba(0,0,0,0.25)');

        // Main head structure — angular armored serpent head
        this.drawHeadArmor(drawer, cx, headY, c, pose, phase);

        return drawer.getCanvas();
    }

    drawHeadArmor(drawer, cx, headY, c, pose, phase) {
        const jawOpen = pose.jawOpen || 0; // 0-1

        // -- Neck base (bottom, connects to body) --
        drawer.ellipse(cx, headY + 18, 10, 6, c.armorDark);
        drawer.ellipse(cx, headY + 17, 9, 5, c.armor);
        // Energy ring at neck
        drawer.ellipse(cx, headY + 16, 10, 2, c.coreRing);
        drawer.ellipse(cx, headY + 16, 8, 1, c.core);

        // -- Lower jaw (drawn first, behind upper head) --
        const jawDrop = Math.floor(jawOpen * 5);
        drawer.fillPath([
            { x: cx - 10, y: headY + 6 + jawDrop },
            { x: cx + 10, y: headY + 6 + jawDrop },
            { x: cx + 6, y: headY + 12 + jawDrop },
            { x: cx - 6, y: headY + 12 + jawDrop }
        ], c.jawDark);
        // Jaw teeth
        for (let i = -2; i <= 2; i++) {
            drawer.rect(cx + i * 3, headY + 6 + jawDrop, 2, 2, c.fang);
        }

        // -- Main skull armor (angular, diamond-like from top-down) --
        drawer.fillPath([
            { x: cx, y: headY - 8 },         // Nose tip
            { x: cx + 14, y: headY + 2 },    // Right flank
            { x: cx + 12, y: headY + 12 },   // Right rear
            { x: cx - 12, y: headY + 12 },   // Left rear
            { x: cx - 14, y: headY + 2 }     // Left flank
        ], c.armor);

        // Top armor plate highlight
        drawer.fillPath([
            { x: cx, y: headY - 6 },
            { x: cx + 8, y: headY + 1 },
            { x: cx + 4, y: headY + 6 },
            { x: cx - 4, y: headY + 6 },
            { x: cx - 8, y: headY + 1 }
        ], c.armorLight);

        // Central ridge line
        drawer.vLine(cx, headY - 5, 14, c.armorDark);

        // Armor plate seams
        drawer.hLine(cx - 8, headY + 2, 16, c.armorDark);
        drawer.hLine(cx - 6, headY + 7, 12, c.armorDark);

        // Rivets
        drawer.pixel(cx - 6, headY, c.rivet);
        drawer.pixel(cx + 5, headY, c.rivet);
        drawer.pixel(cx - 8, headY + 5, c.rivet);
        drawer.pixel(cx + 7, headY + 5, c.rivet);
        drawer.pixel(cx - 4, headY + 9, c.rivet);
        drawer.pixel(cx + 3, headY + 9, c.rivet);

        // -- Eyes (optical sensors) --
        // Left eye housing
        drawer.rect(cx - 10, headY - 1, 5, 4, c.armorDark);
        drawer.rect(cx - 9, headY, 3, 2, c.eye);
        drawer.pixel(cx - 9, headY, c.eyeBright);
        // Right eye housing
        drawer.rect(cx + 5, headY - 1, 5, 4, c.armorDark);
        drawer.rect(cx + 6, headY, 3, 2, c.eye);
        drawer.pixel(cx + 8, headY, c.eyeBright);

        // -- Forehead energy core --
        const pulse = pose.pulsePhase || 0;
        const corePrimary = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        drawer.rect(cx - 2, headY - 4, 4, 3, c.coreRing);
        drawer.rect(cx - 1, headY - 3, 2, 1, corePrimary);
        drawer.pixel(cx, headY - 3, '#ffffff');

        // -- Nose armor point --
        drawer.fillPath([
            { x: cx, y: headY - 8 },
            { x: cx - 3, y: headY - 4 },
            { x: cx + 3, y: headY - 4 }
        ], c.jaw);
        drawer.pixel(cx, headY - 7, c.armorLight);

        // Phase 2: cracks and sparks
        if (phase === 2 && c.crack) {
            drawer.line(cx - 5, headY - 2, cx - 8, headY + 4, c.crack);
            drawer.line(cx + 4, headY - 1, cx + 7, headY + 5, c.crack);
            // Spark pixels
            if (c.spark && (pose.pulsePhase || 0) > 0.5) {
                drawer.pixel(cx - 7, headY + 3, c.spark);
                drawer.pixel(cx + 6, headY + 4, c.spark);
            }
        }
    }

    // ========== BODY SEGMENT (36×36) ==========

    generateBodySegment(pose = {}, phase = 1) {
        const drawer = new PixelDraw(36, 36);
        const c = this.getColors(phase);
        const cx = 18;
        const cy = 18;

        const pulse = pose.pulsePhase || 0;

        // -- Main armored segment (cylindrical, top-down ellipse) --
        // Shadow/depth: draw bottom darker ellipse first
        drawer.ellipse(cx, cy + 2, 11, 8, c.armorDark);

        // Main body ellipse
        drawer.ellipse(cx, cy, 10, 7, c.armor);

        // Top highlight (convex surface)
        drawer.ellipse(cx, cy - 1, 7, 4, c.armorLight);
        drawer.ellipse(cx, cy - 2, 4, 2, c.bellyLight);

        // Central armor ridge
        drawer.vLine(cx, cy - 5, 10, c.armorDark);

        // Side armor plates
        drawer.hLine(cx - 8, cy, 5, c.armorDark);
        drawer.hLine(cx + 3, cy, 5, c.armorDark);

        // Rivets on armor
        drawer.pixel(cx - 5, cy - 3, c.rivet);
        drawer.pixel(cx + 4, cy - 3, c.rivet);
        drawer.pixel(cx - 6, cy + 2, c.rivet);
        drawer.pixel(cx + 5, cy + 2, c.rivet);

        // -- Energy ring (joint between segments) --
        const ringColor = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        // Top ring
        drawer.ellipse(cx, cy - 6, 8, 2, c.coreRing);
        drawer.ellipse(cx, cy - 6, 6, 1, ringColor);
        // Bottom ring
        drawer.ellipse(cx, cy + 6, 8, 2, c.coreRing);
        drawer.ellipse(cx, cy + 6, 6, 1, ringColor);

        // Side energy dots
        drawer.pixel(cx - 9, cy, ringColor);
        drawer.pixel(cx + 8, cy, ringColor);

        // Phase 2: crack effects
        if (phase === 2 && c.crack) {
            drawer.line(cx - 3, cy - 4, cx - 6, cy + 2, c.crack);
            drawer.line(cx + 2, cy - 3, cx + 5, cy + 3, c.crack);
            if (c.spark && pulse > 0.7) {
                drawer.pixel(cx - 5, cy + 1, c.spark);
                drawer.pixel(cx + 4, cy + 2, c.spark);
            }
        }

        return drawer.getCanvas();
    }

    // ========== TAIL (28×28) ==========

    generateTail(pose = {}, phase = 1) {
        const drawer = new PixelDraw(28, 28);
        const c = this.getColors(phase);
        const cx = 14;
        const cy = 14;

        const pulse = pose.pulsePhase || 0;

        // Energy ring (connection to body)
        drawer.ellipse(cx, cy - 4, 6, 2, c.coreRing);
        drawer.ellipse(cx, cy - 4, 4, 1, Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow);

        // Tapered armor cone
        drawer.fillPath([
            { x: cx - 7, y: cy - 3 },
            { x: cx + 7, y: cy - 3 },
            { x: cx + 4, y: cy + 5 },
            { x: cx, y: cy + 10 },
            { x: cx - 4, y: cy + 5 }
        ], c.armor);

        // Highlight on cone
        drawer.fillPath([
            { x: cx - 4, y: cy - 2 },
            { x: cx + 4, y: cy - 2 },
            { x: cx + 2, y: cy + 3 },
            { x: cx, y: cy + 6 },
            { x: cx - 2, y: cy + 3 }
        ], c.armorLight);

        // Central ridge
        drawer.vLine(cx, cy - 2, 10, c.armorDark);

        // Drill tip / energy emitter
        const tipColor = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        drawer.rect(cx - 1, cy + 8, 2, 3, c.jaw);
        drawer.pixel(cx, cy + 10, tipColor);
        drawer.pixel(cx - 1, cy + 9, '#ffffff');

        // Rivets
        drawer.pixel(cx - 4, cy, c.rivet);
        drawer.pixel(cx + 3, cy, c.rivet);

        // Phase 2 effects
        if (phase === 2 && c.crack) {
            drawer.line(cx - 2, cy - 1, cx - 4, cy + 4, c.crack);
            if (c.spark && pulse > 0.6) {
                drawer.pixel(cx - 3, cy + 3, c.spark);
            }
        }

        return drawer.getCanvas();
    }
}
