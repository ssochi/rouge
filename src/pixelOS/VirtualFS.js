/**
 * VirtualFS - Virtual file system with directory tree and file metadata
 */
export class VirtualFS {
    constructor() {
        this.root = {
            type: 'dir',
            name: '/',
            children: {
                'Home': {
                    type: 'dir',
                    name: 'Home',
                    children: {
                        'Documents': {
                            type: 'dir',
                            name: 'Documents',
                            children: {
                                'README.txt': {
                                    type: 'file',
                                    name: 'README.txt',
                                    content: 'Welcome to PixelOS!\nThis is a virtual file system.\nEnjoy exploring!'
                                },
                                'notes.txt': {
                                    type: 'file',
                                    name: 'notes.txt',
                                    content: 'TODO:\n- Survive the zombie apocalypse\n- Find better weapons\n- Build a shelter'
                                }
                            }
                        },
                        'Downloads': {
                            type: 'dir',
                            name: 'Downloads',
                            children: {
                                'game_manual.txt': {
                                    type: 'file',
                                    name: 'game_manual.txt',
                                    content: 'WASD - Move\nMouse - Aim\nClick - Shoot\nE - Interact\nSpace - Roll\nB - Backpack'
                                }
                            }
                        },
                        'Pictures': {
                            type: 'dir',
                            name: 'Pictures',
                            children: {
                                'sunset.pxl': {
                                    type: 'file',
                                    name: 'sunset.pxl',
                                    content: '[pixel art data]'
                                }
                            }
                        },
                        '.bashrc': {
                            type: 'file',
                            name: '.bashrc',
                            content: '# PixelOS shell config\nexport PS1="pixelos:~ user$ "\nalias ll="ls -la"'
                        }
                    }
                },
                'System': {
                    type: 'dir',
                    name: 'System',
                    children: {
                        'kernel': {
                            type: 'file',
                            name: 'kernel',
                            content: 'PixelOS Kernel v1.0\nBuild: 2024.01.01'
                        },
                        'version.txt': {
                            type: 'file',
                            name: 'version.txt',
                            content: 'PixelOS 1.0 Monterey'
                        }
                    }
                }
            }
        };
    }

    /** Resolve a path string to a node */
    resolve(pathStr) {
        if (pathStr === '/' || pathStr === '') return this.root;

        const parts = pathStr.split('/').filter(p => p.length > 0);
        let node = this.root;

        for (const part of parts) {
            if (part === '..') {
                // Parent navigation not supported in simple tree
                continue;
            }
            if (part === '.' || part === '~') {
                node = this.root.children['Home'] || this.root;
                continue;
            }
            if (!node.children || !node.children[part]) {
                return null;
            }
            node = node.children[part];
        }

        return node;
    }

    /** List directory contents */
    ls(pathStr) {
        const node = this.resolve(pathStr);
        if (!node || node.type !== 'dir') return null;
        return Object.keys(node.children || {});
    }

    /** Read file content */
    cat(pathStr) {
        const node = this.resolve(pathStr);
        if (!node || node.type !== 'file') return null;
        return node.content;
    }

    /** Check if path is a directory */
    isDir(pathStr) {
        const node = this.resolve(pathStr);
        return node && node.type === 'dir';
    }

    /** Get absolute path from relative parts */
    resolvePath(cwd, relative) {
        if (relative.startsWith('/')) return relative;
        if (relative === '~') return '/Home';
        if (relative.startsWith('~/')) return '/Home' + relative.slice(1);

        const parts = cwd.split('/').filter(p => p.length > 0);
        const relParts = relative.split('/').filter(p => p.length > 0);

        for (const part of relParts) {
            if (part === '..') {
                parts.pop();
            } else if (part !== '.') {
                parts.push(part);
            }
        }

        return '/' + parts.join('/');
    }
}
