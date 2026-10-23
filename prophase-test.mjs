import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
test('all inline application scripts parse',()=>{
 for(const [,attrs,source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/type=["'](?:module|application\/)/.test(attrs))new Function(source);
 }
});
test('prophase: five stages, reciprocal exchange, persistent chiasma, playback and reset',()=>{
 const dom=new JSDOM('<main><details open></details></main>',{runScripts:'outside-only'}),w=dom.window;
 let frame=null,cancelled=false;
 w.requestAnimationFrame=fn=>{frame=fn;return 1;};w.cancelAnimationFrame=()=>{frame=null;cancelled=true;};
 Object.defineProperty(w.document,'hidden',{value:false});
 w.eval("let meiStep=2;window.leaveProphase=()=>{meiStep=3;};function cyButton(name,fn,cls){const b=document.createElement('button');b.textContent=name;b.onclick=fn;b.className=cls;return b;}"+html.slice(html.indexOf('// Prophase I: one enlarged bivalent'),html.indexOf('function meiCounts(){'))+';meiProphaseMount(document.querySelector("details"));');
 const panel=w.document.querySelector('#mei-prophase');panel.hidden=false;
 const stages=[...panel.querySelectorAll('[data-prophase]')];assert.equal(stages.length,5);
 const svg=w.document.querySelector('#mei-prophase-svg');
 for(let i=0;i<5;i++){
  stages[i].click();assert.equal(stages[i].getAttribute('aria-pressed'),'true');assert.equal(panel.querySelector('input').value,String(i));
  assert.match(svg.getAttribute('aria-label'),new RegExp(stages[i].textContent));
  assert.equal(svg.querySelectorAll('ellipse[fill="#475569"]').length,2,'two centromeres at every stage');
  assert.equal(svg.querySelectorAll('circle[stroke="#8b5cf6"]').length,i<2?0:1,'exchange point retained through diakinesis');
  assert.equal(svg.querySelectorAll('path[stroke="#d95b63"]').length,i<2?2:3);
  assert.equal(svg.querySelectorAll('path[stroke="#4686c6"]').length,i<2?2:3);
  assert.doesNotMatch(svg.innerHTML,/NaN|undefined/);
 }
 panel.querySelector('#mei-prophase-reset').click();assert.equal(panel.querySelector('input').value,'0');
 const play=panel.querySelector('#mei-prophase-play');play.click();assert.equal(play.getAttribute('aria-pressed'),'true');
 frame(1000);frame(4500);assert.ok(Number(panel.querySelector('input').value)>0);
 play.click();assert.equal(play.getAttribute('aria-pressed'),'false');assert.equal(frame,null);assert.equal(cancelled,true);
 const range=panel.querySelector('input');range.value='2.5';range.dispatchEvent(new w.Event('input'));assert.equal(range.value,'2.5');assert.match(svg.innerHTML,/Хиазма/);
 play.click();w.document.querySelector('details').open=false;frame(5000);assert.equal(frame,null,'collapsing detail stops playback');
 dom.window.close();
});
test('main scene: homologs pair tightly and retain a shared chiasma',()=>{
 const start=html.indexOf('function meiosisModel(stage,t){'),end=html.indexOf('/* Shared continuous chromosome/spindle animation');
 const {model,scene}=new Function(html.slice(start,end)+';return {model:meiosisModel,scene:meiosisScene};')();
 const initial=model(2,0),paired=model(2,.65),final=model(2,1);
 assert.equal(final.chromosomes.length,4);
 assert.ok(paired.chromosomes[1].x-paired.chromosomes[0].x<30);
 assert.ok(initial.chromosomes[1].x-initial.chromosomes[0].x>100);
 for(const t of [0,.25,.5,.7,.9,1])assert.doesNotMatch(scene(2,t),/NaN|undefined/);
 assert.match(scene(2,.6),/data-synapsis/);
 assert.match(scene(2,1),/data-chiasma/);
 assert.match(scene(3,0),/data-chiasma/);
 assert.doesNotMatch(scene(4,1),/data-chiasma/);
});
test('all eleven meiosis stages render numbered event lists',()=>{
 const dom=new JSDOM('<div id="mei-explanation"></div><span id="mei-stage-title"></span><span id="mei-set"></span><button id="mei-prev"></button><button id="mei-next"></button><input id="mei-diploid" type="number" value="4">',{runScripts:'outside-only'}),w=dom.window;
 const data=html.slice(html.indexOf('const meiStages=['),html.indexOf('function cyMeiosisMount(root){'));
 const select=html.slice(html.indexOf('function meiSelect(index){'),html.indexOf('function meiDraw(step){'));
 w.eval(data+'function meiProphasePause(){}function meiCounts(){}function meiDraw(){}'+select+';window.renderMeiosis=meiSelect;');
 for(let i=0;i<11;i++){
  w.renderMeiosis(i);const list=w.document.querySelector('#mei-explanation ol');
  assert.ok(list);assert.ok(list.children.length>=4);assert.equal(w.document.querySelector('#mei-explanation h4').textContent.length>5,true);
 }
 w.renderMeiosis(2);assert.match(w.document.querySelector('ol').textContent,/Конъюгация/);assert.match(w.document.querySelector('ol').textContent,/Кроссинговер/);
 w.renderMeiosis(5);assert.match(w.document.querySelector('h4').textContent,/двух гаплоидных клеток/);assert.match(w.document.querySelector('ol').textContent,/цитокинез/);
 dom.window.close();
});
test('all seven mitosis and interphase stages render numbered explanations',()=>{
 const ids=['mitosis-phase-title','mitosis-nc-badge','mitosis-phase-desc','mitosis-svg','mitosis-quiz-q','mitosis-hint-box','mitosis-quiz-options','mitosis-quiz-feedback'];
 const dom=new JSDOM(ids.map(id=>`<div id="${id}"></div>`).join(''),{runScripts:'outside-only'}),w=dom.window;
 const a=html.indexOf('const mitosisPhases = ['),b=html.indexOf('function showInterphasePeriods(open)',a);
 const c=html.indexOf('function setMitosisPhase(idx)'),d=html.indexOf('function changeMitosisStep(delta)',c);
 w.eval('function drawCycleCell(){return "<svg></svg>";}function showInterphasePeriods(){}'+html.slice(a,b)+html.slice(c,d)+';window.selectMitosis=setMitosisPhase;');
 for(let i=0;i<7;i++){
  w.selectMitosis(i);const list=w.document.querySelector('#mitosis-phase-desc ol');assert.ok(list);assert.ok(list.children.length>=4);assert.equal(w.document.querySelectorAll('#mitosis-quiz-options button').length,3);
 }
 w.selectMitosis(5);assert.match(w.document.querySelector('ol').textContent,/самостоятельной однохроматидной/);assert.match(w.document.querySelector('#mitosis-hint-box').textContent,/4n4c/);
 dom.window.close();
});
test('replication fork: continuous leading growth, sequential Okazaki fragments and daughter duplexes',()=>{
 const start=html.indexOf('function repVisualModel(stage,t)'),end=html.indexOf('function repVisualPaint(){',start);
 const get=new Function('repStage','repStages',html.slice(start,end)+';return {model:repVisualModel,draw:repDrawing};');
 const titles=Array.from({length:8},()=>['Тест']);
 for(let stage=0;stage<8;stage++)for(const t of [0,.2,.6,1]){
  const {draw}=get(stage,titles);assert.doesNotMatch(draw(t),/NaN|undefined/);
 }
 const {model,draw}=get(5,titles);assert.ok(model(5,1).fork>model(5,0).fork);
 assert.ok(model(5,.3).fragments[0].progress>model(5,.3).fragments[2].progress);
 assert.match(draw(.7),/data-leading/);assert.match(draw(.7),/data-okazaki/);
 const result=get(7,titles).draw(1);assert.equal((result.match(/data-daughter=/g)||[]).length,2);
 assert.match(get(7,titles).draw(.5),/data-enzyme="ligase"/);
});
test('transcription playback: complete correct RNA, pause/resume and manual interruption',()=>{
 const dom=new JSDOM('<section id="tab-transcription"><div data-lesson-screen="main"></div><svg id="tr-scene"></svg></section><button id="tr-motion-play"></button><p id="tr-motion-status"></p>',{runScripts:'outside-only'}),w=dom.window;
 const timers=new Map();let id=0;w.setTimeout=fn=>{timers.set(++id,fn);return id;};w.clearTimeout=id=>timers.delete(id);
 Object.defineProperty(w.document,'hidden',{value:false});w.matchMedia=()=>({matches:false});
 const base=html.slice(html.indexOf("const trTemplate="),html.indexOf('function trSvgText('));
 const motion=html.slice(html.indexOf('const trMotion={'),html.indexOf('function trMotionMount(){'));
 w.eval('function trRender(){}function trRenderScene(){}'+base+motion+';window.motionTest={start:trMotionStart,pause:trMotionPause,back:trBack,state:()=>trState,playing:()=>trMotion.playing};');
 const m=w.motionTest;m.start();assert.equal(m.state().stage,1);m.pause();assert.equal(timers.size,0);assert.equal(m.playing(),false);
 m.start();assert.equal(m.state().stage,2);
 let count=0;while(timers.size&&count++<30){const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}
 assert.equal(m.state().stage,6);assert.equal(m.state().rna,'АУГЦЦУУГГАЦГ');assert.equal(m.state().errors,0);assert.equal(m.playing(),false);
 m.start();assert.equal(m.state().stage,1);m.back();assert.equal(m.state().stage,0);assert.equal(m.playing(),false);assert.equal(timers.size,0);
 dom.window.close();
});
test('organelle atlas: eighteen diagrams and Golgi controls, cargo modification and destinations',()=>{
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=dom.window;let frame=null;
 w.requestAnimationFrame=fn=>{frame=fn;return 1;};w.cancelAnimationFrame=()=>frame=null;
 w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};const errors=[];w.addEventListener('error',e=>errors.push(e.error));
 const source=html.match(/<script id="organelle-atlas">([\s\S]*?)<\/script>/)[1];
 w.eval("let cyCurrent={id:'organelles'},cyPart='theory';"+source+';window.atlasTest={mount:orgAtlasMount,select:orgAtlasSelect,scene:golgiScene};');
 const a=w.atlasTest;a.mount(w.document.querySelector('main'));
 assert.equal(w.document.querySelectorAll('[data-org]').length,18);
 for(const b of [...w.document.querySelectorAll('[data-org]')]){
  b.click();const focus=w.document.querySelector('.org-focus');assert.ok(focus.querySelector('svg'));assert.ok(focus.querySelectorAll('li').length>=2);assert.doesNotMatch(focus.innerHTML,/NaN|undefined/);
 }
 a.select('golgi');assert.equal(w.document.querySelectorAll('[data-golgi-step]').length,6);
 for(const b of w.document.querySelectorAll('[data-golgi-step]')){b.click();assert.equal(b.getAttribute('aria-pressed'),'true');assert.ok(w.document.querySelector('#golgi-step-text').textContent.length>50);}
 for(const t of [0,.5,1.5,2.5,3.5,4.5,5.99])assert.doesNotMatch(a.scene(t),/NaN|undefined/);
 assert.match(a.scene(3.9),/data-cargo="modified"/);assert.match(a.scene(5.99,'endosome'),/Эндосома/);assert.match(a.scene(5.99),/Секреция/);
 const play=w.document.querySelector('#golgi-play');play.click();assert.ok(frame);play.click();assert.equal(frame,null);
 a.select('ribosome');assert.equal(w.document.querySelector('#golgi-scene'),null);assert.deepEqual(errors,[]);dom.window.close();
});
test('theme: saved preference, nested CSS colors and independent mirrored scene',()=>{
 const source=html.match(/<script id="biohack-theme-controller">([\s\S]*?)<\/script>/)[1],init=html.match(/<script id="biohack-theme-init">([\s\S]*?)<\/script>/)[1];
 const dom=new JSDOM('<head><meta name="theme-color"><style>.from-burgundy-600{--tw-gradient-from:#800020;--tw-gradient-to:#69001b}.bg-white{background-color:rgb(255 255 255 / var(--tw-bg-opacity))}.card:is(.a,.b){color:#334155}</style><style id="biohack-theme-palette"></style></head><body><header><div class="shell-panel-controls"></div></header><iframe id="live-frame"></iframe></body>',{url:'http://localhost',runScripts:'outside-only'}),w=dom.window;
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.requestAnimationFrame=()=>1;
 for(const node of w.document.querySelectorAll('style'))Object.defineProperty(node.sheet,'ownerNode',{value:node});
 w.eval(init);assert.equal(w.document.documentElement.dataset.theme,'dark');w.eval(source);
 const button=w.document.querySelector('#shell-theme-toggle');assert.equal(button.getAttribute('aria-pressed'),'true');
 const generated=w.document.querySelector('#biohack-theme-palette');assert.match(generated.textContent,/--tw-gradient-from:rgba\(142,36,72,1\)/,'gradient stops use the same wine accent as buttons');assert.match(generated.textContent,/background-color:rgba\(29,25,34,1\)/);assert.match(generated.textContent,/:is\(\.a,\.b\)/);assert.doesNotMatch(generated.textContent,/rgba\([^)]*\)\)/);
 button.click();assert.equal(w.localStorage.getItem('biohack-theme'),'light');assert.equal(w.document.querySelector('#live-frame').contentDocument.documentElement.dataset.theme,'light');
 w.eval(init);assert.equal(w.document.documentElement.dataset.theme,'light','saved choice wins over OS preference');button.click();assert.equal(w.localStorage.getItem('biohack-theme'),'dark');assert.equal(w.document.querySelector('#live-frame').contentDocument.documentElement.dataset.theme,'dark');dom.window.close();
});
test('Baltimore: seven landscape layouts preserve all stages and keep nodes apart',()=>{
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
 w.eval(html.slice(html.indexOf('const vcN='),html.indexOf('function vgCycleMount('))+';window.plans={vcPlan,vcWidePlan,vcScene};');
 for(let group=0;group<7;group++){
  const portrait=w.plans.vcPlan(group),wide=w.plans.vcWidePlan(portrait,group);
  assert.equal(wide.steps,portrait.steps);assert.equal(wide.edges,portrait.edges);
  assert.equal(wide.nodes.length,portrait.nodes.length);
  for(const [i,n]of wide.nodes.entries()){
   assert(n.x>=100&&n.x<=1100&&n.y>=150&&n.y<=550);
   for(const other of wide.nodes.slice(i+1))assert(Math.abs(n.x-other.x)>=166||Math.abs(n.y-other.y)>=89,'cards may not overlap');
  }
  for(let step=0;step<wide.steps.length;step++)for(const t of [0,.5,1]){
   const frame=w.plans.vcScene(wide,step,t);assert.doesNotMatch(frame,/NaN|undefined|Infinity/);assert.match(frame,/rx="560" ry="280"/);
  }
  assert.match(w.plans.vcScene(portrait,0,0),/circle cx="450" cy="455" r="350"/,'portrait view stays available');
 }
 dom.window.close();
});
test('dark diagram palette covers authored SVG colors and keeps labels legible',()=>{
 const controller=html.match(/<script id="biohack-theme-controller">([\s\S]*?)<\/script>/)[1];
 const helpers=controller.slice(controller.indexOf(' function rgb('),controller.indexOf(' function themeSelectors('));
 const {diagramColor,diagramColors,diagramRules}=new Function(helpers+';return {diagramColor,diagramColors,diagramRules};')();
 const palette=new Set(diagramColors);
 for(const [,color]of html.matchAll(/(?:fill|stroke|stop-color)=["'](#[\da-fA-F]{3,8})["']/g))assert(palette.has(color.toLowerCase()),'unmapped diagram color '+color);
 function luminance(value){const channels=value.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
 const background=luminance(diagramColor('#fff','fill')),label=luminance(diagramColor('#334155','text'));
 assert((label+.05)/(background+.05)>4.5,'diagram labels need readable contrast');
 assert.notEqual(diagramColor('#800020','stroke'),diagramColor('#7c65a4','stroke'),'RNA and DNA remain distinguishable');
 const css=diagramRules();assert.match(css,/html\[data-theme="dark"\]/);assert.match(css,/:not\(#draw-board-svg\)/);assert.match(css,/:not\(mask \*,clipPath \*,filter \*\)/);
});

test('heart lesson: own viewer, lifecycle, controls, attribution and cleanup',async()=>{
 const dom=new JSDOM('<main><section id="tab-cell" class="tab-content"></section></main>',{runScripts:'outside-only',url:'https://biohack.test/'}),w=dom.window;
 try{
  const routing=html.slice(html.indexOf('const lessonScreenSets='),html.indexOf('function openLessonScreen('));
  w.eval("var biologyDirectory=[{id:'anatomy',topics:[]}],moduleCategory={};function switchTab(id){document.querySelectorAll('.tab-content').forEach(el=>el.classList.toggle('hidden',el.id!=='tab-'+id));}"+routing.replace('const lessonScreenSets=','var lessonScreenSets='));
  let loads=0,disposals=0,zooms=[],resets=0,backs=0;
  w.__loadHeartViewer=async()=>{loads++;return {createHeartViewer:(container,options)=>{container.append(w.document.createElement('canvas'));options.onReady();return {dispose:()=>disposals++,zoom:factor=>zooms.push(factor),reset:()=>resets++,back:()=>backs++,snapshot:()=>null};}};};
  const source=html.match(/<script id="biohack-heart-lesson">([\s\S]*?)<\/script>/)[1];
  assert(!source.includes('sketchfab.com/models/'),'no external embedded viewer');
  w.eval(source.replace("await import('/assets/heart-viewer.js')","await window.__loadHeartViewer()"));
  const root=w.document.getElementById('tab-heart');assert(root.classList.contains('hidden'));
  assert.equal(w.eval('moduleCategory.heart'),'anatomy');assert.equal(w.eval('biologyDirectory[0].topics[0][1]'),'heart');
  assert.equal(w.eval('!!lessonScreenSets.heart.screens.main'),true);
  assert.equal(loads,0);assert.equal(root.querySelectorAll('iframe').length,0);
  w.eval("switchTab('heart')");w.document.getElementById('ht-load').click();w.document.getElementById('ht-load').click();await new Promise(resolve=>w.setTimeout(resolve,0));
  assert.equal(loads,1);assert(root.querySelector('canvas'));assert.equal(w.document.getElementById('ht-placeholder').hidden,true);
  for(const id of ['ht-zoom-in','ht-zoom-out','ht-reset','ht-back']){assert.equal(w.document.getElementById(id).disabled,false);w.document.getElementById(id).click();}
  assert.deepEqual(zooms,[1.2,1/1.2]);assert.equal(resets,1);assert.equal(backs,1);
  w.document.getElementById('ht-fullscreen').click();assert(root.querySelector('.ht-expanded'));assert.equal(root.querySelector('[aria-modal]').getAttribute('aria-modal'),'true');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(root.querySelector('.ht-expanded'),null);
  assert.match(root.textContent,/CC BY 4.0/);assert.match(root.textContent,/eruwen/);assert.match(root.textContent,/marxtrax/);
  assert.equal(root.querySelectorAll('.ht-flow span').length,9);
  w.eval("switchTab('cell')");assert.equal(disposals,1);assert.equal(root.querySelector('canvas'),null);assert.equal(w.document.getElementById('ht-placeholder').hidden,false);
  // A module that finishes importing after navigation must not mount a hidden GPU viewer.
  let release;w.__loadHeartViewer=()=>new Promise(resolve=>release=resolve);w.eval("switchTab('heart')");w.document.getElementById('ht-load').click();w.eval("switchTab('cell')");release({createHeartViewer:()=>{throw Error('stale load mounted');}});await new Promise(resolve=>w.setTimeout(resolve,0));assert.equal(root.querySelector('canvas'),null);
 }finally{w.close();}
});


test('3D callout geometry retains fixed surface and spatial endpoints after serialization',async()=>{
 const {calloutPoints}=await import('./heart-viewer.js');
 const o={points:[[100,50],[150,25]],anchor:{box:[100,50,1,1],frame:{origin:[1,2,3],normal:[0,0,1],u:[1,0,0],v:[0,-1,0],scale:.01,callout:true,depth:.18}}};
 const result=calloutPoints(o);assert.deepEqual(result.start,[1,2,3]);assert.deepEqual(result.elbow,[1,2,3.18]);assert.deepEqual(result.end,[1.5,2.25,3.18]);assert.deepEqual(calloutPoints(JSON.parse(JSON.stringify(o))),result);
});
