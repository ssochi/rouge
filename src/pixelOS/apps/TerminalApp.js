/**
 * TerminalApp - Terminal emulator with command support
 */
import { App } from './App.js';

export class TerminalApp extends App {
    constructor(virtualFS) {
        super('terminal', 'Terminal');
        this.fs = virtualFS;
        this.lines = ['PixelOS Terminal v1.0', 'Type "help" for commands.', ''];
        this.inputLine = '';
        this.cursorVisible = true;
        this.cursorTimer = 0;
        this.cwd = '/Home';
        this.scrollOffset = 0;
        this.history = [];
        this.historyIndex = -1;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 40, y: 30,
            width: 200, height: 140,
            title: 'Terminal',
            appId: this.id,
            app: this
        });
    }

    get prompt() {
        const dir = this.cwd === '/Home' ? '~' : this.cwd.split('/').pop() || '/';
        return `pixelos:${dir} user$ `;
    }

    update() {
        this.cursorTimer++;
        if (this.cursorTimer >= 30) {
            this.cursorTimer = 0;
            this.cursorVisible = !this.cursorVisible;
        }
    }

    draw(r, x, y, w, h) {
        // Black background
        r.fillRect(x, y, w, h, '#1a1a2e');

        const lineH = r.lineHeight;
        const maxVisibleLines = Math.floor(h / lineH);
        const promptStr = this.prompt + this.inputLine;

        // All lines to display
        const allLines = [...this.lines, promptStr];
        const totalLines = allLines.length;

        // Auto-scroll to bottom
        const startLine = Math.max(0, totalLines - maxVisibleLines);

        let drawY = y + 2;
        for (let i = startLine; i < totalLines; i++) {
            const line = allLines[i];
            const isPromptLine = (i === totalLines - 1);
            const color = isPromptLine ? '#00ff00' : '#cccccc';

            // Word wrap long lines
            const maxChars = Math.floor(w / r.charWidth);
            if (line.length > maxChars) {
                let pos = 0;
                while (pos < line.length && drawY < y + h - lineH) {
                    const chunk = line.slice(pos, pos + maxChars);
                    r.drawText(chunk, x + 2, drawY, color);
                    drawY += lineH;
                    pos += maxChars;
                }
            } else {
                if (drawY < y + h) {
                    r.drawText(line, x + 2, drawY, color);
                }
                drawY += lineH;
            }
        }

        // Blinking cursor
        if (this.cursorVisible) {
            const cursorX = x + 2 + (this.prompt.length + this.inputLine.length) * r.charWidth;
            const cursorY = drawY - lineH;
            if (cursorY >= y && cursorY < y + h) {
                r.fillRect(cursorX, cursorY, r.charWidth - 1, r.charHeight, '#00ff00');
            }
        }
    }

    onKeyDown(key, shift, ctrl) {
        this.cursorVisible = true;
        this.cursorTimer = 0;

        if (key === 'Enter') {
            this._execute();
        } else if (key === 'Backspace') {
            if (this.inputLine.length > 0) {
                this.inputLine = this.inputLine.slice(0, -1);
            }
        } else if (key === 'ArrowUp') {
            if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.inputLine = this.history[this.history.length - 1 - this.historyIndex];
            }
        } else if (key === 'ArrowDown') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputLine = this.history[this.history.length - 1 - this.historyIndex];
            } else {
                this.historyIndex = -1;
                this.inputLine = '';
            }
        } else if (ctrl && key === 'l') {
            this.lines = [];
        } else if (ctrl && key === 'c') {
            this.lines.push(this.prompt + this.inputLine + '^C');
            this.inputLine = '';
        } else if (key.length === 1) {
            this.inputLine += key;
        }
    }

    _execute() {
        const fullLine = this.prompt + this.inputLine;
        this.lines.push(fullLine);

        const cmd = this.inputLine.trim();
        if (cmd.length > 0) {
            this.history.push(cmd);
        }
        this.historyIndex = -1;
        this.inputLine = '';

        if (!cmd) return;

        const parts = cmd.split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        switch (command) {
            case 'help':
                this.lines.push('Available commands:');
                this.lines.push('  help    - Show this help');
                this.lines.push('  ls      - List directory');
                this.lines.push('  cd      - Change directory');
                this.lines.push('  cat     - Read file');
                this.lines.push('  pwd     - Print working dir');
                this.lines.push('  clear   - Clear screen');
                this.lines.push('  echo    - Print text');
                this.lines.push('  date    - Show date');
                this.lines.push('  whoami  - Show username');
                this.lines.push('  uname   - System info');
                break;

            case 'ls': {
                const target = args[0] ? this.fs.resolvePath(this.cwd, args[0]) : this.cwd;
                const entries = this.fs.ls(target);
                if (entries === null) {
                    this.lines.push(`ls: ${args[0] || this.cwd}: No such directory`);
                } else if (entries.length === 0) {
                    // empty dir
                } else {
                    this.lines.push(entries.join('  '));
                }
                break;
            }

            case 'cd': {
                if (!args[0] || args[0] === '~') {
                    this.cwd = '/Home';
                } else {
                    const newPath = this.fs.resolvePath(this.cwd, args[0]);
                    if (this.fs.isDir(newPath)) {
                        this.cwd = newPath;
                    } else {
                        this.lines.push(`cd: ${args[0]}: Not a directory`);
                    }
                }
                break;
            }

            case 'cat': {
                if (!args[0]) {
                    this.lines.push('cat: missing operand');
                    break;
                }
                const filePath = this.fs.resolvePath(this.cwd, args[0]);
                const content = this.fs.cat(filePath);
                if (content === null) {
                    this.lines.push(`cat: ${args[0]}: No such file`);
                } else {
                    content.split('\n').forEach(line => this.lines.push(line));
                }
                break;
            }

            case 'pwd':
                this.lines.push(this.cwd);
                break;

            case 'clear':
                this.lines = [];
                break;

            case 'echo':
                this.lines.push(args.join(' '));
                break;

            case 'date':
                this.lines.push(new Date().toLocaleString());
                break;

            case 'whoami':
                this.lines.push('user');
                break;

            case 'uname':
                this.lines.push('PixelOS 1.0 Monterey (pixel-arch)');
                break;

            default:
                this.lines.push(`command not found: ${command}`);
                break;
        }
    }

    onClose() {
        // Keep history for next open
    }
}
