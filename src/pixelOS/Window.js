/**
 * Window - Single window class with title bar, traffic light buttons, content area
 */
export class Window {
    constructor({ id, x, y, width, height, title, appId, app }) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.title = title;
        this.appId = appId;
        this.app = app;
        this.titleBarHeight = 12;
        this.minimized = false;
        this.maximized = false;
        this._prevBounds = null;

        // Animation properties
        this.scale = 1;
        this.alpha = 1;
        this.animating = false;
    }

    get contentX() { return this.x; }
    get contentY() { return this.y + this.titleBarHeight; }
    get contentWidth() { return this.width; }
    get contentHeight() { return this.height - this.titleBarHeight; }

    draw(r) {
        if (this.minimized) return;

        const ctx = r.ctx;
        ctx.save();

        if (this.scale !== 1 || this.alpha !== 1) {
            ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-cx, -cy);
        }

        // Window shadow
        r.fillRect(this.x + 2, this.y + 2, this.width, this.height, 'rgba(0,0,0,0.3)');

        // Window background
        r.fillRect(this.x, this.y, this.width, this.height, '#e8e8e8');

        // Title bar
        r.fillRect(this.x, this.y, this.width, this.titleBarHeight, '#d4d4d4');
        r.fillRect(this.x, this.y + this.titleBarHeight - 1, this.width, 1, '#b0b0b0');

        // Traffic light buttons
        r.fillCircle(this.x + 6, this.y + 6, 2, '#ff5f57');  // Close (red)
        r.fillCircle(this.x + 14, this.y + 6, 2, '#ffbd2e'); // Minimize (yellow)
        r.fillCircle(this.x + 22, this.y + 6, 2, '#28c940'); // Maximize (green)

        // Title text (centered)
        r.drawTextCentered(this.title, this.x + this.width / 2, this.y + 3, '#333333');

        // Content area - clip and draw app content
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.contentX, this.contentY, this.contentWidth, this.contentHeight);
        ctx.clip();

        if (this.app && this.app.draw) {
            this.app.draw(r, this.contentX, this.contentY, this.contentWidth, this.contentHeight);
        }

        ctx.restore();
        ctx.restore();
    }

    /** Check if point is on title bar (for dragging) */
    hitTitleBar(mx, my) {
        return mx >= this.x && mx < this.x + this.width &&
               my >= this.y && my < this.y + this.titleBarHeight;
    }

    /** Check if point is on close button */
    hitClose(mx, my) {
        const dx = mx - (this.x + 6);
        const dy = my - (this.y + 6);
        return dx * dx + dy * dy <= 9;
    }

    /** Check if point is on minimize button */
    hitMinimize(mx, my) {
        const dx = mx - (this.x + 14);
        const dy = my - (this.y + 6);
        return dx * dx + dy * dy <= 9;
    }

    /** Check if point is on maximize button */
    hitMaximize(mx, my) {
        const dx = mx - (this.x + 22);
        const dy = my - (this.y + 6);
        return dx * dx + dy * dy <= 9;
    }

    /** Check if point is anywhere in window */
    hitTest(mx, my) {
        if (this.minimized) return false;
        return mx >= this.x && mx < this.x + this.width &&
               my >= this.y && my < this.y + this.height;
    }

    /** Check if point is in content area */
    hitContent(mx, my) {
        return mx >= this.contentX && mx < this.contentX + this.contentWidth &&
               my >= this.contentY && my < this.contentY + this.contentHeight;
    }

    toggleMaximize() {
        if (this.maximized) {
            // Restore
            if (this._prevBounds) {
                this.x = this._prevBounds.x;
                this.y = this._prevBounds.y;
                this.width = this._prevBounds.width;
                this.height = this._prevBounds.height;
            }
            this.maximized = false;
        } else {
            // Save and maximize
            this._prevBounds = { x: this.x, y: this.y, width: this.width, height: this.height };
            this.x = 0;
            this.y = 12; // Below menu bar
            this.width = 384;
            this.height = 256 - 12 - 22; // Between menu bar and dock
            this.maximized = true;
        }
    }

    /** Clamp window position to screen bounds */
    clampToScreen() {
        this.x = Math.max(0, Math.min(384 - this.width, this.x));
        this.y = Math.max(12, Math.min(256 - 22, this.y)); // Between menu bar and dock bottom
    }
}
