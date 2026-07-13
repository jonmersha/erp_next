# Deployment Guide: Sheger ERP Backend

This guide explains how to deploy the Sheger ERP backend to a standalone server (e.g., `m.besheger.com`) and configure it with a MySQL database.

## Prerequisites
- Node.js 18+
- MySQL 5.7+ or MariaDB 10.2+

## Database Setup
1. Copy the provided `schema.sql` to your server.
2. Run the schema script to create the database and tables:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Create a dedicated database user (recommended):
   ```sql
   CREATE USER 'erpuser'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON erpsystem.* TO 'erpuser'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Backend Configuration
1. Clone the repository or upload the `/server` directory and its dependencies.
2. Create a `.env` file in the root or `/server` directory:
   ```env
   NODE_ENV=production
   PORT=3000
   
   # Database Configuration
   MYSQL_HOST=localhost
   MYSQL_USER=erpuser
   MYSQL_PASSWORD=your_secure_password
   MYSQL_DATABASE=erpsystem
   MYSQL_PORT=3306
   
   # Optional: Unified Connection String
   # DATABASE_URL=mysql://erpuser:password@localhost:3306/erpsystem
   
   # Frontend Access
   ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3000
   ```
3. Update `app-config.json` to enable SQL mode:
   ```json
   {
     "activeBackend": "sql"
   }
   ```

## Installation & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm run start
   ```
   (Alternatively, use a process manager like **pm2**: `pm2 start server/index.ts --name erp-backend`)

## Data Relationships
The system uses a flexible Hybrid JSON-Relational model:
- **Tenancy**: Every record is linked via `companyId`.
- **References**: Relationships like `factoryId`, `productId`, and `outletId` are indexed for performance.
- **Flexibility**: Schema-less data is stored in the `data` JSON column, while core IDs are promoted to top-level columns for indexing and join support.
