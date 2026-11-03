import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
const script=html.match(/<script id="allelic-lesson-module">([\s\S]*?)<\/script>/)[1];
function setup(saved){
 const dom=new JSDOM('<head><style id="genetics-basics-styles"></style></head><main><section id="tab-mendel"></section></main>',{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 if(saved)w.localStorage.setItem('biohack-allelic-v1',JSON.stringify(saved));
 w.eval(`var biologyDirectory=[{id:'heredity',topics:[['Основы генетики','genetics-basics'],['Законы Менделя','mendel'],['Взаимодействие генов']]}],moduleCategory={};window.course=biologyDirectory;window.routes=moduleCategory;function openLessonScreen(id,key){window.lastScreen=[id,key];}function lessonScreenRegister(id,defs){window.screens=defs;for(const [key,label,nodes] of defs){const box=document.createElement('div');box.dataset.lessonScreen=key;box.append(...nodes);document.getElementById('tab-'+id).append(box);}}`);
 w.eval(script);return {dom,w,d:w.document};
}
test('lesson registers in genetics after Mendel with seven screens and working onward navigation',()=>{
 const {dom,w,d}=setup();assert.equal(w.screens.length,7);assert.equal(w.course[0].topics[2][1],'allelic');assert.equal(w.routes.allelic,'heredity');
 d.querySelector('[data-lesson-screen="abo"] .gb-next button:last-child').click();assert.deepEqual(Array.from(w.lastScreen),['allelic','practice']);
 assert.match(d.querySelector('[data-lesson-screen="codominance"]').textContent,/не промежуточный/);dom.window.close();
});
test('all 36 ABO crosses match independent expected group probabilities',()=>{
 const {dom,w,d}=setup(),keys=['OO','AA','AO','BB','BO','AB'];
 // Ordered probabilities: O, A, B, AB. Rows/columns use the six genotypes above.
 const expected=[
 [[100,0,0,0],[0,100,0,0],[50,50,0,0],[0,0,100,0],[50,0,50,0],[0,50,50,0]],
 [[0,100,0,0],[0,100,0,0],[0,100,0,0],[0,0,0,100],[0,50,0,50],[0,50,0,50]],
 [[50,50,0,0],[0,100,0,0],[25,75,0,0],[0,0,50,50],[25,25,25,25],[0,50,25,25]],
 [[0,0,100,0],[0,0,0,100],[0,0,50,50],[0,0,100,0],[0,0,100,0],[0,0,50,50]],
 [[50,0,50,0],[0,50,0,50],[25,25,25,25],[0,0,100,0],[25,0,75,0],[0,25,50,25]],
 [[0,50,50,0],[0,50,0,50],[0,50,25,25],[0,0,50,50],[0,25,50,25],[0,25,25,50]]
 ];
 keys.forEach((a,i)=>keys.forEach((b,j)=>{d.querySelector('#al-parent-a').value=a;d.querySelector('#al-parent-b').value=b;d.querySelector('#al-parent-b').dispatchEvent(new w.Event('change'));const actual=[...d.querySelectorAll('[data-al-probability]')].map(e=>Number(e.dataset.value));assert.deepEqual(actual,expected[i][j],a+' × '+b);assert.equal(actual.reduce((a,b)=>a+b,0),100);for(const btn of d.querySelectorAll('[data-al-child]')){btn.click();assert.match(d.querySelector('#al-selected').textContent,/Вероятность выбранного сочетания/);assert.equal(d.querySelectorAll('#al-grid [aria-pressed=true]').length,1);}}));
 dom.window.close();
});
test('comparison updates all three phenotypes and marks selected genotype',()=>{
 const {dom,d}=setup();assert.match(d.querySelector('#al-compare').textContent,/Розовые/);assert.match(d.querySelector('#al-compare').textContent,/Антигены A и B/);
 d.querySelector('[data-al-genotype="aa"]').click();assert.match(d.querySelector('#al-compare').textContent,/Зелёные/);assert.match(d.querySelector('#al-compare').textContent,/Белые/);assert.match(d.querySelector('#al-compare').textContent,/Антиген B/);assert.equal(d.querySelector('[data-al-genotype="aa"]').getAttribute('aria-pressed'),'true');dom.window.close();
});
test('AB self-cross distinguishes repeated genotype from single gamete combination',()=>{
 const {dom,w,d}=setup();for(const id of ['al-parent-a','al-parent-b'])d.getElementById(id).value='AB';d.querySelector('#al-parent-a').dispatchEvent(new w.Event('change'));d.querySelector('[data-al-child="AB"]').click();assert.match(d.querySelector('#al-selected').textContent,/сочетания гамет — 25%; этого генотипа в целом — 50%/);dom.window.close();
});
test('quiz supports correction, all answers, persistence and independent reset',()=>{
 const {dom,w,d}=setup(),correct=[0,1,2,1,1,2,0,1];d.querySelector('.al-question .gb-question-options').children[2].click();assert.match(d.querySelector('#al-score').textContent,/0 \/ 8/);
 correct.forEach((answer,i)=>d.querySelectorAll('.al-question')[i].querySelectorAll('button')[answer].click());assert.match(d.querySelector('#al-score').textContent,/8 \/ 8/);
 const saved=JSON.parse(w.localStorage.getItem('biohack-allelic-v1')),again=setup(saved);assert.match(again.d.querySelector('#al-score').textContent,/8 \/ 8/);assert.equal(w.localStorage.getItem('biohack-mendel-v1'),null);
 [...d.querySelectorAll('button')].find(b=>b.textContent==='Сбросить ответы').click();assert.match(d.querySelector('#al-score').textContent,/0 \/ 8/);assert.equal(d.querySelector('.al-question [role=status]').textContent,'');again.dom.window.close();dom.window.close();
});

// Regression: every illustration must display its actual genotype, never a missing lookup.
test('genotype labels render in every topic and incomplete dominance uses AA, Aa, aa',()=>{
 const {dom,d}=setup();
 assert(!d.querySelector('#tab-allelic').textContent.includes('undefined'));
 for(const key of ['complete','incomplete'])assert.deepEqual([...d.querySelectorAll(`[data-lesson-screen="${key}"] .al-tile .al-symbol`)].map(e=>e.textContent),['AA','Aa','aa']);
 assert.deepEqual([...d.querySelectorAll('[data-lesson-screen="codominance"] .al-tile .al-symbol')].map(e=>e.textContent),['IᴬIᴬ','IᴬIᴮ','IᴮIᴮ']);
 assert.match(d.querySelector('[data-lesson-screen="complete"]').textContent,/A — доминантный аллель/);
 assert.match(d.querySelector('[data-lesson-screen="incomplete"]').textContent,/AA — красные цветки, Aa — розовые, aa — белые/);
 for(const g of ['AA','Aa','aa']){d.querySelector(`[data-al-genotype="${g}"]`).click();assert.deepEqual([...d.querySelectorAll('#al-compare .al-symbol')].map(e=>e.textContent),[g,g,({AA:'IᴬIᴬ',Aa:'IᴬIᴮ',aa:'IᴮIᴮ'})[g]]);}
 dom.window.close();
});

test('codominance highlights contributions without changing AB genotype or removing either antigen',()=>{
 const {dom,d}=setup();
 for(const view of ['A','B','AB']){
  d.querySelector(`[data-co-view="${view}"]`).click();
  assert.match(d.querySelector('.co-fixed-genotype').textContent,/IᴬIᴮ.*AB/);
  const marks=[...d.querySelectorAll('#co-cell [data-antigen]')];
  assert.equal(marks.filter(m=>m.dataset.antigen==='A').length,4);
  assert.equal(marks.filter(m=>m.dataset.antigen==='B').length,4);
  for(const mark of marks)assert.equal(mark.style.opacity,view==='AB'||mark.dataset.antigen===view?'1':'0.12');
  assert.equal(d.querySelectorAll('[data-co-view][aria-pressed="true"]').length,1);
 }
 assert.equal(d.querySelectorAll('[data-lesson-screen="codominance"] .co-section').length,5);
 const ids=[...d.querySelectorAll('.co-rbc [id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
 assert.match(d.querySelector('.co-cross').textContent,/IᴬIᴬ/);
 assert.equal(d.querySelectorAll('.co-cross tbody td').length,4);
 dom.window.close();
});

test('codominance question explains both misconceptions and allows correction',()=>{
 const {dom,d}=setup(),feedback=d.querySelector('#co-feedback');
 d.querySelector('[data-co-answer="mixed"]').click();assert.match(feedback.textContent,/Промежуточный антиген не образуется/);
 d.querySelector('[data-co-answer="separate"]').click();assert.match(feedback.textContent,/на одном эритроците/);
 d.querySelector('[data-co-answer="both"]').click();assert.match(feedback.textContent,/Верно/);
 assert.equal(d.querySelectorAll('[data-co-answer][aria-pressed="true"]').length,1);
 assert.equal(d.querySelector('#al-score').textContent,'Верно: 0 / 8');
 dom.window.close();
});
