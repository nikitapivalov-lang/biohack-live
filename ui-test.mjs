import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {JSDOM} from 'jsdom';
import WebSocket from 'ws';
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import {createBiohackServer} from './server.mjs';
const waitFor=async(fn)=>{for(let i=0;i<250;i++){if(fn())return;await delay(20);}throw Error('UI sync timeout');};
const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
let source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("const VERSION='biohack-live-1'"));
const loadStart=source.indexOf(' async function loadLiveModules('),loadEnd=source.indexOf('\n',loadStart);
source=source.slice(0,loadStart)+' async function loadLiveModules(){return [window.__testY,{WebsocketProvider:window.__testProvider}];}'+source.slice(loadEnd);
const testEnd=source.lastIndexOf('})();');source=source.slice(0,testEnd)+'window.__control={patch:patchSceneBody,bind:bindGuestControls};'+source.slice(testEnd);
test('actual group UI module: participant list, three cursors, teacher control and participant exit',async()=>{
 const service=createBiohackServer();service.server.listen(0,'127.0.0.1');await once(service.server,'listening');
 const base='http://127.0.0.1:'+service.server.address().port+service.prefix,wsBase=base.replace('http:','ws:')+'sync';
 const windows=[],doms=[],errors=[];
 function page(url,name){
  const dom=new JSDOM('<header><nav></nav></header><div id="course-trail">Тестовый урок</div><main><section id="tab-test" class="tab-content"><h2>Клетка</h2><button id="test-action">Следующий этап</button><input id="answer"><select id="choice"><option value="a">А</option><option value="b">Б</option></select><textarea id="written"></textarea></section></main><div id="draw-toolbar"><button data-tool="hand" aria-pressed="true">Рука</button></div>',{url,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;doms.push(dom);windows.push(w);w.addEventListener('error',e=>errors.push(e.error));
  Object.defineProperty(w.crypto,'randomUUID',{value:randomUUID});Object.defineProperty(w,'innerWidth',{value:1200});Object.defineProperty(w,'innerHeight',{value:900});
  w.scrollTo=()=>{};w.HTMLElement.prototype.getBoundingClientRect=function(){return {left:100,top:100,width:800,height:600,right:900,bottom:700};};
  w.HTMLElement.prototype.getClientRects=function(){return [this.getBoundingClientRect()];};
  w.document.elementFromPoint=()=>w.document.querySelector('#test-action');
  w.BIOHACK_LOCAL_SERVER={wsBase};w.__testY=Y;w.__testProvider=class extends WebsocketProvider{constructor(_base,room,doc,options){super(wsBase,room,doc,{...options,WebSocketPolyfill:WebSocket});}};
  w.eval([...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('window.BioHackAnchors=')));w.eval(source);w.document.querySelector('#live-name').value=name;return w;
 }
 try{
  const teacher=page(base,'Учитель');teacher.document.querySelector('#live-create').click();
  await waitFor(()=>!!teacher.document.querySelector('#live-invite').value);
  const invitation=teacher.document.querySelector('#live-invite').value;
  for(const name of ['Анна','Борис','Вера']){const guest=page(invitation,name);guest.document.querySelector('#live-join').click();}
  await waitFor(()=>teacher.BioHackLive.participants().length===3);
  assert.equal(teacher.document.querySelectorAll('#live-participant-list li').length,4);
  for(const w of windows.slice(1))w.BioHackLive.awareness().setLocalStateField('pointer',{type:'cursor',x:.5,y:.5,nonce:randomUUID(),at:Date.now()});
  await waitFor(()=>teacher.document.querySelectorAll('.live-cursor:not([hidden])').length===3);
  const labels=[...teacher.document.querySelectorAll('.live-cursor:not([hidden]) span')].map(e=>e.textContent).sort();assert.deepEqual(labels,['Анна','Борис','Вера']);
  assert.equal(new Set([...teacher.document.querySelectorAll('.live-cursor:not([hidden]) path')].map(e=>e.getAttribute('fill'))).size,3);
  const actions=[];teacher.document.querySelector('#test-action').onclick=()=>actions.push('clicked');
  let scene=JSON.parse(teacher.BioHackLive.doc().getMap('lesson').get('scene'));const actionId=/data-live-action="([^"]+)"/.exec(scene.html)[1];
  windows[1].BioHackLive.awareness().setLocalStateField('action',{type:'action',id:actionId,nonce:randomUUID()});await delay(120);assert.equal(actions.length,0);
  const chooser=teacher.document.querySelector('#live-controller');
  chooser.value=String(windows[1].BioHackLive.doc().clientID);chooser.dispatchEvent(new teacher.Event('change'));teacher.document.querySelector('#live-grant').click();
  await waitFor(()=>windows[1].BioHackLive.state().canControl);
  scene=JSON.parse(teacher.BioHackLive.doc().getMap('lesson').get('scene'));
  const epoch=scene.controlEpoch;
  const relay=(w,msg)=>w.BioHackLive.awareness().setLocalStateField('action',{type:'action',nonce:randomUUID(),epoch,...msg});
  relay(windows[2],{id:actionId,kind:'click',seq:1});await delay(120);assert.equal(actions.length,0);
  relay(windows[1],{id:actionId,kind:'click',seq:1});await waitFor(()=>actions.length===1);
  const parse=new JSDOM(scene.html),answerId=parse.window.document.querySelector('#answer').dataset.liveAction;
  relay(windows[1],{id:answerId,kind:'input',seq:2,value:'митоз'});await waitFor(()=>teacher.document.querySelector('#answer').value==='митоз');
  const choiceId=parse.window.document.querySelector('#choice').dataset.liveAction;
  relay(windows[1],{id:choiceId,kind:'change',seq:3,value:'b'});await waitFor(()=>teacher.document.querySelector('#choice').value==='b');
  const writtenId=parse.window.document.querySelector('#written').dataset.liveAction;
  relay(windows[1],{id:writtenId,kind:'input',seq:4,value:'Развёрнутый ответ'});await waitFor(()=>teacher.document.querySelector('#written').value==='Развёрнутый ответ');parse.window.close();
  // Exercise the actual guest input relay and reconciliation, preserving the focused field.
  const mirror=new JSDOM(scene.html,{pretendToBeVisual:true}),doc=mirror.window.document;
  windows[1].__control.bind(doc);const focused=doc.querySelector('#answer');focused.focus();focused.value='Пишу ответ';focused.setSelectionRange(4,4);
  focused.dispatchEvent(new mirror.window.Event('input',{bubbles:true}));
  const stale=new JSDOM(scene.html);windows[1].__control.patch(doc,stale.window.document.body,0);
  assert.equal(doc.querySelector('#answer'),focused);assert.equal(doc.activeElement,focused);assert.equal(focused.value,'Пишу ответ');assert.equal(focused.selectionStart,4);
  // Earlier manual messages above used sequence 1..4; repeat through the guest relay until its own sequence advances.
  for(let i=0;i<5;i++)focused.dispatchEvent(new mirror.window.Event('input',{bubbles:true}));
  await waitFor(()=>teacher.document.querySelector('#answer').value==='Пишу ответ');
  mirror.window.close();stale.window.close();
  teacher.document.querySelector('#test-action').click();assert.equal(actions.length,1,'host lesson input is paused while guest owns control');
  teacher.document.querySelector('#live-reclaim').click();await waitFor(()=>!windows[1].BioHackLive.state().canControl);
  relay(windows[1],{id:actionId,kind:'click',seq:5});await delay(120);assert.equal(actions.length,1);
  teacher.document.querySelector('#test-action').click();assert.equal(actions.length,2);
  // A 390 px guest uses its own viewport, with an explicit legacy mirror fallback.
  const guest=windows[1],inner=guest.document.getElementById('live-mirror-inner'),frame=guest.document.getElementById('live-frame');
  assert(frame.sandbox?.contains?.('allow-scripts')||frame.getAttribute('sandbox').split(' ').includes('allow-scripts'),'parent-realm event listeners need scripts enabled in the frame sandbox');
  assert.match(frame.srcdoc,/script-src &apos;none&apos;/,'the mirrored scene must still forbid copied scripts');
  Object.defineProperty(inner,'clientWidth',{value:390,configurable:true});
  guest.dispatchEvent(new guest.Event('resize'));
  assert.equal(frame.style.width,'390px');assert.equal(frame.style.transform,'scale(1)');
  const adaptive=guest.document.getElementById('live-adaptive');assert.equal(adaptive.checked,true);
  adaptive.checked=false;adaptive.dispatchEvent(new guest.Event('change'));
  assert.equal(frame.style.width,'1200px');assert.equal(frame.style.transform,'scale(0.325)');
  adaptive.checked=true;adaptive.dispatchEvent(new guest.Event('change'));
  assert.equal(frame.style.width,'390px');
  // Continuous mutations must reach peers before the animation stops.
  const lesson=teacher.document.querySelector('#tab-test');
  const svg=teacher.document.createElementNS('http://www.w3.org/2000/svg','svg');
  const motion=teacher.document.createElementNS(svg.namespaceURI,'animateTransform');
  motion.setAttribute('begin','indefinite');motion.setAttribute('dur','2s');
  svg.getCurrentTime=()=>2.5;motion.getStartTime=()=>1;motion.getSimpleDuration=()=>2;
  svg.append(motion);lesson.append(svg);
  let tick=0;const stream=setInterval(()=>svg.setAttribute('data-frame',String(++tick)),15);
  try{
   await waitFor(()=>/data-frame="[1-9]/.test(JSON.parse(windows[1].BioHackLive.doc().getMap('lesson').get('scene')).html));
   assert.match(JSON.parse(windows[1].BioHackLive.doc().getMap('lesson').get('scene')).html,/begin="-1.5s"/);
   assert(tick>0);
  }finally{clearInterval(stream);}
  const animated=teacher.document.createElement('div');lesson.append(animated);
  const clock=Date.now(),effect={target:animated};
  animated.getAnimations=()=>[{animationName:'test-motion',effect,playState:'running',currentTime:Date.now()-clock}];
  lesson.getAnimations=()=>animated.getAnimations();
  let previous=teacher.BioHackLive.doc().getMap('lesson').get('scene');
  await waitFor(()=>{const next=teacher.BioHackLive.doc().getMap('lesson').get('scene');return next!==previous&&next.includes('animation-delay');});
  previous=teacher.BioHackLive.doc().getMap('lesson').get('scene');
  await waitFor(()=>teacher.BioHackLive.doc().getMap('lesson').get('scene')!==previous);
  lesson.getAnimations=()=>[];animated.getAnimations=()=>[];
  windows[2].document.querySelector('#live-leave').click();await waitFor(()=>teacher.BioHackLive.participants().length===2);
  assert.equal(teacher.document.querySelectorAll('.live-cursor:not([hidden])').length,2);assert.equal(teacher.document.querySelectorAll('#live-participant-list li').length,3);
  assert.equal(errors.length,0);
 }finally{for(const w of windows){w.document.querySelector('#live-leave')?.click();}for(const d of doms)d.window.close();await service.close();}
});
