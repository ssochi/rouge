export class PixelSharder {
    static shatterSprite(sprite, material, x, y) {
        // Create a temporary canvas to read pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = sprite.width;
        canvas.height = sprite.height;
        ctx.drawImage(sprite, 0, 0);
        
        const particles = [];
        
        // Configuration based on material
        let config = {
            rows: 4,
            cols: 4,
            randomness: 0.5,
            velocity: 2,
            spin: 0.2
        };
        
        if (material === 'box' || material === 'barrel') { // Wood
            config.rows = 2; // Long horizontal strips (planks)
            config.cols = 4;
            config.velocity = 3;
            config.spin = 0.3;
        } else if (material === 'vase') { // Ceramic
            config.rows = 5;
            config.cols = 5; // Small shards
            config.velocity = 1.5;
            config.spin = 0.1;
        }
        
        const chunkW = Math.ceil(sprite.width / config.cols);
        const chunkH = Math.ceil(sprite.height / config.rows);
        
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                // Check if this chunk has visible pixels
                const sx = c * chunkW;
                const sy = r * chunkH;
                const sw = Math.min(chunkW, sprite.width - sx);
                const sh = Math.min(chunkH, sprite.height - sy);
                
                if (sw <= 0 || sh <= 0) continue;
                
                // Get pixel data to check transparency
                const pixelData = ctx.getImageData(sx, sy, sw, sh).data;
                let hasPixels = false;
                for (let i = 3; i < pixelData.length; i += 4) {
                    if (pixelData[i] > 0) {
                        hasPixels = true;
                        break;
                    }
                }
                
                if (!hasPixels) continue;
                
                // Create sub-canvas for this shard
                const shardCanvas = document.createElement('canvas');
                shardCanvas.width = sw;
                shardCanvas.height = sh;
                const shardCtx = shardCanvas.getContext('2d');
                shardCtx.drawImage(sprite, sx, sy, sw, sh, 0, 0, sw, sh);
                
                // Add particle
                const angle = (Math.random() - 0.5) * Math.PI * 2;
                const speed = Math.random() * config.velocity + 1;
                
                particles.push({
                    x: x + sx - sprite.width/2 + sw/2, // Centered relative to object
                    y: y + sy - sprite.height/2 + sh/2,
                    z: Math.random() * 10 + 5, // Start height
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    vz: Math.random() * 3 + 2, // Upward toss
                    angle: Math.random() * Math.PI * 2,
                    spin: (Math.random() - 0.5) * config.spin,
                    image: shardCanvas,
                    width: sw,
                    height: sh,
                    life: 100 + Math.random() * 50,
                    type: 'debris_texture',
                    gravity: 0.2,
                    friction: 0.95
                });
            }
        }
        
        return particles;
    }
}
