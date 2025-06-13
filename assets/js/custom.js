// ===== MKDOCS MATERIAL NAVIGATION COMPATIBILITY =====
// Global state to track initialization
let isInitialized = false;
let observers = new Map();
let animations = {
    controller: null,
    perfMonitor: null
};

// ===== CLEANUP FUNCTION =====
function cleanupPreviousPage() {
    // Disconnect all observers
    observers.forEach(observer => {
        if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
        }
    });
    observers.clear();

    // Clear any existing animations
    document.querySelectorAll('.reveal, .reveal-stagger, .active').forEach(el => {
        el.classList.remove('reveal', 'reveal-stagger', 'active');
        el.style.cssText = '';
    });

    // Remove dynamic elements
    document.querySelectorAll('.particle, .particles, .copy-button, .math-copy-btn').forEach(el => {
        el.remove();
    });

    console.log('🧹 Previous page cleaned up');
}

// ===== MAIN INITIALIZATION FUNCTION =====
function initializePage() {
    console.log('🚀 Initializing page animations...');

    // Cleanup first
    cleanupPreviousPage();

    // Initialize all features
    setupIntersectionObservers();
    setupSmoothScrolling();
    setupProgressBars();
    setupHoverEffects();
    setupScrollEffects();
    setupLazyLoading();
    setupThemeTransitions();
    setupCodeCopyButtons();
    setupSearchEnhancements();
    setupAccessibility();
    setupParticleSystem();
    initializePerformanceMonitor();

    console.log('✅ Page initialization complete');
}

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
function setupIntersectionObservers() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    observers.set('reveal', revealObserver);

    // Observe all elements with reveal classes
    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
    revealElements.forEach(el => revealObserver.observe(el));

    // Add reveal classes to feature cards and tutorial cards
    const featureCards = document.querySelectorAll('.feature-card');
    const tutorialCards = document.querySelectorAll('.tutorial-card');
    const steps = document.querySelectorAll('.step');

    featureCards.forEach((card, index) => {
        card.classList.add('reveal-stagger');
        card.style.transitionDelay = `${index * 0.1}s`;
        revealObserver.observe(card);
    });

    tutorialCards.forEach((card, index) => {
        card.classList.add('reveal-stagger');
        card.style.transitionDelay = `${index * 0.1}s`;
        revealObserver.observe(card);
    });

    steps.forEach((step, index) => {
        step.classList.add('reveal');
        revealObserver.observe(step);
    });
}

// ===== SMOOTH SCROLLING FOR ANCHOR LINKS =====
function setupSmoothScrolling() {
    // Remove previous listeners by cloning elements (if any)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        // Remove existing event listeners by cloning
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== PROGRESS BAR ANIMATION =====
function setupProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');

    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.getAttribute('data-width') || '100%';

                setTimeout(() => {
                    progressBar.style.width = targetWidth;
                }, 200);
            }
        });
    });

    observers.set('progress', progressObserver);
    progressBars.forEach(bar => progressObserver.observe(bar));
}

// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(container, options = {}) {
        this.container = container;
        this.particles = [];
        this.animationId = null;
        this.options = {
            count: options.count || 50,
            speed: options.speed || 2,
            size: options.size || 2,
            color: options.color || '#2563eb',
            ...options
        };

        this.init();
    }

    init() {
        // Create particles container
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        `;
        this.container.appendChild(particlesContainer);

        // Create particles
        for (let i = 0; i < this.options.count; i++) {
            this.createParticle(particlesContainer);
        }
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position and properties
        const size = Math.random() * this.options.size + 1;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: ${this.options.color};
            border-radius: 50%;
            animation: floatUp ${animationDuration}s ${delay}s infinite linear;
            opacity: 0.7;
        `;

        container.appendChild(particle);

        // Remove and recreate particle when animation ends
        particle.addEventListener('animationend', () => {
            if (particle.parentNode) {
                particle.remove();
                this.createParticle(container);
            }
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        const particleContainer = this.container.querySelector('.particles');
        if (particleContainer) {
            particleContainer.remove();
        }
    }
}

// ===== ENHANCED HOVER EFFECTS =====
function setupHoverEffects() {
    // Add magnetic effect to buttons
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        // Clone to remove previous listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            this.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });

        newButton.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Add tilt effect to cards
    const cards = document.querySelectorAll('.feature-card, .tutorial-card');

    cards.forEach(card => {
        // Clone to remove previous listeners
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        newCard.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        newCard.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// ===== SCROLL EFFECTS =====
function setupScrollEffects() {
    let ticking = false;

    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax');

        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });

        // Update progress bar if exists
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            const winHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            const progress = scrolled / (docHeight - winHeight);
            progressBar.style.width = `${progress * 100}%`;
        }

        ticking = false;
    }

    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }

    // Remove previous scroll listeners
    window.removeEventListener('scroll', window.currentScrollHandler);
    window.currentScrollHandler = requestScrollUpdate;
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
}

// ===== LAZY LOADING IMAGES =====
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        observers.set('images', imageObserver);

        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

