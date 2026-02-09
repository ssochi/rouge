export function toWorldRect(obj, hb) {
    return {
        x: obj.x + hb.offsetX,
        y: obj.y + hb.offsetY,
        w: hb.width,
        h: hb.height,
        width: hb.width,
        height: hb.height
    };
}

export function toWorldRects(obj, hitboxes) {
    return hitboxes.map(hb => toWorldRect(obj, hb));
}

