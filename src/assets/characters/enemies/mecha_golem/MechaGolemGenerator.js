import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for the MechaGolem (机械魔偶) BOSS Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Half-mechanized cyborg with built-in weapons -
 *            asymmetric arms (gatling gun left, rocket launcher right),
 *            piston legs, glowing energy core, angular blocky silhouette
 * Canvas: 64x64
 * Phases: 2 color phases (Armed Protocol / Overload)
 */
export class MechaGolemGenerator {
    constructor() {
        this.width = 64;
        this.height = 64;

        // Phase color palettes
        this.phases = {
            // Phase 1: Armed Protocol - cool steel blue-gray tones
            1: {
                body: '#4a5a6a',        // Steel blue-gray body
                bodyDark: '#2a3544',    // Dark shadow
                bodyLight: '#6a8a9a',   // Light highlight
                core: '#3498db',        // Blue energy core
                coreGlow: '#5dade2',    // Core glow
                barrel: '#7f8c8d',      // Gatling barrel metal
                launcher: '#95a5a6',    // Launcher tube
                armor: '#34495e',       // Armor plating
                joint: '#636e72',       // Mechanical joints
                eye: '#3498db',         // Blue optical eye
                crack: null,            // No cracks in phase 1
                spark: null             // No sparks in phase 1
            },
            // Phase 2: Overload - heated reds/oranges, damaged
            2: {
                body: '#6a4a3a',        // Overheated metal
                bodyDark: '#3a2a1a',    // Dark
                bodyLight: '#8a6a5a',   // Light
                core: '#e74c3c',        // Red core
                coreGlow: '#ff6b6b',    // Intense glow
                barrel: '#c0392b',      // Heated barrels
                launcher: '#e67e22',    // Orange heat
                armor: '#5a3a2a',       // Damaged armor
                joint: '#d35400',       // Glowing joints
                eye: '#e74c3c',         // Red eye
                crack: '#2c3e50',       // Crack lines
                spark: '#f39c12'        // Sparks
            }
        };
    }

    /**
     * Get color palette for the given phase
     * @param {number} phase - 1 or 2
     * @returns {Object} Color palette
     */
    getColors(phase) {
        return this.phases[phase || 1];
    }

    /**
     * Generate a single frame
     * @param {Object} pose - {
     *   headOffset: { x, y },
     *   bodySquash: number (-1 to 1),
     *   legFrame: string or { left, right },
     *   pulsePhase: number (0-1),
     *   barrelRot: number (0-2),
     *   armAngle: number (degrees),
     *   attackType: string|null,
     *   attackPhase: number (0-1)
     * }
     * @param {number} phase - 1 or 2 (boss phase)
     * @returns {HTMLCanvasElement}
     */
    generateFrame(pose = {}, phase = 1) {
        const drawer = new PixelDraw(this.width, this.height);
        const c = this.getColors(phase);

        const cx = 32;
        const groundY = 58;

        const bodyY = groundY - 20 + (pose.bodySquash || 0);
        const headX = cx + (pose.headOffset?.x || 0);
        const headY = groundY - 28 + (pose.headOffset?.y || 0);

        // 1. Draw legs (bottom layer)
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', c);

        // 2. Draw body
        this.drawBody(drawer, cx, bodyY, c, pose);

        // 3. Draw energy core
        this.drawCore(drawer, cx, bodyY, c, pose, phase);

        // 4. Draw arms (gatling left, launcher right)
        if (pose.attackPhase !== undefined && pose.attackPhase !== null) {
            this.drawAttackArms(drawer, cx, bodyY, c, pose);
        } else {
            this.drawArms(drawer, cx, bodyY, c, pose);
        }

        // 5. Draw head
        this.drawHead(drawer, headX, headY, c, phase);

        // 6. Phase 2 overload effects
        if (phase === 2) {
            this.drawOverloadEffects(drawer, cx, bodyY, c, pose);
        }

        return drawer.getCanvas();
    }

    // ========================================================================
    //  LEGS - Mechanical piston legs, 7-pose system
    // ========================================================================
    drawLegs(drawer, cx, groundY, pose, c) {
        let leftPose = 'idle';
        let rightPose = 'idle';

        if (typeof pose === 'string') {
            leftPose = pose;
            rightPose = pose;
        } else if (pose && typeof pose === 'object') {
            leftPose = pose.left || 'idle';
            rightPose = pose.right || 'idle';
        }

        // Left leg (back) - offset left from center
        this.drawOneLeg(drawer, cx - 7, groundY, leftPose, c);
        // Right leg (front) - offset right from center
        this.drawOneLeg(drawer, cx + 2, groundY, rightPose, c);
    }

