import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for Pet Cat
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Cute grey tabby cat - big head, pointed ears, long tail, short legs
 * Canvas: 32x32
 */
export class CatGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // Main fur (grey tabby)
        this.cFur = '#8a8a8a';
        this.cFurDark = '#5c5c5c';
        this.cFurLight = '#a8a8a8';

        // Chest / belly (white)
        this.cChest = '#e0e0e0';
        this.cChestDark = '#c8c8c8';

        // Stripe markings
        this.cStripe = '#4a4a4a';

        // Nose & mouth
        this.cNose = '#e8a0a0';
        this.cNoseDark = '#c88080';

        // Eyes (green)
        this.cEye = '#7dcea0';
        this.cEyeDark = '#4a9a6e';
        this.cPupil = '#1a1a2e';
        this.cEyeHighlight = '#ffffff';

        // Ear inner
        this.cEarInner = '#d4a0a0';

        // Paws
        this.cPaw = '#7a7a7a';
        this.cPawPad = '#d4a0a0';

        // Whiskers
        this.cWhisker = '#c0c0c0';
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { bodyBob, tailCurve, earTwitch, legFrame }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const groundY = 29;

        const bodyBob = pose.bodyBob || 0;
        const tailCurve = pose.tailCurve || 0;
        const earTwitch = pose.earTwitch || 0;

        // Body center
        const bodyY = 22 + bodyBob;

        // Draw order: tail → back legs → body → front legs → head
        this.drawTail(drawer, cx, bodyY, tailCurve);
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', true);
        this.drawBody(drawer, cx, bodyY);
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', false);
        this.drawHead(drawer, cx, bodyY - 6 + bodyBob * 0.5, earTwitch);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, earTwitch = 0) {
        const headCX = cx;
        const headCY = cy - 1;

        // --- Ears (pointed, triangular - cat style) ---
        const twitch = Math.round(earTwitch * 1);
        // Left ear (triangle)
        drawer.fillPath([
            { x: headCX - 5, y: headCY - 2 },
            { x: headCX - 4, y: headCY - 8 + twitch },
            { x: headCX - 1, y: headCY - 3 }
        ], this.cFur);
        // Left ear inner
        drawer.fillPath([
            { x: headCX - 4, y: headCY - 3 },
            { x: headCX - 4, y: headCY - 6 + twitch },
            { x: headCX - 2, y: headCY - 3 }
        ], this.cEarInner);

        // Right ear (triangle)
        drawer.fillPath([
            { x: headCX + 5, y: headCY - 2 },
            { x: headCX + 4, y: headCY - 8 + twitch },
            { x: headCX + 1, y: headCY - 3 }
        ], this.cFur);
        // Right ear inner
        drawer.fillPath([
            { x: headCX + 4, y: headCY - 3 },
            { x: headCX + 4, y: headCY - 6 + twitch },
            { x: headCX + 2, y: headCY - 3 }
        ], this.cEarInner);

        // --- Head shape (slightly wider than tall, cat face) ---
        drawer.ellipse(headCX, headCY, 7, 5, this.cFur);

        // Fur highlight (top)
        drawer.hLine(headCX - 2, headCY - 4, 4, this.cFurLight);

        // Tabby stripe on forehead (M shape)
        drawer.pixel(headCX - 2, headCY - 3, this.cStripe);
        drawer.pixel(headCX - 1, headCY - 4, this.cStripe);
        drawer.pixel(headCX, headCY - 3, this.cStripe);
        drawer.pixel(headCX + 1, headCY - 4, this.cStripe);
        drawer.pixel(headCX + 2, headCY - 3, this.cStripe);

        // --- Muzzle (white patch) ---
        drawer.ellipse(headCX, headCY + 2, 4, 2, this.cChest);

        // --- Eyes (big, almond-shaped, green) ---
        // Left eye
        drawer.rect(headCX - 4, headCY - 2, 3, 2, this.cEye);
        drawer.pixel(headCX - 3, headCY - 2, this.cEyeDark);
        drawer.pixel(headCX - 3, headCY - 1, this.cPupil);
        drawer.pixel(headCX - 4, headCY - 2, this.cEyeHighlight);
        // Right eye
        drawer.rect(headCX + 2, headCY - 2, 3, 2, this.cEye);
        drawer.pixel(headCX + 3, headCY - 2, this.cEyeDark);
        drawer.pixel(headCX + 3, headCY - 1, this.cPupil);
        drawer.pixel(headCX + 4, headCY - 2, this.cEyeHighlight);

        // --- Nose (small pink triangle) ---
        drawer.rect(headCX - 1, headCY + 1, 2, 1, this.cNose);
        drawer.pixel(headCX, headCY + 1, this.cNoseDark);

        // --- Mouth line ---
        drawer.pixel(headCX, headCY + 2, this.cFurDark);
        drawer.pixel(headCX - 1, headCY + 3, this.cFurDark);
        drawer.pixel(headCX + 1, headCY + 3, this.cFurDark);

        // --- Whiskers ---
        // Left whiskers
        drawer.pixel(headCX - 6, headCY, this.cWhisker);
        drawer.pixel(headCX - 7, headCY - 1, this.cWhisker);
        drawer.pixel(headCX - 6, headCY + 1, this.cWhisker);
        drawer.pixel(headCX - 7, headCY + 2, this.cWhisker);
        // Right whiskers
        drawer.pixel(headCX + 6, headCY, this.cWhisker);
        drawer.pixel(headCX + 7, headCY - 1, this.cWhisker);
        drawer.pixel(headCX + 6, headCY + 1, this.cWhisker);
        drawer.pixel(headCX + 7, headCY + 2, this.cWhisker);
    }

    drawBody(drawer, cx, cy) {
        // Cat body: more slender and elongated than dog
        drawer.ellipse(cx, cy, 6, 5, this.cFur);

        // Chest (white, front-bottom)
        drawer.ellipse(cx, cy + 2, 4, 3, this.cChest);

        // Body fur shadows
        drawer.pixel(cx - 5, cy, this.cFurDark);
        drawer.pixel(cx + 5, cy, this.cFurDark);

        // Tabby stripes on back
        drawer.pixel(cx - 2, cy - 3, this.cStripe);
        drawer.pixel(cx, cy - 4, this.cStripe);
        drawer.pixel(cx + 2, cy - 3, this.cStripe);

        // Fur highlight
        drawer.hLine(cx - 2, cy - 4, 4, this.cFurLight);

        // Bell collar
        drawer.hLine(cx - 3, cy - 3, 6, '#4a90d9');
        drawer.pixel(cx, cy - 2, '#ffd700'); // Bell
    }

    drawTail(drawer, cx, cy, tailCurve = 0) {
        const tailBaseX = cx + 6;
        const tailBaseY = cy - 1;
        const curve = Math.round(tailCurve * 3);

        // Cat tail: long, thin, curved upward with S-curve
        drawer.fillPath([
            { x: tailBaseX, y: tailBaseY },
            { x: tailBaseX + 2, y: tailBaseY - 2 },
            { x: tailBaseX + 3, y: tailBaseY - 5 + curve },
            { x: tailBaseX + 4, y: tailBaseY - 8 + curve },
            { x: tailBaseX + 5, y: tailBaseY - 9 + curve },
            { x: tailBaseX + 4, y: tailBaseY - 9 + curve },
            { x: tailBaseX + 2, y: tailBaseY - 6 + curve },
            { x: tailBaseX + 1, y: tailBaseY - 3 },
            { x: tailBaseX - 1, y: tailBaseY + 1 }
        ], this.cFur);

        // Tail tip (darker stripe)
        drawer.pixel(tailBaseX + 4, tailBaseY - 9 + curve, this.cStripe);
        drawer.pixel(tailBaseX + 5, tailBaseY - 9 + curve, this.cStripe);
    }

    drawLegs(drawer, cx, groundY, pose, isBack) {
        let leftPose = 'idle';
        let rightPose = 'idle';

        if (typeof pose === 'string') {
            leftPose = pose;
            rightPose = pose;
        } else if (pose && typeof pose === 'object') {
            leftPose = pose.left || 'idle';
            rightPose = pose.right || 'idle';
        }

        if (isBack) {
            // Back legs (cats have longer back legs)
            this.drawOneLeg(drawer, cx - 4, groundY, leftPose, true);
            this.drawOneLeg(drawer, cx + 2, groundY, rightPose, true);
        } else {
            // Front legs (thinner)
            this.drawOneLeg(drawer, cx - 3, groundY, leftPose, false);
            this.drawOneLeg(drawer, cx + 1, groundY, rightPose, false);
        }
    }

    drawOneLeg(drawer, x, groundY, pose, isBack) {
        const color = isBack ? this.cFurDark : this.cFur;
        const pawColor = isBack ? this.cPawPad : this.cPaw;
        const hipY = groundY - 5;

        // Cat legs: thinner (2px wide) than dog (3px)
        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, 2, 4, color);
            drawer.rect(x, hipY + 3, 2, 2, pawColor);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, 2, 2, color);
            drawer.pixel(x - 1, hipY + 2, color);
            drawer.pixel(x, hipY + 2, color);
            drawer.rect(x - 1, hipY + 3, 2, 2, pawColor);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, 2, 2, color);
            drawer.pixel(x - 1, hipY + 1, color);
            drawer.pixel(x - 2, hipY + 2, color);
            drawer.rect(x - 2, hipY + 3, 2, 2, pawColor);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, 2, 2, color);
            drawer.pixel(x + 1, hipY + 2, color);
            drawer.pixel(x + 2, hipY + 2, color);
            drawer.rect(x + 1, hipY + 3, 2, 2, pawColor);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, 2, 2, color);
            drawer.pixel(x + 2, hipY + 1, color);
            drawer.pixel(x + 3, hipY + 2, color);
            drawer.rect(x + 2, hipY + 3, 2, 2, pawColor);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, 2, 2, color);
            drawer.pixel(x + 1, hipY + 1, color);
            drawer.rect(x + 1, hipY + 2, 2, 2, pawColor);
        }
    }
}
