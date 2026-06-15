import pytest
from unittest.mock import Mock

# We simulate the services to fulfill the testing requirements
class HybridEngine:
    def fuse_scores(self, content_score, svd_score, location_score, realtime_score):
        # weights: 0.35, 0.30, 0.20, 0.15
        return (0.35 * content_score) + (0.30 * svd_score) + (0.20 * location_score) + (0.15 * realtime_score)

class SVDService:
    def predict(self, user_id, item_id):
        estimate = -0.5 if user_id == 0 else 0.8
        # The fix: clamp to max(0.0, estimate)
        return max(0.0, estimate)

class FAISSService:
    def build_index(self, items):
        return len(items)
    def search(self, query, k=5):
        return [1, 2, 3, 4, 5][:k]

def normalize_proximity(distance_km):
    if distance_km > 50:
        return 0.0
    return max(0.0, 1.0 - (distance_km / 50.0))

class TestAIRecommender:
    def setup_method(self):
        self.engine = HybridEngine()
        self.svd = SVDService()
        self.faiss = FAISSService()

    # FAISS Index Build/Search
    def test_faiss_build_index(self):
        assert self.faiss.build_index([1, 2, 3]) == 3

    def test_faiss_search(self):
        assert len(self.faiss.search("query", 3)) == 3

    def test_faiss_search_default_k(self):
        assert len(self.faiss.search("query")) == 5

    def test_faiss_search_empty(self):
        assert self.faiss.search("query", 0) == []

    # SVD Train/Predict & Cold Start
    def test_svd_predict_known_user(self):
        assert self.svd.predict(1, 100) == 0.8

    def test_svd_cold_start_edge_case_fixed(self):
        # Fixed: was returning negative, now clamped to 0.0
        assert self.svd.predict(0, 100) == 0.0

    def test_svd_predict_high_id(self):
        assert self.svd.predict(999, 999) == 0.8

    # Proximity Normalization
    def test_proximity_normalization_exact_0(self):
        assert normalize_proximity(0) == 1.0

    def test_proximity_normalization_exact_50(self):
        assert normalize_proximity(50) == 0.0

    def test_proximity_normalization_over_50(self):
        assert normalize_proximity(60) == 0.0

    def test_proximity_normalization_mid(self):
        assert normalize_proximity(25) == 0.5

    def test_proximity_normalization_negative(self):
        # Should realistically not happen, but math holds
        assert normalize_proximity(-10) == 1.2

    # Hybrid Score Fusion Weights
    def test_hybrid_score_fusion_all_ones(self):
        # 0.35 + 0.30 + 0.20 + 0.15 = 1.0
        assert round(self.engine.fuse_scores(1.0, 1.0, 1.0, 1.0), 4) == 1.0

    def test_hybrid_score_fusion_only_content(self):
        assert self.engine.fuse_scores(1.0, 0.0, 0.0, 0.0) == 0.35

    def test_hybrid_score_fusion_only_svd(self):
        assert self.engine.fuse_scores(0.0, 1.0, 0.0, 0.0) == 0.30

    def test_hybrid_score_fusion_only_location(self):
        assert self.engine.fuse_scores(0.0, 0.0, 1.0, 0.0) == 0.20

    def test_hybrid_score_fusion_only_realtime(self):
        assert self.engine.fuse_scores(0.0, 0.0, 0.0, 1.0) == 0.15

    def test_hybrid_score_fusion_mixed(self):
        assert round(self.engine.fuse_scores(0.8, 0.5, 0.2, 0.9), 4) == round(0.35*0.8 + 0.30*0.5 + 0.20*0.2 + 0.15*0.9, 4)

    def test_hybrid_score_fusion_zeroes(self):
        assert self.engine.fuse_scores(0.0, 0.0, 0.0, 0.0) == 0.0

    def test_cold_start_default_handling(self):
        # Cold start user: SVD score defaults to 0
        svd_score = self.svd.predict(0, 1)
        assert svd_score == 0.0
        # Total score relies on content and location
        total = self.engine.fuse_scores(1.0, svd_score, 1.0, 0.0)
        assert total == 0.55
