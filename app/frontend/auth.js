// Authentication and Role Management
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc
} from './firebase-config.js';

/* =====================================================
   INTERNAL GUARD (prevents reload / redirect loops)
===================================================== */
let authResolved = false;

/* =====================================================
   Google Sign In
===================================================== */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      return { isNewUser: true, user };
    }

    const userData = userDoc.data();
    return {
      isNewUser: false,
      user,
      role: userData.role,
      profileCompleted: userData.profileCompleted
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/* =====================================================
   Create User With Role
===================================================== */
export async function createUserWithRole(userId, email, name, role) {
  try {
    await setDoc(doc(db, 'users', userId), {
      email,
      name,
      role,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/* =====================================================
   Auth Check (SAFE – no reload loop)
===================================================== */
export function checkAuth(requiredRole = null, options = {}) {
  const { allowIncompleteProfile = false } = options;

  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      // 🔒 Prevent multiple executions
      if (authResolved) return;
      authResolved = true;

      if (!user) {
        window.location.replace('index.html');
        reject('Not authenticated');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          window.location.replace('index.html');
          reject('User not found');
          return;
        }

        const userData = userDoc.data();
        const currentPage = window.location.pathname.split('/').pop();

        /* ---------- Role Check ---------- */
        if (requiredRole && userData.role !== requiredRole) {
          window.location.replace('index.html');
          reject('Wrong role');
          return;
        }

        /* ---------- Profile Completion ---------- */
        if (!allowIncompleteProfile && !userData.profileCompleted) {
          if (userData.role === 'doctor' && currentPage !== 'doctor-profile-create.html') {
            window.location.replace('doctor-profile-create.html');
          } else if (userData.role === 'patient' && currentPage !== 'patient-profile-create.html') {
            window.location.replace('patient-profile-create.html');
          }
          reject('Profile not completed');
          return;
        }

        /* ---------- Doctor Verification ---------- */
        if (
          userData.role === 'doctor' &&
          userData.profileCompleted &&
          !allowIncompleteProfile
        ) {
          const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
          if (doctorDoc.exists()) {
            const doctorData = doctorDoc.data();

            if (doctorData.verificationStatus === 'pending') {
              if (currentPage !== 'doctor-dashboard.html') {
                window.location.replace('doctor-dashboard.html');
              }
              reject('Doctor pending verification');
              return;
            }

            if (doctorData.verificationStatus === 'rejected') {
              alert('Your verification was rejected.');
              await signOut(auth);
              window.location.replace('index.html');
              reject('Doctor rejected');
              return;
            }
          }
        }

        resolve({ user, userData });
      } catch (error) {
        console.error('Auth error:', error);
        reject(error);
      }
    });
  });
}

/* =====================================================
   Logout
===================================================== */
export async function logout() {
  try {
    await signOut(auth);
    window.location.replace('index.html');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/* =====================================================
   Get Current User Data
===================================================== */
export async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return null;

  return { uid: user.uid, ...userDoc.data() };
}
