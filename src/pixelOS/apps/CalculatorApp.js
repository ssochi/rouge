/**
 * CalculatorApp - Simple calculator with 4x5 button grid
 */
import { App } from './App.js';

export class CalculatorApp extends App {
    constructor() {
        super('calculator', 'Calculator');
        this.display = '0';
        this.accumulator = 0;
        this.operator = null;
        this.waitingForOperand = false;
        this.hoveredBtn = null;
        this.pressedBtn = null;

        // Button layout: 4 columns x 5 rows
        this.buttons = [
            ['C', '+/-', '%', '/'],
            ['7', '8', '9', '*'],
            ['4', '5', '6', '-'],
            ['1', '2', '3', '+'],
            ['0', '0', '.', '='],
        ];
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 130, y: 40,
            width: 100, height: 130,
            title: 'Calculator',
            appId: this.id,
            app: this
        });
    }

    _getButtonLayout(areaW, areaH) {
        const cols = 4;
        const rows = 5;
        const displayH = 16;
        const pad = 2;
        const btnW = Math.floor((areaW - pad * 2 - (cols - 1)) / cols);
        const btnH = Math.floor((areaH - displayH - pad * 2 - (rows - 1)) / rows);
        return { cols, rows, displayH, pad, btnW, btnH };
    }

    _getBtnRect(col, row, areaX, areaY, layout) {
        const { pad, btnW, btnH, displayH } = layout;
        // Handle wide '0' button
        const isWideZero = row === 4 && col === 0;
        const w = isWideZero ? btnW * 2 + 1 : btnW;
        return {
            x: areaX + pad + col * (btnW + 1),
            y: areaY + displayH + pad + row * (btnH + 1),
            w, h: btnH
        };
    }

    draw(r, x, y, w, h) {
        // Background
        r.fillRect(x, y, w, h, '#2c2c2e');

        const layout = this._getButtonLayout(w, h);
        const { displayH, pad } = layout;

        // Display
        r.fillRect(x + pad, y + pad, w - pad * 2, displayH - 2, '#1c1c1e');
        const displayText = this.display.length > 16 ? this.display.slice(-16) : this.display;
        r.drawTextRight(displayText, x + w - pad - 2, y + pad + 4, '#ffffff');

        // Buttons
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                // Skip second '0' cell (wide button)
                if (row === 4 && col === 1) continue;

                const label = this.buttons[row][col];
                const rect = this._getBtnRect(col, row, x, y, layout);
                const isHovered = this.hoveredBtn === `${row}_${col}`;
                const isPressed = this.pressedBtn === `${row}_${col}`;

                let bgColor;
                if (row === 0) {
                    bgColor = isPressed ? '#999' : isHovered ? '#b0b0b0' : '#a5a5a5';
                } else if (col === 3) {
                    bgColor = isPressed ? '#ff8c00' : isHovered ? '#ffa533' : '#ff9f0a';
                } else {
                    bgColor = isPressed ? '#555' : isHovered ? '#444' : '#3a3a3c';
                }

                r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 1, bgColor);

                const textColor = col === 3 ? '#ffffff' : (row === 0 ? '#000000' : '#ffffff');
                r.drawTextCentered(label, rect.x + rect.w / 2, rect.y + (rect.h - 5) / 2, textColor);
            }
        }
    }

    onMouseDown(lx, ly) {
        const btn = this._hitButton(lx, ly);
        if (btn) {
            this.pressedBtn = btn.key;
            this._handleButton(btn.label);
        }
    }

    onMouseUp() {
        this.pressedBtn = null;
    }

    onMouseMove(lx, ly) {
        const btn = this._hitButton(lx, ly);
        this.hoveredBtn = btn ? btn.key : null;
    }

    onKeyDown(key) {
        if (key >= '0' && key <= '9') this._handleButton(key);
        else if (key === '+' || key === '-' || key === '*' || key === '/') this._handleButton(key);
        else if (key === '=' || key === 'Enter') this._handleButton('=');
        else if (key === '.' || key === ',') this._handleButton('.');
        else if (key === 'Escape' || key === 'c' || key === 'C') this._handleButton('C');
        else if (key === 'Backspace') {
            if (this.display.length > 1) this.display = this.display.slice(0, -1);
            else this.display = '0';
        }
    }

    _hitButton(lx, ly) {
        // We need content area dimensions - estimate from window
        const w = this.window ? this.window.contentWidth : 100;
        const h = this.window ? this.window.contentHeight : 130;
        const layout = this._getButtonLayout(w, h);

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                if (row === 4 && col === 1) continue;
                const rect = this._getBtnRect(col, row, 0, 0, layout);
                if (lx >= rect.x && lx < rect.x + rect.w &&
                    ly >= rect.y && ly < rect.y + rect.h) {
                    return { label: this.buttons[row][col], key: `${row}_${col}` };
                }
            }
        }
        return null;
    }

    _handleButton(label) {
        if (label >= '0' && label <= '9') {
            if (this.waitingForOperand) {
                this.display = label;
                this.waitingForOperand = false;
            } else {
                this.display = this.display === '0' ? label : this.display + label;
            }
        } else if (label === '.') {
            if (this.waitingForOperand) {
                this.display = '0.';
                this.waitingForOperand = false;
            } else if (!this.display.includes('.')) {
                this.display += '.';
            }
        } else if (label === 'C') {
            this.display = '0';
            this.accumulator = 0;
            this.operator = null;
            this.waitingForOperand = false;
        } else if (label === '+/-') {
            const val = parseFloat(this.display);
            this.display = String(-val);
        } else if (label === '%') {
            const val = parseFloat(this.display);
            this.display = String(val / 100);
        } else if (['+', '-', '*', '/'].includes(label)) {
            const val = parseFloat(this.display);
            if (this.operator && !this.waitingForOperand) {
                this.accumulator = this._calculate(this.accumulator, val, this.operator);
                this.display = String(this.accumulator);
            } else {
                this.accumulator = val;
            }
            this.operator = label;
            this.waitingForOperand = true;
        } else if (label === '=') {
            const val = parseFloat(this.display);
            if (this.operator) {
                this.accumulator = this._calculate(this.accumulator, val, this.operator);
                this.display = String(this.accumulator);
                this.operator = null;
            }
            this.waitingForOperand = true;
        }
    }

    _calculate(a, b, op) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : 0;
            default: return b;
        }
    }
}
