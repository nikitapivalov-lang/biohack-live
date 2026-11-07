import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const script=html.match(/<script id="biosynthesis-trainer">([\s\S]*?)<\/script>/)[1];
const manifest=JSON.parse(readFileSync(new URL('./BIOSYNTHESIS-SOURCES.json',import.meta.url),'utf8'));
function setup(saved){const dom=new JSDOM('<main><section id="tab-translation"><nav></nav><div data-lesson-screen="main"></div></section><section id="tab-transcription"><div data-lesson-screen="main"></div><div id="tr-practice"></div></section></main>',{url:'https://biohack.test/',runScripts:'outside-only'}),w=dom.window;if(saved)w.localStorage.setItem('biohack-biosynthesis-v1',JSON.stringify(saved));w.eval(`var lessonScreenSets={translation:{root:document.getElementById('tab-translation'),nav:document.querySelector('nav'),screens:{main:document.querySelector('#tab-translation [data-lesson-screen]')}},transcription:{screens:{main:document.querySelector('#tab-transcription [data-lesson-screen]')}}};function openLessonScreen(id,key){window.route=[id,key];}`);w.eval(script);return {dom,w,d:w.document,api:w.BioHackBiosynthesis};}
const click=(d,text)=>{const b=[...d.querySelectorAll(['А','У','Г','Ц','Т'].includes(text)?'#bs-trainer .bs-base':'#bs-trainer button')].find(e=>e.textContent===text);assert(b,'button '+text);b.click();};
const saved=w=>JSON.parse(w.localStorage.getItem('biohack-biosynthesis-v1'));
function assembleDNA(d,m){for(const base of m.template)click(d,base);click(d,'Проверить ДНК →');}
function build(d,w,q){const m=w.BioHackBiosynthesis.model(q);if(q.chooseTemplate)click(d,`Верхняя: 5′—${q.chains[0]}—3′`);assembleDNA(d,m);for(const base of m.rna)click(d,base);click(d,'ИРНК готова →');return m;}
test('eight original FIPI conditions retain exact IDs, hashes, sequences and audited peptide keys',()=>{const {dom,api}=setup();const expected=['Мет–Тре–Ала–Тир–Иле–Гис','Мет–Сер–Арг–Иле–Иле–Вал','Мет–Арг–Асн–Асп–Вал–Сер','Мет–Гли–Сер–Гли–Сер–Арг','Мет–Гли–Сер–Тир–Иле–Ала','Мет–Асн–Тре–Асп–Лей–Сер','Мет–Ала–Арг–Ала–Иле','Мет–Сер–Ала–Глу–Лей–Сер'];assert.equal(api.tasks.length,8);api.tasks.forEach((q,i)=>{assert.equal(q.sourceTextSha256,createHash('sha256').update(manifest.tasks[i].sourceText).digest('hex'));assert.match(q.sourceUrl,/ege\.fipi\.ru/);assert.equal(api.model(q).aa.join('–'),expected[i],q.id);});assert.equal(Object.keys(api.code).length,64);for(const c of ['УАА','УАГ','УГА'])assert.equal(api.code[c],'Стоп');assert.equal(api.code.АУГ,'Мет');dom.window.close();});
test('every exercise can be solved through real controls, with explanations and saved progress',()=>{const {dom,w,d,api}=setup();api.tasks.forEach((q,i)=>{api.changeTask(i);const m=build(d,w,q);d.querySelector(`[aria-label="Начать с нуклеотида ${q.start+1}: А"]`).click();for(const aa of m.aa)click(d,aa);assert.equal(saved(w).tasks[q.id].done,true);assert.match(d.querySelector('#bs-workspace').textContent,/Полипептид собран/);click(d,'Показать разбор');assert.match(d.querySelector('#bs-solution').textContent,new RegExp(m.rna));click(d,'Скрыть разбор');assert.equal(d.querySelector('#bs-solution'),null);});assert.match(d.querySelector('#bs-trainer').textContent,/Решено 8 из 8/);const again=setup(saved(w));assert.match(again.d.querySelector('#bs-trainer').textContent,/Решено 8 из 8/);again.dom.window.close();dom.window.close();});
test('mistakes do not advance; undo and resumed assembly preserve the current nucleotide',()=>{const {dom,w,d,api}=setup();assembleDNA(d,api.model(api.tasks[0]));click(d,'Т');assert.match(d.querySelector('#bs-feedback').textContent,/Тимин/);assert.equal(saved(w).tasks['599B1C'].rna,'');click(d,'У');click(d,'А');click(d,'Отменить');assert.equal(saved(w).tasks['599B1C'].rna,'У');const again=setup(saved(w));assert.equal(saved(again.w).tasks['599B1C'].rna,'У');again.dom.window.close();const m=api.model(api.tasks[0]);for(const b of m.rna.slice(1))click(d,b);click(d,'ИРНК готова →');d.querySelector('[aria-label="Начать с нуклеотида 1: У"]').click();assert.equal(saved(w).tasks['599B1C'].step,1);d.querySelector('[aria-label="Начать с нуклеотида 3: А"]').click();click(d,'Стоп');assert.equal(saved(w).tasks['599B1C'].aa.length,0);assert.match(d.querySelector('#bs-feedback').textContent,/Стоп-кодоны/);dom.window.close();});
test('two AUGs are resolved by the length requirement; reverse template is validated',()=>{const {dom,w,d,api}=setup();api.changeTask(6);const q=api.tasks[6];build(d,w,q);d.querySelector('[aria-label="Начать с нуклеотида 4: А"]').click();assert.equal(saved(w).tasks[q.id].step,1);assert.match(d.querySelector('#bs-feedback').textContent,/только три/);d.querySelector('[aria-label="Начать с нуклеотида 8: А"]').click();assert.equal(saved(w).tasks[q.id].step,2);api.changeTask(7);const reverse=api.tasks[7];click(d,`Нижняя: 3′—${reverse.chains[1]}—5′`);assert.equal(saved(w).tasks[reverse.id].chosen,null);assert.match(d.querySelector('#bs-feedback').textContent,/нет АУГ/);assert.equal(api.model(reverse).rna,'ГАЦААУГУЦАГЦУГАГЦУГАГЦ');dom.window.close();});
test('answer draft persists; back navigation from completion can return to the answer',()=>{const {dom,w,d,api}=setup(),q=api.tasks[0],m=build(d,w,q);d.querySelector('[aria-label="Начать с нуклеотида 3: А"]').click();for(const aa of m.aa)click(d,aa);const field=d.getElementById('bs-written');field.value='Мой ответ: 5′—…—3′';field.dispatchEvent(new w.Event('input'));click(d,'← К предыдущему шагу');click(d,'К записи ответа →');assert.equal(d.getElementById('bs-written').value,'Мой ответ: 5′—…—3′');click(d,'Начать заново');assert.equal(saved(w).tasks[q.id].written,'Мой ответ: 5′—…—3′');assert.equal(saved(w).tasks[q.id].rna,'');const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size);dom.window.close();});
test('invalid saved state is reset and navigation exposes the trainer from both lessons',()=>{const {dom,w,d}=setup({current:'599B1C',tasks:{'599B1C':{step:3,rna:'bad',aa:[]}}});assert.equal(saved(w).tasks['599B1C'].step,-1);d.querySelector('#tab-translation nav button').click();assert.deepEqual(Array.from(w.route),['translation','biosynthesis']);d.querySelector('#tr-practice button').click();assert.deepEqual(Array.from(w.route),['translation','biosynthesis']);dom.window.close();});

test('DNA must be entered in the correct order before RNA becomes available', () => {
  const {dom,w,d,api}=setup();
  const task=api.tasks[0];
  const {template}=api.model(task);
  for (const base of template.slice(0,-1)) click(d,base);
  click(d,template.endsWith('А')?'Т':'А');
  click(d,'Проверить ДНК →');
  assert.equal(saved(w).tasks[task.id].step,-1);
  assert.match(d.getElementById('bs-feedback').textContent, new RegExp('№'+template.length));
  const reopened=setup(saved(w));
  click(reopened.d,'Отменить');
  click(reopened.d,template.at(-1));
  click(reopened.d,'Проверить ДНК →');
  assert.equal(saved(reopened.w).tasks[task.id].step,0);
  assert.equal(reopened.d.querySelector('#bs-workspace [aria-label="Сборка иРНК напротив матрицы"] .bs-dna').textContent,template[0]);
  reopened.dom.window.close();
  dom.window.close();
});
