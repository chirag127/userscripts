// ==UserScript==
// @name         Force old.reddit.com
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Redirect new Reddit (www/sh/bare) to old.reddit.com. Old UI loads faster, no infinite-scroll, saner comment threading.
// @author       chirag127
// @match        https://www.reddit.com/*
// @match        https://sh.reddit.com/*
// @match        https://reddit.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/reddit-force-old
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/reddit-force-old/reddit-force-old.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/reddit-force-old/reddit-force-old.user.js
// ==/UserScript==

(() => {
  'use strict'

  const HOSTS = new Set(['www.reddit.com', 'sh.reddit.com', 'reddit.com'])

  if (GM_getValue('enabled', true) && HOSTS.has(location.hostname)) {
    location.replace('https://old.reddit.com' + location.pathname + location.search + location.hash)
    return
  }

  GM_registerMenuCommand('Toggle force-old (currently: ' + (GM_getValue('enabled', true) ? 'ON' : 'OFF') + ')', () => {
    GM_setValue('enabled', !GM_getValue('enabled', true))
    location.reload()
  })
})()
