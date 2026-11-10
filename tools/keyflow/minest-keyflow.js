(()=>{var hb=Object.create;var ah=Object.defineProperty;var gb=Object.getOwnPropertyDescriptor;var xb=Object.getOwnPropertyNames;var yb=Object.getPrototypeOf,vb=Object.prototype.hasOwnProperty;var oh=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,a)=>(typeof require<"u"?require:t)[a]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var Nt=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var Lb=(e,t,a,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of xb(t))!vb.call(e,r)&&r!==a&&ah(e,r,{get:()=>t[r],enumerable:!(o=gb(t,r))||o.enumerable});return e};var q=(e,t,a)=>(a=e!=null?hb(yb(e)):{},Lb(t||!e||!e.__esModule?ah(a,"default",{value:e,enumerable:!0}):a,e));var hh=Nt(z=>{"use strict";var Wf=Symbol.for("react.transitional.element"),wb=Symbol.for("react.portal"),bb=Symbol.for("react.fragment"),Sb=Symbol.for("react.strict_mode"),Cb=Symbol.for("react.profiler"),Ib=Symbol.for("react.consumer"),Tb=Symbol.for("react.context"),Ab=Symbol.for("react.forward_ref"),kb=Symbol.for("react.suspense"),Db=Symbol.for("react.memo"),uh=Symbol.for("react.lazy"),rh=Symbol.iterator;function Mb(e){return e===null||typeof e!="object"?null:(e=rh&&e[rh]||e["@@iterator"],typeof e=="function"?e:null)}var fh={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},dh=Object.assign,ch={};function Lr(e,t,a){this.props=e,this.context=t,this.refs=ch,this.updater=a||fh}Lr.prototype.isReactComponent={};Lr.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Lr.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function ph(){}ph.prototype=Lr.prototype;function Zf(e,t,a){this.props=e,this.context=t,this.refs=ch,this.updater=a||fh}var Qf=Zf.prototype=new ph;Qf.constructor=Zf;dh(Qf,Lr.prototype);Qf.isPureReactComponent=!0;var ih=Array.isArray,de={H:null,A:null,T:null,S:null},mh=Object.prototype.hasOwnProperty;function Jf(e,t,a,o,r,i){return a=i.ref,{$$typeof:Wf,type:e,key:t,ref:a!==void 0?a:null,props:i}}function Bb(e,t){return Jf(e.type,t,void 0,void 0,void 0,e.props)}function $f(e){return typeof e=="object"&&e!==null&&e.$$typeof===Wf}function Eb(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(a){return t[a]})}var nh=/\/+/g;function Kf(e,t){return typeof e=="object"&&e!==null&&e.key!=null?Eb(""+e.key):t.toString(36)}function lh(){}function Rb(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(lh,lh):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function vr(e,t,a,o,r){var i=typeof e;(i==="undefined"||i==="boolean")&&(e=null);var n=!1;if(e===null)n=!0;else switch(i){case"bigint":case"string":case"number":n=!0;break;case"object":switch(e.$$typeof){case Wf:case wb:n=!0;break;case uh:return n=e._init,vr(n(e._payload),t,a,o,r)}}if(n)return r=r(e),n=o===""?"."+Kf(e,0):o,ih(r)?(a="",n!=null&&(a=n.replace(nh,"$&/")+"/"),vr(r,t,a,"",function(u){return u})):r!=null&&($f(r)&&(r=Bb(r,a+(r.key==null||e&&e.key===r.key?"":(""+r.key).replace(nh,"$&/")+"/")+n)),t.push(r)),1;n=0;var l=o===""?".":o+":";if(ih(e))for(var s=0;s<e.length;s++)o=e[s],i=l+Kf(o,s),n+=vr(o,t,a,i,r);else if(s=Mb(e),typeof s=="function")for(e=s.call(e),s=0;!(o=e.next()).done;)o=o.value,i=l+Kf(o,s++),n+=vr(o,t,a,i,r);else if(i==="object"){if(typeof e.then=="function")return vr(Rb(e),t,a,o,r);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return n}function _l(e,t,a){if(e==null)return e;var o=[],r=0;return vr(e,o,"","",function(i){return t.call(a,i,r++)}),o}function Pb(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(a){(e._status===0||e._status===-1)&&(e._status=1,e._result=a)},function(a){(e._status===0||e._status===-1)&&(e._status=2,e._result=a)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var sh=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function Ob(){}z.Children={map:_l,forEach:function(e,t,a){_l(e,function(){t.apply(this,arguments)},a)},count:function(e){var t=0;return _l(e,function(){t++}),t},toArray:function(e){return _l(e,function(t){return t})||[]},only:function(e){if(!$f(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};z.Component=Lr;z.Fragment=bb;z.Profiler=Cb;z.PureComponent=Zf;z.StrictMode=Sb;z.Suspense=kb;z.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=de;z.act=function(){throw Error("act(...) is not supported in production builds of React.")};z.cache=function(e){return function(){return e.apply(null,arguments)}};z.cloneElement=function(e,t,a){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var o=dh({},e.props),r=e.key,i=void 0;if(t!=null)for(n in t.ref!==void 0&&(i=void 0),t.key!==void 0&&(r=""+t.key),t)!mh.call(t,n)||n==="key"||n==="__self"||n==="__source"||n==="ref"&&t.ref===void 0||(o[n]=t[n]);var n=arguments.length-2;if(n===1)o.children=a;else if(1<n){for(var l=Array(n),s=0;s<n;s++)l[s]=arguments[s+2];o.children=l}return Jf(e.type,r,void 0,void 0,i,o)};z.createContext=function(e){return e={$$typeof:Tb,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:Ib,_context:e},e};z.createElement=function(e,t,a){var o,r={},i=null;if(t!=null)for(o in t.key!==void 0&&(i=""+t.key),t)mh.call(t,o)&&o!=="key"&&o!=="__self"&&o!=="__source"&&(r[o]=t[o]);var n=arguments.length-2;if(n===1)r.children=a;else if(1<n){for(var l=Array(n),s=0;s<n;s++)l[s]=arguments[s+2];r.children=l}if(e&&e.defaultProps)for(o in n=e.defaultProps,n)r[o]===void 0&&(r[o]=n[o]);return Jf(e,i,void 0,void 0,null,r)};z.createRef=function(){return{current:null}};z.forwardRef=function(e){return{$$typeof:Ab,render:e}};z.isValidElement=$f;z.lazy=function(e){return{$$typeof:uh,_payload:{_status:-1,_result:e},_init:Pb}};z.memo=function(e,t){return{$$typeof:Db,type:e,compare:t===void 0?null:t}};z.startTransition=function(e){var t=de.T,a={};de.T=a;try{var o=e(),r=de.S;r!==null&&r(a,o),typeof o=="object"&&o!==null&&typeof o.then=="function"&&o.then(Ob,sh)}catch(i){sh(i)}finally{de.T=t}};z.unstable_useCacheRefresh=function(){return de.H.useCacheRefresh()};z.use=function(e){return de.H.use(e)};z.useActionState=function(e,t,a){return de.H.useActionState(e,t,a)};z.useCallback=function(e,t){return de.H.useCallback(e,t)};z.useContext=function(e){return de.H.useContext(e)};z.useDebugValue=function(){};z.useDeferredValue=function(e,t){return de.H.useDeferredValue(e,t)};z.useEffect=function(e,t){return de.H.useEffect(e,t)};z.useId=function(){return de.H.useId()};z.useImperativeHandle=function(e,t,a){return de.H.useImperativeHandle(e,t,a)};z.useInsertionEffect=function(e,t){return de.H.useInsertionEffect(e,t)};z.useLayoutEffect=function(e,t){return de.H.useLayoutEffect(e,t)};z.useMemo=function(e,t){return de.H.useMemo(e,t)};z.useOptimistic=function(e,t){return de.H.useOptimistic(e,t)};z.useReducer=function(e,t,a){return de.H.useReducer(e,t,a)};z.useRef=function(e){return de.H.useRef(e)};z.useState=function(e){return de.H.useState(e)};z.useSyncExternalStore=function(e,t,a){return de.H.useSyncExternalStore(e,t,a)};z.useTransition=function(){return de.H.useTransition()};z.version="19.0.1"});var G=Nt((sA,gh)=>{"use strict";gh.exports=hh()});var Th=Nt(te=>{"use strict";function od(e,t){var a=e.length;e.push(t);e:for(;0<a;){var o=a-1>>>1,r=e[o];if(0<Nl(r,t))e[o]=t,e[a]=r,a=o;else break e}}function Pt(e){return e.length===0?null:e[0]}function Xl(e){if(e.length===0)return null;var t=e[0],a=e.pop();if(a!==t){e[0]=a;e:for(var o=0,r=e.length,i=r>>>1;o<i;){var n=2*(o+1)-1,l=e[n],s=n+1,u=e[s];if(0>Nl(l,a))s<r&&0>Nl(u,l)?(e[o]=u,e[s]=a,o=s):(e[o]=l,e[n]=a,o=n);else if(s<r&&0>Nl(u,a))e[o]=u,e[s]=a,o=s;else break e}}return t}function Nl(e,t){var a=e.sortIndex-t.sortIndex;return a!==0?a:e.id-t.id}te.unstable_now=void 0;typeof performance=="object"&&typeof performance.now=="function"?(xh=performance,te.unstable_now=function(){return xh.now()}):(ed=Date,yh=ed.now(),te.unstable_now=function(){return ed.now()-yh});var xh,ed,yh,Gt=[],Oa=[],Vb=1,ht=null,_e=3,jl=!1,Ao=!1,Fi=!1,wh=typeof setTimeout=="function"?setTimeout:null,bh=typeof clearTimeout=="function"?clearTimeout:null,vh=typeof setImmediate<"u"?setImmediate:null;function Gl(e){for(var t=Pt(Oa);t!==null;){if(t.callback===null)Xl(Oa);else if(t.startTime<=e)Xl(Oa),t.sortIndex=t.expirationTime,od(Gt,t);else break;t=Pt(Oa)}}function rd(e){if(Fi=!1,Gl(e),!Ao)if(Pt(Gt)!==null)Ao=!0,id();else{var t=Pt(Oa);t!==null&&nd(rd,t.startTime-e)}}var Yl=!1,Ui=-1,Sh=5,Ch=-1;function Ih(){return!(te.unstable_now()-Ch<Sh)}function td(){if(Yl){var e=te.unstable_now();Ch=e;var t=!0;try{e:{Ao=!1,Fi&&(Fi=!1,bh(Ui),Ui=-1),jl=!0;var a=_e;try{t:{for(Gl(e),ht=Pt(Gt);ht!==null&&!(ht.expirationTime>e&&Ih());){var o=ht.callback;if(typeof o=="function"){ht.callback=null,_e=ht.priorityLevel;var r=o(ht.expirationTime<=e);if(e=te.unstable_now(),typeof r=="function"){ht.callback=r,Gl(e),t=!0;break t}ht===Pt(Gt)&&Xl(Gt),Gl(e)}else Xl(Gt);ht=Pt(Gt)}if(ht!==null)t=!0;else{var i=Pt(Oa);i!==null&&nd(rd,i.startTime-e),t=!1}}break e}finally{ht=null,_e=a,jl=!1}t=void 0}}finally{t?zi():Yl=!1}}}var zi;typeof vh=="function"?zi=function(){vh(td)}:typeof MessageChannel<"u"?(ad=new MessageChannel,Lh=ad.port2,ad.port1.onmessage=td,zi=function(){Lh.postMessage(null)}):zi=function(){wh(td,0)};var ad,Lh;function id(){Yl||(Yl=!0,zi())}function nd(e,t){Ui=wh(function(){e(te.unstable_now())},t)}te.unstable_IdlePriority=5;te.unstable_ImmediatePriority=1;te.unstable_LowPriority=4;te.unstable_NormalPriority=3;te.unstable_Profiling=null;te.unstable_UserBlockingPriority=2;te.unstable_cancelCallback=function(e){e.callback=null};te.unstable_continueExecution=function(){Ao||jl||(Ao=!0,id())};te.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):Sh=0<e?Math.floor(1e3/e):5};te.unstable_getCurrentPriorityLevel=function(){return _e};te.unstable_getFirstCallbackNode=function(){return Pt(Gt)};te.unstable_next=function(e){switch(_e){case 1:case 2:case 3:var t=3;break;default:t=_e}var a=_e;_e=t;try{return e()}finally{_e=a}};te.unstable_pauseExecution=function(){};te.unstable_requestPaint=function(){};te.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var a=_e;_e=e;try{return t()}finally{_e=a}};te.unstable_scheduleCallback=function(e,t,a){var o=te.unstable_now();switch(typeof a=="object"&&a!==null?(a=a.delay,a=typeof a=="number"&&0<a?o+a:o):a=o,e){case 1:var r=-1;break;case 2:r=250;break;case 5:r=1073741823;break;case 4:r=1e4;break;default:r=5e3}return r=a+r,e={id:Vb++,callback:t,priorityLevel:e,startTime:a,expirationTime:r,sortIndex:-1},a>o?(e.sortIndex=a,od(Oa,e),Pt(Gt)===null&&e===Pt(Oa)&&(Fi?(bh(Ui),Ui=-1):Fi=!0,nd(rd,a-o))):(e.sortIndex=r,od(Gt,e),Ao||jl||(Ao=!0,id())),e};te.unstable_shouldYield=Ih;te.unstable_wrapCallback=function(e){var t=_e;return function(){var a=_e;_e=t;try{return e.apply(this,arguments)}finally{_e=a}}}});var kh=Nt((fA,Ah)=>{"use strict";Ah.exports=Th()});var Mh=Nt(Ke=>{"use strict";var zb=G();function Dh(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)t+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function Va(){}var Ye={d:{f:Va,r:function(){throw Error(Dh(522))},D:Va,C:Va,L:Va,m:Va,X:Va,S:Va,M:Va},p:0,findDOMNode:null},Fb=Symbol.for("react.portal");function Ub(e,t,a){var o=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Fb,key:o==null?null:""+o,children:e,containerInfo:t,implementation:a}}var qi=zb.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function Kl(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}Ke.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Ye;Ke.createPortal=function(e,t){var a=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(Dh(299));return Ub(e,t,null,a)};Ke.flushSync=function(e){var t=qi.T,a=Ye.p;try{if(qi.T=null,Ye.p=2,e)return e()}finally{qi.T=t,Ye.p=a,Ye.d.f()}};Ke.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,Ye.d.C(e,t))};Ke.prefetchDNS=function(e){typeof e=="string"&&Ye.d.D(e)};Ke.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var a=t.as,o=Kl(a,t.crossOrigin),r=typeof t.integrity=="string"?t.integrity:void 0,i=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;a==="style"?Ye.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:o,integrity:r,fetchPriority:i}):a==="script"&&Ye.d.X(e,{crossOrigin:o,integrity:r,fetchPriority:i,nonce:typeof t.nonce=="string"?t.nonce:void 0})}};Ke.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var a=Kl(t.as,t.crossOrigin);Ye.d.M(e,{crossOrigin:a,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0})}}else t==null&&Ye.d.M(e)};Ke.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var a=t.as,o=Kl(a,t.crossOrigin);Ye.d.L(e,a,{crossOrigin:o,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}};Ke.preloadModule=function(e,t){if(typeof e=="string")if(t){var a=Kl(t.as,t.crossOrigin);Ye.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:a,integrity:typeof t.integrity=="string"?t.integrity:void 0})}else Ye.d.m(e)};Ke.requestFormReset=function(e){Ye.d.r(e)};Ke.unstable_batchedUpdates=function(e,t){return e(t)};Ke.useFormState=function(e,t,a){return qi.H.useFormState(e,t,a)};Ke.useFormStatus=function(){return qi.H.useHostTransitionStatus()};Ke.version="19.0.1"});var Rh=Nt((cA,Eh)=>{"use strict";function Bh(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Bh)}catch(e){console.error(e)}}Bh(),Eh.exports=Mh()});var ky=Nt(pu=>{"use strict";var Me=kh(),Jg=G(),qb=Rh();function C(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)t+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function $g(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}var Hb=Symbol.for("react.element"),Wl=Symbol.for("react.transitional.element"),Wi=Symbol.for("react.portal"),Ar=Symbol.for("react.fragment"),ex=Symbol.for("react.strict_mode"),Fd=Symbol.for("react.profiler"),_b=Symbol.for("react.provider"),tx=Symbol.for("react.consumer"),ma=Symbol.for("react.context"),Bc=Symbol.for("react.forward_ref"),Ud=Symbol.for("react.suspense"),qd=Symbol.for("react.suspense_list"),Ec=Symbol.for("react.memo"),Ua=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");var ax=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.tracing_marker");var Nb=Symbol.for("react.memo_cache_sentinel"),Ph=Symbol.iterator;function Hi(e){return e===null||typeof e!="object"?null:(e=Ph&&e[Ph]||e["@@iterator"],typeof e=="function"?e:null)}var Gb=Symbol.for("react.client.reference");function Hd(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===Gb?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Ar:return"Fragment";case Wi:return"Portal";case Fd:return"Profiler";case ex:return"StrictMode";case Ud:return"Suspense";case qd:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case ma:return(e.displayName||"Context")+".Provider";case tx:return(e._context.displayName||"Context")+".Consumer";case Bc:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Ec:return t=e.displayName||null,t!==null?t:Hd(e.type)||"Memo";case Ua:t=e._payload,e=e._init;try{return Hd(e(t))}catch{}}return null}var P=Jg.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ne=Object.assign,ld,Oh;function Zi(e){if(ld===void 0)try{throw Error()}catch(a){var t=a.stack.trim().match(/\n( *(at )?)/);ld=t&&t[1]||"",Oh=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+ld+e+Oh}var sd=!1;function ud(e,t){if(!e||sd)return"";sd=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var o={DetermineComponentFrameRoot:function(){try{if(t){var c=function(){throw Error()};if(Object.defineProperty(c.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(c,[])}catch(h){var d=h}Reflect.construct(e,[],c)}else{try{c.call()}catch(h){d=h}e.call(c.prototype)}}else{try{throw Error()}catch(h){d=h}(c=e())&&typeof c.catch=="function"&&c.catch(function(){})}}catch(h){if(h&&d&&typeof h.stack=="string")return[h.stack,d.stack]}return[null,null]}};o.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var r=Object.getOwnPropertyDescriptor(o.DetermineComponentFrameRoot,"name");r&&r.configurable&&Object.defineProperty(o.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var i=o.DetermineComponentFrameRoot(),n=i[0],l=i[1];if(n&&l){var s=n.split(`
`),u=l.split(`
`);for(r=o=0;o<s.length&&!s[o].includes("DetermineComponentFrameRoot");)o++;for(;r<u.length&&!u[r].includes("DetermineComponentFrameRoot");)r++;if(o===s.length||r===u.length)for(o=s.length-1,r=u.length-1;1<=o&&0<=r&&s[o]!==u[r];)r--;for(;1<=o&&0<=r;o--,r--)if(s[o]!==u[r]){if(o!==1||r!==1)do if(o--,r--,0>r||s[o]!==u[r]){var f=`
`+s[o].replace(" at new "," at ");return e.displayName&&f.includes("<anonymous>")&&(f=f.replace("<anonymous>",e.displayName)),f}while(1<=o&&0<=r);break}}}finally{sd=!1,Error.prepareStackTrace=a}return(a=e?e.displayName||e.name:"")?Zi(a):""}function Xb(e){switch(e.tag){case 26:case 27:case 5:return Zi(e.type);case 16:return Zi("Lazy");case 13:return Zi("Suspense");case 19:return Zi("SuspenseList");case 0:case 15:return e=ud(e.type,!1),e;case 11:return e=ud(e.type.render,!1),e;case 1:return e=ud(e.type,!0),e;default:return""}}function Vh(e){try{var t="";do t+=Xb(e),e=e.return;while(e);return t}catch(a){return`
Error generating stack: `+a.message+`
`+a.stack}}function ti(e){var t=e,a=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(a=t.return),e=t.return;while(e)}return t.tag===3?a:null}function ox(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function zh(e){if(ti(e)!==e)throw Error(C(188))}function jb(e){var t=e.alternate;if(!t){if(t=ti(e),t===null)throw Error(C(188));return t!==e?null:e}for(var a=e,o=t;;){var r=a.return;if(r===null)break;var i=r.alternate;if(i===null){if(o=r.return,o!==null){a=o;continue}break}if(r.child===i.child){for(i=r.child;i;){if(i===a)return zh(r),e;if(i===o)return zh(r),t;i=i.sibling}throw Error(C(188))}if(a.return!==o.return)a=r,o=i;else{for(var n=!1,l=r.child;l;){if(l===a){n=!0,a=r,o=i;break}if(l===o){n=!0,o=r,a=i;break}l=l.sibling}if(!n){for(l=i.child;l;){if(l===a){n=!0,a=i,o=r;break}if(l===o){n=!0,o=i,a=r;break}l=l.sibling}if(!n)throw Error(C(189))}}if(a.alternate!==o)throw Error(C(190))}if(a.tag!==3)throw Error(C(188));return a.stateNode.current===a?e:t}function rx(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=rx(e),t!==null)return t;e=e.sibling}return null}var Qi=Array.isArray,ie=qb.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Po={pending:!1,data:null,method:null,action:null},_d=[],kr=-1;function Qt(e){return{current:e}}function ze(e){0>kr||(e.current=_d[kr],_d[kr]=null,kr--)}function se(e,t){kr++,_d[kr]=e.current,e.current=t}var Yt=Qt(null),gn=Qt(null),Ya=Qt(null),Is=Qt(null);function Ts(e,t){switch(se(Ya,t),se(gn,e),se(Yt,null),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)&&(t=t.namespaceURI)?Ug(t):0;break;default:if(e=e===8?t.parentNode:t,t=e.tagName,e=e.namespaceURI)e=Ug(e),t=gy(e,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}ze(Yt),se(Yt,t)}function jr(){ze(Yt),ze(gn),ze(Ya)}function Nd(e){e.memoizedState!==null&&se(Is,e);var t=Yt.current,a=gy(t,e.type);t!==a&&(se(gn,e),se(Yt,a))}function As(e){gn.current===e&&(ze(Yt),ze(gn)),Is.current===e&&(ze(Is),An._currentValue=Po)}var Gd=Object.prototype.hasOwnProperty,Rc=Me.unstable_scheduleCallback,fd=Me.unstable_cancelCallback,Yb=Me.unstable_shouldYield,Kb=Me.unstable_requestPaint,Kt=Me.unstable_now,Wb=Me.unstable_getCurrentPriorityLevel,ix=Me.unstable_ImmediatePriority,nx=Me.unstable_UserBlockingPriority,ks=Me.unstable_NormalPriority,Zb=Me.unstable_LowPriority,lx=Me.unstable_IdlePriority,Qb=Me.log,Jb=Me.unstable_setDisableYieldValue,Bn=null,ut=null;function $b(e){if(ut&&typeof ut.onCommitFiberRoot=="function")try{ut.onCommitFiberRoot(Bn,e,void 0,(e.current.flags&128)===128)}catch{}}function Xa(e){if(typeof Qb=="function"&&Jb(e),ut&&typeof ut.setStrictMode=="function")try{ut.setStrictMode(Bn,e)}catch{}}var ft=Math.clz32?Math.clz32:aS,eS=Math.log,tS=Math.LN2;function aS(e){return e>>>=0,e===0?32:31-(eS(e)/tS|0)|0}var Zl=128,Ql=4194304;function Do(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194176;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function $s(e,t){var a=e.pendingLanes;if(a===0)return 0;var o=0,r=e.suspendedLanes,i=e.pingedLanes,n=e.warmLanes;e=e.finishedLanes!==0;var l=a&134217727;return l!==0?(a=l&~r,a!==0?o=Do(a):(i&=l,i!==0?o=Do(i):e||(n=l&~n,n!==0&&(o=Do(n))))):(l=a&~r,l!==0?o=Do(l):i!==0?o=Do(i):e||(n=a&~n,n!==0&&(o=Do(n)))),o===0?0:t!==0&&t!==o&&(t&r)===0&&(r=o&-o,n=t&-t,r>=n||r===32&&(n&4194176)!==0)?t:o}function En(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function oS(e,t){switch(e){case 1:case 2:case 4:case 8:return t+250;case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function sx(){var e=Zl;return Zl<<=1,(Zl&4194176)===0&&(Zl=128),e}function ux(){var e=Ql;return Ql<<=1,(Ql&62914560)===0&&(Ql=4194304),e}function dd(e){for(var t=[],a=0;31>a;a++)t.push(e);return t}function Rn(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function rS(e,t,a,o,r,i){var n=e.pendingLanes;e.pendingLanes=a,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=a,e.entangledLanes&=a,e.errorRecoveryDisabledLanes&=a,e.shellSuspendCounter=0;var l=e.entanglements,s=e.expirationTimes,u=e.hiddenUpdates;for(a=n&~a;0<a;){var f=31-ft(a),c=1<<f;l[f]=0,s[f]=-1;var d=u[f];if(d!==null)for(u[f]=null,f=0;f<d.length;f++){var h=d[f];h!==null&&(h.lane&=-536870913)}a&=~c}o!==0&&fx(e,o,0),i!==0&&r===0&&e.tag!==0&&(e.suspendedLanes|=i&~(n&~t))}function fx(e,t,a){e.pendingLanes|=t,e.suspendedLanes&=~t;var o=31-ft(t);e.entangledLanes|=t,e.entanglements[o]=e.entanglements[o]|1073741824|a&4194218}function dx(e,t){var a=e.entangledLanes|=t;for(e=e.entanglements;a;){var o=31-ft(a),r=1<<o;r&t|e[o]&t&&(e[o]|=t),a&=~r}}function cx(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function px(){var e=ie.p;return e!==0?e:(e=window.event,e===void 0?32:Ty(e.type))}function iS(e,t){var a=ie.p;try{return ie.p=e,t()}finally{ie.p=a}}var io=Math.random().toString(36).slice(2),Ne="__reactFiber$"+io,tt="__reactProps$"+io,ai="__reactContainer$"+io,Xd="__reactEvents$"+io,nS="__reactListeners$"+io,lS="__reactHandles$"+io,Fh="__reactResources$"+io,xn="__reactMarker$"+io;function Pc(e){delete e[Ne],delete e[tt],delete e[Xd],delete e[nS],delete e[lS]}function Eo(e){var t=e[Ne];if(t)return t;for(var a=e.parentNode;a;){if(t=a[ai]||a[Ne]){if(a=t.alternate,t.child!==null||a!==null&&a.child!==null)for(e=Hg(e);e!==null;){if(a=e[Ne])return a;e=Hg(e)}return t}e=a,a=e.parentNode}return null}function oi(e){if(e=e[Ne]||e[ai]){var t=e.tag;if(t===5||t===6||t===13||t===26||t===27||t===3)return e}return null}function Ji(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(C(33))}function Fr(e){var t=e[Fh];return t||(t=e[Fh]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function Oe(e){e[xn]=!0}var mx=new Set,hx={};function Xo(e,t){Yr(e,t),Yr(e+"Capture",t)}function Yr(e,t){for(hx[e]=t,e=0;e<t.length;e++)mx.add(t[e])}var La=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),sS=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Uh={},qh={};function uS(e){return Gd.call(qh,e)?!0:Gd.call(Uh,e)?!1:sS.test(e)?qh[e]=!0:(Uh[e]=!0,!1)}function ps(e,t,a){if(uS(t))if(a===null)e.removeAttribute(t);else{switch(typeof a){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var o=t.toLowerCase().slice(0,5);if(o!=="data-"&&o!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+a)}}function Jl(e,t,a){if(a===null)e.removeAttribute(t);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+a)}}function la(e,t,a,o){if(o===null)e.removeAttribute(a);else{switch(typeof o){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(a);return}e.setAttributeNS(t,a,""+o)}}function vt(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function gx(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function fS(e){var t=gx(e)?"checked":"value",a=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),o=""+e[t];if(!e.hasOwnProperty(t)&&typeof a<"u"&&typeof a.get=="function"&&typeof a.set=="function"){var r=a.get,i=a.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return r.call(this)},set:function(n){o=""+n,i.call(this,n)}}),Object.defineProperty(e,t,{enumerable:a.enumerable}),{getValue:function(){return o},setValue:function(n){o=""+n},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Ds(e){e._valueTracker||(e._valueTracker=fS(e))}function xx(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var a=t.getValue(),o="";return e&&(o=gx(e)?e.checked?"true":"false":e.value),e=o,e!==a?(t.setValue(e),!0):!1}function Ms(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var dS=/[\n"\\]/g;function bt(e){return e.replace(dS,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function jd(e,t,a,o,r,i,n,l){e.name="",n!=null&&typeof n!="function"&&typeof n!="symbol"&&typeof n!="boolean"?e.type=n:e.removeAttribute("type"),t!=null?n==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+vt(t)):e.value!==""+vt(t)&&(e.value=""+vt(t)):n!=="submit"&&n!=="reset"||e.removeAttribute("value"),t!=null?Yd(e,n,vt(t)):a!=null?Yd(e,n,vt(a)):o!=null&&e.removeAttribute("value"),r==null&&i!=null&&(e.defaultChecked=!!i),r!=null&&(e.checked=r&&typeof r!="function"&&typeof r!="symbol"),l!=null&&typeof l!="function"&&typeof l!="symbol"&&typeof l!="boolean"?e.name=""+vt(l):e.removeAttribute("name")}function yx(e,t,a,o,r,i,n,l){if(i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"&&(e.type=i),t!=null||a!=null){if(!(i!=="submit"&&i!=="reset"||t!=null))return;a=a!=null?""+vt(a):"",t=t!=null?""+vt(t):a,l||t===e.value||(e.value=t),e.defaultValue=t}o=o??r,o=typeof o!="function"&&typeof o!="symbol"&&!!o,e.checked=l?e.checked:!!o,e.defaultChecked=!!o,n!=null&&typeof n!="function"&&typeof n!="symbol"&&typeof n!="boolean"&&(e.name=n)}function Yd(e,t,a){t==="number"&&Ms(e.ownerDocument)===e||e.defaultValue===""+a||(e.defaultValue=""+a)}function Ur(e,t,a,o){if(e=e.options,t){t={};for(var r=0;r<a.length;r++)t["$"+a[r]]=!0;for(a=0;a<e.length;a++)r=t.hasOwnProperty("$"+e[a].value),e[a].selected!==r&&(e[a].selected=r),r&&o&&(e[a].defaultSelected=!0)}else{for(a=""+vt(a),t=null,r=0;r<e.length;r++){if(e[r].value===a){e[r].selected=!0,o&&(e[r].defaultSelected=!0);return}t!==null||e[r].disabled||(t=e[r])}t!==null&&(t.selected=!0)}}function vx(e,t,a){if(t!=null&&(t=""+vt(t),t!==e.value&&(e.value=t),a==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=a!=null?""+vt(a):""}function Lx(e,t,a,o){if(t==null){if(o!=null){if(a!=null)throw Error(C(92));if(Qi(o)){if(1<o.length)throw Error(C(93));o=o[0]}a=o}a==null&&(a=""),t=a}a=vt(t),e.defaultValue=a,o=e.textContent,o===a&&o!==""&&o!==null&&(e.value=o)}function Kr(e,t){if(t){var a=e.firstChild;if(a&&a===e.lastChild&&a.nodeType===3){a.nodeValue=t;return}}e.textContent=t}var cS=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Hh(e,t,a){var o=t.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?o?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":o?e.setProperty(t,a):typeof a!="number"||a===0||cS.has(t)?t==="float"?e.cssFloat=a:e[t]=(""+a).trim():e[t]=a+"px"}function wx(e,t,a){if(t!=null&&typeof t!="object")throw Error(C(62));if(e=e.style,a!=null){for(var o in a)!a.hasOwnProperty(o)||t!=null&&t.hasOwnProperty(o)||(o.indexOf("--")===0?e.setProperty(o,""):o==="float"?e.cssFloat="":e[o]="");for(var r in t)o=t[r],t.hasOwnProperty(r)&&a[r]!==o&&Hh(e,r,o)}else for(var i in t)t.hasOwnProperty(i)&&Hh(e,i,t[i])}function Oc(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var pS=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),mS=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function ms(e){return mS.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}var Kd=null;function Vc(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Dr=null,qr=null;function _h(e){var t=oi(e);if(t&&(e=t.stateNode)){var a=e[tt]||null;e:switch(e=t.stateNode,t.type){case"input":if(jd(e,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),t=a.name,a.type==="radio"&&t!=null){for(a=e;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+bt(""+t)+'"][type="radio"]'),t=0;t<a.length;t++){var o=a[t];if(o!==e&&o.form===e.form){var r=o[tt]||null;if(!r)throw Error(C(90));jd(o,r.value,r.defaultValue,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name)}}for(t=0;t<a.length;t++)o=a[t],o.form===e.form&&xx(o)}break e;case"textarea":vx(e,a.value,a.defaultValue);break e;case"select":t=a.value,t!=null&&Ur(e,!!a.multiple,t,!1)}}}var cd=!1;function bx(e,t,a){if(cd)return e(t,a);cd=!0;try{var o=e(t);return o}finally{if(cd=!1,(Dr!==null||qr!==null)&&(uu(),Dr&&(t=Dr,e=qr,qr=Dr=null,_h(t),e)))for(t=0;t<e.length;t++)_h(e[t])}}function yn(e,t){var a=e.stateNode;if(a===null)return null;var o=a[tt]||null;if(o===null)return null;a=o[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(o=!o.disabled)||(e=e.type,o=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!o;break e;default:e=!1}if(e)return null;if(a&&typeof a!="function")throw Error(C(231,t,typeof a));return a}var Wd=!1;if(La)try{wr={},Object.defineProperty(wr,"passive",{get:function(){Wd=!0}}),window.addEventListener("test",wr,wr),window.removeEventListener("test",wr,wr)}catch{Wd=!1}var wr,ja=null,zc=null,hs=null;function Sx(){if(hs)return hs;var e,t=zc,a=t.length,o,r="value"in ja?ja.value:ja.textContent,i=r.length;for(e=0;e<a&&t[e]===r[e];e++);var n=a-e;for(o=1;o<=n&&t[a-o]===r[i-o];o++);return hs=r.slice(e,1<o?1-o:void 0)}function gs(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function $l(){return!0}function Nh(){return!1}function at(e){function t(a,o,r,i,n){this._reactName=a,this._targetInst=r,this.type=o,this.nativeEvent=i,this.target=n,this.currentTarget=null;for(var l in e)e.hasOwnProperty(l)&&(a=e[l],this[l]=a?a(i):i[l]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?$l:Nh,this.isPropagationStopped=Nh,this}return ne(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=$l)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=$l)},persist:function(){},isPersistent:$l}),t}var jo={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},eu=at(jo),Pn=ne({},jo,{view:0,detail:0}),hS=at(Pn),pd,md,_i,tu=ne({},Pn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Fc,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==_i&&(_i&&e.type==="mousemove"?(pd=e.screenX-_i.screenX,md=e.screenY-_i.screenY):md=pd=0,_i=e),pd)},movementY:function(e){return"movementY"in e?e.movementY:md}}),Gh=at(tu),gS=ne({},tu,{dataTransfer:0}),xS=at(gS),yS=ne({},Pn,{relatedTarget:0}),hd=at(yS),vS=ne({},jo,{animationName:0,elapsedTime:0,pseudoElement:0}),LS=at(vS),wS=ne({},jo,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),bS=at(wS),SS=ne({},jo,{data:0}),Xh=at(SS),CS={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},IS={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},TS={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function AS(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=TS[e])?!!t[e]:!1}function Fc(){return AS}var kS=ne({},Pn,{key:function(e){if(e.key){var t=CS[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=gs(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?IS[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Fc,charCode:function(e){return e.type==="keypress"?gs(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?gs(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),DS=at(kS),MS=ne({},tu,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),jh=at(MS),BS=ne({},Pn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Fc}),ES=at(BS),RS=ne({},jo,{propertyName:0,elapsedTime:0,pseudoElement:0}),PS=at(RS),OS=ne({},tu,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),VS=at(OS),zS=ne({},jo,{newState:0,oldState:0}),FS=at(zS),US=[9,13,27,32],Uc=La&&"CompositionEvent"in window,en=null;La&&"documentMode"in document&&(en=document.documentMode);var qS=La&&"TextEvent"in window&&!en,Cx=La&&(!Uc||en&&8<en&&11>=en),Yh=" ",Kh=!1;function Ix(e,t){switch(e){case"keyup":return US.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Tx(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Mr=!1;function HS(e,t){switch(e){case"compositionend":return Tx(t);case"keypress":return t.which!==32?null:(Kh=!0,Yh);case"textInput":return e=t.data,e===Yh&&Kh?null:e;default:return null}}function _S(e,t){if(Mr)return e==="compositionend"||!Uc&&Ix(e,t)?(e=Sx(),hs=zc=ja=null,Mr=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Cx&&t.locale!=="ko"?null:t.data;default:return null}}var NS={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Wh(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!NS[e.type]:t==="textarea"}function Ax(e,t,a,o){Dr?qr?qr.push(o):qr=[o]:Dr=o,t=js(t,"onChange"),0<t.length&&(a=new eu("onChange","change",null,a,o),e.push({event:a,listeners:t}))}var tn=null,vn=null;function GS(e){py(e,0)}function au(e){var t=Ji(e);if(xx(t))return e}function Zh(e,t){if(e==="change")return t}var kx=!1;La&&(La?(ts="oninput"in document,ts||(gd=document.createElement("div"),gd.setAttribute("oninput","return;"),ts=typeof gd.oninput=="function"),es=ts):es=!1,kx=es&&(!document.documentMode||9<document.documentMode));var es,ts,gd;function Qh(){tn&&(tn.detachEvent("onpropertychange",Dx),vn=tn=null)}function Dx(e){if(e.propertyName==="value"&&au(vn)){var t=[];Ax(t,vn,e,Vc(e)),bx(GS,t)}}function XS(e,t,a){e==="focusin"?(Qh(),tn=t,vn=a,tn.attachEvent("onpropertychange",Dx)):e==="focusout"&&Qh()}function jS(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return au(vn)}function YS(e,t){if(e==="click")return au(t)}function KS(e,t){if(e==="input"||e==="change")return au(t)}function WS(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var ct=typeof Object.is=="function"?Object.is:WS;function Ln(e,t){if(ct(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(o=0;o<a.length;o++){var r=a[o];if(!Gd.call(t,r)||!ct(e[r],t[r]))return!1}return!0}function Jh(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function $h(e,t){var a=Jh(e);e=0;for(var o;a;){if(a.nodeType===3){if(o=e+a.textContent.length,e<=t&&o>=t)return{node:a,offset:t-e};e=o}e:{for(;a;){if(a.nextSibling){a=a.nextSibling;break e}a=a.parentNode}a=void 0}a=Jh(a)}}function Mx(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Mx(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Bx(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Ms(e.document);t instanceof e.HTMLIFrameElement;){try{var a=typeof t.contentWindow.location.href=="string"}catch{a=!1}if(a)e=t.contentWindow;else break;t=Ms(e.document)}return t}function qc(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function ZS(e,t){var a=Bx(t);t=e.focusedElem;var o=e.selectionRange;if(a!==t&&t&&t.ownerDocument&&Mx(t.ownerDocument.documentElement,t)){if(o!==null&&qc(t)){if(e=o.start,a=o.end,a===void 0&&(a=e),"selectionStart"in t)t.selectionStart=e,t.selectionEnd=Math.min(a,t.value.length);else if(a=(e=t.ownerDocument||document)&&e.defaultView||window,a.getSelection){a=a.getSelection();var r=t.textContent.length,i=Math.min(o.start,r);o=o.end===void 0?i:Math.min(o.end,r),!a.extend&&i>o&&(r=o,o=i,i=r),r=$h(t,i);var n=$h(t,o);r&&n&&(a.rangeCount!==1||a.anchorNode!==r.node||a.anchorOffset!==r.offset||a.focusNode!==n.node||a.focusOffset!==n.offset)&&(e=e.createRange(),e.setStart(r.node,r.offset),a.removeAllRanges(),i>o?(a.addRange(e),a.extend(n.node,n.offset)):(e.setEnd(n.node,n.offset),a.addRange(e)))}}for(e=[],a=t;a=a.parentNode;)a.nodeType===1&&e.push({element:a,left:a.scrollLeft,top:a.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<e.length;t++)a=e[t],a.element.scrollLeft=a.left,a.element.scrollTop=a.top}}var QS=La&&"documentMode"in document&&11>=document.documentMode,Br=null,Zd=null,an=null,Qd=!1;function eg(e,t,a){var o=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;Qd||Br==null||Br!==Ms(o)||(o=Br,"selectionStart"in o&&qc(o)?o={start:o.selectionStart,end:o.selectionEnd}:(o=(o.ownerDocument&&o.ownerDocument.defaultView||window).getSelection(),o={anchorNode:o.anchorNode,anchorOffset:o.anchorOffset,focusNode:o.focusNode,focusOffset:o.focusOffset}),an&&Ln(an,o)||(an=o,o=js(Zd,"onSelect"),0<o.length&&(t=new eu("onSelect","select",null,t,a),e.push({event:t,listeners:o}),t.target=Br)))}function ko(e,t){var a={};return a[e.toLowerCase()]=t.toLowerCase(),a["Webkit"+e]="webkit"+t,a["Moz"+e]="moz"+t,a}var Er={animationend:ko("Animation","AnimationEnd"),animationiteration:ko("Animation","AnimationIteration"),animationstart:ko("Animation","AnimationStart"),transitionrun:ko("Transition","TransitionRun"),transitionstart:ko("Transition","TransitionStart"),transitioncancel:ko("Transition","TransitionCancel"),transitionend:ko("Transition","TransitionEnd")},xd={},Ex={};La&&(Ex=document.createElement("div").style,"AnimationEvent"in window||(delete Er.animationend.animation,delete Er.animationiteration.animation,delete Er.animationstart.animation),"TransitionEvent"in window||delete Er.transitionend.transition);function Yo(e){if(xd[e])return xd[e];if(!Er[e])return e;var t=Er[e],a;for(a in t)if(t.hasOwnProperty(a)&&a in Ex)return xd[e]=t[a];return e}var Rx=Yo("animationend"),Px=Yo("animationiteration"),Ox=Yo("animationstart"),JS=Yo("transitionrun"),$S=Yo("transitionstart"),eC=Yo("transitioncancel"),Vx=Yo("transitionend"),zx=new Map,tg="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll scrollEnd toggle touchMove waiting wheel".split(" ");function Ft(e,t){zx.set(e,t),Xo(t,[e])}var yt=[],Rr=0,Hc=0;function ou(){for(var e=Rr,t=Hc=Rr=0;t<e;){var a=yt[t];yt[t++]=null;var o=yt[t];yt[t++]=null;var r=yt[t];yt[t++]=null;var i=yt[t];if(yt[t++]=null,o!==null&&r!==null){var n=o.pending;n===null?r.next=r:(r.next=n.next,n.next=r),o.pending=r}i!==0&&Fx(a,r,i)}}function ru(e,t,a,o){yt[Rr++]=e,yt[Rr++]=t,yt[Rr++]=a,yt[Rr++]=o,Hc|=o,e.lanes|=o,e=e.alternate,e!==null&&(e.lanes|=o)}function _c(e,t,a,o){return ru(e,t,a,o),Bs(e)}function to(e,t){return ru(e,null,null,t),Bs(e)}function Fx(e,t,a){e.lanes|=a;var o=e.alternate;o!==null&&(o.lanes|=a);for(var r=!1,i=e.return;i!==null;)i.childLanes|=a,o=i.alternate,o!==null&&(o.childLanes|=a),i.tag===22&&(e=i.stateNode,e===null||e._visibility&1||(r=!0)),e=i,i=i.return;r&&t!==null&&e.tag===3&&(i=e.stateNode,r=31-ft(a),i=i.hiddenUpdates,e=i[r],e===null?i[r]=[t]:e.push(t),t.lane=a|536870912)}function Bs(e){if(50<hn)throw hn=0,vc=null,Error(C(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Pr={},ag=new WeakMap;function St(e,t){if(typeof e=="object"&&e!==null){var a=ag.get(e);return a!==void 0?a:(t={value:e,source:t,stack:Vh(t)},ag.set(e,t),t)}return{value:e,source:t,stack:Vh(t)}}var Or=[],Vr=0,Es=null,Rs=0,Lt=[],wt=0,Oo=null,ha=1,ga="";function Mo(e,t){Or[Vr++]=Rs,Or[Vr++]=Es,Es=e,Rs=t}function Ux(e,t,a){Lt[wt++]=ha,Lt[wt++]=ga,Lt[wt++]=Oo,Oo=e;var o=ha;e=ga;var r=32-ft(o)-1;o&=~(1<<r),a+=1;var i=32-ft(t)+r;if(30<i){var n=r-r%5;i=(o&(1<<n)-1).toString(32),o>>=n,r-=n,ha=1<<32-ft(t)+r|a<<r|o,ga=i+e}else ha=1<<i|a<<r|o,ga=e}function Nc(e){e.return!==null&&(Mo(e,1),Ux(e,1,0))}function Gc(e){for(;e===Es;)Es=Or[--Vr],Or[Vr]=null,Rs=Or[--Vr],Or[Vr]=null;for(;e===Oo;)Oo=Lt[--wt],Lt[wt]=null,ga=Lt[--wt],Lt[wt]=null,ha=Lt[--wt],Lt[wt]=null}var We=null,qe=null,K=!1,Vt=null,Xt=!1,Jd=Error(C(519));function qo(e){var t=Error(C(418,""));throw wn(St(t,e)),Jd}function og(e){var t=e.stateNode,a=e.type,o=e.memoizedProps;switch(t[Ne]=e,t[tt]=o,a){case"dialog":X("cancel",t),X("close",t);break;case"iframe":case"object":case"embed":X("load",t);break;case"video":case"audio":for(a=0;a<Cn.length;a++)X(Cn[a],t);break;case"source":X("error",t);break;case"img":case"image":case"link":X("error",t),X("load",t);break;case"details":X("toggle",t);break;case"input":X("invalid",t),yx(t,o.value,o.defaultValue,o.checked,o.defaultChecked,o.type,o.name,!0),Ds(t);break;case"select":X("invalid",t);break;case"textarea":X("invalid",t),Lx(t,o.value,o.defaultValue,o.children),Ds(t)}a=o.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||t.textContent===""+a||o.suppressHydrationWarning===!0||hy(t.textContent,a)?(o.popover!=null&&(X("beforetoggle",t),X("toggle",t)),o.onScroll!=null&&X("scroll",t),o.onScrollEnd!=null&&X("scrollend",t),o.onClick!=null&&(t.onclick=du),t=!0):t=!1,t||qo(e)}function rg(e){for(We=e.return;We;)switch(We.tag){case 3:case 27:Xt=!0;return;case 5:case 13:Xt=!1;return;default:We=We.return}}function Ni(e){if(e!==We)return!1;if(!K)return rg(e),K=!0,!1;var t=!1,a;if((a=e.tag!==3&&e.tag!==27)&&((a=e.tag===5)&&(a=e.type,a=!(a!=="form"&&a!=="button")||Tc(e.type,e.memoizedProps)),a=!a),a&&(t=!0),t&&qe&&qo(e),rg(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(C(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8)if(a=e.data,a==="/$"){if(t===0){qe=zt(e.nextSibling);break e}t--}else a!=="$"&&a!=="$!"&&a!=="$?"||t++;e=e.nextSibling}qe=null}}else qe=We?zt(e.stateNode.nextSibling):null;return!0}function On(){qe=We=null,K=!1}function wn(e){Vt===null?Vt=[e]:Vt.push(e)}var on=Error(C(460)),qx=Error(C(474)),$d={then:function(){}};function ig(e){return e=e.status,e==="fulfilled"||e==="rejected"}function as(){}function Hx(e,t,a){switch(a=e[a],a===void 0?e.push(t):a!==t&&(t.then(as,as),t=a),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,e===on?Error(C(483)):e;default:if(typeof t.status=="string")t.then(as,as);else{if(e=re,e!==null&&100<e.shellSuspendCounter)throw Error(C(482));e=t,e.status="pending",e.then(function(o){if(t.status==="pending"){var r=t;r.status="fulfilled",r.value=o}},function(o){if(t.status==="pending"){var r=t;r.status="rejected",r.reason=o}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,e===on?Error(C(483)):e}throw rn=t,on}}var rn=null;function ng(){if(rn===null)throw Error(C(459));var e=rn;return rn=null,e}var Hr=null,bn=0;function os(e){var t=bn;return bn+=1,Hr===null&&(Hr=[]),Hx(Hr,e,t)}function Gi(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function rs(e,t){throw t.$$typeof===Hb?Error(C(525)):(e=Object.prototype.toString.call(t),Error(C(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function lg(e){var t=e._init;return t(e._payload)}function _x(e){function t(m,p){if(e){var g=m.deletions;g===null?(m.deletions=[p],m.flags|=16):g.push(p)}}function a(m,p){if(!e)return null;for(;p!==null;)t(m,p),p=p.sibling;return null}function o(m){for(var p=new Map;m!==null;)m.key!==null?p.set(m.key,m):p.set(m.index,m),m=m.sibling;return p}function r(m,p){return m=Za(m,p),m.index=0,m.sibling=null,m}function i(m,p,g){return m.index=g,e?(g=m.alternate,g!==null?(g=g.index,g<p?(m.flags|=33554434,p):g):(m.flags|=33554434,p)):(m.flags|=1048576,p)}function n(m){return e&&m.alternate===null&&(m.flags|=33554434),m}function l(m,p,g,y){return p===null||p.tag!==6?(p=Dd(g,m.mode,y),p.return=m,p):(p=r(p,g),p.return=m,p)}function s(m,p,g,y){var S=g.type;return S===Ar?f(m,p,g.props.children,y,g.key):p!==null&&(p.elementType===S||typeof S=="object"&&S!==null&&S.$$typeof===Ua&&lg(S)===p.type)?(p=r(p,g.props),Gi(p,g),p.return=m,p):(p=ws(g.type,g.key,g.props,null,m.mode,y),Gi(p,g),p.return=m,p)}function u(m,p,g,y){return p===null||p.tag!==4||p.stateNode.containerInfo!==g.containerInfo||p.stateNode.implementation!==g.implementation?(p=Md(g,m.mode,y),p.return=m,p):(p=r(p,g.children||[]),p.return=m,p)}function f(m,p,g,y,S){return p===null||p.tag!==7?(p=zo(g,m.mode,y,S),p.return=m,p):(p=r(p,g),p.return=m,p)}function c(m,p,g){if(typeof p=="string"&&p!==""||typeof p=="number"||typeof p=="bigint")return p=Dd(""+p,m.mode,g),p.return=m,p;if(typeof p=="object"&&p!==null){switch(p.$$typeof){case Wl:return g=ws(p.type,p.key,p.props,null,m.mode,g),Gi(g,p),g.return=m,g;case Wi:return p=Md(p,m.mode,g),p.return=m,p;case Ua:var y=p._init;return p=y(p._payload),c(m,p,g)}if(Qi(p)||Hi(p))return p=zo(p,m.mode,g,null),p.return=m,p;if(typeof p.then=="function")return c(m,os(p),g);if(p.$$typeof===ma)return c(m,is(m,p),g);rs(m,p)}return null}function d(m,p,g,y){var S=p!==null?p.key:null;if(typeof g=="string"&&g!==""||typeof g=="number"||typeof g=="bigint")return S!==null?null:l(m,p,""+g,y);if(typeof g=="object"&&g!==null){switch(g.$$typeof){case Wl:return g.key===S?s(m,p,g,y):null;case Wi:return g.key===S?u(m,p,g,y):null;case Ua:return S=g._init,g=S(g._payload),d(m,p,g,y)}if(Qi(g)||Hi(g))return S!==null?null:f(m,p,g,y,null);if(typeof g.then=="function")return d(m,p,os(g),y);if(g.$$typeof===ma)return d(m,p,is(m,g),y);rs(m,g)}return null}function h(m,p,g,y,S){if(typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint")return m=m.get(g)||null,l(p,m,""+y,S);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case Wl:return m=m.get(y.key===null?g:y.key)||null,s(p,m,y,S);case Wi:return m=m.get(y.key===null?g:y.key)||null,u(p,m,y,S);case Ua:var A=y._init;return y=A(y._payload),h(m,p,g,y,S)}if(Qi(y)||Hi(y))return m=m.get(g)||null,f(p,m,y,S,null);if(typeof y.then=="function")return h(m,p,g,os(y),S);if(y.$$typeof===ma)return h(m,p,g,is(p,y),S);rs(p,y)}return null}function x(m,p,g,y){for(var S=null,A=null,w=p,L=p=0,B=null;w!==null&&L<g.length;L++){w.index>L?(B=w,w=null):B=w.sibling;var I=d(m,w,g[L],y);if(I===null){w===null&&(w=B);break}e&&w&&I.alternate===null&&t(m,w),p=i(I,p,L),A===null?S=I:A.sibling=I,A=I,w=B}if(L===g.length)return a(m,w),K&&Mo(m,L),S;if(w===null){for(;L<g.length;L++)w=c(m,g[L],y),w!==null&&(p=i(w,p,L),A===null?S=w:A.sibling=w,A=w);return K&&Mo(m,L),S}for(w=o(w);L<g.length;L++)B=h(w,m,L,g[L],y),B!==null&&(e&&B.alternate!==null&&w.delete(B.key===null?L:B.key),p=i(B,p,L),A===null?S=B:A.sibling=B,A=B);return e&&w.forEach(function(_){return t(m,_)}),K&&Mo(m,L),S}function v(m,p,g,y){if(g==null)throw Error(C(151));for(var S=null,A=null,w=p,L=p=0,B=null,I=g.next();w!==null&&!I.done;L++,I=g.next()){w.index>L?(B=w,w=null):B=w.sibling;var _=d(m,w,I.value,y);if(_===null){w===null&&(w=B);break}e&&w&&_.alternate===null&&t(m,w),p=i(_,p,L),A===null?S=_:A.sibling=_,A=_,w=B}if(I.done)return a(m,w),K&&Mo(m,L),S;if(w===null){for(;!I.done;L++,I=g.next())I=c(m,I.value,y),I!==null&&(p=i(I,p,L),A===null?S=I:A.sibling=I,A=I);return K&&Mo(m,L),S}for(w=o(w);!I.done;L++,I=g.next())I=h(w,m,L,I.value,y),I!==null&&(e&&I.alternate!==null&&w.delete(I.key===null?L:I.key),p=i(I,p,L),A===null?S=I:A.sibling=I,A=I);return e&&w.forEach(function(Se){return t(m,Se)}),K&&Mo(m,L),S}function b(m,p,g,y){if(typeof g=="object"&&g!==null&&g.type===Ar&&g.key===null&&(g=g.props.children),typeof g=="object"&&g!==null){switch(g.$$typeof){case Wl:e:{for(var S=g.key;p!==null;){if(p.key===S){if(S=g.type,S===Ar){if(p.tag===7){a(m,p.sibling),y=r(p,g.props.children),y.return=m,m=y;break e}}else if(p.elementType===S||typeof S=="object"&&S!==null&&S.$$typeof===Ua&&lg(S)===p.type){a(m,p.sibling),y=r(p,g.props),Gi(y,g),y.return=m,m=y;break e}a(m,p);break}else t(m,p);p=p.sibling}g.type===Ar?(y=zo(g.props.children,m.mode,y,g.key),y.return=m,m=y):(y=ws(g.type,g.key,g.props,null,m.mode,y),Gi(y,g),y.return=m,m=y)}return n(m);case Wi:e:{for(S=g.key;p!==null;){if(p.key===S)if(p.tag===4&&p.stateNode.containerInfo===g.containerInfo&&p.stateNode.implementation===g.implementation){a(m,p.sibling),y=r(p,g.children||[]),y.return=m,m=y;break e}else{a(m,p);break}else t(m,p);p=p.sibling}y=Md(g,m.mode,y),y.return=m,m=y}return n(m);case Ua:return S=g._init,g=S(g._payload),b(m,p,g,y)}if(Qi(g))return x(m,p,g,y);if(Hi(g)){if(S=Hi(g),typeof S!="function")throw Error(C(150));return g=S.call(g),v(m,p,g,y)}if(typeof g.then=="function")return b(m,p,os(g),y);if(g.$$typeof===ma)return b(m,p,is(m,g),y);rs(m,g)}return typeof g=="string"&&g!==""||typeof g=="number"||typeof g=="bigint"?(g=""+g,p!==null&&p.tag===6?(a(m,p.sibling),y=r(p,g),y.return=m,m=y):(a(m,p),y=Dd(g,m.mode,y),y.return=m,m=y),n(m)):a(m,p)}return function(m,p,g,y){try{bn=0;var S=b(m,p,g,y);return Hr=null,S}catch(w){if(w===on)throw w;var A=Ct(29,w,null,m.mode);return A.lanes=y,A.return=m,A}finally{}}}var Ho=_x(!0),Nx=_x(!1),Wr=Qt(null),Ps=Qt(0);function sg(e,t){e=Sa,se(Ps,e),se(Wr,t),Sa=e|t.baseLanes}function ec(){se(Ps,Sa),se(Wr,Wr.current)}function Xc(){Sa=Ps.current,ze(Wr),ze(Ps)}var Tt=Qt(null),Wt=null;function Ha(e){var t=e.alternate;se(De,De.current&1),se(Tt,e),Wt===null&&(t===null||Wr.current!==null||t.memoizedState!==null)&&(Wt=e)}function Gx(e){if(e.tag===22){if(se(De,De.current),se(Tt,e),Wt===null){var t=e.alternate;t!==null&&t.memoizedState!==null&&(Wt=e)}}else _a(e)}function _a(){se(De,De.current),se(Tt,Tt.current)}function xa(e){ze(Tt),Wt===e&&(Wt=null),ze(De)}var De=Qt(0);function Os(e){for(var t=e;t!==null;){if(t.tag===13){var a=t.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||a.data==="$?"||a.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var tC=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(a,o){e.push(o)}};this.abort=function(){t.aborted=!0,e.forEach(function(a){return a()})}},aC=Me.unstable_scheduleCallback,oC=Me.unstable_NormalPriority,ke={$$typeof:ma,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function jc(){return{controller:new tC,data:new Map,refCount:0}}function Vn(e){e.refCount--,e.refCount===0&&aC(oC,function(){e.controller.abort()})}var nn=null,tc=0,Zr=0,_r=null;function rC(e,t){if(nn===null){var a=nn=[];tc=0,Zr=hp(),_r={status:"pending",value:void 0,then:function(o){a.push(o)}}}return tc++,t.then(ug,ug),t}function ug(){if(--tc===0&&nn!==null){_r!==null&&(_r.status="fulfilled");var e=nn;nn=null,Zr=0,_r=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function iC(e,t){var a=[],o={status:"pending",value:null,reason:null,then:function(r){a.push(r)}};return e.then(function(){o.status="fulfilled",o.value=t;for(var r=0;r<a.length;r++)(0,a[r])(t)},function(r){for(o.status="rejected",o.reason=r,r=0;r<a.length;r++)(0,a[r])(void 0)}),o}var fg=P.S;P.S=function(e,t){typeof t=="object"&&t!==null&&typeof t.then=="function"&&rC(e,t),fg!==null&&fg(e,t)};var Vo=Qt(null);function Yc(){var e=Vo.current;return e!==null?e:re.pooledCache}function xs(e,t){t===null?se(Vo,Vo.current):se(Vo,t.pool)}function Xx(){var e=Yc();return e===null?null:{parent:ke._currentValue,pool:e}}var ao=0,U=null,$=null,Ie=null,Vs=!1,Nr=!1,_o=!1,zs=0,Sn=0,Gr=null,nC=0;function we(){throw Error(C(321))}function Kc(e,t){if(t===null)return!1;for(var a=0;a<t.length&&a<e.length;a++)if(!ct(e[a],t[a]))return!1;return!0}function Wc(e,t,a,o,r,i){return ao=i,U=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,P.H=e===null||e.memoizedState===null?Ko:no,_o=!1,i=a(o,r),_o=!1,Nr&&(i=Yx(t,a,o,r)),jx(e),i}function jx(e){P.H=Zt;var t=$!==null&&$.next!==null;if(ao=0,Ie=$=U=null,Vs=!1,Sn=0,Gr=null,t)throw Error(C(300));e===null||Ve||(e=e.dependencies,e!==null&&qs(e)&&(Ve=!0))}function Yx(e,t,a,o){U=e;var r=0;do{if(Nr&&(Gr=null),Sn=0,Nr=!1,25<=r)throw Error(C(301));if(r+=1,Ie=$=null,e.updateQueue!=null){var i=e.updateQueue;i.lastEffect=null,i.events=null,i.stores=null,i.memoCache!=null&&(i.memoCache.index=0)}P.H=Wo,i=t(a,o)}while(Nr);return i}function lC(){var e=P.H,t=e.useState()[0];return t=typeof t.then=="function"?zn(t):t,e=e.useState()[0],($!==null?$.memoizedState:null)!==e&&(U.flags|=1024),t}function Zc(){var e=zs!==0;return zs=0,e}function Qc(e,t,a){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~a}function Jc(e){if(Vs){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Vs=!1}ao=0,Ie=$=U=null,Nr=!1,Sn=zs=0,Gr=null}function et(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Ie===null?U.memoizedState=Ie=e:Ie=Ie.next=e,Ie}function Te(){if($===null){var e=U.alternate;e=e!==null?e.memoizedState:null}else e=$.next;var t=Ie===null?U.memoizedState:Ie.next;if(t!==null)Ie=t,$=e;else{if(e===null)throw U.alternate===null?Error(C(467)):Error(C(310));$=e,e={memoizedState:$.memoizedState,baseState:$.baseState,baseQueue:$.baseQueue,queue:$.queue,next:null},Ie===null?U.memoizedState=Ie=e:Ie=Ie.next=e}return Ie}var iu;iu=function(){return{lastEffect:null,events:null,stores:null,memoCache:null}};function zn(e){var t=Sn;return Sn+=1,Gr===null&&(Gr=[]),e=Hx(Gr,e,t),t=U,(Ie===null?t.memoizedState:Ie.next)===null&&(t=t.alternate,P.H=t===null||t.memoizedState===null?Ko:no),e}function nu(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return zn(e);if(e.$$typeof===ma)return Ge(e)}throw Error(C(438,String(e)))}function $c(e){var t=null,a=U.updateQueue;if(a!==null&&(t=a.memoCache),t==null){var o=U.alternate;o!==null&&(o=o.updateQueue,o!==null&&(o=o.memoCache,o!=null&&(t={data:o.data.map(function(r){return r.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),a===null&&(a=iu(),U.updateQueue=a),a.memoCache=t,a=t.data[t.index],a===void 0)for(a=t.data[t.index]=Array(e),o=0;o<e;o++)a[o]=Nb;return t.index++,a}function wa(e,t){return typeof t=="function"?t(e):t}function ys(e){var t=Te();return ep(t,$,e)}function ep(e,t,a){var o=e.queue;if(o===null)throw Error(C(311));o.lastRenderedReducer=a;var r=e.baseQueue,i=o.pending;if(i!==null){if(r!==null){var n=r.next;r.next=i.next,i.next=n}t.baseQueue=r=i,o.pending=null}if(i=e.baseState,r===null)e.memoizedState=i;else{t=r.next;var l=n=null,s=null,u=t,f=!1;do{var c=u.lane&-536870913;if(c!==u.lane?(j&c)===c:(ao&c)===c){var d=u.revertLane;if(d===0)s!==null&&(s=s.next={lane:0,revertLane:0,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),c===Zr&&(f=!0);else if((ao&d)===d){u=u.next,d===Zr&&(f=!0);continue}else c={lane:0,revertLane:u.revertLane,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},s===null?(l=s=c,n=i):s=s.next=c,U.lanes|=d,ro|=d;c=u.action,_o&&a(i,c),i=u.hasEagerState?u.eagerState:a(i,c)}else d={lane:c,revertLane:u.revertLane,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},s===null?(l=s=d,n=i):s=s.next=d,U.lanes|=c,ro|=c;u=u.next}while(u!==null&&u!==t);if(s===null?n=i:s.next=l,!ct(i,e.memoizedState)&&(Ve=!0,f&&(a=_r,a!==null)))throw a;e.memoizedState=i,e.baseState=n,e.baseQueue=s,o.lastRenderedState=i}return r===null&&(o.lanes=0),[e.memoizedState,o.dispatch]}function yd(e){var t=Te(),a=t.queue;if(a===null)throw Error(C(311));a.lastRenderedReducer=e;var o=a.dispatch,r=a.pending,i=t.memoizedState;if(r!==null){a.pending=null;var n=r=r.next;do i=e(i,n.action),n=n.next;while(n!==r);ct(i,t.memoizedState)||(Ve=!0),t.memoizedState=i,t.baseQueue===null&&(t.baseState=i),a.lastRenderedState=i}return[i,o]}function Kx(e,t,a){var o=U,r=Te(),i=K;if(i){if(a===void 0)throw Error(C(407));a=a()}else a=t();var n=!ct(($||r).memoizedState,a);if(n&&(r.memoizedState=a,Ve=!0),r=r.queue,tp(Qx.bind(null,o,r,e),[e]),r.getSnapshot!==t||n||Ie!==null&&Ie.memoizedState.tag&1){if(o.flags|=2048,Qr(9,Zx.bind(null,o,r,a,t),{destroy:void 0},null),re===null)throw Error(C(349));i||(ao&60)!==0||Wx(o,t,a)}return a}function Wx(e,t,a){e.flags|=16384,e={getSnapshot:t,value:a},t=U.updateQueue,t===null?(t=iu(),U.updateQueue=t,t.stores=[e]):(a=t.stores,a===null?t.stores=[e]:a.push(e))}function Zx(e,t,a,o){t.value=a,t.getSnapshot=o,Jx(t)&&$x(e)}function Qx(e,t,a){return a(function(){Jx(t)&&$x(e)})}function Jx(e){var t=e.getSnapshot;e=e.value;try{var a=t();return!ct(e,a)}catch{return!0}}function $x(e){var t=to(e,2);t!==null&&Ze(t,e,2)}function ac(e){var t=et();if(typeof e=="function"){var a=e;if(e=a(),_o){Xa(!0);try{a()}finally{Xa(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:wa,lastRenderedState:e},t}function e0(e,t,a,o){return e.baseState=a,ep(e,$,typeof o=="function"?o:wa)}function sC(e,t,a,o,r){if(su(e))throw Error(C(485));if(e=t.action,e!==null){var i={payload:r,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(n){i.listeners.push(n)}};P.T!==null?a(!0):i.isTransition=!1,o(i),a=t.pending,a===null?(i.next=t.pending=i,t0(t,i)):(i.next=a.next,t.pending=a.next=i)}}function t0(e,t){var a=t.action,o=t.payload,r=e.state;if(t.isTransition){var i=P.T,n={};P.T=n;try{var l=a(r,o),s=P.S;s!==null&&s(n,l),dg(e,t,l)}catch(u){oc(e,t,u)}finally{P.T=i}}else try{i=a(r,o),dg(e,t,i)}catch(u){oc(e,t,u)}}function dg(e,t,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(o){cg(e,t,o)},function(o){return oc(e,t,o)}):cg(e,t,a)}function cg(e,t,a){t.status="fulfilled",t.value=a,a0(t),e.state=a,t=e.pending,t!==null&&(a=t.next,a===t?e.pending=null:(a=a.next,t.next=a,t0(e,a)))}function oc(e,t,a){var o=e.pending;if(e.pending=null,o!==null){o=o.next;do t.status="rejected",t.reason=a,a0(t),t=t.next;while(t!==o)}e.action=null}function a0(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function o0(e,t){return t}function r0(e,t){if(K){var a=re.formState;if(a!==null){e:{var o=U;if(K){if(qe){t:{for(var r=qe,i=Xt;r.nodeType!==8;){if(!i){r=null;break t}if(r=zt(r.nextSibling),r===null){r=null;break t}}i=r.data,r=i==="F!"||i==="F"?r:null}if(r){qe=zt(r.nextSibling),o=r.data==="F!";break e}}qo(o)}o=!1}o&&(t=a[0])}}return a=et(),a.memoizedState=a.baseState=t,o={pending:null,lanes:0,dispatch:null,lastRenderedReducer:o0,lastRenderedState:t},a.queue=o,a=w0.bind(null,U,o),o.dispatch=a,o=ac(!1),i=ip.bind(null,U,!1,o.queue),o=et(),r={state:t,dispatch:null,action:e,pending:null},o.queue=r,a=sC.bind(null,U,r,i,a),r.dispatch=a,o.memoizedState=e,[t,a,!1]}function i0(e){var t=Te();return n0(t,$,e)}function n0(e,t,a){t=ep(e,t,o0)[0],e=ys(wa)[0],t=typeof t=="object"&&t!==null&&typeof t.then=="function"?zn(t):t;var o=Te(),r=o.queue,i=r.dispatch;return a!==o.memoizedState&&(U.flags|=2048,Qr(9,uC.bind(null,r,a),{destroy:void 0},null)),[t,i,e]}function uC(e,t){e.action=t}function l0(e){var t=Te(),a=$;if(a!==null)return n0(t,a,e);Te(),t=t.memoizedState,a=Te();var o=a.queue.dispatch;return a.memoizedState=e,[t,o,!1]}function Qr(e,t,a,o){return e={tag:e,create:t,inst:a,deps:o,next:null},t=U.updateQueue,t===null&&(t=iu(),U.updateQueue=t),a=t.lastEffect,a===null?t.lastEffect=e.next=e:(o=a.next,a.next=e,e.next=o,t.lastEffect=e),e}function s0(){return Te().memoizedState}function vs(e,t,a,o){var r=et();U.flags|=e,r.memoizedState=Qr(1|t,a,{destroy:void 0},o===void 0?null:o)}function lu(e,t,a,o){var r=Te();o=o===void 0?null:o;var i=r.memoizedState.inst;$!==null&&o!==null&&Kc(o,$.memoizedState.deps)?r.memoizedState=Qr(t,a,i,o):(U.flags|=e,r.memoizedState=Qr(1|t,a,i,o))}function pg(e,t){vs(8390656,8,e,t)}function tp(e,t){lu(2048,8,e,t)}function u0(e,t){return lu(4,2,e,t)}function f0(e,t){return lu(4,4,e,t)}function d0(e,t){if(typeof t=="function"){e=e();var a=t(e);return function(){typeof a=="function"?a():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function c0(e,t,a){a=a!=null?a.concat([e]):null,lu(4,4,d0.bind(null,t,e),a)}function ap(){}function p0(e,t){var a=Te();t=t===void 0?null:t;var o=a.memoizedState;return t!==null&&Kc(t,o[1])?o[0]:(a.memoizedState=[e,t],e)}function m0(e,t){var a=Te();t=t===void 0?null:t;var o=a.memoizedState;if(t!==null&&Kc(t,o[1]))return o[0];if(o=e(),_o){Xa(!0);try{e()}finally{Xa(!1)}}return a.memoizedState=[o,t],o}function op(e,t,a){return a===void 0||(ao&1073741824)!==0?e.memoizedState=t:(e.memoizedState=a,e=ay(),U.lanes|=e,ro|=e,a)}function h0(e,t,a,o){return ct(a,t)?a:Wr.current!==null?(e=op(e,a,o),ct(e,t)||(Ve=!0),e):(ao&42)===0?(Ve=!0,e.memoizedState=a):(e=ay(),U.lanes|=e,ro|=e,t)}function g0(e,t,a,o,r){var i=ie.p;ie.p=i!==0&&8>i?i:8;var n=P.T,l={};P.T=l,ip(e,!1,t,a);try{var s=r(),u=P.S;if(u!==null&&u(l,s),s!==null&&typeof s=="object"&&typeof s.then=="function"){var f=iC(s,o);ln(e,t,f,dt(e))}else ln(e,t,o,dt(e))}catch(c){ln(e,t,{then:function(){},status:"rejected",reason:c},dt())}finally{ie.p=i,P.T=n}}function fC(){}function rc(e,t,a,o){if(e.tag!==5)throw Error(C(476));var r=x0(e).queue;g0(e,r,t,Po,a===null?fC:function(){return y0(e),a(o)})}function x0(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:Po,baseState:Po,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:wa,lastRenderedState:Po},next:null};var a={};return t.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:wa,lastRenderedState:a},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function y0(e){var t=x0(e).next.queue;ln(e,t,{},dt())}function rp(){return Ge(An)}function v0(){return Te().memoizedState}function L0(){return Te().memoizedState}function dC(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var a=dt();e=Ka(a);var o=Wa(t,e,a);o!==null&&(Ze(o,t,a),un(o,t,a)),t={cache:jc()},e.payload=t;return}t=t.return}}function cC(e,t,a){var o=dt();a={lane:o,revertLane:0,action:a,hasEagerState:!1,eagerState:null,next:null},su(e)?b0(t,a):(a=_c(e,t,a,o),a!==null&&(Ze(a,e,o),S0(a,t,o)))}function w0(e,t,a){var o=dt();ln(e,t,a,o)}function ln(e,t,a,o){var r={lane:o,revertLane:0,action:a,hasEagerState:!1,eagerState:null,next:null};if(su(e))b0(t,r);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=t.lastRenderedReducer,i!==null))try{var n=t.lastRenderedState,l=i(n,a);if(r.hasEagerState=!0,r.eagerState=l,ct(l,n))return ru(e,t,r,0),re===null&&ou(),!1}catch{}finally{}if(a=_c(e,t,r,o),a!==null)return Ze(a,e,o),S0(a,t,o),!0}return!1}function ip(e,t,a,o){if(o={lane:2,revertLane:hp(),action:o,hasEagerState:!1,eagerState:null,next:null},su(e)){if(t)throw Error(C(479))}else t=_c(e,a,o,2),t!==null&&Ze(t,e,2)}function su(e){var t=e.alternate;return e===U||t!==null&&t===U}function b0(e,t){Nr=Vs=!0;var a=e.pending;a===null?t.next=t:(t.next=a.next,a.next=t),e.pending=t}function S0(e,t,a){if((a&4194176)!==0){var o=t.lanes;o&=e.pendingLanes,a|=o,t.lanes=a,dx(e,a)}}var Zt={readContext:Ge,use:nu,useCallback:we,useContext:we,useEffect:we,useImperativeHandle:we,useLayoutEffect:we,useInsertionEffect:we,useMemo:we,useReducer:we,useRef:we,useState:we,useDebugValue:we,useDeferredValue:we,useTransition:we,useSyncExternalStore:we,useId:we};Zt.useCacheRefresh=we;Zt.useMemoCache=we;Zt.useHostTransitionStatus=we;Zt.useFormState=we;Zt.useActionState=we;Zt.useOptimistic=we;var Ko={readContext:Ge,use:nu,useCallback:function(e,t){return et().memoizedState=[e,t===void 0?null:t],e},useContext:Ge,useEffect:pg,useImperativeHandle:function(e,t,a){a=a!=null?a.concat([e]):null,vs(4194308,4,d0.bind(null,t,e),a)},useLayoutEffect:function(e,t){return vs(4194308,4,e,t)},useInsertionEffect:function(e,t){vs(4,2,e,t)},useMemo:function(e,t){var a=et();t=t===void 0?null:t;var o=e();if(_o){Xa(!0);try{e()}finally{Xa(!1)}}return a.memoizedState=[o,t],o},useReducer:function(e,t,a){var o=et();if(a!==void 0){var r=a(t);if(_o){Xa(!0);try{a(t)}finally{Xa(!1)}}}else r=t;return o.memoizedState=o.baseState=r,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:r},o.queue=e,e=e.dispatch=cC.bind(null,U,e),[o.memoizedState,e]},useRef:function(e){var t=et();return e={current:e},t.memoizedState=e},useState:function(e){e=ac(e);var t=e.queue,a=w0.bind(null,U,t);return t.dispatch=a,[e.memoizedState,a]},useDebugValue:ap,useDeferredValue:function(e,t){var a=et();return op(a,e,t)},useTransition:function(){var e=ac(!1);return e=g0.bind(null,U,e.queue,!0,!1),et().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,a){var o=U,r=et();if(K){if(a===void 0)throw Error(C(407));a=a()}else{if(a=t(),re===null)throw Error(C(349));(j&60)!==0||Wx(o,t,a)}r.memoizedState=a;var i={value:a,getSnapshot:t};return r.queue=i,pg(Qx.bind(null,o,i,e),[e]),o.flags|=2048,Qr(9,Zx.bind(null,o,i,a,t),{destroy:void 0},null),a},useId:function(){var e=et(),t=re.identifierPrefix;if(K){var a=ga,o=ha;a=(o&~(1<<32-ft(o)-1)).toString(32)+a,t=":"+t+"R"+a,a=zs++,0<a&&(t+="H"+a.toString(32)),t+=":"}else a=nC++,t=":"+t+"r"+a.toString(32)+":";return e.memoizedState=t},useCacheRefresh:function(){return et().memoizedState=dC.bind(null,U)}};Ko.useMemoCache=$c;Ko.useHostTransitionStatus=rp;Ko.useFormState=r0;Ko.useActionState=r0;Ko.useOptimistic=function(e){var t=et();t.memoizedState=t.baseState=e;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=a,t=ip.bind(null,U,!0,a),a.dispatch=t,[e,t]};var no={readContext:Ge,use:nu,useCallback:p0,useContext:Ge,useEffect:tp,useImperativeHandle:c0,useInsertionEffect:u0,useLayoutEffect:f0,useMemo:m0,useReducer:ys,useRef:s0,useState:function(){return ys(wa)},useDebugValue:ap,useDeferredValue:function(e,t){var a=Te();return h0(a,$.memoizedState,e,t)},useTransition:function(){var e=ys(wa)[0],t=Te().memoizedState;return[typeof e=="boolean"?e:zn(e),t]},useSyncExternalStore:Kx,useId:v0};no.useCacheRefresh=L0;no.useMemoCache=$c;no.useHostTransitionStatus=rp;no.useFormState=i0;no.useActionState=i0;no.useOptimistic=function(e,t){var a=Te();return e0(a,$,e,t)};var Wo={readContext:Ge,use:nu,useCallback:p0,useContext:Ge,useEffect:tp,useImperativeHandle:c0,useInsertionEffect:u0,useLayoutEffect:f0,useMemo:m0,useReducer:yd,useRef:s0,useState:function(){return yd(wa)},useDebugValue:ap,useDeferredValue:function(e,t){var a=Te();return $===null?op(a,e,t):h0(a,$.memoizedState,e,t)},useTransition:function(){var e=yd(wa)[0],t=Te().memoizedState;return[typeof e=="boolean"?e:zn(e),t]},useSyncExternalStore:Kx,useId:v0};Wo.useCacheRefresh=L0;Wo.useMemoCache=$c;Wo.useHostTransitionStatus=rp;Wo.useFormState=l0;Wo.useActionState=l0;Wo.useOptimistic=function(e,t){var a=Te();return $!==null?e0(a,$,e,t):(a.baseState=e,[e,a.queue.dispatch])};function vd(e,t,a,o){t=e.memoizedState,a=a(o,t),a=a==null?t:ne({},t,a),e.memoizedState=a,e.lanes===0&&(e.updateQueue.baseState=a)}var ic={isMounted:function(e){return(e=e._reactInternals)?ti(e)===e:!1},enqueueSetState:function(e,t,a){e=e._reactInternals;var o=dt(),r=Ka(o);r.payload=t,a!=null&&(r.callback=a),t=Wa(e,r,o),t!==null&&(Ze(t,e,o),un(t,e,o))},enqueueReplaceState:function(e,t,a){e=e._reactInternals;var o=dt(),r=Ka(o);r.tag=1,r.payload=t,a!=null&&(r.callback=a),t=Wa(e,r,o),t!==null&&(Ze(t,e,o),un(t,e,o))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var a=dt(),o=Ka(a);o.tag=2,t!=null&&(o.callback=t),t=Wa(e,o,a),t!==null&&(Ze(t,e,a),un(t,e,a))}};function mg(e,t,a,o,r,i,n){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(o,i,n):t.prototype&&t.prototype.isPureReactComponent?!Ln(a,o)||!Ln(r,i):!0}function hg(e,t,a,o){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(a,o),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(a,o),t.state!==e&&ic.enqueueReplaceState(t,t.state,null)}function No(e,t){var a=t;if("ref"in t){a={};for(var o in t)o!=="ref"&&(a[o]=t[o])}if(e=e.defaultProps){a===t&&(a=ne({},a));for(var r in e)a[r]===void 0&&(a[r]=e[r])}return a}var Fs=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function C0(e){Fs(e)}function I0(e){console.error(e)}function T0(e){Fs(e)}function Us(e,t){try{var a=e.onUncaughtError;a(t.value,{componentStack:t.stack})}catch(o){setTimeout(function(){throw o})}}function gg(e,t,a){try{var o=e.onCaughtError;o(a.value,{componentStack:a.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(r){setTimeout(function(){throw r})}}function nc(e,t,a){return a=Ka(a),a.tag=3,a.payload={element:null},a.callback=function(){Us(e,t)},a}function A0(e){return e=Ka(e),e.tag=3,e}function k0(e,t,a,o){var r=a.type.getDerivedStateFromError;if(typeof r=="function"){var i=o.value;e.payload=function(){return r(i)},e.callback=function(){gg(t,a,o)}}var n=a.stateNode;n!==null&&typeof n.componentDidCatch=="function"&&(e.callback=function(){gg(t,a,o),typeof r!="function"&&(Qa===null?Qa=new Set([this]):Qa.add(this));var l=o.stack;this.componentDidCatch(o.value,{componentStack:l!==null?l:""})})}function pC(e,t,a,o,r){if(a.flags|=32768,o!==null&&typeof o=="object"&&typeof o.then=="function"){if(t=a.alternate,t!==null&&Fn(t,a,r,!0),a=Tt.current,a!==null){switch(a.tag){case 13:return Wt===null?wc():a.alternate===null&&ve===0&&(ve=3),a.flags&=-257,a.flags|=65536,a.lanes=r,o===$d?a.flags|=16384:(t=a.updateQueue,t===null?a.updateQueue=new Set([o]):t.add(o),Ed(e,o,r)),!1;case 22:return a.flags|=65536,o===$d?a.flags|=16384:(t=a.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([o])},a.updateQueue=t):(a=t.retryQueue,a===null?t.retryQueue=new Set([o]):a.add(o)),Ed(e,o,r)),!1}throw Error(C(435,a.tag))}return Ed(e,o,r),wc(),!1}if(K)return t=Tt.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=r,o!==Jd&&(e=Error(C(422),{cause:o}),wn(St(e,a)))):(o!==Jd&&(t=Error(C(423),{cause:o}),wn(St(t,a))),e=e.current.alternate,e.flags|=65536,r&=-r,e.lanes|=r,o=St(o,a),r=nc(e.stateNode,o,r),Id(e,r),ve!==4&&(ve=2)),!1;var i=Error(C(520),{cause:o});if(i=St(i,a),pn===null?pn=[i]:pn.push(i),ve!==4&&(ve=2),t===null)return!0;o=St(o,a),a=t;do{switch(a.tag){case 3:return a.flags|=65536,e=r&-r,a.lanes|=e,e=nc(a.stateNode,o,e),Id(a,e),!1;case 1:if(t=a.type,i=a.stateNode,(a.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||i!==null&&typeof i.componentDidCatch=="function"&&(Qa===null||!Qa.has(i))))return a.flags|=65536,r&=-r,a.lanes|=r,r=A0(r),k0(r,e,a,o),Id(a,r),!1}a=a.return}while(a!==null);return!1}var D0=Error(C(461)),Ve=!1;function Ue(e,t,a,o){t.child=e===null?Nx(t,null,a,o):Ho(t,e.child,a,o)}function xg(e,t,a,o,r){a=a.render;var i=t.ref;if("ref"in o){var n={};for(var l in o)l!=="ref"&&(n[l]=o[l])}else n=o;return Go(t),o=Wc(e,t,a,n,i,r),l=Zc(),e!==null&&!Ve?(Qc(e,t,r),ba(e,t,r)):(K&&l&&Nc(t),t.flags|=1,Ue(e,t,o,r),t.child)}function yg(e,t,a,o,r){if(e===null){var i=a.type;return typeof i=="function"&&!fp(i)&&i.defaultProps===void 0&&a.compare===null?(t.tag=15,t.type=i,M0(e,t,i,o,r)):(e=ws(a.type,null,o,t,t.mode,r),e.ref=t.ref,e.return=t,t.child=e)}if(i=e.child,!np(e,r)){var n=i.memoizedProps;if(a=a.compare,a=a!==null?a:Ln,a(n,o)&&e.ref===t.ref)return ba(e,t,r)}return t.flags|=1,e=Za(i,o),e.ref=t.ref,e.return=t,t.child=e}function M0(e,t,a,o,r){if(e!==null){var i=e.memoizedProps;if(Ln(i,o)&&e.ref===t.ref)if(Ve=!1,t.pendingProps=o=i,np(e,r))(e.flags&131072)!==0&&(Ve=!0);else return t.lanes=e.lanes,ba(e,t,r)}return lc(e,t,a,o,r)}function B0(e,t,a){var o=t.pendingProps,r=o.children,i=(t.stateNode._pendingVisibility&2)!==0,n=e!==null?e.memoizedState:null;if(sn(e,t),o.mode==="hidden"||i){if((t.flags&128)!==0){if(o=n!==null?n.baseLanes|a:a,e!==null){for(r=t.child=e.child,i=0;r!==null;)i=i|r.lanes|r.childLanes,r=r.sibling;t.childLanes=i&~o}else t.childLanes=0,t.child=null;return vg(e,t,o,a)}if((a&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&xs(t,n!==null?n.cachePool:null),n!==null?sg(t,n):ec(),Gx(t);else return t.lanes=t.childLanes=536870912,vg(e,t,n!==null?n.baseLanes|a:a,a)}else n!==null?(xs(t,n.cachePool),sg(t,n),_a(t),t.memoizedState=null):(e!==null&&xs(t,null),ec(),_a(t));return Ue(e,t,r,a),t.child}function vg(e,t,a,o){var r=Yc();return r=r===null?null:{parent:ke._currentValue,pool:r},t.memoizedState={baseLanes:a,cachePool:r},e!==null&&xs(t,null),ec(),Gx(t),e!==null&&Fn(e,t,o,!0),null}function sn(e,t){var a=t.ref;if(a===null)e!==null&&e.ref!==null&&(t.flags|=2097664);else{if(typeof a!="function"&&typeof a!="object")throw Error(C(284));(e===null||e.ref!==a)&&(t.flags|=2097664)}}function lc(e,t,a,o,r){return Go(t),a=Wc(e,t,a,o,void 0,r),o=Zc(),e!==null&&!Ve?(Qc(e,t,r),ba(e,t,r)):(K&&o&&Nc(t),t.flags|=1,Ue(e,t,a,r),t.child)}function Lg(e,t,a,o,r,i){return Go(t),t.updateQueue=null,a=Yx(t,o,a,r),jx(e),o=Zc(),e!==null&&!Ve?(Qc(e,t,i),ba(e,t,i)):(K&&o&&Nc(t),t.flags|=1,Ue(e,t,a,i),t.child)}function wg(e,t,a,o,r){if(Go(t),t.stateNode===null){var i=Pr,n=a.contextType;typeof n=="object"&&n!==null&&(i=Ge(n)),i=new a(o,i),t.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,i.updater=ic,t.stateNode=i,i._reactInternals=t,i=t.stateNode,i.props=o,i.state=t.memoizedState,i.refs={},lp(t),n=a.contextType,i.context=typeof n=="object"&&n!==null?Ge(n):Pr,i.state=t.memoizedState,n=a.getDerivedStateFromProps,typeof n=="function"&&(vd(t,a,n,o),i.state=t.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(n=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),n!==i.state&&ic.enqueueReplaceState(i,i.state,null),dn(t,o,i,r),fn(),i.state=t.memoizedState),typeof i.componentDidMount=="function"&&(t.flags|=4194308),o=!0}else if(e===null){i=t.stateNode;var l=t.memoizedProps,s=No(a,l);i.props=s;var u=i.context,f=a.contextType;n=Pr,typeof f=="object"&&f!==null&&(n=Ge(f));var c=a.getDerivedStateFromProps;f=typeof c=="function"||typeof i.getSnapshotBeforeUpdate=="function",l=t.pendingProps!==l,f||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(l||u!==n)&&hg(t,i,o,n),qa=!1;var d=t.memoizedState;i.state=d,dn(t,o,i,r),fn(),u=t.memoizedState,l||d!==u||qa?(typeof c=="function"&&(vd(t,a,c,o),u=t.memoizedState),(s=qa||mg(t,a,s,o,d,u,n))?(f||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(t.flags|=4194308)):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=o,t.memoizedState=u),i.props=o,i.state=u,i.context=n,o=s):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),o=!1)}else{i=t.stateNode,pc(e,t),n=t.memoizedProps,f=No(a,n),i.props=f,c=t.pendingProps,d=i.context,u=a.contextType,s=Pr,typeof u=="object"&&u!==null&&(s=Ge(u)),l=a.getDerivedStateFromProps,(u=typeof l=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(n!==c||d!==s)&&hg(t,i,o,s),qa=!1,d=t.memoizedState,i.state=d,dn(t,o,i,r),fn();var h=t.memoizedState;n!==c||d!==h||qa||e!==null&&e.dependencies!==null&&qs(e.dependencies)?(typeof l=="function"&&(vd(t,a,l,o),h=t.memoizedState),(f=qa||mg(t,a,f,o,d,h,s)||e!==null&&e.dependencies!==null&&qs(e.dependencies))?(u||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(o,h,s),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(o,h,s)),typeof i.componentDidUpdate=="function"&&(t.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof i.componentDidUpdate!="function"||n===e.memoizedProps&&d===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||n===e.memoizedProps&&d===e.memoizedState||(t.flags|=1024),t.memoizedProps=o,t.memoizedState=h),i.props=o,i.state=h,i.context=s,o=f):(typeof i.componentDidUpdate!="function"||n===e.memoizedProps&&d===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||n===e.memoizedProps&&d===e.memoizedState||(t.flags|=1024),o=!1)}return i=o,sn(e,t),o=(t.flags&128)!==0,i||o?(i=t.stateNode,a=o&&typeof a.getDerivedStateFromError!="function"?null:i.render(),t.flags|=1,e!==null&&o?(t.child=Ho(t,e.child,null,r),t.child=Ho(t,null,a,r)):Ue(e,t,a,r),t.memoizedState=i.state,e=t.child):e=ba(e,t,r),e}function bg(e,t,a,o){return On(),t.flags|=256,Ue(e,t,a,o),t.child}var Ld={dehydrated:null,treeContext:null,retryLane:0};function wd(e){return{baseLanes:e,cachePool:Xx()}}function bd(e,t,a){return e=e!==null?e.childLanes&~a:0,t&&(e|=It),e}function E0(e,t,a){var o=t.pendingProps,r=!1,i=(t.flags&128)!==0,n;if((n=i)||(n=e!==null&&e.memoizedState===null?!1:(De.current&2)!==0),n&&(r=!0,t.flags&=-129),n=(t.flags&32)!==0,t.flags&=-33,e===null){if(K){if(r?Ha(t):_a(t),K){var l=qe,s;if(s=l){e:{for(s=l,l=Xt;s.nodeType!==8;){if(!l){l=null;break e}if(s=zt(s.nextSibling),s===null){l=null;break e}}l=s}l!==null?(t.memoizedState={dehydrated:l,treeContext:Oo!==null?{id:ha,overflow:ga}:null,retryLane:536870912},s=Ct(18,null,null,0),s.stateNode=l,s.return=t,t.child=s,We=t,qe=null,s=!0):s=!1}s||qo(t)}if(l=t.memoizedState,l!==null&&(l=l.dehydrated,l!==null))return l.data==="$!"?t.lanes=16:t.lanes=536870912,null;xa(t)}return l=o.children,o=o.fallback,r?(_a(t),r=t.mode,l=uc({mode:"hidden",children:l},r),o=zo(o,r,a,null),l.return=t,o.return=t,l.sibling=o,t.child=l,r=t.child,r.memoizedState=wd(a),r.childLanes=bd(e,n,a),t.memoizedState=Ld,o):(Ha(t),sc(t,l))}if(s=e.memoizedState,s!==null&&(l=s.dehydrated,l!==null)){if(i)t.flags&256?(Ha(t),t.flags&=-257,t=Sd(e,t,a)):t.memoizedState!==null?(_a(t),t.child=e.child,t.flags|=128,t=null):(_a(t),r=o.fallback,l=t.mode,o=uc({mode:"visible",children:o.children},l),r=zo(r,l,a,null),r.flags|=2,o.return=t,r.return=t,o.sibling=r,t.child=o,Ho(t,e.child,null,a),o=t.child,o.memoizedState=wd(a),o.childLanes=bd(e,n,a),t.memoizedState=Ld,t=r);else if(Ha(t),l.data==="$!"){if(n=l.nextSibling&&l.nextSibling.dataset,n)var u=n.dgst;n=u,o=Error(C(419)),o.stack="",o.digest=n,wn({value:o,source:null,stack:null}),t=Sd(e,t,a)}else if(Ve||Fn(e,t,a,!1),n=(a&e.childLanes)!==0,Ve||n){if(n=re,n!==null){if(o=a&-a,(o&42)!==0)o=1;else switch(o){case 2:o=1;break;case 8:o=4;break;case 32:o=16;break;case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:o=64;break;case 268435456:o=134217728;break;default:o=0}if(o=(o&(n.suspendedLanes|a))!==0?0:o,o!==0&&o!==s.retryLane)throw s.retryLane=o,to(e,o),Ze(n,e,o),D0}l.data==="$?"||wc(),t=Sd(e,t,a)}else l.data==="$?"?(t.flags|=128,t.child=e.child,t=kC.bind(null,e),l._reactRetry=t,t=null):(e=s.treeContext,qe=zt(l.nextSibling),We=t,K=!0,Vt=null,Xt=!1,e!==null&&(Lt[wt++]=ha,Lt[wt++]=ga,Lt[wt++]=Oo,ha=e.id,ga=e.overflow,Oo=t),t=sc(t,o.children),t.flags|=4096);return t}return r?(_a(t),r=o.fallback,l=t.mode,s=e.child,u=s.sibling,o=Za(s,{mode:"hidden",children:o.children}),o.subtreeFlags=s.subtreeFlags&31457280,u!==null?r=Za(u,r):(r=zo(r,l,a,null),r.flags|=2),r.return=t,o.return=t,o.sibling=r,t.child=o,o=r,r=t.child,l=e.child.memoizedState,l===null?l=wd(a):(s=l.cachePool,s!==null?(u=ke._currentValue,s=s.parent!==u?{parent:u,pool:u}:s):s=Xx(),l={baseLanes:l.baseLanes|a,cachePool:s}),r.memoizedState=l,r.childLanes=bd(e,n,a),t.memoizedState=Ld,o):(Ha(t),a=e.child,e=a.sibling,a=Za(a,{mode:"visible",children:o.children}),a.return=t,a.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=a,t.memoizedState=null,a)}function sc(e,t){return t=uc({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function uc(e,t){return ey(e,t,0,null)}function Sd(e,t,a){return Ho(t,e.child,null,a),e=sc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Sg(e,t,a){e.lanes|=t;var o=e.alternate;o!==null&&(o.lanes|=t),dc(e.return,t,a)}function Cd(e,t,a,o,r){var i=e.memoizedState;i===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:o,tail:a,tailMode:r}:(i.isBackwards=t,i.rendering=null,i.renderingStartTime=0,i.last=o,i.tail=a,i.tailMode=r)}function R0(e,t,a){var o=t.pendingProps,r=o.revealOrder,i=o.tail;if(Ue(e,t,o.children,a),o=De.current,(o&2)!==0)o=o&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Sg(e,a,t);else if(e.tag===19)Sg(e,a,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}o&=1}switch(se(De,o),r){case"forwards":for(a=t.child,r=null;a!==null;)e=a.alternate,e!==null&&Os(e)===null&&(r=a),a=a.sibling;a=r,a===null?(r=t.child,t.child=null):(r=a.sibling,a.sibling=null),Cd(t,!1,r,a,i);break;case"backwards":for(a=null,r=t.child,t.child=null;r!==null;){if(e=r.alternate,e!==null&&Os(e)===null){t.child=r;break}e=r.sibling,r.sibling=a,a=r,r=e}Cd(t,!0,a,null,i);break;case"together":Cd(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function ba(e,t,a){if(e!==null&&(t.dependencies=e.dependencies),ro|=t.lanes,(a&t.childLanes)===0)if(e!==null){if(Fn(e,t,a,!1),(a&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(C(153));if(t.child!==null){for(e=t.child,a=Za(e,e.pendingProps),t.child=a,a.return=t;e.sibling!==null;)e=e.sibling,a=a.sibling=Za(e,e.pendingProps),a.return=t;a.sibling=null}return t.child}function np(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&qs(e)))}function mC(e,t,a){switch(t.tag){case 3:Ts(t,t.stateNode.containerInfo),Na(t,ke,e.memoizedState.cache),On();break;case 27:case 5:Nd(t);break;case 4:Ts(t,t.stateNode.containerInfo);break;case 10:Na(t,t.type,t.memoizedProps.value);break;case 13:var o=t.memoizedState;if(o!==null)return o.dehydrated!==null?(Ha(t),t.flags|=128,null):(a&t.child.childLanes)!==0?E0(e,t,a):(Ha(t),e=ba(e,t,a),e!==null?e.sibling:null);Ha(t);break;case 19:var r=(e.flags&128)!==0;if(o=(a&t.childLanes)!==0,o||(Fn(e,t,a,!1),o=(a&t.childLanes)!==0),r){if(o)return R0(e,t,a);t.flags|=128}if(r=t.memoizedState,r!==null&&(r.rendering=null,r.tail=null,r.lastEffect=null),se(De,De.current),o)break;return null;case 22:case 23:return t.lanes=0,B0(e,t,a);case 24:Na(t,ke,e.memoizedState.cache)}return ba(e,t,a)}function P0(e,t,a){if(e!==null)if(e.memoizedProps!==t.pendingProps)Ve=!0;else{if(!np(e,a)&&(t.flags&128)===0)return Ve=!1,mC(e,t,a);Ve=(e.flags&131072)!==0}else Ve=!1,K&&(t.flags&1048576)!==0&&Ux(t,Rs,t.index);switch(t.lanes=0,t.tag){case 16:e:{e=t.pendingProps;var o=t.elementType,r=o._init;if(o=r(o._payload),t.type=o,typeof o=="function")fp(o)?(e=No(o,e),t.tag=1,t=wg(null,t,o,e,a)):(t.tag=0,t=lc(null,t,o,e,a));else{if(o!=null){if(r=o.$$typeof,r===Bc){t.tag=11,t=xg(null,t,o,e,a);break e}else if(r===Ec){t.tag=14,t=yg(null,t,o,e,a);break e}}throw t=Hd(o)||o,Error(C(306,t,""))}}return t;case 0:return lc(e,t,t.type,t.pendingProps,a);case 1:return o=t.type,r=No(o,t.pendingProps),wg(e,t,o,r,a);case 3:e:{if(Ts(t,t.stateNode.containerInfo),e===null)throw Error(C(387));var i=t.pendingProps;r=t.memoizedState,o=r.element,pc(e,t),dn(t,i,null,a);var n=t.memoizedState;if(i=n.cache,Na(t,ke,i),i!==r.cache&&cc(t,[ke],a,!0),fn(),i=n.element,r.isDehydrated)if(r={element:i,isDehydrated:!1,cache:n.cache},t.updateQueue.baseState=r,t.memoizedState=r,t.flags&256){t=bg(e,t,i,a);break e}else if(i!==o){o=St(Error(C(424)),t),wn(o),t=bg(e,t,i,a);break e}else for(qe=zt(t.stateNode.containerInfo.firstChild),We=t,K=!0,Vt=null,Xt=!0,a=Nx(t,null,i,a),t.child=a;a;)a.flags=a.flags&-3|4096,a=a.sibling;else{if(On(),i===o){t=ba(e,t,a);break e}Ue(e,t,i,a)}t=t.child}return t;case 26:return sn(e,t),e===null?(a=Ng(t.type,null,t.pendingProps,null))?t.memoizedState=a:K||(a=t.type,e=t.pendingProps,o=Ys(Ya.current).createElement(a),o[Ne]=t,o[tt]=e,He(o,a,e),Oe(o),t.stateNode=o):t.memoizedState=Ng(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return Nd(t),e===null&&K&&(o=t.stateNode=yy(t.type,t.pendingProps,Ya.current),We=t,Xt=!0,qe=zt(o.firstChild)),o=t.pendingProps.children,e!==null||K?Ue(e,t,o,a):t.child=Ho(t,null,o,a),sn(e,t),t.child;case 5:return e===null&&K&&((r=o=qe)&&(o=_C(o,t.type,t.pendingProps,Xt),o!==null?(t.stateNode=o,We=t,qe=zt(o.firstChild),Xt=!1,r=!0):r=!1),r||qo(t)),Nd(t),r=t.type,i=t.pendingProps,n=e!==null?e.memoizedProps:null,o=i.children,Tc(r,i)?o=null:n!==null&&Tc(r,n)&&(t.flags|=32),t.memoizedState!==null&&(r=Wc(e,t,lC,null,null,a),An._currentValue=r),sn(e,t),Ue(e,t,o,a),t.child;case 6:return e===null&&K&&((e=a=qe)&&(a=NC(a,t.pendingProps,Xt),a!==null?(t.stateNode=a,We=t,qe=null,e=!0):e=!1),e||qo(t)),null;case 13:return E0(e,t,a);case 4:return Ts(t,t.stateNode.containerInfo),o=t.pendingProps,e===null?t.child=Ho(t,null,o,a):Ue(e,t,o,a),t.child;case 11:return xg(e,t,t.type,t.pendingProps,a);case 7:return Ue(e,t,t.pendingProps,a),t.child;case 8:return Ue(e,t,t.pendingProps.children,a),t.child;case 12:return Ue(e,t,t.pendingProps.children,a),t.child;case 10:return o=t.pendingProps,Na(t,t.type,o.value),Ue(e,t,o.children,a),t.child;case 9:return r=t.type._context,o=t.pendingProps.children,Go(t),r=Ge(r),o=o(r),t.flags|=1,Ue(e,t,o,a),t.child;case 14:return yg(e,t,t.type,t.pendingProps,a);case 15:return M0(e,t,t.type,t.pendingProps,a);case 19:return R0(e,t,a);case 22:return B0(e,t,a);case 24:return Go(t),o=Ge(ke),e===null?(r=Yc(),r===null&&(r=re,i=jc(),r.pooledCache=i,i.refCount++,i!==null&&(r.pooledCacheLanes|=a),r=i),t.memoizedState={parent:o,cache:r},lp(t),Na(t,ke,r)):((e.lanes&a)!==0&&(pc(e,t),dn(t,null,null,a),fn()),r=e.memoizedState,i=t.memoizedState,r.parent!==o?(r={parent:o,cache:o},t.memoizedState=r,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=r),Na(t,ke,o)):(o=i.cache,Na(t,ke,o),o!==r.cache&&cc(t,[ke],a,!0))),Ue(e,t,t.pendingProps.children,a),t.child;case 29:throw t.pendingProps}throw Error(C(156,t.tag))}var fc=Qt(null),Zo=null,ya=null;function Na(e,t,a){se(fc,t._currentValue),t._currentValue=a}function va(e){e._currentValue=fc.current,ze(fc)}function dc(e,t,a){for(;e!==null;){var o=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,o!==null&&(o.childLanes|=t)):o!==null&&(o.childLanes&t)!==t&&(o.childLanes|=t),e===a)break;e=e.return}}function cc(e,t,a,o){var r=e.child;for(r!==null&&(r.return=e);r!==null;){var i=r.dependencies;if(i!==null){var n=r.child;i=i.firstContext;e:for(;i!==null;){var l=i;i=r;for(var s=0;s<t.length;s++)if(l.context===t[s]){i.lanes|=a,l=i.alternate,l!==null&&(l.lanes|=a),dc(i.return,a,e),o||(n=null);break e}i=l.next}}else if(r.tag===18){if(n=r.return,n===null)throw Error(C(341));n.lanes|=a,i=n.alternate,i!==null&&(i.lanes|=a),dc(n,a,e),n=null}else n=r.child;if(n!==null)n.return=r;else for(n=r;n!==null;){if(n===e){n=null;break}if(r=n.sibling,r!==null){r.return=n.return,n=r;break}n=n.return}r=n}}function Fn(e,t,a,o){e=null;for(var r=t,i=!1;r!==null;){if(!i){if((r.flags&524288)!==0)i=!0;else if((r.flags&262144)!==0)break}if(r.tag===10){var n=r.alternate;if(n===null)throw Error(C(387));if(n=n.memoizedProps,n!==null){var l=r.type;ct(r.pendingProps.value,n.value)||(e!==null?e.push(l):e=[l])}}else if(r===Is.current){if(n=r.alternate,n===null)throw Error(C(387));n.memoizedState.memoizedState!==r.memoizedState.memoizedState&&(e!==null?e.push(An):e=[An])}r=r.return}e!==null&&cc(t,e,a,o),t.flags|=262144}function qs(e){for(e=e.firstContext;e!==null;){if(!ct(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Go(e){Zo=e,ya=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Ge(e){return O0(Zo,e)}function is(e,t){return Zo===null&&Go(e),O0(e,t)}function O0(e,t){var a=t._currentValue;if(t={context:t,memoizedValue:a,next:null},ya===null){if(e===null)throw Error(C(308));ya=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else ya=ya.next=t;return a}var qa=!1;function lp(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function pc(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ka(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Wa(e,t,a){var o=e.updateQueue;if(o===null)return null;if(o=o.shared,(pe&2)!==0){var r=o.pending;return r===null?t.next=t:(t.next=r.next,r.next=t),o.pending=t,t=Bs(e),Fx(e,null,a),t}return ru(e,o,t,a),Bs(e)}function un(e,t,a){if(t=t.updateQueue,t!==null&&(t=t.shared,(a&4194176)!==0)){var o=t.lanes;o&=e.pendingLanes,a|=o,t.lanes=a,dx(e,a)}}function Id(e,t){var a=e.updateQueue,o=e.alternate;if(o!==null&&(o=o.updateQueue,a===o)){var r=null,i=null;if(a=a.firstBaseUpdate,a!==null){do{var n={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};i===null?r=i=n:i=i.next=n,a=a.next}while(a!==null);i===null?r=i=t:i=i.next=t}else r=i=t;a={baseState:o.baseState,firstBaseUpdate:r,lastBaseUpdate:i,shared:o.shared,callbacks:o.callbacks},e.updateQueue=a;return}e=a.lastBaseUpdate,e===null?a.firstBaseUpdate=t:e.next=t,a.lastBaseUpdate=t}var mc=!1;function fn(){if(mc){var e=_r;if(e!==null)throw e}}function dn(e,t,a,o){mc=!1;var r=e.updateQueue;qa=!1;var i=r.firstBaseUpdate,n=r.lastBaseUpdate,l=r.shared.pending;if(l!==null){r.shared.pending=null;var s=l,u=s.next;s.next=null,n===null?i=u:n.next=u,n=s;var f=e.alternate;f!==null&&(f=f.updateQueue,l=f.lastBaseUpdate,l!==n&&(l===null?f.firstBaseUpdate=u:l.next=u,f.lastBaseUpdate=s))}if(i!==null){var c=r.baseState;n=0,f=u=s=null,l=i;do{var d=l.lane&-536870913,h=d!==l.lane;if(h?(j&d)===d:(o&d)===d){d!==0&&d===Zr&&(mc=!0),f!==null&&(f=f.next={lane:0,tag:l.tag,payload:l.payload,callback:null,next:null});e:{var x=e,v=l;d=t;var b=a;switch(v.tag){case 1:if(x=v.payload,typeof x=="function"){c=x.call(b,c,d);break e}c=x;break e;case 3:x.flags=x.flags&-65537|128;case 0:if(x=v.payload,d=typeof x=="function"?x.call(b,c,d):x,d==null)break e;c=ne({},c,d);break e;case 2:qa=!0}}d=l.callback,d!==null&&(e.flags|=64,h&&(e.flags|=8192),h=r.callbacks,h===null?r.callbacks=[d]:h.push(d))}else h={lane:d,tag:l.tag,payload:l.payload,callback:l.callback,next:null},f===null?(u=f=h,s=c):f=f.next=h,n|=d;if(l=l.next,l===null){if(l=r.shared.pending,l===null)break;h=l,l=h.next,h.next=null,r.lastBaseUpdate=h,r.shared.pending=null}}while(!0);f===null&&(s=c),r.baseState=s,r.firstBaseUpdate=u,r.lastBaseUpdate=f,i===null&&(r.shared.lanes=0),ro|=n,e.lanes=n,e.memoizedState=c}}function V0(e,t){if(typeof e!="function")throw Error(C(191,e));e.call(t)}function z0(e,t){var a=e.callbacks;if(a!==null)for(e.callbacks=null,e=0;e<a.length;e++)V0(a[e],t)}function Un(e,t){try{var a=t.updateQueue,o=a!==null?a.lastEffect:null;if(o!==null){var r=o.next;a=r;do{if((a.tag&e)===e){o=void 0;var i=a.create,n=a.inst;o=i(),n.destroy=o}a=a.next}while(a!==r)}}catch(l){ae(t,t.return,l)}}function oo(e,t,a){try{var o=t.updateQueue,r=o!==null?o.lastEffect:null;if(r!==null){var i=r.next;o=i;do{if((o.tag&e)===e){var n=o.inst,l=n.destroy;if(l!==void 0){n.destroy=void 0,r=t;var s=a;try{l()}catch(u){ae(r,s,u)}}}o=o.next}while(o!==i)}}catch(u){ae(t,t.return,u)}}function F0(e){var t=e.updateQueue;if(t!==null){var a=e.stateNode;try{z0(t,a)}catch(o){ae(e,e.return,o)}}}function U0(e,t,a){a.props=No(e.type,e.memoizedProps),a.state=e.memoizedState;try{a.componentWillUnmount()}catch(o){ae(e,t,o)}}function Ro(e,t){try{var a=e.ref;if(a!==null){var o=e.stateNode;switch(e.tag){case 26:case 27:case 5:var r=o;break;default:r=o}typeof a=="function"?e.refCleanup=a(r):a.current=r}}catch(i){ae(e,t,i)}}function st(e,t){var a=e.ref,o=e.refCleanup;if(a!==null)if(typeof o=="function")try{o()}catch(r){ae(e,t,r)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(r){ae(e,t,r)}else a.current=null}function q0(e){var t=e.type,a=e.memoizedProps,o=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":a.autoFocus&&o.focus();break e;case"img":a.src?o.src=a.src:a.srcSet&&(o.srcset=a.srcSet)}}catch(r){ae(e,e.return,r)}}function Cg(e,t,a){try{var o=e.stateNode;zC(o,e.type,a,t),o[tt]=t}catch(r){ae(e,e.return,r)}}function H0(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27||e.tag===4}function Td(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||H0(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==27&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function hc(e,t,a){var o=e.tag;if(o===5||o===6)e=e.stateNode,t?a.nodeType===8?a.parentNode.insertBefore(e,t):a.insertBefore(e,t):(a.nodeType===8?(t=a.parentNode,t.insertBefore(e,a)):(t=a,t.appendChild(e)),a=a._reactRootContainer,a!=null||t.onclick!==null||(t.onclick=du));else if(o!==4&&o!==27&&(e=e.child,e!==null))for(hc(e,t,a),e=e.sibling;e!==null;)hc(e,t,a),e=e.sibling}function Hs(e,t,a){var o=e.tag;if(o===5||o===6)e=e.stateNode,t?a.insertBefore(e,t):a.appendChild(e);else if(o!==4&&o!==27&&(e=e.child,e!==null))for(Hs(e,t,a),e=e.sibling;e!==null;)Hs(e,t,a),e=e.sibling}var da=!1,ye=!1,Ad=!1,Ig=typeof WeakSet=="function"?WeakSet:Set,Pe=null,Tg=!1;function hC(e,t){if(e=e.containerInfo,Cc=Qs,e=Bx(e),qc(e)){if("selectionStart"in e)var a={start:e.selectionStart,end:e.selectionEnd};else e:{a=(a=e.ownerDocument)&&a.defaultView||window;var o=a.getSelection&&a.getSelection();if(o&&o.rangeCount!==0){a=o.anchorNode;var r=o.anchorOffset,i=o.focusNode;o=o.focusOffset;try{a.nodeType,i.nodeType}catch{a=null;break e}var n=0,l=-1,s=-1,u=0,f=0,c=e,d=null;t:for(;;){for(var h;c!==a||r!==0&&c.nodeType!==3||(l=n+r),c!==i||o!==0&&c.nodeType!==3||(s=n+o),c.nodeType===3&&(n+=c.nodeValue.length),(h=c.firstChild)!==null;)d=c,c=h;for(;;){if(c===e)break t;if(d===a&&++u===r&&(l=n),d===i&&++f===o&&(s=n),(h=c.nextSibling)!==null)break;c=d,d=c.parentNode}c=h}a=l===-1||s===-1?null:{start:l,end:s}}else a=null}a=a||{start:0,end:0}}else a=null;for(Ic={focusedElem:e,selectionRange:a},Qs=!1,Pe=t;Pe!==null;)if(t=Pe,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,Pe=e;else for(;Pe!==null;){switch(t=Pe,i=t.alternate,e=t.flags,t.tag){case 0:break;case 11:case 15:break;case 1:if((e&1024)!==0&&i!==null){e=void 0,a=t,r=i.memoizedProps,i=i.memoizedState,o=a.stateNode;try{var x=No(a.type,r,a.elementType===a.type);e=o.getSnapshotBeforeUpdate(x,i),o.__reactInternalSnapshotBeforeUpdate=e}catch(v){ae(a,a.return,v)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,a=e.nodeType,a===9)Ac(e);else if(a===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":Ac(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(C(163))}if(e=t.sibling,e!==null){e.return=t.return,Pe=e;break}Pe=t.return}return x=Tg,Tg=!1,x}function _0(e,t,a){var o=a.flags;switch(a.tag){case 0:case 11:case 15:ua(e,a),o&4&&Un(5,a);break;case 1:if(ua(e,a),o&4)if(e=a.stateNode,t===null)try{e.componentDidMount()}catch(l){ae(a,a.return,l)}else{var r=No(a.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(r,t,e.__reactInternalSnapshotBeforeUpdate)}catch(l){ae(a,a.return,l)}}o&64&&F0(a),o&512&&Ro(a,a.return);break;case 3:if(ua(e,a),o&64&&(o=a.updateQueue,o!==null)){if(e=null,a.child!==null)switch(a.child.tag){case 27:case 5:e=a.child.stateNode;break;case 1:e=a.child.stateNode}try{z0(o,e)}catch(l){ae(a,a.return,l)}}break;case 26:ua(e,a),o&512&&Ro(a,a.return);break;case 27:case 5:ua(e,a),t===null&&o&4&&q0(a),o&512&&Ro(a,a.return);break;case 12:ua(e,a);break;case 13:ua(e,a),o&4&&X0(e,a);break;case 22:if(r=a.memoizedState!==null||da,!r){t=t!==null&&t.memoizedState!==null||ye;var i=da,n=ye;da=r,(ye=t)&&!n?Fa(e,a,(a.subtreeFlags&8772)!==0):ua(e,a),da=i,ye=n}o&512&&(a.memoizedProps.mode==="manual"?Ro(a,a.return):st(a,a.return));break;default:ua(e,a)}}function N0(e){var t=e.alternate;t!==null&&(e.alternate=null,N0(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Pc(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Ce=null,nt=!1;function sa(e,t,a){for(a=a.child;a!==null;)G0(e,t,a),a=a.sibling}function G0(e,t,a){if(ut&&typeof ut.onCommitFiberUnmount=="function")try{ut.onCommitFiberUnmount(Bn,a)}catch{}switch(a.tag){case 26:ye||st(a,t),sa(e,t,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:ye||st(a,t);var o=Ce,r=nt;for(Ce=a.stateNode,sa(e,t,a),a=a.stateNode,t=a.attributes;t.length;)a.removeAttributeNode(t[0]);Pc(a),Ce=o,nt=r;break;case 5:ye||st(a,t);case 6:r=Ce;var i=nt;if(Ce=null,sa(e,t,a),Ce=r,nt=i,Ce!==null)if(nt)try{e=Ce,o=a.stateNode,e.nodeType===8?e.parentNode.removeChild(o):e.removeChild(o)}catch(n){ae(a,t,n)}else try{Ce.removeChild(a.stateNode)}catch(n){ae(a,t,n)}break;case 18:Ce!==null&&(nt?(t=Ce,a=a.stateNode,t.nodeType===8?zd(t.parentNode,a):t.nodeType===1&&zd(t,a),Mn(t)):zd(Ce,a.stateNode));break;case 4:o=Ce,r=nt,Ce=a.stateNode.containerInfo,nt=!0,sa(e,t,a),Ce=o,nt=r;break;case 0:case 11:case 14:case 15:ye||oo(2,a,t),ye||oo(4,a,t),sa(e,t,a);break;case 1:ye||(st(a,t),o=a.stateNode,typeof o.componentWillUnmount=="function"&&U0(a,t,o)),sa(e,t,a);break;case 21:sa(e,t,a);break;case 22:ye||st(a,t),ye=(o=ye)||a.memoizedState!==null,sa(e,t,a),ye=o;break;default:sa(e,t,a)}}function X0(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Mn(e)}catch(a){ae(t,t.return,a)}}function gC(e){switch(e.tag){case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Ig),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Ig),t;default:throw Error(C(435,e.tag))}}function kd(e,t){var a=gC(e);t.forEach(function(o){var r=DC.bind(null,e,o);a.has(o)||(a.add(o),o.then(r,r))})}function gt(e,t){var a=t.deletions;if(a!==null)for(var o=0;o<a.length;o++){var r=a[o],i=e,n=t,l=n;e:for(;l!==null;){switch(l.tag){case 27:case 5:Ce=l.stateNode,nt=!1;break e;case 3:Ce=l.stateNode.containerInfo,nt=!0;break e;case 4:Ce=l.stateNode.containerInfo,nt=!0;break e}l=l.return}if(Ce===null)throw Error(C(160));G0(i,n,r),Ce=null,nt=!1,i=r.alternate,i!==null&&(i.return=null),r.return=null}if(t.subtreeFlags&13878)for(t=t.child;t!==null;)j0(t,e),t=t.sibling}var Ot=null;function j0(e,t){var a=e.alternate,o=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:gt(t,e),xt(e),o&4&&(oo(3,e,e.return),Un(3,e),oo(5,e,e.return));break;case 1:gt(t,e),xt(e),o&512&&(ye||a===null||st(a,a.return)),o&64&&da&&(e=e.updateQueue,e!==null&&(o=e.callbacks,o!==null&&(a=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=a===null?o:a.concat(o))));break;case 26:var r=Ot;if(gt(t,e),xt(e),o&512&&(ye||a===null||st(a,a.return)),o&4){var i=a!==null?a.memoizedState:null;if(o=e.memoizedState,a===null)if(o===null)if(e.stateNode===null){e:{o=e.type,a=e.memoizedProps,r=r.ownerDocument||r;t:switch(o){case"title":i=r.getElementsByTagName("title")[0],(!i||i[xn]||i[Ne]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=r.createElement(o),r.head.insertBefore(i,r.querySelector("head > title"))),He(i,o,a),i[Ne]=e,Oe(i),o=i;break e;case"link":var n=Xg("link","href",r).get(o+(a.href||""));if(n){for(var l=0;l<n.length;l++)if(i=n[l],i.getAttribute("href")===(a.href==null?null:a.href)&&i.getAttribute("rel")===(a.rel==null?null:a.rel)&&i.getAttribute("title")===(a.title==null?null:a.title)&&i.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){n.splice(l,1);break t}}i=r.createElement(o),He(i,o,a),r.head.appendChild(i);break;case"meta":if(n=Xg("meta","content",r).get(o+(a.content||""))){for(l=0;l<n.length;l++)if(i=n[l],i.getAttribute("content")===(a.content==null?null:""+a.content)&&i.getAttribute("name")===(a.name==null?null:a.name)&&i.getAttribute("property")===(a.property==null?null:a.property)&&i.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&i.getAttribute("charset")===(a.charSet==null?null:a.charSet)){n.splice(l,1);break t}}i=r.createElement(o),He(i,o,a),r.head.appendChild(i);break;default:throw Error(C(468,o))}i[Ne]=e,Oe(i),o=i}e.stateNode=o}else jg(r,e.type,e.stateNode);else e.stateNode=Gg(r,o,e.memoizedProps);else i!==o?(i===null?a.stateNode!==null&&(a=a.stateNode,a.parentNode.removeChild(a)):i.count--,o===null?jg(r,e.type,e.stateNode):Gg(r,o,e.memoizedProps)):o===null&&e.stateNode!==null&&Cg(e,e.memoizedProps,a.memoizedProps)}break;case 27:if(o&4&&e.alternate===null){r=e.stateNode,i=e.memoizedProps;try{for(var s=r.firstChild;s;){var u=s.nextSibling,f=s.nodeName;s[xn]||f==="HEAD"||f==="BODY"||f==="SCRIPT"||f==="STYLE"||f==="LINK"&&s.rel.toLowerCase()==="stylesheet"||r.removeChild(s),s=u}for(var c=e.type,d=r.attributes;d.length;)r.removeAttributeNode(d[0]);He(r,c,i),r[Ne]=e,r[tt]=i}catch(x){ae(e,e.return,x)}}case 5:if(gt(t,e),xt(e),o&512&&(ye||a===null||st(a,a.return)),e.flags&32){r=e.stateNode;try{Kr(r,"")}catch(x){ae(e,e.return,x)}}o&4&&e.stateNode!=null&&(r=e.memoizedProps,Cg(e,r,a!==null?a.memoizedProps:r)),o&1024&&(Ad=!0);break;case 6:if(gt(t,e),xt(e),o&4){if(e.stateNode===null)throw Error(C(162));o=e.memoizedProps,a=e.stateNode;try{a.nodeValue=o}catch(x){ae(e,e.return,x)}}break;case 3:if(Ss=null,r=Ot,Ot=Ks(t.containerInfo),gt(t,e),Ot=r,xt(e),o&4&&a!==null&&a.memoizedState.isDehydrated)try{Mn(t.containerInfo)}catch(x){ae(e,e.return,x)}Ad&&(Ad=!1,Y0(e));break;case 4:o=Ot,Ot=Ks(e.stateNode.containerInfo),gt(t,e),xt(e),Ot=o;break;case 12:gt(t,e),xt(e);break;case 13:gt(t,e),xt(e),e.child.flags&8192&&e.memoizedState!==null!=(a!==null&&a.memoizedState!==null)&&(pp=Kt()),o&4&&(o=e.updateQueue,o!==null&&(e.updateQueue=null,kd(e,o)));break;case 22:if(o&512&&(ye||a===null||st(a,a.return)),s=e.memoizedState!==null,u=a!==null&&a.memoizedState!==null,f=da,c=ye,da=f||s,ye=c||u,gt(t,e),ye=c,da=f,xt(e),t=e.stateNode,t._current=e,t._visibility&=-3,t._visibility|=t._pendingVisibility&2,o&8192&&(t._visibility=s?t._visibility&-2:t._visibility|1,s&&(t=da||ye,a===null||u||t||Cr(e)),e.memoizedProps===null||e.memoizedProps.mode!=="manual"))e:for(a=null,t=e;;){if(t.tag===5||t.tag===26||t.tag===27){if(a===null){u=a=t;try{if(r=u.stateNode,s)i=r.style,typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none";else{n=u.stateNode,l=u.memoizedProps.style;var h=l!=null&&l.hasOwnProperty("display")?l.display:null;n.style.display=h==null||typeof h=="boolean"?"":(""+h).trim()}}catch(x){ae(u,u.return,x)}}}else if(t.tag===6){if(a===null){u=t;try{u.stateNode.nodeValue=s?"":u.memoizedProps}catch(x){ae(u,u.return,x)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;a===t&&(a=null),t=t.return}a===t&&(a=null),t.sibling.return=t.return,t=t.sibling}o&4&&(o=e.updateQueue,o!==null&&(a=o.retryQueue,a!==null&&(o.retryQueue=null,kd(e,a))));break;case 19:gt(t,e),xt(e),o&4&&(o=e.updateQueue,o!==null&&(e.updateQueue=null,kd(e,o)));break;case 21:break;default:gt(t,e),xt(e)}}function xt(e){var t=e.flags;if(t&2){try{if(e.tag!==27){e:{for(var a=e.return;a!==null;){if(H0(a)){var o=a;break e}a=a.return}throw Error(C(160))}switch(o.tag){case 27:var r=o.stateNode,i=Td(e);Hs(e,i,r);break;case 5:var n=o.stateNode;o.flags&32&&(Kr(n,""),o.flags&=-33);var l=Td(e);Hs(e,l,n);break;case 3:case 4:var s=o.stateNode.containerInfo,u=Td(e);hc(e,u,s);break;default:throw Error(C(161))}}}catch(f){ae(e,e.return,f)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Y0(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Y0(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function ua(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)_0(e,t.alternate,t),t=t.sibling}function Cr(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:oo(4,t,t.return),Cr(t);break;case 1:st(t,t.return);var a=t.stateNode;typeof a.componentWillUnmount=="function"&&U0(t,t.return,a),Cr(t);break;case 26:case 27:case 5:st(t,t.return),Cr(t);break;case 22:st(t,t.return),t.memoizedState===null&&Cr(t);break;default:Cr(t)}e=e.sibling}}function Fa(e,t,a){for(a=a&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var o=t.alternate,r=e,i=t,n=i.flags;switch(i.tag){case 0:case 11:case 15:Fa(r,i,a),Un(4,i);break;case 1:if(Fa(r,i,a),o=i,r=o.stateNode,typeof r.componentDidMount=="function")try{r.componentDidMount()}catch(u){ae(o,o.return,u)}if(o=i,r=o.updateQueue,r!==null){var l=o.stateNode;try{var s=r.shared.hiddenCallbacks;if(s!==null)for(r.shared.hiddenCallbacks=null,r=0;r<s.length;r++)V0(s[r],l)}catch(u){ae(o,o.return,u)}}a&&n&64&&F0(i),Ro(i,i.return);break;case 26:case 27:case 5:Fa(r,i,a),a&&o===null&&n&4&&q0(i),Ro(i,i.return);break;case 12:Fa(r,i,a);break;case 13:Fa(r,i,a),a&&n&4&&X0(r,i);break;case 22:i.memoizedState===null&&Fa(r,i,a),Ro(i,i.return);break;default:Fa(r,i,a)}t=t.sibling}}function sp(e,t){var a=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==a&&(e!=null&&e.refCount++,a!=null&&Vn(a))}function up(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Vn(e))}function za(e,t,a,o){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)K0(e,t,a,o),t=t.sibling}function K0(e,t,a,o){var r=t.flags;switch(t.tag){case 0:case 11:case 15:za(e,t,a,o),r&2048&&Un(9,t);break;case 3:za(e,t,a,o),r&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Vn(e)));break;case 12:if(r&2048){za(e,t,a,o),e=t.stateNode;try{var i=t.memoizedProps,n=i.id,l=i.onPostCommit;typeof l=="function"&&l(n,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(s){ae(t,t.return,s)}}else za(e,t,a,o);break;case 23:break;case 22:i=t.stateNode,t.memoizedState!==null?i._visibility&4?za(e,t,a,o):cn(e,t):i._visibility&4?za(e,t,a,o):(i._visibility|=4,Ir(e,t,a,o,(t.subtreeFlags&10256)!==0)),r&2048&&sp(t.alternate,t);break;case 24:za(e,t,a,o),r&2048&&up(t.alternate,t);break;default:za(e,t,a,o)}}function Ir(e,t,a,o,r){for(r=r&&(t.subtreeFlags&10256)!==0,t=t.child;t!==null;){var i=e,n=t,l=a,s=o,u=n.flags;switch(n.tag){case 0:case 11:case 15:Ir(i,n,l,s,r),Un(8,n);break;case 23:break;case 22:var f=n.stateNode;n.memoizedState!==null?f._visibility&4?Ir(i,n,l,s,r):cn(i,n):(f._visibility|=4,Ir(i,n,l,s,r)),r&&u&2048&&sp(n.alternate,n);break;case 24:Ir(i,n,l,s,r),r&&u&2048&&up(n.alternate,n);break;default:Ir(i,n,l,s,r)}t=t.sibling}}function cn(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var a=e,o=t,r=o.flags;switch(o.tag){case 22:cn(a,o),r&2048&&sp(o.alternate,o);break;case 24:cn(a,o),r&2048&&up(o.alternate,o);break;default:cn(a,o)}t=t.sibling}}var $i=8192;function br(e){if(e.subtreeFlags&$i)for(e=e.child;e!==null;)W0(e),e=e.sibling}function W0(e){switch(e.tag){case 26:br(e),e.flags&$i&&e.memoizedState!==null&&a1(Ot,e.memoizedState,e.memoizedProps);break;case 5:br(e);break;case 3:case 4:var t=Ot;Ot=Ks(e.stateNode.containerInfo),br(e),Ot=t;break;case 22:e.memoizedState===null&&(t=e.alternate,t!==null&&t.memoizedState!==null?(t=$i,$i=16777216,br(e),$i=t):br(e));break;default:br(e)}}function Z0(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Xi(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var a=0;a<t.length;a++){var o=t[a];Pe=o,J0(o,e)}Z0(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Q0(e),e=e.sibling}function Q0(e){switch(e.tag){case 0:case 11:case 15:Xi(e),e.flags&2048&&oo(9,e,e.return);break;case 3:Xi(e);break;case 12:Xi(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&4&&(e.return===null||e.return.tag!==13)?(t._visibility&=-5,Ls(e)):Xi(e);break;default:Xi(e)}}function Ls(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var a=0;a<t.length;a++){var o=t[a];Pe=o,J0(o,e)}Z0(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:oo(8,t,t.return),Ls(t);break;case 22:a=t.stateNode,a._visibility&4&&(a._visibility&=-5,Ls(t));break;default:Ls(t)}e=e.sibling}}function J0(e,t){for(;Pe!==null;){var a=Pe;switch(a.tag){case 0:case 11:case 15:oo(8,a,t);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var o=a.memoizedState.cachePool.pool;o!=null&&o.refCount++}break;case 24:Vn(a.memoizedState.cache)}if(o=a.child,o!==null)o.return=a,Pe=o;else e:for(a=e;Pe!==null;){o=Pe;var r=o.sibling,i=o.return;if(N0(o),o===a){Pe=null;break e}if(r!==null){r.return=i,Pe=r;break e}Pe=i}}}function xC(e,t,a,o){this.tag=e,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=o,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ct(e,t,a,o){return new xC(e,t,a,o)}function fp(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Za(e,t){var a=e.alternate;return a===null?(a=Ct(e.tag,t,e.key,e.mode),a.elementType=e.elementType,a.type=e.type,a.stateNode=e.stateNode,a.alternate=e,e.alternate=a):(a.pendingProps=t,a.type=e.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=e.flags&31457280,a.childLanes=e.childLanes,a.lanes=e.lanes,a.child=e.child,a.memoizedProps=e.memoizedProps,a.memoizedState=e.memoizedState,a.updateQueue=e.updateQueue,t=e.dependencies,a.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},a.sibling=e.sibling,a.index=e.index,a.ref=e.ref,a.refCleanup=e.refCleanup,a}function $0(e,t){e.flags&=31457282;var a=e.alternate;return a===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=a.childLanes,e.lanes=a.lanes,e.child=a.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=a.memoizedProps,e.memoizedState=a.memoizedState,e.updateQueue=a.updateQueue,e.type=a.type,t=a.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function ws(e,t,a,o,r,i){var n=0;if(o=e,typeof e=="function")fp(e)&&(n=1);else if(typeof e=="string")n=e1(e,a,Yt.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case Ar:return zo(a.children,r,i,t);case ex:n=8,r|=24;break;case Fd:return e=Ct(12,a,t,r|2),e.elementType=Fd,e.lanes=i,e;case Ud:return e=Ct(13,a,t,r),e.elementType=Ud,e.lanes=i,e;case qd:return e=Ct(19,a,t,r),e.elementType=qd,e.lanes=i,e;case ax:return ey(a,r,i,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case _b:case ma:n=10;break e;case tx:n=9;break e;case Bc:n=11;break e;case Ec:n=14;break e;case Ua:n=16,o=null;break e}n=29,a=Error(C(130,e===null?"null":typeof e,"")),o=null}return t=Ct(n,a,t,r),t.elementType=e,t.type=o,t.lanes=i,t}function zo(e,t,a,o){return e=Ct(7,e,o,t),e.lanes=a,e}function ey(e,t,a,o){e=Ct(22,e,o,t),e.elementType=ax,e.lanes=a;var r={_visibility:1,_pendingVisibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null,_current:null,detach:function(){var i=r._current;if(i===null)throw Error(C(456));if((r._pendingVisibility&2)===0){var n=to(i,2);n!==null&&(r._pendingVisibility|=2,Ze(n,i,2))}},attach:function(){var i=r._current;if(i===null)throw Error(C(456));if((r._pendingVisibility&2)!==0){var n=to(i,2);n!==null&&(r._pendingVisibility&=-3,Ze(n,i,2))}}};return e.stateNode=r,e}function Dd(e,t,a){return e=Ct(6,e,null,t),e.lanes=a,e}function Md(e,t,a){return t=Ct(4,e.children!==null?e.children:[],e.key,t),t.lanes=a,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function fa(e){e.flags|=4}function Ag(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!wy(t)){if(t=Tt.current,t!==null&&((j&4194176)===j?Wt!==null:(j&62914560)!==j&&(j&536870912)===0||t!==Wt))throw rn=$d,qx;e.flags|=8192}}function ns(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?ux():536870912,e.lanes|=t,Jr|=t)}function ji(e,t){if(!K)switch(e.tailMode){case"hidden":t=e.tail;for(var a=null;t!==null;)t.alternate!==null&&(a=t),t=t.sibling;a===null?e.tail=null:a.sibling=null;break;case"collapsed":a=e.tail;for(var o=null;a!==null;)a.alternate!==null&&(o=a),a=a.sibling;o===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:o.sibling=null}}function ce(e){var t=e.alternate!==null&&e.alternate.child===e.child,a=0,o=0;if(t)for(var r=e.child;r!==null;)a|=r.lanes|r.childLanes,o|=r.subtreeFlags&31457280,o|=r.flags&31457280,r.return=e,r=r.sibling;else for(r=e.child;r!==null;)a|=r.lanes|r.childLanes,o|=r.subtreeFlags,o|=r.flags,r.return=e,r=r.sibling;return e.subtreeFlags|=o,e.childLanes=a,t}function yC(e,t,a){var o=t.pendingProps;switch(Gc(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ce(t),null;case 1:return ce(t),null;case 3:return a=t.stateNode,o=null,e!==null&&(o=e.memoizedState.cache),t.memoizedState.cache!==o&&(t.flags|=2048),va(ke),jr(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(e===null||e.child===null)&&(Ni(t)?fa(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Vt!==null&&(Lc(Vt),Vt=null))),ce(t),null;case 26:return a=t.memoizedState,e===null?(fa(t),a!==null?(ce(t),Ag(t,a)):(ce(t),t.flags&=-16777217)):a?a!==e.memoizedState?(fa(t),ce(t),Ag(t,a)):(ce(t),t.flags&=-16777217):(e.memoizedProps!==o&&fa(t),ce(t),t.flags&=-16777217),null;case 27:As(t),a=Ya.current;var r=t.type;if(e!==null&&t.stateNode!=null)e.memoizedProps!==o&&fa(t);else{if(!o){if(t.stateNode===null)throw Error(C(166));return ce(t),null}e=Yt.current,Ni(t)?og(t,e):(e=yy(r,o,a),t.stateNode=e,fa(t))}return ce(t),null;case 5:if(As(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==o&&fa(t);else{if(!o){if(t.stateNode===null)throw Error(C(166));return ce(t),null}if(e=Yt.current,Ni(t))og(t,e);else{switch(r=Ys(Ya.current),e){case 1:e=r.createElementNS("http://www.w3.org/2000/svg",a);break;case 2:e=r.createElementNS("http://www.w3.org/1998/Math/MathML",a);break;default:switch(a){case"svg":e=r.createElementNS("http://www.w3.org/2000/svg",a);break;case"math":e=r.createElementNS("http://www.w3.org/1998/Math/MathML",a);break;case"script":e=r.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild);break;case"select":e=typeof o.is=="string"?r.createElement("select",{is:o.is}):r.createElement("select"),o.multiple?e.multiple=!0:o.size&&(e.size=o.size);break;default:e=typeof o.is=="string"?r.createElement(a,{is:o.is}):r.createElement(a)}}e[Ne]=t,e[tt]=o;e:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)e.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break e;for(;r.sibling===null;){if(r.return===null||r.return===t)break e;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=e;e:switch(He(e,a,o),a){case"button":case"input":case"select":case"textarea":e=!!o.autoFocus;break e;case"img":e=!0;break e;default:e=!1}e&&fa(t)}}return ce(t),t.flags&=-16777217,null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==o&&fa(t);else{if(typeof o!="string"&&t.stateNode===null)throw Error(C(166));if(e=Ya.current,Ni(t)){if(e=t.stateNode,a=t.memoizedProps,o=null,r=We,r!==null)switch(r.tag){case 27:case 5:o=r.memoizedProps}e[Ne]=t,e=!!(e.nodeValue===a||o!==null&&o.suppressHydrationWarning===!0||hy(e.nodeValue,a)),e||qo(t)}else e=Ys(e).createTextNode(o),e[Ne]=t,t.stateNode=e}return ce(t),null;case 13:if(o=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(r=Ni(t),o!==null&&o.dehydrated!==null){if(e===null){if(!r)throw Error(C(318));if(r=t.memoizedState,r=r!==null?r.dehydrated:null,!r)throw Error(C(317));r[Ne]=t}else On(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;ce(t),r=!1}else Vt!==null&&(Lc(Vt),Vt=null),r=!0;if(!r)return t.flags&256?(xa(t),t):(xa(t),null)}if(xa(t),(t.flags&128)!==0)return t.lanes=a,t;if(a=o!==null,e=e!==null&&e.memoizedState!==null,a){o=t.child,r=null,o.alternate!==null&&o.alternate.memoizedState!==null&&o.alternate.memoizedState.cachePool!==null&&(r=o.alternate.memoizedState.cachePool.pool);var i=null;o.memoizedState!==null&&o.memoizedState.cachePool!==null&&(i=o.memoizedState.cachePool.pool),i!==r&&(o.flags|=2048)}return a!==e&&a&&(t.child.flags|=8192),ns(t,t.updateQueue),ce(t),null;case 4:return jr(),e===null&&gp(t.stateNode.containerInfo),ce(t),null;case 10:return va(t.type),ce(t),null;case 19:if(ze(De),r=t.memoizedState,r===null)return ce(t),null;if(o=(t.flags&128)!==0,i=r.rendering,i===null)if(o)ji(r,!1);else{if(ve!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(i=Os(e),i!==null){for(t.flags|=128,ji(r,!1),e=i.updateQueue,t.updateQueue=e,ns(t,e),t.subtreeFlags=0,e=a,a=t.child;a!==null;)$0(a,e),a=a.sibling;return se(De,De.current&1|2),t.child}e=e.sibling}r.tail!==null&&Kt()>_s&&(t.flags|=128,o=!0,ji(r,!1),t.lanes=4194304)}else{if(!o)if(e=Os(i),e!==null){if(t.flags|=128,o=!0,e=e.updateQueue,t.updateQueue=e,ns(t,e),ji(r,!0),r.tail===null&&r.tailMode==="hidden"&&!i.alternate&&!K)return ce(t),null}else 2*Kt()-r.renderingStartTime>_s&&a!==536870912&&(t.flags|=128,o=!0,ji(r,!1),t.lanes=4194304);r.isBackwards?(i.sibling=t.child,t.child=i):(e=r.last,e!==null?e.sibling=i:t.child=i,r.last=i)}return r.tail!==null?(t=r.tail,r.rendering=t,r.tail=t.sibling,r.renderingStartTime=Kt(),t.sibling=null,e=De.current,se(De,o?e&1|2:e&1),t):(ce(t),null);case 22:case 23:return xa(t),Xc(),o=t.memoizedState!==null,e!==null?e.memoizedState!==null!==o&&(t.flags|=8192):o&&(t.flags|=8192),o?(a&536870912)!==0&&(t.flags&128)===0&&(ce(t),t.subtreeFlags&6&&(t.flags|=8192)):ce(t),a=t.updateQueue,a!==null&&ns(t,a.retryQueue),a=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),o=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(o=t.memoizedState.cachePool.pool),o!==a&&(t.flags|=2048),e!==null&&ze(Vo),null;case 24:return a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),va(ke),ce(t),null;case 25:return null}throw Error(C(156,t.tag))}function vC(e,t){switch(Gc(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return va(ke),jr(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return As(t),null;case 13:if(xa(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(C(340));On()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return ze(De),null;case 4:return jr(),null;case 10:return va(t.type),null;case 22:case 23:return xa(t),Xc(),e!==null&&ze(Vo),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return va(ke),null;case 25:return null;default:return null}}function ty(e,t){switch(Gc(t),t.tag){case 3:va(ke),jr();break;case 26:case 27:case 5:As(t);break;case 4:jr();break;case 13:xa(t);break;case 19:ze(De);break;case 10:va(t.type);break;case 22:case 23:xa(t),Xc(),e!==null&&ze(Vo);break;case 24:va(ke)}}var LC={getCacheForType:function(e){var t=Ge(ke),a=t.data.get(e);return a===void 0&&(a=e(),t.data.set(e,a)),a}},wC=typeof WeakMap=="function"?WeakMap:Map,pe=0,re=null,N=null,j=0,oe=0,lt=null,ca=!1,ri=!1,dp=!1,Sa=0,ve=0,ro=0,Fo=0,cp=0,It=0,Jr=0,pn=null,jt=null,gc=!1,pp=0,_s=1/0,Ns=null,Qa=null,ls=!1,Bo=null,mn=0,xc=0,yc=null,hn=0,vc=null;function dt(){if((pe&2)!==0&&j!==0)return j&-j;if(P.T!==null){var e=Zr;return e!==0?e:hp()}return px()}function ay(){It===0&&(It=(j&536870912)===0||K?sx():536870912);var e=Tt.current;return e!==null&&(e.flags|=32),It}function Ze(e,t,a){(e===re&&oe===2||e.cancelPendingCommit!==null)&&($r(e,0),pa(e,j,It,!1)),Rn(e,a),((pe&2)===0||e!==re)&&(e===re&&((pe&2)===0&&(Fo|=a),ve===4&&pa(e,j,It,!1)),Jt(e))}function oy(e,t,a){if((pe&6)!==0)throw Error(C(327));var o=!a&&(t&60)===0&&(t&e.expiredLanes)===0||En(e,t),r=o?CC(e,t):Bd(e,t,!0),i=o;do{if(r===0){ri&&!o&&pa(e,t,0,!1);break}else if(r===6)pa(e,t,0,!ca);else{if(a=e.current.alternate,i&&!bC(a)){r=Bd(e,t,!1),i=!1;continue}if(r===2){if(i=t,e.errorRecoveryDisabledLanes&i)var n=0;else n=e.pendingLanes&-536870913,n=n!==0?n:n&536870912?536870912:0;if(n!==0){t=n;e:{var l=e;r=pn;var s=l.current.memoizedState.isDehydrated;if(s&&($r(l,n).flags|=256),n=Bd(l,n,!1),n!==2){if(dp&&!s){l.errorRecoveryDisabledLanes|=i,Fo|=i,r=4;break e}i=jt,jt=r,i!==null&&Lc(i)}r=n}if(i=!1,r!==2)continue}}if(r===1){$r(e,0),pa(e,t,0,!0);break}e:{switch(o=e,r){case 0:case 1:throw Error(C(345));case 4:if((t&4194176)===t){pa(o,t,It,!ca);break e}break;case 2:jt=null;break;case 3:case 5:break;default:throw Error(C(329))}if(o.finishedWork=a,o.finishedLanes=t,(t&62914560)===t&&(i=pp+300-Kt(),10<i)){if(pa(o,t,It,!ca),$s(o,0)!==0)break e;o.timeoutHandle=xy(kg.bind(null,o,a,jt,Ns,gc,t,It,Fo,Jr,ca,2,-0,0),i);break e}kg(o,a,jt,Ns,gc,t,It,Fo,Jr,ca,0,-0,0)}}break}while(!0);Jt(e)}function Lc(e){jt===null?jt=e:jt.push.apply(jt,e)}function kg(e,t,a,o,r,i,n,l,s,u,f,c,d){var h=t.subtreeFlags;if((h&8192||(h&16785408)===16785408)&&(Tn={stylesheets:null,count:0,unsuspend:t1},W0(t),t=o1(),t!==null)){e.cancelPendingCommit=t(Mg.bind(null,e,a,o,r,n,l,s,1,c,d)),pa(e,i,n,!u);return}Mg(e,a,o,r,n,l,s,f,c,d)}function bC(e){for(var t=e;;){var a=t.tag;if((a===0||a===11||a===15)&&t.flags&16384&&(a=t.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var o=0;o<a.length;o++){var r=a[o],i=r.getSnapshot;r=r.value;try{if(!ct(i(),r))return!1}catch{return!1}}if(a=t.child,t.subtreeFlags&16384&&a!==null)a.return=t,t=a;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function pa(e,t,a,o){t&=~cp,t&=~Fo,e.suspendedLanes|=t,e.pingedLanes&=~t,o&&(e.warmLanes|=t),o=e.expirationTimes;for(var r=t;0<r;){var i=31-ft(r),n=1<<i;o[i]=-1,r&=~n}a!==0&&fx(e,a,t)}function uu(){return(pe&6)===0?(qn(0,!1),!1):!0}function mp(){if(N!==null){if(oe===0)var e=N.return;else e=N,ya=Zo=null,Jc(e),Hr=null,bn=0,e=N;for(;e!==null;)ty(e.alternate,e),e=e.return;N=null}}function $r(e,t){e.finishedWork=null,e.finishedLanes=0;var a=e.timeoutHandle;a!==-1&&(e.timeoutHandle=-1,UC(a)),a=e.cancelPendingCommit,a!==null&&(e.cancelPendingCommit=null,a()),mp(),re=e,N=a=Za(e.current,null),j=t,oe=0,lt=null,ca=!1,ri=En(e,t),dp=!1,Jr=It=cp=Fo=ro=ve=0,jt=pn=null,gc=!1,(t&8)!==0&&(t|=t&32);var o=e.entangledLanes;if(o!==0)for(e=e.entanglements,o&=t;0<o;){var r=31-ft(o),i=1<<r;t|=e[r],o&=~i}return Sa=t,ou(),a}function ry(e,t){U=null,P.H=Zt,t===on?(t=ng(),oe=3):t===qx?(t=ng(),oe=4):oe=t===D0?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,lt=t,N===null&&(ve=1,Us(e,St(t,e.current)))}function iy(){var e=P.H;return P.H=Zt,e===null?Zt:e}function ny(){var e=P.A;return P.A=LC,e}function wc(){ve=4,ca||(j&4194176)!==j&&Tt.current!==null||(ri=!0),(ro&134217727)===0&&(Fo&134217727)===0||re===null||pa(re,j,It,!1)}function Bd(e,t,a){var o=pe;pe|=2;var r=iy(),i=ny();(re!==e||j!==t)&&(Ns=null,$r(e,t)),t=!1;var n=ve;e:do try{if(oe!==0&&N!==null){var l=N,s=lt;switch(oe){case 8:mp(),n=6;break e;case 3:case 2:case 6:Tt.current===null&&(t=!0);var u=oe;if(oe=0,lt=null,zr(e,l,s,u),a&&ri){n=0;break e}break;default:u=oe,oe=0,lt=null,zr(e,l,s,u)}}SC(),n=ve;break}catch(f){ry(e,f)}while(!0);return t&&e.shellSuspendCounter++,ya=Zo=null,pe=o,P.H=r,P.A=i,N===null&&(re=null,j=0,ou()),n}function SC(){for(;N!==null;)ly(N)}function CC(e,t){var a=pe;pe|=2;var o=iy(),r=ny();re!==e||j!==t?(Ns=null,_s=Kt()+500,$r(e,t)):ri=En(e,t);e:do try{if(oe!==0&&N!==null){t=N;var i=lt;t:switch(oe){case 1:oe=0,lt=null,zr(e,t,i,1);break;case 2:if(ig(i)){oe=0,lt=null,Dg(t);break}t=function(){oe===2&&re===e&&(oe=7),Jt(e)},i.then(t,t);break e;case 3:oe=7;break e;case 4:oe=5;break e;case 7:ig(i)?(oe=0,lt=null,Dg(t)):(oe=0,lt=null,zr(e,t,i,7));break;case 5:var n=null;switch(N.tag){case 26:n=N.memoizedState;case 5:case 27:var l=N;if(!n||wy(n)){oe=0,lt=null;var s=l.sibling;if(s!==null)N=s;else{var u=l.return;u!==null?(N=u,fu(u)):N=null}break t}}oe=0,lt=null,zr(e,t,i,5);break;case 6:oe=0,lt=null,zr(e,t,i,6);break;case 8:mp(),ve=6;break e;default:throw Error(C(462))}}IC();break}catch(f){ry(e,f)}while(!0);return ya=Zo=null,P.H=o,P.A=r,pe=a,N!==null?0:(re=null,j=0,ou(),ve)}function IC(){for(;N!==null&&!Yb();)ly(N)}function ly(e){var t=P0(e.alternate,e,Sa);e.memoizedProps=e.pendingProps,t===null?fu(e):N=t}function Dg(e){var t=e,a=t.alternate;switch(t.tag){case 15:case 0:t=Lg(a,t,t.pendingProps,t.type,void 0,j);break;case 11:t=Lg(a,t,t.pendingProps,t.type.render,t.ref,j);break;case 5:Jc(t);default:ty(a,t),t=N=$0(t,Sa),t=P0(a,t,Sa)}e.memoizedProps=e.pendingProps,t===null?fu(e):N=t}function zr(e,t,a,o){ya=Zo=null,Jc(t),Hr=null,bn=0;var r=t.return;try{if(pC(e,r,t,a,j)){ve=1,Us(e,St(a,e.current)),N=null;return}}catch(i){if(r!==null)throw N=r,i;ve=1,Us(e,St(a,e.current)),N=null;return}t.flags&32768?(K||o===1?e=!0:ri||(j&536870912)!==0?e=!1:(ca=e=!0,(o===2||o===3||o===6)&&(o=Tt.current,o!==null&&o.tag===13&&(o.flags|=16384))),sy(t,e)):fu(t)}function fu(e){var t=e;do{if((t.flags&32768)!==0){sy(t,ca);return}e=t.return;var a=yC(t.alternate,t,Sa);if(a!==null){N=a;return}if(t=t.sibling,t!==null){N=t;return}N=t=e}while(t!==null);ve===0&&(ve=5)}function sy(e,t){do{var a=vC(e.alternate,e);if(a!==null){a.flags&=32767,N=a;return}if(a=e.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!t&&(e=e.sibling,e!==null)){N=e;return}N=e=a}while(e!==null);ve=6,N=null}function Mg(e,t,a,o,r,i,n,l,s,u){var f=P.T,c=ie.p;try{ie.p=2,P.T=null,TC(e,t,a,o,c,r,i,n,l,s,u)}finally{P.T=f,ie.p=c}}function TC(e,t,a,o,r,i,n,l){do Xr();while(Bo!==null);if((pe&6)!==0)throw Error(C(327));var s=e.finishedWork;if(o=e.finishedLanes,s===null)return null;if(e.finishedWork=null,e.finishedLanes=0,s===e.current)throw Error(C(177));e.callbackNode=null,e.callbackPriority=0,e.cancelPendingCommit=null;var u=s.lanes|s.childLanes;if(u|=Hc,rS(e,o,u,i,n,l),e===re&&(N=re=null,j=0),(s.subtreeFlags&10256)===0&&(s.flags&10256)===0||ls||(ls=!0,xc=u,yc=a,MC(ks,function(){return Xr(!0),null})),a=(s.flags&15990)!==0,(s.subtreeFlags&15990)!==0||a?(a=P.T,P.T=null,i=ie.p,ie.p=2,n=pe,pe|=4,hC(e,s),j0(s,e),ZS(Ic,e.containerInfo),Qs=!!Cc,Ic=Cc=null,e.current=s,_0(e,s.alternate,s),Kb(),pe=n,ie.p=i,P.T=a):e.current=s,ls?(ls=!1,Bo=e,mn=o):uy(e,u),u=e.pendingLanes,u===0&&(Qa=null),$b(s.stateNode,r),Jt(e),t!==null)for(r=e.onRecoverableError,s=0;s<t.length;s++)u=t[s],r(u.value,{componentStack:u.stack});return(mn&3)!==0&&Xr(),u=e.pendingLanes,(o&4194218)!==0&&(u&42)!==0?e===vc?hn++:(hn=0,vc=e):hn=0,qn(0,!1),null}function uy(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Vn(t)))}function Xr(){if(Bo!==null){var e=Bo,t=xc;xc=0;var a=cx(mn),o=P.T,r=ie.p;try{if(ie.p=32>a?32:a,P.T=null,Bo===null)var i=!1;else{a=yc,yc=null;var n=Bo,l=mn;if(Bo=null,mn=0,(pe&6)!==0)throw Error(C(331));var s=pe;if(pe|=4,Q0(n.current),K0(n,n.current,l,a),pe=s,qn(0,!1),ut&&typeof ut.onPostCommitFiberRoot=="function")try{ut.onPostCommitFiberRoot(Bn,n)}catch{}i=!0}return i}finally{ie.p=r,P.T=o,uy(e,t)}}return!1}function Bg(e,t,a){t=St(a,t),t=nc(e.stateNode,t,2),e=Wa(e,t,2),e!==null&&(Rn(e,2),Jt(e))}function ae(e,t,a){if(e.tag===3)Bg(e,e,a);else for(;t!==null;){if(t.tag===3){Bg(t,e,a);break}else if(t.tag===1){var o=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof o.componentDidCatch=="function"&&(Qa===null||!Qa.has(o))){e=St(a,e),a=A0(2),o=Wa(t,a,2),o!==null&&(k0(a,o,t,e),Rn(o,2),Jt(o));break}}t=t.return}}function Ed(e,t,a){var o=e.pingCache;if(o===null){o=e.pingCache=new wC;var r=new Set;o.set(t,r)}else r=o.get(t),r===void 0&&(r=new Set,o.set(t,r));r.has(a)||(dp=!0,r.add(a),e=AC.bind(null,e,t,a),t.then(e,e))}function AC(e,t,a){var o=e.pingCache;o!==null&&o.delete(t),e.pingedLanes|=e.suspendedLanes&a,e.warmLanes&=~a,re===e&&(j&a)===a&&(ve===4||ve===3&&(j&62914560)===j&&300>Kt()-pp?(pe&2)===0&&$r(e,0):cp|=a,Jr===j&&(Jr=0)),Jt(e)}function fy(e,t){t===0&&(t=ux()),e=to(e,t),e!==null&&(Rn(e,t),Jt(e))}function kC(e){var t=e.memoizedState,a=0;t!==null&&(a=t.retryLane),fy(e,a)}function DC(e,t){var a=0;switch(e.tag){case 13:var o=e.stateNode,r=e.memoizedState;r!==null&&(a=r.retryLane);break;case 19:o=e.stateNode;break;case 22:o=e.stateNode._retryCache;break;default:throw Error(C(314))}o!==null&&o.delete(t),fy(e,a)}function MC(e,t){return Rc(e,t)}var Gs=null,Tr=null,bc=!1,Xs=!1,Rd=!1,Uo=0;function Jt(e){e!==Tr&&e.next===null&&(Tr===null?Gs=Tr=e:Tr=Tr.next=e),Xs=!0,bc||(bc=!0,EC(BC))}function qn(e,t){if(!Rd&&Xs){Rd=!0;do for(var a=!1,o=Gs;o!==null;){if(!t)if(e!==0){var r=o.pendingLanes;if(r===0)var i=0;else{var n=o.suspendedLanes,l=o.pingedLanes;i=(1<<31-ft(42|e)+1)-1,i&=r&~(n&~l),i=i&201326677?i&201326677|1:i?i|2:0}i!==0&&(a=!0,Eg(o,i))}else i=j,i=$s(o,o===re?i:0),(i&3)===0||En(o,i)||(a=!0,Eg(o,i));o=o.next}while(a);Rd=!1}}function BC(){Xs=bc=!1;var e=0;Uo!==0&&(FC()&&(e=Uo),Uo=0);for(var t=Kt(),a=null,o=Gs;o!==null;){var r=o.next,i=dy(o,t);i===0?(o.next=null,a===null?Gs=r:a.next=r,r===null&&(Tr=a)):(a=o,(e!==0||(i&3)!==0)&&(Xs=!0)),o=r}qn(e,!1)}function dy(e,t){for(var a=e.suspendedLanes,o=e.pingedLanes,r=e.expirationTimes,i=e.pendingLanes&-62914561;0<i;){var n=31-ft(i),l=1<<n,s=r[n];s===-1?((l&a)===0||(l&o)!==0)&&(r[n]=oS(l,t)):s<=t&&(e.expiredLanes|=l),i&=~l}if(t=re,a=j,a=$s(e,e===t?a:0),o=e.callbackNode,a===0||e===t&&oe===2||e.cancelPendingCommit!==null)return o!==null&&o!==null&&fd(o),e.callbackNode=null,e.callbackPriority=0;if((a&3)===0||En(e,a)){if(t=a&-a,t===e.callbackPriority)return t;switch(o!==null&&fd(o),cx(a)){case 2:case 8:a=nx;break;case 32:a=ks;break;case 268435456:a=lx;break;default:a=ks}return o=cy.bind(null,e),a=Rc(a,o),e.callbackPriority=t,e.callbackNode=a,t}return o!==null&&o!==null&&fd(o),e.callbackPriority=2,e.callbackNode=null,2}function cy(e,t){var a=e.callbackNode;if(Xr()&&e.callbackNode!==a)return null;var o=j;return o=$s(e,e===re?o:0),o===0?null:(oy(e,o,t),dy(e,Kt()),e.callbackNode!=null&&e.callbackNode===a?cy.bind(null,e):null)}function Eg(e,t){if(Xr())return null;oy(e,t,!0)}function EC(e){qC(function(){(pe&6)!==0?Rc(ix,e):e()})}function hp(){return Uo===0&&(Uo=sx()),Uo}function Rg(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:ms(""+e)}function Pg(e,t){var a=t.ownerDocument.createElement("input");return a.name=t.name,a.value=t.value,e.id&&a.setAttribute("form",e.id),t.parentNode.insertBefore(a,t),e=new FormData(e),a.parentNode.removeChild(a),e}function RC(e,t,a,o,r){if(t==="submit"&&a&&a.stateNode===r){var i=Rg((r[tt]||null).action),n=o.submitter;n&&(t=(t=n[tt]||null)?Rg(t.formAction):n.getAttribute("formAction"),t!==null&&(i=t,n=null));var l=new eu("action","action",null,o,r);e.push({event:l,listeners:[{instance:null,listener:function(){if(o.defaultPrevented){if(Uo!==0){var s=n?Pg(r,n):new FormData(r);rc(a,{pending:!0,data:s,method:r.method,action:i},null,s)}}else typeof i=="function"&&(l.preventDefault(),s=n?Pg(r,n):new FormData(r),rc(a,{pending:!0,data:s,method:r.method,action:i},i,s))},currentTarget:r}]})}}for(ss=0;ss<tg.length;ss++)us=tg[ss],Og=us.toLowerCase(),Vg=us[0].toUpperCase()+us.slice(1),Ft(Og,"on"+Vg);var us,Og,Vg,ss;Ft(Rx,"onAnimationEnd");Ft(Px,"onAnimationIteration");Ft(Ox,"onAnimationStart");Ft("dblclick","onDoubleClick");Ft("focusin","onFocus");Ft("focusout","onBlur");Ft(JS,"onTransitionRun");Ft($S,"onTransitionStart");Ft(eC,"onTransitionCancel");Ft(Vx,"onTransitionEnd");Yr("onMouseEnter",["mouseout","mouseover"]);Yr("onMouseLeave",["mouseout","mouseover"]);Yr("onPointerEnter",["pointerout","pointerover"]);Yr("onPointerLeave",["pointerout","pointerover"]);Xo("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Xo("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Xo("onBeforeInput",["compositionend","keypress","textInput","paste"]);Xo("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Xo("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Xo("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Cn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),PC=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Cn));function py(e,t){t=(t&4)!==0;for(var a=0;a<e.length;a++){var o=e[a],r=o.event;o=o.listeners;e:{var i=void 0;if(t)for(var n=o.length-1;0<=n;n--){var l=o[n],s=l.instance,u=l.currentTarget;if(l=l.listener,s!==i&&r.isPropagationStopped())break e;i=l,r.currentTarget=u;try{i(r)}catch(f){Fs(f)}r.currentTarget=null,i=s}else for(n=0;n<o.length;n++){if(l=o[n],s=l.instance,u=l.currentTarget,l=l.listener,s!==i&&r.isPropagationStopped())break e;i=l,r.currentTarget=u;try{i(r)}catch(f){Fs(f)}r.currentTarget=null,i=s}}}}function X(e,t){var a=t[Xd];a===void 0&&(a=t[Xd]=new Set);var o=e+"__bubble";a.has(o)||(my(t,e,2,!1),a.add(o))}function Pd(e,t,a){var o=0;t&&(o|=4),my(a,e,o,t)}var fs="_reactListening"+Math.random().toString(36).slice(2);function gp(e){if(!e[fs]){e[fs]=!0,mx.forEach(function(a){a!=="selectionchange"&&(PC.has(a)||Pd(a,!1,e),Pd(a,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[fs]||(t[fs]=!0,Pd("selectionchange",!1,t))}}function my(e,t,a,o){switch(Ty(t)){case 2:var r=n1;break;case 8:r=l1;break;default:r=Lp}a=r.bind(null,t,a,e),r=void 0,!Wd||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(r=!0),o?r!==void 0?e.addEventListener(t,a,{capture:!0,passive:r}):e.addEventListener(t,a,!0):r!==void 0?e.addEventListener(t,a,{passive:r}):e.addEventListener(t,a,!1)}function Od(e,t,a,o,r){var i=o;if((t&1)===0&&(t&2)===0&&o!==null)e:for(;;){if(o===null)return;var n=o.tag;if(n===3||n===4){var l=o.stateNode.containerInfo;if(l===r||l.nodeType===8&&l.parentNode===r)break;if(n===4)for(n=o.return;n!==null;){var s=n.tag;if((s===3||s===4)&&(s=n.stateNode.containerInfo,s===r||s.nodeType===8&&s.parentNode===r))return;n=n.return}for(;l!==null;){if(n=Eo(l),n===null)return;if(s=n.tag,s===5||s===6||s===26||s===27){o=i=n;continue e}l=l.parentNode}}o=o.return}bx(function(){var u=i,f=Vc(a),c=[];e:{var d=zx.get(e);if(d!==void 0){var h=eu,x=e;switch(e){case"keypress":if(gs(a)===0)break e;case"keydown":case"keyup":h=DS;break;case"focusin":x="focus",h=hd;break;case"focusout":x="blur",h=hd;break;case"beforeblur":case"afterblur":h=hd;break;case"click":if(a.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":h=Gh;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":h=xS;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":h=ES;break;case Rx:case Px:case Ox:h=LS;break;case Vx:h=PS;break;case"scroll":case"scrollend":h=hS;break;case"wheel":h=VS;break;case"copy":case"cut":case"paste":h=bS;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":h=jh;break;case"toggle":case"beforetoggle":h=FS}var v=(t&4)!==0,b=!v&&(e==="scroll"||e==="scrollend"),m=v?d!==null?d+"Capture":null:d;v=[];for(var p=u,g;p!==null;){var y=p;if(g=y.stateNode,y=y.tag,y!==5&&y!==26&&y!==27||g===null||m===null||(y=yn(p,m),y!=null&&v.push(In(p,y,g))),b)break;p=p.return}0<v.length&&(d=new h(d,x,null,a,f),c.push({event:d,listeners:v}))}}if((t&7)===0){e:{if(d=e==="mouseover"||e==="pointerover",h=e==="mouseout"||e==="pointerout",d&&a!==Kd&&(x=a.relatedTarget||a.fromElement)&&(Eo(x)||x[ai]))break e;if((h||d)&&(d=f.window===f?f:(d=f.ownerDocument)?d.defaultView||d.parentWindow:window,h?(x=a.relatedTarget||a.toElement,h=u,x=x?Eo(x):null,x!==null&&(b=ti(x),v=x.tag,x!==b||v!==5&&v!==27&&v!==6)&&(x=null)):(h=null,x=u),h!==x)){if(v=Gh,y="onMouseLeave",m="onMouseEnter",p="mouse",(e==="pointerout"||e==="pointerover")&&(v=jh,y="onPointerLeave",m="onPointerEnter",p="pointer"),b=h==null?d:Ji(h),g=x==null?d:Ji(x),d=new v(y,p+"leave",h,a,f),d.target=b,d.relatedTarget=g,y=null,Eo(f)===u&&(v=new v(m,p+"enter",x,a,f),v.target=g,v.relatedTarget=b,y=v),b=y,h&&x)t:{for(v=h,m=x,p=0,g=v;g;g=Sr(g))p++;for(g=0,y=m;y;y=Sr(y))g++;for(;0<p-g;)v=Sr(v),p--;for(;0<g-p;)m=Sr(m),g--;for(;p--;){if(v===m||m!==null&&v===m.alternate)break t;v=Sr(v),m=Sr(m)}v=null}else v=null;h!==null&&zg(c,d,h,v,!1),x!==null&&b!==null&&zg(c,b,x,v,!0)}}e:{if(d=u?Ji(u):window,h=d.nodeName&&d.nodeName.toLowerCase(),h==="select"||h==="input"&&d.type==="file")var S=Zh;else if(Wh(d))if(kx)S=KS;else{S=jS;var A=XS}else h=d.nodeName,!h||h.toLowerCase()!=="input"||d.type!=="checkbox"&&d.type!=="radio"?u&&Oc(u.elementType)&&(S=Zh):S=YS;if(S&&(S=S(e,u))){Ax(c,S,a,f);break e}A&&A(e,d,u),e==="focusout"&&u&&d.type==="number"&&u.memoizedProps.value!=null&&Yd(d,"number",d.value)}switch(A=u?Ji(u):window,e){case"focusin":(Wh(A)||A.contentEditable==="true")&&(Br=A,Zd=u,an=null);break;case"focusout":an=Zd=Br=null;break;case"mousedown":Qd=!0;break;case"contextmenu":case"mouseup":case"dragend":Qd=!1,eg(c,a,f);break;case"selectionchange":if(QS)break;case"keydown":case"keyup":eg(c,a,f)}var w;if(Uc)e:{switch(e){case"compositionstart":var L="onCompositionStart";break e;case"compositionend":L="onCompositionEnd";break e;case"compositionupdate":L="onCompositionUpdate";break e}L=void 0}else Mr?Ix(e,a)&&(L="onCompositionEnd"):e==="keydown"&&a.keyCode===229&&(L="onCompositionStart");L&&(Cx&&a.locale!=="ko"&&(Mr||L!=="onCompositionStart"?L==="onCompositionEnd"&&Mr&&(w=Sx()):(ja=f,zc="value"in ja?ja.value:ja.textContent,Mr=!0)),A=js(u,L),0<A.length&&(L=new Xh(L,e,null,a,f),c.push({event:L,listeners:A}),w?L.data=w:(w=Tx(a),w!==null&&(L.data=w)))),(w=qS?HS(e,a):_S(e,a))&&(L=js(u,"onBeforeInput"),0<L.length&&(A=new Xh("onBeforeInput","beforeinput",null,a,f),c.push({event:A,listeners:L}),A.data=w)),RC(c,e,u,a,f)}py(c,t)})}function In(e,t,a){return{instance:e,listener:t,currentTarget:a}}function js(e,t){for(var a=t+"Capture",o=[];e!==null;){var r=e,i=r.stateNode;r=r.tag,r!==5&&r!==26&&r!==27||i===null||(r=yn(e,a),r!=null&&o.unshift(In(e,r,i)),r=yn(e,t),r!=null&&o.push(In(e,r,i))),e=e.return}return o}function Sr(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function zg(e,t,a,o,r){for(var i=t._reactName,n=[];a!==null&&a!==o;){var l=a,s=l.alternate,u=l.stateNode;if(l=l.tag,s!==null&&s===o)break;l!==5&&l!==26&&l!==27||u===null||(s=u,r?(u=yn(a,i),u!=null&&n.unshift(In(a,u,s))):r||(u=yn(a,i),u!=null&&n.push(In(a,u,s)))),a=a.return}n.length!==0&&e.push({event:t,listeners:n})}var OC=/\r\n?/g,VC=/\u0000|\uFFFD/g;function Fg(e){return(typeof e=="string"?e:""+e).replace(OC,`
`).replace(VC,"")}function hy(e,t){return t=Fg(t),Fg(e)===t}function du(){}function J(e,t,a,o,r,i){switch(a){case"children":typeof o=="string"?t==="body"||t==="textarea"&&o===""||Kr(e,o):(typeof o=="number"||typeof o=="bigint")&&t!=="body"&&Kr(e,""+o);break;case"className":Jl(e,"class",o);break;case"tabIndex":Jl(e,"tabindex",o);break;case"dir":case"role":case"viewBox":case"width":case"height":Jl(e,a,o);break;case"style":wx(e,o,i);break;case"data":if(t!=="object"){Jl(e,"data",o);break}case"src":case"href":if(o===""&&(t!=="a"||a!=="href")){e.removeAttribute(a);break}if(o==null||typeof o=="function"||typeof o=="symbol"||typeof o=="boolean"){e.removeAttribute(a);break}o=ms(""+o),e.setAttribute(a,o);break;case"action":case"formAction":if(typeof o=="function"){e.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof i=="function"&&(a==="formAction"?(t!=="input"&&J(e,t,"name",r.name,r,null),J(e,t,"formEncType",r.formEncType,r,null),J(e,t,"formMethod",r.formMethod,r,null),J(e,t,"formTarget",r.formTarget,r,null)):(J(e,t,"encType",r.encType,r,null),J(e,t,"method",r.method,r,null),J(e,t,"target",r.target,r,null)));if(o==null||typeof o=="symbol"||typeof o=="boolean"){e.removeAttribute(a);break}o=ms(""+o),e.setAttribute(a,o);break;case"onClick":o!=null&&(e.onclick=du);break;case"onScroll":o!=null&&X("scroll",e);break;case"onScrollEnd":o!=null&&X("scrollend",e);break;case"dangerouslySetInnerHTML":if(o!=null){if(typeof o!="object"||!("__html"in o))throw Error(C(61));if(a=o.__html,a!=null){if(r.children!=null)throw Error(C(60));e.innerHTML=a}}break;case"multiple":e.multiple=o&&typeof o!="function"&&typeof o!="symbol";break;case"muted":e.muted=o&&typeof o!="function"&&typeof o!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(o==null||typeof o=="function"||typeof o=="boolean"||typeof o=="symbol"){e.removeAttribute("xlink:href");break}a=ms(""+o),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":o!=null&&typeof o!="function"&&typeof o!="symbol"?e.setAttribute(a,""+o):e.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":o&&typeof o!="function"&&typeof o!="symbol"?e.setAttribute(a,""):e.removeAttribute(a);break;case"capture":case"download":o===!0?e.setAttribute(a,""):o!==!1&&o!=null&&typeof o!="function"&&typeof o!="symbol"?e.setAttribute(a,o):e.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":o!=null&&typeof o!="function"&&typeof o!="symbol"&&!isNaN(o)&&1<=o?e.setAttribute(a,o):e.removeAttribute(a);break;case"rowSpan":case"start":o==null||typeof o=="function"||typeof o=="symbol"||isNaN(o)?e.removeAttribute(a):e.setAttribute(a,o);break;case"popover":X("beforetoggle",e),X("toggle",e),ps(e,"popover",o);break;case"xlinkActuate":la(e,"http://www.w3.org/1999/xlink","xlink:actuate",o);break;case"xlinkArcrole":la(e,"http://www.w3.org/1999/xlink","xlink:arcrole",o);break;case"xlinkRole":la(e,"http://www.w3.org/1999/xlink","xlink:role",o);break;case"xlinkShow":la(e,"http://www.w3.org/1999/xlink","xlink:show",o);break;case"xlinkTitle":la(e,"http://www.w3.org/1999/xlink","xlink:title",o);break;case"xlinkType":la(e,"http://www.w3.org/1999/xlink","xlink:type",o);break;case"xmlBase":la(e,"http://www.w3.org/XML/1998/namespace","xml:base",o);break;case"xmlLang":la(e,"http://www.w3.org/XML/1998/namespace","xml:lang",o);break;case"xmlSpace":la(e,"http://www.w3.org/XML/1998/namespace","xml:space",o);break;case"is":ps(e,"is",o);break;case"innerText":case"textContent":break;default:(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")&&(a=pS.get(a)||a,ps(e,a,o))}}function Sc(e,t,a,o,r,i){switch(a){case"style":wx(e,o,i);break;case"dangerouslySetInnerHTML":if(o!=null){if(typeof o!="object"||!("__html"in o))throw Error(C(61));if(a=o.__html,a!=null){if(r.children!=null)throw Error(C(60));e.innerHTML=a}}break;case"children":typeof o=="string"?Kr(e,o):(typeof o=="number"||typeof o=="bigint")&&Kr(e,""+o);break;case"onScroll":o!=null&&X("scroll",e);break;case"onScrollEnd":o!=null&&X("scrollend",e);break;case"onClick":o!=null&&(e.onclick=du);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!hx.hasOwnProperty(a))e:{if(a[0]==="o"&&a[1]==="n"&&(r=a.endsWith("Capture"),t=a.slice(2,r?a.length-7:void 0),i=e[tt]||null,i=i!=null?i[a]:null,typeof i=="function"&&e.removeEventListener(t,i,r),typeof o=="function")){typeof i!="function"&&i!==null&&(a in e?e[a]=null:e.hasAttribute(a)&&e.removeAttribute(a)),e.addEventListener(t,o,r);break e}a in e?e[a]=o:o===!0?e.setAttribute(a,""):ps(e,a,o)}}}function He(e,t,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":X("error",e),X("load",e);var o=!1,r=!1,i;for(i in a)if(a.hasOwnProperty(i)){var n=a[i];if(n!=null)switch(i){case"src":o=!0;break;case"srcSet":r=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(C(137,t));default:J(e,t,i,n,a,null)}}r&&J(e,t,"srcSet",a.srcSet,a,null),o&&J(e,t,"src",a.src,a,null);return;case"input":X("invalid",e);var l=i=n=r=null,s=null,u=null;for(o in a)if(a.hasOwnProperty(o)){var f=a[o];if(f!=null)switch(o){case"name":r=f;break;case"type":n=f;break;case"checked":s=f;break;case"defaultChecked":u=f;break;case"value":i=f;break;case"defaultValue":l=f;break;case"children":case"dangerouslySetInnerHTML":if(f!=null)throw Error(C(137,t));break;default:J(e,t,o,f,a,null)}}yx(e,i,l,s,u,n,r,!1),Ds(e);return;case"select":X("invalid",e),o=n=i=null;for(r in a)if(a.hasOwnProperty(r)&&(l=a[r],l!=null))switch(r){case"value":i=l;break;case"defaultValue":n=l;break;case"multiple":o=l;default:J(e,t,r,l,a,null)}t=i,a=n,e.multiple=!!o,t!=null?Ur(e,!!o,t,!1):a!=null&&Ur(e,!!o,a,!0);return;case"textarea":X("invalid",e),i=r=o=null;for(n in a)if(a.hasOwnProperty(n)&&(l=a[n],l!=null))switch(n){case"value":o=l;break;case"defaultValue":r=l;break;case"children":i=l;break;case"dangerouslySetInnerHTML":if(l!=null)throw Error(C(91));break;default:J(e,t,n,l,a,null)}Lx(e,o,r,i),Ds(e);return;case"option":for(s in a)if(a.hasOwnProperty(s)&&(o=a[s],o!=null))switch(s){case"selected":e.selected=o&&typeof o!="function"&&typeof o!="symbol";break;default:J(e,t,s,o,a,null)}return;case"dialog":X("cancel",e),X("close",e);break;case"iframe":case"object":X("load",e);break;case"video":case"audio":for(o=0;o<Cn.length;o++)X(Cn[o],e);break;case"image":X("error",e),X("load",e);break;case"details":X("toggle",e);break;case"embed":case"source":case"link":X("error",e),X("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(u in a)if(a.hasOwnProperty(u)&&(o=a[u],o!=null))switch(u){case"children":case"dangerouslySetInnerHTML":throw Error(C(137,t));default:J(e,t,u,o,a,null)}return;default:if(Oc(t)){for(f in a)a.hasOwnProperty(f)&&(o=a[f],o!==void 0&&Sc(e,t,f,o,a,void 0));return}}for(l in a)a.hasOwnProperty(l)&&(o=a[l],o!=null&&J(e,t,l,o,a,null))}function zC(e,t,a,o){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var r=null,i=null,n=null,l=null,s=null,u=null,f=null;for(h in a){var c=a[h];if(a.hasOwnProperty(h)&&c!=null)switch(h){case"checked":break;case"value":break;case"defaultValue":s=c;default:o.hasOwnProperty(h)||J(e,t,h,null,o,c)}}for(var d in o){var h=o[d];if(c=a[d],o.hasOwnProperty(d)&&(h!=null||c!=null))switch(d){case"type":i=h;break;case"name":r=h;break;case"checked":u=h;break;case"defaultChecked":f=h;break;case"value":n=h;break;case"defaultValue":l=h;break;case"children":case"dangerouslySetInnerHTML":if(h!=null)throw Error(C(137,t));break;default:h!==c&&J(e,t,d,h,o,c)}}jd(e,n,l,s,u,f,i,r);return;case"select":h=n=l=d=null;for(i in a)if(s=a[i],a.hasOwnProperty(i)&&s!=null)switch(i){case"value":break;case"multiple":h=s;default:o.hasOwnProperty(i)||J(e,t,i,null,o,s)}for(r in o)if(i=o[r],s=a[r],o.hasOwnProperty(r)&&(i!=null||s!=null))switch(r){case"value":d=i;break;case"defaultValue":l=i;break;case"multiple":n=i;default:i!==s&&J(e,t,r,i,o,s)}t=l,a=n,o=h,d!=null?Ur(e,!!a,d,!1):!!o!=!!a&&(t!=null?Ur(e,!!a,t,!0):Ur(e,!!a,a?[]:"",!1));return;case"textarea":h=d=null;for(l in a)if(r=a[l],a.hasOwnProperty(l)&&r!=null&&!o.hasOwnProperty(l))switch(l){case"value":break;case"children":break;default:J(e,t,l,null,o,r)}for(n in o)if(r=o[n],i=a[n],o.hasOwnProperty(n)&&(r!=null||i!=null))switch(n){case"value":d=r;break;case"defaultValue":h=r;break;case"children":break;case"dangerouslySetInnerHTML":if(r!=null)throw Error(C(91));break;default:r!==i&&J(e,t,n,r,o,i)}vx(e,d,h);return;case"option":for(var x in a)if(d=a[x],a.hasOwnProperty(x)&&d!=null&&!o.hasOwnProperty(x))switch(x){case"selected":e.selected=!1;break;default:J(e,t,x,null,o,d)}for(s in o)if(d=o[s],h=a[s],o.hasOwnProperty(s)&&d!==h&&(d!=null||h!=null))switch(s){case"selected":e.selected=d&&typeof d!="function"&&typeof d!="symbol";break;default:J(e,t,s,d,o,h)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var v in a)d=a[v],a.hasOwnProperty(v)&&d!=null&&!o.hasOwnProperty(v)&&J(e,t,v,null,o,d);for(u in o)if(d=o[u],h=a[u],o.hasOwnProperty(u)&&d!==h&&(d!=null||h!=null))switch(u){case"children":case"dangerouslySetInnerHTML":if(d!=null)throw Error(C(137,t));break;default:J(e,t,u,d,o,h)}return;default:if(Oc(t)){for(var b in a)d=a[b],a.hasOwnProperty(b)&&d!==void 0&&!o.hasOwnProperty(b)&&Sc(e,t,b,void 0,o,d);for(f in o)d=o[f],h=a[f],!o.hasOwnProperty(f)||d===h||d===void 0&&h===void 0||Sc(e,t,f,d,o,h);return}}for(var m in a)d=a[m],a.hasOwnProperty(m)&&d!=null&&!o.hasOwnProperty(m)&&J(e,t,m,null,o,d);for(c in o)d=o[c],h=a[c],!o.hasOwnProperty(c)||d===h||d==null&&h==null||J(e,t,c,d,o,h)}var Cc=null,Ic=null;function Ys(e){return e.nodeType===9?e:e.ownerDocument}function Ug(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function gy(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function Tc(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Vd=null;function FC(){var e=window.event;return e&&e.type==="popstate"?e===Vd?!1:(Vd=e,!0):(Vd=null,!1)}var xy=typeof setTimeout=="function"?setTimeout:void 0,UC=typeof clearTimeout=="function"?clearTimeout:void 0,qg=typeof Promise=="function"?Promise:void 0,qC=typeof queueMicrotask=="function"?queueMicrotask:typeof qg<"u"?function(e){return qg.resolve(null).then(e).catch(HC)}:xy;function HC(e){setTimeout(function(){throw e})}function zd(e,t){var a=t,o=0;do{var r=a.nextSibling;if(e.removeChild(a),r&&r.nodeType===8)if(a=r.data,a==="/$"){if(o===0){e.removeChild(r),Mn(t);return}o--}else a!=="$"&&a!=="$?"&&a!=="$!"||o++;a=r}while(a);Mn(t)}function Ac(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var a=t;switch(t=t.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Ac(a),Pc(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}e.removeChild(a)}}function _C(e,t,a,o){for(;e.nodeType===1;){var r=a;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!o&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(o){if(!e[xn])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(i=e.getAttribute("rel"),i==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(i!==r.rel||e.getAttribute("href")!==(r.href==null?null:r.href)||e.getAttribute("crossorigin")!==(r.crossOrigin==null?null:r.crossOrigin)||e.getAttribute("title")!==(r.title==null?null:r.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(i=e.getAttribute("src"),(i!==(r.src==null?null:r.src)||e.getAttribute("type")!==(r.type==null?null:r.type)||e.getAttribute("crossorigin")!==(r.crossOrigin==null?null:r.crossOrigin))&&i&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var i=r.name==null?null:""+r.name;if(r.type==="hidden"&&e.getAttribute("name")===i)return e}else return e;if(e=zt(e.nextSibling),e===null)break}return null}function NC(e,t,a){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!a||(e=zt(e.nextSibling),e===null))return null;return e}function zt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="F!"||t==="F")break;if(t==="/$")return null}}return e}function Hg(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var a=e.data;if(a==="$"||a==="$!"||a==="$?"){if(t===0)return e;t--}else a==="/$"&&t++}e=e.previousSibling}return null}function yy(e,t,a){switch(t=Ys(a),e){case"html":if(e=t.documentElement,!e)throw Error(C(452));return e;case"head":if(e=t.head,!e)throw Error(C(453));return e;case"body":if(e=t.body,!e)throw Error(C(454));return e;default:throw Error(C(451))}}var At=new Map,_g=new Set;function Ks(e){return typeof e.getRootNode=="function"?e.getRootNode():e.ownerDocument}var Ca=ie.d;ie.d={f:GC,r:XC,D:jC,C:YC,L:KC,m:WC,X:QC,S:ZC,M:JC};function GC(){var e=Ca.f(),t=uu();return e||t}function XC(e){var t=oi(e);t!==null&&t.tag===5&&t.type==="form"?y0(t):Ca.r(e)}var ii=typeof document>"u"?null:document;function vy(e,t,a){var o=ii;if(o&&typeof t=="string"&&t){var r=bt(t);r='link[rel="'+e+'"][href="'+r+'"]',typeof a=="string"&&(r+='[crossorigin="'+a+'"]'),_g.has(r)||(_g.add(r),e={rel:e,crossOrigin:a,href:t},o.querySelector(r)===null&&(t=o.createElement("link"),He(t,"link",e),Oe(t),o.head.appendChild(t)))}}function jC(e){Ca.D(e),vy("dns-prefetch",e,null)}function YC(e,t){Ca.C(e,t),vy("preconnect",e,t)}function KC(e,t,a){Ca.L(e,t,a);var o=ii;if(o&&e&&t){var r='link[rel="preload"][as="'+bt(t)+'"]';t==="image"&&a&&a.imageSrcSet?(r+='[imagesrcset="'+bt(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(r+='[imagesizes="'+bt(a.imageSizes)+'"]')):r+='[href="'+bt(e)+'"]';var i=r;switch(t){case"style":i=ei(e);break;case"script":i=ni(e)}At.has(i)||(e=ne({rel:"preload",href:t==="image"&&a&&a.imageSrcSet?void 0:e,as:t},a),At.set(i,e),o.querySelector(r)!==null||t==="style"&&o.querySelector(Hn(i))||t==="script"&&o.querySelector(_n(i))||(t=o.createElement("link"),He(t,"link",e),Oe(t),o.head.appendChild(t)))}}function WC(e,t){Ca.m(e,t);var a=ii;if(a&&e){var o=t&&typeof t.as=="string"?t.as:"script",r='link[rel="modulepreload"][as="'+bt(o)+'"][href="'+bt(e)+'"]',i=r;switch(o){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":i=ni(e)}if(!At.has(i)&&(e=ne({rel:"modulepreload",href:e},t),At.set(i,e),a.querySelector(r)===null)){switch(o){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(_n(i)))return}o=a.createElement("link"),He(o,"link",e),Oe(o),a.head.appendChild(o)}}}function ZC(e,t,a){Ca.S(e,t,a);var o=ii;if(o&&e){var r=Fr(o).hoistableStyles,i=ei(e);t=t||"default";var n=r.get(i);if(!n){var l={loading:0,preload:null};if(n=o.querySelector(Hn(i)))l.loading=5;else{e=ne({rel:"stylesheet",href:e,"data-precedence":t},a),(a=At.get(i))&&xp(e,a);var s=n=o.createElement("link");Oe(s),He(s,"link",e),s._p=new Promise(function(u,f){s.onload=u,s.onerror=f}),s.addEventListener("load",function(){l.loading|=1}),s.addEventListener("error",function(){l.loading|=2}),l.loading|=4,bs(n,t,o)}n={type:"stylesheet",instance:n,count:1,state:l},r.set(i,n)}}}function QC(e,t){Ca.X(e,t);var a=ii;if(a&&e){var o=Fr(a).hoistableScripts,r=ni(e),i=o.get(r);i||(i=a.querySelector(_n(r)),i||(e=ne({src:e,async:!0},t),(t=At.get(r))&&yp(e,t),i=a.createElement("script"),Oe(i),He(i,"link",e),a.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},o.set(r,i))}}function JC(e,t){Ca.M(e,t);var a=ii;if(a&&e){var o=Fr(a).hoistableScripts,r=ni(e),i=o.get(r);i||(i=a.querySelector(_n(r)),i||(e=ne({src:e,async:!0,type:"module"},t),(t=At.get(r))&&yp(e,t),i=a.createElement("script"),Oe(i),He(i,"link",e),a.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},o.set(r,i))}}function Ng(e,t,a,o){var r=(r=Ya.current)?Ks(r):null;if(!r)throw Error(C(446));switch(e){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(t=ei(a.href),a=Fr(r).hoistableStyles,o=a.get(t),o||(o={type:"style",instance:null,count:0,state:null},a.set(t,o)),o):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){e=ei(a.href);var i=Fr(r).hoistableStyles,n=i.get(e);if(n||(r=r.ownerDocument||r,n={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},i.set(e,n),(i=r.querySelector(Hn(e)))&&!i._p&&(n.instance=i,n.state.loading=5),At.has(e)||(a={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},At.set(e,a),i||$C(r,e,a,n.state))),t&&o===null)throw Error(C(528,""));return n}if(t&&o!==null)throw Error(C(529,""));return null;case"script":return t=a.async,a=a.src,typeof a=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=ni(a),a=Fr(r).hoistableScripts,o=a.get(t),o||(o={type:"script",instance:null,count:0,state:null},a.set(t,o)),o):{type:"void",instance:null,count:0,state:null};default:throw Error(C(444,e))}}function ei(e){return'href="'+bt(e)+'"'}function Hn(e){return'link[rel="stylesheet"]['+e+"]"}function Ly(e){return ne({},e,{"data-precedence":e.precedence,precedence:null})}function $C(e,t,a,o){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?o.loading=1:(t=e.createElement("link"),o.preload=t,t.addEventListener("load",function(){return o.loading|=1}),t.addEventListener("error",function(){return o.loading|=2}),He(t,"link",a),Oe(t),e.head.appendChild(t))}function ni(e){return'[src="'+bt(e)+'"]'}function _n(e){return"script[async]"+e}function Gg(e,t,a){if(t.count++,t.instance===null)switch(t.type){case"style":var o=e.querySelector('style[data-href~="'+bt(a.href)+'"]');if(o)return t.instance=o,Oe(o),o;var r=ne({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return o=(e.ownerDocument||e).createElement("style"),Oe(o),He(o,"style",r),bs(o,a.precedence,e),t.instance=o;case"stylesheet":r=ei(a.href);var i=e.querySelector(Hn(r));if(i)return t.state.loading|=4,t.instance=i,Oe(i),i;o=Ly(a),(r=At.get(r))&&xp(o,r),i=(e.ownerDocument||e).createElement("link"),Oe(i);var n=i;return n._p=new Promise(function(l,s){n.onload=l,n.onerror=s}),He(i,"link",o),t.state.loading|=4,bs(i,a.precedence,e),t.instance=i;case"script":return i=ni(a.src),(r=e.querySelector(_n(i)))?(t.instance=r,Oe(r),r):(o=a,(r=At.get(i))&&(o=ne({},a),yp(o,r)),e=e.ownerDocument||e,r=e.createElement("script"),Oe(r),He(r,"link",o),e.head.appendChild(r),t.instance=r);case"void":return null;default:throw Error(C(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(o=t.instance,t.state.loading|=4,bs(o,a.precedence,e));return t.instance}function bs(e,t,a){for(var o=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),r=o.length?o[o.length-1]:null,i=r,n=0;n<o.length;n++){var l=o[n];if(l.dataset.precedence===t)i=l;else if(i!==r)break}i?i.parentNode.insertBefore(e,i.nextSibling):(t=a.nodeType===9?a.head:a,t.insertBefore(e,t.firstChild))}function xp(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function yp(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Ss=null;function Xg(e,t,a){if(Ss===null){var o=new Map,r=Ss=new Map;r.set(a,o)}else r=Ss,o=r.get(a),o||(o=new Map,r.set(a,o));if(o.has(e))return o;for(o.set(e,null),a=a.getElementsByTagName(e),r=0;r<a.length;r++){var i=a[r];if(!(i[xn]||i[Ne]||e==="link"&&i.getAttribute("rel")==="stylesheet")&&i.namespaceURI!=="http://www.w3.org/2000/svg"){var n=i.getAttribute(t)||"";n=e+n;var l=o.get(n);l?l.push(i):o.set(n,[i])}}return o}function jg(e,t,a){e=e.ownerDocument||e,e.head.insertBefore(a,t==="title"?e.querySelector("head > title"):null)}function e1(e,t,a){if(a===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function wy(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}var Tn=null;function t1(){}function a1(e,t,a){if(Tn===null)throw Error(C(475));var o=Tn;if(t.type==="stylesheet"&&(typeof a.media!="string"||matchMedia(a.media).matches!==!1)&&(t.state.loading&4)===0){if(t.instance===null){var r=ei(a.href),i=e.querySelector(Hn(r));if(i){e=i._p,e!==null&&typeof e=="object"&&typeof e.then=="function"&&(o.count++,o=Ws.bind(o),e.then(o,o)),t.state.loading|=4,t.instance=i,Oe(i);return}i=e.ownerDocument||e,a=Ly(a),(r=At.get(r))&&xp(a,r),i=i.createElement("link"),Oe(i);var n=i;n._p=new Promise(function(l,s){n.onload=l,n.onerror=s}),He(i,"link",a),t.instance=i}o.stylesheets===null&&(o.stylesheets=new Map),o.stylesheets.set(t,e),(e=t.state.preload)&&(t.state.loading&3)===0&&(o.count++,t=Ws.bind(o),e.addEventListener("load",t),e.addEventListener("error",t))}}function o1(){if(Tn===null)throw Error(C(475));var e=Tn;return e.stylesheets&&e.count===0&&kc(e,e.stylesheets),0<e.count?function(t){var a=setTimeout(function(){if(e.stylesheets&&kc(e,e.stylesheets),e.unsuspend){var o=e.unsuspend;e.unsuspend=null,o()}},6e4);return e.unsuspend=t,function(){e.unsuspend=null,clearTimeout(a)}}:null}function Ws(){if(this.count--,this.count===0){if(this.stylesheets)kc(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Zs=null;function kc(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Zs=new Map,t.forEach(r1,e),Zs=null,Ws.call(e))}function r1(e,t){if(!(t.state.loading&4)){var a=Zs.get(e);if(a)var o=a.get(null);else{a=new Map,Zs.set(e,a);for(var r=e.querySelectorAll("link[data-precedence],style[data-precedence]"),i=0;i<r.length;i++){var n=r[i];(n.nodeName==="LINK"||n.getAttribute("media")!=="not all")&&(a.set(n.dataset.precedence,n),o=n)}o&&a.set(null,o)}r=t.instance,n=r.getAttribute("data-precedence"),i=a.get(n)||o,i===o&&a.set(null,r),a.set(n,r),this.count++,o=Ws.bind(this),r.addEventListener("load",o),r.addEventListener("error",o),i?i.parentNode.insertBefore(r,i.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(r,e.firstChild)),t.state.loading|=4}}var An={$$typeof:ma,Provider:null,Consumer:null,_currentValue:Po,_currentValue2:Po,_threadCount:0};function i1(e,t,a,o,r,i,n,l){this.tag=1,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=dd(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.finishedLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=dd(0),this.hiddenUpdates=dd(null),this.identifierPrefix=o,this.onUncaughtError=r,this.onCaughtError=i,this.onRecoverableError=n,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=l,this.incompleteTransitions=new Map}function by(e,t,a,o,r,i,n,l,s,u,f,c){return e=new i1(e,t,a,n,l,s,u,c),t=1,i===!0&&(t|=24),i=Ct(3,null,null,t),e.current=i,i.stateNode=e,t=jc(),t.refCount++,e.pooledCache=t,t.refCount++,i.memoizedState={element:o,isDehydrated:a,cache:t},lp(i),e}function Sy(e){return e?(e=Pr,e):Pr}function Cy(e,t,a,o,r,i){r=Sy(r),o.context===null?o.context=r:o.pendingContext=r,o=Ka(t),o.payload={element:a},i=i===void 0?null:i,i!==null&&(o.callback=i),a=Wa(e,o,t),a!==null&&(Ze(a,e,t),un(a,e,t))}function Yg(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var a=e.retryLane;e.retryLane=a!==0&&a<t?a:t}}function vp(e,t){Yg(e,t),(e=e.alternate)&&Yg(e,t)}function Iy(e){if(e.tag===13){var t=to(e,67108864);t!==null&&Ze(t,e,67108864),vp(e,67108864)}}var Qs=!0;function n1(e,t,a,o){var r=P.T;P.T=null;var i=ie.p;try{ie.p=2,Lp(e,t,a,o)}finally{ie.p=i,P.T=r}}function l1(e,t,a,o){var r=P.T;P.T=null;var i=ie.p;try{ie.p=8,Lp(e,t,a,o)}finally{ie.p=i,P.T=r}}function Lp(e,t,a,o){if(Qs){var r=Dc(o);if(r===null)Od(e,t,o,Js,a),Kg(e,o);else if(u1(r,e,t,a,o))o.stopPropagation();else if(Kg(e,o),t&4&&-1<s1.indexOf(e)){for(;r!==null;){var i=oi(r);if(i!==null)switch(i.tag){case 3:if(i=i.stateNode,i.current.memoizedState.isDehydrated){var n=Do(i.pendingLanes);if(n!==0){var l=i;for(l.pendingLanes|=2,l.entangledLanes|=2;n;){var s=1<<31-ft(n);l.entanglements[1]|=s,n&=~s}Jt(i),(pe&6)===0&&(_s=Kt()+500,qn(0,!1))}}break;case 13:l=to(i,2),l!==null&&Ze(l,i,2),uu(),vp(i,2)}if(i=Dc(o),i===null&&Od(e,t,o,Js,a),i===r)break;r=i}r!==null&&o.stopPropagation()}else Od(e,t,o,null,a)}}function Dc(e){return e=Vc(e),wp(e)}var Js=null;function wp(e){if(Js=null,e=Eo(e),e!==null){var t=ti(e);if(t===null)e=null;else{var a=t.tag;if(a===13){if(e=ox(t),e!==null)return e;e=null}else if(a===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return Js=e,null}function Ty(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Wb()){case ix:return 2;case nx:return 8;case ks:case Zb:return 32;case lx:return 268435456;default:return 32}default:return 32}}var Mc=!1,Ja=null,$a=null,eo=null,kn=new Map,Dn=new Map,Ga=[],s1="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Kg(e,t){switch(e){case"focusin":case"focusout":Ja=null;break;case"dragenter":case"dragleave":$a=null;break;case"mouseover":case"mouseout":eo=null;break;case"pointerover":case"pointerout":kn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Dn.delete(t.pointerId)}}function Yi(e,t,a,o,r,i){return e===null||e.nativeEvent!==i?(e={blockedOn:t,domEventName:a,eventSystemFlags:o,nativeEvent:i,targetContainers:[r]},t!==null&&(t=oi(t),t!==null&&Iy(t)),e):(e.eventSystemFlags|=o,t=e.targetContainers,r!==null&&t.indexOf(r)===-1&&t.push(r),e)}function u1(e,t,a,o,r){switch(t){case"focusin":return Ja=Yi(Ja,e,t,a,o,r),!0;case"dragenter":return $a=Yi($a,e,t,a,o,r),!0;case"mouseover":return eo=Yi(eo,e,t,a,o,r),!0;case"pointerover":var i=r.pointerId;return kn.set(i,Yi(kn.get(i)||null,e,t,a,o,r)),!0;case"gotpointercapture":return i=r.pointerId,Dn.set(i,Yi(Dn.get(i)||null,e,t,a,o,r)),!0}return!1}function Ay(e){var t=Eo(e.target);if(t!==null){var a=ti(t);if(a!==null){if(t=a.tag,t===13){if(t=ox(a),t!==null){e.blockedOn=t,iS(e.priority,function(){if(a.tag===13){var o=dt(),r=to(a,o);r!==null&&Ze(r,a,o),vp(a,o)}});return}}else if(t===3&&a.stateNode.current.memoizedState.isDehydrated){e.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Cs(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var a=Dc(e.nativeEvent);if(a===null){a=e.nativeEvent;var o=new a.constructor(a.type,a);Kd=o,a.target.dispatchEvent(o),Kd=null}else return t=oi(a),t!==null&&Iy(t),e.blockedOn=a,!1;t.shift()}return!0}function Wg(e,t,a){Cs(e)&&a.delete(t)}function f1(){Mc=!1,Ja!==null&&Cs(Ja)&&(Ja=null),$a!==null&&Cs($a)&&($a=null),eo!==null&&Cs(eo)&&(eo=null),kn.forEach(Wg),Dn.forEach(Wg)}function ds(e,t){e.blockedOn===t&&(e.blockedOn=null,Mc||(Mc=!0,Me.unstable_scheduleCallback(Me.unstable_NormalPriority,f1)))}var cs=null;function Zg(e){cs!==e&&(cs=e,Me.unstable_scheduleCallback(Me.unstable_NormalPriority,function(){cs===e&&(cs=null);for(var t=0;t<e.length;t+=3){var a=e[t],o=e[t+1],r=e[t+2];if(typeof o!="function"){if(wp(o||a)===null)continue;break}var i=oi(a);i!==null&&(e.splice(t,3),t-=3,rc(i,{pending:!0,data:r,method:a.method,action:o},o,r))}}))}function Mn(e){function t(s){return ds(s,e)}Ja!==null&&ds(Ja,e),$a!==null&&ds($a,e),eo!==null&&ds(eo,e),kn.forEach(t),Dn.forEach(t);for(var a=0;a<Ga.length;a++){var o=Ga[a];o.blockedOn===e&&(o.blockedOn=null)}for(;0<Ga.length&&(a=Ga[0],a.blockedOn===null);)Ay(a),a.blockedOn===null&&Ga.shift();if(a=(e.ownerDocument||e).$$reactFormReplay,a!=null)for(o=0;o<a.length;o+=3){var r=a[o],i=a[o+1],n=r[tt]||null;if(typeof i=="function")n||Zg(a);else if(n){var l=null;if(i&&i.hasAttribute("formAction")){if(r=i,n=i[tt]||null)l=n.formAction;else if(wp(r)!==null)continue}else l=n.action;typeof l=="function"?a[o+1]=l:(a.splice(o,3),o-=3),Zg(a)}}}function bp(e){this._internalRoot=e}cu.prototype.render=bp.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(C(409));var a=t.current,o=dt();Cy(a,o,e,t,null,null)};cu.prototype.unmount=bp.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;e.tag===0&&Xr(),Cy(e.current,2,null,e,null,null),uu(),t[ai]=null}};function cu(e){this._internalRoot=e}cu.prototype.unstable_scheduleHydration=function(e){if(e){var t=px();e={blockedOn:null,target:e,priority:t};for(var a=0;a<Ga.length&&t!==0&&t<Ga[a].priority;a++);Ga.splice(a,0,e),a===0&&Ay(e)}};var Qg=Jg.version;if(Qg!=="19.0.1")throw Error(C(527,Qg,"19.0.1"));ie.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(C(188)):(e=Object.keys(e).join(","),Error(C(268,e)));return e=jb(t),e=e!==null?rx(e):null,e=e===null?null:e.stateNode,e};var d1={bundleType:0,version:"19.0.1",rendererPackageName:"react-dom",currentDispatcherRef:P,findFiberByHostInstance:Eo,reconcilerVersion:"19.0.1"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(Ki=__REACT_DEVTOOLS_GLOBAL_HOOK__,!Ki.isDisabled&&Ki.supportsFiber))try{Bn=Ki.inject(d1),ut=Ki}catch{}var Ki;pu.createRoot=function(e,t){if(!$g(e))throw Error(C(299));var a=!1,o="",r=C0,i=I0,n=T0,l=null;return t!=null&&(t.unstable_strictMode===!0&&(a=!0),t.identifierPrefix!==void 0&&(o=t.identifierPrefix),t.onUncaughtError!==void 0&&(r=t.onUncaughtError),t.onCaughtError!==void 0&&(i=t.onCaughtError),t.onRecoverableError!==void 0&&(n=t.onRecoverableError),t.unstable_transitionCallbacks!==void 0&&(l=t.unstable_transitionCallbacks)),t=by(e,1,!1,null,null,a,o,r,i,n,l,null),e[ai]=t.current,gp(e.nodeType===8?e.parentNode:e),new bp(t)};pu.hydrateRoot=function(e,t,a){if(!$g(e))throw Error(C(299));var o=!1,r="",i=C0,n=I0,l=T0,s=null,u=null;return a!=null&&(a.unstable_strictMode===!0&&(o=!0),a.identifierPrefix!==void 0&&(r=a.identifierPrefix),a.onUncaughtError!==void 0&&(i=a.onUncaughtError),a.onCaughtError!==void 0&&(n=a.onCaughtError),a.onRecoverableError!==void 0&&(l=a.onRecoverableError),a.unstable_transitionCallbacks!==void 0&&(s=a.unstable_transitionCallbacks),a.formState!==void 0&&(u=a.formState)),t=by(e,1,!0,t,a??null,o,r,i,n,l,s,u),t.context=Sy(null),a=t.current,o=dt(),r=Ka(o),r.callback=null,Wa(a,r,o),t.current.lanes=o,Rn(t,o),Jt(t),e[ai]=t.current,gp(e),new cu(t)};pu.version="19.0.1"});var By=Nt((mA,My)=>{"use strict";function Dy(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Dy)}catch(e){console.error(e)}}Dy(),My.exports=ky()});var Ry=Nt(mu=>{"use strict";var c1=Symbol.for("react.transitional.element"),p1=Symbol.for("react.fragment");function Ey(e,t,a){var o=null;if(a!==void 0&&(o=""+a),t.key!==void 0&&(o=""+t.key),"key"in t){a={};for(var r in t)r!=="key"&&(a[r]=t[r])}else a=t;return t=a.ref,{$$typeof:c1,type:e,key:o,ref:t!==void 0?t:null,props:a}}mu.Fragment=p1;mu.jsx=Ey;mu.jsxs=Ey});var li=Nt((gA,Py)=>{"use strict";Py.exports=Ry()});var ib=q(G(),1),nb=q(By(),1);var H=q(G(),1);var k=q(G(),1);var Bl=q(li(),1),Ht=q(G(),1);var Oy=q(G(),1),si=(0,Oy.createContext)({});var Vy=q(G(),1);function ui(e){let t=(0,Vy.useRef)(null);return t.current===null&&(t.current=e()),t.current}var hu=q(G(),1);var zy=typeof window<"u";var fi=zy?hu.useLayoutEffect:hu.useEffect;var Bm=q(li(),1),jL=q(G(),1),vo=q(G(),1);var Fy=q(G(),1),lo=(0,Fy.createContext)(null);var GL=q(li(),1);function Qo(e,t){e.indexOf(t)===-1&&e.push(t)}function so(e,t){let a=e.indexOf(t);a>-1&&e.splice(a,1)}var Be=(e,t,a)=>a>t?t:a<e?e:a;var Ia=()=>{},ot=()=>{};var Qe={};var Nn=e=>/^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e);var Gn=e=>typeof e=="object"&&e!==null;var Xn=e=>/^0[^.\s]+$/u.test(e);function jn(e){let t;return()=>(t===void 0&&(t=e()),t)}var me=e=>e;var Ut=(...e)=>e.reduce((t,a)=>o=>a(t(o)));var $t=(e,t,a)=>{let o=t-e;return o?(a-e)/o:1};var Ta=class{constructor(){this.subscriptions=[]}add(t){return Qo(this.subscriptions,t),()=>so(this.subscriptions,t)}notify(t,a,o){let r=this.subscriptions.length;if(r)if(r===1)this.subscriptions[0](t,a,o);else for(let i=0;i<r;i++){let n=this.subscriptions[i];n&&n(t,a,o)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}};var be=e=>e*1e3,Fe=e=>e/1e3;var Yn=(e,t)=>t?e*(1e3/t):0;var Uy=(e,t,a)=>(((1-3*a+3*t)*e+(3*a-6*t))*e+3*t)*e,m1=1e-7,h1=12;function g1(e,t,a,o,r){let i,n,l=0;do n=t+(a-t)/2,i=Uy(n,o,r)-e,i>0?a=n:t=n;while(Math.abs(i)>m1&&++l<h1);return n}function uo(e,t,a,o){if(e===t&&a===o)return me;let r=i=>g1(i,0,1,e,a);return i=>i===0||i===1?i:Uy(r(i),t,o)}var gu=e=>t=>t<=.5?e(2*t)/2:(2-e(2*(1-t)))/2;var xu=e=>t=>1-e(1-t);var yu=uo(.33,1.53,.69,.99),di=xu(yu),Kn=gu(di);var Wn=e=>e>=1?1:(e*=2)<1?.5*di(e):.5*(2-Math.pow(2,-10*(e-1)));var Zn=e=>1-Math.sin(Math.acos(e)),Qn=xu(Zn),Jn=gu(Zn);var Sp=uo(.42,0,1,1),Cp=uo(0,0,.58,1),$n=uo(.42,0,.58,1);var Ip=e=>Array.isArray(e)&&typeof e[0]!="number";var el=e=>Array.isArray(e)&&typeof e[0]=="number";var qy={linear:me,easeIn:Sp,easeInOut:$n,easeOut:Cp,circIn:Zn,circInOut:Jn,circOut:Qn,backIn:di,backInOut:Kn,backOut:yu,anticipate:Wn},x1=e=>typeof e=="string",vu=e=>{if(el(e)){ot(e.length===4,"Cubic bezier arrays must contain four numerical values.","cubic-bezier-length");let[t,a,o,r]=e;return uo(t,a,o,r)}else if(x1(e))return ot(qy[e]!==void 0,`Invalid easing type '${e}'`,"invalid-easing-type"),qy[e];return e};var tl=["setup","read","resolveKeyframes","preUpdate","update","preRender","render","postRender"];function Hy(e){let t=new Set,a=new Set,o=!1,r=!1,i=new WeakSet,n={delta:0,timestamp:0,isProcessing:!1};function l(u){i.has(u)&&(s.schedule(u),e()),u(n)}let s={schedule:(u,f=!1,c=!1)=>{let h=c&&o?t:a;return f&&i.add(u),h.add(u),u},cancel:u=>{a.delete(u),i.delete(u)},process:u=>{if(n=u,o){r=!0;return}o=!0;let f=t;t=a,a=f,t.forEach(l),t.clear(),o=!1,r&&(r=!1,s.process(u))}};return s}var y1=40;function Lu(e,t){let a=!1,o=!0,r={delta:0,timestamp:0,isProcessing:!1},i=()=>a=!0,n=tl.reduce((g,y)=>(g[y]=Hy(i),g),{}),{setup:l,read:s,resolveKeyframes:u,preUpdate:f,update:c,preRender:d,render:h,postRender:x}=n,v=()=>{let g=Qe.useManualTiming,y=g?r.timestamp:performance.now();a=!1,g||(r.delta=o?1e3/60:Math.max(Math.min(y-r.timestamp,y1),1)),r.timestamp=y,r.isProcessing=!0,l.process(r),s.process(r),u.process(r),f.process(r),c.process(r),d.process(r),h.process(r),x.process(r),r.isProcessing=!1,a&&t&&(o=!1,e(v))},b=()=>{a=!0,o=!0,r.isProcessing||e(v)};return{schedule:tl.reduce((g,y)=>{let S=n[y];return g[y]=(A,w=!1,L=!1)=>(a||b(),S.schedule(A,w,L)),g},{}),cancel:g=>{for(let y=0;y<tl.length;y++)n[tl[y]].cancel(g)},state:r,steps:n}}var{schedule:O,cancel:rt,state:Le,steps:al}=Lu(typeof requestAnimationFrame<"u"?requestAnimationFrame:me,!0);var wu;function v1(){wu=void 0}var he={now:()=>(wu===void 0&&he.set(Le.isProcessing||Qe.useManualTiming?Le.timestamp:performance.now()),wu),set:e=>{wu=e,queueMicrotask(v1)}};var _y=e=>t=>typeof t=="string"&&t.startsWith(e),bu=_y("--"),L1=_y("var(--"),ci=e=>L1(e)?w1.test(e.split("/*")[0].trim()):!1,w1=/var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;function Tp(e){return typeof e!="string"?!1:e.split("/*")[0].includes("var(--")}var ea={test:e=>typeof e=="number",parse:parseFloat,transform:e=>e},Aa={...ea,transform:e=>Be(0,1,e)},ol={...ea,default:1};var fo=e=>Math.round(e*1e5)/1e5;var pi=/-?(?:\d+(?:\.\d+)?|\.\d+)/gu;function Ny(e){return e==null}var Gy=/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;var mi=(e,t)=>a=>!!(typeof a=="string"&&Gy.test(a)&&a.startsWith(e)||t&&!Ny(a)&&Object.prototype.hasOwnProperty.call(a,t)),Su=(e,t,a)=>o=>{if(typeof o!="string")return o;let[r,i,n,l]=o.match(pi);return{[e]:parseFloat(r),[t]:parseFloat(i),[a]:parseFloat(n),alpha:l!==void 0?parseFloat(l):1}};var b1=e=>Be(0,255,e),Ap={...ea,transform:e=>Math.round(b1(e))},ta={test:mi("rgb","red"),parse:Su("red","green","blue"),transform:({red:e,green:t,blue:a,alpha:o=1})=>"rgba("+Ap.transform(e)+", "+Ap.transform(t)+", "+Ap.transform(a)+", "+fo(Aa.transform(o))+")"};function S1(e){let t="",a="",o="",r="";return e.length>5?(t=e.substring(1,3),a=e.substring(3,5),o=e.substring(5,7),r=e.substring(7,9)):(t=e.substring(1,2),a=e.substring(2,3),o=e.substring(3,4),r=e.substring(4,5),t+=t,a+=a,o+=o,r+=r),{red:parseInt(t,16),green:parseInt(a,16),blue:parseInt(o,16),alpha:r?parseInt(r,16)/255:1}}var rl={test:mi("#"),parse:S1,transform:ta.transform};var il=e=>({test:t=>typeof t=="string"&&t.endsWith(e)&&t.split(" ").length===1,parse:parseFloat,transform:t=>`${t}${e}`}),kt=il("deg"),Xe=il("%"),D=il("px"),kp=il("vh"),Dp=il("vw"),Cu={...Xe,parse:e=>Xe.parse(e)/100,transform:e=>Xe.transform(e*100)};var co={test:mi("hsl","hue"),parse:Su("hue","saturation","lightness"),transform:({hue:e,saturation:t,lightness:a,alpha:o=1})=>"hsla("+Math.round(e)+", "+Xe.transform(fo(t))+", "+Xe.transform(fo(a))+", "+fo(Aa.transform(o))+")"};var ue={test:e=>ta.test(e)||rl.test(e)||co.test(e),parse:e=>ta.test(e)?ta.parse(e):co.test(e)?co.parse(e):rl.parse(e),transform:e=>typeof e=="string"?e:e.hasOwnProperty("red")?ta.transform(e):co.transform(e),getAnimatableNone:e=>{let t=ue.parse(e);return t.alpha=0,ue.transform(t)}};var Xy=/(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;function C1(e){return isNaN(e)&&typeof e=="string"&&(e.match(pi)?.length||0)+(e.match(Xy)?.length||0)>0}var Yy="number",Ky="color",I1="var",T1="var(",jy="${}",A1=/var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;function po(e){let t=e.toString(),a=[],o={color:[],number:[],var:[]},r=[],i=0,l=t.replace(A1,s=>(ue.test(s)?(o.color.push(i),r.push(Ky),a.push(ue.parse(s))):s.startsWith(T1)?(o.var.push(i),r.push(I1),a.push(s)):(o.number.push(i),r.push(Yy),a.push(parseFloat(s))),++i,jy)).split(jy);return{values:a,split:l,indexes:o,types:r}}function k1(e){return po(e).values}function Wy({split:e,types:t}){let a=e.length;return o=>{let r="";for(let i=0;i<a;i++)if(r+=e[i],o[i]!==void 0){let n=t[i];n===Yy?r+=fo(o[i]):n===Ky?r+=ue.transform(o[i]):r+=o[i]}return r}}function D1(e){return Wy(po(e))}var M1=e=>typeof e=="number"?0:ue.test(e)?ue.getAnimatableNone(e):e,B1=(e,t)=>typeof e=="number"?t?.trim().endsWith("/")?e:0:M1(e);function E1(e){let t=po(e);return Wy(t)(t.values.map((o,r)=>B1(o,t.split[r])))}var Ee={test:C1,parse:k1,createTransformer:D1,getAnimatableNone:E1};function Mp(e,t,a){return a<0&&(a+=1),a>1&&(a-=1),a<1/6?e+(t-e)*6*a:a<1/2?t:a<2/3?e+(t-e)*(2/3-a)*6:e}function Zy({hue:e,saturation:t,lightness:a,alpha:o}){e/=360,t/=100,a/=100;let r=0,i=0,n=0;if(!t)r=i=n=a;else{let l=a<.5?a*(1+t):a+t-a*t,s=2*a-l;r=Mp(s,l,e+1/3),i=Mp(s,l,e),n=Mp(s,l,e-1/3)}return{red:Math.round(r*255),green:Math.round(i*255),blue:Math.round(n*255),alpha:o}}function hi(e,t){return a=>a>0?t:e}var F=(e,t,a)=>e+(t-e)*a;var Bp=(e,t,a)=>{let o=e*e,r=a*(t*t-o)+o;return r<0?0:Math.sqrt(r)},R1=[rl,ta,co],P1=e=>R1.find(t=>t.test(e));function Qy(e){let t=P1(e);if(Ia(!!t,`'${e}' is not an animatable color. Use the equivalent color code instead.`,"color-not-animatable"),!t)return!1;let a=t.parse(e);return t===co&&(a=Zy(a)),a}var Ep=(e,t)=>{let a=Qy(e),o=Qy(t);if(!a||!o)return hi(e,t);let r={...a};return i=>(r.red=Bp(a.red,o.red,i),r.green=Bp(a.green,o.green,i),r.blue=Bp(a.blue,o.blue,i),r.alpha=F(a.alpha,o.alpha,i),ta.transform(r))};var Iu=new Set(["none","hidden"]);function Jy(e,t){return Iu.has(e)?a=>a<=0?e:t:a=>a>=1?t:e}function O1(e,t){return a=>F(e,t,a)}function Tu(e){return typeof e=="number"?O1:typeof e=="string"?ci(e)?hi:ue.test(e)?Ep:F1:Array.isArray(e)?$y:typeof e=="object"?ue.test(e)?Ep:V1:hi}function $y(e,t){let a=[...e],o=a.length,r=e.map((i,n)=>Tu(i)(i,t[n]));return i=>{for(let n=0;n<o;n++)a[n]=r[n](i);return a}}function V1(e,t){let a={...e,...t},o={};for(let r in a)e[r]!==void 0&&t[r]!==void 0&&(o[r]=Tu(e[r])(e[r],t[r]));return r=>{for(let i in o)a[i]=o[i](r);return a}}function z1(e,t){let a=[],o={color:0,var:0,number:0};for(let r=0;r<t.values.length;r++){let i=t.types[r],n=e.indexes[i][o[i]],l=e.values[n]??0;a[r]=l,o[i]++}return a}var F1=(e,t)=>{let a=Ee.createTransformer(t),o=po(e),r=po(t);return o.indexes.var.length===r.indexes.var.length&&o.indexes.color.length===r.indexes.color.length&&o.indexes.number.length>=r.indexes.number.length?Iu.has(e)&&!r.values.length||Iu.has(t)&&!o.values.length?Jy(e,t):Ut($y(z1(o,r),r.values),a):(Ia(!0,`Complex values '${e}' and '${t}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`,"complex-values-different"),hi(e,t))};function Au(e,t,a){return typeof e=="number"&&typeof t=="number"&&typeof a=="number"?F(e,t,a):Tu(e)(e,t)}var ev=e=>{let t=({timestamp:a})=>e(a);return{start:(a=!0)=>O.update(t,a),stop:()=>rt(t),now:()=>Le.isProcessing?Le.timestamp:he.now()}};var ku=(e,t,a=10)=>{let o="",r=Math.max(Math.round(t/a),2);for(let i=0;i<r;i++)o+=Math.round(e(i/(r-1))*1e4)/1e4+", ";return`linear(${o.substring(0,o.length-2)})`};function gi(e){let t=0,a=50,o=e.next(t);for(;!o.done&&t<2e4;)t+=a,o=e.next(t);return t>=2e4?1/0:t}function tv(e,t=100,a){let o=a({...e,keyframes:[0,t]}),r=Math.min(gi(o),2e4);return{type:"keyframes",ease:i=>o.next(r*i).value/t,duration:Fe(r)}}var ge={stiffness:100,damping:10,mass:1,velocity:0,duration:800,bounce:.3,visualDuration:.3,restSpeed:{granular:.01,default:2},restDelta:{granular:.005,default:.5},minDuration:.01,maxDuration:10,minDamping:.05,maxDamping:1};function Op(e,t){return e*Math.sqrt(1-t*t)}var U1=12;function q1(e,t,a){let o=a;for(let r=1;r<U1;r++)o=o-e(o)/t(o);return o}var Pp=.001;function H1({duration:e=ge.duration,bounce:t=ge.bounce,velocity:a=ge.velocity,mass:o=ge.mass}){let r,i;Ia(e<=be(ge.maxDuration),"Spring duration must be 10 seconds or less","spring-duration-limit");let n=1-t;n=Be(ge.minDamping,ge.maxDamping,n),e=Be(ge.minDuration,ge.maxDuration,Fe(e)),n<1?(r=u=>{let f=u*n,c=f*e,d=f-a,h=Op(u,n),x=Math.exp(-c);return Pp-d/h*x},i=u=>{let c=u*n*e,d=c*a+a,h=Math.pow(n,2)*Math.pow(u,2)*e,x=Math.exp(-c),v=Op(Math.pow(u,2),n);return(-r(u)+Pp>0?-1:1)*((d-h)*x)/v}):(r=u=>{let f=Math.exp(-u*e),c=(u-a)*e+1;return-Pp+f*c},i=u=>{let f=Math.exp(-u*e),c=(a-u)*(e*e);return f*c});let l=5/e,s=q1(r,i,l);if(e=be(e),isNaN(s))return{stiffness:ge.stiffness,damping:ge.damping,duration:e};{let u=Math.pow(s,2)*o;return{stiffness:u,damping:n*2*Math.sqrt(o*u),duration:e}}}var _1=["duration","bounce"],N1=["stiffness","damping","mass"];function av(e,t){return t.some(a=>e[a]!==void 0)}function G1(e){let t={velocity:ge.velocity,stiffness:ge.stiffness,damping:ge.damping,mass:ge.mass,isResolvedFromDuration:!1,...e};if(!av(e,N1)&&av(e,_1))if(t.velocity=0,e.visualDuration){let a=e.visualDuration,o=2*Math.PI/(a*1.2),r=o*o,i=2*Be(.05,1,1-(e.bounce||0))*Math.sqrt(r);t={...t,mass:ge.mass,stiffness:r,damping:i}}else{let a=H1({...e,velocity:0});t={...t,...a,mass:ge.mass},t.isResolvedFromDuration=!0}return t}function xi(e=ge.visualDuration,t=ge.bounce){let a=typeof e!="object"?{visualDuration:e,keyframes:[0,1],bounce:t}:e,{restSpeed:o,restDelta:r}=a,i=a.keyframes[0],n=a.keyframes[a.keyframes.length-1],l={done:!1,value:i},{stiffness:s,damping:u,mass:f,duration:c,velocity:d,isResolvedFromDuration:h}=G1({...a,velocity:-Fe(a.velocity||0)}),x=d||0,v=u/(2*Math.sqrt(s*f)),b=n-i,m=Fe(Math.sqrt(s/f)),p=Math.abs(b)<5;o||(o=p?ge.restSpeed.granular:ge.restSpeed.default),r||(r=p?ge.restDelta.granular:ge.restDelta.default);let g,y,S,A,w,L;if(v<1)S=Op(m,v),A=(x+v*m*b)/S,g=I=>{let _=Math.exp(-v*m*I);return n-_*(A*Math.sin(S*I)+b*Math.cos(S*I))},w=v*m*A+b*S,L=v*m*b-A*S,y=I=>Math.exp(-v*m*I)*(w*Math.sin(S*I)+L*Math.cos(S*I));else if(v===1){g=_=>n-Math.exp(-m*_)*(b+(x+m*b)*_);let I=x+m*b;y=_=>Math.exp(-m*_)*(m*I*_-x)}else{let I=m*Math.sqrt(v*v-1);g=Rt=>{let $e=Math.exp(-v*m*Rt),je=Math.min(I*Rt,300);return n-$e*((x+v*m*b)*Math.sinh(je)+I*b*Math.cosh(je))/I};let _=(x+v*m*b)/I,Se=v*m*_-b*I,_t=v*m*b-_*I;y=Rt=>{let $e=Math.exp(-v*m*Rt),je=Math.min(I*Rt,300);return $e*(Se*Math.sinh(je)+_t*Math.cosh(je))}}let B={calculatedDuration:h&&c||null,velocity:I=>be(y(I)),next:I=>{if(!h&&v<1){let Se=Math.exp(-v*m*I),_t=Math.sin(S*I),Rt=Math.cos(S*I),$e=n-Se*(A*_t+b*Rt),je=be(Se*(w*_t+L*Rt));return l.done=Math.abs(je)<=o&&Math.abs(n-$e)<=r,l.value=l.done?n:$e,l}let _=g(I);if(h)l.done=I>=c;else{let Se=be(y(I));l.done=Math.abs(Se)<=o&&Math.abs(n-_)<=r}return l.value=l.done?n:_,l},toString:()=>{let I=Math.min(gi(B),2e4),_=ku(Se=>B.next(I*Se).value,I,30);return I+"ms "+_},toTransition:()=>{}};return B}xi.applyToOptions=e=>{let t=tv(e,100,xi);return e.ease=t.ease,e.duration=be(t.duration),e.type="keyframes",e};var X1=5;function Du(e,t,a){let o=Math.max(t-X1,0);return Yn(a-e(o),t-o)}function nl({keyframes:e,velocity:t=0,power:a=.8,timeConstant:o=325,bounceDamping:r=10,bounceStiffness:i=500,modifyTarget:n,min:l,max:s,restDelta:u=.5,restSpeed:f}){let c=e[0],d={done:!1,value:c},h=L=>l!==void 0&&L<l||s!==void 0&&L>s,x=L=>l===void 0?s:s===void 0||Math.abs(l-L)<Math.abs(s-L)?l:s,v=a*t,b=c+v,m=n===void 0?b:n(b);m!==b&&(v=m-c);let p=L=>-v*Math.exp(-L/o),g=L=>m+p(L),y=L=>{let B=p(L),I=g(L);d.done=Math.abs(B)<=u,d.value=d.done?m:I},S,A,w=L=>{h(d.value)&&(S=L,A=xi({keyframes:[d.value,x(d.value)],velocity:Du(g,L,d.value),damping:r,stiffness:i,restDelta:u,restSpeed:f}))};return w(0),{calculatedDuration:null,next:L=>{let B=!1;return!A&&S===void 0&&(B=!0,y(L),w(L)),S!==void 0&&L>=S?A.next(L-S):(!B&&y(L),d)}}}function j1(e,t,a){let o=[],r=a||Qe.mix||Au,i=e.length-1;for(let n=0;n<i;n++){let l=r(e[n],e[n+1]);if(t){let s=Array.isArray(t)?t[n]||me:t;l=Ut(s,l)}o.push(l)}return o}function ov(e,t,{clamp:a=!0,ease:o,mixer:r}={}){let i=e.length;if(ot(i===t.length,"Both input and output ranges must be the same length","range-length"),i===1)return()=>t[0];if(i===2&&t[0]===t[1])return()=>t[1];let n=e[0]===e[1];e[0]>e[i-1]&&(e=[...e].reverse(),t=[...t].reverse());let l=j1(t,o,r),s=l.length,u=f=>{if(n&&f<e[0])return t[0];let c=0;if(s>1)for(;c<e.length-2&&!(f<e[c+1]);c++);let d=$t(e[c],e[c+1],f);return l[c](d)};return a?f=>u(Be(e[0],e[i-1],f)):u}function rv(e,t){let a=e[e.length-1];for(let o=1;o<=t;o++){let r=$t(0,t,o);e.push(F(a,1,r))}}function iv(e){let t=[0];return rv(t,e.length-1),t}function nv(e,t){return e.map(a=>a*t)}function Y1(e,t){return e.map(()=>t||$n).splice(0,e.length-1)}function Jo({duration:e=300,keyframes:t,times:a,ease:o="easeInOut"}){let r=Ip(o)?o.map(vu):vu(o),i={done:!1,value:t[0]},n=nv(a&&a.length===t.length?a:iv(t),e),l=ov(n,t,{ease:Array.isArray(r)?r:Y1(t,r)});return{calculatedDuration:e,next:s=>(i.value=l(s),i.done=s>=e,i)}}var K1=e=>e!==null;function mo(e,{repeat:t,repeatType:a="loop"},o,r=1){let i=e.filter(K1),l=r<0||t&&a!=="loop"&&t%2===1?0:i.length-1;return!l||o===void 0?i[l]:o}var W1={decay:nl,inertia:nl,tween:Jo,keyframes:Jo,spring:xi};function Mu(e){typeof e.type=="string"&&(e.type=W1[e.type])}var ho=class{constructor(){this.updateFinished()}get finished(){return this._finished}updateFinished(){this._finished=new Promise(t=>{this.resolve=t})}notifyFinished(){this.resolve()}then(t,a){return this.finished.then(t,a)}};var Z1=e=>e/100,ka=class extends ho{constructor(t){super(),this.state="idle",this.startTime=null,this.isStopped=!1,this.currentTime=0,this.holdTime=null,this.playbackSpeed=1,this.delayState={done:!1,value:void 0},this.stop=()=>{let{motionValue:a}=this.options;a&&a.updatedAt!==he.now()&&this.tick(he.now()),this.isStopped=!0,this.state!=="idle"&&(this.teardown(),this.options.onStop?.())},this.options=t,this.initAnimation(),this.play(),t.autoplay===!1&&this.pause()}initAnimation(){let{options:t}=this;Mu(t);let{type:a=Jo,repeat:o=0,repeatDelay:r=0,repeatType:i,velocity:n=0}=t,{keyframes:l}=t,s=a||Jo;s!==Jo&&typeof l[0]!="number"&&(this.mixKeyframes=Ut(Z1,Au(l[0],l[1])),l=[0,100]);let u=s({...t,keyframes:l});i==="mirror"&&(this.mirroredGenerator=s({...t,keyframes:[...l].reverse(),velocity:-n})),u.calculatedDuration===null&&(u.calculatedDuration=gi(u));let{calculatedDuration:f}=u;this.calculatedDuration=f,this.resolvedDuration=f+r,this.totalDuration=this.resolvedDuration*(o+1)-r,this.generator=u}updateTime(t){let a=Math.round(t-this.startTime)*this.playbackSpeed;this.holdTime!==null?this.currentTime=this.holdTime:this.currentTime=a}tick(t,a=!1){let{generator:o,totalDuration:r,mixKeyframes:i,mirroredGenerator:n,resolvedDuration:l,calculatedDuration:s}=this;if(this.startTime===null)return o.next(0);let{delay:u=0,keyframes:f,repeat:c,repeatType:d,repeatDelay:h,type:x,onUpdate:v,finalKeyframe:b}=this.options;this.speed>0?this.startTime=Math.min(this.startTime,t):this.speed<0&&(this.startTime=Math.min(t-r/this.speed,this.startTime)),a?this.currentTime=t:this.updateTime(t);let m=this.currentTime-u*(this.playbackSpeed>=0?1:-1),p=this.playbackSpeed>=0?m<0:m>r;this.currentTime=Math.max(m,0),this.state==="finished"&&this.holdTime===null&&(this.currentTime=r);let g=this.currentTime,y=o;if(c){let L=Math.min(this.currentTime,r)/l,B=Math.floor(L),I=L%1;!I&&L>=1&&(I=1),I===1&&B--,B=Math.min(B,c+1),!!(B%2)&&(d==="reverse"?(I=1-I,h&&(I-=h/l)):d==="mirror"&&(y=n)),g=Be(0,1,I)*l}let S;p?(this.delayState.value=f[0],S=this.delayState):S=y.next(g),i&&!p&&(S.value=i(S.value));let{done:A}=S;!p&&s!==null&&(A=this.playbackSpeed>=0?this.currentTime>=r:this.currentTime<=0);let w=this.holdTime===null&&(this.state==="finished"||this.state==="running"&&A);return w&&x!==nl&&(S.value=mo(f,this.options,b,this.speed)),v&&v(S.value),w&&this.finish(),S}then(t,a){return this.finished.then(t,a)}get duration(){return Fe(this.calculatedDuration)}get iterationDuration(){let{delay:t=0}=this.options||{};return this.duration+Fe(t)}get time(){return Fe(this.currentTime)}set time(t){t=be(t),this.currentTime=t,this.startTime===null||this.holdTime!==null||this.playbackSpeed===0?this.holdTime=t:this.driver&&(this.startTime=this.driver.now()-t/this.playbackSpeed),this.driver?this.driver.start(!1):(this.startTime=0,this.state="paused",this.holdTime=t,this.tick(t))}getGeneratorVelocity(){let t=this.currentTime;if(t<=0)return this.options.velocity||0;if(this.generator.velocity)return this.generator.velocity(t);let a=this.generator.next(t).value;return Du(o=>this.generator.next(o).value,t,a)}get speed(){return this.playbackSpeed}set speed(t){let a=this.playbackSpeed!==t;a&&this.driver&&this.updateTime(he.now()),this.playbackSpeed=t,a&&this.driver&&(this.time=Fe(this.currentTime))}play(){if(this.isStopped)return;let{driver:t=ev,startTime:a}=this.options;this.driver||(this.driver=t(r=>this.tick(r))),this.options.onPlay?.();let o=this.driver.now();this.state==="finished"?(this.updateFinished(),this.startTime=o):this.holdTime!==null?this.startTime=o-this.holdTime:this.startTime||(this.startTime=a??o),this.state==="finished"&&this.speed<0&&(this.startTime+=this.calculatedDuration),this.holdTime=null,this.state="running",this.driver.start()}pause(){this.state="paused",this.updateTime(he.now()),this.holdTime=this.currentTime}complete(){this.state!=="running"&&this.play(),this.state="finished",this.holdTime=null}finish(){this.notifyFinished(),this.teardown(),this.state="finished",this.options.onComplete?.()}cancel(){this.holdTime=null,this.startTime=0,this.tick(0),this.teardown(),this.options.onCancel?.()}teardown(){this.state="idle",this.stopDriver(),this.startTime=this.holdTime=null}stopDriver(){this.driver&&(this.driver.stop(),this.driver=void 0)}sample(t){return this.startTime=0,this.tick(t,!0)}attachTimeline(t){return this.options.allowFlatten&&(this.options.type="keyframes",this.options.ease="linear",this.initAnimation()),this.driver?.stop(),t.observe(this)}};function lv(e){for(let t=1;t<e.length;t++)e[t]??(e[t]=e[t-1])}var $o=e=>e*180/Math.PI,Vp=e=>{let t=$o(Math.atan2(e[1],e[0]));return zp(t)},Q1={x:4,y:5,translateX:4,translateY:5,scaleX:0,scaleY:3,scale:e=>(Math.abs(e[0])+Math.abs(e[3]))/2,rotate:Vp,rotateZ:Vp,skewX:e=>$o(Math.atan(e[1])),skewY:e=>$o(Math.atan(e[2])),skew:e=>(Math.abs(e[1])+Math.abs(e[2]))/2},zp=e=>(e=e%360,e<0&&(e+=360),e),sv=Vp,uv=e=>Math.sqrt(e[0]*e[0]+e[1]*e[1]),fv=e=>Math.sqrt(e[4]*e[4]+e[5]*e[5]),J1={x:12,y:13,z:14,translateX:12,translateY:13,translateZ:14,scaleX:uv,scaleY:fv,scale:e=>(uv(e)+fv(e))/2,rotateX:e=>zp($o(Math.atan2(e[6],e[5]))),rotateY:e=>zp($o(Math.atan2(-e[2],e[0]))),rotateZ:sv,rotate:sv,skewX:e=>$o(Math.atan(e[4])),skewY:e=>$o(Math.atan(e[1])),skew:e=>(Math.abs(e[1])+Math.abs(e[4]))/2};function Bu(e){return e.includes("scale")?1:0}function Eu(e,t){if(!e||e==="none")return Bu(t);let a=e.match(/^matrix3d\(([-\d.e\s,]+)\)$/u),o,r;if(a)o=J1,r=a;else{let l=e.match(/^matrix\(([-\d.e\s,]+)\)$/u);o=Q1,r=l}if(!r)return Bu(t);let i=o[t],n=r[1].split(",").map($1);return typeof i=="function"?i(n):n[i]}var dv=(e,t)=>{let{transform:a="none"}=getComputedStyle(e);return Eu(a,t)};function $1(e){return parseFloat(e.trim())}var aa=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],Dt=new Set([...aa,"pathRotation"]);var Fp=e=>e===ea||e===D,eI=new Set(["x","y","z"]),tI=aa.filter(e=>!eI.has(e));function cv(e){let t=[];return tI.forEach(a=>{let o=e.getValue(a);o!==void 0&&(t.push([a,o.get()]),o.set(a.startsWith("scale")?1:0))}),t}var Da={width:({x:e},{paddingLeft:t="0",paddingRight:a="0",boxSizing:o})=>{let r=e.max-e.min;return o==="border-box"?r:r-parseFloat(t)-parseFloat(a)},height:({y:e},{paddingTop:t="0",paddingBottom:a="0",boxSizing:o})=>{let r=e.max-e.min;return o==="border-box"?r:r-parseFloat(t)-parseFloat(a)},top:(e,{top:t})=>parseFloat(t),left:(e,{left:t})=>parseFloat(t),bottom:({y:e},{top:t})=>parseFloat(t)+(e.max-e.min),right:({x:e},{left:t})=>parseFloat(t)+(e.max-e.min),x:(e,{transform:t})=>Eu(t,"x"),y:(e,{transform:t})=>Eu(t,"y")};Da.translateX=Da.x;Da.translateY=Da.y;var er=new Set,Up=!1,qp=!1,Hp=!1;function pv(){if(qp){let e=Array.from(er).filter(o=>o.needsMeasurement),t=new Set(e.map(o=>o.element)),a=new Map;t.forEach(o=>{let r=cv(o);r.length&&(a.set(o,r),o.render())}),e.forEach(o=>o.measureInitialState()),t.forEach(o=>{o.render();let r=a.get(o);r&&r.forEach(([i,n])=>{o.getValue(i)?.set(n)})}),e.forEach(o=>o.measureEndState()),e.forEach(o=>{o.suspendedScrollY!==void 0&&window.scrollTo(0,o.suspendedScrollY)})}qp=!1,Up=!1,er.forEach(e=>e.complete(Hp)),er.clear()}function mv(){er.forEach(e=>{e.readKeyframes(),e.needsMeasurement&&(qp=!0)})}function hv(){Hp=!0,mv(),pv(),Hp=!1}var go=class{constructor(t,a,o,r,i,n=!1){this.state="pending",this.isAsync=!1,this.needsMeasurement=!1,this.unresolvedKeyframes=[...t],this.onComplete=a,this.name=o,this.motionValue=r,this.element=i,this.isAsync=n}scheduleResolve(){this.state="scheduled",this.isAsync?(er.add(this),Up||(Up=!0,O.read(mv),O.resolveKeyframes(pv))):(this.readKeyframes(),this.complete())}readKeyframes(){let{unresolvedKeyframes:t,name:a,element:o,motionValue:r}=this;if(t[0]===null){let i=r?.get(),n=t[t.length-1];if(i!==void 0)t[0]=i;else if(o&&a){let l=o.readValue(a,n);l!=null&&(t[0]=l)}t[0]===void 0&&(t[0]=n),r&&i===void 0&&r.set(t[0])}lv(t)}setFinalKeyframe(){}measureInitialState(){}renderEndStyles(){}measureEndState(){}complete(t=!1){this.state="complete",this.onComplete(this.unresolvedKeyframes,this.finalKeyframe,t),er.delete(this)}cancel(){this.state==="scheduled"&&(er.delete(this),this.state="pending")}resume(){this.state==="pending"&&this.scheduleResolve()}};var gv=e=>e.startsWith("--");function Ru(e,t,a){gv(t)?e.style.setProperty(t,a):e.style[t]=a}var xv={};function Pu(e,t){let a=jn(e);return()=>xv[t]??a()}var yv=Pu(()=>window.ScrollTimeline!==void 0,"scrollTimeline");var Ou=Pu(()=>{try{document.createElement("div").animate({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0},"linearEasing");var tr=([e,t,a,o])=>`cubic-bezier(${e}, ${t}, ${a}, ${o})`;var _p={linear:"linear",ease:"ease",easeIn:"ease-in",easeOut:"ease-out",easeInOut:"ease-in-out",circIn:tr([0,.65,.55,1]),circOut:tr([.55,0,1,.45]),backIn:tr([.31,.01,.66,-.59]),backOut:tr([.33,1.53,.69,.99])};function Np(e,t){if(e)return typeof e=="function"?Ou()?ku(e,t):"ease-out":el(e)?tr(e):Array.isArray(e)?e.map(a=>Np(a,t)||_p.easeOut):_p[e]}function vv(e,t,a,{delay:o=0,duration:r=300,repeat:i=0,repeatType:n="loop",ease:l="easeOut",times:s}={},u=void 0){let f={[t]:a};s&&(f.offset=s);let c=Np(l,r);Array.isArray(c)&&(f.easing=c);let d={delay:o,duration:r,easing:Array.isArray(c)?"linear":c,fill:"both",iterations:i+1,direction:n==="reverse"?"alternate":"normal"};return u&&(d.pseudoElement=u),e.animate(f,d)}function Vu(e){return typeof e=="function"&&"applyToOptions"in e}function Lv({type:e,...t}){return Vu(e)&&Ou()?e.applyToOptions(t):(t.duration??(t.duration=300),t.ease??(t.ease="easeOut"),t)}var yi=class extends ho{constructor(t){if(super(),this.finishedTime=null,this.isStopped=!1,this.manualStartTime=null,!t)return;let{element:a,name:o,keyframes:r,pseudoElement:i,allowFlatten:n=!1,finalKeyframe:l,onComplete:s}=t;this.isPseudoElement=!!i,this.allowFlatten=n,this.options=t,ot(typeof t.type!="string",`Mini animate() doesn't support "type" as a string.`,"mini-spring");let u=Lv(t);this.animation=vv(a,o,r,u,i),u.autoplay===!1&&this.animation.pause(),this.animation.onfinish=()=>{if(this.finishedTime=this.time,!i){let f=mo(r,this.options,l,this.speed);this.updateMotionValue&&this.updateMotionValue(f),Ru(a,o,f),this.animation.cancel()}s?.(),this.notifyFinished()}}play(){this.isStopped||(this.manualStartTime=null,this.animation.play(),this.state==="finished"&&this.updateFinished())}pause(){this.animation.pause()}complete(){this.animation.finish?.()}cancel(){try{this.animation.cancel()}catch{}}stop(){if(this.isStopped)return;this.isStopped=!0;let{state:t}=this;t==="idle"||t==="finished"||(this.updateMotionValue?this.updateMotionValue():this.commitStyles(),this.isPseudoElement||this.cancel())}commitStyles(){let t=this.options?.element;!this.isPseudoElement&&t?.isConnected&&this.animation.commitStyles?.()}get duration(){let t=this.animation.effect?.getComputedTiming?.().duration||0;return Fe(Number(t))}get iterationDuration(){let{delay:t=0}=this.options||{};return this.duration+Fe(t)}get time(){return Fe(Number(this.animation.currentTime)||0)}set time(t){let a=this.finishedTime!==null;this.manualStartTime=null,this.finishedTime=null,this.animation.currentTime=be(t),a&&this.animation.pause()}get speed(){return this.animation.playbackRate}set speed(t){t<0&&(this.finishedTime=null),this.animation.playbackRate=t}get state(){return this.finishedTime!==null?"finished":this.animation.playState}get startTime(){return this.manualStartTime??Number(this.animation.startTime)}set startTime(t){this.manualStartTime=this.animation.startTime=t}attachTimeline({timeline:t,rangeStart:a,rangeEnd:o,observe:r}){return this.allowFlatten&&this.animation.effect?.updateTiming({easing:"linear"}),this.animation.onfinish=null,t&&yv()?(this.animation.timeline=t,a&&(this.animation.rangeStart=a),o&&(this.animation.rangeEnd=o),me):r(this)}};var wv={anticipate:Wn,backInOut:Kn,circInOut:Jn};function aI(e){return e in wv}function bv(e){typeof e.ease=="string"&&aI(e.ease)&&(e.ease=wv[e.ease])}var Gp=10,zu=class extends yi{constructor(t){bv(t),Mu(t),super(t),t.startTime!==void 0&&t.autoplay!==!1&&(this.startTime=t.startTime),this.options=t}updateMotionValue(t){let{motionValue:a,onUpdate:o,onComplete:r,element:i,...n}=this.options;if(!a)return;if(t!==void 0){a.set(t);return}let l=new ka({...n,autoplay:!1}),s=Math.max(Gp,he.now()-this.startTime),u=Be(0,Gp,s-Gp),f=l.sample(s).value,{name:c}=this.options;i&&c&&Ru(i,c,f),a.setWithVelocity(l.sample(Math.max(0,s-u)).value,f,u),l.stop()}};var Xp=(e,t)=>t==="zIndex"?!1:!!(typeof e=="number"||Array.isArray(e)||typeof e=="string"&&(Ee.test(e)||e==="0")&&!e.startsWith("url("));function oI(e){let t=e[0];if(e.length===1)return!0;for(let a=0;a<e.length;a++)if(e[a]!==t)return!0}function Sv(e,t,a,o){let r=e[0];if(r===null)return!1;if(t==="display"||t==="visibility")return!0;let i=e[e.length-1],n=Xp(r,t),l=Xp(i,t);return Ia(n===l,`You are trying to animate ${t} from "${r}" to "${i}". "${n?i:r}" is not an animatable value.`,"value-not-animatable"),!n||!l?!1:oI(e)||(a==="spring"||Vu(a))&&o}function ll(e){e.duration=0,e.type="keyframes"}var Fu=new Set(["opacity","clipPath","filter","transform","backgroundColor"]);var rI=/^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;function Cv(e){for(let t=0;t<e.length;t++)if(typeof e[t]=="string"&&rI.test(e[t]))return!0;return!1}var iI=new Set(["color","backgroundColor","outlineColor","fill","stroke","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor"]),nI=jn(()=>Object.hasOwnProperty.call(Element.prototype,"animate"));function Iv(e){let{motionValue:t,name:a,repeatDelay:o,repeatType:r,damping:i,type:n,keyframes:l}=e,s=t?.owner?.current;if(!(s instanceof HTMLElement)&&!(s instanceof SVGElement))return!1;let{onUpdate:u,transformTemplate:f}=t.owner.getProps();return nI()&&a&&(Fu.has(a)||iI.has(a)&&Cv(l))&&(a!=="transform"||!f)&&!u&&!o&&r!=="mirror"&&i!==0&&n!=="inertia"}var lI=40,Uu=class extends ho{constructor({autoplay:t=!0,delay:a=0,type:o="keyframes",repeat:r=0,repeatDelay:i=0,repeatType:n="loop",keyframes:l,name:s,motionValue:u,element:f,...c}){super(),this.stop=()=>{this._animation&&(this._animation.stop(),this.stopTimeline?.()),this.keyframeResolver?.cancel()},this.createdAt=he.now();let d={autoplay:t,delay:a,type:o,repeat:r,repeatDelay:i,repeatType:n,name:s,motionValue:u,element:f,...c},h=f?.KeyframeResolver||go;this.keyframeResolver=new h(l,(x,v,b)=>this.onKeyframesResolved(x,v,d,!b),s,u,f),this.keyframeResolver?.scheduleResolve()}onKeyframesResolved(t,a,o,r){this.keyframeResolver=void 0;let{name:i,type:n,velocity:l,delay:s,isHandoff:u,onUpdate:f}=o;this.resolvedAt=he.now();let c=!0;Sv(t,i,n,l)||(c=!1,(Qe.instantAnimations||!s)&&f?.(mo(t,o,a)),t[0]=t[t.length-1],ll(o),o.repeat=0);let h={startTime:r?this.resolvedAt?this.resolvedAt-this.createdAt>lI?this.resolvedAt:this.createdAt:this.createdAt:void 0,finalKeyframe:a,...o,keyframes:t},x=c&&!u&&Iv(h),v=h.motionValue?.owner?.current,b;if(x)try{b=new zu({...h,element:v})}catch{b=new ka(h)}else b=new ka(h);b.finished.then(()=>{this.notifyFinished()}).catch(me),this.pendingTimeline&&(this.stopTimeline=b.attachTimeline(this.pendingTimeline),this.pendingTimeline=void 0),this._animation=b}get finished(){return this._animation?this.animation.finished:this._finished}then(t,a){return this.finished.finally(t).then(()=>{})}get animation(){return this._animation||(this.keyframeResolver?.resume(),hv()),this._animation}get duration(){return this.animation.duration}get iterationDuration(){return this.animation.iterationDuration}get time(){return this.animation.time}set time(t){this.animation.time=t}get speed(){return this.animation.speed}get state(){return this.animation.state}set speed(t){this.animation.speed=t}get startTime(){return this.animation.startTime}attachTimeline(t){return this._animation?this.stopTimeline=this.animation.attachTimeline(t):this.pendingTimeline=t,()=>this.stop()}play(){this.animation.play()}pause(){this.animation.pause()}complete(){this.animation.complete()}cancel(){this._animation&&this.animation.cancel(),this.keyframeResolver?.cancel()}};function qu(e,t,a,o=0,r=1){let i=Array.from(e).sort((u,f)=>u.sortNodePosition(f)).indexOf(t),n=e.size,l=(n-1)*o;return typeof a=="function"?a(i,n):r===1?i*o:l-i*o}var Tv=30,sI=e=>!isNaN(parseFloat(e)),Av={current:void 0},jp=class{constructor(t,a={}){this.canTrackVelocity=null,this.events={},this.updateAndNotify=o=>{let r=he.now();if(this.updatedAt!==r&&this.setPrevFrameValue(),this.prev=this.current,this.setCurrent(o),this.current!==this.prev&&(this.events.change?.notify(this.current),this.dependents))for(let i of this.dependents)i.dirty()},this.hasAnimated=!1,this.setCurrent(t),this.owner=a.owner}setCurrent(t){this.current=t,this.updatedAt=he.now(),this.canTrackVelocity===null&&t!==void 0&&(this.canTrackVelocity=sI(this.current))}setPrevFrameValue(t=this.current){this.prevFrameValue=t,this.prevUpdatedAt=this.updatedAt}onChange(t){return this.on("change",t)}on(t,a){this.events[t]||(this.events[t]=new Ta);let o=this.events[t].add(a);return t==="change"?()=>{o(),O.read(()=>{this.events.change.getSize()||this.stop()})}:o}clearListeners(){for(let t in this.events)this.events[t].clear()}attach(t,a){this.passiveEffect=t,this.stopPassiveEffect=a}set(t){this.passiveEffect?this.passiveEffect(t,this.updateAndNotify):this.updateAndNotify(t)}setWithVelocity(t,a,o){this.set(a),this.prev=void 0,this.prevFrameValue=t,this.prevUpdatedAt=this.updatedAt-o}jump(t,a=!0){this.updateAndNotify(t),this.prev=t,this.prevUpdatedAt=this.prevFrameValue=void 0,a&&this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}dirty(){this.events.change?.notify(this.current)}addDependent(t){this.dependents||(this.dependents=new Set),this.dependents.add(t)}removeDependent(t){this.dependents&&this.dependents.delete(t)}get(){return Av.current&&Av.current.push(this),this.current}getPrevious(){return this.prev}getVelocity(){let t=he.now();if(!this.canTrackVelocity||this.prevFrameValue===void 0||t-this.updatedAt>Tv)return 0;let a=Math.min(this.updatedAt-this.prevUpdatedAt,Tv);return Yn(parseFloat(this.current)-parseFloat(this.prevFrameValue),a)}start(t){return this.stop(),new Promise(a=>{this.hasAnimated=!0,this.animation=t(a),this.events.animationStart&&this.events.animationStart.notify()}).then(()=>{this.events.animationComplete&&this.events.animationComplete.notify(),this.clearAnimation()})}stop(){this.animation&&(this.animation.stop(),this.events.animationCancel&&this.events.animationCancel.notify()),this.clearAnimation()}isAnimating(){return!!this.animation}clearAnimation(){delete this.animation}destroy(){this.dependents?.clear(),this.events.destroy?.notify(),this.clearListeners(),this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}};function qt(e,t){return new jp(e,t)}function Hu(e,t){if(e?.inherit&&t){let{inherit:a,...o}=e;return{...t,...o}}return e}function vi(e,t){let a=e?.[t]??e?.default??e;return a!==e?Hu(a,e):a}var uI={type:"spring",stiffness:500,damping:25,restSpeed:10},fI=e=>({type:"spring",stiffness:550,damping:e===0?2*Math.sqrt(550):30,restSpeed:10}),dI={type:"keyframes",duration:.8},cI={type:"keyframes",ease:[.25,.1,.35,1],duration:.3},kv=(e,{keyframes:t})=>t.length>2?dI:Dt.has(e)?e.startsWith("scale")?fI(t[1]):uI:cI;var pI=new Set(["when","delay","delayChildren","staggerChildren","staggerDirection","repeat","repeatType","repeatDelay","from","elapsed"]);function Dv(e){for(let t in e)if(!pI.has(t))return!0;return!1}var ar=(e,t,a,o={},r,i)=>n=>{let l=vi(o,e)||{},s=l.delay||o.delay||0,{elapsed:u=0}=o;u=u-be(s);let f={keyframes:Array.isArray(a)?a:[null,a],ease:"easeOut",velocity:t.getVelocity(),...l,delay:-u,onUpdate:d=>{t.set(d),l.onUpdate&&l.onUpdate(d)},onComplete:()=>{n(),l.onComplete&&l.onComplete()},name:e,motionValue:t,element:i?void 0:r};Dv(l)||Object.assign(f,kv(e,f)),f.duration&&(f.duration=be(f.duration)),f.repeatDelay&&(f.repeatDelay=be(f.repeatDelay)),f.from!==void 0&&(f.keyframes[0]=f.from);let c=!1;if((f.type===!1||f.duration===0&&!f.repeatDelay)&&(ll(f),f.delay===0&&(c=!0)),(Qe.instantAnimations||Qe.skipAnimations||r?.shouldSkipAnimations||l.skipAnimations)&&(c=!0,ll(f),f.delay=0),f.allowFlatten=!l.type&&!l.ease,c&&!i&&t.get()!==void 0){let d=mo(f.keyframes,l);if(d!==void 0){O.update(()=>{f.onUpdate(d),f.onComplete()});return}}return l.isSync?new ka(f):new Uu(f)};var mI=/^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;function hI(e){let t=mI.exec(e);if(!t)return[,];let[,a,o,r]=t;return[`--${a??o}`,r]}var gI=4;function Yp(e,t,a=1){ot(a<=gI,`Max CSS variable fallback depth detected in property "${e}". This may indicate a circular fallback dependency.`,"max-css-var-depth");let[o,r]=hI(e);if(!o)return;let i=window.getComputedStyle(t).getPropertyValue(o);if(i){let n=i.trim();return Nn(n)?parseFloat(n):n}return ci(r)?Yp(r,t,a+1):r}function Mv(e){let t=[{},{}];return e?.values.forEach((a,o)=>{t[0][o]=a.get(),t[1][o]=a.getVelocity()}),t}function or(e,t,a,o){if(typeof t=="function"){let[r,i]=Mv(o);t=t(a!==void 0?a:e.custom,r,i)}if(typeof t=="string"&&(t=e.variants&&e.variants[t]),typeof t=="function"){let[r,i]=Mv(o);t=t(a!==void 0?a:e.custom,r,i)}return t}function pt(e,t,a){let o=e.getProps();return or(o,t,a!==void 0?a:o.custom,e)}var _u=new Set(["width","height","top","left","right","bottom",...aa]);var sl=e=>Array.isArray(e);function xI(e,t,a){e.hasValue(t)?e.getValue(t).set(a):e.addValue(t,qt(a))}function yI(e){return sl(e)?e[e.length-1]||0:e}function Bv(e,t){let a=pt(e,t),{transitionEnd:o={},transition:r={},...i}=a||{};i={...i,...o};for(let n in i){let l=yI(i[n]);xI(e,n,l)}}var Z=e=>!!(e&&e.getVelocity);function Ev(e){return!!(Z(e)&&e.add)}function Li(e,t){let a=e.getValue("willChange");if(Ev(a))return a.add(t);if(!a&&Qe.WillChange){let o=new Qe.WillChange("auto");e.addValue("willChange",o),o.add(t)}}function wi(e){return e.replace(/([A-Z])/g,t=>`-${t.toLowerCase()}`)}var Rv="framerAppearId",ul="data-"+wi(Rv);function Nu(e){return e.props[ul]}function vI({protectedKeys:e,needsAnimating:t},a){let o=e.hasOwnProperty(a)&&t[a]!==!0;return t[a]=!1,o}function Gu(e,t,{delay:a=0,transitionOverride:o,type:r}={}){let{transition:i,transitionEnd:n,...l}=t,s=e.getDefaultTransition();i=i?Hu(i,s):s;let u=i?.reduceMotion,f=i?.skipAnimations;o&&(i=o);let c=[],d=r&&e.animationState&&e.animationState.getState()[r],h=i?.path;h&&h.animateVisualElement(e,l,i,a,c);for(let x in l){let v=e.getValue(x,e.latestValues[x]??null),b=l[x];if(b===void 0||d&&vI(d,x))continue;let m={delay:a,...vi(i||{},x)};f&&(m.skipAnimations=!0);let p=v.get();if(p!==void 0&&!v.isAnimating()&&!Array.isArray(b)&&b===p&&!m.velocity){O.update(()=>v.set(b));continue}let g=!1;if(window.MotionHandoffAnimation){let A=Nu(e);if(A){let w=window.MotionHandoffAnimation(A,x,O);w!==null&&(m.startTime=w,g=!0)}}Li(e,x);let y=u??e.shouldReduceMotion;v.start(ar(x,v,b,y&&_u.has(x)?{type:!1}:m,e,g));let S=v.animation;S&&c.push(S)}if(n){let x=()=>O.update(()=>{n&&Bv(e,n)});c.length?Promise.all(c).then(x):x()}return c}function Xu(e,t,a={}){let o=pt(e,t,a.type==="exit"?e.presenceContext?.custom:void 0),{transition:r=e.getDefaultTransition()||{}}=o||{};a.transitionOverride&&(r=a.transitionOverride);let i=o?()=>Promise.all(Gu(e,o,a)):()=>Promise.resolve(),n=e.variantChildren&&e.variantChildren.size?(s=0)=>{let{delayChildren:u=0,staggerChildren:f,staggerDirection:c}=r;return LI(e,t,s,u,f,c,a)}:()=>Promise.resolve(),{when:l}=r;if(l){let[s,u]=l==="beforeChildren"?[i,n]:[n,i];return s().then(()=>u())}else return Promise.all([i(),n(a.delay)])}function LI(e,t,a=0,o=0,r=0,i=1,n){let l=[];for(let s of e.variantChildren)s.notify("AnimationStart",t),l.push(Xu(s,t,{...n,delay:a+(typeof o=="function"?0:o)+qu(e.variantChildren,s,o,r,i)}).then(()=>s.notify("AnimationComplete",t)));return Promise.all(l)}function Pv(e,t,a={}){e.notify("AnimationStart",t);let o;if(Array.isArray(t)){let r=t.map(i=>Xu(e,i,a));o=Promise.all(r)}else if(typeof t=="string")o=Xu(e,t,a);else{let r=typeof t=="function"?pt(e,t,a.custom):t;o=Promise.all(Gu(e,r,a))}return o.then(()=>{e.notify("AnimationComplete",t)})}var Ov={test:e=>e==="auto",parse:e=>e};var ju=e=>t=>t.test(e);var Kp=[ea,D,Xe,kt,Dp,kp,Ov],Wp=e=>Kp.find(ju(e));function Vv(e){return typeof e=="number"?e===0:e!==null?e==="none"||e==="0"||Xn(e):!0}var wI=new Set(["brightness","contrast","saturate","opacity"]);function bI(e){let[t,a]=e.slice(0,-1).split("(");if(t==="drop-shadow")return e;let[o]=a.match(pi)||[];if(!o)return e;let r=a.replace(o,""),i=wI.has(t)?1:0;return o!==a&&(i*=100),t+"("+i+r+")"}var SI=/\b([a-z-]*)\(.*?\)/gu,fl={...Ee,getAnimatableNone:e=>{let t=e.match(SI);return t?t.map(bI).join(" "):e}};var dl={...Ee,getAnimatableNone:e=>{let t=Ee.parse(e);return Ee.createTransformer(e)(t.map(o=>typeof o=="number"?0:typeof o=="object"?{...o,alpha:1}:o))}};var Zp={...ea,transform:Math.round};var zv={rotate:kt,pathRotation:kt,rotateX:kt,rotateY:kt,rotateZ:kt,scale:ol,scaleX:ol,scaleY:ol,scaleZ:ol,skew:kt,skewX:kt,skewY:kt,distance:D,translateX:D,translateY:D,translateZ:D,x:D,y:D,z:D,perspective:D,transformPerspective:D,opacity:Aa,originX:Cu,originY:Cu,originZ:D};var rr={borderWidth:D,borderTopWidth:D,borderRightWidth:D,borderBottomWidth:D,borderLeftWidth:D,borderRadius:D,borderTopLeftRadius:D,borderTopRightRadius:D,borderBottomRightRadius:D,borderBottomLeftRadius:D,width:D,maxWidth:D,height:D,maxHeight:D,top:D,right:D,bottom:D,left:D,inset:D,insetBlock:D,insetBlockStart:D,insetBlockEnd:D,insetInline:D,insetInlineStart:D,insetInlineEnd:D,padding:D,paddingTop:D,paddingRight:D,paddingBottom:D,paddingLeft:D,paddingBlock:D,paddingBlockStart:D,paddingBlockEnd:D,paddingInline:D,paddingInlineStart:D,paddingInlineEnd:D,margin:D,marginTop:D,marginRight:D,marginBottom:D,marginLeft:D,marginBlock:D,marginBlockStart:D,marginBlockEnd:D,marginInline:D,marginInlineStart:D,marginInlineEnd:D,fontSize:D,backgroundPositionX:D,backgroundPositionY:D,...zv,zIndex:Zp,fillOpacity:Aa,strokeOpacity:Aa,numOctaves:Zp};var CI={...rr,color:ue,backgroundColor:ue,outlineColor:ue,fill:ue,stroke:ue,borderColor:ue,borderTopColor:ue,borderRightColor:ue,borderBottomColor:ue,borderLeftColor:ue,filter:fl,WebkitFilter:fl,mask:dl,WebkitMask:dl},Yu=e=>CI[e];var II=new Set([fl,dl]);function Ku(e,t){let a=Yu(e);return II.has(a)||(a=Ee),a.getAnimatableNone?a.getAnimatableNone(t):void 0}var TI=new Set(["auto","none","0"]);function Fv(e,t,a){let o=0,r;for(;o<e.length&&!r;){let i=e[o];typeof i=="string"&&!TI.has(i)&&po(i).values.length&&(r=e[o]),o++}if(r&&a)for(let i of t)e[i]=Ku(a,r)}var Wu=class extends go{constructor(t,a,o,r,i){super(t,a,o,r,i,!0)}readKeyframes(){let{unresolvedKeyframes:t,element:a,name:o}=this;if(!a||!a.current)return;super.readKeyframes();for(let f=0;f<t.length;f++){let c=t[f];if(typeof c=="string"&&(c=c.trim(),ci(c))){let d=Yp(c,a.current);d!==void 0&&(t[f]=d),f===t.length-1&&(this.finalKeyframe=c)}}if(this.resolveNoneKeyframes(),!_u.has(o)||t.length!==2)return;let[r,i]=t,n=Wp(r),l=Wp(i),s=Tp(r),u=Tp(i);if(s!==u&&Da[o]){this.needsMeasurement=!0;return}if(n!==l)if(Fp(n)&&Fp(l))for(let f=0;f<t.length;f++){let c=t[f];typeof c=="string"&&(t[f]=parseFloat(c))}else Da[o]&&(this.needsMeasurement=!0)}resolveNoneKeyframes(){let{unresolvedKeyframes:t,name:a}=this,o=[];for(let r=0;r<t.length;r++)(t[r]===null||Vv(t[r]))&&o.push(r);o.length&&Fv(t,o,a)}measureInitialState(){let{element:t,unresolvedKeyframes:a,name:o}=this;if(!t||!t.current)return;o==="height"&&(this.suspendedScrollY=window.pageYOffset),this.measuredOrigin=Da[o](t.measureViewportBox(),window.getComputedStyle(t.current)),a[0]=this.measuredOrigin;let r=a[a.length-1];r!==void 0&&t.getValue(o,r).jump(r,!1)}measureEndState(){let{element:t,name:a,unresolvedKeyframes:o}=this;if(!t||!t.current)return;let r=t.getValue(a);r&&r.jump(this.measuredOrigin,!1);let i=o.length-1,n=o[i];o[i]=Da[a](t.measureViewportBox(),window.getComputedStyle(t.current)),n!==null&&this.finalKeyframe===void 0&&(this.finalKeyframe=n),this.removedTransforms?.length&&this.removedTransforms.forEach(([l,s])=>{t.getValue(l).set(s)}),this.resolveNoneKeyframes()}};var cl=["borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius"];function Zu(e,t,a){if(e==null)return[];if(e instanceof EventTarget)return[e];if(typeof e=="string"){let o=document;t&&(o=t.current);let r=a?.[e]??o.querySelectorAll(e);return r?Array.from(r):[]}return Array.from(e).filter(o=>o!=null)}var pl=(e,t)=>t&&typeof e=="number"?t.transform(e):e;function ir(e){return Gn(e)&&"offsetHeight"in e&&!("ownerSVGElement"in e)}var{schedule:nr,cancel:AI}=Lu(queueMicrotask,!1);var Mt={x:!1,y:!1};function Qu(){return Mt.x||Mt.y}function Qp(e){return e==="x"||e==="y"?Mt[e]?null:(Mt[e]=!0,()=>{Mt[e]=!1}):Mt.x||Mt.y?null:(Mt.x=Mt.y=!0,()=>{Mt.x=Mt.y=!1})}function Ju(e,t){let a=Zu(e),o=new AbortController,r={passive:!0,...t,signal:o.signal};return[a,r,()=>o.abort()]}function kI(e){return!(e.pointerType==="touch"||Qu())}function Jp(e,t,a={}){let[o,r,i]=Ju(e,a);return o.forEach(n=>{let l=!1,s=!1,u,f=()=>{n.removeEventListener("pointerleave",x)},c=b=>{u&&(u(b),u=void 0),f()},d=b=>{l=!1,window.removeEventListener("pointerup",d),window.removeEventListener("pointercancel",d),s&&(s=!1,c(b))},h=()=>{l=!0,window.addEventListener("pointerup",d,r),window.addEventListener("pointercancel",d,r)},x=b=>{if(b.pointerType!=="touch"){if(l){s=!0;return}c(b)}},v=b=>{if(!kI(b))return;s=!1;let m=t(n,b);typeof m=="function"&&(u=m,n.addEventListener("pointerleave",x,r))};n.addEventListener("pointerenter",v,r),n.addEventListener("pointerdown",h,r)}),i}var $p=(e,t)=>t?e===t?!0:$p(e,t.parentElement):!1;var lr=e=>e.pointerType==="mouse"?typeof e.button!="number"||e.button<=0:e.isPrimary!==!1;var DI=new Set(["BUTTON","INPUT","SELECT","TEXTAREA","A"]);function em(e){return DI.has(e.tagName)||e.isContentEditable===!0}var MI=new Set(["INPUT","SELECT","TEXTAREA"]);function tm(e){return MI.has(e.tagName)||e.isContentEditable===!0}var bi=new WeakSet;function Uv(e){return t=>{t.key==="Enter"&&e(t)}}function am(e,t){e.dispatchEvent(new PointerEvent("pointer"+t,{isPrimary:!0,bubbles:!0}))}var qv=(e,t)=>{let a=e.currentTarget;if(!a)return;let o=Uv(()=>{if(bi.has(a))return;am(a,"down");let r=Uv(()=>{am(a,"up")}),i=()=>am(a,"cancel");a.addEventListener("keyup",r,t),a.addEventListener("blur",i,t)});a.addEventListener("keydown",o,t),a.addEventListener("blur",()=>a.removeEventListener("keydown",o),t)};function Hv(e){return lr(e)&&!Qu()}var _v=new WeakSet;function om(e,t,a={}){let[o,r,i]=Ju(e,a),n=l=>{let s=l.currentTarget;if(!Hv(l)||_v.has(l))return;bi.add(s),a.stopPropagation&&_v.add(l);let u=t(s,l),f={...r,capture:!0},c=(x,v)=>{window.removeEventListener("pointerup",d,f),window.removeEventListener("pointercancel",h,f),bi.has(s)&&bi.delete(s),Hv(x)&&typeof u=="function"&&u(x,{success:v})},d=x=>{c(x,s===window||s===document||a.useGlobalTarget||$p(s,x.target))},h=x=>{c(x,!1)};window.addEventListener("pointerup",d,f),window.addEventListener("pointercancel",h,f)};return o.forEach(l=>{(a.useGlobalTarget?window:l).addEventListener("pointerdown",n,r),ir(l)&&(l.addEventListener("focus",u=>qv(u,r)),!em(l)&&!l.hasAttribute("tabindex")&&(l.tabIndex=0))}),i}function Si(e){return Gn(e)&&"ownerSVGElement"in e}var $u=new WeakMap,ef,Nv=(e,t,a)=>(o,r)=>r&&r[0]?r[0][e+"Size"]:Si(o)&&"getBBox"in o?o.getBBox()[t]:o[a],BI=Nv("inline","width","offsetWidth"),EI=Nv("block","height","offsetHeight");function RI({target:e,borderBoxSize:t}){$u.get(e)?.forEach(a=>{a(e,{get width(){return BI(e,t)},get height(){return EI(e,t)}})})}function PI(e){e.forEach(RI)}function OI(){typeof ResizeObserver>"u"||(ef=new ResizeObserver(PI))}function Gv(e,t){ef||OI();let a=Zu(e);return a.forEach(o=>{let r=$u.get(o);r||(r=new Set,$u.set(o,r)),r.add(t),ef?.observe(o)}),()=>{a.forEach(o=>{let r=$u.get(o);r?.delete(t),r?.size||ef?.unobserve(o)})}}var tf=new Set,Ci;function VI(){Ci=()=>{let e={get width(){return window.innerWidth},get height(){return window.innerHeight}};tf.forEach(t=>t(e))},window.addEventListener("resize",Ci)}function Xv(e){return tf.add(e),Ci||VI(),()=>{tf.delete(e),!tf.size&&typeof Ci=="function"&&(window.removeEventListener("resize",Ci),Ci=void 0)}}function af(e,t){return typeof e=="function"?Xv(e):Gv(e,t)}var sr={value:null,addProjectionMetrics:null};function jv(e){return Si(e)&&e.tagName==="svg"}var zI=[...Kp,ue,Ee],Yv=e=>zI.find(ju(e));var rm=()=>({translate:0,scale:1,origin:0,originPoint:0}),xo=()=>({x:rm(),y:rm()}),im=()=>({min:0,max:0}),fe=()=>({x:im(),y:im()});var Kv=new WeakMap;function Ma(e){return e!==null&&typeof e=="object"&&typeof e.start=="function"}function oa(e){return typeof e=="string"||Array.isArray(e)}var of=["animate","whileInView","whileFocus","whileHover","whileTap","whileDrag","exit"],ml=["initial",...of];function yo(e){return Ma(e.animate)||ml.some(t=>oa(e[t]))}function hl(e){return!!(yo(e)||e.variants)}function Wv(e,t,a){for(let o in t){let r=t[o],i=a[o];if(Z(r))e.addValue(o,r);else if(Z(i))e.addValue(o,qt(r,{owner:e}));else if(i!==r)if(e.hasValue(o)){let n=e.getValue(o);n.liveStyle===!0?n.jump(r):n.hasAnimated||n.set(r)}else{let n=e.getStaticValue(o);e.addValue(o,qt(n!==void 0?n:r,{owner:e}))}}for(let o in a)t[o]===void 0&&e.removeValue(o);return t}var gl={current:null},rf={current:!1};var FI=typeof window<"u";function Zv(){if(rf.current=!0,!!FI)if(window.matchMedia){let e=window.matchMedia("(prefers-reduced-motion)"),t=()=>gl.current=e.matches;e.addEventListener("change",t),t()}else gl.current=!1}var Qv=["AnimationStart","AnimationComplete","Update","BeforeLayoutMeasure","LayoutMeasure","LayoutAnimationStart","LayoutAnimationComplete"],nf={};function yl(e){nf=e}function nm(){return nf}var xl=class{scrapeMotionValuesFromProps(t,a,o){return{}}constructor({parent:t,props:a,presenceContext:o,reducedMotionConfig:r,skipAnimations:i,blockInitialAnimation:n,visualState:l},s={}){this.current=null,this.children=new Set,this.isVariantNode=!1,this.isControllingVariants=!1,this.shouldReduceMotion=null,this.shouldSkipAnimations=!1,this.values=new Map,this.KeyframeResolver=go,this.features={},this.valueSubscriptions=new Map,this.prevMotionValues={},this.hasBeenMounted=!1,this.events={},this.propEventSubscriptions={},this.notifyUpdate=()=>this.notify("Update",this.latestValues),this.render=()=>{this.current&&(this.triggerBuild(),this.renderInstance(this.current,this.renderState,this.props.style,this.projection))},this.renderScheduledAt=0,this.scheduleRender=()=>{let h=he.now();this.renderScheduledAt<h&&(this.renderScheduledAt=h,O.render(this.render,!1,!0))};let{latestValues:u,renderState:f}=l;this.latestValues=u,this.baseTarget={...u},this.initialValues=a.initial?{...u}:{},this.renderState=f,this.parent=t,this.props=a,this.presenceContext=o,this.depth=t?t.depth+1:0,this.reducedMotionConfig=r,this.skipAnimationsConfig=i,this.options=s,this.blockInitialAnimation=!!n,this.isControllingVariants=yo(a),this.isVariantNode=hl(a),this.isVariantNode&&(this.variantChildren=new Set),this.manuallyAnimateOnMount=!!(t&&t.current);let{willChange:c,...d}=this.scrapeMotionValuesFromProps(a,{},this);for(let h in d){let x=d[h];u[h]!==void 0&&Z(x)&&x.set(u[h])}}mount(t){if(this.hasBeenMounted)for(let a in this.initialValues)this.values.get(a)?.jump(this.initialValues[a]),this.latestValues[a]=this.initialValues[a];this.current=t,Kv.set(t,this),this.projection&&!this.projection.instance&&this.projection.mount(t),this.parent&&this.isVariantNode&&!this.isControllingVariants&&(this.removeFromVariantTree=this.parent.addVariantChild(this)),this.values.forEach((a,o)=>this.bindToMotionValue(o,a)),this.reducedMotionConfig==="never"?this.shouldReduceMotion=!1:this.reducedMotionConfig==="always"?this.shouldReduceMotion=!0:(rf.current||Zv(),this.shouldReduceMotion=gl.current),this.shouldSkipAnimations=this.skipAnimationsConfig??!1,this.parent?.addChild(this),this.update(this.props,this.presenceContext),this.hasBeenMounted=!0}unmount(){this.projection&&this.projection.unmount(),rt(this.notifyUpdate),rt(this.render),this.valueSubscriptions.forEach(t=>t()),this.valueSubscriptions.clear(),this.removeFromVariantTree&&this.removeFromVariantTree(),this.parent?.removeChild(this);for(let t in this.events)this.events[t].clear();for(let t in this.features){let a=this.features[t];a&&(a.unmount(),a.isMounted=!1)}this.current=null}addChild(t){this.children.add(t),this.enteringChildren??(this.enteringChildren=new Set),this.enteringChildren.add(t)}removeChild(t){this.children.delete(t),this.enteringChildren&&this.enteringChildren.delete(t)}bindToMotionValue(t,a){if(this.valueSubscriptions.has(t)&&this.valueSubscriptions.get(t)(),a.accelerate&&Fu.has(t)&&this.current instanceof HTMLElement){let{factory:n,keyframes:l,times:s,ease:u,duration:f}=a.accelerate,c=new yi({element:this.current,name:t,keyframes:l,times:s,ease:u,duration:be(f)}),d=n(c);this.valueSubscriptions.set(t,()=>{d(),c.cancel()});return}let o=Dt.has(t);o&&this.onBindTransform&&this.onBindTransform();let r=a.on("change",n=>{this.latestValues[t]=n,this.props.onUpdate&&O.preRender(this.notifyUpdate),o&&this.projection&&(this.projection.isTransformDirty=!0),this.scheduleRender()}),i;typeof window<"u"&&window.MotionCheckAppearSync&&(i=window.MotionCheckAppearSync(this,t,a)),this.valueSubscriptions.set(t,()=>{r(),i&&i()})}sortNodePosition(t){return!this.current||!this.sortInstanceNodePosition||this.type!==t.type?0:this.sortInstanceNodePosition(this.current,t.current)}updateFeatures(){let t="animation";for(t in nf){let a=nf[t];if(!a)continue;let{isEnabled:o,Feature:r}=a;if(!this.features[t]&&r&&o(this.props)&&(this.features[t]=new r(this)),this.features[t]){let i=this.features[t];i.isMounted?i.update():(i.mount(),i.isMounted=!0)}}}triggerBuild(){this.build(this.renderState,this.latestValues,this.props)}measureViewportBox(){return this.current?this.measureInstanceViewportBox(this.current,this.props):fe()}getStaticValue(t){return this.latestValues[t]}setStaticValue(t,a){this.latestValues[t]=a}update(t,a){(t.transformTemplate||this.props.transformTemplate)&&this.scheduleRender(),this.prevProps=this.props,this.props=t,this.prevPresenceContext=this.presenceContext,this.presenceContext=a;for(let o=0;o<Qv.length;o++){let r=Qv[o];this.propEventSubscriptions[r]&&(this.propEventSubscriptions[r](),delete this.propEventSubscriptions[r]);let i="on"+r,n=t[i];n&&(this.propEventSubscriptions[r]=this.on(r,n))}this.prevMotionValues=Wv(this,this.scrapeMotionValuesFromProps(t,this.prevProps||{},this),this.prevMotionValues),this.handleChildMotionValue&&this.handleChildMotionValue()}getProps(){return this.props}getVariant(t){return this.props.variants?this.props.variants[t]:void 0}getDefaultTransition(){return this.props.transition}getTransformPagePoint(){return this.props.transformPagePoint}getClosestVariantNode(){return this.isVariantNode?this:this.parent?this.parent.getClosestVariantNode():void 0}addVariantChild(t){let a=this.getClosestVariantNode();if(a)return a.variantChildren&&a.variantChildren.add(t),()=>a.variantChildren.delete(t)}addValue(t,a){let o=this.values.get(t);a!==o&&(o&&this.removeValue(t),this.bindToMotionValue(t,a),this.values.set(t,a),this.latestValues[t]=a.get())}removeValue(t){this.values.delete(t);let a=this.valueSubscriptions.get(t);a&&(a(),this.valueSubscriptions.delete(t)),delete this.latestValues[t],this.removeValueFromRenderState(t,this.renderState)}hasValue(t){return this.values.has(t)}getValue(t,a){if(this.props.values&&this.props.values[t])return this.props.values[t];let o=this.values.get(t);return o===void 0&&a!==void 0&&(o=qt(a===null?void 0:a,{owner:this}),this.addValue(t,o)),o}readValue(t,a){let o=this.latestValues[t]!==void 0||!this.current?this.latestValues[t]:this.getBaseTargetFromProps(this.props,t)??this.readValueFromInstance(this.current,t,this.options);return o!=null&&(typeof o=="string"&&(Nn(o)||Xn(o))?o=parseFloat(o):!Yv(o)&&Ee.test(a)&&(o=Ku(t,a)),this.setBaseTarget(t,Z(o)?o.get():o)),Z(o)?o.get():o}setBaseTarget(t,a){this.baseTarget[t]=a}getBaseTarget(t){let{initial:a}=this.props,o;if(typeof a=="string"||typeof a=="object"){let i=or(this.props,a,this.presenceContext?.custom);i&&(o=i[t])}if(a&&o!==void 0)return o;let r=this.getBaseTargetFromProps(this.props,t);return r!==void 0&&!Z(r)?r:this.initialValues[t]!==void 0&&o===void 0?void 0:this.baseTarget[t]}on(t,a){return this.events[t]||(this.events[t]=new Ta),this.events[t].add(a)}notify(t,...a){this.events[t]&&this.events[t].notify(...a)}scheduleRenderMicrotask(){nr.render(this.render)}};var Ii=class extends xl{constructor(){super(...arguments),this.KeyframeResolver=Wu}sortInstanceNodePosition(t,a){return t.compareDocumentPosition(a)&2?1:-1}getBaseTargetFromProps(t,a){let o=t.style;return o?o[a]:void 0}removeValueFromRenderState(t,{vars:a,style:o}){delete a[t],delete o[t]}handleChildMotionValue(){this.childSubscription&&(this.childSubscription(),delete this.childSubscription);let{children:t}=this.props;Z(t)&&(this.childSubscription=t.on("change",a=>{this.current&&(this.current.textContent=`${a}`)}))}};var Re=class{constructor(t){this.isMounted=!1,this.node=t}update(){}};function vl({top:e,left:t,right:a,bottom:o}){return{x:{min:t,max:a},y:{min:e,max:o}}}function lm({x:e,y:t}){return{top:t.min,right:e.max,bottom:t.max,left:e.min}}function sm(e,t){if(!t)return e;let a=t({x:e.left,y:e.top}),o=t({x:e.right,y:e.bottom});return{top:a.y,left:a.x,bottom:o.y,right:o.x}}function um(e){return e===void 0||e===1}function lf({scale:e,scaleX:t,scaleY:a}){return!um(e)||!um(t)||!um(a)}function Ba(e){return lf(e)||fm(e)||e.z||e.rotate||e.rotateX||e.rotateY||e.skewX||e.skewY}function fm(e){return Jv(e.x)||Jv(e.y)}function Jv(e){return e&&e!=="0%"}function Ll(e,t,a){let o=e-a,r=t*o;return a+r}function $v(e,t,a,o,r){return r!==void 0&&(e=Ll(e,r,o)),Ll(e,a,o)+t}function dm(e,t=0,a=1,o,r){e.min=$v(e.min,t,a,o,r),e.max=$v(e.max,t,a,o,r)}function cm(e,{x:t,y:a}){dm(e.x,t.translate,t.scale,t.originPoint),dm(e.y,a.translate,a.scale,a.originPoint)}var eL=.999999999999,tL=1.0000000000001;function rL(e,t,a,o=!1){let r=a.length;if(!r)return;t.x=t.y=1;let i,n;for(let l=0;l<r;l++){i=a[l],n=i.projectionDelta;let{visualElement:s}=i.options;s&&s.props.style&&s.props.style.display==="contents"||(o&&i.options.layoutScroll&&i.scroll&&i!==i.root&&(Bt(e.x,-i.scroll.offset.x),Bt(e.y,-i.scroll.offset.y)),n&&(t.x*=n.x.scale,t.y*=n.y.scale,cm(e,n)),o&&Ba(i.latestValues)&&wl(e,i.latestValues,i.layout?.layoutBox))}t.x<tL&&t.x>eL&&(t.x=1),t.y<tL&&t.y>eL&&(t.y=1)}function Bt(e,t){e.min+=t,e.max+=t}function aL(e,t,a,o,r=.5){let i=F(e.min,e.max,r);dm(e,t,a,i,o)}function oL(e,t){return typeof e=="string"?parseFloat(e)/100*(t.max-t.min):e}function wl(e,t,a){let o=a??e;aL(e.x,oL(t.x,o.x),t.scaleX,t.scale,t.originX),aL(e.y,oL(t.y,o.y),t.scaleY,t.scale,t.originY)}function sf(e,t){return vl(sm(e.getBoundingClientRect(),t))}function pm(e,t,a){let o=sf(e,a),{scroll:r}=t;return r&&(Bt(o.x,r.offset.x),Bt(o.y,r.offset.y)),o}var UI={x:"translateX",y:"translateY",z:"translateZ",transformPerspective:"perspective"},qI=aa.length;function iL(e,t,a){let o="",r=!0;for(let n=0;n<qI;n++){let l=aa[n],s=e[l];if(s===void 0)continue;let u=!0;if(typeof s=="number")u=s===(l.startsWith("scale")?1:0);else{let f=parseFloat(s);u=l.startsWith("scale")?f===1:f===0}if(!u||a){let f=pl(s,rr[l]);if(!u){r=!1;let c=UI[l]||l;o+=`${c}(${f}) `}a&&(t[l]=f)}}let i=e.pathRotation;return i&&(r=!1,o+=`rotate(${pl(i,rr.pathRotation)}) `),o=o.trim(),a?o=a(t,r?"":o):r&&(o="none"),o}function ur(e,t,a){let{style:o,vars:r,transformOrigin:i}=e,n=!1,l=!1;for(let s in t){let u=t[s];if(Dt.has(s)){n=!0;continue}else if(bu(s)){r[s]=u;continue}else{let f=pl(u,rr[s]);s.startsWith("origin")?(l=!0,i[s]=f):o[s]=f}}if(t.transform||(n||a?o.transform=iL(t,e.transform,a):o.transform&&(o.transform="none")),l){let{originX:s="50%",originY:u="50%",originZ:f=0}=i;o.transformOrigin=`${s} ${u} ${f}`}}function uf(e,{style:t,vars:a},o,r){let i=e.style,n;for(n in t)i[n]=t[n];r?.applyProjectionStyles(i,o);for(n in a)i.setProperty(n,a[n])}function nL(e,t){return t.max===t.min?0:e/(t.max-t.min)*100}var Ti={correct:(e,t)=>{if(!t.target)return e;if(typeof e=="string")if(D.test(e))e=parseFloat(e);else return e;let a=nL(e,t.target.x),o=nL(e,t.target.y);return`${a}% ${o}%`}};var lL={correct:(e,{treeScale:t,projectionDelta:a})=>{let o=e,r=Ee.parse(e);if(r.length>5)return o;let i=Ee.createTransformer(e),n=typeof r[0]!="number"?1:0,l=a.x.scale*t.x,s=a.y.scale*t.y;r[0+n]/=l,r[1+n]/=s;let u=F(l,s,.5);return typeof r[2+n]=="number"&&(r[2+n]/=u),typeof r[3+n]=="number"&&(r[3+n]/=u),i(r)}};var bl={borderRadius:{...Ti,applyTo:[...cl]},borderTopLeftRadius:Ti,borderTopRightRadius:Ti,borderBottomLeftRadius:Ti,borderBottomRightRadius:Ti,boxShadow:lL};function Sl(e,{layout:t,layoutId:a}){return Dt.has(e)||e.startsWith("origin")||(t||a!==void 0)&&(!!bl[e]||e==="opacity")}function fr(e,t,a){let o=e.style,r=t?.style,i={};if(!o)return i;for(let n in o)(Z(o[n])||r&&Z(r[n])||Sl(n,e)||a?.getValue(n)?.liveStyle!==void 0)&&(i[n]=o[n]);return i}function HI(e){return window.getComputedStyle(e)}var Cl=class extends Ii{constructor(){super(...arguments),this.type="html",this.renderInstance=uf}mount(t){ot(!!t.style,"motion.create() components must forward their ref to a HTML or SVG element","custom-component-ref"),super.mount(t)}readValueFromInstance(t,a){if(Dt.has(a))return this.projection?.isProjecting?Bu(a):dv(t,a);{let o=HI(t),r=(bu(a)?o.getPropertyValue(a):o[a])||0;return typeof r=="string"?r.trim():r}}measureInstanceViewportBox(t,{transformPagePoint:a}){return sf(t,a)}build(t,a,o){ur(t,a,o.transformTemplate)}scrapeMotionValuesFromProps(t,a,o){return fr(t,a,o)}};var _I={offset:"stroke-dashoffset",array:"stroke-dasharray"},NI={offset:"strokeDashoffset",array:"strokeDasharray"};function sL(e,t,a=1,o=0,r=!0){e.pathLength=1;let i=r?_I:NI;e[i.offset]=`${-o}`,e[i.array]=`${t} ${a}`}var GI=["offsetDistance","offsetPath","offsetRotate","offsetAnchor"];function Il(e,{attrX:t,attrY:a,attrScale:o,pathLength:r,pathSpacing:i=1,pathOffset:n=0,...l},s,u,f){if(ur(e,l,u),s){e.style.viewBox&&(e.attrs.viewBox=e.style.viewBox);return}e.attrs=e.style,e.style={};let{attrs:c,style:d}=e;c.transform&&(d.transform=c.transform,delete c.transform),(d.transform||c.transformOrigin)&&(d.transformOrigin=c.transformOrigin??"50% 50%",delete c.transformOrigin),d.transform&&(d.transformBox=f?.transformBox??"fill-box",delete c.transformBox);for(let h of GI)c[h]!==void 0&&(d[h]=c[h],delete c[h]);t!==void 0&&(c.x=t),a!==void 0&&(c.y=a),o!==void 0&&(c.scale=o),r!==void 0&&sL(c,r,i,n,!1)}var ff=new Set(["baseFrequency","diffuseConstant","kernelMatrix","kernelUnitLength","keySplines","keyTimes","limitingConeAngle","markerHeight","markerWidth","numOctaves","targetX","targetY","surfaceScale","specularConstant","specularExponent","stdDeviation","tableValues","viewBox","gradientTransform","pathLength","startOffset","textLength","lengthAdjust"]);var Tl=e=>typeof e=="string"&&e.toLowerCase()==="svg";function uL(e,t,a,o){uf(e,t,void 0,o);for(let r in t.attrs)e.setAttribute(ff.has(r)?r:wi(r),t.attrs[r])}function Al(e,t,a){let o=fr(e,t,a);for(let r in e)if(Z(e[r])||Z(t[r])){let i=aa.indexOf(r)!==-1?"attr"+r.charAt(0).toUpperCase()+r.substring(1):r;o[i]=e[r]}return o}var kl=class extends Ii{constructor(){super(...arguments),this.type="svg",this.isSVGTag=!1,this.measureInstanceViewportBox=fe}getBaseTargetFromProps(t,a){return t[a]}readValueFromInstance(t,a){if(Dt.has(a)){let o=Yu(a);return o&&o.default||0}return a=ff.has(a)?a:wi(a),t.getAttribute(a)}scrapeMotionValuesFromProps(t,a,o){return Al(t,a,o)}build(t,a,o){Il(t,a,this.isSVGTag,o.transformTemplate,o.style)}renderInstance(t,a,o,r){uL(t,a,o,r)}mount(t){this.isSVGTag=Tl(t.tagName),super.mount(t)}};var XI=ml.length;function mm(e){if(!e)return;if(!e.isControllingVariants){let a=e.parent?mm(e.parent)||{}:{};return e.props.initial!==void 0&&(a.initial=e.props.initial),a}let t={};for(let a=0;a<XI;a++){let o=ml[a],r=e.props[o];(oa(r)||r===!1)&&(t[o]=r)}return t}function hm(e,t){if(!Array.isArray(t))return!1;let a=t.length;if(a!==e.length)return!1;for(let o=0;o<a;o++)if(t[o]!==e[o])return!1;return!0}var jI=[...of].reverse(),YI=of.length;function KI(e){return t=>Promise.all(t.map(({animation:a,options:o})=>Pv(e,a,o)))}function gm(e){let t=KI(e),a=fL(),o=!0,r=!1,i=u=>(f,c)=>{let d=pt(e,c,u==="exit"?e.presenceContext?.custom:void 0);if(d){let{transition:h,transitionEnd:x,...v}=d;f={...f,...v,...x}}return f};function n(u){t=u(e)}function l(u){let{props:f}=e,c=mm(e.parent)||{},d=[],h=new Set,x={},v=1/0;for(let m=0;m<YI;m++){let p=jI[m],g=a[p],y=f[p]!==void 0?f[p]:c[p],S=oa(y),A=p===u?g.isActive:null;A===!1&&(v=m);let w=y===c[p]&&y!==f[p]&&S;if(w&&(o||r)&&e.manuallyAnimateOnMount&&(w=!1),g.protectedKeys={...x},!g.isActive&&A===null||!y&&!g.prevProp||Ma(y)||typeof y=="boolean")continue;if(p==="exit"&&g.isActive&&A!==!0){g.prevResolvedValues&&(x={...x,...g.prevResolvedValues});continue}let L=dL(g.prevProp,y),B=L||p===u&&g.isActive&&!w&&S||m>v&&S,I=!1,_=Array.isArray(y)?y:[y],Se=_.reduce(i(p),{});A===!1&&(Se={});let{prevResolvedValues:_t={}}=g,Rt={..._t,...Se},$e=le=>{B=!0,h.has(le)&&(I=!0,h.delete(le)),g.needsAnimating[le]=!0;let it=e.getValue(le);it&&(it.liveStyle=!1)};for(let le in Rt){let it=Se[le],na=_t[le];if(x.hasOwnProperty(le))continue;let To=!1;sl(it)&&sl(na)?To=!hm(it,na)||L:To=it!==na,To?it!=null?$e(le):h.add(le):it!==void 0&&h.has(le)?$e(le):g.protectedKeys[le]=!0}g.prevProp=y,g.prevResolvedValues=Se,g.isActive&&(x={...x,...Se}),(o||r)&&e.blockInitialAnimation&&(B=!1);let je=w&&L;B&&(!je||I)&&d.push(..._.map(le=>{let it={type:p};if(typeof le=="string"&&(o||r)&&!je&&e.manuallyAnimateOnMount&&e.parent){let{parent:na}=e,To=pt(na,le);if(na.enteringChildren&&To){let{delayChildren:xr}=To.transition||{};it.delay=qu(na.enteringChildren,e,xr)}}return{animation:le,options:it}}))}if(h.size){let m={};if(typeof f.initial!="boolean"){let p=pt(e,Array.isArray(f.initial)?f.initial[0]:f.initial);p&&p.transition&&(m.transition=p.transition)}h.forEach(p=>{let g=e.getBaseTarget(p),y=e.getValue(p);y&&(y.liveStyle=!0),m[p]=g??null}),d.push({animation:m})}let b=!!d.length;return o&&(f.initial===!1||f.initial===f.animate)&&!e.manuallyAnimateOnMount&&(b=!1),o=!1,r=!1,b?t(d):Promise.resolve()}function s(u,f){if(a[u].isActive===f)return Promise.resolve();e.variantChildren?.forEach(d=>d.animationState?.setActive(u,f)),a[u].isActive=f;let c=l(u);for(let d in a)a[d].protectedKeys={};return c}return{animateChanges:l,setActive:s,setAnimateFunction:n,getState:()=>a,reset:()=>{a=fL(),r=!0}}}function dL(e,t){return typeof t=="string"?t!==e:Array.isArray(t)?!hm(t,e):!1}function dr(e=!1){return{isActive:e,protectedKeys:{},needsAnimating:{},prevResolvedValues:{}}}function fL(){return{animate:dr(!0),whileInView:dr(),whileHover:dr(),whileTap:dr(),whileDrag:dr(),whileFocus:dr(),exit:dr()}}function df(e,t){e.min=t.min,e.max=t.max}function Et(e,t){df(e.x,t.x),df(e.y,t.y)}function xm(e,t){e.translate=t.translate,e.scale=t.scale,e.originPoint=t.originPoint,e.origin=t.origin}var cL=1e-4,WI=1-cL,ZI=1+cL,pL=.01,QI=0-pL,JI=0+pL;function Ae(e){return e.max-e.min}function wm(e,t,a){return Math.abs(e-t)<=a}function ym(e,t,a,o=.5){e.origin=o,e.originPoint=F(t.min,t.max,e.origin),e.scale=Ae(a)/Ae(t),e.translate=F(a.min,a.max,e.origin)-e.originPoint,(e.scale>=WI&&e.scale<=ZI||isNaN(e.scale))&&(e.scale=1),(e.translate>=QI&&e.translate<=JI||isNaN(e.translate))&&(e.translate=0)}function cr(e,t,a,o){ym(e.x,t.x,a.x,o?o.originX:void 0),ym(e.y,t.y,a.y,o?o.originY:void 0)}function vm(e,t,a,o=0){let r=o?F(a.min,a.max,o):a.min;e.min=r+t.min,e.max=e.min+Ae(t)}function bm(e,t,a,o){vm(e.x,t.x,a.x,o?.x),vm(e.y,t.y,a.y,o?.y)}function Lm(e,t,a,o=0){let r=o?F(a.min,a.max,o):a.min;e.min=t.min-r,e.max=e.min+Ae(t)}function Ai(e,t,a,o){Lm(e.x,t.x,a.x,o?.x),Lm(e.y,t.y,a.y,o?.y)}function mL(e,t,a,o,r){return e-=t,e=Ll(e,1/a,o),r!==void 0&&(e=Ll(e,1/r,o)),e}function $I(e,t=0,a=1,o=.5,r,i=e,n=e){if(Xe.test(t)&&(t=parseFloat(t),t=F(n.min,n.max,t/100)-n.min),typeof t!="number")return;let l=F(i.min,i.max,o);e===i&&(l-=t),e.min=mL(e.min,t,a,l,r),e.max=mL(e.max,t,a,l,r)}function hL(e,t,[a,o,r],i,n){$I(e,t[a],t[o],t[r],t.scale,i,n)}var eT=["x","scaleX","originX"],tT=["y","scaleY","originY"];function Sm(e,t,a,o){hL(e.x,t,eT,a?a.x:void 0,o?o.x:void 0),hL(e.y,t,tT,a?a.y:void 0,o?o.y:void 0)}function gL(e){return e.translate===0&&e.scale===1}function Cm(e){return gL(e.x)&&gL(e.y)}function xL(e,t){return e.min===t.min&&e.max===t.max}function vL(e,t){return xL(e.x,t.x)&&xL(e.y,t.y)}function yL(e,t){return Math.round(e.min)===Math.round(t.min)&&Math.round(e.max)===Math.round(t.max)}function Im(e,t){return yL(e.x,t.x)&&yL(e.y,t.y)}function Tm(e){return Ae(e.x)/Ae(e.y)}function Am(e,t){return e.translate===t.translate&&e.scale===t.scale&&e.originPoint===t.originPoint}function mt(e){return[e("x"),e("y")]}function LL(e,t,a){let o="",r=e.x.translate/t.x,i=e.y.translate/t.y,n=a?.z||0;if((r||i||n)&&(o=`translate3d(${r}px, ${i}px, ${n}px) `),(t.x!==1||t.y!==1)&&(o+=`scale(${1/t.x}, ${1/t.y}) `),a){let{transformPerspective:u,rotate:f,pathRotation:c,rotateX:d,rotateY:h,skewX:x,skewY:v}=a;u&&(o=`perspective(${u}px) ${o}`),f&&(o+=`rotate(${f}deg) `),c&&(o+=`rotate(${c}deg) `),d&&(o+=`rotateX(${d}deg) `),h&&(o+=`rotateY(${h}deg) `),x&&(o+=`skewX(${x}deg) `),v&&(o+=`skewY(${v}deg) `)}let l=e.x.scale*t.x,s=e.y.scale*t.y;return(l!==1||s!==1)&&(o+=`scale(${l}, ${s})`),o||"none"}var aT=cl.length,wL=e=>typeof e=="string"?parseFloat(e):e,bL=e=>typeof e=="number"||D.test(e);function CL(e,t,a,o,r,i){r?(e.opacity=F(0,a.opacity??1,oT(o)),e.opacityExit=F(t.opacity??1,0,rT(o))):i&&(e.opacity=F(t.opacity??1,a.opacity??1,o));for(let n=0;n<aT;n++){let l=cl[n],s=SL(t,l),u=SL(a,l);if(s===void 0&&u===void 0)continue;s||(s=0),u||(u=0),s===0||u===0||bL(s)===bL(u)?(e[l]=Math.max(F(wL(s),wL(u),o),0),(Xe.test(u)||Xe.test(s))&&(e[l]+="%")):e[l]=u}(t.rotate||a.rotate)&&(e.rotate=F(t.rotate||0,a.rotate||0,o))}function SL(e,t){return e[t]!==void 0?e[t]:e.borderRadius}var oT=IL(0,.5,Qn),rT=IL(.5,.95,me);function IL(e,t,a){return o=>o<e?0:o>t?1:a($t(e,t,o))}function TL(e,t,a){let o=Z(e)?e:qt(e);return o.start(ar("",o,t,a)),o.animation}function ra(e,t,a,o={passive:!0}){return e.addEventListener(t,a,o),()=>e.removeEventListener(t,a,o)}var AL=(e,t)=>e.depth-t.depth;var cf=class{constructor(){this.children=[],this.isDirty=!1}add(t){Qo(this.children,t),this.isDirty=!0}remove(t){so(this.children,t),this.isDirty=!0}forEach(t){this.isDirty&&this.children.sort(AL),this.isDirty=!1,this.children.forEach(t)}};function kL(e,t){let a=he.now(),o=({timestamp:r})=>{let i=r-a;i>=t&&(rt(o),e(i-t))};return O.setup(o,!0),()=>rt(o)}function pr(e){return Z(e)?e.get():e}var pf=class{constructor(){this.members=[]}add(t){Qo(this.members,t);for(let a=this.members.length-1;a>=0;a--){let o=this.members[a];if(o===t||o===this.lead||o===this.prevLead)continue;let r=o.instance;(!r||r.isConnected===!1)&&!o.snapshot&&(so(this.members,o),o.unmount())}t.scheduleRender()}remove(t){if(so(this.members,t),t===this.prevLead&&(this.prevLead=void 0),t===this.lead){let a=this.members[this.members.length-1];a&&this.promote(a)}}relegate(t){for(let a=this.members.indexOf(t)-1;a>=0;a--){let o=this.members[a];if(o.isPresent!==!1&&o.instance?.isConnected!==!1)return this.promote(o),!0}return!1}promote(t,a){let o=this.lead;if(t!==o&&(this.prevLead=o,this.lead=t,t.show(),o)){o.updateSnapshot(),t.scheduleRender();let{layoutDependency:r}=o.options,{layoutDependency:i}=t.options;(r===void 0||r!==i)&&(t.resumeFrom=o,a&&(o.preserveOpacity=!0),o.snapshot&&(t.snapshot=o.snapshot,t.snapshot.latestValues=o.animationValues||o.latestValues),t.root?.isUpdating&&(t.isLayoutDirty=!0)),t.options.crossfade===!1&&o.hide()}}exitAnimationComplete(){this.members.forEach(t=>{t.options.onExitComplete?.(),t.resumingFrom?.options.onExitComplete?.()})}scheduleRender(){this.members.forEach(t=>t.instance&&t.scheduleRender(!1))}removeLeadSnapshot(){this.lead?.snapshot&&(this.lead.snapshot=void 0)}};var mr={hasAnimatedSinceResize:!0,hasEverUpdated:!1};var hr={nodes:0,calculatedTargetDeltas:0,calculatedProjections:0},km=["","X","Y","Z"],iT=1e3,nT=0;function Dm(e,t,a,o){let{latestValues:r}=t;r[e]&&(a[e]=r[e],t.setStaticValue(e,0),o&&(o[e]=0))}function zL(e){if(e.hasCheckedOptimisedAppear=!0,e.root===e)return;let{visualElement:t}=e.options;if(!t)return;let a=Nu(t);if(window.MotionHasOptimisedAnimation(a,"transform")){let{layout:r,layoutId:i}=e.options;window.MotionCancelOptimisedAnimation(a,"transform",O,!(r||i))}let{parent:o}=e;o&&!o.hasCheckedOptimisedAppear&&zL(o)}function mf({attachResizeListener:e,defaultParent:t,measureScroll:a,checkIsScrollRoot:o,resetTransform:r}){return class{constructor(n={},l=t?.()){this.id=nT++,this.animationId=0,this.animationCommitId=0,this.children=new Set,this.options={},this.isTreeAnimating=!1,this.isAnimationBlocked=!1,this.isLayoutDirty=!1,this.isProjectionDirty=!1,this.isSharedProjectionDirty=!1,this.isTransformDirty=!1,this.updateManuallyBlocked=!1,this.updateBlockedByResize=!1,this.isUpdating=!1,this.isSVG=!1,this.needsReset=!1,this.shouldResetTransform=!1,this.hasCheckedOptimisedAppear=!1,this.treeScale={x:1,y:1},this.eventHandlers=new Map,this.hasTreeAnimated=!1,this.layoutVersion=0,this.updateScheduled=!1,this.scheduleUpdate=()=>this.update(),this.projectionUpdateScheduled=!1,this.checkUpdateFailed=()=>{this.isUpdating&&(this.isUpdating=!1,this.clearAllSnapshots())},this.updateProjection=()=>{this.projectionUpdateScheduled=!1,sr.value&&(hr.nodes=hr.calculatedTargetDeltas=hr.calculatedProjections=0),this.nodes.forEach(uT),this.nodes.forEach(hT),this.nodes.forEach(gT),this.nodes.forEach(fT),sr.addProjectionMetrics&&sr.addProjectionMetrics(hr)},this.resolvedRelativeTargetAt=0,this.linkedParentVersion=0,this.hasProjected=!1,this.isVisible=!0,this.animationProgress=0,this.sharedNodes=new Map,this.latestValues=n,this.root=l?l.root||l:this,this.path=l?[...l.path,l]:[],this.parent=l,this.depth=l?l.depth+1:0;for(let s=0;s<this.path.length;s++)this.path[s].shouldResetTransform=!0;this.root===this&&(this.nodes=new cf)}addEventListener(n,l){return this.eventHandlers.has(n)||this.eventHandlers.set(n,new Ta),this.eventHandlers.get(n).add(l)}notifyListeners(n,...l){let s=this.eventHandlers.get(n);s&&s.notify(...l)}hasListeners(n){return this.eventHandlers.has(n)}mount(n){if(this.instance)return;this.isSVG=Si(n)&&!jv(n),this.instance=n;let{layoutId:l,layout:s,visualElement:u}=this.options;if(u&&!u.current&&u.mount(n),this.root.nodes.add(this),this.parent&&this.parent.children.add(this),this.root.hasTreeAnimated&&(s||l)&&(this.isLayoutDirty=!0),e){let f,c=0,d=()=>this.root.updateBlockedByResize=!1;O.read(()=>{c=window.innerWidth}),e(n,()=>{let h=window.innerWidth;h!==c&&(c=h,this.root.updateBlockedByResize=!0,f&&f(),f=kL(d,250),mr.hasAnimatedSinceResize&&(mr.hasAnimatedSinceResize=!1,this.nodes.forEach(BL)))})}l&&this.root.registerSharedNode(l,this),this.options.animate!==!1&&u&&(l||s)&&this.addEventListener("didUpdate",({delta:f,hasLayoutChanged:c,hasRelativeLayoutChanged:d,layout:h})=>{if(this.isTreeAnimationBlocked()){this.target=void 0,this.relativeTarget=void 0;return}let x=this.options.transition||u.getDefaultTransition()||wT,{onLayoutAnimationStart:v,onLayoutAnimationComplete:b}=u.getProps(),m=!this.targetLayout||!Im(this.targetLayout,h),p=!c&&d;if(this.options.layoutRoot||this.resumeFrom||p||c&&(m||!this.currentAnimation)){this.resumeFrom&&(this.resumingFrom=this.resumeFrom,this.resumingFrom.resumingFrom=void 0);let g={...vi(x,"layout"),onPlay:v,onComplete:b};(u.shouldReduceMotion||this.options.layoutRoot)&&(g.delay=0,g.type=!1),this.startAnimation(g),this.setAnimationOrigin(f,p,g.path)}else c||BL(this),this.isLead()&&this.options.onExitComplete&&this.options.onExitComplete();this.targetLayout=h})}unmount(){this.options.layoutId&&this.willUpdate(),this.root.nodes.remove(this);let n=this.getStack();n&&n.remove(this),this.parent&&this.parent.children.delete(this),this.instance=void 0,this.eventHandlers.clear(),rt(this.updateProjection)}blockUpdate(){this.updateManuallyBlocked=!0}unblockUpdate(){this.updateManuallyBlocked=!1}isUpdateBlocked(){return this.updateManuallyBlocked||this.updateBlockedByResize}isTreeAnimationBlocked(){return this.isAnimationBlocked||this.parent&&this.parent.isTreeAnimationBlocked()||!1}startUpdate(){this.isUpdateBlocked()||(this.isUpdating=!0,this.nodes&&this.nodes.forEach(xT),this.animationId++)}getTransformTemplate(){let{visualElement:n}=this.options;return n&&n.getProps().transformTemplate}willUpdate(n=!0){if(this.root.hasTreeAnimated=!0,this.root.isUpdateBlocked()){this.options.onExitComplete&&this.options.onExitComplete();return}if(window.MotionCancelOptimisedAnimation&&!this.hasCheckedOptimisedAppear&&zL(this),!this.root.isUpdating&&this.root.startUpdate(),this.isLayoutDirty)return;this.isLayoutDirty=!0;for(let f=0;f<this.path.length;f++){let c=this.path[f];c.shouldResetTransform=!0,(typeof c.latestValues.x=="string"||typeof c.latestValues.y=="string")&&(c.isLayoutDirty=!0),c.updateScroll("snapshot"),c.options.layoutRoot&&c.willUpdate(!1)}let{layoutId:l,layout:s}=this.options;if(l===void 0&&!s)return;let u=this.getTransformTemplate();this.prevTransformTemplateValue=u?u(this.latestValues,""):void 0,this.updateSnapshot(),n&&this.notifyListeners("willUpdate")}update(){if(this.updateScheduled=!1,this.isUpdateBlocked()){let s=this.updateBlockedByResize;this.unblockUpdate(),this.updateBlockedByResize=!1,this.clearAllSnapshots(),s&&this.nodes.forEach(cT),this.nodes.forEach(DL);return}if(this.animationId<=this.animationCommitId){this.nodes.forEach(ML);return}this.animationCommitId=this.animationId,this.isUpdating?(this.isUpdating=!1,this.nodes.forEach(pT),this.nodes.forEach(mT),this.nodes.forEach(lT),this.nodes.forEach(sT)):this.nodes.forEach(ML),this.clearAllSnapshots();let l=he.now();Le.delta=Be(0,1e3/60,l-Le.timestamp),Le.timestamp=l,Le.isProcessing=!0,al.update.process(Le),al.preRender.process(Le),al.render.process(Le),Le.isProcessing=!1}didUpdate(){this.updateScheduled||(this.updateScheduled=!0,nr.read(this.scheduleUpdate))}clearAllSnapshots(){this.nodes.forEach(dT),this.sharedNodes.forEach(yT)}scheduleUpdateProjection(){this.projectionUpdateScheduled||(this.projectionUpdateScheduled=!0,O.preRender(this.updateProjection,!1,!0))}scheduleCheckAfterUnmount(){O.postRender(()=>{this.isLayoutDirty?this.root.didUpdate():this.root.checkUpdateFailed()})}updateSnapshot(){this.snapshot||!this.instance||(this.snapshot=this.measure(),this.snapshot&&!Ae(this.snapshot.measuredBox.x)&&!Ae(this.snapshot.measuredBox.y)&&(this.snapshot=void 0))}updateLayout(){if(!this.instance||(this.updateScroll(),!(this.options.alwaysMeasureLayout&&this.isLead())&&!this.isLayoutDirty))return;if(this.resumeFrom&&!this.resumeFrom.instance)for(let s=0;s<this.path.length;s++)this.path[s].updateScroll();let n=this.layout;this.layout=this.measure(!1),this.layoutVersion++,this.layoutCorrected||(this.layoutCorrected=fe()),this.isLayoutDirty=!1,this.projectionDelta=void 0,this.notifyListeners("measure",this.layout.layoutBox);let{visualElement:l}=this.options;l&&l.notify("LayoutMeasure",this.layout.layoutBox,n?n.layoutBox:void 0)}updateScroll(n="measure"){let l=!!(this.options.layoutScroll&&this.instance);if(this.scroll&&this.scroll.animationId===this.root.animationId&&this.scroll.phase===n&&(l=!1),l&&this.instance){let s=o(this.instance);this.scroll={animationId:this.root.animationId,phase:n,isRoot:s,offset:a(this.instance),wasRoot:this.scroll?this.scroll.isRoot:s}}}resetTransform(){if(!r)return;let n=this.isLayoutDirty||this.shouldResetTransform||this.options.alwaysMeasureLayout,l=this.projectionDelta&&!Cm(this.projectionDelta),s=this.getTransformTemplate(),u=s?s(this.latestValues,""):void 0,f=u!==this.prevTransformTemplateValue;n&&this.instance&&(l||Ba(this.latestValues)||f)&&(r(this.instance,u),this.shouldResetTransform=!1,this.scheduleRender())}measure(n=!0){let l=this.measurePageBox(),s=this.removeElementScroll(l);return n&&(s=this.removeTransform(s)),bT(s),{animationId:this.root.animationId,measuredBox:l,layoutBox:s,latestValues:{},source:this.id}}measurePageBox(){let{visualElement:n}=this.options;if(!n)return fe();let l=n.measureViewportBox();if(!(this.scroll?.wasRoot||this.path.some(ST))){let{scroll:u}=this.root;u&&(Bt(l.x,u.offset.x),Bt(l.y,u.offset.y))}return l}removeElementScroll(n){let l=fe();if(Et(l,n),this.scroll?.wasRoot)return l;for(let s=0;s<this.path.length;s++){let u=this.path[s],{scroll:f,options:c}=u;u!==this.root&&f&&c.layoutScroll&&(f.wasRoot&&Et(l,n),Bt(l.x,f.offset.x),Bt(l.y,f.offset.y))}return l}applyTransform(n,l=!1,s){let u=s||fe();Et(u,n);for(let f=0;f<this.path.length;f++){let c=this.path[f];!l&&c.options.layoutScroll&&c.scroll&&c!==c.root&&(Bt(u.x,-c.scroll.offset.x),Bt(u.y,-c.scroll.offset.y)),Ba(c.latestValues)&&wl(u,c.latestValues,c.layout?.layoutBox)}return Ba(this.latestValues)&&wl(u,this.latestValues,this.layout?.layoutBox),u}removeTransform(n){let l=fe();Et(l,n);for(let s=0;s<this.path.length;s++){let u=this.path[s];if(!Ba(u.latestValues))continue;let f;u.instance&&(lf(u.latestValues)&&u.updateSnapshot(),f=fe(),Et(f,u.measurePageBox())),Sm(l,u.latestValues,u.snapshot?.layoutBox,f)}return Ba(this.latestValues)&&Sm(l,this.latestValues),l}setTargetDelta(n){this.targetDelta=n,this.root.scheduleUpdateProjection(),this.isProjectionDirty=!0}setOptions(n){this.options={...this.options,...n,crossfade:n.crossfade!==void 0?n.crossfade:!0}}clearMeasurements(){this.scroll=void 0,this.layout=void 0,this.snapshot=void 0,this.prevTransformTemplateValue=void 0,this.targetDelta=void 0,this.target=void 0,this.isLayoutDirty=!1}forceRelativeParentToResolveTarget(){this.relativeParent&&this.relativeParent.resolvedRelativeTargetAt!==Le.timestamp&&this.relativeParent.resolveTargetDelta(!0)}resolveTargetDelta(n=!1){let l=this.getLead();this.isProjectionDirty||(this.isProjectionDirty=l.isProjectionDirty),this.isTransformDirty||(this.isTransformDirty=l.isTransformDirty),this.isSharedProjectionDirty||(this.isSharedProjectionDirty=l.isSharedProjectionDirty);let s=!!this.resumingFrom||this!==l;if(!(n||s&&this.isSharedProjectionDirty||this.isProjectionDirty||this.parent?.isProjectionDirty||this.attemptToResolveRelativeTarget||this.root.updateBlockedByResize))return;let{layout:f,layoutId:c}=this.options;if(!this.layout||!(f||c))return;this.resolvedRelativeTargetAt=Le.timestamp;let d=this.getClosestProjectingParent();d&&this.linkedParentVersion!==d.layoutVersion&&!d.options.layoutRoot&&this.removeRelativeTarget(),!this.targetDelta&&!this.relativeTarget&&(this.options.layoutAnchor!==!1&&d&&d.layout?this.createRelativeTarget(d,this.layout.layoutBox,d.layout.layoutBox):this.removeRelativeTarget()),!(!this.relativeTarget&&!this.targetDelta)&&(this.target||(this.target=fe(),this.targetWithTransforms=fe()),this.relativeTarget&&this.relativeTargetOrigin&&this.relativeParent&&this.relativeParent.target?(this.forceRelativeParentToResolveTarget(),bm(this.target,this.relativeTarget,this.relativeParent.target,this.options.layoutAnchor||void 0)):this.targetDelta?(this.resumingFrom?this.applyTransform(this.layout.layoutBox,!1,this.target):Et(this.target,this.layout.layoutBox),cm(this.target,this.targetDelta)):Et(this.target,this.layout.layoutBox),this.attemptToResolveRelativeTarget&&(this.attemptToResolveRelativeTarget=!1,this.options.layoutAnchor!==!1&&d&&!!d.resumingFrom==!!this.resumingFrom&&!d.options.layoutScroll&&d.target&&this.animationProgress!==1?this.createRelativeTarget(d,this.target,d.target):this.relativeParent=this.relativeTarget=void 0),sr.value&&hr.calculatedTargetDeltas++)}getClosestProjectingParent(){if(!(!this.parent||lf(this.parent.latestValues)||fm(this.parent.latestValues)))return this.parent.isProjecting()?this.parent:this.parent.getClosestProjectingParent()}isProjecting(){return!!((this.relativeTarget||this.targetDelta||this.options.layoutRoot)&&this.layout)}createRelativeTarget(n,l,s){this.relativeParent=n,this.linkedParentVersion=n.layoutVersion,this.forceRelativeParentToResolveTarget(),this.relativeTarget=fe(),this.relativeTargetOrigin=fe(),Ai(this.relativeTargetOrigin,l,s,this.options.layoutAnchor||void 0),Et(this.relativeTarget,this.relativeTargetOrigin)}removeRelativeTarget(){this.relativeParent=this.relativeTarget=void 0}calcProjection(){let n=this.getLead(),l=!!this.resumingFrom||this!==n,s=!0;if((this.isProjectionDirty||this.parent?.isProjectionDirty)&&(s=!1),l&&(this.isSharedProjectionDirty||this.isTransformDirty)&&(s=!1),this.resolvedRelativeTargetAt===Le.timestamp&&(s=!1),s)return;let{layout:u,layoutId:f}=this.options;if(this.isTreeAnimating=!!(this.parent&&this.parent.isTreeAnimating||this.currentAnimation||this.pendingAnimation),this.isTreeAnimating||(this.targetDelta=this.relativeTarget=void 0),!this.layout||!(u||f))return;Et(this.layoutCorrected,this.layout.layoutBox);let c=this.treeScale.x,d=this.treeScale.y;rL(this.layoutCorrected,this.treeScale,this.path,l),n.layout&&!n.target&&(this.treeScale.x!==1||this.treeScale.y!==1)&&(n.target=n.layout.layoutBox,n.targetWithTransforms=fe());let{target:h}=n;if(!h){this.prevProjectionDelta&&(this.createProjectionDeltas(),this.scheduleRender());return}!this.projectionDelta||!this.prevProjectionDelta?this.createProjectionDeltas():(xm(this.prevProjectionDelta.x,this.projectionDelta.x),xm(this.prevProjectionDelta.y,this.projectionDelta.y)),cr(this.projectionDelta,this.layoutCorrected,h,this.latestValues),(this.treeScale.x!==c||this.treeScale.y!==d||!Am(this.projectionDelta.x,this.prevProjectionDelta.x)||!Am(this.projectionDelta.y,this.prevProjectionDelta.y))&&(this.hasProjected=!0,this.scheduleRender(),this.notifyListeners("projectionUpdate",h)),sr.value&&hr.calculatedProjections++}hide(){this.isVisible=!1}show(){this.isVisible=!0}scheduleRender(n=!0){if(this.options.visualElement?.scheduleRender(),n){let l=this.getStack();l&&l.scheduleRender()}this.resumingFrom&&!this.resumingFrom.instance&&(this.resumingFrom=void 0)}createProjectionDeltas(){this.prevProjectionDelta=xo(),this.projectionDelta=xo(),this.projectionDeltaWithTransform=xo()}setAnimationOrigin(n,l=!1,s){let u=this.snapshot,f=u?u.latestValues:{},c={...this.latestValues},d=xo();(!this.relativeParent||!this.relativeParent.options.layoutRoot)&&(this.relativeTarget=this.relativeTargetOrigin=void 0),this.attemptToResolveRelativeTarget=!l;let h=fe(),x=u?u.source:void 0,v=this.layout?this.layout.source:void 0,b=x!==v,m=this.getStack(),p=!m||m.members.length<=1,g=!!(b&&!p&&this.options.crossfade===!0&&!this.path.some(LT));this.animationProgress=0;let y,S=s?.interpolateProjection(n);this.mixTargetDelta=A=>{let w=A/1e3,L=S?.(w);L?(d.x.translate=L.x,d.x.scale=F(n.x.scale,1,w),d.x.origin=n.x.origin,d.x.originPoint=n.x.originPoint,d.y.translate=L.y,d.y.scale=F(n.y.scale,1,w),d.y.origin=n.y.origin,d.y.originPoint=n.y.originPoint):(EL(d.x,n.x,w),EL(d.y,n.y,w)),this.setTargetDelta(d),this.relativeTarget&&this.relativeTargetOrigin&&this.layout&&this.relativeParent&&this.relativeParent.layout&&(Ai(h,this.layout.layoutBox,this.relativeParent.layout.layoutBox,this.options.layoutAnchor||void 0),vT(this.relativeTarget,this.relativeTargetOrigin,h,w),y&&vL(this.relativeTarget,y)&&(this.isProjectionDirty=!1),y||(y=fe()),Et(y,this.relativeTarget)),b&&(this.animationValues=c,CL(c,f,this.latestValues,w,g,p)),L&&L.rotate!==void 0&&(this.animationValues||(this.animationValues=c),this.animationValues.pathRotation=L.rotate),this.root.scheduleUpdateProjection(),this.scheduleRender(),this.animationProgress=w},this.mixTargetDelta(this.options.layoutRoot?1e3:0)}startAnimation(n){this.notifyListeners("animationStart"),this.currentAnimation?.stop(),this.resumingFrom?.currentAnimation?.stop(),this.pendingAnimation&&(rt(this.pendingAnimation),this.pendingAnimation=void 0),this.pendingAnimation=O.update(()=>{mr.hasAnimatedSinceResize=!0,this.motionValue||(this.motionValue=qt(0)),this.motionValue.jump(0,!1),this.currentAnimation=TL(this.motionValue,[0,1e3],{...n,velocity:0,isSync:!0,onUpdate:l=>{this.mixTargetDelta(l),n.onUpdate&&n.onUpdate(l)},onComplete:()=>{n.onComplete&&n.onComplete(),this.completeAnimation()}}),this.resumingFrom&&(this.resumingFrom.currentAnimation=this.currentAnimation),this.pendingAnimation=void 0})}completeAnimation(){this.resumingFrom&&(this.resumingFrom.currentAnimation=void 0,this.resumingFrom.preserveOpacity=void 0);let n=this.getStack();n&&n.exitAnimationComplete(),this.resumingFrom=this.currentAnimation=this.animationValues=void 0,this.notifyListeners("animationComplete")}finishAnimation(){this.currentAnimation&&(this.mixTargetDelta&&this.mixTargetDelta(iT),this.currentAnimation.stop()),this.completeAnimation()}applyTransformsToTarget(){let n=this.getLead(),{targetWithTransforms:l,target:s,layout:u,latestValues:f}=n;if(!(!l||!s||!u)){if(this!==n&&this.layout&&u&&FL(this.options.animationType,this.layout.layoutBox,u.layoutBox)){s=this.target||fe();let c=Ae(this.layout.layoutBox.x);s.x.min=n.target.x.min,s.x.max=s.x.min+c;let d=Ae(this.layout.layoutBox.y);s.y.min=n.target.y.min,s.y.max=s.y.min+d}Et(l,s),wl(l,f),cr(this.projectionDeltaWithTransform,this.layoutCorrected,l,f)}}registerSharedNode(n,l){this.sharedNodes.has(n)||this.sharedNodes.set(n,new pf),this.sharedNodes.get(n).add(l);let u=l.options.initialPromotionConfig;l.promote({transition:u?u.transition:void 0,preserveFollowOpacity:u&&u.shouldPreserveFollowOpacity?u.shouldPreserveFollowOpacity(l):void 0})}isLead(){let n=this.getStack();return n?n.lead===this:!0}getLead(){let{layoutId:n}=this.options;return n?this.getStack()?.lead||this:this}getPrevLead(){let{layoutId:n}=this.options;return n?this.getStack()?.prevLead:void 0}getStack(){let{layoutId:n}=this.options;if(n)return this.root.sharedNodes.get(n)}promote({needsReset:n,transition:l,preserveFollowOpacity:s}={}){let u=this.getStack();u&&u.promote(this,s),n&&(this.projectionDelta=void 0,this.needsReset=!0),l&&this.setOptions({transition:l})}relegate(){let n=this.getStack();return n?n.relegate(this):!1}resetSkewAndRotation(){let{visualElement:n}=this.options;if(!n)return;let l=!1,{latestValues:s}=n;if((s.z||s.rotate||s.rotateX||s.rotateY||s.rotateZ||s.skewX||s.skewY)&&(l=!0),!l)return;let u={};s.z&&Dm("z",n,u,this.animationValues);for(let f=0;f<km.length;f++)Dm(`rotate${km[f]}`,n,u,this.animationValues),Dm(`skew${km[f]}`,n,u,this.animationValues);n.render();for(let f in u)n.setStaticValue(f,u[f]),this.animationValues&&(this.animationValues[f]=u[f]);n.scheduleRender()}applyProjectionStyles(n,l){if(!this.instance||this.isSVG)return;if(!this.isVisible){n.visibility="hidden";return}let s=this.getTransformTemplate();if(this.needsReset){this.needsReset=!1,n.visibility="",n.opacity="",n.pointerEvents=pr(l?.pointerEvents)||"",n.transform=s?s(this.latestValues,""):"none";return}let u=this.getLead();if(!this.projectionDelta||!this.layout||!u.target){this.options.layoutId&&(n.opacity=this.latestValues.opacity!==void 0?this.latestValues.opacity:1,n.pointerEvents=pr(l?.pointerEvents)||""),this.hasProjected&&!Ba(this.latestValues)&&(n.transform=s?s({},""):"none",this.hasProjected=!1);return}n.visibility="";let f=u.animationValues||u.latestValues;this.applyTransformsToTarget();let c=LL(this.projectionDeltaWithTransform,this.treeScale,f);s&&(c=s(f,c)),n.transform=c;let{x:d,y:h}=this.projectionDelta;n.transformOrigin=`${d.origin*100}% ${h.origin*100}% 0`,u.animationValues?n.opacity=u===this?f.opacity??this.latestValues.opacity??1:this.preserveOpacity?this.latestValues.opacity:f.opacityExit:n.opacity=u===this?f.opacity!==void 0?f.opacity:"":f.opacityExit!==void 0?f.opacityExit:0;for(let x in bl){if(f[x]===void 0)continue;let{correct:v,applyTo:b,isCSSVariable:m}=bl[x],p=c==="none"?f[x]:v(f[x],u);if(b){let g=b.length;for(let y=0;y<g;y++)n[b[y]]=p}else m?this.options.visualElement.renderState.vars[x]=p:n[x]=p}this.options.layoutId&&(n.pointerEvents=u===this?pr(l?.pointerEvents)||"":"none")}clearSnapshot(){this.resumeFrom=this.snapshot=void 0}resetTree(){this.root.nodes.forEach(n=>n.currentAnimation?.stop()),this.root.nodes.forEach(DL),this.root.sharedNodes.clear()}}}function lT(e){e.updateLayout()}function sT(e){let t=e.resumeFrom?.snapshot||e.snapshot;if(e.isLead()&&e.layout&&t&&e.hasListeners("didUpdate")){let{layoutBox:a,measuredBox:o}=e.layout,{animationType:r}=e.options,i=t.source!==e.layout.source;if(r==="size")mt(f=>{let c=i?t.measuredBox[f]:t.layoutBox[f],d=Ae(c);c.min=a[f].min,c.max=c.min+d});else if(r==="x"||r==="y"){let f=r==="x"?"y":"x";df(i?t.measuredBox[f]:t.layoutBox[f],a[f])}else FL(r,t.layoutBox,a)&&mt(f=>{let c=i?t.measuredBox[f]:t.layoutBox[f],d=Ae(a[f]);c.max=c.min+d,e.relativeTarget&&!e.currentAnimation&&(e.isProjectionDirty=!0,e.relativeTarget[f].max=e.relativeTarget[f].min+d)});let n=xo();cr(n,a,t.layoutBox);let l=xo();i?cr(l,e.applyTransform(o,!0),t.measuredBox):cr(l,a,t.layoutBox);let s=!Cm(n),u=!1;if(!e.resumeFrom){let f=e.getClosestProjectingParent();if(f&&!f.resumeFrom){let{snapshot:c,layout:d}=f;if(c&&d){let h=e.options.layoutAnchor||void 0,x=fe();Ai(x,t.layoutBox,c.layoutBox,h);let v=fe();Ai(v,a,d.layoutBox,h),Im(x,v)||(u=!0),f.options.layoutRoot&&(e.relativeTarget=v,e.relativeTargetOrigin=x,e.relativeParent=f)}}}e.notifyListeners("didUpdate",{layout:a,snapshot:t,delta:l,layoutDelta:n,hasLayoutChanged:s,hasRelativeLayoutChanged:u})}else if(e.isLead()){let{onExitComplete:a}=e.options;a&&a()}e.options.transition=void 0}function uT(e){sr.value&&hr.nodes++,e.parent&&(e.isProjecting()||(e.isProjectionDirty=e.parent.isProjectionDirty),e.isSharedProjectionDirty||(e.isSharedProjectionDirty=!!(e.isProjectionDirty||e.parent.isProjectionDirty||e.parent.isSharedProjectionDirty)),e.isTransformDirty||(e.isTransformDirty=e.parent.isTransformDirty))}function fT(e){e.isProjectionDirty=e.isSharedProjectionDirty=e.isTransformDirty=!1}function dT(e){e.clearSnapshot()}function DL(e){e.clearMeasurements()}function cT(e){e.isLayoutDirty=!0,e.updateLayout()}function ML(e){e.isLayoutDirty=!1}function pT(e){e.isAnimationBlocked&&e.layout&&!e.isLayoutDirty&&(e.snapshot=e.layout,e.isLayoutDirty=!0)}function mT(e){let{visualElement:t}=e.options;t&&t.getProps().onBeforeLayoutMeasure&&t.notify("BeforeLayoutMeasure"),e.resetTransform()}function BL(e){e.finishAnimation(),e.targetDelta=e.relativeTarget=e.target=void 0,e.isProjectionDirty=!0}function hT(e){e.resolveTargetDelta()}function gT(e){e.calcProjection()}function xT(e){e.resetSkewAndRotation()}function yT(e){e.removeLeadSnapshot()}function EL(e,t,a){e.translate=F(t.translate,0,a),e.scale=F(t.scale,1,a),e.origin=t.origin,e.originPoint=t.originPoint}function RL(e,t,a,o){e.min=F(t.min,a.min,o),e.max=F(t.max,a.max,o)}function vT(e,t,a,o){RL(e.x,t.x,a.x,o),RL(e.y,t.y,a.y,o)}function LT(e){return e.animationValues&&e.animationValues.opacityExit!==void 0}var wT={duration:.45,ease:[.4,0,.1,1]},PL=e=>typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().includes(e),OL=PL("applewebkit/")&&!PL("chrome/")?Math.round:me;function VL(e){e.min=OL(e.min),e.max=OL(e.max)}function bT(e){VL(e.x),VL(e.y)}function FL(e,t,a){return e==="position"||e==="preserve-aspect"&&!wm(Tm(t),Tm(a),.2)}function ST(e){return e!==e.root&&e.scroll?.wasRoot}var UL=mf({attachResizeListener:(e,t)=>ra(e,"resize",t),measureScroll:()=>({x:document.documentElement.scrollLeft||document.body?.scrollLeft||0,y:document.documentElement.scrollTop||document.body?.scrollTop||0}),checkIsScrollRoot:()=>!0});var hf={current:void 0},Dl=mf({measureScroll:e=>({x:e.scrollLeft,y:e.scrollTop}),defaultParent:()=>{if(!hf.current){let e=new UL({});e.mount(window),e.setOptions({layoutScroll:!0}),hf.current=e}return hf.current},resetTransform:(e,t)=>{e.style.transform=t!==void 0?t:"none"},checkIsScrollRoot:e=>window.getComputedStyle(e).position==="fixed"});var gf=q(G(),1),Ea=q(G(),1);var qL=q(G(),1),ki=(0,qL.createContext)({transformPagePoint:e=>e,isStatic:!1,reducedMotion:"never"});var _L=q(G(),1);function HL(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function CT(...e){return t=>{let a=!1,o=e.map(r=>{let i=HL(r,t);return!a&&typeof i=="function"&&(a=!0),i});if(a)return()=>{for(let r=0;r<o.length;r++){let i=o[r];typeof i=="function"?i():HL(e[r],null)}}}}function NL(...e){return _L.useCallback(CT(...e),e)}var Mm=class extends gf.Component{getSnapshotBeforeUpdate(t){let a=this.props.childRef.current;if(ir(a)&&t.isPresent&&!this.props.isPresent&&this.props.pop!==!1){let o=a.offsetParent,r=ir(o)&&o.offsetWidth||0,i=ir(o)&&o.offsetHeight||0,n=getComputedStyle(a),l=this.props.sizeRef.current;l.height=parseFloat(n.height),l.width=parseFloat(n.width),l.top=a.offsetTop,l.left=a.offsetLeft,l.right=r-l.width-l.left,l.bottom=i-l.height-l.top,l.direction=n.direction}return null}componentDidUpdate(){}render(){return this.props.children}};function XL({children:e,isPresent:t,anchorX:a,anchorY:o,root:r,pop:i}){let n=(0,Ea.useId)(),l=(0,Ea.useRef)(null),s=(0,Ea.useRef)({width:0,height:0,top:0,left:0,right:0,bottom:0,direction:"ltr"}),{nonce:u}=(0,Ea.useContext)(ki),f=i!==!1?e.props?.ref??e?.ref:void 0,c=NL(l,f);return(0,Ea.useInsertionEffect)(()=>{let{width:d,height:h,top:x,left:v,right:b,bottom:m,direction:p}=s.current;if(t||i===!1||!l.current||!d||!h)return;let g=p==="rtl",y=a==="left"?g?`right: ${b}`:`left: ${v}`:g?`left: ${v}`:`right: ${b}`,S=o==="bottom"?`bottom: ${m}`:`top: ${x}`;l.current.dataset.motionPopId=n;let A=document.createElement("style");u&&(A.nonce=u);let w=r??document.head;return w.appendChild(A),A.sheet&&A.sheet.insertRule(`
          [data-motion-pop-id="${n}"] {
            position: absolute !important;
            width: ${d}px !important;
            height: ${h}px !important;
            ${y}px !important;
            ${S}px !important;
          }
        `),()=>{l.current?.removeAttribute("data-motion-pop-id"),w.contains(A)&&w.removeChild(A)}},[t]),(0,GL.jsx)(Mm,{isPresent:t,childRef:l,sizeRef:s,pop:i,children:i===!1?e:gf.cloneElement(e,{ref:c})})}var YL=({children:e,initial:t,isPresent:a,onExitComplete:o,custom:r,presenceAffectsLayout:i,mode:n,anchorX:l,anchorY:s,root:u})=>{let f=ui(IT),c=(0,vo.useId)(),d=(0,vo.useRef)(a),h=(0,vo.useRef)(o);fi(()=>{d.current=a,h.current=o});let x=!0,v=(0,vo.useMemo)(()=>(x=!1,{id:c,initial:t,isPresent:a,custom:r,onExitComplete:b=>{f.set(b,!0);for(let m of f.values())if(!m)return;o&&o()},register:b=>(f.set(b,!1),()=>{f.delete(b),!d.current&&!f.size&&h.current?.()})}),[a,f,o]);return i&&x&&(v={...v}),(0,vo.useMemo)(()=>{f.forEach((b,m)=>f.set(m,!1))},[a]),jL.useEffect(()=>{!a&&!f.size&&o&&o()},[a]),e=(0,Bm.jsx)(XL,{pop:n==="popLayout",isPresent:a,anchorX:l,anchorY:s,root:u,children:e}),(0,Bm.jsx)(lo.Provider,{value:v,children:e})};function IT(){return new Map}var Lo=q(G(),1);function xf(e=!0){let t=(0,Lo.useContext)(lo);if(t===null)return[!0,null];let{isPresent:a,onExitComplete:o,register:r}=t,i=(0,Lo.useId)();(0,Lo.useEffect)(()=>{if(e)return r(i)},[e]);let n=(0,Lo.useCallback)(()=>e&&o&&o(i),[i,o,e]);return!a&&o?[!1,n]:[!0]}var yf=q(G(),1),Ml=e=>e.key||"";function Em(e){let t=[];return yf.Children.forEach(e,a=>{(0,yf.isValidElement)(a)&&t.push(a)}),t}var wo=({children:e,custom:t,initial:a=!0,onExitComplete:o,presenceAffectsLayout:r=!0,mode:i="sync",propagate:n=!1,anchorX:l="left",anchorY:s="top",root:u})=>{let[f,c]=xf(n),d=(0,Ht.useMemo)(()=>Em(e),[e]),h=n&&!f?[]:d.map(Ml),x=(0,Ht.useRef)(!0),v=(0,Ht.useRef)(d),b=ui(()=>new Map),m=(0,Ht.useRef)(new Set),[p,g]=(0,Ht.useState)(d),[y,S]=(0,Ht.useState)(d);fi(()=>{x.current=!1,v.current=d;for(let L=0;L<y.length;L++){let B=Ml(y[L]);h.includes(B)?(b.delete(B),m.current.delete(B)):b.get(B)!==!0&&b.set(B,!1)}},[y,h.length,h.join("-")]);let A=[];if(d!==p){let L=[...d];for(let B=0;B<y.length;B++){let I=y[B],_=Ml(I);h.includes(_)||(L.splice(B,0,I),A.push(I))}return i==="wait"&&A.length&&(L=A),S(Em(L)),g(d),null}let{forceRender:w}=(0,Ht.useContext)(si);return(0,Bl.jsx)(Bl.Fragment,{children:y.map(L=>{let B=Ml(L),I=n&&!f?!1:d===y||h.includes(B),_=()=>{if(m.current.has(B))return;if(b.has(B))m.current.add(B),b.set(B,!0);else return;let Se=!0;b.forEach(_t=>{_t||(Se=!1)}),Se&&(w?.(),S(v.current),n&&c?.(),o&&o())};return(0,Bl.jsx)(YL,{isPresent:I,initial:!x.current||a?void 0:!1,custom:t,presenceAffectsLayout:r,mode:i,root:u,onExitComplete:I?void 0:_,anchorX:l,anchorY:s,children:L},B)})})};var KL=q(G(),1),vf=(0,KL.createContext)({strict:!1});var WL={animation:["animate","variants","whileHover","whileTap","exit","whileInView","whileFocus","whileDrag"],exit:["exit"],drag:["drag","dragControls"],focus:["whileFocus"],hover:["whileHover","onHoverStart","onHoverEnd"],tap:["whileTap","onTap","onTapStart","onTapCancel"],pan:["onPan","onPanStart","onPanSessionStart","onPanEnd"],inView:["whileInView","onViewportEnter","onViewportLeave"],layout:["layout","layoutId"]},ZL=!1;function TT(){if(ZL)return;let e={};for(let t in WL)e[t]={isEnabled:a=>WL[t].some(o=>!!a[o])};yl(e),ZL=!0}function Lf(){return TT(),nm()}function QL(e){let t=Lf();for(let a in e)t[a]={...t[a],...e[a]};yl(t)}var AT=new Set(["animate","exit","variants","initial","style","values","variants","transition","transformTemplate","custom","inherit","onBeforeLayoutMeasure","onAnimationStart","onAnimationComplete","onUpdate","onDragStart","onDrag","onDragEnd","onMeasureDragConstraints","onDirectionLock","onDragTransitionEnd","_dragX","_dragY","onHoverStart","onHoverEnd","onViewportEnter","onViewportLeave","globalTapTarget","propagate","ignoreStrict","viewport"]);function El(e){return e.startsWith("while")||e.startsWith("drag")&&e!=="draggable"||e.startsWith("layout")||e.startsWith("onTap")||e.startsWith("onPan")||e.startsWith("onLayout")||AT.has(e)}var JL=e=>!El(e);function kT(e){typeof e=="function"&&(JL=t=>t.startsWith("on")?!El(t):e(t))}try{kT(oh("@emotion/is-prop-valid").default)}catch{}function $L(e,t,a){let o={};for(let r in e)r==="values"&&typeof e.values=="object"||Z(e[r])||(JL(r)||a===!0&&El(r)||!t&&!El(r)||e.draggable&&r.startsWith("onDrag"))&&(o[r]=e[r]);return o}var If=q(li(),1);var Ei=q(G(),1);var ew=q(G(),1),bo=(0,ew.createContext)({});var wf=q(G(),1);function tw(e,t){if(yo(e)){let{initial:a,animate:o}=e;return{initial:a===!1||oa(a)?a:void 0,animate:oa(o)?o:void 0}}return e.inherit!==!1?t:{}}function ow(e){let{initial:t,animate:a}=tw(e,(0,wf.useContext)(bo));return(0,wf.useMemo)(()=>({initial:t,animate:a}),[aw(t),aw(a)])}function aw(e){return Array.isArray(e)?e.join(" "):e}var Bi=q(G(),1);var rw=q(G(),1);var Di=()=>({style:{},transform:{},transformOrigin:{},vars:{}});function Rm(e,t,a){for(let o in t)!Z(t[o])&&!Sl(o,a)&&(e[o]=t[o])}function DT({transformTemplate:e},t){return(0,rw.useMemo)(()=>{let a=Di();return ur(a,t,e),Object.assign({},a.vars,a.style)},[t])}function MT(e,t){let a=e.style||{},o={};return Rm(o,a,e),Object.assign(o,DT(e,t)),o}function iw(e,t){let a={},o=MT(e,t);return e.drag&&e.dragListener!==!1&&(a.draggable=!1,o.userSelect=o.WebkitUserSelect=o.WebkitTouchCallout="none",o.touchAction=e.drag===!0?"none":`pan-${e.drag==="x"?"y":"x"}`),e.tabIndex===void 0&&(e.onTap||e.onTapStart||e.whileTap)&&(a.tabIndex=0),a.style=o,a}var nw=q(G(),1);var bf=()=>({...Di(),attrs:{}});function lw(e,t,a,o){let r=(0,nw.useMemo)(()=>{let i=bf();return Il(i,t,Tl(o),e.transformTemplate,e.style),{...i.attrs,style:{...i.style}}},[t]);if(e.style){let i={};Rm(i,e.style,e),r.style={...i,...r.style}}return r}var sw=["animate","circle","defs","desc","ellipse","g","image","line","filter","marker","mask","metadata","path","pattern","polygon","polyline","rect","stop","switch","symbol","svg","text","tspan","use","view"];function Mi(e){return typeof e!="string"||e.includes("-")?!1:!!(sw.indexOf(e)>-1||/[A-Z]/u.test(e))}function uw(e,t,a,{latestValues:o},r,i=!1,n){let s=(n??Mi(e)?lw:iw)(t,o,r,e),u=$L(t,typeof e=="string",i),f=e!==Bi.Fragment?{...u,...s,ref:a}:{},{children:c}=t,d=(0,Bi.useMemo)(()=>Z(c)?c.get():c,[c]);return(0,Bi.createElement)(e,{...f,children:d})}var Pm=q(G(),1);function BT({scrapeMotionValuesFromProps:e,createRenderState:t},a,o,r){return{latestValues:ET(a,o,r,e),renderState:t()}}function ET(e,t,a,o){let r={},i=o(e,{});for(let d in i)r[d]=pr(i[d]);let{initial:n,animate:l}=e,s=yo(e),u=hl(e);t&&u&&!s&&e.inherit!==!1&&(n===void 0&&(n=t.initial),l===void 0&&(l=t.animate));let f=a?a.initial===!1:!1;f=f||n===!1;let c=f?l:n;if(c&&typeof c!="boolean"&&!Ma(c)){let d=Array.isArray(c)?c:[c];for(let h=0;h<d.length;h++){let x=or(e,d[h]);if(x){let{transitionEnd:v,transition:b,...m}=x;for(let p in m){let g=m[p];if(Array.isArray(g)){let y=f?g.length-1:0;g=g[y]}g!==null&&(r[p]=g)}for(let p in v)r[p]=v[p]}}}return r}var Sf=e=>(t,a)=>{let o=(0,Pm.useContext)(bo),r=(0,Pm.useContext)(lo),i=()=>BT(e,t,o,r);return a?i():ui(i)};var fw=Sf({scrapeMotionValuesFromProps:fr,createRenderState:Di});var dw=Sf({scrapeMotionValuesFromProps:Al,createRenderState:bf});var cw=Symbol.for("motionComponentSymbol");var gr=q(G(),1);function pw(e,t,a){let o=(0,gr.useRef)(a);(0,gr.useInsertionEffect)(()=>{o.current=a});let r=(0,gr.useRef)(null);return(0,gr.useCallback)(i=>{i&&e.onMount?.(i),t&&(i?t.mount(i):t.unmount());let n=o.current;if(typeof n=="function")if(i){let l=n(i);typeof l=="function"&&(r.current=l)}else r.current?(r.current(),r.current=null):n(i);else n&&(n.current=i)},[t])}var Je=q(G(),1);var mw=q(G(),1),Cf=(0,mw.createContext)({});function So(e){return e&&typeof e=="object"&&Object.prototype.hasOwnProperty.call(e,"current")}function hw(e,t,a,o,r,i){let{visualElement:n}=(0,Je.useContext)(bo),l=(0,Je.useContext)(vf),s=(0,Je.useContext)(lo),u=(0,Je.useContext)(ki),f=u.reducedMotion,c=u.skipAnimations,d=(0,Je.useRef)(null),h=(0,Je.useRef)(!1);o=o||l.renderer,!d.current&&o&&(d.current=o(e,{visualState:t,parent:n,props:a,presenceContext:s,blockInitialAnimation:s?s.initial===!1:!1,reducedMotionConfig:f,skipAnimations:c,isSVG:i}),h.current&&d.current&&(d.current.manuallyAnimateOnMount=!0));let x=d.current,v=(0,Je.useContext)(Cf);x&&!x.projection&&r&&(x.type==="html"||x.type==="svg")&&RT(d.current,a,r,v);let b=(0,Je.useRef)(!1);(0,Je.useInsertionEffect)(()=>{x&&b.current&&x.update(a,s)});let m=a[ul],p=(0,Je.useRef)(!!m&&typeof window<"u"&&!window.MotionHandoffIsComplete?.(m)&&window.MotionHasOptimisedAnimation?.(m));return fi(()=>{h.current=!0,x&&(b.current=!0,window.MotionIsMounted=!0,x.updateFeatures(),x.scheduleRenderMicrotask(),p.current&&x.animationState&&x.animationState.animateChanges())}),(0,Je.useEffect)(()=>{x&&(!p.current&&x.animationState&&x.animationState.animateChanges(),p.current&&(queueMicrotask(()=>{window.MotionHandoffMarkAsComplete?.(m)}),p.current=!1),x.enteringChildren=void 0)}),x}function RT(e,t,a,o){let{layoutId:r,layout:i,drag:n,dragConstraints:l,layoutScroll:s,layoutRoot:u,layoutAnchor:f,layoutCrossfade:c}=t;e.projection=new a(e.latestValues,t["data-framer-portal-id"]?void 0:gw(e.parent)),e.projection.setOptions({layoutId:r,layout:i,alwaysMeasureLayout:!!n||l&&So(l),visualElement:e,animationType:typeof i=="string"?i:"both",initialPromotionConfig:o,crossfade:c,layoutScroll:s,layoutRoot:u,layoutAnchor:f})}function gw(e){if(e)return e.options.allowProjection!==!1?e.projection:gw(e.parent)}function Tf(e,{forwardMotionProps:t=!1,type:a}={},o,r){o&&QL(o);let i=a?a==="svg":Mi(e),n=i?dw:fw;function l(u,f){let c,d={...(0,Ei.useContext)(ki),...u,layoutId:PT(u)},{isStatic:h}=d,x=ow(u),v=n(u,h);if(!h&&typeof window<"u"){OT(d,o);let b=VT(d);c=b.MeasureLayout,x.visualElement=hw(e,v,d,r,b.ProjectionNode,i)}return(0,If.jsxs)(bo.Provider,{value:x,children:[c&&x.visualElement?(0,If.jsx)(c,{visualElement:x.visualElement,...d}):null,uw(e,u,pw(v,x.visualElement,f),v,h,t,i)]})}l.displayName=`motion.${typeof e=="string"?e:`create(${e.displayName??e.name??""})`}`;let s=(0,Ei.forwardRef)(l);return s[cw]=e,s}function PT({layoutId:e}){let t=(0,Ei.useContext)(si).id;return t&&e!==void 0?t+"-"+e:e}function OT(e,t){let a=(0,Ei.useContext)(vf).strict}function VT(e){let t=Lf(),{drag:a,layout:o}=t;if(!a&&!o)return{};let r={...a,...o};return{MeasureLayout:a?.isEnabled(e)||o?.isEnabled(e)?r.MeasureLayout:void 0,ProjectionNode:r.ProjectionNode}}function xw(e,t){if(typeof Proxy>"u")return Tf;let a=new Map,o=(i,n)=>Tf(i,n,e,t),r=(i,n)=>o(i,n);return new Proxy(r,{get:(i,n)=>n==="create"?o:(a.has(n)||a.set(n,Tf(n,void 0,e,t)),a.get(n))})}var yw=q(G(),1);var vw=(e,t)=>t.isSVG??Mi(e)?new kl(t):new Cl(t,{allowProjection:e!==yw.Fragment});var Af=class extends Re{constructor(t){super(t),t.animationState||(t.animationState=gm(t))}updateAnimationControlsSubscription(){let{animate:t}=this.node.getProps();Ma(t)&&(this.unmountControls=t.subscribe(this.node))}mount(){this.updateAnimationControlsSubscription()}update(){let{animate:t}=this.node.getProps(),{animate:a}=this.node.prevProps||{};t!==a&&this.updateAnimationControlsSubscription()}unmount(){this.node.animationState.reset(),this.unmountControls?.()}};var zT=0,kf=class extends Re{constructor(){super(...arguments),this.id=zT++,this.isExitComplete=!1}update(){if(!this.node.presenceContext)return;let{isPresent:t,onExitComplete:a}=this.node.presenceContext,{isPresent:o}=this.node.prevPresenceContext||{};if(!this.node.animationState||t===o)return;if(t&&o===!1){if(this.isExitComplete){let{initial:i,custom:n}=this.node.getProps();if(typeof i=="string"||typeof i=="object"&&i!==null&&!Array.isArray(i)){let l=pt(this.node,i,n);if(l){let{transition:s,transitionEnd:u,...f}=l;for(let c in f)this.node.getValue(c)?.jump(f[c])}}this.node.animationState.reset(),this.node.animationState.animateChanges()}else this.node.animationState.setActive("exit",!1);this.isExitComplete=!1;return}let r=this.node.animationState.setActive("exit",!t);a&&!t&&r.then(()=>{this.isExitComplete=!0,a(this.id)})}mount(){let{register:t,onExitComplete:a}=this.node.presenceContext||{};a&&a(this.id),t&&(this.unmount=t(this.id))}unmount(){}};var Lw={animation:{Feature:Af},exit:{Feature:kf}};function Ra(e){return{point:{x:e.pageX,y:e.pageY}}}var ww=e=>t=>lr(t)&&e(t,Ra(t));function Co(e,t,a,o){return ra(e,t,ww(a),o)}var Df=({current:e})=>e?e.ownerDocument.defaultView:null;var bw=(e,t)=>Math.abs(e-t);function Sw(e,t){let a=bw(e.x,t.x),o=bw(e.y,t.y);return Math.sqrt(a**2+o**2)}var Cw=new Set(["auto","scroll"]),Ri=class{constructor(t,a,{transformPagePoint:o,contextWindow:r=window,dragSnapToOrigin:i=!1,distanceThreshold:n=3,element:l}={}){if(this.startEvent=null,this.lastMoveEvent=null,this.lastMoveEventInfo=null,this.lastRawMoveEventInfo=null,this.handlers={},this.contextWindow=window,this.scrollPositions=new Map,this.removeScrollListeners=null,this.onElementScroll=x=>{this.handleScroll(x.target)},this.onWindowScroll=()=>{this.handleScroll(window)},this.updatePoint=()=>{if(!(this.lastMoveEvent&&this.lastMoveEventInfo))return;this.lastRawMoveEventInfo&&(this.lastMoveEventInfo=Mf(this.lastRawMoveEventInfo,this.transformPagePoint));let x=Om(this.lastMoveEventInfo,this.history),v=this.startEvent!==null,b=Sw(x.offset,{x:0,y:0})>=this.distanceThreshold;if(!v&&!b)return;let{point:m}=x,{timestamp:p}=Le;this.history.push({...m,timestamp:p});let{onStart:g,onMove:y}=this.handlers;v||(g&&g(this.lastMoveEvent,x),this.startEvent=this.lastMoveEvent),y&&y(this.lastMoveEvent,x)},this.handlePointerMove=(x,v)=>{this.lastMoveEvent=x,this.lastRawMoveEventInfo=v,this.lastMoveEventInfo=Mf(v,this.transformPagePoint),O.update(this.updatePoint,!0)},this.handlePointerUp=(x,v)=>{this.end();let{onEnd:b,onSessionEnd:m,resumeAnimation:p}=this.handlers;if((this.dragSnapToOrigin||!this.startEvent)&&p&&p(),!(this.lastMoveEvent&&this.lastMoveEventInfo))return;let g=Om(x.type==="pointercancel"?this.lastMoveEventInfo:Mf(v,this.transformPagePoint),this.history);this.startEvent&&b&&b(x,g),m&&m(x,g)},!lr(t))return;this.dragSnapToOrigin=i,this.handlers=a,this.transformPagePoint=o,this.distanceThreshold=n,this.contextWindow=r||window;let s=Ra(t),u=Mf(s,this.transformPagePoint),{point:f}=u,{timestamp:c}=Le;this.history=[{...f,timestamp:c}];let{onSessionStart:d}=a;d&&d(t,Om(u,this.history));let h={passive:!0,capture:!0};this.removeListeners=Ut(Co(this.contextWindow,"pointermove",this.handlePointerMove,h),Co(this.contextWindow,"pointerup",this.handlePointerUp,h),Co(this.contextWindow,"pointercancel",this.handlePointerUp,h)),l&&this.startScrollTracking(l)}startScrollTracking(t){let a=t.parentElement;for(;a;){let o=getComputedStyle(a);(Cw.has(o.overflowX)||Cw.has(o.overflowY))&&this.scrollPositions.set(a,{x:a.scrollLeft,y:a.scrollTop}),a=a.parentElement}this.scrollPositions.set(window,{x:window.scrollX,y:window.scrollY}),window.addEventListener("scroll",this.onElementScroll,{capture:!0}),window.addEventListener("scroll",this.onWindowScroll),this.removeScrollListeners=()=>{window.removeEventListener("scroll",this.onElementScroll,{capture:!0}),window.removeEventListener("scroll",this.onWindowScroll)}}handleScroll(t){let a=this.scrollPositions.get(t);if(!a)return;let o=t===window,r=o?{x:window.scrollX,y:window.scrollY}:{x:t.scrollLeft,y:t.scrollTop},i={x:r.x-a.x,y:r.y-a.y};i.x===0&&i.y===0||(o?this.lastMoveEventInfo&&(this.lastMoveEventInfo.point.x+=i.x,this.lastMoveEventInfo.point.y+=i.y):this.history.length>0&&(this.history[0].x-=i.x,this.history[0].y-=i.y),this.scrollPositions.set(t,r),O.update(this.updatePoint,!0))}updateHandlers(t){this.handlers=t}end(){this.removeListeners&&this.removeListeners(),this.removeScrollListeners&&this.removeScrollListeners(),this.scrollPositions.clear(),rt(this.updatePoint)}};function Mf(e,t){return t?{point:t(e.point)}:e}function Iw(e,t){return{x:e.x-t.x,y:e.y-t.y}}function Om({point:e},t){return{point:e,delta:Iw(e,Tw(t)),offset:Iw(e,FT(t)),velocity:UT(t,.1)}}function FT(e){return e[0]}function Tw(e){return e[e.length-1]}function UT(e,t){if(e.length<2)return{x:0,y:0};let a=e.length-1,o=null,r=Tw(e);for(;a>=0&&(o=e[a],!(r.timestamp-o.timestamp>be(t)));)a--;if(!o)return{x:0,y:0};o===e[0]&&e.length>2&&r.timestamp-o.timestamp>be(t)*2&&(o=e[1]);let i=Fe(r.timestamp-o.timestamp);if(i===0)return{x:0,y:0};let n={x:(r.x-o.x)/i,y:(r.y-o.y)/i};return n.x===1/0&&(n.x=0),n.y===1/0&&(n.y=0),n}function Bw(e,{min:t,max:a},o){return t!==void 0&&e<t?e=o?F(t,e,o.min):Math.max(e,t):a!==void 0&&e>a&&(e=o?F(a,e,o.max):Math.min(e,a)),e}function Aw(e,t,a){return{min:t!==void 0?e.min+t:void 0,max:a!==void 0?e.max+a-(e.max-e.min):void 0}}function Ew(e,{top:t,left:a,bottom:o,right:r}){return{x:Aw(e.x,a,r),y:Aw(e.y,t,o)}}function kw(e,t){let a=t.min-e.min,o=t.max-e.max;return t.max-t.min<e.max-e.min&&([a,o]=[o,a]),{min:a,max:o}}function Rw(e,t){return{x:kw(e.x,t.x),y:kw(e.y,t.y)}}function Pw(e,t){let a=.5,o=Ae(e),r=Ae(t);return r>o?a=$t(t.min,t.max-o,e.min):o>r&&(a=$t(e.min,e.max-r,t.min)),Be(0,1,a)}function Ow(e,t){let a={};return t.min!==void 0&&(a.min=t.min-e.min),t.max!==void 0&&(a.max=t.max-e.min),a}var Bf=.35;function Vw(e=Bf){return e===!1?e=0:e===!0&&(e=Bf),{x:Dw(e,"left","right"),y:Dw(e,"top","bottom")}}function Dw(e,t,a){return{min:Mw(e,t),max:Mw(e,a)}}function Mw(e,t){return typeof e=="number"?e:e[t]||0}var qT=new WeakMap,Rf=class{constructor(t){this.openDragLock=null,this.isDragging=!1,this.currentDirection=null,this.originPoint={x:0,y:0},this.constraints=!1,this.hasMutatedConstraints=!1,this.elastic=fe(),this.latestPointerEvent=null,this.latestPanInfo=null,this.visualElement=t}start(t,{snapToCursor:a=!1,distanceThreshold:o}={}){let{presenceContext:r}=this.visualElement;if(r&&r.isPresent===!1)return;let i=c=>{a&&this.snapToCursor(Ra(c).point),this.stopAnimation()},n=(c,d)=>{let{drag:h,dragPropagation:x,onDragStart:v}=this.getProps();if(h&&!x&&(this.openDragLock&&this.openDragLock(),this.openDragLock=Qp(h),!this.openDragLock))return;this.latestPointerEvent=c,this.latestPanInfo=d,this.isDragging=!0,this.currentDirection=null,this.resolveConstraints(),this.visualElement.projection&&(this.visualElement.projection.isAnimationBlocked=!0,this.visualElement.projection.target=void 0),mt(m=>{let p=this.getAxisMotionValue(m).get()||0;if(Xe.test(p)){let{projection:g}=this.visualElement;if(g&&g.layout){let y=g.layout.layoutBox[m];y&&(p=Ae(y)*(parseFloat(p)/100))}}this.originPoint[m]=p}),v&&O.update(()=>v(c,d),!1,!0),Li(this.visualElement,"transform");let{animationState:b}=this.visualElement;b&&b.setActive("whileDrag",!0)},l=(c,d)=>{this.latestPointerEvent=c,this.latestPanInfo=d;let{dragPropagation:h,dragDirectionLock:x,onDirectionLock:v,onDrag:b}=this.getProps();if(!h&&!this.openDragLock)return;let{offset:m}=d;if(x&&this.currentDirection===null){this.currentDirection=_T(m),this.currentDirection!==null&&v&&v(this.currentDirection);return}this.updateAxis("x",d.point,m),this.updateAxis("y",d.point,m),this.visualElement.render(),b&&O.update(()=>b(c,d),!1,!0)},s=(c,d)=>{this.latestPointerEvent=c,this.latestPanInfo=d,this.stop(c,d),this.latestPointerEvent=null,this.latestPanInfo=null},u=()=>{let{dragSnapToOrigin:c}=this.getProps();(c||this.constraints)&&this.startAnimation({x:0,y:0})},{dragSnapToOrigin:f}=this.getProps();this.panSession=new Ri(t,{onSessionStart:i,onStart:n,onMove:l,onSessionEnd:s,resumeAnimation:u},{transformPagePoint:this.visualElement.getTransformPagePoint(),dragSnapToOrigin:f,distanceThreshold:o,contextWindow:Df(this.visualElement),element:this.visualElement.current})}stop(t,a){let o=t||this.latestPointerEvent,r=a||this.latestPanInfo,i=this.isDragging;if(this.cancel(),!i||!r||!o)return;let{velocity:n}=r;this.startAnimation(n);let{onDragEnd:l}=this.getProps();l&&O.postRender(()=>l(o,r))}cancel(){this.isDragging=!1;let{projection:t,animationState:a}=this.visualElement;t&&(t.isAnimationBlocked=!1),this.endPanSession();let{dragPropagation:o}=this.getProps();!o&&this.openDragLock&&(this.openDragLock(),this.openDragLock=null),a&&a.setActive("whileDrag",!1)}endPanSession(){this.panSession&&this.panSession.end(),this.panSession=void 0}updateAxis(t,a,o){let{drag:r}=this.getProps();if(!o||!Ef(t,r,this.currentDirection))return;let i=this.getAxisMotionValue(t),n=this.originPoint[t]+o[t];this.constraints&&this.constraints[t]&&(n=Bw(n,this.constraints[t],this.elastic[t])),i.set(n)}resolveConstraints(){let{dragConstraints:t,dragElastic:a}=this.getProps(),o=this.visualElement.projection&&!this.visualElement.projection.layout?this.visualElement.projection.measure(!1):this.visualElement.projection?.layout,r=this.constraints;t&&So(t)?this.constraints||(this.constraints=this.resolveRefConstraints()):t&&o?this.constraints=Ew(o.layoutBox,t):this.constraints=!1,this.elastic=Vw(a),r!==this.constraints&&!So(t)&&o&&this.constraints&&!this.hasMutatedConstraints&&mt(i=>{this.constraints!==!1&&this.getAxisMotionValue(i)&&(this.constraints[i]=Ow(o.layoutBox[i],this.constraints[i]))})}resolveRefConstraints(){let{dragConstraints:t,onMeasureDragConstraints:a}=this.getProps();if(!t||!So(t))return!1;let o=t.current;ot(o!==null,"If `dragConstraints` is set as a React ref, that ref must be passed to another component's `ref` prop.","drag-constraints-ref");let{projection:r}=this.visualElement;if(!r||!r.layout)return!1;r.root&&(r.root.scroll=void 0,r.root.updateScroll());let i=pm(o,r.root,this.visualElement.getTransformPagePoint()),n=Rw(r.layout.layoutBox,i);if(a){let l=a(lm(n));this.hasMutatedConstraints=!!l,l&&(n=vl(l))}return n}startAnimation(t){let{drag:a,dragMomentum:o,dragElastic:r,dragTransition:i,dragSnapToOrigin:n,onDragTransitionEnd:l}=this.getProps(),s=this.constraints||{},u=mt(f=>{if(!Ef(f,a,this.currentDirection))return;let c=s&&s[f]||{};(n===!0||n===f)&&(c={min:0,max:0});let d=r?200:1e6,h=r?40:1e7,x={type:"inertia",velocity:o?t[f]:0,bounceStiffness:d,bounceDamping:h,timeConstant:750,restDelta:1,restSpeed:10,...i,...c};return this.startAxisValueAnimation(f,x)});return Promise.all(u).then(l)}startAxisValueAnimation(t,a){let o=this.getAxisMotionValue(t);return Li(this.visualElement,t),o.start(ar(t,o,0,a,this.visualElement,!1))}stopAnimation(){mt(t=>this.getAxisMotionValue(t).stop())}getAxisMotionValue(t){let a=`_drag${t.toUpperCase()}`,r=this.visualElement.getProps()[a];return r||this.visualElement.getValue(t,this.visualElement.latestValues[t]??0)}snapToCursor(t){mt(a=>{let{drag:o}=this.getProps();if(!Ef(a,o,this.currentDirection))return;let{projection:r}=this.visualElement,i=this.getAxisMotionValue(a);if(r&&r.layout){let{min:n,max:l}=r.layout.layoutBox[a],s=i.get()||0;i.set(t[a]-F(n,l,.5)+s)}})}scalePositionWithinConstraints(){if(!this.visualElement.current)return;let{drag:t,dragConstraints:a}=this.getProps(),{projection:o}=this.visualElement;if(!So(a)||!o||!this.constraints)return;this.stopAnimation();let r={x:0,y:0};mt(n=>{let l=this.getAxisMotionValue(n);if(l&&this.constraints!==!1){let s=l.get();r[n]=Pw({min:s,max:s},this.constraints[n])}});let{transformTemplate:i}=this.visualElement.getProps();this.visualElement.current.style.transform=i?i({},""):"none",o.root&&o.root.updateScroll(),o.updateLayout(),this.constraints=!1,this.resolveConstraints(),mt(n=>{if(!Ef(n,t,null))return;let l=this.getAxisMotionValue(n),{min:s,max:u}=this.constraints[n];l.set(F(s,u,r[n]))}),this.visualElement.render()}addListeners(){if(!this.visualElement.current)return;qT.set(this.visualElement,this);let t=this.visualElement.current,a=Co(t,"pointerdown",u=>{let{drag:f,dragListener:c=!0}=this.getProps(),d=u.target,h=d!==t&&tm(d);f&&c&&!h&&this.start(u)}),o,r=()=>{let{dragConstraints:u}=this.getProps();So(u)&&u.current&&(this.constraints=this.resolveRefConstraints(),o||(o=HT(t,u.current,()=>this.scalePositionWithinConstraints())))},{projection:i}=this.visualElement,n=i.addEventListener("measure",r);i&&!i.layout&&(i.root&&i.root.updateScroll(),i.updateLayout()),O.read(r);let l=ra(window,"resize",()=>this.scalePositionWithinConstraints()),s=i.addEventListener("didUpdate",(({delta:u,hasLayoutChanged:f})=>{this.isDragging&&f&&(mt(c=>{let d=this.getAxisMotionValue(c);d&&(this.originPoint[c]+=u[c].translate,d.set(d.get()+u[c].translate))}),this.visualElement.render())}));return()=>{l(),a(),n(),s&&s(),o&&o()}}getProps(){let t=this.visualElement.getProps(),{drag:a=!1,dragDirectionLock:o=!1,dragPropagation:r=!1,dragConstraints:i=!1,dragElastic:n=Bf,dragMomentum:l=!0}=t;return{...t,drag:a,dragDirectionLock:o,dragPropagation:r,dragConstraints:i,dragElastic:n,dragMomentum:l}}};function zw(e){let t=!0;return()=>{if(t){t=!1;return}e()}}function HT(e,t,a){let o=af(e,zw(a)),r=af(t,zw(a));return()=>{o(),r()}}function Ef(e,t,a){return(t===!0||t===e)&&(a===null||a===e)}function _T(e,t=10){let a=null;return Math.abs(e.y)>t?a="y":Math.abs(e.x)>t&&(a="x"),a}var Pf=class extends Re{constructor(t){super(t),this.removeGroupControls=me,this.removeListeners=me,this.controls=new Rf(t)}mount(){let{dragControls:t}=this.node.getProps();t&&(this.removeGroupControls=t.subscribe(this.controls)),this.removeListeners=this.controls.addListeners()||me}update(){let{dragControls:t}=this.node.getProps(),{dragControls:a}=this.node.prevProps||{};t!==a&&(this.removeGroupControls(),t&&(this.removeGroupControls=t.subscribe(this.controls)))}unmount(){this.removeGroupControls(),this.removeListeners(),this.controls.isDragging||this.controls.endPanSession()}};var Vm=e=>(t,a)=>{e&&O.update(()=>e(t,a),!1,!0)},Of=class extends Re{constructor(){super(...arguments),this.removePointerDownListener=me}onPointerDown(t){this.session=new Ri(t,this.createPanHandlers(),{transformPagePoint:this.node.getTransformPagePoint(),contextWindow:Df(this.node)})}createPanHandlers(){let{onPanSessionStart:t,onPanStart:a,onPan:o,onPanEnd:r}=this.node.getProps();return{onSessionStart:Vm(t),onStart:Vm(a),onMove:Vm(o),onEnd:(i,n)=>{delete this.session,r&&O.postRender(()=>r(i,n))}}}mount(){this.removePointerDownListener=Co(this.node.current,"pointerdown",t=>this.onPointerDown(t))}update(){this.session&&this.session.updateHandlers(this.createPanHandlers())}unmount(){this.removePointerDownListener(),this.session&&this.session.end()}};var Fw=q(li(),1);var Rl=q(G(),1);var zm=!1,Fm=class extends Rl.Component{componentDidMount(){let{visualElement:t,layoutGroup:a,switchLayoutGroup:o,layoutId:r}=this.props,{projection:i}=t;i&&(a.group&&a.group.add(i),o&&o.register&&r&&o.register(i),zm&&i.root.didUpdate(),i.addEventListener("animationComplete",()=>{this.safeToRemove()}),i.setOptions({...i.options,layoutDependency:this.props.layoutDependency,onExitComplete:()=>this.safeToRemove()})),mr.hasEverUpdated=!0}getSnapshotBeforeUpdate(t){let{layoutDependency:a,visualElement:o,drag:r,isPresent:i}=this.props,{projection:n}=o;return n&&(n.isPresent=i,t.layoutDependency!==a&&n.setOptions({...n.options,layoutDependency:a}),zm=!0,r||t.layoutDependency!==a||a===void 0||t.isPresent!==i?n.willUpdate():this.safeToRemove(),t.isPresent!==i&&(i?n.promote():n.relegate()||O.postRender(()=>{let l=n.getStack();(!l||!l.members.length)&&this.safeToRemove()}))),null}componentDidUpdate(){let{visualElement:t,layoutAnchor:a}=this.props,{projection:o}=t;o&&(o.options.layoutAnchor=a,o.root.didUpdate(),nr.postRender(()=>{!o.currentAnimation&&o.isLead()&&this.safeToRemove()}))}componentWillUnmount(){let{visualElement:t,layoutGroup:a,switchLayoutGroup:o}=this.props,{projection:r}=t;zm=!0,r&&(r.scheduleCheckAfterUnmount(),a&&a.group&&a.group.remove(r),o&&o.deregister&&o.deregister(r))}safeToRemove(){let{safeToRemove:t}=this.props;t&&t()}render(){return null}};function Vf(e){let[t,a]=xf(),o=(0,Rl.useContext)(si);return(0,Fw.jsx)(Fm,{...e,layoutGroup:o,switchLayoutGroup:(0,Rl.useContext)(Cf),isPresent:t,safeToRemove:a})}var Uw={pan:{Feature:Of},drag:{Feature:Pf,ProjectionNode:Dl,MeasureLayout:Vf}};function qw(e,t,a){let{props:o}=e;e.animationState&&o.whileHover&&e.animationState.setActive("whileHover",a==="Start");let r="onHover"+a,i=o[r];i&&O.postRender(()=>i(t,Ra(t)))}var zf=class extends Re{mount(){let{current:t}=this.node;t&&(this.unmount=Jp(t,(a,o)=>(qw(this.node,o,"Start"),r=>qw(this.node,r,"End"))))}unmount(){}};var Ff=class extends Re{constructor(){super(...arguments),this.isActive=!1}onFocus(){let t=!1;try{t=this.node.current.matches(":focus-visible")}catch{t=!0}!t||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!0),this.isActive=!0)}onBlur(){!this.isActive||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!1),this.isActive=!1)}mount(){this.unmount=Ut(ra(this.node.current,"focus",()=>this.onFocus()),ra(this.node.current,"blur",()=>this.onBlur()))}unmount(){}};function Hw(e,t,a){let{props:o}=e;if(e.current instanceof HTMLButtonElement&&e.current.disabled)return;e.animationState&&o.whileTap&&e.animationState.setActive("whileTap",a==="Start");let r="onTap"+(a==="End"?"":a),i=o[r];i&&O.postRender(()=>i(t,Ra(t)))}var Uf=class extends Re{mount(){let{current:t}=this.node;if(!t)return;let{globalTapTarget:a,propagate:o}=this.node.props;this.unmount=om(t,(r,i)=>(Hw(this.node,i,"Start"),(n,{success:l})=>Hw(this.node,n,l?"End":"Cancel")),{useGlobalTarget:a,stopPropagation:o?.tap===!1})}unmount(){}};var qm=new WeakMap,Um=new WeakMap,NT=e=>{let t=qm.get(e.target);t&&t(e)},GT=e=>{e.forEach(NT)};function XT({root:e,...t}){let a=e||document;Um.has(a)||Um.set(a,{});let o=Um.get(a),r=JSON.stringify(t);return o[r]||(o[r]=new IntersectionObserver(GT,{root:e,...t})),o[r]}function _w(e,t,a){let o=XT(t);return qm.set(e,a),o.observe(e),()=>{qm.delete(e),o.unobserve(e)}}var jT={some:0,all:1},qf=class extends Re{constructor(){super(...arguments),this.hasEnteredView=!1,this.isInView=!1}startObserver(){this.stopObserver?.();let{viewport:t={}}=this.node.getProps(),{root:a,margin:o,amount:r="some",once:i}=t,n={root:a?a.current:void 0,rootMargin:o,threshold:typeof r=="number"?r:jT[r]},l=s=>{let{isIntersecting:u}=s;if(this.isInView===u||(this.isInView=u,i&&!u&&this.hasEnteredView))return;u&&(this.hasEnteredView=!0),this.node.animationState&&this.node.animationState.setActive("whileInView",u);let{onViewportEnter:f,onViewportLeave:c}=this.node.getProps(),d=u?f:c;d&&d(s)};this.stopObserver=_w(this.node.current,n,l)}mount(){this.startObserver()}update(){if(typeof IntersectionObserver>"u")return;let{props:t,prevProps:a}=this.node;["amount","margin","root"].some(YT(t,a))&&this.startObserver()}unmount(){this.stopObserver?.(),this.hasEnteredView=!1,this.isInView=!1}};function YT({viewport:e={}},{viewport:t={}}={}){return a=>e[a]!==t[a]}var Nw={inView:{Feature:qf},tap:{Feature:Uf},focus:{Feature:Ff},hover:{Feature:zf}};var Gw={layout:{ProjectionNode:Dl,MeasureLayout:Vf}};var Xw={...Lw,...Nw,...Uw,...Gw};var ia=xw(Xw,vw);var _f=q(G());var jw=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),KT=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,a,o)=>o?o.toUpperCase():a.toLowerCase()),Hm=e=>{let t=KT(e);return t.charAt(0).toUpperCase()+t.slice(1)},Hf=(...e)=>e.filter((t,a,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===a).join(" ").trim(),Yw=e=>{for(let t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0};var Pl=q(G());var Kw={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};var Ww=(0,Pl.forwardRef)(({color:e="currentColor",size:t=24,strokeWidth:a=2,absoluteStrokeWidth:o,className:r="",children:i,iconNode:n,...l},s)=>(0,Pl.createElement)("svg",{ref:s,...Kw,width:t,height:t,stroke:e,strokeWidth:o?Number(a)*24/Number(t):a,className:Hf("lucide",r),...!i&&!Yw(l)&&{"aria-hidden":"true"},...l},[...n.map(([u,f])=>(0,Pl.createElement)(u,f)),...Array.isArray(i)?i:[i]]));var Zw=(e,t)=>{let a=(0,_f.forwardRef)(({className:o,...r},i)=>(0,_f.createElement)(Ww,{ref:i,iconNode:t,className:Hf(`lucide-${jw(Hm(e))}`,`lucide-${e}`,o),...r}));return a.displayName=Hm(e),a};var WT=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Io=Zw("sparkles",WT);var ZT=[{word:"serendipity",phonetic:"/\u02CCser.\u0259n\u02C8d\u026Ap.\u0259.ti/",pos:"n.",meaning:"\u610F\u5916\u53D1\u73B0\u73CD\u5947\u4E8B\u7269\u7684\u673A\u7F18\uFF1B\u4E0D\u671F\u800C\u9047\u7684\u7F8E\u597D",example:"Finding that rare vinyl record in a quiet alley was pure serendipity.",category:"aesthetic"},{word:"ephemeral",phonetic:"/\u026A\u02C8fem.\u0259r.\u0259l/",pos:"adj.",meaning:"\u671D\u751F\u66AE\u6B7B\u7684\uFF1B\u8F6C\u77AC\u5373\u901D\u7684\uFF1B\u77ED\u6682\u7684",example:"Cherry blossoms are celebrated for their ephemeral springtime beauty.",category:"aesthetic"},{word:"luminescence",phonetic:"/\u02CClu\u02D0.m\u026A\u02C8nes.\u0259ns/",pos:"n.",meaning:"\u51B7\u5149\uFF1B\u5FAE\u5149\uFF1B\u67D4\u548C\u7684\u53D1\u5149\u73B0\u8C61",example:"Midnight waves glowed with blue bioluminescence along the shore.",category:"aesthetic"},{word:"mellifluous",phonetic:"/me\u02C8l\u026Af.lu.\u0259s/",pos:"adj.",meaning:"\uFF08\u58F0\u97F3\u6216\u6587\u5B57\uFF09\u5982\u871C\u822C\u6D41\u7545\u751C\u7F8E\u7684\uFF1B\u60A6\u8033\u52A8\u542C\u7684",example:"The cello produced a rich, mellifluous resonance across the hall.",category:"aesthetic"},{word:"vellichor",phonetic:"/\u02C8vel.\u026A.k\u0254\u02D0r/",pos:"n.",meaning:"\u65E7\u4E66\u5E97\u4E2D\u5F25\u6F2B\u7684\u6000\u65E7\u6C14\u606F\u4E0E\u5C81\u6708\u7EB8\u9999",example:"Stepping into the secondhand bookshop filled her lungs with vellichor.",category:"aesthetic"},{word:"petrichor",phonetic:"/\u02C8pet.r\u026A.k\u0254\u02D0r/",pos:"n.",meaning:"\u4E45\u65F1\u9022\u7518\u9716\u65F6\u6CE5\u571F\u6563\u53D1\u51FA\u7684\u6E05\u65B0\u6C14\u606F",example:"After the summer storm, a warm petrichor rose from the stone courtyard.",category:"aesthetic"},{word:"halcyon",phonetic:"/\u02C8h\xE6l.si.\u0259n/",pos:"adj.",meaning:"\u5B81\u9759\u5E78\u798F\u7684\uFF1B\u98CE\u5E73\u6D6A\u9759\u7684\uFF1B\u7530\u56ED\u7267\u6B4C\u822C\u7684",example:"She often recalled the halcyon afternoons of her coastal childhood.",category:"aesthetic"},{word:"ethereal",phonetic:"/i\u02C8\u03B8\u026A\u0259.ri.\u0259l/",pos:"adj.",meaning:"\u8D85\u51E1\u8131\u4FD7\u7684\uFF1B\u7A7A\u7075\u98D8\u9038\u7684\uFF1B\u8F7B\u67D4\u4F3C\u96FE\u7684",example:"Morning mist gave the mountain pine forest an ethereal silhouette.",category:"aesthetic"},{word:"sonder",phonetic:"/\u02C8s\u0252n.d\u0259r/",pos:"n.",meaning:"\u610F\u8BC6\u5230\u6BCF\u4E2A\u8DEF\u4EBA\u90FD\u6709\u540C\u6837\u590D\u6742\u9C9C\u6D3B\u4EBA\u751F\u7684\u987F\u609F\u611F",example:"Watching train windows pass at dusk triggered a quiet moment of sonder.",category:"aesthetic"},{word:"solitude",phonetic:"/\u02C8s\u0252l.\u026A.tju\u02D0d/",pos:"n.",meaning:"\u72EC\u5904\uFF1B\u5E7D\u9759\uFF1B\u8FDC\u79BB\u55A7\u56A3\u7684\u81EA\u5728\u72B6\u6001",example:"Creative breakthroughs often bloom in deliberate solitude.",category:"aesthetic"},{word:"resilience",phonetic:"/r\u026A\u02C8z\u026Al.j\u0259ns/",pos:"n.",meaning:"\u97E7\u6027\uFF1B\u6297\u632B\u6298\u6062\u590D\u529B\uFF1B\u56DE\u5F39\u80FD\u529B",example:"True resilience is built through iterative adaptation under pressure.",category:"core"},{word:"paradigm",phonetic:"/\u02C8p\xE6r.\u0259.da\u026Am/",pos:"n.",meaning:"\u8303\u5F0F\uFF1B\u5178\u8303\uFF1B\u601D\u7EF4\u67B6\u6784\u6A21\u578B",example:"Tactile interfaces introduced a new paradigm for digital craftsmanship.",category:"core"},{word:"ubiquitous",phonetic:"/ju\u02D0\u02C8b\u026Ak.w\u026A.t\u0259s/",pos:"adj.",meaning:"\u65E0\u6240\u4E0D\u5728\u7684\uFF1B\u968F\u5904\u53EF\u89C1\u7684",example:"Mechanical switches have become ubiquitous among dedicated writers.",category:"core"},{word:"catalyst",phonetic:"/\u02C8k\xE6t.\u0259l.\u026Ast/",pos:"n.",meaning:"\u50AC\u5316\u5242\uFF1B\u4FC3\u6210\u91CD\u5927\u8F6C\u53D8\u7684\u5951\u673A",example:"Playful feedback acts as a catalyst for effortless memory retention.",category:"core"},{word:"meticulous",phonetic:"/m\u0259\u02C8t\u026Ak.j\u0259.l\u0259s/",pos:"adj.",meaning:"\u4E00\u4E1D\u4E0D\u82DF\u7684\uFF1B\u6781\u4E3A\u4E25\u8C28\u7EC6\u81F4\u7684",example:"Every keycap legend was aligned with meticulous typographic precision.",category:"core"},{word:"pragmatic",phonetic:"/pr\xE6\u0261\u02C8m\xE6t.\u026Ak/",pos:"adj.",meaning:"\u52A1\u5B9E\u7684\uFF1B\u6CE8\u91CD\u5B9E\u6548\u7684\uFF1B\u811A\u8E0F\u5B9E\u5730\u7684",example:"We adopted a pragmatic workflow that balances speed with clarity.",category:"core"},{word:"eloquent",phonetic:"/\u02C8el.\u0259.kw\u0259nt/",pos:"adj.",meaning:"\u96C4\u8FA9\u7684\uFF1B\u5BCC\u6709\u8868\u73B0\u529B\u7684\uFF1B\u4F20\u795E\u7684",example:"Simple kinetic motion can be more eloquent than a page of instructions.",category:"core"},{word:"synthesis",phonetic:"/\u02C8s\u026An.\u03B8\u0259.s\u026As/",pos:"n.",meaning:"\u7EFC\u5408\uFF1B\u5408\u6210\uFF1B\u5C06\u591A\u5143\u8981\u7D20\u878D\u4F1A\u8D2F\u901A",example:"This studio is a synthesis of acoustic physics and lexical memory.",category:"core"},{word:"momentum",phonetic:"/m\u0259\u02C8men.t\u0259m/",pos:"n.",meaning:"\u52A8\u91CF\uFF1B\u51B2\u529B\uFF1B\u6301\u7EED\u63A8\u8FDB\u7684\u52BF\u5934",example:"Once your fingers find a steady rhythm, typing builds unstoppable momentum.",category:"core"},{word:"cognizant",phonetic:"/\u02C8k\u0252\u0261.n\u026A.z\u0259nt/",pos:"adj.",meaning:"\u6E05\u6670\u8BA4\u77E5\u5230\u7684\uFF1B\u6DF1\u77E5\u2026\u7684",example:"Designers must remain cognizant of how tactile latency shapes focus.",category:"core"},{word:"kinematics",phonetic:"/\u02CCk\u026An.\u026A\u02C8m\xE6t.\u026Aks/",pos:"n.",meaning:"\u8FD0\u52A8\u5B66\uFF1B\u7269\u4F53\u8F68\u8FF9\u4E0E\u901F\u5EA6\u7684\u51E0\u4F55\u89C4\u5F8B",example:"Spring kinematics make every typed character leap with lifelike weight.",category:"tech"},{word:"haptic",phonetic:"/\u02C8h\xE6p.t\u026Ak/",pos:"adj.",meaning:"\u89E6\u89C9\u611F\u77E5\u7684\uFF1B\u63D0\u4F9B\u5B9E\u4F53\u89E6\u611F\u53CD\u9988\u7684",example:"Crisp acoustic clicks create a convincing illusion of haptic key travel.",category:"tech"},{word:"ergonomic",phonetic:"/\u02CC\u025C\u02D0.\u0261\u0259\u02C8n\u0252m.\u026Ak/",pos:"adj.",meaning:"\u7B26\u5408\u4EBA\u4F53\u5DE5\u5B66\u7684\uFF1B\u8212\u9002\u9AD8\u6548\u7684\u8BBE\u8BA1",example:"Sculpted keycap profiles provide an ergonomic resting angle for wrists.",category:"tech"},{word:"telemetry",phonetic:"/t\u0259\u02C8lem.\u0259.tri/",pos:"n.",meaning:"\u9065\u6D4B\u6570\u636E\uFF1B\u5B9E\u65F6\u4F20\u8F93\u7684\u8282\u5F8B\u4E0E\u901F\u5EA6\u6307\u6807",example:"Real-time keystroke cadence helps you refine finger dexterity.",category:"tech"},{word:"typography",phonetic:"/ta\u026A\u02C8p\u0252\u0261.r\u0259.fi/",pos:"n.",meaning:"\u5B57\u4F53\u6392\u5370\u827A\u672F\uFF1B\u7248\u5F0F\u8BBE\u8BA1\u7F8E\u5B66",example:"Kinetic typography transforms static vocabulary lists into living art.",category:"tech"},{word:"algorithm",phonetic:"/\u02C8\xE6l.\u0261\u0259.r\u026A\xF0.\u0259m/",pos:"n.",meaning:"\u7B97\u6CD5\uFF1B\u89E3\u51B3\u95EE\u9898\u7684\u6709\u5E8F\u8BA1\u7B97\u6CD5\u5219",example:"A procedural audio algorithm synthesizes each switch click in real time.",category:"tech"},{word:"resonance",phonetic:"/\u02C8rez.\u0259n.\u0259ns/",pos:"n.",meaning:"\u5171\u9E23\uFF1B\u8C10\u632F\uFF1B\u58F0\u97F3\u6216\u60C5\u611F\u7684\u6DF1\u5C42\u56DE\u54CD",example:"Polycarbonate plates add a warm acoustic resonance to every keystroke.",category:"tech"},{word:"iteration",phonetic:"/\u02CC\u026At.\u0259r\u02C8e\u026A.\u0283\u0259n/",pos:"n.",meaning:"\u8FED\u4EE3\uFF1B\u53CD\u590D\u6253\u78E8\u6F14\u8FDB\u7684\u8FC7\u7A0B",example:"Through rapid iteration, the keyboard layout achieved effortless flow.",category:"tech"},{word:"architecture",phonetic:"/\u02C8\u0251\u02D0.k\u026A.tek.t\u0283\u0259r/",pos:"n.",meaning:"\u67B6\u6784\uFF1B\u4F53\u7CFB\u7ED3\u6784\uFF1B\u7A7A\u95F4\u6784\u9020\u827A\u672F",example:"Clean modular architecture keeps high-speed particle animations smooth.",category:"tech"},{word:"craftsmanship",phonetic:"/\u02C8kr\u0251\u02D0fts.m\u0259n.\u0283\u026Ap/",pos:"n.",meaning:"\u5320\u5FC3\u5DE5\u827A\uFF1B\u7CBE\u6E5B\u7684\u624B\u5DE5\u4E0E\u5236\u9020\u54C1\u8D28",example:"Every detail of the keycap bevel reflects industrial craftsmanship.",category:"tech"}],QT={apple:{phonetic:"/\u02C8\xE6p.\u0259l/",pos:"n.",meaning:"\u82F9\u679C\uFF1B\u5E73\u5B89\u4E0E\u9971\u6EE1\u7684\u679C\u5B9E"},keyboard:{phonetic:"/\u02C8ki\u02D0.b\u0254\u02D0d/",pos:"n.",meaning:"\u952E\u76D8\uFF1B\u6307\u5C16\u6572\u51FB\u7075\u611F\u7684\u7434\u952E"},velocity:{phonetic:"/v\u0259\u02C8l\u0252s.\u0259.ti/",pos:"n.",meaning:"\u901F\u5EA6\uFF1B\u901F\u7387\uFF1B\u75BE\u9A70\u7684\u52A8\u91CF"},harmony:{phonetic:"/\u02C8h\u0251\u02D0.m\u0259.ni/",pos:"n.",meaning:"\u548C\u8C10\uFF1B\u548C\u5F26\uFF1B\u534F\u8C03\u4E00\u81F4\u7684\u97F5\u5F8B"},inspire:{phonetic:"/\u026An\u02C8spa\u026A\u0259r/",pos:"v.",meaning:"\u6FC0\u53D1\u7075\u611F\uFF1B\u9F13\u821E\uFF1B\u8D4B\u4E88\u751F\u547D\u529B"},flow:{phonetic:"/fl\u0259\u028A/",pos:"n./v.",meaning:"\u5FC3\u6D41\uFF1B\u6D41\u52A8\uFF1B\u5168\u795E\u8D2F\u6CE8\u7684\u987A\u7545\u72B6\u6001"},rhythm:{phonetic:"/\u02C8r\u026A\xF0.\u0259m/",pos:"n.",meaning:"\u8282\u594F\uFF1B\u5F8B\u52A8\uFF1B\u89C4\u5F8B\u8D77\u4F0F\u7684\u8282\u62CD"},create:{phonetic:"/kri\u02C8e\u026At/",pos:"v.",meaning:"\u521B\u9020\uFF1B\u521B\u4F5C\uFF1B\u4ECE\u65E0\u5230\u6709\u5730\u953B\u9020"},memory:{phonetic:"/\u02C8mem.\u0259r.i/",pos:"n.",meaning:"\u8BB0\u5FC6\uFF1B\u56DE\u5FC6\uFF1B\u8111\u6D77\u4E2D\u954C\u523B\u7684\u5370\u8BB0"},vocabulary:{phonetic:"/v\u0259\u02C8k\xE6b.j\u0259.l\u0259r.i/",pos:"n.",meaning:"\u8BCD\u6C47\uFF1B\u8BED\u6C47\uFF1B\u8868\u8FBE\u601D\u60F3\u7684\u8BCD\u5E93"},kinetic:{phonetic:"/k\u026A\u02C8net.\u026Ak/",pos:"adj.",meaning:"\u8FD0\u52A8\u7684\uFF1B\u52A8\u529B\u5B66\u7684\uFF1B\u5145\u6EE1\u6D3B\u529B\u7684"},tactile:{phonetic:"/\u02C8t\xE6k.ta\u026Al/",pos:"adj.",meaning:"\u89E6\u89C9\u7684\uFF1B\u53EF\u611F\u89E6\u7684\uFF1B\u6709\u5B9E\u4F53\u8D28\u611F\u7684"},lucid:{phonetic:"/\u02C8lu\u02D0.s\u026Ad/",pos:"adj.",meaning:"\u6E05\u6670\u6613\u61C2\u7684\uFF1B\u900F\u4EAE\u7684\uFF1B\u5934\u8111\u6E05\u9192\u7684"},zenith:{phonetic:"/\u02C8zen.\u026A\u03B8/",pos:"n.",meaning:"\u5DC5\u5CF0\uFF1B\u9876\u70B9\uFF1B\u5929\u9876"},aurora:{phonetic:"/\u0254\u02D0\u02C8r\u0254\u02D0.r\u0259/",pos:"n.",meaning:"\u6781\u5149\uFF1B\u66D9\u5149\uFF1B\u7834\u6653\u65F6\u7684\u7EDA\u4E3D\u5149\u8292"},nebula:{phonetic:"/\u02C8neb.j\u0259.l\u0259/",pos:"n.",meaning:"\u661F\u4E91\uFF1B\u5B87\u5B99\u6DF1\u5904\u7684\u53D1\u5149\u5C18\u57C3\u4E91"},horizon:{phonetic:"/h\u0259\u02C8ra\u026A.z\u0259n/",pos:"n.",meaning:"\u5730\u5E73\u7EBF\uFF1B\u773C\u754C\uFF1B\u8BA4\u77E5\u4E0E\u63A2\u7D22\u7684\u8FB9\u754C"},odyssey:{phonetic:"/\u02C8\u0252d.\u026A.si/",pos:"n.",meaning:"\u6F2B\u957F\u800C\u5145\u6EE1\u5947\u9047\u7684\u63A2\u7D22\u4E4B\u65C5"},alchemy:{phonetic:"/\u02C8\xE6l.k\u0259.mi/",pos:"n.",meaning:"\u70BC\u91D1\u672F\uFF1B\u5316\u8150\u673D\u4E3A\u795E\u5947\u7684\u5947\u5999\u8715\u53D8"},symphony:{phonetic:"/\u02C8s\u026Am.f\u0259.ni/",pos:"n.",meaning:"\u4EA4\u54CD\u4E50\uFF1B\u591A\u91CD\u5143\u7D20\u4EA4\u7EC7\u7684\u534E\u7F8E\u7BC7\u7AE0"},labyrinth:{phonetic:"/\u02C8l\xE6b.\u0259.r\u026An\u03B8/",pos:"n.",meaning:"\u8FF7\u5BAB\uFF1B\u9519\u7EFC\u590D\u6742\u7684\u7CBE\u5DE7\u7ED3\u6784"},euphoria:{phonetic:"/ju\u02D0\u02C8f\u0254\u02D0.ri.\u0259/",pos:"n.",meaning:"\u6B23\u5FEB\u611F\uFF1B\u6781\u5EA6\u7684\u6B22\u6B23\u4E0E\u632F\u594B"},nostalgia:{phonetic:"/n\u0252s\u02C8t\xE6l.d\u0292\u0259/",pos:"n.",meaning:"\u6000\u65E7\uFF1B\u4E61\u6101\uFF1B\u5BF9\u5F80\u6614\u7F8E\u597D\u65F6\u5149\u7684\u7737\u604B"},wanderlust:{phonetic:"/\u02C8w\u0252n.d\u0259.l\u028Cst/",pos:"n.",meaning:"\u6F2B\u6E38\u7656\uFF1B\u63A2\u7D22\u672A\u77E5\u8FDC\u65B9\u7684\u5F3A\u70C8\u6E34\u671B"},flourish:{phonetic:"/\u02C8fl\u028Cr.\u026A\u0283/",pos:"v./n.",meaning:"\u84EC\u52C3\u751F\u957F\uFF1B\u5174\u65FA\uFF1B\u534E\u4E3D\u7684\u6325\u6D12"},radiant:{phonetic:"/\u02C8re\u026A.di.\u0259nt/",pos:"adj.",meaning:"\u5149\u8292\u56DB\u5C04\u7684\uFF1B\u5BB9\u5149\u7115\u53D1\u7684\uFF1B\u707F\u70C2\u7684"},tranquil:{phonetic:"/\u02C8tr\xE6\u014B.kw\u026Al/",pos:"adj.",meaning:"\u5B81\u9759\u7684\uFF1B\u5E73\u9759\u7684\uFF1B\u5B89\u8BE6\u6F84\u6F88\u7684"},vibrant:{phonetic:"/\u02C8va\u026A.br\u0259nt/",pos:"adj.",meaning:"\u5145\u6EE1\u751F\u673A\u7684\uFF1B\u9C9C\u8273\u593A\u76EE\u7684\uFF1B\u5171\u632F\u6709\u529B\u7684"},enigma:{phonetic:"/\u026A\u02C8n\u026A\u0261.m\u0259/",pos:"n.",meaning:"\u8C1C\u56E2\uFF1B\u4EE4\u4EBA\u8D39\u89E3\u5374\u7740\u8FF7\u7684\u4EBA\u6216\u4E8B\u7269"},reverie:{phonetic:"/\u02C8rev.\u0259r.i/",pos:"n.",meaning:"\u767D\u65E5\u68A6\uFF1B\u9050\u60F3\uFF1B\u51FA\u795E\u7684\u5E7B\u60F3\u65F6\u523B"},cascade:{phonetic:"/k\xE6\u02C8ske\u026Ad/",pos:"n./v.",meaning:"\u5C0F\u7011\u5E03\uFF1B\u503E\u6CFB\u800C\u4E0B\uFF1B\u8FDE\u7EED\u4F20\u9012\u7684\u6D9F\u6F2A"},prism:{phonetic:"/\u02C8pr\u026Az.\u0259m/",pos:"n.",meaning:"\u68F1\u955C\uFF1B\u6298\u5C04\u51FA\u4E03\u5F69\u5149\u8C31\u7684\u591A\u9762\u6676\u4F53"},anchor:{phonetic:"/\u02C8\xE6\u014B.k\u0259r/",pos:"n./v.",meaning:"\u8239\u951A\uFF1B\u7CBE\u795E\u652F\u67F1\uFF1B\u7A33\u56FA\u505C\u6CCA"},forge:{phonetic:"/f\u0254\u02D0d\u0292/",pos:"v./n.",meaning:"\u953B\u9020\uFF1B\u9524\u70BC\uFF1B\u94C1\u5320\u7089\u4E2D\u7684\u5343\u9524\u767E\u70BC"},"status quo":{phonetic:"/\u02CCste\u026A.t\u0259s \u02C8kw\u0259\u028A/",pos:"phrase.",meaning:"\u73B0\u72B6\uFF1B\u65E2\u5B9A\u683C\u5C40\uFF1B\u5F53\u524D\u4E8B\u6001"},"carpe diem":{phonetic:"/\u02CCk\u0251\u02D0.pe\u026A \u02C8di\u02D0.em/",pos:"phrase.",meaning:"\u628A\u63E1\u5F53\u4E0B\uFF1B\u83AB\u8D1F\u97F6\u534E\uFF1B\u53CA\u65F6\u884C\u4E50"},"quantum leap":{phonetic:"/\u02CCkw\u0252n.t\u0259m \u02C8li\u02D0p/",pos:"phrase.",meaning:"\u8D28\u7684\u98DE\u8DC3\uFF1B\u7A81\u7834\u6027\u8FDB\u5C55"},"silver lining":{phonetic:"/\u02CCs\u026Al.v\u0259r \u02C8la\u026A.n\u026A\u014B/",pos:"phrase.",meaning:"\u4E4C\u4E91\u80CC\u540E\u7684\u91D1\u8FB9\uFF1B\u56F0\u5883\u4E2D\u7684\u4E00\u7EBF\u5E0C\u671B"},"paradigm shift":{phonetic:"/\u02C8p\xE6r.\u0259.da\u026Am \u0283\u026Aft/",pos:"phrase.",meaning:"\u8303\u5F0F\u8F6C\u79FB\uFF1B\u6839\u672C\u6027\u7684\u601D\u7EF4\u53D8\u9769"},"in full swing":{phonetic:"/\u026An f\u028Al sw\u026A\u014B/",pos:"phrase.",meaning:"\u6B63\u5982\u706B\u5982\u837C\u8FDB\u884C\u4E2D\uFF1B\u5904\u4E8E\u5168\u76DB\u6D3B\u8DC3\u72B6\u6001"}};function JT(e){let t=e.trim().toLowerCase().replace(/\s+/g," ");if(!t)return null;let a=ZT.find(r=>r.word.toLowerCase()===t);if(a)return a;let o=QT[t];return o?{word:t,phonetic:o.phonetic,pos:o.pos,meaning:o.meaning,example:o.example||`Typed and forged "${t}" in the kinetic studio.`,category:"custom"}:null}function Qw(e){let t=e.trim().toLowerCase().replace(/\s+/g," "),a=JT(t);if(a)return{phonetic:a.phonetic,pos:a.pos,meaning:a.meaning};if(t.includes(" ")){let r=t.split(" ").filter(Boolean).length;return{phonetic:`/${t}/`,pos:"phrase.",meaning:`\u81EA\u5B9A\u4E49\u8BCD\u7EC4 / \u77ED\u8BED\uFF08\u5171 ${r} \u4E2A\u5355\u8BCD\uFF0C\u53EF\u6309 Tab \u952E\u8865\u5145\u91CA\u4E49\uFF09`}}let o="n.";return t.endsWith("ly")?o="adv.":t.endsWith("ous")||t.endsWith("ive")||t.endsWith("ful")||t.endsWith("less")||t.endsWith("able")||t.endsWith("ic")||t.endsWith("al")?o="adj.":(t.endsWith("ize")||t.endsWith("ate")||t.endsWith("ify")||t.endsWith("ing")||t.endsWith("ed"))&&(o="v."),{phonetic:`/${t}/`,pos:o,meaning:"\u81EA\u5B9A\u4E49\u5F55\u5165\u8BCD\u6C47\uFF08\u53EF\u6309 Tab \u952E\u8865\u5145\u4E13\u5C5E\u91CA\u4E49\u6216\u7B14\u8BB0\uFF09"}}var Jw=q(G(),1),$T=[[{id:"q",label:"Q",finger:"pinky-l",row:0,col:0},{id:"w",label:"W",finger:"ring-l",row:0,col:1},{id:"e",label:"E",finger:"middle-l",row:0,col:2,isVowel:!0},{id:"r",label:"R",finger:"index-l",row:0,col:3},{id:"t",label:"T",finger:"index-l",row:0,col:4},{id:"y",label:"Y",finger:"index-r",row:0,col:5},{id:"u",label:"U",finger:"index-r",row:0,col:6,isVowel:!0},{id:"i",label:"I",finger:"middle-r",row:0,col:7,isVowel:!0},{id:"o",label:"O",finger:"ring-r",row:0,col:8,isVowel:!0},{id:"p",label:"P",finger:"pinky-r",row:0,col:9},{id:"backspace",label:"\u232B \u9000\u683C",subLabel:"BS",width:1.55,finger:"pinky-r",row:0,col:10}],[{id:"a",label:"A",finger:"pinky-l",row:1,col:0,isVowel:!0},{id:"s",label:"S",finger:"ring-l",row:1,col:1},{id:"d",label:"D",finger:"middle-l",row:1,col:2},{id:"f",label:"F",finger:"index-l",row:1,col:3,isHoming:!0},{id:"g",label:"G",finger:"index-l",row:1,col:4},{id:"h",label:"H",finger:"index-r",row:1,col:5},{id:"j",label:"J",finger:"index-r",row:1,col:6,isHoming:!0},{id:"k",label:"K",finger:"middle-r",row:1,col:7},{id:"l",label:"L",finger:"ring-r",row:1,col:8},{id:"enter",label:"\u21B5 \u953B\u9020\u5165\u5E93",subLabel:"ENTER",width:1.85,finger:"pinky-r",row:1,col:9,isAccent:!0}],[{id:"tab",label:"Tab \u91CA\u4E49",subLabel:"NOTE",width:1.35,finger:"pinky-l",row:2,col:0},{id:"z",label:"Z",finger:"pinky-l",row:2,col:1},{id:"x",label:"X",finger:"ring-l",row:2,col:2},{id:"c",label:"C",finger:"middle-l",row:2,col:3},{id:"v",label:"V",finger:"index-l",row:2,col:4},{id:"b",label:"B",finger:"index-l",row:2,col:5},{id:"n",label:"N",finger:"index-r",row:2,col:6},{id:"m",label:"M",finger:"index-r",row:2,col:7},{id:"-",label:"-",finger:"middle-r",row:2,col:8},{id:"speak",label:"\u{1F50A} \u6717\u8BFB",subLabel:"TTS",width:1.45,finger:"pinky-r",row:2,col:9}],[{id:"clear",label:"Esc \u6E05\u7A7A",width:1.4,finger:"pinky-l",row:3,col:0},{id:"morph",label:"\u2726 \u5B57\u6BCD\u53D8\u5F62",width:1.6,finger:"index-l",row:3,col:2},{id:" ",label:"SPACE \xB7 \u7A7A\u683C\u8F93\u5165 (\u8BCD\u7EC4\u95F4\u9694)",width:4.8,finger:"thumb",row:3,col:5},{id:"random",label:"\u{1F3B2} \u968F\u673A\u7075\u611F\u8BCD",width:1.9,finger:"pinky-r",row:3,col:9}]];function Ol(e){let t=e.toLowerCase();for(let a of $T)for(let o of a)if(o.id===t){let r=(o.col-4.5)/5,i=o.row/3;return{x:r,y:i}}return{x:(Math.random()-.5)*.8,y:.5}}var tb=[{id:"gummy",label:"Gummy Q\u5F39\u8F6F\u7CD6",desc:"\u5706\u6DA6\u9971\u6EE13D\u679C\u51BB\u9AD8\u5149Q\u5F39\u5B57\u5F62",category:"naked"},{id:"jelly",label:"\u6DB2\u6001\u878D\u58A8\u5B57\u9AA8",desc:"SVG \u6E4D\u6D41\u573A\u8BA9\u7B14\u753B\u6DB2\u6001\u878D\u5316",category:"naked"},{id:"spring",label:"\u6A61\u76AE\u62C9\u4F38\u5B57\u9AA8",desc:"\u53EF\u53D8\u5B57\u91CD\u4E0E\u5B57\u5BBD\u5F39\u6027\u62C9\u4E1D\u4F38\u7F29",category:"naked"},{id:"blocks",label:"\u65AD\u5C42\u5207\u7247\u5B57\u9AA8",desc:"\u5B57\u6BCD\u672C\u4F53\u6A2A\u5207\u4E09\u5C42\u4EA4\u9519\u6ED1\u79FB",category:"naked"},{id:"voxel",label:"\u50CF\u7D20\u70B9\u9635\u5B57\u9AA8",desc:"\u7EAF\u88F8\u50CF\u7D20\u9636\u68AF\u5B57\u5F62\u6CE2\u6D6A\u8D77\u4F0F",category:"naked"},{id:"typewriter",label:"\u9542\u7A7A\u53CC\u7EBF\u96D5\u7248",desc:"\u77E2\u91CF\u63CF\u8FB9\u5B57\u9AA8\u4E0E\u9519\u4F4D\u590D\u523B\u91CD\u5F71",category:"naked"},{id:"ransom",label:"\u526A\u62A5\u8D34\u7EB8\u5916\u6846",desc:"\u590D\u53E4\u6742\u5FD7\u526A\u62A5\u649E\u8272\u8D34\u7EB8\u5916\u6846",category:"framed"},{id:"toy-box",label:"\u7ACB\u4F53\u79EF\u6728\u5916\u6846",desc:"3D \u5012\u89D2\u5F69\u8272\u73A9\u5177\u79EF\u6728\u5757\u5916\u6846",category:"framed"},{id:"keycap-box",label:"\u673A\u68B0\u952E\u5E3D\u5916\u6846",desc:"PBT \u7403\u5E3D\u5185\u51F9\u7ACB\u4F53\u952E\u5E3D\u5916\u6846",category:"framed"},{id:"neon-box",label:"\u8D5B\u535A\u706F\u724C\u5916\u6846",desc:"\u6697\u5E95\u9713\u8679\u53D1\u5149\u8FB9\u6846\u4E0E\u6298\u89D2\u5FBD\u7AE0",category:"framed"}],eA=new Set(["a","e","i","o","u"]),$w=["bg-[#FFEDD5] dark:bg-amber-950/80 border-[#D94625] text-[#9A3412] dark:text-amber-200 shadow-[0_5px_0_#D94625]","bg-[#CCFBF1] dark:bg-teal-950/80 border-[#0D9488] text-[#115E59] dark:text-teal-200 shadow-[0_5px_0_#0D9488]","bg-[#FEF3C7] dark:bg-yellow-950/80 border-[#D97706] text-[#92400E] dark:text-yellow-200 shadow-[0_5px_0_#D97706]","bg-[#E0E7FF] dark:bg-indigo-950/80 border-[#4F46E5] text-[#3730A3] dark:text-indigo-200 shadow-[0_5px_0_#4F46E5]"],eb=["bg-zinc-900 text-[#FAF8F5] dark:bg-amber-400 dark:text-zinc-950 border-2 border-zinc-900 dark:border-amber-300 shadow-[3px_3px_0_#D94625]","bg-[#D94625] text-white border-2 border-zinc-900 dark:border-white shadow-[3px_3px_0_#18181B]","bg-[#FAF3E0] text-zinc-900 border-2 border-dashed border-zinc-800 shadow-[3px_3px_0_#0D9488]","bg-[#0D9488] text-white border-2 border-zinc-900 shadow-[3px_3px_0_#F59E0B]"],ab=({workspaceMode:e,onWorkspaceModeChange:t,visualMode:a,soundProfile:o="thock",onSoundProfileChange:r,typedChars:i,targetVocab:n,customMeaning:l,isEditingMeaning:s,onCustomMeaningChange:u,onToggleEditMeaning:f,onForgeCurrentWord:c,onSpeakCurrent:d,onPickRandomWord:h,onMorphAllLetters:x,onToggleSingleLetterSuper:v,onPluckLetter:b,errorShake:m,forgedBanner:p,particles:g,laserArcs:y,wpm:S,combo:A,isImmersive:w=!1,onToggleImmersive:L,darkMode:B=!1,onToggleDarkMode:I,forgedCount:_=0,forgedWords:Se=[],onReplayWord:_t,onSpeakWord:Rt,lastPressedKey:$e})=>{let je=i.map(T=>T.char).join(""),Vl=Qw(je),[le,it]=(0,k.useState)(!0),[na,To]=(0,k.useState)(!0),[xr,lb]=(0,k.useState)(0);(0,k.useEffect)(()=>{let T=setInterval(()=>{lb(M=>(M+1)%360)},50);return()=>clearInterval(T)},[]);let sb=(0,k.useRef)(null),Pi=(0,k.useRef)([]),Xm=(0,k.useRef)(0),[jm,Ym]=(0,k.useState)([]),[ub,fb]=(0,k.useState)([]),yr=k.default.useCallback((T,M=1,V=!1)=>{let R=Pi.current,Y=R[T];if(Y)if(V){if(Y.dy=-14*M,Y.vy=19*M,Y.dx=12*M,Y.vx=-18*M,Y.squash=.42*M,Y.vSquash=-.16*M,Y.vRot=-8*M,Y.impactFlash=1,T-1>=0&&R[T-1]){let W=R[T-1];W.vx-=14*M,W.vy-=7.5*M,W.vSquash+=.28*M,W.vRot-=6.5*M,W.impactFlash=.9}}else{if(Y.vy=15*M,Y.squash=.46*M,Y.vSquash=-.22*M,Y.vRot=(Math.random()-.5)*12*M,Y.impactFlash=1,T-1>=0&&R[T-1]){let W=R[T-1];W.vx-=13.5*M,W.vy-=6.5*M,W.vSquash+=.25*M,W.vRot-=6*M,W.impactFlash=.85}if(T+1<R.length&&R[T+1]){let W=R[T+1];W.vx+=13.5*M,W.vy-=6.5*M,W.vSquash+=.25*M,W.vRot+=6*M,W.impactFlash=.85}}},[]);(0,k.useEffect)(()=>{let T=Pi.current,M=new Map(T.map(R=>[R.id,R])),V=i.map(R=>{let Y=M.get(R.id);return Y||{id:R.id,dx:0,dy:0,vx:0,vy:0,squash:0,vSquash:0,rot:0,vRot:0,impactFlash:0}});if(Pi.current=V,i.length>Xm.current&&i.length>0){let R=i.length-1;yr(R,1.05,!0)}Xm.current=i.length},[i,yr]),(0,k.useEffect)(()=>{let T,M=w?58:36,V=M*.53,R=()=>{let Y=Pi.current,W=Y.length;if(W>0){for(let ee=0;ee<W-1;ee++){let E=Y[ee],xe=Y[ee+1],zl=ee*M+E.dx,Xf=E.dy,jf=(ee+1)*M+xe.dx,Fl=xe.dy,Yf=V*Math.max(.82,1+E.squash*.72),cb=V*Math.max(.82,1+xe.squash*.72),Wm=Yf+cb,Zm=jf-zl,Qm=Fl-Xf,Ul=Math.max(.001,Math.hypot(Zm,Qm));if(Ul<Wm){let Pa=Wm-Ul,Oi=Zm/Ul,Vi=Qm/Ul,ql=Pa*.36;E.dx-=Oi*ql,xe.dx+=Oi*ql,E.dy-=Vi*ql*.5,xe.dy+=Vi*ql*.5;let pb=xe.vx-E.vx,mb=xe.vy-E.vy,eh=pb*Oi+mb*Vi;if(eh<0){let Hl=-1.78*eh*.5;E.vx-=Hl*Oi,xe.vx+=Hl*Oi,E.vy-=Hl*Vi+Pa*.08,xe.vy+=Hl*Vi-Pa*.12}let th=Math.min(.09,Pa*.014);E.vSquash-=th,xe.vSquash+=th*.9,E.vRot-=Pa*.22,xe.vRot+=Pa*.22,E.impactFlash=Math.min(1,E.impactFlash+Pa*.06),xe.impactFlash=Math.min(1,xe.impactFlash+Pa*.06)}let Jm=(xe.dy-E.dy)*.065,$m=(xe.dx-E.dx)*.045;E.vy+=Jm,xe.vy-=Jm,E.vx+=$m,xe.vx-=$m}let Q=new Array(W);for(let ee=0;ee<W;ee++){let E=Y[ee],xe=.16,zl=.82;E.vx=(E.vx-E.dx*xe)*zl,E.vy=(E.vy-E.dy*xe)*zl,E.dx=Math.max(-28,Math.min(28,E.dx+E.vx)),E.dy=Math.max(-24,Math.min(24,E.dy+E.vy));let Xf=.21,jf=.8;E.vSquash=(E.vSquash-E.squash*Xf)*jf,E.squash=Math.max(-.42,Math.min(.48,E.squash+E.vSquash)),E.vRot=(E.vRot-E.rot*.18)*.8,E.rot=Math.max(-18,Math.min(18,E.rot+E.vRot)),E.impactFlash*=.88;let Fl=1+E.squash,Yf=Math.max(.62,Math.min(1.48,1/Math.max(.65,Fl)));Q[ee]={dx:Math.abs(E.dx)<.08?0:E.dx,dy:Math.abs(E.dy)<.08?0:E.dy,squashX:Fl,squashY:Yf,rot:Math.abs(E.rot)<.08?0:E.rot,impactFlash:E.impactFlash}}Ym(Q)}else Ym([]);T=requestAnimationFrame(R)};return T=requestAnimationFrame(R),()=>cancelAnimationFrame(T)},[w]),(0,k.useEffect)(()=>{if(!$e)return;let T=Ol($e.key),M=`fw-${$e.timestamp}-${Math.random()}`;fb(R=>[...R.slice(-4),{id:M,xPercent:Math.max(10,Math.min(90,50+T.x*42)),yPercent:82}]);let V=Pi.current;if(V.length>1){let R=(T.x+1)*.5*(V.length-1);V.forEach((Y,W)=>{let Q=W-R,ee=Math.abs(Q),E=Math.max(.15,1/(1+ee*.6));Y.vx+=(Q>=0?1:-1)*3.8*E,Y.vy-=3.2*E,Y.vSquash+=.08*E})}},[$e]);let oA=e==="guided"&&n?n.meaning:l.trim()||(je?Vl.meaning:w?"\u5168\u5C4F\u7269\u7406\u529B\u573A\u5DF2\u5F00\u542F \xB7 \u6572\u51FB\u952E\u76D8\u53D1\u5C04\u51B2\u51FB\u6CE2\u529B\u573A\uFF0C\u5F39\u98DE\u5E76\u78B0\u649E\u821E\u53F0\u4E0A\u7684\u953B\u9020\u8BCD\u4F53":"\u652F\u6301 6 \u79CD\u7EAF\u5B57\u9AA8\u53D8\u5F62 (\u542B Gummy Q\u5F39) \u4E0E 4 \u79CD\u7ECF\u5178\u5916\u6846\u6548\u679C\uFF1B\u6572\u51FB\u952E\u76D8\u53D1\u5C04\u51B2\u51FB\u529B\u573A\u78B0\u649E\u8BCD\u4F53"),rA=e==="guided"&&n?n.phonetic:je?Vl.phonetic:"/gummy-and-framed-modes/",iA=e==="guided"&&n?n.pos:je?Vl.pos:"lexicon",db=a==="typewriter"?Math.max(w?-300:-160,-i.length*(w?20:11)):0,Km=(T,M)=>{let V=eA.has(T.char.toLowerCase()),R=w?"text-6xl sm:text-8xl md:text-9xl":"text-4xl sm:text-6xl",Y=w?"text-5xl sm:text-7xl md:text-8xl":"text-3xl sm:text-5xl";if(T.char===" ")return a==="ransom"||a==="toy-box"||a==="keycap-box"||a==="neon-box"?k.default.createElement("span",{className:`inline-flex items-center justify-center font-mono select-none mx-1 px-2.5 py-1 rounded-lg border border-dashed border-[#D94625]/60 text-[#D94625] dark:text-amber-400 ${w?"text-2xl sm:text-4xl":"text-xs sm:text-sm"}`},"\u2423"):k.default.createElement("span",{className:`inline-block font-mono select-none mx-2 sm:mx-3 text-[#D94625] dark:text-amber-400 opacity-75 ${w?"text-4xl sm:text-6xl translate-y-3":"text-2xl sm:text-3xl translate-y-2"}`},"\u203F");let W=V&&le?"text-[#D94625] dark:text-amber-400":"text-zinc-900 dark:text-zinc-100";if(a==="gummy")return k.default.createElement("span",{style:{filter:"url(#glyph-gummy-specular)",animationDelay:`${M*75}ms`},className:`inline-block font-gummy font-bold animate-gummy-q leading-none tracking-normal select-none ${R} ${V&&le?"text-[#FF542E] dark:text-amber-400":"text-[#0D9488] dark:text-teal-300"}`},T.char);if(a==="jelly"){let Q=(xr+M*45)*(Math.PI/180),ee=1+Math.sin(Q)*.15,E=1-Math.sin(Q)*.13,xe=Math.cos(Q)*7;return k.default.createElement("span",{style:{filter:"url(#glyph-liquid-filter)",transform:`scale(${ee.toFixed(3)}, ${E.toFixed(3)}) skewX(${xe.toFixed(1)}deg)`,fontVariationSettings:`"wght" ${V?850:700}, "SOFT" 100, "WONK" 1`},className:`inline-block font-serif-morph animate-serif-morph leading-none tracking-tight select-none transition-transform ${R} ${W}`},T.char)}if(a==="spring")return k.default.createElement("span",{style:{animationDelay:`${M*105}ms`},className:`inline-block font-display animate-glyph-elastic leading-none select-none ${R} ${W}`},T.char);if(a==="blocks"){let Q=(M%2===0?1:-1)*4.5;return k.default.createElement("span",{className:`relative inline-block font-syne-wide font-extrabold leading-none select-none ${R} ${W}`},k.default.createElement("span",{className:"opacity-15"},T.char),k.default.createElement("span",{"aria-hidden":"true",style:{clipPath:"inset(0 0 64% 0)",transform:`translateX(${Q}px) skewX(-10deg)`},className:"absolute inset-0 text-[#D94625] dark:text-amber-400"},T.char),k.default.createElement("span",{"aria-hidden":"true",style:{clipPath:"inset(34% 0 34% 0)",transform:`translateX(${-Q*.75}px)`},className:"absolute inset-0 text-zinc-900 dark:text-zinc-100"},T.char),k.default.createElement("span",{"aria-hidden":"true",style:{clipPath:"inset(64% 0 0 0)",transform:`translateX(${Q*.85}px) skewX(8deg)`},className:"absolute inset-0 text-teal-600 dark:text-teal-400"},T.char))}if(a==="voxel")return k.default.createElement("span",{style:{filter:"url(#glyph-pixel-filter)"},className:`inline-block font-pixel-bare leading-none select-none ${R} ${V&&le?"text-[#D94625] dark:text-amber-400":"text-emerald-700 dark:text-emerald-400"}`},T.char);if(a==="typewriter")return k.default.createElement("span",{className:`relative inline-block font-serif-morph font-black leading-none select-none ${R}`},k.default.createElement("span",{"aria-hidden":"true",style:{transform:"translate(3px, 3px)"},className:`absolute inset-0 opacity-25 ${V&&le?"text-[#D94625]":"text-zinc-500 dark:text-zinc-400"}`},T.char),k.default.createElement("span",{className:V&&le?"glyph-outline-orange relative z-10":"glyph-outline-ink relative z-10"},T.char));if(a==="ransom"){let Q=eb[M%eb.length],ee=((M%2===0?1:-1)*3.5).toFixed(1);return k.default.createElement("span",{style:{transform:`rotate(${ee}deg)`},className:`inline-flex items-center justify-center font-display font-extrabold select-none px-2.5 sm:px-3.5 py-1 sm:py-1.5 mx-0.5 rounded-md ${Y} ${Q}`},T.char)}if(a==="toy-box"){let Q=$w[M%$w.length];return k.default.createElement("span",{className:`inline-flex items-center justify-center font-gummy font-bold select-none px-2.5 sm:px-3.5 py-1 sm:py-2 mx-0.5 rounded-xl border-2 ${Y} ${Q}`},T.char)}return a==="keycap-box"?k.default.createElement("span",{className:`inline-flex items-center justify-center font-mono font-bold select-none px-2.5 sm:px-3.5 pt-1 pb-2 mx-0.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-gradient-to-b from-white to-[#EBE7DF] dark:from-zinc-800 dark:to-zinc-900 shadow-[0_5px_0_#C7C1B5,inset_0_1px_1px_#FFFFFF] dark:shadow-[0_5px_0_#18181B,inset_0_1px_1px_rgba(255,255,255,0.12)] ${Y} ${W}`},T.char.toUpperCase()):k.default.createElement("span",{className:`relative inline-flex items-center justify-center font-syne-wide font-extrabold select-none px-2.5 sm:px-3.5 py-1 sm:py-1.5 mx-0.5 rounded-lg bg-zinc-950 text-white border-2 ${V&&le?"border-[#D94625] text-[#FF6B4A] shadow-[0_0_14px_rgba(217,70,37,0.45)]":"border-teal-400 text-teal-300 shadow-[0_0_14px_rgba(45,212,191,0.35)]"} ${Y}`},k.default.createElement("span",{className:"w-1.5 h-1.5 rounded-full bg-current absolute top-1 right-1 opacity-75"}),T.char)};return k.default.createElement("div",{className:w?"fixed inset-0 z-50 w-screen h-screen bg-[#F7F5F0] dark:bg-zinc-950 flex flex-col justify-between p-6 sm:p-10 overflow-hidden transition-colors":"kf-stage relative w-full flex flex-col overflow-hidden"},k.default.createElement("svg",{"aria-hidden":"true",className:"sr-only w-0 h-0 absolute"},k.default.createElement("defs",null,k.default.createElement("filter",{id:"glyph-gummy-specular",x:"-20%",y:"-20%",width:"140%",height:"140%"},k.default.createElement("feGaussianBlur",{in:"SourceAlpha",stdDeviation:"2.4",result:"blur"}),k.default.createElement("feSpecularLighting",{in:"blur",surfaceScale:"5",specularConstant:"0.95",specularExponent:"22",lightingColor:"#ffffff",result:"specOut"},k.default.createElement("fePointLight",{x:"-60",y:"-90",z:"160"})),k.default.createElement("feComposite",{in:"specOut",in2:"SourceAlpha",operator:"in",result:"specOut"}),k.default.createElement("feComposite",{in:"SourceGraphic",in2:"specOut",operator:"arithmetic",k1:"0",k2:"1",k3:"0.7",k4:"0",result:"litPaint"}),k.default.createElement("feDropShadow",{dx:"0",dy:"4",stdDeviation:"2",floodColor:"#D94625",floodOpacity:"0.22"})),k.default.createElement("filter",{id:"glyph-liquid-filter",x:"-20%",y:"-20%",width:"140%",height:"140%"},k.default.createElement("feTurbulence",{type:"fractalNoise",baseFrequency:"0.028 0.045",numOctaves:"2",seed:Math.floor(xr/4),result:"noise"}),k.default.createElement("feDisplacementMap",{in:"SourceGraphic",in2:"noise",scale:w?"9":"5.5",xChannelSelector:"R",yChannelSelector:"G"})),k.default.createElement("filter",{id:"glyph-pixel-filter",x:"-10%",y:"-10%",width:"120%",height:"120%"},k.default.createElement("feMorphology",{operator:"dilate",radius:"0.6"})))),k.default.createElement("div",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]",style:{backgroundImage:"radial-gradient(#A1A1AA 1px, transparent 1px)",backgroundSize:w?"28px 28px":"20px 20px"}}),k.default.createElement("svg",{"aria-hidden":"true",viewBox:"0 0 100 100",preserveAspectRatio:"none",className:"pointer-events-none absolute inset-0 w-full h-full z-0"},k.default.createElement(wo,null,y.map(T=>{let M=(T.startX+T.endX)/2,V=`M ${T.startX} 100 Q ${M} 15 ${T.endX} 50`;return k.default.createElement(ia.path,{key:T.id,d:V,fill:"none",stroke:T.color,strokeWidth:w?"0.5":"0.8",strokeDasharray:"3 2",initial:{pathLength:0,opacity:.9},animate:{pathLength:1,opacity:0},exit:{opacity:0},transition:{duration:.48,ease:"easeOut"}})}))),k.default.createElement("div",{ref:sb,className:`relative z-10 flex-1 flex flex-col items-center justify-center ${w?"py-8 min-h-[58vh]":"min-h-[225px] sm:min-h-[250px] py-5"}`},na&&k.default.createElement("div",{className:"pointer-events-none absolute inset-0 overflow-hidden z-0"},k.default.createElement(wo,null,ub.map(T=>k.default.createElement(ia.span,{key:T.id,initial:{scale:.2,opacity:.7},animate:{scale:4.2,opacity:0},exit:{opacity:0},transition:{duration:.65,ease:"easeOut"},style:{left:`${T.xPercent}%`,top:`${T.yPercent}%`},className:"absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#D94625]/45 dark:border-amber-400/45"})))),k.default.createElement("div",{className:"pointer-events-none absolute inset-0 overflow-hidden z-10"},k.default.createElement(wo,null,g.map(T=>{let M=w?1.65:1;return k.default.createElement(ia.span,{key:T.id,initial:{opacity:.95,x:T.x*M,y:T.y*M,scale:M,rotate:0},animate:{opacity:0,x:(T.x+T.dx)*M,y:(T.y+T.dy)*M,scale:.15,rotate:T.shape==="diamond"?225:140},exit:{opacity:0},transition:{duration:.62,ease:"easeOut"},style:{width:T.size,height:T.size,backgroundColor:T.color},className:`absolute left-1/2 top-1/2 ${T.shape==="circle"?"rounded-full":T.shape==="diamond"?"rotate-45 rounded-xs":"rounded-xs"}`})}))),k.default.createElement(wo,null,p&&k.default.createElement(ia.div,{key:p.word+p.wpm,initial:{opacity:0,y:24,scale:.85},animate:{opacity:1,y:w?-125:-68,scale:w?1.25:1},exit:{opacity:0,y:w?-165:-98,scale:.9},transition:{type:"spring",stiffness:380,damping:24},className:"pointer-events-none absolute z-30 flex items-center gap-2.5 px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-amber-400 text-white dark:text-zinc-950 shadow-lg text-xs sm:text-sm font-mono"},k.default.createElement(Io,{className:"w-4 h-4 text-[#D94625] dark:text-zinc-950"}),k.default.createElement("span",null,"\u5DF2\u6536\u5F55\uFF1A",p.word),k.default.createElement("span",{"aria-hidden":"true"},"\xB7"))),k.default.createElement(ia.div,{animate:m?{x:[-12,12,-10,10,-5,0]}:{x:db},transition:{type:"spring",stiffness:420,damping:26},className:`relative z-20 flex items-baseline justify-center flex-wrap ${w?"gap-2 sm:gap-3.5 px-8 py-6 min-h-[160px] max-w-6xl":"gap-1 sm:gap-2 px-4 py-3 min-h-[92px]"}`},e==="guided"&&n?n.word.split("").map((T,M)=>{let V=i[M],R=!!V,Y=M===i.length,W=Ol(T),Q=jm[M],ee=a==="gummy";return k.default.createElement("div",{key:`${n.word}-${M}`,className:"relative inline-flex items-baseline justify-center"},k.default.createElement(wo,{mode:"popLayout"},R?k.default.createElement(ia.span,{key:V.id,onMouseEnter:()=>{yr(M,1,!1),b(V.id,M)},onClick:()=>{yr(M,1.35,!1),v(V.id,M)},initial:{opacity:0,x:V.sourceX*(w?340:195),y:w?250:135,scaleX:ee?1.75:1.5,scaleY:ee?.35:.4,rotate:V.tilt*4},animate:{opacity:1,x:ee&&Q?Q.dx:0,y:ee&&Q?Q.dy:a==="voxel"?Math.sin((xr+M*38)*(Math.PI/180))*(w?14:7):0,scaleX:(V.isSuper?1.38:1)*(ee&&Q?Q.squashX:1),scaleY:(V.isSuper?1.48:1)*(ee&&Q?Q.squashY:1),rotate:ee&&Q?Q.rot:0},whileHover:{y:w?-18:-10,scaleY:1.38,scaleX:.84},exit:{opacity:0,scaleY:2,scaleX:.25,y:-45},transition:{type:"spring",stiffness:ee?320:360,damping:ee?10:14,mass:.72},className:"inline-block cursor-pointer",title:"\u70B9\u51FB\u6216\u5212\u8FC7\u5B57\u6BCD\uFF1A\u89E6\u53D1\u8F6F\u7CD6\u78B0\u649E\u6324\u538B\u5E76\u5411\u5DE6\u53F3\u76F8\u90BB\u5B57\u6BCD\u4F20\u9012\u4F4D\u79FB"},Km(V,M)):k.default.createElement("span",{className:`inline-block transition-all select-none ${a==="gummy"?"font-gummy":a==="voxel"?"font-pixel-bare":"font-display"} ${w?"px-1.5 text-6xl sm:text-8xl md:text-9xl":"px-1 text-4xl sm:text-6xl"} font-bold ${Y?"text-[#D94625]/70 dark:text-amber-400/70 underline decoration-wavy decoration-2 underline-offset-8 scale-105":"text-zinc-300/65 dark:text-zinc-700/65"}`,title:`\u5BF9\u5E94\u952E\u4F4D\u65B9\u5411: ${T===" "?"\u5E95\u90E8\u7A7A\u683C\u952E (Space)":W.x<0?"\u5DE6\u624B\u533A":"\u53F3\u624B\u533A"}`},T===" "?"\u203F":T)))}):k.default.createElement(k.default.Fragment,null,k.default.createElement(wo,{mode:"popLayout"},i.length===0?null:i.map((T,M)=>{let V=jm[M],R=a==="gummy";return k.default.createElement(ia.span,{key:T.id,layout:!0,onMouseEnter:()=>{yr(M,1,!1),b(T.id,M)},onClick:()=>{yr(M,1.35,!1),v(T.id,M)},initial:{opacity:0,x:T.sourceX*(w?380:215),y:w?260:140,scaleX:R?1.85:1.6,scaleY:R?.32:.35},animate:{opacity:1,x:R&&V?V.dx:0,y:R&&V?V.dy:a==="voxel"?Math.sin((xr+M*42)*(Math.PI/180))*(w?15:8):0,scaleX:(T.isSuper?1.38:1)*(R&&V?V.squashX:1),scaleY:(T.isSuper?1.48:1)*(R&&V?V.squashY:1),rotate:R&&V?V.rot:0},whileHover:{y:w?-18:-10,scaleY:1.42,scaleX:.8},exit:{opacity:0,y:55,scaleY:2,scaleX:.2},transition:{type:"spring",stiffness:R?310:350,damping:R?9.5:13,mass:.7},className:"inline-block cursor-pointer",title:"\u70B9\u51FB\u6216\u5212\u8FC7\u5B57\u6BCD\uFF1A\u89E6\u53D1\u8F6F\u7CD6\u78B0\u649E\u6324\u538B\u5E76\u5411\u5DE6\u53F3\u76F8\u90BB\u5B57\u6BCD\u4F20\u9012\u4F4D\u79FB"},Km(T,M))})),i.length>0&&k.default.createElement(ia.span,{animate:{opacity:[1,.2,1],scaleY:[1,.85,1]},transition:{duration:.9,repeat:1/0},className:`inline-block rounded-full bg-[#D94625] ml-1.5 self-center ${w?"w-2 h-16 sm:h-24":"w-1 h-9 sm:h-11"}`})))))};var tA={q:.1,w:.18,e:.26,r:.34,t:.42,y:.5,u:.58,i:.66,o:.74,p:.82,a:.12,s:.2,d:.28,f:.36,g:.44,h:.52,j:.6,k:.68,l:.76,z:.16,x:.24,c:.32,v:.4,b:.48,n:.56,m:.64},Nf=[261.63,293.66,329.63,392,440,523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.51],_m=class{ctx=null;noiseBuffer=null;getContext(){if(typeof window>"u")return null;if(!this.ctx){let t=window.AudioContext||window.webkitAudioContext;t&&(this.ctx=new t)}return this.ctx&&this.ctx.state==="suspended"&&this.ctx.resume().catch(()=>{}),this.ctx}getNoiseBuffer(t){if(this.noiseBuffer)return this.noiseBuffer;let a=t.sampleRate*.15,o=t.createBuffer(1,a,t.sampleRate),r=o.getChannelData(0);for(let i=0;i<a;i++)r[i]=Math.random()*2-1;return this.noiseBuffer=o,o}playKeystroke(t,a,o=0){if(a==="mute")return;let r=this.getContext();if(!r)return;let i=r.currentTime,n=t.toLowerCase(),s=.92+(tA[n]??.5)*.16+(Math.random()*.04-.02);if(a==="thock"){let u=r.createOscillator(),f=r.createGain(),c=t===" "||t==="Space"||t==="Enter",d=c?115:165*s;u.type="triangle",u.frequency.setValueAtTime(d*1.4,i),u.frequency.exponentialRampToValueAtTime(d*.45,i+.055),f.gain.setValueAtTime(.32,i),f.gain.exponentialRampToValueAtTime(.001,i+.065),u.connect(f),f.connect(r.destination),u.start(i),u.stop(i+.07);let h=r.createBufferSource();h.buffer=this.getNoiseBuffer(r);let x=r.createBiquadFilter();x.type="bandpass",x.frequency.setValueAtTime(c?680:950*s,i),x.Q.setValueAtTime(2.4,i);let v=r.createGain();v.gain.setValueAtTime(.24,i),v.gain.exponentialRampToValueAtTime(.001,i+.032),h.connect(x),x.connect(v),v.connect(r.destination),h.start(i),h.stop(i+.035)}else if(a==="clicky"){let u=r.createOscillator(),f=r.createGain();u.type="square",u.frequency.setValueAtTime(2900*s,i),u.frequency.exponentialRampToValueAtTime(900,i+.014),f.gain.setValueAtTime(.12,i),f.gain.exponentialRampToValueAtTime(.001,i+.016),u.connect(f),f.connect(r.destination),u.start(i),u.stop(i+.018);let c=r.createOscillator(),d=r.createGain();c.type="sine",c.frequency.setValueAtTime(320*s,i+.01),c.frequency.exponentialRampToValueAtTime(110,i+.045),d.gain.setValueAtTime(.2,i+.01),d.gain.exponentialRampToValueAtTime(.001,i+.048),c.connect(d),d.connect(r.destination),c.start(i+.01),c.stop(i+.05)}else if(a==="typewriter"){let u=r.createBufferSource();u.buffer=this.getNoiseBuffer(r);let f=r.createBiquadFilter();f.type="highpass",f.frequency.setValueAtTime(1200*s,i);let c=r.createGain();c.gain.setValueAtTime(.35,i),c.gain.exponentialRampToValueAtTime(.001,i+.028),u.connect(f),f.connect(c),c.connect(r.destination),u.start(i),u.stop(i+.03);let d=r.createOscillator(),h=r.createGain();d.type="sawtooth",d.frequency.setValueAtTime(620*s,i),d.frequency.exponentialRampToValueAtTime(180,i+.04),h.gain.setValueAtTime(.14,i),h.gain.exponentialRampToValueAtTime(.001,i+.045),d.connect(h),h.connect(r.destination),d.start(i),d.stop(i+.05)}else if(a==="melodic"){let u=(n.charCodeAt(0)+o)%Nf.length,f=Nf[Math.max(0,u)]||440,c=r.createOscillator(),d=r.createOscillator(),h=r.createGain(),x=r.createGain();c.type="sine",c.frequency.setValueAtTime(f,i),d.type="triangle",d.frequency.setValueAtTime(f*2,i),h.gain.setValueAtTime(.22,i),h.gain.exponentialRampToValueAtTime(.001,i+.32),x.gain.setValueAtTime(.05,i),x.gain.exponentialRampToValueAtTime(.001,i+.12),c.connect(h),d.connect(x),h.connect(r.destination),x.connect(r.destination),c.start(i),d.start(i),c.stop(i+.34),d.stop(i+.14)}}playWordForged(t){if(t==="mute")return;let a=this.getContext();if(!a)return;let o=a.currentTime;if(t==="typewriter"){let i=a.createOscillator(),n=a.createOscillator(),l=a.createGain();i.type="sine",i.frequency.setValueAtTime(2093,o),n.type="sine",n.frequency.setValueAtTime(4186*1.19,o),l.gain.setValueAtTime(.22,o),l.gain.exponentialRampToValueAtTime(8e-4,o+.65),i.connect(l),n.connect(l),l.connect(a.destination),i.start(o),n.start(o),i.stop(o+.68),n.stop(o+.68);return}[523.25,659.25,783.99,1046.5].forEach((i,n)=>{let l=a.createOscillator(),s=a.createGain(),u=o+n*.045;l.type="triangle",l.frequency.setValueAtTime(i,u),s.gain.setValueAtTime(.14,u),s.gain.exponentialRampToValueAtTime(.001,u+.36),l.connect(s),s.connect(a.destination),l.start(u),l.stop(u+.38)})}playError(t){if(t==="mute")return;let a=this.getContext();if(!a)return;let o=a.currentTime,r=a.createOscillator(),i=a.createGain();r.type="sawtooth",r.frequency.setValueAtTime(150,o),r.frequency.linearRampToValueAtTime(115,o+.09),i.gain.setValueAtTime(.12,o),i.gain.exponentialRampToValueAtTime(.001,o+.1),r.connect(i),i.connect(a.destination),r.start(o),r.stop(o+.11)}playPluck(t,a){if(a==="mute")return;let o=this.getContext();if(!o)return;let r=o.currentTime,i=Nf[t%Nf.length]||523.25,n=o.createOscillator(),l=o.createGain();n.type="sine",n.frequency.setValueAtTime(i,r),n.frequency.exponentialRampToValueAtTime(i*1.03,r+.08),l.gain.setValueAtTime(.16,r),l.gain.exponentialRampToValueAtTime(.001,r+.24),n.connect(l),l.connect(o.destination),n.start(r),n.stop(r+.25)}playSuperBoost(t){if(t==="mute")return;let a=this.getContext();if(!a)return;let o=a.currentTime,r=a.createOscillator(),i=a.createGain();r.type="triangle",r.frequency.setValueAtTime(320,o),r.frequency.exponentialRampToValueAtTime(760,o+.14),i.gain.setValueAtTime(.22,o),i.gain.exponentialRampToValueAtTime(.001,o+.16),r.connect(i),i.connect(a.destination),r.start(o),r.stop(o+.17)}},Nm=new _m;function ob(e){if(!(typeof window>"u"||!("speechSynthesis"in window)))try{window.speechSynthesis.cancel();let t=new SpeechSynthesisUtterance(e);t.lang="en-US",t.rate=.95,window.speechSynthesis.speak(t)}catch{}}function Gm({bridge:e}){let[t,a]=(0,H.useState)(()=>e.draft()),[o,r]=(0,H.useState)("gummy"),[i,n]=(0,H.useState)("mute"),[l,s]=(0,H.useState)(!0),[u,f]=(0,H.useState)(""),[c,d]=(0,H.useState)(null),[h,x]=(0,H.useState)(null),[v,b]=(0,H.useState)([]),m=(0,H.useRef)(void 0),p=(0,H.useRef)(void 0),g=(0,H.useRef)(null),y=(0,H.useRef)(0);function S(){s(!0),clearTimeout(m.current),m.current=setTimeout(()=>s(!1),2400)}(0,H.useEffect)(()=>(S(),g.current?.focus(),()=>{clearTimeout(m.current),clearTimeout(p.current)}),[]),(0,H.useEffect)(()=>{b(L=>Array.from(t).slice(-64).map((B,I)=>{if(L[I]?.char===B)return L[I];let _=Ol(B);return{id:"kf-"+ ++y.current,char:B,sourceX:_.x,sourceY:_.y,tilt:(Math.random()-.5)*8,velocityScore:1,variantSeed:Math.random()}}))},[t]);function A(L){a(L);try{e.saveDraft(L),f("")}catch{f("\u8349\u7A3F\u672A\u4FDD\u5B58\uFF0C\u8BF7\u4FDD\u7559\u9875\u9762\u5E76\u590D\u5236\u5185\u5BB9\u3002")}x({key:L.slice(-1),timestamp:Date.now()}),i!=="mute"&&Nm.playKeystroke(L.slice(-1),i,0),s(!1)}function w(){let L=t.trim();if(L)try{e.commit({id:crypto.randomUUID(),word:L,createdAt:Date.now()}),e.saveDraft(""),a(""),f("\u5DF2\u4FDD\u5B58\u5230 Minest"),d({word:L,meaning:"",wpm:0}),clearTimeout(p.current),p.current=setTimeout(()=>d(null),1500),i!=="mute"&&Nm.playWordForged(i),g.current?.focus()}catch{f("\u4FDD\u5B58\u5931\u8D25\uFF0C\u5185\u5BB9\u4ECD\u4FDD\u7559\uFF0C\u8BF7\u91CD\u8BD5\u6216\u590D\u5236\u5907\u4EFD\u3002"),S()}}return H.default.createElement("main",{className:"kf-app "+(l?"is-awake":""),onPointerMove:S,onPointerDown:S},H.default.createElement("header",{className:"kf-toolbar",onFocus:S},H.default.createElement("div",null,H.default.createElement("span",{className:"kf-mark"},"KEYFLOW"),H.default.createElement("span",{className:"kf-title"},"\u5F8B\u52A8\u5F55\u5165")),H.default.createElement("div",{className:"kf-actions"},H.default.createElement("select",{"aria-label":"\u5B57\u6BCD\u52A8\u6001\u6548\u679C",value:o,onChange:L=>r(L.target.value)},tb.map(L=>H.default.createElement("option",{key:L.id,value:L.id},L.label))),H.default.createElement("button",{"aria-label":i==="mute"?"\u5F00\u542F\u5F55\u5165\u58F0\u97F3":"\u5173\u95ED\u5F55\u5165\u58F0\u97F3",onClick:()=>n(L=>L==="mute"?"thock":"mute")},i==="mute"?"\u9759\u97F3":"\u58F0\u97F3"),H.default.createElement("button",{"aria-label":"\u5173\u95ED\u5F55\u5165",onClick:e.close},"\xD7"))),H.default.createElement("div",{className:"kf-canvas",onClick:L=>{L.target.closest("button,input,textarea,select")||g.current?.focus()}},H.default.createElement(ab,{workspaceMode:"free",visualMode:o,soundProfile:i,typedChars:v,targetVocab:null,customMeaning:"",isEditingMeaning:!1,onCustomMeaningChange:()=>{},onToggleEditMeaning:()=>{},onForgeCurrentWord:w,onSpeakCurrent:()=>ob(t),onPickRandomWord:()=>{},onMorphAllLetters:()=>{},onToggleSingleLetterSuper:L=>b(B=>B.map(I=>I.id===L?{...I,isSuper:!I.isSuper}:I)),onPluckLetter:L=>b(B=>B.map(I=>I.id===L?{...I,pluckedAt:Date.now()}:I)),errorShake:!1,forgedBanner:c,particles:[],laserArcs:[],wpm:0,combo:0,lastPressedKey:h}),!t&&!c&&H.default.createElement("div",{className:"kf-empty","aria-hidden":"true"},H.default.createElement("b",null,"editing"))),H.default.createElement("section",{className:"kf-composer"},H.default.createElement("label",{className:"sr-only",htmlFor:"kf-input"},"\u5F55\u5165\u5185\u5BB9"),H.default.createElement("textarea",{ref:g,id:"kf-input",value:t,placeholder:"\u5728\u8FD9\u91CC\u8F93\u5165\u2026",rows:2,onChange:L=>A(L.target.value),onKeyDown:L=>{L.key==="Enter"&&!L.shiftKey&&!L.nativeEvent.isComposing&&(L.preventDefault(),w()),L.key==="Escape"&&(L.preventDefault(),S())}}),H.default.createElement("button",{className:"kf-submit",onClick:w,disabled:!t.trim(),"aria-label":"\u4FDD\u5B58\u5F55\u5165\u5185\u5BB9"},"\u21B5"),H.default.createElement("p",{role:"status"},u||"Enter \u6536\u5F55 \xB7 Shift + Enter \u6362\u884C")),H.default.createElement("button",{className:"kf-reveal","aria-label":"\u663E\u793A\u5F55\u5165\u5DE5\u5177\u680F",onClick:S},"\xB7\xB7\xB7"))}var rb=`/*! tailwindcss v4.1.17 | MIT License | https://tailwindcss.com */
@layer properties;
@layer theme, base, components, utilities;
@layer theme {
  :root, :host {
    --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    --color-amber-50: oklch(98.7% 0.022 95.277);
    --color-amber-200: oklch(92.4% 0.12 95.746);
    --color-amber-300: oklch(87.9% 0.169 91.605);
    --color-amber-400: oklch(82.8% 0.189 84.429);
    --color-amber-950: oklch(27.9% 0.077 45.635);
    --color-yellow-200: oklch(94.5% 0.129 101.54);
    --color-yellow-950: oklch(28.6% 0.066 53.813);
    --color-emerald-100: oklch(95% 0.052 163.051);
    --color-emerald-400: oklch(76.5% 0.177 163.223);
    --color-emerald-700: oklch(50.8% 0.118 165.612);
    --color-emerald-900: oklch(37.8% 0.077 168.94);
    --color-emerald-950: oklch(26.2% 0.051 172.552);
    --color-teal-200: oklch(91% 0.096 180.426);
    --color-teal-300: oklch(85.5% 0.138 181.071);
    --color-teal-400: oklch(77.7% 0.152 181.912);
    --color-teal-600: oklch(60% 0.118 184.704);
    --color-teal-950: oklch(27.7% 0.046 192.524);
    --color-indigo-200: oklch(87% 0.065 274.039);
    --color-indigo-950: oklch(25.7% 0.09 281.288);
    --color-slate-100: oklch(96.8% 0.007 247.896);
    --color-slate-600: oklch(44.6% 0.043 257.281);
    --color-slate-700: oklch(37.2% 0.044 257.287);
    --color-slate-800: oklch(27.9% 0.041 260.031);
    --color-zinc-100: oklch(96.7% 0.001 286.375);
    --color-zinc-200: oklch(92% 0.004 286.32);
    --color-zinc-300: oklch(87.1% 0.006 286.286);
    --color-zinc-400: oklch(70.5% 0.015 286.067);
    --color-zinc-500: oklch(55.2% 0.016 285.938);
    --color-zinc-600: oklch(44.2% 0.017 285.786);
    --color-zinc-700: oklch(37% 0.013 285.805);
    --color-zinc-800: oklch(27.4% 0.006 286.033);
    --color-zinc-900: oklch(21% 0.006 285.885);
    --color-zinc-950: oklch(14.1% 0.005 285.823);
    --color-black: #000;
    --color-white: #fff;
    --spacing: 0.25rem;
    --container-6xl: 72rem;
    --text-xs: 0.75rem;
    --text-xs--line-height: calc(1 / 0.75);
    --text-sm: 0.875rem;
    --text-sm--line-height: calc(1.25 / 0.875);
    --text-base: 1rem;
    --text-base--line-height: calc(1.5 / 1);
    --text-2xl: 1.5rem;
    --text-2xl--line-height: calc(2 / 1.5);
    --text-3xl: 1.875rem;
    --text-3xl--line-height: calc(2.25 / 1.875);
    --text-4xl: 2.25rem;
    --text-4xl--line-height: calc(2.5 / 2.25);
    --text-5xl: 3rem;
    --text-5xl--line-height: 1;
    --text-6xl: 3.75rem;
    --text-6xl--line-height: 1;
    --text-7xl: 4.5rem;
    --text-7xl--line-height: 1;
    --text-8xl: 6rem;
    --text-8xl--line-height: 1;
    --text-9xl: 8rem;
    --text-9xl--line-height: 1;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    --font-weight-black: 900;
    --tracking-tight: -0.025em;
    --tracking-normal: 0em;
    --radius-xs: 0.125rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --radius-2xl: 1rem;
    --blur-xs: 4px;
    --default-transition-duration: 150ms;
    --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    --default-font-family: var(--font-sans);
    --default-mono-font-family: var(--font-mono);
  }
}
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  html, :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    font-feature-settings: var(--default-font-feature-settings, normal);
    font-variation-settings: var(--default-font-variation-settings, normal);
    -webkit-tap-highlight-color: transparent;
  }
  hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }
  abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }
  h1, h2, h3, h4, h5, h6 {
    font-size: inherit;
    font-weight: inherit;
  }
  a {
    color: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }
  b, strong {
    font-weight: bolder;
  }
  code, kbd, samp, pre {
    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
    font-feature-settings: var(--default-mono-font-feature-settings, normal);
    font-variation-settings: var(--default-mono-font-variation-settings, normal);
    font-size: 1em;
  }
  small {
    font-size: 80%;
  }
  sub, sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }
  sub {
    bottom: -0.25em;
  }
  sup {
    top: -0.5em;
  }
  table {
    text-indent: 0;
    border-color: inherit;
    border-collapse: collapse;
  }
  :-moz-focusring {
    outline: auto;
  }
  progress {
    vertical-align: baseline;
  }
  summary {
    display: list-item;
  }
  ol, ul, menu {
    list-style: none;
  }
  img, svg, video, canvas, audio, iframe, embed, object {
    display: block;
    vertical-align: middle;
  }
  img, video {
    max-width: 100%;
    height: auto;
  }
  button, input, select, optgroup, textarea, ::file-selector-button {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    border-radius: 0;
    background-color: transparent;
    opacity: 1;
  }
  :where(select:is([multiple], [size])) optgroup {
    font-weight: bolder;
  }
  :where(select:is([multiple], [size])) optgroup option {
    padding-inline-start: 20px;
  }
  ::file-selector-button {
    margin-inline-end: 4px;
  }
  ::placeholder {
    opacity: 1;
  }
  @supports (not (-webkit-appearance: -apple-pay-button))  or (contain-intrinsic-size: 1px) {
    ::placeholder {
      color: currentcolor;
      @supports (color: color-mix(in lab, red, red)) {
        color: color-mix(in oklab, currentcolor 50%, transparent);
      }
    }
  }
  textarea {
    resize: vertical;
  }
  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  ::-webkit-date-and-time-value {
    min-height: 1lh;
    text-align: inherit;
  }
  ::-webkit-datetime-edit {
    display: inline-flex;
  }
  ::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  ::-webkit-datetime-edit, ::-webkit-datetime-edit-year-field, ::-webkit-datetime-edit-month-field, ::-webkit-datetime-edit-day-field, ::-webkit-datetime-edit-hour-field, ::-webkit-datetime-edit-minute-field, ::-webkit-datetime-edit-second-field, ::-webkit-datetime-edit-millisecond-field, ::-webkit-datetime-edit-meridiem-field {
    padding-block: 0;
  }
  ::-webkit-calendar-picker-indicator {
    line-height: 1;
  }
  :-moz-ui-invalid {
    box-shadow: none;
  }
  button, input:where([type="button"], [type="reset"], [type="submit"]), ::file-selector-button {
    appearance: button;
  }
  ::-webkit-inner-spin-button, ::-webkit-outer-spin-button {
    height: auto;
  }
  [hidden]:where(:not([hidden="until-found"])) {
    display: none !important;
  }
}
@layer utilities {
  .pointer-events-none {
    pointer-events: none;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
  .absolute {
    position: absolute;
  }
  .fixed {
    position: fixed;
  }
  .relative {
    position: relative;
  }
  .static {
    position: static;
  }
  .inset-0 {
    inset: calc(var(--spacing) * 0);
  }
  .top-0 {
    top: calc(var(--spacing) * 0);
  }
  .top-1 {
    top: calc(var(--spacing) * 1);
  }
  .top-1\\.5 {
    top: calc(var(--spacing) * 1.5);
  }
  .top-1\\/2 {
    top: calc(1/2 * 100%);
  }
  .right-0 {
    right: calc(var(--spacing) * 0);
  }
  .right-1 {
    right: calc(var(--spacing) * 1);
  }
  .right-1\\.5 {
    right: calc(var(--spacing) * 1.5);
  }
  .bottom-0 {
    bottom: calc(var(--spacing) * 0);
  }
  .left-1\\/2 {
    left: calc(1/2 * 100%);
  }
  .z-0 {
    z-index: 0;
  }
  .z-10 {
    z-index: 10;
  }
  .z-20 {
    z-index: 20;
  }
  .z-30 {
    z-index: 30;
  }
  .z-50 {
    z-index: 50;
  }
  .mx-0\\.5 {
    margin-inline: calc(var(--spacing) * 0.5);
  }
  .mx-1 {
    margin-inline: calc(var(--spacing) * 1);
  }
  .mx-2 {
    margin-inline: calc(var(--spacing) * 2);
  }
  .mx-auto {
    margin-inline: auto;
  }
  .my-2 {
    margin-block: calc(var(--spacing) * 2);
  }
  .mt-0\\.5 {
    margin-top: calc(var(--spacing) * 0.5);
  }
  .mt-1 {
    margin-top: calc(var(--spacing) * 1);
  }
  .mb-2 {
    margin-bottom: calc(var(--spacing) * 2);
  }
  .ml-0\\.5 {
    margin-left: calc(var(--spacing) * 0.5);
  }
  .ml-1\\.5 {
    margin-left: calc(var(--spacing) * 1.5);
  }
  .block {
    display: block;
  }
  .flex {
    display: flex;
  }
  .inline-block {
    display: inline-block;
  }
  .inline-flex {
    display: inline-flex;
  }
  .h-0 {
    height: calc(var(--spacing) * 0);
  }
  .h-1\\.5 {
    height: calc(var(--spacing) * 1.5);
  }
  .h-2 {
    height: calc(var(--spacing) * 2);
  }
  .h-3 {
    height: calc(var(--spacing) * 3);
  }
  .h-3\\.5 {
    height: calc(var(--spacing) * 3.5);
  }
  .h-4 {
    height: calc(var(--spacing) * 4);
  }
  .h-9 {
    height: calc(var(--spacing) * 9);
  }
  .h-11 {
    height: calc(var(--spacing) * 11);
  }
  .h-16 {
    height: calc(var(--spacing) * 16);
  }
  .h-20 {
    height: calc(var(--spacing) * 20);
  }
  .h-\\[2px\\] {
    height: 2px;
  }
  .h-\\[78\\%\\] {
    height: 78%;
  }
  .h-full {
    height: 100%;
  }
  .h-screen {
    height: 100vh;
  }
  .min-h-\\[58vh\\] {
    min-height: 58vh;
  }
  .min-h-\\[92px\\] {
    min-height: 92px;
  }
  .min-h-\\[160px\\] {
    min-height: 160px;
  }
  .min-h-\\[225px\\] {
    min-height: 225px;
  }
  .w-0 {
    width: calc(var(--spacing) * 0);
  }
  .w-1 {
    width: calc(var(--spacing) * 1);
  }
  .w-1\\.5 {
    width: calc(var(--spacing) * 1.5);
  }
  .w-2 {
    width: calc(var(--spacing) * 2);
  }
  .w-3 {
    width: calc(var(--spacing) * 3);
  }
  .w-3\\.5 {
    width: calc(var(--spacing) * 3.5);
  }
  .w-4 {
    width: calc(var(--spacing) * 4);
  }
  .w-16 {
    width: calc(var(--spacing) * 16);
  }
  .w-20 {
    width: calc(var(--spacing) * 20);
  }
  .w-\\[84\\%\\] {
    width: 84%;
  }
  .w-full {
    width: 100%;
  }
  .w-screen {
    width: 100vw;
  }
  .max-w-6xl {
    max-width: var(--container-6xl);
  }
  .flex-1 {
    flex: 1;
  }
  .shrink-0 {
    flex-shrink: 0;
  }
  .-translate-x-1\\/2 {
    --tw-translate-x: calc(calc(1/2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .-translate-y-1\\/2 {
    --tw-translate-y: calc(calc(1/2 * 100%) * -1);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .translate-y-0 {
    --tw-translate-y: calc(var(--spacing) * 0);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .translate-y-2 {
    --tw-translate-y: calc(var(--spacing) * 2);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .translate-y-3 {
    --tw-translate-y: calc(var(--spacing) * 3);
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .translate-y-\\[2\\.5px\\] {
    --tw-translate-y: 2.5px;
    translate: var(--tw-translate-x) var(--tw-translate-y);
  }
  .scale-105 {
    --tw-scale-x: 105%;
    --tw-scale-y: 105%;
    --tw-scale-z: 105%;
    scale: var(--tw-scale-x) var(--tw-scale-y);
  }
  .scale-\\[0\\.997\\] {
    scale: 0.997;
  }
  .rotate-45 {
    rotate: 45deg;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .flex-col {
    flex-direction: column;
  }
  .flex-wrap {
    flex-wrap: wrap;
  }
  .items-baseline {
    align-items: baseline;
  }
  .items-center {
    align-items: center;
  }
  .justify-between {
    justify-content: space-between;
  }
  .justify-center {
    justify-content: center;
  }
  .gap-1 {
    gap: calc(var(--spacing) * 1);
  }
  .gap-1\\.5 {
    gap: calc(var(--spacing) * 1.5);
  }
  .gap-2 {
    gap: calc(var(--spacing) * 2);
  }
  .gap-2\\.5 {
    gap: calc(var(--spacing) * 2.5);
  }
  .gap-3 {
    gap: calc(var(--spacing) * 3);
  }
  .self-center {
    align-self: center;
  }
  .overflow-hidden {
    overflow: hidden;
  }
  .rounded-2xl {
    border-radius: var(--radius-2xl);
  }
  .rounded-\\[5px\\] {
    border-radius: 5px;
  }
  .rounded-full {
    border-radius: calc(infinity * 1px);
  }
  .rounded-lg {
    border-radius: var(--radius-lg);
  }
  .rounded-md {
    border-radius: var(--radius-md);
  }
  .rounded-xl {
    border-radius: var(--radius-xl);
  }
  .rounded-xs {
    border-radius: var(--radius-xs);
  }
  .border {
    border-style: var(--tw-border-style);
    border-width: 1px;
  }
  .border-2 {
    border-style: var(--tw-border-style);
    border-width: 2px;
  }
  .border-r {
    border-right-style: var(--tw-border-style);
    border-right-width: 1px;
  }
  .border-b {
    border-bottom-style: var(--tw-border-style);
    border-bottom-width: 1px;
  }
  .border-dashed {
    --tw-border-style: dashed;
    border-style: dashed;
  }
  .border-\\[\\#0D9488\\] {
    border-color: #0D9488;
  }
  .border-\\[\\#4F46E5\\] {
    border-color: #4F46E5;
  }
  .border-\\[\\#B8371B\\] {
    border-color: #B8371B;
  }
  .border-\\[\\#C5D1C2\\] {
    border-color: #C5D1C2;
  }
  .border-\\[\\#D0CBBF\\] {
    border-color: #D0CBBF;
  }
  .border-\\[\\#D5DFD2\\] {
    border-color: #D5DFD2;
  }
  .border-\\[\\#D94625\\] {
    border-color: #D94625;
  }
  .border-\\[\\#D94625\\]\\/45 {
    border-color: color-mix(in oklab, #D94625 45%, transparent);
  }
  .border-\\[\\#D94625\\]\\/50 {
    border-color: color-mix(in oklab, #D94625 50%, transparent);
  }
  .border-\\[\\#D94625\\]\\/60 {
    border-color: color-mix(in oklab, #D94625 60%, transparent);
  }
  .border-\\[\\#D97706\\] {
    border-color: #D97706;
  }
  .border-\\[\\#DFDBD2\\] {
    border-color: #DFDBD2;
  }
  .border-\\[\\#E2DDD3\\] {
    border-color: #E2DDD3;
  }
  .border-black\\/10 {
    border-color: color-mix(in srgb, #000 10%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      border-color: color-mix(in oklab, var(--color-black) 10%, transparent);
    }
  }
  .border-slate-600 {
    border-color: var(--color-slate-600);
  }
  .border-slate-700 {
    border-color: var(--color-slate-700);
  }
  .border-teal-400 {
    border-color: var(--color-teal-400);
  }
  .border-zinc-200 {
    border-color: var(--color-zinc-200);
  }
  .border-zinc-200\\/90 {
    border-color: color-mix(in srgb, oklch(92% 0.004 286.32) 90%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      border-color: color-mix(in oklab, var(--color-zinc-200) 90%, transparent);
    }
  }
  .border-zinc-300 {
    border-color: var(--color-zinc-300);
  }
  .border-zinc-400 {
    border-color: var(--color-zinc-400);
  }
  .border-zinc-700 {
    border-color: var(--color-zinc-700);
  }
  .border-zinc-800 {
    border-color: var(--color-zinc-800);
  }
  .border-zinc-900 {
    border-color: var(--color-zinc-900);
  }
  .bg-\\[\\#0D9488\\] {
    background-color: #0D9488;
  }
  .bg-\\[\\#CCFBF1\\] {
    background-color: #CCFBF1;
  }
  .bg-\\[\\#D94625\\] {
    background-color: #D94625;
  }
  .bg-\\[\\#D94625\\]\\/75 {
    background-color: color-mix(in oklab, #D94625 75%, transparent);
  }
  .bg-\\[\\#DFE6DD\\] {
    background-color: #DFE6DD;
  }
  .bg-\\[\\#E0E7FF\\] {
    background-color: #E0E7FF;
  }
  .bg-\\[\\#E6E2D8\\] {
    background-color: #E6E2D8;
  }
  .bg-\\[\\#F6F8F5\\] {
    background-color: #F6F8F5;
  }
  .bg-\\[\\#F7F5F0\\] {
    background-color: #F7F5F0;
  }
  .bg-\\[\\#FAF3E0\\] {
    background-color: #FAF3E0;
  }
  .bg-\\[\\#FAF8F5\\] {
    background-color: #FAF8F5;
  }
  .bg-\\[\\#FAF9F5\\] {
    background-color: #FAF9F5;
  }
  .bg-\\[\\#FEF3C7\\] {
    background-color: #FEF3C7;
  }
  .bg-\\[\\#FFEDD5\\] {
    background-color: #FFEDD5;
  }
  .bg-amber-50 {
    background-color: var(--color-amber-50);
  }
  .bg-amber-50\\/50 {
    background-color: color-mix(in srgb, oklch(98.7% 0.022 95.277) 50%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-amber-50) 50%, transparent);
    }
  }
  .bg-amber-50\\/90 {
    background-color: color-mix(in srgb, oklch(98.7% 0.022 95.277) 90%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-amber-50) 90%, transparent);
    }
  }
  .bg-black\\/\\[0\\.06\\] {
    background-color: color-mix(in srgb, #000 6%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-black) 6%, transparent);
    }
  }
  .bg-current {
    background-color: currentcolor;
  }
  .bg-slate-700 {
    background-color: var(--color-slate-700);
  }
  .bg-slate-800 {
    background-color: var(--color-slate-800);
  }
  .bg-white {
    background-color: var(--color-white);
  }
  .bg-white\\/85 {
    background-color: color-mix(in srgb, #fff 85%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in oklab, var(--color-white) 85%, transparent);
    }
  }
  .bg-zinc-400 {
    background-color: var(--color-zinc-400);
  }
  .bg-zinc-800 {
    background-color: var(--color-zinc-800);
  }
  .bg-zinc-900 {
    background-color: var(--color-zinc-900);
  }
  .bg-zinc-950 {
    background-color: var(--color-zinc-950);
  }
  .bg-gradient-to-b {
    --tw-gradient-position: to bottom in oklab;
    background-image: linear-gradient(var(--tw-gradient-stops));
  }
  .bg-gradient-to-l {
    --tw-gradient-position: to left in oklab;
    background-image: linear-gradient(var(--tw-gradient-stops));
  }
  .from-black\\/\\[0\\.02\\] {
    --tw-gradient-from: color-mix(in srgb, #000 2%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      --tw-gradient-from: color-mix(in oklab, var(--color-black) 2%, transparent);
    }
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
  }
  .from-white {
    --tw-gradient-from: var(--color-white);
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
  }
  .to-\\[\\#EBE7DF\\] {
    --tw-gradient-to: #EBE7DF;
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
  }
  .to-transparent {
    --tw-gradient-to: transparent;
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
  }
  .p-2\\.5 {
    padding: calc(var(--spacing) * 2.5);
  }
  .p-3\\.5 {
    padding: calc(var(--spacing) * 3.5);
  }
  .p-6 {
    padding: calc(var(--spacing) * 6);
  }
  .px-1 {
    padding-inline: calc(var(--spacing) * 1);
  }
  .px-1\\.5 {
    padding-inline: calc(var(--spacing) * 1.5);
  }
  .px-2 {
    padding-inline: calc(var(--spacing) * 2);
  }
  .px-2\\.5 {
    padding-inline: calc(var(--spacing) * 2.5);
  }
  .px-3 {
    padding-inline: calc(var(--spacing) * 3);
  }
  .px-4 {
    padding-inline: calc(var(--spacing) * 4);
  }
  .px-8 {
    padding-inline: calc(var(--spacing) * 8);
  }
  .py-0\\.5 {
    padding-block: calc(var(--spacing) * 0.5);
  }
  .py-1 {
    padding-block: calc(var(--spacing) * 1);
  }
  .py-1\\.5 {
    padding-block: calc(var(--spacing) * 1.5);
  }
  .py-2\\.5 {
    padding-block: calc(var(--spacing) * 2.5);
  }
  .py-3 {
    padding-block: calc(var(--spacing) * 3);
  }
  .py-5 {
    padding-block: calc(var(--spacing) * 5);
  }
  .py-6 {
    padding-block: calc(var(--spacing) * 6);
  }
  .py-8 {
    padding-block: calc(var(--spacing) * 8);
  }
  .pt-1 {
    padding-top: calc(var(--spacing) * 1);
  }
  .pr-2 {
    padding-right: calc(var(--spacing) * 2);
  }
  .pb-2 {
    padding-bottom: calc(var(--spacing) * 2);
  }
  .pb-2\\.5 {
    padding-bottom: calc(var(--spacing) * 2.5);
  }
  .font-mono {
    font-family: var(--font-mono);
  }
  .text-2xl {
    font-size: var(--text-2xl);
    line-height: var(--tw-leading, var(--text-2xl--line-height));
  }
  .text-3xl {
    font-size: var(--text-3xl);
    line-height: var(--tw-leading, var(--text-3xl--line-height));
  }
  .text-4xl {
    font-size: var(--text-4xl);
    line-height: var(--tw-leading, var(--text-4xl--line-height));
  }
  .text-5xl {
    font-size: var(--text-5xl);
    line-height: var(--tw-leading, var(--text-5xl--line-height));
  }
  .text-6xl {
    font-size: var(--text-6xl);
    line-height: var(--tw-leading, var(--text-6xl--line-height));
  }
  .text-sm {
    font-size: var(--text-sm);
    line-height: var(--tw-leading, var(--text-sm--line-height));
  }
  .text-xs {
    font-size: var(--text-xs);
    line-height: var(--tw-leading, var(--text-xs--line-height));
  }
  .text-\\[9px\\] {
    font-size: 9px;
  }
  .text-\\[11px\\] {
    font-size: 11px;
  }
  .leading-none {
    --tw-leading: 1;
    line-height: 1;
  }
  .font-black {
    --tw-font-weight: var(--font-weight-black);
    font-weight: var(--font-weight-black);
  }
  .font-bold {
    --tw-font-weight: var(--font-weight-bold);
    font-weight: var(--font-weight-bold);
  }
  .font-extrabold {
    --tw-font-weight: var(--font-weight-extrabold);
    font-weight: var(--font-weight-extrabold);
  }
  .font-semibold {
    --tw-font-weight: var(--font-weight-semibold);
    font-weight: var(--font-weight-semibold);
  }
  .tracking-normal {
    --tw-tracking: var(--tracking-normal);
    letter-spacing: var(--tracking-normal);
  }
  .tracking-tight {
    --tw-tracking: var(--tracking-tight);
    letter-spacing: var(--tracking-tight);
  }
  .whitespace-nowrap {
    white-space: nowrap;
  }
  .text-\\[\\#0D9488\\] {
    color: #0D9488;
  }
  .text-\\[\\#9A3412\\] {
    color: #9A3412;
  }
  .text-\\[\\#115E59\\] {
    color: #115E59;
  }
  .text-\\[\\#3730A3\\] {
    color: #3730A3;
  }
  .text-\\[\\#92400E\\] {
    color: #92400E;
  }
  .text-\\[\\#D94625\\] {
    color: #D94625;
  }
  .text-\\[\\#D94625\\]\\/70 {
    color: color-mix(in oklab, #D94625 70%, transparent);
  }
  .text-\\[\\#FAF8F5\\] {
    color: #FAF8F5;
  }
  .text-\\[\\#FF6B4A\\] {
    color: #FF6B4A;
  }
  .text-\\[\\#FF542E\\] {
    color: #FF542E;
  }
  .text-amber-300 {
    color: var(--color-amber-300);
  }
  .text-emerald-700 {
    color: var(--color-emerald-700);
  }
  .text-emerald-950 {
    color: var(--color-emerald-950);
  }
  .text-slate-100 {
    color: var(--color-slate-100);
  }
  .text-teal-300 {
    color: var(--color-teal-300);
  }
  .text-teal-600 {
    color: var(--color-teal-600);
  }
  .text-white {
    color: var(--color-white);
  }
  .text-white\\/90 {
    color: color-mix(in srgb, #fff 90%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      color: color-mix(in oklab, var(--color-white) 90%, transparent);
    }
  }
  .text-zinc-300\\/65 {
    color: color-mix(in srgb, oklch(87.1% 0.006 286.286) 65%, transparent);
    @supports (color: color-mix(in lab, red, red)) {
      color: color-mix(in oklab, var(--color-zinc-300) 65%, transparent);
    }
  }
  .text-zinc-400 {
    color: var(--color-zinc-400);
  }
  .text-zinc-500 {
    color: var(--color-zinc-500);
  }
  .text-zinc-700 {
    color: var(--color-zinc-700);
  }
  .text-zinc-800 {
    color: var(--color-zinc-800);
  }
  .text-zinc-900 {
    color: var(--color-zinc-900);
  }
  .underline {
    text-decoration-line: underline;
  }
  .decoration-wavy {
    text-decoration-style: wavy;
  }
  .decoration-2 {
    text-decoration-thickness: 2px;
  }
  .underline-offset-8 {
    text-underline-offset: 8px;
  }
  .opacity-0 {
    opacity: 0%;
  }
  .opacity-15 {
    opacity: 15%;
  }
  .opacity-25 {
    opacity: 25%;
  }
  .opacity-60 {
    opacity: 60%;
  }
  .opacity-75 {
    opacity: 75%;
  }
  .opacity-\\[0\\.35\\] {
    opacity: 0.35;
  }
  .shadow {
    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_0_14px_rgba\\(45\\,212\\,191\\,0\\.35\\)\\] {
    --tw-shadow: 0 0 14px var(--tw-shadow-color, rgba(45,212,191,0.35));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_0_14px_rgba\\(217\\,70\\,37\\,0\\.45\\)\\] {
    --tw-shadow: 0 0 14px var(--tw-shadow-color, rgba(217,70,37,0.45));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_0px_0_\\#8F2811\\] {
    --tw-shadow: 0 0px 0 var(--tw-shadow-color, #8F2811);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_2px_0_\\#C7C2B6\\] {
    --tw-shadow: 0 2px 0 var(--tw-shadow-color, #C7C2B6);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_4px_0_\\#1e293b\\] {
    --tw-shadow: 0 4px 0 var(--tw-shadow-color, #1e293b);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_4px_0_\\#8F2811\\] {
    --tw-shadow: 0 4px 0 var(--tw-shadow-color, #8F2811);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_4px_0_\\#18181b\\] {
    --tw-shadow: 0 4px 0 var(--tw-shadow-color, #18181b);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_4px_0_\\#B8C7B4\\] {
    --tw-shadow: 0 4px 0 var(--tw-shadow-color, #B8C7B4);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_4px_0_\\#C7C2B6\\] {
    --tw-shadow: 0 4px 0 var(--tw-shadow-color, #C7C2B6);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_4px_0_\\#D94625\\] {
    --tw-shadow: 0 4px 0 var(--tw-shadow-color, #D94625);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_5px_0_\\#0D9488\\] {
    --tw-shadow: 0 5px 0 var(--tw-shadow-color, #0D9488);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_5px_0_\\#4F46E5\\] {
    --tw-shadow: 0 5px 0 var(--tw-shadow-color, #4F46E5);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_5px_0_\\#C7C1B5\\,inset_0_1px_1px_\\#FFFFFF\\] {
    --tw-shadow: 0 5px 0 var(--tw-shadow-color, #C7C1B5), inset 0 1px 1px var(--tw-shadow-color, #FFFFFF);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_5px_0_\\#D94625\\] {
    --tw-shadow: 0 5px 0 var(--tw-shadow-color, #D94625);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_5px_0_\\#D97706\\] {
    --tw-shadow: 0 5px 0 var(--tw-shadow-color, #D97706);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_10px_0_\\#0f172a\\,0_18px_32px_rgba\\(0\\,0\\,0\\,0\\.35\\)\\] {
    --tw-shadow: 0 10px 0 var(--tw-shadow-color, #0f172a), 0 18px 32px var(--tw-shadow-color, rgba(0,0,0,0.35));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_10px_0_\\#B4C2B0\\,0_18px_32px_rgba\\(0\\,0\\,0\\,0\\.12\\)\\] {
    --tw-shadow: 0 10px 0 var(--tw-shadow-color, #B4C2B0), 0 18px 32px var(--tw-shadow-color, rgba(0,0,0,0.12));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[0_10px_0_\\#C2BDB0\\,0_18px_32px_rgba\\(0\\,0\\,0\\,0\\.12\\)\\] {
    --tw-shadow: 0 10px 0 var(--tw-shadow-color, #C2BDB0), 0 18px 32px var(--tw-shadow-color, rgba(0,0,0,0.12));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[3px_3px_0_\\#0D9488\\] {
    --tw-shadow: 3px 3px 0 var(--tw-shadow-color, #0D9488);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[3px_3px_0_\\#18181B\\] {
    --tw-shadow: 3px 3px 0 var(--tw-shadow-color, #18181B);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[3px_3px_0_\\#D94625\\] {
    --tw-shadow: 3px 3px 0 var(--tw-shadow-color, #D94625);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-\\[3px_3px_0_\\#F59E0B\\] {
    --tw-shadow: 3px 3px 0 var(--tw-shadow-color, #F59E0B);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .shadow-lg {
    --tw-shadow: 0 10px 15px -3px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .ring-2 {
    --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }
  .ring-\\[\\#D94625\\]\\/30 {
    --tw-ring-color: color-mix(in oklab, #D94625 30%, transparent);
  }
  .ring-\\[\\#D94625\\]\\/45 {
    --tw-ring-color: color-mix(in oklab, #D94625 45%, transparent);
  }
  .blur {
    --tw-blur: blur(8px);
    filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
  }
  .filter {
    filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
  }
  .backdrop-blur-xs {
    --tw-backdrop-blur: blur(var(--blur-xs));
    -webkit-backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);
    backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);
  }
  .transition-all {
    transition-property: all;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-colors {
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-opacity {
    transition-property: opacity;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .transition-transform {
    transition-property: transform, translate, scale, rotate;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }
  .duration-75 {
    --tw-duration: 75ms;
    transition-duration: 75ms;
  }
  .select-none {
    -webkit-user-select: none;
    user-select: none;
  }
  .group-hover\\:opacity-80 {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        opacity: 80%;
      }
    }
  }
  .group-hover\\:opacity-100 {
    &:is(:where(.group):hover *) {
      @media (hover: hover) {
        opacity: 100%;
      }
    }
  }
  .hover\\:-translate-y-\\[1px\\] {
    &:hover {
      @media (hover: hover) {
        --tw-translate-y: calc(1px * -1);
        translate: var(--tw-translate-x) var(--tw-translate-y);
      }
    }
  }
  .hover\\:border-\\[\\#D94625\\]\\/50 {
    &:hover {
      @media (hover: hover) {
        border-color: color-mix(in oklab, #D94625 50%, transparent);
      }
    }
  }
  .hover\\:text-\\[\\#D94625\\] {
    &:hover {
      @media (hover: hover) {
        color: #D94625;
      }
    }
  }
  .focus\\:outline-none {
    &:focus {
      --tw-outline-style: none;
      outline-style: none;
    }
  }
  .active\\:translate-y-\\[4px\\] {
    &:active {
      --tw-translate-y: 4px;
      translate: var(--tw-translate-x) var(--tw-translate-y);
    }
  }
  .sm\\:mx-3 {
    @media (width >= 40rem) {
      margin-inline: calc(var(--spacing) * 3);
    }
  }
  .sm\\:h-11 {
    @media (width >= 40rem) {
      height: calc(var(--spacing) * 11);
    }
  }
  .sm\\:h-13 {
    @media (width >= 40rem) {
      height: calc(var(--spacing) * 13);
    }
  }
  .sm\\:h-24 {
    @media (width >= 40rem) {
      height: calc(var(--spacing) * 24);
    }
  }
  .sm\\:min-h-\\[250px\\] {
    @media (width >= 40rem) {
      min-height: 250px;
    }
  }
  .sm\\:gap-2 {
    @media (width >= 40rem) {
      gap: calc(var(--spacing) * 2);
    }
  }
  .sm\\:gap-2\\.5 {
    @media (width >= 40rem) {
      gap: calc(var(--spacing) * 2.5);
    }
  }
  .sm\\:gap-3\\.5 {
    @media (width >= 40rem) {
      gap: calc(var(--spacing) * 3.5);
    }
  }
  .sm\\:p-3 {
    @media (width >= 40rem) {
      padding: calc(var(--spacing) * 3);
    }
  }
  .sm\\:p-5 {
    @media (width >= 40rem) {
      padding: calc(var(--spacing) * 5);
    }
  }
  .sm\\:p-10 {
    @media (width >= 40rem) {
      padding: calc(var(--spacing) * 10);
    }
  }
  .sm\\:px-3\\.5 {
    @media (width >= 40rem) {
      padding-inline: calc(var(--spacing) * 3.5);
    }
  }
  .sm\\:py-1\\.5 {
    @media (width >= 40rem) {
      padding-block: calc(var(--spacing) * 1.5);
    }
  }
  .sm\\:py-2 {
    @media (width >= 40rem) {
      padding-block: calc(var(--spacing) * 2);
    }
  }
  .sm\\:text-3xl {
    @media (width >= 40rem) {
      font-size: var(--text-3xl);
      line-height: var(--tw-leading, var(--text-3xl--line-height));
    }
  }
  .sm\\:text-4xl {
    @media (width >= 40rem) {
      font-size: var(--text-4xl);
      line-height: var(--tw-leading, var(--text-4xl--line-height));
    }
  }
  .sm\\:text-5xl {
    @media (width >= 40rem) {
      font-size: var(--text-5xl);
      line-height: var(--tw-leading, var(--text-5xl--line-height));
    }
  }
  .sm\\:text-6xl {
    @media (width >= 40rem) {
      font-size: var(--text-6xl);
      line-height: var(--tw-leading, var(--text-6xl--line-height));
    }
  }
  .sm\\:text-7xl {
    @media (width >= 40rem) {
      font-size: var(--text-7xl);
      line-height: var(--tw-leading, var(--text-7xl--line-height));
    }
  }
  .sm\\:text-8xl {
    @media (width >= 40rem) {
      font-size: var(--text-8xl);
      line-height: var(--tw-leading, var(--text-8xl--line-height));
    }
  }
  .sm\\:text-base {
    @media (width >= 40rem) {
      font-size: var(--text-base);
      line-height: var(--tw-leading, var(--text-base--line-height));
    }
  }
  .sm\\:text-sm {
    @media (width >= 40rem) {
      font-size: var(--text-sm);
      line-height: var(--tw-leading, var(--text-sm--line-height));
    }
  }
  .sm\\:text-xs {
    @media (width >= 40rem) {
      font-size: var(--text-xs);
      line-height: var(--tw-leading, var(--text-xs--line-height));
    }
  }
  .md\\:text-8xl {
    @media (width >= 48rem) {
      font-size: var(--text-8xl);
      line-height: var(--tw-leading, var(--text-8xl--line-height));
    }
  }
  .md\\:text-9xl {
    @media (width >= 48rem) {
      font-size: var(--text-9xl);
      line-height: var(--tw-leading, var(--text-9xl--line-height));
    }
  }
  .dark\\:border-amber-300 {
    &:where(.dark, .dark *) {
      border-color: var(--color-amber-300);
    }
  }
  .dark\\:border-amber-400 {
    &:where(.dark, .dark *) {
      border-color: var(--color-amber-400);
    }
  }
  .dark\\:border-amber-400\\/45 {
    &:where(.dark, .dark *) {
      border-color: color-mix(in srgb, oklch(82.8% 0.189 84.429) 45%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        border-color: color-mix(in oklab, var(--color-amber-400) 45%, transparent);
      }
    }
  }
  .dark\\:border-emerald-900 {
    &:where(.dark, .dark *) {
      border-color: var(--color-emerald-900);
    }
  }
  .dark\\:border-white {
    &:where(.dark, .dark *) {
      border-color: var(--color-white);
    }
  }
  .dark\\:border-white\\/10 {
    &:where(.dark, .dark *) {
      border-color: color-mix(in srgb, #fff 10%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        border-color: color-mix(in oklab, var(--color-white) 10%, transparent);
      }
    }
  }
  .dark\\:border-zinc-600 {
    &:where(.dark, .dark *) {
      border-color: var(--color-zinc-600);
    }
  }
  .dark\\:border-zinc-700 {
    &:where(.dark, .dark *) {
      border-color: var(--color-zinc-700);
    }
  }
  .dark\\:border-zinc-800 {
    &:where(.dark, .dark *) {
      border-color: var(--color-zinc-800);
    }
  }
  .dark\\:bg-amber-400 {
    &:where(.dark, .dark *) {
      background-color: var(--color-amber-400);
    }
  }
  .dark\\:bg-amber-400\\/80 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(82.8% 0.189 84.429) 80%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-amber-400) 80%, transparent);
      }
    }
  }
  .dark\\:bg-amber-950\\/25 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(27.9% 0.077 45.635) 25%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-amber-950) 25%, transparent);
      }
    }
  }
  .dark\\:bg-amber-950\\/70 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(27.9% 0.077 45.635) 70%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-amber-950) 70%, transparent);
      }
    }
  }
  .dark\\:bg-amber-950\\/80 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(27.9% 0.077 45.635) 80%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-amber-950) 80%, transparent);
      }
    }
  }
  .dark\\:bg-black\\/40 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, #000 40%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-black) 40%, transparent);
      }
    }
  }
  .dark\\:bg-emerald-950\\/90 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(26.2% 0.051 172.552) 90%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-emerald-950) 90%, transparent);
      }
    }
  }
  .dark\\:bg-indigo-950\\/80 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(25.7% 0.09 281.288) 80%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-indigo-950) 80%, transparent);
      }
    }
  }
  .dark\\:bg-teal-950\\/80 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(27.7% 0.046 192.524) 80%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-teal-950) 80%, transparent);
      }
    }
  }
  .dark\\:bg-yellow-950\\/80 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(28.6% 0.066 53.813) 80%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-yellow-950) 80%, transparent);
      }
    }
  }
  .dark\\:bg-zinc-500 {
    &:where(.dark, .dark *) {
      background-color: var(--color-zinc-500);
    }
  }
  .dark\\:bg-zinc-700 {
    &:where(.dark, .dark *) {
      background-color: var(--color-zinc-700);
    }
  }
  .dark\\:bg-zinc-800 {
    &:where(.dark, .dark *) {
      background-color: var(--color-zinc-800);
    }
  }
  .dark\\:bg-zinc-800\\/60 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(27.4% 0.006 286.033) 60%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-zinc-800) 60%, transparent);
      }
    }
  }
  .dark\\:bg-zinc-900 {
    &:where(.dark, .dark *) {
      background-color: var(--color-zinc-900);
    }
  }
  .dark\\:bg-zinc-900\\/85 {
    &:where(.dark, .dark *) {
      background-color: color-mix(in srgb, oklch(21% 0.006 285.885) 85%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        background-color: color-mix(in oklab, var(--color-zinc-900) 85%, transparent);
      }
    }
  }
  .dark\\:bg-zinc-950 {
    &:where(.dark, .dark *) {
      background-color: var(--color-zinc-950);
    }
  }
  .dark\\:from-white\\/\\[0\\.03\\] {
    &:where(.dark, .dark *) {
      --tw-gradient-from: color-mix(in srgb, #fff 3%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        --tw-gradient-from: color-mix(in oklab, var(--color-white) 3%, transparent);
      }
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
    }
  }
  .dark\\:from-zinc-800 {
    &:where(.dark, .dark *) {
      --tw-gradient-from: var(--color-zinc-800);
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
    }
  }
  .dark\\:from-zinc-900 {
    &:where(.dark, .dark *) {
      --tw-gradient-from: var(--color-zinc-900);
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
    }
  }
  .dark\\:to-zinc-900 {
    &:where(.dark, .dark *) {
      --tw-gradient-to: var(--color-zinc-900);
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position));
    }
  }
  .dark\\:text-amber-200 {
    &:where(.dark, .dark *) {
      color: var(--color-amber-200);
    }
  }
  .dark\\:text-amber-300 {
    &:where(.dark, .dark *) {
      color: var(--color-amber-300);
    }
  }
  .dark\\:text-amber-400 {
    &:where(.dark, .dark *) {
      color: var(--color-amber-400);
    }
  }
  .dark\\:text-amber-400\\/70 {
    &:where(.dark, .dark *) {
      color: color-mix(in srgb, oklch(82.8% 0.189 84.429) 70%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        color: color-mix(in oklab, var(--color-amber-400) 70%, transparent);
      }
    }
  }
  .dark\\:text-emerald-100 {
    &:where(.dark, .dark *) {
      color: var(--color-emerald-100);
    }
  }
  .dark\\:text-emerald-400 {
    &:where(.dark, .dark *) {
      color: var(--color-emerald-400);
    }
  }
  .dark\\:text-indigo-200 {
    &:where(.dark, .dark *) {
      color: var(--color-indigo-200);
    }
  }
  .dark\\:text-teal-200 {
    &:where(.dark, .dark *) {
      color: var(--color-teal-200);
    }
  }
  .dark\\:text-teal-300 {
    &:where(.dark, .dark *) {
      color: var(--color-teal-300);
    }
  }
  .dark\\:text-teal-400 {
    &:where(.dark, .dark *) {
      color: var(--color-teal-400);
    }
  }
  .dark\\:text-white {
    &:where(.dark, .dark *) {
      color: var(--color-white);
    }
  }
  .dark\\:text-yellow-200 {
    &:where(.dark, .dark *) {
      color: var(--color-yellow-200);
    }
  }
  .dark\\:text-zinc-100 {
    &:where(.dark, .dark *) {
      color: var(--color-zinc-100);
    }
  }
  .dark\\:text-zinc-200 {
    &:where(.dark, .dark *) {
      color: var(--color-zinc-200);
    }
  }
  .dark\\:text-zinc-300 {
    &:where(.dark, .dark *) {
      color: var(--color-zinc-300);
    }
  }
  .dark\\:text-zinc-400 {
    &:where(.dark, .dark *) {
      color: var(--color-zinc-400);
    }
  }
  .dark\\:text-zinc-700\\/65 {
    &:where(.dark, .dark *) {
      color: color-mix(in srgb, oklch(37% 0.013 285.805) 65%, transparent);
      @supports (color: color-mix(in lab, red, red)) {
        color: color-mix(in oklab, var(--color-zinc-700) 65%, transparent);
      }
    }
  }
  .dark\\:text-zinc-950 {
    &:where(.dark, .dark *) {
      color: var(--color-zinc-950);
    }
  }
  .dark\\:opacity-\\[0\\.15\\] {
    &:where(.dark, .dark *) {
      opacity: 0.15;
    }
  }
  .dark\\:shadow-\\[0_2px_0_\\#18181b\\] {
    &:where(.dark, .dark *) {
      --tw-shadow: 0 2px 0 var(--tw-shadow-color, #18181b);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }
  }
  .dark\\:shadow-\\[0_4px_0_\\#18181b\\] {
    &:where(.dark, .dark *) {
      --tw-shadow: 0 4px 0 var(--tw-shadow-color, #18181b);
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }
  }
  .dark\\:shadow-\\[0_5px_0_\\#18181B\\,inset_0_1px_1px_rgba\\(255\\,255\\,255\\,0\\.12\\)\\] {
    &:where(.dark, .dark *) {
      --tw-shadow: 0 5px 0 var(--tw-shadow-color, #18181B), inset 0 1px 1px var(--tw-shadow-color, rgba(255,255,255,0.12));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }
  }
  .dark\\:shadow-\\[0_10px_0_\\#18181b\\,0_18px_32px_rgba\\(0\\,0\\,0\\,0\\.45\\)\\] {
    &:where(.dark, .dark *) {
      --tw-shadow: 0 10px 0 var(--tw-shadow-color, #18181b), 0 18px 32px var(--tw-shadow-color, rgba(0,0,0,0.45));
      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    }
  }
}
@layer base {
  :root {
    --font-display: 'Bricolage Grotesque', system-ui, -apple-system, sans-serif;
    --font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  body {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  h1, h2, h3, .font-display {
    font-family: var(--font-display);
  }
  .font-mono {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
}
@keyframes keyRipple {
  0% {
    transform: scale(0.85);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.65);
    opacity: 0;
  }
}
.animate-key-ripple {
  animation: keyRipple 380ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.font-serif-morph {
  font-family: 'Fraunces', Georgia, serif;
}
.font-syne-wide {
  font-family: 'Syne', sans-serif;
}
.font-pixel-bare {
  font-family: 'Silkscreen', monospace;
}
.glyph-outline-orange {
  color: transparent;
  -webkit-text-stroke: 2.2px #D94625;
}
.dark .glyph-outline-orange {
  color: transparent;
  -webkit-text-stroke: 2.2px #FBBF24;
}
.glyph-outline-ink {
  color: transparent;
  -webkit-text-stroke: 2px #18181B;
}
.dark .glyph-outline-ink {
  color: transparent;
  -webkit-text-stroke: 2px #F4F4F5;
}
@keyframes glyphVariableBreath {
  0%, 100% {
    font-variation-settings: "wght" 400, "wdth" 75;
    transform: scaleY(1.28) scaleX(0.82);
  }
  50% {
    font-variation-settings: "wght" 800, "wdth" 100;
    transform: scaleY(0.78) scaleX(1.22);
  }
}
.animate-glyph-elastic {
  animation: glyphVariableBreath 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  display: inline-block;
  transform-origin: bottom center;
}
@keyframes serifLiquidMorph {
  0%, 100% {
    font-variation-settings: "wght" 350, "SOFT" 100, "WONK" 1;
  }
  50% {
    font-variation-settings: "wght" 900, "SOFT" 0, "WONK" 0;
  }
}
.animate-serif-morph {
  animation: serifLiquidMorph 2.6s ease-in-out infinite;
}
.font-gummy {
  font-family: 'DynaPuff', system-ui, sans-serif;
}
@keyframes gummyQBounce {
  0%, 100% {
    font-variation-settings: "wght" 700, "wdth" 100;
    transform: scale3d(1, 1, 1) translateY(0px);
  }
  25% {
    font-variation-settings: "wght" 700, "wdth" 100;
    transform: scale3d(1.18, 0.82, 1) translateY(4px);
  }
  50% {
    font-variation-settings: "wght" 600, "wdth" 88;
    transform: scale3d(0.88, 1.16, 1) translateY(-6px);
  }
  75% {
    font-variation-settings: "wght" 700, "wdth" 96;
    transform: scale3d(1.06, 0.94, 1) translateY(2px);
  }
}
.animate-gummy-q {
  animation: gummyQBounce 1.8s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
  display: inline-block;
  transform-origin: bottom center;
}
:host {
  all: initial;
  display: block;
  height: 100%;
  color: #23344b;
  font-family: -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
}
* {
  box-sizing: border-box;
}
button,select,textarea {
  font: inherit;
}
button {
  cursor: pointer;
}
button:focus-visible,select:focus-visible,textarea:focus-visible {
  outline: 2px solid #4899b2;
  outline-offset: 4px;
}
.kf-app {
  height: 100dvh;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #f8f7f3;
  color: #25374a;
  overflow: hidden;
}
.kf-toolbar {
  position: absolute;
  z-index: 60;
  top: 0;
  left: 0;
  right: 0;
  padding: calc(env(safe-area-inset-top,0px) + 22px) 28px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  transition: opacity .3s,transform .3s;
  background: linear-gradient(#f8f7f3 50%,transparent);
}
.kf-toolbar>div {
  display: flex;
  gap: 14px;
  align-items: center;
}
.kf-mark {
  font-size: 10px;
  letter-spacing: .23em;
  color: #8d969b;
}
.kf-title {
  font-size: 14px;
  font-weight: 600;
}
.kf-toolbar button,.kf-toolbar select {
  border: 1px solid #dfe2de;
  background: #ffffffb3;
  border-radius: 12px;
  padding: 9px 12px;
  color: #586771;
  font-size: 12px;
}
.kf-toolbar button:last-child {
  font-size: 23px;
  padding: 2px 13px;
}
.kf-app:not(.is-awake) .kf-toolbar:not(:focus-within):not(:hover) {
  opacity: 0;
  transform: translateY(-12px);
  pointer-events: none;
}
.kf-canvas {
  flex: 1;
  min-height: 0;
  position: relative;
  display: grid;
  place-items: center;
  padding: 72px 10px 4px;
}
.kf-stage {
  height: 100%;
  max-height: 650px;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}
.kf-stage>div[aria-hidden=true] {
  display: none;
}
.kf-stage>div:has(>textarea) {
  display: none;
}
.kf-stage [class*="text-emerald"] {
  display: none;
}
.kf-stage div[class*="min-h-"] {
  min-height: 0 !important;
}
.kf-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  gap: 15px;
  color: #9a9c96;
}
.kf-empty b {
  font-size: clamp(22px,3.2vw,36px);
  font-weight: 400;
  letter-spacing: .03em;
}
.kf-empty span {
  font-size: 12px;
  letter-spacing: .1em;
}
.kf-composer {
  flex: none;
  position: relative;
  width: min(760px,calc(100% - 48px));
  margin: 0 auto;
  padding-bottom: calc(env(safe-area-inset-bottom,0px) + 34px);
}
.kf-composer textarea {
  display: block;
  resize: none;
  width: 100%;
  max-height: 140px;
  border: 0;
  border-bottom: 1px solid #d9ddd7;
  background: transparent;
  color: #405466;
  padding: 14px 56px 12px 0;
  line-height: 1.6;
  font-size: 17px;
  outline: none;
}
.kf-composer textarea:focus {
  border-color: #8da9a6;
}
.kf-composer p {
  margin: 12px 0 0;
  color: #8c979a;
  font-size: 11px;
  min-height: 16px;
}
.kf-submit {
  position: absolute;
  right: 0;
  top: 16px;
  width: 38px;
  height: 38px;
  border: 0;
  background: #dfeae4;
  color: #46645c;
  border-radius: 50%;
  font-size: 22px;
}
.kf-submit:disabled {
  opacity: .35;
  cursor: default;
}
.kf-reveal {
  position: absolute;
  right: 14px;
  bottom: 10px;
  background: transparent;
  border: 0;
  color: #8d969b;
  font-size: 22px;
  letter-spacing: 3px;
}
@media (max-width:600px) {
  .kf-toolbar {
    padding-left: 18px;
    padding-right: 18px;
  }
  .kf-mark {
    display: none;
  }
  .kf-toolbar>div {
    gap: 7px;
  }
  .kf-toolbar select {
    max-width: 135px;
  }
  .kf-composer {
    width: calc(100% - 36px);
  }
  .kf-canvas {
    padding-top: 65px;
  }
}
@media (prefers-reduced-motion:reduce) {
  *,*::before,*::after {
    animation: none !important;
    transition: none !important;
  }
  .kf-stage svg {
    display: none;
  }
}
.kf-empty b {
  font-size: clamp(22px,3vw,34px);
  font-weight: 400;
  letter-spacing: .04em;
  color: #a2a59f;
}
@property --tw-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-z {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-scale-x {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-scale-y {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-scale-z {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-gradient-position {
  syntax: "*";
  inherits: false;
}
@property --tw-gradient-from {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}
@property --tw-gradient-via {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}
@property --tw-gradient-to {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}
@property --tw-gradient-stops {
  syntax: "*";
  inherits: false;
}
@property --tw-gradient-via-stops {
  syntax: "*";
  inherits: false;
}
@property --tw-gradient-from-position {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0%;
}
@property --tw-gradient-via-position {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 50%;
}
@property --tw-gradient-to-position {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-leading {
  syntax: "*";
  inherits: false;
}
@property --tw-font-weight {
  syntax: "*";
  inherits: false;
}
@property --tw-tracking {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-inset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-ring-inset {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-offset-width {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
@property --tw-ring-offset-color {
  syntax: "*";
  inherits: false;
  initial-value: #fff;
}
@property --tw-ring-offset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-blur {
  syntax: "*";
  inherits: false;
}
@property --tw-brightness {
  syntax: "*";
  inherits: false;
}
@property --tw-contrast {
  syntax: "*";
  inherits: false;
}
@property --tw-grayscale {
  syntax: "*";
  inherits: false;
}
@property --tw-hue-rotate {
  syntax: "*";
  inherits: false;
}
@property --tw-invert {
  syntax: "*";
  inherits: false;
}
@property --tw-opacity {
  syntax: "*";
  inherits: false;
}
@property --tw-saturate {
  syntax: "*";
  inherits: false;
}
@property --tw-sepia {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-drop-shadow-size {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-blur {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-brightness {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-contrast {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-grayscale {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-hue-rotate {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-invert {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-opacity {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-saturate {
  syntax: "*";
  inherits: false;
}
@property --tw-backdrop-sepia {
  syntax: "*";
  inherits: false;
}
@property --tw-duration {
  syntax: "*";
  inherits: false;
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    *, ::before, ::after, ::backdrop {
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-translate-z: 0;
      --tw-scale-x: 1;
      --tw-scale-y: 1;
      --tw-scale-z: 1;
      --tw-border-style: solid;
      --tw-gradient-position: initial;
      --tw-gradient-from: #0000;
      --tw-gradient-via: #0000;
      --tw-gradient-to: #0000;
      --tw-gradient-stops: initial;
      --tw-gradient-via-stops: initial;
      --tw-gradient-from-position: 0%;
      --tw-gradient-via-position: 50%;
      --tw-gradient-to-position: 100%;
      --tw-leading: initial;
      --tw-font-weight: initial;
      --tw-tracking: initial;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-color: initial;
      --tw-shadow-alpha: 100%;
      --tw-inset-shadow: 0 0 #0000;
      --tw-inset-shadow-color: initial;
      --tw-inset-shadow-alpha: 100%;
      --tw-ring-color: initial;
      --tw-ring-shadow: 0 0 #0000;
      --tw-inset-ring-color: initial;
      --tw-inset-ring-shadow: 0 0 #0000;
      --tw-ring-inset: initial;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-blur: initial;
      --tw-brightness: initial;
      --tw-contrast: initial;
      --tw-grayscale: initial;
      --tw-hue-rotate: initial;
      --tw-invert: initial;
      --tw-opacity: initial;
      --tw-saturate: initial;
      --tw-sepia: initial;
      --tw-drop-shadow: initial;
      --tw-drop-shadow-color: initial;
      --tw-drop-shadow-alpha: 100%;
      --tw-drop-shadow-size: initial;
      --tw-backdrop-blur: initial;
      --tw-backdrop-brightness: initial;
      --tw-backdrop-contrast: initial;
      --tw-backdrop-grayscale: initial;
      --tw-backdrop-hue-rotate: initial;
      --tw-backdrop-invert: initial;
      --tw-backdrop-opacity: initial;
      --tw-backdrop-saturate: initial;
      --tw-backdrop-sepia: initial;
      --tw-duration: initial;
    }
  }
}
`;var Gf=null;window.MinestKeyflowApp={mount(e,t){let a=e.shadowRoot||e.attachShadow({mode:"open"});a.replaceChildren();let o=document.createElement("style");o.textContent=rb;let r=document.createElement("div");a.append(o,r),Gf=(0,nb.createRoot)(r),Gf.render(ib.default.createElement(Gm,{bridge:t}))},unmount(){Gf?.unmount(),Gf=null}};})();
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/sparkles.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.546.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
