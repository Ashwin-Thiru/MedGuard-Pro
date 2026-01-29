// SMS Notifications using Brevo API

const BREVO_API_KEY = 'xsmtpsib-0a58b714f07d4be9aaeb61b47c0486a3a23f20c9ab7514309d2e514ef84a99d4-AINiHv12c8vm4SWF';
const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

// Send SMS notification
export async function sendSMS(phoneNumber, message) {
    try {
        const response = await fetch(BREVO_SMS_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                type: 'transactional',
                recipient: phoneNumber,
                content: message,
                sender: 'HealthCare'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send SMS');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}

// Send appointment reminder
export async function sendAppointmentReminder(phoneNumber, doctorName, dateTime) {
    const message = `Reminder: You have an appointment with Dr. ${doctorName} on ${dateTime}. Please arrive 10 minutes early.`;
    return await sendSMS(phoneNumber, message);
}

// Send verification status notification
export async function sendVerificationNotification(phoneNumber, status, reason = '') {
    let message;
    if (status === 'approved') {
        message = 'Congratulations! Your doctor profile has been verified and approved. You can now access all features.';
    } else {
        message = `Your doctor profile verification was rejected. Reason: ${reason}. Please update your profile and resubmit.`;
    }
    return await sendSMS(phoneNumber, message);
}

// Send medicine reminder
export async function sendMedicineReminder(phoneNumber, medicineName, timing) {
    const message = `Medicine Reminder: Time to take ${medicineName} - ${timing}. Stay healthy!`;
    return await sendSMS(phoneNumber, message);
}

// Send prescription notification
export async function sendPrescriptionNotification(phoneNumber, doctorName) {
    const message = `New prescription added by Dr. ${doctorName}. Please check your dashboard for details.`;
    return await sendSMS(phoneNumber, message);
}