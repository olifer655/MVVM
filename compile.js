class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el); // #app 或者 document.getElementById
        this.vm = vm;
        if(this.el) {
            // 如果这个实例元素存在，那么编译
            // 1. 把真实dom 移入内存中 fragment： 文档碎片
            let fragment = this.node2fragment(this.el);
            // console.log(fragment)
            // 2. 编译 => 提取想要的元素节点 v-model 和 文本节点 {{}}
            this.compile(fragment);
            // 3. 把编译好的fragment 重新插入真实的dom中
            this.el.appendChild(fragment);
        }
    }

    /** 专门写一些辅助方法 */
    isElementNode(node) {
        return node.nodeType === 1;
    }
    isDirective(attrName) {
        return attrName.includes('v-');
    }

    /** 核心代码 */
    compileElement(node) {
        // 提前 v-model v-text 的 属性
        let attrs = node.attributes;
        // console.log(attrs)
        Array.from(attrs).forEach((attr) => {
            // console.log(attr);
            let attrName = attr.name;
            let [, type] = attrName.split('-');
            // 判断属性名里是否包含 v-
            if(this.isDirective(attrName)) {
                // 取到对应的值放到节点总
                let expr = attr.value; // 表达式 this.vm.$data
                CompileUtil[type](node, this.vm, expr)
            }

        })
    }
    compileText(node) {
        // 带 {{}}
        let expr = node.textContent;
        let reg = /\{\{([^}]+)\}\}/g; // {{a}} {{b}} {{c}}

        if(reg.test(expr)) {
            // node this.vm.$data text
            CompileUtil['text'](node, this.vm, expr)
        }
        
    }
    compile(fragment) {
        // 需要递归
        let childNodes = fragment.childNodes;
        // console.log(childNodes)
        Array.from(childNodes).forEach((node) => {
            if(this.isElementNode(node)) {
                // 是元素,还需要继续深入的检查
                // console.log('element' + node)
                // 这里需要编译元素
                this.compileElement(node);
                this.compile(node); // 递归取到所有本文
            } else {
                // 文本节点
                // console.log('文本' + node)
                // 这里需要编译文本
                this.compileText(node);

            }
        })
    }
    node2fragment(el) { // 将el中的内容全部放到内存中
        let fragment = document.createDocumentFragment();
        let firstChild;
  
        while(firstChild = el.firstChild) {
            // 将真实的dom  从上到下一次转移进内存
            fragment.appendChild(firstChild); 
        }
        return fragment;
    }
}

CompileUtil = {
    getValue(vm, expr) { // 获取元素上的数据
        expr = expr.split('.'); // [a, b, c, d, e, f]
        return expr.reduce((prev, next) => { // vm.$data.a
            return prev[next];
        }, vm.$data)
    },
    setValue(vm, expr, value) { // expr [message.a]
        expr = expr.split('.');
        // 收敛
        return expr.reduce((pre, next, currentIndex) => {
            if(currentIndex === expr.length - 1) {
                return pre[next] = value; // 赋值 调用set
            }
            return pre[next];
        }, vm.$data) 
    },
    getTextValue(expr, vm) { // 获取编译文本的结果
        return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            // 依次去去数据对应的值
            return this.getValue(vm, arguments[1]);
        })
    },
    model(node, vm, expr) { // 指令处理
        // "message.a" => [message, a] => message.a
        let updateFn = this.updater['modelUpdater'];
        // 这里应该加一个监控， 数据变化了， 应该调用watcher 的cb
        new Watcher(vm, expr, (newValue) => {
            console.log(newValue)
            // 当值变化后调用cb 将新值传递过来
            updateFn && updateFn(node, this.getValue(vm, expr));
        })
        node.addEventListener('input', (e) => {
            let newValue = e.target.value;
            this.setValue(vm, expr, newValue)
        })
        updateFn && updateFn(node, this.getValue(vm, expr));
    },
    text(node, vm, expr) { // 文本处理
        // {{message.a}} => hello
        let updateFn = this.updater['textUpdater'];
        let value = this.getTextValue(expr, vm);
        // {{a}} {{b}} 变化的可能是多个值
        expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            new Watcher(vm, arguments[1], (newValue) => {
                // 数据变化了，文本节点需要重新获取依赖的属性更新文本内容
                updateFn && updateFn(node, this.getTextValue(expr, vm));
            })
            updateFn && updateFn(node, value);
        })
    },
    updater: {
        modelUpdater(node, value) {
            node.value = value;
        },
        textUpdater(node, value) {
            node.textContent = value;
        }
    }
}