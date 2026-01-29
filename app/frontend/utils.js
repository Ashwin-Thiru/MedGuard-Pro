// Utility Functions

// Generate unique patient ID (8 digits)
export function generatePatientId() {
    return 'P' + Math.floor(10000000 + Math.random() * 90000000);
}

// Generate QR code data URL
export function generateQRCode(data) {
    // Using a simple QR code generation approach
    // In production, use a library like qrcode.js
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
}

// Format date
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format time
export function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Calculate age from date of birth
export function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Show loading spinner
export function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner"></div>';
    }
}

// Hide loading spinner
export function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Show toast notification
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Validate email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone
export function validatePhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
}

// File size validation (max 5MB)
export function validateFileSize(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
}

// File type validation
export function validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
}