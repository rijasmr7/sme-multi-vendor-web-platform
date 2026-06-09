import requests
import time
import os

# Base URL for the location service
LOCATION_SERVICE_URL = os.getenv("LOCATION_SERVICE_URL", "http://location:5007")

class LocationEngine:
    def __init__(self):
        self.vendor_distances_cache = {}
        self.cache_timestamp = 0

    def fetch_nearby_vendors(self, lat: float, lng: float, radius: float = 50.0) -> dict:
        """
        Fetches nearby vendors from the location service.
        Implements location query optimization (caching).
        Returns a dict mapping vendor_id to distance in km.
        """
        cache_key = f"{lat},{lng},{radius}"
        current_time = time.time()
        
        if cache_key in self.vendor_distances_cache and (current_time - self.cache_timestamp) < 300: # 5 min cache
            return self.vendor_distances_cache[cache_key]
            
        try:
            url = f"{LOCATION_SERVICE_URL}/vendors/nearby?latitude={lat}&longitude={lng}&radius={radius}"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    vendor_dict = {}
                    for vendor in data["data"]:
                        # Convert to standard numeric vendor_id
                        v_id = vendor.get("id")
                        dist = vendor.get("distance_km", 999.0)
                        vendor_dict[int(v_id)] = float(dist)
                    
                    self.vendor_distances_cache[cache_key] = vendor_dict
                    self.cache_timestamp = current_time
                    return vendor_dict
        except Exception as e:
            print(f"LocationEngine: Error fetching nearby vendors: {e}")
            
        return {}

    def get_location_scores(self, lat: float, lng: float, products: list) -> dict:
        """
        Returns location scores for the given products based on vendor proximity.
        products should be a list of dicts with 'id' and 'vendor_id'.
        Normalized to [0, 1]. Closer vendors get higher scores.
        """
        if lat is None or lng is None:
            return {p['id']: 0.0 for p in products}

        # Use a wide radius to capture distances for scaling
        vendor_distances = self.fetch_nearby_vendors(lat, lng, radius=500.0)
        
        scores = {}
        max_distance = 50.0 # Define a maximum distance for normalization (50km)
        
        for p in products:
            pid = p['id']
            vid = p.get('vendor_id')
            
            if vid is not None and vid in vendor_distances:
                distance = vendor_distances[vid]
                # Closer is better. Distance 0 => 1.0, Distance >= 50 => 0.0
                score = max(0.0, 1.0 - (distance / max_distance))
                scores[pid] = float(score)
            else:
                # If vendor is not found or no location data, assign minimum score
                scores[pid] = 0.0
                
        return scores
