import { useEffect } from 'react';

import { listen, onReducedMotionChange, prefersReducedMotion, preserveDom } from './domEffects.js';

function useHeroVideo(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const video = root.querySelector('#heroVid');
    const toggle = root.querySelector('#vidToggle');
    if (!video || !toggle) return undefined;
    const restoreVideo = preserveDom(video, { attributes: ['autoplay'] });
    const restoreToggle = preserveDom(toggle, { attributes: ['aria-label'], classes: ['ar-paused'] });

    const sync = () => {
      toggle.classList.toggle('ar-paused', video.paused);
      toggle.setAttribute('aria-label', video.paused ? 'Play the video' : 'Pause the video');
    };
    const tryPlay = () => !prefersReducedMotion() && video.paused && video.play()?.catch(() => {});
    const togglePlayback = () => (video.paused ? video.play()?.catch(() => {}) : video.pause());
    const cleanups = [listen(toggle, 'click', togglePlayback), listen(video, 'play', sync), listen(video, 'pause', sync)];
    cleanups.push(
      onReducedMotionChange(reduced => {
        if (reduced) {
          video.removeAttribute('autoplay');
          video.pause();
          sync();
        }
      }),
    );

    if (prefersReducedMotion()) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      cleanups.push(listen(video, 'loadeddata', tryPlay), listen(video, 'canplay', tryPlay));
      tryPlay();
    }
    sync();
    return () => {
      cleanups.forEach(cleanup => {
        cleanup();
      });
      restoreVideo();
      restoreToggle();
      video.pause();
    };
  }, [rootRef]);
}

export default useHeroVideo;
