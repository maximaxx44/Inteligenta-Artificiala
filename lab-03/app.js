'use strict';

const get = id => document.getElementById(id);
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const presetSelect = get('preset');
const sliders = [
  ['radius', 'Радиус взаимодействия', 4, 45, 1],
  ['cohesion', 'Центрирование', 0, 0.1, 0.005],
  ['alignment', 'Выравнивание', 0, 0.3, 0.01],
  ['separation', 'Разделение', 0, 0.4, 0.01],
];
let settings, flock, step;
let paused = false;
let lastTick = 0;

function draw() {
  const size = canvas.width;
  context.fillStyle = '#10202a';
  context.fillRect(0, 0, size, size);
  context.strokeStyle = '#274551';
  context.beginPath();
  for (let n = size / 10; n < size; n += size / 10) {
    context.moveTo(n, 0);
    context.lineTo(n, size);
    context.moveTo(0, n);
    context.lineTo(size, n);
  }
  context.stroke();
  context.fillStyle = '#9aebd0';
  for (const bird of flock) {
    const [front, left, right] = triangle(bird, size / settings.size);
    context.beginPath();
    context.moveTo(...front);
    context.lineTo(...left);
    context.lineTo(...right);
    context.closePath();
    context.fill();
  }
  const metrics = measure(flock, settings);
  get('step').textContent = step;
  get('polarization').textContent = metrics.polarization.toFixed(3);
  get('pairs').textContent = metrics.closePairs;
}

function reset() {
  flock = createFlock(settings);
  step = 0;
  draw();
}

function applyPreset() {
  settings = { ...defaults, ...presets[presetSelect.value].settings };
  for (const [key] of sliders) {
    get(key).value = settings[key];
    get(key + 'Value').value = settings[key];
  }
  reset();
}

for (const [key, preset] of Object.entries(presets)) {
  presetSelect.add(new Option(preset.label, key));
}
for (const [key, label, min, max, stepSize] of sliders) {
  const wrapper = document.createElement('label');
  const number = document.createElement('output');
  const input = document.createElement('input');
  Object.assign(input, { id: key, type: 'range', min, max, step: stepSize });
  number.id = key + 'Value';
  wrapper.append(label, number, input);
  get('sliders').append(wrapper);
  input.addEventListener('input', () => {
    settings[key] = Number(input.value);
    number.value = input.value;
    reset();
  });
}
presetSelect.addEventListener('change', applyPreset);
get('reset').addEventListener('click', reset);
get('toggle').addEventListener('click', () => {
  paused = !paused;
  get('toggle').textContent = paused ? 'Продолжить' : 'Пауза';
});

function animate(timestamp) {
  if (!paused && timestamp - lastTick >= 1000 / 30) {
    lastTick = timestamp;
    flock = advance(flock, settings);
    step += 1;
    draw();
  }
  requestAnimationFrame(animate);
}

applyPreset();
requestAnimationFrame(animate);
