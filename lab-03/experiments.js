'use strict';

const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const { defaults, presets, offset, steering, createFlock, advance, measure, triangle } = require('./model.js');

const totalSteps = 600;
const exportSteps = new Set([0, 200, 600]);
const averagesFrom = 401;

function settingsFor(key) {
  return { ...defaults, ...presets[key].settings };
}

function framesFor(key) {
  const settings = settingsFor(key);
  const frames = [createFlock(settings)];
  for (let step = 1; step <= totalSteps; step++) frames.push(advance(frames.at(-1), settings));
  return frames;
}

function panel(birds, key, step, index) {
  const settings = settingsFor(key);
  const metrics = measure(birds, settings);
  const left = 14 + index * 306;
  const top = 60, side = 284, scale = side / settings.size;
  const grid = Array.from({ length: 9 }, (_, n) => {
    const x = left + side * (n + 1) / 10;
    const y = top + side * (n + 1) / 10;
    return `M${x} ${top}v${side} M${left} ${y}h${side}`;
  }).join(' ');
  const polygons = birds.map(bird => {
    const points = triangle(bird, scale, left, top).map(pair => pair.map(n => n.toFixed(2)).join(','));
    return `<polygon points="${points.join(' ')}"/>`;
  }).join('');
  return `<rect x="${left}" y="${top}" width="${side}" height="${side}" rx="3" fill="#10202a"/>
<path d="${grid}" stroke="#274551"/>
<g fill="#9aebd0">${polygons}</g>
<text x="${left}" y="46">${presets[key].label} · шаг ${step}</text>
<text x="${left}" y="367">P = ${metrics.polarization.toFixed(3)} · близких пар: ${metrics.closePairs}</text>`;
}

function svg(title, panels) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 924 389" role="img">
<title>${title}</title><rect width="924" height="389" rx="12" fill="#172731"/>
<g fill="#eaf4f5" font-family="system-ui, sans-serif" font-size="14">
<text x="14" y="22" font-weight="700">${title}</text>
${panels.join('\n')}
</g></svg>\n`;
}

function run() {
  assert.equal(offset(98, 100), -2);
  assert.equal(offset(-98, 100), 2);
  const left = { x: 1, y: 10, vx: 0, vy: 0 };
  const right = { ...left, x: 99 };
  assert.ok(steering(0, [left, right], defaults)[0] > 0);
  assert.ok(steering(0, [left, right], { ...defaults, separation: 0 })[0] < 0);
  const panels = {};
  const lines = ['scenario,radius,cohesion,alignment,separation,mean_polarization,mean_nearest,mean_close_pairs'];
  for (const key of Object.keys(presets)) {
    const settings = settingsFor(key);
    const frames = framesFor(key);
    assert.equal(frames.length, 601);
    const sums = { polarization: 0, nearest: 0, closePairs: 0 };
    panels[key] = [];
    for (const [step, flock] of frames.entries()) {
      assert.equal(flock.length, 36);
      for (const { x, y, vx, vy } of flock) {
        assert.ok(x >= 0 && x < settings.size && y >= 0 && y < settings.size);
        assert.ok(Math.hypot(vx, vy) <= settings.maxSpeed + 1e-10);
      }
      if (exportSteps.has(step)) panels[key].push(flock);
      if (step >= averagesFrom) {
        const measured = measure(flock, settings);
        for (const metric of Object.keys(sums)) sums[metric] += measured[metric];
      }
    }
    const means = Object.values(sums).map(sum => (sum / (totalSteps - averagesFrom + 1)).toFixed(3));
    lines.push([key, settings.radius, settings.cohesion, settings.alignment, settings.separation, ...means].join(','));
  }
  const stages = [...exportSteps].map((step, i) => panel(panels.base[i], 'base', step, i));
  const comparison = ['near', 'wide', 'noSeparation'].map((key, i) => panel(panels[key][2], key, 600, i));
  writeFileSync(join(__dirname, 'frames.svg'), svg('Базовый сценарий в трёх кадрах', stages));
  writeFileSync(join(__dirname, 'comparison.svg'), svg('Сравнение сценариев на шаге 600', comparison));
  writeFileSync(join(__dirname, 'results.csv'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log('Проверено 6 сценариев по 600 шагов. Границы и предел скорости соблюдены.');
}

const [mode, scenario = 'base'] = process.argv.slice(2);
if (mode === '--frames') {
  if (!Object.hasOwn(presets, scenario)) throw new Error('Unknown scenario: ' + scenario);
  const settings = settingsFor(scenario);
  const frames = framesFor(scenario).map(flock => flock.map(bird => triangle(bird, 600 / settings.size)));
  process.stdout.write(JSON.stringify(frames));
} else {
  run();
}
