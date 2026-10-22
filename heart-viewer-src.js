// BioHack viewer. Three.js r180 (MIT); model attribution lives below the lesson.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createHeartViewer(container,{onProgress=()=>{},onReady=()=>{},onError=()=>{},onRender=()=>{}}={}){
 let disposed=false,model=null,env=null,environment=null,pmrem=null,renderer=null,controls=null,observer=null;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,100);
 const materials=new Set(),textures=new Set(),geometries=new Set();
 function collect(object){object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});}
 function draw(){if(!disposed&&renderer){renderer.render(scene,camera);onRender();}}
 function resize(){if(disposed||!renderer)return;const {width,height}=container.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);draw();}
 function distance(){return 1.15/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.min(1,camera.aspect);}
 function reset(back=false){if(!model||disposed)return;controls.target.set(0,0,0);camera.position.set(0,.04,Math.min(15,distance())*(back?-1:1));camera.up.set(0,1,0);controls.update();draw();}
 function zoom(factor){if(!model||disposed)return;const direction=camera.position.clone().sub(controls.target),length=THREE.MathUtils.clamp(direction.length()/factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(direction.setLength(length));controls.update();draw();}
 function rotate(step){if(!model||disposed)return;const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),step);camera.position.copy(controls.target).add(offset);controls.update();draw();}
 function keys(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotate(e.key==='ArrowLeft'?-.15:.15);}else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.2);}else if(e.key==='-'){e.preventDefault();zoom(1/1.2);}else if(e.key==='Home'){e.preventDefault();reset();}}
 function contextLost(e){e.preventDefault();if(!disposed)onError(new Error('Потеряно соединение с графическим ускорителем. Откройте модель заново.'));}
 function dispose(){if(disposed)return;disposed=true;observer?.disconnect();controls?.dispose();renderer?.domElement.removeEventListener('keydown',keys);renderer?.domElement.removeEventListener('webglcontextlost',contextLost);for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();env?.dispose();environment?.dispose();pmrem?.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();}
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','3D-сердце. Перетаскивайте для вращения; стрелки — поворот, плюс и минус — масштаб, Home — исходный вид.');canvas.setAttribute('role','img');canvas.tabIndex=0;canvas.addEventListener('keydown',keys);canvas.addEventListener('webglcontextlost',contextLost);container.append(canvas);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=1.3;controls.maxDistance=15;controls.enablePan=true;controls.addEventListener('change',draw);
  pmrem=new THREE.PMREMGenerator(renderer);environment=new RoomEnvironment();env=pmrem.fromScene(environment,.04);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xffffff,0x817080,1.4));const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(-3,5,6);scene.add(light);
  observer=new ResizeObserver(resize);observer.observe(container);resize();
  new GLTFLoader().load('/assets/heart.glb',gltf=>{
   collect(gltf.scene);if(disposed){for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();return;}
   model=gltf.scene;const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),extent=bounds.getSize(new THREE.Vector3()),scale=2/Math.max(extent.x,extent.y,extent.z);model.position.sub(center);const group=new THREE.Group();group.add(model);group.scale.setScalar(scale);scene.add(group);resize();reset();onReady();
  },progress=>{if(!disposed)onProgress(progress.total?Math.round(progress.loaded/progress.total*100):null);},error=>{if(!disposed){onError(error);dispose();}});
 }catch(error){dispose();queueMicrotask(()=>onError(error));}
 return {dispose,snapshot:()=>{if(disposed||!model)return null;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},reset:()=>reset(),back:()=>reset(true),zoom,rotate};
}
