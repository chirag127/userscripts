// ==UserScript==
// @name         DeArrow: show original title
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Append the original YouTube title in parentheses after DeArrow's replacement. Requires the DeArrow extension installed.
// @author       Chirag Singhal
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/dearrow-show-original
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://github.com/chirag127/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js
// @downloadURL  https://github.com/chirag127/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js
// ==/UserScript==

(() => {
  'use strict';

  const TAG = '[dearrow-show-original]';
  const SUFFIX_RE = / \(original: [^)]+\)$/;

  // Per video: capture the FIRST title we see (before DeArrow has had a chance to replace it).
  // Then, when DeArrow replaces it, append ` (original: <captured>)`.
  let lastVideoId = null;
  let originalTitle = null;

  function getVideoId() {
    const m = location.search.match(/[?&]v=([^&]+)/);
    return m ? m[1] : null;
  }

  function getTitleElement() {
    // YouTube's watch-page title — has changed over years; try several selectors.
    return (
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('h1.title yt-formatted-string') ||
      document.querySelector('h1.ytd-watch-metadata') ||
      null
    );
  }

  function appendOriginal(el) {
    if (!el || !originalTitle) return;
    const currentText = (el.textContent || '').trim();
    if (!currentText) return;
    // Already appended, or text IS the original (DeArrow didn't replace) — skip
    if (SUFFIX_RE.test(currentText)) return;
    if (currentText === originalTitle) return;
    const newText = `${currentText} (original: ${originalTitle})`;
    el.textContent = newText;
  }

  function onVideoChange() {
    const vid = getVideoId();
    if (!vid || vid === lastVideoId) return;
    lastVideoId = vid;
    originalTitle = null;
    // Wait for the title to appear, then snapshot.
    const tryCapture = (tries = 0) => {
      const el = getTitleElement();
      const text = el && (el.textContent || '').trim();
      if (text) {
        // If DeArrow has already replaced (we lost the race), this 'original' may itself be the
        // DeArrow title. Cheap heuristic: also pull from document.title which DeArrow modifies
        // later than the H1. Prefer whichever is longer (originals tend to be longer / clickbait-ier).
        const docTitle = (document.title || '').replace(/ - YouTube$/, '').trim();
        originalTitle = docTitle.length > text.length ? docTitle : text;
        watchAndAppend(el);
      } else if (tries < 40) {
        setTimeout(() => tryCapture(tries + 1), 100);
      }
    };
    tryCapture();
  }

  function watchAndAppend(el) {
    appendOriginal(el); // initial run in case DeArrow already replaced
    const obs = new MutationObserver(() => appendOriginal(el));
    obs.observe(el, { childList: true, characterData: true, subtree: true });
    // Stop observing on next nav so we don't pile up observers
    window.addEventListener('yt-navigate-start', () => obs.disconnect(), { once: true });
  }

  // SPA nav events
  window.addEventListener('yt-navigate-finish', onVideoChange);
  window.addEventListener('load', onVideoChange);
  // Initial run for direct loads
  if (document.readyState !== 'loading') onVideoChange();
  else document.addEventListener('DOMContentLoaded', onVideoChange);

  console.debug(TAG, 'loaded');
})();
