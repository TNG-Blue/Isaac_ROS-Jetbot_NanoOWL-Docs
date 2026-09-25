/*
 *  ════════════════════════════════════════════════════════════════════════════
 *  SPDX-License-Identifier: Apache-2.0
 *  Copyright (c) 2025 TNG-Blue
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *  ════════════════════════════════════════════════════════════════════════════
 */

/* =============================================================================
 * Isaac ROS Jetbot NanoOWL - Documentation site behaviour
 *
 * Material for MkDocs runs with `navigation.instant`: pages are swapped in over
 * XHR and scripts are NOT re-executed. Everything that touches page content is
 * therefore registered on Material's `document$` observable, which emits once for
 * the first load and again after every instant navigation. Each enhancer is
 * idempotent (marks what it has processed) so a second emission never duplicates
 * labels, listeners or icons.
 *
 * Global behaviour (keyboard shortcuts, progress bar) is installed exactly once.
 * ============================================================================= */

(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------------
   * Site root
   * The site is served from a sub-path (…/Isaac_ROS-Jetbot_NanoOWL-Docs/), so
   * hard-coded "/getting-started/" URLs break. Material writes the relative path
   * to the site root into <script id="__config">; resolve against it.
   * ------------------------------------------------------------------------- */
  function siteRoot() {
    try {
      var cfg = JSON.parse(document.getElementById('__config').textContent);
      return new URL(cfg.base || '.', window.location.href);
    } catch (e) {
      return new URL('.', window.location.href);
    }
  }

  function go(path) {
    window.location.href = new URL(path, siteRoot()).href;
  }

  /* ---------------------------------------------------------------------------
   * Retire the old service worker
   * Earlier builds shipped a cache-first service worker (javascripts/sw.js) that
   * could keep serving stale pages after a deploy. It is gone; unregister any copy
   * a browser may still hold and drop its caches.
   * ------------------------------------------------------------------------- */
  function retireServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (reg) {
        var sw = reg.active || reg.waiting || reg.installing;
        if (sw && /\/javascripts\/sw\.js$/.test(sw.scriptURL)) reg.unregister();
      });
    }).catch(function () {});
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.filter(function (k) { return /^jetbot-/.test(k); })
          .forEach(function (k) { caches.delete(k); });
      }).catch(function () {});
    }
  }

  /* ---------------------------------------------------------------------------
   * External links open in a new tab (content area only)
   * ------------------------------------------------------------------------- */
  function markExternalLinks(root) {
    root.querySelectorAll('.md-content a[href^="http"]').forEach(function (a) {
      if (a.dataset.extChecked) return;
      a.dataset.extChecked = '1';
      if (a.hostname === window.location.hostname) return;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      if (!a.matches('.md-button, .md-content__button, .hero-button, .btn-premium') &&
          !a.querySelector('img, svg')) {
        a.classList.add('external-link');
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * Count-up animation for headline numbers
   *
   * Only the FIRST number in the label is animated and only when the rest of
   * the label contains no digits, so "35+", "<20 ms" and "98.5%" animate while
   * ranges such as "10-15 W" stay static. The original text is always restored
   * verbatim at the end, and screen readers get the final value via aria-label.
   * ------------------------------------------------------------------------- */
  var NUMBER_RE = /^(\D*?)(\d+(?:\.\d+)?)(\D*)$/;

  function countUp(el) {
    var original = el.dataset.countOriginal || el.textContent.trim();
    el.dataset.countOriginal = original;
    var m = NUMBER_RE.exec(original);
    if (!m || REDUCED_MOTION) { el.textContent = original; return; }

    var prefix = m[1], target = parseFloat(m[2]), suffix = m[3];
    var decimals = (m[2].split('.')[1] || '').length;
    var duration = 1200;
    var t0 = null;
    el.setAttribute('aria-label', original);

    function frame(now) {
      if (t0 === null) t0 = now;
      var p = Math.min((now - t0) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = original;
    }
    requestAnimationFrame(frame);
  }

  function animateCounters(root) {
    var els = root.querySelectorAll('.stat-value, .stat-number');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) {
      if (el.dataset.countBound) return;
      el.dataset.countBound = '1';
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------------
   * Reveal timeline entries as they scroll into view
   * ------------------------------------------------------------------------- */
  function revealTimeline(root) {
    var items = root.querySelectorAll('.timeline-item:not(.is-visible)');
    if (!items.length) return;
    if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
      items.forEach(function (it) { it.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    items.forEach(function (it) {
      it.classList.add('will-reveal');
      io.observe(it);
    });
  }

  /* ---------------------------------------------------------------------------
   * Reading progress bar (single element, rAF-throttled)
   * ------------------------------------------------------------------------- */
  var progressFill = null;
  var progressQueued = false;

  function updateProgress() {
    progressQueued = false;
    if (!progressFill) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    progressFill.style.transform = 'scaleX(' + (pct / 100) + ')';
  }

  function installProgressBar() {
    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="reading-progress__fill"></div>';
    document.body.appendChild(bar);
    progressFill = bar.firstChild;
    window.addEventListener('scroll', function () {
      if (!progressQueued) {
        progressQueued = true;
        requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
  }

  /* ---------------------------------------------------------------------------
   * Keyboard shortcuts
   * Material already owns / s f (search) and n p (next / previous page); these
   * add ? d h g and never fire while typing or with a modifier held.
   * ------------------------------------------------------------------------- */
  var SHORTCUTS = [
    ['?', 'Show this help'],
    ['/', 'Focus search (Material)'],
    ['n / p', 'Next / previous page (Material)'],
    ['d', 'Cycle colour scheme'],
    ['h', 'Go to home'],
    ['g', 'Go to Getting Started'],
    ['Esc', 'Close this dialog']
  ];

  function closeHelp() {
    var dlg = document.querySelector('.shortcut-dialog');
    if (dlg) dlg.remove();
  }

  function openHelp() {
    if (document.querySelector('.shortcut-dialog')) return;
    var wrap = document.createElement('div');
    wrap.className = 'shortcut-dialog';
    wrap.innerHTML =
      '<div class="shortcut-dialog__backdrop" data-close></div>' +
      '<div class="shortcut-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="shortcut-title">' +
      '<h3 id="shortcut-title">Keyboard shortcuts</h3><table></table>' +
      '<button type="button" class="md-button" data-close>Close</button></div>';
    var table = wrap.querySelector('table');
    SHORTCUTS.forEach(function (row) {
      var tr = document.createElement('tr');
      var k = document.createElement('td');
      var kbd = document.createElement('kbd');
      kbd.textContent = row[0];
      k.appendChild(kbd);
      var d = document.createElement('td');
      d.textContent = row[1];
      tr.appendChild(k);
      tr.appendChild(d);
      table.appendChild(tr);
    });
    wrap.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeHelp();
    });
    document.body.appendChild(wrap);
    wrap.querySelector('button').focus();
  }

  function cycleScheme() {
    // The visible palette toggle is the one that switches to the next scheme.
    // Clicking it focuses the palette's radio input; give focus back to the page
    // so the next shortcut is not swallowed.
    var next = document.querySelector('form[data-md-component="palette"] label:not([hidden])');
    if (!next) return;
    next.click();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function isTyping(t) {
    if (!t) return false;
    if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
    if (t.tagName === 'INPUT') {
      return !/^(radio|checkbox|button|submit|reset|range|color)$/i.test(t.type);
    }
    return false;
  }

  function installShortcuts() {
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(e.target)) return;
      if (e.key === 'Escape') { closeHelp(); return; }
      var action = {
        '?': openHelp,
        'd': cycleScheme,
        'h': function () { go('./'); },
        'g': function () { go('getting-started/'); }
      }[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * Wiring
   * ------------------------------------------------------------------------- */
  function onPage() {
    closeHelp();
    markExternalLinks(document);
    animateCounters(document);
    revealTimeline(document);
    updateProgress();
  }

  function init() {
    retireServiceWorker();
    installProgressBar();
    installShortcuts();
    if (typeof window.document$ !== 'undefined') {
      // Emits for the initial page and after each instant navigation
      window.document$.subscribe(onPage);
    } else {
      onPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
