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
 * Live node graph (Docs/documentation/ros2/node-graph-live.md)
 *
 * Three levels, each small enough to read:
 *   overview  one card per group (package / firmware / simulation), edges bundled per group
 *             pair, laid out with ELK layered (assets/node-graph/layout.json)
 *   group     the blocks of one group and every block they exchange data with (ELK layout)
 *   focus     one node or topic: senders -> inputs -> NODE -> outputs -> receivers, in five
 *             columns arranged here (no layout engine needed)
 * plus a path view for a closed loop or a traced data path.
 *
 * Colours of communication, the same on every level: SEND = yellow (a block publishing / the
 * sending side of a link), RECEIVE = green (a block subscribing / the receiving side). A link
 * seen from neither end (loops, traces, the overview at rest) is yellow along its length with a
 * green arrowhead, and its moving dot turns from yellow to green as it travels.
 *
 * Navigation is kept inside the page (Back button, Esc, the path above the drawing): MkDocs
 * Material rewrites location.hash while scrolling (navigation.tracking) and re-renders the page
 * on some hash changes, so the URL is only read once, when the page opens, and written by the
 * Link button.
 *
 * Every block and edge comes from assets/node-graph/graph.json, written by
 * Scripts/diagrams/node_graph_live.py from Docs/flowcharts/ros2_nodes_flowchart.md; nothing is
 * inferred here. Material's navigation.instant swaps pages without re-running scripts, so the
 * page is mounted from the document$ observable; the animation stops when its root is gone.
 * ============================================================================= */

