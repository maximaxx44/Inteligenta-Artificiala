'use strict';

const terms = {
  demand: {low:[0,0,0,50], mid:[0,50,50,100], high:[50,100,100,100]},
  supply: {low:[0,0,0,50], mid:[0,50,50,100], high:[50,100,100,100]},
  inflation: {low:[0,0,0,10], mid:[0,10,10,20], high:[10,20,20,20]},
  output: {
    strongFall:[-16,-12,-12,-8],
    fall:[-10,-6,-6,-2],
    flat:[-4,0,0,4],
    slightRise:[0,4,4,8],
    rise:[4,8,8,12],
    strongRise:[8,12,12,16],
    veryStrongRise:[12,16,16,20],
  },
};
const limits = {demand:[0,100], supply:[0,100], inflation:[0,20], output:[-20,20]};
const labels = {
  low:'Низкий уровень', mid:'Средний уровень', high:'Высокий уровень',
  strongFall:'Сильное снижение', fall:'Снижение', flat:'Стабильность',
  slightRise:'Небольшой рост', rise:'Рост', strongRise:'Сильный рост',
  veryStrongRise:'Очень сильный рост',
};
const levels = ['low','mid','high'];
const outputTerms = Object.keys(terms.output);
const rules = levels.flatMap((demand,demandIndex)=>
  levels.flatMap((supply,supplyIndex)=>
    levels.map((inflation,inflationIndex)=>[
      {op:'AND', items:['demand.'+demand,'supply.'+supply,'inflation.'+inflation]},
      outputTerms[2+demandIndex-supplyIndex+inflationIndex],
      'Спрос: '+labels[demand]+' | Предложение: '+labels[supply]+' | Инфляция: '+labels[inflation],
    ])
  )
);
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
  return Math.min(...values);
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
  const strengths=Object.fromEntries(outputTerms.map(term=>[term,0]));
  const active=rules.map(([condition,term,description,weight=1])=>{
    const strength=Math.min(activation(condition,degrees),weight);
    strengths[term]=Math.max(strengths[term],strength);
    return {term,description,strength,weight};
  });
  const activeOutputs=Object.entries(terms.output).filter(([name])=>strengths[name]>0);
  const aggregated=x=>{
    let degree=0;
    for(const [name,shape] of activeOutputs)
      degree=Math.max(degree,Math.min(strengths[name],membership(x,shape)));
    return degree;
  };
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
