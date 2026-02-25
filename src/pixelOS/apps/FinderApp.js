/**
 * FinderApp - File browser with sidebar and icon grid
 */
import { App } from './App.js';

export class FinderApp extends App {
    constructor(virtualFS) {
        super('finder', 'Finder');
        this.fs = virtualFS;
        this.cwd = '/Home';
        this.sidebarWidth = 50;
        this.sidebarItems = [
            { label: 'Home', path: '/Home' },
            { label: 'Docs', path: '/Home/Documents' },
            { label: 'Down', path: '/Home/Downloads' },
            { label: 'Pics', path: '/Home/Pictures' },
            { label: 'System', path: '/System' },
        ];
        this.selectedSidebar = 0;
        this.hoveredFile = -1;
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 30, y: 25,
            width: 240, height: 150,
            title: 'Finder',
            appId: this.id,
            app: this
        });
    }

    draw(r, x, y, w, h) {
        // Sidebar background
        r.fillRect(x, y, this.sidebarWidth, h, '#2d2d30');
        // Sidebar separator
        r.fillRect(x + this.sidebarWidth, y, 1, h, '#444');

        // Sidebar items
        const lineH = r.lineHeight + 2;
        for (let i = 0; i < this.sidebarItems.length; i++) {
            const item = this.sidebarItems[i];
            const iy = y + 4 + i * lineH;
            const isSelected = i === this.selectedSidebar;

            if (isSelected) {
                r.fillRect(x + 1, iy - 1, this.sidebarWidth - 2, lineH, '#4a90d9');
            }

            r.drawText(item.label, x + 4, iy + 1, isSelected ? '#ffffff' : '#aaaaaa');
        }

        // Main content area
        const contentX = x + this.sidebarWidth + 2;
        const contentW = w - this.sidebarWidth - 2;

        // Breadcrumb path
        r.fillRect(contentX, y, contentW, 10, '#383838');
        const pathDisplay = this.cwd.length > 30 ? '...' + this.cwd.slice(-27) : this.cwd;
        r.drawText(pathDisplay, contentX + 2, y + 2, '#aaaaaa');

        // File grid
        const entries = this.fs.ls(this.cwd) || [];
        const gridStartY = y + 12;
        const iconW = 32;
        const iconH = 24;
        const cols = Math.max(1, Math.floor(contentW / iconW));

        for (let i = 0; i < entries.length; i++) {
            const name = entries[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const ix = contentX + col * iconW + 2;
            const iy = gridStartY + row * iconH;

            if (iy + iconH > y + h) break;

            const isHovered = i === this.hoveredFile;
            const isDir = this.fs.isDir(this.fs.resolvePath(this.cwd, name));

            if (isHovered) {
                r.fillRect(ix - 1, iy, iconW - 2, iconH - 1, 'rgba(74, 144, 217, 0.3)');
            }

            // Icon
            if (isDir) {
                // Folder icon
                r.fillRect(ix + 4, iy + 2, 12, 2, '#5ab0f7');
                r.fillRect(ix + 2, iy + 4, 18, 10, '#5ab0f7');
            } else {
                // File icon
                r.fillRect(ix + 5, iy + 1, 12, 14, '#e0e0e0');
                r.fillRect(ix + 5, iy + 1, 12, 3, '#c0c0c0');
            }

            // Name (truncated)
            const displayName = name.length > 6 ? name.slice(0, 5) + '..' : name;
            r.drawText(displayName, ix + 2, iy + 17, '#cccccc');
        }

        if (entries.length === 0) {
            r.drawText('(empty)', contentX + 4, gridStartY + 4, '#666666');
        }
    }

    onMouseDown(lx, ly) {
        // Sidebar click
        if (lx < this.sidebarWidth) {
            const lineH = 9;
            const index = Math.floor((ly - 4) / lineH);
            if (index >= 0 && index < this.sidebarItems.length) {
                this.selectedSidebar = index;
                this.cwd = this.sidebarItems[index].path;
                this.hoveredFile = -1;
            }
            return;
        }

        // File grid click
        const contentX = this.sidebarWidth + 2;
        const contentW = (this.window ? this.window.contentWidth : 240) - this.sidebarWidth - 2;
        const gridStartY = 12;
        const iconW = 32;
        const iconH = 24;
        const cols = Math.max(1, Math.floor(contentW / iconW));
        const entries = this.fs.ls(this.cwd) || [];

        const col = Math.floor((lx - contentX) / iconW);
        const row = Math.floor((ly - gridStartY) / iconH);
        const index = row * cols + col;

        if (index >= 0 && index < entries.length && col >= 0 && col < cols) {
            const name = entries[index];
            const fullPath = this.fs.resolvePath(this.cwd, name);
            if (this.fs.isDir(fullPath)) {
                this.cwd = fullPath;
                this.hoveredFile = -1;
                // Update sidebar selection
                const sIdx = this.sidebarItems.findIndex(s => s.path === fullPath);
                if (sIdx >= 0) this.selectedSidebar = sIdx;
            }
        }
    }

    onMouseMove(lx, ly) {
        if (lx < this.sidebarWidth) {
            this.hoveredFile = -1;
            return;
        }

        const contentX = this.sidebarWidth + 2;
        const contentW = (this.window ? this.window.contentWidth : 240) - this.sidebarWidth - 2;
        const gridStartY = 12;
        const iconW = 32;
        const iconH = 24;
        const cols = Math.max(1, Math.floor(contentW / iconW));
        const entries = this.fs.ls(this.cwd) || [];

        const col = Math.floor((lx - contentX) / iconW);
        const row = Math.floor((ly - gridStartY) / iconH);
        const index = row * cols + col;

        if (index >= 0 && index < entries.length && col >= 0 && col < cols) {
            this.hoveredFile = index;
        } else {
            this.hoveredFile = -1;
        }
    }
}
