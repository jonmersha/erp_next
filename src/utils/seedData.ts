import { apiService } from '../services/apiService';
import { fetchCollection } from './firestore';

export const seedDatabase = async (companyId: string) => {
  try {
    // Check if already seeded for this company
    const factoriesSnap = await fetchCollection('factories', companyId, { limitCount: 1 });
    if (factoriesSnap.length > 0) return;

    console.log(`Seeding database for company ${companyId}...`);

    const cId = { companyId };

    // 1. Factories
    const factoryA = await apiService.addDocument('factories', { ...cId, name: 'Addis Flour Mill', location: 'Addis Ababa' });
    const factoryB = await apiService.addDocument('factories', { ...cId, name: 'Bishoftu Oil Refinery', location: 'Bishoftu' });

    // 2. Warehouses
    const wh1 = await apiService.addDocument('warehouses', { ...cId, name: 'Main Raw Material WH', location: 'Addis Ababa', factoryId: factoryA.id });
    const wh2 = await apiService.addDocument('warehouses', { ...cId, name: 'Finished Goods WH', location: 'Addis Ababa', factoryId: factoryA.id });

    // 3. Outlets
    const outlet1 = await apiService.addDocument('outlets', { ...cId, name: 'Merkato Distribution Center', location: 'Addis Ababa' });
    const outlet2 = await apiService.addDocument('outlets', { ...cId, name: 'Bole Retail Outlet', location: 'Addis Ababa' });

    // 4. Suppliers
    const supplier1 = await apiService.addDocument('suppliers', { ...cId, name: 'Global Grain Traders', contact: '+251 911 000000', email: 'info@globalgrain.com' });

    // 5. Raw Materials
    const wheat = await apiService.addDocument('rawMaterials', { ...cId, name: 'Hard Red Wheat', unit: 'bag' });
    const maize = await apiService.addDocument('rawMaterials', { ...cId, name: 'White Maize', unit: 'bag' });

    // 6. Products
    const flour25 = await apiService.addDocument('products', { ...cId, name: 'Premium Flour', category: 'Flour', packageSize: '25kg', unit: 'bag', price: 45 });
    const oil5 = await apiService.addDocument('products', { ...cId, name: 'Pure Sunflower Oil', category: 'Oil', packageSize: '5L', unit: 'bottle', price: 12 });

    // 7. Inventory
    await apiService.addDocument('inventory', { ...cId, unitId: wh1.id, itemId: wheat.id, itemType: 'raw', quantity: 5000, batchNumber: 'W-2024-001' });
    await apiService.addDocument('inventory', { ...cId, unitId: wh2.id, itemId: flour25.id, itemType: 'product', quantity: 1200, batchNumber: 'F-2024-050' });
    await apiService.addDocument('inventory', { ...cId, unitId: wh2.id, itemId: oil5.id, itemType: 'product', quantity: 500, batchNumber: 'O-2024-001' });

    // 8. Purchase Orders
    await apiService.addDocument('purchaseOrders', { ...cId, supplierId: supplier1.id, factoryId: factoryA.id, status: 'approved', totalAmount: 25000, createdAt: new Date().toISOString() });

    // 9. Production Runs
    await apiService.addDocument('productionRuns', { ...cId, factoryId: factoryA.id, productId: flour25.id, quantity: 2000, status: 'in_progress', startDate: new Date().toISOString() });

    // 10. Sales Orders
    await apiService.addDocument('salesOrders', { ...cId, outletId: outlet1.id, status: 'paid', totalAmount: 1500, createdAt: new Date().toISOString() });

    // 11. Employees
    await apiService.addDocument('employees', { ...cId, name: 'Abebe Kebede', email: 'abebe@cibus.com', department: 'Production', role: 'Machine Operator', salary: 1200, factoryId: factoryA.id, hireDate: '2023-01-15' });
    await apiService.addDocument('employees', { ...cId, name: 'Sara Tadesse', email: 'sara@cibus.com', department: 'Finance', role: 'Accountant', salary: 1800, hireDate: '2023-05-20' });

    console.log(`Seeding complete for company ${companyId}!`);
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
