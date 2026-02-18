import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Mutant Beast BOSS Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Massive mutated zombie beast - hulking twisted body,
 *            exposed muscle, back spines, one arm mutated into a giant claw
 * Canvas: 80x80 (twice ZombieBrute's 40x40)
 * Phases: 3 color phases representing escalating rage/mutation
 */
export class MutantBeastGenerator {
    constructor() {
        this.width = 80;
        this.height = 80;

        // Phase color palettes
        this.phases = {
            1: {
                skin: '#4a7c59',
                skinShadow: '#2d5a3a',
                skinLight: '#6b9e78',
                bone: '#8d8d8d',
                boneDark: '#666666',
                spineColor: '#a0a0a0',
                spineGlow: '#c8c8c8',
                blood: '#922b21',
                bloodDark: '#641e16',
                eye: '#d50000',
                accentColor: '#3e5c4a',
                muscle: '#8b3a3a',
                muscleDark: '#5c1a1a'
            },
            2: {
                skin: '#8b3a3a',
                skinShadow: '#5c1a1a',
                skinLight: '#b05050',
                bone: '#9e9e9e',
                boneDark: '#757575',
                spineColor: '#ff6b35',
                spineGlow: '#cc4400',
                blood: '#d32f2f',
                bloodDark: '#8b0000',
                eye: '#ff1744',
                accentColor: '#6d2020',
                muscle: '#cc3333',
                muscleDark: '#8b1a1a'
            },
            3: {
                skin: '#5c2d82',
                skinShadow: '#3a1a5c',
                skinLight: '#7e4aaa',
                bone: '#b0b0b0',
                boneDark: '#888888',
                spineColor: '#e040fb',
                spineGlow: '#9c27b0',
                blood: '#e040fb',
                bloodDark: '#7b1fa2',
                eye: '#e040fb',
                accentColor: '#4a1a6e',
                muscle: '#9c27b0',
                muscleDark: '#6a1b7a'
            }
        };

        // Shared colors (all phases)
        this.cBlood = PALETTE['x'];       // #922b21
        this.cBloodDark = PALETTE['X'];   // #641e16
        this.cBone = '#e8dcc8';
        this.cTeeth = '#d4c8a0';

        // Pants & Boots (torn remnants)
        this.cPants = '#3e3228';
        this.cPantsDark = '#2a2018';
        this.cPantsTear = '#5c4a3a';
        this.cBoots = '#1a1a1a';
        this.cBootsSole = '#0e0e0e';

        // Tattered clothing
        this.cCloth = '#2a2a2a';
        this.cClothDark = '#1a1a1a';
    }

    /**
     * Get color palette for the given phase
     * @param {number} phase - 1, 2, or 3
     * @returns {Object} Color palette
     */
    getColors(phase) {
        return this.phases[phase || 1];
    }

    /**
     * Generate a single frame
     * @param {Object} pose - {
     *   headOffset, bodySquash, legFrame, headTwitch, jawOpen,
     *   coatWave, armSwing, attackPhase, attackType, pulsePhase
     * }
     * @param {number} phase - 1, 2, or 3 (boss phase)
     * @returns {HTMLCanvasElement}
     */
    generateFrame(pose = {}, phase = 1) {
        const drawer = new PixelDraw(this.width, this.height);
        const c = this.getColors(phase);

        const cx = 40;
        const cy = 73;

        const bodyY = 54 + (pose.bodySquash || 0);
        const headX = cx + (pose.headTwitch?.x || 0);
        const headY = 34 + (pose.headOffset?.y || 0) + (pose.headTwitch?.y || 0);

        // 1. Draw back spines (behind body)
        this.drawSpines(drawer, cx, bodyY, c, pose);

        // 2. Draw legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle', c);

        // 3. Draw body
        this.drawBody(drawer, cx, bodyY, c, pose);

        // 4. Draw arms (or attack arms)
        if (pose.attackPhase !== undefined) {
            this.drawAttackArms(drawer, cx, bodyY, pose.attackPhase, c, pose.attackType);
        } else {
            this.drawArms(drawer, cx, bodyY, pose.armSwing || 0, c);
        }

        // 5. Draw head
        this.drawHead(drawer, headX, headY, pose.jawOpen || 0, c, phase);

        return drawer.getCanvas();
    }

    // ========================================================================
    //  HEAD - Large deformed skull with glowing eyes and broken teeth
    // ========================================================================
    drawHead(drawer, cx, cy, jawOpen = 0, c, phase) {
        const w = 24;
        const h = 20;
        const x = cx - w / 2;
        const y = cy - h + 6;

        // -- Exposed skull patches on top --
        drawer.fillPath([
            { x: x + 4, y: y - 2 },
            { x: x + 10, y: y - 4 },
            { x: x + 13, y: y - 2 },
            { x: x + 12, y: y + 2 },
            { x: x + 5, y: y + 2 }
        ], this.cBone);
        // Bone detail
        drawer.pixel(x + 8, y - 1, c.boneDark);
        drawer.pixel(x + 7, y, c.boneDark);
        drawer.pixel(x + 10, y - 3, c.boneDark);
        // Blood seepage at skull edge
        drawer.pixel(x + 5, y + 1, c.blood);
        drawer.pixel(x + 11, y + 1, c.blood);
        drawer.pixel(x + 12, y, c.bloodDark);

        // -- Main skull shape (broad, deformed) --
        // Cranium - wider ellipse
        drawer.ellipse(cx, y + 7, 12, 9, c.skin);

        // Heavy deformed jaw (wider on left/front side for asymmetry)
        drawer.fillPath([
            { x: x + 1, y: y + 8 },
            { x: x + w - 1, y: y + 8 },
            { x: x + w - 2, y: y + h },
            { x: x + w - 6, y: y + h + 2 },
            { x: x + 4, y: y + h + 2 },
            { x: x + 1, y: y + h }
        ], c.skin);

        // Shadow under brow ridge
        drawer.hLine(x + 3, y + 4, w - 6, c.skinShadow);
        drawer.hLine(x + 2, y + 5, w - 4, c.skinShadow);

        // Cheek/jaw shadows
        drawer.pixel(x + 1, y + 10, c.skinShadow);
        drawer.pixel(x + 2, y + 12, c.skinShadow);
        drawer.pixel(x + w - 2, y + 10, c.skinShadow);
        drawer.pixel(x + w - 3, y + 12, c.skinShadow);

        // Chin shadow
        drawer.hLine(x + 5, y + h + 1, w - 10, c.skinShadow);

        // Exposed muscle patches (side of face)
        drawer.fillPath([
            { x: x + w - 4, y: y + 8 },
            { x: x + w - 1, y: y + 10 },
            { x: x + w - 2, y: y + 14 },
            { x: x + w - 5, y: y + 13 }
        ], c.muscle);
        drawer.pixel(x + w - 3, y + 11, c.muscleDark);

        // -- Left eye (normal-ish, deep-set) --
        drawer.rect(x + 5, y + 6, 5, 4, c.skinShadow);   // Deep socket
        drawer.rect(x + 6, y + 6, 3, 3, '#1a1a1a');       // Eye socket dark
        drawer.rect(x + 6, y + 7, 2, 2, '#fffde7');       // Sclera
        drawer.pixel(x + 7, y + 7, c.eye);                 // Pupil
        drawer.pixel(x + 6, y + 6, c.skinShadow);          // Upper lid shadow

        // -- Right eye (larger, mutated, bulging) --
        drawer.rect(x + 14, y + 5, 6, 5, c.skinShadow);   // Larger socket
        drawer.rect(x + 15, y + 5, 5, 4, '#1a1a1a');       // Socket dark
        drawer.ellipse(x + 17, y + 7, 2, 2, '#fffde7');    // Larger sclera
        drawer.rect(x + 16, y + 7, 2, 2, c.eye);           // Bigger pupil
        // Bulging veins around mutated eye
        drawer.pixel(x + 14, y + 5, c.blood);
        drawer.pixel(x + 20, y + 6, c.blood);
        drawer.pixel(x + 19, y + 4, c.bloodDark);
        drawer.pixel(x + 15, y + 9, c.blood);

        // -- Nose (flattened, broken) --
        drawer.pixel(cx - 1, y + 10, c.skinShadow);
        drawer.pixel(cx, y + 10, c.skinShadow);
        drawer.pixel(cx, y + 11, c.skinShadow);

        // -- Mouth (wide, broken teeth, jawOpen controls opening) --
        const mouthY = y + 13;
        const mouthW = 12;
        const mouthH = 3 + jawOpen;
        const mouthX = cx - mouthW / 2;

        drawer.rect(mouthX, mouthY, mouthW, mouthH, '#1c0e07');

        // Upper teeth row (broken, scattered)
        drawer.pixel(mouthX, mouthY, this.cTeeth);
        drawer.pixel(mouthX + 1, mouthY, this.cTeeth);
        drawer.pixel(mouthX + 3, mouthY, this.cBone);
        drawer.pixel(mouthX + 5, mouthY, this.cTeeth);
        drawer.pixel(mouthX + 7, mouthY, this.cTeeth);
        drawer.pixel(mouthX + 9, mouthY, this.cBone);
        drawer.pixel(mouthX + 11, mouthY, this.cTeeth);

        // Fangs (longer teeth at corners)
        drawer.pixel(mouthX, mouthY + 1, this.cTeeth);
        drawer.pixel(mouthX + 3, mouthY + 1, this.cBone);
        drawer.pixel(mouthX + 11, mouthY + 1, this.cTeeth);

        // Lower teeth (bottom of mouth)
        if (jawOpen > 0) {
            const btmY = mouthY + mouthH - 1;
            drawer.pixel(mouthX + 2, btmY, this.cTeeth);
            drawer.pixel(mouthX + 5, btmY, this.cBone);
            drawer.pixel(mouthX + 8, btmY, this.cTeeth);
            drawer.pixel(mouthX + 10, btmY, this.cTeeth);
        }

        // Blood/drool
        if (jawOpen > 1) {
            drawer.pixel(mouthX + 2, mouthY + mouthH, c.blood);
            drawer.pixel(mouthX + 4, mouthY + mouthH, c.bloodDark);
            drawer.pixel(mouthX + 8, mouthY + mouthH + 1, c.blood);
        }
        if (jawOpen > 2) {
            drawer.pixel(mouthX + 6, mouthY + mouthH + 1, c.blood);
            drawer.pixel(mouthX + 3, mouthY + mouthH + 2, c.bloodDark);
        }

        // -- Phase 3: Glowing cracks across skull --
        if (phase === 3) {
            const glowA = c.spineColor; // #e040fb
            const glowB = c.spineGlow;  // #9c27b0

            // Crack line from top-left to right cheek
            drawer.pixel(x + 6, y + 1, glowA);
            drawer.pixel(x + 7, y + 2, glowA);
            drawer.pixel(x + 8, y + 3, glowB);
            drawer.pixel(x + 9, y + 4, glowA);
            drawer.pixel(x + 10, y + 5, glowA);
            drawer.pixel(x + 11, y + 5, glowB);
            drawer.pixel(x + 12, y + 6, glowA);

            // Second crack from forehead down to jaw
            drawer.pixel(x + 14, y + 2, glowB);
            drawer.pixel(x + 14, y + 3, glowA);
            drawer.pixel(x + 15, y + 4, glowA);
            drawer.pixel(x + 16, y + 5, glowB);
            drawer.pixel(x + 17, y + 7, glowA);
            drawer.pixel(x + 17, y + 9, glowA);
            drawer.pixel(x + 18, y + 10, glowB);
            drawer.pixel(x + 18, y + 12, glowA);

            // Branching crack
            drawer.pixel(x + 8, y + 4, glowB);
            drawer.pixel(x + 7, y + 5, glowA);
            drawer.pixel(x + 6, y + 7, glowB);
        }
    }

    // ========================================================================
    //  BODY - Massive torso with exposed muscle and tattered clothing
    // ========================================================================
    drawBody(drawer, cx, cy, c, pose) {
        const w = 24;
        const h = 16;
        const x = cx - w / 2;
        const y = cy - h + 3;

        const coatWave = pose.coatWave || 0;

        // -- Main torso mass (large, hulking) --
        drawer.fillPath([
            { x: x + 2, y: y },
            { x: x + w - 2, y: y },
            { x: x + w, y: y + 4 },
            { x: x + w + 1, y: y + h - 2 },
            { x: x + w - 1, y: y + h },
            { x: x + 1, y: y + h },
            { x: x - 1, y: y + h - 2 },
            { x: x, y: y + 4 }
        ], c.skin);

        // Skin shadow contours (muscle definition)
        drawer.vLine(x + 2, y + 2, h - 4, c.skinShadow);
        drawer.vLine(x + w - 2, y + 2, h - 4, c.skinShadow);
        drawer.hLine(x + 4, y + 1, w - 8, c.skinShadow); // Collar shadow

        // Center line (sternum/abs shadow)
        drawer.vLine(cx, y + 3, 8, c.skinShadow);
        drawer.pixel(cx - 1, y + 4, c.skinShadow);
        drawer.pixel(cx + 1, y + 4, c.skinShadow);

        // -- Exposed muscle tissue (left side) --
        drawer.fillPath([
            { x: x + 1, y: y + 3 },
            { x: x + 6, y: y + 2 },
            { x: x + 7, y: y + 8 },
            { x: x + 4, y: y + 10 },
            { x: x, y: y + 8 }
        ], c.muscle);
        // Muscle fiber details
        drawer.pixel(x + 3, y + 4, c.muscleDark);
        drawer.pixel(x + 4, y + 5, c.muscleDark);
        drawer.pixel(x + 2, y + 6, c.muscleDark);
        drawer.pixel(x + 5, y + 7, c.muscleDark);
        drawer.pixel(x + 3, y + 8, c.muscleDark);
        // Blood seepage
        drawer.pixel(x + 6, y + 3, c.blood);
        drawer.pixel(x + 5, y + 9, c.blood);
        drawer.pixel(x + 1, y + 7, c.bloodDark);

        // -- Tattered clothing remnants (dark rags across torso) --
        // Right side clothing strip
        drawer.fillPath([
            { x: x + w - 8, y: y },
            { x: x + w - 2, y: y },
            { x: x + w - 1, y: y + 5 },
            { x: x + w - 5, y: y + 6 },
            { x: x + w - 9, y: y + 3 }
        ], this.cCloth);
        drawer.pixel(x + w - 6, y + 1, this.cClothDark);
        drawer.pixel(x + w - 4, y + 3, this.cClothDark);

        // Diagonal rag across chest
        drawer.fillPath([
            { x: x + 8, y: y },
            { x: x + 12, y: y },
            { x: x + w - 4, y: y + h - 3 },
            { x: x + w - 8, y: y + h - 2 }
        ], this.cCloth);
        drawer.pixel(x + 10, y + 2, this.cClothDark);
        drawer.pixel(x + 14, y + 6, this.cClothDark);

        // -- Belt area --
        drawer.hLine(x + 1, y + h - 3, w - 2, '#3e3228');
        drawer.hLine(x + 1, y + h - 2, w - 2, '#2a2018');
        // Belt buckle (bent metal)
        drawer.rect(cx - 2, y + h - 3, 4, 2, '#6e6e6e');
        drawer.pixel(cx, y + h - 3, '#9e9e9e');

        // -- Torn fabric flaps hanging from belt (dynamic) --
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        const flare = Math.abs(swing) * 0.4;

        const flapY = y + h;
        const flapH = 5;

        // Left flap (larger torn fabric)
        drawer.fillPath([
            { x: x + 1, y: flapY },
            { x: x + 7, y: flapY },
            { x: x + 6 + swing + flare, y: flapY + flapH },
            { x: x + 4 + swing, y: flapY + flapH + 1 },
            { x: x - 1 + swing - flare, y: flapY + flapH }
        ], this.cCloth);
        // Tattered edge detail
        drawer.pixel(x + 2 + Math.round(swing * 0.5), flapY + flapH - 1, this.cClothDark);
        drawer.pixel(x + 5 + Math.round(swing * 0.3), flapY + flapH, this.cClothDark);

        // Center flap
        drawer.fillPath([
            { x: cx - 3, y: flapY },
            { x: cx + 3, y: flapY },
            { x: cx + 2 + swing * 0.5, y: flapY + flapH - 1 },
            { x: cx - 2 + swing * 0.5, y: flapY + flapH - 1 }
        ], this.cCloth);

        // Right flap
        drawer.fillPath([
            { x: x + w - 7, y: flapY },
            { x: x + w - 1, y: flapY },
            { x: x + w + swing + flare, y: flapY + flapH },
            { x: x + w - 3 + swing, y: flapY + flapH + 1 },
            { x: x + w - 8 + swing - flare, y: flapY + flapH }
        ], this.cCloth);
        drawer.pixel(x + w - 4 + Math.round(swing * 0.5), flapY + flapH - 1, this.cClothDark);

        // Skin visible through torn cloth
        drawer.pixel(x + w - 6, y + 7, c.skinLight);
        drawer.pixel(x + w - 5, y + 8, c.skin);
    }

    // ========================================================================
    //  SPINES - Bone spikes protruding from the back
    // ========================================================================
    drawSpines(drawer, cx, bodyY, c, pose) {
        const baseY = bodyY - 10;
        const pulsePhase = pose.pulsePhase || 0;

        // 5 spines of varying heights, spread across back
        const spines = [
            { x: cx - 8, h: 10, w: 3 },
            { x: cx - 4, h: 14, w: 4 },
            { x: cx,     h: 16, w: 4 },
            { x: cx + 4, h: 13, w: 4 },
            { x: cx + 7, h: 9,  w: 3 }
        ];

        for (let i = 0; i < spines.length; i++) {
            const s = spines[i];
            const spY = baseY + 2;
            const tipY = spY - s.h;

            // Determine spine color based on phase and pulse
            let sColor = c.spineColor;
            let sGlow = c.spineGlow;

            // Phase 3: pulsing alternation
            if (pulsePhase > 0) {
                const pulse = Math.sin(pulsePhase * Math.PI * 2 + i * 1.2);
                if (pulse > 0) {
                    sColor = c.spineGlow;
                    sGlow = c.spineColor;
                }
            }

            // Main spine triangle
            drawer.fillPath([
                { x: s.x - Math.floor(s.w / 2), y: spY },
                { x: s.x, y: tipY },
                { x: s.x + Math.ceil(s.w / 2), y: spY }
            ], sColor);

            // Spine highlight (left edge)
            drawer.fillPath([
                { x: s.x - Math.floor(s.w / 2), y: spY },
                { x: s.x - 1, y: tipY + 2 },
                { x: s.x, y: tipY },
                { x: s.x - Math.floor(s.w / 2) + 1, y: spY }
            ], sGlow);

            // Dark right edge shadow
            drawer.fillPath([
                { x: s.x + Math.ceil(s.w / 2), y: spY },
                { x: s.x + 1, y: tipY + 2 },
                { x: s.x, y: tipY }
            ], c.boneDark);

            // Bone texture detail on larger spines
            if (s.h > 10) {
                drawer.pixel(s.x, tipY + 3, c.bone);
                drawer.pixel(s.x, tipY + 6, c.boneDark);
                drawer.pixel(s.x - 1, tipY + 5, c.bone);
            }

            // Blood at spine base (where it emerges from skin)
            drawer.pixel(s.x - 1, spY, c.blood);
            drawer.pixel(s.x + 1, spY, c.bloodDark);
        }
    }

    // ========================================================================
    //  ARMS - Left normal (massive), Right mutated (giant claw)
    // ========================================================================
    drawArms(drawer, cx, cy, armSwing = 0, c) {
        const sy = cy - 10;

        // ============================================================
        // LEFT ARM (Normal-ish but massive, thick forearm + fist)
        // ============================================================
        const lx = cx - 14;

        // Shoulder mass
        drawer.fillPath([
            { x: lx + 4, y: sy },
            { x: lx + 10, y: sy },
            { x: lx + 8, y: sy + 4 },
            { x: lx + 2, y: sy + 3 }
        ], c.skin);
        // Shoulder shadow
        drawer.pixel(lx + 5, sy + 1, c.skinShadow);

        // Cloth remnant on shoulder
        drawer.fillPath([
            { x: lx + 5, y: sy },
            { x: lx + 9, y: sy },
            { x: lx + 7, y: sy + 2 }
        ], this.cCloth);

        // Thick upper arm
        drawer.fillPath([
            { x: lx + 2, y: sy + 3 },
            { x: lx + 8, y: sy + 4 },
            { x: lx + 6, y: sy + 8 },
            { x: lx, y: sy + 7 }
        ], c.skin);
        // Muscle definition
        drawer.pixel(lx + 3, sy + 4, c.skinShadow);
        drawer.pixel(lx + 4, sy + 5, c.skinShadow);
        drawer.pixel(lx + 2, sy + 6, c.skinShadow);
        // Blood/wound
        drawer.pixel(lx + 5, sy + 6, c.blood);

        // Thick forearm
        drawer.fillPath([
            { x: lx, y: sy + 7 },
            { x: lx + 6, y: sy + 8 },
            { x: lx + 4, y: sy + 12 },
            { x: lx - 2, y: sy + 11 }
        ], c.skin);
        // Forearm shadow
        drawer.pixel(lx + 1, sy + 9, c.skinShadow);
        drawer.pixel(lx + 2, sy + 10, c.skinShadow);

        // Fist (bigger than brute, 4x4)
        drawer.rect(lx - 3, sy + 11, 5, 4, c.skin);
        drawer.pixel(lx - 3, sy + 12, c.skinShadow);
        drawer.pixel(lx - 2, sy + 14, c.skinShadow);
        drawer.pixel(lx + 1, sy + 13, c.skinShadow);
        // Knuckle highlights
        drawer.pixel(lx - 1, sy + 11, c.skinLight);

        // ============================================================
        // RIGHT ARM (MUTATED - giant claw arm)
        // ============================================================
        const rx = cx + 14;
        const rSwing = Math.round(armSwing * 2);

        // Massive mutated shoulder (swollen)
        drawer.ellipse(rx - 2, sy + 1, 5, 4, c.skin);
        drawer.pixel(rx - 4, sy, c.skinShadow);
        drawer.pixel(rx + 2, sy + 2, c.skinShadow);
        // Exposed sinew on swollen shoulder
        drawer.pixel(rx - 1, sy - 1, c.muscle);
        drawer.pixel(rx, sy, c.muscleDark);

        // Grotesquely thick upper arm
        drawer.fillPath([
            { x: rx - 5, y: sy + 4 },
            { x: rx + 3, y: sy + 4 },
            { x: rx + 5, y: sy + 9 },
            { x: rx - 3, y: sy + 9 }
        ], c.skin);
        // Bone protruding through skin
        drawer.fillPath([
            { x: rx + 2, y: sy + 5 },
            { x: rx + 4, y: sy + 4 },
            { x: rx + 5, y: sy + 7 },
            { x: rx + 3, y: sy + 7 }
        ], this.cBone);
        drawer.pixel(rx + 3, sy + 6, c.boneDark);
        // Muscle/sinew texture
        drawer.pixel(rx - 2, sy + 5, c.muscle);
        drawer.pixel(rx - 1, sy + 7, c.muscleDark);
        drawer.pixel(rx + 1, sy + 6, c.muscle);

        // Mutated forearm (even thicker, armored)
        drawer.fillPath([
            { x: rx - 3, y: sy + 9 },
            { x: rx + 5, y: sy + 9 },
            { x: rx + 6 + rSwing, y: sy + 14 },
            { x: rx - 2 + rSwing, y: sy + 14 }
        ], c.skin);
        // Hard chitinous plates
        drawer.rect(rx - 1 + Math.round(rSwing * 0.3), sy + 10, 5, 3, c.bone);
        drawer.pixel(rx + Math.round(rSwing * 0.3), sy + 11, c.boneDark);
        drawer.pixel(rx + 3 + Math.round(rSwing * 0.3), sy + 11, c.boneDark);

        // -- Claw hand (3 sharp claws spread out) --
        const clawBaseX = rx + 1 + rSwing;
        const clawBaseY = sy + 14;

        // Claw palm/wrist mass
        drawer.fillPath([
            { x: clawBaseX - 3, y: clawBaseY },
            { x: clawBaseX + 5, y: clawBaseY },
            { x: clawBaseX + 4, y: clawBaseY + 3 },
            { x: clawBaseX - 2, y: clawBaseY + 3 }
        ], c.skin);
        drawer.pixel(clawBaseX, clawBaseY + 1, c.skinShadow);
        drawer.pixel(clawBaseX + 2, clawBaseY + 2, c.skinShadow);

        // Upper claw (angled up-left)
        drawer.fillPath([
            { x: clawBaseX - 2, y: clawBaseY + 1 },
            { x: clawBaseX - 1, y: clawBaseY },
            { x: clawBaseX - 6, y: clawBaseY - 3 },
            { x: clawBaseX - 7, y: clawBaseY - 2 }
        ], this.cBone);
        drawer.pixel(clawBaseX - 6, clawBaseY - 2, this.cTeeth);
        drawer.pixel(clawBaseX - 5, clawBaseY - 1, c.boneDark);

        // Middle claw (straight forward-left)
        drawer.fillPath([
            { x: clawBaseX - 2, y: clawBaseY + 2 },
            { x: clawBaseX - 2, y: clawBaseY + 1 },
            { x: clawBaseX - 9, y: clawBaseY + 1 },
            { x: clawBaseX - 9, y: clawBaseY + 3 }
        ], this.cBone);
        drawer.pixel(clawBaseX - 8, clawBaseY + 2, this.cTeeth);
        drawer.pixel(clawBaseX - 5, clawBaseY + 1, c.boneDark);

        // Lower claw (angled down-left)
        drawer.fillPath([
            { x: clawBaseX - 2, y: clawBaseY + 2 },
            { x: clawBaseX - 1, y: clawBaseY + 3 },
            { x: clawBaseX - 6, y: clawBaseY + 6 },
            { x: clawBaseX - 7, y: clawBaseY + 5 }
        ], this.cBone);
        drawer.pixel(clawBaseX - 6, clawBaseY + 5, this.cTeeth);
        drawer.pixel(clawBaseX - 4, clawBaseY + 4, c.boneDark);

        // Blood on claw tips
        drawer.pixel(clawBaseX - 7, clawBaseY - 2, c.blood);
        drawer.pixel(clawBaseX - 9, clawBaseY + 2, c.blood);
        drawer.pixel(clawBaseX - 7, clawBaseY + 5, c.blood);
    }

    // ========================================================================
    //  ATTACK ARMS - Phase-based attack animation
    // ========================================================================
    drawAttackArms(drawer, cx, cy, phase, c, attackType = 'smash') {
        const sy = cy - 10;

        let lArmX, lHandX, lHandY, rArmX, rClawX, rClawY;

        // Compute positions based on attack phase (0~1)
        if (phase < 0.2) {
            // Wind-up: arms pull back and raise
            const t = phase / 0.2;
            lArmX = cx - 14 + t * 8;
            lHandX = cx - 17 + t * 12;
            lHandY = sy + 11 - t * 4;
            rArmX = cx + 14;
            rClawX = cx + 15 + t * 2;
            rClawY = sy + 14 - t * 5;
        } else if (phase < 0.5) {
            // Lunge: arms thrust forward powerfully
            const t = (phase - 0.2) / 0.3;
            lArmX = cx - 6 - t * 16;
            lHandX = cx - 5 - t * 22;
            lHandY = sy + 7 + t * 5;
            rArmX = cx + 14 - t * 20;
            rClawX = cx + 17 - t * 28;
            rClawY = sy + 9 + t * 6;
        } else if (phase < 0.75) {
            // Strike: max extension
            const t = (phase - 0.5) / 0.25;
            lArmX = cx - 22;
            lHandX = cx - 27 - t * 2;
            lHandY = sy + 12 + t * 3;
            rArmX = cx - 6;
            rClawX = cx - 11 - t * 2;
            rClawY = sy + 15 + t * 2;

            // Stomp variant: arms go down more
            if (attackType === 'stomp') {
                lHandY += t * 4;
                rClawY += t * 4;
            }
        } else {
            // Recovery: return to rest
            const t = (phase - 0.75) / 0.25;
            lArmX = cx - 22 + t * 8;
            lHandX = cx - 29 + t * 12;
            lHandY = sy + 15 - t * 4;
            rArmX = cx - 6 + t * 20;
            rClawX = cx - 13 + t * 28;
            rClawY = sy + 17 - t * 3;
        }

        lArmX = Math.round(lArmX);
        lHandX = Math.round(lHandX);
        lHandY = Math.round(lHandY);
        rArmX = Math.round(rArmX);
        rClawX = Math.round(rClawX);
        rClawY = Math.round(rClawY);

        // ============================================================
        // LEFT ARM (Normal fist - attack pose)
        // ============================================================
        // Shoulder
        drawer.fillPath([
            { x: lArmX + 4, y: sy },
            { x: lArmX + 10, y: sy },
            { x: lArmX + 8, y: sy + 4 },
            { x: lArmX + 2, y: sy + 3 }
        ], c.skin);
        drawer.pixel(lArmX + 6, sy + 1, this.cCloth);

        // Upper arm
        drawer.fillPath([
            { x: lArmX + 2, y: sy + 3 },
            { x: lArmX + 8, y: sy + 4 },
            { x: lHandX + 6, y: lHandY - 2 },
            { x: lHandX + 1, y: lHandY - 3 }
        ], c.skin);
        // Muscle shadow
        drawer.pixel(lArmX + 3, sy + 4, c.skinShadow);
        drawer.pixel(lArmX + 5, sy + 5, c.skinShadow);
        drawer.pixel(lHandX + 3, lHandY - 2, c.skinShadow);
        // Blood
        drawer.pixel(lArmX + 4, sy + 6, c.blood);

        // Fist
        drawer.rect(lHandX - 1, lHandY, 5, 4, c.skin);
        drawer.pixel(lHandX - 1, lHandY + 1, c.skinShadow);
        drawer.pixel(lHandX, lHandY + 3, c.skinShadow);
        drawer.pixel(lHandX + 3, lHandY + 2, c.skinShadow);
        drawer.pixel(lHandX + 1, lHandY, c.skinLight);

        // ============================================================
        // RIGHT ARM (Mutated claw - attack pose)
        // ============================================================
        // Swollen shoulder
        drawer.ellipse(rArmX - 2, sy + 1, 5, 4, c.skin);
        drawer.pixel(rArmX - 1, sy - 1, c.muscle);
        drawer.pixel(rArmX + 1, sy, c.muscleDark);

        // Thick mutated arm
        drawer.fillPath([
            { x: rArmX - 5, y: sy + 4 },
            { x: rArmX + 3, y: sy + 4 },
            { x: rClawX + 6, y: rClawY - 2 },
            { x: rClawX, y: rClawY - 3 }
        ], c.skin);

        // Bone plate on forearm
        drawer.fillPath([
            { x: rArmX, y: sy + 5 },
            { x: rArmX + 3, y: sy + 5 },
            { x: rClawX + 4, y: rClawY - 2 },
            { x: rClawX + 2, y: rClawY - 2 }
        ], c.bone);
        drawer.pixel(rArmX + 1, sy + 6, c.boneDark);

        // Muscle/sinew
        drawer.pixel(rArmX - 3, sy + 5, c.muscle);
        drawer.pixel(rArmX - 1, sy + 7, c.muscleDark);

        // -- Claw at attack position (spread wide during strike) --
        const spread = (phase >= 0.3 && phase < 0.75) ? 2 : 0;

        // Claw palm
        drawer.fillPath([
            { x: rClawX - 3, y: rClawY },
            { x: rClawX + 5, y: rClawY },
            { x: rClawX + 4, y: rClawY + 3 },
            { x: rClawX - 2, y: rClawY + 3 }
        ], c.skin);
        drawer.pixel(rClawX, rClawY + 1, c.skinShadow);

        // Upper claw
        drawer.fillPath([
            { x: rClawX - 2, y: rClawY },
            { x: rClawX - 1, y: rClawY - 1 },
            { x: rClawX - 8, y: rClawY - 4 - spread },
            { x: rClawX - 9, y: rClawY - 3 - spread }
        ], this.cBone);
        drawer.pixel(rClawX - 8, rClawY - 3 - spread, c.blood);

        // Middle claw
        drawer.fillPath([
            { x: rClawX - 2, y: rClawY + 1 },
            { x: rClawX - 2, y: rClawY },
            { x: rClawX - 11, y: rClawY },
            { x: rClawX - 11, y: rClawY + 2 }
        ], this.cBone);
        drawer.pixel(rClawX - 10, rClawY + 1, c.blood);

        // Lower claw
        drawer.fillPath([
            { x: rClawX - 2, y: rClawY + 2 },
            { x: rClawX - 1, y: rClawY + 3 },
            { x: rClawX - 8, y: rClawY + 7 + spread },
            { x: rClawX - 9, y: rClawY + 6 + spread }
        ], this.cBone);
        drawer.pixel(rClawX - 8, rClawY + 6 + spread, c.blood);

        // Sweep attack: claws fan out more laterally
        if (attackType === 'sweep' && phase >= 0.3 && phase < 0.75) {
            // Extra claw spread indicators (motion blur pixels)
            drawer.pixel(rClawX - 10, rClawY - 2, c.bone);
            drawer.pixel(rClawX - 12, rClawY + 1, c.bone);
            drawer.pixel(rClawX - 10, rClawY + 5, c.bone);
        }
    }

    // ========================================================================
    //  LEGS - 7-pose system (thicker, wider spacing than ZombieBrute)
    // ========================================================================
    drawLegs(drawer, cx, cy, pose, c) {
        let leftPose = 'idle';
        let rightPose = 'idle';

        if (typeof pose === 'string') {
            leftPose = pose;
            rightPose = pose;
        } else if (pose && typeof pose === 'object') {
            leftPose = pose.left || 'idle';
            rightPose = pose.right || 'idle';
        }

        // Left Leg (Back) - wider spacing for massive body
        this.drawOneLeg(drawer, cx - 8, cy, leftPose, c);
        // Right Leg (Front)
        this.drawOneLeg(drawer, cx + 2, cy, rightPose, c);
    }

    drawOneLeg(drawer, x, y, pose, c) {
        const legW = 7;
        const legH = 14;
        const P = this.cPants;
        const PD = this.cPantsDark;
        const PT = this.cPantsTear;
        const B = this.cBoots;
        const BS = this.cBootsSole;
        const hipY = y - legH;

        // Map legacy poses
        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        if (pose === 'idle' || pose === 'stand') {
            // Thigh
            drawer.rect(x, hipY, legW, 5, P);
            drawer.vLine(x, hipY, 5, PD);
            drawer.pixel(x + 3, hipY + 1, c.skin);
            drawer.pixel(x + 4, hipY + 2, c.skin);
            drawer.pixel(x + 2, hipY + 3, PT);
            // Shin
            drawer.rect(x, hipY + 5, legW, 5, P);
            drawer.vLine(x, hipY + 5, 5, PD);
            drawer.pixel(x + 4, hipY + 6, c.skin);
            drawer.pixel(x + 3, hipY + 8, PT);
            // Boot
            drawer.rect(x - 1, hipY + 10, legW + 2, 4, B);
            drawer.hLine(x - 1, hipY + 13, legW + 2, BS);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, legW, 5, P);
            drawer.vLine(x, hipY, 5, PD);
            drawer.pixel(x + 3, hipY + 2, c.skin);
            drawer.rect(x - 3, hipY + 5, legW, 5, P);
            drawer.pixel(x - 1, hipY + 6, c.skin);
            drawer.rect(x - 4, hipY + 10, legW + 2, 4, B);
            drawer.hLine(x - 4, hipY + 13, legW + 2, BS);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, legW, 5, P);
            drawer.vLine(x, hipY, 5, PD);
            drawer.rect(x - 5, hipY + 5, legW, 5, P);
            drawer.pixel(x - 3, hipY + 7, c.skin);
            drawer.rect(x - 6, hipY + 10, legW + 2, 4, B);
            drawer.hLine(x - 6, hipY + 13, legW + 2, BS);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, legW, 5, P);
            drawer.vLine(x, hipY, 5, PD);
            drawer.rect(x + 3, hipY + 5, legW, 5, P);
            drawer.pixel(x + 5, hipY + 7, c.skin);
            drawer.rect(x + 4, hipY + 10, legW + 2, 4, B);
            drawer.hLine(x + 4, hipY + 13, legW + 2, BS);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, legW, 5, P);
            drawer.vLine(x, hipY, 5, PD);
            drawer.rect(x + 5, hipY + 5, legW, 5, P);
            drawer.rect(x + 6, hipY + 10, legW + 2, 4, B);
            drawer.hLine(x + 6, hipY + 13, legW + 2, BS);
        }
        else if (pose === 'knee') {
            drawer.rect(x, hipY, legW, 4, P);
            drawer.vLine(x, hipY, 4, PD);
            drawer.pixel(x + 3, hipY + 2, c.skin);
            drawer.rect(x - 2, hipY + 4, legW, 5, P);
            drawer.pixel(x, hipY + 6, c.skin);
            drawer.rect(x - 3, hipY + 9, legW + 2, 4, B);
            drawer.hLine(x - 3, hipY + 12, legW + 2, BS);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, legW, 4, P);
            drawer.vLine(x, hipY, 4, PD);
            drawer.rect(x + 4, hipY + 3, legW, 4, P);
            drawer.rect(x + 5, hipY + 7, legW + 2, 3, B);
            drawer.hLine(x + 5, hipY + 9, legW + 2, BS);
        }
    }
}
