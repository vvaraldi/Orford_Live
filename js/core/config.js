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
    inspectionAdmin: '/pages/inspection-admin.html',
    // Infraction module
    infractionReport: '/pages/infraction-report.html',
    infractionAdmin: '/pages/infraction-admin.html',
    // Signalisation module
    signalisationReport: '/pages/signalisation-report.html',
    signalisationResume: '/pages/signalisation-resume.html',
    signalisationAdmin: '/pages/signalisation-admin.html',
    // Support (requests)
    support: '/pages/support.html',
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

  // ===== NAVIGATION (rendered by js/core/layout.js) =====
  // One set per module, chosen with <body data-nav="...">. The current page is
  // <body data-page="...">. Paths are relative to the site root.
  // admin: true = only shown to admins (unless it is the current page).
  // desktopIcons: false = the desktop bar shows labels only (mobile always has icons).
  nav: {
    portal: {
      logo: { icon: '🏔️', text: 'Orford Live' },
      items: []
    },
    inspection: {
      logo: { icon: '🔍', text: 'Inspection' },
      desktopIcons: false,
      items: [
        { id: 'inspection-dashboard', label: 'Tableau de bord', icon: '📊', href: 'pages/inspection-dashboard.html' },
        { id: 'inspection-trail-report', label: 'Rapport sentier', icon: '📝', href: 'pages/inspection-trail-report.html' },
        { id: 'inspection-shelter-report', label: 'Rapport abri', icon: '📝', href: 'pages/inspection-shelter-report.html' },
        { id: 'inspection-history', label: 'Historique', icon: '📋', href: 'pages/inspection-history.html' },
        { id: 'inspection-admin', label: 'Admin', icon: '⚙️', href: 'pages/inspection-admin.html', admin: true }
      ]
    },
    infraction: {
      logo: { icon: '🚨', text: 'Infractions' },
      items: [
        { id: 'infraction-report', label: 'Rapport', icon: '📝', href: 'pages/infraction-report.html' },
        { id: 'infraction-admin', label: 'Gestion', icon: '📋', href: 'pages/infraction-admin.html', admin: true }
      ]
    },
    signalisation: {
      logo: { icon: '🚧', text: 'Signalisation' },
      items: [
        { id: 'signalisation-report', label: 'Rapport', icon: '📝', href: 'pages/signalisation-report.html' },
        { id: 'signalisation-resume', label: 'Résumé', icon: '🗺️', href: 'pages/signalisation-resume.html' },
        { id: 'signalisation-admin', label: 'Gestion', icon: '📋', href: 'pages/signalisation-admin.html', admin: true }
      ]
    },
    support: {
      logo: { icon: '📋', text: 'Support' },
      items: []
    },
    admin: {
      logo: { icon: '🏔️', text: 'Orford Live' },
      items: []
    },
    profile: {
      logo: { icon: '🏔️', text: 'Orford Live' },
      items: [
        { id: 'user-management', label: 'Administration', icon: '⚙️', href: 'pages/user-management.html', admin: true }
      ]
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
Object.freeze(APP_CONFIG.nav);
Object.freeze(APP_CONFIG.defaults);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