    drawOneLeg(drawer, x, y, pose, c) {
        const upperW = 4;
        const upperH = 6;
        const lowerW = 3;
        const lowerH = 6;
        const bootW = 5;
        const bootH = 3;
        const hipY = y - upperH - lowerH - bootH;

        // Map legacy poses
        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        if (pose === 'idle' || pose === 'stand') {
            // Upper piston
            drawer.rect(x, hipY, upperW, upperH, c.armor);
            drawer.vLine(x + 1, hipY, upperH, c.bodyLight);
            drawer.vLine(x + upperW - 1, hipY, upperH, c.bodyDark);
            // Joint
            drawer.hLine(x - 1, hipY + upperH, upperW + 2, c.joint);
            // Lower piston
            drawer.rect(x, hipY + upperH + 1, lowerW, lowerH, c.body);
            drawer.vLine(x + 1, hipY + upperH + 1, lowerH, c.bodyLight);
            // Heavy boot
            drawer.rect(x - 1, hipY + upperH + lowerH + 1, bootW, bootH, c.bodyDark);
            drawer.hLine(x - 1, hipY + upperH + lowerH + bootH, bootW, '#1a1a1a');
        }
        else if (pose === 'fwd1') {
            // Upper piston
            drawer.rect(x, hipY, upperW, upperH, c.armor);
            drawer.vLine(x + 1, hipY, upperH, c.bodyLight);
            // Joint
            drawer.hLine(x - 2, hipY + upperH, upperW + 2, c.joint);
            // Lower piston (angled forward)
            drawer.rect(x - 2, hipY + upperH + 1, lowerW, lowerH, c.body);
            drawer.vLine(x - 1, hipY + upperH + 1, lowerH, c.bodyLight);
            // Boot
            drawer.rect(x - 3, hipY + upperH + lowerH + 1, bootW, bootH, c.bodyDark);
            drawer.hLine(x - 3, hipY + upperH + lowerH + bootH, bootW, '#1a1a1a');
        }
        else if (pose === 'fwd2') {
            // Upper piston
            drawer.rect(x, hipY, upperW, upperH, c.armor);
            drawer.vLine(x + 1, hipY, upperH, c.bodyLight);
            // Joint
            drawer.hLine(x - 4, hipY + upperH, upperW + 2, c.joint);
            // Lower piston (extended forward)
            drawer.rect(x - 4, hipY + upperH + 1, lowerW, lowerH, c.body);
            // Boot
            drawer.rect(x - 5, hipY + upperH + lowerH + 1, bootW, bootH, c.bodyDark);
            drawer.hLine(x - 5, hipY + upperH + lowerH + bootH, bootW, '#1a1a1a');
        }
        else if (pose === 'back1') {
            // Upper piston
            drawer.rect(x, hipY, upperW, upperH, c.armor);
            drawer.vLine(x + 1, hipY, upperH, c.bodyLight);
            // Joint
            drawer.hLine(x + 2, hipY + upperH, upperW + 2, c.joint);
            // Lower piston (angled back)
            drawer.rect(x + 2, hipY + upperH + 1, lowerW, lowerH, c.body);
            // Boot
            drawer.rect(x + 2, hipY + upperH + lowerH + 1, bootW, bootH, c.bodyDark);
            drawer.hLine(x + 2, hipY + upperH + lowerH + bootH, bootW, '#1a1a1a');
        }
        else if (pose === 'back2') {
            // Upper piston
            drawer.rect(x, hipY, upperW, upperH, c.armor);
            drawer.vLine(x + 1, hipY, upperH, c.bodyLight);
            // Joint
            drawer.hLine(x + 4, hipY + upperH, upperW + 2, c.joint);
            // Lower piston (extended back)
            drawer.rect(x + 4, hipY + upperH + 1, lowerW, lowerH, c.body);
            // Boot
            drawer.rect(x + 4, hipY + upperH + lowerH + 1, bootW, bootH, c.bodyDark);
            drawer.hLine(x + 4, hipY + upperH + lowerH + bootH, bootW, '#1a1a1a');
        }
        else if (pose === 'knee') {
            // Upper piston (shorter, compressed)
            drawer.rect(x, hipY + 1, upperW, upperH - 1, c.armor);
            drawer.vLine(x + 1, hipY + 1, upperH - 1, c.bodyLight);
            // Joint
            drawer.hLine(x - 1, hipY + upperH, upperW + 2, c.joint);
            // Lower piston (bent)
            drawer.rect(x - 1, hipY + upperH + 1, lowerW, lowerH - 1, c.body);
            // Boot
            drawer.rect(x - 2, hipY + upperH + lowerH, bootW, bootH, c.bodyDark);
            drawer.hLine(x - 2, hipY + upperH + lowerH + bootH - 1, bootW, '#1a1a1a');
        }
        else if (pose === 'tuck') {
            // Upper piston
            drawer.rect(x, hipY + 1, upperW, upperH - 1, c.armor);
            drawer.vLine(x + 1, hipY + 1, upperH - 1, c.bodyLight);
            // Joint
            drawer.hLine(x + 3, hipY + upperH, upperW + 2, c.joint);
            // Lower piston (tucked under)
            drawer.rect(x + 3, hipY + upperH, lowerW, lowerH - 2, c.body);
            // Boot (higher, tucked)
            drawer.rect(x + 4, hipY + upperH + lowerH - 2, bootW, bootH, c.bodyDark);
            drawer.hLine(x + 4, hipY + upperH + lowerH + bootH - 3, bootW, '#1a1a1a');
        }
    }

