'use strict';

const defaults = Object.freeze({
  count: 36, size: 100, seed: 42, radius: 18, separationRadius: 4,
  cohesion: 0.01, alignment: 0.05, separation: 0.10, maxSpeed: 1.35, maxAcceleration: 0.30,
});
const presets = Object.freeze({
  base: { label: 'Базовый', settings: {} },
  near: { label: 'Малый радиус', settings: { radius: 8 } },
  wide: { label: 'Большой радиус', settings: { radius: 30 } },
  aligned: { label: 'Сильное выравнивание', settings: { alignment: 0.20 } },
  compact: { label: 'Сильное центрирование', settings: { cohesion: 0.04 } },
  noSeparation: { label: 'Без разделения', settings: { separation: 0 } },
});

function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createFlock(settings) {
  const random = randomGenerator(settings.seed);
  return Array.from({ length: settings.count }, () => {
    const x = random() * settings.size;
    const y = random() * settings.size;
    const angle = random() * 2 * Math.PI;
    const speed = (0.35 + 0.5 * random()) * settings.maxSpeed;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  });
}

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function offset(delta, size) {
  return wrap(delta + size / 2, size) - size / 2;
}

function limit(x, y, cap) {
  const norm = Math.hypot(x, y);
  return norm > cap ? [x * cap / norm, y * cap / norm] : [x, y];
}

function steering(index, birds, settings) {
  const bird = birds[index];
  let count = 0;
  let cx = 0, cy = 0, vx = 0, vy = 0, sx = 0, sy = 0;
  for (const [j, neighbor] of birds.entries()) {
    if (j === index) continue;
    const dx = offset(neighbor.x - bird.x, settings.size);
    const dy = offset(neighbor.y - bird.y, settings.size);
    const distance = Math.hypot(dx, dy);
    if (distance > settings.radius) continue;
    count += 1;
    cx += dx;
    cy += dy;
    vx += neighbor.vx;
    vy += neighbor.vy;
    if (distance < settings.separationRadius) {
      const strength = 1 - distance / settings.separationRadius;
      if (distance === 0) {
        sx += j < index ? strength : -strength;
      } else {
        sx -= strength * dx / distance;
        sy -= strength * dy / distance;
      }
    }
  }
  if (count === 0) return [0, 0];
  const ax = settings.cohesion * cx / count +
    settings.alignment * (vx / count - bird.vx) + settings.separation * sx;
  const ay = settings.cohesion * cy / count +
    settings.alignment * (vy / count - bird.vy) + settings.separation * sy;
  return limit(ax, ay, settings.maxAcceleration);
}

function advance(birds, settings) {
  return birds.map((bird, index) => {
    const [ax, ay] = steering(index, birds, settings);
    const [vx, vy] = limit(bird.vx + ax, bird.vy + ay, settings.maxSpeed);
    return { x: wrap(bird.x + vx, settings.size), y: wrap(bird.y + vy, settings.size), vx, vy };
  });
}

function measure(birds, settings) {
  let ux = 0, uy = 0, nearestSum = 0, closePairs = 0;
  for (const [i, bird] of birds.entries()) {
    const speed = Math.hypot(bird.vx, bird.vy);
    if (speed > 1e-12) {
      ux += bird.vx / speed;
      uy += bird.vy / speed;
    }
    let nearest = Infinity;
    for (const [j, other] of birds.entries()) {
      if (j === i) continue;
      const distance = Math.hypot(offset(other.x - bird.x, settings.size),
        offset(other.y - bird.y, settings.size));
      nearest = Math.min(nearest, distance);
      if (i < j && distance < 1) closePairs += 1;
    }
    nearestSum += nearest;
  }
  return { polarization: Math.hypot(ux, uy) / birds.length,
    nearest: nearestSum / birds.length, closePairs };
}

function triangle(bird, scale, originX = 0, originY = 0) {
  const angle = Math.atan2(bird.vy, bird.vx);
  const x = originX + bird.x * scale;
  const y = originY + bird.y * scale;
  return [[7, 0], [-4, 3.2], [-4, -3.2]].map(([forward, side]) => [
    x + forward * Math.cos(angle) - side * Math.sin(angle),
    y + forward * Math.sin(angle) + side * Math.cos(angle),
  ]);
}

if (typeof module === 'object' && module.exports) {
  module.exports = { defaults, presets, wrap, offset, limit, steering, createFlock, advance, measure, triangle };
}
