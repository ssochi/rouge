/**
 * PixelOS - Main controller: state machine, render loop, app registry
 * States: off → booting → desktop → off (ESC to close)
 */
import { PixelOSOverlay } from './PixelOSOverlay.js';
import { PixelOSRenderer } from './PixelOSRenderer.js';
import { AnimationSystem } from './AnimationSystem.js';
import { InputManager } from './InputManager.js';
import { Desktop } from './Desktop.js';
import { MenuBar } from './MenuBar.js';
import { Dock } from './Dock.js';
import { WindowManager } from './WindowManager.js';
import { VirtualFS } from './VirtualFS.js';
import { CalculatorApp } from './apps/CalculatorApp.js';
import { TerminalApp } from './apps/TerminalApp.js';
import { FinderApp } from './apps/FinderApp.js';
import { NotesApp } from './apps/NotesApp.js';
import { SettingsApp } from './apps/SettingsApp.js';
import { MailApp } from './apps/MailApp.js';
import { Game2048App } from './apps/Game2048App.js';
import { TetrisApp } from './apps/TetrisApp.js';
import { MarioApp } from './apps/MarioApp.js';
import './PixelOS.css';

export class PixelOS {
    constructor({ onClose }) {
        this.onClose = onClose;

        // Core systems
        this.overlay = new PixelOSOverlay();
        this.renderer = new PixelOSRenderer(
            this.overlay.ctx,
            this.overlay.OS_WIDTH,
            this.overlay.OS_HEIGHT
        );
        this.animations = new AnimationSystem();
        this.inputManager = new InputManager(this.overlay);

        // Desktop components
        this.desktop = new Desktop(this.renderer);
        this.menuBar = new MenuBar(this.renderer);
        this.dock = new Dock(this.renderer);
        this.windowManager = new WindowManager(this.animations, this.dock);

        // Virtual filesystem (shared across apps)
        this.virtualFS = new VirtualFS();

        // App registry (persistent instances)
        this.apps = {
            calculator: new CalculatorApp(),
            terminal: new TerminalApp(this.virtualFS),
            finder: new FinderApp(this.virtualFS),
            notes: new NotesApp(),
            settings: new SettingsApp(this),
            mail: new MailApp(),
            game2048: new Game2048App(),
            tetris: new TetrisApp(),
            mario: new MarioApp()
        };

        // State machine
        this.state = 'off';  // off | booting | desktop
        this._bootProgress = 0;
        this._bootPhase = 0;
        this._rafId = null;

        // Boot animation state
        this._bootAlpha = 0;
        this._bootBarProgress = 0;

        // Click outside monitor to close
        this.overlay.onClickOutside = () => this.close();

        this._bindEscapeHandler();
    }

