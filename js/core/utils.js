/**
 * utils.js - Utility Functions for Orford Live
 * =============================================
 * Common utility functions used across the application
 */

/**
 * Format a Firestore timestamp or Date to readable date string
 * @param {Object|Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
  if (!date) return '-';

  let dateObj;
  
  // Handle Firestore timestamp
  if (date.toDate && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  }
  // Handle Firestore timestamp with seconds
  else if (date.seconds) {
    dateObj = new Date(date.seconds * 1000);
  }
  // Handle Date object
  else if (date instanceof Date) {
    dateObj = date;
  }
  // Handle string
  else if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  // Handle number (timestamp)
  else if (typeof date === 'number') {
    dateObj = new Date(date);
  }
  else {
    return '-';
  }

  if (isNaN(dateObj.getTime())) return '-';

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };

  return dateObj.toLocaleDateString('fr-CA', defaultOptions);
}

/**
 * Format time from a date
 * @param {Object|Date} date - Date to format
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  if (!date) return '-';

  let dateObj;
  if (date.toDate) dateObj = date.toDate();
  else if (date.seconds) dateObj = new Date(date.seconds * 1000);
  else if (date instanceof Date) dateObj = date;
  else dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return '-';

  return dateObj.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date and time together
 * @param {Object|Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
function formatDateTime(date) {
  if (!date) return '-';
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Format a relative time (e.g., "il y a 2 heures")
 * @param {Object|Date} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
  if (!date) return '-';

  let dateObj;
  if (date.toDate) dateObj = date.toDate();
  else if (date.seconds) dateObj = new Date(date.seconds * 1000);
  else if (date instanceof Date) dateObj = date;
  else dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return '-';

  const now = new Date();
  const diff = now - dateObj;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  
  return formatDate(dateObj);
}

/**
 * Show a status message/notification
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (0 for permanent)
 * @returns {HTMLElement} The alert element
 */
function showMessage(message, type = 'info', duration = 5000) {
  const container = document.getElementById('status-messages');
  if (!container) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return null;
  }

  const alertClass = type === 'error' ? 'alert-danger' : `alert-${type}`;
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const alert = document.createElement('div');
  alert.className = `alert ${alertClass}`;
  alert.innerHTML = `
    <span class="alert__icon">${icons[type] || icons.info}</span>
    <span class="alert__content">${escapeHtml(message)}</span>
    <button class="alert__close" onclick="this.parentElement.remove()">✕</button>
  `;

  // Add with animation
  alert.style.animation = 'toast-slide-in 0.3s ease';
  container.appendChild(alert);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      alert.style.animation = 'toast-slide-out 0.3s ease forwards';
      setTimeout(() => alert.remove(), 300);
    }, duration);
  }

  return alert;
}

/**
 * Show a toast notification (lightweight, works without container)
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms
 */
function showToast(message, type = 'info', duration = 4000) {
  // Remove existing toast if any
  const existing = document.querySelector('.utils-toast');
  if (existing) existing.remove();

  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb'
  };

  const toast = document.createElement('div');
  toast.className = 'utils-toast';
  toast.innerHTML = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 8px;
    color: #fff;
    background: ${colors[type] || colors.info};
    z-index: 10000;
    max-width: 90%;
    text-align: center;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: toast-fade-in 0.3s ease;
  `;

  // Add animation styles if not present
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes toast-fade-in { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      @keyframes toast-fade-out { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-fade-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show loading state on a button
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - Whether to show loading state
 * @param {string} loadingText - Text to show while loading
 */
function setButtonLoading(button, loading, loadingText = 'Chargement...') {
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.classList.add('loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('loading');
  }
}

/**
 * Compress an image before upload (with memory cleanup)
 * @param {File} file - Image file
 * @param {number} quality - JPEG quality (0-1)
 * @param {number} maxWidth - Maximum width
 * @returns {Promise<Blob>} Compressed image blob
 */
function compressImage(file, quality = 0.7, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    // Create object URL for the file
    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      // Safari private mode fallback
      const reader = new FileReader();
      reader.onload = (e) => processImage(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
      return;
    }

    function processImage(src) {
      const img = new Image();
      
      img.onload = () => {
        // Cleanup object URL
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) { /* ignore */ }
        }

        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) { /* ignore */ }
        }
        reject(new Error('Failed to load image'));
      };

      img.src = src;
    }

    processImage(objectUrl);
  });
}

/**
 * Check if the browser is online
 * @returns {boolean} Online status
 */
function isOnline() {
  return navigator.onLine !== false;
}

/**
 * Setup offline detection with user notification
 * @param {Object} options - Configuration options
 */
function setupOfflineDetection(options = {}) {
  const {
    onOffline = () => showToast('Connexion perdue. Vérifiez votre connexion internet.', 'warning', 6000),
    onOnline = () => showToast('Connexion rétablie.', 'success', 3000)
  } = options;

  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online', onOnline);
  };
}

/**
 * Get current date/time in local timezone for form inputs
 * @returns {Object} { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
function getLocalDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
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

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copié dans le presse-papiers', 'success', 2000);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    showToast('Impossible de copier', 'error', 2000);
    return false;
  }
}

/**
 * Get user initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
function formatPhone(phone) {
  if (!phone) return '-';
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Parse URL parameters
 * @returns {Object} URL parameters
 */
function getUrlParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

/**
 * Set URL parameter without page reload
 * @param {string} key - Parameter key
 * @param {string} value - Parameter value
 */
function setUrlParam(key, value) {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, '', url);
}

// Export functions for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    showMessage,
    showToast,
    escapeHtml,
    setButtonLoading,
    compressImage,
    isOnline,
    setupOfflineDetection,
    getLocalDateTime,
    debounce,
    throttle,
    generateId,
    copyToClipboard,
    getInitials,
    isValidEmail,
    formatPhone,
    getUrlParams,
    setUrlParam
  };
}
