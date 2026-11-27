'use strict';
const $=id=>document.getElementById(id);
const titles={demand:'Спрос',supply:'Предложение',inflation:'Инфляция, %',output:'Изменение цены, %'};
const colors=['#1762a0','#936014','#00816e','#8250a8','#bf6019','#ae355d','#607120'];
const form=document.querySelector('form');
const fields=['demand','supply','inflation'];
for(const [i,s] of scenarios.entries())$('presets').add(new Option(s.name,i));
function chart(title, curves, xRange, yRange, marker, yMarker) {
  const [x0,x1]=xRange,[y0,y1]=yRange;
  const sx=x=>43+(x-x0)*353/(x1-x0), sy=y=>108-(y-y0)*84/(y1-y0);
  const lines=curves.map(({fn,color})=>{
    const pts=Array.from({length:101},(_,i)=>{const x=x0+(x1-x0)*i/100;return sx(x).toFixed(1)+','+sy(fn(x)).toFixed(1)});
    return '<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.2"/>';
  });
  const ticks=[0,.25,.5,.75,1].map(k=>{
    const x=x0+(x1-x0)*k;
    return '<text x="'+sx(x)+'" y="125" text-anchor="middle">'+Number(x.toFixed(2))+'</text>';
  });
  return '<div class="chart"><strong>'+title+'</strong><svg viewBox="0 0 414 132" role="img" aria-label="'+title+'"><path d="M43 24V108H396 M43 66H396 M43 24H396" stroke="#b6cbd0" fill="none"/><text x="3" y="110">'+y0+'</text><text x="3" y="29">'+y1+'</text>'+ticks.join('')+lines.join('')+'<line x1="'+sx(marker)+'" x2="'+sx(marker)+'" y1="24" y2="108" stroke="#112a34" stroke-dasharray="3 3"/>'+(yMarker===undefined?'':'<circle cx="'+sx(marker)+'" cy="'+sy(yMarker)+'" r="4" fill="#112a34"/>')+'</svg><div class="legend">'+curves.map(c=>'<span style="--key:'+c.color+'">'+c.name+'</span>').join('')+'</div></div>';
}
function heatmap(input) {
  const n=21, size=14, left=51, top=12;
  const cells=[];
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){
    const demand=col*5,supply=100-row*5;
    const value=infer({...input,demand,supply}).value;
    const color=value<0?'hsl(211 68% '+(96+value*2.8)+'%)':'hsl(20 76% '+(96-value*2.8)+'%)';
    cells.push('<rect x="'+(left+col*size)+'" y="'+(top+row*size)+'" width="14" height="14" fill="'+color+'"><title>Спрос '+demand+', предложение '+supply+': '+value.toFixed(2)+'%</title></rect>');
  }
  const cx=left+7+input.demand*2.8,cy=top+7+(100-input.supply)*2.8;
  return '<svg viewBox="0 0 365 352" role="img" aria-label="Тепловая карта изменения цены"><text x="27" y="26">100</text><text x="37" y="306">0</text><text x="51" y="323">0</text><text x="319" y="323">100</text><text x="165" y="344">Спрос</text><text transform="translate(14 203) rotate(-90)">Предложение</text>'+cells.join('')+'<circle cx="'+cx+'" cy="'+cy+'" r="5" stroke="#112a34" fill="white" stroke-width="2"/></svg><div class="legend"><span style="--key:#377dba">Снижение</span><span style="--key:#b8a893">Около 0%</span><span style="--key:#d86b34">Рост</span></div>';
}
function run() {
  const input={}, errors=[];
  for(const key of fields){
    const field=form.elements[key], raw=field.value.trim().replace(',','.');
    const value=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)?Number(raw):NaN;
    const [lo,hi]=limits[key], invalid=!Number.isFinite(value)||value<lo||value>hi;
    field.setAttribute('aria-invalid',String(invalid));
    if(invalid)errors.push(titles[key]+' - введите число от '+lo+' до '+hi);
    input[key]=value;
  }
  $('error').hidden=!errors.length;
  $('error').textContent=errors.join('. ');
  if(errors.length){
    for(const id of ['value','membership','inflation-chart','heat-label','heatmap','rules'])$(id).textContent='';
    $('interpretation').textContent='Исправьте входные данные.';
    return;
  }
  const result=infer(input);
  $('value').textContent=new Intl.NumberFormat('ru',{signDisplay:'exceptZero',minimumFractionDigits:2,maximumFractionDigits:2}).format(result.value)+' %';
  $('interpretation').textContent=labels[result.category]+' цен по оценке модели.';
  $('membership').innerHTML=[...fields,'output'].map(key=>{
    const curves=Object.entries(terms[key]).map(([term,shape],i)=>({name:labels[term],color:colors[i],fn:x=>membership(x,shape)}));
    if(key==='output')curves.push({name:'Агрегация MAX',color:'#112a34',fn:result.aggregated});
    return chart(titles[key],curves,limits[key],[0,1],key==='output'?result.value:input[key]);
  }).join('');
  $('inflation-chart').innerHTML=chart('Изменение цены, %',[{name:'Сценарии инфляции',color:colors[2],fn:inflation=>infer({...input,inflation}).value}],limits.inflation,limits.output,input.inflation,result.value);
  $('heat-label').textContent='Инфляция зафиксирована на '+input.inflation+' %. Точка показывает текущий сценарий.';
  $('heatmap').innerHTML=heatmap(input);
  $('rules').innerHTML=result.active.map((r,i)=>'<tr data-active="'+(r.strength>0)+'"><td>'+(i+1)+'</td><td>'+r.description+'</td><td>'+labels[r.term]+'</td><td>'+r.weight+'</td><td>'+r.strength.toFixed(3)+'</td></tr>').join('');
}
form.addEventListener('submit',event=>{event.preventDefault();run()});
$('presets').addEventListener('change',event=>{
  if(event.target.value==='')return;
  const scenario=scenarios[Number(event.target.value)];
  fields.forEach(key=>{form.elements[key].value=scenario[key]});
  run();
});
run();