    _bindEscapeHandler() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state !== 'off') {
                e.stopPropagation();
                e.preventDefault();
                this.close();
            }
        }, true);
    }

    open() {
        if (this.state !== 'off') return;

        this.state = 'booting';
        this._bootProgress = 0;
        this._bootPhase = 0;
        this._bootAlpha = 0;
        this._bootBarProgress = 0;
        this.overlay.show();
        this.inputManager.activate();
        this._startLoop();
    }

    close() {
        if (this.state === 'off') return;

        this.state = 'off';
        this.inputManager.deactivate();
        this.overlay.hide();
        this._stopLoop();
        if (this.onClose) this.onClose();
    }

    _startLoop() {
        if (this._rafId) return;
        const loop = () => {
            this._update();
            this._draw();
            this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
    }

    _stopLoop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    _update() {
        this.inputManager.beginFrame();
        this.animations.update();

        if (this.state === 'booting') {
            this._updateBoot();
        } else if (this.state === 'desktop') {
            this._updateDesktop();
        }

        this.inputManager.endFrame();
    }

    _updateBoot() {
        this._bootProgress++;

        // Phase 0: Fade in logo (frames 0-40)
        // Phase 1: Progress bar (frames 40-100)
        // Phase 2: Fade to white then desktop (frames 100-120)
        if (this._bootProgress <= 40) {
            this._bootPhase = 0;
            this._bootAlpha = Math.min(1, this._bootProgress / 30);
        } else if (this._bootProgress <= 100) {
            this._bootPhase = 1;
            this._bootBarProgress = (this._bootProgress - 40) / 60;
        } else if (this._bootProgress <= 120) {
            this._bootPhase = 2;
            this._bootAlpha = (this._bootProgress - 100) / 20;
        } else {
            this.state = 'desktop';
        }
    }

    _updateDesktop() {
        const input = this.inputManager;
        const mx = input.mouse.x;
        const my = input.mouse.y;

        // Update dock hover
        this.dock.updateHover(mx, my);

        // Update active window's app
        const activeWin = this.windowManager.getActiveWindow();
        if (activeWin && activeWin.app && activeWin.app.update) {
            activeWin.app.update();
        }

        // Handle keyboard input
        for (const key of input.keys.buffer) {
            this.windowManager.handleKeyDown(key, input.keys.shift, input.keys.ctrl);
        }
        for (const key of input.keys.upBuffer) {
            this.windowManager.handleKeyUp(key, input.keys.shift, input.keys.ctrl);
        }

        // Handle mouse click
        if (input.mouse.clicked) {
            this._handleClick(mx, my);
        }

        // Handle mouse move (for dragging)
        if (input.mouse.down) {
            this.windowManager.handleMouseMove(mx, my);
        } else {
            this.windowManager.handleMouseUp(mx, my);
            // Still forward mouse move for hover effects
            this.windowManager.handleMouseMove(mx, my);
        }

        // Update menu bar with active app name
        const activeApp = activeWin ? activeWin.title : 'Finder';
        this.menuBar.setActiveApp(activeApp);
    }

    _handleClick(mx, my) {
        // Priority 1: Menu bar
        if (this.menuBar.handleClick(mx, my)) return;

        // Priority 2-4: Window system (title bar buttons, drag, content)
        const winResult = this.windowManager.handleMouseDown(mx, my);
        if (winResult.consumed) return;

        // Priority 5: Dock
        const dockApp = this.dock.handleClick(mx, my);
        if (dockApp) {
            this._launchApp(dockApp);
            return;
        }

        // Priority 6: Desktop icons
        const desktopApp = this.desktop.handleClick(mx, my);
        if (desktopApp) {
            this._launchApp(desktopApp);
            return;
        }
    }

    _launchApp(appId) {
        const app = this.apps[appId];
        if (app) {
            app.open(this.windowManager);
        }
    }

    _draw() {
        const r = this.renderer;

        if (this.state === 'booting') {
            this._drawBoot(r);
        } else if (this.state === 'desktop') {
            this._drawDesktop(r);
        }
    }

    _drawBoot(r) {
        r.clear('#000000');

        if (this._bootPhase === 0) {
            // Fade in Apple logo
            const cx = 192;
            const cy = 110;
            const alpha = this._bootAlpha;

            // Draw logo with alpha by using a gray shade
            const shade = Math.floor(alpha * 255);
            const color = `rgb(${shade},${shade},${shade})`;
            r.drawAppleLogo(cx - 2, cy - 4, color);
        } else if (this._bootPhase === 1) {
            // Logo + progress bar
            const cx = 192;
            const cy = 110;
            r.drawAppleLogo(cx - 2, cy - 4, '#ffffff');

            // Progress bar
            const barW = 80;
            const barH = 4;
            const barX = cx - barW / 2;
            const barY = cy + 20;

            r.fillRoundRect(barX, barY, barW, barH, 2, '#333333');
            const fillW = Math.floor(barW * this._bootBarProgress);
            if (fillW > 0) {
                r.fillRoundRect(barX, barY, fillW, barH, 2, '#ffffff');
            }
        } else if (this._bootPhase === 2) {
            // Fade to white
            const shade = Math.floor(this._bootAlpha * 255);
            r.clear(`rgb(${shade},${shade},${shade})`);
        }
    }

    _drawDesktop(r) {
        // 1. Desktop wallpaper + icons
        this.desktop.draw(r);

        // 2. Windows (Z-order)
        this.windowManager.draw(r);

        // 3. Menu bar (always on top)
        this.menuBar.draw(r);

        // 4. Dock
        this.dock.draw(r);
    }
}
