/**
 * Desktop - Wallpaper and desktop icons
 */
export class Desktop {
    constructor(renderer) {
        this.renderer = renderer;
        this.icons = [
            { id: 'finder', label: 'Finder', x: 0, y: 0 },
            { id: 'terminal', label: 'Terminal', x: 0, y: 0 },
        ];
        this._layoutIcons();
    }

    _layoutIcons() {
        // Right-top grid, 16x16 icons with 24px vertical spacing
        const startX = 384 - 28;
        let y = 18; // below menu bar
        for (const icon of this.icons) {
            icon.x = startX;
            icon.y = y;
            y += 28;
        }
    }

    draw(r) {
        // Wallpaper gradient
        r.fillGradientV(0, 12, 384, 244, '#1a6baa', '#2d9ee0');

        // Desktop icons
        for (const icon of this.icons) {
            this._drawDesktopIcon(r, icon);
        }
    }

    _drawDesktopIcon(r, icon) {
        // Icon background
        this._drawAppIcon(r, icon.id, icon.x, icon.y, 16);
        // Label
        r.drawTextCentered(icon.label, icon.x + 8, icon.y + 18, '#ffffff');
    }

    _drawAppIcon(r, appId, x, y, size) {
        switch (appId) {
            case 'finder':
                // Blue face icon
                r.fillRect(x + 2, y + 1, size - 4, size - 2, '#4a90d9');
                r.fillRect(x + 4, y + 4, 2, 2, '#ffffff');
                r.fillRect(x + size - 6, y + 4, 2, 2, '#ffffff');
                r.fillRect(x + 4, y + 10, size - 8, 2, '#ffffff');
                break;
            case 'terminal':
                // Black terminal icon
                r.fillRect(x + 1, y + 1, size - 2, size - 2, '#1a1a1a');
                r.drawText('>', x + 3, y + 5, '#00ff00');
                break;
        }
    }

    handleClick(mx, my) {
        for (const icon of this.icons) {
            if (mx >= icon.x && mx < icon.x + 16 &&
                my >= icon.y && my < icon.y + 24) {
                return icon.id;
            }
        }
        return null;
    }
}
