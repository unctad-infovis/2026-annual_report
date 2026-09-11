import Select from '@unctad-infovis/general-tools/components/Select.jsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function ProjectMap({ countries, summary, labels, description, settings }) {
  const container = useRef(null);
  const chartRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(false);
  const country = countries.find(item => item.code === selected?.value);
  const options = useMemo(
    () => countries.map(item => ({ value: item.code, label: item.name })).sort((a, b) => a.label.localeCompare(b.label)),
    [countries],
  );
  const selectCountry = useCallback(code => setSelected(options.find(option => option.value === code) ?? null), [options]);

  useEffect(() => {
    let disposed = false;
    let chart;
    import('./projectMap/createProjectMap.js')
      .then(({ createProjectMap }) => {
        if (!disposed) {
          chart = createProjectMap(container.current, description, countries, labels, selectCountry);
          chartRef.current = chart;
        }
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      chartRef.current = null;
      chart?.destroy();
    };
  }, [description, countries, labels, selectCountry]);

  useEffect(() => {
    chartRef.current?.setSelectedCountry(selected?.value ?? null);
  }, [selected]);

  return (
    <div className="ar-project-map">
      <div className="ar-project-map-search">
        <Select
          id="project-country-search"
          label={labels.search}
          options={options}
          value={selected}
          onChange={setSelected}
          clearable
          placeholder={labels.placeholder}
        />
      </div>
      <div ref={container} className="ar-project-map-chart" />
      {error && <p role="status">{labels.error}</p>}
      <aside className="ar-project-map-panel" aria-live="polite">
        {country ? (
          <>
            <h4>{country.name}</h4>
            <p>{labels.projectCount(country.projects.length)}</p>
            <ul>
              {country.projects.map(project => (
                <li key={project.id}>
                  {settings.showDivisions && (
                    <>
                      <b>{project.division}</b> —{' '}
                    </>
                  )}
                  {project.title}
                </li>
              ))}
            </ul>
          </>
        ) : (
          summary
        )}
      </aside>
    </div>
  );
}
