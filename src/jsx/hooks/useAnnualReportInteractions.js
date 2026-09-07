import { useEffect } from 'react';

import { prefersReducedMotion, preserveDom } from './domEffects.js';

const revealGroups = [
  [
    '.ar-section-head, .ar-fw-photo, .ar-fw-body, .ar-u16-kick, .ar-u16-h, .ar-u16-open-h, .ar-u16-open-meta, .ar-u16-2col, .ar-u16-family, .ar-gc-grid > div',
    0,
  ],
  ['.ar-bento .ar-gt', 70],
  ['.ar-u16-stat', 60],
  [
    '.ar-tc .ar-eyebrow, .ar-tc h2, .ar-tc-lead, .ar-tc-sub, .ar-tc-note, .ar-tc-mapfull, .ar-dn-hero .ar-eyebrow, .ar-dn-hero h2, .ar-dn-lead, .ar-dn-hero-figs, .ar-dn-block .ar-eyebrow, .ar-dn-block h3, .ar-dn-block .ar-dsub, .ar-cm .ar-eyebrow, .ar-cm h2, .ar-cm-lead, .ar-cm-amp',
    0,
  ],
  ['.ar-tc-stat, .ar-flag, .ar-imp-card, .ar-tsm, .ar-m-a-item, .ar-pubcard, .ar-dn-leg, .ar-dn-bar, .ar-cm-row', 45],
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
        root.querySelectorAll(selector).forEach((element, index) => {
          cleanups.push(preserveDom(element, { classes: ['ar-rv', 'ar-in'], styles: ['transition-delay'] }));
          element.classList.add('ar-rv');
          element.style.transitionDelay = `${stagger ? (index % 8) * stagger : 0}ms`;
          revealObserver.observe(element);
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
