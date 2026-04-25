# ElevenPOS Ecommerce API v1 — Frontend Developer Guide

> **Base URL:** `https://your-store.com/api/v1/ecommerce`
>
> All paths in this document are relative to the base URL above.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
   - [API Keys](#21-api-keys-x-api-key)
   - [Customer Bearer Tokens](#22-customer-bearer-tokens)
   - [Guest Cart Token](#23-guest-cart-token-x-cart-token)
   - [Auth Quick Reference](#24-auth-quick-reference-table)
3. [Common Conventions](#3-common-conventions)
   - [Response Envelope](#31-response-envelope)
   - [Pagination](#32-pagination)
   - [Error Responses](#33-error-responses)
   - [HTTP Status Codes](#34-http-status-codes)
4. [Endpoints](#4-endpoints)
   - [Store Information](#41-store-information)
   - [Categories](#42-categories)
   - [Brands](#43-brands)
   - [Products](#44-products)
   - [Product Engagement](#45-product-engagement)
   - [Customer Authentication](#46-customer-authentication)
   - [Cart](#47-cart)
   - [Orders](#48-orders)
   - [Customer Orders (Protected)](#49-customer-orders-protected)
   - [Payments](#410-payments)
   - [Coupons](#411-coupons)
   - [Returns & Refunds (Protected)](#412-returns--refunds-protected)
   - [Wishlist (Protected)](#413-wishlist-protected)
   - [Loyalty Points (Protected)](#414-loyalty-points-protected)
   - [Checkout Support](#415-checkout-support)
   - [Banners & Visual Content](#416-banners--visual-content)
   - [Homepage Categories](#417-homepage-categories)
   - [Store Content Pages](#418-store-content-pages)
   - [Support Tickets](#419-support-tickets)
   - [Contact & Newsletter](#420-contact--newsletter)
   - [Appointments](#421-appointments)
   - [Translations](#422-translations)
   - [Blog](#423-blog)
5. [Full Storefront Flow](#5-full-storefront-flow)
6. [Tips & Best Practices](#6-tips--best-practices)

---

## 1. Overview

This is a **headless ecommerce API** powering a complete online store. It supports:

- Product catalog with categories, brands, variants (barcodes), images, translations
- Customer accounts, authentication, profile management
- Shopping cart for guests and authenticated customers
- Order placement, payment initiation (SSLCommerz, Stripe), and verification
- Coupon codes, loyalty points, order returns
- Wishlist, reviews, comments, Q&A
- Store content: banners, sliders, blog, FAQs, pages, outlets
- Appointment booking, support tickets, newsletter

**API version:** `v1`

**Response format:** JSON

**Date format:** ISO 8601 (`YYYY-MM-DD`, `YYYY-MM-DDTHH:MM:SSZ`)

---

## 2. Authentication

This API uses **three layers** of authentication depending on the operation.

### 2.1 API Keys (`X-Api-Key`)

Every request to the ecommerce API must include an API key in the header:

```
X-Api-Key: pk_xxxxxxxxxxxxxxxxxxxxxxxx
```

There are two key types:

| Type | Prefix | Access |
|------|--------|--------|
| **Public Key** | `pk_` | Read-only catalog, customer registration/login, cart, public content |
| **Secret Key** | `sk_` | Order creation, payments, coupon validation, write operations |

> **Tip:** Use your **public key** in your frontend client-side code. Store your **secret key** server-side only — never expose it in browser JavaScript.

**Getting API Keys:** Keys are generated in the ElevenPOS dashboard under `Settings → API Keys`.

### 2.2 Customer Bearer Tokens

For customer-specific operations (orders history, wishlist, returns, loyalty), send a Bearer token obtained from login:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

Obtain the token by calling [POST /customer/login](#post-customerlogin) or [POST /customer/register](#post-customerregister).

> **Note:** Customer tokens use Laravel Sanctum under the `contact` guard. They do not expire by default but can be revoked via logout.

### 2.3 Guest Cart Token (`X-Cart-Token`)

Guest (unauthenticated) users get a cart identified by a UUID token. On the **first** `POST /cart/items` call without a customer token, the API creates a cart and returns a `cart_token` in the response body.

Store this token in `localStorage` and send it on every subsequent cart request:

```
X-Cart-Token: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Guest carts expire after **30 days** of inactivity.

> **Tip:** When a guest logs in, merge their cart by transferring the `X-Cart-Token` alongside the `Authorization` header on the next cart call — the system links the guest cart to the customer account.

### 2.4 Auth Quick Reference Table

| Endpoint Group | `X-Api-Key` Required | `Authorization: Bearer` Required | `X-Cart-Token` |
|---|---|---|---|
| All catalog (read) | `pk_` or `sk_` | No | No |
| Product engagement (write) | `sk_` | No | No |
| Customer register/login | `pk_` or `sk_` | No | No |
| Customer profile, orders, wishlist, returns, loyalty | `pk_` or `sk_` | **Yes** | No |
| Cart (guest) | `pk_` or `sk_` | No | **Yes** (after first add) |
| Cart (logged-in) | `pk_` or `sk_` | **Yes** | No |
| Order creation, payment | `sk_` | No | No |
| Coupon validate, contact, newsletter | `sk_` | No | No |
| SSLCommerz IPN webhook | None | No | No |

---

## 3. Common Conventions

### 3.1 Response Envelope

All successful responses wrap data in a `data` key:

```json
{
  "data": { ... }
}
```

Or for collections:

```json
{
  "data": [ ... ]
}
```

Some responses (e.g., login, order creation) also include top-level keys alongside `data`:

```json
{
  "message": "Order placed successfully.",
  "order": { ... },
  "points_earned": 50
}
```

### 3.2 Pagination

Paginated endpoints return a `meta` object:

```json
{
  "data": [ ... ],
  "meta": {
    "total": 150,
    "per_page": 20,
    "current_page": 1,
    "last_page": 8
  }
}
```

Control pagination with query params:
- `?page=2` — page number (default: 1)
- `?per_page=50` — items per page (default varies, max 100)

### 3.3 Error Responses

```json
{
  "error": "Validation failed.",
  "message": "The barcode_id field is required."
}
```

Validation errors (422) may return field-level details:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 6 characters."]
  }
}
```

### 3.4 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (new resource) |
| `401` | Unauthorized — missing or invalid API key / Bearer token |
| `403` | Forbidden — key lacks permission, or account is inactive |
| `404` | Not found |
| `422` | Unprocessable — validation error, out of stock, invalid coupon, etc. |

---

## 4. Endpoints

---

### 4.1 Store Information

#### `GET /store`

Returns store branding, contact info, social links, theme colors, and enabled feature flags.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": {
    "name": "My Store",
    "logo": "https://your-store.com/storage/logo.png",
    "favicon": "https://your-store.com/storage/favicon.ico",
    "tagline": "Best products, best prices.",
    "email": "hello@mystore.com",
    "phone": "+8801700000000",
    "address": "123 Main Street, Dhaka",
    "currency": "BDT",
    "currency_symbol": "৳",
    "social": {
      "facebook": "https://facebook.com/mystore",
      "instagram": null,
      "youtube": null
    },
    "colors": {
      "primary": "#FF5722",
      "secondary": "#212121"
    },
    "features": {
      "wishlist": true,
      "reviews": true,
      "loyalty": true,
      "appointments": false,
      "blog": true
    }
  }
}
```

**Use case:** Call this on app startup to initialize store branding, currency symbol, and determine which features to render (hide wishlist icon if `features.wishlist` is false).

---

### 4.2 Categories

#### `GET /categories`

Returns all root categories with their child categories (hierarchical — up to 3 levels).

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lang` | string | No | Language code (e.g., `en`, `bn`) for translated names |

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "image": "https://your-store.com/storage/categories/electronics.jpg",
      "children": [
        {
          "id": 5,
          "name": "Smartphones",
          "slug": "smartphones",
          "image": null,
          "children": []
        }
      ]
    }
  ]
}
```

**Use case:** Build the navigation menu or sidebar category tree.

---

#### `GET /categories/{slug}`

Returns a single category with its immediate children and translations.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `slug` | string | Category slug (e.g., `electronics`) |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lang` | string | No | Language code for translated content |

**Success Response `200`:**
```json
{
  "data": {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics",
    "description": "All electronic products",
    "image": "https://your-store.com/storage/categories/electronics.jpg",
    "banner": "https://your-store.com/storage/categories/electronics-banner.jpg",
    "children": [ ... ]
  }
}
```

**Errors:** `404` if slug not found.

**Use case:** Render a category landing page with its subcategories as filter chips.

---

### 4.3 Brands

#### `GET /brands`

Returns all active brands ordered by name.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Samsung",
      "logo": "https://your-store.com/storage/brands/samsung.png"
    }
  ]
}
```

**Use case:** Populate a brand filter on the product listing page.

---

### 4.4 Products

#### `GET /products`

Returns a paginated list of active products with filtering and search support.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Search by product name or SKU |
| `category` | string | — | Filter by category slug |
| `brand` | string | — | Filter by brand name |
| `featured` | `1` | — | Return only featured products |
| `lang` | string | `en` | Language for translated names |
| `per_page` | integer | `20` | Results per page (max 100) |
| `page` | integer | `1` | Page number |

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 42,
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "sku": "APL-IP15P",
      "image": "https://your-store.com/storage/products/iphone15pro.jpg",
      "type": "simple",
      "is_featured": true,
      "rating_avg": 4.8,
      "rating_count": 124,
      "view_count": 3200,
      "sale_count": 87,
      "category": { "id": 5, "name": "Smartphones", "slug": "smartphones" },
      "brand": { "id": 2, "name": "Apple" },
      "barcodes": [
        {
          "id": 101,
          "sku": "APL-IP15P-128",
          "selling_price": 145000,
          "after_discount": 139000,
          "discount": 6000,
          "stock": 15
        }
      ]
    }
  ],
  "meta": {
    "total": 340,
    "per_page": 20,
    "current_page": 1,
    "last_page": 17
  }
}
```

**Use case:** Product listing page, search results page, category page products grid.

> **Tip:** Use `barcodes[0].after_discount` as the displayed price. If `after_discount` equals `selling_price`, there's no active discount.

> **Important:** `barcodes` in the list view gives the default/first variant. For complex products with multiple variants, always fetch the full product detail.

---

#### `GET /products/{slug}`

Returns full product details including all images, all variant barcodes with attributes, specifications, translations, and SEO metadata.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `slug` | string | Product slug |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `lang` | string | Language code for translations |

**Success Response `200`:**
```json
{
  "data": {
    "id": 42,
    "name": "iPhone 15 Pro",
    "slug": "iphone-15-pro",
    "sku": "APL-IP15P",
    "model_number": "A3293",
    "image": "https://your-store.com/storage/products/iphone15pro.jpg",
    "images": [
      { "id": 1, "url": "https://your-store.com/storage/products/img1.jpg", "sort_order": 1 }
    ],
    "short_description": "The most powerful iPhone ever.",
    "description": "<p>Full HTML description...</p>",
    "type": "complex",
    "is_featured": true,
    "weight": "0.187 kg",
    "dimensions": "14.67 x 7.09 x 0.83 cm",
    "specifications": [
      { "label": "Display", "value": "6.1 inch Super Retina XDR" }
    ],
    "tags": ["apple", "smartphone", "5g"],
    "tax_percentage": 15,
    "tax_type": "exclusive",
    "hsn_code": "8517",
    "manage_stock": true,
    "min_order_quantity": 1,
    "max_order_quantity": 5,
    "is_returnable": true,
    "is_refundable": false,
    "rating_avg": 4.8,
    "rating_count": 124,
    "category": { "id": 5, "name": "Smartphones", "slug": "smartphones" },
    "brand": { "id": 2, "name": "Apple" },
    "unit": { "id": 1, "name": "Piece" },
    "barcodes": [
      {
        "id": 101,
        "sku": "APL-IP15P-128",
        "barcode": "8901234567890",
        "selling_price": 145000,
        "after_discount": 139000,
        "discount": 6000,
        "whole_sale_price": 130000,
        "stock": 15,
        "attributes": [
          { "name": "Storage", "value": "128GB" },
          { "name": "Color", "value": "Natural Titanium" }
        ]
      }
    ],
    "meta": {
      "title": "iPhone 15 Pro — Best Price in BD",
      "description": "Buy iPhone 15 Pro...",
      "keywords": ["iphone 15 pro", "apple", "smartphone"]
    },
    "translations": {
      "bn": { "name": "আইফোন ১৫ প্রো", "description": "..." }
    }
  }
}
```

**Errors:** `404` if not found or inactive.

**Use case:** Product detail page — render variant selector using `barcodes[].attributes`, show the `barcode.id` as `barcode_id` when adding to cart.

> **Important:** When adding to cart or placing an order, use `barcode.id` (not `product.id`). The barcode represents the specific variant with its own price and stock.

---

#### `GET /featured-products`

Returns products marked as featured.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `lang` | string | Language code |

**Use case:** Homepage "Featured Products" section.

---

#### `GET /flash-sales`

Returns active flash sales with countdown timers and discounted products.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `lang` | string | Language code |

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 3,
      "title": "Weekend Flash Sale",
      "ends_at": "2024-12-31T23:59:59Z",
      "discount_percentage": 20,
      "products": [ ... ]
    }
  ]
}
```

**Use case:** Flash sale banner with countdown timer on homepage.

> **Tip:** Use `ends_at` to drive a countdown timer. Poll this endpoint every few minutes to refresh products in active sales.

---

#### `GET /new-arrivals`

Returns the most recently added products.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | `20` | Number of products (max 100) |
| `lang` | string | `en` | Language code |

**Use case:** "New Arrivals" section on the homepage.

---

#### `GET /top-selling`

Returns top-selling products by quantity sold.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | `20` | Number of products (max 100) |
| `lang` | string | `en` | Language code |

**Use case:** "Best Sellers" section.

---

### 4.5 Product Engagement

#### `GET /products/{slug}/reviews`

Returns approved customer reviews for a product.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "customer_name": "John D.",
      "rating": 5,
      "review": "Excellent product! Very fast delivery.",
      "created_at": "2024-11-15T10:30:00Z"
    }
  ]
}
```

**Use case:** Reviews tab on product detail page.

---

#### `POST /products/{slug}/reviews`

Submits a new review (goes into a pending approval queue).

**Headers:**
```
X-Api-Key: {{secret_key}}
```

**Request Body:**
```json
{
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "rating": 4,
  "review": "Great quality, fast shipping!"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `customer_name` | string | Yes | max 255 |
| `customer_email` | email | No | valid email |
| `rating` | integer | Yes | 1–5 |
| `review` | string | No | — |

**Success Response `201`:**
```json
{
  "message": "Review submitted and pending approval."
}
```

**Use case:** Review submission form on product page.

> **Note:** Reviews require admin approval before appearing publicly.

---

#### `GET /products/{slug}/comments`

Returns approved comments for a product.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Use case:** Comment section on product page (separate from reviews).

---

#### `POST /products/{slug}/comments`

Submits a new comment.

**Headers:**
```
X-Api-Key: {{secret_key}}
```

**Request Body:**
```json
{
  "customer_name": "Ali Hassan",
  "customer_email": "ali@example.com",
  "comment": "Is this available in blue?"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `customer_name` | string | Yes | max 255 |
| `customer_email` | email | No | valid email |
| `comment` | string | Yes | — |

**Success Response `201`:**
```json
{
  "message": "Comment submitted and pending approval."
}
```

---

#### `GET /products/{slug}/questions`

Returns publicly visible answered questions for a product.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Use case:** Q&A section on product detail page.

---

#### `POST /products/{slug}/questions`

Submits a question about a product.

**Headers:**
```
X-Api-Key: {{secret_key}}
```

**Request Body:**
```json
{
  "customer_name": "Rahim Uddin",
  "customer_email": "rahim@example.com",
  "question": "Does this come with a warranty?"
}
```

| Field | Type | Required |
|-------|------|----------|
| `customer_name` | string | Yes |
| `customer_email` | email | No |
| `question` | string | Yes |

**Success Response `201`:**
```json
{
  "message": "Question submitted successfully."
}
```

---

#### `GET /reviews`

Returns all approved reviews across all products (store-wide), paginated.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| `per_page` | integer | `20` |
| `page` | integer | `1` |

**Use case:** Testimonials / reviews page showing store-wide social proof.

---

### 4.6 Customer Authentication

#### `POST /customer/register`

Creates a new customer account and returns an access token.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+8801711223344",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | max 255 |
| `email` | email | Yes | unique |
| `phone` | string | No | max 50 |
| `password` | string | Yes | min 6 |
| `password_confirmation` | string | Yes | must match `password` |

**Success Response `201`:**
```json
{
  "message": "Registration successful.",
  "access_token": "1|abcdefghijklmnopqrstuvwxyz1234567890",
  "token_type": "Bearer",
  "customer": {
    "id": 99,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+8801711223344"
  }
}
```

**Errors:** `422` if email already registered or passwords don't match.

**Use case:** Registration form. Store `access_token` in secure storage after success.

---

#### `POST /customer/login`

Authenticates a customer and returns an access token.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | email | Yes |
| `password` | string | Yes |

**Success Response `200`:**
```json
{
  "message": "Login successful.",
  "access_token": "2|xyz789...",
  "token_type": "Bearer",
  "customer": {
    "id": 99,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+8801711223344",
    "address": "123 Main St",
    "city": "Dhaka",
    "country": "Bangladesh"
  }
}
```

**Errors:**
- `422` — invalid credentials
- `403` — account is inactive/suspended

**Use case:** Login form. Store `access_token` and use as `Authorization: Bearer` on protected requests.

---

#### `POST /customer/logout`

Invalidates the current access token.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "message": "Logged out successfully."
}
```

**Use case:** Logout button. Clear stored token after this call.

---

#### `GET /customer/me`

Returns the authenticated customer's profile.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "customer": {
    "id": 99,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+8801711223344",
    "address": "123 Main St",
    "city": "Dhaka",
    "state": "Dhaka",
    "country": "Bangladesh",
    "postal_code": "1200"
  }
}
```

**Use case:** Profile page, pre-fill checkout form with saved address.

---

#### `PUT /customer/me`

Updates the authenticated customer's profile. All fields are optional.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

**Request Body (all optional):**
```json
{
  "name": "Jane Smith Updated",
  "phone": "+8801700000001",
  "address": "456 New Road",
  "city": "Chittagong",
  "state": "Chittagong",
  "country": "Bangladesh",
  "postal_code": "4000",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

**Success Response `200`:**
```json
{
  "message": "Profile updated.",
  "customer": { ... }
}
```

**Use case:** Profile edit form, change password form.

---

### 4.7 Cart

The cart works for both **guest** and **authenticated** users.

**Guest flow:**
1. Call `POST /cart/items` — no auth headers needed (just `X-Api-Key`)
2. Response includes `cart_token` — save it to `localStorage`
3. On all future cart calls, send `X-Cart-Token: <saved_token>`

**Authenticated flow:**
1. Send `Authorization: Bearer {{customer_token}}` on all cart calls
2. No `X-Cart-Token` needed — cart is tied to the customer account

---

#### `GET /cart`

Returns the current cart contents.

**Headers (guest):**
```
X-Api-Key: {{public_key}}
X-Cart-Token: {{cart_token}}
```

**Headers (authenticated):**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "data": {
    "items": [
      {
        "id": 55,
        "barcode_id": 101,
        "quantity": 2,
        "product": {
          "name": "iPhone 15 Pro",
          "slug": "iphone-15-pro",
          "image": "https://your-store.com/storage/products/iphone15pro.jpg"
        },
        "barcode": {
          "sku": "APL-IP15P-128",
          "selling_price": 145000,
          "after_discount": 139000,
          "stock": 15
        },
        "line_total": 278000
      }
    ],
    "total_items": 2,
    "sub_total": 278000
  }
}
```

---

#### `POST /cart/items`

Adds a product variant to the cart.

**Headers:**
```
X-Api-Key: {{public_key}}
X-Cart-Token: {{cart_token}}   (omit if authenticated)
Authorization: Bearer {{customer_token}}   (omit if guest)
Content-Type: application/json
```

**Request Body:**
```json
{
  "barcode_id": 101,
  "quantity": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `barcode_id` | integer | Yes | must be a valid, active barcode |
| `quantity` | integer | Yes | 1–999 |

**Success Response `201`:**
```json
{
  "cart_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": {
    "items": [ ... ],
    "total_items": 1,
    "sub_total": 139000
  }
}
```

**Errors:** `422` — product not found, out of stock, or exceeds max order quantity.

**Use case:** "Add to Cart" button. Save `cart_token` from response if guest.

---

#### `PUT /cart/items/{cartItemId}`

Updates the quantity of a cart item.

**Headers:**
```
X-Api-Key: {{public_key}}
X-Cart-Token: {{cart_token}}
Content-Type: application/json
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `cartItemId` | integer | Cart item ID from `GET /cart` response (`items[].id`) |

**Request Body:**
```json
{
  "quantity": 3
}
```

**Success Response `200`:** Updated cart object.

**Errors:** `404` if cart item not found.

**Use case:** Quantity stepper (+/−) on cart page.

---

#### `DELETE /cart/items/{cartItemId}`

Removes a single item from the cart.

**Headers:**
```
X-Api-Key: {{public_key}}
X-Cart-Token: {{cart_token}}
```

**Success Response `200`:** Updated cart object.

**Use case:** Remove item button on cart page.

---

#### `DELETE /cart`

Clears all items from the cart.

**Headers:**
```
X-Api-Key: {{public_key}}
X-Cart-Token: {{cart_token}}
```

**Success Response `200`:**
```json
{
  "data": {
    "items": [],
    "total_items": 0,
    "sub_total": 0
  }
}
```

**Use case:** "Clear Cart" button.

---

### 4.8 Orders

#### `POST /orders`

Places a new order. Requires secret key. Creates or finds the customer contact by phone number.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+8801711223344"
  },
  "items": [
    {
      "barcode_id": 101,
      "quantity": 2
    }
  ],
  "shipping_address": {
    "address": "456 New Road, Mirpur",
    "city": "Dhaka",
    "state": "Dhaka",
    "country": "Bangladesh"
  },
  "payment_method": "Cash on Delivery",
  "coupon_code": "SAVE10",
  "shipping_cost": 80,
  "note": "Please call before delivery."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customer.name` | string | Yes | max 255 |
| `customer.email` | email | No | — |
| `customer.phone` | string | Yes | max 50; used to find existing contact |
| `items` | array | Yes | min 1 item |
| `items[].barcode_id` | integer | Yes | — |
| `items[].quantity` | integer | Yes | min 1 |
| `shipping_address.address` | string | Yes | — |
| `shipping_address.city` | string | No | — |
| `shipping_address.state` | string | No | — |
| `shipping_address.country` | string | No | — |
| `payment_method` | string | Yes | max 100 (e.g., "Cash on Delivery", "bKash") |
| `coupon_code` | string | No | validated at order time |
| `shipping_cost` | numeric | No | default 0 |
| `note` | string | No | delivery instructions |

**Success Response `201`:**
```json
{
  "message": "Order placed successfully.",
  "order": {
    "id": 1001,
    "invoice_number": "INV-2024-1001",
    "net_total": 278080,
    "payment_status": "due",
    "status": "pending",
    "created_at": "2024-12-01T14:30:00Z"
  },
  "points_earned": 50
}
```

**Errors:**
- `422` — out of stock, invalid coupon, validation failure

**Use case:** Checkout form submission. Use `order.id` to initiate payment afterwards.

> **Important:** Always validate coupon via `POST /coupons/validate` before placing the order to show live discount preview to the user.

---

#### `GET /orders/{id}`

Retrieve an order by ID. Requires the customer's phone number for verification (no customer auth needed).

**Headers:**
```
X-Api-Key: {{secret_key}}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Order/Sale ID |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | Must match the order's customer phone |

**Success Response `200`:** Full order object with line items.

**Errors:** `404` — order not found or phone mismatch.

**Use case:** Order lookup / order tracking without requiring a customer account.

---

### 4.9 Customer Orders (Protected)

Requires `Authorization: Bearer {{customer_token}}`.

#### `GET /customer/orders`

Returns a paginated list of the logged-in customer's orders.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| `per_page` | integer | `15` |

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1001,
      "invoice_number": "INV-2024-1001",
      "date": "2024-12-01",
      "net_total": 278080,
      "payment_status": "paid",
      "status": "shipped",
      "tracking_number": "BD123456789"
    }
  ],
  "meta": { ... }
}
```

**Order statuses:** `draft` | `pending` | `confirmed` | `processing` | `shipped` | `delivered` | `cancelled` | `returned`

**Payment statuses:** `due` | `partial` | `paid`

**Use case:** "My Orders" page in customer dashboard.

---

#### `GET /customer/orders/{id}`

Returns full order detail including line items and payment history.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Order ID |

**Success Response `200`:**
```json
{
  "data": {
    "id": 1001,
    "invoice_number": "INV-2024-1001",
    "date": "2024-12-01",
    "shipping_address": {
      "address": "456 New Road",
      "city": "Dhaka",
      "country": "Bangladesh"
    },
    "payment_method": "Cash on Delivery",
    "sub_total": 278000,
    "shipping_cost": 80,
    "net_total": 278080,
    "payment_status": "paid",
    "status": "shipped",
    "tracking_number": "BD123456789",
    "estimated_delivery_date": "2024-12-05",
    "items": [
      {
        "id": 2001,
        "product_name": "iPhone 15 Pro",
        "sku": "APL-IP15P-128",
        "quantity": 2,
        "price": 139000,
        "sub_total": 278000
      }
    ]
  }
}
```

**Errors:** `404` if order doesn't belong to the customer.

**Use case:** Order detail / tracking page.

---

### 4.10 Payments

#### `POST /orders/{id}/pay`

Initiates a payment for an order via a payment gateway.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Order ID |

**Request Body:**
```json
{
  "gateway": "sslcommerz",
  "currency": "BDT"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `gateway` | string | Yes | `sslcommerz`, `stripe` |
| `currency` | string | No | 3-char ISO code (e.g., `BDT`, `USD`) |

**Success Response `200`:** Gateway-specific initiation data (redirect URL for SSLCommerz, client secret for Stripe).

**SSLCommerz example:**
```json
{
  "gateway_url": "https://sandbox.sslcommerz.com/EasyCheckOut/testcdnpay/..."
}
```

**Errors:** `422` — order already paid or no outstanding balance.

**Use case:** Redirect customer to payment gateway after order is placed.

---

#### `POST /payment/{gateway}/verify`

Verifies a payment callback from the gateway after the customer returns from payment.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Path Parameters:**

| Param | Type | Values |
|-------|------|--------|
| `gateway` | string | `sslcommerz`, `stripe` |

**Request Body (SSLCommerz):**
```json
{
  "val_id": "24C08151513535810610733",
  "value_a": "1001"
}
```

**Request Body (Stripe):**
```json
{
  "payment_intent_id": "pi_3OhKs3...",
  "sale_id": 1001
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Payment verified successfully.",
  "transaction_id": "TXN20241201001",
  "order_id": 1001
}
```

**Errors:** `422` — payment verification failed.

**Use case:** Call this when the customer returns from the payment gateway. Show success/failure screen based on `success` flag.

---

#### `POST /payment/sslcommerz/ipn`

SSLCommerz Instant Payment Notification (IPN) webhook. Called by SSLCommerz servers — **do not call this from frontend code**.

**No authentication required.** SSLCommerz calls this endpoint directly.

> **Note:** This endpoint always returns `200`. Implement SSLCommerz's own IPN verification on the server side (already handled by the backend).

---

### 4.11 Coupons

#### `POST /coupons/validate`

Validates a coupon code and calculates the discount amount.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "SAVE10",
  "order_total": 278000
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `code` | string | Yes | — |
| `order_total` | numeric | Yes | >= 0 |

**Success Response `200`:**
```json
{
  "valid": true,
  "code": "SAVE10",
  "discount_type": "percentage",
  "discount_value": 10,
  "discount_amount": 27800,
  "final_total": 250200
}
```

**Errors:** `422` — invalid, expired, or usage limit exceeded.

**Use case:** Coupon input field on checkout page. Show live discount preview before submitting the order.

> **Tip:** Call this on coupon field blur/submit, not on every keystroke.

---

### 4.12 Returns & Refunds (Protected)

Requires `Authorization: Bearer {{customer_token}}`. Orders must be in `shipped` or `delivered` status to be eligible for return.

#### `GET /customer/returns`

Lists all return requests for the authenticated customer.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 5,
      "order_id": 1001,
      "reason": "Product arrived damaged.",
      "status": "pending",
      "created_at": "2024-12-10T09:00:00Z",
      "items": [ ... ]
    }
  ]
}
```

**Return statuses:** `pending` | `approved` | `rejected` | `cancelled`

---

#### `POST /customer/returns`

Submits a new return request.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_id": 1001,
  "reason": "Product arrived damaged and doesn't match description.",
  "items": [
    {
      "sale_detail_id": 2001,
      "quantity": 1
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `order_id` | integer | Yes | Order must be shipped/delivered |
| `reason` | string | Yes | max 1000 |
| `items` | array | Yes | min 1 item |
| `items[].sale_detail_id` | integer | Yes | From `GET /customer/orders/{id}` → `items[].id` |
| `items[].quantity` | integer | Yes | min 1 |

**Success Response `201`:**
```json
{
  "message": "Return request submitted successfully.",
  "data": {
    "id": 5,
    "status": "pending"
  }
}
```

**Errors:** `422` — order not in returnable status, or pending return already exists for this order.

---

#### `GET /customer/returns/{id}`

Returns details of a specific return request.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

---

#### `PATCH /customer/returns/{id}/cancel`

Cancels a pending return request.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "message": "Return request cancelled."
}
```

**Errors:** `422` if not in `pending` status.

---

### 4.13 Wishlist (Protected)

Requires `Authorization: Bearer {{customer_token}}`.

#### `GET /customer/wishlist`

Returns the customer's wishlisted products.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 12,
      "product_id": 42,
      "product_name": "iPhone 15 Pro",
      "product_slug": "iphone-15-pro",
      "product_image": "https://..."
    }
  ]
}
```

---

#### `POST /customer/wishlist`

Adds a product to the wishlist.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "product_slug": "iphone-15-pro"
}
```

**Success Response `201` (added) or `200` (already in wishlist):**
```json
{
  "message": "Added to wishlist.",
  "data": {
    "id": 12,
    "product_id": 42,
    "product_name": "iPhone 15 Pro",
    "product_slug": "iphone-15-pro"
  }
}
```

**Errors:** `404` — product not found.

> **Tip:** Check the HTTP status code — `201` means newly added, `200` means it was already there.

---

#### `DELETE /customer/wishlist/{id}`

Removes an item from the wishlist.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Wishlist item ID (from `GET /customer/wishlist` → `data[].id`) |

**Success Response `200`:**
```json
{
  "message": "Removed from wishlist."
}
```

---

### 4.14 Loyalty Points (Protected)

#### `GET /customer/loyalty`

Returns the customer's loyalty point balance and transaction history.

**Headers:**
```
X-Api-Key: {{public_key}}
Authorization: Bearer {{customer_token}}
```

**Success Response `200`:**
```json
{
  "data": {
    "balance": 250,
    "point_value": 1.0,
    "min_redeem": 100,
    "can_redeem": true,
    "transactions": [
      {
        "id": 1,
        "type": "earn",
        "points": 50,
        "description": "Order #INV-2024-1001",
        "created_at": "2024-12-01T14:30:00Z"
      }
    ]
  }
}
```

**Errors:** `404` if loyalty system is disabled for the store.

**Use case:** Loyalty points widget in customer dashboard.

> **Tip:** Show points earned badge on order confirmation page using `points_earned` from order creation response.

---

### 4.15 Checkout Support

#### `GET /delivery-charges`

Returns available delivery/shipping options with their costs.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Standard Delivery",
      "cost": 80,
      "estimated_days": "3-5 business days"
    },
    {
      "id": 2,
      "name": "Express Delivery",
      "cost": 150,
      "estimated_days": "1-2 business days"
    }
  ]
}
```

**Use case:** Shipping method selector on checkout page.

---

#### `GET /payment-methods`

Returns active payment methods available for checkout.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cash on Delivery",
      "icon": null
    },
    {
      "id": 2,
      "name": "bKash",
      "icon": "https://your-store.com/storage/payment/bkash.png"
    }
  ]
}
```

**Use case:** Payment method selector on checkout page. Use `name` as the `payment_method` value in `POST /orders`.

---

### 4.16 Banners & Visual Content

All banner endpoints return active items ordered by `sort_order`.

#### `GET /hero-banners`

Full-width hero banners for the homepage.

```json
{
  "data": [
    {
      "id": 1,
      "title": "New Season Sale",
      "subtitle": "Up to 50% off",
      "image": "https://...",
      "link": "https://your-store.com/sale",
      "sort_order": 1
    }
  ]
}
```

#### `GET /sliders`

Carousel/slider items.

#### `GET /gallery`

Gallery/lookbook images.

#### `GET /popups`

Active popup modals (e.g., newsletter subscribe prompts). Only returns popups within their active date range.

**Headers for all:** `X-Api-Key: {{public_key}}`

**Use case:** Load all four on app startup. Show popups on first visit using a `localStorage` flag to avoid showing repeatedly.

---

### 4.17 Homepage Categories

#### `GET /homepage-categories`

Returns categories configured to appear on the homepage with their display settings.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `lang` | string | Language code |

**Use case:** Homepage "Shop by Category" section grid.

---

### 4.18 Store Content Pages

#### `GET /faqs`

Returns active FAQ items.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by FAQ category name |

**Use case:** FAQ accordion on help/support page.

---

#### `GET /outlets`

Returns active physical store/outlet locations.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Dhaka Main Branch",
      "address": "123 Gulshan Ave, Dhaka",
      "phone": "+8802123456789",
      "email": "dhaka@mystore.com",
      "map_link": "https://maps.google.com/?q=..."
    }
  ]
}
```

**Use case:** Store locator / contact page.

---

#### `GET /pages`

Returns a list of all active static pages (title + slug only).

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Use case:** Build navigation links for About Us, Privacy Policy, Terms, etc.

---

#### `GET /pages/{slug}`

Returns the full content of a static page.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": {
    "id": 3,
    "title": "Privacy Policy",
    "slug": "privacy-policy",
    "content": "<p>Full HTML content...</p>",
    "meta_title": "Privacy Policy — My Store",
    "meta_description": "..."
  }
}
```

**Errors:** `404` if page not found.

---

### 4.19 Support Tickets

#### `GET /support-ticket-types`

Returns available ticket category types for dropdown options.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Use case:** Populate the "Issue Type" dropdown on the support form.

---

#### `POST /support-tickets`

Submits a new support ticket.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "type_id": 2,
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "customer_phone": "+8801711223344",
  "subject": "Order not received",
  "message": "I placed order #INV-2024-1001 5 days ago but haven't received it yet.",
  "priority": "high"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `type_id` | integer | No | From `GET /support-ticket-types` |
| `customer_name` | string | Yes | max 255 |
| `customer_email` | email | No | — |
| `customer_phone` | string | No | max 50 |
| `subject` | string | Yes | max 255 |
| `message` | string | Yes | — |
| `priority` | string | No | `low`, `medium`, `high`, `urgent` (default: `medium`) |

**Success Response `201`:**
```json
{
  "message": "Support ticket submitted successfully.",
  "data": {
    "id": 88,
    "ticket_no": "TKT-2024-0088",
    "status": "open",
    "priority": "high"
  }
}
```

**Use case:** Contact / support form. Show `ticket_no` to customer for follow-up.

---

### 4.20 Contact & Newsletter

#### `POST /contact`

Submits a contact form message.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "phone": "+8801700001111",
  "subject": "Bulk Order Inquiry",
  "message": "I'd like to discuss a bulk order for our company."
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `email` | email | No |
| `phone` | string | No |
| `subject` | string | No |
| `message` | string | Yes |

**Success Response `201`:**
```json
{
  "message": "Your message has been sent successfully."
}
```

---

#### `POST /newsletter/subscribe`

Subscribes an email to the newsletter.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "subscriber@example.com",
  "name": "Newsletter Fan"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | email | Yes |
| `name` | string | No |

**Success Response `201`:**
```json
{
  "message": "Subscribed successfully."
}
```

> **Note:** Resubscribing a previously unsubscribed email reactivates it — no error is thrown.

---

### 4.21 Appointments

#### `GET /appointment-info`

Returns appointment availability settings (business hours, off-days, booking lead time).

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": {
    "title": "Book a Consultation",
    "description": "Meet with our experts.",
    "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "start_time": "09:00",
    "end_time": "17:00",
    "off_days": ["2024-12-25", "2024-12-26"]
  }
}
```

**Errors:** `404` if appointment booking is disabled.

**Use case:** Render the booking calendar, disabling off-days and non-working-day dates.

---

#### `POST /appointments`

Books an appointment.

**Headers:**
```
X-Api-Key: {{secret_key}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_name": "Sara Ahmed",
  "customer_email": "sara@example.com",
  "customer_phone": "+8801700002222",
  "service": "Product Consultation",
  "appointment_date": "2024-12-15",
  "appointment_time": "10:30",
  "notes": "Interested in bulk purchase options."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `customer_name` | string | Yes | max 255 |
| `customer_email` | email | No | — |
| `customer_phone` | string | Yes | max 50 |
| `service` | string | No | — |
| `appointment_date` | date | Yes | today or future (`YYYY-MM-DD`) |
| `appointment_time` | time | Yes | `HH:MM` format |
| `notes` | string | No | max 1000 |

**Success Response `201`:**
```json
{
  "message": "Appointment booked successfully.",
  "data": {
    "id": 15,
    "customer_name": "Sara Ahmed",
    "appointment_date": "2024-12-15",
    "appointment_time": "10:30",
    "status": "pending"
  }
}
```

---

### 4.22 Translations

#### `GET /translations`

Returns all UI string translations for a given language.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lang` | string | Yes | Language code (e.g., `bn`, `en`) |

**Success Response `200`:**
```json
{
  "add_to_cart": "কার্টে যোগ করুন",
  "buy_now": "এখনই কিনুন",
  "out_of_stock": "স্টক শেষ"
}
```

**Use case:** Load translations once on app startup and use the key-value pairs to localize all UI text.

---

### 4.23 Blog

#### `GET /blog-categories`

Returns all active blog categories.

**Headers:**
```
X-Api-Key: {{public_key}}
```

---

#### `GET /blog-categories/{slug}`

Returns a single blog category.

**Errors:** `404` if not found.

---

#### `GET /blogs`

Returns published blog posts, paginated.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter by category slug |
| `tag` | string | — | Filter by tag |
| `per_page` | integer | `10` | Max 100 |
| `page` | integer | `1` | — |

**Success Response `200`:**
```json
{
  "data": [
    {
      "id": 7,
      "title": "Top 5 Phones of 2024",
      "slug": "top-5-phones-2024",
      "excerpt": "We compare the best smartphones...",
      "featured_image": "https://...",
      "published_at": "2024-11-20T08:00:00Z",
      "author": "Editor Team",
      "category": { "name": "Reviews", "slug": "reviews" },
      "tags": ["phones", "review", "2024"]
    }
  ],
  "meta": { ... }
}
```

---

#### `GET /blogs/{slug}`

Returns a single published blog post with full content.

**Headers:**
```
X-Api-Key: {{public_key}}
```

**Success Response `200`:**
```json
{
  "data": {
    "id": 7,
    "title": "Top 5 Phones of 2024",
    "slug": "top-5-phones-2024",
    "content": "<p>Full HTML blog post...</p>",
    "featured_image": "https://...",
    "published_at": "2024-11-20T08:00:00Z",
    "meta_title": "Top 5 Phones of 2024 — My Store Blog",
    "meta_description": "..."
  }
}
```

**Errors:** `404` if not published or not found.

---

## 5. Full Storefront Flow

Below is the recommended request sequence to build a complete ecommerce storefront.

### App Startup

```
GET /store                  → initialize branding, currency, feature flags
GET /translations?lang=en   → load UI strings
GET /categories             → build navigation menu
GET /hero-banners           → homepage hero carousel
GET /sliders                → homepage sliders
GET /popups                 → check for active popups
GET /homepage-categories    → "Shop by Category" section
GET /featured-products      → homepage featured grid
GET /flash-sales            → active sale banner
GET /new-arrivals           → new arrivals section
GET /top-selling            → best sellers section
```

### Product Listing Page

```
GET /products?category=electronics&page=1&per_page=24
GET /categories/electronics   → page banner + subcategory filters
GET /brands                   → brand filter sidebar
```

### Product Detail Page

```
GET /products/{slug}          → full product data, barcodes, images
GET /products/{slug}/reviews  → reviews tab
GET /products/{slug}/questions → Q&A tab
```

### Guest Checkout Flow

```
POST /cart/items              → add item (save cart_token)
GET  /cart                    → show cart sidebar
POST /coupons/validate        → coupon input
GET  /delivery-charges        → shipping options
GET  /payment-methods         → payment selector
POST /orders                  → place order (use sk_)
POST /orders/{id}/pay         → initiate payment
POST /payment/{gateway}/verify → verify after redirect
```

### Registered Customer Flow

```
POST /customer/login          → save customer_token
GET  /customer/me             → pre-fill checkout address
POST /cart/items              → add (with Bearer token)
GET  /customer/orders         → order history page
GET  /customer/orders/{id}    → order detail / tracking
POST /customer/wishlist       → add to wishlist
GET  /customer/loyalty        → loyalty dashboard
POST /customer/returns        → initiate return
```

---

## 6. Tips & Best Practices

1. **Never expose your secret key (`sk_`) in frontend/client-side JavaScript.** Use it only in server-side code or via a backend-for-frontend (BFF) proxy.

2. **Cache catalog data.** Products, categories, banners, and translations change infrequently. Cache these for 5–15 minutes using SWR, React Query, or similar libraries.

3. **Persist the cart token.** Store `X-Cart-Token` in `localStorage`. Clear it only after a successful order or explicit logout.

4. **Always validate coupon before placing order.** `POST /coupons/validate` gives you live discount preview without side effects.

5. **Use `barcode_id`, not `product_id`.** All cart and order operations use `barcode_id` — the variant-level identifier that carries price and stock.

6. **Handle 422 errors gracefully.** Out-of-stock and validation failures both return 422. Check `errors` or `error` fields for user-facing messages.

7. **Multi-language:** Always pass `?lang=<code>` on catalog endpoints if your storefront supports multiple languages. Load translations once and cache.

8. **Guest-to-customer cart merge:** Send both `X-Cart-Token` and `Authorization: Bearer` headers on the first cart call after login to transfer guest cart items to the customer account.

9. **Check `features` flags from `GET /store`** before rendering wishlist, loyalty, reviews, appointments, or blog sections to avoid empty pages.

10. **Polling for flash sale countdown:** Flash sales have an `ends_at` timestamp — run a `setInterval` client-side and re-fetch products only when the sale expires, not on every tick.
