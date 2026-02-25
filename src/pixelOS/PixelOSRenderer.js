/**
 * PixelOSRenderer - Rendering utilities for PixelOS
 * Pixel text, rounded rectangles, icons, etc.
 */

// Simple 4x5 bitmap font for basic ASCII (space to ~)
// Each char is stored as a 4-wide, 5-tall bitmask (20 bits)
const FONT_DATA = {};
const CHAR_W = 4;
const CHAR_H = 5;
const CHAR_SPACING = 1;
const LINE_HEIGHT = 7;

// Define basic font glyphs (4x5 pixel font)
function defineGlyph(ch, rows) {
    FONT_DATA[ch] = rows;
}

// Letters
defineGlyph('A', [0b0110, 0b1001, 0b1111, 0b1001, 0b1001]);
defineGlyph('B', [0b1110, 0b1001, 0b1110, 0b1001, 0b1110]);
defineGlyph('C', [0b0111, 0b1000, 0b1000, 0b1000, 0b0111]);
defineGlyph('D', [0b1110, 0b1001, 0b1001, 0b1001, 0b1110]);
defineGlyph('E', [0b1111, 0b1000, 0b1110, 0b1000, 0b1111]);
defineGlyph('F', [0b1111, 0b1000, 0b1110, 0b1000, 0b1000]);
defineGlyph('G', [0b0111, 0b1000, 0b1011, 0b1001, 0b0110]);
defineGlyph('H', [0b1001, 0b1001, 0b1111, 0b1001, 0b1001]);
defineGlyph('I', [0b1110, 0b0100, 0b0100, 0b0100, 0b1110]);
defineGlyph('J', [0b0001, 0b0001, 0b0001, 0b1001, 0b0110]);
defineGlyph('K', [0b1001, 0b1010, 0b1100, 0b1010, 0b1001]);
defineGlyph('L', [0b1000, 0b1000, 0b1000, 0b1000, 0b1111]);
defineGlyph('M', [0b1001, 0b1111, 0b1111, 0b1001, 0b1001]);
defineGlyph('N', [0b1001, 0b1101, 0b1011, 0b1001, 0b1001]);
defineGlyph('O', [0b0110, 0b1001, 0b1001, 0b1001, 0b0110]);
defineGlyph('P', [0b1110, 0b1001, 0b1110, 0b1000, 0b1000]);
defineGlyph('Q', [0b0110, 0b1001, 0b1001, 0b1010, 0b0101]);
defineGlyph('R', [0b1110, 0b1001, 0b1110, 0b1010, 0b1001]);
defineGlyph('S', [0b0111, 0b1000, 0b0110, 0b0001, 0b1110]);
defineGlyph('T', [0b1111, 0b0100, 0b0100, 0b0100, 0b0100]);
defineGlyph('U', [0b1001, 0b1001, 0b1001, 0b1001, 0b0110]);
defineGlyph('V', [0b1001, 0b1001, 0b1001, 0b0110, 0b0110]);
defineGlyph('W', [0b1001, 0b1001, 0b1111, 0b1111, 0b1001]);
defineGlyph('X', [0b1001, 0b1001, 0b0110, 0b1001, 0b1001]);
defineGlyph('Y', [0b1001, 0b1001, 0b0110, 0b0100, 0b0100]);
defineGlyph('Z', [0b1111, 0b0001, 0b0110, 0b1000, 0b1111]);

// Lowercase (same as uppercase for pixel font)
for (let c = 65; c <= 90; c++) {
    const upper = String.fromCharCode(c);
    const lower = String.fromCharCode(c + 32);
    if (FONT_DATA[upper]) FONT_DATA[lower] = FONT_DATA[upper];
}

// Numbers
defineGlyph('0', [0b0110, 0b1011, 0b1101, 0b1001, 0b0110]);
defineGlyph('1', [0b0100, 0b1100, 0b0100, 0b0100, 0b1110]);
defineGlyph('2', [0b0110, 0b1001, 0b0010, 0b0100, 0b1111]);
defineGlyph('3', [0b1110, 0b0001, 0b0110, 0b0001, 0b1110]);
defineGlyph('4', [0b1001, 0b1001, 0b1111, 0b0001, 0b0001]);
defineGlyph('5', [0b1111, 0b1000, 0b1110, 0b0001, 0b1110]);
defineGlyph('6', [0b0110, 0b1000, 0b1110, 0b1001, 0b0110]);
defineGlyph('7', [0b1111, 0b0001, 0b0010, 0b0100, 0b0100]);
defineGlyph('8', [0b0110, 0b1001, 0b0110, 0b1001, 0b0110]);
defineGlyph('9', [0b0110, 0b1001, 0b0111, 0b0001, 0b0110]);

