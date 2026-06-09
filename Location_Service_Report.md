# 🌍 Technical Documentation: Location Service

Welcome! This report explains how the **Location Service** works under the hood, how it is implemented, and how it handles high-performance geographic lookup using PostGIS.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [What is PostGIS?](#2-what-is-postgis)
3. [Database Structure](#3-database-structure)
4. [Spatial Querying Explained Simply](#4-spatial-querying-explained-simply)
5. [Endpoints](#5-endpoints)
6. [Conclusion](#6-conclusion)

---

## 1. Overview
The **Location Service** is a specialized Node.js/Express microservice responsible for handling spatial coordinates (latitude and longitude) of vendors and calculating real-time distances between shops and shoppers. It is used to power nearby shop lists and feed proximity scores to the recommendation engine.

---

## 2. What is PostGIS?
Calculating distances on a flat 2D plane is easy, but the Earth is a curved spheroid. Using the standard Haversine formula in pure Javascript is slow and doesn't scale.
To solve this, the Location Service integrates with **PostGIS**, a geographic spatial database extension for PostgreSQL. PostGIS stores locations as native `geography` objects and computes distances accurately across the globe using native C-optimized spatial libraries.

---

## 3. Database Structure
The service connects to `location_db` in PostgreSQL, containing a single main table:
- **`shop_locations`**:
  - `shop_id` (VARCHAR Primary Key)
  - `shop_name` (VARCHAR)
  - `latitude` & `longitude` (Numeric values)
  - `location` (PostGIS `geography(Point, 4326)` object)
  - `created_at` & `updated_at` (Timestamps)

### Indexing
To ensure coordinate searches are fast even with thousands of shops, it creates a **GiST (Generalized Search Tree) Index** on the `location` column:
```sql
CREATE INDEX IF NOT EXISTS shop_locations_geo_idx ON shop_locations USING GIST (location);
```

---

## 4. Spatial Querying Explained Simply

### A. Inserting Shop Coordinates
When a vendor publishes their shop, their location is stored as a geography object using PostGIS's `ST_MakePoint`:
```sql
INSERT INTO shop_locations (shop_id, shop_name, latitude, longitude, location)
VALUES ($1, $2, $3, $4, ST_MakePoint(longitude, latitude)::geography);
```
*(Note: PostGIS expects coordinates in `(longitude, latitude)` order, unlike standard GPS mapping).*

### B. Finding Nearby Shops
To search for vendors within a certain radius, it uses two PostGIS functions:
1. `ST_DWithin`: Binds the search to a specific distance radius (converted from kilometers to meters) utilizing the GiST index.
2. `ST_Distance`: Computes the exact distance between the user and the shop.

```sql
SELECT shop_id, shop_name, ST_Distance(location, ST_MakePoint(user_lon, user_lat)::geography) as distance_meters
FROM shop_locations
WHERE ST_DWithin(location, ST_MakePoint(user_lon, user_lat)::geography, radius_meters)
ORDER BY distance_meters ASC;
```

---

## 5. Endpoints
The Location Service exposes the following endpoints:
- `POST /vendors/location`: Creates or updates a shop's geographic coordinate.
- `GET /vendors/nearby`: Finds all shops within a specified radius (in km) from a user's location.
- `GET /vendors/distance/:id`: Calculates the precise distance (in km) to a specific shop.

---

## 6. Conclusion
By offloading all mathematical distance calculations to a PostGIS-enabled PostgreSQL instance, the **Location Service** keeps geographic lookup fast, light, and accurate. The GiST index allows the service to scale, providing near-instant proximity results for e-commerce search filters.
