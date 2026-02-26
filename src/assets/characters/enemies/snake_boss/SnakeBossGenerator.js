import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for the SnakeBoss — Mechanical Serpent
 * Style: 35-degree Top-Down 2.5D Pixel Art
 *
 * Key 3D technique: each segment is drawn as a CYLINDER viewed at 35°,
 * showing top ellipse + side wall + bottom ellipse for visible volume.
 *
 * Generates: Head (48×48), Body segment (36×36), Tail (28×28)
 * Phases: 2 color phases (Armed Protocol / Overload)
 */
export class SnakeBossGenerator {
    constructor() {
        this.phases = {
            1: {
                armor: '#4a5a6a',
                armorDark: '#2a3544',
                armorLight: '#6a8a9a',
                armorHi: '#8aaaba',
                core: '#3498db',
                coreGlow: '#5dade2',
                coreRing: '#2980b9',
                joint: '#636e72',
                jointGlow: '#8a9a9a',
                eye: '#3498db',
                eyeBright: '#85c1e9',
                rivet: '#556a7a',
                belly: '#3a4a5a',
                bellyDark: '#2a3544',
                bellyLight: '#5a6a7a',
                jaw: '#34495e',
                jawDark: '#1a2a3a',
                fang: '#d0d0d0',
                crack: null,
                spark: null
            },
            2: {
                armor: '#6a4a3a',
                armorDark: '#3a2a1a',
                armorLight: '#8a6a5a',
                armorHi: '#aa8a7a',
                core: '#e74c3c',
                coreGlow: '#ff6b6b',
                coreRing: '#c0392b',
                joint: '#d35400',
                jointGlow: '#f39c12',
                eye: '#e74c3c',
                eyeBright: '#ff9999',
                rivet: '#7a5a4a',
                belly: '#5a3a2a',
                bellyDark: '#3a2a1a',
                bellyLight: '#7a5a4a',
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
        const baseY = 38; // ground reference

        const headY = baseY - 22 + (pose.headOffset?.y || 0);
        const jawOpen = pose.jawOpen || 0;
        const pulse = pose.pulsePhase || 0;

        // --- Neck base cylinder (connects to body, shows depth) ---
        // Neck side wall
        drawer.rect(cx - 9, headY + 12, 18, 6, c.bellyDark);
        // Neck side highlights
        drawer.vLine(cx - 9, headY + 12, 6, c.armorDark);
        drawer.vLine(cx + 8, headY + 12, 6, c.armorDark);
        drawer.vLine(cx - 5, headY + 12, 5, c.belly);
        drawer.vLine(cx + 4, headY + 12, 5, c.belly);
        // Neck bottom ellipse
        drawer.ellipse(cx, headY + 17, 9, 4, c.bellyDark);
        // Energy ring at neck joint
        drawer.ellipse(cx, headY + 17, 10, 3, c.coreRing);
        const ringC = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        drawer.ellipse(cx, headY + 17, 8, 2, ringC);
        // Neck top ellipse
        drawer.ellipse(cx, headY + 12, 9, 3, c.armor);

        // --- Lower jaw (behind upper head) ---
        const jawDrop = Math.floor(jawOpen * 6);
        if (jawOpen > 0.05) {
            // Jaw interior (dark mouth)
            drawer.fillPath([
                { x: cx - 9, y: headY + 4 },
                { x: cx + 9, y: headY + 4 },
                { x: cx + 6, y: headY + 8 + jawDrop },
                { x: cx - 6, y: headY + 8 + jawDrop }
            ], '#0a0a0a');
            // Lower jaw plate
            drawer.fillPath([
                { x: cx - 8, y: headY + 6 + jawDrop },
                { x: cx + 8, y: headY + 6 + jawDrop },
                { x: cx + 5, y: headY + 10 + jawDrop },
                { x: cx - 5, y: headY + 10 + jawDrop }
            ], c.jawDark);
            // Jaw teeth
            for (let i = -2; i <= 2; i++) {
                drawer.rect(cx + i * 3 - 1, headY + 5 + jawDrop, 2, 3, c.fang);
                drawer.pixel(cx + i * 3 - 1, headY + 5 + jawDrop, '#ffffff');
            }
        }

        // --- Main skull: 3D armored head ---
        // Side walls (visible depth under the top plate)
        drawer.fillPath([
            { x: cx - 13, y: headY },
            { x: cx - 13, y: headY + 8 },
            { x: cx - 10, y: headY + 10 },
            { x: cx - 10, y: headY + 2 }
        ], c.armorDark);
        drawer.fillPath([
            { x: cx + 13, y: headY },
            { x: cx + 13, y: headY + 8 },
            { x: cx + 10, y: headY + 10 },
            { x: cx + 10, y: headY + 2 }
        ], c.armorDark);
        // Front face (chin area)
        drawer.fillPath([
            { x: cx - 4, y: headY - 6 },
            { x: cx + 4, y: headY - 6 },
            { x: cx + 4, y: headY + 4 },
            { x: cx - 4, y: headY + 4 }
        ], c.belly);

        // Top armor plate (angular, diamond-like from 35° view)
        drawer.fillPath([
            { x: cx, y: headY - 8 },
            { x: cx + 13, y: headY },
            { x: cx + 12, y: headY + 8 },
            { x: cx, y: headY + 4 },
            { x: cx - 12, y: headY + 8 },
            { x: cx - 13, y: headY }
        ], c.armor);

        // Top plate highlight bands
        drawer.fillPath([
            { x: cx, y: headY - 6 },
            { x: cx + 9, y: headY },
            { x: cx + 5, y: headY + 3 },
            { x: cx - 5, y: headY + 3 },
            { x: cx - 9, y: headY }
        ], c.armorLight);
        // Bright specular on crest
        drawer.hLine(cx - 3, headY - 4, 6, c.armorHi);
        drawer.hLine(cx - 2, headY - 5, 4, c.armorHi);

        // Central ridge (dorsal spine)
        drawer.vLine(cx, headY - 6, 12, c.armorDark);

        // Armor seam lines
        drawer.hLine(cx - 10, headY + 1, 20, c.armorDark);
        drawer.hLine(cx - 8, headY + 5, 16, c.armorDark);

        // Rivets
        drawer.pixel(cx - 7, headY - 1, c.rivet);
        drawer.pixel(cx + 6, headY - 1, c.rivet);
        drawer.pixel(cx - 9, headY + 3, c.rivet);
        drawer.pixel(cx + 8, headY + 3, c.rivet);

        // --- Eyes (optical sensors) ---
        drawer.rect(cx - 11, headY - 2, 5, 5, c.armorDark);
        drawer.rect(cx - 10, headY - 1, 3, 3, c.eye);
        drawer.pixel(cx - 10, headY - 1, c.eyeBright);
        drawer.pixel(cx - 9, headY - 1, '#ffffff');

        drawer.rect(cx + 6, headY - 2, 5, 5, c.armorDark);
        drawer.rect(cx + 7, headY - 1, 3, 3, c.eye);
        drawer.pixel(cx + 9, headY - 1, c.eyeBright);
        drawer.pixel(cx + 8, headY - 1, '#ffffff');

        // --- Forehead energy core ---
        const corePrimary = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        drawer.rect(cx - 2, headY - 5, 4, 3, c.coreRing);
        drawer.rect(cx - 1, headY - 4, 2, 1, corePrimary);
        drawer.pixel(cx, headY - 4, '#ffffff');

        // --- Nose armor tip ---
        drawer.fillPath([
            { x: cx, y: headY - 8 },
            { x: cx - 3, y: headY - 4 },
            { x: cx + 3, y: headY - 4 }
        ], c.jaw);
        drawer.pixel(cx, headY - 7, c.armorHi);

        // Phase 2: cracks and sparks
        if (phase === 2 && c.crack) {
            drawer.line(cx - 5, headY - 3, cx - 9, headY + 3, c.crack);
            drawer.line(cx + 4, headY - 2, cx + 8, headY + 4, c.crack);
            if (c.spark && pulse > 0.5) {
                drawer.pixel(cx - 8, headY + 2, c.spark);
                drawer.pixel(cx + 7, headY + 3, c.spark);
                drawer.pixel(cx - 3, headY + 6, c.spark);
            }
        }

        return drawer.getCanvas();
    }

    // ========== BODY SEGMENT (36×36) — 3D Cylinder ==========

    generateBodySegment(pose = {}, phase = 1) {
        const drawer = new PixelDraw(36, 36);
        const c = this.getColors(phase);
        const cx = 18;
        const topY = 8;    // top ellipse center Y
        const wallH = 12;  // visible side wall height
        const botY = topY + wallH; // bottom ellipse center Y
        const rx = 12;     // horizontal radius
        const ryTop = 5;   // top ellipse vertical radius
        const ryBot = 5;   // bottom ellipse vertical radius

        const pulse = pose.pulsePhase || 0;

        // --- Bottom ellipse (belly, partially visible) ---
        drawer.ellipse(cx, botY, rx, ryBot, c.bellyDark);

        // --- Side walls (the cylindrical body between top and bottom) ---
        // Left dark edge
        for (let y = topY; y <= botY; y++) {
            const t = (y - topY) / wallH;
            // Calculate width at this Y from ellipse interpolation
            const w = rx;
            // Left edge (dark shadow)
            drawer.vLine(cx - w, y, 1, c.armorDark);
            drawer.vLine(cx - w + 1, y, 1, c.armorDark);
            // Right edge (dark shadow)
            drawer.vLine(cx + w - 1, y, 1, c.armorDark);
            drawer.vLine(cx + w - 2, y, 1, c.armorDark);
        }
        // Main side fill
        drawer.rect(cx - rx + 2, topY, rx * 2 - 4, wallH, c.armor);
        // Left-side gradient (darker toward edge)
        drawer.rect(cx - rx + 2, topY, 3, wallH, c.belly);
        // Right-side gradient
        drawer.rect(cx + rx - 5, topY, 3, wallH, c.belly);
        // Center belly band (lighter, facing camera)
        drawer.rect(cx - 4, topY + 2, 8, wallH - 2, c.bellyLight);

        // Armor plate horizontal bands on side wall
        drawer.hLine(cx - rx + 2, topY + 3, rx * 2 - 4, c.armorDark);
        drawer.hLine(cx - rx + 2, topY + 7, rx * 2 - 4, c.armorDark);
        drawer.hLine(cx - rx + 2, topY + wallH - 1, rx * 2 - 4, c.armorDark);

        // Rivets on side wall
        drawer.pixel(cx - 7, topY + 2, c.rivet);
        drawer.pixel(cx + 6, topY + 2, c.rivet);
        drawer.pixel(cx - 7, topY + 6, c.rivet);
        drawer.pixel(cx + 6, topY + 6, c.rivet);
        drawer.pixel(cx - 7, topY + 10, c.rivet);
        drawer.pixel(cx + 6, topY + 10, c.rivet);

        // --- Top ellipse (armor plate, the top face of the cylinder) ---
        drawer.ellipse(cx, topY, rx, ryTop, c.armor);
        // Top highlight (convex surface catching light)
        drawer.ellipse(cx, topY - 1, rx - 3, ryTop - 2, c.armorLight);
        drawer.ellipse(cx, topY - 2, rx - 6, ryTop - 3, c.armorHi);
        // Central dorsal ridge
        drawer.vLine(cx, topY - ryTop, ryTop * 2, c.armorDark);

        // --- Energy rings at joints (top and bottom seams) ---
        const ringColor = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        // Top ring
        drawer.ellipse(cx, topY - ryTop + 1, rx + 1, 2, c.coreRing);
        drawer.ellipse(cx, topY - ryTop + 1, rx - 1, 1, ringColor);
        // Bottom ring
        drawer.ellipse(cx, botY + ryBot - 1, rx + 1, 2, c.coreRing);
        drawer.ellipse(cx, botY + ryBot - 1, rx - 1, 1, ringColor);

        // Side energy glow dots
        drawer.pixel(cx - rx, topY + wallH / 2, ringColor);
        drawer.pixel(cx + rx - 1, topY + wallH / 2, ringColor);

        // Phase 2: crack effects
        if (phase === 2 && c.crack) {
            drawer.line(cx - 4, topY, cx - 7, topY + 8, c.crack);
            drawer.line(cx + 3, topY + 1, cx + 6, topY + 9, c.crack);
            if (c.spark && pulse > 0.7) {
                drawer.pixel(cx - 6, topY + 7, c.spark);
                drawer.pixel(cx + 5, topY + 8, c.spark);
            }
        }

        return drawer.getCanvas();
    }

    // ========== TAIL (28×28) — 3D Tapered Cone ==========

    generateTail(pose = {}, phase = 1) {
        const drawer = new PixelDraw(28, 28);
        const c = this.getColors(phase);
        const cx = 14;
        const topY = 5;
        const tipY = 24;
        const rx = 9;
        const ryTop = 4;

        const pulse = pose.pulsePhase || 0;

        // --- Energy ring at top joint ---
        const ringColor = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        drawer.ellipse(cx, topY - ryTop + 1, rx + 1, 2, c.coreRing);
        drawer.ellipse(cx, topY - ryTop + 1, rx - 1, 1, ringColor);

        // --- Tapered cone side walls ---
        // Draw left and right edges tapering to tip
        for (let y = topY; y <= tipY; y++) {
            const t = (y - topY) / (tipY - topY);
            const w = Math.floor(rx * (1 - t * 0.85)); // taper from full width to narrow
            if (w <= 0) continue;
            // Side fill
            const sideColor = t < 0.3 ? c.armor : (t < 0.7 ? c.belly : c.bellyDark);
            drawer.hLine(cx - w, y, w * 2, sideColor);
            // Left/right dark edge
            drawer.pixel(cx - w, y, c.armorDark);
            drawer.pixel(cx + w - 1, y, c.armorDark);
        }
        // Highlight on front
        for (let y = topY + 1; y <= tipY - 4; y++) {
            const t = (y - topY) / (tipY - topY);
            const hw = Math.max(1, Math.floor(3 * (1 - t)));
            drawer.hLine(cx - hw, y, hw * 2, c.bellyLight);
        }

        // Armor plate seams
        const seamY1 = topY + 4;
        const seamY2 = topY + 9;
        const w1 = Math.floor(rx * (1 - (seamY1 - topY) / (tipY - topY) * 0.85));
        const w2 = Math.floor(rx * (1 - (seamY2 - topY) / (tipY - topY) * 0.85));
        drawer.hLine(cx - w1, seamY1, w1 * 2, c.armorDark);
        drawer.hLine(cx - w2, seamY2, w2 * 2, c.armorDark);

        // --- Top ellipse (armor cap) ---
        drawer.ellipse(cx, topY, rx, ryTop, c.armor);
        drawer.ellipse(cx, topY - 1, rx - 3, ryTop - 2, c.armorLight);
        drawer.ellipse(cx, topY - 2, rx - 5, ryTop - 3, c.armorHi);
        drawer.vLine(cx, topY - ryTop, ryTop * 2, c.armorDark);

        // Rivets
        drawer.pixel(cx - 5, topY + 2, c.rivet);
        drawer.pixel(cx + 4, topY + 2, c.rivet);

        // --- Drill tip / energy emitter ---
        const tipColor = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        drawer.rect(cx - 1, tipY - 2, 2, 4, c.jaw);
        drawer.pixel(cx, tipY + 1, tipColor);
        drawer.pixel(cx - 1, tipY, '#ffffff');

        // Central ridge
        drawer.vLine(cx, topY, tipY - topY, c.armorDark);

        // Phase 2 effects
        if (phase === 2 && c.crack) {
            drawer.line(cx - 3, topY + 2, cx - 5, topY + 8, c.crack);
            if (c.spark && pulse > 0.6) {
                drawer.pixel(cx - 4, topY + 7, c.spark);
            }
        }

        return drawer.getCanvas();
    }
}
