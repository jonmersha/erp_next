import { useState, useEffect } from 'react';
import { InventoryItem, Factory, Warehouse, RawMaterial, Product, PurchaseOrder, SalesOrder, GRN, DeliveryNote } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useInventoryData = () => {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [pendingSOs, setPendingSOs] = useState<SalesOrder[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      
      const [
        invData, 
        factoriesData, 
        warehousesData, 
        materialsData, 
        productsData, 
        poData, 
        soData, 
        grnsData, 
        dnsData
      ] = await Promise.all([
        fetchCollection('inventory', companyId),
        fetchCollection('factories', companyId),
        fetchCollection('warehouses', companyId),
        fetchCollection('rawMaterials', companyId),
        fetchCollection('products', companyId),
        fetchCollection('purchaseOrders', companyId),
        fetchCollection('salesOrders', companyId),
        fetchCollection('grns', companyId),
        fetchCollection('deliveryNotes', companyId)
      ]);

      if (Array.isArray(invData)) setInventory(invData as any);
      if (Array.isArray(factoriesData)) setFactories(factoriesData as any);
      if (Array.isArray(warehousesData)) setWarehouses(warehousesData as any);
      if (Array.isArray(materialsData)) setMaterials(materialsData as any);
      if (Array.isArray(productsData)) setProducts(productsData as any);
      if (Array.isArray(poData)) {
        setPendingPOs(poData.filter((po: any) => ['approved', 'shipped'].includes(po.status)) as any);
      }
      if (Array.isArray(soData)) {
        setPendingSOs(soData.filter((so: any) => ['paid', 'ready_to_ship'].includes(so.status)) as any);
      }
      if (Array.isArray(grnsData)) setGrns(grnsData as any);
      if (Array.isArray(dnsData)) setDeliveryNotes(dnsData as any);

    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [profile?.companyId]);

  return {
    inventory,
    factories,
    warehouses,
    materials,
    products,
    pendingPOs,
    pendingSOs,
    grns,
    deliveryNotes,
    loading,
    refreshData: fetchData
  };
};
