import { useEffect } from 'react';

import { animate, listen, observeOnce, prefersReducedMotion, preserveDom } from './domEffects.js';

const useDonorChart = (funding, total, rootRef) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const chart = root.querySelector('#dnDonut');
    const svg = chart?.querySelector('svg');
    const center = root.querySelector('#dnCenter');
    const legend = root.querySelector('#dnLegend');
    if (!chart || !svg || !center) return undefined;

    const cleanups = [];
    cleanups.push(preserveDom(chart, { classes: ['ar-dim'] }), preserveDom(center, { children: true }));
    legend?.querySelectorAll('.ar-dn-leg').forEach(item => {
      cleanups.push(preserveDom(item, { classes: ['ar-on'] }));
    });
    const timers = [];
    const circumference = 2 * Math.PI * 80;
    const createCircle = attributes => {
      const circle = root.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
      Object.entries(attributes).forEach(([name, value]) => {
        circle.setAttribute(name, value);
      });
      svg.appendChild(circle);
      return circle;
    };
    const background = createCircle({ cx: 110, cy: 110, r: 80, fill: 'none', stroke: '#EBEFF3', 'stroke-width': 34 });
    const segments = [];
    let offset = 0;
    let focusedActivate = null;
    const reset = () => {
      chart.classList.remove('ar-dim');
      segments.forEach(segment => {
        segment.classList.remove('ar-on');
      });
      const number = root.ownerDocument.createElement('div');
      number.className = 'ar-cnum';
      const prefix = root.ownerDocument.createElement('span');
      prefix.className = 'ar-u';
      prefix.textContent = total.prefix;
      const suffix = root.ownerDocument.createElement('span');
      suffix.className = 'ar-u';
      suffix.textContent = total.resetSuffix;
      number.append(prefix, String(total.value), suffix);
      const label = root.ownerDocument.createElement('div');
      label.className = 'ar-clab';
      label.textContent = total.label;
      center.replaceChildren(number, label);
      legend?.querySelectorAll('.ar-dn-leg').forEach(item => {
        item.classList.remove('ar-on');
      });
    };

    funding.forEach((item, index) => {
      const length = (item.percentage / 100) * circumference;
      const segment = createCircle({
        class: 'ar-seg',
        cx: 110,
        cy: 110,
        r: 80,
        stroke: item.colour,
        'stroke-dasharray': `0 ${circumference}`,
        'stroke-dashoffset': -offset,
      });
      segment.dataset.length = length;
      segments.push(segment);
      offset += length;
      const activate = () => {
        chart.classList.add('ar-dim');
        segments.forEach(current => {
          current.classList.toggle('ar-on', current === segment);
        });
        const number = root.ownerDocument.createElement('div');
        number.className = 'ar-cnum';
        const prefix = root.ownerDocument.createElement('span');
        prefix.className = 'ar-u';
        prefix.textContent = total.prefix;
        number.append(prefix, item.amount.startsWith(total.prefix) ? item.amount.slice(total.prefix.length) : item.amount);
        const label = root.ownerDocument.createElement('div');
        label.className = 'ar-clab';
        label.textContent = `${item.name} · ${item.percentage}%`;
        center.replaceChildren(number, label);
        legend?.querySelectorAll('.ar-dn-leg').forEach(entry => {
          entry.classList.toggle('ar-on', Number(entry.dataset.i) === index);
        });
      };
      const restore = () => {
        if (focusedActivate) focusedActivate();
        else reset();
      };
      cleanups.push(listen(segment, 'mouseenter', activate), listen(segment, 'mouseleave', restore));
      const legendItem = legend?.querySelector(`.ar-dn-leg[data-i="${index}"]`);
      cleanups.push(
        listen(legendItem, 'mouseenter', activate),
        listen(legendItem, 'mouseleave', restore),
        listen(legendItem, 'click', activate),
        listen(legendItem, 'focus', () => {
          focusedActivate = activate;
          activate();
        }),
        listen(legendItem, 'blur', () => {
          focusedActivate = null;
          reset();
        }),
        listen(legendItem, 'keydown', event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            focusedActivate = null;
            reset();
          }
        }),
      );
    });

    cleanups.push(
      observeOnce(
        chart,
        () =>
          segments.forEach((segment, index) => {
            const length = Number(segment.dataset.length);
            const draw = progress =>
              segment.setAttribute(
                'stroke-dasharray',
                `${length * (1 - (1 - progress) ** 3)} ${circumference - length * (1 - (1 - progress) ** 3)}`,
              );
            if (prefersReducedMotion()) draw(1);
            else timers.push(setTimeout(() => cleanups.push(animate(700, draw)), index * 180));
          }),
        { threshold: 0.35 },
      ),
    );

    return () => {
      timers.forEach(clearTimeout);
      cleanups.reverse().forEach(cleanup => {
        cleanup();
      });
      [background, ...segments].forEach(circle => {
        circle.remove();
      });
    };
  }, [funding, total, rootRef]);
};

export default useDonorChart;
