// ===== ADVANCED ANIMATION CONTROLLER WITH NAVIGATION SUPPORT =====
class AnimationController {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.observers = new Map();
        this.isInitialized = false;
        this.cleanup = new Set(); // Track cleanup functions
        this.activeAnimations = new Set();
        this.particleSystems = new Map();
    }

    // ===== MAIN INITIALIZATION =====
    init() {
        if (this.isInitialized) {
            this.destroy(); // Clean up previous initialization
        }

        console.log('🎬 Initializing Animation Controller...');

        this.setupIntersectionObservers();
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        this.setupLoadAnimations();
        this.setupParticleSystem();
        this.setupTextAnimations();
        this.isInitialized = true;

        console.log('✅ Animation Controller initialized successfully');
    }

    // ===== CLEANUP METHOD =====
    destroy() {
        console.log('🧹 Cleaning up Animation Controller...');

        // Disconnect all observers
        this.observers.forEach((observer, key) => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        this.observers.clear();

        // Run all cleanup functions
        this.cleanup.forEach(cleanupFn => {
            try {
                cleanupFn();
            } catch (error) {
                console.warn('Cleanup function failed:', error);
            }
        });
        this.cleanup.clear();

        // Stop all active animations
        this.activeAnimations.forEach(animationId => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });
        this.activeAnimations.clear();

        // Destroy particle systems
        this.particleSystems.forEach(system => {
            if (system && typeof system.destroy === 'function') {
                system.destroy();
            }
        });
        this.particleSystems.clear();

        // Remove dynamic elements
        document.querySelectorAll('.particle, .particles-container, .math-copy-btn, .equation-number').forEach(el => {
            el.remove();
        });

        // Reset animation states (but preserve important layout styles)
        document.querySelectorAll('.revealed, .stagger-revealed, .active').forEach(el => {
            el.classList.remove('revealed', 'stagger-revealed', 'active');

            // Only reset animation-related styles
            if (el.style.animation) el.style.animation = '';
            if (el.style.animationDelay) el.style.animationDelay = '';

            // Reset transform only if it's animation-related
            if (el.style.transform && (
                el.style.transform.includes('translateY') ||
                el.style.transform.includes('scale') ||
                el.style.transform.includes('rotate')
            )) {
                el.style.transform = '';
            }
        });

        // Reset hover setup attributes
        document.querySelectorAll('[data-hover-setup], [data-text-setup], [data-copy-setup], [data-tooltip-setup]').forEach(el => {
            el.removeAttribute('data-hover-setup');
            el.removeAttribute('data-text-setup');
            el.removeAttribute('data-copy-setup');
            el.removeAttribute('data-tooltip-setup');
        });

        this.isInitialized = false;
    }

    // ===== INTERSECTION OBSERVER SETUP =====
    setupIntersectionObservers() {
        // Main reveal observer
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerRevealAnimation(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Stagger animation observer
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerStaggerAnimation(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -30px 0px'
        });

        // Counter animation observer
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounters(entry.target);
                }
            });
        }, { threshold: 0.5 });

        this.observers.set('reveal', revealObserver);
        this.observers.set('stagger', staggerObserver);
        this.observers.set('counter', counterObserver);

        // Observe elements immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.observeElements());
        } else {
            // Small delay to ensure elements are rendered
            setTimeout(() => this.observeElements(), 100);
        }
    }

    observeElements() {
        // Wait a bit more to ensure all content is loaded
        setTimeout(() => {
            // Reveal animations
            const revealElements = document.querySelectorAll('.reveal, .animate-fade-in, .animate-slide-in');
            revealElements.forEach(el => {
                if (!el.classList.contains('revealed')) {
                    this.observers.get('reveal')?.observe(el);
                }
            });

            // Stagger animations
            const staggerContainers = document.querySelectorAll('.feature-grid, .tutorial-grid, .getting-started-steps');
            staggerContainers.forEach(container => {
                const children = Array.from(container.children);
                children.forEach((child, index) => {
                    if (!child.classList.contains('stagger-revealed')) {
                        child.style.animationDelay = `${index * 150}ms`;
                        child.classList.add('reveal-stagger');
                        this.observers.get('stagger')?.observe(child);
                    }
                });
            });

            // Auto-add reveal classes to common elements
            const autoRevealElements = document.querySelectorAll('.feature-card, .tutorial-card, .step, .card');
            autoRevealElements.forEach((element, index) => {
                if (!element.classList.contains('reveal') && !element.classList.contains('reveal-stagger')) {
                    element.classList.add('reveal');
                    this.observers.get('reveal')?.observe(element);
                }
            });

            // Counter animations
            const counters = document.querySelectorAll('[data-counter]');
            counters.forEach(counter => {
                if (!counter.classList.contains('counted')) {
                    this.observers.get('counter')?.observe(counter);
                }
            });

            console.log(`📊 Observing ${revealElements.length + autoRevealElements.length} reveal elements, ${staggerContainers.length} stagger containers, ${counters.length} counters`);
        }, 200);
    }

    // ===== REVEAL ANIMATIONS =====
    triggerRevealAnimation(element) {
        if (element.classList.contains('revealed')) return; // Prevent double animation

        element.classList.add('revealed');

        // Add specific animation based on class
        if (element.classList.contains('animate-fade-in')) {
            element.style.animation = 'fadeIn 0.8s ease-out forwards';
        } else if (element.classList.contains('animate-slide-in')) {
            element.style.animation = 'slideIn 1s ease-out forwards';
        } else {
            // Default reveal animation
            element.style.animation = 'fadeInUp 0.8s ease-out forwards';
        }

        // Trigger custom event
        element.dispatchEvent(new CustomEvent('revealed', { bubbles: true }));
    }

    triggerStaggerAnimation(element) {
        if (element.classList.contains('stagger-revealed')) return;

        element.classList.add('stagger-revealed');
        element.style.animation = 'fadeInUp 0.6s ease-out forwards';
    }

    // ===== COUNTER ANIMATIONS =====
    animateCounters(container) {
        const counters = container.querySelectorAll('[data-counter]:not(.counted)');

        counters.forEach(counter => {
            counter.classList.add('counted'); // Prevent re-animation
            const target = parseInt(counter.getAttribute('data-counter'));
            const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
            const suffix = counter.getAttribute('data-suffix') || '';

            this.animateCounter(counter, 0, target, duration, suffix);
        });
    }

    animateCounter(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        const range = end - start;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (range * easeOutQuart));

            element.textContent = current.toLocaleString() + suffix;

            if (progress < 1) {
                const animationId = requestAnimationFrame(updateCounter);
                this.activeAnimations.add(animationId);
            }
        };

        const animationId = requestAnimationFrame(updateCounter);
        this.activeAnimations.add(animationId);
    }

    // ===== SCROLL ANIMATIONS =====
    setupScrollAnimations() {
        let ticking = false;

        const updateScrollAnimations = () => {
            const scrolled = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Parallax effects
            this.updateParallaxElements(scrolled);

            // Progress indicators
            this.updateProgressIndicators(scrolled, documentHeight, windowHeight);

            // Header effects
            this.updateHeaderEffects(scrolled);

            ticking = false;
        };

        const requestScrollUpdate = () => {
            if (!ticking) {
                const animationId = requestAnimationFrame(updateScrollAnimations);
                this.activeAnimations.add(animationId);
                ticking = true;
            }
        };

        // Remove previous listener if exists
        if (window.currentAnimationScrollHandler) {
            window.removeEventListener('scroll', window.currentAnimationScrollHandler);
        }

        window.currentAnimationScrollHandler = requestScrollUpdate;
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });

        // Add cleanup
        this.cleanup.add(() => {
            if (window.currentAnimationScrollHandler) {
                window.removeEventListener('scroll', window.currentAnimationScrollHandler);
                window.currentAnimationScrollHandler = null;
            }
        });
    }

    updateParallaxElements(scrolled) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    updateProgressIndicators(scrolled, documentHeight, windowHeight) {
        const progress = Math.min(scrolled / (documentHeight - windowHeight), 1);
        const progressBars = document.querySelectorAll('.scroll-progress');

        progressBars.forEach(bar => {
            bar.style.width = `${progress * 100}%`;
        });
    }

    updateHeaderEffects(scrolled) {
        const header = document.querySelector('.md-header');
        if (header) {
            if (scrolled > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    // ===== HOVER ANIMATIONS =====
    setupHoverAnimations() {
        // Cleanup previous hover animations
        document.querySelectorAll('[data-hover-setup]').forEach(el => {
            el.removeAttribute('data-hover-setup');
        });

        // Magnetic button effect
        this.setupMagneticEffect();

        // 3D tilt effect
        this.setup3DTiltEffect();

        // Ripple effect
        this.setupRippleEffect();

        // Glow effect
        this.setupGlowEffect();
    }

    setupMagneticEffect() {
        const magneticElements = document.querySelectorAll('.btn, .magnetic');

        magneticElements.forEach(element => {
            if (element.hasAttribute('data-hover-setup')) return;
            element.setAttribute('data-hover-setup', 'magnetic');

            const mouseMoveHandler = (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const moveX = x * 0.15;
                const moveY = y * 0.15;

                element.style.transform = `translate(${moveX}px, ${moveY}px)`;
            };

            const mouseLeaveHandler = () => {
                element.style.transform = '';
            };

            element.addEventListener('mousemove', mouseMoveHandler);
            element.addEventListener('mouseleave', mouseLeaveHandler);

            // Store cleanup
            this.cleanup.add(() => {
                element.removeEventListener('mousemove', mouseMoveHandler);
                element.removeEventListener('mouseleave', mouseLeaveHandler);
            });
        });
    }

    setup3DTiltEffect() {
        const tiltElements = document.querySelectorAll('.feature-card, .tutorial-card, .tilt-3d, .card');

        tiltElements.forEach(element => {
            if (element.hasAttribute('data-hover-setup')) return;
            element.setAttribute('data-hover-setup', 'tilt');

            const mouseMoveHandler = (e) => {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;

                const rotateX = (mouseY / (rect.height / 2)) * 8; // Reduced intensity
                const rotateY = (mouseX / (rect.width / 2)) * -8; // Reduced intensity

                element.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    scale3d(1.02, 1.02, 1.02)
                `;
                element.style.transition = 'transform 0.1s ease-out';
            };

            const mouseLeaveHandler = () => {
                element.style.transform = '';
                element.style.transition = 'transform 0.3s ease-out';
            };

            element.addEventListener('mousemove', mouseMoveHandler);
            element.addEventListener('mouseleave', mouseLeaveHandler);

            // Store cleanup
            this.cleanup.add(() => {
                element.removeEventListener('mousemove', mouseMoveHandler);
                element.removeEventListener('mouseleave', mouseLeaveHandler);
            });
        });
    }

    setupRippleEffect() {
        const rippleElements = document.querySelectorAll('.btn-primary, .ripple, .md-button');

        rippleElements.forEach(element => {
            if (element.hasAttribute('data-hover-setup')) return;
            element.setAttribute('data-hover-setup', 'ripple');

            const clickHandler = (e) => {
                const rect = element.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                    z-index: 1;
                `;

                if (!element.style.position || element.style.position === 'static') {
                    element.style.position = 'relative';
                }
                element.style.overflow = 'hidden';

                element.appendChild(ripple);

                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.remove();
                    }
                }, 600);
            };

            element.addEventListener('click', clickHandler);

            // Store cleanup
            this.cleanup.add(() => {
                element.removeEventListener('click', clickHandler);
            });
        });
    }

    setupGlowEffect() {
        const glowElements = document.querySelectorAll('.glow-on-hover');

        glowElements.forEach(element => {
            if (element.hasAttribute('data-hover-setup')) return;
            element.setAttribute('data-hover-setup', 'glow');

            const mouseEnterHandler = () => {
                element.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.5)';
                element.style.transition = 'box-shadow 0.3s ease';
            };

            const mouseLeaveHandler = () => {
                element.style.boxShadow = '';
            };

            element.addEventListener('mouseenter', mouseEnterHandler);
            element.addEventListener('mouseleave', mouseLeaveHandler);

            // Store cleanup
            this.cleanup.add(() => {
                element.removeEventListener('mouseenter', mouseEnterHandler);
                element.removeEventListener('mouseleave', mouseLeaveHandler);
            });
        });
    }

    // ===== LOADING ANIMATIONS =====
    setupLoadAnimations() {
        // Page load animation (only on initial load, not navigation)
        if (!window.initialLoadComplete) {
            window.addEventListener('load', () => {
                document.body.classList.add('loaded');
                this.triggerPageLoadAnimation();
                window.initialLoadComplete = true;
            });
        }

        // Image load animations for current page
        this.setupImageLoadAnimations();
    }

    triggerPageLoadAnimation() {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.remove();
                }
            }, 500);
        }

        // Animate hero elements if they exist
        const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-buttons');
        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'fadeInUp 0.8s ease-out forwards';
            }, index * 200);
        });
    }

    setupImageLoadAnimations() {
        const images = document.querySelectorAll('img[data-animate-load]:not(.loaded)');

        images.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
                img.style.animation = 'fadeIn 0.5s ease-out forwards';
            } else {
                const loadHandler = () => {
                    img.classList.add('loaded');
                    img.style.animation = 'fadeIn 0.5s ease-out forwards';
                };

                img.addEventListener('load', loadHandler);

                // Store cleanup
                this.cleanup.add(() => {
                    img.removeEventListener('load', loadHandler);
                });
            }
        });
    }

    // ===== PARTICLE SYSTEM =====
    setupParticleSystem() {
        // Clean up existing particle systems
        this.particleSystems.forEach(system => {
            if (system && typeof system.destroy === 'function') {
                system.destroy();
            }
        });
        this.particleSystems.clear();

        document.querySelectorAll('.particles-container').forEach(container => {
            container.remove();
        });

        const particleContainers = document.querySelectorAll('[data-particles]');

        particleContainers.forEach((container, index) => {
            const config = this.parseParticleConfig(container.dataset.particles);
            const system = this.createParticleSystem(container, config);
            this.particleSystems.set(`system-${index}`, system);
        });

        // Add default particle system to hero sections
        const heroSections = document.querySelectorAll('.hero-section, .hero, .md-hero');
        heroSections.forEach((hero, index) => {
            if (!hero.hasAttribute('data-particles') && !hero.querySelector('.particles-container')) {
                const system = this.createParticleSystem(hero, {
                    count: 30,
                    size: 2,
                    speed: 0.5,
                    color: 'rgba(37, 99, 235, 0.3)'
                });
                this.particleSystems.set(`hero-${index}`, system);
            }
        });
    }

    parseParticleConfig(configString) {
        try {
            return JSON.parse(configString);
        } catch {
            return {
                count: 50,
                size: 2,
                speed: 1,
                color: 'rgba(37, 99, 235, 0.3)'
            };
        }
    }

    createParticleSystem(container, config) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.className = 'particles-container';
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        const originalPosition = getComputedStyle(container).position;
        if (originalPosition === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(canvas);

        const particles = [];
        let animationId;

        const resizeCanvas = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };

        const resizeHandler = () => resizeCanvas();
        window.addEventListener('resize', resizeHandler);
        resizeCanvas();

        // Create particles
        for (let i = 0; i < config.count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * config.size + 1,
                speedX: (Math.random() - 0.5) * config.speed,
                speedY: (Math.random() - 0.5) * config.speed,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        // Animation loop
        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = config.color;
                ctx.globalAlpha = particle.opacity;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animateParticles);
            this.activeAnimations.add(animationId);
        };

        animateParticles();

        // Return system object with destroy method
        return {
            canvas,
            particles,
            destroy: () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    this.activeAnimations.delete(animationId);
                }
                window.removeEventListener('resize', resizeHandler);
                if (canvas.parentNode) {
                    canvas.remove();
                }
            }
        };
    }

    // ===== TEXT ANIMATIONS =====
    setupTextAnimations() {
        // Cleanup existing text animations
        document.querySelectorAll('[data-text-setup]').forEach(el => {
            el.removeAttribute('data-text-setup');
        });

        // Typing animation
        this.setupTypingAnimation();

        // Text reveal animation
        this.setupTextRevealAnimation();

        // Scramble text animation
        this.setupScrambleAnimation();
    }

    setupTypingAnimation() {
        const typingElements = document.querySelectorAll('[data-typing]:not([data-text-setup])');

        typingElements.forEach(element => {
            element.setAttribute('data-text-setup', 'typing');

            const text = element.dataset.typing || element.textContent;
            const speed = parseInt(element.dataset.typingSpeed) || 50;

            element.textContent = '';
            element.style.borderRight = '2px solid var(--md-primary-fg-color)';

            this.typeText(element, text, speed);
        });
    }

    typeText(element, text, speed) {
        let i = 0;
        let typingInterval;

        const typeChar = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);

                // Blinking cursor animation
                const blinkInterval = setInterval(() => {
                    element.style.borderRight = element.style.borderRight === 'none'
                        ? '2px solid var(--md-primary-fg-color)'
                        : 'none';
                }, 500);

                // Store cleanup
                this.cleanup.add(() => {
                    clearInterval(blinkInterval);
                });
            }
        };

        typingInterval = setInterval(typeChar, speed);

        // Store cleanup
        this.cleanup.add(() => {
            clearInterval(typingInterval);
        });
    }

    setupTextRevealAnimation() {
        const revealElements = document.querySelectorAll('.text-reveal:not([data-text-setup])');

        const textRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateTextReveal(entry.target);
                }
            });
        }, { threshold: 0.3 });

        this.observers.set('textReveal', textRevealObserver);

        revealElements.forEach(element => {
            element.setAttribute('data-text-setup', 'reveal');
            textRevealObserver.observe(element);
        });
    }

    animateTextReveal(element) {
        if (element.hasAttribute('data-revealed')) return;
        element.setAttribute('data-revealed', 'true');

        const text = element.textContent;
        const words = text.split(' ');

        element.innerHTML = words.map(word =>
            `<span class="word">${word}</span>`
        ).join(' ');

        const wordElements = element.querySelectorAll('.word');

        wordElements.forEach((word, index) => {
            word.style.opacity = '0';
            word.style.transform = 'translateY(20px)';
            word.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            setTimeout(() => {
                word.style.opacity = '1';
                word.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    setupScrambleAnimation() {
        const scrambleElements = document.querySelectorAll('.scramble-text:not([data-text-setup])');

        scrambleElements.forEach(element => {
            element.setAttribute('data-text-setup', 'scramble');

            const mouseEnterHandler = () => {
                this.scrambleText(element);
            };

            element.addEventListener('mouseenter', mouseEnterHandler);

            // Store cleanup
            this.cleanup.add(() => {
                element.removeEventListener('mouseenter', mouseEnterHandler);
            });
        });
    }

    scrambleText(element) {
        const originalText = element.textContent;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let iteration = 0;

        const scrambleInterval = setInterval(() => {
            element.textContent = originalText
                .split('')
                .map((char, index) => {
                    if (index < iteration) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');

            if (iteration >= originalText.length) {
                clearInterval(scrambleInterval);
            }

            iteration += 1/3;
        }, 30);

        // Store cleanup
        this.cleanup.add(() => {
            clearInterval(scrambleInterval);
        });
    }

    // ===== MATH ANIMATIONS =====
    setupMathAnimations() {
        if (typeof MathJax !== 'undefined') {
            const mathElements = document.querySelectorAll('.MathJax:not([data-math-setup])');

            mathElements.forEach(element => {
                element.setAttribute('data-math-setup', 'true');
                this.addMathAnimation(element);
            });
        }
    }

    addMathAnimation(element) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'mathReveal 0.8s ease-out forwards';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(element);
        this.observers.set(`math-${Date.now()}`, observer);
    }

    // ===== UTILITY METHODS =====
    addAnimation(element, animationClass, duration = 1000) {
        element.classList.add(animationClass);

        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }

    pauseAllAnimations() {
        document.body.style.animationPlayState = 'paused';

        // Pause canvas animations
        this.particleSystems.forEach(system => {
            if (system.canvas) {
                system.canvas.style.animationPlayState = 'paused';
            }
        });
    }

    resumeAllAnimations() {
        document.body.style.animationPlayState = 'running';

        // Resume canvas animations
        this.particleSystems.forEach(system => {
            if (system.canvas) {
                system.canvas.style.animationPlayState = 'running';
            }
        });
    }

    // ===== PERFORMANCE MONITORING =====
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            const performanceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 16.67) { // Slower than 60fps
                        console.warn(`🐌 Slow animation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });

            performanceObserver.observe({ entryTypes: ['measure'] });

            // Store cleanup
            this.cleanup.add(() => {
                performanceObserver.disconnect();
            });
        }

        // Monitor FPS
        let lastTime = performance.now();
        let frameCount = 0;
        let fpsArray = [];

        const measureFPS = (currentTime) => {
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                fpsArray.push(fps);

                if (fpsArray.length > 5) {
                    fpsArray.shift();
                }

                const avgFPS = fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length;

                if (avgFPS < 45) {
                    console.warn(`🎯 Low FPS detected: ${avgFPS.toFixed(1)} FPS`);
                }

                frameCount = 0;
                lastTime = currentTime;
            }

            const fpsAnimationId = requestAnimationFrame(measureFPS);
            this.activeAnimations.add(fpsAnimationId);
        };

        const fpsAnimationId = requestAnimationFrame(measureFPS);
        this.activeAnimations.add(fpsAnimationId);
    }

    // ===== ACCESSIBILITY SUPPORT =====
    setupAccessibilitySupport() {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            this.pauseAllAnimations();
            console.log('🎯 Reduced motion mode: Animations paused');
        }

        // Listen for changes
        const motionChangeHandler = (e) => {
            if (e.matches) {
                this.pauseAllAnimations();
                console.log('🎯 Reduced motion mode: Animations paused');
            } else {
                this.resumeAllAnimations();
                console.log('🎯 Normal motion mode: Animations resumed');
            }
        };

        prefersReducedMotion.addEventListener('change', motionChangeHandler);

        // Store cleanup
        this.cleanup.add(() => {
            prefersReducedMotion.removeEventListener('change', motionChangeHandler);
        });

        // Add skip animation button
        this.addSkipAnimationButton();
    }

    addSkipAnimationButton() {
        if (document.querySelector('.skip-animations-btn')) return;

        const skipBtn = document.createElement('button');
        skipBtn.className = 'skip-animations-btn';
        skipBtn.textContent = 'Skip Animations';
        skipBtn.setAttribute('aria-label', 'Skip all animations on this page');
        skipBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: var(--md-primary-fg-color);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;

        // Show button when user tabs
        const showSkipBtn = () => {
            skipBtn.style.opacity = '1';
            skipBtn.style.transform = 'translateY(0)';
            skipBtn.style.pointerEvents = 'auto';
        };

        const hideSkipBtn = () => {
            skipBtn.style.opacity = '0';
            skipBtn.style.transform = 'translateY(-10px)';
            skipBtn.style.pointerEvents = 'none';
        };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                showSkipBtn();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== skipBtn) {
                hideSkipBtn();
            }
        });

        skipBtn.addEventListener('click', () => {
            this.pauseAllAnimations();
            skipBtn.textContent = 'Resume Animations';

            setTimeout(() => {
                skipBtn.textContent = 'Skip Animations';
                hideSkipBtn();
            }, 2000);
        });

        document.body.appendChild(skipBtn);

        // Store cleanup
        this.cleanup.add(() => {
            if (skipBtn.parentNode) {
                skipBtn.remove();
            }
        });
    }

    // ===== ADVANCED ANIMATION METHODS =====
    createTimelineAnimation(elements, keyframes, options = {}) {
        const timeline = [];
        const defaultOptions = {
            duration: 1000,
            easing: 'ease-out',
            delay: 0,
            stagger: 100
        };

        const config = { ...defaultOptions, ...options };

        elements.forEach((element, index) => {
            const animation = element.animate(keyframes, {
                duration: config.duration,
                easing: config.easing,
                delay: config.delay + (index * config.stagger),
                fill: 'forwards'
            });

            timeline.push(animation);
        });

        return {
            play: () => timeline.forEach(anim => anim.play()),
            pause: () => timeline.forEach(anim => anim.pause()),
            reverse: () => timeline.forEach(anim => anim.reverse()),
            finish: () => timeline.forEach(anim => anim.finish()),
            cancel: () => timeline.forEach(anim => anim.cancel())
        };
    }

    morphElement(fromElement, toElement, duration = 1000) {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        const morphKeyframes = [
            {
                transform: `translate(0, 0) scale(1)`,
                opacity: 1
            },
            {
                transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(${toRect.width / fromRect.width}, ${toRect.height / fromRect.height})`,
                opacity: 0.7
            }
        ];

        return fromElement.animate(morphKeyframes, {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
    }

    createScrollTriggeredAnimation(element, triggerPosition = 0.8) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= triggerPosition) {
                    element.style.animation = 'fadeInScale 0.8s ease-out forwards';
                    observer.unobserve(element);
                }
            });
        }, { threshold: triggerPosition });

        observer.observe(element);
        this.observers.set(`scroll-trigger-${Date.now()}`, observer);
    }

    // ===== PARTICLE SYSTEM ENHANCEMENTS =====
    createCustomParticleSystem(container, particleConfig) {
        const customConfig = {
            count: 100,
            size: { min: 1, max: 4 },
            speed: { min: 0.5, max: 2 },
            color: ['#2563eb', '#3b82f6', '#60a5fa'],
            shape: 'circle', // circle, square, triangle
            gravity: 0,
            bounce: false,
            trail: false,
            ...particleConfig
        };

        return this.createAdvancedParticleSystem(container, customConfig);
    }

    createAdvancedParticleSystem(container, config) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.className = 'advanced-particles-container';
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        const originalPosition = getComputedStyle(container).position;
        if (originalPosition === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(canvas);

        const particles = [];
        let animationId;

        const resizeCanvas = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Create particles
        for (let i = 0; i < config.count; i++) {
            const color = Array.isArray(config.color)
                ? config.color[Math.floor(Math.random() * config.color.length)]
                : config.color;

            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * (config.size.max - config.size.min) + config.size.min,
                speedX: (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min,
                speedY: (Math.random() - 0.5) * (config.speed.max - config.speed.min) + config.speed.min,
                color: color,
                opacity: Math.random() * 0.5 + 0.5,
                life: 1,
                decay: Math.random() * 0.01 + 0.005,
                trail: config.trail ? [] : null
            });
        }

        // Animation loop
        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle, index) => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Apply gravity
                if (config.gravity) {
                    particle.speedY += config.gravity;
                }

                // Bounce off edges
                if (config.bounce) {
                    if (particle.x <= 0 || particle.x >= canvas.width) {
                        particle.speedX *= -0.8;
                    }
                    if (particle.y <= 0 || particle.y >= canvas.height) {
                        particle.speedY *= -0.8;
                    }
                } else {
                    // Wrap around edges
                    if (particle.x < 0) particle.x = canvas.width;
                    if (particle.x > canvas.width) particle.x = 0;
                    if (particle.y < 0) particle.y = canvas.height;
                    if (particle.y > canvas.height) particle.y = 0;
                }

                // Update life
                particle.life -= particle.decay;
                if (particle.life <= 0) {
                    // Respawn particle
                    particle.x = Math.random() * canvas.width;
                    particle.y = Math.random() * canvas.height;
                    particle.life = 1;
                }

                // Draw trail
                if (particle.trail) {
                    particle.trail.push({ x: particle.x, y: particle.y });
                    if (particle.trail.length > 10) {
                        particle.trail.shift();
                    }

                    particle.trail.forEach((point, i) => {
                        const alpha = (i / particle.trail.length) * particle.opacity;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, particle.size * (i / particle.trail.length), 0, Math.PI * 2);
                        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                        ctx.fill();
                    });
                }

                // Draw particle
                ctx.beginPath();

                if (config.shape === 'square') {
                    ctx.rect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
                } else if (config.shape === 'triangle') {
                    ctx.moveTo(particle.x, particle.y - particle.size);
                    ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
                    ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
                    ctx.closePath();
                } else {
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                }

                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity * particle.life;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animateParticles);
            this.activeAnimations.add(animationId);
        };

        animateParticles();

        // Return system object
        return {
            canvas,
            particles,
            destroy: () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    this.activeAnimations.delete(animationId);
                }
                window.removeEventListener('resize', resizeCanvas);
                if (canvas.parentNode) {
                    canvas.remove();
                }
            }
        };
    }
}

