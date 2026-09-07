import { useEffect } from 'react';

import { listen, observeOnce, prefersReducedMotion, preserveDom } from './domEffects.js';

function useImpactAnimations(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cleanups = [];

    const revealWidths = (root, selector, attribute) =>
      root?.querySelectorAll(selector).forEach(element => {
        cleanups.push(preserveDom(element, { styles: ['width'] }));
        const update = () => (element.style.width = `${element.dataset[attribute]}%`);
        if (prefersReducedMotion()) update();
        else {
          const frame = requestAnimationFrame(update);
          cleanups.push(() => cancelAnimationFrame(frame));
        }
      });
    const bars = root.querySelector('#dnBars');
    cleanups.push(observeOnce(bars, () => revealWidths(bars, '.ar-bfill', 'pct'), { threshold: 0.25 }));

    const bubbles = root.querySelector('#dnBubbles');
    const timers = [];
    cleanups.push(
      observeOnce(
        bubbles,
        () =>
          bubbles?.querySelectorAll('.ar-circle').forEach((circle, index) => {
            cleanups.push(preserveDom(circle, { styles: ['transform'] }));
            if (prefersReducedMotion()) circle.style.transform = 'scale(1)';
            else timers.push(setTimeout(() => (circle.style.transform = 'scale(1)'), index * 65));
          }),
        { threshold: 0.2 },
      ),
    );
    cleanups.push(() => timers.forEach(clearTimeout));

    root.querySelectorAll('.ar-flag').forEach(flag => {
      const trigger = flag.querySelector('.ar-flag-trigger');
      const details = flag.querySelector('.ar-fmore');
      if (!trigger || !details) return;
      cleanups.push(
        preserveDom(flag, { classes: ['ar-open'] }),
        preserveDom(trigger, { attributes: ['aria-expanded'] }),
        preserveDom(details, { attributes: ['aria-hidden', 'inert'] }),
      );
      const sync = () => {
        const open = flag.classList.contains('ar-open');
        trigger.setAttribute('aria-expanded', String(open));
        details.setAttribute('aria-hidden', String(!open));
        details.toggleAttribute('inert', !open);
      };
      sync();
      cleanups.push(
        listen(flag, 'click', () => {
          flag.classList.toggle('ar-open');
          sync();
        }),
      );
    });
    return () =>
      cleanups.reverse().forEach(cleanup => {
        cleanup();
      });
  }, [rootRef]);
}

export default useImpactAnimations;
