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
  const end=source.lastIndexOf('})();');source=source.slice(0,end)+`window.__ink={anchor:drawingAnchor,validAnchor,render,down,movePointer:move,finishPointer:finish,endPointer,eraseFinish:finishErase,openText:p=>openText({clientX:120,clientY:120},p),hit:textAtPoint,objects:()=>objects(),mapping:anchorMapping,map:mappedPoint,shape:placedShape,add:o=>local.set(o.id,o),eraseAt:(x,y)=>{eraseSession={radius:10,points:[],changes:new Map()};erase({clientX:x,clientY:y,pointerType:'mouse'});},read:id=>local.get(id),pick:pickLasso,selected:()=>[...selected],begin:beginSelection,move:moveSelection,finish:finishSelection,scale:scaleSelection};`+source.slice(end);
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
  assert.equal(input.value,'Старая подпись');assert.equal(parseFloat(editor.style.left),150,'editor starts at the label anchor, not the clicked point');assert.equal(input.style.fontSize,'42px');assert.equal(w.document.querySelector('#draw-layer [data-draw-id="caption"]'),null,'do not duplicate an edited SVG label under the text field');assert.equal(w.document.getElementById('draw-text-save').textContent,'Сохранить');
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
  // Typing is an uncommitted preview; color/size changes apply live and outside click commits once.
  w.__ink.openText([850,750]);input.value='  Текст на месте\nВторая строка';input.dispatchEvent(new w.Event('input'));const colors=w.document.getElementById('draw-color'),sizes=w.document.getElementById('draw-size');colors.value='#db2777';colors.dispatchEvent(new w.Event('change'));sizes.value='6';sizes.dispatchEvent(new w.Event('change'));w.__ink.render();assert.equal(input.style.fontSize,'42px');assert.equal(input.style.color,'rgb(219, 39, 119)');assert(!w.__ink.objects().some(o=>o.text==='  Текст на месте\nВторая строка'));w.document.querySelector('main').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));const inline=w.__ink.objects().find(o=>o.text==='  Текст на месте\nВторая строка');assert(inline);assert.equal(inline.color,'#db2777');assert.equal(inline.size,6);assert.equal(editor.hidden,true);w.document.getElementById('draw-undo').click();assert.equal(w.__ink.read(inline.id),undefined);
  // Emptying an existing field removes it; undo restores it. Escape remains a cancellation.
  w.__ink.openText([155,120]);input.value='';w.document.querySelector('main').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));assert.equal(w.__ink.read('caption'),undefined);w.document.getElementById('draw-undo').click();assert(w.__ink.read('caption'));
  // Text handles work directly in text mode and respect a resized diagram's coordinates.
  w.document.querySelector('[data-tool="text"]').click();w.__ink.openText([155,120]);
  const pointerEvent=(el,type,x,y,pen=false)=>{const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y});Object.defineProperties(e,{pointerId:{value:55},pointerType:{value:pen?'pen':'mouse'}});el.dispatchEvent(e);};
  const grip=w.document.getElementById('draw-text-move'),resize=w.document.getElementById('draw-text-resize');
  pointerEvent(grip,'pointerdown',150,120);pointerEvent(grip,'pointermove',180,140);pointerEvent(grip,'pointerup',180,140);
  w.document.getElementById('draw-text-save').click();const moved=w.__ink.read('caption');assert.deepEqual(Array.from(moved.points[0]),[360,290]);assert.deepEqual(moved.anchor,label.anchor);assert.equal(moved.text,'Правка другого участника');
  w.document.getElementById('draw-undo').click();assert.deepEqual(Array.from(w.__ink.read('caption').points[0]),[300,250]);
  w.__ink.openText([155,120]);const originalWidth=parseFloat(input.style.width);pointerEvent(resize,'pointerdown',400,200);pointerEvent(resize,'pointermove',250,200);pointerEvent(resize,'pointerup',250,200);w.document.getElementById('draw-text-save').click();
  const resized=w.__ink.read('caption');assert.equal(resized.textWidth,Math.max(60,originalWidth-300));assert(w.__ink.shape(resized).querySelectorAll('tspan').length>1,'saved SVG wraps like the editor');
  w.__ink.openText([155,120]);assert.equal(parseFloat(input.style.width),resized.textWidth,'width survives reopening');pointerEvent(grip,'pointerdown',150,120);pointerEvent(grip,'pointermove',190,160);pointerEvent(grip,'pointercancel',190,160);w.document.getElementById('draw-text-save').click();assert.deepEqual(Array.from(w.__ink.read('caption').points[0]),[300,250],'cancelled drag restores its original position');
  w.document.getElementById('draw-undo').click();assert.equal(w.__ink.read('caption').textWidth,undefined);
  // Pencil release activates toolbar without a compatibility click. A following click must not undo twice.
  w.__ink.openText([1500,2000]);input.value='Тест пера';w.document.getElementById('draw-text-save').click();const penNote=w.__ink.objects().find(o=>o.text==='Тест пера');const undoButton=w.document.getElementById('draw-undo');pointerEvent(undoButton,'pointerdown',20,20,true);pointerEvent(undoButton,'pointerup',20,20,true);assert.equal(w.__ink.read(penNote.id),undefined);const beforeDuplicate=JSON.stringify(w.__ink.objects());undoButton.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));assert.equal(JSON.stringify(w.__ink.objects()),beforeDuplicate);
  const penTool=w.document.querySelector('[data-tool="pen"]');pointerEvent(penTool,'pointerdown',20,20,true);pointerEvent(penTool,'pointerup',20,20,true);assert.equal(penTool.getAttribute('aria-pressed'),'true');
  // Native 3D labels keep a serialized surface frame, are sent to the renderer and remain editable/undoable.
  let rendered=[];const surfaceAnchor={ref:{kind:'surface3d',key:'heart-surface'},box:[150,120,1,1],frame:{origin:[0,.4,.1],normal:[0,0,1],u:[1,0,0],v:[0,-1,0],scale:.003}};
  w.BioHackHeart={anchor:()=>surfaceAnchor,annotations:list=>{rendered=list;},hitAnnotation:()=> 'surface-label',planePoint:()=>[170,140]};
  assert.equal(w.__ink.validAnchor(surfaceAnchor),true);assert.equal(w.__ink.validAnchor({...surfaceAnchor,frame:{...surfaceAnchor.frame,scale:Infinity}}),false);
  const surfaceLabel={...label,id:'surface-label',text:'Аорта',points:[[150,120]],anchor:surfaceAnchor,erasures:undefined};w.__ink.add(surfaceLabel);w.__ink.render();
  assert.equal(w.__ink.shape(surfaceLabel),null,'surface label must not be duplicated as a flat SVG');assert(rendered.some(o=>o.id==='surface-label'));
  w.__ink.openText([800,700]);assert.equal(input.value,'Аорта','text tool finds label by 3D hit test');input.value='Аорта — сосуд';input.dispatchEvent(new w.Event('input'));w.__ink.render();assert.equal(rendered.find(o=>o.id==='surface-label').text,'Аорта — сосуд','3D text renders the draft before saving');assert.equal(rendered.find(o=>o.id==='surface-label').editingText,true,'native renderer omits the texture while the visible field owns text and caret');assert.notEqual(input.style.color,'transparent');assert.equal(w.__ink.read('surface-label').text,'Аорта','3D draft stays local until committed');w.document.getElementById('draw-text-save').click();
  assert.equal(w.__ink.read('surface-label').anchor,surfaceAnchor);assert.equal(w.__ink.read('surface-label').text,'Аорта — сосуд');
  w.__ink.eraseAt(155,120);w.__ink.eraseFinish();assert.equal(w.__ink.read('surface-label'),undefined,'3D eraser removes the anchored label');w.document.getElementById('draw-undo').click();assert.equal(w.__ink.read('surface-label').text,'Аорта — сосуд');

  // A callout starts at the surface but stores a separate spatial endpoint and a text label.
  w.BioHackHeart.hitAnnotation=()=>null;w.BioHackHeart.anchor=()=>({...surfaceAnchor,frame:{...surfaceAnchor.frame,callout:true,depth:.18}});
  w.document.getElementById('draw-launch').click();w.document.querySelector('[data-tool="callout"]').click();
  const pointer={button:0,buttons:1,pointerType:'mouse',pointerId:20,clientX:20,clientY:650,cancelable:true,preventDefault(){},currentTarget:w.document.getElementById('draw-layer')};
  w.__ink.down(pointer);w.__ink.movePointer({...pointer,clientX:40,clientY:670});w.__ink.endPointer({...pointer,buttons:0});
  assert.equal(w.document.getElementById('draw-text-title').textContent,'Подпись к структуре');input.value='Левый желудочек';w.document.getElementById('draw-text-save').click();
  const callout=w.__ink.objects().find(o=>o.type==='callout');assert(callout);assert.equal(callout.points.length,2);assert.equal(callout.anchor.frame.callout,true);assert.equal(callout.text,'Левый желудочек');
  const location=JSON.stringify({points:callout.points,anchor:callout.anchor});w.BioHackHeart.hitAnnotation=()=>callout.id;w.__ink.openText([800,700]);input.value='Стенка желудочка';w.document.getElementById('draw-text-save').click();assert.equal(JSON.stringify({points:w.__ink.read(callout.id).points,anchor:w.__ink.read(callout.id).anchor}),location,'editing text does not move either 3D endpoint');
  w.BioHackHeart.planePoint=(x,y)=>[x,y];w.__ink.openText([800,700]);const savedCallout=w.__ink.read(callout.id),oldStart=JSON.stringify(savedCallout.points[0]),oldEnd=[...savedCallout.points[1]];pointerEvent(grip,'pointerdown',200,200);pointerEvent(grip,'pointermove',240,230);pointerEvent(grip,'pointerup',240,230);w.document.getElementById('draw-text-save').click();assert.equal(JSON.stringify(w.__ink.read(callout.id).points[0]),oldStart,'moving the 3D caption leaves the heart attachment fixed');assert.deepEqual(Array.from(w.__ink.read(callout.id).points[1]),[oldEnd[0]+40,oldEnd[1]+30]);assert.deepEqual(w.__ink.read(callout.id).anchor,savedCallout.anchor);



 }finally{w.close();}
});

