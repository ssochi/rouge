/**
 * InputManager - PixelOS internal mouse/keyboard event capture and dispatch
 */
export class InputManager {
    constructor(overlay) {
        this.overlay = overlay;
        this.mouse = { x: 0, y: 0, down: false, clicked: false, justPressed: false };
        this.keys = { buffer: [], upBuffer: [], shift: false, ctrl: false, meta: false };
        this._active = false;
        this._mouseDownThisFrame = false;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);

        // Always attach to canvas for mouse events
        overlay.canvas.addEventListener('mousedown', this._onMouseDown);
        overlay.canvas.addEventListener('mouseup', this._onMouseUp);
        overlay.canvas.addEventListener('mousemove', this._onMouseMove);
    }

    activate() {
        if (this._active) return;
        this._active = true;
        window.addEventListener('keydown', this._onKeyDown, true);
        window.addEventListener('keyup', this._onKeyUp, true);
    }

    deactivate() {
        if (!this._active) return;
        this._active = false;
        window.removeEventListener('keydown', this._onKeyDown, true);
        window.removeEventListener('keyup', this._onKeyUp, true);
        this.mouse.down = false;
        this.mouse.clicked = false;
        this.mouse.justPressed = false;
        this._mouseDownThisFrame = false;
        this.keys.buffer.length = 0;
    }

    /** Call at the start of each frame */
    beginFrame() {
        this.mouse.clicked = this._mouseDownThisFrame;
        this._mouseDownThisFrame = false;
    }

    /** Call at end of frame to reset per-frame state */
    endFrame() {
        this.keys.buffer.length = 0;
        this.keys.upBuffer.length = 0;
        this.mouse.clicked = false;
    }

    _onMouseDown(e) {
        if (!this._active) return;
        const pos = this.overlay.mapCoords(e.clientX, e.clientY);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.mouse.down = true;
        this._mouseDownThisFrame = true;
        e.preventDefault();
        e.stopPropagation();
    }

    _onMouseUp(e) {
        if (!this._active) return;
        const pos = this.overlay.mapCoords(e.clientX, e.clientY);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.mouse.down = false;
        e.preventDefault();
        e.stopPropagation();
    }

    _onMouseMove(e) {
        if (!this._active) return;
        const pos = this.overlay.mapCoords(e.clientX, e.clientY);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
    }

    _onKeyDown(e) {
        if (!this._active) return;
        e.stopPropagation();

        // Don't prevent default for Escape - let it bubble for close handling
        if (e.key === 'Escape') return;

        e.preventDefault();
        this.keys.shift = e.shiftKey;
        this.keys.ctrl = e.ctrlKey || e.metaKey;
        this.keys.meta = e.metaKey;
        this.keys.buffer.push(e.key);
    }

    _onKeyUp(e) {
        if (!this._active) return;
        e.stopPropagation();
        this.keys.shift = e.shiftKey;
        this.keys.ctrl = e.ctrlKey || e.metaKey;
        this.keys.meta = e.metaKey;
        this.keys.upBuffer.push(e.key);
    }

    /** Check if a point is within a rect */
    static hitTest(mx, my, x, y, w, h) {
        return mx >= x && mx < x + w && my >= y && my < y + h;
    }
}
