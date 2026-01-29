class PharmacyFinderApp {
    constructor() {
        this.mapHandler = null;
        this.reviewAnalyzer = new ReviewAnalyzer();
        this.currentPharmacies = [];
        this.userLocation = null;
        this.isLoading = false;
        this.sortMode = 'nearest'; // 'nearest' or 'topRated'
        
        this.initElements();
        this.initEventListeners();
        this.init();
    }

    initElements() {
        this.elements = {
            searchBtn: document.getElementById('searchBtn'),
            btnText: document.getElementById('btnText'),
            btnLoader: document.getElementById('btnLoader'),
            radiusInput: document.getElementById('radius'),
            locationInfo: document.getElementById('locationInfo'),
            pharmacyList: document.getElementById('pharmacyList'),
            resultsHeader: document.getElementById('resultsHeader'),
            resultCount: document.getElementById('resultCount'),
            noResults: document.getElementById('noResults'),
            welcomeMessage: document.getElementById('welcomeMessage'),
            errorMessage: document.getElementById('errorMessage'),
            mapLoader: document.getElementById('mapLoader'),
            sortNearest: document.getElementById('sortNearest'),
            sortTopRated: document.getElementById('sortTopRated'),
            sortControls: document.getElementById('sortControls'),
            reviewModal: document.getElementById('reviewModal'),
            modalContent: document.getElementById('modalContent'),
            closeModal: document.getElementById('closeModal'),
            analysisProgress: document.getElementById('analysisProgress')
        };
    }

    initEventListeners() {
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.sortNearest.addEventListener('click', () => this.sortPharmacies('nearest'));
        this.elements.sortTopRated.addEventListener('click', () => this.sortPharmacies('topRated'));
        this.elements.closeModal.addEventListener('click', () => this.closeReviewModal());
        this.elements.reviewModal.addEventListener('click', (e) => {
            if (e.target === this.elements.reviewModal) this.closeReviewModal();
        });
    }

    async init() {
        try {
            this.showMapLoader(true);
            await loadGoogleMapsAPI();
            this.mapHandler = new MapHandler();
            const success = await this.mapHandler.initMap();
            if (!success) {
                throw new Error("Map library loaded but initialization failed.");
            }
            this.showMapLoader(false);
        } catch (error) {
            this.showMapLoader(false);
            this.showError("Initialization Error: " + error.message);
            if (!this.mapHandler) this.mapHandler = new MapHandler(); 
        }
    }

    async handleSearch() {
        if (this.isLoading) return;
        try {
            this.isLoading = true;
            this.setLoadingState(true);
            this.hideError();
            this.elements.sortControls.classList.add('hidden');

            const pos = await this.getUserLocation();
            this.userLocation = pos;
            
            await this.mapHandler.addUserMarker(pos);
            const radius = parseInt(this.elements.radiusInput.value) || 5;
            this.mapHandler.updateSearchRadius(radius);

            const results = await this.mapHandler.searchNearbyPharmacies(pos, radius);
            
            if (results.length === 0) {
                this.currentPharmacies = [];
                this.displayResults();
                return;
            }

            // Process basic pharmacy data first
            let processedPharmacies = this.processPharmacies(results, pos);
            
            // Filter out pharmacies beyond the search radius
            this.currentPharmacies = processedPharmacies.filter(p => p.distance <= radius);
            
            if (this.currentPharmacies.length === 0) {
                this.displayResults();
                return;
            }
            
            // Show initial results
            this.sortPharmacies('nearest');
            this.elements.sortControls.classList.remove('hidden');

            // Fetch reviews in background
            this.fetchAndAnalyzeReviews();

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }

    async fetchAndAnalyzeReviews() {
        this.showAnalysisProgress(true);
        let processed = 0;

        for (const pharmacy of this.currentPharmacies) {
            try {
                if (pharmacy.place_id) {
                    const details = await this.mapHandler.getPlaceDetails(pharmacy.place_id);
                    
                    if (details) {
                        pharmacy.rating = details.rating || 0;
                        pharmacy.userRatingsTotal = details.user_ratings_total || 0;
                        pharmacy.reviews = details.reviews || [];
                        pharmacy.phone = details.formatted_phone_number || '';
                        pharmacy.openingHours = details.opening_hours;
                        
                        // Analyze reviews
                        pharmacy.reviewAnalysis = this.reviewAnalyzer.analyzeReviews(pharmacy.reviews);
                        
                        // Calculate overall score
                        pharmacy.overallScore = this.reviewAnalyzer.calculateOverallScore(pharmacy);
                    }
                }
            } catch (error) {
                console.warn(`Failed to fetch details for ${pharmacy.name}:`, error);
            }

            processed++;
            this.updateAnalysisProgress(processed, this.currentPharmacies.length);
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.showAnalysisProgress(false);
        
        // Re-sort if in top-rated mode
        if (this.sortMode === 'topRated') {
            this.sortPharmacies('topRated');
        } else {
            // Just refresh the display with new data
            this.displayResults();
        }
    }

    getUserLocation() {
        return new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(
                (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
                () => rej(new Error("Please allow location access.")),
                { enableHighAccuracy: true }
            );
        });
    }

    processPharmacies(pharmacies, userLoc) {
        return pharmacies.map(p => {
            const pharmacyLat = typeof p.geometry.location.lat === 'function' 
                ? p.geometry.location.lat() 
                : p.geometry.location.lat;
            const pharmacyLng = typeof p.geometry.location.lng === 'function' 
                ? p.geometry.location.lng() 
                : p.geometry.location.lng;
                
            const dist = this.mapHandler.calculateDistance(
                userLoc.lat, userLoc.lng, pharmacyLat, pharmacyLng
            );
            
            return { 
                ...p, 
                distance: dist,
                distanceText: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`,
                rating: 0,
                userRatingsTotal: 0,
                reviews: [],
                reviewAnalysis: null,
                overallScore: 0
            };
        });
    }

    sortPharmacies(mode) {
        this.sortMode = mode;
        
        // Update button states
        this.elements.sortNearest.classList.toggle('active', mode === 'nearest');
        this.elements.sortTopRated.classList.toggle('active', mode === 'topRated');
        
        if (mode === 'nearest') {
            this.currentPharmacies.sort((a, b) => a.distance - b.distance);
        } else {
            // Sort by overall score (highest first)
            this.currentPharmacies.sort((a, b) => b.overallScore - a.overallScore);
        }
        
        this.displayResults();
        this.updateMapMarkers();
    }

    displayResults() {
        this.elements.welcomeMessage.classList.add('hidden');
        
        if (this.currentPharmacies.length === 0) {
            this.elements.noResults.classList.remove('hidden');
            this.elements.resultsHeader.classList.add('hidden');
            return;
        }
        
        this.elements.noResults.classList.add('hidden');
        this.elements.resultsHeader.classList.remove('hidden');
        this.elements.resultCount.textContent = `${this.currentPharmacies.length} found`;
        
        this.elements.pharmacyList.innerHTML = this.currentPharmacies
            .map((p, i) => this.createPharmacyCard(p, i))
            .join('');
        
        // Add click listeners for "View Reviews" buttons
        document.querySelectorAll('.view-reviews-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.showReviewModal(this.currentPharmacies[index]);
            });
        });
    }

    createPharmacyCard(pharmacy, index) {
        const ratingStars = pharmacy.rating 
            ? '⭐'.repeat(Math.round(pharmacy.rating))
            : '';
        
        const ratingHTML = pharmacy.rating 
            ? `<div class="pharmacy-rating">
                   <span class="stars">${ratingStars}</span>
                   <span class="rating-text">${pharmacy.rating.toFixed(1)} (${pharmacy.userRatingsTotal} reviews)</span>
               </div>`
            : '<div class="pharmacy-rating"><span class="no-rating">No ratings yet</span></div>';
        
        const scoreHTML = pharmacy.overallScore > 0
            ? `<div class="overall-score">
                   <span class="score-label">Overall Score:</span>
                   <span class="score-value">${(pharmacy.overallScore * 100).toFixed(0)}/100</span>
               </div>`
            : '';
        
        // Show mini rating distribution instead of sentiment badge
        const distributionHTML = pharmacy.reviewAnalysis && pharmacy.reviewAnalysis.ratingDistribution
            ? `<div class="mini-distribution">
                   <div class="mini-dist-header">Rating Breakdown:</div>
                   <div class="mini-bars">
                       ${[5, 4, 3, 2, 1].map(star => {
                           const percentage = pharmacy.reviewAnalysis.ratingDistribution.percentages[star];
                           if (percentage == 0) return '';
                           return `
                               <div class="mini-bar-item">
                                   <span class="mini-star">${star}⭐</span>
                                   <div class="mini-bar-container">
                                       <div class="mini-bar-fill" style="width: ${percentage}%; background: ${this.getStarColor(star)}"></div>
                                   </div>
                                   <span class="mini-percent">${percentage}%</span>
                               </div>
                           `;
                       }).join('')}
                   </div>
                   ${pharmacy.reviewAnalysis.ratingDistribution.consistency > 0 
                       ? `<div class="mini-consistency">
                              <span class="consistency-badge" style="background: ${this.getConsistencyColor(pharmacy.reviewAnalysis.ratingDistribution.consistency)}">
                                  ${(pharmacy.reviewAnalysis.ratingDistribution.consistency * 100).toFixed(0)}% Consistent
                              </span>
                          </div>`
                       : ''}
               </div>`
            : '';
        
        const reviewBtnHTML = pharmacy.reviews && pharmacy.reviews.length > 0
            ? `<button class="view-reviews-btn" data-index="${index}">View Full Analysis & ${pharmacy.reviews.length} Reviews</button>`
            : '';

        return `
            <div class="pharmacy-card" data-index="${index}">
                <div class="pharmacy-header">
                    <strong class="pharmacy-name">${index + 1}. ${pharmacy.name}</strong>
                </div>
                <p class="pharmacy-address">${pharmacy.vicinity}</p>
                <div class="pharmacy-meta">
                    <span class="distance">📍 ${pharmacy.distanceText}</span>
                    ${pharmacy.phone ? `<span class="phone">📞 ${pharmacy.phone}</span>` : ''}
                </div>
                ${ratingHTML}
                ${scoreHTML}
                ${distributionHTML}
                ${reviewBtnHTML}
            </div>
        `;
    }

    getStarColor(star) {
        const colors = {
            5: '#10b981',
            4: '#22c55e',
            3: '#f59e0b',
            2: '#f97316',
            1: '#ef4444'
        };
        return colors[star] || '#94a3b8';
    }

    getConsistencyColor(consistency) {
        if (consistency > 0.8) return '#10b98120';
        if (consistency > 0.6) return '#22c55e20';
        if (consistency > 0.4) return '#f59e0b20';
        return '#ef444420';
    }

    showReviewModal(pharmacy) {
        const analysis = pharmacy.reviewAnalysis;

        const ratingDistHTML = analysis && analysis.ratingDistribution
            ? `
                <div class="review-analysis">
                    <h3>Rating Distribution</h3>
                    <div class="rating-bars">
                        ${[5, 4, 3, 2, 1].map(star => {
                            const count = analysis.ratingDistribution.distribution[star];
                            const percentage = analysis.ratingDistribution.percentages[star];
                            return `
                                <div class="rating-bar-item">
                                    <div class="rating-label">
                                        <span class="star-count">${star} ⭐</span>
                                        <span class="review-count">(${count})</span>
                                    </div>
                                    <div class="rating-bar-container">
                                        <div class="rating-bar-fill" style="width: ${percentage}%; background: ${this.getStarColor(star)}"></div>
                                    </div>
                                    <span class="rating-percentage">${percentage}%</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="consistency-score">
                        <span class="consistency-label">Rating Consistency:</span>
                        <div class="consistency-bar-container">
                            <div class="consistency-bar-fill" style="width: ${(analysis.ratingDistribution.consistency * 100).toFixed(0)}%"></div>
                        </div>
                        <span class="consistency-text">${(analysis.ratingDistribution.consistency * 100).toFixed(0)}% consistent</span>
                    </div>
                </div>
            `
            : '';

        const statsHTML = analysis && analysis.hasEnoughReviews
            ? `
                <div class="review-stats">
                    <div class="stat-card positive">
                        <div class="stat-icon">👍</div>
                        <div class="stat-info">
                            <div class="stat-value">${analysis.positiveCount}</div>
                            <div class="stat-label">Positive (4-5⭐)</div>
                        </div>
                    </div>
                    <div class="stat-card neutral">
                        <div class="stat-icon">😐</div>
                        <div class="stat-info">
                            <div class="stat-value">${analysis.neutralCount}</div>
                            <div class="stat-label">Neutral (3⭐)</div>
                        </div>
                    </div>
                    <div class="stat-card negative">
                        <div class="stat-icon">👎</div>
                        <div class="stat-info">
                            <div class="stat-value">${analysis.negativeCount}</div>
                            <div class="stat-label">Negative (1-2⭐)</div>
                        </div>
                    </div>
                </div>
            `
            : '';

        const topPositiveHTML = analysis && analysis.topPositive.length > 0
            ? `
                <div class="top-reviews positive">
                    <h4>⭐ Top Rated Reviews</h4>
                    ${analysis.topPositive.map(r => `
                        <div class="review-item">
                            <div class="review-header">
                                <strong>${r.author}</strong>
                                <span class="review-rating">${'⭐'.repeat(r.rating)}</span>
                            </div>
                            <p>${r.text}</p>
                            <span class="review-time">${r.time}</span>
                        </div>
                    `).join('')}
                </div>
            `
            : '';

        const topNegativeHTML = analysis && analysis.topNegative.length > 0
            ? `
                <div class="top-reviews negative">
                    <h4>⚠️ Low Rated Reviews</h4>
                    ${analysis.topNegative.map(r => `
                        <div class="review-item">
                            <div class="review-header">
                                <strong>${r.author}</strong>
                                <span class="review-rating">${'⭐'.repeat(r.rating)}</span>
                            </div>
                            <p>${r.text}</p>
                            <span class="review-time">${r.time}</span>
                        </div>
                    `).join('')}
                </div>
            `
            : '';

        const allReviewsHTML = pharmacy.reviews && pharmacy.reviews.length > 0
            ? `
                <div class="all-reviews">
                    <h4>All Reviews (${pharmacy.reviews.length})</h4>
                    ${pharmacy.reviews.map(r => `
                        <div class="review-item">
                            <div class="review-header">
                                <strong>${r.author_name}</strong>
                                <span class="review-rating">${'⭐'.repeat(r.rating)}</span>
                            </div>
                            <p>${r.text}</p>
                            <span class="review-time">${r.relative_time_description}</span>
                        </div>
                    `).join('')}
                </div>
            `
            : '<p>No reviews available for this pharmacy.</p>';

        this.elements.modalContent.innerHTML = `
            <h2>${pharmacy.name}</h2>
            <p class="modal-address">${pharmacy.vicinity}</p>
            <div class="modal-meta">
                <span>📍 ${pharmacy.distanceText}</span>
                ${pharmacy.rating ? `<span>⭐ ${pharmacy.rating.toFixed(1)} (${pharmacy.userRatingsTotal} reviews)</span>` : ''}
                ${pharmacy.overallScore ? `<span>🏆 ${(pharmacy.overallScore * 100).toFixed(0)}/100</span>` : ''}
            </div>
            ${ratingDistHTML}
            ${statsHTML}
            ${topPositiveHTML}
            ${topNegativeHTML}
            ${allReviewsHTML}
        `;

        this.elements.reviewModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    getStarColor(star) {
        const colors = {
            5: '#10b981',
            4: '#22c55e',
            3: '#f59e0b',
            2: '#f97316',
            1: '#ef4444'
        };
        return colors[star] || '#94a3b8';
    }

    closeReviewModal() {
        this.elements.reviewModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    async updateMapMarkers() {
        await this.mapHandler.addPharmacyMarkers(this.currentPharmacies, (p, i) => {
            this.highlightPharmacyCard(i);
        });
    }

    highlightPharmacyCard(index) {
        document.querySelectorAll('.pharmacy-card').forEach(card => {
            card.classList.remove('highlighted');
        });
        const card = document.querySelector(`.pharmacy-card[data-index="${index}"]`);
        if (card) {
            card.classList.add('highlighted');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showAnalysisProgress(show) {
        this.elements.analysisProgress.classList.toggle('hidden', !show);
    }

    updateAnalysisProgress(current, total) {
        this.elements.analysisProgress.textContent = `Analyzing reviews... ${current}/${total}`;
    }

    setLoadingState(loading) {
        this.elements.searchBtn.disabled = loading;
        this.elements.btnLoader.classList.toggle('hidden', !loading);
        this.elements.btnText.classList.toggle('hidden', loading);
    }

    showMapLoader(s) { 
        this.elements.mapLoader.classList.toggle('hidden', !s); 
    }
    
    showError(m) { 
        this.elements.errorMessage.textContent = m; 
        this.elements.errorMessage.classList.remove('hidden'); 
    }
    
    hideError() { 
        this.elements.errorMessage.classList.add('hidden'); 
    }
}

document.addEventListener('DOMContentLoaded', () => new PharmacyFinderApp());