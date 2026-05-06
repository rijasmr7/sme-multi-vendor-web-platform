from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import json
from sentence_transformers import SentenceTransformer, util
import google.generativeai as genai
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Initialize FastAPI App
app = FastAPI(
    title="Hybrid Semantic Recommender",
    description="Microservice using BERT embeddings and Gemini AI refinement",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# STEP 1: CONFIGURE GEMINI
# -------------------------------------------------------------
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    # Using 'gemini-1.5-flash' which is the latest stable model
    model_gemini = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# -------------------------------------------------------------
# STEP 2: LOAD SEMANTIC MODEL (BERT-based)
# -------------------------------------------------------------
# This model converts sentences into "dense vectors" that capture meaning
print("Loading SentenceTransformer model...")
semantic_model = SentenceTransformer('all-MiniLM-L6-v2')

# -------------------------------------------------------------
# STEP 3: PREPARE DATA
# -------------------------------------------------------------
products = [
    {"id": 1, "name": "Organic Apple", "description": "Fresh organic red apple from local farms", "category": "fruit"},
    {"id": 2, "name": "Banana", "description": "Sweet yellow banana rich in potassium", "category": "fruit"},
    {"id": 3, "name": "Whole Milk", "description": "Fresh dairy milk 1 liter", "category": "dairy"},
    {"id": 4, "name": "Cheddar Cheese", "description": "Aged cheddar cheese block", "category": "dairy"},
    {"id": 5, "name": "Brown Bread", "description": "Healthy whole wheat brown bread", "category": "bakery"},
    {"id": 6, "name": "Chocolate Cookies", "description": "Crunchy cookies with dark chocolate chips", "category": "bakery"},
    {"id": 7, "name": "Green Tea", "description": "Organic green tea leaves with antioxidants", "category": "beverage"},
    {"id": 8, "name": "Orange Juice", "description": "100% pure squeezed orange juice", "category": "beverage"},
    {"id": 9, "name": "Greek Yogurt", "description": "Creamy protein-rich greek yogurt", "category": "dairy"},
    {"id": 10, "name": "Sourdough Bread", "description": "Traditional fermented sourdough bread", "category": "bakery"},
]

df = pd.DataFrame(products)
# Sample Purchase History for Collaborative Filtering
purchase_history = [
    # User 1 (Target)
    {"user_id": 1, "product_id": 1}, {"user_id": 1, "product_id": 2},
    # User 2 (Similar to User 1)
    {"user_id": 2, "product_id": 1}, {"user_id": 2, "product_id": 2}, {"user_id": 2, "product_id": 3}, {"user_id": 2, "product_id": 5},
    # User 3 (Similar to User 1)
    {"user_id": 3, "product_id": 2}, {"user_id": 3, "product_id": 3}, {"user_id": 3, "product_id": 4},
    # User 4 (Tea Enthusiast)
    {"user_id": 4, "product_id": 7}, {"user_id": 4, "product_id": 1},
    # User 5 (Variety shopper)
    {"user_id": 5, "product_id": 1}, {"user_id": 5, "product_id": 3}, {"user_id": 5, "product_id": 8}, {"user_id": 5, "product_id": 9}, {"user_id": 5, "product_id": 10},
    # User 6 (Bakery Fan)
    {"user_id": 6, "product_id": 5}, {"user_id": 6, "product_id": 10}, {"user_id": 6, "product_id": 6},
]

# Combine text for embeddings
df['combined_features'] = df['name'] + " " + df['description'] + " " + df['category']

# -------------------------------------------------------------
# STEP 4: PRECOMPUTE EMBEDDINGS
# -------------------------------------------------------------
print("Computing embeddings for all products...")
product_embeddings = semantic_model.encode(df['combined_features'].tolist(), convert_to_tensor=True)

# -------------------------------------------------------------
# API ENDPOINTS
# -------------------------------------------------------------

# -------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------

def get_content_recommendations(product_id: int, top_n: int = 10):
    if product_id not in df['id'].values:
        return []
    
    # Ensure top_n doesn't exceed available products
    total_products = len(df)
    actual_n = min(top_n, total_products - 1)
    
    idx = df.index[df['id'] == product_id][0]
    query_embedding = product_embeddings[idx]
    cos_scores = util.cos_sim(query_embedding, product_embeddings)[0]
    
    # Get top results safely
    top_results = np.argpartition(-cos_scores, range(actual_n + 1))[:actual_n + 1]
    
    recs = []
    for i in top_results:
        if df.iloc[int(i)]['id'] != product_id:
            item = df.iloc[int(i)]
            recs.append({
                "id": int(item['id']),
                "name": item['name'],
                "category": item['category'],
                "description": item['description'],
                "content_score": float(cos_scores[i])
            })
    return recs

def get_collab_recommendations(user_id: int):
    user_owned = {p['product_id'] for p in purchase_history if p['user_id'] == user_id}
    similar_users = {p['user_id'] for p in purchase_history if p['product_id'] in user_owned and p['user_id'] != user_id}
    
    counts = {}
    for record in purchase_history:
        if record['user_id'] in similar_users and record['product_id'] not in user_owned:
            pid = record['product_id']
            counts[pid] = counts.get(pid, 0) + 1
            
    # Normalize collab score (0-1 range roughly)
    max_count = max(counts.values()) if counts else 1
    
    recs = []
    for pid, count in counts.items():
        product_data = df[df['id'] == pid].iloc[0]
        recs.append({
            "id": int(pid),
            "name": product_data['name'],
            "category": product_data['category'],
            "description": product_data['description'],
            "collab_score": count / max_count
        })
    return recs

# -------------------------------------------------------------
# API ENDPOINTS
# -------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "Hybrid Recommendation Suite Running"}

@app.get("/recommend/final")
async def get_final_hybrid_recommendations(user_id: int = Query(...), product_id: int = Query(...)):
    """
    The Ultimate Hybrid Engine:
    1. Content Score (60%) + Collaborative Score (40%)
    2. Merges results from both worlds.
    3. Gemini AI provides the human reasoning.
    """
    
    # Step 1: Get Content results
    content_recs = get_content_recommendations(product_id)
    
    # Step 2: Get Collaborative results
    collab_recs = get_collab_recommendations(user_id)
    
    # Step 3: Merge and Score
    merged = {} # id -> data
    
    for r in content_recs:
        pid = r['id']
        merged[pid] = {**r, "collab_score": 0}
        
    for r in collab_recs:
        pid = r['id']
        if pid in merged:
            merged[pid]["collab_score"] = r["collab_score"]
        else:
            merged[pid] = {**r, "content_score": 0}
            
    # Step 4: Calculate Final Weighted Score
    final_list = []
    for pid, data in merged.items():
        final_score = (0.6 * data['content_score']) + (0.4 * data['collab_score'])
        final_list.append({**data, "final_score": round(final_score, 4)})
        
    # Step 5: Sort and take Top 5
    top_5 = sorted(final_list, key=lambda x: x['final_score'], reverse=True)[:5]
    
    # Step 6: Gemini Refinement (Individual Processing for higher accuracy)
    ai_refined = []
    if GEMINI_KEY:
        try:
            target_product = df[df['id'] == product_id].iloc[0].to_dict()
            model = genai.GenerativeModel('gemini-flash-latest')

            for rec in top_5[:3]:
                try:
                    prompt = f"""
                    You are a product recommendation assistant.

                    User selected:
                    {target_product['name']} - {target_product['description']} ({target_product['category']})

                    Recommended product:
                    {rec['name']} - {rec['description']} ({rec['category']})

                    Explain in ONE sentence why this product is a good recommendation.

                    Rules:
                    - Must refer ONLY to the recommended product
                    - Must be specific (nutrition, taste, usage)
                    - Keep under 12 words
                    - No generic phrases

                    Output ONLY JSON:
                    {{ "reason": "..." }}
                    """
                    
                    response = model.generate_content(prompt)
                    text_response = response.text
                    
                    # Clean markdown if present
                    if "```json" in text_response:
                        text_response = text_response.split("```json")[1].split("```")[0].strip()
                    elif "```" in text_response:
                        text_response = text_response.split("```")[1].strip()

                    ai_data = json.loads(text_response)
                    ai_refined.append({
                        "id": rec['id'],
                        "reason": ai_data.get("reason", "Excellent choice for your shopping list.")
                    })
                except Exception as inner_e:
                    print(f"Individual AI Error for product {rec['id']}: {inner_e}")
                    ai_refined.append({
                        "id": rec['id'],
                        "reason": f"A high-quality {rec['category']} option to match your selection."
                    })
            
        except Exception as e:
            print(f"Hybrid AI Suite Error: {e}")
            ai_refined = [{"id": r["id"], "reason": "Recommended based on your recent preferences."} for r in top_5[:3]]

    return {
        "user_id": user_id,
        "product_id": product_id,
        "hybrid_recommendations": top_5,
        "ai_refined": ai_refined
    }

@app.get("/recommend/hybrid-semantic")
async def get_hybrid_semantic_legacy(product_id: int = Query(...)):
    # Simple wrapper for previous logic
    recs = get_content_recommendations(product_id, top_n=5)
    return {"requested_id": product_id, "recommendations": recs}

@app.get("/recommend/collaborative")
async def get_collaborative_legacy(user_id: int = Query(...)):
    # Simple wrapper for previous logic
    return {"user_id": user_id, "recommendations": get_collab_recommendations(user_id)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=True)
