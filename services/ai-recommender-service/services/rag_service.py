import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class RAGService:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.product_map = {} # Maps FAISS index to Product ID

    def build_index(self, products_df):
        """
        Converts product descriptions into embeddings and stores them in FAISS
        """
        print("RAG: Building Vector Index...")
        # Combine features for embedding
        texts = (products_df['name'] + " " + products_df['description'] + " " + products_df['category']).tolist()
        embeddings = self.model.encode(texts)
        
        # Initialize FAISS Index (L2 distance for similarity)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
        
        # Create a mapping of index to product ID
        for i, row in products_df.iterrows():
            self.product_map[i] = row['id']
        
        print(f"RAG: Indexed {len(products_df)} products successfully.")

    def search(self, query_text, k=5):
        """
        Searches the Vector DB for the top K similar products
        """
        if self.index is None:
            return []

        query_embedding = self.model.encode([query_text])
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx in self.product_map:
                results.append({
                    "product_id": int(self.product_map[idx]),
                    "score": float(1 / (1 + dist)) # Convert L2 distance to a 0-1 similarity score
                })
        return results
