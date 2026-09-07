import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildMapPoints } from '../src/jsx/components/projectMap/projectMapData.js';

const data = JSON.parse(await readFile(new URL('../src/data/country-projects-2025.json', import.meta.url), 'utf8'));
const topology = JSON.parse(await readFile(new URL('../src/data/worldmap-economies-54030.topo.json', import.meta.url), 'utf8'));
const labels = { projectCount: count => `${count} project${count === 1 ? '' : 's'}` };
const records = data.countries.flatMap(country => country.projects);
assert.equal(data.countries.length, 75);
assert.equal(records.length, 107);
assert.equal(new Set(records.map(project => project.id)).size, 107);
assert.deepEqual(
  records.map(project => project.sourceRow).sort((a, b) => a - b),
  Array.from({ length: 107 }, (_, index) => index + 2),
);
const points = buildMapPoints(data.countries, topology, labels);
assert.equal(points.length, 75);
assert.equal(new Set(points.map(point => point.custom.code)).size, 75);
for (const country of data.countries) {
  const point = points.find(item => item.custom.code === country.code);
  assert.ok(point.geometry.coordinates.every(Number.isFinite));
  assert.equal(point.name, country.name);
  assert.equal(point.custom.tooltip, undefined);
  for (const project of country.projects) {
    assert.ok(point.custom.description.includes(project.title));
  }
}
const source = await readFile(new URL('../src/jsx/components/projectMap/createProjectMap.js', import.meta.url), 'utf8');
const mapExports = new Function(
  'Highcharts',
  'topology',
  'buildMapPoints',
  'createMaplineSeries',
  'getColor',
  'processPolygons',
  'feature',
  `${source.replace(/^import .*;\r?$/gm, '').replaceAll('export function', 'function')}\nreturn { createProjectMap, setSelectedMapPoint };`,
)(
  { mapChart: (_container, options) => options },
  topology,
  buildMapPoints,
  () => ({ mapData: [] }),
  () => '#fff',
  () => [],
  () => ({ features: [] }),
);
const { createProjectMap, setSelectedMapPoint } = mapExports;
const selected = [];
const chart = createProjectMap({}, 'Map', data.countries, labels, code => selected.push(code));
assert.equal(chart.tooltip.enabled, false);
const markers = chart.series.find(series => series.type === 'mappoint');
assert.equal(markers.allowPointSelect, true);
assert.deepEqual(markers.marker.states.select, markers.marker.states.hover);
assert.ok(markers.marker.states.select.radius > markers.marker.radius);
for (const point of markers.data) markers.point.events.click.call(point);
assert.deepEqual(
  selected,
  data.countries.map(country => country.code),
);
const selectionPoints = data.countries.slice(0, 2).map(country => ({
  custom: { code: country.code },
  select(value) {
    this.selected = value;
  },
}));
let redraws = 0;
setSelectedMapPoint({ series: [{ type: 'mappoint', points: selectionPoints }], redraw: () => redraws++ }, data.countries[0].code);
assert.deepEqual(
  selectionPoints.map(point => point.selected),
  [true, false],
);
assert.equal(redraws, 1);
assert.throws(() => buildMapPoints([{ code: 'missing', name: 'Missing', projects: [] }], topology, labels), /Missing map geometry/);
console.log(
  'PASS: 75 mapped countries/territories, 107 unique projects, source row coverage, finite coordinates, disabled tooltips and marker selection callbacks.',
);
