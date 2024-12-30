const axios = require("axios");

class RecommendationService {
    static baseUrl = 'http://localhost:5001';
    static initialized = false;
    static maxRetries = 3;
    static retryDelay = 1000;

    static async retry(fn, retries = this.maxRetries) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.retry(fn, retries - 1);
            }
            throw error;
        }
    }

    static async initialize() {
        if (this.initialized) return;

        try {
            const response = await axios.post(`${this.baseUrl}/initialize`);
            console.log('Recommendation service initialized:', response.data);
            this.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error.message);
            throw error;
        }
    }

    static async getRecommendations(recipeId) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const response = await axios.get(`${this.baseUrl}/recommendations/${recipeId}`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Kiểm tra và xử lý response
            if (!response.data || !Array.isArray(response.data)) {
                console.log('Invalid response format');
                return [];
            }

            // Sắp xếp theo similarity_score và lấy 4 công thức đầu tiên
            const recommendations = response.data
                .sort((a, b) => b.similarity_score - a.similarity_score)
                .slice(0, 4);

            console.log('Top 4 recommendations:', 
                recommendations.map(r => `${r.title} (score: ${r.similarity_score})`));

            return recommendations;

        } catch (error) {
            console.error('Recommendation service error:', error);
            return [];
        }
    }

    static async checkService() {
        try {
            const response = await this.retry(async () => {
                return await axios.get(`${this.baseUrl}/health`);
            });
            return response.status === 200;
        } catch (error) {
            console.log('Service health check failed:', error.message);
            return false;
        }
    }
}

module.exports = RecommendationService;
