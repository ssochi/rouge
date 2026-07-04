export const GrassTuftObject = {
    configure(obj) {
        // No physical collision for movement
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
        obj.hp = 8;
        obj.shadow = null;
        obj.drawOffset = { x: 8, y: 18 };
        obj.blocksLight = false;
        obj.isDecorativeOutdoor = true;
    },
    getHurtbox(obj) {
        // Visual Position: x+8, y+18. Size 16x16
        // Center Hurtbox (w12) in Visual (w16) -> offset +2 from visual X -> x+10
        return {
            x: obj.x + 10,
            y: obj.y + 18,
            width: 12,
            height: 16
        };
    }
};

export const GrassTallObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
        obj.hp = 8;
        obj.shadow = null;
        obj.drawOffset = { x: 8, y: 14 }; // Taller sprite 16x20
        obj.blocksLight = false;
        obj.isDecorativeOutdoor = true;
    },
    getHurtbox(obj) {
        // Visual Position: x+8, y+14. Size 16x20
        return {
            x: obj.x + 10,
            y: obj.y + 14,
            width: 12,
            height: 20
        };
    }
};

export const GrassFlowerObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
        obj.hp = 8;
        obj.shadow = null;
        obj.drawOffset = { x: 8, y: 18 };
        obj.blocksLight = false;
        obj.isDecorativeOutdoor = true;
    },
    getHurtbox(obj) {
        // Visual Position: x+8, y+18. Size 16x16
        return {
            x: obj.x + 10,
            y: obj.y + 18,
            width: 12,
            height: 16
        };
    }
};
