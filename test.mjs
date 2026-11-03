import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import WebSocket from 'ws';
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import {createBiohackServer} from './server.mjs';
const waitFor=async(check)=>{for(let i=0;i<200;i++){if(check())return;await delay(20);}throw Error('Sync timeout');};
test('Render lesson server: public site, private files, isolated rooms and two-way sync',async()=>{
 const service=createBiohackServer();service.server.listen(0,'127.0.0.1');await once(service.server,'listening');
 const base='http://127.0.0.1:'+service.server.address().port;
 const docs=[],providers=[];
 try{
  assert.equal((await fetch(base+'/')).status,200);assert.deepEqual(await (await fetch(base+'/health')).json(),{status:'ok'});
  assert.equal((await fetch(base+'/.runtime/session.json')).status,404);
  const font=await fetch(base+'/assets/fonts/Onest.ttf');assert.equal(font.status,200);assert.equal(font.headers.get('content-type'),'font/ttf');assert.equal(Buffer.from(await font.arrayBuffer()).readUInt32BE(0),0x00010000);
  for(const name of ['digestion-user-reference.png','digestion-atlas-v2.png']){const image=await fetch(base+'/assets/'+name);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.equal(Buffer.from(await image.arrayBuffer()).subarray(1,4).toString(),'PNG');}
  const modelResponse=await fetch(base+'/assets/heart.glb');assert.equal(modelResponse.status,200);assert.equal(modelResponse.headers.get('content-type'),'model/gltf-binary');assert.equal(Buffer.from(await modelResponse.arrayBuffer()).subarray(0,4).toString(),'glTF');
  const viewerResponse=await fetch(base+'/assets/heart-viewer.js');assert.equal(viewerResponse.status,200);assert.match(viewerResponse.headers.get('content-type'),/javascript/);assert.match(await viewerResponse.text(),/createHeartViewer/);assert.equal((await fetch(base+'/heart-viewer-src.js')).status,404);
  assert.equal((await fetch(base+service.prefix+'../../server.mjs')).status,404);
  const response=await fetch(base+service.prefix);assert.equal(response.status,200);
  const html=await response.text();assert.ok(html.includes('window.BIOHACK_LOCAL_SERVER='));assert.ok(!html.includes("new WS.WebsocketProvider('wss://demos.yjs.dev/ws'"));
  for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
  assert.equal((await fetch(base+service.prefix+'vendor/live.mjs')).status,200);
  const wsBase=base.replace('http:','ws:')+service.prefix+'sync';
  for(let i=0;i<3;i++){const doc=new Y.Doc();docs.push(doc);providers.push(new WebsocketProvider(wsBase,i===2?'biohack-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa':'biohack-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',doc,{WebSocketPolyfill:WebSocket,disableBc:true}));}
  await waitFor(()=>providers.every(p=>p.synced));
  const host=docs[0].getMap('lesson'),student=docs[1].getMap('lesson'),other=docs[2].getMap('lesson');
  host.set('scene',JSON.stringify({type:'scene',text:'Анимация мейоза '.repeat(15000)}));
  await waitFor(()=>student.get('scene')===host.get('scene'));assert.equal(other.get('scene'),undefined);
  student.set('drawing-test',{x:123,y:456});await waitFor(()=>host.get('drawing-test')?.x===123);
  providers[1].awareness.setLocalStateField('profile',{role:'guest',name:'Ученик'});
  providers[1].awareness.setLocalStateField('pointer',{x:.25,y:.75});
  await waitFor(()=>[...providers[0].awareness.getStates().values()].some(s=>s.profile?.name==='Ученик'&&s.pointer?.x===.25));
  const forbidden=new WebSocket(base.replace('http:','ws:')+'/s/wrong/sync/biohack-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  const status=await new Promise(resolve=>{forbidden.on('unexpected-response',(_r,res)=>{res.resume();resolve(res.statusCode);});forbidden.on('error',()=>{});});assert.equal(status,403);forbidden.terminate();
 }finally{for(const p of providers)p.destroy();for(const doc of docs)doc.destroy();await service.close();}
});
