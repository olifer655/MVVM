class MVVM{
    constructor(options) {
        // 一上来先把可用的东西挂在实例上
        this.$el = options.el;
        this.$data = options.data;

        // 判断如果有要编译的模版我们就开始编译
        if(this.$el) {
            // 数据劫持： 把对象的所有属性改成 get 和 set 
            new Observer(this.$data);
            // 为了实现 vm.message === vm.$data.message
            // 把 this.$data 代理到vm 上 
            this.proxyData( this.$data);
            // 用`数据`和`元素`进行编译
            new Compile(this.$el, this); 
        }
    }
    proxyData(data) {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get() {
                    return data[key];
                },
                set(newValue) {
                    data[key] = newValue;
                }
            })
        }) 
    }
}