(function () {
  'use strict';

  var DATA = 'assets/node-graph/graph.json';
  var LAYOUT = 'assets/node-graph/layout.json';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var SPEED = 220;              // particle speed [px of the drawing per s]
  var MAX_PARTICLE_EDGES = 120;
  var CLASS_LABEL = {
    ros: 'ROS 2 node', mcu: 'micro-ROS node (MCU)', fw: 'Firmware block', hw: 'Hardware',
    ext: 'External node (launch file)', nonros: 'Non-ROS system', topic: 'Topic',
    orphan: 'Topic without publisher', srv: 'Service', note: 'Note'
  };

  // ---------------------------------------------------------------- helpers

  function siteRoot() {
    try {
      var cfg = JSON.parse(document.getElementById('__config').textContent);
      return new URL(cfg.base || '.', window.location.href);
    } catch (e) {
      return new URL('.', window.location.href);
    }
  }

  function url(path) { return new URL(path, siteRoot()).href; }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function sv(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (parent) parent.appendChild(e);
    return e;
  }

  function richText(text) {
    var span = el('span');
    String(text).split(/(`[^`]+`)/).forEach(function (part) {
      if (/^`[^`]+`$/.test(part)) span.appendChild(el('code', {text: part.slice(1, -1)}));
      else if (part) span.appendChild(document.createTextNode(part));
    });
    return span;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function joinNodes(items) {
    var out = [];
    items.forEach(function (x, k) { if (k) out.push(', '); out.push(x); });
    return out;
  }

  /** SVG path through ELK route points: cubic segments for splines, rounded corners otherwise. */
  function routePath(pts, spline) {
    if (!pts || pts.length < 2) return '';
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    if (spline && (pts.length - 1) % 3 === 0) {
      for (var i = 1; i < pts.length; i += 3) {
        d += 'C' + pts[i][0] + ',' + pts[i][1] + ' ' + pts[i + 1][0] + ',' + pts[i + 1][1] +
             ' ' + pts[i + 2][0] + ',' + pts[i + 2][1];
      }
      return d;
    }
    for (var k = 1; k < pts.length - 1; k++) {
      var p = pts[k - 1], q = pts[k], r = pts[k + 1];
      var l1 = Math.hypot(q[0] - p[0], q[1] - p[1]), l2 = Math.hypot(r[0] - q[0], r[1] - q[1]);
      var rad = Math.min(10, l1 / 2, l2 / 2);
      var a = [q[0] - (q[0] - p[0]) * rad / (l1 || 1), q[1] - (q[1] - p[1]) * rad / (l1 || 1)];
      var b = [q[0] + (r[0] - q[0]) * rad / (l2 || 1), q[1] + (r[1] - q[1]) * rad / (l2 || 1)];
      d += 'L' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + 'Q' + q[0] + ',' + q[1] + ' ' +
           b[0].toFixed(1) + ',' + b[1].toFixed(1);
    }
    var last = pts[pts.length - 1];
    return d + 'L' + last[0] + ',' + last[1];
  }

  /** Horizontal S-curve from the right side of one box to the left side of another. */
  function curve(x1, y1, x2, y2) {
    if (x2 < x1 + 20) {               // backwards: loop around below
      var dy = Math.max(60, Math.abs(y2 - y1) / 2);
      return 'M' + x1 + ',' + y1 + 'C' + (x1 + 80) + ',' + (y1 + dy) + ' ' + (x2 - 80) + ',' +
             (y2 + dy) + ' ' + x2 + ',' + y2;
    }
    var mx = (x1 + x2) / 2;
    return 'M' + x1 + ',' + y1 + 'C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2;
  }

  // ---------------------------------------------------------------- model

  function Model(data, layout) {
    var self = this;
    this.data = data;
    this.layout = layout;
    this.nodes = {};
    this.groups = {};
    this.out = {};
    this.inn = {};
    data.groups.forEach(function (g) { self.groups[g.id] = g; });
    data.nodes.forEach(function (n) {
      self.nodes[n.id] = n;
      self.out[n.id] = [];
      self.inn[n.id] = [];
      n.display = n.kind === 'node' && n.names.some(function (x) { return x.indexOf('_') >= 0; })
        ? n.names.join(' · ') : (n.label[0] || n.id);
    });
    data.edges.forEach(function (e, i) {
      e.i = i;
      self.out[e.from].push(i);
      self.inn[e.to].push(i);
    });
    this.searchIndex = data.nodes.map(function (n) {
      return {key: n.display, id: n.id, hay: (n.display + ' ' + n.label.join(' ') + ' ' + n.id).toLowerCase()};
    });
  }

  /** Best match: id, exact name, name starting with the text, name containing it, label. */
  Model.prototype.find = function (text) {
    var q = String(text || '').trim().toLowerCase(), self = this;
    if (!q) return null;
    if (this.nodes[String(text).trim()]) return String(text).trim();
    var tests = [
      function (s) { return s.key.toLowerCase() === q; },
      function (s) { return s.key.toLowerCase().split(' · ').some(function (k) { return k === q; }); },
      function (s) { return s.key.toLowerCase().indexOf(q) === 0 && self.nodes[s.id].kind === 'node'; },
      function (s) { return s.key.toLowerCase().indexOf(q) === 0; },
      function (s) { return s.key.toLowerCase().indexOf(q) >= 0; },
      function (s) { return s.hay.indexOf(q) >= 0; }
    ];
    for (var k = 0; k < tests.length; k++) {
      var hit = this.searchIndex.filter(tests[k]);
      if (hit.length) return hit[0].id;
    }
    return null;
  };

  /** Shortest directed path a -> b as edge indices (breadth-first), or null. */
  Model.prototype.path = function (a, b) {
    if (a === b) return [];
    var prev = {}, queue = [a], self = this;
    prev[a] = -1;
    while (queue.length) {
      var u = queue.shift(), outs = self.out[u] || [];
      for (var k = 0; k < outs.length; k++) {
        var e = self.data.edges[outs[k]];
        if (prev.hasOwnProperty(e.to)) continue;
        prev[e.to] = outs[k];
        if (e.to === b) {
          var steps = [], v = b;
          while (prev[v] !== -1) { steps.push(prev[v]); v = self.data.edges[prev[v]].from; }
          return steps.reverse();
        }
        queue.push(e.to);
      }
    }
    return null;
  };

  Model.prototype.isMonitor = function (id) {
    var n = this.nodes[id];
    return !!(n && this.groups[n.group] && this.groups[n.group].monitor);
  };

  // ---------------------------------------------------------------- the drawing surface

  function Stage(root, canvas) {
    this.root = root;
    this.canvas = canvas;
    this.svg = sv('svg', {'class': 'ng-svg', preserveAspectRatio: 'xMidYMid meet',
                          role: 'img', 'aria-label': 'ROS 2 node graph'}, canvas);
    var defs = sv('defs', {}, this.svg), self = this;
    this.uid = 'ng-world-' + Math.random().toString(36).slice(2, 8);
    // Arrowheads: neutral, receive (green) and send (yellow); ids unique per mount.
    this.markers = {};
    ['none', 'recv', 'send'].forEach(function (dir) {
      var id = self.uid + '-arrow-' + dir;
      var mk = sv('marker', {id: id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '9',
                             markerHeight: '9', orient: 'auto-start-reverse',
                             markerUnits: 'userSpaceOnUse'}, defs);
      sv('path', {d: 'M0,0L10,5L0,10z', 'class': 'ng-arrowhead ng-arrowhead-' + dir}, mk);
      self.markers[dir] = 'url(#' + id + ')';
    });
    this.world = sv('g', {id: this.uid}, this.svg);
    this.layer = sv('g', {'class': 'ng-particles'}, this.svg);
    this.buildMinimap();
    this.vb = {x: 0, y: 0, w: 1000, h: 600};
    this.particles = [];
    this.flowing = !reducedMotion();
    this.bindPointer();
    this.tick = this.tick.bind(this);
    window.requestAnimationFrame(this.tick);
  }

  Stage.prototype.clear = function () {
    while (this.world.firstChild) this.world.removeChild(this.world.firstChild);
    this.setParticles([]);
  };

  /** Moving dots go above the edges but under the boxes, so they never hide a label. */
  Stage.prototype.dotsHere = function () {
    this.world.appendChild(this.layer);
  };

  Stage.prototype.apply = function () {
    var v = this.vb;
    this.svg.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
    this.updateMinimap();
  };

  /** Small map of the whole drawing with the visible part framed; click or drag to move. */
  Stage.prototype.buildMinimap = function () {
    var self = this;
    this.mini = el('div', {class: 'ng-mini', title: 'Map — click or drag to move'});
    this.miniSvg = sv('svg', {'class': 'ng-mini-svg', preserveAspectRatio: 'xMidYMid meet'}, this.mini);
    sv('use', {href: '#' + this.uid}, this.miniSvg);
    this.miniView = sv('rect', {'class': 'ng-mini-view'}, this.miniSvg);
    this.canvas.appendChild(this.mini);
    var drag = false;
    function move(ev) {
      var pt = self.miniSvg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      var q = pt.matrixTransform(self.miniSvg.getScreenCTM().inverse());
      self.vb = {x: q.x - self.vb.w / 2, y: q.y - self.vb.h / 2, w: self.vb.w, h: self.vb.h};
      self.apply();
    }
    this.mini.addEventListener('pointerdown', function (ev) {
      ev.stopPropagation();
      drag = true;
      self.mini.setPointerCapture(ev.pointerId);
      move(ev);
    });
    this.mini.addEventListener('pointermove', function (ev) { if (drag) { ev.stopPropagation(); move(ev); } });
    this.mini.addEventListener('pointerup', function (ev) { ev.stopPropagation(); drag = false; });
    this.mini.addEventListener('wheel', function (ev) { ev.stopPropagation(); }, {passive: true});
  };

  Stage.prototype.updateMinimap = function () {
    var c = this.content, v = this.vb;
    if (!c || !this.mini) return;
    var hidden = v.w >= c.w * 0.98 && v.h >= c.h * 0.98 && v.x <= c.x + 1 && v.y <= c.y + 1;
    this.mini.style.display = hidden ? 'none' : '';
    this.miniSvg.setAttribute('viewBox', c.x + ' ' + c.y + ' ' + c.w + ' ' + c.h);
    this.miniView.setAttribute('x', v.x);
    this.miniView.setAttribute('y', v.y);
    this.miniView.setAttribute('width', v.w);
    this.miniView.setAttribute('height', v.h);
  };

  /** Open a large drawing at a readable scale (screen px per drawing px), from its top-left. */
  Stage.prototype.showReadable = function (scale) {
    var cw = this.canvas.clientWidth || 800, ch = this.canvas.clientHeight || 600, c = this.content;
    var fit = Math.min(cw / (c.w + 60), ch / (c.h + 60));
    if (fit >= scale) { this.fit(false); return; }
    this.vb = {x: c.x - 20, y: c.y - 20, w: cw / scale, h: ch / scale};
    this.apply();
  };

  Stage.prototype.toSvg = function (cx, cy) {
    var pt = this.svg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  };

  Stage.prototype.zoomAt = function (factor, cx, cy) {
    var p = this.toSvg(cx, cy), v = this.vb;
    var w = Math.min(Math.max(v.w * factor, 200), (this.content || v).w * 2.5 + 400);
    var f = w / v.w;
    this.vb = {x: p.x - (p.x - v.x) * f, y: p.y - (p.y - v.y) * f, w: w, h: v.h * f};
    this.apply();
  };

  Stage.prototype.zoomCenter = function (factor) {
    var r = this.canvas.getBoundingClientRect();
    this.zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
  };

  /** Show a rectangle of the drawing; at most 1:1 (`maxScale`) so small views stay crisp. */
  Stage.prototype.show = function (rect, animate, maxScale) {
    var cw = this.canvas.clientWidth || 800, ch = this.canvas.clientHeight || 600, pad = 30;
    var w = rect.w + 2 * pad, h = rect.h + 2 * pad;
    var minW = cw / (maxScale || 1);
    if (w < minW) w = minW;
    if (w / h < cw / ch) w = h * cw / ch; else h = w * ch / cw;
    var target = {x: rect.x + rect.w / 2 - w / 2, y: rect.y + rect.h / 2 - h / 2, w: w, h: h};
    if (!animate || reducedMotion()) { this.vb = target; this.apply(); return; }
    var start = this.vb, t0 = null, self = this;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / 420), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      self.vb = {x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e,
                 w: start.w + (target.w - start.w) * e, h: start.h + (target.h - start.h) * e};
      self.apply();
      if (k < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  };

  Stage.prototype.fit = function (animate) {
    if (this.content) this.show(this.content, animate, 1.15);
  };

  Stage.prototype.bindPointer = function () {
    var self = this, pts = {}, start = null, moved = false, pinch = null, downTarget = null;
    var c = this.canvas;
    c.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var d = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      self.zoomAt(Math.exp(d * 0.0015), ev.clientX, ev.clientY);
    }, {passive: false});
    c.addEventListener('pointerdown', function (ev) {
      pts[ev.pointerId] = {x: ev.clientX, y: ev.clientY};
      downTarget = ev.target;   // with pointer capture, pointerup targets the canvas itself
      c.setPointerCapture(ev.pointerId);
      var ids = Object.keys(pts);
      if (ids.length === 1) {
        start = {x: ev.clientX, y: ev.clientY, vb: Object.assign({}, self.vb)};
        moved = false;
      } else if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), w: self.vb.w};
        moved = true;
      }
    });
    c.addEventListener('pointermove', function (ev) {
      if (!pts[ev.pointerId]) {
        if (self.onHover) self.onHover(ev.target);
        return;
      }
      pts[ev.pointerId] = {x: ev.clientX, y: ev.clientY};
      var ids = Object.keys(pts);
      if (ids.length === 2 && pinch) {
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        self.zoomAt((pinch.w * pinch.d / d) / self.vb.w, (a.x + b.x) / 2, (a.y + b.y) / 2);
        return;
      }
      if (!start) return;
      var dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (!moved) return;
      var s = 1 / self.svg.getScreenCTM().a;
      self.vb = {x: start.vb.x - dx * s, y: start.vb.y - dy * s, w: self.vb.w, h: self.vb.h};
      self.apply();
      c.classList.add('ng-panning');
    });
    function up(ev) {
      var wasMoved = moved;
      delete pts[ev.pointerId];
      if (Object.keys(pts).length < 2) pinch = null;
      if (Object.keys(pts).length === 0) {
        start = null;
        c.classList.remove('ng-panning');
        if (!wasMoved && ev.type === 'pointerup' && self.onClick) self.onClick(downTarget);
      }
    }
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', function () { if (self.onHover) self.onHover(null); });
  };

  /**
   * Direction colour of an edge: 'recv' (green), 'send' (yellow), 'flow' (yellow line, green
   * head: sent at one end, received at the other) or null (plain grey).
   */
  Stage.prototype.setDir = function (path, dir) {
    path.classList.remove('ng-recv', 'ng-send', 'ng-flow');
    if (dir) path.classList.add('ng-' + dir);
    var head = dir === 'send' ? 'send' : dir ? 'recv' : 'none';
    path.setAttribute('marker-end', this.markers[head]);
    if (path.hasAttribute('marker-start')) {
      path.setAttribute('marker-start', this.markers[dir === 'recv' ? 'recv' : dir ? 'send' : 'none']);
    }
    path.ngDir = dir || null;
  };

  Stage.prototype.setParticles = function (paths) {
    var self = this;
    while (this.layer.firstChild) this.layer.removeChild(this.layer.firstChild);
    this.particles = [];
    paths.slice(0, MAX_PARTICLE_EDGES).forEach(function (p) {
      var len = p.getTotalLength();
      if (!len) return;
      var n = Math.max(1, Math.min(4, Math.round(len / 500)));
      for (var k = 0; k < n; k++) {
        var dir = p.ngDir || 'flow';
        var dot = sv('circle', {r: self.dotR || '5', 'class': 'ng-dot ng-dot-' + (dir === 'flow' ? 'send' : dir)}, self.layer);
        self.particles.push({el: dot, path: p, len: len, phase: k / n, dur: Math.max(1.4, len / SPEED),
                             turn: dir === 'flow', state: null});
      }
    });
    this.layer.style.display = this.flowing ? '' : 'none';
  };

  Stage.prototype.tick = function (ts) {
    if (!this.root.isConnected) return;   // page left (instant navigation)
    if (this.flowing && this.particles.length && !document.hidden) {
      var s = ts / 1000, ctm = this.svg.getScreenCTM();
      var r = (5 / (ctm ? ctm.a : 1)).toFixed(1);   // 5 screen px at any zoom
      if (r !== this.dotR) {
        this.dotR = r;
        this.particles.forEach(function (p) { p.el.setAttribute('r', r); });
      }
      this.particles.forEach(function (p) {
        var f = (s / p.dur + p.phase) % 1, q = p.path.getPointAtLength(f * p.len);
        p.el.setAttribute('cx', q.x.toFixed(1));
        p.el.setAttribute('cy', q.y.toFixed(1));
        if (p.turn) {   // sent (yellow) on the first half, received (green) on the second
          var state = f < 0.5 ? 'send' : 'recv';
          if (state !== p.state) { p.state = state; p.el.setAttribute('class', 'ng-dot ng-dot-' + state); }
        }
      });
    }
    window.requestAnimationFrame(this.tick);
  };

  // ---------------------------------------------------------------- the page

  function Page(root, data, layout) {
    var self = this;
    this.root = root;
    this.model = new Model(data, layout);
    root.innerHTML = '';
    this.crumbs = el('nav', {class: 'ng-crumbs', 'aria-label': 'Level'});
    var canvas = el('div', {class: 'ng-canvas', tabindex: '0',
                            'aria-label': 'Drag to pan, wheel or pinch to zoom, click a block to open it'});
    this.panel = el('aside', {class: 'ng-panel', 'aria-live': 'polite'});
    root.appendChild(this.toolbar());
    root.appendChild(this.crumbs);
    root.appendChild(el('div', {class: 'ng-main'}, [canvas, this.panel]));
    root.appendChild(this.legend());
    this.stage = new Stage(root, canvas);
    this.stage.onClick = function (t) { self.clicked(t); };
    this.stage.onHover = function (t) { self.hovered(t); };
    root.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); self.back(); return; }
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest) {
        var t = ev.target.closest('[data-node],[data-group]');
        if (t) { ev.preventDefault(); self.clicked(t); }
      }
    });
    canvas.addEventListener('pointerdown', function () { canvas.focus({preventScroll: true}); });
    this.history = [];
    this.state = null;
    var initial = decodeURIComponent((window.location.hash || '').slice(1));
    if (!this.show(initial)) this.show('');
  }

  // ---- chrome -------------------------------------------------------------

  Page.prototype.toolbar = function () {
    var self = this, m = this.model;
    var list = el('datalist', {id: 'ng-names'});
    m.searchIndex.forEach(function (s) { list.appendChild(el('option', {value: s.key})); });
    var search = el('input', {type: 'search', class: 'ng-input', list: 'ng-names',
                              placeholder: 'Find a node or topic…', 'aria-label': 'Find'});
    search.addEventListener('change', function () {
      var id = m.find(search.value);
      if (id) self.go('node=' + id);
      else if (search.value) self.notice('“' + search.value + '” matches no node or topic.');
    });
    var grp = el('select', {class: 'ng-select', 'aria-label': 'Group'},
                 [el('option', {value: '', text: 'Open a group…'})]);
    m.data.groups.forEach(function (g) { grp.appendChild(el('option', {value: g.id, text: g.name + (g.note ? ' — ' + g.note : '')})); });
    grp.addEventListener('change', function () { if (grp.value) self.go('group=' + grp.value); });
    var loop = el('select', {class: 'ng-select', 'aria-label': 'Closed loop'},
                  [el('option', {value: '', text: 'Closed loop…'})]);
    m.data.loops.forEach(function (l) { loop.appendChild(el('option', {value: l.n, text: l.n + ' · ' + l.name})); });
    loop.addEventListener('change', function () { if (loop.value) self.go('loop=' + loop.value); });
    var from = el('input', {type: 'search', class: 'ng-input ng-short', list: 'ng-names',
                            placeholder: 'From', 'aria-label': 'Trace from'});
    var to = el('input', {type: 'search', class: 'ng-input ng-short', list: 'ng-names',
                          placeholder: 'To', 'aria-label': 'Trace to'});
    function runTrace() {
      var a = m.find(from.value), b = m.find(to.value);
      if (a && b) { self.go('trace=' + a + ',' + b); return; }
      self.notice((!a ? '“' + (from.value || 'From') + '”' : '“' + (to.value || 'To') + '”') +
                  ' matches no node or topic. Pick a name from the list.');
    }
    var trace = el('button', {class: 'ng-btn ng-primary', type: 'button', text: 'Trace', onclick: runTrace});
    [from, to].forEach(function (inp) {
      inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') runTrace(); });
    });
    var flow = el('button', {class: 'ng-btn ng-toggle', type: 'button', title: 'Moving data dots'});
    function flowLabel() {
      var on = self.stage && self.stage.flowing;
      flow.textContent = on ? '⏸ Flow' : '▶ Flow';
      flow.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    flow.addEventListener('click', function () {
      self.stage.flowing = !self.stage.flowing;
      self.stage.layer.style.display = self.stage.flowing ? '' : 'none';
      self.root.classList.toggle('ng-still', !self.stage.flowing);
      flowLabel();
    });
    window.setTimeout(flowLabel, 0);
    this.inputs = {search: search, grp: grp, loop: loop, from: from, to: to};
    return el('div', {class: 'ng-toolbar'}, [
      list,
      el('button', {class: 'ng-btn', type: 'button', text: '← Back', title: 'Previous view (Esc goes one level up)',
                    onclick: function () { self.back(true); }}),
      el('button', {class: 'ng-btn', type: 'button', text: '⌂ Overview', onclick: function () { self.go(''); }}),
      search, grp, loop,
      el('span', {class: 'ng-trace'}, [from, el('span', {text: '→'}), to, trace]),
      el('span', {class: 'ng-zoom'}, [
        el('button', {class: 'ng-btn ng-toggle', type: 'button', text: '◨ Details', 'aria-pressed': 'true',
                      title: 'Show or hide the details panel',
                      onclick: function (ev) {
                        var hide = self.root.classList.toggle('ng-nopanel');
                        ev.currentTarget.setAttribute('aria-pressed', hide ? 'false' : 'true');
                        window.setTimeout(function () { self.stage.fit(false); }, 50);
                      }}),
        flow,
        el('button', {class: 'ng-btn', type: 'button', text: '−', title: 'Zoom out',
                      onclick: function () { self.stage.zoomCenter(1.3); }}),
        el('button', {class: 'ng-btn', type: 'button', text: '+', title: 'Zoom in',
                      onclick: function () { self.stage.zoomCenter(1 / 1.3); }}),
        el('button', {class: 'ng-btn', type: 'button', text: '⤢ Fit', title: 'Fit the view',
                      onclick: function () { self.stage.fit(true); }}),
        el('button', {class: 'ng-btn', type: 'button', text: '🔗 Link', title: 'Copy a link to this view',
                      onclick: function () { self.copyLink(); }})
      ])
    ]);
  };

  Page.prototype.legend = function () {
    var cls = this.model.data.classes, box = el('div', {class: 'ng-legend'});
    this.model.data.legend.forEach(function (l) {
      var c = cls[l.cls] || {};
      var sw = el('span', {class: 'ng-swatch' + (l.kind !== 'node' ? ' ng-swatch-topic' : '')});
      sw.style.background = c.fill || '#fff';
      sw.style.borderColor = c.stroke || '#333';
      if (c.dash) sw.style.borderStyle = 'dashed';
      box.appendChild(el('span', {class: 'ng-legend-item'}, [sw, l.text]));
    });
    box.appendChild(el('span', {class: 'ng-legend-item'}, [el('span', {class: 'ng-line ng-line-send'}), 'sends (publishes)']));
    box.appendChild(el('span', {class: 'ng-legend-item'}, [el('span', {class: 'ng-line ng-line-recv'}), 'receives (subscribes)']));
    box.appendChild(el('span', {class: 'ng-legend-item'}, [el('span', {class: 'ng-line'}), 'topic / service']));
    box.appendChild(el('span', {class: 'ng-legend-item'}, [el('span', {class: 'ng-line ng-line-dash'}),
                                                          'transport (UDP, TCP, HTTP, bus)']));
    return box;
  };

  Page.prototype.setCrumbs = function (items) {
    var self = this;
    this.crumbs.innerHTML = '';
    items.forEach(function (it, k) {
      if (k) self.crumbs.appendChild(el('span', {class: 'ng-sep', text: '›'}));
      if (it.hash != null && k < items.length - 1) {
        self.crumbs.appendChild(el('button', {type: 'button', class: 'ng-link', text: it.text,
                                              onclick: function () { self.go(it.hash); }}));
      } else {
        self.crumbs.appendChild(el('b', {text: it.text}));
      }
    });
  };

  // ---- navigation ---------------------------------------------------------

  /** Render a view from its state string ('' | node=ID | group=ID | loop=N | trace=A,B). */
  Page.prototype.show = function (state) {
    var m = this.model, g = /^(node|group|loop|trace)=(.+)$/.exec(state || '');
    this.notice('');
    if (!state) { this.state = ''; this.overview(); this.syncControls(); this.refocus(); return true; }
    if (!g) return false;
    if (g[1] === 'node' && m.nodes[g[2]]) this.focus(g[2]);
    else if (g[1] === 'group' && m.groups[g[2]]) this.group(g[2]);
    else if (g[1] === 'loop' && m.data.loops.some(function (l) { return l.n === g[2]; })) this.loop(g[2]);
    else if (g[1] === 'trace' && g[2].split(',').length === 2 &&
             g[2].split(',').every(function (k) { return m.nodes[k]; })) this.trace.apply(this, g[2].split(','));
    else return false;
    this.state = state;
    this.syncControls();
    this.refocus();
    return true;
  };

  /** Keep keyboard focus in the graph after a view replaced the focused block. */
  Page.prototype.refocus = function () {
    var a = document.activeElement;
    if (!a || a === document.body || !a.isConnected || (this.root.contains(a) && a.closest('.ng-canvas'))) {
      try { this.stage.canvas.focus({preventScroll: true}); } catch (e) { /* old browsers */ }
    }
  };

  Page.prototype.go = function (state) {
    var prev = this.state;
    if (this.show(state) && prev !== null && prev !== this.state) {
      this.history.push(prev);
      if (this.history.length > 100) this.history.shift();
    }
  };

  /** Back: the previous view if `history`, otherwise one level up (Esc). */
  Page.prototype.back = function (history) {
    if (history && this.history.length) { this.show(this.history.pop()); return; }
    var v = this.view || {};
    if (v.kind === 'focus' && this.model.nodes[v.id]) this.go('group=' + this.model.nodes[v.id].group);
    else if (v.kind !== 'overview') this.go('');
  };

  /** Toolbar fields show the current view, never a stale one. */
  Page.prototype.syncControls = function () {
    var v = this.view || {}, m = this.model, inp = this.inputs;
    inp.search.value = v.kind === 'focus' && m.nodes[v.id] ? m.nodes[v.id].display : '';
    inp.grp.value = v.kind === 'group' ? v.id : '';
    inp.loop.value = v.kind === 'loop' ? v.id : '';
    if (v.kind !== 'trace') { inp.from.value = ''; inp.to.value = ''; }
  };

  Page.prototype.notice = function (text) {
    if (!this.note) {
      this.note = el('div', {class: 'ng-notice', role: 'status'});
      this.crumbs.parentNode.insertBefore(this.note, this.crumbs.nextSibling);
    }
    this.note.textContent = text || '';
    this.note.style.display = text ? '' : 'none';
  };

  Page.prototype.copyLink = function () {
    var self = this, link = window.location.href.split('#')[0] + (this.state ? '#' + this.state : '');
    function done(ok) { self.notice(ok ? 'Link copied: ' + link : 'Copy this link: ' + link); }
    try {
      navigator.clipboard.writeText(link).then(function () { done(true); }, function () { done(false); });
    } catch (e) { done(false); }
  };

  Page.prototype.clicked = function (target) {
    if (!target || !target.closest) return;
    var box = target.closest('[data-node]');
    if (box) { this.go('node=' + box.getAttribute('data-node')); return; }
    var card = target.closest('[data-group]');
    if (card) { this.go('group=' + card.getAttribute('data-group')); return; }
    var bundle = target.closest('[data-bundle]');
    if (bundle) { this.bundlePanel(bundle.getAttribute('data-bundle')); return; }
    var edge = target.closest('[data-edge]');
    if (edge) this.edgePanel(+edge.getAttribute('data-edge'));
  };

  Page.prototype.hovered = function (target) {
    if (!this.view || !this.view.hover) return;
    var t = target && target.closest ? target.closest('[data-node],[data-group]') : null;
    var key = t ? (t.getAttribute('data-node') || t.getAttribute('data-group')) : null;
    if (key === this.hoverKey) return;
    this.hoverKey = key;
    this.view.hover(key);
  };

  // ---- drawing primitives ---------------------------------------------------

  Page.prototype.drawBox = function (parent, n, x, y, w, h, opts) {
    opts = opts || {};
    var c = this.model.data.classes[n.cls] || {}, topic = n.kind !== 'node';
    var g = sv('g', {'class': 'ng-box ng-k-' + (n.cls || n.kind) + (opts.ext ? ' ng-ext' : '') +
                     (opts.main ? ' ng-main-box' : ''), 'data-node': n.id, tabindex: '0'}, parent);
    sv('title', {text: n.display + (n.package ? '  (' + n.package + ')' : '') + ' — click to focus'}, g);
    var by = y;
    if (opts.tag && opts.tagBelow) {           // ring view: arrows arrive from above too
      h -= 14;
      sv('text', {x: x + w / 2, y: y + h + 12, 'class': 'ng-tag', 'text-anchor': 'middle', text: opts.tag}, g);
    } else if (opts.tag) {
      sv('text', {x: x + w / 2, y: y + 11, 'class': 'ng-tag', 'text-anchor': 'middle', text: opts.tag}, g);
      by = y + 14;
      h -= 14;
    }
    var r = sv('rect', {x: x, y: by, width: w, height: h, rx: topic ? h / 2 : 7,
                        'class': 'ng-shape'}, g);
    r.style.fill = c.fill || '#fff';
    r.style.stroke = c.stroke || '#334155';
    if (c.dash) r.style.strokeDasharray = '5 3';
    var lines = opts.lines || n.short;
    lines.forEach(function (ln, k) {
      sv('text', {x: x + w / 2, y: by + 19 + k * 17, 'text-anchor': 'middle',
                  'class': 'ng-label' + (opts.main ? ' ng-label-main' : ''), text: ln}, g);
    });
    return g;
  };

  Page.prototype.drawEdge = function (parent, d, e, opts) {
    opts = opts || {};
    var p = sv('path', {d: d, 'class': 'ng-edge' + (e && e.dashed ? ' ng-dashed' : '') +
                        (opts.cls ? ' ' + opts.cls : '')}, parent);
    if (opts.both) p.setAttribute('marker-start', this.stage.markers.none);
    this.stage.setDir(p, opts.dir || null);
    var hit = sv('path', {d: d, 'class': 'ng-hit'}, parent);
    if (e) hit.setAttribute('data-edge', String(e.i));
    if (opts.bundle) hit.setAttribute('data-bundle', opts.bundle);
    if (e && e.label) sv('title', {text: e.label}, hit);
    return p;
  };

  Page.prototype.finish = function (bounds, animate) {
    this.stage.content = bounds;
    this.stage.fit(animate);
  };

  // ---- level 1: overview ------------------------------------------------------

  /**
   * Overview positions: data flows top -> bottom. A group's tier is its layer in the ELK
   * layered layout (layout.json); tiers become rows of at most PER_ROW cards, so the whole
   * overview keeps a screen-like shape and stays readable. Groups that exchange nothing with
   * another group (besides monitoring) form the last row.
   */
  Page.prototype.overviewLayout = function () {
    var m = this.model, lay = m.layout.overview, linked = {};
    Object.keys(lay.bundles).forEach(function (k) {
      var ab = k.split('>');
      linked[ab[0]] = linked[ab[1]] = true;
    });
    var cx = function (g) { var b = lay.nodes[g.id]; return b.x + b.w / 2; };
    var cy = function (g) { var b = lay.nodes[g.id]; return b.y + b.h / 2; };
    var conn = m.data.groups.filter(function (g) { return linked[g.id]; }).sort(function (a, b) { return cx(a) - cx(b); });
    var alone = m.data.groups.filter(function (g) { return !linked[g.id]; });
    var tiers = [], last = -1e9;
    conn.forEach(function (g) {
      if (cx(g) - last > 120 || !tiers.length) tiers.push([]);
      tiers[tiers.length - 1].push(g);
      last = cx(g);
    });
    tiers.forEach(function (t) { t.sort(function (a, b) { return cy(a) - cy(b); }); });
    // Reading order = data-flow order: tier by tier, filled into rows of PER_ROW cards, so the
    // overview keeps the shape of the screen; standalone groups start the last row(s).
    var seq = [];
    tiers.forEach(function (t) { seq = seq.concat(t); });
    var PER_ROW = 5, CW = 250, GX = 46, GY = 74, W = PER_ROW * CW + (PER_ROW - 1) * GX;
    var pos = {}, y = 0, rows = [];
    function cardH(g) {
      return 52 + (g.note ? 14 : 0) + 17 * Math.min(g.lines.length, 5);
    }
    function place(list, standalone) {
      for (var k = 0; k < list.length; k += PER_ROW) {
        var row = list.slice(k, k + PER_ROW);
        var h = Math.max.apply(null, row.map(cardH));
        var x0 = (W - (row.length * CW + (row.length - 1) * GX)) / 2;
        row.forEach(function (g, j) {
          pos[g.id] = {x: x0 + j * (CW + GX), y: y, w: CW, h: cardH(g), row: rows.length};
        });
        rows.push({y: y, h: h, standalone: standalone && k === 0});
        y += h + GY + (standalone ? 0 : 0);
      }
    }
    place(seq, false);
    if (alone.length) { y += 20; place(alone, true); }
    return {pos: pos, width: W, height: y - GY, rows: rows};
  };

  Page.prototype.overview = function () {
    var self = this, m = this.model, lay = m.layout.overview, st = this.stage;
    st.clear();
    this.view = {kind: 'overview'};
    this.setCrumbs([{text: 'Overview — ' + m.data.groups.length + ' groups, data flows top → bottom'}]);
    var L = this.overviewLayout(), pos = L.pos;
    var bgG = sv('g', {}, st.world);
    var edgesG = sv('g', {'class': 'ng-edges'}, st.world);
    var monG = sv('g', {'class': 'ng-edges ng-monitor-edges'}, st.world);
    st.dotsHere();
    var cardsG = sv('g', {}, st.world);
    L.rows.forEach(function (r) {
      if (r.standalone) {
        sv('text', {x: 0, y: r.y - 14, 'class': 'ng-row-note', text: 'Standalone — no data exchanged with other groups'}, bgG);
      }
    });
    // Spread the ends of the bundles along each card edge so they do not overlap.
    var keys = Object.keys(lay.bundles), ends = {};
    function slot(gid, side, key, other) {
      var k = gid + side;
      (ends[k] = ends[k] || []).push({key: key, other: other});
    }
    function sideOf(a, b) {
      if (b.row > a.row) return ['b', 't'];
      if (b.row < a.row) return ['t', 'b'];
      return b.x > a.x ? ['r', 'l'] : ['l', 'r'];
    }
    keys.forEach(function (k) {
      var ab = k.split('>'), a = pos[ab[0]], b = pos[ab[1]], s = sideOf(a, b);
      slot(ab[0], s[0], k, b);
      slot(ab[1], s[1], k, a);
    });
    var anchor = {};
    Object.keys(ends).forEach(function (k) {
      var gid = k.slice(0, -1), side = k.slice(-1), p = pos[gid], list = ends[k];
      list.sort(function (u, v) {
        return side === 'l' || side === 'r' ? u.other.y - v.other.y : u.other.x - v.other.x;
      });
      list.forEach(function (it, i) {
        var f = (i + 1) / (list.length + 1), pt;
        if (side === 't') pt = [p.x + p.w * f, p.y];
        else if (side === 'b') pt = [p.x + p.w * f, p.y + p.h];
        else if (side === 'l') pt = [p.x, p.y + p.h * f];
        else pt = [p.x + p.w, p.y + p.h * f];
        anchor[it.key + '|' + gid] = {pt: pt, side: side};
      });
    });
    function bend(side) {
      return {t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0]}[side];
    }
    var bundles = {};
    keys.forEach(function (k) {
      var b = lay.bundles[k], ab = k.split('>');
      var A = anchor[k + '|' + ab[0]], B = anchor[k + '|' + ab[1]];
      var dA = bend(A.side), dB = bend(B.side);
      var len = Math.max(50, Math.hypot(B.pt[0] - A.pt[0], B.pt[1] - A.pt[1]) / 3);
      var d = 'M' + A.pt[0] + ',' + A.pt[1] + 'C' + (A.pt[0] + dA[0] * len) + ',' + (A.pt[1] + dA[1] * len) + ' ' +
              (B.pt[0] + dB[0] * len) + ',' + (B.pt[1] + dB[1] * len) + ' ' + B.pt[0] + ',' + B.pt[1];
      var dashed = b.edges.every(function (i) { return m.data.edges[i].dashed; });
      var p = self.drawEdge(edgesG, d, {dashed: dashed}, {bundle: k, cls: 'ng-bundle'});
      p.style.strokeWidth = (1.2 + Math.sqrt(b.edges.length) * 0.8).toFixed(1) + 'px';
      var tip = p.nextSibling;   // the wide hit path drawn with it
      sv('title', {text: b.edges.length + ' link(s): ' + m.groups[ab[0]].name + ' → ' + m.groups[ab[1]].name +
                         ' — click for the topics'}, tip);
      bundles[k] = {path: p, from: ab[0], to: ab[1]};
    });
    var cards = {};
    m.data.groups.forEach(function (g) {
      var b = pos[g.id];
      var c = sv('g', {'class': 'ng-card' + (g.monitor ? ' ng-card-monitor' : ''), 'data-group': g.id,
                       tabindex: '0'}, cardsG);
      sv('title', {text: g.title + ' — click to open'}, c);
      sv('rect', {x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, 'class': 'ng-card-bg'}, c);
      sv('text', {x: b.x + 14, y: b.y + 26, 'class': 'ng-card-title', text: g.name.length > 26 ? g.name.slice(0, 25) + '…' : g.name}, c);
      var y = b.y + 44;
      if (g.note) {
        sv('text', {x: b.x + 14, y: y, 'class': 'ng-card-note', text: g.note.length > 40 ? g.note.slice(0, 39) + '…' : g.note}, c);
        y += 14;
      }
      sv('line', {x1: b.x + 10, x2: b.x + b.w - 10, y1: y - 4, y2: y - 4, 'class': 'ng-card-rule'}, c);
      var lines = g.lines.length > 5 ? g.lines.slice(0, 4).concat(['+' + (g.lines.length - 4) + ' more']) : g.lines;
      lines.forEach(function (ln, k) {
        sv('text', {x: b.x + 14, y: y + 13 + k * 17, 'class': 'ng-card-line', text: ln.length > 32 ? ln.slice(0, 31) + '…' : ln}, c);
      });
      cards[g.id] = {el: c, box: b};
    });
    // Monitoring GUIs subscribe to nearly every group: their links appear on hover only.
    var monitorLinks = {};
    m.data.groups.filter(function (g) { return g.monitor; }).forEach(function (g) {
      var peers = {};
      m.data.edges.forEach(function (e) {
        var a = m.nodes[e.from].group, b = m.nodes[e.to].group;
        if (a === g.id && b !== g.id) peers[b] = 'out';
        if (b === g.id && a !== g.id) peers[a] = peers[a] || 'in';
      });
      monitorLinks[g.id] = Object.keys(peers).filter(function (k) { return cards[k]; }).map(function (k) {
        var s = cards[k].box, t = cards[g.id].box, inbound = peers[k] === 'in';
        var from = inbound ? s : t, to = inbound ? t : s;
        var d = 'M' + (from.x + from.w / 2) + ',' + (from.y + from.h / 2) + 'L' + (to.x + to.w / 2) + ',' + (to.y + to.h / 2);
        return {path: self.drawEdge(monG, d, null, {cls: 'ng-monitor'}), peer: k, inbound: inbound};
      });
    });
    this.view.hover = function (gid) {
      var any = !!gid, lit = [];
      Object.keys(cards).forEach(function (k) { cards[k].el.classList.toggle('ng-dim', any && k !== gid); });
      Object.keys(bundles).forEach(function (k) {
        var on = any && (bundles[k].from === gid || bundles[k].to === gid);
        st.setDir(bundles[k].path, on ? (bundles[k].to === gid ? 'recv' : 'send') : null);
        bundles[k].path.classList.toggle('ng-dim', any && !on);
        if (on) {
          lit.push(bundles[k].path);
          cards[bundles[k].from].el.classList.remove('ng-dim');
          cards[bundles[k].to].el.classList.remove('ng-dim');
        }
      });
      Object.keys(monitorLinks).forEach(function (mon) {
        monitorLinks[mon].forEach(function (l) {
          var on = any && (gid === mon || gid === l.peer);
          l.path.classList.toggle('ng-show', on);
          if (on) st.setDir(l.path, l.inbound === (gid === mon) ? 'recv' : 'send');
          if (on && gid === mon) { lit.push(l.path); cards[l.peer].el.classList.remove('ng-dim'); }
        });
      });
      st.setParticles(any ? lit : Object.keys(bundles).map(function (k) { return bundles[k].path; }));
    };
    this.finish({x: -10, y: -30, w: L.width + 20, h: L.height + 40}, false);
    st.setParticles(Object.keys(bundles).map(function (k) { return bundles[k].path; }));
    this.overviewPanel();
  };

  Page.prototype.overviewPanel = function () {
    var self = this, d = this.model.data, p = this.panel;
    var count = function (f) { return d.nodes.filter(f).length; };
    p.innerHTML = '';
    p.appendChild(el('h3', {text: 'All groups'}));
    p.appendChild(el('ul', {class: 'ng-help'}, [
      el('li', {text: 'Each card is a package, firmware or simulation; arrows carry the topics between groups (thicker = more topics). Data flows from the top rows to the bottom rows.'}),
      el('li', {text: 'Hover a card to light its links; click it to open the group, click an arrow to list its topics.'}),
      el('li', {text: 'Find a node, pick a closed loop or trace a path with the toolbar. Esc goes one level up.'})
    ]));
    p.appendChild(el('div', {class: 'ng-counts'}, [
      el('span', {}, [el('b', {text: String(count(function (n) { return n.cls === 'ros' || n.cls === 'mcu'; }))}), ' ROS 2 nodes']),
      el('span', {}, [el('b', {text: String(count(function (n) { return n.kind === 'topic'; }))}), ' topics']),
      el('span', {}, [el('b', {text: String(count(function (n) { return n.kind === 'srv'; }))}), ' services']),
      el('span', {}, [el('b', {text: String(d.edges.length)}), ' links'])
    ]));
    p.appendChild(this.section('Groups', d.groups.map(function (g) {
      return el('li', {}, [el('button', {type: 'button', class: 'ng-link', text: g.name,
                                         onclick: function () { self.go('group=' + g.id); }}),
                           g.note ? el('span', {class: 'ng-muted', text: ' — ' + g.note}) : null]);
    })));
    p.appendChild(this.section('Closed loops', d.loops.map(function (l) {
      return el('li', {}, [el('button', {type: 'button', class: 'ng-link', text: l.n + ' · ' + l.name,
                                         onclick: function () { self.go('loop=' + l.n); }})]);
    })));
  };

  Page.prototype.bundlePanel = function (key) {
    var self = this, m = this.model, b = m.layout.overview.bundles[key];
    if (!b) return;
    var ab = key.split('>'), p = this.panel;
    p.innerHTML = '';
    p.appendChild(el('div', {class: 'ng-kind', text: 'Between groups'}));
    p.appendChild(el('h3', {}, [m.groups[ab[0]].name, ' → ', m.groups[ab[1]].name]));
    p.appendChild(this.section('Links', b.edges.map(function (i) { return self.edgeRow(i); })));
    this.view.hover && this.view.hover(null);
  };

  // ---- level 2: one group ----------------------------------------------------

  Page.prototype.group = function (gid) {
    var self = this, m = this.model, g = m.groups[gid], lay = m.layout[gid], st = this.stage;
    st.clear();
    this.view = {kind: 'group', id: gid};
    this.setCrumbs([{text: 'Overview', hash: ''}, {text: g.name + (g.note ? ' — ' + g.note : '')}]);
    var ext = {};
    lay.external.forEach(function (k) { ext[k] = true; });
    var edgesG = sv('g', {'class': 'ng-edges'}, st.world);
    st.dotsHere();
    var boxesG = sv('g', {}, st.world);
    var edgeEls = {}, boxEls = {};
    Object.keys(lay.edges).forEach(function (k) {
      var e = m.data.edges[+k], nxt = m.data.edges[+k + 1];
      edgeEls[k] = self.drawEdge(edgesG, routePath(lay.edges[k], true), e,
                                 {both: !!(nxt && nxt.rev && nxt.pair === +k)});
    });
    Object.keys(lay.nodes).forEach(function (id) {
      var n = m.nodes[id], b = lay.nodes[id];
      boxEls[id] = self.drawBox(boxesG, n, b.x, b.y, b.w, b.h,
                                {ext: !!ext[id], tag: ext[id] ? (m.groups[n.group] || {name: ''}).name : null});
    });
    this.view.hover = function (id) {
      var lit = [], near = {};
      if (id) near[id] = true;
      Object.keys(edgeEls).forEach(function (k) {
        var e = m.data.edges[+k], on = !!id && (e.from === id || e.to === id);
        st.setDir(edgeEls[k], on ? (e.to === id ? 'recv' : 'send') : null);
        edgeEls[k].classList.toggle('ng-dim', !!id && !on);
        if (on) { lit.push(edgeEls[k]); near[e.from] = near[e.to] = true; }
      });
      Object.keys(boxEls).forEach(function (k) { boxEls[k].classList.toggle('ng-dim', !!id && !near[k]); });
      st.setParticles(lit);
    };
    st.content = {x: 0, y: 0, w: lay.width, h: lay.height};
    st.showReadable(0.8);   // large groups open at a readable size; the map shows the rest
    this.groupPanel(gid, ext);
  };

  Page.prototype.groupPanel = function (gid, ext) {
    var self = this, m = this.model, g = m.groups[gid], p = this.panel;
    p.innerHTML = '';
    p.appendChild(el('div', {class: 'ng-kind', text: 'Group'}));
    p.appendChild(el('h3', {text: g.name}));
    if (g.note) p.appendChild(el('p', {class: 'ng-muted', text: g.note}));
    p.appendChild(el('p', {class: 'ng-help', text: 'Grey boxes belong to other groups (their name above). Click a block to focus on it.'}));
    [['Nodes', g.nodes], ['Topics & services', g.topics]].forEach(function (s) {
      var x = self.section(s[0], s[1].map(function (k) { return el('li', {}, [self.nodeLink(k)]); }));
      if (x) p.appendChild(x);
    });
    if (!g.monitor) {
      var mons = {};
      g.nodes.concat(g.topics).forEach(function (id) {
        m.out[id].concat(m.inn[id]).forEach(function (i) {
          var e = m.data.edges[i];
          [e.from, e.to].forEach(function (k) { if (m.isMonitor(k)) mons[k] = true; });
        });
      });
      var ms = this.section('Also watched by (monitoring, not drawn)', Object.keys(mons).map(function (k) {
        return el('li', {}, [self.nodeLink(k)]);
      }));
      if (ms) p.appendChild(ms);
    }
  };

  // ---- level 3: one node or topic ---------------------------------------------

  Page.prototype.focus = function (id) {
    var self = this, m = this.model, n = m.nodes[id], st = this.stage;
    st.clear();
    this.view = {kind: 'focus', id: id};
    var g = m.groups[n.group] || {name: n.group, id: n.group};
    this.setCrumbs([{text: 'Overview', hash: ''}, {text: g.name, hash: 'group=' + g.id}, {text: n.display}]);

    // Columns: 0 senders, 1 inputs, 2 this block, 3 outputs, 4 receivers.
    var cols = [[], [], [{id: id, main: true}], [], []], placed = {};
    function add(col, nid, extra) {
      var key = col + ':' + nid;
      if (placed[key]) return placed[key];
      var item = Object.assign({id: nid}, extra || {});
      placed[key] = item;
      cols[col].push(item);
      return item;
    }
    var links = [];   // [fromKey, toKey, edge] — into column 2 = received, out of it = sent
    if (n.kind === 'node') {
      m.inn[id].forEach(function (i) {
        var e = m.data.edges[i], f = m.nodes[e.from];
        add(1, f.id);
        links.push(['1:' + f.id, '2:' + id, e]);
        if (f.kind !== 'node') {
          m.inn[f.id].forEach(function (j) {
            var e2 = m.data.edges[j];
            if (e2.from === id) return;
            add(0, e2.from, {under: f.id});
            links.push(['0:' + e2.from, '1:' + f.id, e2]);
          });
        }
      });
      m.out[id].forEach(function (i) {
        var e = m.data.edges[i], t = m.nodes[e.to];
        add(3, t.id);
        links.push(['2:' + id, '3:' + t.id, e]);
        if (t.kind !== 'node') {
          m.out[t.id].forEach(function (j) {
            var e2 = m.data.edges[j];
            if (e2.to === id) return;
            add(4, e2.to, {under: t.id});
            links.push(['3:' + t.id, '4:' + e2.to, e2]);
          });
        }
      });
    } else {
      m.inn[id].forEach(function (i) { var e = m.data.edges[i]; add(1, e.from); links.push(['1:' + e.from, '2:' + id, e]); });
      m.out[id].forEach(function (i) { var e = m.data.edges[i]; add(3, e.to); links.push(['2:' + id, '3:' + e.to, e]); });
    }
    // Senders/receivers sit next to the topic they belong to.
    function order(outer, inner) {
      var pos = {};
      cols[inner].forEach(function (it, k) { pos[it.id] = k; });
      cols[outer].sort(function (a, b) { return (pos[a.under] || 0) - (pos[b.under] || 0); });
    }
    order(0, 1);
    order(4, 3);

    var GAP = 12, COLGAP = 80, x = 0, xs = [], heights = [];
    cols.forEach(function (col, c) {
      var w = 0, h = 0;
      col.forEach(function (it) {
        var nn = m.nodes[it.id];
        it.lines = it.main ? [nn.display].concat(nn.package ? [nn.package] : []) : nn.short;
        it.w = Math.max(nn.w, it.main ? Math.max.apply(null, it.lines.map(function (s) { return s.length; })) * 8.5 + 40 : 0);
        it.h = (it.main ? 18 + 20 * it.lines.length : nn.h) + (c === 2 ? 0 : 14);
        w = Math.max(w, it.w);
        h += it.h + GAP;
      });
      xs.push(x + w / 2);
      heights.push(h);
      x += w + (col.length ? COLGAP : 0);
    });
    var H = Math.max.apply(null, heights);
    var edgesG = sv('g', {'class': 'ng-edges'}, st.world);
    st.dotsHere();
    var boxesG = sv('g', {}, st.world), pos = {};
    cols.forEach(function (col, c) {
      var y = (H - heights[c]) / 2;
      col.forEach(function (it) {
        var nn = m.nodes[it.id], other = nn.group !== n.group && !it.main;
        var gname = (m.groups[nn.group] || {}).name || '';
        var bx = xs[c] - it.w / 2;
        self.drawBox(boxesG, nn, bx, y, it.w, it.h,
                     {main: it.main, lines: it.lines, ext: other, tag: c === 2 ? null : gname});
        var top = y + (c === 2 ? 0 : 14), bh = it.h - (c === 2 ? 0 : 14);
        pos[c + ':' + it.id] = {l: bx, r: bx + it.w, y: top + bh / 2};
        y += it.h + GAP;
      });
    });
    var paths = [];
    links.forEach(function (l) {
      var a = pos[l[0]], b = pos[l[1]];
      if (!a || !b) return;
      var received = +l[1].split(':')[0] <= 2;   // columns 0 -> 1 -> 2 carry what the block receives
      paths.push(self.drawEdge(edgesG, curve(a.r, a.y, b.l, b.y), l[2], {dir: received ? 'recv' : 'send'}));
    });
    // Column headings in the colour of their direction.
    var heads = n.kind === 'node'
      ? [['senders', 'recv'], ['received (subscribes)', 'recv'], ['', null], ['sent (publishes)', 'send'], ['receivers', 'send']]
      : [['', null], ['publishers', 'recv'], ['', null], ['subscribers', 'send'], ['', null]];
    cols.forEach(function (col, c) {
      if (!col.length || !heads[c][0]) return;
      sv('text', {x: xs[c], y: -16, 'text-anchor': 'middle', 'class': 'ng-colhead ng-colhead-' + heads[c][1],
                  text: (heads[c][1] === 'recv' ? '▼ ' : '▲ ') + heads[c][0]}, boxesG);
    });
    if (!links.length) {
      sv('text', {x: xs[2], y: H + 30, 'text-anchor': 'middle', 'class': 'ng-row-note',
                  text: 'No topic, service or link of this block in the graph'}, boxesG);
    }
    this.finish({x: -10, y: -40, w: x - COLGAP + 20, h: H + 80}, false);
    st.setParticles(paths);
    this.view.hover = null;
    this.nodePanel(id);
  };

  // ---- paths: closed loops and traces -------------------------------------------

  /** Point where the segment from a box centre towards (tx, ty) leaves the box. */
  function exitPoint(p, tx, ty) {
    // The group name sits under the box (ring view): links leaving downwards start below it.
    var dx = tx - p.cx, dy = ty - p.cy, hw = p.w / 2 + 4, hh = (p.h - 14) / 2 + (dy > 0 ? 18 : 4);
    var s = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity);
    return [p.cx + dx * s, p.cy + dy * s];
  }

  /** A closed loop as a ring, in the order its edges run (clockwise from the top). */
  /**
   * Ring order of a loop: its longest simple cycle (depth-first over the loop's own edges,
   * at most a dozen blocks), then every block off that cycle right after the block feeding it,
   * so most edges join neighbours on the ring.
   */
  function ringOrder(m, edgeIdx, first) {
    var adj = {}, nodes = [];
    edgeIdx.forEach(function (i) {
      var e = m.data.edges[i];
      (adj[e.from] = adj[e.from] || []).push(e.to);
      [e.from, e.to].forEach(function (k) { if (nodes.indexOf(k) < 0) nodes.push(k); });
    });
    var best = [first];
    (function dfs(path) {
      var u = path[path.length - 1];
      (adj[u] || []).forEach(function (v) {
        if (v === first && path.length > best.length) best = path.slice();
        else if (path.indexOf(v) < 0) dfs(path.concat([v]));
      });
    })([first]);
    var order = best.slice(), guard = 0;
    while (order.length < nodes.length && guard++ < 50) {
      nodes.forEach(function (k) {
        if (order.indexOf(k) >= 0) return;
        var pred = order.filter(function (u) { return (adj[u] || []).indexOf(k) >= 0; })[0];
        var succ = (adj[k] || []).filter(function (v) { return order.indexOf(v) >= 0; })[0];
        if (pred) order.splice(order.indexOf(pred) + 1, 0, k);
        else if (succ) order.splice(order.indexOf(succ), 0, k);
      });
    }
    nodes.forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
    return order;
  }

  Page.prototype.ringView = function (edgeIdx, order) {
    var self = this, m = this.model, st = this.stage;
    order = ringOrder(m, edgeIdx, order[0]);
    var n = order.length;
    var maxW = Math.max.apply(null, order.map(function (k) { return m.nodes[k].w; }));
    var R = Math.max(170, (n * (maxW * 0.55 + 40)) / (2 * Math.PI)), RX = R * 1.35, pos = {};
    order.forEach(function (k, i) {
      var a = -Math.PI / 2 + 2 * Math.PI * i / n, nn = m.nodes[k], h = nn.h + 14;
      var cx = RX * Math.cos(a), cy = R * Math.sin(a);
      pos[k] = {x: cx - nn.w / 2, y: cy - h / 2, w: nn.w, h: h, cx: cx, cy: cy - 7};
    });
    var edgesG = sv('g', {'class': 'ng-edges'}, st.world);
    st.dotsHere();
    var boxesG = sv('g', {}, st.world), paths = [];
    edgeIdx.forEach(function (i) {
      var e = m.data.edges[i], a = pos[e.from], b = pos[e.to];
      var mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2, out = Math.hypot(mx / RX, my / R) || 1;
      var ml = Math.hypot(mx, my) || 1;                    // bow outwards, clear of the boxes
      var ctl = [mx / out * 1.08 + mx / ml * 70, my / out * 1.08 + my / ml * 70];
      var p1 = exitPoint(a, ctl[0], ctl[1]), p2 = exitPoint(b, ctl[0], ctl[1]);
      paths.push(self.drawEdge(edgesG, 'M' + p1[0] + ',' + p1[1] + 'Q' + ctl[0] + ',' + ctl[1] + ' ' + p2[0] + ',' + p2[1],
                               e, {dir: 'flow'}));
    });
    order.forEach(function (k) {
      var p = pos[k], nn = m.nodes[k];
      self.drawBox(boxesG, nn, p.x, p.y, p.w, p.h, {tag: (m.groups[nn.group] || {}).name || '', tagBelow: true});
    });
    sv('text', {x: 0, y: 6, 'text-anchor': 'middle', 'class': 'ng-ring-label', text: '⟳ closed loop'}, boxesG);
    this.finish({x: -RX - maxW / 2 - 30, y: -R - 60, w: 2 * RX + maxW + 60, h: 2 * R + 150}, false);
    st.setParticles(paths);
  };

  Page.prototype.pathView = function (edgeIdx, crumb, cyclic) {
    var self = this, m = this.model, st = this.stage;
    st.clear();
    this.view = this.view || {};
    var order = [];
    edgeIdx.forEach(function (i) {
      var e = m.data.edges[i];
      [e.from, e.to].forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
    });
    if (cyclic && order.length >= 3) {
      this.setCrumbs([{text: 'Overview', hash: ''}, {text: crumb}]);
      this.ringView(edgeIdx, order);
      this.view.hover = null;
      return order;
    }
    var PER_ROW = 4, COLW = 260, ROWH = 130, pos = {}, maxX = 0, maxY = 0;
    order.forEach(function (k, idx) {
      var row = Math.floor(idx / PER_ROW), colI = idx % PER_ROW;
      if (row % 2 === 1) colI = PER_ROW - 1 - colI;   // snake, so consecutive blocks stay adjacent
      var n = m.nodes[k], w = Math.min(n.w, COLW - 40), h = n.h + 14;
      var cx = colI * COLW + COLW / 2, cy = row * ROWH + ROWH / 2;
      pos[k] = {x: cx - w / 2, y: cy - h / 2, w: w, h: h, cx: cx, cy: cy + 7, row: row};
      maxX = Math.max(maxX, (colI + 1) * COLW);
      maxY = Math.max(maxY, (row + 1) * ROWH);
    });
    var edgesG = sv('g', {'class': 'ng-edges'}, st.world);
    st.dotsHere();
    var boxesG = sv('g', {}, st.world), paths = [];
    edgeIdx.forEach(function (i) {
      var e = m.data.edges[i], a = pos[e.from], b = pos[e.to], d;
      if (a.row === b.row) {
        var ltr = b.cx > a.cx;
        var x1 = ltr ? a.x + a.w : a.x, x2 = ltr ? b.x : b.x + b.w;
        var bend = Math.abs(order.indexOf(e.to) - order.indexOf(e.from)) > 1 ? 50 : 0;
        d = 'M' + x1 + ',' + a.cy + 'C' + (x1 + (ltr ? 40 : -40)) + ',' + (a.cy - bend) + ' ' +
            (x2 + (ltr ? -40 : 40)) + ',' + (b.cy - bend) + ' ' + x2 + ',' + b.cy;
      } else {
        var up = b.row < a.row;
        var y1 = up ? a.y + 14 : a.y + a.h, y2 = up ? b.y + b.h : b.y + 14;
        d = 'M' + a.cx + ',' + y1 + 'C' + a.cx + ',' + (y1 + (up ? -50 : 50)) + ' ' + b.cx + ',' +
            (y2 + (up ? 50 : -50)) + ' ' + b.cx + ',' + y2;
      }
      paths.push(self.drawEdge(edgesG, d, e, {dir: 'flow'}));
    });
    order.forEach(function (k) {
      var p = pos[k], n = m.nodes[k];
      self.drawBox(boxesG, n, p.x, p.y, p.w, p.h, {tag: (m.groups[n.group] || {}).name || ''});
    });
    this.setCrumbs([{text: 'Overview', hash: ''}, {text: crumb}]);
    this.finish({x: 0, y: 0, w: maxX, h: maxY}, false);
    st.setParticles(paths);
    this.view.hover = null;
    return order;
  };

  /** Two blocks with no directed path between them: both drawn, the gap stated. */
  Page.prototype.noPathView = function (a, b) {
    var m = this.model, st = this.stage;
    st.clear();
    var boxesG = sv('g', {}, st.world), A = m.nodes[a], B = m.nodes[b];
    this.drawBox(boxesG, A, 0, 0, A.w, A.h + 14, {tag: (m.groups[A.group] || {}).name || ''});
    this.drawBox(boxesG, B, A.w + 260, 0, B.w, B.h + 14, {tag: (m.groups[B.group] || {}).name || ''});
    sv('text', {x: A.w + 130, y: (A.h + 14) / 2 + 12, 'text-anchor': 'middle', 'class': 'ng-nopath', text: '✕ no data path'}, boxesG);
    this.setCrumbs([{text: 'Overview', hash: ''}, {text: 'Trace ' + A.display + ' → ' + B.display}]);
    this.view = {kind: 'trace', hover: null};
    this.finish({x: -20, y: -20, w: A.w + B.w + 300, h: Math.max(A.h, B.h) + 60}, false);
  };

  Page.prototype.loop = function (n) {
    var self = this, m = this.model;
    var l = m.data.loops.filter(function (x) { return x.n === n; })[0];
    if (!l) { this.overview(); return; }
    var crumb = 'Closed loop ' + l.n + ' — ' + l.name;
    this.view = {kind: 'loop', id: n, hover: null};
    if (l.edges.length) this.pathView(l.edges, crumb, true);
    else {
      this.focus(l.nodes[0]);
      this.setCrumbs([{text: 'Overview', hash: ''}, {text: crumb + ' (inside ' + this.model.nodes[l.nodes[0]].display + ')'}]);
    }
    this.view = {kind: 'loop', id: n, hover: null};
    var p = this.panel;
    p.innerHTML = '';
    p.appendChild(el('div', {class: 'ng-kind ng-k-loop', text: 'Closed loop ' + l.n}));
    p.appendChild(el('h3', {text: l.name}));
    p.appendChild(el('p', {class: 'ng-desc'}, [richText(l.path)]));
    p.appendChild(el('p', {}, [el('b', {text: 'Status: '}), richText(l.status)]));
    if (l.edges.length) {
      p.appendChild(this.section('Steps', l.edges.map(function (i) { return self.edgeRow(i); })));
    } else {
      p.appendChild(el('p', {class: 'ng-muted', text: 'Closed inside one block (firmware); the drawing shows that block and its links.'}));
    }
  };

  Page.prototype.trace = function (a, b) {
    var self = this, m = this.model;
    if (!m.nodes[a] || !m.nodes[b]) { this.overview(); return; }
    this.view = {kind: 'trace'};
    this.inputs.from.value = m.nodes[a].display;
    this.inputs.to.value = m.nodes[b].display;
    var path = m.path(a, b), p;
    if (path && path.length) this.pathView(path, 'Trace ' + m.nodes[a].display + ' → ' + m.nodes[b].display, false);
    else this.noPathView(a, b);
    this.view.kind = 'trace';
    p = this.panel;
    p.innerHTML = '';
    p.appendChild(el('div', {class: 'ng-kind', text: 'Trace'}));
    p.appendChild(el('h3', {}, [this.nodeLink(a), ' → ', this.nodeLink(b)]));
    if (!path || !path.length) {
      p.appendChild(el('p', {class: 'ng-warn', text: 'No directed path: data does not flow this way in the graph.'}));
      var back = m.path(b, a);
      if (back) p.appendChild(el('p', {class: 'ng-muted', text: 'There is one in the other direction (' + back.length + ' links).'}));
      return;
    }
    p.appendChild(el('ol', {class: 'ng-steps'}, path.map(function (i) { return self.edgeRow(i); })));
  };

  // ---- side panel -----------------------------------------------------------------

  Page.prototype.nodeLink = function (id) {
    var self = this, n = this.model.nodes[id];
    if (!n) return el('span', {text: id});
    return el('button', {type: 'button', class: 'ng-link', text: n.display,
                         title: (CLASS_LABEL[n.cls] || n.kind) + ' — ' + id,
                         onclick: function () { self.go('node=' + id); }});
  };

  Page.prototype.edgeRow = function (i) {
    var e = this.model.data.edges[i];
    return el('li', {}, [this.nodeLink(e.from), e.rev ? ' ↔ ' : ' → ', this.nodeLink(e.to),
                         e.label ? el('span', {class: 'ng-edge-label', text: ' ' + e.label}) : null]);
  };

  Page.prototype.section = function (title, rows, dir) {
    if (!rows.length) return null;
    return el('section', {class: 'ng-sec' + (dir ? ' ng-sec-' + dir : '')},
              [el('h4', {text: title + ' (' + rows.length + ')'}), el('ul', {}, rows)]);
  };

  Page.prototype.edgePanel = function (i) {
    var e = this.model.data.edges[i], p = this.panel;
    if (!e) return;
    p.innerHTML = '';
    p.appendChild(el('div', {class: 'ng-kind', text: e.dashed ? 'Transport link' : 'Topic / service flow'}));
    p.appendChild(el('ul', {}, [this.edgeRow(i)]));
  };

  Page.prototype.nodePanel = function (id) {
    var self = this, m = this.model, n = m.nodes[id], p = this.panel;
    p.innerHTML = '';
    p.appendChild(el('div', {class: 'ng-kind ng-k-' + (n.cls || n.kind), text: CLASS_LABEL[n.cls] || n.kind}));
    p.appendChild(el('h3', {text: n.display}));
    var meta = [];
    if (n.package) meta.push(el('div', {}, [el('b', {text: 'Package '}), el('code', {text: n.package})]));
    var g = m.groups[n.group];
    if (g) meta.push(el('div', {}, [el('b', {text: 'Group '}), el('button', {type: 'button', class: 'ng-link', text: g.name,
                                     onclick: function () { self.go('group=' + g.id); }})]));
    if (n.package_note) meta.push(el('div', {class: 'ng-muted', text: n.package_note.replace(/[`*]/g, '')}));
    p.appendChild(el('div', {class: 'ng-meta'}, meta));
    var names = {};
    n.names.forEach(function (x) { names[x] = true; });
    var desc = n.label.filter(function (line, k) {
      return !(n.kind !== 'node' && k === 0) && !line.split(/[·\s(]/).some(function (w) { return names[w]; });
    });
    if (desc.length) p.appendChild(el('p', {class: 'ng-desc', text: desc.join(' · ')}));
    function lbl(i) { var t = m.data.edges[i].label; return t ? el('span', {class: 'ng-edge-label', text: ' ' + t}) : null; }
    if (n.kind === 'node') {
      var pub = [], sub = [], srv = [], link = [];
      m.out[id].forEach(function (i) {
        var t = m.nodes[m.data.edges[i].to];
        if (t.kind === 'node') { link.push(el('li', {}, ['→ ', self.nodeLink(t.id), lbl(i)])); return; }
        var to = m.out[t.id].map(function (j) { return self.nodeLink(m.data.edges[j].to); });
        var row = el('li', {}, [self.nodeLink(t.id), lbl(i)]);
        if (to.length) row.appendChild(el('div', {class: 'ng-to'}, ['→ '].concat(joinNodes(to))));
        (t.kind === 'srv' ? srv : pub).push(row);
      });
      m.inn[id].forEach(function (i) {
        var f = m.nodes[m.data.edges[i].from];
        if (f.kind === 'node') { link.push(el('li', {}, ['← ', self.nodeLink(f.id), lbl(i)])); return; }
        var from = m.inn[f.id].map(function (j) { return self.nodeLink(m.data.edges[j].from); });
        var row = el('li', {}, [self.nodeLink(f.id), lbl(i)]);
        if (from.length) row.appendChild(el('div', {class: 'ng-to'}, ['← '].concat(joinNodes(from))));
        (f.kind === 'srv' ? srv : sub).push(row);
      });
      [['Publishes — sends', pub, 'send'], ['Subscribes — receives', sub, 'recv'], ['Services', srv], ['Direct links', link]].forEach(function (s) {
        var x = self.section(s[0], s[1], s[2]);
        if (x) p.appendChild(x);
      });
    } else {
      var pubs = m.inn[id].map(function (i) { return el('li', {}, [self.nodeLink(m.data.edges[i].from), lbl(i)]); });
      var subs = m.out[id].map(function (i) { return el('li', {}, [self.nodeLink(m.data.edges[i].to), lbl(i)]); });
      [[n.kind === 'srv' ? 'Callers / server' : 'Publishers — send', pubs, 'send'],
       [n.kind === 'srv' ? 'Handled by' : 'Subscribers — receive', subs, 'recv']]
        .forEach(function (s) { var x = self.section(s[0], s[1], s[2]); if (x) p.appendChild(x); });
      if (!pubs.length && n.kind === 'topic') p.appendChild(el('p', {class: 'ng-warn', text: 'No publisher in the repositories.'}));
    }
    var loops = m.data.loops.filter(function (l) {
      return l.nodes.indexOf(id) >= 0 || l.edges.some(function (i) { return m.data.edges[i].from === id || m.data.edges[i].to === id; });
    });
    if (loops.length) {
      p.appendChild(this.section('Closed loops', loops.map(function (l) {
        return el('li', {}, [el('button', {type: 'button', class: 'ng-link', text: l.n + ' · ' + l.name,
                                           onclick: function () { self.go('loop=' + l.n); }})]);
      })));
    }
    if (n.diagrams.length) {
      p.appendChild(el('section', {class: 'ng-sec'}, [el('h4', {text: 'Node diagram'})].concat(n.diagrams.map(function (d) {
        return el('a', {class: 'ng-diagram', href: url('images/nodes/' + d + '.svg'), target: '_blank', rel: 'noopener'},
                  [el('img', {src: url('images/nodes/' + d + '.svg'), alt: d, loading: 'lazy'}), el('span', {text: d + '.svg ↗'})]);
      }))));
    }
  };

  // ---------------------------------------------------------------- mounting

  function mount() {
    var root = document.getElementById('node-graph');
    if (!root || root.getAttribute('data-mounted')) return;
    root.setAttribute('data-mounted', '1');
    function get(path) {
      return fetch(url(path), {cache: 'no-cache'}).then(function (r) {
        if (!r.ok) throw new Error(path + ': HTTP ' + r.status);
        return r.json();
      });
    }
    Promise.all([get(DATA), get(LAYOUT)]).then(function (res) {
      new Page(root, res[0], res[1]);
    }).catch(function (err) {
      root.removeAttribute('data-mounted');
      root.innerHTML = '';
      root.appendChild(el('p', {class: 'ng-warn', text: 'The node graph could not be loaded (' + err.message + ').'}));
    });
  }

  if (typeof window.document$ !== 'undefined') window.document$.subscribe(mount);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
