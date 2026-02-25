/**
 * SettingsApp - System settings with category sidebar
 */
import { App } from './App.js';

export class SettingsApp extends App {
    constructor(pixelOS) {
        super('settings', 'Settings');
        this.pixelOS = pixelOS;
        this.categories = ['General', 'Display', 'About'];
        this.selectedCategory = 0;
        this.hoveredCategory = -1;
        this.wallpaperIndex = 0;
        this.hoveredWallpaper = -1;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 80, y: 30,
            width: 180, height: 140,
            title: 'Settings',
            appId: this.id,
            app: this
        });
    }

    draw(r, x, y, w, h) {
        // Background
        r.fillRect(x, y, w, h, '#f0f0f0');

        const sidebarW = 50;

        // Sidebar
        r.fillRect(x, y, sidebarW, h, '#e0e0e0');
        r.fillRect(x + sidebarW, y, 1, h, '#c0c0c0');

        for (let i = 0; i < this.categories.length; i++) {
            const iy = y + 4 + i * 14;
            const isSelected = i === this.selectedCategory;
            const isHovered = i === this.hoveredCategory;

            if (isSelected) {
                r.fillRect(x + 1, iy - 1, sidebarW - 2, 12, '#007aff');
                r.drawText(this.categories[i], x + 4, iy + 2, '#ffffff');
            } else {
                if (isHovered) {
                    r.fillRect(x + 1, iy - 1, sidebarW - 2, 12, '#d0d0d0');
                }
                r.drawText(this.categories[i], x + 4, iy + 2, '#333333');
            }
        }

        // Content panel
        const cx = x + sidebarW + 4;
        const cw = w - sidebarW - 8;
        const cy = y + 4;

        switch (this.selectedCategory) {
            case 0: this._drawGeneral(r, cx, cy, cw); break;
            case 1: this._drawDisplay(r, cx, cy, cw); break;
            case 2: this._drawAbout(r, cx, cy, cw); break;
        }
    }

    _drawGeneral(r, x, y, w) {
        r.drawText('PixelOS', x, y, '#333333');
        r.drawText('Version 1.0', x, y + 10, '#888888');
        r.drawText('A tiny OS for', x, y + 26, '#666666');
        r.drawText('your pixel', x, y + 36, '#666666');
        r.drawText('computer.', x, y + 46, '#666666');

        // OS icon
        const iconX = x + w - 20;
        const iconY = y + 2;
        r.fillRoundRect(iconX, iconY, 16, 16, 2, '#007aff');
        r.drawText('P', iconX + 4, iconY + 5, '#ffffff');
    }

    _drawDisplay(r, x, y, w) {
        r.drawText('Wallpaper', x, y, '#333333');

        const wallpapers = ['Blue', 'Pixel'];
        for (let i = 0; i < wallpapers.length; i++) {
            const wx = x + i * 40;
            const wy = y + 14;
            const isSelected = i === this.wallpaperIndex;
            const isHovered = i === this.hoveredWallpaper;

            // Wallpaper thumbnail
            if (i === 0) {
                r.fillRect(wx, wy, 32, 22, '#1a6baa');
                r.fillRect(wx, wy + 11, 32, 11, '#2d9ee0');
            } else {
                r.fillRect(wx, wy, 32, 22, '#2a1a4a');
                // Mini mountain
                for (let px = 0; px < 32; px++) {
                    const mh = Math.sin(px * 0.3) * 4 + 8;
                    r.fillRect(wx + px, wy + 22 - mh, 1, mh, '#4a3a6a');
                }
            }

            // Selection border
            if (isSelected) {
                r.strokeRect(wx - 1, wy - 1, 34, 24, '#007aff');
            } else if (isHovered) {
                r.strokeRect(wx - 1, wy - 1, 34, 24, '#999999');
            }

            r.drawTextCentered(wallpapers[i], wx + 16, wy + 26, '#666666');
        }

        r.drawText('Theme', x, y + 52, '#333333');
        r.fillRoundRect(x, y + 62, 32, 10, 2, '#007aff');
        r.drawTextCentered('Dark', x + 16, y + 64, '#ffffff');
        r.fillRoundRect(x + 40, y + 62, 32, 10, 2, '#e0e0e0');
        r.drawTextCentered('Light', x + 56, y + 64, '#666666');
    }

    _drawAbout(r, x, y, w) {
        r.drawText('System Info', x, y, '#333333');

        const lines = [
            'OS: PixelOS 1.0',
            'Screen: 384x256',
            `Apps: ${this._getAppCount()}`,
            'RAM: 256 bytes',
            'CPU: 1-bit',
            'Made with <3',
        ];

        for (let i = 0; i < lines.length; i++) {
            r.drawText(lines[i], x, y + 14 + i * 10, '#666666');
        }
    }

    _getAppCount() {
        return this.pixelOS && this.pixelOS.apps
            ? Object.keys(this.pixelOS.apps).length
            : 8;
    }

    onMouseDown(lx, ly) {
        const sidebarW = 50;

        // Sidebar click
        if (lx < sidebarW) {
            for (let i = 0; i < this.categories.length; i++) {
                const iy = 4 + i * 14;
                if (ly >= iy - 1 && ly < iy + 11) {
                    this.selectedCategory = i;
                    return;
                }
            }
        }

        // Display tab - wallpaper selection
        if (this.selectedCategory === 1) {
            const cx = sidebarW + 4;
            for (let i = 0; i < 2; i++) {
                const wx = cx + i * 40;
                const wy = 14;
                if (lx >= wx && lx < wx + 32 && ly >= wy && ly < wy + 22) {
                    this.wallpaperIndex = i;
                    if (this.pixelOS && this.pixelOS.desktop) {
                        this.pixelOS.desktop.setWallpaper(i);
                    }
                    return;
                }
            }
        }
    }

    onMouseMove(lx, ly) {
        const sidebarW = 50;
        this.hoveredCategory = -1;
        this.hoveredWallpaper = -1;

        if (lx < sidebarW) {
            for (let i = 0; i < this.categories.length; i++) {
                const iy = 4 + i * 14;
                if (ly >= iy - 1 && ly < iy + 11) {
                    this.hoveredCategory = i;
                    return;
                }
            }
        }

        if (this.selectedCategory === 1) {
            const cx = sidebarW + 4;
            for (let i = 0; i < 2; i++) {
                const wx = cx + i * 40;
                const wy = 14;
                if (lx >= wx && lx < wx + 32 && ly >= wy && ly < wy + 22) {
                    this.hoveredWallpaper = i;
                    return;
                }
            }
        }
    }
}
