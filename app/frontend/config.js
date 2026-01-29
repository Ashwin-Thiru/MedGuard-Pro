const CONFIG = {
    GOOGLE_MAPS_API_KEY: 'AIzaSyAOTXOFjuaMiDdhRmX-ihQoclFR5whO7xU',
    DEFAULT_RADIUS: 5,
    MAX_RADIUS: 50,
    DEFAULT_CENTER: { lat: 12.9716, lng: 77.5946 }, // Bangalore
    DEFAULT_ZOOM: 13,
    PLACE_TYPE: 'pharmacy',
    MAX_RESULTS: 20,
    MAP_ID: 'DEMO_MAP_ID',
    
    // Review analysis settings
    REVIEW_WEIGHTS: {
        rating: 0.4,        // 40% weight for star rating
        sentiment: 0.3,     // 30% weight for review sentiment
        distance: 0.3       // 30% weight for proximity
    },
    MIN_REVIEWS_FOR_ANALYSIS: 3  // Minimum reviews needed for reliable analysis
};

function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps && window.google.maps.importLibrary) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&callback=initReady`;
        script.async = true;
        script.defer = true;

        window.initReady = () => {
            resolve();
        };

        script.onerror = () => reject(new Error('Failed to load Google Maps API script.'));
        document.head.appendChild(script);
    });
}