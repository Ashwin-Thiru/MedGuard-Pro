class ReviewAnalyzer {
    constructor() {
        // Positive and negative keywords for sentiment analysis
        this.positiveWords = [
            'excellent', 'great', 'good', 'best', 'amazing', 'wonderful', 'fantastic',
            'helpful', 'friendly', 'professional', 'quick', 'fast', 'clean', 'reliable',
            'recommend', 'love', 'perfect', 'quality', 'awesome', 'nice', 'pleasant',
            'efficient', 'caring', 'polite', 'knowledgeable', 'trustworthy'
        ];
        
        this.negativeWords = [
            'bad', 'terrible', 'worst', 'poor', 'awful', 'horrible', 'disappointing',
            'rude', 'unprofessional', 'slow', 'dirty', 'expensive', 'overpriced',
            'unhelpful', 'disorganized', 'waited', 'long wait', 'never', 'avoid',
            'waste', 'incompetent', 'careless', 'negligent', 'arrogant'
        ];
    }

    /**
     * Analyze sentiment of a single review text
     * Returns a score between -1 (very negative) and 1 (very positive)
     */
    analyzeSentiment(text) {
        if (!text) return 0;
        
        const lowerText = text.toLowerCase();
        let score = 0;
        
        // Count positive words
        this.positiveWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) score += matches.length;
        });
        
        // Count negative words
        this.negativeWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) score -= matches.length;
        });
        
        // Normalize to -1 to 1 range
        const wordCount = lowerText.split(/\s+/).length;
        return Math.max(-1, Math.min(1, score / Math.max(wordCount * 0.1, 1)));
    }

    /**
     * Analyze rating distribution
     */
    analyzeRatingDistribution(reviews) {
        const distribution = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };

        reviews.forEach(review => {
            if (review.rating >= 1 && review.rating <= 5) {
                distribution[review.rating]++;
            }
        });

        // Calculate percentages
        const total = reviews.length;
        const percentages = {};
        Object.keys(distribution).forEach(star => {
            percentages[star] = total > 0 ? (distribution[star] / total * 100).toFixed(1) : 0;
        });

        // Calculate rating consistency (lower variance = more consistent)
        const ratings = reviews.map(r => r.rating);
        const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
        const consistency = Math.max(0, 1 - (variance / 4)); // Normalize to 0-1 (max variance is 4)

        return {
            distribution,
            percentages,
            consistency,
            totalReviews: total
        };
    }

    /**
     * Analyze all reviews for a pharmacy
     * Returns comprehensive analysis object
     */
    analyzeReviews(reviews) {
        if (!reviews || reviews.length === 0) {
            return {
                averageSentiment: 0,
                sentimentScore: 0,
                positiveCount: 0,
                negativeCount: 0,
                neutralCount: 0,
                totalReviews: 0,
                hasEnoughReviews: false,
                topPositive: [],
                topNegative: [],
                ratingDistribution: null
            };
        }

        const sentiments = reviews.map(review => ({
            text: review.text,
            rating: review.rating,
            sentiment: this.analyzeSentiment(review.text),
            author: review.author_name,
            time: review.relative_time_description
        }));

        const averageSentiment = sentiments.reduce((sum, s) => sum + s.sentiment, 0) / sentiments.length;
        
        // Categorize by rating (not sentiment)
        const fiveStars = sentiments.filter(s => s.rating === 5);
        const fourStars = sentiments.filter(s => s.rating === 4);
        const threeStars = sentiments.filter(s => s.rating === 3);
        const twoStars = sentiments.filter(s => s.rating === 2);
        const oneStar = sentiments.filter(s => s.rating === 1);

        // Get top and bottom rated reviews
        const topRated = sentiments
            .filter(s => s.rating >= 4)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
        
        const lowRated = sentiments
            .filter(s => s.rating <= 2)
            .sort((a, b) => a.rating - b.rating)
            .slice(0, 3);

        // Get rating distribution
        const ratingDistribution = this.analyzeRatingDistribution(reviews);

        return {
            averageSentiment,
            sentimentScore: (averageSentiment + 1) / 2,
            positiveCount: fiveStars.length + fourStars.length,
            negativeCount: oneStar.length + twoStars.length,
            neutralCount: threeStars.length,
            totalReviews: reviews.length,
            hasEnoughReviews: reviews.length >= CONFIG.MIN_REVIEWS_FOR_ANALYSIS,
            topPositive: topRated,
            topNegative: lowRated,
            allSentiments: sentiments,
            ratingDistribution,
            fiveStarCount: fiveStars.length,
            fourStarCount: fourStars.length,
            threeStarCount: threeStars.length,
            twoStarCount: twoStars.length,
            oneStarCount: oneStar.length
        };
    }

    /**
     * Calculate overall score combining rating, sentiment, and distance
     */
    calculateOverallScore(pharmacy) {
        const { rating, userRatingsTotal, reviewAnalysis, distance } = pharmacy;
        
        // Normalize rating (0-5 to 0-1)
        const ratingScore = rating ? rating / 5 : 0;
        
        // Sentiment score (already 0-1)
        const sentimentScore = reviewAnalysis ? reviewAnalysis.sentimentScore : 0.5;
        
        // Distance score (inverse, closer is better, normalize to 0-1)
        // Assume max distance is 50km
        const distanceScore = Math.max(0, 1 - (distance / 50));
        
        // Apply weights
        const weights = CONFIG.REVIEW_WEIGHTS;
        const overallScore = 
            (ratingScore * weights.rating) +
            (sentimentScore * weights.sentiment) +
            (distanceScore * weights.distance);
        
        // Bonus for having more reviews (reliability factor)
        const reviewBonus = userRatingsTotal 
            ? Math.min(0.1, (userRatingsTotal / 100) * 0.1) 
            : 0;
        
        return Math.min(1, overallScore + reviewBonus);
    }

    /**
     * Get sentiment label and color
     */
    getSentimentLabel(score) {
        if (score > 0.6) return { label: 'Very Positive', color: '#10b981', emoji: '😊' };
        if (score > 0.4) return { label: 'Positive', color: '#22c55e', emoji: '🙂' };
        if (score > 0.3) return { label: 'Neutral', color: '#94a3b8', emoji: '😐' };
        if (score > 0.2) return { label: 'Negative', color: '#f97316', emoji: '😕' };
        return { label: 'Very Negative', color: '#ef4444', emoji: '😞' };
    }
}