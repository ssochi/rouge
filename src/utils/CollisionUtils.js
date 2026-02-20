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
    // rect: {x, y, width, height} or {x, y, w, h}
    lineIntersectsRect(p1, p2, rect) {
        // Inline normalizeRect to avoid temporary object allocation
        const rx = rect.x;
        const ry = rect.y;
        const rw = rect.width ?? rect.w ?? 0;
        const rh = rect.height ?? rect.h ?? 0;

        // AABB fast-reject: skip if line segment AABB doesn't overlap rect
        const minX = p1.x < p2.x ? p1.x : p2.x;
        const maxX = p1.x > p2.x ? p1.x : p2.x;
        const minY = p1.y < p2.y ? p1.y : p2.y;
        const maxY = p1.y > p2.y ? p1.y : p2.y;
        if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) {
            return false;
        }

        // Inline pointInRect for both endpoints
        if (p1.x >= rx && p1.x <= rx + rw && p1.y >= ry && p1.y <= ry + rh) return true;
        if (p2.x >= rx && p2.x <= rx + rw && p2.y >= ry && p2.y <= ry + rh) return true;

        // Check intersection with each of the 4 edges
        const rRight = rx + rw;
        const rBottom = ry + rh;

        // Top Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rx, y: ry}, {x: rRight, y: ry})) return true;
        // Bottom Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rx, y: rBottom}, {x: rRight, y: rBottom})) return true;
        // Left Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rx, y: ry}, {x: rx, y: rBottom})) return true;
        // Right Edge
        if (CollisionUtils.lineIntersectsLine(p1, p2, {x: rRight, y: ry}, {x: rRight, y: rBottom})) return true;

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
