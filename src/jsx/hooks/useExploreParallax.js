import { useEffect } from 'react';

import { listen, onReducedMotionChange, prefersReducedMotion, preserveDom } from './domEffects.js';

function useExploreParallax(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const grid = root.querySelector('#xpGrid');
    if (!grid) return undefined;
    const images = grid.querySelectorAll('.ar-xp-img');
    const restore = [...images].map(image => preserveDom(image, { styles: ['--px', '--py'] }));
    const reset = () =>
      images.forEach(image => {
        image.style.setProperty('--px', '0px');
        image.style.setProperty('--py', '0px');
      });
    const move = event => {
      if (prefersReducedMotion()) return;
      const bounds = grid.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -14;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
      images.forEach(image => {
        image.style.setProperty('--px', `${x.toFixed(1)}px`);
        image.style.setProperty('--py', `${y.toFixed(1)}px`);
      });
    };
    const cleanups = [
      listen(grid, 'mousemove', move),
      listen(grid, 'mouseleave', reset),
      onReducedMotionChange(reduced => {
        if (reduced) reset();
      }),
    ];
    return () => {
      cleanups.forEach(cleanup => {
        cleanup();
      });
      restore.forEach(cleanup => {
        cleanup();
      });
    };
  }, [rootRef]);
}

export default useExploreParallax;
