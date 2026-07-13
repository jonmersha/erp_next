# API Documentation

This document describes the API endpoints and operational flows for the planning and inventory management systems.

---

## 1. Procurement Planning
**Purpose**: Management of procurement plans for raw materials, helping in forecasting and scheduling material acquisitions.

### Key API Endpoints
*   `GET /api/procurement/plans`: Retrieve all procurement plans.
*   `POST /api/procurement/plans`: Create a new procurement plan.
*   `PUT /api/procurement/plans/:id`: Update an existing procurement plan.
*   `DELETE /api/procurement/plans/:id`: Delete a specific procurement plan.

### Operational Flow
1.  **Create**: A plan is initialized with factory, warehouse, material, and quarterly breakdown.
2.  **Monitor**: Procurement plans are monitored to manage material availability.
3.  **Update**: Adjust quantities or status based on real-time needs.

---

## 2. Sales Planning
**Purpose**: Forecasting and managing sales targets and activities.

### Key API Endpoints
*   `GET /api/sales/plans`: Retrieve all sales plans.
*   `POST /api/sales/plans`: Create a new sales plan.
*   `PUT /api/sales/plans/:id`: Update an existing sales plan.
*   `DELETE /api/sales/plans/:id`: Delete a specific sales plan.

### Operational Flow
1.  **Forecasting**: Sales teams create plans by product per year/quarter.
2.  **Planning**: Plans translate into sales orders.
3.  **Adjustment**: Continuous updates based on market performance.

---

## 3. Production Planning
**Purpose**: Scheduling production activities to meet demand.

### Key API Endpoints
*   `GET /api/production-plans`: Retrieve all production plans.

### Operational Flow
1.  **Production Scheduling**: Define the plan for product quantities to be manufactured in a specific factory within a period.

---

## 4. Inventory Management
**Purpose**: Real-time tracking of raw materials and finished goods in warehouses.

### Key API Endpoints
*   `GET /api/inventory`: Retrieve full inventory list.
*   `POST /api/inventory`: Add a new unit to inventory.
*   `PUT /api/inventory/:id`: Update inventory unit (e.g., quantity adjustment).
*   `DELETE /api/inventory/:id`: Remove item from inventory.

### Operational Flow
1.  **Inbound**: Items added via `POST /api/inventory` upon receiving goods.
2.  **Tracking**: Stock levels maintained via `PUT` and `GET` requests.
3.  **Outbound**: Items removed via `DELETE` (consumable) or updated with reduced quantity.

---

## 5. Operations Lifecycle
**Purpose**: Coordinating the flow of materials through procurement, production, quality control, and final delivery.

### Operational Workflow
1.  **Procurement**: Raw materials are acquired based on **Procurement Plans** and ordered via **Purchase Orders**.
2.  **Receipt (GRN)**: Arriving goods are inspected and recorded as **Goods Receipt Notes (GRN)** before entering **Inventory**.
3.  **Production**: Materials are consumed from **Inventory** according to **Recipes** and **Production Plans**, creating finished products.
4.  **Quality Assurance**: Finished products or raw materials undergo **Quality Inspections**.
5.  **Sales & Delivery**: Products are linked to **Sales Orders** based on **Sales Plans** and dispatched with **Delivery Notes**.
