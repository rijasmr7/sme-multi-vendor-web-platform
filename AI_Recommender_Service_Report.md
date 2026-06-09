# 🚀 Complete Beginner-Friendly Guide & Report: AI Recommender Service

Welcome! This document is a complete, beginner-friendly technical report that explains how the **AI Recommender Service** works under the hood, how it is implemented, and how it fits into the **SME Multi-Vendor Web Platform**.

---

## 📌 Table of Contents
1. [What is the AI Recommender Service?](#1-what-is-the-ai-recommender-service)
2. [High-Level Architecture (How It Fits In)](#2-high-level-architecture-how-it-fits-in)
3. [The Core Recommendation Engines Explained](#3-the-core-recommendation-engines-explained)
4. [Hybrid Score Fusion (The Math Blended Simply)](#4-hybrid-score-fusion-the-math-blended-simply)
5. [The Generative AI Explanation Layer](#5-the-generative-ai-explanation-layer)
6. [Folder & File Structure Walkthrough](#6-folder--file-structure-walkthrough)
7. [End-to-End API Flow (How Requests Move)](#7-end-to-end-api-flow-how-requests-move)
8. [Conclusion](#8-conclusion)

---

## 1. What is the AI Recommender Service?

In a modern e-commerce platform, showing a static list of products is no longer enough. To help users find what they want—and discover new items they didn't know they needed—we need a **Recommendation Engine**.

This service does three major things:
1. **Personalization**: Recommends items based on what you have bought before and what similar users have bought.
2. **Context-Awareness**: Factors in **where** you are (using GPS coordinates) to suggest products from vendors close to you.
3. **Generative AI Explanations**: Instead of just showing a product, it uses **Google Gemini** to write a natural, friendly reason *why* that product is suggested (e.g., *"Related to your interest in Apple, loved by similar buyers, from a vendor very close to you."*).

### Why Python?
While the rest of the microservices in our platform are written in Node.js, this service is written in **Python**. Python is the industry-standard language for Data Science, Machine Learning, and AI because of its powerful math libraries like `numpy`, `scikit-learn`, `pandas`, and Hugging Face's `sentence-transformers`.

---

## 2. High-Level Architecture (How It Fits In)

The SME Platform is built using a **Microservices Architecture**. This means that instead of one giant codebase, the application is split into smaller, independent services that talk to each other over the network.

```
                  ┌──────────────────────┐
                  │   Customer Browser   │
                  └──────────┬───────────┘
                             │ (Port 5000)
                             ▼
                  ┌──────────────────────┐
                  │     API Gateway      │
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼ (Port 5001)    ▼ (Port 5007)    ▼ (Port 8008)
   ┌────────────────┐┌───────────────┐┌────────────────────────┐
   │Product Service ││Location Serv. ││ AI Recommender Service │
   └────────────────┘└───────────────┘└───────────┬────────────┘
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │  Redis Cache (6379)    │
                                      └────────────────────────┘
```

When a user loads the frontend page:
1. The **Frontend** makes a request to the **API Gateway**.
2. The **Gateway** forwards it to the **AI Recommender Service** (Port `8008`).
3. The **AI Recommender Service** gathers data from:
   - **Product Service** (to get list of products)
   - **Order Service** (to get purchase histories)
   - **Location Service** (to check how close the shop is to the user)
   - **Analytics Service** (to check what products are trending)
4. It processes this data, scores the products, fetches Gemini explanations, and sends the final recommendations back!

---

## 3. The Core Recommendation Engines Explained

The AI Recommender Service combines **four** separate scoring algorithms to find the best recommendations. Let's look at each one.

### A. Collaborative Filtering (User History matching)
* **File:** [svd_service.py](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service/services/svd_service.py)
* **Concept:** *"Users who liked X also liked Y."*
* **How it works:** 
  It uses **Singular Value Decomposition (SVD)** from the `scikit-surprise` library. 
  Imagine a massive table where rows are **Users** and columns are **Products**. A cell contains `1` if the user bought that product, and `0` otherwise. 
  SVD breaks this massive, mostly empty table down into smaller matrices (called "latent factors"). It identifies hidden patterns—like "User A and User B have extremely similar tastes because they both bought fruit and bakery items." It can then predict whether User A would like a product they haven't seen yet.

### B. Content-Based Filtering (Semantic matching)
* **File:** [rag_service.py](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service/services/rag_service.py)
* **Concept:** *"If you viewed a red coat, you might like a brown jacket."*
* **How it works:**
  Instead of looking at user purchases, it looks at the **metadata** (names, descriptions, and categories) of products.
  1. It uses a neural network model called **SentenceTransformers** (`all-MiniLM-L6-v2`) to convert text descriptions into a list of 384 numbers, called a **Vector Embedding**.
  2. Vectors represent the *meaning* of the text. Similar meanings will have vectors close to each other in mathematical space.
  3. It builds a **FAISS Index** (a high-speed search index from Meta) containing these vectors.
  4. When you view a product, it searches the FAISS index to find the top products with the closest semantic meaning.

### C. Proximity Scoring (Location matching)
* **File:** [location_service.py](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service/services/location_service.py)
* **Concept:** *"Prioritize shops that are closer to the customer."*
* **How it works:**
  1. It makes an internal call to the **Location Service** (`/vendors/nearby?lat=...&lon=...`).
  2. The Location Service uses a **PostGIS** spatial database to query GPS coordinates using spatial indexes (`ST_DWithin` and `ST_Distance`).
  3. The Recommender Service receives a list of nearby shops with their distances in kilometers.
  4. It normalizes this distance to a score between `0.0` and `1.0`:
     - Distance = 0 km $\rightarrow$ Proximity Score = `1.0` (Perfect)
     - Distance $\ge$ 50 km $\rightarrow$ Proximity Score = `0.0` (Too far)

### D. Real-Time Trending Scoring (Popularity matching)
* **File:** [realtime_service.py](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service/services/realtime_service.py)
* **Concept:** *"Suggest items that are hot right now."*
* **How it works:**
  1. It connects to a **Redis** cache.
  2. If the cache is empty, it fetches trending data from the **Analytics Service** (`/analytics/top-products`), which tracks product views and orders in real-time.
  3. It computes a trend score: $\text{Views} + (\text{Orders} \times 5)$.
  4. It normalizes this score between `0.0` and `1.0` based on the highest trending product on the platform.
  5. The result is cached in Redis for 60 seconds to avoid overloading the analytics database.

---

## 4. Hybrid Score Fusion (The Math Blended Simply)

Once we have all four individual scores for a product, how do we combine them? 

We use **Weighted Score Fusion** inside the [hybrid_engine.py](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service/services/hybrid_engine.py). 

We have two production endpoints, each with its own mathematical blend:

### 1. Location-Aware Hybrid Recommendations
This endpoint is used on product detail and listing pages. It aims to offer highly personalized, local suggestions:

$$\text{Final Score} = (0.35 \times \text{Content}) + (0.30 \times \text{Collaborative}) + (0.20 \times \text{Location}) + (0.15 \times \text{Realtime})$$

* **35% Content (RAG)**: Keeps the recommendations highly relevant to the product the user is currently looking at.
* **30% Collaborative (SVD)**: Personalizes it based on the user's historical shopping profile.
* **20% Location**: Gives a strong boost to local vendors.
* **15% Realtime**: Gives a gentle nudge to products that are popular today.

### 2. Trending Nearby Recommendations
This is a specialized query that focuses entirely on finding trending items in the user's immediate vicinity:

$$\text{Final Score} = (0.50 \times \text{Location}) + (0.50 \times \text{Realtime})$$

* It filters out any products where the vendor distance is $\ge 50\text{km}$ (Location Score $\le 0.0$).
* For nearby items, it computes a 50/50 blend of popularity and distance.

---

## 5. The Generative AI Explanation Layer

Traditional recommendation engines suffer from being a **"black box"**—they show items, but the user doesn't know why. Explaining the recommendation increases click-through rates and builds customer trust.

### The Quota Challenge
Initially, generating descriptions for 5 recommended products required making 5 separate HTTP calls to the Google Gemini API.
- This was extremely slow (taking 10+ seconds for a single page load).
- It quickly exhausted the free-tier API quota (20 requests per minute).

### The Solution: Bulk Prompting
We refactored the prompt to bundle all 5 recommendations into a **single Gemini call**. We pass the target product, the names of the recommended items, and their score breakdowns to Gemini and ask it to respond with a single, highly structured JSON object.

Here is an example of the prompt structure:
> "Explain why each of these products is recommended to a user who viewed/bought: **Coat**.
> Write a short, friendly explanation (max 12 words) for each product based on its scores:
> - High Relevance/Content means it is related to the target.
> - High Nearby/Location means from a local vendor.
> - High Collab/Trending means popular with similar users.
> Output valid JSON exactly like this: `{"reasons": [{"id": 1, "reason": "..."}]}`"

If Gemini succeeds, we parse the JSON and display the live AI explanation.

### Smart Category-Aware Fallbacks
If the Gemini API key is missing, or the service hits a `429 Resource Exhausted` rate-limit error, the engine automatically falls back to **Smart Category-Aware Heuristics** built directly into the Python code.

It looks at the product categories to write natural text:
- If recommendation has high Content similarity and belongs to the *same* category: `"Very similar to [Seed Product]."`
- If recommendation has high Content similarity but belongs to a *different* category: `"Related to your interest in [Seed Product]."`
- If it has a high collaborative score: `"...loved by similar buyers."`
- If it has a high location score: `"...from a vendor very close to you."`

---

## 6. Folder & File Structure Walkthrough

Here is what each file under [services/ai-recommender-service](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service) does:

```
ai-recommender-service/
├── main.py                       # The entry point. Houses the FastAPI endpoints and orchestrates data loading.
├── requirements.txt              # Standard Python packages file (numpy, pandas, redis, fastapi, etc.).
├── Dockerfile                    # Containerization instructions. Builds our python environment with PyTorch and SVD.
└── services/
    ├── __init__.py
    ├── rag_service.py            # Converts text metadata to vectors and finds similar items using FAISS.
    ├── svd_service.py            # Train SVD models on user order patterns.
    ├── location_service.py       # Queries the Location microservice to grab vendor distances.
    ├── realtime_service.py       # Queries Redis / Analytics to fetch hot trending counts.
    ├── hybrid_engine.py          # Merges all scores together and fetches Gemini bulk explanations.
    └── evaluation_service.py     # Calculates academic precision and recall metrics.
```

---

## 7. End-to-End API Flow (How Requests Move)

Let's trace exactly what happens when a user calls:
`GET http://localhost:5000/recommend/location-aware?user_id=7&product_id=85&latitude=6.9271&longitude=79.8612`

```
  Step 1: Gateway forwards query to recommender:8008
  Step 2: main.py receives requests and checks if product data is loaded in memory
          └── Yes -> Skips loading
          └── No  -> Fetches products from product-service (5001) & orders from order-service (5005)
  Step 3: location_service.py fetches nearby vendors from location:5007
  Step 4: realtime_service.py retrieves trending statistics from Redis
  Step 5: hybrid_engine.py computes Content, SVD, Location, and Realtime scores for all products
  Step 6: Sorts products by final weighted score and takes the top 5
  Step 7: Compiles target and top 5 products into a prompt and calls Gemini
  Step 8: Returns successful response back to client!
```

---

## 8. Conclusion

The **AI Recommender Service** is a sophisticated, highly optimized component of the SME Multi-Vendor Platform. By separating calculations into modular classes (`SVDService`, `RAGService`, `LocationService`, `RealtimeService`) and fusing them in the `HybridEngine`, it remains maintainable, lightning-fast, and extremely personal. 

Adding the bulk Generative AI layer ensures customers receive helpful context alongside recommendations, elevating the overall shopping experience.
