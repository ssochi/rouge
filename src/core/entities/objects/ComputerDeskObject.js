export const ComputerDeskObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 16, width: 32, height: 16 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 0, y: 16, w: 32, h: 16 };
        obj.drawOffset = { x: -4, y: -8 };
        obj.hintText = '[E] USE COMPUTER';
        obj.hintOffsetX = 16;
        obj.hintOffsetY = -10;
    },
    update(obj, player) {
        if (!player) {
            obj.showHint = false;
            return;
        }

        const cx = obj.x + (obj.width || 32) / 2;
        const cy = obj.y + (obj.height || 32) / 2;
        const dx = player.x - cx;
        const dy = player.y - cy;
        obj.showHint = Math.sqrt(dx * dx + dy * dy) < 50;
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.drawOffset.x,
            y: obj.y + obj.drawOffset.y,
            width: 40,
            height: 40
        };
    },
    interact() {
        return true;
    }
};
