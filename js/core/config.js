/**
 * config.js - Main Configuration for Orford Live
 * ================================================
 * Central configuration file for branding, Firebase, and app settings.
 * 
 * TO CUSTOMIZE THE APP:
 * - Change APP_CONFIG.branding for name/logo
 * - Firebase config should match your project
 */

const APP_CONFIG = {
  // ===== BRANDING (Easy to modify) =====
  branding: {
    name: 'Orford Live',
    shortName: 'Orford',
    logo: '🏔️',                      // Emoji logo
    // logoImage: 'assets/images/logo.png',  // Alternative: path to image file
    tagline: 'Patrouille Mont Orford',
    footerText: '© 2025 Patrouille Mont Orford'
  },

  // ===== FIREBASE CONFIGURATION =====
  firebase: {
    apiKey: "AIzaSyDcBZrwGTskM7QUvanzLTACEJ_T-55j-DA",
    authDomain: "trail-inspection.firebaseapp.com",
    projectId: "trail-inspection",
    storageBucket: "trail-inspection.firebasestorage.app",
    messagingSenderId: "415995272058",
    appId: "1:415995272058:web:dc476de8ffee052e2ad4c3",
    measurementId: "G-EBLYWBM9YB"
  },

  // ===== VERSION =====
  version: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  
  // ===== ROUTES =====
  routes: {
    portal: '/index.html',
    login: '/pages/login.html',
    forgotPassword: '/pages/forgot-password.html',
    userProfile: '/pages/user-profile.html',
    userManagement: '/pages/user-management.html',
    // Inspection module
    inspectionDashboard: '/pages/inspection-dashboard.html',
    inspectionTrailReport: '/pages/inspection-trail-report.html',
    inspectionShelterReport: '/pages/inspection-shelter-report.html',
    inspectionHistory: '/pages/inspection-history.html',
    // Infraction module
    infractionReport: '/pages/infraction-report.html',
    infractionManagement: '/pages/infraction-management.html',
    // Signalisation module
    signalisationReport: '/pages/signalisation-report.html',
    signalisationManagement: '/pages/signalisation-management.html',
    // Request module (Demandes)
    requestCreate: '/pages/request-create.html',
    requestManagement: '/pages/request-management.html',
    // Public
    publicStatus: '/pages/public-status.html'
  },

  // ===== MODULE DEFINITIONS =====
  modules: {
    portal: {
      id: 'portal',
      name: 'Portail',
      icon: '🏠',
      color: 'portal'
    },
    inspection: {
      id: 'inspection',
      name: 'Inspection',
      icon: '🔍',
      color: 'inspection',
      permission: 'allowInspection'
    },
    infraction: {
      id: 'infraction',
      name: 'Infraction',
      icon: '🚨',
      color: 'infraction',
      permission: 'allowInfraction'
    },
    signalisation: {
      id: 'signalisation',
      name: 'Signalisation',
      icon: '🚧',
      color: 'signalisation',
      permission: 'allowSignalisation'
    },
    request: {
      id: 'request',
      name: 'Demandes',
      icon: '🎫',
      color: 'request',
      permission: null  // Accessible to all authenticated users
    }
  },

  // ===== DEFAULT SETTINGS =====
  defaults: {
    theme: 'light',
    itemsPerPage: 25
  }
};

// Freeze config to prevent accidental modification
Object.freeze(APP_CONFIG);
Object.freeze(APP_CONFIG.branding);
Object.freeze(APP_CONFIG.firebase);
Object.freeze(APP_CONFIG.routes);
Object.freeze(APP_CONFIG.modules);
Object.freeze(APP_CONFIG.defaults);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}