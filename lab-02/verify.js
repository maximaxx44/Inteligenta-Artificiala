'use strict';

const assert = require('node:assert/strict');
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { DEPTH, LEAVES, evaluate, benchmark } = require('./model');
const { TREE_WIDTH, TREE_HEIGHT, diagram } = require('./diagram');

const expected = [, ...Array(31), ...LEAVES];
for (let node = 31; node > 0; node--) {
  const level = Math.floor(Math.log2(node));
  expected[node] = (level % 2 ? Math.min : Math.max)(expected[2 * node], expected[2 * node + 1]);
}

for (const reverse of [false, true]) {
  for (let node = 1; node <= 63; node++) {
    const level = Math.floor(Math.log2(node));
    const plain = evaluate({ root: node, level, reverse });
    const pruned = evaluate({ prune: true, root: node, level, reverse });
    assert.equal(plain.value, expected[node]);
    assert.equal(pruned.value, expected[node]);
    assert.equal(pruned.path.length, DEPTH - level + 1);
    assert.equal(expected[pruned.path.at(-1)], expected[node]);
    assert.ok(pruned.visited.size <= plain.visited.size);
    for (const [id, record] of pruned.visited) {
      if (record.bound === 'exact') assert.equal(record.value, expected[id]);
      if (record.bound === 'upper') assert.ok(expected[id] <= record.value);
      if (record.bound === 'lower') assert.ok(expected[id] >= record.value);
    }
    for (const cut of pruned.cuts) {
      assert.ok(cut.alpha >= cut.beta);
      assert.ok(!pruned.visited.has(cut.skipped));
    }
  }
  const times = benchmark({ reverse });
  for (const prune of [false, true]) {
    const r = evaluate({ prune, reverse });
    console.log({ reverse, prune, score: r.value, nodes: r.visited.size, leaves: r.leaves,
      cuts: r.cuts.length, microseconds: times[Number(prune)].toFixed(2), path: r.path });
  }
}
const result = evaluate({ prune: true });
const markup = diagram(DEPTH, result, result.path);
writeFileSync(join(__dirname, 'search-tree.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TREE_WIDTH} ${TREE_HEIGHT}"><title>Альфа-бета отсечение и оптимальный путь</title>${markup}</svg>\n`);
console.log('63 positions, two traversal orders, both algorithms and all search bounds verified.');
