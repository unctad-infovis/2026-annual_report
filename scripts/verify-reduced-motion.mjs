import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  animate,
  listen,
  observeOnce,
  onReducedMotionChange,
  prefersReducedMotion,
  preserveDom,
  scrollBehavior,
} from '../src/jsx/hooks/domEffects.js';

const listeners = new Set();
const media = {
  matches: false,
  addEventListener: (_, callback) => listeners.add(callback),
  removeEventListener: (_, callback) => listeners.delete(callback),
};
globalThis.window = { matchMedia: () => media };
const change = reduced => {
  media.matches = reduced;
  for (const callback of [...listeners]) callback();
};
const frames = new Map();
let frameId = 0;
globalThis.requestAnimationFrame = callback => {
  frames.set(++frameId, callback);
  return frameId;
};
globalThis.cancelAnimationFrame = id => frames.delete(id);
const tick = time => {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
};

assert.equal(scrollBehavior(), 'smooth');
const progress = [];
animate(100, value => progress.push(value));
tick(0);
tick(50);
assert.deepEqual(progress, [0, 0.5]);
change(true);
tick(60);
assert.deepEqual(progress, [0, 0.5, 1]);
assert.equal(frames.size, 0);
assert.equal(scrollBehavior(), 'auto');
animate(100, value => assert.equal(value, 1));
assert.equal(frames.size, 0);

let changes = 0;
const unsubscribe = onReducedMotionChange(() => changes++);
change(false);
unsubscribe();
change(true);
assert.equal(changes, 1);

let revealed = 0;
observeOnce({}, () => revealed++);
assert.equal(revealed, 1);
change(false);
let observerCallback;
let disconnected = 0;
globalThis.IntersectionObserver = class {
  constructor(callback) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {
    disconnected++;
  }
};
window.IntersectionObserver = globalThis.IntersectionObserver;
const stop = observeOnce({}, () => revealed++);
assert.equal(revealed, 1);
change(true);
assert.equal(revealed, 2);
observerCallback([{ isIntersecting: true }]);
assert.equal(revealed, 2);
assert.ok(disconnected > 0);
stop();
assert.equal(listeners.size, 0);

const heroSource = await readFile(new URL('../src/jsx/hooks/useHeroVideo.js', import.meta.url), 'utf8');
const video = new EventTarget();
video.paused = true;
video.play = () => {
  video.paused = false;
  video.dispatchEvent(new Event('play'));
  return Promise.resolve();
};
video.pause = () => {
  video.paused = true;
  video.dispatchEvent(new Event('pause'));
};
video.removeAttribute = () => {};
video.hasAttribute = () => false;
video.getAttribute = () => null;
const toggle = new EventTarget();
toggle.classList = {
  toggle() {},
  contains() {
    return false;
  },
};
toggle.hasAttribute = () => false;
toggle.getAttribute = () => null;
toggle.removeAttribute = () => {};
toggle.setAttribute = (_, value) => {
  toggle.label = value;
};
let cleanupVideo;
const runVideoHook = new Function(
  'useEffect',
  'listen',
  'onReducedMotionChange',
  'prefersReducedMotion',
  'preserveDom',
  'document',
  heroSource.replace(/^import .*;\r?\n/gm, '').replace('export default useHeroVideo;', 'return useHeroVideo;'),
)(
  callback => {
    cleanupVideo = callback();
  },
  listen,
  onReducedMotionChange,
  prefersReducedMotion,
  preserveDom,
  {
    getElementById: id => (id === 'heroVid' ? video : toggle),
  },
);
change(false);
runVideoHook({ current: { querySelector: selector => (selector === '#heroVid' ? video : toggle) } });
assert.equal(video.paused, false);
change(true);
assert.equal(video.paused, true);
video.dispatchEvent(new Event('canplay'));
assert.equal(video.paused, true);
toggle.dispatchEvent(new Event('click'));
assert.equal(video.paused, false);
assert.equal(toggle.label, 'Pause the video');
cleanupVideo();
assert.equal(listeners.size, 0);
console.log('PASS: normal/reduced animation, preference changes, observer cleanup and manual video playback.');
