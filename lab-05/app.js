'use strict';
const $ = id => document.getElementById(id);
const form = document.querySelector('form');
const options = ['N','pc','pm','G','seed'];
let current, comparison=[];
function table(head,rows) {
  return '<table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(r=>'<tr>'+r.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
}
function graph(runs) {
  const colors=['#007568','#175da0','#a04720','#713a98'];
  const latest=Math.max(...runs.map(r=>r.history.length));
  const position=(g,v)=>(45+(g-1)*551/(latest-1))+','+(193-v*155);
  const lines=runs.map((r,i)=>'<polyline fill="none" stroke="'+colors[i]+'" stroke-width="2.2" points="'+r.history.map(g=>position(g.generation,g.max)).join(' ')+'"/>');
  const grid=[0,.25,.5,.75,1].map(v=>'<line x1="45" y1="'+(193-v*155)+'" x2="596" y2="'+(193-v*155)+'" stroke="#d6e5e6"/><text x="12" y="'+(197-v*155)+'">'+v+'</text>');
  return '<svg viewBox="0 0 620 225" role="img" aria-label="Максимальный fitness по поколениям">'+grid.join('')+
    '<text x="6" y="18">fitness</text><text x="45" y="212">1</text><text x="559" y="212">'+latest+'</text><text x="290" y="214">Поколение</text>'+lines.join('')+'</svg>'+
    runs.map((r,i)=>'<span style="color:'+colors[i]+';margin-right:1em">'+(presets[i]?.name||'Запуск')+'</span>').join('');
}
function showGeneration(){
  const entry=current.history[Number($('generation').value)];
  $('population').innerHTML=table(['№','Хромосома','b','x','f(x)'],
    entry.people.map((p,i)=>[i+1,p.binary,p.gene,fixed(p.x),fixed(p.fitness)]));
  $('log').textContent=describe(entry);
}
function render(run) {
  current=run;
  const {best,history}=run;
  $('best').textContent='Хромосома '+best.binary+' · x* = '+fixed(best.x)+' · f(x*) = '+fixed(best.fitness)+' · поколение '+best.generation;
  $('plot').innerHTML=graph([run]).replace('Базовый','Текущий запуск');
  $('stats').innerHTML=table(['Поколение','Лучшая хромосома','x','Минимум','Среднее','Максимум'],
    history.map(e=>[e.generation,e.winner.binary,fixed(e.winner.x),fixed(e.min),fixed(e.avg),fixed(e.max)]));
  $('generation').replaceChildren(...history.map((entry,i)=>new Option('Поколение '+entry.generation,i)));
  showGeneration();
}
function compare() {
  comparison=presets.map(simulate);
  $('comparison').hidden=false;
  $('summary').innerHTML=table(['Эксперимент','N','pc','pm','G','Хромосома','x*','f(x*)','Поколение'],
    presets.map((p,i)=>{const b=comparison[i].best;return [p.name,p.N,p.pc,p.pm,p.G,b.binary,fixed(b.x),fixed(b.fitness),b.generation]}));
  $('curves').innerHTML=graph(comparison);
  $('choice').replaceChildren(...presets.map((p,i)=>new Option(p.name,i)));
  render(comparison[0]);
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  try {
    const params=Object.fromEntries(options.map(k=>{
      const val=form.elements[k].value.trim().replace(',','.');
      return [k,/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(val)?Number(val):NaN];
    }));
    render(simulate(params));
    $('error').hidden=true;
  } catch(error) {
    $('error').textContent=error.message;
    $('error').hidden=false;
  }
});
$('generation').addEventListener('change',showGeneration);
$('choice').addEventListener('change',()=>render(comparison[Number($('choice').value)]));
$('experiments').addEventListener('click',()=>{$('error').hidden=true;compare()});
$('download').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([current.history.map(describe).join('\n\n')],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;link.download='lab05-log.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render(simulate(presets[0]));
