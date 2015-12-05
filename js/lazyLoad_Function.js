/**
 * Created by zxy on 2015/9/30.
 */
var tools = {
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
    }
};
//定时器
var time;
//还未加载的图片们
var unload = [];
//正在加载的图片们
var loading = [];
//初始化
function initLazy(){
//    if(!ele.nodeType||ele.nodeType !== 1)throw('ele should be a element');
//    unload = ele.querySelectorAll('img[data-img]');
    unload = document.querySelectorAll('img[data-img]');
    unload = Array.prototype.slice.call(unload,0,unload.length);
    var unloadLen = unload.length;
    if(unloadLen === 0){
        return false;
    }
    //屏幕上边缘
    var scTop = document.documentElement.scrollTop||document.body.scrollTop;
    //下边缘
    var scBottom = document.documentElement.clientHeight + scTop;
    for(var i = 0;i < unloadLen;i++){
        //去掉已加载的图片
        if(unload[i].getAttribute('src') !== null){
            unload.splice(i,1);
            unloadLen = unload.length;
            i--;
            continue;
        }
        var y = pageY(unload[i]);
        if(loadImg(i,scTop,scBottom)){
            unloadLen = unload.length;
            i--;
            continue;
        }
        //保存图片在页面的位置
        tools.dataSet(unload[i],'pageY',y);
    }
    //将图片按位置先后排序
    unload.sort(function(a,b){
        return tools.dataSet(a,pageY) - tools.dataSet(b,pageY);
    });
}

//Y轴位置
function pageY(ele){
    var top = 0;
    for(;ele.nodeName.toLocaleUpperCase() !== 'BODY';ele = ele.offsetParent){
        top += ele.offsetTop;
    }
    return top;
}

//加载图片
function loadImg(i,scTop,scBottom){
    var isTop = false,
        isBottom = false;
    var iTop = pageY(unload[i]);
    var iBottom = iTop + unload[i].offsetHeight;
    isTop = !!(iTop > scTop&&iTop < scBottom);
    isBottom = !!(iBottom < scTop&&iBottom < scBottom);
    //如果图片正在视野中，加载填充src并操作数组
    if(isTop||isBottom){
        loading[loading.length] = unload[i];
        tools.on(unload[i],'load',loadedImg);
        unload[i].src = tools.dataSet(unload[i],'img');
        unload.splice(i,1);
        return true;
    }
    return false;
}

//绑定onload，加载完成后从loading中剔除
function loadedImg(){
    var index = loading.indexOf(this);
    if(index !== -1){
        loading.splice(index,1);
    }
    tools.remove(this,'load',loadedImg);
}

//拖动滚动条时加载图片
function loadLazy(){
    var unloadLen = unload.length;
    if(unloadLen === 0){
        return false;
    }
    //屏幕上边缘
    var scTop = document.documentElement.scrollTop||document.body.scrollTop;
    //下边缘
    var scBottom = document.documentElement.clientHeight + scTop;

    for(var i = 0;i < unloadLen;i++){
        if(loadImg(i,scTop,scBottom)){
            unloadLen = unload.length;
            i--;
        }
        else{
            break;
        }
    }
}

function interLazy(){
    if(unload.length === 0){
        clearInterval(time);
    }
    else if(loading.length === 0){
        loading = unload.splice(0,10);
        var len = loading.length;
        for(var i = 0;i < len;i++){
            tools.on(loading[i],'load',loadedImg);
            loading[i].src = tools.dataSet(loading[i],'img');
        }
    }
}

tools.on(window,'load',function(){
    initLazy();
    time = setInterval(interLazy,1000);
});
tools.on(window,'resize',initLazy);
//目前的demo因为img元素大小会改变，img位置会随时变化，所以不能一次获取完之后直接使用
//项目中建议img定好长宽，使用loadLazy
//tools.on(window,'scroll',loadLazy);
tools.on(window,'scroll',initLazy);

