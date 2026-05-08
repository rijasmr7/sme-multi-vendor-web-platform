class HybridEngine:
    def __init__(self, rag_service, svd_service):
        self.rag = rag_service
        self.svd = svd_service

    def get_hybrid_scores(self, user_id, product_ids, products_df, top_k=5):
        """
        Combines Semantic Similarity (RAG) and User Preference (SVD)
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
            
        # 3. Sort and Return
        hybrid_results = sorted(hybrid_results, key=lambda x: x['score'], reverse=True)
        return hybrid_results[:top_k]
