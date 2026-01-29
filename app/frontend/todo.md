# AI-Powered Healthcare Platform - Development Plan

## Design Guidelines

### Design References
- **Healthcare.gov**: Clean, accessible medical interface
- **Practo.com**: Modern patient-doctor interaction design
- **Style**: Medical Professional + Modern Web App + Accessibility First

### Color Palette
- Primary: #2563EB (Medical Blue - primary actions)
- Secondary: #10B981 (Success Green - approvals, health status)
- Warning: #F59E0B (Amber - alerts, pending status)
- Danger: #EF4444 (Red - allergies, critical info)
- Background: #F9FAFB (Light Gray - main background)
- Card: #FFFFFF (White - cards and panels)
- Text: #111827 (Dark Gray - primary text)
- Text Secondary: #6B7280 (Medium Gray - secondary text)

### Typography
- Heading1: Inter font-weight 700 (32px)
- Heading2: Inter font-weight 600 (24px)
- Heading3: Inter font-weight 600 (18px)
- Body: Inter font-weight 400 (14px)
- Body Bold: Inter font-weight 600 (14px)
- Small: Inter font-weight 400 (12px)

### Key Component Styles
- **Buttons**: Rounded 8px, padding 12px 24px, hover: darken 10%
- **Cards**: White background, 1px border #E5E7EB, 12px rounded, shadow-sm
- **Forms**: Input border #D1D5DB, focus: blue ring, 8px rounded
- **Badges**: Small rounded pills for status (pending/approved/rejected)
- **Alert Badges**: Red background for allergies, amber for warnings

### Layout & Spacing
- Max width: 1400px for dashboards
- Card padding: 24px
- Section spacing: 32px vertical
- Grid gaps: 16px

### Images to Generate
1. **doctor-hero-banner.jpg** - Professional doctor with stethoscope in modern clinic (Style: photorealistic, bright, professional)
2. **patient-care-illustration.jpg** - Friendly healthcare illustration showing doctor-patient interaction (Style: modern illustration, warm colors)
3. **medical-records-icon.png** - Icon representing digital medical records (Style: minimalist, blue theme)
4. **ai-chatbot-avatar.png** - Friendly AI assistant avatar for chatbot (Style: modern, approachable, medical theme)

---

## Firebase Structure

### Collections:
1. **users** (root collection)
   - userId (document ID from Google Auth)
   - email, name, role (patient/doctor/admin)
   - profileCompleted (boolean)
   - createdAt, lastLogin

2. **doctors** (subcollection under users)
   - personalDetails: {name, phone, email, dob, gender}
   - professionalDetails: {registrationNumber, qualification, specialization, experience, hospitalName, clinicAddress, consultationTimings}
   - documents: {degreeUrl, registrationUrl, specializationUrl, govIdUrl, photoUrl}
   - verificationStatus: pending/approved/rejected
   - verificationReason (if rejected)
   - verifiedBy, verifiedAt

3. **patients** (subcollection under users)
   - personalDetails: {name, phone, email, dob, age, gender, bloodGroup}
   - medicalDetails: {allergies[], chronicDiseases[], currentMedications[]}
   - emergencyContact: {name, phone}
   - patientId (unique 8-digit ID)
   - qrCode (data URL)

4. **prescriptions** (root collection)
   - patientId
   - doctorId, doctorName
   - visitReason, diagnosisCategory
   - medicines: [{name, dosage, timing: {morning, afternoon, night}, beforeAfterFood, duration}]
   - createdAt, timestamp
   - pdfUrl (generated PDF)

5. **appointments** (root collection)
   - patientId, doctorId
   - dateTime, status (pending/confirmed/completed/cancelled)
   - notes

---

## File Structure

### Core Files:
1. **index.html** - Landing page with role selection and Google login
2. **auth.js** - Firebase authentication, role detection, profile completion check
3. **firebase-config.js** - Firebase initialization and configuration
4. **style.css** - Global styles following design guidelines

### Doctor Module:
5. **doctor-profile-create.html** - Doctor profile creation form with document uploads
6. **doctor-dashboard.html** - Doctor dashboard with QR scanner, search, appointments
7. **doctor-patient-view.html** - Patient details, full history, add prescription
8. **doctor-add-prescription.html** - Prescription form

### Patient Module:
9. **patient-profile-create.html** - Patient profile creation form
10. **patient-dashboard.html** - Patient dashboard with basic info, history, analytics, chatbot
11. **patient-history.html** - Detailed medical history view

### Admin Module:
12. **admin-dashboard.html** - Admin dashboard with pending doctor verifications
13. **admin-verify-doctor.html** - Doctor verification page with document preview

### Shared Components:
14. **chatbot.js** - AI chatbot with image recognition, voice support, multilingual
15. **qr-scanner.js** - QR code scanner using device camera
16. **pdf-generator.js** - Prescription PDF generation
17. **notifications.js** - SMS alerts using Brevo API
18. **utils.js** - Shared utility functions

---

## Development Tasks

1. **Firebase Setup** - Initialize Firebase, configure authentication, set up Firestore structure
2. **Authentication Flow** - Google login, role selection, first-time detection, profile completion enforcement
3. **Doctor Profile Creation** - Complete form with document uploads to Firebase Storage
4. **Patient Profile Creation** - Form with medical details, generate patient ID and QR code
5. **Admin Verification** - View pending doctors, preview documents, approve/reject functionality
6. **Patient Dashboard** - Basic info card, medical history timeline, analytics charts
7. **Doctor Dashboard** - Patient search, QR scanner integration, appointment management
8. **Patient Search & History** - Search functionality, patient cards, full history view with filters
9. **Prescription Management** - Add prescription form, save to Firestore, PDF generation
10. **AI Chatbot** - Medicine image recognition API integration, voice input/output, multilingual support
11. **Access Control** - Role-based restrictions, doctor lock until approval, profile completion checks
12. **Notification System** - Brevo API integration for SMS alerts
13. **Testing & Refinement** - Cross-browser testing, mobile responsiveness, security checks