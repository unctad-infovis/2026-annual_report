import RollingNumber from '@unctad-infovis/general-tools/components/RollingNumber.jsx';
import { useEffect, useRef, useState } from 'react';

import { observeOnce, onReducedMotionChange, prefersReducedMotion } from '../hooks/domEffects.js';

const AnimatedNumber = ({ value, decimals = 0, duration = 1400, threshold = 0.5, delay = 0 }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const formatted = Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    const stopPreference = onReducedMotionChange(setReducedMotion);
    let timer;
    const stopObserver = observeOnce(
      ref.current,
      () => {
        if (delay && !prefersReducedMotion()) timer = setTimeout(() => setInView(true), delay);
        else setInView(true);
      },
      { threshold },
    );
    return () => {
      stopObserver();
      stopPreference();
      clearTimeout(timer);
    };
  }, [threshold, delay]);

  return (
    <>
      <span ref={ref} className="ar-cnt" data-to={value} aria-hidden="true">
        {reducedMotion ? formatted : <RollingNumber target={value} decimals={decimals} duration={duration} inView={inView} />}
      </span>
      <span className="ar-sr-only">{formatted}</span>
    </>
  );
};

export default AnimatedNumber;
