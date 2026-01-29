class MapHandler {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userMarker = null;
        this.infoWindow = null;
        this.currentLocation = null;
        this.searchCircle = null;
        this.placesService = null;
    }

    async initMap(center = CONFIG.DEFAULT_CENTER) {
        try {
            const { Map } = await google.maps.importLibrary("maps");
            
            this.map = new Map(document.getElementById('map'), {
                center: center,
                zoom: CONFIG.DEFAULT_ZOOM,
                mapId: CONFIG.MAP_ID, 
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true
            });

            // Initialize Places Service for getting place details
            this.placesService = new google.maps.places.PlacesService(this.map);
            this.infoWindow = new google.maps.InfoWindow();

            console.log('Map initialized successfully');
            return true;
        } catch (error) {
            console.error('Error in MapHandler.initMap:', error);
            return false;
        }
    }

    async addUserMarker(location) {
        if (this.userMarker) this.userMarker.map = null;
        this.currentLocation = location;

        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        
        const pin = new PinElement({
            background: "#4285F4",
            glyphColor: "white",
            borderColor: "#ffffff",
        });

        this.userMarker = new AdvancedMarkerElement({
            position: location,
            map: this.map,
            content: pin.element,
            title: 'Your Location'
        });

        this.updateSearchRadius(CONFIG.DEFAULT_RADIUS);
        this.map.setCenter(location);
    }

    updateSearchRadius(radiusKm) {
        if (this.searchCircle) {
            this.searchCircle.setMap(null);
        }

        if (this.currentLocation) {
            this.searchCircle = new google.maps.Circle({
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#4285F4',
                fillOpacity: 0.15,
                map: this.map,
                center: this.currentLocation,
                radius: radiusKm * 1000
            });

            this.map.fitBounds(this.searchCircle.getBounds());
        }
    }

    async searchNearbyPharmacies(location, radiusKm) {
        try {
            const { Place } = await google.maps.importLibrary("places");
            
            const request = {
                textQuery: 'pharmacy',
                fields: ['displayName', 'location', 'formattedAddress', 'id'],
                locationBias: {
                    center: location,
                    radius: radiusKm * 1000
                },
                maxResultCount: CONFIG.MAX_RESULTS
            };

            const { places } = await Place.searchByText(request);

            if (!places || places.length === 0) {
                return [];
            }

            // Convert to format compatible with existing code and get place IDs
            return places.map(place => ({
                name: place.displayName,
                vicinity: place.formattedAddress,
                geometry: {
                    location: place.location
                },
                place_id: place.id // Store place ID for fetching details
            }));

        } catch (error) {
            console.error('Places search error:', error);
            throw new Error(`Places search failed: ${error.message}`);
        }
    }

    /**
     * Fetch detailed information including reviews for a place
     */
    getPlaceDetails(placeId) {
        return new Promise((resolve, reject) => {
            const request = {
                placeId: placeId,
                fields: ['name', 'rating', 'user_ratings_total', 'reviews', 'opening_hours', 'formatted_phone_number']
            };

            this.placesService.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(place);
                } else {
                    // Don't reject, just return null if details aren't available
                    console.warn(`Could not fetch details for place ${placeId}:`, status);
                    resolve(null);
                }
            });
        });
    }

    async addPharmacyMarkers(pharmacies, onMarkerClick) {
        this.markers.forEach(marker => marker.map = null);
        this.markers = [];

        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

        pharmacies.forEach((pharmacy, index) => {
            const pin = new PinElement({
                background: "#EA4335",
                glyphColor: "white",
                borderColor: "#ffffff",
                glyph: `${index + 1}`
            });

            const marker = new AdvancedMarkerElement({
                position: pharmacy.geometry.location,
                map: this.map,
                content: pin.element,
                title: pharmacy.name
            });

            marker.addListener('click', () => {
                const ratingHTML = pharmacy.rating 
                    ? `<div style="margin: 5px 0;">⭐ ${pharmacy.rating} (${pharmacy.userRatingsTotal || 0} reviews)</div>`
                    : '';
                
                const scoreHTML = pharmacy.overallScore 
                    ? `<div style="margin: 5px 0;">🏆 Score: ${(pharmacy.overallScore * 100).toFixed(0)}/100</div>`
                    : '';

                this.infoWindow.setContent(`
                    <div style="padding: 8px; min-width: 200px;">
                        <strong>${pharmacy.name}</strong><br>
                        ${pharmacy.vicinity}<br>
                        <small>📍 ${pharmacy.distanceText}</small>
                        ${ratingHTML}
                        ${scoreHTML}
                    </div>
                `);
                this.infoWindow.open(this.map, marker);
                if (onMarkerClick) onMarkerClick(pharmacy, index);
            });

            this.markers.push(marker);
        });
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}