'use strict';
const labels = ['BFS', 'DFS', 'A*', 'Обратный BFS', 'Смешанный поиск'];
const bits = s => s.toString(2).padStart(3, '0');
const states = Array.from({length: 8}, (_, i) => i);
function valid(s) {
  return Number.isInteger(s) && s >= 0 && s < 8;
}
function neighbors(s, masks = [4, 2, 1]) {
  if (!valid(s)) throw RangeError('Состояние должно быть от 0 до 7.');
  return masks.map(mask => s ^ mask);
}
function h(s, goal) {
  return bits(s ^ goal).split('1').length - 1;
}
function search(start, goal, strategy, masks = [4, 2, 1]) {
  if (!valid(start) || !valid(goal)) throw RangeError('Недопустимое состояние.');
  const queue = [{s: start, g: 0}];
  const parent = new Map([[start, null]]);
  const distance = new Map([[start, 0]]);
  let peak = 1;
  const visited = [];
  while (queue.length) {
    if (strategy === 'A*') {
      queue.sort((a, b) =>
        a.g + h(a.s, goal) - b.g - h(b.s, goal) || b.g - a.g);
    }
    const {s, g} = strategy === 'DFS' ? queue.pop() : queue.shift();
    if (g !== distance.get(s)) continue;
    visited.push(s);
    if (s === goal) {
      const path = [];
      for (let node = s; node !== null; node = parent.get(node)) path.push(node);
      return {path: path.reverse(), visited, peak};
    }
    for (const n of neighbors(s, masks)) {
      const prev = distance.get(n);
      if (prev !== undefined && (strategy !== 'A*' || prev <= g + 1)) continue;
      distance.set(n, g + 1);
      parent.set(n, s);
      queue.push({s: n, g: g + 1});
    }
    peak = Math.max(peak, queue.length);
  }
  return {path: null, visited, peak};
}
function solve(start, goal, label) {
  if (label === 'Обратный BFS') {
    const result = search(goal, start, 'BFS');
    return {...result, path: result.path?.reverse() ?? null};
  }
  if (label === 'Смешанный поиск') {
    if (!valid(start) || !valid(goal)) throw RangeError('Недопустимое состояние.');
    // Fix the left bit directly and search only in the matching half of the cube.
    const intermediate = (start & 4) === (goal & 4) ? start : start ^ 4;
    const result = search(intermediate, goal, 'BFS', [2, 1]);
    return intermediate === start ? result : {
      ...result, path: [start, ...result.path], visited: [start, ...result.visited],
    };
  }
  return search(start, goal, label);
}
function compare(start, goal, repeats = 1000) {
  return labels.map(label => {
    const result = solve(start, goal, label);
    const before = performance.now();
    for (let i = 0; i < repeats; i++) solve(start, goal, label);
    const microseconds = (performance.now() - before) * 1000 / repeats;
    return {label, ...result, microseconds, moves: result.path.length - 1};
  });
}
if (typeof module !== 'undefined') module.exports = {labels, states, bits, neighbors, h, solve, compare};
