import { useEffect } from 'react';

import { prefersReducedMotion, preserveDom } from './domEffects.js';

const revealGroups = [
  ['.ar-u16-stat', 60],
  ['.ar-tc-stat, .ar-flag, .ar-imp-card, .ar-tsm, .ar-m-a-item, .ar-dn-bar, .ar-cm-row', 45],
  ['.ar-xp-tile', 70],
];

function useAnnualReportInteractions(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cleanups = [];
    let disposed = false;
    if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        entries => {
          if (disposed) return;
          entries
            .filter(entry => entry.isIntersecting)
            .forEach(entry => {
              entry.target.classList.add('ar-in');
              revealObserver.unobserve(entry.target);
            });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      revealGroups.forEach(([selector, stagger]) => {
        selector.split(',').forEach(part => {
          root.querySelectorAll(part.trim()).forEach((element, index) => {
            cleanups.push(preserveDom(element, { classes: ['ar-rv', 'ar-in'], styles: ['transition-delay'] }));
            element.classList.add('ar-rv');
            element.style.transitionDelay = `${stagger ? index * stagger : 0}ms`;
            revealObserver.observe(element);
          });
        });
      });
      cleanups.push(() => revealObserver.disconnect());
    }

    return () => {
      disposed = true;
      cleanups.reverse().forEach(cleanup => {
        cleanup();
      });
    };
  }, [rootRef]);
}

export default useAnnualReportInteractions;
