import { TILE_SIZE } from '../../utils/Constants.js';
import { BreakableObject } from '../entities/BreakableObject.js';
import { Carpet } from '../entities/Carpet.js';
import { Assets } from '../../graphics/Assets.js';

export class BuildSystem {
    constructor(game) {
        this.game = game;
        this.input = game.input;
        this.worldSystem = game.worldSystem;
        this.inventorySystem = game.inventorySystem;
        
        this.active = false;
        this.preview = {
            active: false,
            x: 0,
            y: 0,
            valid: false,
            itemDef: null
        };
        
        // Cache breakable hitboxes for validation
        // type -> [hitboxes]
        this.hitboxCache = new Map();
        // type -> {x, y}
        this.drawOffsetCache = new Map();
    }
    
    update() {
        // 1. Check if we are in build mode (Player holding Placeable)
        const selectedItem = this.inventorySystem.getSelectedItem();
        
        if (!selectedItem || selectedItem.def.type !== 'placeable') {
            this.active = false;
            this.preview.active = false;
            return;
        }
        
        this.active = true;
        this.preview.active = true;
        this.preview.itemDef = selectedItem.def;
        
        // 2. Calculate Grid Position
        const mx = this.input.mouse.worldX;
        const my = this.input.mouse.worldY;
        
        // Snap to grid
        const gridX = Math.floor(mx / TILE_SIZE) * TILE_SIZE;
        const gridY = Math.floor(my / TILE_SIZE) * TILE_SIZE;
        
        this.preview.x = gridX;
        this.preview.y = gridY;
        
        // 3. Validation
        this.preview.valid = this.validatePlacement(gridX, gridY, selectedItem.def);
        
        // 4. Input Handling (Left Click to Place)
        // We assume PlayerSystem handles "using tool", but we can also check input here if we coordinate.
        // The plan says: PlayerSystem checks state. If "Hammer" (Build Mode), left click calls BuildSystem.place()
    }
    
    validatePlacement(x, y, itemDef) {
        const type = itemDef.data.breakableType;
        const isCarpet = type.startsWith('carpet_');

        // Get hitboxes for this type
        const hitboxes = this.getHitboxesForType(type);
        
        for (const hb of hitboxes) {
            const rect = {
                x: x + hb.offsetX,
                y: y + hb.offsetY,
                width: hb.width,
                height: hb.height
            };
            
            // Check Map Walls
            if (this.worldSystem.navGrid.isWallRectCollision(rect)) {
                return false;
            }
            
            // Carpets can be placed anywhere valid (floor), ignoring objects/players
            if (isCarpet) continue;

            // Check Existing Objects
            for (const obj of this.worldSystem.breakableObjects) {
                if (obj.isBroken) continue;
                
                const objHitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
                for (const ohb of objHitboxes) {
                    if (this.checkRectOverlap(rect, ohb)) {
                        return false;
                    }
                }
            }
            
            // Check Player (Prevent stuck)
            const p = this.game.player;
            const pw = p.hitboxWidth || 14;
            const ph = p.hitboxHeight || 8;
            const py = p.hitboxOffsetY || 12;
            
            const pRect = { 
                x: p.x - pw/2, 
                y: p.y + py - ph/2, 
                width: pw, 
                height: ph 
            };
            
            if (this.checkRectOverlap(rect, pRect)) {
                return false;
            }
        }
        
        return true;
    }
    
    place() {
        if (!this.active || !this.preview.valid) return false;
        
        const itemDef = this.preview.itemDef;
        const type = itemDef.data.breakableType;
        
        if (type.startsWith('carpet_')) {
            const carpet = new Carpet(this.preview.x, this.preview.y, type);
            this.worldSystem.carpets.push(carpet);
        } else {
            // Create Object
            const obj = new BreakableObject(this.preview.x, this.preview.y, type);
            this.worldSystem.breakableObjects.push(obj);
            
            // Update World
            this.worldSystem.updateFlowField();
        }
        
        // Consume Item
        // We assume InventorySystem handles slot management, but here we trigger consume
        const selectedIndex = this.inventorySystem.getSelectedSlotIndex();
        this.inventorySystem.remove(selectedIndex, 1);
        
        return true;
    }
    
