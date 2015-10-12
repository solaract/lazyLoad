/**
 * Created by zxy on 2015/9/30.
 */



/**
 * option{
 *  ele:document,      包含图片的容器
    autoLoad:true,    首屏加载完后自动接着加载
    active:false      动态的布局用true
    loadTime:0,       计时器
    unload:[],        还未加载的图片们
    loading:[]        正在加载的图片们
 *
 * }
 */
var lazyLoad = (function(){
    var LazyLoad = function(option){
        if(option.ele){
            if(!option.ele||!ele.nodeType === 1){
                throw('option.ele should be element')
            }
        }
        if(!option){
            option = {}
        }
        LazyLoad.Tools.extend(this,option,LazyLoad.DEFAULTS);
        this.init();
    };
    LazyLoad.DEFAULTS = {
        ele:document,
        //首屏加载完后自动接着加载
        autoLoad:true,
        //动态的布局用true
        active:false,
        loadTime:0,
        unload:[],
        loading:[]
    };
    LazyLoad.Tools = {
        /**
         *
         * @param obj
         * @param extensions
         * @returns {*}
         */
        //传入两个以上参数，依次扩展第一个obj
        extend:function(obj,extensions){
            if(arguments.length < 2){
                return obj;
            }
            var obj_ar = Array.prototype.slice.call(arguments,1);
            for(var i = 0,len = obj_ar.length;i < len;i++){
                for(var key in obj_ar[i]){
                    if(!obj.hasOwnProperty(key)&&obj_ar[i].hasOwnProperty(key)){
                        obj[key] = obj_ar[i][key];
                    }
                }
            }
            return obj;
        },
        /**
         *
         * @param ele
         * @param data_name
         * @param data
         * @returns {*} 属性值
         */
        //dataset兼容
        dataSet:function(ele,data_name,data){
            function name(str){
                var name_ar = [];
                var reg = /[A-Z]/g;
                var result = reg.exec(str);
                for(var i = 0,j = 0,k = 0;result;i++,result = reg.exec(str)){
                    k = result.index;
                    name_ar[i] = str.substring(j,k).toLowerCase();
                    j = k;
                }
                name_ar[i] = str.substring(j).toLowerCase();
                return 'data-'+name_ar.join("-");
            }
            if(ele.dataset){
                if(data){
                    ele.dataset[data_name] = data;
                }
                return ele.dataset[data_name];
            }
            else{
                var dataName = name(data_name);
                if(data){
                    ele.setAttribute(dataName,data);
                }
                return ele.getAttribute(dataName);
            }
        },
        /**
         *
         * @param ele
         * @param event
         * @param callback
         * @param cap
         */
        //简单事件绑定兼容
        on:function(ele,event,callback,cap){
            cap = cap||false;
            if(ele.addEventListener){
                ele.addEventListener(event,callback,cap);
            }
            else if(ele.attachEvent){
                ele.attachEvent('on'+event,callback);
            }
            else{
                ele['on'+event] = callback;
            }
        },
        /**
         *
         * @param ele
         * @param event
         * @param callback
         * @param cap
         */
        //简单事件解绑兼容
        remove:function(ele,event,callback,cap){
            cap = cap||false;
            if(ele.removeEventListener){
                ele.removeEventListener(event,callback,cap);
            }
            else if(ele.detachEvent){
                ele.detachEvent('on'+event,callback);
            }
            else{
                ele['on'+event] = null;
            }
        },
        //Y轴位置
        pageY:function(ele){
            var top = 0;
            for(;ele.nodeName.toLocaleUpperCase() !== 'BODY';ele = ele.offsetParent){
                top += ele.offsetTop;
            }
            return top;
        }
    };

    LazyLoad.prototype.init = function(){
        var that = this;
        function active(){
            activeLazy(that);
        }
        if(this.autoLoad){
            var auto = function(){
                interLazy(that);
            };
            this.loadTime = setInterval(auto,1000);

        }
        LazyLoad.Tools.on(window,'load',active);
        LazyLoad.Tools.on(window,'resize',active);
//        目前的demo因为img元素大小会改变，img位置会随时变化，所以不能一次获取完之后直接使用
//        项目中建议img定好长宽，使用loadLazy
        if(this.active){
            LazyLoad.Tools.on(window,'scroll',active);
        }
        else{
            var lazy = function(){
                loadLazy(that);
            };
            LazyLoad.Tools.on(window,'scroll',lazy);
        }
    };
    function activeLazy(that){
        that.unload = that.ele.querySelectorAll('img[data-img]');
        that.unload = Array.prototype.slice.call(that.unload,0,that.unload.length);
        var unloadLen = that.unload.length;
        if(unloadLen === 0){
            return false;
        }
        //屏幕上边缘
        var scTop = document.documentElement.scrollTop||document.body.scrollTop;
        //下边缘并添加提前量
        var scBottom = document.documentElement.clientHeight + scTop + 100;
        for(var i = 0;i < unloadLen;i++){
            //去掉已加载的图片
            if(that.unload[i].getAttribute('src') !== null){
                that.unload.splice(i,1);
                unloadLen = that.unload.length;
                i--;
                continue;
            }
            var y = LazyLoad.Tools.pageY(that.unload[i]);
            if(that.loadImg(i,scTop,scBottom)){
                unloadLen = that.unload.length;
                i--;
                continue;
            }
            //保存图片在页面的位置
            LazyLoad.Tools.dataSet(that.unload[i],'pageY',y);
        }
        //将图片按位置先后排序
        that.unload.sort(function(a,b){
            return LazyLoad.Tools.dataSet(a,'pageY') - LazyLoad.Tools.dataSet(b,'pageY');
        });
    }


    //加载图片
    LazyLoad.prototype.loadImg = function(i,scTop,scBottom){
        var isTop = false,
            isBottom = false;
        //获取图片位置
        var iTop = LazyLoad.Tools.pageY(this.unload[i]);
        var iBottom = iTop + this.unload[i].offsetHeight;
        isTop = !!(iTop > scTop&&iTop < scBottom);
        isBottom = !!(iBottom < scTop&&iBottom < scBottom);
        //如果图片正在视野中，加载填充src并操作数组
        if(isTop||isBottom){
            this.loading[this.loading.length] = this.unload[i];
            this.loadedImg(i);
            this.unload[i].src = LazyLoad.Tools.dataSet(this.unload[i],'img');
            this.unload.splice(i,1);
            return true;
        }
        return false;
    };
    //绑定onload，加载完成后从loading中剔除
    LazyLoad.prototype.loadedImg = function(i){
        var that = this;
        function loaded(){
            var index = that.loading.indexOf(this);
            if(index !== -1){
                that.loading.splice(index,1);
            }
            LazyLoad.Tools.remove(this,'load',loaded);
        }
        LazyLoad.Tools.on(this.unload[i],'load',loaded);
    };

    //静态加载图片
    function loadLazy(that){
        var unloadLen = that.unload.length;
        if(unloadLen === 0){
            return false;
        }
        //屏幕上边缘
        var scTop = document.documentElement.scrollTop||document.body.scrollTop;
        //下边缘
        var scBottom = document.documentElement.clientHeight + scTop;

        for(var i = 0;i < unloadLen;i++){
            if(that.loadImg(i,scTop,scBottom)){
                unloadLen = that.unload.length;
                i--;
            }
            else{
                break;
            }
        }
    }

    //后续自动加载
    function interLazy(that){
        if(that.unload.length === 0){
            clearInterval(that.loadTime);
        }
        else if(that.loading.length === 0){
            that.loading = that.unload.slice(0,10);
            var len = that.loading.length;
            for(var i = 0;i < len;i++){
                that.loadedImg(i);
                that.loading[i].src = LazyLoad.Tools.dataSet(that.loading[i],'img');
            }
            that.unload.splice(0,10);
        }
    }
    return LazyLoad;
}());
var a = new lazyLoad({active:true,autoLoad:false});
