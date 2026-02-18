export const WorkbenchObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 18, width: 56, height: 12 };
        obj.hp = 70;
        obj.shadow = { type: 'rect', x: 4, y: 18, w: 56, h: 12 };
    }
};