    // ========================================================================
    //  BODY - Heavy rectangular torso with shoulder pauldrons
    // ========================================================================
    drawBody(drawer, cx, cy, c, pose) {
        const w = 18;
        const h = 16;
        const x = cx - w / 2;
        const y = cy - h + 4;

        // -- Main torso (heavy rectangular shape) --
        // Wider at shoulders, tapering slightly at waist
        drawer.fillPath([
            { x: x - 1, y: y },
            { x: x + w + 1, y: y },
            { x: x + w + 2, y: y + 3 },
            { x: x + w, y: y + h },
            { x: x, y: y + h },
            { x: x - 2, y: y + 3 }
        ], c.body);

        // Shadow contours (vertical)
        drawer.vLine(x + 1, y + 1, h - 2, c.bodyDark);
        drawer.vLine(x + w - 1, y + 1, h - 2, c.bodyDark);

        // Armor plate texture - horizontal seam lines
        drawer.hLine(x + 2, y + 4, w - 4, c.armor);
        drawer.hLine(x + 2, y + 8, w - 4, c.armor);
        drawer.hLine(x + 2, y + 12, w - 4, c.armor);

        // Highlight on upper plates
        drawer.hLine(x + 3, y + 1, 4, c.bodyLight);
        drawer.hLine(x + w - 7, y + 1, 4, c.bodyLight);

        // Center sternum line
        drawer.vLine(cx, y + 2, 6, c.bodyDark);

        // -- Shoulder pauldrons (wider than torso, angular) --
        // Left pauldron
        drawer.fillPath([
            { x: x - 4, y: y - 1 },
            { x: x + 3, y: y - 1 },
            { x: x + 4, y: y + 3 },
            { x: x - 3, y: y + 3 },
            { x: x - 5, y: y + 1 }
        ], c.armor);
        drawer.hLine(x - 3, y, 6, c.bodyLight);
        drawer.pixel(x - 4, y + 2, c.bodyDark);

        // Right pauldron
        drawer.fillPath([
            { x: x + w - 3, y: y - 1 },
            { x: x + w + 4, y: y - 1 },
            { x: x + w + 5, y: y + 1 },
            { x: x + w + 3, y: y + 3 },
            { x: x + w - 4, y: y + 3 }
        ], c.armor);
        drawer.hLine(x + w - 2, y, 6, c.bodyLight);
        drawer.pixel(x + w + 4, y + 2, c.bodyDark);

        // -- Waist/hip armor band --
        drawer.hLine(x + 1, y + h - 2, w - 2, c.armor);
        drawer.hLine(x + 1, y + h - 1, w - 2, c.bodyDark);
    }

