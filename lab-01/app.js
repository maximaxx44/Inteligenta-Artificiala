'use strict';

const input = document.querySelector('#word');
const result = document.querySelector('#result');
const steps = document.querySelector('#steps');
const empty = document.querySelector('#empty');
const trace = document.querySelector('.trace');
const traceLimit = 250;

function showResult() {
  const rows = document.createDocumentFragment();
  let count = 0;
  const match = recognize(input.value, (from, symbol, to) => {
    count += 1;
    if (count > traceLimit) return;
    const row = document.createElement('tr');
    for (const value of [count, from, JSON.stringify(symbol), to]) {
      row.insertCell().textContent = value;
    }
    rows.append(row);
  });
  result.dataset.accepted = String(match.accepted);
  result.textContent = (match.accepted ? 'Слово принято.' : 'Слово отклонено.') +
    ' Конечное состояние: ' + match.state + '.';
  steps.replaceChildren(rows);
  trace.hidden = count === 0;
  empty.textContent = count === 0 ? 'Ввод пуст. Автомат остался в q0.' : '';
  if (count > traceLimit) {
    empty.textContent = 'Показаны первые 250 из ' + count + ' переходов. Проверено всё слово.';
  }
}

document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  showResult();
});
for (const example of document.querySelectorAll('[data-word]')) {
  example.addEventListener('click', () => {
    input.value = example.dataset.word;
    showResult();
  });
}
showResult();
