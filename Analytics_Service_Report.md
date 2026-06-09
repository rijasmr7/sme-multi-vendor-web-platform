# 📊 Technical Documentation: Analytics Service

Welcome! This report explains how the **Analytics Service** works under the hood, how it is implemented, and how it handles real-time user activity tracking.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [Event Streaming with Redis](#2-event-streaming-with-redis)
3. [Database Structure](#3-database-structure)
4. [Time-Bucket Summarization](#4-time-bucket-summarization)
5. [Endpoints & Dashboard Integration](#5-endpoints-&-dashboard-integration)
6. [Conclusion](#6-conclusion)

---

## 1. Overview
The **Analytics Service** is the intelligence hub of the marketplace. It tracks every click, order, page view, and 3D model interaction across the platform. This data is used to render live admin dashboards and supply trending metrics to the recommendation service.

---

## 2. Event Streaming with Redis
To ensure user activity tracking doesn't slow down the main shopping experience, tracking is designed as an **Asynchronous Stream**:
1. When a user views a product, clicks a recommendation, or views a product in WebAR, the frontend sends a background request.
2. The Gateway pushes this directly to the **Analytics Service**.
3. The Analytics Service publishes the event immediately to a **Redis Stream** using `XADD`.
4. A background **Redis Consumer** picks up the event asynchronously and writes it to the database. This pattern handles high traffic easily without locking the HTTP server thread.

---

## 3. Database Structure
The service connects to `analytics_db` in PostgreSQL, containing three main tables:
- **`analytics_events`**: Stores the raw logs of every single interaction (timestamp, user_id, product_id, event_type).
- **`analytics_summary`**: Summarizes interactions in hourly chunks (views, orders, AR opens, recommendation clicks) to power dashboard charts.
- **`product_metrics`**: Aggregates view and purchase metrics per product (`product_id`, `total_views`, `total_orders`).

---

## 4. Time-Bucket Summarization
To render time-series charts, querying millions of raw events is too slow.
- The service groups activity into **Time Buckets** (e.g. 5-minute or hourly blocks).
- An hourly job aggregates event counts and stores them in the `analytics_summary` table.
- Charts can load 24 hours of data instantly by pulling just 24 pre-computed summary rows.

---

## 5. Endpoints & Dashboard Integration
The Analytics Service exposes various endpoints:
- `POST /events/test`: Manually injects an event into the stream for testing.
- `GET /analytics/live-summary`: Returns the number of active users (active in the last 5 minutes) and total processed events.
- `GET /analytics/kpis`: Aggregates platform-wide KPIs (total views, orders, clicks, AR opens).
- `GET /analytics/charts/views` & `GET /analytics/charts/orders`: Returns hourly data for time-series charts.
- `GET /analytics/top-products`: Returns the top 5 most viewed products, which is used by the Python **[RealtimeService](file:///d:/SME_FINAL_YEAR_PROJECT/services/ai-recommender-service/services/realtime_service.py)** to determine platform-wide trends.

---

## 6. Conclusion
By separating synchronous web requests from asynchronous event processing via Redis Streams, the **Analytics Service** maintains high performance under load. It stores raw audit logs in PostgreSQL while aggregating metrics in real-time, providing both historical depth and real-time dashboard responsiveness.
