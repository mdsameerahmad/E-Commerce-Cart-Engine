# CartSystem Backend

A production-oriented REST API for user-owned shopping carts, cart-item management,
promotion calculation, checkout summaries, request validation, rate limiting, and
automatic expiration of abandoned carts.

## Table of Contents

- [System Overview](#system-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Relationships](#database-relationships)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [End-to-End Testing Workflow](#end-to-end-testing-workflow)
- [Promotion Engine](#promotion-engine)
- [Feature X: Cart Expiration](#feature-x-cart-expiration)
- [Validation and Errors](#validation-and-errors)
- [Security](#security)
- [Business Rules](#business-rules)
- [Submission Checklist](#submission-checklist)
- [Future Improvements](#future-improvements)

## System Overview

CartSystem manages the complete lifecycle of a shopping cart:

1. A user registers.
2. The system automatically creates one active cart for that user.
3. Products can be added to the cart.
4. Adding the same product again increases its quantity.
5. Quantities can be updated and products can be removed.
6. The complete cart can be viewed with its subtotal.
7. Checkout calculates tier and diversity discounts.
8. Inactive carts expire automatically after 30 minutes.

```mermaid
flowchart LR
    Client["API Client"] --> Register["Register User"]
    Register --> User["User Created"]
    User --> Cart["Active Cart Created"]
    Cart --> Items["Add / Update / Remove Items"]
    Items --> View["View Cart + Subtotal"]
    View --> Checkout["Checkout Summary"]
    Checkout --> Promotion["Tier + Diversity Discounts"]
    Items --> Refresh["Refresh 30-Minute Expiration"]
    Refresh --> TTL["MongoDB TTL Cleanup"]
```

## Features

- User registration and lookup
- Automatic cart creation during registration
- Exactly one active cart per user
- User-to-cart ownership relationship
- Multi-tenant cart isolation
- Add, update, remove, and view cart items
- Automatic quantity merging for duplicate products
- Subtotal calculation
- Tiered promotion engine
- Unique-product diversity bonus
- Checkout pricing summary
- Zod request validation
- Structured validation errors
- MongoDB ObjectId validation
- API-wide rate limiting
- Helmet security headers
- Morgan request logging
- Centralized error and 404 handling
- MongoDB TTL-based abandoned-cart cleanup

## Technology Stack

| Technology | Purpose |
| --- | --- |
| Node.js | JavaScript runtime |
| Express 5 | REST API framework |
| MongoDB | Document database |
| Mongoose | Schema modeling, relationships, and indexes |
| Zod | Request payload and parameter validation |
| express-rate-limit | API abuse protection |
| Helmet | HTTP security headers |
| CORS | Cross-origin request handling |
| Morgan | HTTP request logging |
| dotenv | Environment configuration |
| Nodemon | Development server reloads |

## Architecture

The application follows the required:

```text
Route -> Controller -> Service -> Model
```

```mermaid
flowchart TD
    Request["HTTP Request"] --> Security["Helmet + CORS"]
    Security --> Parser["JSON Body Parser"]
    Parser --> Logger["Morgan Logger"]
    Logger --> Limit["API Rate Limiter"]
    Limit --> Route["Express Route"]
    Route --> Validation["Zod Validation"]
    Validation --> Controller["Controller"]
    Controller --> Service["Service Layer"]
    Service --> Utility["Promotion Utility, when required"]
    Service --> Model["Mongoose Model"]
    Model --> Database[("MongoDB")]
    Controller --> Response["JSON Response"]
    Validation --> Error["Central Error Handler"]
    Service --> Error
    Route --> NotFound["404 Middleware"]
    NotFound --> Error
```

### Layer responsibilities

| Layer | Responsibility |
| --- | --- |
| Routes | Define paths, HTTP methods, and validation middleware |
| Controllers | Read request data, call services, and format responses |
| Services | Contain business rules and database operations |
| Models | Define schemas, relationships, constraints, and indexes |
| Validators | Reject invalid input before controller execution |
| Utilities | Provide reusable, database-independent calculations |
| Middleware | Handle security, logging, rate limiting, validation, and errors |

## Database Relationships

```mermaid
erDiagram
    USER ||--|| CART : owns
    CART ||--o{ CART_ITEM : contains

    USER {
        ObjectId _id
        String name
        String email
        Date createdAt
        Date updatedAt
    }

    CART {
        ObjectId _id
        ObjectId userId
        String status
        Date expiresAt
        Date createdAt
        Date updatedAt
    }

    CART_ITEM {
        ObjectId _id
        ObjectId cartId
        String productId
        String productName
        Number price
        Number quantity
        Date createdAt
        Date updatedAt
    }
```

### Important database constraints

- User email is unique.
- A cart must reference a valid user.
- A user can have only one active cart.
- A cart item must reference a cart.
- A product can appear only once per cart.
- Duplicate product ingestion increments quantity instead of creating another row.
- `Cart.expiresAt` has a MongoDB TTL index.

## Project Structure

```text
CartSystem/
|-- src/
|   |-- config/
|   |   `-- db.js
|   |-- controllers/
|   |   |-- user.controller.js
|   |   |-- cart.controller.js
|   |   |-- cartItem.controller.js
|   |   `-- checkout.controller.js
|   |-- middlewares/
|   |   |-- validateRequest.js
|   |   |-- rateLimiter.js
|   |   |-- notFound.js
|   |   `-- errorHandler.js
|   |-- models/
|   |   |-- User.js
|   |   |-- Cart.js
|   |   `-- CartItem.js
|   |-- routes/
|   |   |-- health.routes.js
|   |   |-- user.routes.js
|   |   |-- cart.routes.js
|   |   |-- cartItem.routes.js
|   |   `-- checkout.routes.js
|   |-- services/
|   |   |-- user.service.js
|   |   |-- cart.service.js
|   |   |-- cartItem.service.js
|   |   `-- checkout.service.js
|   |-- utils/
|   |   `-- promotionEngine.js
|   |-- validators/
|   |   |-- user.validator.js
|   |   |-- cartItem.validator.js
|   |   `-- checkout.validator.js
|   |-- app.js
|   `-- server.js
|-- .env.example
|-- .gitignore
|-- DESIGN.md
|-- package.json
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas or a local MongoDB server

### Installation

```bash
git clone <repository-url>
cd CartSystem
npm install
```

Create `.env` from the provided template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with a valid MongoDB connection string.

If MongoDB Atlas is used:

1. Create a database user.
2. Add the current public IP under Atlas **Network Access**.
3. Insert the database username and password into `MONGODB_URI`.
4. URL-encode special characters in the username or password.

### Run in development

```bash
npm run dev
```

### Run in production mode

```bash
npm start
```

Expected startup output:

```text
MongoDB connected
Server running in development mode on port 5000
```

The HTTP server starts only after MongoDB connects successfully.

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/cartsystem
NODE_ENV=development
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP server port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB connection URI |
| `NODE_ENV` | No | `development`, `test`, or `production` |

Security notes:

- `.env` is ignored by Git.
- `.env.example` contains placeholders only.
- Never commit or share database credentials.
- Production responses do not expose stack traces.

## API Reference

Base URL:

```text
http://localhost:5000
```

### Endpoint summary

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Check server health |
| POST | `/api/users/register` | Register user and create cart |
| GET | `/api/users/:id` | Fetch user by ID |
| GET | `/api/users/:userId/cart` | Fetch the user's active cart |
| POST | `/api/cart/items` | Add or merge a cart item |
| PUT | `/api/cart/items/:itemId` | Update item quantity |
| DELETE | `/api/cart/items/:itemId` | Remove an item |
| GET | `/api/cart/:userId` | View complete cart and subtotal |
| GET | `/api/checkout/:userId` | Generate checkout pricing |

### 1. Health check

```http
GET /api/health
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "message": "Server is running successfully"
}
```

### 2. Register user

Registration automatically creates the user's active cart.

```http
POST /api/users/register
Content-Type: application/json
```

Request:

```json
{
  "name": "Sameer",
  "email": "sameer@example.com"
}
```

Successful response — `201 Created`:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Sameer",
      "email": "sameer@example.com",
      "createdAt": "2026-06-19T10:00:00.000Z",
      "updatedAt": "2026-06-19T10:00:00.000Z",
      "__v": 0
    }
  }
}
```

Duplicate email — `409 Conflict`:

```json
{
  "success": false,
  "message": "A user with this email already exists"
}
```

### 3. Get user by ID

```http
GET /api/users/USER_ID
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Sameer",
      "email": "sameer@example.com"
    }
  }
}
```

### 4. Get the user's active cart

```http
GET /api/users/USER_ID/cart
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "data": {
    "_id": "CART_ID",
    "status": "ACTIVE",
    "expiresAt": "2026-06-19T10:30:00.000Z",
    "user": {
      "_id": "USER_ID",
      "name": "Sameer",
      "email": "sameer@example.com"
    }
  }
}
```

### 5. Add an item

```http
POST /api/cart/items
Content-Type: application/json
```

Request:

```json
{
  "userId": "USER_ID",
  "productId": "P1001",
  "productName": "iPhone 15",
  "price": 75000,
  "quantity": 1
}
```

Successful response — `201 Created`:

```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cartId": "CART_ID",
    "items": [
      {
        "_id": "ITEM_ID",
        "cartId": "CART_ID",
        "productId": "P1001",
        "productName": "iPhone 15",
        "price": 75000,
        "quantity": 1
      }
    ],
    "subtotal": 75000
  }
}
```

Adding `P1001` again increments its quantity only when the incoming `productName`
and `price` exactly match the existing cart item. A `productId` cannot represent
different product metadata within the same cart.

If the same `productId` is submitted with a different name or price, the API returns
`409 Conflict`:

```json
{
  "success": false,
  "message": "Product ID already exists with different product details"
}
```

### 6. Update item quantity

```http
PUT /api/cart/items/ITEM_ID
Content-Type: application/json
```

Request:

```json
{
  "userId": "USER_ID",
  "quantity": 3
}
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "message": "Item quantity updated",
  "data": {
    "_id": "ITEM_ID",
    "cartId": "CART_ID",
    "productId": "P1001",
    "productName": "iPhone 15",
    "price": 75000,
    "quantity": 3
  }
}
```

### 7. Delete an item

```http
DELETE /api/cart/items/ITEM_ID
Content-Type: application/json
```

Request:

```json
{
  "userId": "USER_ID"
}
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

