export class SpriteGenerator {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 根据模板生成 Sprite
     * @param {string[]} template 字符矩阵
     * @param {Object} palette 字符到颜色的映射
     * @param {number} scale 放大倍数 (默认1，生成 32x32 通常需要对应 grid)
     * @returns {HTMLCanvasElement}
     */
    generate(template, palette, scale = 1) {
        const key = JSON.stringify({ template, palette, scale });
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const height = template.length;
        const width = template[0].length;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < height; y++) {
            const row = template[y];
            for (let x = 0; x < width; x++) {
                const char = row[x];
                if (char !== ' ' && char !== '.') { // '.' and ' ' are transparent
                    const color = palette[char];
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
            }
        }

        this.cache.set(key, canvas);
        return canvas;
    }

    /**
     * 组合多个 Sprite
     * @param {HTMLCanvasElement[]} layers 
     */
    combine(layers) {
        if (layers.length === 0) return null;
        const base = layers[0];
        const canvas = document.createElement('canvas');
        canvas.width = base.width;
        canvas.height = base.height;
        const ctx = canvas.getContext('2d');

        layers.forEach(layer => {
            ctx.drawImage(layer, 0, 0);
        });

        return canvas;
    }
}

export const spriteGenerator = new SpriteGenerator();
