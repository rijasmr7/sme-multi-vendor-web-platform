from fastapi import FastAPI, HTTPException, Query
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import json
import os
import re
from google import genai
from dotenv import load_dotenv

# Import our research modules
from services.rag_service import RAGService
from services.svd_service import SVDService
from services.hybrid_engine import HybridEngine
from services.evaluation_service import EvaluationService
from services.location_service import LocationService
from services.realtime_service import RealtimeService
import urllib.request
import time

load_dotenv()

app = FastAPI(title="Research AI Recommender", version="3.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# -------------------------------------------------------------
# 1. INITIALIZE SERVICES
# -------------------------------------------------------------
rag = RAGService()
svd = SVDService()
evaluator = EvaluationService()

location_service = LocationService()
realtime_service = RealtimeService()

# Configure Gemini (MODERN SDK)
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
client = None

if GEMINI_KEY:
    print("Gemini: API Key found. Initializing Modern SDK...")
    try:
        client = genai.Client(api_key=GEMINI_KEY)
        print("Gemini: Client initialized successfully.")
    except Exception as e:
        print(f"Gemini: Initialization failed: {str(e)}")
else:
    print("Gemini: CRITICAL ERROR - GEMINI_API_KEY not found!")

hybrid = HybridEngine(rag, svd, location_service, realtime_service, client)

df_products = pd.DataFrame()
is_data_loaded = False
global_real_orders = []
global_valid_history = []
last_load_time = 0
CACHE_EXPIRATION_SECONDS = 30

def fetch_user_city(user_id):
    try:
        req = urllib.request.Request(f"http://user:5004/internal/{user_id}")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            if res.get("success") and res.get("data"):
                return res["data"].get("city", "Unknown")
    except Exception as e:
        print(f"Failed to fetch user city: {e}")
    return "Unknown"

def fetch_all_users():
    try:
        req = urllib.request.Request("http://user:5004/internal-bulk/users")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            if res.get("success") and res.get("data"):
                return res["data"]
    except Exception as e:
        print(f"Failed to fetch users bulk: {e}")
    return []

def fetch_real_products():
    try:
        req = urllib.request.Request("http://product:5001/products")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            if res.get("success") and res.get("data"):
                return res["data"]
    except Exception as e:
        print("Failed to fetch from product service:", e)
    return []

def fetch_real_orders():
    try:
        req = urllib.request.Request("http://order:5005/orders/internal/all")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            if res.get("success") and res.get("data"):
                return res["data"]
    except Exception as e:
        print("Failed to fetch from order service:", e)
    return []

@app.on_event("startup")
async def startup_event():
    # Attempt to load data on startup if services are available
    ensure_real_data_loaded()

# -------------------------------------------------------------
# 3. AI EXPLANATION ENGINE (ROBUST)
# -------------------------------------------------------------

def generate_bulk_explanations(target_product, rec_products, context=None):
    # Prepare fallback dictionary
    reasons_dict = {}
    for p in rec_products:
        if context == "City": reasons_dict[p['id']] = "A highly popular choice among shoppers in your area."
        elif context == "Global": reasons_dict[p['id']] = "A top-trending favorite across our entire marketplace."
        elif context == "Essentials": reasons_dict[p['id']] = f"An excellent essential {p['category']} item to get you started."
        else:
            meta = str(p.get('metadata', '')).lower()
            if "vitamin" in meta: reasons_dict[p['id']] = "Provides essential nutrients, complementing your diet."
            elif "protein" in meta: reasons_dict[p['id']] = "Adds protein, balancing your selection perfectly."
            else: reasons_dict[p['id']] = f"Enhances your {target_product['category']} selection."

    if not client or not rec_products:
        return reasons_dict

    # Build products text block
    products_info = []
    for p in rec_products:
        products_info.append(f"- ID {p['id']}: {p['name']} (Meta: {p.get('metadata', '')})")
    info_str = "\n".join(products_info)

    for attempt in range(3):
        try:
            if context == "City":
                prompt = f"Act as a friendly shopping assistant. Recommend these products to a new user because they are highly popular in their city. Provide a max 12 word reason for each. Target product: {target_product['name']}. Products:\n{info_str}\nOutput valid JSON exactly like this: {{\"reasons\": [{{\"id\": 1, \"reason\": \"...\"}}]}}"
            elif context == "Global":
                prompt = f"Act as a friendly shopping assistant. Recommend these products to a new user because they are top-trending favorites. Provide a max 12 word reason for each. Target product: {target_product['name']}. Products:\n{info_str}\nOutput valid JSON exactly like this: {{\"reasons\": [{{\"id\": 1, \"reason\": \"...\"}}]}}"
            elif context == "Essentials":
                prompt = f"Act as a friendly shopping assistant. Recommend these products to a new user as essential items to get started. Provide a max 12 word reason for each. Target product: {target_product['name']}. Products:\n{info_str}\nOutput valid JSON exactly like this: {{\"reasons\": [{{\"id\": 1, \"reason\": \"...\"}}]}}"
            else:
                prompt = f"Explain why each of these products is a good recommendation for a user viewing {target_product['name']}. Provide a max 12 word reason for each focusing on benefits. Products:\n{info_str}\nOutput valid JSON exactly like this: {{\"reasons\": [{{\"id\": 1, \"reason\": \"...\"}}]}}"
            
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            
            res_text = response.text.strip()
            match = re.search(r'\{.*\}', res_text, re.DOTALL)
            if not match: continue
            
            data = json.loads(match.group())
            for item in data.get("reasons", []):
                reasons_dict[item["id"]] = item["reason"].strip()
                
            return reasons_dict
        except Exception as e:
            print(f"Gemini Attempt {attempt+1} Error: {str(e)}")
            continue

    return reasons_dict

# -------------------------------------------------------------
# 4. API ENDPOINTS
# -------------------------------------------------------------

def ensure_real_data_loaded():
    global is_data_loaded, df_products, global_real_orders, global_valid_history, last_load_time
    current_time = time.time()
    if is_data_loaded and (current_time - last_load_time) < CACHE_EXPIRATION_SECONDS:
        return
        
    print("Recommender: Fetching fresh products/orders from DB...")
        
    real_prods = fetch_real_products()
    if real_prods and len(real_prods) > 0:
        formatted = []
        for p in real_prods:
            desc = p.get("extra_data", {}).get("description", p["name"]) if isinstance(p.get("extra_data"), dict) else p["name"]
            formatted.append({
                "id": int(p["id"]),
                "name": p["name"],
                "description": desc,
                "category": p["category"],
                "metadata": f"Price: {p['price']}",
                "price": float(p["price"]),
                "vendor_id": int(p["vendor_id"])
            })
        df_new = pd.DataFrame(formatted)
        df_products = df_new
        rag.build_index(df_products)
        
        # Fetch real orders and train SVD Collaborative Filtering
        global_real_orders = fetch_real_orders()
        
        # Fetch all users to map their cities to orders (Microservice Join)
        all_users = fetch_all_users()
        user_cities = {u["id"]: u.get("city", "Unknown") for u in all_users}
        
        global_valid_history = []
        name_to_id = {}
        for _, row in df_products.iterrows():
            if row['name'] not in name_to_id:
                name_to_id[row['name']] = row['id']
        
        for o in global_real_orders:
            p_name = o.get("product_id") # Note: Orders DB stores product name
            if p_name in name_to_id:
                global_valid_history.append({
                    "user_id": o["user_id"],
                    "product_id": name_to_id[p_name],
                    "city": user_cities.get(o["user_id"], "Unknown")
                })
        
        if len(global_valid_history) > 0:
            svd.train(global_valid_history)
            
            # Map history cache in SVD for multi-seed location-aware
            svd.user_history = {}
            for h in global_valid_history:
                uid = h['user_id']
                pid = h['product_id']
                if uid not in svd.user_history:
                    svd.user_history[uid] = []
                svd.user_history[uid].append(pid)
        else:
            print("SVD: No valid real orders found yet. Falling back to default scoring.")
        
        is_data_loaded = True
        last_load_time = current_time

# router_location_aware = None # placeholder reference if needed

@app.get("/recommend/location-aware")
async def get_location_aware_recommendations(
    user_id: int = Query(..., description="User ID"),
    latitude: float = Query(..., description="User Latitude"),
    longitude: float = Query(..., description="User Longitude"),
    product_id: Optional[int] = Query(None, description="Target Product ID")
):
    """
    Consolidated location-aware production endpoint.
    Fuses Content, Collab, Location, and Trending scores.
    """
    ensure_real_data_loaded()
    try:
        results = hybrid.get_location_aware_recommendations(
            user_id=user_id,
            target_product_id=product_id,
            user_lat=latitude,
            user_lng=longitude,
            df_products=df_products,
            top_k=5
        )
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/trending-nearby")
async def get_trending_nearby_endpoint(
    latitude: float = Query(..., description="User Latitude"),
    longitude: float = Query(..., description="User Longitude")
):
    """
    Consolidated trending nearby production endpoint.
    Fuses trending (Realtime) and proximity (Location).
    """
    ensure_real_data_loaded()
    try:
        results = hybrid.get_trending_nearby(
            user_lat=latitude,
            user_lng=longitude,
            df_products=df_products,
            top_k=5
        )
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/explain")
async def get_explained_recommendations(user_id: int, product_id: Optional[int] = Query(None)):
    ensure_real_data_loaded()

    # Check if this is a Cold Start User (no order history)
    is_cold_start = not any(str(h['user_id']) == str(user_id) for h in global_valid_history)
    
    if is_cold_start:
        user_city = fetch_user_city(user_id)
        recommendations = []
        explanation_context = ""
        
        # Helper to get top products from a list of orders
        def get_top_products(history_list, k=3):
            from collections import Counter
            counts = Counter([h['product_id'] for h in history_list])
            top_ids = [item[0] for item in counts.most_common(k)]
            return [
                {
                    "id": pid,
                    "name": df_products[df_products['id'] == pid].iloc[0]['name'],
                    "category": df_products[df_products['id'] == pid].iloc[0]['category']
                } for pid in top_ids if pid in df_products['id'].values
            ]

        # Tier 1: City Popularity
        city_history = [h for h in global_valid_history if str(h.get('city', '')).lower() == str(user_city).lower()]
        if len(city_history) > 0:
            recommendations = get_top_products(city_history)
            explanation_context = "City"
        
        # Tier 2: Platform Popularity
        if not recommendations and len(global_valid_history) > 0:
            recommendations = get_top_products(global_valid_history)
            explanation_context = "Global"
            
        # Tier 3: Essentials Fallback
        if not recommendations:
            essential_cats = ['grocery', 'food', 'clothing', 'bakery', 'dairy', 'fruit']
            # Get a diverse sample by picking random items from different categories if possible
            essentials = df_products[df_products['category'].str.lower().isin(essential_cats)]
            # Drop duplicates by name to avoid duplicate recommendations
            essentials_unique = essentials.drop_duplicates(subset=['name'])
            if not essentials_unique.empty:
                # Shuffle and pick up to 3
                sampled = essentials_unique.sample(n=min(3, len(essentials_unique)))
            else:
                df_products_unique = df_products.drop_duplicates(subset=['name'])
                sampled = df_products_unique.sample(n=min(3, len(df_products_unique)))
            
            for _, row in sampled.iterrows():
                recommendations.append({
                    "id": int(row['id']),
                    "name": row['name'],
                    "category": row['category']
                })
            explanation_context = "Essentials"

        target_product = df_products[df_products['id'] == product_id].iloc[0] if product_id in df_products['id'].values else df_products.iloc[0]
        
        rec_data_list = [df_products[df_products['id'] == rec['id']].iloc[0].to_dict() for rec in recommendations]
        bulk_reasons = generate_bulk_explanations(target_product.to_dict(), rec_data_list, context=explanation_context)
        
        explained_recs = []
        for rec in recommendations:
            rec_data = df_products[df_products['id'] == rec['id']].iloc[0]
            reason = bulk_reasons.get(rec['id'], "A highly recommended item for you.")
            explained_recs.append({
                **rec,
                "ai_explanation": reason,
                "vendor_id": int(rec_data.get('vendor_id', 1)),
                "price": float(rec_data.get('price', 0))
            })
            
        return {
            "user_id": user_id,
            "base_product": target_product['name'],
            "recommendations": explained_recs,
            "cold_start": True
        }

    # -------------------------------------------------------------
    # DYNAMIC MULTI-SEED OVERRIDE (AI DECIDES)
    # -------------------------------------------------------------
    # To provide highly accurate, mixed recommendations, we look at the user's
    # last 3 unique purchases and use all of them as simultaneous seeds!
    user_history = [h for h in global_valid_history if str(h['user_id']) == str(user_id)]
    history_ids = []
    
    if len(user_history) > 0:
        # Get unique product IDs preserving order, then take the last 3
        unique_history = list(dict.fromkeys([h['product_id'] for h in user_history]))
        history_ids = unique_history[-3:]
    else:
        # Fallback if product_id is not found
        if product_id not in df_products['id'].values:
            if not df_products.empty:
                product_id = int(df_products.iloc[0]['id'])
            else:
                raise HTTPException(status_code=404, detail="Product not found in DB")
        history_ids = [product_id]

    recommendations = hybrid.get_hybrid_scores(user_id, history_ids, df_products)
    
    # We use the most recent item as the target for explanation generation
    primary_target_id = history_ids[-1]
    target_product = df_products[df_products['id'] == primary_target_id].iloc[0]
    
    rec_data_list = [df_products[df_products['id'] == rec['id']].iloc[0].to_dict() for rec in recommendations]
    bulk_reasons = generate_bulk_explanations(target_product.to_dict(), rec_data_list)
    
    explained_recs = []
    for rec in recommendations:
        rec_data = df_products[df_products['id'] == rec['id']].iloc[0]
        reason = bulk_reasons.get(rec['id'], "A highly recommended item for you.")
        
        # Include vendor_id and price explicitly
        explained_recs.append({
            **rec, 
            "ai_explanation": reason,
            "vendor_id": int(rec_data.get('vendor_id', 1)),
            "price": float(rec_data.get('price', 0))
        })

    return {
        "user_id": user_id,
        "base_product": target_product['name'],
        "recommendations": explained_recs
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
