'use strict';

const alphabet = ['a', 'b', 'c', 'd'];
const start = 'q0';
const accepting = 'q7';
const sink = '⊥';
const transitions = {
  q0: { a: 'q1' },
  q1: { b: 'q2' },
  q2: { a: 'q3' },
  q3: { b: 'q4' },
  q4: { a: 'q1', c: 'q5' },
  q5: { d: 'q7' },
  q7: { c: 'q6' },
  q6: { d: 'q8' },
  q8: { c: 'q5' },
  [sink]: {},
};

function step(state, symbol) {
  return alphabet.includes(symbol) ? (transitions[state][symbol] ?? sink) : sink;
}

function recognize(word, onStep) {
  let state = start;
  for (const symbol of word) {
    const next = step(state, symbol);
    onStep?.(state, symbol, next);
    state = next;
  }
  return { accepted: state === accepting, state };
}

if (typeof module === 'object' && module.exports) {
  module.exports = { alphabet, transitions, start, accepting, sink, step, recognize };
}
