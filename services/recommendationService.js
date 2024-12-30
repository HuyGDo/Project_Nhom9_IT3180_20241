const axios = require("axios");

class RecommendationService {
    static baseUrl = 'http://localhost:5001';
    static initialized = false;
    static maxRetries = 3;
    static retryDelay = 1000; // 1 second

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
        if (this.initialized) {
            return;
        }

        try {
            console.log('Initializing recommendation service...');
            await this.retry(async () => {
                const response = await axios.post(`${this.baseUrl}/initialize`);
                console.log('Recommendation service initialized:', response.data);
                this.initialized = true;
                return response.data;
            });
        } catch (error) {
            console.error('Failed to initialize recommendation service after retries:', error.message);
        }
    }

    static async getRecommendations(recipeId) {
        try {
            if (!this.initialized) {
                console.log('Service not initialized, attempting to initialize...');
                await this.initialize();
            }

            return await this.retry(async () => {
                console.log(`Getting recommendations for recipe ${recipeId}...`);
                const response = await axios.get(`${this.baseUrl}/recommendations/${recipeId}`);
                
                if (!response.data) {
                    console.log('No recommendations received');
                    return [];
                }
                
                console.log('Received recommendations:', response.data);
                return response.data;
            });
        } catch (error) {
            console.error('Error getting recommendations:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
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
            console.log('Recommendation service not available:', error.message);
            return []; // Trả về mảng rỗng nếu service không hoạt động
        }
    }
}

module.exports = RecommendationService;
