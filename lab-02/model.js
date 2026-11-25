'use strict';

const DEPTH = 5;
const LEAVES = Object.freeze([
  4, -2, 7, 3, 5, 9, -6, 2, 8, 1, 6, 0, 2, -3, 4, 7,
  3, -5, 0, 8, 1, 4, -2, 6, 5, 2, 9, 1, -4, 7, 3, 6,
]);

function evaluate({ prune = false, root = 1, level = 0, reverse = false } = {}) {
  const visited = new Map();
  const choices = new Map();
  const cuts = [];
  let leaves = 0;

  function search(node, depth, alpha, beta) {
    if (depth === DEPTH) {
      leaves++;
      const value = LEAVES[node - 2 ** DEPTH];
      visited.set(node, { value, bound: 'exact' });
      return value;
    }
    const initialAlpha = alpha;
    const initialBeta = beta;
    const max = depth % 2 === 0;
    let best = max ? -Infinity : Infinity;
    const children = reverse ? [node * 2 + 1, node * 2] : [node * 2, node * 2 + 1];
    for (const [i, child] of children.entries()) {
      const score = search(child, depth + 1, alpha, beta);
      if (max ? score > best : score < best) {
        best = score;
        choices.set(node, child);
      }
      if (prune) {
        if (max) alpha = Math.max(alpha, best);
        else beta = Math.min(beta, best);
        if (alpha >= beta && i + 1 < children.length) {
          cuts.push({ node, skipped: children[i + 1], alpha, beta });
          break;
        }
      }
    }
    const bound = prune && best <= initialAlpha ? 'upper' :
      prune && best >= initialBeta ? 'lower' : 'exact';
    visited.set(node, { value: best, bound });
    return best;
  }

  const value = search(root, level, -Infinity, Infinity);
  const path = [root];
  while (choices.has(path.at(-1))) path.push(choices.get(path.at(-1)));
  return { value, path, visited, cuts, leaves };
}

function benchmark(options) {
  const repeats = 2000;
  for (let i = 0; i < 1000; i++) {
    evaluate(options);
    evaluate({ ...options, prune: true });
  }
  const samples = [[], []];
  for (let batch = 0; batch < 9; batch++) {
    for (const order of [0, 1]) {
      const mode = (order + batch) % 2;
      const settings = { ...options, prune: Boolean(mode) };
      const start = performance.now();
      for (let i = 0; i < repeats; i++) evaluate(settings);
      samples[mode].push((performance.now() - start) * 1000 / repeats);
    }
  }
  return samples.map(group => group.sort((a, b) => a - b)[4]);
}

if (typeof module !== 'undefined') module.exports = { DEPTH, LEAVES, evaluate, benchmark };
