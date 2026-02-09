import { PixelDraw } from '../../../../utils/PixelDraw.js';
import { PALETTE } from '../../../Palette.js';

/**
 * Procedural Generator for the Zombie Enemy
 * Style: 35-degree Top-Down 2.5D Pixel Art (Chibi Style)
 * Matches Player "Cool Guy" proportions
 */
export class ZombieGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;
        
        // Colors
        this.cSkin = '#7cb342';         // Rotten Green
        this.cSkinShadow = '#558b2f';   // Dark Green
        this.cBlood = '#b71c1c';        // Blood Red
        this.cBone = '#dcedc8';         // Bone White
        
        this.cShirt = '#8d6e63';        // Tattered Brown Shirt
        this.cShirtShadow = '#5d4037';
        this.cPants = '#546e7a';        // Tattered Blue/Grey Pants
        this.cShoes = '#212121';        // Black Shoes
        
        this.cEyeWhite = '#fff9c4';     // Yellowish White
        this.cHair = '#424242';         // Grey/Black messy hair
    }

    /**
     * Generate a single frame
     * @param {Object} pose - { headOffset: {x,y}, bodySquash: number, legFrame: string, armAngle: number }
     */
    generateFrame(pose = {}) {
        const drawer = new PixelDraw(this.width, this.height);
        
        const cx = 16;
        const cy = 29; // Ground Y
        
        // Zombie Posture: Hunched
        // Head is slightly lower and forward compared to player
        
        const bodyY = 22 + (pose.bodySquash || 0);
        // Head twitch logic: Add rotation or offset
        const headX = cx + (pose.headTwitch?.x || 0);
        const headY = 15 + (pose.headOffset?.y || 0) + (pose.headTwitch?.y || 0);
        
        // 1. Draw Legs
        this.drawLegs(drawer, cx, cy, pose.legFrame || 'idle');
        
        // 2. Draw Body (Tattered Shirt)
        this.drawBody(drawer, cx, bodyY, pose);
        
        // 3. Draw Arms (Outstretched)
        this.drawArms(drawer, cx, bodyY, pose.armAngle || 0);
        
        // 4. Draw Head
        this.drawHead(drawer, headX, headY, pose.jawOpen || 0);

        return drawer.getCanvas();
    }

    drawHead(drawer, cx, cy, jawOpen = 0) {
        const w = 16;
        const h = 14;
        const x = cx - w/2;
        const y = cy - h + 4; // Lower head slightly for hunch
        
        // Face Shape (More Organic / Rounder)
        // Top Dome
        drawer.fillQuadCurve(x, y + 4, cx, y, x + w, y + 4, this.cSkin);
        // Cheeks/Jaw (Wider at bottom)
        drawer.fillQuadCurve(x, y + 4, x - 1, y + h - 2, cx, y + h, this.cSkin); 
        drawer.fillQuadCurve(x + w, y + 4, x + w + 1, y + h - 2, cx, y + h, this.cSkin); 
        // Fill Center
        drawer.rect(x + 1, y + 4, w - 2, h - 5, this.cSkin);

        // Skin Details (Rotting)
        drawer.pixel(x + 2, y + 9, this.cSkinShadow);
        drawer.pixel(x + w - 3, y + 3, this.cSkinLight);
        
        // Exposed Skull/Brain (Top Right) - Detailed
        drawer.fillPath([
            {x: x + w - 4, y: y},
            {x: x + w - 1, y: y + 2},
            {x: x + w - 3, y: y + 4},
            {x: x + w - 6, y: y + 1}
        ], this.cBloodDark);
        drawer.pixel(x + w - 3, y + 2, '#ffcdd2'); // Brain matter
        
        // Hair (Sparse / Balding Office Worker)
        // Comb-over strands
        drawer.pixel(x + 2, y + 1, this.cHair);
        drawer.pixel(x + 3, y + 1, this.cHair);
        drawer.pixel(x + 5, y + 2, this.cHair);
        // Side hair
        drawer.pixel(x, y + 5, this.cHair); 
        drawer.pixel(x - 1, y + 6, this.cHair);
        drawer.pixel(x + w, y + 5, this.cHair);
        drawer.pixel(x + w + 1, y + 6, this.cHair);
        
        // Eyes (Asymmetric)
        // Left Eye: Big, bulging
        drawer.rect(x + 3, y + 5, 4, 4, this.cSkinShadow); // Socket
        drawer.pixel(x + 4, y + 6, this.cEyeWhite);
        drawer.pixel(x + 5, y + 6, '#d50000'); // Red pupil dot
        
        // Right Eye: Missing/Small
        drawer.rect(x + 10, y + 6, 3, 3, this.cSkinShadow);
        drawer.pixel(x + 11, y + 7, '#000000'); // Empty socket
        // Glasses Frame (Broken)
        drawer.pixel(x + 9, y + 6, '#333333');
        drawer.pixel(x + 13, y + 6, '#333333');
        drawer.pixel(x + 10, y + 6, 'rgba(255,255,255,0.3)'); // Broken lens fragment
        
        // Mouth (Gaping)
        const mouthY = y + 9; // Fixed position (Eyes are at y+5/y+6)
        const mouthH = 2 + jawOpen;
        drawer.rect(cx - 3, mouthY, 6, mouthH, '#2e1c11'); // Dark mouth
        // Teeth
        drawer.pixel(cx - 2, mouthY, this.cBone); // Top Tooth
        drawer.pixel(cx + 1, mouthY + mouthH - 1, this.cBone); // Bottom Tooth (Moves with jaw)
        
        // Blood drips from mouth
        if (jawOpen > 0) {
            drawer.pixel(cx, mouthY + mouthH + 1, this.cBlood);
        }
    }

    drawBody(drawer, cx, cy, pose) {
        const w = 10;
        const h = 7;
        const x = cx - w/2;
        const y = cy - h + 2;
        
        // Dirty White Shirt
        drawer.rect(x, y, w, h, this.cShirt);
        
        // Stains
        drawer.pixel(x + 1, y + 5, this.cShirtStain);
        drawer.pixel(x + w - 2, y + 6, this.cShirtStain);

        // Tie (Red, loose) - Dynamic
        const tieOffset = (pose.tieAngle || 0) * 2;
        drawer.vLine(cx, y + 1, 3, this.cTie);
        drawer.pixel(cx + tieOffset, y + 4, this.cTie); 
        drawer.pixel(cx + tieOffset * 1.5, y + 5, this.cTie);
        
        // Ribcage exposed?
        drawer.rect(x + 2, y + 4, 2, 2, this.cBloodDark); // Hole
        drawer.pixel(x + 3, y + 4, this.cBone); // Rib
    }

    drawArms(drawer, cx, cy, angle) {
        // Zombie arms: Outstretched forward
        // Shoulders
        const sx = cx - 5;
        const sy = cy - 4;
        
        // Left Arm (Front)
        // Reaching out
        drawer.fillPath([
            {x: sx, y: sy},
            {x: sx - 2, y: sy + 4}, // Elbow
            {x: sx - 4, y: sy + 2}, // Hand
            {x: sx, y: sy - 1}      // Shoulder top
        ], this.cSkin);
        
        // Shirt Sleeve
        drawer.rect(sx - 1, sy, 3, 3, this.cShirt);
        
        // Right Arm (Front)
        const rx = cx + 5;
        drawer.fillPath([
            {x: rx, y: sy},
            {x: rx + 2, y: sy + 4},
            {x: rx + 4, y: sy + 2},
            {x: rx, y: sy - 1}
        ], this.cSkin);
        
        drawer.rect(rx - 2, sy, 3, 3, this.cShirt);
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
        this.drawOneLeg(drawer, cx - 4, cy, leftPose, true);
        // Right Leg (Front)
        this.drawOneLeg(drawer, cx + 1, cy, rightPose, false);
    }

    drawOneLeg(drawer, x, y, pose, isBack) {
        const legW = 3;
        const legH = 4;
        const P = this.cPants;
        const S = this.cShoes;
        const hipY = y - legH;
        
        // Simplified poses for Zombie (Shambling)
        if (pose === 'idle') {
            drawer.rect(x, hipY, legW, legH, P);
            drawer.rect(x, hipY + legH - 1, legW, 2, S);
        }
        else if (pose === 'drag') { // Dragging leg
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x - 1, hipY + 3, P); // Dragging behind
            drawer.rect(x - 2, hipY + 3, legW, 2, S);
        }
        else if (pose === 'step') { // Stepping forward
            drawer.rect(x, hipY, legW, 2, P);
            drawer.pixel(x, hipY + 2, P);
            drawer.rect(x, hipY + 3, legW, 2, S);
        }
    }
}
