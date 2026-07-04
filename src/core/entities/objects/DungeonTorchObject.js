// 地牢壁挂火把：纯氛围光源装饰。
// 放置在墙 tile 原点上，视觉压在墙体前脸；不阻挡移动、不吃子弹、不可破坏。
// 光源定义见 LightEmitterRegistry.OBJECT_LIGHTS.dungeon_torch（光心下移到墙南侧地板，避免被墙自遮蔽）。
export const DungeonTorchObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 }; // 不阻挡移动
        obj.hp = 999;
        obj.isLocked = true;          // 不可破坏
        obj.noBulletCollision = true; // 子弹穿过（墙体本身负责拦截）
        obj.shadow = null;
        obj.blocksLight = false;
        obj.drawOffset = { x: 8, y: 4 };
        obj.occlusionSortY = 34;      // 略大于所属墙 tile 的 sortY(y+32)，压在墙前脸上
    },
    // 返回空数组使 Renderer 走 occlusionSortY 排序（而非零尺寸 hitbox 的 y）
    getOcclusionHitboxes() {
        return [];
    }
};
