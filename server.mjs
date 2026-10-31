import http from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,join} from 'node:path';
import {WebSocketServer} from 'ws';
import {setupWSConnection,docs} from '@y/websocket-server/utils';

const root=dirname(fileURLToPath(import.meta.url));
export function createBiohackServer(){
 const token=randomBytes(24).toString('base64url'),prefix='/';
 const input=readFileSync(join(root,'index.html'),'utf8');
 const config=`<script>window.BIOHACK_LOCAL_SERVER={wsBase:location.origin.replace(/^http/,'ws')+${JSON.stringify(prefix+'sync')},moduleURL:${JSON.stringify(prefix+'vendor/live.mjs')}};</script>`;
 const html=Buffer.from(input.replace('</head>',config+'</head>')),compressed=gzipSync(html);
 const bridge=readFileSync(join(root,'live.mjs'));
 const heartAssets=new Map([['/assets/heart.glb',{type:'model/gltf-binary',body:readFileSync(join(root,'heart.glb'))}],['/assets/heart-viewer.js',{type:'text/javascript; charset=utf-8',body:readFileSync(join(root,'heart-viewer.js'))}]]);
 heartAssets.set('/assets/genetics-family-vector-v2.svg',{type:'image/svg+xml; charset=utf-8',body:readFileSync(join(root,'assets','genetics-family-vector-v2.svg'))});
 heartAssets.set('/assets/genetics-human-family-schematic.svg',{type:'image/svg+xml; charset=utf-8',body:readFileSync(join(root,'assets','genetics-human-family-schematic.svg'))});
 for(const name of ['digestion-user-reference.png','digestion-atlas-v2.png','genetics-human-family.png','genetics-family-editorial.png','genetics-family-selected.png','mendel-giant-peas.png','genetics-family-selected-dark.png'])heartAssets.set('/assets/'+name,{type:'image/png',body:readFileSync(join(root,'assets',name))});
 heartAssets.set('/assets/fonts/Onest.ttf',{type:'font/ttf',body:readFileSync(join(root,'assets/fonts/Onest.ttf'))});
 const wss=new WebSocketServer({noServer:true,maxPayload:16*1024*1024,perMessageDeflate:false});
 const server=http.createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const common={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,common);res.end();return;}
  if(heartAssets.has(path)){const asset=heartAssets.get(path);res.writeHead(200,{...common,'Content-Type':asset.type});res.end(req.method==='HEAD'?undefined:asset.body);return;}
  if(path==='/health'){res.writeHead(200,{...common,'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok'}));return;}
  if(path===prefix||path===prefix+'index.html'){
   const gzip=/\bgzip\b/.test(req.headers['accept-encoding']||'');
   res.writeHead(200,{...common,'Content-Type':'text/html; charset=utf-8','Vary':'Accept-Encoding',...(gzip?{'Content-Encoding':'gzip'}:{})});res.end(req.method==='HEAD'?undefined:gzip?compressed:html);return;
  }
  if(path===prefix+'vendor/live.mjs'){res.writeHead(200,{...common,'Content-Type':'text/javascript; charset=utf-8'});res.end(req.method==='HEAD'?undefined:bridge);return;}
  res.writeHead(404,{...common,'Content-Type':'text/plain; charset=utf-8'});res.end('Страница не найдена. Откройте полную ссылку из окна запуска BioHack.');
 });
 server.on('upgrade',(req,socket,head)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const room=path.startsWith(prefix+'sync/')?path.slice((prefix+'sync/').length):'';
  if(!/^biohack-[a-f0-9-]{36}$/.test(room)||wss.clients.size>=32){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  const name=token+'/'+room,role=new URL(req.url,'http://localhost').searchParams.get('role')==='host'?'host':'guest',roomDoc=docs.get(name),roomPeers=[...(roomDoc?.conns.keys()||[])];
  if(roomPeers.length>=11||role==='guest'&&roomPeers.filter(ws=>ws.biohackRole==='guest').length>=10){socket.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');return;}
  wss.handleUpgrade(req,socket,head,ws=>{ws.biohackRole=role;setupWSConnection(ws,req,{docName:name});ws.on('close',()=>{setTimeout(()=>{const doc=docs.get(name);if(doc&&doc.conns.size===0){doc.destroy();docs.delete(name);}},60000).unref();});});
 });
 return {server,prefix,wss,async close(){const closed=[...wss.clients].map(ws=>new Promise(resolve=>{ws.once('close',resolve);ws.terminate();}));await Promise.all(closed);await new Promise(resolve=>server.close(resolve));wss.close();for(const [name,doc] of docs){if(name.startsWith(token+'/')){doc.destroy();docs.delete(name);}}}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const instance=createBiohackServer();
 const port=Number(process.env.PORT||10000);
 instance.server.on('error',error=>{console.error('BioHack server failed:',error.message);process.exit(1);});
 instance.server.listen(port,'0.0.0.0',()=>console.log('BioHack listening on port '+instance.server.address().port));
 let stopping=false;
 const shutdown=()=>{if(stopping)return;stopping=true;instance.close().finally(()=>process.exit(0));setTimeout(()=>process.exit(1),25000).unref();};
 process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}
