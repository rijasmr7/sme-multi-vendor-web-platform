# 👤 Technical Documentation: User Service

Welcome! This report explains how the **User Service** works under the hood, how it is implemented, and how it handles secure authentication and profile management.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [User Roles](#2-user-roles)
3. [Registration & Password Hashing](#3-registration-&-password-hashing)
4. [Authentication & JWT Generation](#4-authentication-&-jwt-generation)
5. [Internal Endpoints (Microservice Joins)](#5-internal-endpoints-microservice-joins)
6. [Endpoints](#6-endpoints)
7. [Conclusion](#6-conclusion)

---

## 1. Overview
The **User Service** is the security gatekeeper for the marketplace. It manages user credentials, handles authentication (login/register), and issues secure cryptographic tokens (JWTs) that other services use to verify identities.

---

## 2. User Roles
The platform separates actors into two roles:
- **customer**: Standard shopper who browses products, places orders, adds items to their cart, and shares location details.
- **vendor**: Shop owner who creates configurations, lists products, and manages incoming orders.

---

## 3. Registration & Password Hashing
Storing plain-text passwords in a database is a severe security risk. 
- During registration (`POST /users/register` or `POST /users/customer/register`), the user's password is sent over HTTPS.
- The service uses the **`bcryptjs`** library to hash the password with a "salt factor" before writing it to PostgreSQL. Bcrypt is a secure, slow hashing algorithm designed specifically to resist brute-force cracking.
- The hashed password is then stored in the `users` table of the `user_db`.

---

## 4. Authentication & JWT Generation
When a user logs in:
1. The service looks up their record by email or phone.
2. It compares the raw input password against the stored bcrypt hash using `bcrypt.compare()`.
3. If valid, it generates a **JSON Web Token (JWT)** signed with a secret key:
   ```javascript
   const token = jwt.sign(
       { id: user.id, role: user.role },
       process.env.JWT_SECRET,
       { expiresIn: '1d' }
   );
   ```
4. This token is sent to the client. The frontend attaches this token to the headers of subsequent requests (`Authorization: Bearer <token>`). Other services can decode this token to securely extract `id` and `role` without re-authenticating the user.

---

## 5. Internal Endpoints (Microservice Joins)
Because the services have isolated databases, other services sometimes need to verify users or fetch user properties (like the city of a customer for Cold Start recommendations).
- The User Service exposes **Internal Endpoints** under `/internal`:
  - `/internal/:id`: Fetches user profile.
  - `/internal-bulk/users`: Fetches all user profiles in bulk.
- These endpoints do not require authentication, but they are **hidden from the public internet**. The API Gateway does not forward requests to `/internal`, ensuring only internal Docker containers (like `recommender` or `product`) can query them.

---

## 6. Endpoints
The User Service exposes public, protected, and internal endpoints:

### A. Public Authentication
- `POST /users/register`: Registers a vendor.
- `POST /users/login`: Vendor login.
- `POST /users/customer/register`: Registers a customer.
- `POST /users/customer/login`: Customer login.

### B. Protected Profile
- `GET /users/profile`: Retrieves profile details for the logged-in user.

### C. Internal (Docker Only)
- `GET /internal/:id`: Fetches user by ID.
- `GET /internal-bulk/users`: Fetches all users.

---

## 7. Conclusion
The **User Service** forms the security baseline of our application. By combining bcrypt password hashing, JWT authorization, and isolated internal lookup APIs, it secures merchant storefronts and customer personal data.
