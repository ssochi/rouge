// DroppedItem.js
// Represents an item lying on the ground (Weapon or General Item)
// Features: Floating animation, collision detection, draw logic

import { Assets } from '../../graphics/Assets.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { weaponConfigIdFromItemId } from '../systems/WeaponInstanceUtils.js';

export class DroppedItem {
    constructor(x, y, itemId, count = 1, instanceData = null) {
        this.x = x;
        this.y = y;
        this.itemId = itemId;
        this.count = count;
        this.instanceData = instanceData;
        
        // Metadata resolution
        this.name = "Unknown Item";
        this.sprite = null;
        this.isWeapon = false;
        this.isConsumable = false;
        this.isCostume = false;

        this._resolveMetadata();
        
        // Float Animation State
        this.floatTimer = Math.random() * 100;
        this.floatSpeed = 0.05;
        this.floatAmplitude = 5;
        this.currentFloatY = 0;
        
        // Shadow size
        this.width = 16;
        this.height = 16;
        
        this.showHint = false;
    }

    _resolveMetadata() {
        // We need access to InventorySystem definitions ideally.
        // But DroppedItem is an entity. 
        // We can infer some things or rely on hardcoded logic if InventorySystem is not static.
        // Option 1: Pass ItemDef? No, we serialize usually.
        // Option 2: Infer from ID.
        
        if (this.itemId.startsWith('weapon:')) {
            this.isWeapon = true;
            const configId = weaponConfigIdFromItemId(this.itemId);
            if (configId && WEAPONS[configId]) {
                const conf = WEAPONS[configId];
                this.name = conf.name;
                this.sprite = Assets[conf.sprite]; // conf.sprite is 'gun' etc.
            } else {
                this.name = "Unknown Weapon";
                this.sprite = Assets.gun;
            }
        } else if (this.itemId.startsWith('placeable:')) {
            // placeable:box -> box
            const key = this.itemId.replace('placeable:', '');
            // Convert key to Name (box -> Box)
            this.name = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            
            // Sprite lookup
            if (Assets.objects && Assets.objects[key]) {
                this.sprite = Assets.objects[key];
            } else if (Assets[key]) {
                this.sprite = Assets[key];
            }
        } else if (this.itemId.startsWith('consumable:')) {
            this.isConsumable = true;
            const key = this.itemId.replace('consumable:', '');
            this.name = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (Assets[key]) {
                this.sprite = Assets[key];
            }
        } else if (this.itemId.startsWith('costume:')) {
            this.isCostume = true;
            const key = this.itemId.replace('costume:', '');
            this.name = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const iconKey = 'costume_' + key;
            if (Assets[iconKey]) {
                this.sprite = Assets[iconKey];
            }
        }
        
        // Handle array sprites (animations)
        if (Array.isArray(this.sprite)) {
            this.sprite = this.sprite[0];
        }
    }

    update(player) {
        this.floatTimer++;
        this.currentFloatY = Math.sin(this.floatTimer * this.floatSpeed) * this.floatAmplitude;
        
        if (player) {
            this.showHint = this.canInteract(player);
        } else {
            this.showHint = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        // Draw Shadow (Ground)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Item (Floating)
        if (this.sprite) {
            ctx.translate(0, this.currentFloatY);
            
            // Scale if needed
            // Weapons: 1.5x?
            // Placeables: 0.8x? (They are 32x32 usually, might be too big for a drop)
            let scale = 1.0;
            if (this.isWeapon) scale = 1.5;
            else if (this.isConsumable) scale = 1.1;
            else scale = 0.6; // Shrink large furniture
            
            ctx.scale(scale, scale);
            
            ctx.drawImage(this.sprite, -this.sprite.width/2, -this.sprite.height/2);
            
            // Draw Count if > 1
            if (this.count > 1) {
                // Restore scale for text
                ctx.scale(1/scale, 1/scale);
                ctx.fillStyle = 'white';
                ctx.font = '10px monospace';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeText(this.count, 6, 6);
                ctx.fillText(this.count, 6, 6);
            } else {
                ctx.scale(1/scale, 1/scale); // Restore scale anyway
            }
        } else {
            // Fallback
            ctx.fillStyle = 'magenta';
            ctx.fillRect(-4, -4 + this.currentFloatY, 8, 8);
        }

        ctx.restore();

        // Interaction Hint
        if (this.showHint) {
            ctx.fillStyle = '#f1c40f'; // Yellow
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] PICK UP', Math.floor(this.x), Math.floor(this.y - 20));
        }
    }
    
    // Check if player is close enough to interact
    canInteract(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist < 40; // Interaction radius
    }
}
