import os
import json
import re
from google import genai

class HybridEngine:
    def __init__(self, rag_service, svd_service, location_service=None, realtime_service=None, client=None):
        self.rag = rag_service
        self.svd = svd_service
        self.location = location_service
        self.realtime = realtime_service
        self.client = client

    def get_hybrid_scores(self, user_id, product_ids, products_df, top_k=5):
        """
        Original endpoint logic: Combines Semantic Similarity (RAG) and User Preference (SVD)
        Formula: 0.5 * Content + 0.5 * Collaborative
        Multi-Seed Pooling: Aggregates max similarity across multiple purchased items.
        """
        # Ensure it's a list for multi-seed
        if not isinstance(product_ids, list):
            product_ids = [product_ids]
            
        # 1. Get similar products from RAG (Multi-Seed Pooling)
        content_scores = {}
        for pid in product_ids:
            if pid not in products_df['id'].values: continue
            
            target_product = products_df[products_df['id'] == pid].iloc[0]
            query_text = f"{target_product['name']} {target_product.get('description', '')} {target_product['category']}"
            
            content_results = self.rag.search(query_text, k=10)
            
            for res in content_results:
                r_id = res['product_id']
                if r_id in product_ids: continue # Skip the seed products themselves
                
                # Keep the max similarity score
                if r_id not in content_scores or res['score'] > content_scores[r_id]:
                    content_scores[r_id] = res['score']
        
        # 2. Merge with SVD Collaborative Scores
        hybrid_results = []
        for r_id, content_score in content_scores.items():
            collab_score = self.svd.predict_score(user_id, r_id)
            
            # Weighted Fusion (50/50 split)
            final_score = (0.5 * content_score) + (0.5 * collab_score)
            
            product_data = products_df[products_df['id'] == r_id].iloc[0]
            hybrid_results.append({
                'id': int(r_id),
                'score': final_score,
                'name': product_data['name'],
                'category': product_data['category']
            })
            
        # 3. Sort and Deduplicate by product name, then Return
        hybrid_results = sorted(hybrid_results, key=lambda x: x['score'], reverse=True)
        seen_names = set()
        deduped_results = []
        for item in hybrid_results:
            name_lower = item['name'].strip().lower()
            if name_lower not in seen_names:
                seen_names.add(name_lower)
                deduped_results.append(item)
        return deduped_results[:top_k]

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

    def get_content_scores(self, seed_id: int, products_df) -> dict:
        """Helper to get content scores using the RAG Service index"""
        if seed_id not in products_df['id'].values:
            return {pid: 0.0 for pid in products_df['id'].values}
        target_product = products_df[products_df['id'] == seed_id].iloc[0]
        
        # Combine same features as indexing
        desc = target_product.get("description", target_product["name"])
        query_text = f"{target_product['name']} {desc} {target_product['category']}"
        
        results = self.rag.search(query_text, k=len(products_df))
        scores = {res['product_id']: res['score'] for res in results}
        return scores

    def get_location_aware_recommendations(self, user_id: int, target_product_id: int, user_lat: float, user_lng: float, df_products, top_k: int = 5):
        """
        Consolidated Location-Aware Hybrid Recommendation logic.
        Fuses 4 scores:
        0.35 * content_score (RAG)
        0.30 * collaborative_score (SVD)
        0.20 * location_score (Proximity)
        0.15 * realtime_score (Trending/Redis)
        """
        if df_products.empty:
            return []
            
        # Fetch user's purchase history from collaborative engine (fallback to SVD prediction)
        # Check if SVD has history cache
        user_history = []
        if hasattr(self.svd, "user_history") and user_id in self.svd.user_history:
            user_history = self.svd.user_history[user_id]
            
        # Get target product
        target_product = None
        if target_product_id is not None and target_product_id in df_products['id'].values:
            target_product = df_products[df_products['id'] == target_product_id].iloc[0].to_dict()
        else:
            if user_history:
                target_product_id = user_history[-1]
                if target_product_id in df_products['id'].values:
                    target_product = df_products[df_products['id'] == target_product_id].iloc[0].to_dict()
                else:
                    target_product = df_products.iloc[0].to_dict()
                    target_product_id = target_product['id']
            else:
                target_product = df_products.iloc[0].to_dict()
                target_product_id = target_product['id']
            
        product_list = df_products.to_dict('records')
        product_ids = [p['id'] for p in product_list]
        
        # Build seeds: currently viewed product + last 2 past purchases
        seeds = [target_product_id]
        if user_history:
            past_seeds = list(dict.fromkeys(user_history))[-2:]
            for s in past_seeds:
                if s not in seeds:
                    seeds.append(s)
                    
                    
        # 1. Content Score via RAG Multi-seed max pooling
        c_scores = {}
        c_best_seeds = {}
        for seed in seeds:
            scores_for_seed = self.get_content_scores(seed, df_products)
            for pid, score in scores_for_seed.items():
                if pid not in c_scores or score > c_scores[pid]:
                    c_scores[pid] = score
                    c_best_seeds[pid] = seed
                    
        # 2. Collaborative Score via SVD Service
        s_scores = {}
        for pid in product_ids:
            s_scores[pid] = self.svd.predict_score(user_id, pid)
            
        # 3. Location Score (Proximity)
        l_scores = {}
        if self.location:
            l_scores = self.location.get_location_scores(user_lat, user_lng, product_list)
        else:
            l_scores = {pid: 0.0 for pid in product_ids}
            
        # 4. Realtime Score (Trending/Redis)
        r_scores = {}
        if self.realtime:
            r_scores = self.realtime.get_realtime_scores(product_ids, df_products)
        else:
            r_scores = {pid: 0.0 for pid in product_ids}
            
        # Fuse scores
        results = []
        for p in product_list:
            pid = p['id']
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
        
        # Deduplicate by product name, keeping the highest final score
        seen_names = set()
        deduped_results = []
        for res in results:
            name_lower = res['product']['name'].strip().lower()
            if target_product and name_lower == target_product['name'].strip().lower():
                continue
            if name_lower not in seen_names:
                seen_names.add(name_lower)
                deduped_results.append(res)
                
        top_results = deduped_results[:top_k]
        
        # Prepare list for bulk explanations
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
        Special Query: Trending products bounded by nearby vendors.
        Fuses trending (Realtime) and proximity (Location).
        """
        if df_products.empty:
            return []
            
        product_list = df_products.to_dict('records')
        product_ids = [p['id'] for p in product_list]
        
        l_scores = {}
        if self.location:
            l_scores = self.location.get_location_scores(user_lat, user_lng, product_list)
        else:
            l_scores = {pid: 0.0 for pid in product_ids}
            
        r_scores = {}
        if self.realtime:
            r_scores = self.realtime.get_realtime_scores(product_ids, df_products)
        else:
            r_scores = {pid: 0.0 for pid in product_ids}
            
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
        
        # Deduplicate by product name, keeping the highest score
        seen_names = set()
        deduped_results = []
        for r in results:
            name_lower = r['product']['name'].strip().lower()
            if name_lower not in seen_names:
                seen_names.add(name_lower)
                deduped_results.append(r)
                
        top_results = deduped_results[:top_k]
        
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
