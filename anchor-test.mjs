import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
const helper=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('window.BioHackAnchors='));
function page(scale,x,y){
 const dom=new JSDOM('<main><section id="tab-test" class="tab-content"><svg id="diagram" viewBox="0 0 600 400"><path/></svg><p id="label">Органоид <b>цитология</b> клетки</p></section></main>',{runScripts:'outside-only'}),w=dom.window,svg=w.document.querySelector('svg');
 Object.defineProperty(svg,'viewBox',{value:{baseVal:{x:0,y:0,width:600,height:400}}});svg.getScreenCTM=()=>({a:scale,b:0,c:0,d:scale,e:x,f:y});
 svg.getBoundingClientRect=()=>({left:0,top:y,width:1000,height:400*scale});
 w.document.elementFromPoint=()=>svg.querySelector('path');w.eval(helper);return dom;
}
test('diagram anchors survive different viewport sizes and SVG letterboxing',()=>{
 const a=page(.8,100,100),b=page(.5,20,180);
 try{const p=a.window.BioHackAnchors.point(340,260),r=b.window.BioHackAnchors.locate(JSON.parse(JSON.stringify(p)));assert.equal(r.x,170);assert.equal(r.y,280);assert.equal(p.ref.key,'id:diagram');
  const reverse=b.window.BioHackAnchors.point(170,280),host=a.window.BioHackAnchors.locate(JSON.parse(JSON.stringify(reverse)));assert.equal(host.x,340);assert.equal(host.y,260);
 }finally{a.window.close();b.window.close();}
});
test('word anchors follow a word to another line after text reflow',()=>{
 const a=page(.8,100,100),b=page(.5,20,180);
 try{for(const [dom,left,top,width] of [[a,300,90,90],[b,25,240,90]]){
  const w=dom.window,node=w.document.querySelector('b').firstChild;
  w.Range.prototype.getBoundingClientRect=()=>({left,top,width,height:20});
  w.document.elementFromPoint=()=>node.parentElement;
  w.document.caretRangeFromPoint=()=>({startContainer:node,startOffset:3});
 }
 const point=a.window.BioHackAnchors.point(345,115);assert.equal(point.ref.kind,'word');const target=b.window.BioHackAnchors.locate(JSON.parse(JSON.stringify(point)));assert.equal(target.x,70);assert.equal(target.y,265);
 b.window.document.querySelector('b').textContent='другое';assert.equal(b.window.BioHackAnchors.locate(JSON.parse(JSON.stringify(point))),null);
 }finally{a.window.close();b.window.close();}
});
test('anchored ink and partial eraser use the same local coordinates after resizing',()=>{
 const dom=page(1,0,0),w=dom.window;let scale=1;
 try{
  w.SVGElement.prototype.getScreenCTM=()=>null;w.crypto.randomUUID=()=>Math.random().toString(36).slice(2);w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};
  w.document.body.insertAdjacentHTML('afterbegin','<header><nav></nav></header><div id="live-mirror"></div>');w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
  w.HTMLElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:1000,bottom:800,width:1000,height:800};};
  const svg=w.document.getElementById('diagram');svg.getScreenCTM=()=>({a:scale,b:0,c:0,d:scale,e:0,f:0});
  let source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function anchorWorldBox'));
  const end=source.lastIndexOf('})();');source=source.slice(0,end)+`window.__ink={openText:p=>openText({clientX:120,clientY:120},p),hit:textAtPoint,objects:()=>objects(),mapping:anchorMapping,map:mappedPoint,shape:placedShape,add:o=>local.set(o.id,o),eraseAt:(x,y)=>{eraseSession={radius:10,points:[],changes:new Map()};erase({clientX:x,clientY:y,pointerType:'mouse'});},read:id=>local.get(id),pick:pickLasso,selected:()=>[...selected],begin:beginSelection,move:moveSelection,finish:finishSelection,scale:scaleSelection};`+source.slice(end);
  w.eval(source);
  const ink={id:'stroke',key:'lesson:tab-test:main',type:'pen',color:'#800020',size:3,points:[[100,100],[200,100]],anchor:{ref:{key:'id:diagram',kind:'svg'},box:[0,0,600,400]}};
  w.__ink.add(ink);scale=.5;
  const mapping=w.__ink.mapping(ink);assert.equal(mapping.sx,.5);assert.equal(mapping.sy,.5);assert.equal(w.__ink.shape(ink).getAttribute('transform'),'matrix(0.5 0 0 0.5 0 0)');
  w.__ink.eraseAt(75,50);const erased=w.__ink.read('stroke');assert.equal(erased.erasures.length,1);assert.equal(erased.erasures[0].points[0][0],150);assert.equal(erased.erasures[0].points[0][1],100);assert.equal(erased.erasures[0].r,20);
  scale=1;
  const second={...ink,id:'second',points:[[100,140],[200,140]]};w.__ink.add(second);
  const third={...ink,id:'third',points:[[400,400],[500,400]]};w.__ink.add(third);
  w.__ink.pick([[80,80],[220,80],[220,170],[80,170]]);
  assert.deepEqual(Array.from(w.__ink.selected()).sort(),['second','stroke']);
  w.__ink.begin([150,120]);w.__ink.move([180,150]);w.__ink.finish();
  assert.equal(w.__ink.read('second').points[0][0],130);assert.equal(w.__ink.read('second').points[0][1],170);
  assert.equal(w.__ink.read('stroke').erasures[0].points[0][0],180);assert.equal(w.__ink.read('third').points[0][0],400);
  w.document.getElementById('draw-undo').click();assert.equal(w.__ink.read('second').points[0][0],100);
  const before=JSON.stringify(w.__ink.read('stroke'));w.__ink.scale(1.15);assert(w.__ink.read('stroke').size>3);
  w.document.getElementById('draw-undo').click();assert.equal(JSON.stringify(w.__ink.read('stroke')),before);
  w.__ink.begin([150,120]);w.__ink.move([190,160]);w.__ink.finish(true);assert.equal(JSON.stringify(w.__ink.read('stroke')),before);


  // Editing keeps the same object, anchor, style and position; undo restores partial erasures.
  const label={...ink,id:'caption',type:'text',text:'Старая подпись',color:'#2563eb',size:6,points:[[300,250]],erasures:[{r:3,points:[[320,240]]}]};
  w.__ink.add(label);scale=.5;
  assert.equal(w.__ink.hit([155,120]).id,'caption','hit testing follows the resized anchor');
  w.__ink.openText([155,120]);
  const input=w.document.getElementById('draw-text-value'),editor=w.document.getElementById('draw-text');
  assert.equal(input.value,'Старая подпись');assert.equal(w.document.getElementById('draw-text-save').textContent,'Сохранить');
  input.value='Исправленная подпись\nВторая строка';w.document.getElementById('draw-text-save').click();
  const edited=w.__ink.read('caption');assert.equal(edited.text,'Исправленная подпись\nВторая строка');
  assert.equal(edited.id,label.id);assert.equal(edited.color,label.color);assert.equal(edited.size,label.size);
  assert.equal(JSON.stringify(edited.points),JSON.stringify(label.points));assert.equal(JSON.stringify(edited.anchor),JSON.stringify(label.anchor));
  assert.equal(edited.erasures,undefined);assert.equal(editor.hidden,true);
  w.document.getElementById('draw-undo').click();assert.equal(JSON.stringify(w.__ink.read('caption')),JSON.stringify(label));
  w.__ink.openText([155,120]);input.value='Не сохранять';input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(editor.hidden,true);assert.equal(w.__ink.read('caption').text,label.text);
  w.__ink.openText([155,120]);input.value='Моя правка';
  w.__ink.add({...label,text:'Правка другого участника'});w.document.getElementById('draw-text-save').click();
  assert.equal(w.__ink.read('caption').text,'Правка другого участника');
  w.__ink.openText([800,700]);assert.equal(w.document.getElementById('draw-text-save').textContent,'Добавить');
  input.value='Новая надпись';input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,bubbles:true}));
  assert(w.__ink.objects().some(o=>o.text==='Новая надпись'));

 }finally{w.close();}
});
