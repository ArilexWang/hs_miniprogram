module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1667832835674, function(require, module, exports) {
!function(t,o){"object"==typeof exports&&"undefined"!=typeof module?module.exports=o():"function"==typeof define&&define.amd?define(o):(t="undefined"!=typeof globalThis?globalThis:t||self)["spa-custom-hooks"]=o()}(this,(function(){let t;const o=(t,o,e)=>{try{if(o){let n=o.split(".");const s=e?n.length-1:n.length;for(let o=0;o<s;o++)t=t[n[o]];return e?{key:n[s],obj:t}:t}return t}catch(t){return}},e=o=>t&&t.state?t:o&&o.$store||{};class n{constructor(t){let{customhook:o,name:e,destroy:n,hit:s=!1,watchKey:i,onUpdate:r}=t;this.name=e,this.destroy=n,this.hit=s,this.need=!1,this.initFlag=!1,i&&(this.watchKey=i.replace("$store.state.","")),this.onUpdate=r,this.__customhook=o}init(){this.initFlag||(this.watchKey&&this.watchAttr((t=>{this[t?"cycleStart":"cycleEnd"]()})),this.initFlag=!0)}cycleStart(){this.hit||(this.hit=!0,this.__customhook&&this.__customhook.triggerHook(this.name))}cycleEnd(){this.hit&&(this.hit=!1,this.__customhook&&this.__customhook.resetExecute(this.name))}watchAttr(t){try{const n=this;e(this.__customhook.pageInstance).watch((t=>o(t,n.watchKey)),((o,e)=>{t(n.onUpdate?n.onUpdate(o,e):o)}),{watchKey:n.watchKey})}catch(t){}}}let s={};const i=["onLaunch","created","beforeMount","mounted","activated","deactivated","beforeDestroy","destroyed","onLoad","attached","detached","onShow","onHide","onReady","onUnload"],r=t=>({Launch:new n({customhook:t,name:"onLaunch",destroy:"onUnload",hit:!0}),Created:new n({customhook:t,name:"created",destroy:"destroyed",hit:"created"==p.initHook}),Load:new n({customhook:t,name:"onLoad",destroy:"onUnload",hit:"onLoad"==p.initHook}),Attached:new n({customhook:t,name:"attached",destroy:"detached"}),Show:new n({customhook:t,name:"onShow",destroy:"onHide"}),Mounted:new n({customhook:t,name:"mounted",destroy:"destroyed"}),Ready:new n({customhook:t,name:"onReady",destroy:"onUnload"}),...Object.keys(s).reduce(((o,e)=>{const i=s[e];return i.customhook=t,(o[e]=new n(i))&&o}),{})}),c=()=>Object.keys(s);let h=i.map((t=>u(t)));class a{constructor(t,o,e){this.pageInstance=t,this.customHooks={},this.customHookArr=[],this.hook={},this.options=o||{},this.pageHooks=e,this.init()}init(){let t=r(this);this.hook=t;let o=this.pageHooks,e=o.hasOwnProperty("beforeCreate")||o.hasOwnProperty("onReady"),{customHookArr:n,hookInscape:s}=this.filterHooks(e?o:o.__proto__);this.customHookArr=n,n.forEach((e=>{this.customHooks[e]={callback:o[e].bind(this.pageInstance),inscape:s[e],execute:!1},s[e].forEach((o=>t[o].need=!0))})),n.length&&Object.keys(t).forEach((o=>t[o].need&&t[o].init()))}filterHooks(t){let o={};return{customHookArr:Object.keys(t).filter((t=>{let e=this.getHookArr(t);return!!e.length&&(o[t]=e.filter((o=>!!this.hook[o]||(console.warn(`[custom-hook 错误声明警告] "${o}"钩子未注册，意味着"${t}"可能永远不会执行，请先注册此钩子再使用，文档：https://github.com/1977474741/spa-custom-hooks#-diyhooks对象说明`),!1))),t=="on"+e.join("")&&o[t].length==e.length)})),hookInscape:o}}triggerHook(t){this.customHookArr.forEach((t=>{let o=this.customHooks[t];o.inscape.every((t=>this.hook[t].need&&this.checkHookHit(this.hook[t])))&&!o.execute&&(o.execute=!0,this.customHooks[t].callback(this.options))}))}resetExecute(t){t=u(t),this.customHookArr.forEach((o=>{let e=this.customHooks[o];-1!=e.inscape.indexOf(t)&&(e.execute=!1)}))}splitHook(t){t=t.replace("on","").split(/(?=[A-Z])/);const o=[...new Set(h.concat(c()))].sort(((t,o)=>o.length-t.length)),e=[];let n="";for(var s=0;s<t.length;s++){n+=t[s],-1!=o.indexOf(n)&&(e.push(n),n="")}return e}checkHookHit(t){if(t.watchKey){let n=o(e(t.__customhook.pageInstance).state,t.watchKey);return t.onUpdate?t.onUpdate(n):n}return t.hit}getHookArr(t){if(-1==t.indexOf("on"))return[];const o=this.splitHook(t),e=c();return o.length>1||-1!=e.indexOf(o[0])?o:[]}}function u(t){return t=(t=t.replace("on","")).substring(0,1).toUpperCase()+t.substring(1)}const l={"vue-h5":{hooksKey:"$options",initHook:"beforeCreate",supportComponent:!0,isPage(t){return t._compiled&&this.supportComponent}},"vue-miniprogram":{hooksKey:"$options",initHook:"beforeCreate",supportComponent:!0,isPage(){return this.supportComponent}},miniprogram:{hooksKey:"",initHook:"onLoad",initHookApp:"onLaunch",supportComponent:!0,isPage(){return this.supportComponent}}};let p=l["vue-miniprogram"];const k=(e,n,r,c)=>{function h(t){let e=o(this,p.hooksKey);p.isPage(e)&&(null!=r&&r.state||!c||(r.state=this[c]||c),this.customHook=new a(this,t,e))}e.mpvueVersion?p.initHook="onLoad":e.userAgentKey&&(p=l[e.userAgentKey]),t=r,s=n,e.mixin({...i.reduce(((t,o)=>(t[o]=function(t){if("object"!=typeof this.customHook&&null!=typeof this.customHook)return;if(!this.customHook.customHookArr.length)return;t&&Object.keys(t).length>0&&(this.customHook.options=t);const e=this.customHook.hook;for(let t in e){const n=e[t];n.name==o?n.cycleStart():n.destroy==o&&n.cycleEnd()}})&&t),{}),[p.initHook](t){h.call(this,t)},[p.initHookApp](t){h.call(this,t)}})},d={mixin(t){let o=Page,e=App;Page=e=>{this.mergeHook(t,e),o(e)},App=o=>{this.mergeHook(t,o),e(o)}},mergeHook(t,o){for(let[e,n]of Object.entries(t)){const t=o[e];o[e]=function(){for(var o=arguments.length,e=new Array(o),s=0;s<o;s++)e[s]=arguments[s];return n.call(this,...e),t&&t.call(this,...e)}}},userAgentKey:"miniprogram"},m={},y={watch(t,n,s){const i=e().state,r=s.watchKey,c=o(i,r,!0);m[r]?m[r].push(n):m[r]=[n],function t(o,e){let s=o[e];Object.defineProperty(o,e,{configurable:!0,enumerable:!0,set:function(t){s=t,m[r].map((t=>t(c.obj[c.key])))},get:function(){return s}}),Array.isArray(o[e])&&function(t,o){const e=Object.create(t);["push","pop","shift","unshift","splice","sort","reverse"].forEach((n=>{let s=e[n];!function(t,o,e,n){Object.defineProperty(t,o,{value:e,enumerable:!!n,writable:!0,configurable:!0})}(t,n,(function(){return s.apply(this,arguments),o.apply(this,arguments)}))}))}(o[e],(()=>{n(c.obj[c.key])}));if("object"==typeof o[e]&&null!=o[e])for(let[n,s]of Object.entries(o[e]))t(o[e],n)}(c.obj,c.key)}};var f={install:function(){arguments.length<3?k(d,arguments[0],y,arguments[1]||"globalData"):k(...arguments)},setHit:(t,o)=>{r()[t][o?"cycleStart":"cycleEnd"]()}};return f}));

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1667832835674);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map