# Sheger ERP - Technical Documentation

This document serves as a comprehensive guide for developers to understand the architecture, maintain features, and deploy the Sheger ERP system to production environments.

## 1. Architecture Overview

The application is built using a modern decoupled architecture:

*   **Frontend:** Next.js (React), Tailwind CSS, Framer Motion (for animations), Lucide React (icons), and Recharts (for dashboards). It utilizes both App Router and Page components.
*   **Backend:** Express.js (Node.js REST API).
*   **Database:** MySQL (relational database).
*   **Authentication:** Firebase Authentication is used exclusively as an Identity Provider (IdP). All business and user data is stored in MySQL.

### Data Flow
1. User logs in via Firebase Google Auth.
2. The frontend fetches the user's `uid` and requests the profile/company data from the Express backend via `apiService`.
3. The Express backend queries MySQL and returns the JSON payload.
4. Next.js `next.config.js` is configured to proxy all `/api/*` frontend requests to the backend (`http://localhost:5001/api/*`).

---

## 2. Project Structure

```text
ERP/
├── src/
│   ├── app/                # Next.js App Router (Layouts and Pages)
│   ├── components/         # Reusable React components (e.g., Sidebar, Layout)
│   ├── context/            # React Contexts (AuthContext for global auth state)
│   ├── pages/              # Main UI views (Dashboard, Admin, HR, Finance, etc.)
│   ├── services/           # API integration (apiService.ts, companyService.ts)
│   ├── types.ts            # TypeScript interfaces for database entities
│   └── utils/              # Helper functions (seedData, firestore mock)
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic (e.g., user.controller.js)
│   │   └── routes/         # Express API routes (e.g., user.routes.js)
│   ├── db.js               # MySQL connection pool configuration
│   ├── server.js           # Express application entry point & router mounting
│   └── create_*.js         # Manual database migration/schema scripts
└── package.json            # Frontend dependencies
```

---

## 3. Developer Guide & Feature Maintenance

### How to Add a New Module (e.g., "Fleet Management")

Adding a new feature module requires changes in both the Backend and Frontend. Follow these steps:

#### Step 1: Backend Database & Route Setup
1. **Database Script:** Create a new migration script in the `backend/` folder (e.g., `create_fleet_table.js`). Define your `CREATE TABLE` schema. Ensure any `FOREIGN KEY` constraint names are globally unique across the whole database (e.g., `fk_fleet_company`). Run the script using `node backend/create_fleet_table.js`.
2. **Controller:** Create `backend/src/controllers/fleet.controller.js` and implement your CRUD operations using the `pool` from `db.js`.
3. **Route:** Create `backend/src/routes/fleet.routes.js`, import your controller functions, and attach them to the `express.Router()`.
4. **Register Route:** Open `backend/server.js` and mount the new route: 
   ```javascript
   import fleetRoutes from './src/routes/fleet.routes.js';
   apiRouter.use('/fleet', fleetRoutes);
   ```

#### Step 2: Frontend Integration
1. **Types:** Add the TypeScript interfaces for your new feature in `src/types.ts`.
2. **Service:** (Optional but recommended) Create a `fleetService.ts` in `src/services/` that utilizes `apiService.get()`, `apiService.post()`, etc.
3. **UI Page:** Create the main React component in `src/pages/Fleet.tsx`.
4. **App Route:** Create a Next.js route wrapper in `src/app/(app)/fleet/page.tsx` that imports and returns your `Fleet` page component.
5. **Sidebar Navigation:** Open `src/components/Layout.tsx` and add your new module to the `navItems` array so it appears in the sidebar.

---

## 4. Environment Setup (Local Development)

### Prerequisites
*   Node.js (v18+)
*   MySQL Server (v8+)

### Environment Variables
Create a `.env` file in the root directory (for Next.js) and in the `backend/` directory (for Express).

**Frontend (`.env.local`)**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

**Backend (`backend/.env`)**
```env
DB_HOST=localhost
DB_USER=erpuser
DB_PASSWORD=your_password
DB_NAME=erpsystem
PORT=5001
```

### Running the App
1. **Start the Backend:**
   ```bash
   cd backend
   npm install
   npm run dev # Runs nodemon server.js
   ```
2. **Start the Frontend:**
   ```bash
   cd ..
   npm install
   npm run dev # Starts Next.js on port 3000
   ```

---

## 5. Deployment Guide (Production)

Deploying this decoupled architecture requires hosting the backend API, the frontend application, and the MySQL database.

### 5.1 Database Deployment (Cloud SQL / AWS RDS)
1. Provision a managed MySQL instance (e.g., Google Cloud SQL, AWS RDS, DigitalOcean Managed Databases).
2. Create the `erpsystem` database and an application user with restricted privileges.
3. Run all your `backend/create_*.js` scripts against the production database endpoint to initialize the schema.

### 5.2 Backend Deployment (Express.js)
You can deploy the Node.js backend using a VM with PM2, Docker, or a PaaS like Render, Heroku, or AWS Elastic Beanstalk.

**Example using PM2 on a Linux VPS:**
```bash
# SSH into your server, clone the repo, and navigate to the backend folder
npm install --production

# Set environment variables (or use a .env file)
export DB_HOST=production.db.url
export DB_USER=prod_user
export DB_PASSWORD=prod_secure_password
export DB_NAME=erpsystem
export PORT=5001

# Start the application using PM2
npm install -g pm2
pm2 start server.js --name "erp-backend"
pm2 save
pm2 startup
```

