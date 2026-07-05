// FlankingBias —— 近战包抄偏置：同房存活近战达到阈值时，按左右翼给寻路向量加固定偏转角，
// 让近战怪从两侧合围，而非沿单一流场排成一列冲脸。
//
// 性能：侧翼角的 cos/sin 在构造时预计算一次；运行期每帧仅两次乘加做二维旋转——
//       零三角函数调用、零对象分配（结果写入实例上的 outX/outY 复用字段）。
//
// 群体计数：由 WorldSystem 每帧调用 setFlankGroupCount 注入「当前存活的近战参战数」
//          （地牢同一时刻仅一间战斗房 active，全局存活近战数即"同房存活近战"的良好近似）。
//          各实体在消费流场/导航方向前调用 refresh() 读取该计数决定是否启用。

let _flankGroupCount = 0;

/** WorldSystem 每帧调用：写入当前存活近战参战数（flankParticipant 且 hp>0 的敌人数）。 */
export function setFlankGroupCount(n) { _flankGroupCount = n | 0; }

/** 读取当前存活近战参战数。 */
export function getFlankGroupCount() { return _flankGroupCount; }

const DEG = Math.PI / 180;
let _wingCounter = 0; // 左右翼交替分配计数器（按实体构造顺序的索引奇偶分翼）

export class FlankingBias {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.angleDeg=25]  侧翼偏转角（度）
     * @param {number} [opts.minGroup=3]   启用阈值（含自身的存活近战数达到即合围）
     * @param {number} [opts.sign]         指定翼向（+1 左翼 / -1 右翼），缺省按全局计数器奇偶交替
     */
    constructor({ angleDeg = 25, minGroup = 3, sign } = {}) {
        this.minGroup = minGroup;
        // 索引奇偶分翼：偶数 +（逆时针）/ 奇数 -（顺时针）；cos/sin 一次性预算，运行期不再调用三角函数
        const s = (sign === 1 || sign === -1) ? sign : ((_wingCounter++ % 2 === 0) ? 1 : -1);
        this.sign = s;
        const a = angleDeg * DEG * s;
        this.cos = Math.cos(a);
        this.sin = Math.sin(a);

        this.active = false;
        this.outX = 0; // rotate() 结果复用字段（避免每帧分配）
        this.outY = 0;
    }

    /** 依据全局存活近战数刷新启用状态；返回是否启用。 */
    refresh() {
        this.active = getFlankGroupCount() >= this.minGroup;
        return this.active;
    }

    /**
     * 将寻路向量 (vx,vy) 旋转固定侧翼角，结果写入 outX/outY（零分配）。
     * 未启用时原样透传到 outX/outY。
     * @returns {boolean} 是否实际发生了旋转
     */
    rotate(vx, vy) {
        if (!this.active) { this.outX = vx; this.outY = vy; return false; }
        this.outX = vx * this.cos - vy * this.sin;
        this.outY = vx * this.sin + vy * this.cos;
        return true;
    }
}
