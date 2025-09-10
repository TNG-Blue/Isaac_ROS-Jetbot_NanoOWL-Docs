// === navigation-fix.js ===
// Central Navigation Manager: coordinates initialize/destroy of other modules.
// Exports: window.NavigationManager, window.handleNavigation(), window.initializeNavigationManager()

(function () {
    const NavigationManager = {
        initialized: false,
        isNavigating: false,
        observers: new Map(),
        lastUrl: location.href,
        log: function (...args) { console.log('[NavManager]', ...args); }
    };

    function forceContentVisible() {
        document.querySelectorAll('.page-loader, .loading, .spinner').forEach(el => {
            el.style.display = 'none';
        });
        document.body.style.opacity = '1';
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');

        const main = document.querySelector('[data-md-component="main"], .md-content, main');
        if (main) {
            main.style.opacity = '1';
            main.style.visibility = 'visible';
        }
    }

    function reinitializeSystems() {
        // Destroy/cleanup in safe order, then reinit:
        // 1. Math helpers cleanup (so code copy doesn't duplicate)
        if (typeof window.cleanupMathHelpers === 'function') {
            try { window.cleanupMathHelpers(); } catch (e) { console.warn(e); }
        }

        // 2. Page cleanup
        if (typeof window.cleanupPage === 'function') {
            try { window.cleanupPage(); } catch (e) { console.warn(e); }
        }

        // 3. Destroy animations to avoid duplicate listeners
        if (typeof window.destroyAnimations === 'function') {
            try { window.destroyAnimations(); } catch (e) { console.warn(e); }
        }

        // small delay to allow DOM insertion
        setTimeout(() => {
            // Initialize: animations -> page -> math
            if (typeof window.initializeAnimations === 'function') {
                try { window.initializeAnimations(); } catch (e) { console.warn(e); }
            }

            if (typeof window.initializePage === 'function') {
                try { window.initializePage(); } catch (e) { console.warn(e); }
            }

            if (typeof window.initializeMathSystem === 'function') {
                try { window.initializeMathSystem(); } catch (e) { console.warn(e); }
            }

            // Try typesetting math if available
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise().catch(() => {});
            }

            document.dispatchEvent(new CustomEvent('page:loaded', { detail: { url: location.href } }));
            NavigationManager.log('systems reinitialized for', location.href);
        }, 80);
    }

    function handleNavigation() {
        if (NavigationManager.isNavigating) return;
        NavigationManager.isNavigating = true;
        NavigationManager.log('handling navigation ->', location.href);

        forceContentVisible();
        reinitializeSystems();

        setTimeout(() => {
            NavigationManager.isNavigating = false;
        }, 300);
    }

    function setupMutationDetection() {
        const container = document.querySelector('[data-md-component="container"]') ||
            document.querySelector('[data-md-component="main"]') ||
            document.body;

        if (!container) return;

        const obs = new MutationObserver((mutations) => {
            const significant = mutations.some(m =>
                m.type === 'childList' &&
                Array.from(m.addedNodes).some(n => n.nodeType === 1 && (n.classList?.contains('md-content') || n.querySelector?.('.md-content')))
            );
            if (significant) {
                NavigationManager.log('content mutation detected');
                handleNavigation();
            }
        });

        obs.observe(container, { childList: true, subtree: true });
        NavigationManager.observers.set('content', obs);
    }

    function setupHistoryMonitoring() {
        const origPush = history.pushState;
        const origReplace = history.replaceState;

        history.pushState = function (...args) {
            origPush.apply(history, args);
            setTimeout(() => {
                if (location.href !== NavigationManager.lastUrl) {
                    NavigationManager.lastUrl = location.href;
                    handleNavigation();
                }
            }, 50);
        };

        history.replaceState = function (...args) {
            origReplace.apply(history, args);
            setTimeout(() => {
                if (location.href !== NavigationManager.lastUrl) {
                    NavigationManager.lastUrl = location.href;
                    handleNavigation();
                }
            }, 50);
        };

        window.addEventListener('popstate', () => {
            setTimeout(() => {
                if (location.href !== NavigationManager.lastUrl) {
                    NavigationManager.lastUrl = location.href;
                    handleNavigation();
                }
            }, 50);
        });
    }

    function setupLinkInterception() {
        const intercept = () => {
            document.querySelectorAll('a[href]:not([data-nav-fixed])').forEach(a => {
                const href = a.getAttribute('href') || '';
                // ignore external links
                if (/^(https?:)?\/\//.test(href)) return;
                a.setAttribute('data-nav-fixed', '1');
                a.addEventListener('click', () => {
                    // Slight delay to allow MD navigation to swap content
                    setTimeout(handleNavigation, 90);
                });
            });
        };
        intercept();
        const observer = new MutationObserver(intercept);
        observer.observe(document.body, { childList: true, subtree: true });
        NavigationManager.observers.set('links', observer);
    }

    function setupURLPollingFallback() {
        setInterval(() => {
            if (location.href !== NavigationManager.lastUrl) {
                NavigationManager.lastUrl = location.href;
                NavigationManager.log('url polling detected change');
                handleNavigation();
            }
        }, 300);
    }

    function setupEmergencyRecovery() {
        setTimeout(() => {
            if (getComputedStyle(document.body).opacity === '0' || document.querySelector('.page-loader')) {
                NavigationManager.log('emergency recovery triggered');
                forceContentVisible();
                handleNavigation();
            }
        }, 2000);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && getComputedStyle(document.body).opacity === '0') {
                forceContentVisible();
            }
        });
    }

    function initializeNavigationManager() {
        if (NavigationManager.initialized) return;
        NavigationManager.log('initializing');
        forceContentVisible();
        setupMutationDetection();
        setupHistoryMonitoring();
        setupLinkInterception();
        setupURLPollingFallback();
        setupEmergencyRecovery();

        // initial run
        setTimeout(handleNavigation, 40);

        NavigationManager.initialized = true;
        NavigationManager.log('initialized');
    }

    // Auto-start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNavigationManager);
    } else {
        initializeNavigationManager();
    }

    // Exports
    window.NavigationManager = NavigationManager;
    window.handleNavigation = handleNavigation;
    window.initializeNavigationManager = initializeNavigationManager;
})();
