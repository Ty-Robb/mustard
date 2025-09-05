// Script to get the current user ID from Firebase
// Run this in the browser console while logged in

(async function() {
  const auth = window.firebase?.auth?.() || window.auth;
  if (!auth) {
    console.error('Firebase auth not found');
    return;
  }
  
  const user = auth.currentUser;
  if (user) {
    console.log('Current User ID:', user.uid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    
    // Get a sample token to verify it works
    try {
      const token = await user.getIdToken();
      console.log('Token obtained successfully (first 50 chars):', token.substring(0, 50) + '...');
    } catch (error) {
      console.error('Error getting token:', error);
    }
  } else {
    console.log('No user logged in');
  }
})();
