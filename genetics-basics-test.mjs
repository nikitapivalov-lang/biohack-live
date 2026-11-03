import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
const script=html.match(/<script id="genetics-basics-module">([\s\S]*?)<\/script>/)[1];
function setup(saved){
 const dom=new JSDOM('<main><section id="tab-genetics"></section></main>',{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 if(saved)w.localStorage.setItem('biohack-genetics-basics-v1',JSON.stringify(saved));
 w.eval(`var biologyDirectory=[{id:'heredity',topics:[['Генетический детектив','genetics']]}],moduleCategory={};window.__course=biologyDirectory;window.__routes=moduleCategory;function openLessonScreen(id,key){window.__lastScreen=[id,key];}function lessonScreenRegister(id,definitions){window.__screens=definitions;const root=document.getElementById('tab-'+id);for(const [key,label,nodes] of definitions){const box=document.createElement('div');box.dataset.lessonScreen=key;box.append(...nodes);root.append(box);}}`);
 w.eval(script);return {dom,w,d:w.document};
}
test('catalogue keeps seven topics and merges chromosome foundations into heredity',()=>{
 const {w,d,dom}=setup();assert.equal(w.__course[0].topics[0][1],'genetics-basics');assert.equal(w.__course[0].topics[1][1],'genetics');assert.equal(w.__routes['genetics-basics'],'heredity');assert.equal(w.__screens.length,8);
 assert.match(d.querySelector('#tab-genetics-basics').textContent,/чистая линия|Чистая линия/);assert.equal(d.querySelector('[data-lesson-screen="chromosomes"]'),null);assert.equal(d.querySelectorAll('.gb-human-family').length,1);assert.match(d.querySelector('[data-lesson-screen="main"] .gb-chromosome-foundation').textContent,/Гомологичные хромосомы/);assert.match(d.querySelector('[data-lesson-screen="main"] .gb-chromosome-foundation').textContent,/Сестринские хроматиды/);d.querySelector('[data-lesson-screen="main"] .gb-next button').click();assert.deepEqual(Array.from(w.__lastScreen),['genetics-basics','gene']);d.querySelector('[data-lesson-screen="gametes"] .gb-next button:last-child').click();assert.deepEqual(Array.from(w.__lastScreen),['genetics-basics','practice']);assert(html.includes("if(location.hash==='#lesson/genetics-basics/chromosomes')history.replaceState"));dom.window.close();
});
test('all nine genotype combinations yield complete gametes and expected equal fractions',()=>{
 const {d,dom,w}=setup();for(const a of ['AA','Aa','aa'])for(const b of ['BB','Bb','bb']){d.querySelector('#gb-gene-a').value=a;d.querySelector('#gb-gene-b').value=b;d.querySelector('#gb-gene-a').dispatchEvent(new w.Event('change'));const expected=[...new Set(a)].flatMap(x=>[...new Set(b)].map(y=>x+y));const cards=[...d.querySelectorAll('.gb-gamete')];assert.equal(cards.length,expected.length);cards.forEach((card,i)=>{assert.equal(card.firstChild.textContent,expected[i]);assert.equal(card.querySelector('small').textContent,100/expected.length+'%');assert.equal(card.firstChild.textContent.length,2);});}dom.window.close();
});
test('genotype model distinguishes heterozygotes, homozygotes and recessive phenotype',()=>{
 const {d,dom}=setup();for(const [g,expected] of [['AA','Гомозигота'],['Aa','Гетерозигота'],['aa','Гомозигота']]){d.querySelector(`[data-gb-genotype="${g}"]`).click();const result=d.querySelector('#gb-genotype-result').textContent;assert.match(result,new RegExp(expected));assert.match(result,new RegExp(g==='aa'?'Зелёные':'Жёлтые'));assert.equal(d.querySelectorAll('[data-gb-genotype][aria-pressed="true"]').length,1);}dom.window.close();
});
test('quiz allows correction, persists answers and resets progress',()=>{
 const {d,w,dom}=setup();const options=d.querySelector('.gb-question-options');options.children[1].click();assert.match(d.querySelector('#gb-score').textContent,/0 \/ 10/);assert.match(d.querySelector('.gb-feedback').textContent,/Пока неверно/);options.children[0].click();assert.match(d.querySelector('#gb-score').textContent,/1 \/ 10/);assert.equal(JSON.parse(w.localStorage.getItem('biohack-genetics-basics-v1')).answers[0],0);const reopened=setup(JSON.parse(w.localStorage.getItem('biohack-genetics-basics-v1')));assert.match(reopened.d.querySelector('#gb-score').textContent,/1 \/ 10/);[...d.querySelectorAll('button')].find(b=>b.textContent==='Сбросить ответы').click();assert.match(d.querySelector('#gb-score').textContent,/0 \/ 10/);assert.equal(d.querySelector('.gb-feedback').textContent,'');reopened.dom.window.close();dom.window.close();
});
test('simplified family model agrees with the blue-eyed daughter and labels its assumptions',()=>{
 const {d,dom}=setup();for(const key of ['main']){const family=d.querySelector(`[data-gb-human="${key}"]`);assert.deepEqual([...family.querySelectorAll('.gb-family-genotype')].map(e=>e.textContent),['Aa','aa','aa']);assert.match(family.textContent,/упрощённая модель|упрощённая|Условие учебной задачи/i);assert.match(family.textContent,/нескольких генов/);assert.match(family.querySelector('img').src,/genetics-family-selected.png$/);}
 const cross=d.querySelector('[data-gb-visual="main"]');assert.deepEqual([...cross.querySelectorAll('.gb-visual-badge')].map(e=>e.textContent),['Aa','aa','aa']);const child=cross.querySelectorAll('svg')[1];assert.deepEqual([...child.querySelectorAll('text')].map(e=>e.textContent),['a','a']);assert.match(cross.textContent,/по 50%/);dom.window.close();
});
