# 🕶️ Technical Documentation: WebAR Service

Welcome! This report explains how the **WebAR Service** works under the hood, how it is implemented, and how it handles and compresses 3D assets for Augmented Reality.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [What is WebAR?](#2-what-is-webar)
3. [The 3D Conversion & Compression Pipeline](#3-the-3d-conversion-&-compression-pipeline)
4. [Database & Prisma ORM Schema](#4-database-&-prisma-orm-schema)
5. [AR Analytics Tracking](#5-ar-analytics-tracking)
6. [Endpoints](#6-endpoints)
7. [Conclusion](#7-conclusion)

---

## 1. Overview
The **WebAR Service** is a Node.js/Express microservice designed to bring immersive 3D shopping experiences to standard mobile browsers without requiring external app downloads. It manages 3D assets, optimizes large files for fast mobile loading, and tracks user interaction analytics.

---

## 2. What is WebAR?
Augmented Reality (AR) in e-commerce allows users to project 3D models of products directly into their physical space using their smartphone camera. For this to run smoothly inside a web browser:
1. File sizes must be tiny (under 5MB) so they load instantly over mobile networks.
2. Formats must be standardized—**GLB** is the industry standard for 3D web rendering.

However, vendors often upload raw 3D models (like OBJ or STL formats) that are uncompressed and range from 50MB to 500MB. The WebAR Service solves this through its optimization pipeline.

---

## 3. The 3D Conversion & Compression Pipeline
When a vendor uploads a 3D file, the WebAR Service processes it using the following steps:

```
  Step 1: Check original file extension (.obj, .stl, or .glb)
  Step 2: Auto-convert OBJ or STL formats to GLB using obj2gltf or Polar3D Converter
  Step 3: Load the GLB file into glTF-Transform memory
  Step 4: Execute transform filters (De-duplication, Weld vertices, Resample animations, Prune meshes)
  Step 5: Apply Draco 3D mesh compression
  Step 6: Save optimized asset and calculate file size statistics
```

### Transformation Details
- **`dedup()`**: Identifies duplicate textures or meshes and combines them.
- **`weld()`**: Merges coincident vertices to simplify the model's geometry structure.
- **`resample()`**: Simplifies keyframe animations.
- **`prune()`**: Cleans up unused nodes, textures, and coordinates.
- **`draco()`**: Utilizes Google Draco compression to compress vertex coordinates, texture mapping coordinates, and normal vectors by up to 90%.

---

## 4. Database & Prisma ORM Schema
The service uses **Prisma ORM** to manage its connection to `webar_db` in PostgreSQL. The table mapping is defined in `schema.prisma`:
- **`ArModel`** (`ar_models` table):
  - `id` (Auto-incrementing ID)
  - `vendor_id`, `shop_id`, `product_id` (Cross-service associations)
  - `model_name` (Name of the model)
  - `file_url` (Path to original uploaded asset)
  - `optimized_file_url` (Path to optimized Draco GLB)
  - `original_size` & `optimized_size` (Sizes in bytes)
  - `compression_ratio` (Percentage of size reduced)
  - `file_format` (Default is `glb`)
  - `views_3d` & `views_ar` (Interaction counts)
  - `uploaded_at` (Timestamp)

---

## 5. AR Analytics Tracking
To verify the performance and ROI of 3D models, the service implements interaction tracking:
- **3D Views**: Increments when a user rotates/interacts with a product model in 3D on a product page.
- **AR Views**: Increments when a user clicks the "View in AR" button and launches their phone camera to project the item in their room.
- These interaction logs feed directly into the admin KPI dashboards.

---

## 6. Endpoints
The WebAR Service exposes the following endpoints:
- `POST /models/upload`: Receives raw 3D assets, auto-converts, optimizes them, and registers database metadata.
- `GET /models/product/:product_id`: Retrieves the 3D model links associated with a product.
- `POST /models/product/:product_id/analytics`: Increments interaction views (3D or AR).
- `GET /models/analytics`: Fetches dashboard-wide statistics for 3D models.

---

## 7. Conclusion
By automating the conversion of raw OBJ/STL files and using advanced **glTF-Transform/Draco** pipelines, the **WebAR Service** enables standard web applications to serve rich 3D configurations on mobile devices quickly. It bridges the gap between high-quality 3D assets and low-bandwidth web clients.
