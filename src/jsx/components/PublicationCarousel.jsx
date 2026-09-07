import { useEffect, useId, useRef, useState } from 'react';
import { scrollBehavior } from '../hooks/domEffects.js';

export default function PublicationCarousel({ title, description, previousLabel, nextLabel, children }) {
  const id = useId();
  const stripRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const strip = stripRef.current;
    const update = () => {
      const start = strip.scrollLeft <= 3;
      const end = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
      setEdges(previous => (previous.start === start && previous.end === end ? previous : { start, end }));
    };
    update();
    strip.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    return () => {
      strip.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  const move = direction => {
    if ((direction < 0 && edges.start) || (direction > 0 && edges.end)) return;
    const strip = stripRef.current;
    strip.scrollBy({ left: direction * strip.clientWidth, behavior: scrollBehavior() });
  };

  return (
    <div className="ar-publications">
      <h3 id={`${id}-title`} className="ar-tc-sub ar-tc-sub--spaced">
        {title}
      </h3>
      <p className="ar-tc-note">{description}</p>
      <div className="ar-publications-carousel">
        <button
          className="ar-publications-arrow ar-publications-arrow--previous"
          type="button"
          aria-label={previousLabel}
          aria-controls={`${id}-items`}
          aria-disabled={edges.start}
          onClick={() => move(-1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m14 5-7 7 7 7M7 12h14" />
          </svg>
        </button>
        <button
          className="ar-publications-arrow ar-publications-arrow--next"
          type="button"
          aria-label={nextLabel}
          aria-controls={`${id}-items`}
          aria-disabled={edges.end}
          onClick={() => move(1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m10 5 7 7-7 7M3 12h14" />
          </svg>
        </button>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: The overflow region must be focusable for native keyboard scrolling. */}
        <section id={`${id}-items`} ref={stripRef} className="ar-pub-strip" tabIndex={0} aria-labelledby={`${id}-title`}>
          {children}
        </section>
      </div>
    </div>
  );
}
