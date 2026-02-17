export const PianoObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 16, width: 56, height: 14 };
        obj.hp = 80;
        obj.shadow = { type: 'rect', x: 4, y: 16, w: 56, h: 14 };
    }
};
