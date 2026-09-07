export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

export const onReducedMotionChange = callback => {
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  return listen(media, 'change', () => callback(media.matches));
};

export const listen = (target, type, handler, options) => {
  target?.addEventListener(type, handler, options);
  return () => target?.removeEventListener(type, handler, options);
};

export const observeOnce = (element, callback, options = {}) => {
  if (!element) return () => {};
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    callback();
    return () => {};
  }
  let finished = false;
  let stopPreferenceListener = () => {};
  const finish = () => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    stopPreferenceListener();
    callback();
  };
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) finish();
  }, options);
  stopPreferenceListener = onReducedMotionChange(reduced => {
    if (reduced) finish();
  });
  observer.observe(element);
  return () => {
    finished = true;
    observer.disconnect();
    stopPreferenceListener();
  };
};

export const animate = (duration, draw) => {
  if (prefersReducedMotion()) {
    draw(1);
    return () => {};
  }
  let frame;
  let startedAt;
  let stopped = false;
  const step = timestamp => {
    if (stopped) return;
    startedAt ??= timestamp;
    const progress = prefersReducedMotion() ? 1 : Math.min(1, (timestamp - startedAt) / duration);
    draw(progress);
    if (!stopped && progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
};

export const preserveDom = (element, { attributes = [], styles = [], classes = [], children = false, properties = [] } = {}) => {
  if (!element) return () => {};
  const hadStyle = element.hasAttribute('style');
  const savedAttributes = attributes.map(name => [name, element.getAttribute(name)]);
  const savedStyles = styles.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
  const savedClasses = classes.map(name => [name, element.classList.contains(name)]);
  const savedProperties = properties.map(name => [name, element[name]]);
  const savedChildren = children ? [...element.childNodes] : null;
  return () => {
    for (const [name, value] of savedAttributes) value === null ? element.removeAttribute(name) : element.setAttribute(name, value);
    for (const [name, value, priority] of savedStyles)
      value ? element.style.setProperty(name, value, priority) : element.style.removeProperty(name);
    if (styles.length && !hadStyle && !element.style.cssText) element.removeAttribute('style');
    for (const [name, present] of savedClasses) element.classList.toggle(name, present);
    for (const [name, value] of savedProperties) element[name] = value;
    if (savedChildren) element.replaceChildren(...savedChildren);
  };
};
