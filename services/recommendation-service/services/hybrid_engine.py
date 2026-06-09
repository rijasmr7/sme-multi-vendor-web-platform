from .content_engine import ContentEngine
from .collaborative_engine import CollaborativeEngine
from .location_engine import LocationEngine
from .realtime_engine import RealtimeEngine
import os
import json
import re
from google import genai

class HybridEngine:
    def __init__(self, content: ContentEngine, collab: CollaborativeEngine, location: LocationEngine, realtime: RealtimeEngine):
        self.content = content
        self.collab = collab
        self.location = location
        self.realtime = realtime
        
        # Configure Gemini
        GEMINI_KEY = os.getenv("GEMINI_API_KEY")
        self.client = None
        if GEMINI_KEY:
            try:
                self.client = genai.Client(api_key=GEMINI_KEY)
                print("HybridEngine: Gemini initialized.")
            except Exception as e:
                print(f"HybridEngine: Gemini init failed: {e}")

    def _build_smart_fallback(self, product, target_product, c_score, s_score, l_score, r_score, seed_product_name=None) -> str:
        """
        Builds a dynamic, score-aware explanation when Gemini API is unavailable.
        Uses the actual computed scores to generate contextual text.
        """
        parts = []
        ref_name = seed_product_name if seed_product_name else target_product['name']
        
        # Content similarity reasoning
        if c_score >= 0.9:
            if product.get('category') != target_product.get('category'):
                parts.append(f"Related to your interest in {ref_name}")
            else:
                parts.append(f"Very similar to {ref_name}")
        elif c_score >= 0.7:
            parts.append(f"Related to {ref_name}")
        elif c_score >= 0.4:
            parts.append(f"Loosely related to {ref_name}")
        
        # Collaborative reasoning
        if s_score >= 0.7:
            parts.append("loved by similar buyers")
        elif s_score >= 0.3:
            parts.append("popular with users like you")
        
        # Location reasoning
        if l_score >= 0.8:
            parts.append("from a vendor very close to you")
        elif l_score >= 0.4:
            parts.append("from a nearby vendor")
        
        # Realtime reasoning
        if r_score >= 0.7:
            parts.append("currently trending")
        elif r_score >= 0.3:
            parts.append("gaining popularity")
        
        if not parts:
            return f"Recommended based on your interest in {ref_name}."
        
        # Join into a natural sentence
        explanation = parts[0]
        if len(parts) > 1:
            explanation += ", " + ", ".join(parts[1:])
        return explanation + "."

    def generate_bulk_explanations(self, target_product, rec_products_with_scores) -> dict:
        """
        Generates explanations for all recommended products in a single bulk Gemini call.
        Returns a dictionary mapping product ID (int) to explanation string (str).
        """
        explanations = {}
        
        # Build fallbacks first
        for item in rec_products_with_scores:
            p = item['product']
            s = item['scores']
            ref_name = item.get('best_seed_name', target_product['name'])
            explanations[p['id']] = self._build_smart_fallback(p, target_product, s['content'], s['collaborative'], s['location'], s['realtime'], ref_name)
            
        if not self.client or not rec_products_with_scores:
            return explanations
            
        try:
            # Build products text block
            products_info = []
            for item in rec_products_with_scores:
                p = item['product']
                s = item['scores']
                ref_name = item.get('best_seed_name', target_product['name'])
                products_info.append(
                    f"- ID {p['id']}: {p['name']} (Category: {p['category']}, Relevance/Content score: {s['content']:.2f}, Collab score: {s['collaborative']:.2f}, Nearby/Location score: {s['location']:.2f}, Trending score: {s['realtime']:.2f}, Best seed product user viewed/bought: {ref_name})"
                )
            info_str = "\n".join(products_info)
            
            prompt = (
                f"Explain why each of these products is recommended to a user who viewed/bought: {target_product['name']}.\n"
                f"Write a short, natural, friendly explanation (max 12 words) for each product based on its scores and categories:\n"
                f"- High Relevance/Content means it is semantically related to the target product or the seed product.\n"
                f"- High Nearby/Location means from a local vendor.\n"
                f"- High Collab/Trending means popular or bought by similar users.\n"
                f"Focus on the benefits and why it makes sense. Do not mention raw scores or percentages.\n"
                f"Products:\n{info_str}\n"
                f"Output valid JSON exactly like this: {{\"reasons\": [{{\"id\": 1, \"reason\": \"...\"}}]}}"
            )
            
            response = self.client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            
            res_text = response.text.strip()
            match = re.search(r'\{.*\}', res_text, re.DOTALL)
            if match:
                data = json.loads(match.group())
                for item in data.get("reasons", []):
                    explanations[int(item["id"])] = item["reason"].strip()
            else:
                print(f"HybridEngine: Gemini response did not contain JSON: {res_text}")
        except Exception as e:
            print(f"HybridEngine: Bulk Gemini explanation error: {e}")
            
        return explanations

    def get_hybrid_recommendations(self, user_id: int, target_product_id: int, user_lat: float, user_lng: float, df_products, top_k: int = 5):
        """
        Combines 4 recommendation factors:
        0.35 * content_score
        0.30 * collaborative_score
        0.20 * location_score
        0.15 * realtime_score
        """
        if df_products.empty:
            return []
            
        # Get target product
        target_product = None
        if target_product_id in df_products['id'].values:
            target_product = df_products[df_products['id'] == target_product_id].iloc[0].to_dict()
        else:
            target_product = df_products.iloc[0].to_dict()
            target_product_id = target_product['id']
            
        product_list = df_products.to_dict('records')
        product_ids = [p['id'] for p in product_list]
        
        # Fetch user's purchase history from collaborative engine
        user_history = self.collab.get_user_history(user_id)
        
        # Build seeds: currently viewed product + last 2 unique past purchases (Multi-seed pooling)
        seeds = [target_product_id]
        if user_history:
            past_seeds = list(dict.fromkeys(user_history))[-2:]
            for s in past_seeds:
                if s not in seeds:
                    seeds.append(s)
                    
        # 1. Content Score: Multi-seed max pooling
        c_scores = {}
        c_best_seeds = {}
        for seed in seeds:
            scores_for_seed = self.content.get_content_scores(seed)
            for pid, score in scores_for_seed.items():
                if pid not in c_scores or score > c_scores[pid]:
                    c_scores[pid] = score
                    c_best_seeds[pid] = seed
        
        # 2. Collaborative Score
        s_scores = self.collab.get_collaborative_scores(user_id, product_ids)
        
        # 3. Location Score
        l_scores = self.location.get_location_scores(user_lat, user_lng, product_list)
        
        # 4. Realtime Score
        r_scores = self.realtime.get_realtime_scores(product_ids)
        
        # Fuse scores
        results = []
        for p in product_list:
            pid = p['id']
            # Avoid recommending the exact item they are looking at
            if pid == target_product_id:
                continue
                
            c = c_scores.get(pid, 0.0)
            s = s_scores.get(pid, 0.0)
            l = l_scores.get(pid, 0.0)
            r = r_scores.get(pid, 0.0)
            
            final_score = (0.35 * c) + (0.30 * s) + (0.20 * l) + (0.15 * r)
            
            results.append({
                "product": p,
                "scores": {
                    "content": float(c),
                    "collaborative": float(s),
                    "location": float(l),
                    "realtime": float(r),
                    "final": float(final_score)
                }
            })
            
        # Sort by final score
        results.sort(key=lambda x: x['scores']['final'], reverse=True)
        top_results = results[:top_k]
        
        # Generate explanations for top K
        rec_products_with_scores = []
        for res in top_results:
            p = res['product']
            s = res['scores']
            pid = p['id']
            # Find the seed that generated this content score
            best_seed_id = c_best_seeds.get(pid, target_product_id)
            best_seed_name = df_products[df_products['id'] == best_seed_id].iloc[0]['name'] if best_seed_id in df_products['id'].values else target_product['name']
            
            rec_products_with_scores.append({
                "product": p,
                "scores": s,
                "best_seed_name": best_seed_name
            })
            
        # Generate bulk explanations
        explanations = self.generate_bulk_explanations(target_product, rec_products_with_scores)
        
        final_recs = []
        for item in rec_products_with_scores:
            p = item['product']
            s = item['scores']
            pid = p['id']
            explanation = explanations.get(pid, f"Recommended for you.")
            
            final_recs.append({
                "id": p["id"],
                "name": p["name"],
                "category": p["category"],
                "price": float(p.get("price", 0.0)),
                "vendor_id": int(p.get("vendor_id", 1)),
                "score_breakdown": s,
                "ai_explanation": explanation
            })
            
        return {
            "target_product": target_product['name'],
            "recommendations": final_recs
        }

    def get_trending_nearby(self, user_lat: float, user_lng: float, df_products, top_k: int = 5):
        """
        Special query: Trending products bounded by nearby vendors
        """
        product_list = df_products.to_dict('records')
        product_ids = [p['id'] for p in product_list]
        
        l_scores = self.location.get_location_scores(user_lat, user_lng, product_list)
        r_scores = self.realtime.get_realtime_scores(product_ids)
        
        results = []
        for p in product_list:
            pid = p['id']
            l = l_scores.get(pid, 0.0)
            r = r_scores.get(pid, 0.0)
            
            # Filter out products that are too far (l_score == 0 implies distance >= 50km)
            if l <= 0.0:
                continue
                
            # Equal weight for trending + nearby
            final_score = (0.5 * r) + (0.5 * l)
            
            if final_score > 0:
                results.append({
                    "product": p,
                    "score": float(final_score),
                    "distance_score": float(l),
                    "trend_score": float(r)
                })
                
        results.sort(key=lambda x: x['score'], reverse=True)
        top_results = results[:top_k]
        
        return [
            {
                "id": r["product"]["id"],
                "name": r["product"]["name"],
                "category": r["product"]["category"],
                "vendor_id": int(r["product"].get("vendor_id", 1)),
                "hybrid_score": r["score"],
                "trend_score": r["trend_score"],
                "distance_score": r["distance_score"]
            } for r in top_results
        ]
