from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import requests
import json
import os
import time
import threading
from dotenv import load_dotenv

# Load env variables (useful when running locally without docker-compose env injection)
load_dotenv()

from services.content_engine import ContentEngine
from services.collaborative_engine import CollaborativeEngine
from services.location_engine import LocationEngine
from services.realtime_engine import RealtimeEngine
from services.hybrid_engine import HybridEngine
import api.recommendations as recommendations_api

app = FastAPI(title="Hybrid Recommendation Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://product:5001")
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order:5005")

# Initialize engines
content_engine = ContentEngine()
collab_engine = CollaborativeEngine()
location_engine = LocationEngine()
realtime_engine = RealtimeEngine()

hybrid_engine = HybridEngine(content_engine, collab_engine, location_engine, realtime_engine)
df_products = pd.DataFrame()

# Inject into API router
recommendations_api.hybrid_engine_instance = hybrid_engine

def fetch_products():
    """Fetch products from product-service to build the content engine FAISS index."""
    try:
        print("Fetching products from product-service...")
        response = requests.get(f"{PRODUCT_SERVICE_URL}/products", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                formatted = []
                for p in data["data"]:
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
                return pd.DataFrame(formatted)
    except Exception as e:
        print(f"Failed to fetch products: {e}")
    
    # Fallback mock data
    return pd.DataFrame([
        {"id": 1, "name": "Organic Apple", "description": "Fresh organic red apple", "category": "fruit", "metadata": "Usage: Snack", "price": 2.5, "vendor_id": 1},
        {"id": 2, "name": "Banana", "description": "Sweet yellow banana", "category": "fruit", "metadata": "Usage: Energy", "price": 1.2, "vendor_id": 2},
        {"id": 3, "name": "Whole Milk", "description": "Fresh dairy milk 1 liter", "category": "dairy", "metadata": "Usage: Breakfast", "price": 1.5, "vendor_id": 1},
    ])

def fetch_orders_and_train():
    """Fetch orders to train SVD collaborative filtering."""
    try:
        print("Fetching orders from order-service...")
        response = requests.get(f"{ORDER_SERVICE_URL}/orders/internal/all", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                orders = data["data"]
                
                # SVD needs user_id and product_id
                # Orders might have product name, so we map it
                global df_products
                name_to_id = {row['name']: row['id'] for _, row in df_products.iterrows()}
                
                history = []
                for o in orders:
                    p_name = o.get("product_id")
                    if p_name in name_to_id:
                        history.append({
                            "user_id": o["user_id"],
                            "product_id": name_to_id[p_name]
                        })
                
                if history:
                    all_pids = list(df_products['id'].values)
                    collab_engine.train(history, all_pids)
                else:
                    print("No valid history found to train SVD.")
    except Exception as e:
        print(f"Failed to fetch orders or train SVD: {e}")

@app.on_event("startup")
async def startup_event():
    global df_products
    # Load products and build index
    df_products = fetch_products()
    recommendations_api.df_products_instance = df_products
    content_engine.build_index(df_products)
    
    # Run SVD training in background
    def background_train():
        time.sleep(5) # wait for other services
        fetch_orders_and_train()
        
    threading.Thread(target=background_train, daemon=True).start()

app.include_router(recommendations_api.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
