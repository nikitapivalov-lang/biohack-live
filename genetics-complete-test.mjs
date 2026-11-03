import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
const script=html.match(/<script id="genetics-complete-module">([\s\S]*?)<\/script>/)[1];
function setup(saved){
 const dom=new JSDOM('<main><section id="tab-allelic"><div data-lesson-screen="practice"></div></section></main>',{url:'https://biohack.test/',runScripts:'outside-only'}),w=dom.window;
 if(saved)for(const [key,v]of Object.entries(saved))w.localStorage.setItem(key,JSON.stringify(v));
 w.eval(`var biologyDirectory=[{id:'heredity',topics:[['Основы генетики','genetics-basics'],['Законы Менделя','mendel'],['Взаимодействие аллельных генов','allelic'],['Сцепленное наследование'],['Генетика пола'],['Родословные'],['Мутации и модификации'],['Селекция и биотехнология']]}],moduleCategory={};window.course=biologyDirectory;window.routes=moduleCategory;window.screens={};function openLessonScreen(id,key){window.lastScreen=[id,key];}function lessonScreenRegister(id,defs){window.screens[id]=defs;for(const [key,label,nodes] of defs){const box=document.createElement('div');box.dataset.lessonScreen=key;box.append(...nodes);document.getElementById('tab-'+id).append(box);}}`);
 w.eval(script);return {dom,w,d:w.document};
}
const ids=['nonallelic','linkage','sex-genetics','pedigrees','variation','breeding','population-genetics'];
test('all genetics topics are available; every screen has onward navigation and no duplicate IDs',()=>{
 const {dom,w,d}=setup();assert.equal(w.course[0].topics.length,10);assert(w.course[0].topics.every(t=>t[1]));assert.equal(Object.keys(w.screens).length,7);
 const all=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(all.length,new Set(all).size);
 for(const id of ids){assert.equal(w.routes[id],'heredity');const root=d.getElementById('tab-'+id);assert(!/undefined|NaN/.test(root.textContent));assert.equal(root.querySelectorAll('.gc-question').length,6);assert(root.querySelector('details summary'));for(const [key] of w.screens[id]){if(key==='practice')continue;const buttons=[...root.querySelectorAll(`[data-lesson-screen="${key}"] .gc-next button`)];assert(buttons.length);buttons.at(-1).click();assert.equal(w.lastScreen[0],id);}}
 d.querySelector('#tab-allelic button').click();assert.deepEqual(Array.from(w.lastScreen),['nonallelic','main']);dom.window.close();
});
test('linkage calculator conserves probabilities for every integer r from 0 through 50 and both phases',()=>{
 const {dom,w,d}=setup(),range=d.getElementById('gc-r'),phase=d.getElementById('gc-phase');
 for(const mode of ['cis','trans'])for(let r=0;r<=50;r++){phase.value=mode;range.value=r;range.dispatchEvent(new w.Event('input'));const values=Object.fromEntries([...d.querySelectorAll('[data-gc-gamete]')].map(e=>[e.dataset.gcGamete,Number(e.dataset.probability)]));assert(Math.abs(Object.values(values).reduce((a,b)=>a+b,0)-1)<1e-12);const parents=mode==='cis'?['AB','ab']:['Ab','aB'];for(const [g,p]of Object.entries(values))assert(Math.abs(p-(parents.includes(g)?(1-r/100)/2:r/200))<1e-12);}
 dom.window.close();
});
test('six X-linked crosses return correct all-child and sex-conditional probabilities',()=>{
 const {dom,w,d}=setup(),expected={AA:{A:[0,0,0],a:[0,0,0]},Aa:{A:[.25,.5,0],a:[.5,.5,.5]},aa:{A:[.5,1,0],a:[1,1,1]}};
 for(const mother of ['AA','Aa','aa'])for(const father of ['A','a']){d.getElementById('gc-xmother').value=mother;d.getElementById('gc-xfather').value=father;d.getElementById('gc-xfather').dispatchEvent(new w.Event('change'));const e=d.querySelector('[data-gc-x-all]');assert.deepEqual([+e.dataset.gcXAll,+e.dataset.gcXSons,+e.dataset.gcXDaughters],expected[mother][father]);}
 dom.window.close();
});
test('Hardy-Weinberg calculator covers boundary cases and all frequencies with allele conservation',()=>{
 const {dom,w,d}=setup(),range=d.getElementById('gc-q');
 for(let n=0;n<=100;n++){range.value=n;range.dispatchEvent(new w.Event('input'));const values=[...d.querySelectorAll('[data-gc-hw]')].map(e=>+e.dataset.probability),q=n/100;assert(Math.abs(values.reduce((a,b)=>a+b,0)-1)<1e-12);assert(Math.abs(values[2]+values[1]/2-q)<1e-12);}
 dom.window.close();
});
test('interaction classes always total sixteen; all four expected ratios are shown',()=>{
 const {dom,w,d}=setup(),select=d.getElementById('gc-model');
 for(const [mode,ratio]of [['complement','9 : 7'],['recessive','9 : 3 : 4'],['dominant','12 : 3 : 1'],['additive','1 : 4 : 6 : 4 : 1']]){select.value=mode;select.dispatchEvent(new w.Event('change'));assert(d.getElementById('gc-model-result').textContent.includes(ratio));const fractions=[...d.querySelectorAll('#gc-model-result tbody tr')].map(tr=>parseInt(tr.cells[1].textContent));assert.equal(fractions.reduce((a,b)=>a+b,0),16);}
 dom.window.close();
});
test('all forty-two quiz answers support correction, persistence and isolated reset',()=>{
 const {dom,w,d}=setup(),correct=[[1,0,1,0,1,1],[1,0,1,1,1,1],[1,1,0,1,1,1],[1,1,0,1,1,0],[1,1,0,1,1,1],[0,1,0,0,0,0],[1,1,1,1,0,1]];
 ids.forEach((id,j)=>{const root=d.getElementById('tab-'+id),qs=[...root.querySelectorAll('.gc-question')];qs[0].querySelectorAll('button')[(correct[j][0]+1)%3].click();assert.match(root.querySelector('.gc-feedback').textContent,/Пока неверно/);qs.forEach((q,i)=>q.querySelectorAll('button')[correct[j][i]].click());assert.match(d.getElementById('gc-score-'+id).textContent,/6 \/ 6/);});
 const saved=Object.fromEntries(ids.map(id=>['biohack-genetics-'+id+'-v1',JSON.parse(w.localStorage.getItem('biohack-genetics-'+id+'-v1'))])),again=setup(saved);ids.forEach(id=>assert.match(again.d.getElementById('gc-score-'+id).textContent,/6 \/ 6/));
 [...d.querySelectorAll('#tab-linkage button')].find(b=>b.textContent==='Сбросить ответы').click();assert.match(d.getElementById('gc-score-linkage').textContent,/0 \/ 6/);assert.match(d.getElementById('gc-score-pedigrees').textContent,/6 \/ 6/);again.dom.window.close();dom.window.close();
});
test('malformed saved answers do not break initialization or display NaN scores',()=>{
 const {dom,d}=setup({'biohack-genetics-linkage-v1':{corrupt:true},'biohack-genetics-variation-v1':[999,-1,null,'a',{},1]});assert.match(d.getElementById('gc-score-linkage').textContent,/0 \/ 6/);assert(!d.body.textContent.includes('NaN'));dom.window.close();
});