    getHitboxesForType(type) {
        if (this.hitboxCache.has(type)) {
            return this.hitboxCache.get(type);
        }

        // Handle Carpet
        if (type.startsWith('carpet_')) {
             const sprite = Assets.objects[type];
             if (sprite) {
                 const hb = [{ offsetX: 0, offsetY: 0, width: sprite.width, height: sprite.height }];
                 this.hitboxCache.set(type, hb);
                 this.drawOffsetCache.set(type, {x:0, y:0});
                 return hb;
             }
        }
        
        // Instantiate a dummy object to get hitboxes
        // Note: this is safe as BreakableObject constructor is lightweight usually
        const temp = new BreakableObject(0, 0, type);
        let hitboxes = temp.getHitboxes ? temp.getHitboxes() : [temp.getHitbox()];
        
        // Normalize: getHitbox returns absolute coordinates if we passed 0,0?
        // BreakableObject: this.hitbox = { offsetX: ..., offsetY: ..., ... }
        // getHitbox() returns { x: this.x + offsetX, ... }
        // So if x=0, y=0, it returns offsets. Perfect.
        
        this.hitboxCache.set(type, hitboxes);
        
        // Also cache drawOffset while we have the temp object
        const drawOffset = temp.drawOffset || { x: 0, y: 0 };
        this.drawOffsetCache.set(type, drawOffset);
        
        return hitboxes;
    }

    getDrawOffsetForType(type) {
        if (this.drawOffsetCache.has(type)) {
            return this.drawOffsetCache.get(type);
        }
        // Fallback if not cached (should be covered by getHitboxesForType call usually)
        const temp = new BreakableObject(0, 0, type);
        const drawOffset = temp.drawOffset || { x: 0, y: 0 };
        this.drawOffsetCache.set(type, drawOffset);
        return drawOffset;
    }
    
    checkRectOverlap(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }
    
    // Called by Renderer
    drawPreview(ctx, camera) {
        if (!this.preview.active) return;
        
        const { x, y, valid, itemDef } = this.preview;
        
        ctx.save();
        
        // Draw Tinted Sprite (Semi-transparent)
        const type = itemDef.data.breakableType;
        const iconKey = itemDef.icon;
        
        let sprite = null;
        
        // 1. Try to get sprite from Assets.objects[iconKey]
        // Some keys might be different, e.g. door_h_frame
        if (Assets.objects && Assets.objects[iconKey]) {
            sprite = Assets.objects[iconKey];
        } else if (Assets[iconKey]) {
            sprite = Assets[iconKey];
        }
        
        // Handle array sprites (animations) or special cases
        if (Array.isArray(sprite)) sprite = sprite[0];
        
        if (sprite) {
            // Calculate draw position (centering or aligning?)
            // BreakableObjects usually draw at x,y (top-left) or adjusted by hitbox?
            // Most object sprites are drawn at x, y directly.
            // But some might have offsets. 
            // For now, we assume x,y is the top-left of the tile/sprite.
            
            // Apply transparency
            ctx.globalAlpha = 0.6;
            
            // Draw the sprite
            // Note: We need to handle special cases like doors which might have separate frame/panel sprites in Assets
            // But in InventorySystem, we registered door_h using 'door_h_frame' icon.
            // So if we just draw that, we get the frame. Better than nothing.
            
            const drawOffset = this.getDrawOffsetForType(type);
            const drawX = x + drawOffset.x;
            const drawY = y + drawOffset.y;

            ctx.drawImage(sprite, drawX, drawY);
            
            // If invalid, draw red tint over it
            if (!valid) {
                // We want to tint the sprite red.
                // Method: Draw a red rectangle over the sprite using source-atop to clip to the sprite's alpha.
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(231, 76, 60, 0.8)'; // Strong Red
                ctx.fillRect(drawX, drawY, sprite.width, sprite.height);
                
                // Reset composite operation for subsequent draws
                ctx.globalCompositeOperation = 'source-over';
            }
            
            ctx.globalAlpha = 1.0;
        }
        
        // Draw Footprint Rects (Keep this for debug/clarity, especially if sprite is missing)
        // If sprite exists, maybe only draw outline?
        // Let's keep the rects but make them more subtle if sprite exists.
        
        const rectAlpha = sprite ? 0.3 : 0.5;
        
        if (!valid) {
             ctx.fillStyle = `rgba(231, 76, 60, ${rectAlpha})`;
             ctx.strokeStyle = '#c0392b';
        } else {
             ctx.fillStyle = `rgba(46, 204, 113, ${rectAlpha})`;
             ctx.strokeStyle = '#2ecc71';
        }

        ctx.lineWidth = 2;
        
        const hitboxes = this.getHitboxesForType(type);
        for (const hb of hitboxes) {
            const wx = x + hb.offsetX;
            const wy = y + hb.offsetY;
            
            ctx.fillRect(wx, wy, hb.width, hb.height);
            ctx.strokeRect(wx, wy, hb.width, hb.height);
        }
        
        ctx.restore();
    }
}
