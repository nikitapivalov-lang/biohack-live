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
test('actual group UI module: participant list, three cursors, teacher control and participant exit',async()=>{
 const service=createBiohackServer();service.server.listen(0,'127.0.0.1');await once(service.server,'listening');
 const base='http://127.0.0.1:'+service.server.address().port+service.prefix,wsBase=base.replace('http:','ws:')+'sync';
 const windows=[],doms=[],errors=[];
 function page(url,name){
  const dom=new JSDOM('<header><nav></nav></header><div id="course-trail">Тестовый урок</div><main><section id="tab-test" class="tab-content"><h2>Клетка</h2><button id="test-action">Следующий этап</button></section></main><div id="draw-toolbar"><button data-tool="hand" aria-pressed="true">Рука</button></div>',{url,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;doms.push(dom);windows.push(w);w.addEventListener('error',e=>errors.push(e.error));
  Object.defineProperty(w.crypto,'randomUUID',{value:randomUUID});Object.defineProperty(w,'innerWidth',{value:1200});Object.defineProperty(w,'innerHeight',{value:900});
  w.scrollTo=()=>{};w.HTMLElement.prototype.getBoundingClientRect=function(){return {left:100,top:100,width:800,height:600,right:900,bottom:700};};
  w.HTMLElement.prototype.getClientRects=function(){return [this.getBoundingClientRect()];};
  w.document.elementFromPoint=()=>w.document.querySelector('#test-action');
  w.BIOHACK_LOCAL_SERVER={wsBase};w.__testY=Y;w.__testProvider=class extends WebsocketProvider{constructor(_base,room,doc,options){super(wsBase,room,doc,{...options,WebSocketPolyfill:WebSocket});}};
  w.eval(source);w.document.querySelector('#live-name').value=name;return w;
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
  teacher.document.querySelector('#live-control').checked=true;teacher.document.querySelector('#live-control').dispatchEvent(new teacher.Event('change'));
  windows[1].BioHackLive.awareness().setLocalStateField('action',{type:'action',id:actionId,nonce:'same-action'});windows[2].BioHackLive.awareness().setLocalStateField('action',{type:'action',id:actionId,nonce:'same-action'});
  await waitFor(()=>actions.length===2);
  windows[2].document.querySelector('#live-leave').click();await waitFor(()=>teacher.BioHackLive.participants().length===2);
  assert.equal(teacher.document.querySelectorAll('.live-cursor:not([hidden])').length,2);assert.equal(teacher.document.querySelectorAll('#live-participant-list li').length,3);
  assert.equal(errors.length,0);
 }finally{for(const w of windows){w.document.querySelector('#live-leave')?.click();}for(const d of doms)d.window.close();await service.close();}
});
