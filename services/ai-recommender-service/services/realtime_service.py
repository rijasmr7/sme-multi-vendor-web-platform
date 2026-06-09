import requests
import redis
import json
import time
import os

ANALYTICS_SERVICE_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://analytics:5003")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

class RealtimeService:
    def __init__(self):
        self.redis_client = None
        try:
            self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
            self.redis_client.ping()
            print("RealtimeService: Connected to Redis for caching.")
        except Exception as e:
            print(f"RealtimeService: Redis connection failed. Caching disabled. {e}")
            self.redis_client = None

    def fetch_top_products(self) -> dict:
        """
        Fetches top products from analytics service and uses Redis for caching.
        Returns a dict mapping product_id to view count/score.
        """
        cache_key = "analytics:top_products"
        
        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

        try:
            url = f"{ANALYTICS_SERVICE_URL}/analytics/top-products"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    product_stats = {}
                    for item in data["data"]:
                        try:
                            pid = int(item["name"]) # product_id was aliased as name
                        except ValueError:
                            # Skip product IDs that aren't integers (e.g. dummy/test names in event stream)
                            continue
                        views = float(item["views"])
                        orders = float(item.get("orders", 0))
                        
                        # Calculate a hybrid trend score (views + weighted orders)
                        trend_score = views + (orders * 5)
                        product_stats[pid] = trend_score
                        
                    if self.redis_client:
                        # Cache for 1 minute
                        self.redis_client.setex(cache_key, 60, json.dumps(product_stats))
                        
                    return product_stats
        except Exception as e:
            print(f"RealtimeService: Error fetching top products: {e}")
            
        return {}

    def get_realtime_scores(self, product_ids: list) -> dict:
        """
        Returns real-time popularity and trending scores for given products.
        Normalized to [0, 1].
        """
        product_stats = self.fetch_top_products()
        scores = {}
        
        if not product_stats:
            return {pid: 0.0 for pid in product_ids}
            
        max_stat = max(product_stats.values()) if product_stats else 1.0
        # Prevent division by zero
        max_stat = max_stat if max_stat > 0 else 1.0
        
        for pid in product_ids:
            if pid in product_stats:
                # Normalize based on the highest trending product
                scores[pid] = float(product_stats[pid] / max_stat)
            else:
                scores[pid] = 0.0
                
        return scores
