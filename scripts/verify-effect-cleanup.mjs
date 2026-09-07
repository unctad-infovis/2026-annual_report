import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as effects from '../src/jsx/hooks/domEffects.js';

const cssName = name => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

class Element extends EventTarget {
  attrs = new Map();
  values = new Map();
  tokens = new Set();
  childNodes = [];
  dataset = {};
  selectors = new Map();
  constructor() {
    super();
    this.style = new Proxy(
      {
        getPropertyValue: name => this.values.get(name)?.[0] || '',
        getPropertyPriority: name => this.values.get(name)?.[1] || '',
        setProperty: (name, value, priority = '') => {
          this.values.set(name, [value, priority]);
        },
        removeProperty: name => this.values.delete(name),
      },
      {
        get: (target, key) => (key === 'cssText' ? [...this.values].join(';') : target[key] || this.values.get(cssName(key))?.[0] || ''),
        set: (_, key, value) => {
          this.values.set(cssName(key), [value, '']);
          return true;
        },
      },
    );
    this.classList = {
      contains: name => this.tokens.has(name),
      add: name => this.tokens.add(name),
      remove: name => this.tokens.delete(name),
      toggle: (name, present = !this.tokens.has(name)) => {
        present ? this.tokens.add(name) : this.tokens.delete(name);
        return present;
      },
    };
  }
  getAttribute(name) {
    return this.attrs.get(name) ?? null;
  }
  hasAttribute(name) {
    return this.attrs.has(name);
  }
  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }
  removeAttribute(name) {
    this.attrs.delete(name);
  }
  toggleAttribute(name, force = !this.hasAttribute(name)) {
    if (force) this.setAttribute(name, '');
    else this.removeAttribute(name);
    return force;
  }
  replaceChildren(...nodes) {
    this.childNodes = nodes;
  }
  append(...nodes) {
    this.childNodes.push(...nodes);
  }
  appendChild(node) {
    this.append(node);
    node.parent = this;
  }
  remove() {
    this.parent.childNodes = this.parent.childNodes.filter(node => node !== this);
  }
  set textContent(value) {
    this.childNodes = [String(value)];
  }
  get textContent() {
    return this.childNodes.map(node => (typeof node === 'string' ? node : node.textContent)).join('');
  }
  querySelectorAll(selector) {
    return this.selectors.get(selector) || [];
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

const media = new EventTarget();
media.matches = false;
globalThis.window = { matchMedia: () => media };
const observers = [];
globalThis.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
    observers.push(this);
  }
  observe(target) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
};
window.IntersectionObserver = globalThis.IntersectionObserver;
const frames = new Map();
const timers = new Map();
let nextId = 0;
globalThis.requestAnimationFrame = callback => {
  frames.set(++nextId, callback);
  return nextId;
};
globalThis.cancelAnimationFrame = id => frames.delete(id);
globalThis.setTimeout = callback => {
  timers.set(++nextId, callback);
  return nextId;
};
globalThis.clearTimeout = id => timers.delete(id);
const flush = (queue, time) => {
  const callbacks = [...queue.values()];
  queue.clear();
  for (const callback of callbacks) callback(time);
};

const preserved = new Element();
const originalChild = new Element();
preserved.append(originalChild);
preserved.style.setProperty('width', '12%', 'important');
preserved.value = 'original';
const restore = effects.preserveDom(preserved, {
  attributes: ['role'],
  styles: ['width'],
  classes: ['active'],
  properties: ['value'],
  children: true,
});
preserved.setAttribute('role', 'button');
preserved.style.width = '90%';
preserved.classList.add('active');
preserved.classList.add('unrelated');
preserved.value = 'changed';
preserved.replaceChildren('changed');
restore();
assert.equal(preserved.getAttribute('role'), null);
assert.equal(preserved.style.getPropertyPriority('width'), 'important');
assert.equal(preserved.style.width, '12%');
assert.equal(preserved.value, 'original');
assert.equal(preserved.childNodes[0], originalChild);
assert.ok(preserved.classList.contains('unrelated'));
assert.ok(!preserved.classList.contains('active'));

