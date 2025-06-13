// ===== MKDOCS MATERIAL NAVIGATION FIX =====
// This script fixes navigation issues and loading problems

console.log('🔧 Loading navigation fix...');

// ===== GLOBAL STATE MANAGEMENT =====
window.NavigationManager = {
    isNavigating: false,
    currentUrl: location.href,
    initialized: false,
    controllers: new Map(),

    // Debug flags
    DEBUG: true,
    log: function(message, ...args) {
        if (this.DEBUG) {
            console.log(`🚀 [NavManager] ${message}`, ...args);
        }
    }
};

// ===== IMMEDIATE INITIALIZATION HELPER =====
function immediateInit() {
    NavigationManager.log('Immediate initialization started');

    // Remove any existing loading states
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.style.display = 'none';
        NavigationManager.log('Removed page loader');
    }

    // Ensure body is visible
    document.body.style.opacity = '1';
    document.body.style.visibility = 'visible';

    // Add loaded class
    document.body.classList.add('loaded');

    NavigationManager.log('Basic initialization complete');
}

// ===== ENHANCED NAVIGATION DETECTION =====
function setupNavigationDetection() {
    NavigationManager.log('Setting up navigation detection...');

    // Method 1: MutationObserver on main content
    const mainContainer = document.querySelector('[data-md-component="container"]') ||
        document.querySelector('[data-md-component="main"]') ||
        document.querySelector('main') ||
        document.body;

    if (mainContainer) {
        const observer = new MutationObserver((mutations) => {
            let contentChanged = false;
            let significantChange = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for significant content changes
                            if (node.classList?.contains('md-content') ||
                                node.querySelector?.('.md-content') ||
                                node.classList?.contains('md-main') ||
                                node.tagName === 'ARTICLE') {
                                significantChange = true;
                                contentChanged = true;
                            }
                        }
                    });
                }

                // Also check for attribute changes that might indicate navigation
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-md-state') {
                    contentChanged = true;
                }
            });

            if (contentChanged) {
                NavigationManager.log('Content change detected', { significantChange });
                handleNavigation();
            }
        });

        observer.observe(mainContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-md-state']
        });

        NavigationManager.controllers.set('mainObserver', observer);
        NavigationManager.log('Main container observer setup complete');
    }

    // Method 2: History API monitoring
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
        NavigationManager.log('History pushState detected');
        originalPushState.apply(history, args);
        setTimeout(handleNavigation, 50);
    };

    history.replaceState = function(...args) {
        NavigationManager.log('History replaceState detected');
        originalReplaceState.apply(history, args);
        setTimeout(handleNavigation, 50);
    };

    // Method 3: Popstate event
    window.addEventListener('popstate', () => {
        NavigationManager.log('Popstate event detected');
        setTimeout(handleNavigation, 50);
    });

    // Method 4: URL polling (fallback)
    setInterval(() => {
        if (location.href !== NavigationManager.currentUrl) {
            NavigationManager.log('URL change detected via polling');
            NavigationManager.currentUrl = location.href;
            handleNavigation();
        }
    }, 200);

    // Method 5: Document ready state monitoring
    const checkReadyState = () => {
        if (document.readyState === 'complete') {
            NavigationManager.log('Document ready state: complete');
            setTimeout(handleNavigation, 100);
        }
    };

    document.addEventListener('readystatechange', checkReadyState);

    NavigationManager.log('All navigation detection methods setup');
}

// ===== NAVIGATION HANDLER =====
function handleNavigation() {
    if (NavigationManager.isNavigating) {
        NavigationManager.log('Navigation already in progress, skipping');
        return;
    }

    NavigationManager.isNavigating = true;
    NavigationManager.log('Navigation handler started');

    // Immediate fixes
    immediateInit();

    // Wait for potential async content loading
    setTimeout(() => {
        try {
            // Reinitialize animations if available
            if (typeof window.initializeAnimations === 'function') {
                NavigationManager.log('Reinitializing animations');
                window.initializeAnimations();
            }

            // Reinitialize custom scripts if available
            if (typeof window.initializePage === 'function') {
                NavigationManager.log('Reinitializing page');
                window.initializePage();
            }

            // Reinitialize math if available
            if (typeof window.initializeMathSystem === 'function') {
                NavigationManager.log('Reinitializing math system');
                window.initializeMathSystem();
            }

            // Reinitialize MathJax if available
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                NavigationManager.log('Reinitializing MathJax');
                MathJax.typesetPromise().catch(err => {
                    NavigationManager.log('MathJax error:', err);
                });
            }

            // Generic initialization trigger
            document.dispatchEvent(new CustomEvent('page:loaded', {
                detail: { url: location.href }
            }));

            NavigationManager.log('Navigation handler completed successfully');

        } catch (error) {
            NavigationManager.log('Error during navigation handling:', error);
        } finally {
            NavigationManager.isNavigating = false;
        }
    }, 150);
}