    // ========================================================================
    //  ENERGY CORE - Circular glowing core in center of chest
    // ========================================================================
    drawCore(drawer, cx, cy, c, pose, phase) {
        const bodyY = cy - 16 + 4; // Same calculation as body y
        const coreSize = phase === 2 ? 8 : 6;
        const coreCX = cx;
        const coreCY = bodyY + 7;

        const pulsePhase = pose.pulsePhase || 0;

        // Determine pulse color alternation
        const pulse = Math.sin(pulsePhase * Math.PI * 2);
        const primaryColor = pulse > 0 ? c.core : c.coreGlow;
        const secondaryColor = pulse > 0 ? c.coreGlow : c.core;

        if (phase === 2) {
            // Phase 2: larger core (8x8)
            // Outer glow ring
            drawer.ellipse(coreCX, coreCY, 5, 5, secondaryColor);
            // Inner core
            drawer.ellipse(coreCX, coreCY, 3, 3, primaryColor);
            // Bright center pixel
            drawer.pixel(coreCX, coreCY, '#ffffff');
            drawer.pixel(coreCX - 1, coreCY, secondaryColor);
            drawer.pixel(coreCX + 1, coreCY, secondaryColor);
            drawer.pixel(coreCX, coreCY - 1, secondaryColor);
            drawer.pixel(coreCX, coreCY + 1, secondaryColor);
        } else {
            // Phase 1: standard core (6x6)
            // Outer glow
            drawer.ellipse(coreCX, coreCY, 4, 4, secondaryColor);
            // Inner core
            drawer.ellipse(coreCX, coreCY, 2, 2, primaryColor);
            // Bright center
            drawer.pixel(coreCX, coreCY, '#ffffff');
        }
    }

    // ========================================================================
    //  LEFT ARM - Gatling Gun Assembly
    // ========================================================================
    drawGatlingArm(drawer, cx, cy, c, pose) {
        const sy = cy - 12;
        const lx = cx - 10;
        const barrelRot = pose.barrelRot || 0;
        const armAngle = pose.armAngle || 0;
        const angleOffset = Math.round(Math.sin(armAngle * Math.PI / 180) * 2);

        // -- Upper arm (mechanical strut) --
        drawer.fillPath([
            { x: lx + 2, y: sy },
            { x: lx + 6, y: sy },
            { x: lx + 5, y: sy + 6 },
            { x: lx + 1, y: sy + 6 }
        ], c.body);
        // Joint highlight
        drawer.pixel(lx + 3, sy + 1, c.bodyLight);
        // Joint shadow
        drawer.pixel(lx + 2, sy + 4, c.bodyDark);

        // Piston detail on upper arm
        drawer.vLine(lx + 4, sy + 1, 4, c.joint);

        // -- Elbow joint (mechanical ring) --
        drawer.hLine(lx, sy + 6, 7, c.joint);
        drawer.hLine(lx, sy + 7, 7, c.bodyDark);

        // -- Gatling gun assembly --
        const gunX = lx - 2 + angleOffset;
        const gunY = sy + 8;

        // Gun housing (boxy, wider than arm)
        drawer.fillPath([
            { x: gunX, y: gunY },
            { x: gunX + 8, y: gunY },
            { x: gunX + 8, y: gunY + 4 },
            { x: gunX, y: gunY + 4 }
        ], c.armor);
        // Housing shadow
        drawer.hLine(gunX + 1, gunY + 1, 6, c.bodyDark);
        // Housing highlight
        drawer.pixel(gunX + 1, gunY, c.bodyLight);

        // -- Barrel cluster (3 barrel tips in triangle pattern) --
        const barrelBaseX = gunX - 4;
        const barrelBaseY = gunY + 1;

        // Barrel rotation visual - shift barrel positions based on barrelRot
        const rotPhase = barrelRot % 3;
        const barrelPositions = [
            { dx: 0, dy: -1 },   // Top barrel
            { dx: 0, dy: 2 },    // Bottom barrel
            { dx: -1, dy: 1 }    // Left barrel (closest to viewer)
        ];

        // Draw 3 barrel tubes extending left (toward facing direction)
        for (let i = 0; i < 3; i++) {
            const bp = barrelPositions[(i + Math.floor(rotPhase)) % 3];
            const bx = barrelBaseX + bp.dx;
            const by = barrelBaseY + bp.dy;

            // Each barrel is a 4px long, 1px wide tube
            drawer.hLine(bx - 3, by, 4, c.barrel);
            // Barrel highlight on alternating barrels based on rotation
            if (i === Math.floor(rotPhase) % 3) {
                drawer.pixel(bx - 3, by, c.bodyLight);
            }
            // Dark muzzle tip
            drawer.pixel(bx - 4, by, c.bodyDark);
        }

        // Barrel shroud (connecting ring around barrels)
        drawer.vLine(barrelBaseX, barrelBaseY - 1, 4, c.barrel);
        drawer.pixel(barrelBaseX, barrelBaseY - 1, c.bodyLight);
    }

