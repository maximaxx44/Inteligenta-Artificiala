'use strict';

const get = id => document.getElementById(id);
let played, result, plain;
let times = [];

function options() {
  return { reverse: get('order').value === 'right' };
}

function comparison() {
  const rows = [plain, result].map((item, i) => {
    const row = document.createElement('tr');
    const values = [i ? 'Мини-макс с отсечением' : 'Мини-макс', item.value,
      item.visited.size, item.leaves, item.cuts.length, times[i]?.toFixed(2) ?? '·'];
    for (const value of values) row.insertCell().textContent = value;
    return row;
  });
  get('comparison').replaceChildren(...rows);
}

function render() {
  const level = played.length - 1;
  const node = played.at(-1);
  const completed = level === DEPTH;
  const trail = played.slice(1).map(n => n % 2 === 0 ? 'Л' : 'П').join(' → ');
  get('status').textContent = completed ?
    `Партия окончена. Итог: ${LEAVES[node - 2 ** DEPTH]}. Путь: ${trail}.` :
    `Ход ${level + 1} из ${DEPTH}. Ты играешь за ${get('role').value}.` + (trail ? ` Путь: ${trail}.` : '');
  get('left').disabled = completed;
  get('right').disabled = completed;
  get('graph').innerHTML = diagram(DEPTH, result, played);
}

function computerMove() {
  const level = played.length - 1;
  const player = level % 2 === 0 ? 'MAX' : 'MIN';
  if (level < DEPTH && player !== get('role').value) {
    const decision = evaluate({ ...options(), prune: true, root: played.at(-1), level });
    played.push(decision.path[1]);
  }
}

function newGame() {
  played = [1];
  computerMove();
  render();
}

function move(direction) {
  if (played.length > DEPTH) return;
  played.push(2 * played.at(-1) + direction);
  computerMove();
  render();
}

function analyze() {
  times = [];
  plain = evaluate(options());
  result = evaluate({ ...options(), prune: true });
  comparison();
  newGame();
}

get('role').addEventListener('change', newGame);
get('order').addEventListener('change', analyze);
get('restart').addEventListener('click', newGame);
get('left').addEventListener('click', () => move(0));
get('right').addEventListener('click', () => move(1));
get('measure').addEventListener('click', () => {
  times = benchmark(options());
  comparison();
});
analyze();
