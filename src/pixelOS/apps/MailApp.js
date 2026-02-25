/**
 * MailApp - Email client with polished macOS-style UI
 */
import { App } from './App.js';

// Folder icon pixel art patterns (7x5)
const FOLDER_ICONS = {
    inbox: [
        '  ###  ',
        ' #   # ',
        '#######',
        '# ### #',
        '#######',
    ],
    sent: [
        '    #  ',
        '   ##  ',
        '  # #  ',
        ' #  #  ',
        '#####  ',
    ],
    drafts: [
        ' ####  ',
        ' #   # ',
        ' ####  ',
        ' #     ',
        ' #     ',
    ],
};

// Avatar colors per sender
const AVATAR_COLORS = {
    'Admin':      '#007aff',
    'Zombie Corp':'#34c759',
    'PixelBot':   '#ff9500',
    'Shop':       '#af52de',
    'You':        '#8e8e93',
    'default':    '#5ac8fa',
};

export class MailApp extends App {
    constructor() {
        super('mail', 'Mail');
        this.folders = [
            { id: 'inbox',  label: 'Inbox',  icon: 'inbox'  },
            { id: 'sent',   label: 'Sent',   icon: 'sent'   },
            { id: 'drafts', label: 'Drafts', icon: 'drafts' },
        ];
        this.selectedFolder = 0;
        this.selectedMail = -1;
        this.hoveredFolder = -1;
        this.hoveredMail = -1;
        this.hoveredBack = false;

        this.mails = {
            0: [ // Inbox
                {
                    from: 'Admin',
                    subject: 'Welcome to PixelOS!',
                    date: 'Today',
                    preview: 'Thanks for using PixelOS...',
                    body: 'Thanks for using PixelOS.\nWe hope you enjoy\nthis tiny computer.\n\nHave fun exploring\nall the apps!',
                    read: false
                },
                {
                    from: 'Zombie Corp',
                    subject: 'Job Offer',
                    date: 'Yesterday',
                    preview: 'We have an opening for...',
                    body: 'Dear survivor,\n\nWe have an opening\nfor a brain chef.\n\nSalary: unlimited\nbrains.\n\nPlease reply ASAP.',
                    read: false
                },
                {
                    from: 'PixelBot',
                    subject: 'Security Alert',
                    date: 'Mon',
                    preview: '42 zombies detected...',
                    body: 'Warning: 42 zombies\ndetected nearby.\n\nRecommendation:\nRun. Now.\n\nStay safe!',
                    read: false
                },
                {
                    from: 'Shop',
                    subject: 'Sale: 50% off ammo!',
                    date: 'Sun',
                    preview: 'Limited time offer on...',
                    body: 'Limited time offer!\n\nAll ammo types are\n50% off this week.\n\nStock up while you\nstill can.',
                    read: true
                },
            ],
            1: [ // Sent
                {
                    from: 'You',
                    subject: 'Re: Survival Tips',
                    date: 'Sat',
                    preview: 'Thanks for the tips...',
                    body: 'Thanks for the tips!\nI will keep my\nweapons loaded.\n\nBest regards,\nSurvivor',
                    read: true
                },
            ],
            2: [ // Drafts
                {
                    from: 'You',
                    subject: 'Help needed...',
                    date: 'Fri',
                    preview: 'To whoever finds this...',
                    body: 'To whoever finds\nthis message:\n\nI am trapped in a\npixel computer.\n\nSend help.',
                    read: true
                },
            ],
        };
    }

    open(windowManager) {
        this.window = windowManager.createWindow({
            x: 50, y: 20,
            width: 240, height: 155,
            title: 'Mail',
            appId: this.id,
            app: this
        });
    }

