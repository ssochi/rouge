/**
 * Dock - Bottom dock bar with app icons and hover magnification
 */
export class Dock {
    constructor(renderer) {
        this.renderer = renderer;
        this.height = 22;
        this.expandedHeight = 30;
        this.iconSize = 16;
        this.expandedIconSize = 20;
        this.iconSpacing = 20;
        this.runningApps = new Set();

        this.apps = [
            { id: 'finder', label: 'Finder' },
            { id: 'terminal', label: 'Terminal' },
            { id: 'calculator', label: 'Calculator' },
            { id: 'notes', label: 'Notes' },
            { id: 'settings', label: 'Settings' },
            { id: 'mail', label: 'Mail' },
            { id: 'game2048', label: '2048' },
            { id: 'tetris', label: 'Tetris' },
            { id: 'mario', label: 'Mario' },
        ];

        this.hoveredIndex = -1;
    }

    get y() {
        return 256 - this.height;
    }

    setRunning(appId, running) {
        if (running) this.runningApps.add(appId);
        else this.runningApps.delete(appId);
    }

    updateHover(mx, my) {
        this.hoveredIndex = -1;
        if (my < this.y - 8) return;

        const totalWidth = this.apps.length * this.iconSpacing;
        const startX = (384 - totalWidth) / 2;

        for (let i = 0; i < this.apps.length; i++) {
            const ix = startX + i * this.iconSpacing + (this.iconSpacing - this.iconSize) / 2;
            if (mx >= ix - 2 && mx < ix + this.iconSize + 2 && my >= this.y - 8) {
                this.hoveredIndex = i;
                return;
            }
        }
    }

    draw(r) {
        const totalWidth = this.apps.length * this.iconSpacing + 12;
        const startX = (384 - totalWidth) / 2;
        const dockY = this.y;

        // Dock background (semi-transparent)
        r.fillRoundRect(startX, dockY, totalWidth, this.height, 3, 'rgba(200, 200, 200, 0.25)');
        // Dock top border
        r.fillRect(startX + 3, dockY, totalWidth - 6, 1, 'rgba(255, 255, 255, 0.15)');

        for (let i = 0; i < this.apps.length; i++) {
            const app = this.apps[i];
            const isHovered = i === this.hoveredIndex;
            const isNeighbor = Math.abs(i - this.hoveredIndex) === 1 && this.hoveredIndex >= 0;

            let size = this.iconSize;
            let yOffset = 0;
            if (isHovered) {
                size = this.expandedIconSize;
                yOffset = -6;
            } else if (isNeighbor) {
                size = 18;
                yOffset = -2;
            }

            const ix = startX + 6 + i * this.iconSpacing + (this.iconSpacing - size) / 2;
            const iy = dockY + (this.height - size) / 2 + yOffset;

            this._drawDockIcon(r, app.id, ix, iy, size);

            // Running indicator dot
            if (this.runningApps.has(app.id)) {
                r.fillCircle(
                    Math.floor(startX + 6 + i * this.iconSpacing + this.iconSpacing / 2),
                    dockY + this.height - 2,
                    1, '#ffffff'
                );
            }
        }
    }

