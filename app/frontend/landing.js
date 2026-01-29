// Landing Page Script
import { signInWithGoogle, createUserWithRole } from './auth.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

let selectedRole = null;
let currentLanguage = 'en';

// Language translations
const translations = {
    en: 'English',
    ta: 'தமிழ்',
    hi: 'हिंदी'
};

// Check if already logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const { db, doc, getDoc } = await import('./firebase-config.js');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            redirectToDashboard(userData.role, userData.profileCompleted);
        }
    }
});

// Language Selector
document.getElementById('languageSelector').addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    updateLanguage();
});

function updateLanguage() {
    document.querySelectorAll('[data-en]').forEach(element => {
        const text = element.getAttribute(`data-${currentLanguage}`);
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = text;
                } else {
                    element.textContent = text;
                }
            } else {
                element.textContent = text;
            }
        }
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});

// Mobile menu toggle
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
});

// Login button handlers
document.getElementById('loginBtn').addEventListener('click', openLoginModal);
document.getElementById('getStartedBtn').addEventListener('click', openLoginModal);
document.getElementById('ctaLoginBtn').addEventListener('click', openLoginModal);

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

// Close modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('googleSignInSection').style.display = 'none';
    selectedRole = null;
    document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('selected'));
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('loginModal');
    if (e.target === modal) {
        modal.style.display = 'none';
        document.getElementById('googleSignInSection').style.display = 'none';
        selectedRole = null;
        document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('selected'));
    }
});

// Role selection
document.querySelectorAll('.role-option').forEach(option => {
    option.addEventListener('click', () => {
        selectedRole = option.dataset.role;
        
        // Update UI
        document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Show Google sign in button
        document.getElementById('googleSignInSection').style.display = 'block';
    });
});

// Google Sign In
document.getElementById('googleSignInBtn').addEventListener('click', async () => {
    if (!selectedRole) {
        alert('Please select a role first');
        return;
    }

    try {
        const result = await signInWithGoogle();
        
        if (result.isNewUser) {
            // New user - create with selected role
            await createUserWithRole(result.user.uid, result.user.email, result.user.displayName, selectedRole);
            redirectToDashboard(selectedRole, false);
        } else {
            // Existing user - redirect to dashboard
            redirectToDashboard(result.role, result.profileCompleted);
        }
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Error signing in: ' + error.message);
    }
});

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

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.feature-card, .step-card, .why-us-card').forEach(el => {
    observer.observe(el);
});