    draw(r, x, y, w, h) {
        const sidebarW = 48;

        // ── Sidebar ──
        r.fillRect(x, y, sidebarW, h, '#2c2c2e');

        // Sidebar header
        r.drawText('Mailboxes', x + 4, y + 4, '#8e8e93');
        r.fillRect(x + 2, y + 12, sidebarW - 4, 1, '#3a3a3c');

        for (let i = 0; i < this.folders.length; i++) {
            const folder = this.folders[i];
            const fy = y + 16 + i * 14;
            const isSelected = i === this.selectedFolder;
            const isHovered = i === this.hoveredFolder;

            if (isSelected) {
                r.fillRoundRect(x + 2, fy - 1, sidebarW - 4, 12, 2, '#007aff');
            } else if (isHovered) {
                r.fillRoundRect(x + 2, fy - 1, sidebarW - 4, 12, 2, '#3a3a3c');
            }

            // Folder icon (tiny pixel art)
            const iconData = FOLDER_ICONS[folder.icon];
            if (iconData) {
                const iconColor = isSelected ? '#ffffff' : '#8e8e93';
                this._drawPixelIcon(r, x + 4, fy + 1, iconData, iconColor);
            }

            // Folder label
            const labelColor = isSelected ? '#ffffff' : '#cccccc';
            r.drawText(folder.label, x + 13, fy + 2, labelColor);

            // Unread badge for inbox
            if (i === 0) {
                const unread = this.mails[0].filter(m => !m.read).length;
                if (unread > 0) {
                    const badge = String(unread);
                    const bw = r.measureText(badge) + 4;
                    const bx = x + sidebarW - bw - 3;
                    r.fillRoundRect(bx, fy, bw, 10, 3, isSelected ? 'rgba(255,255,255,0.3)' : '#ff3b30');
                    r.drawTextCentered(badge, bx + bw / 2, fy + 2, '#ffffff');
                }
            }
        }

        // Sidebar separator line
        r.fillRect(x + sidebarW, y, 1, h, '#3a3a3c');

        // ── Content area ──
        const cx = x + sidebarW + 1;
        const cw = w - sidebarW - 1;

        if (this.selectedMail >= 0) {
            this._drawMailDetail(r, cx, y, cw, h);
        } else {
            this._drawMailList(r, cx, y, cw, h);
        }
    }

    _drawPixelIcon(r, x, y, pattern, color) {
        r.ctx.fillStyle = color;
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === '#') {
                    r.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    _drawMailList(r, x, y, w, h) {
        // Content background
        r.fillRect(x, y, w, h, '#1c1c1e');

        // Folder title bar
        const folder = this.folders[this.selectedFolder];
        r.fillRect(x, y, w, 13, '#2c2c2e');
        r.drawText(folder.label, x + 4, y + 4, '#ffffff');
        const unread = (this.mails[this.selectedFolder] || []).filter(m => !m.read).length;
        if (unread > 0) {
            const countStr = `${unread} unread`;
            r.drawTextRight(countStr, x + w - 4, y + 4, '#8e8e93');
        }
        r.fillRect(x, y + 13, w, 1, '#3a3a3c');

        const mails = this.mails[this.selectedFolder] || [];

        if (mails.length === 0) {
            r.drawTextCentered('No Messages', x + w / 2, y + h / 2 - 8, '#8e8e93');
            r.drawTextCentered('This folder', x + w / 2, y + h / 2, '#555555');
            r.drawTextCentered('is empty.', x + w / 2, y + h / 2 + 8, '#555555');
            return;
        }

        const itemH = 24;
        const listY = y + 14;

        for (let i = 0; i < mails.length; i++) {
            const mail = mails[i];
            const my = listY + i * itemH;
            if (my + itemH > y + h) break;

            const isHovered = i === this.hoveredMail;

            // Row background
            if (isHovered) {
                r.fillRect(x, my, w, itemH - 1, '#2c2c2e');
            }

            // Avatar circle
            const avatarColor = AVATAR_COLORS[mail.from] || AVATAR_COLORS['default'];
            const ax = x + 10;
            const ay = my + Math.floor(itemH / 2);
            r.fillCircle(ax, ay, 5, avatarColor);
            // Avatar initial
            const initial = mail.from[0].toUpperCase();
            r.drawTextCentered(initial, ax, ay - 3, '#ffffff');

            // Unread indicator dot
            if (!mail.read) {
                r.fillCircle(x + 3, my + 6, 1, '#007aff');
            }

            // From (bold feel via brighter color for unread)
            const fromColor = mail.read ? '#8e8e93' : '#ffffff';
            r.drawText(mail.from, x + 18, my + 3, fromColor);

            // Date (right aligned)
            const dateColor = mail.read ? '#555555' : '#007aff';
            r.drawTextRight(mail.date, x + w - 3, my + 3, dateColor);

            // Subject
            const subjectColor = mail.read ? '#636366' : '#cccccc';
            const maxChars = Math.floor((w - 22) / 5);
            const subject = mail.subject.length > maxChars
                ? mail.subject.slice(0, maxChars - 2) + '..'
                : mail.subject;
            r.drawText(subject, x + 18, my + 11, subjectColor);

            // Preview line
            const prevColor = '#48484a';
            const prevMax = Math.floor((w - 22) / 5);
            const preview = (mail.preview || '').slice(0, prevMax);
            r.drawText(preview, x + 18, my + 18, prevColor);

            // Bottom separator
            r.fillRect(x + 18, my + itemH - 1, w - 20, 1, '#2a2a2c');
        }
    }

    _drawMailDetail(r, x, y, w, h) {
        const mails = this.mails[this.selectedFolder] || [];
        const mail = mails[this.selectedMail];
        if (!mail) return;

        // Background
        r.fillRect(x, y, w, h, '#1c1c1e');

        // Toolbar with back button
        r.fillRect(x, y, w, 14, '#2c2c2e');
        const backColor = this.hoveredBack ? '#0a84ff' : '#007aff';
        r.drawText('< Back', x + 3, y + 4, backColor);
        r.fillRect(x, y + 14, w, 1, '#3a3a3c');

        // Header section
        const hx = x + 4;
        let hy = y + 18;

        // Avatar + From
        const avatarColor = AVATAR_COLORS[mail.from] || AVATAR_COLORS['default'];
        r.fillCircle(hx + 6, hy + 5, 6, avatarColor);
        r.drawTextCentered(mail.from[0].toUpperCase(), hx + 6, hy + 2, '#ffffff');

        r.drawText(mail.from, hx + 16, hy, '#ffffff');
        r.drawText(mail.date, hx + 16, hy + 8, '#8e8e93');

        hy += 20;

        // Subject (larger visual weight)
        r.drawText(mail.subject, hx, hy, '#ffffff');
        hy += 10;

        // Divider
        r.fillRect(x + 4, hy, w - 8, 1, '#3a3a3c');
        hy += 5;

        // Body text
        const lines = mail.body.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (hy + 8 > y + h) break;
            r.drawText(lines[i], hx, hy, '#cccccc');
            hy += 8;
        }
    }