    // ========================================================================
    //  RIGHT ARM - Rocket Launcher Tube
    // ========================================================================
    drawLauncherArm(drawer, cx, cy, c, pose) {
        const sy = cy - 12;
        const rx = cx + 10;
        const armAngle = pose.armAngle || 0;
        const angleOffset = Math.round(Math.sin(armAngle * Math.PI / 180) * 2);

        // -- Upper arm (mechanical strut) --
        drawer.fillPath([
            { x: rx - 4, y: sy },
            { x: rx, y: sy },
            { x: rx - 1, y: sy + 6 },
            { x: rx - 5, y: sy + 6 }
        ], c.body);
        // Joint highlight
        drawer.pixel(rx - 2, sy + 1, c.bodyLight);
        // Joint shadow
        drawer.pixel(rx - 3, sy + 4, c.bodyDark);

        // Piston detail
        drawer.vLine(rx - 4, sy + 1, 4, c.joint);

        // -- Elbow joint --
        drawer.hLine(rx - 5, sy + 6, 7, c.joint);
        drawer.hLine(rx - 5, sy + 7, 7, c.bodyDark);

        // -- Launcher tube (cylindrical, angled forward-down ~30 degrees) --
        const tubeX = rx - 3 + angleOffset;
        const tubeY = sy + 8;

        // Main tube body (5px wide x 10px long, angled)
        drawer.fillPath([
            { x: tubeX - 1, y: tubeY },
            { x: tubeX + 4, y: tubeY },
            { x: tubeX + 2, y: tubeY + 10 },
            { x: tubeX - 3, y: tubeY + 10 }
        ], c.launcher);

        // Tube shadow (left side)
        drawer.vLine(tubeX - 2, tubeY + 2, 7, c.bodyDark);
        // Tube highlight (right side)
        drawer.vLine(tubeX + 3, tubeY + 1, 7, c.bodyLight);

        // Tube opening (dark circle at top-left / muzzle end)
        drawer.rect(tubeX - 2, tubeY + 9, 5, 2, c.bodyDark);
        drawer.hLine(tubeX - 1, tubeY + 10, 3, '#1a1a1a');

        // Mounting bracket
        drawer.hLine(tubeX - 1, tubeY + 3, 4, c.armor);
        drawer.hLine(tubeX - 1, tubeY + 6, 4, c.armor);

        // -- Missile tip visible inside tube --
        drawer.pixel(tubeX, tubeY + 9, '#c0392b');
        drawer.pixel(tubeX + 1, tubeY + 9, '#e74c3c');
    }

    // ========================================================================
    //  ARMS - Combined idle drawing (gatling left, launcher right)
    // ========================================================================
    drawArms(drawer, cx, cy, c, pose) {
        this.drawGatlingArm(drawer, cx, cy, c, pose);
        this.drawLauncherArm(drawer, cx, cy, c, pose);
    }

    // ========================================================================
    //  ATTACK ARMS - Animated attack poses
    // ========================================================================
    drawAttackArms(drawer, cx, cy, c, pose) {
        const phase = pose.attackPhase || 0;
        const attackType = pose.attackType || 'gatling_sweep';
        const sy = cy - 12;

        if (attackType === 'gatling_sweep') {
            // Gatling arm sweeps left to right while firing
            this.drawGatlingAttack(drawer, cx, cy, c, pose, phase);
            // Launcher arm stays in idle
            this.drawLauncherArm(drawer, cx, cy, c, pose);
        } else if (attackType === 'ring_burst') {
            // Both arms raise for omnidirectional burst
            this.drawBurstPose(drawer, cx, cy, c, pose, phase);
        } else if (attackType === 'rocket_salvo') {
            // Launcher arm aims and fires
            this.drawGatlingArm(drawer, cx, cy, c, pose);
            this.drawLauncherAttack(drawer, cx, cy, c, pose, phase);
        } else {
            // Default: draw normal arms
            this.drawArms(drawer, cx, cy, c, pose);
        }
    }

