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

  // ===== NETWORKS (activities) =====
  // A user's access is the list of these ids in inspectors/{uid}.networks.
  // defaultNetworks[0] is the network of records saved before the network field existed,
  // and what a CSV import gives users when its networks column is empty.
  //
  // Per network:
  //   seasonMonths  months (1-12) when this network is the default one; the network with no
  //                 seasonMonths is the default the rest of the year (see js/core/network.js)
  //   map           image (path from the site root) shown behind trail / report markers, its size
  //                 in pixels, and 3 GPS calibration corners (topLeft, topRight, bottomLeft; the
  //                 pixels are the image corners). No calibration = GPS positions cannot be
  //                 drawn on that map (Google Maps links still work).
  //   features      what the network has: shelters, snowCondition (ski-only inspection field)
  //   infractions   the fault types and practices offered on the infraction form (id -> label)
  //   publicTitle   what the public status page calls this activity's trails
  //   statsSince    month/day the inspection statistics start counting each year
  //   mapCenter     GPS centre of the activity's map (distance-from-centre photo check); none = skipped
  networks: {
    ski: {
      id: 'ski', name: 'Ski', icon: '⛷️',
      map: {
        image: 'assets/map/map3.png', width: 800, height: 700,
        calibration: {
          topLeft:    { lat: 45.296611, lon: -72.243361 },
          topRight:   { lat: 45.325861, lon: -72.249972 },
          bottomLeft: { lat: 45.299444, lon: -72.205667 }
        }
      },
      features: { shelters: true, snowCondition: true },
      publicTitle: 'État des sentiers de randonnée alpine',
      statsSince: { month: 9, day: 1 }, // 1 September
      mapCenter: { lat: 45.310, lon: -72.230 },
      infractions: {
        faults: {
          'downhill': 'Downhill',
          'saut-dangereux': 'Saut dangereux',
          'ski-hors-piste': 'Ski hors piste',
          'ski-piste-fermee': 'Ski piste fermée',
          'saut-des-chaises': 'Saut des chaises',
          'manoeuvre-dangereuse': 'Manoeuvre dangereuse',
          'autres': 'Autres (voir commentaire)'
        },
        practices: { 'ski': 'Ski', 'snowboard': 'Snowboard', 'raquette': 'Raquette', 'autres': 'Autres' }
      }
    },
    bike: {
      id: 'bike', name: 'Vélo', icon: '🚵',
      seasonMonths: [5, 6, 7, 8, 9, 10], // 1 May to 31 October
      map: { image: 'assets/map/bike.png', width: null, height: null, calibration: null }, // TO PROVIDE
      features: { shelters: false, snowCondition: false },
      publicTitle: 'État des sentiers de vélo de montagne',
      statsSince: { month: 5, day: 1 }, // 1 May
      mapCenter: null, // TO PROVIDE with the bike map
      // TO COMPLETE: the bike fault types and practices (placeholders for now)
      infractions: {
        faults: { 'autres': 'Autres (voir commentaire)' },
        practices: { 'velo': 'Vélo', 'autres': 'Autres' }
      }
    }
  },
  defaultNetworks: ['ski'],

  // ===== NAVIGATION (rendered by js/core/layout.js) =====
  // One set per module, chosen with <body data-nav="...">. The current page is
  // <body data-page="...">. Paths are relative to the site root.
  // admin: true = only shown to admins (unless it is the current page).
  // desktopIcons: false = the desktop bar shows labels only (mobile always has icons).
  // desktopOnly: true = not listed in the mobile drawer.
  // requires: 'shelters' = only shown when the current network has that feature.
  // mobileProfile: true = the mobile drawer lists "Mon profil" (only on portal-level pages;
  // in the apps it stays in the desktop user menu).
  nav: {
    portal: {
      logo: { icon: '🏔️', text: 'Orford Live' },
      mobileProfile: true,
      items: []
    },
    inspection: {
      logo: { icon: '🔍', text: 'Inspection' },
      desktopIcons: false,
      items: [
        { id: 'inspection-dashboard', label: 'Tableau de bord', icon: '📊', href: 'pages/inspection-dashboard.html' },
        { id: 'inspection-trail-report', label: 'Rapport sentier', icon: '📝', href: 'pages/inspection-trail-report.html' },
        { id: 'inspection-shelter-report', label: 'Rapport abri', icon: '📝', href: 'pages/inspection-shelter-report.html', requires: 'shelters' },
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
      mobileProfile: true,
      items: []
    },
    profile: {
      logo: { icon: '🏔️', text: 'Orford Live' },
      mobileProfile: true,
      items: [
        { id: 'user-management', label: 'Administration', icon: '⚙️', href: 'pages/user-management.html', admin: true, desktopOnly: true }
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
Object.freeze(APP_CONFIG.networks);
Object.freeze(APP_CONFIG.defaultNetworks);
Object.freeze(APP_CONFIG.defaults);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
