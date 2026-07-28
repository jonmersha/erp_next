import { useState, useEffect } from 'react';
import { SalesOrder, Product, SalesOutlet } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useSalesData = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<SalesOutlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const companyId = profile.companyId;
        const [ordersData, productsData, outletsData] = await Promise.all([
          fetchCollection<SalesOrder>('salesOrders', companyId, { orderByField: 'createdAt', orderDir: 'desc' }),
          fetchCollection<Product>('products', companyId),
          fetchCollection<SalesOutlet>('outlets', companyId),
        ]);

        setOrders(ordersData);
        setProducts(productsData);
        setOutlets(outletsData);
      } catch (error) {
        console.error('Error fetching useSalesData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  return {
    orders,
    products,
    outlets,
    loading
  };
};