// ===== CSS KEYFRAMES INJECTION =====
const injectAnimationCSS = () => {
    if (document.querySelector('#animation-css')) return; // Prevent duplicate injection

    const style = document.createElement('style');
    style.id = 'animation-css';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { 
                opacity: 0; 
                transform: translateX(-30px); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }
        
        @keyframes fadeInUp {
            from { 
                opacity: 0; 
                transform: translateY(30px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        @keyframes fadeInDown {
            from { 
                opacity: 0; 
                transform: translateY(-30px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        @keyframes fadeInLeft {
            from { 
                opacity: 0; 
                transform: translateX(-30px); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }
        
        @keyframes fadeInRight {
            from { 
                opacity: 0; 
                transform: translateX(30px); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }
        
        @keyframes fadeInScale {
            from { 
                opacity: 0; 
                transform: scale(0.8); 
            }
            to { 
                opacity: 1; 
                transform: scale(1); 
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes mathReveal {
            from { 
                opacity: 0; 
                transform: scale(0.8); 
            }
            to { 
                opacity: 1; 
                transform: scale(1); 
            }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
            40%, 43% { transform: translateY(-10px); }
            70% { transform: translateY(-5px); }
            90% { transform: translateY(-2px); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.5); }
            50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.8); }
        }
        
        /* Base classes for animations */
        .reveal, .reveal-stagger {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .reveal.revealed, .reveal-stagger.stagger-revealed {
            opacity: 1;
            transform: translateY(0);
        }
        
        .fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }
        
        .fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .fade-in-down {
            animation: fadeInDown 0.8s ease-out forwards;
        }
        
        .fade-in-left {
            animation: fadeInLeft 0.8s ease-out forwards;
        }
        
        .fade-in-right {
            animation: fadeInRight 0.8s ease-out forwards;
        }
        
        .fade-in-scale {
            animation: fadeInScale 0.8s ease-out forwards;
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        .bounce {
            animation: bounce 1s ease-in-out;
        }
        
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        .float {
            animation: float 3s ease-in-out infinite;
        }
        
        .glow {
            animation: glow 2s ease-in-out infinite;
        }
        
        /* Page-specific animations */
        .loaded img {
            opacity: 1;
            transform: scale(1);
        }
        
        .md-header.scrolled {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        [data-md-color-scheme="slate"] .md-header.scrolled {
            background: rgba(30, 41, 59, 0.95);
        }
        
        .page-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--md-primary-fg-color);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: var(--md-accent-fg-color);
            z-index: 1000;
            transition: width 0.1s ease;
        }
        
        /* Text animation styles */
        .word {
            display: inline-block;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .reveal, .reveal-stagger {
                transition: none;
            }
            
            .fade-in, .fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right, .fade-in-scale {
                animation: none;
                opacity: 1;
                transform: none;
            }
            
            .pulse, .bounce, .shake, .float, .glow {
                animation: none;
            }
        }
        
        /* Hover effects */
        .btn, .magnetic {
            transition: transform 0.2s ease;
        }
        
        .feature-card, .tutorial-card, .tilt-3d, .card {
            transition: transform 0.3s ease;
        }
        
        .ripple {
            position: relative;
            overflow: hidden;
        }
        
        /* Accessibility */
        .skip-animations-btn:focus {
            outline: 2px solid var(--md-accent-fg-color);
            outline-offset: 2px;
        }
        
        /* Performance optimizations */
        .particles-container, .advanced-particles-container {
            will-change: transform;
        }
        
        .reveal, .reveal-stagger {
            will-change: opacity, transform;
        }
        
        .feature-card:hover, .tutorial-card:hover, .card:hover {
            will-change: transform;
        }
    `;

    document.head.appendChild(style);
};

// ===== NAVIGATION-AWARE INITIALIZATION =====
let animationController;

function initializeAnimations() {
    console.log('🎬 Initializing animations for new page...');

    // Inject CSS if not already present
    injectAnimationCSS();

    // Destroy existing controller if present
    if (animationController) {
        animationController.destroy();
    }

    // Create new controller
    animationController = new AnimationController();
    animationController.init();

    // Setup accessibility support
    animationController.setupAccessibilitySupport();

    // Start performance monitoring in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        animationController.monitorPerformance();
    }

    // Make globally available
    window.animationController = animationController;

    console.log('✅ Animation system initialized successfully!');
}

// ===== AUTO-INITIALIZATION WITH NAVIGATION SUPPORT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Setting up animation navigation hooks...');

    // Initial initialization
    initializeAnimations();

    // Hook into MkDocs Material navigation
    const mainContent = document.querySelector('[data-md-component="main"]');
    if (mainContent) {
        const observer = new MutationObserver((mutations) => {
            let shouldReinit = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if significant content was added
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            (node.classList?.contains('md-content') ||
                                node.querySelector?.('.md-content'))) {
                            shouldReinit = true;
                        }
                    });
                }
            });

            if (shouldReinit) {
                console.log('📄 Navigation detected, reinitializing animations...');
                setTimeout(initializeAnimations, 150); // Small delay for content to settle
            }
        });

        observer.observe(mainContent, {
            childList: true,
            subtree: true
        });

        // Store for cleanup
        window.animationNavObserver = observer;
    }

    // Fallback: detect URL changes
    let currentUrl = location.href;
    setInterval(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            console.log('🔄 URL change detected, reinitializing animations...');
            setTimeout(initializeAnimations, 200);
        }
    }, 500);
});

// ===== GLOBAL UTILITIES =====
window.AnimationUtils = {
    // Quick animation helpers
    fadeIn: (element, duration = 800) => {
        element.style.animation = `fadeIn ${duration}ms ease-out forwards`;
    },

    fadeOut: (element, duration = 800) => {
        element.style.animation = `fadeOut ${duration}ms ease-out forwards`;
    },

    slideIn: (element, direction = 'up', duration = 800) => {
        element.style.animation = `fadeIn${direction.charAt(0).toUpperCase() + direction.slice(1)} ${duration}ms ease-out forwards`;
    },

    pulse: (element, duration = 1000) => {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    shake: (element, duration = 500) => {
        element.style.animation = `shake ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    // Create custom animations
    createAnimation: (element, keyframes, options = {}) => {
        return element.animate(keyframes, {
            duration: 1000,
            easing: 'ease-out',
            fill: 'forwards',
            ...options
        });
    },

    // Intersection observer helper
    observeElement: (element, callback, options = {}) => {
        const observer = new IntersectionObserver(callback, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options
        });
        observer.observe(element);
        return observer;
    }
};

// ===== EXPORT FOR MODULE SYSTEMS =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AnimationController,
        initializeAnimations,
        AnimationUtils: window.AnimationUtils
    };
}

// Make initialization function globally available
window.initializeAnimations = initializeAnimations;