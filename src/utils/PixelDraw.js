
export class PixelDraw {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        // Disable smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false; 
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        return this;
    }

    /**
     * Draw a filled rectangle
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @param {string} color Hex code
     */
    rect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        return this;
    }

    /**
     * Draw a rectangle outline
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @param {string} color 
     */
    strokeRect(x, y, w, h, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        // Offset by 0.5 for crisp 1px lines
        this.ctx.strokeRect(x + 0.5, y + 0.5, w, h);
        return this;
    }

    /**
     * Draw a single pixel
     * @param {number} x 
     * @param {number} y 
     * @param {string} color 
     */
    pixel(x, y, color) {
        return this.rect(x, y, 1, 1, color);
    }
    
    /**
     * Draw a horizontal line
     * @param {number} x 
     * @param {number} y 
     * @param {number} length 
     * @param {string} color 
     */
    hLine(x, y, length, color) {
        return this.rect(x, y, length, 1, color);
    }

    /**
     * Draw a vertical line
     * @param {number} x 
     * @param {number} y 
     * @param {number} length 
     * @param {string} color 
     */
    vLine(x, y, length, color) {
        return this.rect(x, y, 1, length, color);
    }

    /**
     * Draw a line between two points
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     * @param {string} color 
     */
    line(x1, y1, x2, y2, color) {
        return this.strokePath([{x: x1, y: y1}, {x: x2, y: y2}], color);
    }

    /**
     * Draw a circle (approximate for pixel art)
     * @param {number} cx Center X
     * @param {number} cy Center Y
     * @param {number} radius 
     * @param {string} color 
     */
    circle(cx, cy, radius, color) {
        // Bresenham or simple iteration
        // For filled circle:
        let r2 = radius * radius;
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x*x + y*y <= r2) {
                    this.pixel(cx + x, cy + y, color);
                }
            }
        }
        return this;
    }

    /**
     * Draw a filled ellipse
     * @param {number} cx Center X
     * @param {number} cy Center Y
     * @param {number} rx Radius X
     * @param {number} ry Radius Y
     * @param {string} color 
     */
    ellipse(cx, cy, rx, ry, color) {
        for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
                if ((x*x)/(rx*rx) + (y*y)/(ry*ry) <= 1) {
                    this.pixel(cx + x, cy + y, color);
                }
            }
        }
        return this;
    }

    /**
     * Draw a filled path (polygon)
     * @param {Array<{x: number, y: number}>} points 
     * @param {string} color 
     */
    fillPath(points, color) {
        if (points.length < 3) return this;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        return this;
    }

    /**
     * Draw a path outline
     * @param {Array<{x: number, y: number}>} points 
     * @param {string} color 
     */
    strokePath(points, color) {
        if (points.length < 2) return this;

        // For pixel art, stroke() might be anti-aliased or blurry.
        // We can either disable smoothing (already done) or draw lines manually.
        // Let's rely on canvas stroke but with small lineWidth for now, 
        // or implement Bresenham line for each segment if needed.
        // Given ctx.imageSmoothingEnabled = false, stroke should be aliased but maybe not perfect single pixel.
        // Let's stick to fill for shapes mostly.
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x + 0.5, points[0].y + 0.5); // Offset for crisp lines
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x + 0.5, points[i].y + 0.5);
        }
        this.ctx.stroke();
        return this;
    }

    /**
     * Draw a quadratic bezier curve (filled)
     * Useful for vase/barrel sides
     * @param {number} startX 
     * @param {number} startY 
     * @param {number} cpX Control Point X
     * @param {number} cpY Control Point Y
     * @param {number} endX 
     * @param {number} endY 
     * @param {string} color 
     */
    fillQuadCurve(startX, startY, cpX, cpY, endX, endY, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        // Close shape for filling (connect end to start)
        this.ctx.lineTo(startX, startY); 
        this.ctx.fill();
        return this;
    }

    /**
     * Get the resulting canvas
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Helper to create a canvas with specific size
     * @param {number} width 
     * @param {number} height 
     * @returns {HTMLCanvasElement}
     */
    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * Create a white silhouette (flash sprite) from a source canvas
     * @param {HTMLCanvasElement} sourceCanvas 
     * @param {string} color Default white
     * @returns {HTMLCanvasElement}
     */
    static createSilhouette(sourceCanvas, color = '#ffffff') {
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        const ctx = canvas.getContext('2d');

        // 1. Fill with target color
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Mask with source image (keep color only where source is opaque)
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // Reset
        ctx.globalCompositeOperation = 'source-over';
        
        return canvas;
    }
}