// ===== THEME TOGGLE ENHANCEMENTS =====
function setupThemeTransitions() {
    // Remove previous theme observer
    if (observers.has('theme')) {
        observers.get('theme').disconnect();
    }

    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-md-color-scheme') {
                document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            }
        });
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-md-color-scheme']
    });

    observers.set('theme', themeObserver);
}

// ===== COPY CODE BUTTON ENHANCEMENT =====
function setupCodeCopyButtons() {
    // Remove existing copy buttons
    document.querySelectorAll('.copy-button').forEach(btn => btn.remove());

    const codeBlocks = document.querySelectorAll('pre code');

    codeBlocks.forEach(block => {
        const pre = block.parentElement;
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '📋';
        button.title = 'Copy code';
        button.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--md-primary-fg-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        `;

        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(block.textContent);
                button.innerHTML = '✅';
                button.title = 'Copied!';

                setTimeout(() => {
                    button.innerHTML = '📋';
                    button.title = 'Copy code';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });

        pre.style.position = 'relative';
        pre.appendChild(button);
    });
}

// ===== SEARCH ENHANCEMENTS =====
function setupSearchEnhancements() {
    const searchInput = document.querySelector('[data-md-component="search-query"]');

    if (searchInput) {
        // Remove previous listener
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);

        newSearchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const results = document.querySelectorAll('[data-md-component="search-result"]');

            results.forEach(result => {
                const text = result.textContent.toLowerCase();
                if (text.includes(query) && query.length > 0) {
                    result.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                } else {
                    result.style.backgroundColor = '';
                }
            });
        });
    }
}

// ===== PARTICLE SYSTEM SETUP =====
function setupParticleSystem() {
    // Clean up existing particle systems
    document.querySelectorAll('.particles').forEach(particles => particles.remove());

    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        new ParticleSystem(heroSection, {
            count: 30,
            speed: 1,
            size: 3,
            color: 'rgba(255, 255, 255, 0.6)'
        });
    }
}

// ===== PERFORMANCE MONITORING =====
function initializePerformanceMonitor() {
    if (!animations.perfMonitor) {
        animations.perfMonitor = new PerformanceMonitor();
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Monitor animation performance
        this.measureAnimationPerformance();
    }

    measureAnimationPerformance() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 16.67) {
                        console.warn(`Slow animation detected: ${entry.name} took ${entry.duration}ms`);
                    }
                });
            });

            observer.observe({ entryTypes: ['measure'] });
        }
    }

    getMetrics() {
        return this.metrics;
    }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
function setupAccessibility() {
    // Add skip link if not exists
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--md-primary-fg-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.3s ease;
        `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Remove previous keyboard listeners
    document.removeEventListener('keydown', window.keyboardHandler);
    document.removeEventListener('mousedown', window.mouseHandler);

    window.keyboardHandler = (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    };

    window.mouseHandler = () => {
        document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', window.keyboardHandler);
    document.addEventListener('mousedown', window.mouseHandler);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== MKDOCS MATERIAL NAVIGATION HOOKS =====
// Listen for Material for MkDocs navigation events
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Setting up MkDocs Material navigation hooks...');

    // Initial page load
    initializePage();

    // Hook into Material's navigation system
    const nav = document.querySelector('[data-md-component="navigation"]');
    if (nav) {
        // Use MutationObserver to detect content changes
        const navObserver = new MutationObserver(debounce(() => {
            console.log('📄 Navigation detected, reinitializing...');
            setTimeout(initializePage, 100); // Small delay to ensure content is loaded
        }, 150));

        navObserver.observe(document.querySelector('[data-md-component="main"]') || document.body, {
            childList: true,
            subtree: true
        });

        observers.set('navigation', navObserver);
    }

    // Also listen for location changes (fallback)
    let currentLocation = location.href;
    const locationCheckInterval = setInterval(() => {
        if (location.href !== currentLocation) {
            currentLocation = location.href;
            console.log('🔄 Location changed, reinitializing...');
            setTimeout(initializePage, 200);
        }
    }, 500);

    // Store interval for cleanup
    window.locationCheckInterval = locationCheckInterval;
});

// ===== CSS ANIMATIONS =====
document.addEventListener('DOMContentLoaded', function() {
    if (!document.querySelector('#custom-animations-css')) {
        const style = document.createElement('style');
        style.id = 'custom-animations-css';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 0;
                    transform: translateY(100vh) scale(0);
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                    transform: translateY(-100px) scale(1);
                }
            }
            
            .reveal, .reveal-stagger {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .reveal.active, .reveal-stagger.active {
                opacity: 1;
                transform: translateY(0);
            }
            
            .keyboard-navigation *:focus {
                outline: 2px solid var(--md-accent-fg-color) !important;
                outline-offset: 2px;
            }
            
            .copy-button:hover {
                opacity: 1 !important;
                transform: scale(1.1);
            }
            
            img {
                transition: opacity 0.3s ease;
            }
            
            .lazy {
                opacity: 0;
            }
            
            .particle {
                z-index: 1;
            }
        `;
        document.head.appendChild(style);
    }
});

// Make utility functions globally available
window.debounce = debounce;
window.throttle = throttle;
window.initializePage = initializePage;

console.log('🎨 Custom navigation-compatible script loaded!');