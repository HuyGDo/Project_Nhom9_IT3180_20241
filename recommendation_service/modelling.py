import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
import nltk
from nltk.corpus import stopwords

def create_embeddings(recipes):
    try:
        print("Starting create_embeddings...")
        processed_recipes = []
        texts = []
        
        for recipe in recipes:
            try:
                # Process text with weights
                title = ' '.join([recipe.get('title', '').lower()] * 3)  # Title weight x3
                
                # Process ingredients
                ingredients = []
                for ing in recipe.get('ingredients', []):
                    if isinstance(ing, dict) and 'name' in ing:
                        ingredients.append(ing['name'].lower())
                ingredients_text = ' '.join(ingredients) * 2  # Ingredients weight x2
                
                description = recipe.get('description', '').lower()
                
                # Combine all text
                text = f"{title} {ingredients_text} {description}"
                
                processed_recipes.append({
                    '_id': recipe['_id'],
                    'title': recipe['title']
                })
                texts.append(text)
                
            except Exception as e:
                print(f"Error processing recipe {recipe.get('title', 'Unknown')}: {str(e)}")
                continue
        
        if not texts:
            raise ValueError("No valid texts to process")
            
        # Create TF-IDF vectors
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        
        tfidf_matrix = vectorizer.fit_transform(texts)
        print(f"Created TF-IDF matrix with shape: {tfidf_matrix.shape}")
        return processed_recipes, tfidf_matrix
        
    except Exception as e:
        print(f"Error in create_embeddings: {str(e)}")
        raise

def find_similar_recipes(recipe_id, processed_recipes, tfidf_matrix, num_similar=4):
    try:
        print("\n" + "="*50)
        print(f"Finding similar recipes for ID: {recipe_id}")
        
        if isinstance(recipe_id, str):
            recipe_id = ObjectId(recipe_id)
            
        # Find source recipe index
        recipe_index = next((i for i, r in enumerate(processed_recipes) 
                           if r['_id'] == recipe_id), None)
        
        if recipe_index is None:
            print(f"Recipe ID {recipe_id} not found")
            return [], []  # Return empty lists for both recipes and scores
            
        source_recipe = processed_recipes[recipe_index]['title']
        print(f"\nSource Recipe: {source_recipe}")
        print("="*50)
        
        # Calculate similarities
        similarity_scores = cosine_similarity(tfidf_matrix[recipe_index], tfidf_matrix)[0]
        
        # Create list of (index, title, score) tuples
        recipe_scores = []
        for idx, score in enumerate(similarity_scores):
            if idx != recipe_index:  # Skip source recipe
                recipe_scores.append((
                    idx,
                    processed_recipes[idx]['title'],
                    score
                ))
        
        # Sort by similarity score and get top 4
        recipe_scores.sort(key=lambda x: x[2], reverse=True)
        top_recipes = recipe_scores[:num_similar]
        
        # Separate recipes and scores
        similar_recipes = []
        similarity_scores = []
        
        print("\nSelected Recommendations:")
        print("-"*70)
        for idx, title, score in top_recipes:
            similar_recipes.append(processed_recipes[idx]['_id'])
            similarity_scores.append(score)
            print(f"[SELECTED] {title:<50} (score: {score:.3f})")
                
        print("\nSummary:")
        print(f"- Source Recipe: {source_recipe}")
        print(f"- Found {len(similar_recipes)} recommendations")
        print("="*50 + "\n")
        
        return similar_recipes, similarity_scores  # Make sure to return both lists
        
    except Exception as e:
        print(f"Error in find_similar_recipes: {str(e)}")
        return [], []  # Return empty lists in case of error