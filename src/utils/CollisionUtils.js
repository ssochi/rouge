export const CollisionUtils = {
    normalizeRect(rect) {
        return {
            x: rect.x,
            y: rect.y,
            width: rect.width ?? rect.w ?? 0,
            height: rect.height ?? rect.h ?? 0
        };
    },

    // Check if a line segment (p1-p2) intersects with a rectangle (rect)
    // rect: {x, y, width, height}
    lineIntersectsRect(p1, p2, rect) {
        const r = CollisionUtils.normalizeRect(rect);

        // 1. Check if either endpoint is inside (Simple inclusion)
        if (CollisionUtils.pointInRect(p1, r) || CollisionUtils.pointInRect(p2, r)) {
            return true;
        }

        // 2. Check intersection with each of the 4 edges
        const rLeft = r.x;
        const rRight = r.x + r.width;
        const rTop = r.y;
        const rBottom = r.y + r.height;

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

    lineIntersectsRects(p1, p2, rects) {
        for (const rect of rects) {
            if (CollisionUtils.lineIntersectsRect(p1, p2, rect)) {
                return true;
            }
        }
        return false;
    },

    // Standard Line-Line Intersection (p1-p2 vs p3-p4)
    lineIntersectsLine(p1, p2, p3, p4) {
        const eps = 1e-6;
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (Math.abs(det) < eps) {
            return false;
        } else {
            const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
            const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
            return (
                lambda >= -eps && lambda <= 1 + eps &&
                gamma >= -eps && gamma <= 1 + eps
            );
        }
    },

    pointInRect(p, rect) {
        const r = CollisionUtils.normalizeRect(rect);
        return p.x >= r.x &&
               p.x <= r.x + r.width &&
               p.y >= r.y &&
               p.y <= r.y + r.height;
    },

    rayRectIntersect(origin, dir, rect, maxDist = Infinity) {
        const r = CollisionUtils.normalizeRect(rect);

        let tMin = 0;
        let tMax = maxDist;

        if (Math.abs(dir.x) < 1e-6) {
            if (origin.x < r.x || origin.x > r.x + r.width) return null;
        } else {
            const t1 = (r.x - origin.x) / dir.x;
            const t2 = (r.x + r.width - origin.x) / dir.x;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }

        if (Math.abs(dir.y) < 1e-6) {
            if (origin.y < r.y || origin.y > r.y + r.height) return null;
        } else {
            const t1 = (r.y - origin.y) / dir.y;
            const t2 = (r.y + r.height - origin.y) / dir.y;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }

        if (tMax < tMin || tMax < 0) return null;
        return tMin > 0 ? tMin : 0;
    },

    rayIntersectsRects(origin, dir, rects, maxDist = Infinity) {
        let min = maxDist;
        let found = false;
        for (const rect of rects) {
            const dist = CollisionUtils.rayRectIntersect(origin, dir, rect, min);
            if (dist !== null && dist < min) {
                min = dist;
                found = true;
            }
        }
        return found ? min : null;
    }
};
