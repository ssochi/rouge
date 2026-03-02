export class FrameScratchPool {
    constructor() {
        this._arrays = [];
        this._cursor = 0;
    }

    reset() {
        for (let i = 0; i < this._cursor; i++) {
            this._arrays[i].length = 0;
        }
        this._cursor = 0;
    }

    takeArray() {
        const index = this._cursor++;
        let list = this._arrays[index];
        if (!list) {
            list = [];
            this._arrays[index] = list;
        } else {
            list.length = 0;
        }
        return list;
    }
}
