/**
 * App - Base class for PixelOS applications
 */
export class App {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.window = null;
    }

    /** Called when app is opened. Should create a window via windowManager. */
    open(windowManager) {
        // Override in subclass
    }

    /** Mouse events in content area (local coordinates) */
    onMouseDown(x, y) {}
    onMouseMove(x, y) {}
    onMouseUp(x, y) {}

    /** Keyboard events */
    onKeyDown(key, shift, ctrl) {}

    /** Per-frame update */
    update(dt) {}

    /** Draw content area */
    draw(renderer, x, y, width, height) {}

    /** Called when window is closed */
    onClose() {}
}
