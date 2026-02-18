export const WashingMachineObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 16, width: 24, height: 14 };
        obj.hp = 60;
        obj.shadow = { type: 'rect', x: 4, y: 16, w: 24, h: 14 };
    }
};
