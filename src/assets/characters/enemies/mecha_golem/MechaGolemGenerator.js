import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for the MechaGolem BOSS Enemy
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
                coreRing: '#2980b9',    // Core housing ring
                barrel: '#7f8c8d',      // Gatling barrel metal
                barrelDark: '#5a6a6a',  // Barrel shadow
                launcher: '#95a5a6',    // Launcher tube
                launcherDark: '#7a8a8a',// Launcher shadow
                armor: '#34495e',       // Armor plating
                armorLight: '#4a6a7e',  // Armor highlight
                joint: '#636e72',       // Mechanical joints
                jointGlow: '#8a9a9a',   // Joint highlight
                eye: '#3498db',         // Blue optical eye
                eyeBright: '#85c1e9',   // Eye highlight
                rivet: '#556a7a',       // Rivet dots
                crack: null,
                spark: null
            },
            // Phase 2: Overload - heated reds/oranges, damaged
            2: {
                body: '#6a4a3a',        // Overheated metal
                bodyDark: '#3a2a1a',    // Dark
                bodyLight: '#8a6a5a',   // Light
                core: '#e74c3c',        // Red core
                coreGlow: '#ff6b6b',    // Intense glow
                coreRing: '#c0392b',    // Heated ring
                barrel: '#c0392b',      // Heated barrels
                barrelDark: '#8a2a1a',  // Barrel shadow
                launcher: '#e67e22',    // Orange heat
                launcherDark: '#b06020',// Launcher shadow
                armor: '#5a3a2a',       // Damaged armor
                armorLight: '#7a5a4a',  // Armor highlight
                joint: '#d35400',       // Glowing joints
                jointGlow: '#f39c12',   // Joint bright
                eye: '#e74c3c',         // Red eye
                eyeBright: '#ff9999',   // Eye highlight
                rivet: '#7a5a4a',       // Heated rivets
                crack: '#2c3e50',       // Crack lines
                spark: '#f39c12'        // Sparks
            }
        };
    }

    getColors(phase) {
        return this.phases[phase || 1];
    }

    /**
     * Generate a single frame
     * @param {Object} pose - {
     *   headOffset: { x, y },
     *   bodySquash: number (-2 to 2),
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

        const bodyY = groundY - 22 + (pose.bodySquash || 0);
        const headX = cx + (pose.headOffset?.x || 0);
        const headY = groundY - 34 + (pose.headOffset?.y || 0);

        // 0. Ground shadow
        this.drawShadow(drawer, cx, groundY);

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
    //  GROUND SHADOW
    // ========================================================================
    drawShadow(drawer, cx, groundY) {
        // Dark elliptical shadow under feet
        drawer.ellipse(cx, groundY + 1, 14, 4, 'rgba(0,0,0,0.25)');
        drawer.ellipse(cx, groundY + 1, 10, 3, 'rgba(0,0,0,0.15)');
    }

    // ========================================================================
    //  LEGS - Heavy mechanical piston legs, 7-pose system
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
        this.drawOneLeg(drawer, cx - 8, groundY, leftPose, c, false);
        // Right leg (front) - offset right from center
        this.drawOneLeg(drawer, cx + 2, groundY, rightPose, c, true);
    }

    drawOneLeg(drawer, x, y, pose, c, isFront) {
        const upperW = 6;
        const upperH = 7;
        const lowerW = 5;
        const lowerH = 7;
        const bootW = 8;
        const bootH = 4;
        const hipY = y - upperH - lowerH - bootH;

        // Map legacy poses
        if (pose === 'drag') pose = 'back2';
        if (pose === 'step') pose = 'fwd1';

        const offsets = this._getLegOffsets(pose);

        // Upper piston (thigh)
        drawer.rect(x + offsets.upperX, hipY, upperW, upperH, c.armor);
        // Piston rod highlight
        drawer.vLine(x + offsets.upperX + 1, hipY + 1, upperH - 2, c.bodyLight);
        // Piston rod shadow
        drawer.vLine(x + offsets.upperX + upperW - 1, hipY + 1, upperH - 2, c.bodyDark);
        // Hydraulic detail line
        drawer.vLine(x + offsets.upperX + 3, hipY + 1, upperH - 2, c.joint);

        // Knee joint (mechanical ring)
        const kneeY = hipY + upperH;
        drawer.hLine(x + offsets.kneeX - 1, kneeY, upperW + 2, c.joint);
        drawer.hLine(x + offsets.kneeX - 1, kneeY + 1, upperW + 2, c.bodyDark);
        // Knee rivet
        drawer.pixel(x + offsets.kneeX + 2, kneeY, c.jointGlow);

        // Lower piston (shin)
        drawer.rect(x + offsets.lowerX, kneeY + 2, lowerW, lowerH - 2, c.body);
        drawer.vLine(x + offsets.lowerX + 1, kneeY + 2, lowerH - 3, c.bodyLight);
        // Piston cylinder detail
        drawer.vLine(x + offsets.lowerX + 3, kneeY + 3, lowerH - 4, c.armor);

        // Heavy boot (armored foot)
        const bootY = kneeY + lowerH;
        drawer.rect(x + offsets.bootX - 1, bootY, bootW, bootH, c.bodyDark);
        // Boot top edge
        drawer.hLine(x + offsets.bootX - 1, bootY, bootW, c.armor);
        // Boot sole
        drawer.hLine(x + offsets.bootX - 1, bootY + bootH - 1, bootW, '#1a1a1a');
        // Boot tread marks
        drawer.pixel(x + offsets.bootX + 1, bootY + bootH - 1, '#0e0e0e');
        drawer.pixel(x + offsets.bootX + 4, bootY + bootH - 1, '#0e0e0e');
    }

    _getLegOffsets(pose) {
        switch (pose) {
            case 'fwd1':
                return { upperX: 0, kneeX: -2, lowerX: -2, bootX: -3 };
            case 'fwd2':
                return { upperX: 0, kneeX: -4, lowerX: -4, bootX: -5 };
            case 'back1':
                return { upperX: 0, kneeX: 2, lowerX: 2, bootX: 2 };
            case 'back2':
                return { upperX: 0, kneeX: 4, lowerX: 4, bootX: 4 };
            case 'knee':
                return { upperX: 0, kneeX: -1, lowerX: -1, bootX: -2 };
            case 'tuck':
                return { upperX: 0, kneeX: 3, lowerX: 3, bootX: 4 };
            default: // idle/stand
                return { upperX: 0, kneeX: 0, lowerX: 0, bootX: 0 };
        }
    }

    // ========================================================================
    //  BODY - Heavy rectangular torso with layered armor plates
    // ========================================================================
    drawBody(drawer, cx, cy, c, pose) {
        const w = 24;
        const h = 18;
        const x = cx - w / 2;
        const y = cy - h + 4;

        // -- Main torso (heavy rectangular, wider at shoulders) --
        drawer.fillPath([
            { x: x - 2, y: y },
            { x: x + w + 2, y: y },
            { x: x + w + 3, y: y + 4 },
            { x: x + w + 1, y: y + h },
            { x: x - 1, y: y + h },
            { x: x - 3, y: y + 4 }
        ], c.body);

        // Shadow contours (vertical edges)
        drawer.vLine(x, y + 1, h - 2, c.bodyDark);
        drawer.vLine(x + 1, y + 1, h - 2, c.bodyDark);
        drawer.vLine(x + w - 1, y + 1, h - 2, c.bodyDark);
        drawer.vLine(x + w - 2, y + 1, h - 2, c.bodyDark);

        // Armor plate horizontal seams
        drawer.hLine(x + 2, y + 4, w - 4, c.armor);
        drawer.hLine(x + 2, y + 9, w - 4, c.armor);
        drawer.hLine(x + 2, y + 14, w - 4, c.armor);

        // Highlight on upper plates
        drawer.hLine(x + 3, y + 1, 5, c.bodyLight);
        drawer.hLine(x + w - 8, y + 1, 5, c.bodyLight);

        // Center sternum line
        drawer.vLine(cx, y + 2, 7, c.bodyDark);
        drawer.vLine(cx + 1, y + 2, 7, c.bodyDark);

        // Core housing frame (rectangular frame around core area)
        const coreFrameX = cx - 5;
        const coreFrameY = y + 5;
        drawer.rect(coreFrameX, coreFrameY, 10, 8, c.armor);
        drawer.rect(coreFrameX + 1, coreFrameY + 1, 8, 6, c.bodyDark);

        // Rivet dots on armor
        drawer.pixel(x + 3, y + 2, c.rivet);
        drawer.pixel(x + w - 4, y + 2, c.rivet);
        drawer.pixel(x + 3, y + 6, c.rivet);
        drawer.pixel(x + w - 4, y + 6, c.rivet);
        drawer.pixel(x + 3, y + 11, c.rivet);
        drawer.pixel(x + w - 4, y + 11, c.rivet);

        // -- Massive shoulder pauldrons --
        // Left pauldron (angular, extends far)
        drawer.fillPath([
            { x: x - 7, y: y - 2 },
            { x: x + 4, y: y - 2 },
            { x: x + 5, y: y + 5 },
            { x: x - 4, y: y + 5 },
            { x: x - 8, y: y + 1 }
        ], c.armor);
        drawer.hLine(x - 6, y - 1, 9, c.armorLight);
        drawer.hLine(x - 5, y + 1, 8, c.bodyDark);
        drawer.pixel(x - 6, y + 3, c.bodyDark);
        // Pauldron edge highlight
        drawer.pixel(x - 7, y - 1, c.bodyLight);
        // Pauldron rivet
        drawer.pixel(x - 3, y + 1, c.rivet);

        // Right pauldron
        drawer.fillPath([
            { x: x + w - 4, y: y - 2 },
            { x: x + w + 7, y: y - 2 },
            { x: x + w + 8, y: y + 1 },
            { x: x + w + 4, y: y + 5 },
            { x: x + w - 5, y: y + 5 }
        ], c.armor);
        drawer.hLine(x + w - 3, y - 1, 9, c.armorLight);
        drawer.hLine(x + w - 3, y + 1, 8, c.bodyDark);
        drawer.pixel(x + w + 6, y + 3, c.bodyDark);
        // Pauldron edge highlight
        drawer.pixel(x + w + 7, y - 1, c.bodyLight);
        // Pauldron rivet
        drawer.pixel(x + w + 3, y + 1, c.rivet);

        // -- Waist/hip armor band --
        drawer.hLine(x + 1, y + h - 3, w - 2, c.armor);
        drawer.hLine(x + 1, y + h - 2, w - 2, c.bodyDark);
        drawer.hLine(x + 1, y + h - 1, w - 2, '#1a1a1a');
        // Waist belt rivets
        drawer.pixel(x + 5, y + h - 3, c.rivet);
        drawer.pixel(x + w - 6, y + h - 3, c.rivet);
    }

    // ========================================================================
    //  ENERGY CORE - Glowing reactor in center chest
    // ========================================================================
    drawCore(drawer, cx, cy, c, pose, phase) {
        const bodyY = cy - 18 + 4;
        const coreCX = cx;
        const coreCY = bodyY + 8;
        const pulsePhase = pose.pulsePhase || 0;
        const pulse = Math.sin(pulsePhase * Math.PI * 2);
        const primary = pulse > 0 ? c.core : c.coreGlow;
        const secondary = pulse > 0 ? c.coreGlow : c.core;

        if (phase === 2) {
            // Phase 2: larger, more intense core
            // Outer glow halo
            drawer.ellipse(coreCX, coreCY, 5, 5, secondary);
            // Housing ring
            drawer.ellipse(coreCX, coreCY, 4, 4, c.coreRing);
            // Inner bright core
            drawer.ellipse(coreCX, coreCY, 3, 3, primary);
            // Bright center cross
            drawer.pixel(coreCX, coreCY, '#ffffff');
            drawer.pixel(coreCX - 1, coreCY, '#ffffff');
            drawer.pixel(coreCX + 1, coreCY, '#ffffff');
            drawer.pixel(coreCX, coreCY - 1, '#ffffff');
            drawer.pixel(coreCX, coreCY + 1, '#ffffff');
            // Corner glow
            drawer.pixel(coreCX - 2, coreCY - 2, secondary);
            drawer.pixel(coreCX + 2, coreCY - 2, secondary);
            drawer.pixel(coreCX - 2, coreCY + 2, secondary);
            drawer.pixel(coreCX + 2, coreCY + 2, secondary);
        } else {
            // Phase 1: standard core
            // Outer glow
            drawer.ellipse(coreCX, coreCY, 4, 4, secondary);
            // Housing ring
            drawer.ellipse(coreCX, coreCY, 3, 3, c.coreRing);
            // Inner core
            drawer.ellipse(coreCX, coreCY, 2, 2, primary);
            // Bright center
            drawer.pixel(coreCX, coreCY, '#ffffff');
            drawer.pixel(coreCX - 1, coreCY, secondary);
            drawer.pixel(coreCX + 1, coreCY, secondary);
        }
    }

    // ========================================================================
    //  LEFT ARM - Gatling Gun Assembly (multi-barrel rotating cannon)
    // ========================================================================
    drawGatlingArm(drawer, cx, cy, c, pose) {
        const sy = cy - 14;
        const lx = cx - 12;
        const barrelRot = pose.barrelRot || 0;
        const armAngle = pose.armAngle || 0;
        const angleOffset = Math.round(Math.sin(armAngle * Math.PI / 180) * 2);

        // -- Upper arm (thick mechanical strut) --
        drawer.fillPath([
            { x: lx + 2, y: sy },
            { x: lx + 8, y: sy },
            { x: lx + 7, y: sy + 7 },
            { x: lx + 1, y: sy + 7 }
        ], c.body);
        // Highlight
        drawer.vLine(lx + 3, sy + 1, 5, c.bodyLight);
        // Shadow
        drawer.vLine(lx + 7, sy + 1, 5, c.bodyDark);
        // Piston detail
        drawer.vLine(lx + 5, sy + 1, 5, c.joint);
        drawer.pixel(lx + 5, sy + 2, c.jointGlow);

        // -- Elbow joint (wide mechanical ring) --
        drawer.hLine(lx, sy + 7, 9, c.joint);
        drawer.hLine(lx, sy + 8, 9, c.bodyDark);
        // Joint rivets
        drawer.pixel(lx + 1, sy + 7, c.jointGlow);
        drawer.pixel(lx + 7, sy + 7, c.jointGlow);

        // -- Gatling gun housing --
        const gunX = lx - 2 + angleOffset;
        const gunY = sy + 9;

        // Housing body (wider, more detailed)
        drawer.rect(gunX, gunY, 10, 6, c.armor);
        // Housing top highlight
        drawer.hLine(gunX + 1, gunY, 8, c.armorLight);
        // Housing bottom shadow
        drawer.hLine(gunX + 1, gunY + 5, 8, c.bodyDark);
        // Housing side shadow
        drawer.vLine(gunX + 9, gunY + 1, 4, c.bodyDark);
        // Housing detail lines
        drawer.hLine(gunX + 2, gunY + 2, 6, c.bodyDark);
        // Ammo feed detail (belt from housing)
        drawer.pixel(gunX + 8, gunY + 3, c.joint);
        drawer.pixel(gunX + 9, gunY + 4, c.joint);

        // -- Barrel cluster (3 barrel tubes, rotating) --
        const barrelBaseX = gunX - 2;
        const barrelBaseY = gunY + 2;
        const rotPhase = Math.floor(barrelRot * 3) % 3;

        // Barrel shroud (cylindrical ring connecting barrels)
        drawer.vLine(barrelBaseX, barrelBaseY - 1, 5, c.barrel);
        drawer.vLine(barrelBaseX + 1, barrelBaseY - 1, 5, c.barrelDark);

        // 3 barrels extending left
        const barrelPositions = [
            { dy: -1 },  // Top
            { dy: 1 },   // Middle
            { dy: 3 },   // Bottom
        ];
        for (let i = 0; i < 3; i++) {
            const bp = barrelPositions[(i + rotPhase) % 3];
            const by = barrelBaseY + bp.dy;
            // Each barrel: 6px long tube
            drawer.hLine(barrelBaseX - 5, by, 6, c.barrel);
            // Highlight on active barrel
            if (i === rotPhase % 3) {
                drawer.hLine(barrelBaseX - 5, by, 3, c.bodyLight);
            }
            // Dark muzzle tip
            drawer.pixel(barrelBaseX - 6, by, c.barrelDark);
        }

        // Second shroud ring near muzzle
        drawer.vLine(barrelBaseX - 3, barrelBaseY - 1, 5, c.barrel);
    }

    // ========================================================================
    //  RIGHT ARM - Quad-Tube Missile Launcher Pod
    // ========================================================================
    drawLauncherArm(drawer, cx, cy, c, pose) {
        const sy = cy - 14;
        const rx = cx + 12;
        const armAngle = pose.armAngle || 0;
        const angleOffset = Math.round(Math.sin(armAngle * Math.PI / 180) * 2);

        // -- Upper arm (thick mechanical strut) --
        drawer.fillPath([
            { x: rx - 6, y: sy },
            { x: rx, y: sy },
            { x: rx - 1, y: sy + 7 },
            { x: rx - 7, y: sy + 7 }
        ], c.body);
        // Highlight
        drawer.vLine(rx - 5, sy + 1, 5, c.bodyLight);
        // Shadow
        drawer.vLine(rx - 1, sy + 1, 5, c.bodyDark);
        // Piston detail
        drawer.vLine(rx - 3, sy + 1, 5, c.joint);
        drawer.pixel(rx - 3, sy + 2, c.jointGlow);

        // -- Elbow joint --
        drawer.hLine(rx - 7, sy + 7, 9, c.joint);
        drawer.hLine(rx - 7, sy + 8, 9, c.bodyDark);
        drawer.pixel(rx - 6, sy + 7, c.jointGlow);
        drawer.pixel(rx, sy + 7, c.jointGlow);

        // -- Quad-tube launcher pod --
        const tubeX = rx - 5 + angleOffset;
        const tubeY = sy + 9;

        // Pod housing (boxy, angled slightly)
        drawer.fillPath([
            { x: tubeX - 1, y: tubeY },
            { x: tubeX + 7, y: tubeY },
            { x: tubeX + 5, y: tubeY + 12 },
            { x: tubeX - 3, y: tubeY + 12 }
        ], c.launcher);

        // Pod shadow (left side)
        drawer.vLine(tubeX - 2, tubeY + 2, 9, c.launcherDark);
        // Pod highlight (right side)
        drawer.vLine(tubeX + 6, tubeY + 1, 9, c.bodyLight);

        // 4 tube openings (2x2 grid at bottom/muzzle)
        const muzzleY = tubeY + 10;
        // Top-left tube
        drawer.rect(tubeX - 1, muzzleY, 3, 2, '#1a1a1a');
        drawer.pixel(tubeX, muzzleY, c.barrelDark);
        // Top-right tube
        drawer.rect(tubeX + 2, muzzleY, 3, 2, '#1a1a1a');
        drawer.pixel(tubeX + 3, muzzleY, c.barrelDark);

        // Mounting brackets
        drawer.hLine(tubeX - 1, tubeY + 3, 7, c.armor);
        drawer.hLine(tubeX - 1, tubeY + 7, 7, c.armor);

        // Missile tips visible in upper tubes
        drawer.pixel(tubeX, muzzleY + 1, '#c0392b');
        drawer.pixel(tubeX + 3, muzzleY + 1, '#e74c3c');

        // Pod side panel detail
        drawer.pixel(tubeX + 1, tubeY + 5, c.rivet);
        drawer.pixel(tubeX + 4, tubeY + 5, c.rivet);
    }

    // ========================================================================
    //  ARMS - Combined idle drawing
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

        if (attackType === 'gatling_sweep') {
            this.drawGatlingAttack(drawer, cx, cy, c, pose, phase);
            this.drawLauncherArm(drawer, cx, cy, c, pose);
        } else if (attackType === 'ring_burst') {
            this.drawBurstPose(drawer, cx, cy, c, pose, phase);
        } else if (attackType === 'rocket_salvo') {
            this.drawGatlingArm(drawer, cx, cy, c, pose);
            this.drawLauncherAttack(drawer, cx, cy, c, pose, phase);
        } else {
            this.drawArms(drawer, cx, cy, c, pose);
        }
    }

    drawGatlingAttack(drawer, cx, cy, c, pose, phase) {
        const sy = cy - 14;
        const lx = cx - 12;

        // Sweep: arm sweeps from upper-right to lower-left
        let armOffsetX, armOffsetY;
        if (phase < 0.3) {
            const t = phase / 0.3;
            armOffsetX = t * 4;
            armOffsetY = -t * 5;
        } else if (phase < 0.8) {
            const t = (phase - 0.3) / 0.5;
            armOffsetX = 4 - t * 10;
            armOffsetY = -5 + t * 8;
        } else {
            const t = (phase - 0.8) / 0.2;
            armOffsetX = -6 + t * 6;
            armOffsetY = 3 - t * 3;
        }

        armOffsetX = Math.round(armOffsetX);
        armOffsetY = Math.round(armOffsetY);

        // Upper arm
        drawer.fillPath([
            { x: lx + 2, y: sy },
            { x: lx + 8, y: sy },
            { x: lx + 7 + armOffsetX, y: sy + 7 + armOffsetY },
            { x: lx + 1 + armOffsetX, y: sy + 7 + armOffsetY }
        ], c.body);
        drawer.vLine(lx + 3, sy + 1, 4, c.bodyLight);

        // Elbow joint
        drawer.hLine(lx + armOffsetX, sy + 7 + armOffsetY, 9, c.joint);

        // Gun housing
        const gunX = lx - 2 + armOffsetX;
        const gunY = sy + 9 + armOffsetY;
        drawer.rect(gunX, gunY, 10, 6, c.armor);
        drawer.hLine(gunX + 1, gunY, 8, c.armorLight);
        drawer.hLine(gunX + 1, gunY + 5, 8, c.bodyDark);

        // Barrels
        const barrelBaseX = gunX - 2;
        const barrelBaseY = gunY + 2;
        drawer.vLine(barrelBaseX, barrelBaseY - 1, 5, c.barrel);
        for (let i = 0; i < 3; i++) {
            const by = barrelBaseY + (i - 1) * 2;
            drawer.hLine(barrelBaseX - 5, by, 6, c.barrel);
            drawer.pixel(barrelBaseX - 6, by, c.barrelDark);
        }

        // Muzzle flash during sweep phase
        if (phase >= 0.3 && phase < 0.8) {
            const flashX = barrelBaseX - 7;
            const flashY = barrelBaseY;
            drawer.pixel(flashX, flashY, '#ffff00');
            drawer.pixel(flashX - 1, flashY, '#ffaa00');
            drawer.pixel(flashX, flashY - 1, '#ffcc00');
            drawer.pixel(flashX, flashY + 1, '#ffcc00');
            drawer.pixel(flashX + 1, flashY - 1, '#ff8800');
            drawer.pixel(flashX + 1, flashY + 1, '#ff8800');
        }
    }

    drawLauncherAttack(drawer, cx, cy, c, pose, phase) {
        const sy = cy - 14;
        const rx = cx + 12;

        let armOffsetX, armOffsetY;
        if (phase < 0.2) {
            const t = phase / 0.2;
            armOffsetX = -t * 2;
            armOffsetY = t * 3;
        } else if (phase < 0.5) {
            const t = (phase - 0.2) / 0.3;
            armOffsetX = -2 + t * 4;
            armOffsetY = 3 - t * 5;
        } else {
            const t = (phase - 0.5) / 0.5;
            armOffsetX = 2 - t * 2;
            armOffsetY = -2 + t * 2;
        }

        armOffsetX = Math.round(armOffsetX);
        armOffsetY = Math.round(armOffsetY);

        // Upper arm
        drawer.fillPath([
            { x: rx - 6, y: sy },
            { x: rx, y: sy },
            { x: rx - 1 + armOffsetX, y: sy + 7 + armOffsetY },
            { x: rx - 7 + armOffsetX, y: sy + 7 + armOffsetY }
        ], c.body);
        drawer.vLine(rx - 5, sy + 1, 4, c.bodyLight);

        // Elbow joint
        drawer.hLine(rx - 7 + armOffsetX, sy + 7 + armOffsetY, 9, c.joint);

        // Launcher pod
        const tubeX = rx - 5 + armOffsetX;
        const tubeY = sy + 9 + armOffsetY;
        drawer.fillPath([
            { x: tubeX - 1, y: tubeY },
            { x: tubeX + 7, y: tubeY },
            { x: tubeX + 5, y: tubeY + 12 },
            { x: tubeX - 3, y: tubeY + 12 }
        ], c.launcher);
        drawer.vLine(tubeX - 2, tubeY + 2, 9, c.launcherDark);
        // Tube openings
        drawer.rect(tubeX - 1, tubeY + 10, 3, 2, '#1a1a1a');
        drawer.rect(tubeX + 2, tubeY + 10, 3, 2, '#1a1a1a');

        // Smoke/fire trail on fire phase
        if (phase >= 0.2 && phase < 0.5) {
            const smokeY = tubeY + 13;
            drawer.pixel(tubeX + 1, smokeY, '#ffaa00');
            drawer.pixel(tubeX, smokeY + 1, '#aaaaaa');
            drawer.pixel(tubeX + 2, smokeY + 1, '#888888');
            drawer.pixel(tubeX - 1, smokeY + 2, '#666666');
            drawer.pixel(tubeX + 3, smokeY + 2, '#777777');
        }
    }

    drawBurstPose(drawer, cx, cy, c, pose, phase) {
        const sy = cy - 14;

        let raiseAmount;
        if (phase < 0.3) {
            raiseAmount = Math.round((phase / 0.3) * 6);
        } else if (phase < 0.6) {
            raiseAmount = 6;
        } else {
            raiseAmount = Math.round((1 - (phase - 0.6) / 0.4) * 6);
        }

        // Left arm (gatling) raised
        const lx = cx - 12;
        drawer.fillPath([
            { x: lx + 2, y: sy - raiseAmount },
            { x: lx + 8, y: sy - raiseAmount },
            { x: lx + 7, y: sy + 7 - raiseAmount },
            { x: lx + 1, y: sy + 7 - raiseAmount }
        ], c.body);
        drawer.hLine(lx, sy + 7 - raiseAmount, 9, c.joint);
        // Compact gatling at raised position
        const gunY = sy + 9 - raiseAmount;
        drawer.rect(lx - 2, gunY, 10, 6, c.armor);
        for (let i = 0; i < 3; i++) {
            drawer.hLine(lx - 8, gunY + 2 + (i - 1) * 2, 6, c.barrel);
        }
        drawer.vLine(lx - 2, gunY + 1, 5, c.barrel);

        // Right arm (launcher) raised
        const rx = cx + 12;
        drawer.fillPath([
            { x: rx - 6, y: sy - raiseAmount },
            { x: rx, y: sy - raiseAmount },
            { x: rx - 1, y: sy + 7 - raiseAmount },
            { x: rx - 7, y: sy + 7 - raiseAmount }
        ], c.body);
        drawer.hLine(rx - 7, sy + 7 - raiseAmount, 9, c.joint);
        // Launcher tube at raised position
        const tubeY = sy + 9 - raiseAmount;
        drawer.fillPath([
            { x: rx - 6, y: tubeY },
            { x: rx + 2, y: tubeY },
            { x: rx, y: tubeY + 10 },
            { x: rx - 8, y: tubeY + 10 }
        ], c.launcher);
        // Tube openings
        drawer.rect(rx - 6, tubeY + 8, 3, 2, '#1a1a1a');
        drawer.rect(rx - 3, tubeY + 8, 3, 2, '#1a1a1a');

        // Energy burst glow during active phase
        if (phase >= 0.3 && phase < 0.6) {
            const glowColor = c.coreGlow;
            // Energy radiating from core
            drawer.pixel(cx - 8, sy - raiseAmount + 4, glowColor);
            drawer.pixel(cx + 8, sy - raiseAmount + 4, glowColor);
            drawer.pixel(cx, sy - raiseAmount - 2, glowColor);
            drawer.pixel(cx - 4, sy - raiseAmount, glowColor);
            drawer.pixel(cx + 4, sy - raiseAmount, glowColor);
        }
    }

    // ========================================================================
    //  HEAD - Large mechanical head with visor, chin guard, crest
    // ========================================================================
    drawHead(drawer, cx, cy, c, phase) {
        const w = 16;
        const h = 12;
        const x = cx - w / 2;
        const y = cy - h + 2;

        // -- Head crest / antenna array on top --
        // Central crest (3px tall fin)
        drawer.vLine(cx, y - 3, 3, c.armor);
        drawer.pixel(cx, y - 3, c.eye);
        drawer.pixel(cx - 1, y - 2, c.armor);
        drawer.pixel(cx + 1, y - 2, c.armor);

        // Side antenna stalks
        drawer.vLine(x + 3, y - 3, 3, c.barrel);
        drawer.pixel(x + 3, y - 3, c.eye);
        drawer.vLine(x + w - 4, y - 3, 3, c.barrel);
        drawer.pixel(x + w - 4, y - 3, c.eye);

        // -- Main head casing (angular rectangular) --
        drawer.fillPath([
            { x: x + 1, y: y },
            { x: x + w - 1, y: y },
            { x: x + w, y: y + 2 },
            { x: x + w, y: y + h - 2 },
            { x: x + w - 2, y: y + h },
            { x: x + 2, y: y + h },
            { x: x, y: y + h - 2 },
            { x: x, y: y + 2 }
        ], c.armor);

        // Top edge highlight
        drawer.hLine(x + 2, y, w - 4, c.armorLight);
        // Bottom shadow
        drawer.hLine(x + 2, y + h - 1, w - 4, c.bodyDark);
        // Side shadows
        drawer.vLine(x + 1, y + 2, h - 4, c.bodyDark);
        drawer.vLine(x + w - 2, y + 2, h - 4, c.bodyDark);

        // Forehead armor plate seam
        drawer.hLine(x + 3, y + 2, w - 6, c.body);

        // -- Optical visor (wide glowing horizontal bar) --
        const visorY = y + 4;
        // Visor frame
        drawer.rect(x + 2, visorY - 1, w - 4, 4, c.bodyDark);
        // Visor glow (main light bar)
        drawer.rect(x + 3, visorY, w - 6, 2, c.eye);
        // Bright center of visor
        drawer.hLine(cx - 2, visorY, 4, c.eyeBright);
        drawer.hLine(cx - 1, visorY + 1, 2, '#ffffff');
        // Visor edge dimming
        drawer.pixel(x + 3, visorY + 1, c.bodyDark);
        drawer.pixel(x + w - 4, visorY + 1, c.bodyDark);

        // -- Chin guard (armored lower face) --
        const chinY = y + h - 3;
        drawer.rect(x + 3, chinY, w - 6, 3, c.body);
        drawer.hLine(x + 4, chinY, w - 8, c.bodyLight);
        // Chin vent slits
        drawer.pixel(x + 5, chinY + 1, c.bodyDark);
        drawer.pixel(x + 7, chinY + 1, c.bodyDark);
        drawer.pixel(x + 9, chinY + 1, c.bodyDark);

        // -- Cheek vents / side sensors --
        drawer.pixel(x + 1, y + 5, c.joint);
        drawer.pixel(x + 1, y + 6, c.joint);
        drawer.pixel(x + 1, y + 7, c.joint);
        drawer.pixel(x + w - 2, y + 5, c.joint);
        drawer.pixel(x + w - 2, y + 6, c.joint);
        drawer.pixel(x + w - 2, y + 7, c.joint);

        // Head rivets
        drawer.pixel(x + 2, y + 1, c.rivet);
        drawer.pixel(x + w - 3, y + 1, c.rivet);

        // Phase 2: cracked faceplate + sparks
        if (phase === 2) {
            // Crack across visor
            drawer.pixel(x + 4, y + 3, c.crack);
            drawer.pixel(x + 5, y + 4, c.crack);
            drawer.pixel(x + 6, y + 5, c.crack);
            drawer.pixel(x + 7, y + 6, c.crack);
            // Crack on right side
            drawer.pixel(x + w - 5, y + 2, c.crack);
            drawer.pixel(x + w - 6, y + 3, c.crack);
            // Sparking antenna tips
            drawer.pixel(x + 3, y - 4, c.spark);
            drawer.pixel(x + w - 4, y - 4, c.spark);
            drawer.pixel(cx, y - 4, c.spark);
        }
    }

    // ========================================================================
    //  PHASE 2 OVERLOAD EFFECTS - Cracks, sparks, heat distortion
    // ========================================================================
    drawOverloadEffects(drawer, cx, cy, c, pose) {
        const bodyY = cy - 18 + 4;
        const pulsePhase = pose.pulsePhase || 0;
        const w = 24;
        const x = cx - w / 2;

        // -- Jagged crack lines across armor --
        // Crack 1: upper-left diagonal across chest
        drawer.pixel(x + 3, bodyY + 2, c.crack);
        drawer.pixel(x + 4, bodyY + 3, c.crack);
        drawer.pixel(x + 5, bodyY + 3, c.bodyDark);
        drawer.pixel(x + 6, bodyY + 4, c.crack);
        drawer.pixel(x + 7, bodyY + 5, c.crack);
        drawer.pixel(x + 8, bodyY + 5, c.bodyDark);
        drawer.pixel(x + 9, bodyY + 6, c.crack);

        // Crack 2: upper-right descending
        drawer.pixel(x + w - 3, bodyY + 1, c.crack);
        drawer.pixel(x + w - 4, bodyY + 2, c.bodyDark);
        drawer.pixel(x + w - 5, bodyY + 3, c.crack);
        drawer.pixel(x + w - 5, bodyY + 4, c.crack);
        drawer.pixel(x + w - 6, bodyY + 5, c.bodyDark);
        drawer.pixel(x + w - 7, bodyY + 6, c.crack);

        // Crack 3: across waist
        drawer.pixel(x + 5, bodyY + 12, c.crack);
        drawer.pixel(x + 6, bodyY + 13, c.crack);
        drawer.pixel(x + 7, bodyY + 13, c.bodyDark);
        drawer.pixel(x + 8, bodyY + 14, c.crack);
        drawer.pixel(x + 9, bodyY + 14, c.crack);
        drawer.pixel(x + 10, bodyY + 15, c.crack);

        // -- Random spark pixels near joints --
        const sparkOffset1 = Math.floor(pulsePhase * 5) % 3;
        const sparkOffset2 = Math.floor(pulsePhase * 7) % 4;

        // Left shoulder spark
        drawer.pixel(x - 5 + sparkOffset1, bodyY + sparkOffset2, c.spark);
        drawer.pixel(x - 4 + sparkOffset1, bodyY + sparkOffset2 + 1, '#ffffff');
        // Right shoulder spark
        drawer.pixel(x + w + 4 - sparkOffset1, bodyY + 1 + sparkOffset2, c.spark);
        drawer.pixel(x + w + 3 - sparkOffset1, bodyY + 2 + sparkOffset2, '#ffffff');
        // Left knee spark
        drawer.pixel(cx - 10 + sparkOffset2, cy + 4 + sparkOffset1, c.spark);
        // Right elbow spark
        drawer.pixel(cx + 11 - sparkOffset1, bodyY + 7 + sparkOffset2, c.spark);

        // Additional bright spark flicker
        if (pulsePhase > 0.5) {
            drawer.pixel(x + 4 + sparkOffset1, bodyY + 8, '#ffffff');
            drawer.pixel(x + w - 3 - sparkOffset2, bodyY + 10, '#ffffff');
            drawer.pixel(cx + sparkOffset1 - 1, bodyY - 2, c.spark);
        }

        // -- Heat distortion lines near core --
        const coreY = bodyY + 8;
        const distPhase = Math.floor(pulsePhase * 4) % 2;

        // Wavy heat lines above and below core
        drawer.pixel(cx - 5, coreY - 4 + distPhase, c.coreGlow);
        drawer.pixel(cx + 5, coreY - 3 - distPhase, c.coreGlow);
        drawer.pixel(cx - 4, coreY + 6 + distPhase, c.coreGlow);
        drawer.pixel(cx + 4, coreY + 5 - distPhase, c.coreGlow);

        // Side heat shimmer
        drawer.pixel(cx - 8, coreY + distPhase, c.core);
        drawer.pixel(cx + 8, coreY - distPhase, c.core);
        drawer.pixel(cx - 7, coreY + 2 - distPhase, c.core);
        drawer.pixel(cx + 7, coreY + 1 + distPhase, c.core);
    }
}
