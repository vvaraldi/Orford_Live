/**
 * auth.js - Authentication for Orford Live
 * =========================================
 * Firebase authentication and user management
 */

// Global user state
let currentUser = null;
let currentUserData = null;

/**
 * Initialize Firebase
 */
function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(APP_CONFIG.firebase);
  }
  
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();
}

/**
 * Check authentication status and handle accordingly
 * @param {Object} options - Configuration options
 */
function checkAuthStatus(options = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    requiredPermission = null,
    onAuthenticated = null,
    onUnauthenticated = null
  } = options;

  const loading = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      window.currentUser = user;

      try {
        // Get user data from inspectors collection
        const inspectorDoc = await db.collection('inspectors').doc(user.uid).get();

        if (inspectorDoc.exists) {
          currentUserData = inspectorDoc.data();
          currentUserData.uid = user.uid;
          window.currentUserData = currentUserData;

          // Check if user is active
          if (currentUserData.status !== 'active') {
            showAccessDenied('Votre compte a été désactivé. Contactez l\'administrateur.');
            await auth.signOut();
            return;
          }

          // Check admin requirement
          if (requireAdmin && currentUserData.role !== 'admin') {
            showAccessDenied('Accès réservé aux administrateurs.');
            return;
          }

          // Check specific permission
          if (requiredPermission && !currentUserData[requiredPermission]) {
            showAccessDenied('Vous n\'avez pas accès à cette fonctionnalité.');
            return;
          }

          // Show content
          if (loading) loading.style.display = 'none';
          if (mainContent) mainContent.style.display = 'block';

          // Update UI with user info
          updateUIForUser(currentUserData);

          // Sync theme preference from Firebase
          if (window.themeManager && currentUserData.preferences?.theme) {
            window.themeManager.syncWithFirebase(currentUserData);
          }

          // Callback
          if (onAuthenticated) {
            onAuthenticated(currentUserData);
          }

          // Dispatch event
          document.dispatchEvent(new CustomEvent('userAuthenticated', {
            detail: currentUserData
          }));

        } else {
          // User not in inspectors collection
          showAccessDenied('Utilisateur non trouvé. Contactez l\'administrateur.');
          await auth.signOut();
        }

      } catch (error) {
        console.error('Error checking auth status:', error);
        showAccessDenied('Erreur lors de la vérification des accès.');
        await auth.signOut();
      }

    } else {
      // Not logged in
      currentUser = null;
      currentUserData = null;
      window.currentUser = null;
      window.currentUserData = null;

      if (requireAuth) {
        // Redirect to login
        redirectToLogin();
      } else {
        // Public page - show content
        if (loading) loading.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';

        if (onUnauthenticated) {
          onUnauthenticated();
        }
      }
    }
  });
}

/**
 * Update UI elements with user information
 * @param {Object} userData - User data from Firestore
 */
function updateUIForUser(userData) {
  // Update user name displays
  const userNameElements = document.querySelectorAll('[data-user-name]');
  userNameElements.forEach(el => {
    el.textContent = userData.name || 'Utilisateur';
  });

  // Update user email displays
  const userEmailElements = document.querySelectorAll('[data-user-email]');
  userEmailElements.forEach(el => {
    el.textContent = userData.email || '';
  });

  // Update user initials
  const userInitialsElements = document.querySelectorAll('[data-user-initials]');
  userInitialsElements.forEach(el => {
    el.textContent = getInitials(userData.name);
  });

  // Update user role badge
  const userRoleElements = document.querySelectorAll('[data-user-role]');
  userRoleElements.forEach(el => {
    el.textContent = userData.role === 'admin' ? 'Administrateur' : 'Inspecteur';
    el.className = `badge ${userData.role === 'admin' ? 'badge-admin' : 'badge-inspector'}`;
  });

  // Show/hide admin links
  const adminLinks = document.querySelectorAll('[data-require-admin]');
  adminLinks.forEach(el => {
    el.style.display = userData.role === 'admin' ? '' : 'none';
  });

  // Update navigation based on permissions
  updateNavPermissions(userData);
}

/**
 * Update navigation visibility based on user permissions
 * @param {Object} userData - User data
 */
function updateNavPermissions(userData) {
  // Inspection links
  const inspectionLinks = document.querySelectorAll('[data-require-inspection]');
  inspectionLinks.forEach(el => {
    el.style.display = userData.allowInspection !== false ? '' : 'none';
  });

  // Infraction links
  const infractionLinks = document.querySelectorAll('[data-require-infraction]');
  infractionLinks.forEach(el => {
    el.style.display = userData.allowInfraction === true ? '' : 'none';
  });

  // Signalisation links
  const signalisationLinks = document.querySelectorAll('[data-require-signalisation]');
  signalisationLinks.forEach(el => {
    el.style.display = userData.allowSignalisation === true ? '' : 'none';
  });
}

/**
 * Show access denied message and redirect
 * @param {string} message - Message to display
 */
function showAccessDenied(message) {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';

  // Show message
  if (typeof showMessage === 'function') {
    showMessage(message, 'error', 5000);
  } else {
    alert(message);
  }

  // Redirect after delay
  setTimeout(() => {
    redirectToPortal();
  }, 2000);
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  const currentPath = window.location.pathname;
  
  // Determine correct path to login
  let loginPath;
  if (currentPath.includes('/pages/')) {
    loginPath = 'login.html';
  } else {
    loginPath = 'pages/login.html';
  }

  // Add return URL
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${loginPath}?returnUrl=${returnUrl}`;
}

/**
 * Redirect to portal
 */
function redirectToPortal() {
  const currentPath = window.location.pathname;
  
  // Determine correct path to portal
  let portalPath;
  if (currentPath.includes('/pages/')) {
    portalPath = '../index.html';
  } else {
    portalPath = 'index.html';
  }

  window.location.href = portalPath;
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await auth.signOut();
    
    // Clear local storage except theme preference
    const theme = localStorage.getItem('orford-theme');
    localStorage.clear();
    if (theme) localStorage.setItem('orford-theme', theme);

    // Redirect to login
    redirectToLogin();
  } catch (error) {
    console.error('Logout error:', error);
    if (typeof showMessage === 'function') {
      showMessage('Erreur lors de la déconnexion', 'error');
    }
  }
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data
 */
async function login(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 */
async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
async function updatePassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Re-authenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await user.reauthenticateWithCredential(credential);

    // Update password
    await user.updatePassword(newPassword);
    return true;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
}

/**
 * Get Firebase auth error message in French
 * @param {Error} error - Firebase error
 * @returns {string} French error message
 */
function getAuthErrorMessage(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/operation-not-allowed': 'Opération non autorisée.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte associé à cette adresse email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
    'auth/network-request-failed': 'Erreur de connexion réseau.'
  };

  return errorMessages[error.code] || error.message || 'Une erreur est survenue.';
}

// Initialize Firebase when script loads
initFirebase();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAuthStatus,
    login,
    handleLogout,
    sendPasswordReset,
    updatePassword,
    getAuthErrorMessage,
    redirectToLogin,
    redirectToPortal
  };
}
