from surprise import SVD, Dataset, Reader
import pandas as pd

class SVDService:
    def __init__(self):
        self.model = SVD()
        self.is_trained = False

    def train(self, purchase_history):
        """
        Trains the SVD model on user-product interaction data.
        """
        if not purchase_history:
            return

        print("SVD: Training Matrix Factorization model...")
        df = pd.DataFrame(purchase_history)
        
        # We assume a 'rating' of 1 for any purchase
        # In a research system, we could use multiple purchases for higher ratings
        df['rating'] = 1 
        
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(df[['user_id', 'product_id', 'rating']], reader)
        
        trainset = data.build_full_trainset()
        self.model.fit(trainset)
        self.is_trained = True
        print("SVD: Training complete.")

    def predict_score(self, user_id, product_id):
        """
        Predicts the preference score for a specific user-product pair.
        """
        if not self.is_trained:
            return 0.0
        
        prediction = self.model.predict(user_id, product_id)
        return float(prediction.est)
