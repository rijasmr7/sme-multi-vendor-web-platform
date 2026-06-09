import pandas as pd
from surprise import SVD, Dataset, Reader
from surprise.model_selection import train_test_split
import time

class CollaborativeEngine:
    def __init__(self):
        self.algo = SVD(n_factors=100, n_epochs=20, lr_all=0.005, reg_all=0.02)
        self.is_trained = False
        self.train_set = None
        self.last_trained = 0
        self.raw_history = []

    def train(self, purchase_history: list, all_product_ids: list = None):
        """
        Trains the SVD Collaborative Filtering model on purchase history.
        Includes SVD model caching (only trains if needed).
        """
        if not purchase_history:
            print("CollaborativeEngine: No purchase history available for training.")
            return

        current_time = time.time()
        if self.is_trained and (current_time - self.last_trained) < 3600:
            print("CollaborativeEngine: Using cached SVD model.")
            return

        print("CollaborativeEngine: Training SVD model on user history...")
        self.raw_history = purchase_history
        
        df_hist = pd.DataFrame(purchase_history)
        if 'product_id' not in df_hist.columns or 'user_id' not in df_hist.columns:
            print("CollaborativeEngine: Invalid purchase history format.")
            return

        # Implicit feedback training with negative sampling
        pids = all_product_ids if all_product_ids else list(df_hist['product_id'].unique())
        uids = list(df_hist['user_id'].unique())

        # Positive feedback: frequency grouped and mapped to scale [2, 5]
        pos_ratings = df_hist.groupby(['user_id', 'product_id']).size().reset_index(name='rating')
        pos_ratings['rating'] = pos_ratings['rating'].apply(lambda x: min(5, 2 + x))

        # Negative feedback: unpurchased items get rating 1
        neg_rows = []
        pos_pairs = set(zip(pos_ratings['user_id'], pos_ratings['product_id']))
        import random
        random.seed(42)
        for u in uids:
            unpurchased = [pid for pid in pids if (u, pid) not in pos_pairs]
            # Sample up to 15 unpurchased items as negative feedback
            sampled_neg = random.sample(unpurchased, min(len(unpurchased), 15))
            for pid in sampled_neg:
                neg_rows.append({'user_id': u, 'product_id': pid, 'rating': 1})

        df_neg = pd.DataFrame(neg_rows)
        ratings = pd.concat([pos_ratings, df_neg], ignore_index=True)
        
        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(ratings[['user_id', 'product_id', 'rating']], reader)
        
        self.train_set = data.build_full_trainset()
        self.algo.fit(self.train_set)
        
        self.is_trained = True
        self.last_trained = current_time
        print("CollaborativeEngine: SVD training complete.")

    def get_user_history(self, user_id: int) -> list:
        """
        Helper to return list of product IDs purchased by this user.
        """
        if not self.raw_history:
            return []
        return [int(h['product_id']) for h in self.raw_history if int(h['user_id']) == int(user_id)]

    def get_collaborative_scores(self, user_id: int, product_ids: list) -> dict:
        """
        Returns SVD predicted preference scores for the given products.
        Normalized to [0, 1].
        """
        scores = {}
        if not self.is_trained:
            # Cold start fallback
            return {pid: 0.0 for pid in product_ids}

        for pid in product_ids:
            # The algo.predict returns an estimated rating between 1 and 5
            prediction = self.algo.predict(uid=user_id, iid=pid)
            est_rating = prediction.est
            
            # Normalize from [1, 5] to [0, 1]
            normalized_score = (est_rating - 1.0) / 4.0
            scores[pid] = float(normalized_score)
            
        return scores