// ===== FORCE INITIALIZATION =====
function forceInitialization() {
    NavigationManager.log('Force initialization started');

    // Ensure no loading screens are blocking
    const loadingElements = document.querySelectorAll('.page-loader, .loading, .spinner, [class*="load"]');
    loadingElements.forEach(el => {
        if (getComputedStyle(el).position === 'fixed' ||
            getComputedStyle(el).position === 'absolute') {
            el.style.display = 'none';
            NavigationManager.log('Removed loading element:', el.className);
        }
    });

    // Ensure main content is visible
    const mainContent = document.querySelector('[data-md-component="main"]') ||
        document.querySelector('.md-content') ||
        document.querySelector('main');

    if (mainContent) {
        mainContent.style.opacity = '1';
        mainContent.style.visibility = 'visible';
        mainContent.style.display = '';
        NavigationManager.log('Main content made visible');
    }

    // Remove any transform/transition that might hide content
    document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (style.transform !== 'none' && style.transform.includes('translate')) {
            if (style.opacity === '0' || style.visibility === 'hidden') {
                el.style.transform = 'none';
                el.style.opacity = '1';
                el.style.visibility = 'visible';
            }
        }
    });

    NavigationManager.log('Force initialization completed');
}

// ===== MATERIAL MKDOCS SPECIFIC FIXES =====
function setupMaterialMkDocsFixes() {
    NavigationManager.log('Setting up Material MkDocs specific fixes');

    // Override Material's navigation if it's causing issues
    const interceptMaterialNav = () => {
        const navLinks = document.querySelectorAll('a[href]:not([href^="http"]):not([href^="mailto"]):not([href^="tel"])');

        navLinks.forEach(link => {
            if (!link.hasAttribute('data-nav-fixed')) {
                link.setAttribute('data-nav-fixed', 'true');

                link.addEventListener('click', (e) => {
                    NavigationManager.log('Navigation link clicked:', link.href);

                    // Let the default navigation happen
                    setTimeout(() => {
                        handleNavigation();
                    }, 100);
                });
            }
        });
    };

    // Run immediately and after content changes
    interceptMaterialNav();

    // Setup observer for new navigation links
    const navObserver = new MutationObserver(() => {
        interceptMaterialNav();
    });

    navObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    NavigationManager.controllers.set('navObserver', navObserver);
}

// ===== EMERGENCY RECOVERY =====
function setupEmergencyRecovery() {
    // If page is stuck loading for too long, force show content
    setTimeout(() => {
        if (document.body.style.opacity === '0' ||
            document.querySelector('.page-loader:not([style*="display: none"])')) {

            NavigationManager.log('Emergency recovery triggered - page stuck loading');
            forceInitialization();
            handleNavigation();
        }
    }, 3000);

    // Recovery on visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            NavigationManager.log('Page became visible, checking state');
            setTimeout(() => {
                if (document.body.style.opacity === '0') {
                    forceInitialization();
                }
            }, 100);
        }
    });
}

// ===== INITIALIZATION SEQUENCE =====
function initializeNavigationManager() {
    if (NavigationManager.initialized) {
        NavigationManager.log('Already initialized, skipping');
        return;
    }

    NavigationManager.log('Initializing Navigation Manager...');

    // Step 1: Immediate fixes
    immediateInit();

    // Step 2: Setup navigation detection
    setupNavigationDetection();

    // Step 3: Material MkDocs specific fixes
    setupMaterialMkDocsFixes();

    // Step 4: Emergency recovery
    setupEmergencyRecovery();

    // Step 5: Initial navigation handle
    setTimeout(() => {
        handleNavigation();
    }, 100);

    NavigationManager.initialized = true;
    NavigationManager.log('Navigation Manager initialization complete');
}

// ===== AUTO-START =====
// Start immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigationManager);
} else {
    initializeNavigationManager();
}

// Also try to start immediately regardless of ready state
setTimeout(initializeNavigationManager, 50);

// ===== CLEANUP FUNCTION =====
window.cleanupNavigationManager = function() {
    NavigationManager.log('Cleaning up Navigation Manager');

    NavigationManager.controllers.forEach((controller, name) => {
        if (controller && typeof controller.disconnect === 'function') {
            controller.disconnect();
            NavigationManager.log(`Disconnected ${name}`);
        }
    });

    NavigationManager.controllers.clear();
    NavigationManager.initialized = false;
};

// ===== GLOBAL ACCESS =====
window.NavigationManager = NavigationManager;
window.handleNavigation = handleNavigation;
window.forceInitialization = forceInitialization;

NavigationManager.log('Navigation fix script loaded successfully');

// ===== ADDITIONAL DEBUGGING =====
if (NavigationManager.DEBUG) {
    // Log all navigation events
    ['click', 'popstate', 'hashchange', 'beforeunload'].forEach(event => {
        window.addEventListener(event, (e) => {
            if (event === 'click' && e.target.tagName === 'A') {
                NavigationManager.log(`${event} event:`, e.target.href);
            } else if (event !== 'click') {
                NavigationManager.log(`${event} event`);
            }
        });
    });

    // Log document ready state changes
    const logReadyState = () => {
        NavigationManager.log('Document ready state:', document.readyState);
    };

    document.addEventListener('readystatechange', logReadyState);
    logReadyState();
}