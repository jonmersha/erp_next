import { useState, useEffect } from 'react';
import { Supplier, PurchaseOrder, RawMaterial, Factory, Warehouse } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useProcurementData = () => {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      const [suppliersData, ordersData, materialsData, factoriesData, warehousesData] = await Promise.all([
        fetchCollection('suppliers', companyId),
        fetchCollection('purchaseOrders', companyId, { orderByField: 'createdAt', orderDir: 'desc' }),
        fetchCollection('rawMaterials', companyId),
        fetchCollection('factories', companyId),
        fetchCollection('warehouses', companyId)
      ]);

      const enrichedOrders = (ordersData as any[]).map(order => {
        const supplier = (suppliersData as any[]).find(s => s.id === order.supplierId);
        return {
          ...order,
          supplierName: supplier?.name || order.supplierName || 'Unknown Supplier'
        };
      });

      if (Array.isArray(suppliersData)) setSuppliers(suppliersData as any);
      if (Array.isArray(ordersData)) setOrders(enrichedOrders);
      if (Array.isArray(materialsData)) setMaterials(materialsData as any);
      if (Array.isArray(factoriesData)) setFactories(factoriesData as any);
      if (Array.isArray(warehousesData)) setWarehouses(warehousesData as any);
    } catch (error) {
      console.error("Error fetching procurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  return {
    suppliers,
    orders,
    materials,
    factories,
    warehouses,
    loading,
    refreshData: fetchData
  };
};
