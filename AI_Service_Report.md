# 🤖 Technical Documentation: AI Service

Welcome! This report explains how the **AI Service** works under the hood, how it is implemented, and how it helps vendors build customized, professional storefronts automatically.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [Core Objectives](#2-core-objectives)
3. [The Shop Generation Pipeline](#3-the-shop-generation-pipeline)
4. [Color Palette Synchronization (HSL Math)](#4-color-palette-synchronization-hsl-math)
5. [Database Integration](#5-database-integration)
6. [Cross-Service Proximity Registration](#6-cross-service-proximity-registration)
7. [API Endpoints](#7-api-endpoints)
8. [Conclusion](#8-conclusion)

---

## 1. Overview
The **AI Service** is a Node.js microservice that allows vendors to spin up high-quality e-commerce websites instantly using Generative AI. By simply providing a business type (like "bakery" or "clothing") and a primary color, the AI Service generates a complete layout, navigation links, theme colors, and starting products.

---

## 2. Core Objectives
- **Zero-Effort Design**: Enable non-technical small business owners (SMEs) to create a beautiful storefront without web development knowledge.
- **RAG-Infused Guardrails**: Guide the AI to generate structured layout and navigation patterns appropriate to the specific industry.
- **Microservice Location Seeding**: Auto-register coordinates in the geographic system when a shop goes live.

---

## 3. The Shop Generation Pipeline
When a vendor requests shop generation, the service runs a 4-step pipeline:

```
  Step 1: Retrieve industry constraints from internal Knowledge Base (RAG)
  Step 2: Calculate a matching color palette using HSL mathematical shifts
  Step 3: Build a structured prompt and invoke Google Gemini
  Step 4: Parse response and assemble final configuration
```

### RAG Constraints
To prevent the AI from generating weird or irrelevant layouts, the service uses a local dictionary as a knowledge base. For example:
- **Fruit Category**: navigation `["Home", "Fresh Fruits", "Offers", "Contact"]`, layout `"grid"`.
- **Clothing Category**: navigation `["Home", "Men", "Women", "Collections", "Contact"]`, layout `"modern-grid"`.

These rules are injected directly into the Gemini prompt.

### Smart Fallback
If the Gemini API key is missing or the external API call fails, the system automatically triggers a **Smart Fallback** that maps default mock configurations based on the business type, ensuring the shop creation flow never crashes.

---

## 4. Color Palette Synchronization (HSL Math)
To ensure the generated website looks premium, the service implements HSL (Hue, Saturation, Lightness) color math. 
Rather than letting the AI pick random, mismatching colors, the user supplies a single `primaryColor` (e.g. in Hex `#6366f1`). The code converts this to HSL, derives matching secondary and accent shades, and converts them back to Hex:
- **Secondary**: Lightens the primary hue slightly: `min(l + 25, 95)`
- **Accent**: Darkens the primary hue slightly: `max(l - 20, 5)`
- **Background**: Fixed to a soft slate `#f9fafb`
- **Text**: Dark slate `#111827`

---

## 5. Database Integration
The AI Service connects to `ai_db` in PostgreSQL. It manages a `shops` table that stores:
- `id` (Serial Primary Key)
- `vendor_id` (Integer linking to the vendor)
- `shop_name` (Name of the shop)
- `config` (JSON field containing navigation links, layouts, colors, and products)
- `is_published` (Boolean indicating if the shop is visible to the public)

---

## 6. Cross-Service Proximity Registration
When a shop is **published** (`is_published = true`), it triggers a cross-service HTTP request to the **Location Service** (`POST /shops/location`).
To facilitate local testing and demonstrate geo-proximity features:
- The service generates random geographic coordinates (latitude and longitude) near New York (`40.7128`, `-74.0060`).
- It registers the shop ID and its coordinates in the spatial index of the PostGIS database.

---

## 7. API Endpoints
The AI Service exposes endpoints to manage shops:
- `POST /shops/generate`: Starts the AI pipeline to create a draft configuration.
- `POST /shops/save`: Commits the configuration to PostgreSQL.
- `POST /shops/publish/:id`: Marks a shop as published and registers its geographic location.
- `GET /shops/vendor/:vendorId`: Fetches all shops owned by a specific vendor.
- `GET /shops/public`: Retrieves all published shops with layout and product settings.

---

## 8. Conclusion
The **AI Service** combines Generative AI and strict, structured rule-checking (RAG) to make storefront creation simple, robust, and beautiful. By outsourcing design decisions to HSL algorithms and AI, it empowers small businesses with premium website layouts in seconds.