    drawGatlingAttack(drawer, cx, cy, c, pose, phase) {
        const sy = cy - 12;
        const lx = cx - 10;

        // Sweep: arm moves from upper-right to lower-left
        let armOffsetX, armOffsetY;
        if (phase < 0.3) {
            // Wind up: arm raises
            const t = phase / 0.3;
            armOffsetX = t * 3;
            armOffsetY = -t * 4;
        } else if (phase < 0.8) {
            // Sweep: arm sweeps down-left
            const t = (phase - 0.3) / 0.5;
            armOffsetX = 3 - t * 8;
            armOffsetY = -4 + t * 6;
        } else {
            // Recovery
            const t = (phase - 0.8) / 0.2;
            armOffsetX = -5 + t * 5;
            armOffsetY = 2 - t * 2;
        }

        armOffsetX = Math.round(armOffsetX);
        armOffsetY = Math.round(armOffsetY);

        // Upper arm
        drawer.fillPath([
            { x: lx + 2, y: sy },
            { x: lx + 6, y: sy },
            { x: lx + 5 + armOffsetX, y: sy + 6 + armOffsetY },
            { x: lx + 1 + armOffsetX, y: sy + 6 + armOffsetY }
        ], c.body);
        drawer.pixel(lx + 3, sy + 1, c.bodyLight);

        // Elbow joint
        drawer.hLine(lx + armOffsetX, sy + 6 + armOffsetY, 7, c.joint);

        // Gun housing
        const gunX = lx - 2 + armOffsetX;
        const gunY = sy + 8 + armOffsetY;
        drawer.rect(gunX, gunY, 8, 4, c.armor);
        drawer.hLine(gunX + 1, gunY + 1, 6, c.bodyDark);

        // Barrels
        const barrelBaseX = gunX - 4;
        const barrelBaseY = gunY + 1;
        for (let i = 0; i < 3; i++) {
            const by = barrelBaseY + (i - 1);
            drawer.hLine(barrelBaseX - 3, by, 4, c.barrel);
            drawer.pixel(barrelBaseX - 4, by, c.bodyDark);
        }
        drawer.vLine(barrelBaseX, barrelBaseY - 1, 3, c.barrel);

        // Muzzle flash during sweep phase
        if (phase >= 0.3 && phase < 0.8) {
            const flashX = barrelBaseX - 6;
            const flashY = barrelBaseY;
            drawer.pixel(flashX, flashY, '#ffff00');
            drawer.pixel(flashX - 1, flashY, '#ffaa00');
            drawer.pixel(flashX, flashY - 1, '#ffcc00');
            drawer.pixel(flashX, flashY + 1, '#ffcc00');
        }
    }

    drawLauncherAttack(drawer, cx, cy, c, pose, phase) {
        const sy = cy - 12;
        const rx = cx + 10;

        let armOffsetX, armOffsetY;
        if (phase < 0.2) {
            // Aim: arm tilts forward
            const t = phase / 0.2;
            armOffsetX = -t * 2;
            armOffsetY = t * 2;
        } else if (phase < 0.5) {
            // Fire: recoil
            const t = (phase - 0.2) / 0.3;
            armOffsetX = -2 + t * 3;
            armOffsetY = 2 - t * 4;
        } else {
            // Return
            const t = (phase - 0.5) / 0.5;
            armOffsetX = 1 - t;
            armOffsetY = -2 + t * 2;
        }

        armOffsetX = Math.round(armOffsetX);
        armOffsetY = Math.round(armOffsetY);

        // Upper arm
        drawer.fillPath([
            { x: rx - 4, y: sy },
            { x: rx, y: sy },
            { x: rx - 1 + armOffsetX, y: sy + 6 + armOffsetY },
            { x: rx - 5 + armOffsetX, y: sy + 6 + armOffsetY }
        ], c.body);
        drawer.pixel(rx - 2, sy + 1, c.bodyLight);

        // Elbow joint
        drawer.hLine(rx - 5 + armOffsetX, sy + 6 + armOffsetY, 7, c.joint);

        // Launcher tube
        const tubeX = rx - 3 + armOffsetX;
        const tubeY = sy + 8 + armOffsetY;
        drawer.fillPath([
            { x: tubeX - 1, y: tubeY },
            { x: tubeX + 4, y: tubeY },
            { x: tubeX + 2, y: tubeY + 10 },
            { x: tubeX - 3, y: tubeY + 10 }
        ], c.launcher);
        drawer.vLine(tubeX - 2, tubeY + 2, 7, c.bodyDark);
        drawer.rect(tubeX - 2, tubeY + 9, 5, 2, c.bodyDark);

        // Smoke trail on fire phase
        if (phase >= 0.2 && phase < 0.5) {
            drawer.pixel(tubeX, tubeY + 11, '#aaaaaa');
            drawer.pixel(tubeX - 1, tubeY + 12, '#888888');
            drawer.pixel(tubeX + 1, tubeY + 12, '#999999');
        }
    }

