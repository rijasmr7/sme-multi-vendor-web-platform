import numpy as np

class EvaluationService:
    @staticmethod
    def precision_at_k(actual, predicted, k):
        """
        Calculates the percentage of recommended items that are relevant.
        """
        if not actual or not predicted:
            return 0.0
        
        predicted_k = predicted[:k]
        relevant_count = len(set(predicted_k) & set(actual))
        return relevant_count / k

    @staticmethod
    def recall_at_k(actual, predicted, k):
        """
        Calculates the percentage of relevant items that were caught in the top K.
        """
        if not actual or not predicted:
            return 0.0
            
        predicted_k = predicted[:k]
        relevant_count = len(set(predicted_k) & set(actual))
        return relevant_count / len(actual)

    @staticmethod
    def mean_average_precision(actual_list, predicted_list, k=5):
        """
        Calculate MAP@K across multiple users.
        """
        ap_list = []
        for actual, predicted in zip(actual_list, predicted_list):
            if not actual: continue
            
            score = 0.0
            num_hits = 0.0
            for i, p in enumerate(predicted[:k]):
                if p in actual:
                    num_hits += 1.0
                    score += num_hits / (i + 1.0)
            
            ap_list.append(score / min(len(actual), k))
            
        return np.mean(ap_list) if ap_list else 0.0