Verify removal:

```http
GET /api/cart/USER_ID
```

The deleted item will no longer appear in `data.items`.

### 8. View complete cart

```http
GET /api/cart/USER_ID
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "data": {
    "cartId": "CART_ID",
    "items": [
      {
        "_id": "ITEM_ID",
        "productId": "P1001",
        "productName": "iPhone 15",
        "price": 75000,
        "quantity": 2
      }
    ],
    "subtotal": 150000
  }
}
```

### 9. Checkout

```http
GET /api/checkout/USER_ID
```

Successful response — `200 OK`:

```json
{
  "success": true,
  "data": {
    "cartId": "CART_ID",
    "totalItems": 7,
    "uniqueProducts": 5,
    "subtotal": 25000,
    "promotionTier": "TIER_3",
    "tierDiscountPercentage": 15,
    "tierDiscountAmount": 3750,
    "diversityBonusPercentage": 3,
    "diversityBonusAmount": 750,
    "totalDiscount": 4500,
    "finalAmount": 20500
  }
}
```

An empty cart returns `400 Bad Request` with `Cart is empty`.

## End-to-End Testing Workflow

```mermaid
sequenceDiagram
    actor Client
    participant API
    participant UserService
    participant CartService
    participant CartItemService
    participant PromotionEngine
    participant MongoDB

    Client->>API: POST /api/users/register
    API->>UserService: Create user
    UserService->>MongoDB: Insert User
    UserService->>CartService: Create active cart
    CartService->>MongoDB: Insert Cart with expiresAt
    API-->>Client: User created

    Client->>API: POST /api/cart/items
    API->>CartItemService: Add product
    CartItemService->>MongoDB: Upsert CartItem
    CartItemService->>MongoDB: Refresh expiresAt
    API-->>Client: Updated cart

    Client->>API: GET /api/cart/:userId
    API->>MongoDB: Fetch cart and items
    API-->>Client: Items and subtotal

    Client->>API: GET /api/checkout/:userId
    API->>MongoDB: Fetch active cart and items
    API->>PromotionEngine: Calculate pricing
    PromotionEngine-->>API: Discount summary
    API-->>Client: Final checkout amount
```

