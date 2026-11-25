'use strict';
const LENGTH = 4;
const MAX_GENE = (1 << LENGTH) - 1;
const binary = gene => gene.toString(2).padStart(LENGTH, '0');
const decode = gene => gene / MAX_GENE;
const fitness = x => 1 - Math.abs(2 * x - 1);
const presets = [
  {name:'Базовый', N:4, pc:.8, pm:.05, G:30, seed:42},
  {name:'Редкие операции', N:4, pc:.4, pm:.01, G:30, seed:42},
  {name:'Частые операции', N:4, pc:.9, pm:.15, G:30, seed:42},
  {name:'Большая популяция', N:12, pc:.8, pm:.05, G:30, seed:42},
];
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function select(people, rng) {
  const first = Math.floor(rng() * people.length);
  const second = Math.floor(rng() * (people.length - 1));
  const other = second >= first ? second + 1 : second;
  return people[first].fitness >= people[other].fitness ? first : other;
}
function cross(a, b, cut) {
  const mask = (1 << (LENGTH - cut)) - 1;
  return [(a & ~mask) | (b & mask), (b & ~mask) | (a & mask)];
}
function mutate(gene, pm, rng) {
  const changes = [];
  for (let position = 1; position <= LENGTH; position++) {
    const mask = 1 << (LENGTH - position);
    if (rng() < pm) {
      const before = (gene & mask) ? 1 : 0;
      gene ^= mask;
      changes.push({position, before, after:1-before});
    }
  }
  return {gene, changes};
}
function individual(gene) {
  const x = decode(gene);
  return {gene, binary:binary(gene), x, fitness:fitness(x)};
}
function simulate({N, pc, pm, G, seed}) {
  if (!Number.isInteger(N) || N < 2 || N > 20) throw RangeError('Размер популяции должен быть целым от 2 до 20.');
  if (!Number.isInteger(G) || G < 30 || G > 1000) throw RangeError('Введите целое число поколений от 30 до 1000.');
  if (![pc,pm].every(p=>Number.isFinite(p)&&p>=0&&p<=1)) throw RangeError('Вероятности должны быть от 0 до 1.');
  if (!Number.isInteger(seed)||seed<0||seed>4294967295) throw RangeError('Seed должен быть целым числом от 0 до 4 294 967 295.');
  const rng=random(seed);
  let population=Array.from({length:N},()=>Math.floor(rng()*(MAX_GENE+1)));
  let best=null;
  const history=[];
  for(let generation=1;generation<=G;generation++){
    const people=population.map(individual);
    const winner=people.reduce((a,b)=>a.fitness>=b.fitness?a:b);
    if(!best||winner.fitness>best.fitness)best={...winner,generation};
    const scores=people.map(p=>p.fitness);
    const entry={generation,people,winner,min:Math.min(...scores),max:winner.fitness,
      avg:scores.reduce((a,b)=>a+b,0)/N,matings:[]};
    history.push(entry);
    if(generation===G)break;
    const next=[];
    while(next.length<N){
      const indices=[select(people,rng),select(people,rng)];
      const parents=indices.map(i=>people[i].gene);
      const cut=rng()<pc ? 1+Math.floor(rng()*(LENGTH-1)) : null;
      const offspring=cut===null?parents:cross(...parents,cut);
      const children=offspring.slice(0,N-next.length).map(gene=>{
        const child=mutate(gene,pm,rng);
        next.push(child.gene);
        return {...child,number:next.length,before:gene};
      });
      entry.matings.push({indices:indices.map(i=>i+1),parents,cut,offspring,children});
    }
    population=next;
  }
  return {best,history};
}
const fixed = x=>x.toFixed(6);
function describe(entry) {
  const lines=[ 'Поколение '+entry.generation,
    ...entry.people.map((p,i)=>'#'+(i+1)+' '+p.binary+' | b='+p.gene+' | x='+fixed(p.x)+' | fitness='+fixed(p.fitness)) ];
  for (const mating of entry.matings) {
    lines.push('Родители: '+mating.indices.map((i,j)=>'#'+i+' ('+binary(mating.parents[j])+')').join(' и '));
    lines.push('Кроссовер: '+(mating.cut===null?'нет':'да, после бита '+mating.cut)+' | потомки '+mating.offspring.map(binary).join(' и '));
    for (const child of mating.children) {
      const changes=child.changes.map(m=>'бит '+m.position+': '+m.before+' → '+m.after);
      lines.push('Потомок #'+child.number+': '+binary(child.before)+' → '+binary(child.gene)+' | мутация: '+(changes.join(', ')||'нет'));
    }
    if(mating.children.length<mating.offspring.length)lines.push('Последний потомок пропущен: популяция заполнена.');
  }
  if(!entry.matings.length)lines.push('Последнее поколение: следующее не формируется.');
  lines.push('min '+fixed(entry.min)+' | avg '+fixed(entry.avg)+' | max '+fixed(entry.max));
  return lines.join('\n');
}
if (typeof module!=='undefined') module.exports={LENGTH,MAX_GENE,binary,decode,fitness,presets,simulate,describe,cross,mutate};
