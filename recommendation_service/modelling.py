import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import nltk
from nltk.corpus import stopwords
import string
from pymongo import MongoClient
from bson import ObjectId
from flask_cors import CORS
from flask import Flask, request, jsonify
nltk.download('stopwords')
def create_embeddings(recipes):
   """Create and save embeddings for all recipes"""
   processed_recipes = []
   texts = []
   
   for recipe in recipes:
       # Process text with more weight on title and ingredients
       title = ' '.join([recipe['title'].lower()] * 5)  # More weight on title
       ingredients = ' '.join([ing['name'].lower() for ing in recipe['ingredients']] * 3)  # More weight on ingredients
       description = recipe.get('description', '').lower()
       
       # Combine all text
       text = f"{title} {ingredients} {description}"
       print(f"Processing recipe: {recipe['title']}")
       print(f"Text: {text[:100]}...")
       
       processed_recipes.append({
           '_id': recipe['_id'],
           'title': recipe['title']
       })
       texts.append(text)
   
   # Create TF-IDF vectors with better parameters
   vectorizer = TfidfVectorizer(
       stop_words='english',
       ngram_range=(1, 2),  # Use both single words and pairs
       min_df=1,
       max_df=0.9
   )
   tfidf_matrix = vectorizer.fit_transform(texts)
   
   return processed_recipes, tfidf_matrix
def find_similar_recipes(recipe_id, processed_recipes, tfidf_matrix, num_similar=5):
   try:
       # Convert string ID to ObjectId
       if isinstance(recipe_id, str):
           recipe_id = ObjectId(recipe_id)
           
       # Get recipe index
       recipe_index = next((i for i, r in enumerate(processed_recipes) 
                          if r['_id'] == recipe_id), None)
       
       if recipe_index is None:
           print(f"Recipe ID {recipe_id} not found in {len(processed_recipes)} recipes")
           return []
           
       print(f"\nFinding similar recipes for: {processed_recipes[recipe_index]['title']}")
           
       # Calculate similarities
       similarity_scores = cosine_similarity(tfidf_matrix[recipe_index], tfidf_matrix)[0]
       
       # Print all similarity scores for debugging
       print("\nAll similarity scores:")
       for idx, score in enumerate(similarity_scores):
           if idx != recipe_index:
               print(f"{processed_recipes[idx]['title']}: {score:.3f}")
        
       # Get similar recipes with lower threshold
       similar_recipes = []
       for idx in similarity_scores.argsort()[::-1]:
           if idx != recipe_index and similarity_scores[idx] > 0.05:  # Lower threshold
               similar_recipes.append(processed_recipes[idx]['_id'])
               print(f"Adding recommendation: {processed_recipes[idx]['title']} (score: {similarity_scores[idx]:.3f})")
               if len(similar_recipes) >= num_similar:
                   break
                   
       return similar_recipes
       
   except Exception as e:
       print(f"Error finding similar recipes: {str(e)}")
       return []