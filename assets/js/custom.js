// === custom.js ===
// Page-level features: smooth scrolling, code copy buttons, debounce, small scroll helpers.
// Exports: window.initializePage(), window.cleanupPage(), window.debounce

(function () {
    // Local state
    let observers = new Map();
    let initialized = false;

    // --- Cleanup ---
    function cleanupPage() {
        // disconnect observers
        observers.forEach((obs) => obs.disconnect && obs.disconnect());
        observers.clear();

        // remove any copy buttons created by this module
        document.querySelectorAll('.code-copy-btn').forEach(btn => btn.remove());

        // reset any inline styles we added (safe minimal reset)
        document.querySelectorAll('[data-custom-style]').forEach(el => {
            el.removeAttribute('data-custom-style');
            el.style.cssText = '';
        });

        initialized = false;
        console.log('[Page] cleaned up');
    }

    // --- Smooth anchor scrolling ---
    function setupSmoothScrolling() {
        // attach once
        const handler = (e) => {
            const a = e.currentTarget;
            const href = a.getAttribute('href') || '';
            if (!href.startsWith('#')) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState && history.replaceState({}, '', href);
        };

        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', handler);
            // record for cleanup
            observers.set(a, { disconnect: () => a.removeEventListener('click', handler) });
        });
    }

    // --- Code copy buttons for <pre><code> blocks ---
    function setupCodeCopyButtons() {
        document.querySelectorAll('pre code').forEach(code => {
            // avoid duplicates
            const pre = code.parentElement;
            if (!pre || pre.querySelector('.code-copy-btn')) return;

            const btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.type = 'button';
            btn.title = 'Copy code';
            btn.textContent = '📋';
            btn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                border: none;
                border-radius: 4px;
                padding: 4px 6px;
                background: var(--md-primary-fg-color);
                color: white;
                cursor: pointer;
                z-index: 5;
                opacity: 0.9;
            `;

            pre.style.position = pre.style.position || 'relative';
            pre.appendChild(btn);

            const onClick = async (ev) => {
                ev.preventDefault();
                try {
                    await navigator.clipboard.writeText(code.textContent);
                    btn.textContent = '✅';
                    setTimeout(() => btn.textContent = '📋', 1400);
                } catch (err) {
                    console.error('[Page] copy failed', err);
                    btn.textContent = '❌';
                    setTimeout(() => btn.textContent = '📋', 1400);
                }
            };

            btn.addEventListener('click', onClick);
            // record for cleanup
            observers.set(btn, { disconnect: () => btn.removeEventListener('click', onClick) });
        });
    }

    // --- Header sticky behavior kept minimal (animations handles class toggling on scroll) ---
    function setupHeaderFallback() {
        // in case js wants to ensure header visible if page stuck
        const header = document.querySelector('.md-header');
        if (!header) return;
        header.style.willChange = 'transform, opacity';
        // mark to allow cleanup
        header.setAttribute('data-custom-style', 'true');
    }

    // --- public init ---
    function initializePage() {
        if (initialized) return;
        cleanupPage();
        setupSmoothScrolling();
        setupCodeCopyButtons();
        setupHeaderFallback();
        initialized = true;
        console.log('[Page] initialized');
    }

    // --- debounce util (export) ---
    function debounce(fn, wait = 150) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    // Exports
    window.initializePage = initializePage;
    window.cleanupPage = cleanupPage;
    window.debounce = debounce;
})();
