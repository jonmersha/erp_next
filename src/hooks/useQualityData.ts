import { useState, useEffect } from 'react';
import { QualityCheck, ProductionRun, GRN, InventoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';
import { apiService } from '../services/apiService';

export const useQualityData = () => {
  const { profile } = useAuth();
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [productionRuns, setProductionRuns] = useState<ProductionRun[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      const [qualityData, runsData, grnsData, invData] = await Promise.all([
        fetchCollection('quality', companyId),
        fetchCollection('productionRuns', companyId),
        fetchCollection('grns', companyId),
        fetchCollection('inventoryItems', companyId)
      ]);

      if (Array.isArray(qualityData)) setQualityChecks(qualityData as QualityCheck[]);
      if (Array.isArray(runsData)) setProductionRuns(runsData as ProductionRun[]);
      if (Array.isArray(grnsData)) setGrns(grnsData as GRN[]);
      if (Array.isArray(invData)) setInventory(invData as InventoryItem[]);
    } catch (error) {
      console.error("Error fetching quality data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.companyId]);

  return {
    qualityChecks,
    productionRuns,
    grns,
    inventory,
    loading,
    refreshData: fetchData
  };
};

export const addQualityCheck = async (data: any) => {
  return apiService.addDocument('quality', data);
};

export const updateQualityCheck = async (id: string, data: any) => {
  return apiService.updateDocument('quality', id, data);
};
