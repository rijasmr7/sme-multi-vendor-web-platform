# 🛍️ Technical Documentation: Product Service

Welcome! This report explains how the **Product Service** works under the hood, how it is implemented, and how it manages the marketplace's product catalog.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [Database Structure](#2-database-structure)
3. [Cross-Service Validation](#3-cross-service-validation)
4. [Security & Ownership Enforcements](#4-security-&-ownership-enforcements)
5. [Endpoints](#5-endpoints)
6. [Conclusion](#6-conclusion)

---

## 1. Overview
The **Product Service** is a Node.js/Express microservice that manages the marketplace catalog. It handles creating, viewing, updating, and deleting products (CRUD operations). It is designed to coordinate catalog rules so that customers see accurate details and prices.

---

## 2. Database Structure
The service connects to `product_db` in PostgreSQL, containing a single main table:
- **`products`**:
  - `id` (Serial Primary Key)
  - `vendor_id` (Integer pointing to the owner user)
  - `name` (VARCHAR)
  - `price` (DECIMAL)
  - `category` (VARCHAR)
  - `description` (TEXT)
  - `extra_data` (JSON field to allow flexible features, like stock count or sizing)

---

## 3. Cross-Service Validation
To maintain integrity across services, the Product Service performs **Cross-Service HTTP Validation** when a new product is added:
- When a vendor sends a `POST /products` request, the Product Service makes a background query to the **User Service** (`GET /users/:vendor_id`).
- If the User Service returns `404 Not Found`, the product creation is rejected with an error (*"Invalid vendor: User not found"*). This ensures dummy accounts cannot publish items.

---

## 4. Security & Ownership Enforcements
Security is critical in multi-vendor platforms. The Product Service protects items through:
1. **JWT Verification**: It extracts the `vendor_id` from the secure JSON Web Token sent in the request header, making it impossible to forge product authorship.
2. **Ownership Guard**: When a vendor calls `updateProduct` or `deleteProduct`, it verifies that the requesting user's ID matches the `vendor_id` on the product record. A vendor cannot edit or delete another vendor's inventory.

---

## 5. Endpoints
The Product Service exposes endpoints grouped by access level:

### A. Public Endpoints
- `GET /products`: Fetches the entire platform-wide catalog (queried by the RAG search pipeline).
- `GET /products/vendor/:vendorId/public`: Fetches all public products belonging to a specific vendor.

### B. Protected Endpoints (Requires Vendor JWT)
- `POST /products`: Registers a new product in the catalog.
- `GET /products/vendor/:vendorId`: Retrieves catalog items managed by the vendor.
- `PUT /products/:id`: Updates a product (name, price, category, attributes).
- `DELETE /products/:id`: Permanently removes an item.

---

## 6. Conclusion
The **Product Service** acts as the inventory ledger for the marketplace. Through JWT validation, secure database triggers, and cross-service registration checks, it offers a secure and flexible catalog platform for both sellers and buyers.