// Symbols
defineGlyph(' ', [0b0000, 0b0000, 0b0000, 0b0000, 0b0000]);
defineGlyph('.', [0b0000, 0b0000, 0b0000, 0b0000, 0b0100]);
defineGlyph(',', [0b0000, 0b0000, 0b0000, 0b0100, 0b1000]);
defineGlyph(':', [0b0000, 0b0100, 0b0000, 0b0100, 0b0000]);
defineGlyph(';', [0b0000, 0b0100, 0b0000, 0b0100, 0b1000]);
defineGlyph('!', [0b0100, 0b0100, 0b0100, 0b0000, 0b0100]);
defineGlyph('?', [0b0110, 0b1001, 0b0010, 0b0000, 0b0010]);
defineGlyph('-', [0b0000, 0b0000, 0b1111, 0b0000, 0b0000]);
defineGlyph('+', [0b0000, 0b0100, 0b1110, 0b0100, 0b0000]);
defineGlyph('*', [0b0000, 0b1010, 0b0100, 0b1010, 0b0000]);
defineGlyph('/', [0b0001, 0b0010, 0b0100, 0b1000, 0b0000]);
defineGlyph('=', [0b0000, 0b1111, 0b0000, 0b1111, 0b0000]);
defineGlyph('(', [0b0010, 0b0100, 0b0100, 0b0100, 0b0010]);
defineGlyph(')', [0b0100, 0b0010, 0b0010, 0b0010, 0b0100]);
defineGlyph('[', [0b0110, 0b0100, 0b0100, 0b0100, 0b0110]);
defineGlyph(']', [0b0110, 0b0010, 0b0010, 0b0010, 0b0110]);
defineGlyph('~', [0b0000, 0b0000, 0b1010, 0b0101, 0b0000]);
defineGlyph('$', [0b0111, 0b1010, 0b0110, 0b0101, 0b1110]);
defineGlyph('@', [0b0110, 0b1011, 0b1011, 0b1000, 0b0111]);
defineGlyph('#', [0b1010, 0b1111, 0b1010, 0b1111, 0b1010]);
defineGlyph('%', [0b1001, 0b0010, 0b0100, 0b1000, 0b1001]);
defineGlyph('^', [0b0100, 0b1010, 0b0000, 0b0000, 0b0000]);
defineGlyph('&', [0b0100, 0b1010, 0b0100, 0b1010, 0b0101]);
defineGlyph('_', [0b0000, 0b0000, 0b0000, 0b0000, 0b1111]);
defineGlyph('"', [0b1010, 0b1010, 0b0000, 0b0000, 0b0000]);
defineGlyph("'", [0b0100, 0b0100, 0b0000, 0b0000, 0b0000]);
defineGlyph('<', [0b0010, 0b0100, 0b1000, 0b0100, 0b0010]);
defineGlyph('>', [0b1000, 0b0100, 0b0010, 0b0100, 0b1000]);
defineGlyph('\\', [0b1000, 0b0100, 0b0010, 0b0001, 0b0000]);
defineGlyph('|', [0b0100, 0b0100, 0b0100, 0b0100, 0b0100]);
defineGlyph('{', [0b0011, 0b0010, 0b0100, 0b0010, 0b0011]);
defineGlyph('}', [0b1100, 0b0100, 0b0010, 0b0100, 0b1100]);
defineGlyph('`', [0b1000, 0b0100, 0b0000, 0b0000, 0b0000]);

