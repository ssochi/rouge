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
        const baseY = 38;

        const headY = baseY - 22 + (pose.headOffset?.y || 0);
        const jawOpen = pose.jawOpen || 0;
        const pulse = pose.pulsePhase || 0;
        const coreP = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;
        const jawDrop = Math.floor(jawOpen * 8);

        // --- Neck Joint (Deep Volume) ---
        drawer.fillPath([
            {x: cx - 11, y: headY + 10}, {x: cx + 11, y: headY + 10},
            {x: cx + 9, y: headY + 20}, {x: cx - 9, y: headY + 20}
        ], c.bellyDark);
        drawer.ellipse(cx, headY + 18, 9, 4, '#111');

        // Ribbed neck structure
        for(let i=0; i<3; i++) {
            drawer.hLine(cx - 8, headY + 12 + i*3, 16, c.joint);
            drawer.hLine(cx - 7, headY + 13 + i*3, 14, c.belly);
            drawer.pixel(cx - 8, headY + 12 + i*3, c.coreRing);
            drawer.pixel(cx + 7, headY + 12 + i*3, c.coreRing);
        }

        // --- Lower Jaw Assembly ---
        if (jawOpen > 0.02) {
            // Inner Mouth Cavity
            drawer.fillPath([
                {x: cx - 10, y: headY + 5}, {x: cx + 10, y: headY + 5},
                {x: cx + 7, y: headY + 12 + jawDrop}, {x: cx - 7, y: headY + 12 + jawDrop}
            ], '#080808');

            // Glowing mouth core
            drawer.ellipse(cx, headY + 9 + Math.floor(jawDrop/2), 4, 2, c.coreRing);
            drawer.hLine(cx - 2, headY + 9 + Math.floor(jawDrop/2), 4, coreP);

            // Lower Mandible Base
            drawer.fillPath([
                {x: cx - 12, y: headY + 7 + jawDrop}, {x: cx + 12, y: headY + 7 + jawDrop},
                {x: cx + 6, y: headY + 14 + jawDrop}, {x: cx - 6, y: headY + 14 + jawDrop},
                {x: cx, y: headY + 16 + jawDrop}
            ], c.jawDark);

            // Mandible Armor Plates
            drawer.fillPath([
                {x: cx - 9, y: headY + 8 + jawDrop}, {x: cx + 9, y: headY + 8 + jawDrop},
                {x: cx + 4, y: headY + 13 + jawDrop}, {x: cx - 4, y: headY + 13 + jawDrop}
            ], c.jaw);
            drawer.hLine(cx - 3, headY + 13 + jawDrop, 6, c.armorLight);

            // Lower Fangs
            for (let i of [-1, 1]) {
                const fx = cx + i * 7;
                drawer.fillPath([
                    {x: fx - 1, y: headY + 7 + jawDrop}, {x: fx + 1, y: headY + 7 + jawDrop},
                    {x: fx, y: headY + 2 + jawDrop}
                ], c.fang);
                drawer.pixel(fx - 1, headY + 4 + jawDrop, '#ffffff'); // Glint
            }
            // Inner small teeth
            for (let i of [-1, 0, 1]) {
                drawer.rect(cx + i * 3 - 1, headY + 7 + jawDrop, 2, 2, c.fang);
                drawer.pixel(cx + i * 3, headY + 7 + jawDrop, '#fff');
            }
        }

        // --- Upper Cranium Shadow / Underbelly ---
        drawer.fillPath([
            {x: cx - 14, y: headY - 2}, {x: cx + 14, y: headY - 2},
            {x: cx + 16, y: headY + 6}, {x: cx + 8, y: headY + 10},
            {x: cx, y: headY + 12}, {x: cx - 8, y: headY + 10},
            {x: cx - 16, y: headY + 6}
        ], c.armorDark);

        // --- Cheek Guards ---
        for (let i of [-1, 1]) {
            const sideX = cx + i * 11;
            drawer.fillPath([
                {x: sideX, y: headY - 1}, {x: sideX + i*4, y: headY + 5},
                {x: sideX + i*2, y: headY + 9}, {x: sideX - i*2, y: headY + 5}
            ], c.armor);
            // Highlight
            drawer.line(sideX, headY, sideX + i*3, headY + 4, c.armorLight);
        }

        // --- Main Top Armor Plate (Aggressive Chevron shape) ---
        drawer.fillPath([
            {x: cx, y: headY - 12},
            {x: cx + 14, y: headY - 4}, {x: cx + 12, y: headY + 4},
            {x: cx + 5, y: headY + 6}, {x: cx, y: headY + 8},
            {x: cx - 5, y: headY + 6}, {x: cx - 12, y: headY + 4},
            {x: cx - 14, y: headY - 4}
        ], c.armor);

        // Top Armor Layering & Bevels
        drawer.fillPath([
            {x: cx, y: headY - 10},
            {x: cx + 11, y: headY - 3}, {x: cx + 8, y: headY + 3},
            {x: cx, y: headY + 5}, {x: cx - 8, y: headY + 3},
            {x: cx - 11, y: headY - 3}
        ], c.armorLight);

        // Crown peak highlight
        drawer.fillPath([
            {x: cx, y: headY - 11}, {x: cx + 6, y: headY - 6},
            {x: cx, y: headY - 3}, {x: cx - 6, y: headY - 6}
        ], c.armorHi);
        drawer.vLine(cx, headY - 10, 8, '#ffffff');

        // Central Dorsal Ridge (Spine continuing to head)
        drawer.fillPath([
            {x: cx - 2, y: headY - 12}, {x: cx + 2, y: headY - 12},
            {x: cx + 3, y: headY - 2}, {x: cx, y: headY + 8},
            {x: cx - 3, y: headY - 2}
        ], c.armorDark);
        drawer.vLine(cx, headY - 12, 18, c.bellyDark);

        // --- Forehead Energy Core / Sensor Array ---
        drawer.fillPath([
            {x: cx, y: headY - 8}, {x: cx + 4, y: headY - 4},
            {x: cx, y: headY - 1}, {x: cx - 4, y: headY - 4}
        ], c.coreRing);
        drawer.fillPath([
            {x: cx, y: headY - 6}, {x: cx + 2, y: headY - 4},
            {x: cx, y: headY - 2}, {x: cx - 2, y: headY - 4}
        ], coreP);
        drawer.pixel(cx, headY - 4, '#ffffff');
        drawer.pixel(cx - 1, headY - 4, '#ffffff');

        // --- Snout & Upper Jaw ---
        drawer.fillPath([
            {x: cx - 6, y: headY + 4}, {x: cx + 6, y: headY + 4},
            {x: cx + 4, y: headY + 10}, {x: cx, y: headY + 12},
            {x: cx - 4, y: headY + 10}
        ], c.jaw);

        // Snout Vents (Nostrils)
        drawer.line(cx - 4, headY + 7, cx - 2, headY + 9, '#111');
        drawer.line(cx + 4, headY + 7, cx + 2, headY + 9, '#111');
        drawer.pixel(cx - 3, headY + 8, coreP);
        drawer.pixel(cx + 3, headY + 8, coreP);

        // Upper Fangs (when open jaw, or overlapping lower)
        drawer.rect(cx - 7, headY + 8, 2, 4, c.fang);
        drawer.pixel(cx - 6, headY + 12, c.fang);
        drawer.pixel(cx - 7, headY + 9, '#fff');

        drawer.rect(cx + 5, headY + 8, 2, 4, c.fang);
        drawer.pixel(cx + 6, headY + 12, c.fang);
        drawer.pixel(cx + 5, headY + 9, '#fff');

        // --- Eyes (Aggressive Visor / Sensor) ---
        for (let i of [-1, 1]) {
            const ex = cx + i * 8;
            // Eye socket
            drawer.fillPath([
                {x: ex - i*3, y: headY - 4}, {x: ex + i*4, y: headY},
                {x: ex + i*2, y: headY + 3}, {x: ex - i*4, y: headY - 1}
            ], c.armorDark);

            // Glowing optics
            drawer.line(ex - i*2, headY - 2, ex + i*2, headY + 1, c.eye);
            drawer.line(ex - i*1, headY - 2, ex + i*1, headY, c.eyeBright);
            drawer.pixel(ex + i, headY - 1, '#ffffff');
        }

        // Rivets/Details
        const rf = [
            [cx - 8, headY + 5], [cx + 8, headY + 5],
            [cx - 10, headY - 4], [cx + 10, headY - 4]
        ];
        rf.forEach(p => drawer.pixel(p[0], p[1], c.rivet));

        // --- Phase 2: Overload FX ---
        if (phase === 2 && c.crack) {
            // Battle damage
            drawer.line(cx - 6, headY - 6, cx - 10, headY, c.crack);
            drawer.line(cx - 9, headY - 1, cx - 11, headY + 2, c.crack);
            drawer.line(cx + 5, headY - 8, cx + 8, headY - 3, c.crack);
            drawer.pixel(cx + 7, headY - 4, c.crack);

            // Sparks
            if (c.spark && pulse > 0.4) {
                drawer.pixel(cx - 10, headY + 2, c.spark);
                drawer.pixel(cx + 10, headY - 1, c.spark);
                drawer.pixel(cx, headY + 6, '#fff');
            }
        }

        return drawer.getCanvas();
    }

    // ========== BODY SEGMENT (36×36) ==========

    generateBodySegment(pose = {}, phase = 1) {
        const drawer = new PixelDraw(36, 36);
        const c = this.getColors(phase);
        const cx = 18;
        const topY = 8;
        const wallH = 14;
        const botY = topY + wallH;
        const rx = 13;
        const ryTop = 5;
        const ryBot = 5;

        const pulse = pose.pulsePhase || 0;
        const coreP = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;

        // --- Bottom socket / underbelly ---
        drawer.ellipse(cx, botY, rx - 1, ryBot, '#111');
        drawer.ellipse(cx, botY - 1, rx - 2, ryBot, c.bellyDark);

        // Side mechanical ribs (Under-chassis)
        for (let y = topY; y <= botY; y++) {
            const w = rx - 1;
            drawer.hLine(cx - w, y, w * 2, c.bellyDark);
            // Gradient / shadows for cylindrical feel
            drawer.vLine(cx - w, y, 1, '#1a1a1a');
            drawer.vLine(cx + w - 1, y, 1, '#1a1a1a');
            drawer.pixel(cx - w + 2, y, c.belly);
            drawer.pixel(cx + w - 3, y, c.belly);
        }

        // --- Overlapping Heavy Armor Plates ---
        // Side wrap plates
        drawer.fillPath([
            {x: cx - rx, y: topY + 2}, {x: cx + rx, y: topY + 2},
            {x: cx + rx - 1, y: botY - 2}, {x: cx + rx - 4, y: botY + 2},
            {x: cx - rx + 4, y: botY + 2}, {x: cx - rx + 1, y: botY - 2}
        ], c.armorDark);

        drawer.fillPath([
            {x: cx - rx + 1, y: topY + 2}, {x: cx + rx - 1, y: topY + 2},
            {x: cx + rx - 2, y: botY - 3}, {x: cx + rx - 5, y: botY + 1},
            {x: cx - rx + 5, y: botY + 1}, {x: cx - rx + 2, y: botY - 3}
        ], c.armor);

        // Center protective shield
        drawer.fillQuadCurve(cx - 7, topY + 2, cx, botY + 8, cx + 7, topY + 2, c.bellyLight);
        drawer.fillQuadCurve(cx - 5, topY + 2, cx, botY + 5, cx + 5, topY + 2, c.armorLight);

        // Armor Plate Highlights & Bevels
        // Highlight on the top-left curve
        drawer.line(cx - rx + 2, topY + 3, cx - rx + 4, botY - 3, c.armorLight);
        // Bounce light on right
        drawer.line(cx + rx - 2, topY + 3, cx + rx - 4, botY - 3, c.belly);

        // Horizontal segmentation breaks (vents)
        drawer.hLine(cx - rx + 4, topY + 6, rx*2 - 8, c.armorDark);
        drawer.hLine(cx - rx + 3, topY + 10, rx*2 - 6, c.armorDark);

        // Side Energy Vents
        for (let i of [-1, 1]) {
            drawer.rect(cx + i*(rx - 3) - 1, topY + 7, 2, 4, '#111');
            drawer.vLine(cx + i*(rx - 3), topY + 8, 2, coreP);
        }

        // --- Top Ellipse (Connecting surface) ---
        // Base plate
        drawer.ellipse(cx, topY, rx, ryTop, c.armorDark);
        drawer.ellipse(cx, topY - 1, rx - 1, ryTop - 1, c.armor);
        // Shiny bevel
        drawer.ellipse(cx, topY - 1, rx - 3, ryTop - 2, c.armorLight);
        drawer.hLine(cx - 5, topY - ryTop + 1, 10, c.armorHi);

        // Central Dorsal Ridge (The Spine)
        drawer.fillPath([
            {x: cx - 3, y: topY - ryTop}, {x: cx + 3, y: topY - ryTop},
            {x: cx + 4, y: topY + 2}, {x: cx + 2, y: botY + 2},
            {x: cx - 2, y: botY + 2}, {x: cx - 4, y: topY + 2}
        ], c.armorDark);

        // Raised spine segments
        drawer.rect(cx - 2, topY - ryTop + 1, 4, 3, c.armor);
        drawer.rect(cx - 1, topY - ryTop + 1, 2, 1, c.armorHi);

        drawer.rect(cx - 2, topY + 1, 4, 4, c.armor);
        drawer.rect(cx - 1, topY + 1, 2, 1, c.armorHi);

        drawer.rect(cx - 1, topY + 7, 2, 4, c.armor);

        // --- Joint Energy Rings ---
        // Inner glowing joint at the top
        drawer.ellipse(cx, topY - ryTop + 2, 6, 2, '#111');
        drawer.hLine(cx - 4, topY - ryTop + 2, 8, c.coreRing);
        drawer.hLine(cx - 2, topY - ryTop + 2, 4, coreP);
        drawer.pixel(cx, topY - ryTop + 2, '#fff');

        // Rivets
        drawer.pixel(cx - 8, topY + 4, c.rivet);
        drawer.pixel(cx + 8, topY + 4, c.rivet);
        drawer.pixel(cx - 6, botY - 1, c.rivet);
        drawer.pixel(cx + 6, botY - 1, c.rivet);

        // --- Phase 2: Overload Effects ---
        if (phase === 2 && c.crack) {
            drawer.line(cx - 9, topY + 3, cx - 11, topY + 10, c.crack);
            drawer.line(cx + 5, botY - 6, cx + 8, botY, c.crack);

            if (c.spark && pulse > 0.6) {
                drawer.pixel(cx - 10, topY + 8, c.spark);
                drawer.pixel(cx + 6, botY - 3, c.spark);
                drawer.pixel(cx, topY + 5, '#fff');
            }
        }

        return drawer.getCanvas();
    }

    // ========== TAIL (28×28) ==========

    generateTail(pose = {}, phase = 1) {
        const drawer = new PixelDraw(28, 28);
        const c = this.getColors(phase);
        const cx = 14;
        const topY = 6;
        const tipY = 26;
        const rx = 10;
        const ryTop = 4;

        const pulse = pose.pulsePhase || 0;
        const coreP = Math.sin(pulse * Math.PI * 2) > 0 ? c.core : c.coreGlow;

        // --- Deep shadow socket & Joint Ring ---
        drawer.ellipse(cx, topY - ryTop + 1, 5, 2, '#111');
        drawer.hLine(cx - 3, topY - ryTop + 1, 6, c.coreRing);
        drawer.hLine(cx - 1, topY - ryTop + 1, 2, coreP);

        // --- Tapered Fin Blades (Lateral weapons) ---
        // Drawn behind the main cone body
        drawer.fillPath([
            {x: cx - rx + 1, y: topY + 4},
            {x: cx - rx - 4, y: topY + 8},
            {x: cx - rx + 2, y: topY + 14}
        ], c.armorDark);
        drawer.line(cx - rx + 1, topY + 4, cx - rx - 4, topY + 8, c.armorLight);

        drawer.fillPath([
            {x: cx + rx - 1, y: topY + 4},
            {x: cx + rx + 4, y: topY + 8},
            {x: cx + rx - 2, y: topY + 14}
        ], c.armorDark);
        drawer.line(cx + rx - 1, topY + 4, cx + rx + 4, topY + 8, c.armorLight);

        // --- Tapered Main Cone Body ---
        for (let y = topY; y <= tipY; y++) {
            const t = (y - topY) / (tipY - topY);
            // Non-linear taper for a sharper pinpoint
            const w = Math.max(1, Math.floor(rx * Math.pow(1 - t, 1.2)));

            // Base fill
            drawer.hLine(cx - w, y, w * 2, c.bellyDark);

            // Layered armor plates shading
            if (t < 0.8) {
                const aw = Math.max(1, w - 1);
                drawer.hLine(cx - aw, y, aw * 2, c.armor);
                // Bevel highlights
                drawer.pixel(cx - aw, y, c.armorLight);
                drawer.pixel(cx + aw - 1, y, c.belly);
            }
        }

        // Armor Plate Segmentation Seams
        const s1Y = topY + 5;
        const s2Y = topY + 11;
        const s3Y = topY + 16;
        const cuts = [s1Y, s2Y, s3Y];
        cuts.forEach(cy => {
            const t = (cy - topY) / (tipY - topY);
            const w = Math.floor(rx * Math.pow(1 - t, 1.2));
            drawer.hLine(cx - w, cy, w * 2, c.armorDark);
            drawer.hLine(cx - Math.max(1, w - 2), cy + 1, Math.max(1, (w-2)*2), c.armorLight);
        });

        // --- Top Ellipse (Armor Cap) ---
        drawer.ellipse(cx, topY, rx, ryTop, c.armorDark);
        drawer.ellipse(cx, topY - 1, rx - 1, ryTop - 1, c.armor);
        drawer.ellipse(cx, topY - 1, rx - 3, ryTop - 2, c.armorLight);
        drawer.hLine(cx - 4, topY - ryTop + 1, 8, c.armorHi);

        // --- Spine / Dorsal Ridge ---
        drawer.fillPath([
            {x: cx - 2, y: topY - ryTop + 1}, {x: cx + 2, y: topY - ryTop + 1},
            {x: cx + 3, y: topY + 2}, {x: cx, y: tipY - 4},
            {x: cx - 3, y: topY + 2}
        ], c.armorDark);
        drawer.line(cx, topY - ryTop + 1, cx, tipY - 4, c.armor);
        drawer.line(cx - 1, topY - ryTop + 1, cx - 1, topY + 2, c.armorHi);

        // Rivets
        drawer.pixel(cx - 5, topY + 3, c.rivet);
        drawer.pixel(cx + 5, topY + 3, c.rivet);
        drawer.pixel(cx - 3, topY + 8, c.rivet);
        drawer.pixel(cx + 3, topY + 8, c.rivet);

        // --- Plasma Stinger Tip ---
        drawer.fillPath([
            {x: cx - 2, y: tipY - 5}, {x: cx + 2, y: tipY - 5},
            {x: cx + 1, y: tipY - 1}, {x: cx - 1, y: tipY - 1}
        ], c.jaw);

        // Energy needle
        drawer.vLine(cx, tipY - 3, 5, c.coreRing);
        drawer.vLine(cx, tipY - 1, 3, coreP);
        drawer.pixel(cx, tipY + 1, '#ffffff');

        // Side emitter glow
        drawer.pixel(cx - 1, tipY - 2, coreP);
        drawer.pixel(cx + 1, tipY - 2, coreP);

        // --- Phase 2 Effects ---
        if (phase === 2 && c.crack) {
            drawer.line(cx - 4, topY + 5, cx - 1, topY + 10, c.crack);
            if (c.spark && pulse > 0.5) {
                drawer.pixel(cx - 2, topY + 9, c.spark);
                drawer.pixel(cx + 3, topY + 14, c.spark);
            }
        }

        return drawer.getCanvas();
    }
}
