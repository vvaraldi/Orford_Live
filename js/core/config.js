/**
 * config.js - Main Configuration for the portal
 * ==============================================
 * Central configuration file for branding, Firebase, and app settings.
 *
 * TO CUSTOMIZE THE APP:
 * - Rename the portal / change its logo: edit BRANDING just below (nothing else)
 * - Firebase config should match your project
 */

// ===== BRANDING: the ONE place for the portal's name and logo =====
// The header logo, the browser tab title and description, the favicon and the login page
// all read this (see "Apply the branding" at the end of this file). Pages only write their
// own part of the title ("Connexion"); the name is added for them.
// Do NOT rename the localStorage keys 'orford-theme' / 'orford-network' (js/core/theme.js,
// network.js): they are invisible to users and renaming them would reset everyone's settings.
const BRANDING = {
  name: 'Regis',                   // trial name
  logo: '🏔️',                     // emoji, used when there is no logoImage
  logoImage: 'assets/Logo_Mont-Orford transparent.png', // path from the site root (far left of the header; needs a transparent background), or null for the emoji
  tagline: 'Patrouille Mont Orford',
  footerText: '© 2025 Patrouille Mont Orford'
};

const APP_CONFIG = {
  branding: BRANDING,

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
  //   map           image (path from the site root) shown behind trail / report markers, and its
  //                 size in pixels (trail coordinates are pixels on it). The GPS calibration is
  //                 not here: it is saved by the system admin in Administration > Cartes
  //                 (Firestore maps/{network}). No calibration = GPS positions cannot be drawn
  //                 on that map (Google Maps links still work).
  //   trailKinds    the kinds of trail this activity has (keys of trailKinds below)
  //   inspectionKinds  the kinds that are inspected, and shown on the public status page
  //                 (downhill runs are not inspected for now)
  //   features      what the network has: shelters, snowCondition (ski-only inspection field)
  //   infractions   the fault types and practices offered on the infraction form (id -> label)
  //   publicTitle   what the public status page calls this activity's trails
  //   statsSince    month/day the inspection statistics start counting each year
  //   mapCenter     GPS centre of the activity's map (distance-from-centre photo check); none = skipped
  networks: {
    ski: {
      id: 'ski', name: 'Ski', icon: '⛷️',
      map: { image: 'assets/map/Ski-Touring_Map.png', width: 800, height: 700 },
      trailKinds: ['uphill', 'downhill'],
      inspectionKinds: ['uphill'],
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
      // The illustrated map (Bike_Map.jpg, not to scale) resized to 1600 px wide: trail coordinates are pixels on THIS image.
      map: { image: 'assets/map/Bike_Map_web.jpg', width: 1600, height: 919 },
      trailKinds: ['bike'],
      inspectionKinds: ['bike'],
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

  // ===== TRAILS =====
  // trails/{id}: name, number (optional, shown on the map markers), kind, network, difficulty,
  // length (km, optional, information only), status ('open' | 'closed'), coordinates
  // ({left, top}: pixels on the network's map). Uphill and downhill are separate records even
  // when they follow the same path: they have their own number, status and difficulty.
  // A trail saved before `kind` existed is uphill (bike network: bike); one saved with the
  // old difficulty easy / medium / hard is green / blue / black (see js/services/trail-service.js).
  // idPrefix: new trails are numbered trail_12, run_1, bike_3...
  trailKinds: {
    uphill:   { label: 'Montée',   idPrefix: 'trail' },
    downhill: { label: 'Descente', idPrefix: 'run' },
    bike:     { label: 'Vélo',     idPrefix: 'bike' }
  },
  difficulties: {
    'green':        { label: 'Verte',        icon: '🟢' },
    'blue':         { label: 'Bleue',        icon: '🔵' },
    'black':        { label: 'Noire',        icon: '⚫' },
    'double-black': { label: 'Double noire', icon: '⚫⚫' }
  },
  // The difficulties each kind of trail can have, easiest first
  difficultyScales: {
    uphill:   ['green', 'blue', 'black'],
    downhill: ['green', 'blue', 'black', 'double-black'],
    bike:     ['green', 'blue', 'black', 'double-black']
  },

  // ===== LABELS shared by the apps =====
  // trail status (what is open or closed) and inspection condition (what state it is in)
  labels: {
    trailStatus: {
      open:    { label: 'Ouvert',  icon: '🟢' },
      closed:  { label: 'Fermé',   icon: '🔴' },
      unknown: { label: 'Inconnu', icon: '❓' }
    },
    condition: {
      'good':          { label: 'Bon état',          icon: '✅' },
      'warning':       { label: 'Attention requise', icon: '⚠️' },
      'critical':      { label: 'État critique',     icon: '❌' },
      'not-inspected': { label: 'Non inspecté',      icon: '⚪' },
      'unknown':       { label: 'Inconnu',           icon: '❓' }
    }
  },

  // ===== NAVIGATION (rendered by js/core/layout.js) =====
  // One set per module, chosen with <body data-nav="...">. The current page is
  // <body data-page="...">. Paths are relative to the site root.
  // The header always shows the portal logo and name (BRANDING); title: 'Inspection' adds
  // "  -  Inspection" after the name (no title on the portal and profile pages).
  // admin: true = only shown to admins (unless it is the current page).
  // desktopIcons: false = the desktop bar shows labels only (mobile always has icons).
  // requires: 'shelters' = only shown when the current network has that feature.
  // mobileProfile: true = the mobile drawer lists "Mon profil" (only on portal-level pages;
  // in the apps it stays in the desktop user menu).
  nav: {
    portal: {
      mobileProfile: true,
      items: []
    },
    inspection: {
      title: 'Inspection',
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
      title: 'Infractions',
      items: [
        { id: 'infraction-report', label: 'Rapport', icon: '📝', href: 'pages/infraction-report.html' },
        { id: 'infraction-admin', label: 'Gestion', icon: '📋', href: 'pages/infraction-admin.html', admin: true }
      ]
    },
    signalisation: {
      title: 'Signalisation',
      items: [
        { id: 'signalisation-report', label: 'Rapport', icon: '📝', href: 'pages/signalisation-report.html' },
        { id: 'signalisation-resume', label: 'Résumé', icon: '🗺️', href: 'pages/signalisation-resume.html' },
        { id: 'signalisation-admin', label: 'Gestion', icon: '📋', href: 'pages/signalisation-admin.html', admin: true }
      ]
    },
    support: {
      title: 'Support',
      items: []
    },
    admin: {
      title: 'Administration',
      mobileProfile: true,
      items: []
    },
    profile: {
      mobileProfile: true,
      items: []
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
Object.freeze(APP_CONFIG.trailKinds);
Object.freeze(APP_CONFIG.difficulties);
Object.freeze(APP_CONFIG.difficultyScales);
Object.freeze(APP_CONFIG.labels);
Object.freeze(APP_CONFIG.defaults);

// ===== Apply the branding to the page (browser only) =====
// - <title>: "<name> - <page's own text>"; <meta name="description">: "<page's own text> - <name>"
//   (each skipped if the tag has data-no-brand, or already contains the name)
// - <link rel="icon" data-brand>: the logo image, or the emoji drawn as an icon
// - [data-brand-name] / [data-brand-tagline] / [data-brand-logo]: filled in (login page)
(function applyBranding() {
  if (typeof document === 'undefined') return;
  const brand = APP_CONFIG.branding;

  // A path from the site root, as a URL valid from the current page
  const siteUrl = path => (window.location.pathname.includes('/pages/') ? '../' + path : path);

  const title = document.querySelector('title');
  if (title && !title.hasAttribute('data-no-brand') && !title.textContent.includes(brand.name)) {
    title.textContent = `${brand.name} - ${title.textContent}`; // "Regis - Administration"
  }
  const description = document.querySelector('meta[name="description"]');
  if (description && !description.hasAttribute('data-no-brand') && !description.content.includes(brand.name)) {
    description.content = `${description.content} - ${brand.name}`;
  }

  document.querySelectorAll('link[rel="icon"][data-brand]').forEach(link => {
    link.href = brand.logoImage
      ? siteUrl(brand.logoImage)
      : 'data:image/svg+xml,' + encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${brand.logo}</text></svg>`);
  });

  const fill = () => {
    document.querySelectorAll('[data-brand-name]').forEach(el => { el.textContent = brand.name; });
    document.querySelectorAll('[data-brand-tagline]').forEach(el => { el.textContent = brand.tagline; });
    document.querySelectorAll('[data-brand-logo]').forEach(el => {
      el.textContent = '';
      if (brand.logoImage) {
        const image = document.createElement('img');
        image.src = siteUrl(brand.logoImage);
        image.alt = brand.name;
        el.appendChild(image);
      } else {
        el.textContent = brand.logo;
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
