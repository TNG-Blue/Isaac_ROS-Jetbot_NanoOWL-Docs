/* =============================================================================
 * Isaac ROS Jetbot NanoOWL - Custom JavaScript
 * Interactive features and enhancements
 * ============================================================================= */

(function() {
  'use strict';

  /* ===========================================================================
   * Scroll-based Animations
   * =========================================================================== */
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe elements with scroll-fade-in class
    document.querySelectorAll('.scroll-fade-in').forEach(el => {
      observer.observe(el);
    });
  }

  /* ===========================================================================
   * Smooth Scroll for Anchor Links
   * =========================================================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Update URL without jumping
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  /* ===========================================================================
   * Back to Top Button
   * =========================================================================== */
  function initBackToTop() {
    const backToTopBtn = document.querySelector('.md-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.visibility = 'visible';
      } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.visibility = 'hidden';
      }
    });
  }

  /* ===========================================================================
   * Code Block Copy Enhancement
   * =========================================================================== */
  function enhanceCodeBlocks() {
    document.querySelectorAll('.highlight').forEach(block => {
      // Add language label
      const codeElement = block.querySelector('code[class*="language-"]');
      if (codeElement) {
        const language = codeElement.className.match(/language-(\w+)/);
        if (language && language[1]) {
          const label = document.createElement('div');
          label.className = 'code-language-label';
          label.textContent = language[1].toUpperCase();
          label.style.cssText = `
            position: absolute;
            top: 0.5rem;
            right: 3rem;
            background: rgba(118, 185, 0, 0.8);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.05em;
          `;
          block.style.position = 'relative';
          block.insertBefore(label, block.firstChild);
        }
      }
    });

    // Enhanced copy button feedback
    document.querySelectorAll('.md-clipboard').forEach(btn => {
      btn.addEventListener('click', () => {
        const originalTitle = btn.getAttribute('title');
        btn.setAttribute('title', 'Copied!');
        btn.style.color = '#76B900';

        setTimeout(() => {
          btn.setAttribute('title', originalTitle);
          btn.style.color = '';
        }, 2000);
      });
    });
  }

  /* ===========================================================================
   * Table of Contents Highlighting
   * =========================================================================== */
  function initTocHighlight() {
    const tocLinks = document.querySelectorAll('.md-nav__link');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    if (!tocLinks.length || !headings.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (!id) return;

          tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-80px 0px -80% 0px'
    });

    headings.forEach(heading => {
      if (heading.id) {
        observer.observe(heading);
      }
    });
  }

  /* ===========================================================================
   * Search Enhancement
   * =========================================================================== */
  function enhanceSearch() {
    const searchInput = document.querySelector('.md-search__input');
    if (!searchInput) return;

    // Add search keyboard shortcut (Ctrl/Cmd + K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }

      // ESC to close search
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
      }
    });

    // Search analytics (if needed)
    searchInput.addEventListener('search', (e) => {
      const query = e.target.value;
      if (query && window.gtag) {
        gtag('event', 'search', {
          search_term: query
        });
      }
    });
  }

  /* ===========================================================================
   * Performance Stats Animation
   * =========================================================================== */
  function animateStats() {
    const stats = document.querySelectorAll('.stat-value');
    if (!stats.length) return;

    const animateValue = (element, start, end, duration) => {
      const startTime = performance.now();
      const endValue = parseFloat(end);

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = start + (endValue - start) * easeOutQuad(progress);
        element.textContent = formatNumber(current, end);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    const easeOutQuad = (t) => t * (2 - t);

    const formatNumber = (num, original) => {
      if (original.includes('+')) {
        return Math.round(num) + '+';
      }
      if (original.includes('%')) {
        return num.toFixed(1) + '%';
      }
      if (original.includes('ms')) {
        return Math.round(num) + 'ms';
      }
      if (original.includes('W')) {
        return Math.round(num) + 'W';
      }
      return Math.round(num);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
          entry.target.classList.add('animated');
          const endValue = entry.target.textContent;
          animateValue(entry.target, 0, endValue, 2000);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
  }

  /* ===========================================================================
   * External Links
   * =========================================================================== */
  function handleExternalLinks() {
    document.querySelectorAll('a[href^="http"]').forEach(link => {
      if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');

        // Add external link icon
        if (!link.querySelector('.external-icon')) {
          const icon = document.createElement('span');
          icon.className = 'external-icon';
          icon.innerHTML = ' ↗';
          icon.style.cssText = 'font-size: 0.8em; opacity: 0.6;';
          link.appendChild(icon);
        }
      }
    });
  }

  /* ===========================================================================
   * Dark Mode Toggle Enhancement
   * =========================================================================== */
  function enhanceDarkMode() {
    const toggle = document.querySelector('[data-md-component="palette"]');
    if (!toggle) return;

    // Save preference
    toggle.addEventListener('change', (e) => {
      const scheme = e.target.value;
      localStorage.setItem('color-scheme', scheme);

      // Analytics
      if (window.gtag) {
        gtag('event', 'theme_change', {
          theme: scheme
        });
      }
    });

    // Apply saved preference on load
    const savedScheme = localStorage.getItem('color-scheme');
    if (savedScheme) {
      const input = document.querySelector(`input[value="${savedScheme}"]`);
      if (input) input.checked = true;
    }
  }

  /* ===========================================================================
   * Print Optimization
   * =========================================================================== */
  function initPrintOptimization() {
    window.addEventListener('beforeprint', () => {
      // Expand all collapsed sections
      document.querySelectorAll('details').forEach(details => {
        details.setAttribute('open', '');
      });

      // Show all code blocks
      document.querySelectorAll('.highlight').forEach(block => {
        block.style.maxHeight = 'none';
      });
    });
  }

  /* ===========================================================================
   * Keyboard Navigation
   * =========================================================================== */
  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Only if not in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      // Left arrow - previous page
      if (e.key === 'ArrowLeft') {
        const prevLink = document.querySelector('.md-footer__link--prev');
        if (prevLink) prevLink.click();
      }

      // Right arrow - next page
      if (e.key === 'ArrowRight') {
        const nextLink = document.querySelector('.md-footer__link--next');
        if (nextLink) nextLink.click();
      }
    });
  }

  /* ===========================================================================
   * Performance Monitoring
   * =========================================================================== */
  function monitorPerformance() {
    if (!window.performance || !window.gtag) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
        const tcpTime = perfData.connectEnd - perfData.connectStart;
        const renderTime = perfData.domComplete - perfData.domLoading;

        gtag('event', 'timing_complete', {
          name: 'page_load',
          value: pageLoadTime,
          event_category: 'Performance'
        });

        console.log('📊 Performance Metrics:', {
          pageLoadTime: `${pageLoadTime}ms`,
          dnsTime: `${dnsTime}ms`,
          tcpTime: `${tcpTime}ms`,
          renderTime: `${renderTime}ms`
        });
      }, 0);
    });
  }

  /* ===========================================================================
   * Initialize All Features
   * =========================================================================== */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('🤖 Isaac ROS Jetbot NanoOWL - Documentation Initialized');

    initScrollAnimations();
    initSmoothScroll();
    initBackToTop();
    enhanceCodeBlocks();
    initTocHighlight();
    enhanceSearch();
    animateStats();
    handleExternalLinks();
    enhanceDarkMode();
    initPrintOptimization();
    initKeyboardNav();
    monitorPerformance();

    // Re-initialize on page navigation (for SPAs)
    document$.subscribe(() => {
      setTimeout(() => {
        enhanceCodeBlocks();
        animateStats();
        handleExternalLinks();
      }, 100);
    });
  }

  // Start initialization
  init();

})();
