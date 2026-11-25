'use strict';
const get = id => document.getElementById(id);
const points = [[72,163],[252,163],[72,52],[252,52],[132,202],[312,202],[132,91],[312,91]];
let results = [];
for (const id of ['start','goal']) {
  for (const s of states) get(id).add(new Option(bits(s), s));
}
get('goal').value = '7';
for (const [i, label] of labels.entries()) get('strategy').add(new Option(label, i));
function graph(result) {
  const routeEdges = new Set(result.path.slice(1).map((s,i) =>
    [s, result.path[i]].sort((a,b) => a-b).join(',')));
  const edges = states.flatMap(s => neighbors(s).filter(n => n > s).map(n => {
    const [x,y] = points[s], [u,v] = points[n];
    const active = routeEdges.has([s,n].join(','));
    return '<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+
      '" stroke="'+(active?'#00766c':'#a8bec2')+'" stroke-width="'+(active?5:2)+'"/>';
  }));
  const nodes = states.map(s => {
    const [x,y] = points[s], color = result.path.includes(s) ? '#bcece4' : 'white';
    return '<circle cx="'+x+'" cy="'+y+'" r="20" fill="'+color+
      '"/><text x="'+x+'" y="'+(y+4)+'" text-anchor="middle">'+bits(s)+'</text>';
  });
  return '<svg class="cube" viewBox="0 0 385 245" role="img" aria-label="Граф восьми состояний">'+
    edges.join('')+nodes.join('')+'</svg>';
}
function show() {
  const result = results[Number(get('strategy').value)];
  get('graph').innerHTML = graph(result);
  get('route').textContent = 'Маршрут: '+result.path.map(bits).join(' → ');
  get('visit').textContent = 'Порядок посещения: '+result.visited.map(bits).join(' → ');
}
function run() {
  results = compare(Number(get('start').value), Number(get('goal').value));
  const rows = results.map(r => '<tr>'+[r.label,r.moves,r.visited.length,r.peak,r.microseconds.toFixed(2),
    r.path.map(bits).join(' → ')].map(value => '<td>'+value+'</td>').join('')+'</tr>');
  get('results').innerHTML = '<table><thead><tr><th>Стратегия</th><th>Ходы</th><th>Посещения</th>'+
    '<th>Фронтир</th><th>мкс</th><th>Маршрут</th></tr></thead><tbody>'+rows.join('')+'</tbody></table>';
  show();
}
document.querySelector('form').addEventListener('submit', e => { e.preventDefault(); run(); });
get('strategy').addEventListener('change', show);
run();
