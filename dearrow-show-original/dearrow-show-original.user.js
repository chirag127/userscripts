// ==UserScript==
// @name         DeArrow: show original title
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.2.0
// @description  Append the original YouTube title in parentheses after DeArrow's replacement. Covers watch page AND every thumbnail (home, subs, sidebar, search, channel). Requires the DeArrow extension installed.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/dearrow-show-original
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js
// ==/UserScript==

(() => {
  'use strict';

  const TAG = '[dearrow-show-original]';
  const SUFFIX_RE = / \(original: [^)]+\)$/;
  const ORIG_ATTR = 'data-dearrow-original';
  const PROCESSED_ATTR = 'data-dearrow-processed';

  // ---------------------------------------------------------------------------
  // Watch page (H1 title) — keeps the original behaviour.
  // ---------------------------------------------------------------------------
  let lastVideoId = null;
  let originalTitle = null;

  function getVideoId() {
    const m = location.search.match(/[?&]v=([^&]+)/);
    return m ? m[1] : null;
  }

  function getWatchTitleElement() {
    return (
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('h1.title yt-formatted-string') ||
      document.querySelector('h1.ytd-watch-metadata') ||
      null
    );
  }

  function appendToWatchTitle(el) {
    if (!el || !originalTitle) return;
    const currentText = (el.textContent || '').trim();
    if (!currentText) return;
    if (SUFFIX_RE.test(currentText)) return;
    if (currentText === originalTitle) return;
    el.textContent = `${currentText} (original: ${originalTitle})`;
  }

  function onVideoChange() {
    const vid = getVideoId();
    if (!vid || vid === lastVideoId) return;
    lastVideoId = vid;
    originalTitle = null;
    const tryCapture = (tries = 0) => {
      const el = getWatchTitleElement();
      const text = el && (el.textContent || '').trim();
      if (text) {
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
    appendToWatchTitle(el);
    const obs = new MutationObserver(() => appendToWatchTitle(el));
    obs.observe(el, { childList: true, characterData: true, subtree: true });
    window.addEventListener('yt-navigate-start', () => obs.disconnect(), { once: true });
  }

  window.addEventListener('yt-navigate-finish', onVideoChange);
  window.addEventListener('load', onVideoChange);
  if (document.readyState !== 'loading') onVideoChange();
  else document.addEventListener('DOMContentLoaded', onVideoChange);

  // ---------------------------------------------------------------------------
  // Thumbnail titles — home, subscriptions, sidebar, search, channel, shelves.
  //
  // Strategy: DOM capture. The first text we observe on a title node is the
  // original (YouTube renders it before DeArrow replaces). We stash it on the
  // element via a data-attr and, on every mutation, re-append the suffix.
  //
  // Why this works race-or-no-race:
  //   * If we get there first, originalText is the YouTube title; DeArrow then
  //     replaces and we restore "<dearrow> (original: <yt>)".
  //   * If DeArrow gets there first, originalText is the DeArrow title and
  //     the suffix is redundant — we skip via `currentText === stored`.
  //   * To minimize races we run at document-start and observe a tree-wide
  //     MutationObserver from the get-go.
  // ---------------------------------------------------------------------------

  // Title elements YouTube uses across cards. Kept narrow on purpose:
  // we only want the visible title text, not channel name / metadata.
  const TITLE_SELECTORS = [
    '#video-title',                 // ytd-rich-grid-media, ytd-compact-video-renderer, search/shelf cards
    'a#video-title-link',           // some sidebar variants
    'h3 a.yt-simple-endpoint',      // legacy fallback
    'span.yt-core-attributed-string[role="text"]', // mobile / newer redesign
  ];

  function isTitleNode(node) {
    if (!(node instanceof Element)) return false;
    return TITLE_SELECTORS.some((sel) => node.matches(sel));
  }

  function findTitleNodes(root) {
    if (!(root instanceof Element) && !(root instanceof Document)) return [];
    const out = [];
    for (const sel of TITLE_SELECTORS) {
      out.push(...root.querySelectorAll(sel));
    }
    return out;
  }

  function captureAndDecorate(el) {
    if (!(el instanceof Element)) return;
    // Skip the watch-page H1 — handled separately above.
    if (el.closest('h1.ytd-watch-metadata')) return;

    const current = (el.textContent || '').trim();
    if (!current) return;
    if (SUFFIX_RE.test(current)) return;

    let stored = el.getAttribute(ORIG_ATTR);

    // First time we see this element: snapshot its current text as the
    // candidate "original". If DeArrow has already replaced, this will equal
    // the eventual displayed text and we'll no-op below.
    if (stored == null) {
      el.setAttribute(ORIG_ATTR, current);
      stored = current;
      el.setAttribute(PROCESSED_ATTR, '');
      return; // wait for a mutation (DeArrow replacement) before appending
    }

    // Already decorated with this exact stored value — nothing to do.
    if (current === stored) return;

    // Don't re-append onto already-appended text.
    if (current.endsWith(`(original: ${stored})`)) return;

    el.textContent = `${current} (original: ${stored})`;
  }

  function scanAll(root = document) {
    for (const el of findTitleNodes(root)) captureAndDecorate(el);
  }

  // Initial scan as soon as any nodes exist.
  const onReady = () => scanAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }
  window.addEventListener('yt-navigate-finish', () => scanAll());

  // Global observer: catches DeArrow replacements AND infinite-scroll new cards.
  const globalObs = new MutationObserver((muts) => {
    for (const mut of muts) {
      if (mut.type === 'characterData') {
        // Walk up to find a title node
        let n = mut.target.parentElement;
        while (n && !isTitleNode(n) && n !== document.body) n = n.parentElement;
        if (n && isTitleNode(n)) captureAndDecorate(n);
        continue;
      }
      // childList — text nodes replaced wholesale
      const target = mut.target;
      if (target instanceof Element && isTitleNode(target)) {
        captureAndDecorate(target);
      }
      // New cards appearing (scroll, nav)
      for (const node of mut.addedNodes) {
        if (node instanceof Element) {
          if (isTitleNode(node)) captureAndDecorate(node);
          for (const el of findTitleNodes(node)) captureAndDecorate(el);
        }
      }
    }
  });

  function startGlobalObserver() {
    if (!document.body) {
      requestAnimationFrame(startGlobalObserver);
      return;
    }
    globalObs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  startGlobalObserver();

  console.debug(TAG, 'loaded');
})();
