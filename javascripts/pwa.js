/* =============================================================================
 * Progressive Web App Support
 * Service Worker registration and PWA features
 * ============================================================================= */

(function() {
  'use strict';

  /* ===========================================================================
   * Service Worker Registration
   * =========================================================================== */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/Isaac_ROS-Jetbot_NanoOWL/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }

  /* ===========================================================================
   * Install Prompt
   * =========================================================================== */
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e;

    // Show custom install button
    showInstallPromotion();
  });

  function showInstallPromotion() {
    const installButton = document.createElement('div');
    installButton.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 2rem;
      background: linear-gradient(135deg, #76B900, #5a8f00);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 50px;
      box-shadow: 0 10px 30px rgba(118, 185, 0, 0.4);
      cursor: pointer;
      z-index: 999;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      font-size: 0.95rem;
      animation: slideInRight 0.5s ease-out;
      transition: all 0.3s ease;
    `;

    installButton.innerHTML = `
      <span style="font-size: 1.3rem;">📱</span>
      <span>Install App</span>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; margin-left: 0.5rem;" onclick="this.parentElement.remove()">×</button>
    `;

    installButton.addEventListener('click', async (e) => {
      if (e.target.tagName === 'BUTTON') return;

      installButton.remove();

      if (!deferredPrompt) return;

      // Show install prompt
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        showSuccessNotification('App installed successfully!');
      }

      deferredPrompt = null;
    });

    document.body.appendChild(installButton);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (installButton.parentElement) {
        installButton.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => installButton.remove(), 500);
      }
    }, 10000);
  }

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA was installed');
    deferredPrompt = null;

    // Track installation
    if (window.gtag) {
      gtag('event', 'pwa_install', {
        event_category: 'engagement'
      });
    }
  });

  /* ===========================================================================
   * Update Notification
   * =========================================================================== */
  function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #00AED9, #0090b8);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 174, 217, 0.4);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: start; gap: 1rem;">
        <span style="font-size: 1.5rem;">🔄</span>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Update Available</h4>
          <p style="margin: 0 0 1rem 0; font-size: 0.95rem; opacity: 0.95;">
            A new version of the documentation is available.
          </p>
          <div style="display: flex; gap: 0.75rem;">
            <button onclick="window.location.reload()" style="
              background: white;
              color: #00AED9;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.9rem;
            ">Update Now</button>
            <button onclick="this.closest('div').closest('div').closest('div').remove()" style="
              background: transparent;
              color: white;
              border: 1px solid white;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.9rem;
            ">Later</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);
  }

  /* ===========================================================================
   * Offline Detection
   * =========================================================================== */
  function updateOnlineStatus() {
    const status = document.createElement('div');
    status.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${navigator.onLine ? '#76B900' : '#FF4444'};
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-weight: 600;
      animation: slideUp 0.3s ease-out;
    `;

    status.textContent = navigator.onLine ? '✓ Back Online' : '⚠ You are offline';

    document.body.appendChild(status);

    setTimeout(() => {
      status.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => status.remove(), 300);
    }, 3000);
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  /* ===========================================================================
   * Share API Integration
   * =========================================================================== */
  function initShareButtons() {
    const shareButtons = document.querySelectorAll('[data-share]');

    shareButtons.forEach(button => {
      button.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: document.title,
              text: 'Check out Isaac ROS Jetbot NanoOWL - Enterprise-grade autonomous robotics platform',
              url: window.location.href
            });

            if (window.gtag) {
              gtag('event', 'share', {
                method: 'Web Share API',
                content_type: 'page'
              });
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Error sharing:', err);
            }
          }
        } else {
          // Fallback: Copy link
          navigator.clipboard.writeText(window.location.href);
          showSuccessNotification('Link copied to clipboard!');
        }
      });
    });
  }

  /* ===========================================================================
   * Utility Functions
   * =========================================================================== */
  function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #76B900, #5a8f00);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(118, 185, 0, 0.4);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /* ===========================================================================
   * Animations
   * =========================================================================== */
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

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes slideUp {
      from {
        transform: translate(-50%, 100%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }

    @keyframes slideDown {
      from {
        transform: translate(-50%, 0);
        opacity: 1;
      }
      to {
        transform: translate(-50%, 100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  /* ===========================================================================
   * Initialize
   * =========================================================================== */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initShareButtons();
    console.log('📱 PWA features initialized');
  }

  init();

})();
