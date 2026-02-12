import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Procedural Generator for Pet Dog
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Archetype: Cute Shiba/Corgi mix - big head, short legs, round body
 * Canvas: 32x32
 */
export class DogGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // Main fur (warm golden brown)
        this.cFur = '#d4a04a';
        this.cFurDark = '#b8862e';
        this.cFurLight = '#e8c06a';

        // Belly / cheek (cream)
        this.cCream = '#f0d8a8';
        this.cCreamDark = '#dcc090';

        // Nose & eyes
        this.cNose = '#3a2a1a';
        this.cEye = '#1a1a2e';
        this.cEyeHighlight = '#ffffff';

        // Tongue
        this.cTongue = '#e87474';
        this.cTongueDark = '#c55a5a';

        // Ear inner
        this.cEarInner = '#c97a4a';

        // Paws
        this.cPaw = '#c08838';
        this.cPawPad = '#8b6030';
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { bodyBob, tailWag, earFlop, legFrame, tongueOut }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);

        const cx = 16;
        const groundY = 29;

        const bodyBob = pose.bodyBob || 0;
        const tailWag = pose.tailWag || 0;
        const earFlop = pose.earFlop || 0;
        const tongueOut = pose.tongueOut || 0;

        // Body center
        const bodyY = 22 + bodyBob;

        // Draw order: tail → back legs → body → front legs → head
        this.drawTail(drawer, cx, bodyY, tailWag);
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', true);
        this.drawBody(drawer, cx, bodyY);
        this.drawLegs(drawer, cx, groundY, pose.legFrame || 'idle', false);
        this.drawHead(drawer, cx, bodyY - 6 + bodyBob * 0.5, earFlop, tongueOut);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, earFlop = 0, tongueOut = 0) {
        // Head is big and round (chibi style)
        const headCX = cx;
        const headCY = cy - 1;

        // --- Ears (floppy, behind head) ---
        const earDrop = Math.round(earFlop * 1.5);
        // Left ear
        drawer.fillPath([
            { x: headCX - 6, y: headCY - 4 },
            { x: headCX - 4, y: headCY - 7 + earDrop },
            { x: headCX - 2, y: headCY - 5 + earDrop },
            { x: headCX - 2, y: headCY - 2 }
        ], this.cFurDark);
        drawer.pixel(headCX - 4, headCY - 5 + earDrop, this.cEarInner);
        drawer.pixel(headCX - 3, headCY - 4 + earDrop, this.cEarInner);

        // Right ear
        drawer.fillPath([
            { x: headCX + 6, y: headCY - 4 },
            { x: headCX + 4, y: headCY - 7 + earDrop },
            { x: headCX + 2, y: headCY - 5 + earDrop },
            { x: headCX + 2, y: headCY - 2 }
        ], this.cFurDark);
        drawer.pixel(headCX + 4, headCY - 5 + earDrop, this.cEarInner);
        drawer.pixel(headCX + 3, headCY - 4 + earDrop, this.cEarInner);

        // --- Head shape (round) ---
        drawer.ellipse(headCX, headCY, 7, 6, this.cFur);

        // Fur highlight (top)
        drawer.hLine(headCX - 3, headCY - 5, 6, this.cFurLight);
        drawer.pixel(headCX - 2, headCY - 4, this.cFurLight);
        drawer.pixel(headCX + 2, headCY - 4, this.cFurLight);

        // --- Face cream patch (cheeks and muzzle) ---
        drawer.ellipse(headCX, headCY + 2, 5, 3, this.cCream);

        // --- Eyes (big, round, cute) ---
        // Left eye
        drawer.rect(headCX - 4, headCY - 2, 3, 3, this.cEye);
        drawer.pixel(headCX - 3, headCY - 2, this.cEyeHighlight);
        // Right eye
        drawer.rect(headCX + 2, headCY - 2, 3, 3, this.cEye);
        drawer.pixel(headCX + 3, headCY - 2, this.cEyeHighlight);

        // --- Eyebrows (cute arches) ---
        drawer.pixel(headCX - 4, headCY - 3, this.cFurDark);
        drawer.pixel(headCX - 3, headCY - 4, this.cFurDark);
        drawer.pixel(headCX + 4, headCY - 3, this.cFurDark);
        drawer.pixel(headCX + 3, headCY - 4, this.cFurDark);

        // --- Nose (black triangle) ---
        drawer.rect(headCX - 1, headCY + 1, 3, 2, this.cNose);
        drawer.pixel(headCX, headCY + 1, this.cNose);
        // Nose shine
        drawer.pixel(headCX, headCY + 1, '#5a4a3a');

        // --- Mouth line ---
        drawer.pixel(headCX, headCY + 3, this.cFurDark);
        drawer.pixel(headCX - 1, headCY + 4, this.cFurDark);
        drawer.pixel(headCX + 1, headCY + 4, this.cFurDark);

        // --- Tongue (when panting) ---
        if (tongueOut > 0) {
            const tLen = Math.round(tongueOut * 3);
            drawer.rect(headCX + 2, headCY + 3, 2, tLen, this.cTongue);
            drawer.pixel(headCX + 2, headCY + 3 + tLen - 1, this.cTongueDark);
            drawer.pixel(headCX + 3, headCY + 3 + tLen - 1, this.cTongueDark);
        }

        // --- Cheek blush ---
        drawer.pixel(headCX - 5, headCY, '#e8a090');
        drawer.pixel(headCX + 5, headCY, '#e8a090');
    }

    drawBody(drawer, cx, cy) {
        const bodyW = 12;
        const bodyH = 8;
        const x = cx - bodyW / 2;
        const y = cy - bodyH / 2;

        // Main body (oval)
        drawer.ellipse(cx, cy, 7, 5, this.cFur);

        // Belly (lighter, bottom area)
        drawer.ellipse(cx, cy + 2, 5, 3, this.cCream);

        // Body fur shadows
        drawer.pixel(x + 1, cy, this.cFurDark);
        drawer.pixel(x + bodyW - 2, cy, this.cFurDark);

        // Fur highlights (top of back)
        drawer.hLine(cx - 3, cy - 4, 6, this.cFurLight);
        drawer.pixel(cx - 1, cy - 3, this.cFurLight);
        drawer.pixel(cx + 1, cy - 3, this.cFurLight);

        // Collar
        drawer.hLine(cx - 4, cy - 3, 8, '#e04040');
        drawer.pixel(cx, cy - 3, '#ffd700'); // Collar tag
    }

    drawTail(drawer, cx, cy, tailWag = 0) {
        const tailBaseX = cx + 7;
        const tailBaseY = cy - 2;
        const wagOffset = Math.round(tailWag * 3);

        // Tail (curved upward, wagging)
        drawer.fillPath([
            { x: tailBaseX, y: tailBaseY },
            { x: tailBaseX + 2, y: tailBaseY - 3 + wagOffset },
            { x: tailBaseX + 4, y: tailBaseY - 5 + wagOffset },
            { x: tailBaseX + 3, y: tailBaseY - 5 + wagOffset },
            { x: tailBaseX + 1, y: tailBaseY - 2 + wagOffset },
            { x: tailBaseX - 1, y: tailBaseY + 1 }
        ], this.cFur);

        // Tail tip (cream)
        drawer.pixel(tailBaseX + 3, tailBaseY - 5 + wagOffset, this.cCream);
        drawer.pixel(tailBaseX + 4, tailBaseY - 5 + wagOffset, this.cCream);
    }

    drawLegs(drawer, cx, groundY, pose, isBack) {
        const legW = 3;
        const legH = 4;

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
            // Back legs (slightly inward)
            this.drawOneLeg(drawer, cx - 5, groundY, leftPose, true);
            this.drawOneLeg(drawer, cx + 3, groundY, rightPose, true);
        } else {
            // Front legs
            this.drawOneLeg(drawer, cx - 4, groundY, leftPose, false);
            this.drawOneLeg(drawer, cx + 2, groundY, rightPose, false);
        }
    }

    drawOneLeg(drawer, x, groundY, pose, isBack) {
        const color = isBack ? this.cFurDark : this.cFur;
        const pawColor = isBack ? this.cPawPad : this.cPaw;
        const hipY = groundY - 5;

        if (pose === 'idle' || pose === 'stand') {
            drawer.rect(x, hipY, 3, 4, color);
            drawer.rect(x, hipY + 3, 3, 2, pawColor);
        }
        else if (pose === 'fwd1') {
            drawer.rect(x, hipY, 3, 2, color);
            drawer.pixel(x - 1, hipY + 2, color);
            drawer.pixel(x, hipY + 2, color);
            drawer.rect(x - 2, hipY + 3, 3, 2, pawColor);
        }
        else if (pose === 'fwd2') {
            drawer.rect(x, hipY, 3, 2, color);
            drawer.pixel(x - 1, hipY + 1, color);
            drawer.pixel(x - 2, hipY + 2, color);
            drawer.rect(x - 3, hipY + 3, 3, 2, pawColor);
        }
        else if (pose === 'back1') {
            drawer.rect(x, hipY, 3, 2, color);
            drawer.pixel(x + 1, hipY + 2, color);
            drawer.pixel(x + 2, hipY + 2, color);
            drawer.rect(x + 1, hipY + 3, 3, 2, pawColor);
        }
        else if (pose === 'back2') {
            drawer.rect(x, hipY, 3, 2, color);
            drawer.pixel(x + 2, hipY + 1, color);
            drawer.pixel(x + 3, hipY + 2, color);
            drawer.rect(x + 2, hipY + 3, 3, 2, pawColor);
        }
        else if (pose === 'tuck') {
            drawer.rect(x, hipY, 3, 2, color);
            drawer.pixel(x + 1, hipY + 1, color);
            drawer.rect(x + 1, hipY + 2, 3, 2, pawColor);
        }
    }
}
