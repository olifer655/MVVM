// 观察者的目的就是给需要变化的那个元素增加一个观察者,当数据变化就执行对应的方法
class Watcher {
    constructor(vm,expr,cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 先获取一下老的值 保留起来
        this.value = this.get();
        // 每次 new Watcher() 的时候都会取实例（vm）上获取值，（会掉get 方法）
    }
    // 老套路获取值的方法，这里先不进行封装
    getVal(vm, expr) { 
        expr = expr.split('.'); 

        return expr.reduce((prev, next) => {
            return prev[next];
        }, vm.$data);
    }
    get(){
        // 在 Compile 编译 text 或者 model 时都会new Watcher()
        Dep.target = this; // this => 当前watcher
        // 另外注意这里的Dep 是全局 Dep
        
        // 这里get 数据会调用 Observer 的defineReactive 方法的get
        // 这样通过 dep 就把 data 和watcher 关联起来了
        let value = this.getVal(this.vm, this.expr);
        // 方便其他属性使用，实现每个变化的数据都有一个独立的数组
        Dep.target = null; 
        return value;
    }
    // 对外暴露的方法，如果值改变就可以调用这个方法来更新
    update(){
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if(newValue != oldValue){
            this.cb(newValue); // 对应watch的callback
        }
    }
}
// 用新值和老值进行比对,如果数据变化就执行对应的方法