import React, { useState, useEffect } from 'react';
import { Shipment } from '../types';
import { getShipments, addShipment } from '../services/logisticsService';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Truck } from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

const Logistics: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newShipment, setNewShipment] = useState<Omit<Shipment, 'id'>>({
    orderId: '',
    status: 'pending',
    deliveryDate: new Date().toISOString().split('T')[0],
    temperatureLog: [],
    companyId: '',
  });

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const data = await getShipments(profile.companyId);
        setShipments(data);
      } catch (error) {
        console.error("Error fetching shipments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    setNewShipment(prev => ({ ...prev, companyId: profile.companyId }));
    
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  const handleAddShipment = async () => {
    if (!profile?.companyId) return;
    await addShipment(newShipment);
    setIsModalOpen(false);
    getShipments(profile.companyId).then(setShipments);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Logistics & Distribution</h2>
        <p className="text-[var(--color-text)]/40 mt-1">Manage cold-chain logistics, delivery routing, and shelf-life monitoring.</p>
      </header>

      <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text)]">Shipments</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl"
          >
            <Plus size={16} />
            <span>{t('Track Shipment')}</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shipments.map(shipment => (
            <div key={shipment.id} className="border border-[var(--color-text)]/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <Truck className="text-[var(--color-main)]" />
                <h4 className="font-bold text-lg text-[var(--color-text)]">Order: {shipment.orderId}</h4>
              </div>
              <p className="text-sm text-[var(--color-text)]/60">Status: {shipment.status}</p>
              <p className="text-sm text-[var(--color-text)]/60">Delivery Date: {shipment.deliveryDate}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('Track Shipment')}>
        <div className="space-y-4 text-[var(--color-text)]">
          <input
            type="text"
            placeholder="Order ID"
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/5 rounded-xl"
            value={newShipment.orderId}
            onChange={e => setNewShipment(prev => ({ ...prev, orderId: e.target.value }))}
          />
          <button 
            onClick={handleAddShipment}
            className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl"
          >
            {t('Save Shipment')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Logistics;
