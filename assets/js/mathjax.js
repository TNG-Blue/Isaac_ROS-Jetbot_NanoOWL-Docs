// === mathjax.js ===
// Configures MathJax, exposes initializeMathSystem() and cleanupMathHelpers()
// Exports: window.initializeMathSystem(), window.cleanupMathHelpers(), window.EquationRenderer

// NOTE: this script assumes MathJax library is loaded separately or via CDN.
// If MathJax is not present, the config will still register window.MathJax for later use.

(function () {
    // Basic MathJax config object (safe to reassign)
    window.MathJax = window.MathJax || {};
    window.MathJax = Object.assign(window.MathJax, {
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            processEscapes: true,
            macros: {
                vec: ['\\mathbf{#1}', 1],
                mat: ['\\mathbf{#1}', 1],
                pose: ['\\mathbf{T}'],
                rotation: ['\\mathbf{R}'],
                translation: ['\\mathbf{t}'],
                quaternion: ['\\mathbf{q}'],
                transform: ['{}^{#1}\\mathbf{T}_{#2}', 2],
                omega: ['\\boldsymbol{\\omega}'],
                norm: ['\\left\\|#1\\right\\|', 1],
                reals: ['\\mathbb{R}'],
                SE: ['\\text{SE}(#1)', 1],
                SO: ['\\text{SO}(#1)', 1]
            },
            tags: 'ams',
            packages: { '[+]': ['ams'] }
        },
        svg: {
            fontCache: 'global',
            scale: 1
        },
        options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        },
        startup: {
            pageReady: () => {
                // math will be typeset by caller when needed
                try {
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        window.MathJax.typesetPromise();
                    }
                } catch (e) { /* ignore */ }
            }
        }
    });

    // --- Math helpers state ---
    let _initialized = false;

    function addMathStyles() {
        if (document.getElementById('math-styles')) return;
        const s = document.createElement('style');
        s.id = 'math-styles';
        s.textContent = `
            .equation-container {
                margin: 1.6rem 0;
                padding: 1rem;
                border-radius: 6px;
                background: var(--md-code-bg-color);
                border: 1px solid var(--md-default-fg-color--lightest);
            }
            .equation-number { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); font-size: 0.95em; opacity: 0.85; }
            .math-copy-btn { cursor: pointer; border: none; border-radius: 3px; padding: 4px 6px; }
        `;
        document.head.appendChild(s);
    }

    function initializeMathHelpers() {
        addMathStyles();
        addEquationCopyButtons();
        addEquationNumbering();
    }

    function addEquationCopyButtons() {
        document.querySelectorAll('.MathJax:not([data-ltx-copy])').forEach(el => {
            el.setAttribute('data-ltx-copy', '1');
            el.style.position = el.style.position || 'relative';

            const btn = document.createElement('button');
            btn.className = 'math-copy-btn';
            btn.title = 'Copy LaTeX';
            btn.textContent = '📋';
            btn.style.cssText = 'position:absolute; right:0.25rem; top:0.25rem; z-index:50;';

            btn.addEventListener('click', async (ev) => {
                ev.stopPropagation();
                try {
                    const script = el.querySelector('script[type="math/tex"]');
                    const latex = script ? script.textContent : el.textContent;
                    await navigator.clipboard.writeText(latex.trim());
                    btn.textContent = '✅';
                    setTimeout(() => btn.textContent = '📋', 1200);
                } catch (err) {
                    console.error('[MathJax] copy failed', err);
                }
            });

            el.appendChild(btn);
        });
    }

    function addEquationNumbering() {
        let eqNo = 1;
        document.querySelectorAll('.MathJax_Display:not([data-numbered])').forEach(el => {
            el.setAttribute('data-numbered', '1');
            if (!el.hasAttribute('data-number')) {
                // only number if explicitly marked (keep non-invasive)
                return;
            }
            el.style.position = el.style.position || 'relative';
            const span = document.createElement('span');
            span.className = 'equation-number';
            span.textContent = `(${eqNo})`;
            el.appendChild(span);
            el.id = el.id || `eq-${eqNo}`;
            eqNo++;
        });
    }

    // Public API
    function initializeMathSystem() {
        if (_initialized) return;
        initializeMathHelpers();
        _initialized = true;
        console.log('[Math] initialized');
    }

    function cleanupMathHelpers() {
        document.querySelectorAll('.math-copy-btn').forEach(b => b.remove());
        document.querySelectorAll('.equation-number').forEach(n => n.remove());
        document.querySelectorAll('[data-ltx-copy]').forEach(el => el.removeAttribute('data-ltx-copy'));
        _initialized = false;
        console.log('[Math] helpers cleaned up');
    }

    // EquationRenderer convenience class
    class EquationRenderer {
        constructor() {
            this.common = {
                transformationMatrix: {
                    latex: '\\mathbf{T} = \\begin{bmatrix} \\mathbf{R} & \\mathbf{t} \\\\ \\mathbf{0}^T & 1 \\end{bmatrix}',
                    description: 'Homogeneous transformation matrix'
                },
                pidController: {
                    latex: 'u(t) = K_p e(t) + K_i \\int_0^t e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}',
                    description: 'PID controller'
                }
            };
        }

        render(key, containerId) {
            const eq = this.common[key];
            const container = document.getElementById(containerId);
            if (!eq || !container) return;
            container.innerHTML = `
                <div class="equation-container">
                    <div class="equation-latex">$$${eq.latex}$$</div>
                    <div class="equation-desc">${eq.description}</div>
                </div>
            `;
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([container]).then(() => initializeMathHelpers()).catch(() => initializeMathHelpers());
            } else {
                initializeMathHelpers();
            }
        }
    }

    // Exports
    window.initializeMathSystem = initializeMathSystem;
    window.cleanupMathHelpers = cleanupMathHelpers;
    window.EquationRenderer = EquationRenderer;
})();
