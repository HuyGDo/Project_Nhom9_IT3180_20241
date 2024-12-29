from flask import Flask, request, jsonify
from modelling import create_embeddings, find_similar_recipes
from pymongo import MongoClient
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client.BussinCookin

# Sửa lại route decorator
@app.route('/recommend', methods=['POST'])
def get_recommendations():
    try:
        data = request.json
        recipe_id = data['recipeId']
        n_recommendations = data.get('n', 5)
        print(f"\nGetting recommendations for recipe: {recipe_id}")
        
        recipes = list(db.recipes.find({}))
        print(f"Found {len(recipes)} recipes in database")
        
        if not recipes:
            return jsonify({'recommendations': []})
            
        processed_recipes, tfidf_matrix = create_embeddings(recipes)
        recommendations = find_similar_recipes(recipe_id, processed_recipes, tfidf_matrix, n_recommendations)
        recommendations = [str(rec_id) for rec_id in recommendations]
        print(f"Found {len(recommendations)} recommendations")
        
        return jsonify({'recommendations': recommendations})
        
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        return jsonify({'recommendations': [], 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)