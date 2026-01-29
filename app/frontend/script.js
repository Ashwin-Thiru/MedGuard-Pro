// Main Login Script
import { signInWithGoogle, createUserWithRole } from './auth.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

let currentUser = null;

// Check if already logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, redirect to appropriate dashboard
        const { db, doc, getDoc } = await import('./firebase-config.js');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            redirectToDashboard(userData.role, userData.profileCompleted);
        }
    }
});

// Google Sign In Button
document.getElementById('googleSignInBtn').addEventListener('click', async () => {
    try {
        showLoading();
        const result = await signInWithGoogle();
        
        if (result.isNewUser) {
            // New user - show role selection
            currentUser = result.user;
            showRoleSelection();
        } else {
            // Existing user - redirect to dashboard
            redirectToDashboard(result.role, result.profileCompleted);
        }
    } catch (error) {
        hideLoading();
        alert('Error signing in: ' + error.message);
    }
});

// Role Selection Buttons
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const role = btn.dataset.role;
        if (!currentUser) return;
        
        try {
            showLoading();
            await createUserWithRole(currentUser.uid, currentUser.email, currentUser.displayName, role);
            redirectToDashboard(role, false);
        } catch (error) {
            hideLoading();
            alert('Error creating profile: ' + error.message);
        }
    });
});

function showLoading() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('roleSelection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
}

function showRoleSelection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('roleSelection').style.display = 'block';
}

function redirectToDashboard(role, profileCompleted) {
    if (!profileCompleted) {
        // Redirect to profile creation
        if (role === 'doctor') {
            window.location.href = 'doctor-profile-create.html';
        } else if (role === 'patient') {
            window.location.href = 'patient-profile-create.html';
        } else if (role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        }
    } else {
        // Redirect to dashboard
        if (role === 'doctor') {
            window.location.href = 'doctor-dashboard.html';
        } else if (role === 'patient') {
            window.location.href = 'patient-dashboard.html';
        } else if (role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        }
    }
}