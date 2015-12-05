require.config({
	path:{
		"lazyLoad":"lazyLoad"
	},
	shim:{
		"lazyLoad":{
			exports:"lazyLoad"
		}
	}
});

require(["lazyLoad"],function(lazyLoad){
	// console.log(lazyLoad);
	new lazyLoad({active:true,autoLoad:false});
})