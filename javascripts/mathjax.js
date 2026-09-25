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
 * MathJax for pymdownx.arithmatex (generic mode)
 *
 * MathJax (~1 MB) is loaded on demand, only when the current page contains maths,
 * and pages reached through instant navigation are re-typeset after the swap.
 * Configuration follows the Material for MkDocs reference setup.
 * ============================================================================= */

window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: '.*|',
    processHtmlClass: 'arithmatex'
  }
};

(function () {
  'use strict';

  var MATHJAX_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
  var loading = null;

  function load() {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = MATHJAX_SRC;
        s.async = true;
        s.onload = function () { window.MathJax.startup.promise.then(resolve, reject); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  function typeset() {
    if (!document.querySelector('.arithmatex')) return;
    load().then(function () {
      var mj = window.MathJax;
      mj.startup.output.clearCache();
      mj.typesetClear();
      mj.texReset();
      return mj.typesetPromise();
    }).catch(function (err) {
      console.warn('MathJax failed to load:', err);
    });
  }

  if (typeof window.document$ !== 'undefined') {
    window.document$.subscribe(typeset);
  } else {
    document.addEventListener('DOMContentLoaded', typeset);
  }
})();
