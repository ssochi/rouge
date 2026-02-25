/**
 * Wallpaper - Pixel art wallpaper for PixelOS desktop
 * Mountain sunset landscape
 */

/**
 * Draw a pixel art wallpaper to an offscreen canvas
 * @param {number} w - width
 * @param {number} h - height
 * @returns {HTMLCanvasElement}
 */
export function drawPixelWallpaper(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Sky gradient: deep purple to warm orange sunset
    const skyColors = [
        '#1a0533', '#2d1b4e', '#4a2060', '#6b2d6e',
        '#8e3a6e', '#b04a5e', '#d06040', '#e88030',
        '#f0a040', '#f8c050'
    ];
    const bandH = Math.ceil(h / skyColors.length);
    for (let i = 0; i < skyColors.length; i++) {
        ctx.fillStyle = skyColors[i];
        ctx.fillRect(0, i * bandH, w, bandH + 1);
    }

    // Sun
    const sunX = Math.floor(w * 0.65);
    const sunY = Math.floor(h * 0.35);
    const sunR = 18;
    // Sun glow
    ctx.fillStyle = 'rgba(255, 180, 60, 0.15)';
    for (let r = sunR + 12; r > sunR; r -= 2) {
        _fillCircle(ctx, sunX, sunY, r);
    }
    // Sun body
    ctx.fillStyle = '#ffe080';
    _fillCircle(ctx, sunX, sunY, sunR);
    ctx.fillStyle = '#fff0b0';
    _fillCircle(ctx, sunX, sunY, sunR - 4);

    // Stars (only in upper sky)
    ctx.fillStyle = '#ffffff';
    const starSeed = 42;
    for (let i = 0; i < 30; i++) {
        const sx = _hash(i * 3 + starSeed) % w;
        const sy = _hash(i * 7 + starSeed) % Math.floor(h * 0.35);
        const brightness = 0.3 + (_hash(i * 11 + starSeed) % 70) / 100;
        ctx.globalAlpha = brightness;
        ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Far mountains (dark purple silhouette)
    _drawMountainRange(ctx, w, h, {
        baseY: h * 0.55,
        amplitude: h * 0.2,
        frequency: 0.008,
        seed: 100,
        color: '#2a1040'
    });

    // Mid mountains (dark blue)
    _drawMountainRange(ctx, w, h, {
        baseY: h * 0.65,
        amplitude: h * 0.18,
        frequency: 0.012,
        seed: 200,
        color: '#1a2040'
    });

    // Near mountains (dark teal)
    _drawMountainRange(ctx, w, h, {
        baseY: h * 0.78,
        amplitude: h * 0.15,
        frequency: 0.018,
        seed: 300,
        color: '#0a1a2a'
    });

    // Ground / water reflection area
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, Math.floor(h * 0.85), w, Math.floor(h * 0.15));

    // Water reflection (horizontal lines)
    for (let ry = Math.floor(h * 0.86); ry < h; ry += 2) {
        const alpha = 0.05 + (ry - h * 0.86) / (h * 0.14) * 0.08;
        ctx.fillStyle = `rgba(255, 160, 60, ${alpha})`;
        const rw = 20 + Math.floor(Math.random() * 40);
        const rx = sunX - rw / 2 + (Math.random() - 0.5) * 10;
        ctx.fillRect(Math.floor(rx), ry, rw, 1);
    }

    // Foreground trees (tiny silhouettes)
    ctx.fillStyle = '#050810';
    const treeY = Math.floor(h * 0.82);
    for (let i = 0; i < 25; i++) {
        const tx = _hash(i * 13 + 500) % w;
        const th = 8 + _hash(i * 17 + 500) % 12;
        const tw = 3 + _hash(i * 19 + 500) % 4;
        // Trunk
        ctx.fillRect(tx, treeY - th, 1, th);
        // Canopy (triangle)
        for (let ty = 0; ty < th * 0.6; ty++) {
            const halfW = Math.floor(tw * (1 - ty / (th * 0.6)));
            if (halfW > 0) {
                ctx.fillRect(tx - halfW, treeY - th + ty, halfW * 2 + 1, 1);
            }
        }
    }

    return canvas;
}

function _fillCircle(ctx, cx, cy, r) {
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r * r) {
                ctx.fillRect(cx + dx, cy + dy, 1, 1);
            }
        }
    }
}

function _drawMountainRange(ctx, w, h, opts) {
    ctx.fillStyle = opts.color;
    for (let x = 0; x < w; x++) {
        const noise = _noise(x * opts.frequency, opts.seed);
        const peakY = opts.baseY - opts.amplitude * noise;
        ctx.fillRect(x, Math.floor(peakY), 1, Math.floor(h - peakY));
    }
}

// Simple deterministic hash for pseudo-random star placement
function _hash(n) {
    n = ((n >> 16) ^ n) * 0x45d9f3b;
    n = ((n >> 16) ^ n) * 0x45d9f3b;
    n = (n >> 16) ^ n;
    return Math.abs(n);
}

// Simple value noise
function _noise(x, seed) {
    const i = Math.floor(x);
    const f = x - i;
    const a = _hashF(i + seed);
    const b = _hashF(i + 1 + seed);
    // Smoothstep interpolation
    const t = f * f * (3 - 2 * f);
    return a + (b - a) * t;
}

function _hashF(n) {
    const h = _hash(Math.floor(n));
    return (h % 1000) / 1000;
}
