'use strict';

const assert = require('node:assert/strict');
const { alphabet, transitions, start, accepting, sink, step, recognize } = require('./model.js');

const cases = [
  ['ababcd', true],
  ['ababababcd', true],
  ['ababcdcdcd', true],
  ['ababababcdcdcd', true],
  ['', false],
  ['cd', false],
  ['abcd', false],
  ['abababcd', false],
  ['abab', false],
  ['ababc', false],
  ['ababcdcd', false],
  ['ababcdab', false],
  ['ababdc', false],
  ['abab cd', false],
  ['ababcd ', false],
  ['ABABCD', false],
  ['ababcd\n', false],
  ['ababcd🦉', false],
];

for (const [word, expected] of cases) {
  assert.equal(recognize(word).accepted, expected, JSON.stringify(word));
}

const states = Object.keys(transitions);
for (const state of states) {
  for (const symbol of alphabet) assert.ok(states.includes(step(state, symbol)));
  assert.equal(step(state, '#'), sink);
}

// Independent oracle. First check the two block phases, then count whole pairs.
function specification(word) {
  const parts = /^((?:ab)+)((?:cd)+)$/.exec(word);
  if (!parts || parts[0] !== word) return false;
  const n = parts[1].length / 2;
  const m = parts[2].length / 2;
  return n >= 2 && n % 2 === 0 && m >= 1 && m % 2 === 1;
}

let checked = 0;
function checkAll(prefix, remaining) {
  assert.equal(recognize(prefix).accepted, specification(prefix), prefix);
  checked += 1;
  if (remaining > 0) {
    for (const symbol of alphabet) checkAll(prefix + symbol, remaining - 1);
  }
}
checkAll('', 10);

const path = [];
assert.deepEqual(recognize('ababcd', (from, symbol, to) => path.push([from, symbol, to])), {
  accepted: true,
  state: accepting,
});
assert.deepEqual(path, [
  [start, 'a', 'q1'], ['q1', 'b', 'q2'], ['q2', 'a', 'q3'],
  ['q3', 'b', 'q4'], ['q4', 'c', 'q5'], ['q5', 'd', accepting],
]);
const long = 'ab'.repeat(20000) + 'cd'.repeat(10001);
assert.ok(recognize(long).accepted);
assert.ok(!recognize(long + 'cd').accepted);
console.log(`${cases.length} named cases and ${checked} exhaustive cases passed`);
console.log('Transition coverage, trace and two long inputs passed');
