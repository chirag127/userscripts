// ==UserScript==
// @name         StereoToMono
// @namespace    https://github.com/oriz-org/userscripts
// @version      1.0
// @description  Convert stereo audio to mono on any page. Auto-detects playing <video> and <audio> elements. Toggle via Tampermonkey menu.
// @author       chirag127
// @match        *://*/*
// @exclude      https://www.youtube.com/embed/*
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/stereo-to-mono
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/stereo-to-mono/stereo-to-mono.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/stereo-to-mono/stereo-to-mono.user.js
// ==/UserScript==

(() => {
  'use strict';

  const TAG = '[stereo-to-mono]';

  let enabled = false;
  let audioCtx = null;
  let observer = null;
  const menuLabel = 'StereoToMono — Toggle mono';

  // Maps media element → { source, gain, wasMuted } for graph persistence
  const graphMap = new Map();

  /* ---- AudioContext ---- */

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.onstatechange = () => {
        if (audioCtx && audioCtx.state === 'closed') audioCtx = null;
      };
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /* ---- Per-element graph setup / teardown ---- */

  function createGraph(el) {
    if (graphMap.has(el) || !(el instanceof HTMLMediaElement)) return;
    try {
      const ctx = getCtx();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.channelCountMode = 'explicit';
      gain.channelCount = 1;
      gain.gain.value = enabled ? 1 : 0;
      source.connect(gain);
      gain.connect(ctx.destination);
      const wasMuted = el.muted;
      if (enabled) el.muted = true;
      graphMap.set(el, { source, gain, wasMuted });
    } catch (e) {
      if (e.name === 'InvalidStateError' && /source/.test(e.message)) {
        // Already has a graph from a previous run — track it anyway
        graphMap.set(el, { source: null, gain: null, wasMuted: el.muted });
        if (enabled) el.muted = true;
      } else {
        console.debug(TAG, 'Cannot create graph for', el.tagName, e.message);
      }
    }
  }

  function destroyGraph(el) {
    const g = graphMap.get(el);
    if (!g) return;
    if (g.source) try { g.source.disconnect(); } catch (e) {}
    if (g.gain) try { g.gain.disconnect(); } catch (e) {}
    el.muted = g.wasMuted;
    graphMap.delete(el);
  }

  /* ---- Enable / Disable ---- */

  function enable() {
    if (enabled) return;
    enabled = true;
    for (const [el, g] of graphMap) {
      el.muted = true;
      if (g.gain) g.gain.gain.value = 1;
    }
    // Catch any media elements not yet in the graph
    document.querySelectorAll('video, audio').forEach(createGraph);
    startObserver();
    console.log(TAG, 'enabled');
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    for (const [el, g] of graphMap) {
      el.muted = g.wasMuted;
      if (g.gain) g.gain.gain.value = 0;
    }
    stopObserver();
    console.log(TAG, 'disabled');
  }

  function toggle() {
    (enabled ? disable : enable)();
  }

  /* ---- MutationObserver -- catch dynamically added media ---- */

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLMediaElement) {
            createGraph(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video, audio').forEach(createGraph);
          }
        }
        for (const node of m.removedNodes) {
          if (node instanceof HTMLMediaElement) {
            destroyGraph(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video, audio').forEach(destroyGraph);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  /* ---- Initialisation ---- */

  GM_registerMenuCommand(menuLabel, toggle);

  // Pre-process any media elements already in the DOM
  function init() {
    document.querySelectorAll('video, audio').forEach(createGraph);
    console.debug(TAG, 'loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
