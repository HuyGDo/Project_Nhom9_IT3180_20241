const axios = require('axios');

class RecommendationService {
    static async getRecommendations(recipeId) {
        try {
            // Thử kết nối với recommendation service
            const response = await axios.post('http://localhost:5000/recommend', {
                recipeId: recipeId
            });
            return response.data.recommendations;
        } catch (error) {
            console.log('Recommendation service not available:', error.message);
            return []; // Trả về mảng rỗng nếu service không hoạt động
        }
    }
}

module.exports = RecommendationService; 