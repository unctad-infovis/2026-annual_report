import createMaplineSeries from '@unctad-infovis/map-tools/CreateMaplineSeries.js';
import getColor from '@unctad-infovis/map-tools/GetColor.js';
import processPolygons from '@unctad-infovis/map-tools/ProcessTopoObjectPolygons.js';
import Highcharts from 'highcharts';
import 'highcharts/modules/map';
import 'highcharts/modules/accessibility';
import 'highcharts/modules/pattern-fill';
import { feature } from 'topojson-client';
import topology from '../../../data/worldmap-economies-54030.topo.json';
import { buildMapPoints } from './projectMapData.js';

const color = value => (value ? '#7BB7E1' : '#E9EEF4');
const scaledTopology = {
  ...topology,
  transform: {
    scale: topology.transform.scale.map(value => value / 100000),
    translate: topology.transform.translate.map(value => value / 100000),
  },
};
const borders = [
  ['plain-borders', 'Solid'],
  ['dashed-borders', 'Dash'],
  ['dotted-borders', 'Dot'],
  ['dash-dotted-borders', 'DashDot'],
].map(([name, dash]) => {
  const series = createMaplineSeries(name, feature(scaledTopology, scaledTopology.objects[name]).features, dash);
  return {
    ...series,
    enableMouseTracking: false,
    accessibility: { enabled: false },
    showInLegend: false,
    lineWidth: 1,
    mapData: series.mapData.map(line => ({ ...line, color: '#647E94', lineWidth: 1 })),
  };
});
const polygons = processPolygons(topology, 'economies-color').filter(item => item.properties.code !== '010');
const geographyLabels = Object.fromEntries(
  topology.objects.economies.geometries.map(item => [item.properties.code, item.properties.labelen]),
);

export function setSelectedMapPoint(chart, code) {
  const markerSeries = chart.series.find(series => series.type === 'mappoint');
  markerSeries?.points.forEach(point => {
    point.select(false, true);
  });
  markerSeries?.points.find(point => point.custom.code === code)?.select(true, true);
  chart.redraw();
}

export function createProjectMap(container, description, countries, labels, onSelectCountry) {
  const projects = Object.fromEntries(countries.map(country => [country.code, country]));
  const rows = countries.map(country => ({ code: country.code, value: country.projects.length }));
  const markers = buildMapPoints(countries, topology, labels);
  const chart = Highcharts.mapChart(container, {
    chart: { backgroundColor: 'transparent', animation: false, spacing: [8, 8, 8, 8], style: { fontFamily: 'inherit' } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    accessibility: { description, keyboardNavigation: { enabled: true } },
    mapView: { projection: { name: undefined }, padding: 5 },
    mapNavigation: { enabled: false },
    tooltip: { enabled: false },
    plotOptions: { series: { animation: false, states: { inactive: { opacity: 1 } } } },
    series: [
      {
        type: 'map',
        mapData: polygons,
        joinBy: ['code', 'code'],
        enableMouseTracking: false,
        accessibility: { enabled: false },
        borderWidth: 0,
        data: polygons.map(({ properties }) => ({
          code: properties.code,
          name: geographyLabels[properties.code],
          color: getColor({ ...properties, value: projects[properties.code]?.projects.length }, rows, ['156', '158', '344', '446'], color),
        })),
      },
      ...borders,
      {
        type: 'mappoint',
        cursor: 'pointer',
        allowPointSelect: true,
        point: {
          events: {
            click() {
              onSelectCountry(this.custom.code);
              return false;
            },
          },
        },
        stickyTracking: false,
        dataLabels: { enabled: false },
        name: labels.series,
        data: markers,
        color: '#e5243b',
        marker: {
          radius: 4,
          lineColor: '#fff',
          lineWidth: 1,
          states: {
            hover: { radius: 7, lineColor: '#fff', lineWidth: 3 },
            select: { radius: 7, lineColor: '#fff', lineWidth: 3 },
          },
        },
        accessibility: { point: { valueDescriptionFormat: '{point.custom.description}' } },
        states: { hover: { halo: { size: 3 } }, select: { halo: { size: 3 } } },
      },
    ],
  });
  chart.setSelectedCountry = code => setSelectedMapPoint(chart, code);
  return chart;
}
