from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import numpy as np
from bson import ObjectId
from modelling import create_embeddings, find_similar_recipes
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5001"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"]
    }
})

# Kết nối MongoDB
try:
    client = MongoClient('mongodb+srv://huydg226085:818Dt5bQCl4YD70A@moji-web-cluster.r57n8.mongodb.net/BussinCookin')
    db = client['BussinCookin']
    recipes_collection = db['recipes']
    
    # Test connection
    client.server_info()
    logger.info("MongoDB Atlas connection successful")
    
    # Test data
    recipes_count = recipes_collection.count_documents({})
    logger.info(f"Found {recipes_count} recipes in database")
    
except Exception as e:
    logger.error(f"MongoDB Atlas connection error: {str(e)}")
    raise e

# Khởi tạo biến global
processed_recipes = None 
tfidf_matrix = None

@app.route('/initialize', methods=['POST'])
def initialize_embeddings():
    """Initialize embeddings from database"""
    global processed_recipes, tfidf_matrix
    try:
        logger.info("Starting initialization...")
        recipes = list(recipes_collection.find({}))
        if len(recipes) == 0:
            return jsonify({"error": "No recipes found in database"}), 404
            
        processed_recipes, tfidf_matrix = create_embeddings(recipes)
        logger.info("Embeddings created successfully")
        
        return jsonify({
            "message": "Embeddings initialized successfully", 
            "recipe_count": len(recipes)
        })
    except Exception as e:
        logger.error(f"Initialization error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/<recipe_id>', methods=['GET'])
def get_recommendations(recipe_id):
    """Get recommendations for a specific recipe"""
    global processed_recipes, tfidf_matrix
    try:
        logger.info(f"Getting recommendations for recipe: {recipe_id}")
        
        # Khởi tạo embeddings nếu chưa có
        if not processed_recipes or tfidf_matrix is None:
            logger.info("Initializing embeddings...")
            recipes = list(recipes_collection.find({}))
            if not recipes:
                logger.error("No recipes found in database")
                return jsonify([])
            processed_recipes, tfidf_matrix = create_embeddings(recipes)
            
        # Lấy similar recipes và scores
        similar_recipes, similarity_scores = find_similar_recipes(recipe_id, processed_recipes, tfidf_matrix)
        
        if not similar_recipes or not similarity_scores:
            logger.warning("No recommendations found")
            return jsonify([])
            
        # Log để debug
        logger.info(f"Found {len(similar_recipes)} similar recipes")
        logger.info(f"Similarity scores: {similarity_scores}")
        
        # Lấy chi tiết recipes và thêm similarity scores
        recommendations = []
        for rec_id, score in zip(similar_recipes, similarity_scores):
            recipe = recipes_collection.find_one({"_id": rec_id})
            if recipe:
                recommendation = {
                    "id": str(recipe["_id"]),
                    "title": recipe["title"],
                    "description": recipe.get("description", ""),
                    "image": recipe.get("image", ""),
                    "slug": recipe.get("slug", ""),
                    "similarity_score": float(score)
                }
                recommendations.append(recommendation)
                logger.info(f"Added recommendation: {recipe['title']} (score: {score:.3f})")
                
        logger.info(f"Returning {len(recommendations)} recommendations")
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify([])

@app.route('/health', methods=['GET'])
def health_check():
    """Check if service is running"""
    try:
        recipes_count = recipes_collection.count_documents({})
        return jsonify({
            "status": "ok",
            "database": "connected",
            "recipes_count": recipes_count
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    try:
        logger.info("Starting recommendation service...")
        # Tắt debugger và reloader để tránh lỗi socket
        app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
    except Exception as e:
        logger.error(f"Failed to start service: {str(e)}")