    _drawDockIcon(r, appId, x, y, size) {
        x = Math.floor(x);
        y = Math.floor(y);
        switch (appId) {
            case 'finder':
                r.fillRoundRect(x, y, size, size, 2, '#4a90d9');
                // Simple face
                r.fillRect(x + Math.floor(size * 0.25), y + Math.floor(size * 0.25), 2, 2, '#ffffff');
                r.fillRect(x + Math.floor(size * 0.6), y + Math.floor(size * 0.25), 2, 2, '#ffffff');
                r.fillRect(x + Math.floor(size * 0.25), y + Math.floor(size * 0.6), Math.floor(size * 0.5), 1, '#ffffff');
                break;
            case 'terminal':
                r.fillRoundRect(x, y, size, size, 2, '#1a1a1a');
                r.strokeRect(x, y, size, size, '#555555');
                r.drawText('>', x + 2, y + Math.floor(size / 2) - 2, '#00ff00');
                break;
            case 'calculator':
                r.fillRoundRect(x, y, size, size, 2, '#333333');
                // Display area
                r.fillRect(x + 2, y + 2, size - 4, Math.floor(size * 0.3), '#4a4a4a');
                // Button grid
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 3; col++) {
                        r.fillRect(
                            x + 2 + col * Math.floor((size - 4) / 3),
                            y + Math.floor(size * 0.45) + row * Math.floor(size * 0.22),
                            Math.floor((size - 6) / 3),
                            Math.floor(size * 0.18),
                            '#666666'
                        );
                    }
                }
                break;
            case 'notes':
                r.fillRoundRect(x, y, size, size, 2, '#f5e6a3');
                // Lines on the note
                for (let line = 0; line < 3; line++) {
                    r.fillRect(x + 3, y + 4 + line * 3, size - 6, 1, '#c8b87a');
                }
                break;
            case 'settings':
                r.fillRoundRect(x, y, size, size, 2, '#8e8e93');
                // Gear: center circle + teeth
                {
                    const cx = x + Math.floor(size / 2);
                    const cy = y + Math.floor(size / 2);
                    const gr = Math.max(2, Math.floor(size * 0.2));
                    r.fillCircle(cx, cy, gr, '#d1d1d6');
                    // Gear teeth (4 directions)
                    r.fillRect(cx - 1, cy - gr - 2, 2, 2, '#d1d1d6');
                    r.fillRect(cx - 1, cy + gr, 2, 2, '#d1d1d6');
                    r.fillRect(cx - gr - 2, cy - 1, 2, 2, '#d1d1d6');
                    r.fillRect(cx + gr, cy - 1, 2, 2, '#d1d1d6');
                }
                break;
            case 'mail':
                r.fillRoundRect(x, y, size, size, 2, '#007aff');
                // Envelope
                {
                    const ex = x + Math.floor(size * 0.15);
                    const ey = y + Math.floor(size * 0.25);
                    const ew = Math.floor(size * 0.7);
                    const eh = Math.floor(size * 0.5);
                    r.fillRect(ex, ey, ew, eh, '#ffffff');
                    // V flap
                    r.fillRect(ex + Math.floor(ew * 0.1), ey, 1, Math.floor(eh * 0.4), '#ddd');
                    r.fillRect(ex + Math.floor(ew * 0.9), ey, 1, Math.floor(eh * 0.4), '#ddd');
                    r.fillRect(ex + Math.floor(ew / 2), ey + Math.floor(eh * 0.4), 1, 1, '#ddd');
                }
                break;
            case 'game2048':
                r.fillRoundRect(x, y, size, size, 2, '#edc22e');
                // 2x2 grid hint
                {
                    const gs = Math.floor(size * 0.3);
                    const gx = x + Math.floor((size - gs * 2 - 1) / 2);
                    const gy = y + Math.floor((size - gs * 2 - 1) / 2);
                    r.fillRect(gx, gy, gs, gs, '#f2b179');
                    r.fillRect(gx + gs + 1, gy, gs, gs, '#eee4da');
                    r.fillRect(gx, gy + gs + 1, gs, gs, '#eee4da');
                    r.fillRect(gx + gs + 1, gy + gs + 1, gs, gs, '#f59563');
                }
                break;
            case 'tetris':
                r.fillRoundRect(x, y, size, size, 2, '#1a1a2e');
                // T-piece
                {
                    const bs = Math.max(2, Math.floor(size * 0.2));
                    const tx = x + Math.floor((size - bs * 3) / 2);
                    const ty = y + Math.floor((size - bs * 2) / 2);
                    r.fillRect(tx, ty, bs, bs, '#a000f0');
                    r.fillRect(tx + bs, ty, bs, bs, '#a000f0');
                    r.fillRect(tx + bs * 2, ty, bs, bs, '#a000f0');
                    r.fillRect(tx + bs, ty + bs, bs, bs, '#a000f0');
                }
                break;
            case 'mario':
                r.fillRoundRect(x, y, size, size, 2, '#6b8cff');
                // Mini Mario: red hat + blue body
                {
                    const mx = x + Math.floor(size * 0.3);
                    const my = y + Math.floor(size * 0.15);
                    const s = Math.max(1, Math.floor(size * 0.12));
                    // Red hat
                    r.fillRect(mx, my, s * 3, s, '#e52521');
                    r.fillRect(mx - s, my + s, s * 4, s, '#e52521');
                    // Face
                    r.fillRect(mx, my + s * 2, s * 2, s, '#fbb040');
                    // Blue body
                    r.fillRect(mx - s, my + s * 3, s * 4, s * 2, '#3032d6');
                    // Ground
                    r.fillRect(x + 2, y + size - 3, size - 4, 3, '#c84c0c');
                }
                break;
        }
    }

    handleClick(mx, my) {
        if (my < this.y - 8) return null;

        const totalWidth = this.apps.length * this.iconSpacing;
        const startX = (384 - totalWidth) / 2;

        for (let i = 0; i < this.apps.length; i++) {
            const ix = startX + i * this.iconSpacing;
            if (mx >= ix && mx < ix + this.iconSpacing && my >= this.y - 8) {
                return this.apps[i].id;
            }
        }
        return null;
    }

    /** Get icon center position for window animations */
    getIconPosition(appId) {
        const idx = this.apps.findIndex(a => a.id === appId);
        if (idx < 0) return { x: 192, y: 246 };
        const totalWidth = this.apps.length * this.iconSpacing;
        const startX = (384 - totalWidth) / 2;
        return {
            x: Math.floor(startX + 6 + idx * this.iconSpacing + this.iconSpacing / 2),
            y: this.y + this.height / 2
        };
    }
}