Recommended Postman/manual test order:

1. Call `GET /api/health`.
2. Register a user and save the returned `_id` as `USER_ID`.
3. Fetch `GET /api/users/USER_ID`.
4. Fetch `GET /api/users/USER_ID/cart` and confirm the cart exists.
5. Add an item and save its `_id` as `ITEM_ID`.
6. Add the same product again and confirm quantity increased.
7. Update the item quantity.
8. View the cart and verify subtotal.
9. Add products until the desired promotion tier is reached.
10. Add five unique products to test the diversity bonus.
11. Call checkout and verify all pricing fields.
12. Delete the item.
13. View the cart again and verify the item was removed.

## Promotion Engine

```mermaid
flowchart TD
    Start["Cart Items"] --> Subtotal["Calculate Subtotal"]
    Subtotal --> TierCheck{"Highest Eligible Tier"}
    TierCheck -->|"Below 5,000"| None["No Tier Discount"]
    TierCheck -->|"5,000+"| Tier1["TIER_1: 5%"]
    TierCheck -->|"10,000+"| Tier2["TIER_2: 10%"]
    TierCheck -->|"20,000+"| Tier3["TIER_3: 15%"]
    None --> Diversity{"At least 5 unique products?"}
    Tier1 --> Diversity
    Tier2 --> Diversity
    Tier3 --> Diversity
    Diversity -->|Yes| Bonus["Add 3% Diversity Bonus"]
    Diversity -->|No| NoBonus["No Diversity Bonus"]
    Bonus --> Cap["Cap Discount at Subtotal"]
    NoBonus --> Cap
    Cap --> Final["Final Amount = Subtotal - Total Discount"]
```

