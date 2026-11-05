import {startUserscript} from './main.js';
const page=typeof unsafeWindow==='undefined'?window:unsafeWindow;
startUserscript(page,{get:GM_getValue,set:GM_setValue,request:GM_xmlhttpRequest});