    drawBurstPose(drawer, cx, cy, c, pose, phase) {
        const sy = cy - 12;

        let raiseAmount;
        if (phase < 0.3) {
            raiseAmount = Math.round((phase / 0.3) * 5);
        } else if (phase < 0.6) {
            raiseAmount = 5;
        } else {
            raiseAmount = Math.round((1 - (phase - 0.6) / 0.4) * 5);
        }

        // Left arm (gatling) raised
        const lx = cx - 10;
        drawer.fillPath([
            { x: lx + 2, y: sy - raiseAmount },
            { x: lx + 6, y: sy - raiseAmount },
            { x: lx + 5, y: sy + 6 - raiseAmount },
            { x: lx + 1, y: sy + 6 - raiseAmount }
        ], c.body);
        drawer.hLine(lx, sy + 6 - raiseAmount, 7, c.joint);
        // Compact gatling at raised position
        const gunY = sy + 8 - raiseAmount;
        drawer.rect(lx - 2, gunY, 8, 4, c.armor);
        for (let i = 0; i < 3; i++) {
            drawer.hLine(lx - 6, gunY + 1 + (i - 1), 4, c.barrel);
        }

        // Right arm (launcher) raised
        const rx = cx + 10;
        drawer.fillPath([
            { x: rx - 4, y: sy - raiseAmount },
            { x: rx, y: sy - raiseAmount },
            { x: rx - 1, y: sy + 6 - raiseAmount },
            { x: rx - 5, y: sy + 6 - raiseAmount }
        ], c.body);
        drawer.hLine(rx - 5, sy + 6 - raiseAmount, 7, c.joint);
        // Launcher tube at raised position
        const tubeY = sy + 8 - raiseAmount;
        drawer.fillPath([
            { x: rx - 4, y: tubeY },
            { x: rx + 1, y: tubeY },
            { x: rx - 1, y: tubeY + 8 },
            { x: rx - 6, y: tubeY + 8 }
        ], c.launcher);

        // Energy burst glow during active phase
        if (phase >= 0.3 && phase < 0.6) {
            const glowColor = c.coreGlow;
            drawer.pixel(cx - 6, sy - raiseAmount + 3, glowColor);
            drawer.pixel(cx + 6, sy - raiseAmount + 3, glowColor);
            drawer.pixel(cx, sy - raiseAmount - 1, glowColor);
        }
    }

    // ========================================================================
    //  HEAD - Rectangular mechanical head with optical sensor
    // ========================================================================
    drawHead(drawer, cx, cy, c, phase) {
        const w = 10;
        const h = 8;
        const x = cx - w / 2;
        const y = cy - h + 2;

        // -- Main head shape (rectangular, mechanical) --
        drawer.rect(x, y, w, h, c.armor);

        // Top edge highlight
        drawer.hLine(x + 1, y, w - 2, c.bodyLight);
        // Bottom shadow
        drawer.hLine(x + 1, y + h - 1, w - 2, c.bodyDark);
        // Side shadows
        drawer.vLine(x, y + 1, h - 2, c.bodyDark);
        drawer.vLine(x + w - 1, y + 1, h - 2, c.bodyDark);

        // -- Optical sensor bar (wide glowing stripe) --
        const eyeY = y + 3;
        drawer.rect(x + 2, eyeY, 6, 2, c.eye);
        // Bright center of sensor
        drawer.pixel(x + 4, eyeY, '#ffffff');
        drawer.pixel(x + 5, eyeY, '#ffffff');
        // Dimmer edges
        drawer.pixel(x + 2, eyeY + 1, c.bodyDark);
        drawer.pixel(x + 7, eyeY + 1, c.bodyDark);

        // -- Head plating details --
        // Forehead seam
        drawer.hLine(x + 2, y + 1, w - 4, c.body);
        // Chin plate
        drawer.hLine(x + 3, y + h - 2, w - 6, c.body);

        // Cheek vents (small horizontal lines)
        drawer.pixel(x + 1, y + 4, c.joint);
        drawer.pixel(x + 1, y + 5, c.joint);
        drawer.pixel(x + w - 2, y + 4, c.joint);
        drawer.pixel(x + w - 2, y + 5, c.joint);

        // -- Antennae (two small lines on top) --
        // Left antenna
        drawer.vLine(x + 3, y - 2, 2, c.barrel);
        drawer.pixel(x + 3, y - 2, c.eye);
        // Right antenna
        drawer.vLine(x + w - 4, y - 2, 2, c.barrel);
        drawer.pixel(x + w - 4, y - 2, c.eye);

        // Phase 2: cracked faceplate
        if (phase === 2) {
            drawer.pixel(x + 2, y + 2, c.crack);
            drawer.pixel(x + 3, y + 3, c.crack);
            drawer.pixel(x + 4, y + 4, c.crack);
            // Sparking antenna
            drawer.pixel(x + 3, y - 3, c.spark);
            drawer.pixel(x + w - 4, y - 3, c.spark);
        }
    }

