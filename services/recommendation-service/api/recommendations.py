from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

router = APIRouter()

# In a real app, these would be injected dependencies.
# We will set them globally in main.py for simplicity in this microservice.
hybrid_engine_instance = None
df_products_instance = None

def get_hybrid_engine():
    if hybrid_engine_instance is None:
        raise HTTPException(status_code=503, detail="Recommendation Engine not initialized")
    return hybrid_engine_instance

def get_df_products():
    if df_products_instance is None or df_products_instance.empty:
        raise HTTPException(status_code=503, detail="Product data not loaded")
    return df_products_instance

@router.get("/recommend/location-aware")
async def get_location_aware_recommendations(
    user_id: int = Query(..., description="User ID"),
    product_id: int = Query(..., description="Target Product ID"),
    latitude: float = Query(..., description="User Latitude"),
    longitude: float = Query(..., description="User Longitude"),
    engine = Depends(get_hybrid_engine),
    df_products = Depends(get_df_products)
):
    """
    Returns hybrid recommendations based on content, collaborative, location, and realtime scores.
    """
    try:
        results = engine.get_hybrid_recommendations(
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

@router.get("/recommend/trending-nearby")
async def get_trending_nearby(
    latitude: float = Query(..., description="User Latitude"),
    longitude: float = Query(..., description="User Longitude"),
    engine = Depends(get_hybrid_engine),
    df_products = Depends(get_df_products)
):
    """
    Returns trending products strictly bounded by nearby vendors.
    """
    try:
        results = engine.get_trending_nearby(
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
