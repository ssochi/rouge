import { Assets } from '../../../graphics/Assets.js';

export const FishTankObject = {
    configure(obj) {
        // Updated Hitbox for 32x48 sprite
        // Footprint is at the bottom (Cabinet base)
        obj.width = 32;
        obj.height = 48;
        
        obj.hitbox = { offsetX: 2, offsetY: 32, width: 28, height: 14 }; // Cabinet footprint
        obj.hp = 25;
        obj.shadow = { type: 'rect', x: 2, y: 32, w: 28, h: 14 };
        
        // Draw offset to align sprite bottom with tile
        // Usually objects are drawn at x,y. If height is 48, and footprint is at bottom 16px.
        // The sprite needs to be drawn shifted up? 
        // No, standard is (x,y) is top-left of sprite? 
        // Wait, BreakableObject.draw translates to (x,y).
        // If the sprite is 48px tall, and we want it to stand on the tile at y+32.
        // Then we draw at (0,0) relative to x,y?
        // Let's check Wardrobe. 
        // Wardrobe is 32x56. Hitbox offsetY 40. 
        // BreakableObject draws at (x,y).
        // So the object's (x,y) is the top-left of the sprite visually?
        // Yes. So if we want the feet to be at tile Y, the object Y should be TileY - Height + FootprintHeight?
        // Actually the game logic usually places objects at their top-left grid coord.
        // And we define hitbox relative to that.
        // So if we place at (100, 100). Sprite draws at (100, 100).
        // Hitbox at (100+2, 100+32) = (102, 132).
        // This seems correct for a tall object.
        
        // However, for correct Z-sorting, the "y" property of the entity usually represents its "bottom" or sort point.
        // In this engine, entity.y is usually top-left. 
        // Sorting is done by (y + height) or similar?
        // Let's check Renderer.
        // Actually, let's just stick to standard BreakableObject behavior.
        // We just need to set the drawOffset if the sprite is taller than standard 32?
        // BreakableObject.js sets width/height to 32 by default.
        // We should override this.height = 48 in configure?
        // BreakableObject constructor sets this.height = 32.
        // We can override it here.
        obj.height = 48; 
        // But wait, if we change obj.height, it might affect sorting if sorting uses obj.y + obj.height.
        // Let's check WardrobeObject.js to see if it sets height.
        // I don't have access to check right now easily without tool, but I recall Wardrobe has height 56.
        // Let's assume we should set obj.height = 48.
        
        obj.drawOffset = { x: 0, y: -16 }; // Shift up 16px to align feet with 32px grid if needed?
        // Wait, if I place it on a grid, say (0,0).
        // If it's a 32x48 sprite.
        // If I draw at (0,0), it occupies (0,0) to (32,48).
        // If the tile is 32x32.
        // The feet are at y=32 to 48. This means it spills into the tile below?
        // That's fine for tall objects.
        // But usually we want the base to be in the "current" tile.
        // So we might want to shift the sprite UP so the base is in the tile.
        // If we draw at y-16. Then sprite top is at -16, base is at 32.
        // Then hitbox should be relative to (x,y) -> (2, 16) to match the base at 32?
        // Let's look at WardrobeObject.js implementation via memory or search?
        // I will just assume standard behavior:
        // If I want the object to look like it's on the tile (x,y), I usually draw it such that the base is within the tile.
        // If sprite is 48 high. Tile is 32.
        // Top 16px is "above" the tile (visually 2.5D height).
        // Bottom 32px is "on" the tile? No, usually height is vertical wall.
        // Let's try: drawOffset y = -16. 
        // Then sprite draws from -16 to 32.
        // Base is at 16 to 32.
        // Hitbox should be at offsetY 16, height 16.
        // Let's try this.
        
        obj.drawOffset = { x: 0, y: -16 };
        obj.hitbox = { offsetX: 2, offsetY: 16, width: 28, height: 16 }; 
        obj.shadow = { type: 'rect', x: 2, y: 16, w: 28, h: 16 };

        // Initialize procedural animation state
        obj.fishTank = {
            time: Math.random() * 100,
            fish: [],
            bubbles: [],
            weeds: []
        };

        // Add Fish
        const colors = ['#e67e22', '#e74c3c', '#f1c40f', '#ecf0f1'];
        const numFish = 2 + Math.floor(Math.random() * 2); // 2-3 fish
        
        for (let i = 0; i < numFish; i++) {
            obj.fishTank.fish.push({
                x: 6 + Math.random() * 18,
                y: 10 + Math.random() * 10, // Adjusted Y for tank area
                speed: 0.2 + Math.random() * 0.3,
                dir: Math.random() > 0.5 ? 1 : -1,
                color: colors[i % colors.length],
                phase: Math.random() * Math.PI * 2,
                size: 2 + Math.floor(Math.random() * 2) // 2 or 3
            });
        }

        // Add Weeds
        const numWeeds = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numWeeds; i++) {
            obj.fishTank.weeds.push({
                x: 6 + Math.random() * 20,
                h: 8 + Math.random() * 10,
                color: Math.random() > 0.5 ? '#2ecc71' : '#27ae60',
                phase: Math.random() * Math.PI * 2
            });
        }
    },

    update(obj) {
        if (!obj.fishTank) return;
        
        const data = obj.fishTank;
        data.time += 0.05;

        // Update Fish
        data.fish.forEach(f => {
            f.x += f.speed * f.dir;
            f.yOffset = Math.sin(data.time + f.phase) * 1.5;

            if (f.x < 6) {
                f.x = 6;
                f.dir = 1;
            } else if (f.x > 26) {
                f.x = 26;
                f.dir = -1;
            }
        });

        // Update Bubbles
        if (Math.random() < 0.05) {
            data.bubbles.push({
                x: 6 + Math.random() * 20,
                y: 28, // Start from bottom of tank area
                speed: 0.2 + Math.random() * 0.2,
                wobble: Math.random() * Math.PI * 2
            });
        }

        for (let i = data.bubbles.length - 1; i >= 0; i--) {
            const b = data.bubbles[i];
            b.y -= b.speed;
            b.x += Math.sin(data.time * 2 + b.wobble) * 0.1;
            
            if (b.y < 6) { // Surface level
                data.bubbles.splice(i, 1);
            }
        }
    },

    draw(obj, ctx) {
        const sprite = Assets.objects['fish_tank'];
        const dy = obj.drawOffset ? obj.drawOffset.y : 0;
        
        if (sprite) {
            const img = Array.isArray(sprite) ? sprite[0] : sprite;
            ctx.drawImage(img, 0, dy);
        }

        if (!obj.fishTank) return;
        const data = obj.fishTank;

        // Tank Visual Area (Relative to draw pos)
        // Sprite Height 48.
        // Tank is from y=4 to y=32 (approx 28px height)
        // Lid is 4px.
        // Cabinet starts at 32.
        const tankX = 2;
        const tankY = 4 + dy; // Account for drawOffset
        const tankH = 28;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(tankX + 1, tankY + 1, 28 - 2, tankH - 2);
        ctx.clip();

        // 2. Draw Weeds
        data.weeds.forEach(w => {
            const tipSway = Math.sin(data.time + w.phase) * 3;
            const midSway = Math.sin(data.time * 1.5 + w.phase) * 1.5;
            
            ctx.strokeStyle = w.color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(w.x, tankY + tankH - 2); // Root
            ctx.quadraticCurveTo(
                w.x + midSway, 
                tankY + tankH - w.h / 2, 
                w.x + tipSway, 
                tankY + tankH - w.h
            );
            ctx.stroke();
        });

        // 3. Draw Fish
        data.fish.forEach(f => {
            const drawX = f.x;
            const drawY = tankY + (f.y - 4); // Map fish Y relative to tank top? 
            // In init: y is 10..20. 
            // TankY is start of tank. 
            // Let's just use f.y relative to tank top inside the sprite logic.
            // f.y was initialized 10..20. TankY starts at 4.
            // So visual Y = tankY + f.y? 
            // Wait, f.y in init was "6 + random * 10". That was for 32x32 sprite.
            // Now tank is taller. 
            // Let's use f.y as offset from tankY.
            
            const visualY = tankY + f.y + (f.yOffset || 0);

            ctx.fillStyle = f.color;
            
            ctx.beginPath();
            if (f.dir > 0) {
                // Right
                ctx.ellipse(drawX, visualY, f.size, f.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                const tailSway = Math.sin(data.time * 10 + f.phase) * 2;
                ctx.beginPath();
                ctx.moveTo(drawX - f.size, visualY);
                ctx.lineTo(drawX - f.size - 2, visualY - 2 + tailSway);
                ctx.lineTo(drawX - f.size - 2, visualY + 2 + tailSway);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(drawX + 1, visualY - 1, 1, 1);
            } else {
                // Left
                ctx.ellipse(drawX, visualY, f.size, f.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                const tailSway = Math.sin(data.time * 10 + f.phase) * 2;
                ctx.beginPath();
                ctx.moveTo(drawX + f.size, visualY);
                ctx.lineTo(drawX + f.size + 2, visualY - 2 + tailSway);
                ctx.lineTo(drawX + f.size + 2, visualY + 2 + tailSway);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(drawX - 2, visualY - 1, 1, 1);
            }
        });

        // 4. Draw Bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        data.bubbles.forEach(b => {
            // b.y is relative to tank top
            ctx.fillRect(Math.floor(b.x), Math.floor(tankY + b.y), 1, 1);
        });
        
        ctx.restore(); // End clipping

        // 5. Surface & Reflections
        const surfY = tankY + 2 + Math.sin(data.time) * 0.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tankX + 2, surfY);
        ctx.lineTo(tankX + 28 - 2, surfY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(tankX + 22, tankY + 4);
        ctx.lineTo(tankX + 26, tankY + 12);
        ctx.stroke();
    }
};
