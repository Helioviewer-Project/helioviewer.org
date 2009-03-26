/*
 * Pixastic - JavaScript Image Processing Library
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * MIT License [http://www.nihilogic.dk/licenses/mit-license.txt]
 */


var Pixastic=(function(){function addEvent(el,event,handler){if(el.addEventListener)
el.addEventListener(event,handler,false);else if(el.attachEvent)
el.attachEvent("on"+event,handler);}
function onready(handler){var handlerDone=false;var execHandler=function(){if(!handlerDone){handlerDone=true;handler();}}
document.write("<"+"script defer src=\"//:\" id=\"__onload_ie_sumbox__\"></"+"script>");var script=document.getElementById("__onload_ie_sumbox__");script.onreadystatechange=function(){if(script.readyState=="complete"){script.parentNode.removeChild(script);execHandler();}}
if(document.addEventListener)
document.addEventListener("DOMContentLoaded",execHandler,false);addEvent(window,"load",execHandler);}
function init(){if(!Pixastic.parseOnLoad)return;var imgEls=getElementsByClass("pixastic",null,"img");var canvasEls=getElementsByClass("pixastic",null,"canvas");var elements=imgEls.concat(canvasEls);for(var i=0;i<elements.length;i++){(function(){var el=elements[i];var actions=[];var classes=el.className.split(" ");for(var c=0;c<classes.length;c++){var cls=classes[c];if(cls.substring(0,9)=="pixastic-"){var actionName=cls.substring(9);if(actionName!="")
actions.push(actionName);}}
if(actions.length){if(el.tagName=="IMG"){var dataImg=new Image();dataImg.src=el.src;if(dataImg.complete){for(var a=0;a<actions.length;a++){var res=Pixastic.applyAction(el,el,actions[a],null);if(res)
el=res;}}else{dataImg.onload=function(){for(var a=0;a<actions.length;a++){var res=Pixastic.applyAction(el,el,actions[a],null)
if(res)
el=res;}}}}else{setTimeout(function(){for(var a=0;a<actions.length;a++){var res=Pixastic.applyAction(el,el,actions[a],null);if(res)
el=res;}},1);}}})();}}
onready(init);function getElementsByClass(searchClass,node,tag){var classElements=new Array();if(node==null)
node=document;if(tag==null)
tag='*';var els=node.getElementsByTagName(tag);var elsLen=els.length;var pattern=new RegExp("(^|\\s)"+searchClass+"(\\s|$)");for(i=0,j=0;i<elsLen;i++){if(pattern.test(els[i].className)){classElements[j]=els[i];j++;}}
return classElements;}
var debugElement;function writeDebug(text,level){if(!Pixastic.debug)return;try{switch(level){case"warn":console.warn("Pixastic:",text);break;case"error":console.error("Pixastic:",text);break;default:console.log("Pixastic:",text);}}catch(e){}
if(!debugElement){}}
return{parseOnLoad:false,debug:false,applyAction:function(img,dataImg,actionName,options){options=options||{};var imageIsCanvas=(img.tagName=="CANVAS");if(imageIsCanvas&&Pixastic.Client.isIE()){if(Pixastic.debug)writeDebug("Tried to process a canvas element but browser is IE.");return false;}
var canvas,ctx;if(Pixastic.Client.hasCanvas()){canvas=document.createElement("canvas");ctx=canvas.getContext("2d");}
var w=parseInt(img.offsetWidth);var h=parseInt(img.offsetHeight);if(actionName.indexOf("(")>-1){var tmp=actionName;actionName=tmp.substr(0,tmp.indexOf("("));var arg=tmp.match(/\((.*?)\)/);if(arg[1]){arg=arg[1].split(";");for(var a=0;a<arg.length;a++){thisArg=arg[a].split("=");if(thisArg.length==2){if(thisArg[0]=="rect"){var rectVal=thisArg[1].split(",");options[thisArg[0]]={left:parseInt(rectVal[0],10)||0,top:parseInt(rectVal[1],10)||0,width:parseInt(rectVal[2],10)||0,height:parseInt(rectVal[3],10)||0}}else{options[thisArg[0]]=thisArg[1];}}}}}
if(!options.rect){options.rect={left:0,top:0,width:w,height:h};}
var validAction=false;if(Pixastic.Actions[actionName]&&typeof Pixastic.Actions[actionName].process=="function"){validAction=true;}
if(!validAction){if(Pixastic.debug)writeDebug("Invalid action \""+actionName+"\". Maybe file not included?");return false;}
if(!Pixastic.Actions[actionName].checkSupport()){if(Pixastic.debug)writeDebug("Action \""+actionName+"\" not supported by this browser.");return false;}
if(Pixastic.Client.hasCanvas()){canvas.width=w;canvas.height=h;canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.drawImage(dataImg,0,0,w,h);}
var params={image:img,canvas:canvas,width:w,height:h,useData:true,options:options}
var res=Pixastic.Actions[actionName].process(params);if(!res){return false;}
if(Pixastic.Client.hasCanvas()){if(params.useData){if(Pixastic.Client.hasCanvasImageData()){canvas.getContext("2d").putImageData(params.canvasData,options.rect.left,options.rect.top);canvas.getContext("2d").fillRect(0,0,0,0);}}
canvas.title=img.title;canvas.imgsrc=img.imgsrc;if(!imageIsCanvas)canvas.alt=img.alt;if(!imageIsCanvas)canvas.imgsrc=img.src;canvas.className=img.className;if(img.getAttribute("style"))
canvas.setAttribute("style",img.getAttribute("style"));canvas.cssText=img.cssText;canvas.name=img.name;canvas.tabIndex=img.tabIndex;canvas.id=img.id;if(img.parentNode&&img.parentNode.replaceChild){img.parentNode.replaceChild(canvas,img);}
return canvas;}
return img;},prepareData:function(params,getCopy){var ctx=params.canvas.getContext("2d");var rect=params.options.rect;var dataDesc=ctx.getImageData(rect.left,rect.top,rect.width,rect.height);var data=dataDesc.data;if(!getCopy)params.canvasData=dataDesc;return data;},process:function(img,actionName,options,callback)
{if(img.tagName=="IMG"){var dataImg=new Image();dataImg.src=img.src;if(dataImg.complete){var res=Pixastic.applyAction(img,dataImg,actionName,options);if(callback)callback(res);return res;}else{dataImg.onload=function(){var res=Pixastic.applyAction(img,dataImg,actionName,options)
if(callback)callback(res);}}}
if(img.tagName=="CANVAS"){var res=Pixastic.applyAction(img,img,actionName,options);if(callback)callback(res);return res;}},Client:{hasCanvas:(function(){var c=document.createElement("canvas");var val=false;try{val=!!((typeof c.getContext=="function")&&c.getContext("2d"));}catch(e){}
return function(){return val;}})(),hasCanvasImageData:(function(){var c=document.createElement("canvas");var val=false;var ctx;try{if(typeof c.getContext=="function"&&(ctx=c.getContext("2d"))){val=(typeof ctx.getImageData=="function");}}catch(e){}
return function(){return val;}})(),isIE:function(){return!!document.all&&!!window.attachEvent&&!window.opera;}},Actions:{}}})();if(typeof jQuery!="undefined"&&jQuery&&jQuery.fn){jQuery.fn.pixastic=function(action,options){var newElements=[];this.each(function(){if(this.tagName=="IMG"&&!this.complete){return;}
var res=Pixastic.process(this,action,options);if(res){newElements.push(res);}});if(newElements.length>0)
return jQuery(newElements);else
return this;};};Pixastic.Actions.brightness={process:function(params){var brightness=parseInt(params.options.brightness,10)||0;var contrast=parseFloat(params.options.contrast)||0;var legacy=!!(params.options.legacy);if(legacy){brightness=Math.min(150,Math.max(-150,brightness));}else{var brightMul=1+Math.min(150,Math.max(-150,brightness))/150;}
contrast=Math.max(0,contrast+1);if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var rect=params.options.rect;var w=rect.width;var h=rect.height;var w4=w*4;var y=h;do{var offsetY=(y-1)*w4;var x=w;do{var offset=offsetY+(x-1)*4;if(legacy){var r=data[offset]+brightness;var g=data[offset+1]+brightness;var b=data[offset+2]+brightness;}else{var r=data[offset]*brightMul;var g=data[offset+1]*brightMul;var b=data[offset+2]*brightMul;}
if(contrast!=1){r=(r-128)*contrast+128;g=(g-128)*contrast+128;b=(b-128)*contrast+128;}
if(r<0)r=0;if(g<0)g=0;if(b<0)b=0;if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;data[offset]=r;data[offset+1]=g;data[offset+2]=b;}while(--x);}while(--y);return true;}},checkSupport:function(){return Pixastic.Client.hasCanvasImageData();}}
Pixastic.Actions.coloradjust={process:function(params){var red=parseFloat(params.options.red)||0;var green=parseFloat(params.options.green)||0;var blue=parseFloat(params.options.blue)||0;red=Math.round(red*255);green=Math.round(green*255);blue=Math.round(blue*255);if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var rect=params.options.rect;var w=rect.width;var h=rect.height;var w4=w*4;var y=h;do{var offsetY=(y-1)*w4;var x=w;do{var offset=offsetY+(x-1)*4;var r=data[offset]+red;var g=data[offset+1]+green;var b=data[offset+2]+blue;if(r<0)r=0;if(g<0)g=0;if(b<0)b=0;if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;data[offset]=r;data[offset+1]=g;data[offset+2]=b;}while(--x);}while(--y);return true;}},checkSupport:function(){return(Pixastic.Client.hasCanvasImageData());}}
Pixastic.Actions.edges={process:function(params){var mono=!!(params.options.mono);var strength=1.0;var invert=!!(params.options.invert);if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var dataCopy=Pixastic.prepareData(params,true)
var c=-strength/8;var kernel=[[c,c,c],[c,1,c],[c,c,c]];weight=1/c;var rect=params.options.rect;var w=rect.width;var h=rect.height;var w4=w*4;var y=h;do{var offsetY=(y-1)*w4;var nextY=(y==h)?y-1:y;var prevY=(y==1)?0:y-2;var offsetYPrev=prevY*w*4;var offsetYNext=nextY*w*4;var x=w;do{var offset=offsetY+(x*4-4);var offsetPrev=offsetYPrev+((x==1)?0:x-2)*4;var offsetNext=offsetYNext+((x==w)?x-1:x)*4;var r=((dataCopy[offsetPrev-4]
+dataCopy[offsetPrev]
+dataCopy[offsetPrev+4]
+dataCopy[offset-4]
+dataCopy[offset+4]
+dataCopy[offsetNext-4]
+dataCopy[offsetNext]
+dataCopy[offsetNext+4])*c
+dataCopy[offset])*weight;var g=((dataCopy[offsetPrev-3]
+dataCopy[offsetPrev+1]
+dataCopy[offsetPrev+5]
+dataCopy[offset-3]
+dataCopy[offset+5]
+dataCopy[offsetNext-3]
+dataCopy[offsetNext+1]
+dataCopy[offsetNext+5])*c
+dataCopy[offset+1])*weight;var b=((dataCopy[offsetPrev-2]
+dataCopy[offsetPrev+2]
+dataCopy[offsetPrev+6]
+dataCopy[offset-2]
+dataCopy[offset+6]
+dataCopy[offsetNext-2]
+dataCopy[offsetNext+2]
+dataCopy[offsetNext+6])*c
+dataCopy[offset+2])*weight;if(mono){var brightness=(r*0.3+g*0.59+b*0.11)||0;if(invert)brightness=255-brightness;if(brightness<0)brightness=0;if(brightness>255)brightness=255;r=g=b=brightness;}else{if(invert){r=255-r;g=255-g;b=255-b;}
if(r<0)r=0;if(g<0)g=0;if(b<0)b=0;if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;}
data[offset]=r;data[offset+1]=g;data[offset+2]=b;}while(--x);}while(--y);return true;}},checkSupport:function(){return Pixastic.Client.hasCanvasImageData();}}
Pixastic.Actions.sharpen={process:function(params){var strength=0;if(typeof params.options.amount!="undefined")
strength=parseFloat(params.options.amount)||0;if(strength<0)strength=0;if(strength>1)strength=1;if(Pixastic.Client.hasCanvasImageData()){var data=Pixastic.prepareData(params);var dataCopy=Pixastic.prepareData(params,true)
var mul=15;var mulOther=1+3*strength;var kernel=[[0,-mulOther,0],[-mulOther,mul,-mulOther],[0,-mulOther,0]];var weight=0;for(var i=0;i<3;i++){for(var j=0;j<3;j++){weight+=kernel[i][j];}}
weight=1/weight;var rect=params.options.rect;var w=rect.width;var h=rect.height;mul*=weight;mulOther*=weight;var w4=w*4;var y=h;do{var offsetY=(y-1)*w4;var nextY=(y==h)?y-1:y;var prevY=(y==1)?0:y-2;var offsetYPrev=prevY*w4;var offsetYNext=nextY*w4;var x=w;do{var offset=offsetY+(x*4-4);var offsetPrev=offsetYPrev+((x==1)?0:x-2)*4;var offsetNext=offsetYNext+((x==w)?x-1:x)*4;var r=((-dataCopy[offsetPrev]
-dataCopy[offset-4]
-dataCopy[offset+4]
-dataCopy[offsetNext])*mulOther
+dataCopy[offset]*mul);var g=((-dataCopy[offsetPrev+1]
-dataCopy[offset-3]
-dataCopy[offset+5]
-dataCopy[offsetNext+1])*mulOther
+dataCopy[offset+1]*mul);var b=((-dataCopy[offsetPrev+2]
-dataCopy[offset-2]
-dataCopy[offset+6]
-dataCopy[offsetNext+2])*mulOther
+dataCopy[offset+2]*mul);if(r<0)r=0;if(g<0)g=0;if(b<0)b=0;if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;data[offset]=r;data[offset+1]=g;data[offset+2]=b;}while(--x);}while(--y);return true;}},checkSupport:function(){return Pixastic.Client.hasCanvasImageData();}}