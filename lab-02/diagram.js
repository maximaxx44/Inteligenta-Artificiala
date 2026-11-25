'use strict';

const TREE_WIDTH = 1100;
const TREE_HEIGHT = 392;

function diagram(depth, result, played) {
  const active = new Set(played);
  const edges = [];
  const nodes = [];
  function draw(node, level, slot, parent) {
    const x = 30 + (slot + 0.5) * 1056 / (2 ** level);
    const y = 24 + level * 68;
    const record = result.visited.get(node);
    const label = record ? (record.bound === 'upper' ? '≤' : record.bound === 'lower' ? '≥' : '') + record.value : '·';
    const line = active.has(node) ? '#9fe1ce' : record ? '#5b8091' : '#354b55';
    if (parent) {
      edges.push(`<path d="M${parent.x} ${parent.y}L${x} ${y}" fill="none" stroke="${line}" stroke-width="${active.has(node) ? 3 : 1}"/>`);
    }
    nodes.push(`<g><title>Узел ${node}: ${record ? label : 'пропущен'}${active.has(node) ? ', ход партии' : ''}</title>
<rect x="${x - 14}" y="${y - 12}" width="28" height="24" rx="5" fill="${active.has(node) ? '#285a54' : '#152831'}" stroke="${line}"/>
<text x="${x}" y="${y + 4}" fill="${record ? '#eaf4f5' : '#68818b'}" text-anchor="middle">${label}</text></g>`);
    if (level < depth) {
      draw(node * 2, level + 1, slot * 2, { x, y });
      draw(node * 2 + 1, level + 1, slot * 2 + 1, { x, y });
    }
  }
  draw(1, 0, 0);
  const roles = Array.from({ length: depth + 1 }, (_, level) =>
    `<text x="4" y="${28 + level * 68}" fill="#b9d0d5">${level === depth ? 'Лист' : level % 2 ? 'MIN' : 'MAX'}</text>`);
  return `<rect width="${TREE_WIDTH}" height="${TREE_HEIGHT}" rx="8" fill="#101c24"/>
<g font-family="system-ui, sans-serif" font-size="11">${edges.join('')}${nodes.join('')}${roles.join('')}</g>`;
}

if (typeof module !== 'undefined') module.exports = { TREE_WIDTH, TREE_HEIGHT, diagram };