test('lesson 04 biochemical pathway handles all nine genotype pairs and distinguishes a missing substrate',()=>{
 const {dom,w,d}=setup(),a=d.getElementById('na-gene-a'),b=d.getElementById('na-gene-b');
 for(const ga of ['AA','Aa','aa'])for(const gb of ['BB','Bb','bb']){a.value=ga;b.value=gb;b.dispatchEvent(new w.Event('change'));const out=d.getElementById('na-path-result');assert.equal(out.dataset.firstStep,String(ga!=='aa'));assert.equal(out.dataset.secondFunction,String(gb!=='bb'));assert.equal(out.dataset.pigment,String(ga!=='aa'&&gb!=='bb'));assert.match(out.textContent,new RegExp(ga+gb));assert(!out.innerHTML.includes('undefined'));}
 a.value='aa';b.value='BB';a.dispatchEvent(new w.Event('change'));assert.match(d.getElementById('na-path-result').textContent,/Фермент есть, но нет субстрата/);assert.match(d.getElementById('na-path-result').textContent,/белый цветок/);dom.window.close();
});
test('lesson 04 Punnett grid has correct canonical genotypes and every selected cell reports aggregate probabilities',()=>{
 const {dom,w,d}=setup(),select=d.getElementById('gc-model');
 const genotypes=['AABB','AABb','AaBB','AaBb','AABb','AAbb','AaBb','Aabb','AaBB','AaBb','aaBB','aaBb','AaBb','Aabb','aaBb','aabb'];
 const expected={complement:['colored','colored','colored','colored','colored','white','colored','white','colored','colored','white','white','colored','white','white','white'],recessive:['first','first','first','first','first','second','first','second','first','first','none','none','first','second','none','none'],dominant:['blocked','blocked','blocked','blocked','blocked','blocked','blocked','blocked','blocked','blocked','yellow','yellow','blocked','blocked','yellow','green'],additive:['4','3','3','2','3','2','2','1','3','2','2','1','2','1','1','0']};
 for(const mode of Object.keys(expected)){select.value=mode;select.dispatchEvent(new w.Event('change'));const cells=[...d.querySelectorAll('#na-punnett [data-na-cell]')];assert.equal(cells.length,16);assert.deepEqual(cells.map(b=>b.dataset.genotype),genotypes);assert.deepEqual(cells.map(b=>b.dataset.phenotype),expected[mode]);
  cells.forEach((cell,i)=>{cell.click();const out=d.getElementById('na-selected');assert.equal(out.dataset.genotype,genotypes[i]);assert.equal(+out.dataset.genotypeCount,genotypes.filter(g=>g===genotypes[i]).length);assert.equal(+out.dataset.phenotypeCount,expected[mode].filter(k=>k===expected[mode][i]).length);assert.equal(d.querySelectorAll('#na-punnett [aria-pressed=true]').length,1);assert.match(out.textContent,/1\/16 = 6,25%/);assert(cell.getAttribute('aria-label').includes(genotypes[i]));});}
 dom.window.close();
});
test('lesson 04 diagrams, Campbell example and worked problems remain available through lesson routes',()=>{
 const {dom,w,d}=setup(),root=d.getElementById('tab-nonallelic');assert.deepEqual(Array.from(w.screens.nonallelic,s=>s[0]),['main','complement','epistasis','polygenic','problems','lab','practice']);
 assert.equal(root.querySelectorAll('.na-dog').length,3);assert.match(root.querySelector('[data-lesson-screen="epistasis"]').textContent,/другой тип меланина/);assert.match(root.querySelector('[data-lesson-screen="epistasis"]').textContent,/9 : 3 : 4/);
 assert.equal(root.querySelectorAll('.na-dose-column').length,5);assert.deepEqual([...root.querySelectorAll('.na-dose-column>strong')].map(e=>e.textContent),['1/16','4/16','6/16','4/16','1/16']);
 assert.match(root.querySelector('[data-lesson-screen="polygenic"]').textContent,/нельзя автоматически приписывать этой модели полное доминирование/);
 assert.match(root.querySelector('[data-lesson-screen="problems"]').textContent,/1 : 1 : 2/);assert.match(root.querySelector('details.gc-card').textContent,/Campbell Biology/);
 for(const svg of root.querySelectorAll('svg'))assert(svg.getAttribute('aria-label')&&!svg.getAttribute('aria-label').includes('undefined'));dom.window.close();
});
