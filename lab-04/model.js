'use strict';

const terms = {
  demand: {low:[0,0,25,50], mid:[25,50,50,75], high:[50,75,100,100]},
  supply: {low:[0,0,25,50], mid:[25,50,50,75], high:[50,75,100,100]},
  inflation: {low:[0,0,4,10], high:[4,10,20,20]},
  output: {fall:[-20,-20,-12,-2], flat:[-6,0,0,6], rise:[2,12,20,20]},
};
const limits = {demand:[0,100], supply:[0,100], inflation:[0,20], output:[-20,20]};
const labels = {low:'Низкий уровень', mid:'Средний уровень', high:'Высокий уровень', fall:'Снижение', flat:'Стабильность', rise:'Рост'};
const and = (...items) => ({op:'AND', items});
const or = (...items) => ({op:'OR', items});
const rules = [
  [and('demand.low','supply.low'),'flat','Низкий спрос И низкое предложение'],
  [and('demand.low','supply.mid'),'flat','Низкий спрос И нормальное предложение'],
  [and('demand.low','supply.high'),'fall','Низкий спрос И высокое предложение'],
  [and('demand.mid','supply.mid'),'flat','Средний спрос И нормальное предложение'],
  [and('demand.mid','supply.high'),'fall','Средний спрос И высокое предложение'],
  [and('demand.high','supply.mid'),'rise','Высокий спрос И нормальное предложение',0.55],
  [and('demand.high','supply.high'),'flat','Высокий спрос И высокое предложение'],
  [and(or('demand.mid','demand.high'),'supply.low'),'rise','(Средний ИЛИ высокий спрос) И низкое предложение'],
  ['inflation.high','rise','Высокая инфляция'],
  [and('demand.high','supply.mid'),'flat','Высокий спрос И нормальное предложение: стабильная составляющая',0.75],
];
function membership(x,[a,b,c,d]) {
  if (x<a || x>d) return 0;
  if (x>=b && x<=c) return 1;
  return x<b ? (x-a)/(b-a) : (d-x)/(d-c);
}
function activation(clause, degrees) {
  if (typeof clause==='string') {
    const [key,term]=clause.split('.');
    return degrees[key][term];
  }
  const values=clause.items.map(item=>activation(item,degrees));
  return clause.op==='AND' ? Math.min(...values) : Math.max(...values);
}
function infer(input) {
  const degrees={};
  for (const key of ['demand','supply','inflation']) {
    const value=input[key];
    const [min,max]=limits[key];
    if (!Number.isFinite(value)||value<min||value>max)
      throw new RangeError('Допустимый диапазон для '+key+': '+min+'-'+max);
    degrees[key]=Object.fromEntries(Object.entries(terms[key]).map(([name,shape])=>[name,membership(value,shape)]));
  }
  const strengths={fall:0,flat:0,rise:0};
  const active=rules.map(([condition,term,description,weight=1])=>{
    const strength=Math.min(activation(condition,degrees),weight);
    strengths[term]=Math.max(strengths[term],strength);
    return {term,description,strength,weight};
  });
  const aggregated=x=>Math.max(...Object.entries(terms.output).map(([name,shape])=>Math.min(strengths[name],membership(x,shape))));
  let area=0,moment=0;
  const left=limits.output[0], dx=.05, count=800;
  for(let i=0;i<=count;i++){
    const x=left+i*dx;
    const y=aggregated(x)*(i===0||i===count?.5:1);
    area+=y; moment+=x*y;
  }
  if(area<=0)throw new Error('Ни одно правило не активировано');
  const value=moment/area;
  const category=value < -2 ? 'fall' : value > 2 ? 'rise' : 'flat';
  return {value,category,degrees,active,aggregated};
}
const scenarios = [
  {name:'Избыток предложения',demand:15,supply:85,inflation:3},
  {name:'Равновесие',demand:50,supply:50,inflation:4},
  {name:'Дефицит предложения',demand:90,supply:15,inflation:3},
  {name:'Инфляционное давление',demand:50,supply:50,inflation:12},
  {name:'Умеренный рост',demand:90,supply:50,inflation:3},
];
if (typeof module!=='undefined') module.exports={terms,limits,labels,rules,membership,infer,scenarios};
