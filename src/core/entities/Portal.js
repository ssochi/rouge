import { TILE_SIZE } from '../../utils/Constants.js';

export class Portal {
    constructor(x, y, targetMap, label, color = '#4a90e2') {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE * 2; // 64x64
        this.height = TILE_SIZE * 2;
        this.targetMap = targetMap;
        this.label = label;
        this.color = color;
        
        // Particle system for the portal swirl effect
        this.particles = [];
        for (let i = 0; i < 50; i++) { // Increased from 20 to 50
            this.particles.push(this.createParticle());
        }
        this.showHint = false;
    }

    createParticle() {
        // Reduced radius by 30% (from width/2 - 4)
        const maxRadius = (this.width / 2 - 4) * 0.7;
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            angle: Math.random() * Math.PI * 2,
            radius: Math.random() * maxRadius,
            maxRadius: maxRadius, // Store for reset
            speed: 0.5 + Math.random() * 1.5,
            size: 1 + Math.random() * 2,
            life: Math.random() * 100
        };
    }

    update(player) {
        // Update particles
        this.particles.forEach(p => {
            p.angle += 0.05 * p.speed;
            p.life--;
            
            // Spiral movement
            // x = center + cos(angle) * radius
            // y = center + sin(angle) * radius
            
            if (p.life <= 0) {
                Object.assign(p, this.createParticle());
                p.radius = p.maxRadius; // Start from edge
            } else {
                p.radius -= 0.2; // Move towards center
                if (p.radius < 0) p.radius = p.maxRadius;
            }
        });

        // Proximity Check for Hint
        if (player) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const dx = player.x - cx;
            const dy = player.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            this.showHint = dist < 50; // Show hint within 50px
        }
    }

    draw(ctx) {
        // Draw Stone Arch (Pixel Art Style)
        const cx = Math.floor(this.x + this.width / 2);
        const cy = Math.floor(this.y + this.height / 2);
        const w = this.width;
        const h = this.height;

        // Base/Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + h - 4, w/2, 8, 0, 0, Math.PI*2);
        ctx.fill();

        // Arch Pillars
        ctx.fillStyle = '#546e7a'; // Stone Grey
        ctx.fillRect(this.x, this.y + 4, 8, h - 4); // Left Pillar
        ctx.fillRect(this.x + w - 8, this.y + 4, 8, h - 4); // Right Pillar
        
        // Arch Top
        ctx.fillRect(this.x, this.y, w, 8); // Top Lintel
        ctx.fillStyle = '#78909c'; // Highlight
        ctx.fillRect(this.x + 1, this.y + 1, w - 2, 2);

        // Inner Void (Vortex) - Semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x + 8, this.y + 8, w - 16, h - 8);
        
        // Particles (Swirling Vortex)
        ctx.fillStyle = this.color;
        this.particles.forEach(p => {
            const px = cx + Math.cos(p.angle) * p.radius;
            // Flatten Y for perspective (3D effect inside the gate)
            const py = (this.y + h/2) + Math.sin(p.angle) * p.radius * 1.2; 
            
            // Only draw if inside the arch frame
            if (px > this.x + 8 && px < this.x + w - 8 && py > this.y + 8 && py < this.y + h) {
                ctx.globalAlpha = (p.life / 100) * 0.8; // More transparent particles
                ctx.fillRect(px, py, p.size, p.size);
                ctx.globalAlpha = 1.0;
            }
        });

        // Runes on Pillars
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.4; // Pulse
        ctx.fillRect(this.x + 2, this.y + 16, 4, 4);
        ctx.fillRect(this.x + 2, this.y + 32, 4, 4);
        ctx.fillRect(this.x + w - 6, this.y + 16, 4, 4);
        ctx.fillRect(this.x + w - 6, this.y + 32, 4, 4);
        ctx.globalAlpha = 1.0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, cx, this.y - 10);

        // Interaction Hint
        if (this.showHint) {
            ctx.fillStyle = '#f1c40f'; // Yellow
            ctx.font = 'bold 7px monospace';
            ctx.fillText('[E] ENTER', cx, this.y - 22);
        }
    }
    
    getHitbox() {
        return {
            x: this.x + 16,
            y: this.y + 16,
            width: this.width - 32,
            height: this.height - 32
        };
    }
}
