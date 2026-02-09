export const CollisionUtils = {
    // Check if a line segment (p1-p2) intersects with a rectangle (rect)
    // rect: {x, y, width, height}
    lineIntersectsRect(p1, p2, rect) {
        // 1. Check if either endpoint is inside (Simple inclusion)
        if (CollisionUtils.pointInRect(p1, rect) || CollisionUtils.pointInRect(p2, rect)) {
            return true;
        }

        // 2. Check intersection with each of the 4 edges
        const rLeft = rect.x;
        const rRight = rect.x + rect.width;
        const rTop = rect.y;
        const rBottom = rect.y + rect.height;

        // Top Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rLeft, y: rTop}, {x: rRight, y: rTop})) return true;
        // Bottom Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rLeft, y: rBottom}, {x: rRight, y: rBottom})) return true;
        // Left Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rLeft, y: rTop}, {x: rLeft, y: rBottom})) return true;
        // Right Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rRight, y: rTop}, {x: rRight, y: rBottom})) return true;

        return false;
    },

    // Standard Line-Line Intersection (p1-p2 vs p3-p4)
    lineIntersectsLine(p1, p2, p3, p4) {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (det === 0) {
            return false;
        } else {
            const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
            const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    },

    pointInRect(p, rect) {
        return p.x >= rect.x && 
               p.x <= rect.x + rect.width && 
               p.y >= rect.y && 
               p.y <= rect.y + rect.height;
    }
};