let called = 0;
const cancelObserve = effects.observeOnce(new Element(), () => called++);
const lateObserver = observers.at(-1);
cancelObserve();
lateObserver.callback([{ isIntersecting: true }]);
assert.equal(called, 0);
const cancelAnimation = effects.animate(100, () => called++);
const lateFrame = [...frames.values()][0];
cancelAnimation();
lateFrame(20);
assert.equal(called, 0);

async function loadHook(name, doc) {
  const rootRef = {
    current: {
      ownerDocument: doc,
      querySelector: selector => (selector.startsWith('#') ? doc.getElementById?.(selector.slice(1)) : doc.querySelector?.(selector)),
      querySelectorAll: selector => doc.querySelectorAll?.(selector) || [],
    },
  };
  const source = (await readFile(new URL(`../src/jsx/hooks/${name}.js`, import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '')
    .replace(`export default ${name};`, `return ${name};`);
  let cleanup;
  const hook = new Function('useEffect', 'document', ...Object.keys(effects), source)(
    callback => {
      cleanup = callback();
    },
    new Proxy(doc, {
      get(target, key) {
        if (['getElementById', 'querySelector', 'querySelectorAll'].includes(key)) {
          throw new Error(`Interaction hooks must query the report root, not document.${key}`);
        }
        return Reflect.get(target, key);
      },
    }),
    ...Object.values(effects),
  );
  return (...args) => {
    hook(...args, rootRef);
    return cleanup;
  };
}

const bar = new Element();
bar.dataset.pct = '42';
const bars = new Element();
bars.selectors.set('.ar-bfill', [bar]);
const bubble = new Element();
const bubbles = new Element();
bubbles.selectors.set('.ar-circle', [bubble]);
const flag = new Element();
const flagTrigger = new Element();
const flagDetails = new Element();
flag.selectors.set('.ar-flag-trigger', [flagTrigger]);
flag.selectors.set('.ar-fmore', [flagDetails]);
const doc = new Element();
doc.selectors.set('.ar-flag', [flag]);
doc.getElementById = id => ({ dnBars: bars, dnBubbles: bubbles })[id];
const mountImpact = await loadHook('useImpactAnimations', doc);
for (let cycle = 0; cycle < 2; cycle++) {
  observers.length = 0;
  const cleanup = mountImpact();
  for (const observer of [...observers]) observer.callback([{ isIntersecting: true }]);
  flag.dispatchEvent(new Event('click'));
  assert.equal(flagTrigger.getAttribute('aria-expanded'), 'true');
  assert.equal(flagDetails.getAttribute('aria-hidden'), 'false');
  assert.ok(!flagDetails.hasAttribute('inert'));
  flag.dispatchEvent(new Event('click'));
  assert.equal(flagTrigger.getAttribute('aria-expanded'), 'false');
  assert.equal(flagDetails.getAttribute('aria-hidden'), 'true');
  assert.ok(flagDetails.hasAttribute('inert'));
  flush(frames, 0);
  flush(frames, 500);
  cleanup();
  assert.equal(bar.style.width, '');
  assert.equal(bubble.style.transform, '');
  assert.equal(flagTrigger.getAttribute('aria-expanded'), null);
  assert.equal(flagDetails.getAttribute('aria-hidden'), null);
  assert.ok(!flagDetails.hasAttribute('inert'));
  assert.ok(!flag.classList.contains('ar-open'));
  flag.dispatchEvent(new Event('click'));
  assert.ok(!flag.classList.contains('ar-open'));
  assert.equal(frames.size, 0);
  assert.equal(timers.size, 0);
  for (const observer of observers) observer.callback([{ isIntersecting: true }]);
  assert.equal(frames.size, 0);
  assert.equal(timers.size, 0);
}
const svg = new Element(),
  center = new Element(),
  chart = new Element(),
  legend = new Element(),
  item = new Element();
center.append(originalChild);
chart.selectors.set('svg', [svg]);
legend.selectors.set('.ar-dn-leg', [item]);
legend.selectors.set('.ar-dn-leg[data-i="0"]', [item]);
const donorDoc = {
  getElementById: id => ({ dnDonut: chart, dnCenter: center, dnLegend: legend })[id],
  createElement: () => new Element(),
  createElementNS: () => new Element(),
};
const mountDonor = await loadHook('useDonorChart', donorDoc);
for (let cycle = 0; cycle < 2; cycle++) {
  const cleanup = mountDonor([{ name: 'Group', amount: '$1 million', percentage: 100, colour: '#009EDB' }], {
    prefix: '$',
    value: '1',
    resetSuffix: 'M',
    label: 'Total',
  });
  assert.equal(svg.childNodes.length, 2);
  item.dispatchEvent(new Event('mouseenter'));
  assert.notEqual(center.childNodes[0], originalChild);
  item.dispatchEvent(new Event('focus'));
  item.dispatchEvent(new Event('mouseleave'));
  assert.ok(chart.classList.contains('ar-dim'));
  const escapeEvent = new Event('keydown', { cancelable: true });
  Object.defineProperty(escapeEvent, 'key', { value: 'Escape' });
  item.dispatchEvent(escapeEvent);
  assert.ok(escapeEvent.defaultPrevented);
  assert.ok(!chart.classList.contains('ar-dim'));
  item.dispatchEvent(new Event('focus'));
  item.dispatchEvent(new Event('blur'));
  assert.ok(!chart.classList.contains('ar-dim'));
  cleanup();
  assert.equal(svg.childNodes.length, 0);
  assert.equal(center.childNodes[0], originalChild);
  assert.ok(!chart.classList.contains('ar-dim'));
  item.dispatchEvent(new Event('mouseenter'));
  assert.equal(center.childNodes[0], originalChild);
}
const reveal = new Element();
const annualDoc = {
  querySelector: () => null,
  querySelectorAll: selector => (selector.includes('.ar-section-head') ? [reveal] : []),
};
const mountAnnual = await loadHook('useAnnualReportInteractions', annualDoc);
for (let cycle = 0; cycle < 2; cycle++) {
  observers.length = 0;
  const cleanup = mountAnnual();
  observers[0].callback([{ target: reveal, isIntersecting: true }]);
  flush(frames, 0);
  flush(frames, 500);
  cleanup();
  assert.equal(reveal.style.transitionDelay, '');
  assert.ok(!reveal.classList.contains('ar-in'));
  assert.ok(!reveal.classList.contains('ar-rv'));
  observers[0].callback([{ target: reveal, isIntersecting: true }]);
  assert.equal(frames.size, 0);
  assert.ok(!reveal.classList.contains('ar-in'));
}
const image = new Element();
image.style.setProperty('--px', '2px');
const grid = new Element();
grid.selectors.set('.ar-xp-img', [image]);
grid.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
const mountParallax = await loadHook('useExploreParallax', { getElementById: () => grid });
for (let cycle = 0; cycle < 2; cycle++) {
  const cleanup = mountParallax();
  const event = new Event('mousemove');
  Object.assign(event, { clientX: 80, clientY: 80 });
  grid.dispatchEvent(event);
  assert.notEqual(image.style.getPropertyValue('--px'), '2px');
  cleanup();
  assert.equal(image.style.getPropertyValue('--px'), '2px');
  assert.equal(image.style.getPropertyValue('--py'), '');
  grid.dispatchEvent(event);
  assert.equal(image.style.getPropertyValue('--px'), '2px');
}
console.log(
  'PASS: DOM restoration, stale callbacks, repeated impact/donor/reveal/parallax lifecycles, and scheduled-work/listener disposal.',
);