### Tier rules

| Subtotal | Applied tier | Discount |
| ---: | --- | ---: |
| Below 5,000 | None | 0% |
| 5,000–9,999.99 | `TIER_1` | 5% |
| 10,000–19,999.99 | `TIER_2` | 10% |
| 20,000 or more | `TIER_3` | 15% |

### Diversity bonus

- Requires at least five unique `productId` values.
- Adds 3% of the original subtotal.
- Stacks with the selected tier discount.

### Pricing formulas

```text
subtotal = sum(price * quantity)
tierDiscountAmount = subtotal * tierPercentage / 100
diversityBonusAmount = subtotal * diversityPercentage / 100
totalDiscount = min(subtotal, tierDiscountAmount + diversityBonusAmount)
finalAmount = max(0, subtotal - totalDiscount)
```

Only the highest eligible tier applies. Currency values are rounded to two decimals.

## Feature X: Cart Expiration

Abandoned carts consume storage and retain stale data. CartSystem solves this using
MongoDB's native TTL index instead of cron jobs or external schedulers.

```mermaid
flowchart LR
    Create["Cart Created"] --> Set["expiresAt = now + 30 minutes"]
    Set --> Activity{"Cart Activity?"}
    Activity -->|"Add / Update / Remove"| Refresh["Reset expiresAt to now + 30 minutes"]
    Refresh --> Activity
    Activity -->|"No activity for 30 minutes"| Expired["Cart Becomes Expired"]
    Expired --> Monitor["MongoDB TTL Monitor"]
    Monitor --> Delete["Cart Document Removed"]
```

