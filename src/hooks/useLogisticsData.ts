import { useState, useEffect } from 'react';
import { WeighbridgeLog, QualityInspection, PurchaseOrder } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useLogisticsData = () => {
  const { profile } = useAuth();
  const [weighbridgeLogs, setWeighbridgeLogs] = useState<WeighbridgeLog[]>([]);
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      const [logsData, qiData, poData, grnData] = await Promise.all([
        fetchCollection('weighbridge', companyId, { orderByField: 'entry_time', orderDir: 'desc' }),
        fetchCollection('qualityInspections', companyId, { orderByField: 'created_at', orderDir: 'desc' }),
        fetchCollection('purchaseOrders', companyId, { orderByField: 'createdAt', orderDir: 'desc' }),
        fetchCollection('grns', companyId, { orderByField: 'receipt_date', orderDir: 'desc' })
      ]);

      if (Array.isArray(logsData)) setWeighbridgeLogs(logsData as any);
      if (Array.isArray(qiData)) setQualityInspections(qiData as any);
      if (Array.isArray(poData)) setPurchaseOrders(poData as any);
      if (Array.isArray(grnData)) setGrns(grnData as any);
    } catch (error) {
      console.error("Error fetching logistics data:", error);
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
    weighbridgeLogs,
    qualityInspections,
    purchaseOrders,
    grns,
    loading,
    refreshData: fetchData
  };
};
