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
 * Isaac ROS Jetbot NanoOWL - Premium Interactive Features
 * Advanced JavaScript for premium user experience
 * ============================================================================= */

(function() {
  'use strict';

  /* ===========================================================================
   * Reading Progress Indicator
   * =========================================================================== */
  function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-indicator';
    progressBar.innerHTML = '<div class="progress-bar-advanced"></div>';
    document.body.appendChild(progressBar);

    const progressBarFill = progressBar.querySelector('.progress-bar-advanced');

    window.addEventListener('scroll', () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;

      progressBarFill.style.width = `${Math.min(progress, 100)}%`;
    });
  }

  /* ===========================================================================
   * Animated Counter for Stats
   * =========================================================================== */
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number, .stat-value');

    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateValue(entry.target);
        }
      });
    }, observerOptions);

    counters.forEach(counter => counterObserver.observe(counter));
  }

  function animateValue(element) {
    const text = element.textContent;
    const hasPlus = text.includes('+');
    const hasPercent = text.includes('%');
    const hasLess = text.includes('<');
    const hasMs = text.includes('ms');
    const hasW = text.includes('W');

    let targetValue = parseFloat(text.replace(/[^\d.-]/g, ''));

    if (isNaN(targetValue)) return;

    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutExpo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (targetValue - startValue) * eased;

      let displayValue = Math.floor(current);

      if (hasPercent) {
        displayValue = current.toFixed(1) + '%';
      } else if (hasMs) {
        displayValue = hasLess ? '<' + Math.floor(current) + 'ms' : Math.floor(current) + 'ms';
      } else if (hasW) {
        displayValue = Math.floor(current) + 'W';
      } else if (hasPlus) {
        displayValue = Math.floor(current) + '+';
      }

      element.textContent = displayValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /* ===========================================================================
   * Parallax Scroll Effects
   * =========================================================================== */
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (!parallaxElements.length) return;

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach(el => {
        const speed = el.dataset.parallax || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  /* ===========================================================================
   * Interactive Card 3D Tilt Effect
   * =========================================================================== */
  function initCardTilt() {
    const cards = document.querySelectorAll('.card-premium, .feature-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', handleTilt);
      card.addEventListener('mouseleave', resetTilt);
    });

    function handleTilt(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
    }

    function resetTilt(e) {
      const card = e.currentTarget;
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    }
  }

  /* ===========================================================================
   * Floating Action Button with Menu
   * =========================================================================== */
  function initFAB() {
    const fab = document.createElement('div');
    fab.className = 'fab';
    fab.innerHTML = '⚡';
    fab.title = 'Quick Actions';

    fab.addEventListener('click', () => {
      // Add your quick action menu here
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(fab);

    // Show/hide based on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 300) {
        fab.style.opacity = '1';
        fab.style.visibility = 'visible';
      } else {
        fab.style.opacity = '0';
        fab.style.visibility = 'hidden';
      }

      lastScroll = currentScroll;
    });
  }

  /* ===========================================================================
   * Typewriter Effect for Hero Text
   * =========================================================================== */
  function initTypewriter() {
    const elements = document.querySelectorAll('[data-typewriter]');

    elements.forEach(element => {
      const text = element.textContent;
      const speed = parseInt(element.dataset.typewriterSpeed) || 50;

      element.textContent = '';
      element.style.opacity = '1';

      let i = 0;
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        }
      }

      // Start typing when element is in view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            type();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(element);
    });
  }

  /* ===========================================================================
   * Copy Code Button Enhancement
   * =========================================================================== */
  function enhanceCopyButtons() {
    document.querySelectorAll('.md-clipboard').forEach(button => {
      const originalTitle = button.title;

      button.addEventListener('click', () => {
        // Create success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #76B900, #5a8f00);
          color: white;
          padding: 1rem 2rem;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(118, 185, 0, 0.4);
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
          font-weight: 600;
        `;
        notification.textContent = '✓ Code copied to clipboard!';

        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => notification.remove(), 300);
        }, 2000);
      });
    });
  }

  /* ===========================================================================
   * Lazy Loading for Images with Blur Effect
   * =========================================================================== */
  function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => {
      img.style.filter = 'blur(10px)';
      img.style.transition = 'filter 0.3s ease';

      img.addEventListener('load', () => {
        img.style.filter = 'blur(0)';
      });

      imageObserver.observe(img);
    });
  }

  /* ===========================================================================
   * Interactive Timeline
   * =========================================================================== */
  function initTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');

    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.2 });

    timelineItems.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(50px)';
      item.style.transition = 'all 0.6s ease-out';
      timelineObserver.observe(item);
    });
  }

  /* ===========================================================================
   * Keyboard Shortcuts
   * =========================================================================== */
  function initKeyboardShortcuts() {
    const shortcuts = {
      '?': showShortcutsHelp,
      '/': focusSearch,
      'h': () => window.location.href = '/',
      'd': toggleDarkMode,
      'g': () => window.location.href = '/getting-started/',
    };

    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    });
  }

  function showShortcutsHelp() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--md-default-bg-color);
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 500px;
      border: 2px solid #76B900;
    `;

    modal.innerHTML = `
      <h3 style="margin-top: 0; color: #76B900;">⌨️ Keyboard Shortcuts</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 0.5rem;"><kbd>?</kbd></td><td>Show this help</td></tr>
        <tr><td style="padding: 0.5rem;"><kbd>/</kbd></td><td>Focus search</td></tr>
        <tr><td style="padding: 0.5rem;"><kbd>h</kbd></td><td>Go to home</td></tr>
        <tr><td style="padding: 0.5rem;"><kbd>d</kbd></td><td>Toggle dark mode</td></tr>
        <tr><td style="padding: 0.5rem;"><kbd>g</kbd></td><td>Getting started</td></tr>
        <tr><td style="padding: 0.5rem;"><kbd>Esc</kbd></td><td>Close dialogs</td></tr>
      </table>
    `;

    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      backdrop-filter: blur(5px);
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    const closeModal = () => {
      backdrop.remove();
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', escHandler);
  }

  function focusSearch() {
    const searchInput = document.querySelector('.md-search__input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  function toggleDarkMode() {
    const toggle = document.querySelector('input[name="__palette"]');
    if (toggle) toggle.click();
  }

  /* ===========================================================================
   * Particle Background Effect
   * =========================================================================== */
  function initParticles() {
    const hero = document.querySelector('.hero-advanced');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = `rgba(118, 185, 0, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(118, 185, 0, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    });
  }

  /* ===========================================================================
   * Initialize All Premium Features
   * =========================================================================== */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('🚀 Premium Features Initialized');

    // Core features
    initReadingProgress();
    animateCounters();
    initParallax();
    initCardTilt();
    initFAB();
    initTypewriter();
    enhanceCopyButtons();
    initLazyLoading();
    initTimeline();
    initKeyboardShortcuts();
    initParticles();

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      kbd {
        background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 0.2rem 0.5rem;
        font-family: 'Fira Code', monospace;
        font-size: 0.9rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-md-color-scheme="slate"] kbd {
        background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
        border-color: #555;
        color: #fff;
      }
    `;
    document.head.appendChild(style);

    // Re-initialize on page navigation
    if (typeof document$ !== 'undefined') {
      document$.subscribe(() => {
        setTimeout(() => {
          animateCounters();
          enhanceCopyButtons();
          initLazyLoading();
          initTimeline();
        }, 100);
      });
    }
  }

  // Start
  init();

})();