    onMouseDown(lx, ly) {
        const sidebarW = 48;

        // Sidebar click
        if (lx < sidebarW) {
            for (let i = 0; i < this.folders.length; i++) {
                const fy = 16 + i * 14;
                if (ly >= fy - 1 && ly < fy + 11) {
                    this.selectedFolder = i;
                    this.selectedMail = -1;
                    return;
                }
            }
            return;
        }

        const cx = sidebarW + 1;

        // Detail view: back button
        if (this.selectedMail >= 0) {
            if (lx >= cx && lx < cx + 40 && ly >= 0 && ly < 14) {
                this.selectedMail = -1;
                return;
            }
            return;
        }

        // Mail list click (skip title bar 14px)
        const mails = this.mails[this.selectedFolder] || [];
        const itemH = 24;
        const listY = 14;
        for (let i = 0; i < mails.length; i++) {
            const my = listY + i * itemH;
            if (ly >= my && ly < my + itemH) {
                this.selectedMail = i;
                mails[i].read = true;
                return;
            }
        }
    }

    onMouseMove(lx, ly) {
        const sidebarW = 48;
        this.hoveredFolder = -1;
        this.hoveredMail = -1;
        this.hoveredBack = false;

        // Sidebar hover
        if (lx < sidebarW) {
            for (let i = 0; i < this.folders.length; i++) {
                const fy = 16 + i * 14;
                if (ly >= fy - 1 && ly < fy + 11) {
                    this.hoveredFolder = i;
                    return;
                }
            }
            return;
        }

        const cx = sidebarW + 1;

        // Detail view: back button hover
        if (this.selectedMail >= 0) {
            if (lx >= cx && lx < cx + 40 && ly >= 0 && ly < 14) {
                this.hoveredBack = true;
            }
            return;
        }

        // Mail list hover
        const mails = this.mails[this.selectedFolder] || [];
        const itemH = 24;
        const listY = 14;
        for (let i = 0; i < mails.length; i++) {
            const my = listY + i * itemH;
            if (ly >= my && ly < my + itemH) {
                this.hoveredMail = i;
                return;
            }
        }
    }
}
