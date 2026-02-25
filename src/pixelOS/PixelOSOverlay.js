/**
 * PixelOSOverlay - DOM overlay + Canvas creation and coordinate mapping
 */
export class PixelOSOverlay {
    constructor() {
        this.OS_WIDTH = 384;
        this.OS_HEIGHT = 256;

        // Create overlay DOM
        this.overlay = document.createElement('div');
        this.overlay.id = 'pixel-os-overlay';

        const monitor = document.createElement('div');
        monitor.className = 'pixel-os-monitor';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'pixel-os-screen';
        this.canvas.width = this.OS_WIDTH;
        this.canvas.height = this.OS_HEIGHT;

        monitor.appendChild(this.canvas);
        this.overlay.appendChild(monitor);
        document.body.appendChild(this.overlay);

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
    }

    show() {
        this.overlay.classList.add('active');
    }

    hide() {
        this.overlay.classList.remove('active');
    }

    get visible() {
        return this.overlay.classList.contains('active');
    }

    /** Map client coordinates to OS canvas coordinates */
    mapCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * this.OS_WIDTH / rect.width;
        const y = (clientY - rect.top) * this.OS_HEIGHT / rect.height;
        return { x: Math.floor(x), y: Math.floor(y) };
    }
}