export class PixelOSRenderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    clear(color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /** Draw pixel text */
    drawText(text, x, y, color = '#ffffff', scale = 1) {
        this.ctx.fillStyle = color;
        let cursorX = x;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const glyph = FONT_DATA[ch];
            if (glyph) {
                for (let row = 0; row < CHAR_H; row++) {
                    for (let col = 0; col < CHAR_W; col++) {
                        if (glyph[row] & (1 << (CHAR_W - 1 - col))) {
                            this.ctx.fillRect(
                                cursorX + col * scale,
                                y + row * scale,
                                scale,
                                scale
                            );
                        }
                    }
                }
            }
            cursorX += (CHAR_W + CHAR_SPACING) * scale;
        }
    }

    /** Measure text width in pixels */
    measureText(text, scale = 1) {
        return text.length * (CHAR_W + CHAR_SPACING) * scale - CHAR_SPACING * scale;
    }

    /** Draw text right-aligned */
    drawTextRight(text, x, y, color = '#ffffff', scale = 1) {
        const w = this.measureText(text, scale);
        this.drawText(text, x - w, y, color, scale);
    }

    /** Draw text centered */
    drawTextCentered(text, cx, y, color = '#ffffff', scale = 1) {
        const w = this.measureText(text, scale);
        this.drawText(text, cx - w / 2, y, color, scale);
    }

    /** Draw filled rectangle */
    fillRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }

    /** Draw rounded rectangle (pixel-style with cut corners) */
    fillRoundRect(x, y, w, h, r, color) {
        x = Math.floor(x);
        y = Math.floor(y);
        w = Math.floor(w);
        h = Math.floor(h);
        r = Math.min(r, Math.floor(w / 2), Math.floor(h / 2));
        this.ctx.fillStyle = color;
        // Main body
        this.ctx.fillRect(x + r, y, w - 2 * r, h);
        // Left/right strips
        this.ctx.fillRect(x, y + r, r, h - 2 * r);
        this.ctx.fillRect(x + w - r, y + r, r, h - 2 * r);
        // Corners (just fill small rects for pixel look)
        for (let i = 0; i < r; i++) {
            const offset = r - i - 1;
            this.ctx.fillRect(x + offset, y + i, r - offset, 1);
            this.ctx.fillRect(x + w - r, y + i, r - offset, 1);
            this.ctx.fillRect(x + offset, y + h - 1 - i, r - offset, 1);
            this.ctx.fillRect(x + w - r, y + h - 1 - i, r - offset, 1);
        }
    }

    /** Draw outlined rectangle */
    strokeRect(x, y, w, h, color) {
        x = Math.floor(x);
        y = Math.floor(y);
        w = Math.floor(w);
        h = Math.floor(h);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, 1);
        this.ctx.fillRect(x, y + h - 1, w, 1);
        this.ctx.fillRect(x, y, 1, h);
        this.ctx.fillRect(x + w - 1, y, 1, h);
    }

    /** Draw a horizontal gradient */
    fillGradientV(x, y, w, h, colorTop, colorBot) {
        const r1 = parseInt(colorTop.slice(1, 3), 16);
        const g1 = parseInt(colorTop.slice(3, 5), 16);
        const b1 = parseInt(colorTop.slice(5, 7), 16);
        const r2 = parseInt(colorBot.slice(1, 3), 16);
        const g2 = parseInt(colorBot.slice(3, 5), 16);
        const b2 = parseInt(colorBot.slice(5, 7), 16);
        for (let row = 0; row < h; row++) {
            const t = row / (h - 1 || 1);
            const r = Math.round(r1 + (r2 - r1) * t);
            const g = Math.round(g1 + (g2 - g1) * t);
            const b = Math.round(b1 + (b2 - b1) * t);
            this.ctx.fillStyle = `rgb(${r},${g},${b})`;
            this.ctx.fillRect(Math.floor(x), Math.floor(y + row), Math.floor(w), 1);
        }
    }

    /** Draw a single pixel */
    pixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }

    /** Draw a filled circle (pixel-style) */
    fillCircle(cx, cy, r, color) {
        this.ctx.fillStyle = color;
        cx = Math.floor(cx);
        cy = Math.floor(cy);
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    this.ctx.fillRect(cx + dx, cy + dy, 1, 1);
                }
            }
        }
    }

    /** Draw Apple logo (simplified pixel version, 5x7) */
    drawAppleLogo(x, y, color = '#ffffff') {
        const logo = [
            '  # ',
            ' ## ',
            '####',
            '####',
            '####',
            ' ## ',
            ' # #',
        ];
        this.ctx.fillStyle = color;
        for (let row = 0; row < logo.length; row++) {
            for (let col = 0; col < logo[row].length; col++) {
                if (logo[row][col] === '#') {
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    /** Get line height for text layout */
    get lineHeight() {
        return LINE_HEIGHT;
    }

    get charWidth() {
        return CHAR_W + CHAR_SPACING;
    }

    get charHeight() {
        return CHAR_H;
    }
}