### 5.3 Frontend Deployment (Vercel)
Vercel is the optimal hosting platform for Next.js applications.

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project into Vercel.
3. **Configure Build Settings:**
   * **Framework Preset:** Next.js
   * **Root Directory:** `./` (or wherever your `package.json` resides).
4. **Environment Variables:**
   * Add all your Firebase `NEXT_PUBLIC_...` variables.
5. **API Proxying (Crucial Step):** 
   Since the production frontend cannot proxy to `localhost:5001`, you must update your `next.config.js` or `.env` configuration so that API requests are routed to your live backend domain (e.g., `https://api.yourdomain.com`).
   * *Example:* Modify the rewrite rule in `next.config.js` to use an environment variable `process.env.NEXT_PUBLIC_API_URL` instead of localhost.

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/:path*`, 
      },
    ]
  },
}
```

### 5.4 Firebase Configuration
1. Go to the Firebase Console -> Authentication -> Settings -> Authorized Domains.
2. Add your production frontend domain (e.g., `erp.yourdomain.com`) to the list to allow Google Sign-In popups to function in production.

---

## 6. Business Workflows

The ERP system encapsulates several core business processes. Below are the workflows for the primary modules to help developers understand the intended lifecycle of entities:

### 6.1 Procurement Workflow
The procurement process ensures materials are ordered and received correctly.
1. **Procurement Plan**: Create a quarterly/annual procurement plan for raw materials.
2. **Purchase Order (PO)**: Generate a PO selecting a Supplier, Factory, and Warehouse. (Status: `pending` -> `approved` -> `shipped`).
3. **Goods Receipt Note (GRN)**: When goods arrive, the warehouse manager creates a GRN linking to the PO.
4. **Inventory Update**: Saving the GRN automatically increments the stock in the specified warehouse.
5. **Quality Check (Optional)**: Received items can be flagged for inspection.

### 6.2 Production Workflow
The manufacturing process consumes raw materials and yields finished goods.
1. **Master Data Setup**: Ensure a `Product` and its `Recipe (BOM)` are defined.
2. **Production Plan**: Forecast production quotas.
3. **Production Run**: Initiate a run at a specific Factory.
4. **Material Consumption**: Raw materials listed in the BOM are deducted from the associated warehouse inventory.
5. **Yield Generation**: Once the run completes, finished goods inventory is increased by the `quantityProduced`.

### 6.3 Sales & Logistics Workflow
Fulfilling customer demand and dispatching products.
1. **Sales Plan**: Establish sales targets.
2. **Sales Order (SO)**: A customer places an order at an Outlet. (Status: `pending` -> `paid` -> `ready_to_ship`).
3. **Delivery Note / Shipment**: Logistics generates a Shipment and Delivery Note for the SO.
4. **Inventory Deduction**: Goods are deducted from the source warehouse/outlet.
5. **Invoicing**: Finance module tracks the invoice for the SO and monitors for incoming Payments.

### 6.4 Maintenance Workflow
Keeping factories and equipment operational.
1. **Equipment Registration**: Register machinery in Master Data.
2. **Maintenance Log**: Technicians log repairs or routine service, capturing the `cost`, `date`, and `technician`.
3. **Status Update**: The equipment's `status` and `nextMaintenanceDate` are updated to prevent scheduling bottlenecks.

### 6.5 Finance & Administration
1. **Financial Plans**: Set target revenues and expenses per quarter.
2. **Invoices & Payments**: Track all incoming and outgoing cash flow triggered by Procurement (expenses) and Sales (revenue).
3. **HR & Users**: Admin registers employees and assigns System Roles (e.g., `finance`, `store`, `sales`) to control UI and API access.

---

## 7. System Roles & Access Control

The ERP system relies on Role-Based Access Control (RBAC) to ensure users only interact with modules relevant to their department. The available system roles and their intended responsibilities are:

*   **`admin` (System Administrator)**
    *   **Access:** Global access to all modules, settings, and dashboards.
    *   **Responsibilities:** Can manage user identities, assign roles, configure root company details, and override configurations.
*   **`finance` (Finance & Accounting)**
    *   **Access:** Finance Module, Invoices, Payments, Financial Plans.
    *   **Responsibilities:** Responsible for reconciling accounts, logging outgoing payments for Procurement (POs), receiving payments for Sales (SOs), and managing quarterly budgets.
*   **`store` (Inventory & Warehouse Manager)**
    *   **Access:** Logistics, Inventory, Master Data.
    *   **Responsibilities:** Tracks physical stock levels across warehouses. Creates Goods Receipt Notes (GRN) when items arrive and generates Delivery Notes when items ship out.
*   **`procurement` (Procurement Officer)**
    *   **Access:** Procurement Module, Suppliers.
    *   **Responsibilities:** Creates Purchase Orders (POs) to buy raw materials from suppliers. Ensures the factory has enough materials before a production run starts.
*   **`sales` (Sales Representative)**
    *   **Access:** Sales Module, Customers, Outlets.
    *   **Responsibilities:** Generates Sales Orders (SOs), registers new clients, and sets sales targets.
*   **`factory_manager` (Production & Maintenance)**
    *   **Access:** Production Module, Maintenance Module, HR (view).
    *   **Responsibilities:** Sets up Recipes/BOMs, schedules Production Runs, consumes raw materials, and yields finished goods. Also logs machinery downtime and requests maintenance.
