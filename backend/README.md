# Kabadiwala Connect — Backend REST API

> **Bringing the Informal Collector into the Formal Recycling Chain**  
> Unified production-structured REST API backend supporting both the **Collector Mobile App (React Native/Expo)** and the **Recycler Web Dashboard (React)**.

---

## 1. Project Overview

**Kabadiwala Connect** formalizes informal waste pickers (Kabadiwalas) by connecting them directly with authorized e-waste and scrap recyclers:
* Collectors create scrap material lots, upload photographs, get instant market price valuations, and locate nearby verified recyclers.
* Recyclers bid transparent quotes on incoming scrap lots.
* When a quote is accepted, a trackable transaction is initialized.
* On physical handover, digital scale readings, geo-coordinates, timestamps, and photos are permanently recorded to generate a tamper-evident **Traceability Record (WHO, WHAT, HOW MUCH, WHEN, WHERE, TO WHOM, FOR HOW MUCH)**.
* Multi-lingual safety advisories (Hindi, Marathi, English) protect informal waste pickers from hazardous handling (e.g., CRT implosions, battery fires, acid leaching).

---

## 2. Tech Stack

* **Runtime:** Node.js (v22.x)
* **Framework:** Express.js (v4.x)
* **Database:** MongoDB with Mongoose ODM (v8.x)
* **Authentication:** JWT (JSON Web Tokens) & bcryptjs for password hashing
* **File Uploads:** Multer with Cloudinary CDN integration and local disk fallback
* **Security & Performance:** Helmet, CORS, Morgan, Express Rate Limit
* **Validation:** Express-Validator

---

## 3. Architecture & Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   ├── cloudinary.js        # Cloudinary setup & fallback check
│   │   └── env.js               # Centralized environment variables
│   ├── models/
│   │   ├── User.js              # User schema (Collector, Recycler, Admin)
│   │   ├── MaterialLot.js       # Scrap material lot schema
│   │   ├── Price.js             # Active & historical price benchmark records
│   │   ├── Recycler.js          # Recycler facility, credentials & coordinates
│   │   ├── Transaction.js       # Transaction lifecycle & bidding schema
│   │   ├── Traceability.js      # Tamper-evident handover & chain-of-custody
│   │   └── SafetyGuide.js       # Multilingual safety records
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── materialLot.controller.js
│   │   ├── price.controller.js
│   │   ├── recycler.controller.js
│   │   ├── transaction.controller.js
│   │   ├── traceability.controller.js
│   │   └── safety.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── price.service.js
│   │   ├── recycler.service.js   # Deterministic scoring algorithm
│   │   ├── valuation.service.js  # MVP scrap lot price valuation engine
│   │   ├── transaction.service.js
│   │   ├── traceability.service.js
│   │   └── image.service.js     # Cloudinary / local file handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── materialLot.routes.js
│   │   ├── price.routes.js
│   │   ├── recycler.routes.js
│   │   ├── transaction.routes.js
│   │   ├── quote.routes.js
│   │   ├── traceability.routes.js


---

## 4. Installation & Setup

### Prerequisites
* Node.js >= 18
* MongoDB running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 3: Run Database Seeds
Populates default users, verified recyclers, price history, and multilingual safety guides:
```bash
npm run seed
```

### Step 4: Start Server
```bash
# Development with nodemon
npm run dev

# Production
npm start
```

---

## 5. Seed Accounts & Credentials

| Role | Name | Phone | Password | Details |
|---|---|---|---|---|
| **ADMIN** | Admin Supervisor | `+919999900001` | `Password@123` | Full platform management |
| **COLLECTOR** | Ramesh Kumar | `+919876543210` | `Password@123` | Dharavi, Mumbai (Hindi) |
| **COLLECTOR** | Suresh Patil | `+919876543211` | `Password@123` | Kurla, Mumbai (Marathi) |
| **RECYCLER** | EcoGreen E-Waste | `+919820011111` | `Password@123` | Turbhe MIDC, Navi Mumbai |
| **RECYCLER** | Apex Metal & Battery | `+919820022222` | `Password@123` | Kalyan Industrial, Thane |
| **RECYCLER** | Maharshi Circular | `+919820033333` | `Password@123` | Bhiwandi Logistics Hub |

---

## 6. API Overview

All routes are prefixed with `/api/v1`.

### Health Check
* `GET /api/v1/health`

### Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/register` — Register as COLLECTOR or RECYCLER
* `POST /api/v1/auth/login` — Phone & password authentication
* `GET /api/v1/auth/me` — Authenticated user & recycler profile

