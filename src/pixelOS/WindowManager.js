/**
 * WindowManager - Z-order, drag, close/minimize/maximize, animation
 */
import { Window } from './Window.js';

export class WindowManager {
    constructor(animationSystem, dock) {
        this.windows = [];  // Z-order: first = bottom, last = top
        this.animations = animationSystem;
        this.dock = dock;
        this._nextId = 1;
        this._dragWindow = null;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
    }

    createWindow({ x, y, width, height, title, appId, app }) {
        // Check if window for this app already exists
        const existing = this.windows.find(w => w.appId === appId && !w.minimized);
        if (existing) {
            this.bringToFront(existing.id);
            return existing;
        }

        // Check for minimized window to restore
        const minimized = this.windows.find(w => w.appId === appId && w.minimized);
        if (minimized) {
            this.restore(minimized.id);
            return minimized;
        }

        const win = new Window({
            id: this._nextId++,
            x, y, width, height, title, appId, app
        });

        this.windows.push(win);

        // Open animation: scale from 0.3 to 1
        win.scale = 0.3;
        win.alpha = 0;
        win.animating = true;
        this.animations.add({
            target: win, prop: 'scale', from: 0.3, to: 1,
            duration: 12, easing: 'easeOutCubic',
            onComplete: () => { win.animating = false; }
        });
        this.animations.add({
            target: win, prop: 'alpha', from: 0, to: 1,
            duration: 12, easing: 'easeOutCubic'
        });

        if (this.dock) {
            this.dock.setRunning(appId, true);
        }

        return win;
    }

    closeWindow(id) {
        const idx = this.windows.findIndex(w => w.id === id);
        if (idx < 0) return;

        const win = this.windows[idx];
        win.animating = true;

        this.animations.add({
            target: win, prop: 'scale', from: 1, to: 0.3,
            duration: 8, easing: 'easeInCubic',
            onComplete: () => {
                if (win.app && win.app.onClose) win.app.onClose();
                const i = this.windows.indexOf(win);
                if (i >= 0) this.windows.splice(i, 1);
                if (this.dock) {
                    const hasOtherWindow = this.windows.some(w => w.appId === win.appId);
                    if (!hasOtherWindow) this.dock.setRunning(win.appId, false);
                }
            }
        });
        this.animations.add({
            target: win, prop: 'alpha', from: 1, to: 0,
            duration: 8, easing: 'easeInCubic'
        });
    }

    minimizeWindow(id) {
        const win = this.windows.find(w => w.id === id);
        if (!win) return;

        win.animating = true;
        const iconPos = this.dock ? this.dock.getIconPosition(win.appId) : { x: 192, y: 246 };

        this.animations.add({
            target: win, prop: 'scale', from: 1, to: 0.1,
            duration: 15, easing: 'easeInCubic',
            onComplete: () => {
                win.minimized = true;
                win.animating = false;
                win.scale = 1;
                win.alpha = 1;
            }
        });
        this.animations.add({
            target: win, prop: 'alpha', from: 1, to: 0,
            duration: 15, easing: 'easeInCubic'
        });
    }

    restore(id) {
        const win = this.windows.find(w => w.id === id);
        if (!win || !win.minimized) return;

        win.minimized = false;
        win.animating = true;
        win.scale = 0.3;
        win.alpha = 0;

        this.animations.add({
            target: win, prop: 'scale', from: 0.3, to: 1,
            duration: 12, easing: 'easeOutCubic',
            onComplete: () => { win.animating = false; }
        });
        this.animations.add({
            target: win, prop: 'alpha', from: 0, to: 1,
            duration: 12, easing: 'easeOutCubic'
        });

        this.bringToFront(id);
    }

    bringToFront(id) {
        const idx = this.windows.findIndex(w => w.id === id);
        if (idx >= 0 && idx < this.windows.length - 1) {
            const [win] = this.windows.splice(idx, 1);
            this.windows.push(win);
        }
    }

    /** Get the topmost active (non-minimized) window */
    getActiveWindow() {
        for (let i = this.windows.length - 1; i >= 0; i--) {
            if (!this.windows[i].minimized) return this.windows[i];
        }
        return null;
    }

    draw(r) {
        for (const win of this.windows) {
            win.draw(r);
        }
    }

    /** Handle mouse down - returns true if consumed */
    handleMouseDown(mx, my) {
        // Check windows from top to bottom (reverse Z-order)
        for (let i = this.windows.length - 1; i >= 0; i--) {
            const win = this.windows[i];
            if (win.minimized || win.animating) continue;

            if (win.hitTest(mx, my)) {
                this.bringToFront(win.id);

                // Traffic light buttons
                if (win.hitClose(mx, my)) {
                    this.closeWindow(win.id);
                    return { consumed: true };
                }
                if (win.hitMinimize(mx, my)) {
                    this.minimizeWindow(win.id);
                    return { consumed: true };
                }
                if (win.hitMaximize(mx, my)) {
                    win.toggleMaximize();
                    return { consumed: true };
                }

                // Title bar drag
                if (win.hitTitleBar(mx, my)) {
                    this._dragWindow = win;
                    this._dragOffsetX = mx - win.x;
                    this._dragOffsetY = my - win.y;
                    return { consumed: true };
                }

                // Content area - forward to app
                if (win.hitContent(mx, my)) {
                    const localX = mx - win.contentX;
                    const localY = my - win.contentY;
                    if (win.app && win.app.onMouseDown) {
                        win.app.onMouseDown(localX, localY);
                    }
                    return { consumed: true, window: win };
                }

                return { consumed: true };
            }
        }

        return { consumed: false };
    }

    handleMouseMove(mx, my) {
        if (this._dragWindow) {
            this._dragWindow.x = mx - this._dragOffsetX;
            this._dragWindow.y = my - this._dragOffsetY;
            this._dragWindow.clampToScreen();
            return true;
        }

        // Forward to active window's app
        const active = this.getActiveWindow();
        if (active && active.app && active.app.onMouseMove && active.hitContent(mx, my)) {
            active.app.onMouseMove(mx - active.contentX, my - active.contentY);
        }

        return false;
    }

    handleMouseUp(mx, my) {
        if (this._dragWindow) {
            this._dragWindow = null;
            return true;
        }

        // Forward to active window's app
        const active = this.getActiveWindow();
        if (active && active.app && active.app.onMouseUp) {
            active.app.onMouseUp(mx - active.contentX, my - active.contentY);
        }
        return false;
    }

    handleKeyDown(key, shift, ctrl) {
        const active = this.getActiveWindow();
        if (active && active.app && active.app.onKeyDown) {
            active.app.onKeyDown(key, shift, ctrl);
        }
    }
}
