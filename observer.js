class Observer {
    constructor(data) {
        this.observe(data);
    } 
    observe(data) {
        // 把data的所有属性改成 get 和 set 
        if(!data || typeof data !== 'object') return;
        // 将数据一一 劫持
        Object.keys(data).forEach((key) => {
            // 劫持
            this.defineReactive(data, key, data[key]); 
            this.observe( data[key]); // 深度递归劫持
        })
    }
    // 定义响应式
    defineReactive(obj, key, value) {
        let vm = this;
        let dep = new Dep(); // 每个变化的数据都有一个独立的数组
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                // 编译取值的时候， Dep.target为null
                // 只有new Watcher后，  Dep.target才有指向
                // 另外注意这里的Dep 是全局 Dep, Dep 和 dep不是同一个
                Dep.target && dep.addSub(Dep.target)
                return value;
            },
            set(newValue) {
                if(newValue !== value) {
                    // 这里的this不是当前实例
                    // 如果是对象继续劫持
                    vm.observe(newValue);
                    value = newValue;
                    dep.notify(); // 通知所有热吗数据更新了
                }
            }
       }) 
    }
}

// 发布订阅
class Dep {
    constructor() {
        this.subs = [];// 订阅数组
    }
    addSub(watcher) {
        this.subs.push(watcher);
    }
    notify() {
        this.subs.forEach((watcher) => watcher.update());
    }

}