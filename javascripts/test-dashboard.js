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
 * Test dashboard (Docs/development/test-dashboard.md)
 *
 * Renders images/figures/tests/dashboard.json, written by
 * Scripts/docs_figures/host_tests.py: every package's suites and cases, the figures its tests
 * produce and its documentation page. Nothing is computed here that the runner did not record;
 * the page only filters, sorts and lays the data out.
 *
 * Material's navigation.instant swaps pages without re-running scripts, so the dashboard is
 * (re)built from the document$ observable whenever a page containing #test-dashboard appears.
 * ============================================================================= */

(function () {
  'use strict';

  var DATA = 'images/figures/tests/dashboard.json';

  function siteRoot() {
    try {
      var cfg = JSON.parse(document.getElementById('__config').textContent);
      return new URL(cfg.base || '.', window.location.href);
    } catch (e) {
      return new URL('.', window.location.href);
    }
  }

  function url(path) {
    return new URL(path, siteRoot()).href;
  }

  /** A docs page path ("development/testing.md") as its built URL ("development/testing/"). */
  function pageUrl(md) {
    var p = md.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '/');
    return url(p);
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c !== null && c !== undefined) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function total(p) {
    return p.cases_passed + p.cases_failed + p.cases_skipped;
  }

  function status(p) {
    if (p.build_error || p.cases_failed > 0) return 'fail';
    if (p.cases_skipped > 0) return 'skip';
    return 'pass';
  }

  function fmtSeconds(s) {
    if (s === null || s === undefined) return '';
    if (s < 0.001) return '<1 ms';
    if (s < 1) return Math.round(s * 1000) + ' ms';
    return s.toFixed(s < 10 ? 2 : 1) + ' s';
  }

  /** Stacked pass / fail / skip bar, widths proportional to the counts. */
  function bar(passed, failed, skipped) {
    var n = passed + failed + skipped || 1;
    return el('div', {class: 'td-bar', role: 'img',
      'aria-label': passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped'}, [
      el('span', {class: 'td-bar__pass', style: 'width:' + (100 * passed / n) + '%'}),
      el('span', {class: 'td-bar__fail', style: 'width:' + (100 * failed / n) + '%'}),
      el('span', {class: 'td-bar__skip', style: 'width:' + (100 * skipped / n) + '%'})
    ]);
  }

  function badge(state) {
    var text = {passed: 'pass', failed: 'fail', skipped: 'skip', pass: 'pass', fail: 'fail',
      skip: 'skip'}[state] || state;
    return el('span', {class: 'td-badge td-badge--' + text, text: text});
  }

  /* ── Lightbox for figures ──────────────────────────────────────────────── */
  function openFigure(src, caption) {
    var box = el('div', {class: 'td-lightbox', role: 'dialog', 'aria-modal': 'true',
      'aria-label': caption, tabindex: '-1'}, [
      el('figure', {}, [el('img', {src: src, alt: caption}), el('figcaption', {text: caption})])
    ]);
    function close() {
      document.removeEventListener('keydown', onKey);
      box.remove();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    box.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
    box.focus();
  }

  /* ── One package ───────────────────────────────────────────────────────── */
  function suiteBlock(d) {
    var rows = (d.cases || []).map(function (c) {
      return el('tr', {class: 'td-case td-case--' + c.status}, [
        el('td', {}, [badge(c.status)]),
        el('td', {class: 'td-case__name', text: c.name}),
        el('td', {class: 'td-num', text: fmtSeconds(c.time)}),
        el('td', {class: 'td-case__info', text: c.info || ''})
      ]);
    });
    var checks = d.checks ? ' · ' + d.checks[0] + ' checks, ' + d.checks[1] + ' failures' : '';
    var summary = el('summary', {}, [
      badge(d.ok ? (d.skipped ? 'skip' : 'pass') : 'fail'),
      el('code', {text: d.name}),
      el('span', {class: 'td-muted', text: ' ' + d.passed + '/' + (d.passed + d.failed + d.skipped) +
        ' cases' + checks + (d.seconds ? ' · ' + fmtSeconds(d.seconds) : '')})
    ]);
    var body = rows.length ?
      el('table', {class: 'td-cases'}, [
        el('thead', {}, [el('tr', {}, [el('th', {text: ''}), el('th', {text: 'case'}),
          el('th', {class: 'td-num', text: 'time'}), el('th', {text: 'detail'})])]),
        el('tbody', {}, rows)]) :
      el('p', {class: 'td-muted', text: 'The executable reports no per-case output; it counts as one case.'});
    var block = el('details', {class: 'td-suite'}, [summary, body]);
    if (!d.ok) block.open = true;
    return block;
  }

  function card(name, p, data) {
    var st = status(p);
    var figs = (p.figures || []).map(function (f) {
      var src = url(f);
      var cap = name + ' — ' + f.split('/').pop();
      return el('button', {class: 'td-thumb', type: 'button', title: 'Open ' + f.split('/').pop(),
        onclick: function () { openFigure(src, cap); }}, [
        el('img', {src: src, alt: cap, loading: 'lazy'})]);
    });
    var details = el('div', {class: 'td-card__suites', hidden: ''},
      (p.details || []).map(suiteBlock).concat(
        p.build_error ? [el('pre', {class: 'td-error', text: p.build_error})] : []));
    var toggle = el('button', {class: 'td-toggle', type: 'button', 'aria-expanded': 'false',
      text: (p.details || []).length + ' suites ▸'});
    toggle.addEventListener('click', function () {
      var open = details.hasAttribute('hidden');
      if (open) details.removeAttribute('hidden'); else details.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = (p.details || []).length + ' suites ' + (open ? '▾' : '▸');
      if (open) history.replaceState(null, '', '#' + encodeURIComponent(name));
    });
    var c = el('article', {class: 'td-card td-card--' + st, id: 'td-' + name,
      'data-area': p.area, 'data-status': st, 'data-name': name.toLowerCase()}, [
      el('header', {class: 'td-card__head'}, [
        badge(st),
        el('h3', {text: name}),
        el('span', {class: 'td-chip', text: p.area}),
        el('span', {class: 'td-chip td-chip--kind', text: p.kind})
      ]),
      bar(p.cases_passed, p.cases_failed, p.cases_skipped),
      el('p', {class: 'td-card__stats'}, [
        el('strong', {text: p.cases_passed + '/' + total(p)}), ' cases · ',
        p.suites_passed + '/' + p.suites + ' suites',
        p.seconds ? ' · ' + fmtSeconds(p.seconds) : ''
      ]),
      p.not_run ? el('p', {class: 'td-card__notrun'}, [
        el('span', {class: 'td-muted', text: 'Not run on the host: '}), p.not_run]) : null,
      figs.length ? el('div', {class: 'td-thumbs'}, figs) : null,
      el('footer', {class: 'td-card__foot'}, [
        toggle,
        el('a', {href: pageUrl(p.page || 'development/testing.md'), text: 'Package page →'})
      ]),
      details
    ]);
    return c;
  }

  /* ── Whole dashboard ───────────────────────────────────────────────────── */
  function render(root, data) {
    var names = Object.keys(data.packages);
    var areas = data.areas.filter(function (a) {
      return names.some(function (n) { return data.packages[n].area === a; });
    });
    names.sort(function (a, b) {
      var pa = data.packages[a], pb = data.packages[b];
      return areas.indexOf(pa.area) - areas.indexOf(pb.area) || a.localeCompare(b);
    });
    var sum = {passed: 0, failed: 0, skipped: 0, suites: 0, suitesOk: 0, failing: 0};
    names.forEach(function (n) {
      var p = data.packages[n];
      sum.passed += p.cases_passed;
      sum.failed += p.cases_failed;
      sum.skipped += p.cases_skipped;
      sum.suites += p.suites;
      sum.suitesOk += p.suites_passed;
      if (status(p) === 'fail') sum.failing += 1;
    });

    function kpi(value, label, cls) {
      return el('div', {class: 'td-kpi ' + (cls || '')}, [
        el('div', {class: 'td-kpi__value', text: value}), el('div', {class: 'td-kpi__label', text: label})]);
    }
    var kpis = el('div', {class: 'td-kpis'}, [
      kpi(sum.passed + '/' + (sum.passed + sum.failed + sum.skipped), 'cases passed'),
      kpi(sum.suitesOk + '/' + sum.suites, 'suites passed'),
      kpi(String(names.length), 'packages'),
      kpi(String(sum.failed), 'failed cases', sum.failed ? 'td-kpi--fail' : 'td-kpi--pass'),
      kpi(String(sum.skipped), 'skipped')
    ]);

    var areaRows = areas.map(function (a) {
      var ps = names.filter(function (n) { return data.packages[n].area === a; })
        .map(function (n) { return data.packages[n]; });
      var pa = ps.reduce(function (s, p) { return s + p.cases_passed; }, 0);
      var fa = ps.reduce(function (s, p) { return s + p.cases_failed; }, 0);
      var sk = ps.reduce(function (s, p) { return s + p.cases_skipped; }, 0);
      return el('div', {class: 'td-area'}, [
        el('span', {class: 'td-area__name', text: a}),
        bar(pa, fa, sk),
        el('span', {class: 'td-area__count', text: pa + '/' + (pa + fa + sk)})]);
    });

    var state = {area: 'all', status: 'all', q: ''};
    var grid = el('div', {class: 'td-grid'}, names.map(function (n) {
      return card(n, data.packages[n], data);
    }));
    var empty = el('p', {class: 'td-muted td-empty', hidden: '', text: 'No package matches the filter.'});

    function apply() {
      var shown = 0;
      grid.querySelectorAll('.td-card').forEach(function (c) {
        var ok = (state.area === 'all' || c.dataset.area === state.area) &&
          (state.status === 'all' || c.dataset.status === state.status) &&
          (!state.q || c.dataset.name.indexOf(state.q) >= 0 ||
            c.textContent.toLowerCase().indexOf(state.q) >= 0);
        c.hidden = !ok;
        if (ok) shown += 1;
      });
      empty.hidden = shown !== 0;
    }

    function chips(values, key, labels) {
      var group = el('div', {class: 'td-chips', role: 'group'});
      values.forEach(function (v, i) {
        var b = el('button', {type: 'button', class: 'td-filter' + (i === 0 ? ' is-active' : ''),
          'aria-pressed': String(i === 0), text: labels ? labels[i] : v});
        b.addEventListener('click', function () {
          state[key] = v;
          group.querySelectorAll('.td-filter').forEach(function (x) {
            x.classList.toggle('is-active', x === b);
            x.setAttribute('aria-pressed', String(x === b));
          });
          apply();
        });
        group.appendChild(b);
      });
      return group;
    }

    var search = el('input', {type: 'search', class: 'td-search', placeholder: 'Filter packages, suites, cases…',
      'aria-label': 'Filter packages, suites and cases'});
    search.addEventListener('input', function () {
      state.q = search.value.trim().toLowerCase();
      apply();
    });

    var h = data.host || {};
    var meta = el('p', {class: 'td-meta'}, [
      'Run ', el('strong', {text: data.generated_utc + ' UTC'}),
      data.commit ? ' at commit ' : '', data.commit ? el('code', {text: data.commit}) : null,
      ' · ' + (h.os || '') + ' · Python ' + (h.python || '') + ' · ROS 2: ' + (h.ros || 'none') +
      ' · GPU: ' + (h.gpu || 'none')
    ]);

    root.textContent = '';
    root.appendChild(meta);
    root.appendChild(kpis);
    root.appendChild(el('div', {class: 'td-areas'}, areaRows));
    root.appendChild(el('div', {class: 'td-toolbar'}, [
      chips(['all'].concat(areas), 'area', ['All areas'].concat(areas)),
      chips(['all', 'fail', 'skip', 'pass'], 'status', ['Any status', 'Failing', 'With skips', 'All passing']),
      search]));
    root.appendChild(grid);
    root.appendChild(empty);

    // Deep link: #Package opens that card.
    var target = decodeURIComponent((window.location.hash || '').slice(1));
    if (target && data.packages[target]) {
      var c = document.getElementById('td-' + target);
      if (c) {
        c.querySelector('.td-toggle').click();
        c.scrollIntoView({block: 'start'});
      }
    }
  }

  function mount() {
    var root = document.getElementById('test-dashboard');
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted = '1';
    fetch(url(DATA), {cache: 'no-cache'})
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
        return r.json();
      })
      .then(function (data) { render(root, data); })
      .catch(function (e) {
        root.textContent = '';
        root.appendChild(el('p', {class: 'td-error', text: 'Could not load ' + DATA + ' (' + e.message +
          '). Run python3 Scripts/docs_figures/host_tests.py to generate it.'}));
      });
  }

  function init() {
    if (typeof window.document$ !== 'undefined') {
      window.document$.subscribe(mount);   // first page and every instant navigation
    } else {
      mount();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
