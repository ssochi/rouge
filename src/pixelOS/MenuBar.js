/**
 * MenuBar - Top menu bar: Apple logo, app name, clock
 */
export class MenuBar {
    constructor(renderer) {
        this.renderer = renderer;
        this.height = 12;
        this.activeAppName = 'Finder';
    }

    setActiveApp(name) {
        this.activeAppName = name || 'Finder';
    }

    draw(r) {
        // Semi-transparent background
        r.fillRect(0, 0, 384, this.height, 'rgba(30, 30, 30, 0.85)');

        // Apple logo (left side)
        r.drawAppleLogo(4, 2, '#ffffff');

        // App name
        r.drawText(this.activeAppName, 12, 3, '#ffffff');

        // Clock (right side) - HH:MM
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;
        r.drawTextRight(timeStr, 380, 3, '#ffffff');
    }

    handleClick(mx, my) {
        if (my >= 0 && my < this.height) {
            // Menu bar clicked - for now just consume the click
            return true;
        }
        return false;
    }
}
