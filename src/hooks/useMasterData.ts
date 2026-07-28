import { useState, useEffect } from 'react';
import { Factory, Warehouse, SalesOutlet, RawMaterial, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useMasterData = () => {
  const { profile } = useAuth();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [outlets, setOutlets] = useState<SalesOutlet[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      const [
        factoriesData,
        warehousesData,
        outletsData,
        materialsData,
        productsData
      ] = await Promise.all([
        fetchCollection<Factory>('factories', companyId),
        fetchCollection<Warehouse>('warehouses', companyId),
        fetchCollection<SalesOutlet>('outlets', companyId),
        fetchCollection<RawMaterial>('rawMaterials', companyId),
        fetchCollection<Product>('products', companyId),
      ]);

      setFactories(factoriesData);
      setWarehouses(warehousesData);
      setOutlets(outletsData);
      setMaterials(materialsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching useMasterData:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.companyId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    factories,
    warehouses,
    outlets,
    materials,
    products,
    loading,
    refreshData: fetchData
  };
};
