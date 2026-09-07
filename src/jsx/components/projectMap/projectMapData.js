export function buildMapPoints(countries, topology, labels) {
  const locations = new Map(topology.objects['economies-point'].geometries.map(item => [item.properties.code, item]));
  return countries.map(country => {
    const location = locations.get(country.code);
    if (!location) throw new Error(`Missing map geometry for ${country.name} (${country.code})`);
    return {
      name: country.name,
      geometry: {
        type: 'Point',
        coordinates: location.coordinates.map(
          (value, index) => (value * topology.transform.scale[index] + topology.transform.translate[index]) / 100000,
        ),
      },
      custom: {
        code: country.code,
        description: `${country.name}: ${labels.projectCount(country.projects.length)}. ${country.projects.map(project => project.title).join('; ')}`,
      },
    };
  });
}
