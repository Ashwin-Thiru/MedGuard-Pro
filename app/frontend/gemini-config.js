// Gemini API Configuration
const GEMINI_CONFIG = {
    API_KEY: 'AIzaSyAgWY7bm69pd2INumqsJRkbdZxMcNtYMqY', // Replace with your actual Gemini API key
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    MODEL: 'gemini-1.5-flash'
};

// Function to call Gemini API
async function callGeminiAPI(prompt, imageBase64 = null) {
    try {
        const requestBody = {
            contents: [{
                parts: []
            }]
        };

        // Add text prompt
        requestBody.contents[0].parts.push({
            text: prompt
        });

        // Add image if provided
        if (imageBase64) {
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64
                }
            });
        }

        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No response generated');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

// Function to convert image file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}