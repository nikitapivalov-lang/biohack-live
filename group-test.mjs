import test from 'node:test';
import assert from 'node:assert/strict';
import {once,setMaxListeners} from 'node:events';
setMaxListeners(32);
import {setTimeout as delay} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import WebSocket from 'ws';
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import {createBiohackServer} from './server.mjs';
const core={};vm.createContext(core);vm.runInContext(readFileSync(new URL('group-core.js',import.meta.url),'utf8'),core);
const Roster=vm.runInContext('BioHackGroupRoster',core);
const waitFor=async(fn)=>{for(let i=0;i<250;i++){if(fn())return;await delay(20);}throw Error('Synchronization timed out');};
test('teacher plus ten students: independent cursors, common drawings, reconnect and room limit',async()=>{
 const service=createBiohackServer();service.server.listen(0,'127.0.0.1');await once(service.server,'listening');
 const base='ws://127.0.0.1:'+service.server.address().port+service.prefix+'sync';
 const docs=[],providers=[],room='biohack-11111111-1111-1111-1111-111111111111',roster=new Roster();
 const connect=role=>{const doc=new Y.Doc(),p=new WebsocketProvider(base,room,doc,{WebSocketPolyfill:WebSocket,disableBc:true,params:{role}});docs.push(doc);providers.push(p);p.awareness.setLocalStateField('profile',{app:'biohack-live-1',role,name:role==='host'?'Преподаватель':'Ученик '+docs.length});return p;};
 try{
  connect('host');for(let i=0;i<10;i++)connect('guest');await waitFor(()=>providers.every(p=>p.synced));
  await waitFor(()=>roster.read(providers[0].awareness.getStates(),docs[0].clientID,'host').guests.length===10);
  docs[0].getMap('lesson').set('scene','Мейоз '+'.'.repeat(180000));await waitFor(()=>docs.every(d=>d.getMap('lesson').get('scene')===docs[0].getMap('lesson').get('scene')));
  for(let i=1;i<11;i++){providers[i].awareness.setLocalStateField('pointer',{type:'cursor',x:i/12,y:.5,nonce:'same-cursor-nonce',at:Date.now()});docs[i].getMap('drawings').set('stroke-'+i,{author:i,points:[[i,20],[i+10,40]]});}
  await waitFor(()=>docs[0].getMap('drawings').size===10);
  await waitFor(()=>[...providers[0].awareness.getStates().values()].filter(s=>s.pointer?.nonce==='same-cursor-nonce').length===10);
  const cursorEvents=roster.read(providers[0].awareness.getStates(),docs[0].clientID,'host').events.filter(e=>e.message.type==='cursor');assert.equal(cursorEvents.length,10);assert.equal(roster.read(providers[0].awareness.getStates(),docs[0].clientID,'host').events.length,0);
  const refused=new WebSocket(base+'/'+room+'?role=guest');const code=await new Promise(resolve=>{refused.on('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode);});refused.on('error',()=>{});});assert.equal(code,429);refused.terminate();
  providers[4].destroy();await waitFor(()=>roster.read(providers[0].awareness.getStates(),docs[0].clientID,'host').guests.length===9);assert.ok(providers[1].wsconnected);
  const replacement=connect('guest');await waitFor(()=>replacement.synced);await waitFor(()=>roster.read(providers[0].awareness.getStates(),docs[0].clientID,'host').guests.length===10);
  assert.equal(docs.at(-1).getMap('drawings').size,10);
  const newGuestRoster=new Roster(),state=newGuestRoster.read(replacement.awareness.getStates(),docs.at(-1).clientID,'guest');assert.equal(state.host.id,docs[0].clientID);assert.equal(state.members.length,10);
 }finally{for(const p of providers)p.destroy();for(const doc of docs)doc.destroy();await service.close();}
});
