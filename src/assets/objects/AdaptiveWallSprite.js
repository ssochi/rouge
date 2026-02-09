import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createAdaptiveWallSprites() {
    // Generates 16 sprites for 4-bit masking
    // Mask: North=1, East=2, South=4, West=8
    const sprites = [];
    
    // Config
    const tileSize = 32;
    const wallHeight = 16; // Visual height (projection up)
    const wallThickness = 12; // Thickness of the wall arms
    const centerStart = (tileSize - wallThickness) / 2; // 10
    const centerEnd = centerStart + wallThickness; // 22
    
    // Colors
    const cTop = '#95a5a6'; // Light Concrete
    const cFront = '#7f8c8d'; // Dark Concrete (Shadow)
    const cOutline = '#546e7a';
    const cHighlight = '#bdc3c7';

    for (let mask = 0; mask < 16; mask++) {
        // Canvas height needs to accommodate the projection
        // We draw the "Footprint" at y=16 (shifted down) so the Top Face ends up at y=0?
        // Let's use a 32x48 canvas.
        // Tile Footprint is at y=16 to y=48.
        // Top Face (projected up by 16) is at y=0 to y=32.
        const drawer = new PixelDraw(tileSize, tileSize + wallHeight);
        
        const hasNorth = (mask & 1) !== 0;
        const hasEast = (mask & 2) !== 0;
        const hasSouth = (mask & 4) !== 0;
        const hasWest = (mask & 8) !== 0;
        
        // Define Footprint Rectangles (Relative to Tile Origin 0,0)
        // We will then draw them at (x, y + wallHeight) for Front Face Base
        // and (x, y) for Top Face
        
        const rects = [];
        
        // Center (Always present)
        rects.push({x: centerStart, y: centerStart, w: wallThickness, h: wallThickness});
        
        // North Arm
        if (hasNorth) {
            rects.push({x: centerStart, y: 0, w: wallThickness, h: centerStart});
        }
        
        // South Arm
        if (hasSouth) {
            rects.push({x: centerStart, y: centerEnd, w: wallThickness, h: tileSize - centerEnd});
        }
        
        // West Arm
        if (hasWest) {
            rects.push({x: 0, y: centerStart, w: centerStart, h: wallThickness});
        }
        
        // East Arm
        if (hasEast) {
            rects.push({x: centerEnd, y: centerStart, w: tileSize - centerEnd, h: wallThickness});
        }
        
        // Drawing Order:
        // 1. Front Faces (Depth)
        // Draw these first.
        // For each rect, we check if we need to draw a South-facing Front Face.
        // We draw a Front Face at the BOTTOM edge of the rect.
        // UNLESS that edge connects to a neighbor (South Arm connecting to South Edge).
        
        rects.forEach(r => {
            const bottomY = r.y + r.h;
            
            // Should we draw Front Face?
            // If this is the South Arm and hasSouth is true, bottomY is 32. Don't draw.
            // If this is Center and hasSouth is true, bottomY is 22. It's covered by South Arm. Don't draw.
            // Wait, simpler: Merge rects into a single shape or just draw carefully.
            
            // Logic:
            // If we have a South Arm:
            //   - Center bottom (22) is covered.
            //   - North bottom (10) is covered.
            //   - South bottom (32) connects to neighbor (Don't draw front face).
            //   - West/East arms bottom (22) are EXPOSED. Draw front face.
            
            // If we DO NOT have a South Arm:
            //   - Center bottom (22) is EXPOSED. Draw front face.
            //   - North bottom (10) is covered by Center.
            //   - West/East arms bottom (22) are EXPOSED. Draw front face.
            
            let drawFace = false;
            
            // Check based on which part this is
            // Center
            if (r.y === centerStart && r.x === centerStart) {
                if (!hasSouth) drawFace = true;
            }
            // North
            else if (r.y === 0) {
                // Always covered by center
                drawFace = false;
            }
            // South
            else if (r.y === centerEnd) {
                // Connects to edge. If we assume seamless tiling, no face needed.
                drawFace = false;
            }
            // West
            else if (r.x === 0) {
                // Bottom edge is at centerEnd (22). Always exposed unless... wait.
                // West arm bottom edge is at y=22.
                // Is there anything south of it? No, unless the wall is super thick.
                // So yes, exposed.
                drawFace = true;
            }
            // East
            else if (r.x === centerEnd) {
                drawFace = true;
            }
            
            if (drawFace) {
                // Draw Front Face
                // Extends from Top Face Level (r.y) down to Bottom (r.y + wallHeight)?
                // No. Top Face is drawn at `y`. Front Face extends from `y + wallHeight` downwards?
                // Let's stick to the projection model:
                // Top Face is at `r.y` (on canvas).
                // Visual Base is at `r.y + wallHeight`.
                // So Front Face is the vertical rect from `r.y + wallHeight` (bottom of top face) down to `r.y + wallHeight + wallHeight`?
                // No.
                // Let's say Sprite Y=0 corresponds to World Z=Height.
                // Sprite Y=16 corresponds to World Z=0 (Ground).
                // Top Face is drawn at `r.y`. (Visual Height Z=16).
                // Front Face connects `r.y + r.h` (Top Face Edge) down to `r.y + r.h + wallHeight` (Ground).
                // Wait, `r.y` is the 2D footprint coordinate.
                // If we map Footprint(0,0) to Canvas(0, 16).
                // Then Top Face is at Canvas(0, 0).
                // So Top Face is shifted UP by 16.
                
                // Correct logic:
                // Canvas Y range 0..48.
                // Footprint Y range 0..32.
                // Top Face Y = Footprint Y (0..32).
                // Visual Base Y = Footprint Y + 16 (16..48).
                
                // Front Face for a horizontal segment (like West Arm):
                // Footprint Bottom Edge is at Y=22.
                // Top Face Bottom Edge is at Y=22.
                // Visual Base Bottom Edge is at Y=22+16 = 38.
                // So Front Face is rect from Y=22 to Y=38.
                
                const faceX = r.x;
                const faceY = r.y + r.h; // Start at Top Face Edge
                const faceW = r.w;
                const faceH = wallHeight; // Extend down to ground
                
                drawer.rect(faceX, faceY, faceW, faceH, cFront);
                // Side highlights for Front Face
                drawer.vLine(faceX, faceY, faceH, cOutline);
                drawer.vLine(faceX + faceW - 1, faceY, faceH, cOutline);
                drawer.hLine(faceX, faceY + faceH - 1, faceW, cOutline);
            }
        });

        // 2. Top Faces (Light)
        // Draw these shifted "up" relative to the base.
        // In our coordinate system above, Top Face is drawn at r.y.
        // (Because we defined the "Front Face" as extending down from r.y + r.h)
        
        rects.forEach(r => {
            drawer.rect(r.x, r.y, r.w, r.h, cTop);
        });
        
        // 3. Outlines / Highlights for Top Face
        // We need to merge the rects to draw a clean outline, or just stroke rects and accept overlap?
        // Overlap outlines look bad (internal lines).
        // Better to draw highlights manually based on connectivity.
        
        // Draw Highlight (Top/Left edges)
        // Center
        if (!hasNorth) drawer.hLine(centerStart, centerStart, wallThickness, cHighlight); // Top
        if (!hasWest) drawer.vLine(centerStart, centerStart, wallThickness, cHighlight); // Left
        
        // North Arm
        if (hasNorth) {
            drawer.vLine(centerStart, 0, centerStart, cHighlight); // Left
            // No top highlight (connects)
        }
        
        // West Arm
        if (hasWest) {
            drawer.hLine(0, centerStart, centerStart, cHighlight); // Top
            // No left highlight (connects)
        }
        
        // East Arm
        if (hasEast) {
            drawer.hLine(centerEnd, centerStart, tileSize-centerEnd, cHighlight); // Top
        }
        
        // South Arm
        if (hasSouth) {
            drawer.vLine(centerStart, centerEnd, tileSize-centerEnd, cHighlight); // Left
        }
        
        // Outlines (Right/Bottom edges of Top Face)
        // Center
        if (!hasEast) drawer.vLine(centerEnd-1, centerStart, wallThickness, cOutline); // Right
        if (!hasSouth) drawer.hLine(centerStart, centerEnd-1, wallThickness, cOutline); // Bottom
        
        // North Arm
        if (hasNorth) {
            drawer.vLine(centerEnd-1, 0, centerStart, cOutline); // Right
        }
        
        // South Arm
        if (hasSouth) {
            drawer.vLine(centerEnd-1, centerEnd, tileSize-centerEnd, cOutline); // Right
        }
        
        // West Arm
        if (hasWest) {
            drawer.hLine(0, centerEnd-1, centerStart, cOutline); // Bottom
        }
        
        // East Arm
        if (hasEast) {
            drawer.hLine(centerEnd, centerEnd-1, tileSize-centerEnd, cOutline); // Bottom
        }
        
        // 4. Inner Corners (Where arms meet center)
        // If we have North and East, we have a corner at (22, 10).
        // It's an internal corner.
        
        sprites.push(drawer.getCanvas());
    }
    
    return sprites;
}
