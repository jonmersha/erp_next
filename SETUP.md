# Local Setup & SQL Migration Guide

This guide describes how to run the ERP system locally and migrate from Firebase to a SQL database (MySQL/PostgreSQL/SQLite).

## 1. System Architecture
The application uses a **Decoupled Architecture**:
- **Frontend**: React (Vite) + Tailwind CSS.
- **Service Layer**: `apiService.ts` handles the logic to switch between Firebase (direct) and SQL (via Proxy).
- **Backend**: Express.js server that acts as a proxy for SQL operations.
- **Storage Adapter**: The `dbFactory.ts` identifies the active backend and uses the appropriate database driver.

## 2. Local Setup Steps

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Active instance or Docker container)

### Step-by-Step Installation
1. **Clone the repository**.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   - Create a `.env` file and populate it with your PostgreSQL credentials:
     - `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT`.
4. **Initialize Database**:
   - Run the provided `database_setup.sql` script on your PostgreSQL server to create the relational structure.
   - The application will also automatically create storage tables (JSONB based) if they are missing during operation.
5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
6. **Switch to SQL Mode**:
   - Go to the **Admin Panel** (`/admin`).
   - Switch "Storage Infrastructure" to **SQL**.

## 3. Data Migration (Firebase -> SQL)

To transfer data from your current Firebase instance to SQL, follow these steps:

### Phase A: Exporting from Firebase
You can use a simple node script (using `firebase-admin`) to fetch all collections.
1. Run `npx -p node-firestore-import-export firestore-export -a YOUR_SERVICE_ACCOUNT.json -b backup.json`
   *(Or use the script below).*

### Phase B: Import Script (Simplified)
You can use the built-in storage service to seed your SQL database from a JSON dump.

```typescript
// migration_script.ts example
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SQLStorage } from './server/services/dbFactory';

async function migrate() {
  const sql = new SQLStorage();
  const db = getFirestore();
  const collections = ['companies', 'users', 'products', 'inventory'];

  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    for (const doc of snapshot.docs) {
      await sql.create(col, { id: doc.id, ...doc.data() });
      console.log(`Migrated ${col}: ${doc.id}`);
    }
  }
}
```

## 4. SQL Schema
The complete schema including tables for Inventory, Production, and Finance can be found in:
- `database_setup.sql` (Full relational schema)
- `database_schema.sql` (Basic flat schema)

## 5. Deployment
When deploying to production:
1. Ensure `app-config.json` has `activeBackend: "sql"`.
2. Configure your DB connection strings in environment variables.
3. The Express server will handle all frontend requests through the proxy.