    // ========================================================================
    //  PHASE 2 OVERLOAD EFFECTS - Cracks, sparks, heat distortion
    // ========================================================================
    drawOverloadEffects(drawer, cx, cy, c, pose) {
        const bodyY = cy - 16 + 4;
        const pulsePhase = pose.pulsePhase || 0;
        const w = 18;
        const x = cx - w / 2;

        // -- Jagged crack lines across armor (2-3 diagonal lines) --
        // Crack 1: upper-left to center-right diagonal
        drawer.pixel(x + 2, bodyY + 2, c.crack);
        drawer.pixel(x + 3, bodyY + 3, c.crack);
        drawer.pixel(x + 4, bodyY + 3, c.bodyDark);
        drawer.pixel(x + 5, bodyY + 4, c.crack);
        drawer.pixel(x + 6, bodyY + 5, c.crack);
        drawer.pixel(x + 7, bodyY + 5, c.bodyDark);

        // Crack 2: upper-right descending
        drawer.pixel(x + w - 3, bodyY + 1, c.crack);
        drawer.pixel(x + w - 4, bodyY + 2, c.bodyDark);
        drawer.pixel(x + w - 4, bodyY + 3, c.crack);
        drawer.pixel(x + w - 5, bodyY + 4, c.crack);
        drawer.pixel(x + w - 6, bodyY + 5, c.bodyDark);

        // Crack 3: across waist area
        drawer.pixel(x + 4, bodyY + 10, c.crack);
        drawer.pixel(x + 5, bodyY + 11, c.crack);
        drawer.pixel(x + 6, bodyY + 11, c.bodyDark);
        drawer.pixel(x + 7, bodyY + 12, c.crack);
        drawer.pixel(x + 8, bodyY + 12, c.crack);

        // -- Random spark pixels near joints --
        // Use pulsePhase to vary spark positions
        const sparkOffset1 = Math.floor(pulsePhase * 5) % 3;
        const sparkOffset2 = Math.floor(pulsePhase * 7) % 4;

        // Left shoulder spark
        drawer.pixel(x - 3 + sparkOffset1, bodyY + sparkOffset2, c.spark);
        // Right shoulder spark
        drawer.pixel(x + w + 2 - sparkOffset1, bodyY + 1 + sparkOffset2, c.spark);
        // Left knee spark
        drawer.pixel(cx - 8 + sparkOffset2, cy + 4 + sparkOffset1, c.spark);
        // Right elbow spark
        drawer.pixel(cx + 9 - sparkOffset1, bodyY + 6 + sparkOffset2, c.spark);

        // Additional bright spark flicker
        if (pulsePhase > 0.5) {
            drawer.pixel(x + 3 + sparkOffset1, bodyY + 7, '#ffffff');
            drawer.pixel(x + w - 2 - sparkOffset2, bodyY + 9, '#ffffff');
        }

        // -- Heat distortion lines near core --
        const coreY = bodyY + 7;
        const distPhase = Math.floor(pulsePhase * 4) % 2;

        // Wavy heat lines above and below core
        drawer.pixel(cx - 4, coreY - 3 + distPhase, c.coreGlow);
        drawer.pixel(cx + 4, coreY - 2 - distPhase, c.coreGlow);
        drawer.pixel(cx - 3, coreY + 5 + distPhase, c.coreGlow);
        drawer.pixel(cx + 3, coreY + 4 - distPhase, c.coreGlow);

        // Side heat shimmer
        drawer.pixel(cx - 6, coreY + distPhase, c.core);
        drawer.pixel(cx + 6, coreY - distPhase, c.core);
    }
}
