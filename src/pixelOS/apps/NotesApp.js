/**
 * NotesApp - Simple text editor with yellow background
 */
import { App } from './App.js';

export class NotesApp extends App {
    constructor() {
        super('notes', 'Notes');
        this.text = '';
        this.cursorPos = 0;
        this.cursorVisible = true;
        this.cursorTimer = 0;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 120, y: 35,
            width: 160, height: 120,
            title: 'Notes',
            appId: this.id,
            app: this
        });
    }

    update() {
        this.cursorTimer++;
        if (this.cursorTimer >= 30) {
            this.cursorTimer = 0;
            this.cursorVisible = !this.cursorVisible;
        }
    }

    draw(r, x, y, w, h) {
        // Yellow notepad background
        r.fillRect(x, y, w, h, '#f5e6a3');

        // Header line
        r.fillRect(x, y, w, 1, '#c8b87a');

        // Ruled lines
        const lineH = r.lineHeight;
        for (let ly = y + lineH + 2; ly < y + h; ly += lineH) {
            r.fillRect(x + 4, ly + lineH - 2, w - 8, 1, '#d9cc8e');
        }

        // Red margin line
        r.fillRect(x + 20, y, 1, h, '#e8a0a0');

        // Text content with word wrap
        const maxChars = Math.floor((w - 26) / r.charWidth);
        const lines = this._wrapText(this.text, maxChars);
        let drawY = y + 3;

        // Find cursor position in wrapped lines
        let charCount = 0;
        let cursorLine = 0;
        let cursorCol = 0;

        for (let i = 0; i < lines.length; i++) {
            if (drawY + lineH > y + h) break;

            r.drawText(lines[i], x + 22, drawY, '#333333');

            // Track cursor position
            for (let c = 0; c < lines[i].length; c++) {
                if (charCount === this.cursorPos) {
                    cursorLine = i;
                    cursorCol = c;
                }
                charCount++;
            }
            // Check if cursor is at end of this line
            if (charCount === this.cursorPos) {
                cursorLine = i;
                cursorCol = lines[i].length;
            }

            drawY += lineH;
        }

        // Handle cursor at very end
        if (this.cursorPos >= this.text.length) {
            cursorLine = Math.max(0, lines.length - 1);
            cursorCol = lines.length > 0 ? lines[cursorLine].length : 0;
        }

        // Draw cursor
        if (this.cursorVisible) {
            const cursorX = x + 22 + cursorCol * r.charWidth;
            const cursorY = y + 3 + cursorLine * lineH;
            if (cursorY >= y && cursorY < y + h) {
                r.fillRect(cursorX, cursorY, 1, r.charHeight, '#333333');
            }
        }
    }

    _wrapText(text, maxChars) {
        if (!text) return [''];
        const lines = [];
        let current = '';

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') {
                lines.push(current);
                current = '';
            } else {
                current += text[i];
                if (current.length >= maxChars) {
                    lines.push(current);
                    current = '';
                }
            }
        }
        lines.push(current);
        return lines;
    }

    onKeyDown(key, shift, ctrl) {
        this.cursorVisible = true;
        this.cursorTimer = 0;

        if (key === 'Enter') {
            this.text = this.text.slice(0, this.cursorPos) + '\n' + this.text.slice(this.cursorPos);
            this.cursorPos++;
        } else if (key === 'Backspace') {
            if (this.cursorPos > 0) {
                this.text = this.text.slice(0, this.cursorPos - 1) + this.text.slice(this.cursorPos);
                this.cursorPos--;
            }
        } else if (key === 'ArrowLeft') {
            if (this.cursorPos > 0) this.cursorPos--;
        } else if (key === 'ArrowRight') {
            if (this.cursorPos < this.text.length) this.cursorPos++;
        } else if (ctrl && key === 'a') {
            this.cursorPos = 0;
        } else if (ctrl && key === 'e') {
            this.cursorPos = this.text.length;
        } else if (key.length === 1) {
            this.text = this.text.slice(0, this.cursorPos) + key + this.text.slice(this.cursorPos);
            this.cursorPos++;
        }
    }

    onMouseDown(lx, ly) {
        // Simple click-to-position cursor
        const lineH = 7; // renderer.lineHeight
        const charW = 5; // renderer.charWidth
        const maxChars = this.window ? Math.floor((this.window.contentWidth - 26) / charW) : 20;
        const lines = this._wrapText(this.text, maxChars);

        const clickLine = Math.floor((ly - 3) / lineH);
        const clickCol = Math.floor((lx - 22) / charW);

        if (clickLine >= 0 && clickLine < lines.length) {
            let pos = 0;
            for (let i = 0; i < clickLine; i++) {
                pos += lines[i].length;
                // Account for newlines in original text
                if (i < lines.length - 1 && pos < this.text.length && this.text[pos] === '\n') {
                    // The wrap was due to a newline, not char limit
                }
            }
            pos += Math.min(clickCol, lines[clickLine].length);
            this.cursorPos = Math.min(pos, this.text.length);
        }
    }

    onClose() {
        // Content persists since instance stays alive
    }
}
