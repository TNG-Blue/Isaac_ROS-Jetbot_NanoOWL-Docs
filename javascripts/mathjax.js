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
