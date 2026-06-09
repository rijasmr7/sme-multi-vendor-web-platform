import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import os

class ContentEngine:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        # We use a lightweight sentence transformer for generating content embeddings
        print("ContentEngine: Initializing SentenceTransformer...")
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.product_ids = []
        
    def build_index(self, df_products: pd.DataFrame):
        """
        Builds a FAISS index from the product descriptions and metadata.
        Provides FAISS caching as requested.
        """
        if df_products.empty:
            print("ContentEngine: No products to index.")
            return

        print("ContentEngine: Building FAISS Index...")
        
        # Combine name, description, category, and metadata for a rich content representation
        texts = []
        self.product_ids = []
        for _, row in df_products.iterrows():
            text = f"{row.get('name', '')}. {row.get('description', '')}. Category: {row.get('category', '')}. {row.get('metadata', '')}"
            texts.append(text)
            self.product_ids.append(row['id'])

        # Generate embeddings
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension) # Inner Product (Cosine similarity since normalized L2)
        self.index.add(embeddings)
        print(f"ContentEngine: FAISS Index built with {self.index.ntotal} products.")
        
    def get_content_scores(self, target_product_id: int, top_k: int = 50) -> dict:
        """
        Returns content similarity scores for all products relative to the target product.
        Normalized to [0, 1].
        """
        if self.index is None or target_product_id not in self.product_ids:
            return {pid: 0.0 for pid in self.product_ids}
            
        target_idx = self.product_ids.index(target_product_id)
        
        # We need to extract the embedding from the FAISS index to query it
        target_embedding = np.zeros((1, self.index.d), dtype=np.float32)
        self.index.reconstruct(target_idx, target_embedding[0])
        
        # Query FAISS
        # We query for all products to get a score for everyone, then we can merge later
        # Since we want a score breakdown for all, we query for len(product_ids)
        k = len(self.product_ids)
        similarities, indices = self.index.search(target_embedding, k)
        
        scores = {}
        for sim, idx in zip(similarities[0], indices[0]):
            pid = self.product_ids[idx]
            # Convert cosine similarity [-1, 1] to [0, 1] range for valid weighting
            normalized_score = max(0.0, (sim + 1.0) / 2.0)
            scores[pid] = float(normalized_score)
            
        return scores
