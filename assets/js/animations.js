// === animations.js ===
// Modular Animation Controller: handles reveal, parallax, hover effects.
// Exports: window.AnimationControllerClass, window.initializeAnimations(), window.destroyAnimations()

class AnimationController {
    constructor() {
        this.observers = new Map();
        this.scrollHandler = null;
        this.cleanupFns = new Set();
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.injectCSS();
        this.setupRevealObserver();
        this.setupScrollEffects();
        this.setupHoverInteractions();
        this.isInitialized = true;
        console.log('[Animations] initialized');
    }

    destroy() {
        // Disconnect observers
        this.observers.forEach(obs => obs.disconnect && obs.disconnect());
        this.observers.clear();

        // Remove scroll listener / RAF handlers
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler, { passive: true });
            this.scrollHandler = null;
        }

        // Run cleanup functions (remove event listeners attached)
        this.cleanupFns.forEach(fn => {
            try { fn(); } catch (e) { console.warn('[Animations] cleanup fn error', e); }
        });
        this.cleanupFns.clear();

        // Reset animated classes/styles
        document.querySelectorAll('.anim-reveal, .anim-active').forEach(el => {
            el.classList.remove('anim-reveal', 'anim-active');
            el.style.transform = '';
            el.style.transitionDelay = '';
        });

        this.isInitialized = false;
        console.log('[Animations] destroyed');
    }

    // --- Reveal / Intersection ---
    setupRevealObserver() {
        if (this.observers.has('reveal')) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('anim-active');
                    io.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        this.observers.set('reveal', io);

        // Observe typical animation targets
        const nodes = document.querySelectorAll('.animate-fade, .animate-slide, .card, .feature-card');
        nodes.forEach((el, i) => {
            // mark so other systems can find them
            el.classList.add('anim-reveal');
            // small stagger
            el.style.transitionDelay = `${(i % 10) * 0.06}s`;
            io.observe(el);
        });
    }

    // --- Scroll (parallax + header) ---
    setupScrollEffects() {
        const onScroll = (() => {
            let ticking = false;
            return () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    const y = window.pageYOffset || document.documentElement.scrollTop || 0;

                    // parallax elements
                    document.querySelectorAll('[data-parallax]').forEach(el => {
                        const speed = Number(el.dataset.parallax) || 0.5;
                        // use translate3d for better performance
                        el.style.transform = `translate3d(0, ${Math.round(y * speed)}px, 0)`;
                    });

                    // header scrolled class
                    const header = document.querySelector('.md-header');
                    if (header) header.classList.toggle('scrolled', y > 100);

                    ticking = false;
                });
            };
        })();

        this.scrollHandler = onScroll;
        window.addEventListener('scroll', onScroll, { passive: true });
        // keep cleanup to remove later
        this.cleanupFns.add(() => window.removeEventListener('scroll', onScroll));
    }

    // --- Hover interactions (magnetic buttons + card tilt) ---
    setupHoverInteractions() {
        // Buttons magnetic effect
        const btns = Array.from(document.querySelectorAll('.btn, .button'));
        btns.forEach(btn => {
            const onMove = (e) => {
                const r = btn.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * 0.12;
                const dy = (e.clientY - (r.top + r.height / 2)) * 0.12;
                btn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            };
            const onLeave = () => { btn.style.transform = ''; };

            btn.addEventListener('mousemove', onMove);
            btn.addEventListener('mouseleave', onLeave);

            this.cleanupFns.add(() => {
                btn.removeEventListener('mousemove', onMove);
                btn.removeEventListener('mouseleave', onLeave);
            });
        });

        // Card tilt effect
        const cards = Array.from(document.querySelectorAll('.card, .feature-card, .tutorial-card'));
        cards.forEach(card => {
            const onMove = (e) => {
                const r = card.getBoundingClientRect();
                const nx = (e.clientX - r.left) / r.width - 0.5;
                const ny = (e.clientY - r.top) / r.height - 0.5;
                const rx = (ny * 10).toFixed(2);
                const ry = (-nx * 10).toFixed(2);
                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
            };
            const onLeave = () => { card.style.transform = ''; };

            card.addEventListener('mousemove', onMove);
            card.addEventListener('mouseleave', onLeave);

            this.cleanupFns.add(() => {
                card.removeEventListener('mousemove', onMove);
                card.removeEventListener('mouseleave', onLeave);
            });
        });
    }

    // --- Helpers ---
    injectCSS() {
        if (document.getElementById('anim-styles')) return;
        const style = document.createElement('style');
        style.id = 'anim-styles';
        style.textContent = `
            .animate-fade, .animate-slide, .card, .feature-card, .tutorial-card {
                opacity: 0;
                transform: translateY(18px);
                transition: opacity 0.6s ease, transform 0.6s ease;
                will-change: transform, opacity;
            }
            .anim-reveal.anim-active {
                opacity: 1;
                transform: translateY(0);
            }
            .md-header.scrolled {
                backdrop-filter: blur(8px);
                transition: background 0.25s ease, box-shadow 0.25s ease;
            }
            @media (prefers-reduced-motion: reduce) {
                .animate-fade, .animate-slide, .card, .feature-card, .tutorial-card {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Public convenience utilities
    animateOnce(element, animationName = 'fadeIn', duration = 600) {
        // lightweight animate using CSS keyframes if present; fallback to transition
        element.classList.add('anim-active');
        return new Promise(resolve => setTimeout(resolve, duration));
    }
}

// exports
window.AnimationControllerClass = AnimationController;

let __animationControllerInstance = null;

window.initializeAnimations = function() {
    if (__animationControllerInstance) {
        try { __animationControllerInstance.destroy(); } catch (e) { /* ignore */ }
    }
    __animationControllerInstance = new AnimationController();
    __animationControllerInstance.init();
    // expose instance for debugging
    window.__animationController = __animationControllerInstance;
};

window.destroyAnimations = function() {
    if (__animationControllerInstance) {
        __animationControllerInstance.destroy();
        __animationControllerInstance = null;
        window.__animationController = null;
    }
};
