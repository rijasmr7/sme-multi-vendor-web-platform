# 📦 Technical Documentation: Order Service

Welcome! This report explains how the **Order Service** works under the hood, how it is implemented, and how it manages shopping carts and purchase workflows.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [Database Structure](#2-database-structure)
3. [The Purchase Workflow (Cart to Checkout)](#3-the-purchase-workflow-cart-to-checkout)
4. [Order Status Management](#4-order-status-management)
5. [Endpoints](#5-endpoints)
6. [Conclusion](#6-conclusion)

---

## 1. Overview
The **Order Service** is a Node.js/Express microservice that manages the transaction-oriented operations of the marketplace. It tracks shopping cart additions, processes checkout actions, registers delivery details, and updates purchase statuses as vendors process orders.

---

## 2. Database Structure
The service connects to `order_db` in PostgreSQL, containing three main tables:
- **`cart`**: Stores temporary items currently added by customers.
  - `customer_id`, `vendor_id`, `shop_id`, `product_id`, `quantity`, `unit_price`, `total_price`
- **`orders`**: Stores final checkout transactions.
  - `id` (Serial Primary Key)
  - `customer_id`, `vendor_id`, `shop_id`, `product_id`, `quantity`, `unit_price`, `total_price`, `status`, `delivery_type`
- **`delivery_address`**: Links destination details to an order.
  - `order_id` (foreign key pointing to orders)
  - `customer_name`, `customer_phone`, `address_line`, `city`, `zip_code`

---

## 3. The Purchase Workflow (Cart to Checkout)
1. **Cart Management**: When a customer clicks "Add to Cart", the item details (product name/ID, unit price, quantity) are stored in the `cart` table.
2. **Checkout**: When checking out, the frontend collects the user's address and chosen delivery type (delivery or pickup).
3. **Transaction Creation**:
   - The items are copied from `cart` into `orders`.
   - The customer's delivery information is inserted into `delivery_address`.
   - The user's cart is cleared.

---

## 4. Order Status Management
To ensure a secure checkout experience, status values are restricted at the database level using a **Check Constraint**:
```sql
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'ready_for_pickup', 'delivered'));
```
- **pending**: Customer checked out, waiting for vendor review.
- **confirmed**: Vendor accepted the order.
- **ready_for_pickup**: Items ready for physical collection (for pickup delivery types).
- **delivered** / **completed**: Customer received their items.
- **cancelled**: Order was rejected or cancelled.

---

## 5. Endpoints
The Order Service exposes endpoints divided into two categories:

### A. Cart Endpoints (`/cart`)
- `GET /cart`: Retrieves all items in the customer's cart.
- `POST /cart`: Adds or updates an item in the cart.
- `DELETE /cart/:id`: Removes a specific item from the cart.

### B. Order Endpoints (`/orders`)
- `POST /orders`: Processes checkout, moving cart items to the orders table.
- `GET /orders/customer`: Fetches all orders placed by the currently logged-in customer.
- `GET /orders/vendor`: Fetches all orders placed with a vendor's shop.
- `PATCH /orders/:id/status`: Updates the status of an order.

---

## 6. Conclusion
The **Order Service** coordinates transactions in the SME platform. By implementing strict CHECK constraints in PostgreSQL and managing cart states and delivery mappings, it ensures the purchase flow is secure, auditable, and reliable.