### Material Lots (`/api/v1/lots`)
* `POST /api/v1/lots` — Create lot with images, condition, location, & valuation
* `GET /api/v1/lots/my` — View current collector's lots
* `GET /api/v1/lots/open` — View open lots available for recyclers
* `GET /api/v1/lots/:lotId` — Get lot details
* `PATCH /api/v1/lots/:lotId` — Update lot
* `DELETE /api/v1/lots/:lotId` — Cancel lot

### Pricing (`/api/v1/prices`)
* `GET /api/v1/prices` — List price benchmarks
* `GET /api/v1/prices/current` — Current active buying/selling prices
* `GET /api/v1/prices/history` — Historical price timeline
* `GET /api/v1/prices/:materialCategory` — Active price by category
* `POST /api/v1/prices` — Admin create/update price benchmarks

### Recyclers & Matching (`/api/v1/recyclers`)
* `GET /api/v1/recyclers` — List verified recyclers
* `GET /api/v1/recyclers/nearby?lat=19.04&lng=72.85&category=PCB&radius=50` — Deterministic matching with distance and score calculation
* `GET /api/v1/recyclers/:recyclerId` — Recycler details
* `PATCH /api/v1/recyclers/profile` — Recycler updates own operating profile
* `PATCH /api/v1/recyclers/:recyclerId/verify` — Admin verifies recycler

### Quotes & Transactions (`/api/v1/lots`, `/api/v1/quotes`, `/api/v1/transactions`)
* `POST /api/v1/lots/:lotId/quote` — Recycler submits price quote
* `GET /api/v1/lots/:lotId/quotes` — Collector views incoming quotes
* `PATCH /api/v1/quotes/:quoteId` — Collector accepts or rejects quote
* `GET /api/v1/transactions/my` — List user's transactions
* `GET /api/v1/transactions/:transactionId` — Transaction details
* `PATCH /api/v1/transactions/:transactionId/status` — Validated status transitions
* `PATCH /api/v1/transactions/:transactionId/payment` — Update payment status & method

### Handover & Traceability (`/api/v1/transactions`, `/api/v1/traceability`)
* `POST /api/v1/transactions/:transactionId/handover` — Finalize handover, record GPS, weight, photos, and generate unique handover reference `KCH-YYYY-XXXXXX`
* `GET /api/v1/traceability/:lotId` — View tamper-evident chain of custody
* `GET /api/v1/traceability/verify/:reference` — Public certificate verification

### Collector Earnings (`/api/v1/users`)
* `GET /api/v1/users/me/earnings` — Total earned, pending payments, completed count

### Safety Advisories (`/api/v1/safety`)
* `GET /api/v1/safety?language=HI` — Hindi advisories
* `GET /api/v1/safety?language=MR` — Marathi advisories
* `GET /api/v1/safety?language=EN` — English advisories
* `GET /api/v1/safety/:category` — Filter by category

---

## 7. Business Rules Implemented

* **Rule 1:** Collectors only access their own lots, transactions, earnings, and traceability records.
* **Rule 2:** Recyclers only access their own profiles and transactions.
* **Rule 3:** Only `VERIFIED` recyclers appear in collector matching and recommendations.
* **Rule 4:** Collectors cannot accept quotes belonging to another collector's lots.
* **Rule 5:** Recyclers cannot modify another recycler's quote.
* **Rule 6:** Completed transactions cannot be modified.
* **Rule 7:** Historical prices are permanently preserved; new prices supersede with valid time ranges.
* **Rule 8:** Every completed handover receives a unique handover reference (`KCH-YYYY-XXXXXX`).
* **Rule 9:** Every transaction strictly links collector, lot, and recycler.
* **Rule 10:** No negative weights or negative prices are permitted.

│   │   └── safety.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── role.middleware.js   # RBAC (COLLECTOR, RECYCLER, ADMIN)
│   │   ├── upload.middleware.js # Multer file validation
│   │   ├── error.middleware.js  # Centralized error handler
│   │   └── notFound.middleware.js
│   ├── validators/              # Express-validator schemas
│   ├── utils/                   # Constants, IDs, async handler, responses
│   ├── seeds/                   # Complete pre-configured database seeds
│   ├── app.js                   # Express app setup & middleware pipeline
│   └── server.js                # Server entry point
├── uploads/                     # Local file storage
├── postman/                     # Postman collection
├── .env.example
├── package.json
└── README.md
```