The Cart model contains:

```js
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

With `expireAfterSeconds: 0`, the value stored in `expiresAt` is treated as the
absolute expiration time.

Production benefits:

- No scheduler infrastructure
- No cleanup worker process
- Cleanup survives API restarts
- Reduced stale storage
- Database-enforced behavior across API instances

MongoDB TTL cleanup is asynchronous. A cart may remain briefly after its exact
expiration timestamp before the background monitor removes it.

## Validation and Errors

Validation runs before controller execution.

### Validation rules

- User name: required, trimmed, minimum two characters
- Email: required and valid
- ObjectIds: valid 24-character MongoDB ObjectIds
- Product ID and name: required
- Price: number greater than zero
- Quantity: positive whole number
- Unknown request-body fields: rejected
- Malformed JSON: rejected

Validation response — `400 Bad Request`:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

General error response:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common status codes:

| Status | Meaning |
| ---: | --- |
| `200` | Successful read, update, or delete |
| `201` | Resource created |
| `400` | Validation failure, invalid ID, or empty checkout cart |
| `404` | User, cart, item, or route not found |
| `409` | Duplicate email or active cart |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

## Security

Middleware order:

```text
Helmet
  -> CORS
  -> express.json
  -> Morgan
  -> API rate limiter
  -> Routes and validation
  -> 404 middleware
  -> Global error handler
```

Implemented protections:

- Helmet security headers
- API-wide rate limit: 100 requests per IP every 15 minutes
- Strict Zod request schemas
- Malformed JSON handling
- MongoDB ObjectId validation
- Unique database indexes
- Cart ownership checks for item mutations
- Hidden production stack traces
- Ignored `.env` credentials

Authentication is not part of the current assignment. The client supplies `userId`,
and services use it to enforce cart ownership boundaries.

## Business Rules

- Every registered user receives one active cart.
- A user cannot have multiple active carts.
- A cart cannot exist without a user.
- A cart item belongs to exactly one cart.
- The same product cannot have duplicate rows in one cart.
- Adding the same product increases quantity.
- A `productId` must always represent the same product metadata within a cart.
- If the same `productId` is submitted with a different `productName` or `price`,
  the request is rejected with `409 Conflict`.
- Quantity must remain greater than zero.
- API item prices must be greater than zero.
- Users cannot modify another user's cart items.
- Cart activity extends expiration by 30 minutes.
- Checkout is calculation-only; no order or payment is created.
- Only the highest eligible promotion tier is applied.
- The diversity bonus stacks with the tier discount.
- Discounts cannot exceed subtotal.
- Final amount cannot be negative.

## Submission Checklist

- [x] Node.js project uses ES Modules
- [x] MongoDB connection uses `MONGODB_URI`
- [x] Server starts only after MongoDB connects
- [x] Route -> Controller -> Service -> Model architecture
- [x] User registration and lookup
- [x] Automatic user cart creation
- [x] One active cart per user
- [x] Cart-item CRUD operations
- [x] Duplicate product quantity merging
- [x] Cart ownership isolation
- [x] Subtotal calculation
- [x] Promotion tiers
- [x] Diversity bonus
- [x] Checkout endpoint
- [x] Zod validation
- [x] Rate limiting and security middleware
- [x] Centralized error handling
- [x] MongoDB TTL cart expiration
- [x] `.env.example`
- [x] README and design documentation

## Future Improvements

- JWT authentication and authorization
- Trusted product catalog and server-controlled pricing
- Order creation and payment processing
- MongoDB transactions for user-and-cart creation
- Automatic CartItem cleanup when TTL removes a Cart
- Redis-backed distributed rate limiting
- Restricted production CORS origins
- Automated unit, integration, and load tests
- OpenAPI/Swagger documentation
- Containerization and CI/CD
- Monitoring, metrics, and structured logging

For architectural decisions and trade-offs, see [DESIGN.md](./DESIGN.md).
