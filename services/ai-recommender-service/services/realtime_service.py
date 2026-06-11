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
        Returns a dict mapping product name/id to view count/score.
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
                        name = item["name"]
                        views = float(item["views"])
                        orders = float(item.get("orders", 0))
                        
                        # Calculate a hybrid trend score (views + weighted orders)
                        trend_score = views + (orders * 5)
                        product_stats[name] = trend_score
                        
                    if self.redis_client:
                        # Cache for 1 minute
                        self.redis_client.setex(cache_key, 60, json.dumps(product_stats))
                        
                    return product_stats
        except Exception as e:
            print(f"RealtimeService: Error fetching top products: {e}")
            
        return {}

    def get_realtime_scores(self, product_ids: list, products_df=None) -> dict:
        """
        Returns real-time popularity and trending scores for given products.
        Normalized to [0, 1].
        """
        product_stats = self.fetch_top_products()
        scores = {}
        
        if not product_stats:
            return {pid: 0.0 for pid in product_ids}
            
        # Build name_to_ids mapping if products_df is provided
        name_to_ids = {}
        if products_df is not None and not products_df.empty:
            for _, row in products_df.iterrows():
                name_lower = row['name'].strip().lower()
                if name_lower not in name_to_ids:
                    name_to_ids[name_lower] = []
                name_to_ids[name_lower].append(row['id'])
                
        # Map stats (names/ids) to product IDs
        mapped_stats = {}
        for name, score in product_stats.items():
            name_lower = str(name).strip().lower()
            try:
                pid = int(name)
                mapped_stats[pid] = score
                continue
            except ValueError:
                pass
                
            if name_lower in name_to_ids:
                for pid in name_to_ids[name_lower]:
                    mapped_stats[pid] = score
                    
        if not mapped_stats:
            return {pid: 0.0 for pid in product_ids}
            
        max_stat = max(mapped_stats.values()) if mapped_stats else 1.0
        # Prevent division by zero
        max_stat = max_stat if max_stat > 0 else 1.0
        
        for pid in product_ids:
            if pid in mapped_stats:
                # Normalize based on the highest trending product
                scores[pid] = float(mapped_stats[pid] / max_stat)
            else:
                scores[pid] = 0.0
                
        return scores