test('board model: catalog, native 3D annotations, restore, removal undo and isolated shared store',async()=>{
 const dom=new JSDOM('<header><nav></nav></header><main><section id="tab-test" class="tab-content"></section></main><div id="live-mirror"></div>',{runScripts:'outside-only',url:'https://biohack.test'}),w=dom.window,handles=[];
 try{
  w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.SVGElement.prototype.getScreenCTM=()=>null;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.HTMLElement.prototype.getBoundingClientRect=()=>({left:0,top:0,right:1000,bottom:800,width:1000,height:800});
  const frame={origin:[0,0,0],normal:[0,0,1],u:[1,0,0],v:[0,-1,0],scale:.002,callout:true,depth:.18},anchor={ref:{kind:'surface3d',key:'heart-surface'},box:[0,0,1,1],frame};
  w.__loadBoardModel=async()=>({createHeartViewer:(container,callbacks)=>{const canvas=w.document.createElement('canvas');container.append(canvas);const h={padding:callbacks.spacePadding,hitModel:(x,y)=>x<400,cancelInteraction(){this.cancelled=(this.cancelled||0)+1;},dispose(){this.disposed=true;canvas.remove();},annotations(list){this.list=list;},anchor:()=>structuredClone(anchor),planePoint:()=>[100,100],hitAnnotation:()=>null,snapshot:()=>null,reset(){this.resetCalled=true;}};handles.push(h);w.queueMicrotask(callbacks.onReady);return h;}});
  let source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function anchorWorldBox'));
  source=source.replace("import('/assets/heart-viewer.js')","window.__loadBoardModel()");const end=source.lastIndexOf('})();');source=source.slice(0,end)+`window.__board={read:id=>store().get(id),add:o=>set(o.id,o),anchor:drawingAnchor,mapping:anchorMapping,render,pan:()=>({...pan}),valid:validBoardModel};`+source.slice(end);w.eval(source);
  const click=id=>w.document.getElementById(id).click(),tick=()=>new Promise(resolve=>w.setTimeout(resolve,10));
  click('draw-open');click('draw-add-model');assert(w.document.getElementById('draw-model-catalog').open);w.document.querySelector('#draw-model-list button').click();await tick();
  const placement=w.__board.read('@board-model');assert.equal(placement.model,'heart');assert.equal(handles.length,1);assert.equal(handles[0].padding,.25);assert.equal(w.document.querySelector('#draw-board [data-tool="pointer"]').getAttribute('aria-pressed'),'true');assert.equal(w.__board.anchor(120,120).ref.kind,'surface3d');
  const note={id:'board-callout',key:'board',type:'callout',color:'#db2777',size:3,text:'Аорта',points:[[0,0],[100,100]],anchor};w.__board.add(note);assert.equal(handles[0].list.length,1);assert.equal(w.__board.mapping(note),null);assert.equal(w.document.querySelector('#draw-board-svg [data-draw-id="board-callout"]'),null);
  w.__board.add({...note,id:'lesson-note',key:'lesson:tab-test:main'});assert.equal(handles[0].list.length,1);
  const toggle=w.document.getElementById('draw-model-controls-toggle'),controls=w.document.getElementById('draw-model-controls');click('draw-model-controls-toggle');assert(controls.hidden);assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(w.localStorage.getItem('biohack-board-model-controls'),'collapsed');assert.equal(handles[0].disposed,undefined);click('draw-model-controls-toggle');assert.equal(controls.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(w.__board.read('@board-model').id,placement.id);
  assert.equal(w.document.querySelector('#draw-model-card .draw-model-head'),null);assert.equal(w.document.getElementById('draw-model-controls').parentElement.id,'draw-board-top');
  const modelSurface=w.document.getElementById('draw-model-canvas');modelSurface.setPointerCapture=()=>{};modelSurface.releasePointerCapture=()=>{};click('draw-model-move');assert.equal(w.document.getElementById('draw-model-move').getAttribute('aria-pressed'),'true');const event=(name,x,y)=>{const e=new w.MouseEvent(name,{bubbles:true,cancelable:true,button:0,buttons:1,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:7});modelSurface.dispatchEvent(e);};event('pointerdown',200,200);event('pointermove',260,230);event('pointerup',260,230);assert(w.__board.read('@board-model').x>placement.x);assert(w.__board.read('@board-model').y>placement.y);assert.deepEqual(w.__board.read('board-callout').anchor,anchor);click('draw-model-rotate');assert.equal(w.document.getElementById('draw-model-move').getAttribute('aria-pressed'),'false');
  // Empty canvas touches navigate the board, even inside the transparent 3D canvas.
  const touch=(type,id,x,y,target=modelSurface)=>{const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y});Object.defineProperties(e,{pointerId:{value:id},pointerType:{value:'touch'}});target.dispatchEvent(e);};
  let orbitMoves=0;modelSurface.addEventListener('pointermove',()=>orbitMoves++);let cameraStart=w.__board.pan();touch('pointerdown',80,700,400);touch('pointermove',80,750,430);touch('pointerup',80,750,430);assert.equal(orbitMoves,0,'transparent canvas does not rotate the model');assert.equal(w.__board.pan().x,cameraStart.x+50);assert.equal(w.__board.pan().y,cameraStart.y+30);
  cameraStart=w.__board.pan();touch('pointerdown',81,200,300);touch('pointermove',81,210,300);assert.equal(orbitMoves,1,'one touch on the heart still reaches rotation controls');touch('pointerdown',82,400,300);touch('pointermove',82,600,300);assert.equal(orbitMoves,1,'second touch transfers ownership to board pinch');assert(w.__board.pan().z>cameraStart.z);assert(handles[0].cancelled>0);touch('pointerup',82,600,300);touch('pointerup',81,210,300);touch('pointerdown',83,200,300);touch('pointermove',83,220,300);touch('pointerup',83,220,300);assert.equal(orbitMoves,2,'rotation resumes in the next gesture');
  // Two fingers navigate even when a drawing tool is selected; no accidental text is saved.
  w.document.querySelector('[data-tool="callout"]').click();cameraStart=w.__board.pan();touch('pointerdown',84,650,300);touch('pointerdown',85,750,300);touch('pointermove',85,900,300);assert(w.__board.pan().z>cameraStart.z);touch('pointercancel',84,650,300);touch('pointerup',85,900,300);assert.equal(w.document.getElementById('draw-text').hidden,true);
  click('draw-model-rotate');
  click('draw-model-smaller');assert(w.__board.read('@board-model').w<placement.w);click('draw-model-remove');assert(handles[0].disposed);assert.equal(w.__board.read('board-callout').text,'Аорта');click('draw-undo');await tick();assert.equal(handles.length,2);assert.equal(handles[1].list[0].text,'Аорта');
  click('draw-board-close');assert(handles[1].disposed);click('draw-open');await tick();assert.equal(handles.length,3);assert.equal(handles[2].list[0].text,'Аорта');
  await new Promise(resolve=>w.setTimeout(resolve,450));const saved=JSON.parse(w.localStorage.getItem('biohack-drawings-1'));assert(saved.some(([id,o])=>id==='@board-model'&&o.model==='heart'));
  // A room has its own board model and ink, never the browser's personal model.
  const shared=new Map();shared.observe=()=>{};shared.unobserve=()=>{};w.BioHackLive={state:()=>({role:'guest',room:'classroom',follow:false}),doc:()=>({getMap:()=>shared}),awareness:()=>({on(){},getStates:()=>new Map()})};w.dispatchEvent(new w.Event('biohack-live-change'));assert(handles[2].disposed);assert.equal(w.document.getElementById('draw-model-card').hidden,true);
  shared.set('@board-model',{...placement,id:'room-heart'});shared.set(note.id,note);w.__board.render();await tick();assert.equal(handles.length,4);assert.equal(handles[3].list[0].text,'Аорта');assert.equal(w.__board.read('@board-model').id,'room-heart');
  assert.equal(w.__board.valid({...placement,model:'untrusted-url'}),false);assert.equal(w.__board.valid({...placement,w:Infinity}),false);
 }finally{w.close();}
});
