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
 * MathJax Configuration for Isaac ROS Jetbot NanoOWL
 * ============================================================================= */

window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
    packages: {'[+]': ['ams', 'physics', 'color']}
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex"
  },
  svg: {
    fontCache: 'global'
  },
  loader: {
    load: ['[tex]/ams', '[tex]/physics', '[tex]/color']
  }
};

document$.subscribe(() => {
  MathJax.typesetPromise();
});
