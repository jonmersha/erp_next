import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, TestTube, Plus, Search, Scale, FileCheck, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLogisticsData } from '../../hooks/useLogisticsData';
import WeighbridgeModal from './WeighbridgeModal';
import QualityInspectionModal from './QualityInspectionModal';
import GRNModal from './GRNModal';
import FleetManagement from './FleetManagement';
import Badge from '../common/Badge';

const LogisticsMain: React.FC = () => {
  const { t } = useTranslation();
  const { weighbridgeLogs, qualityInspections, purchaseOrders, grns, loading, refreshData } = useLogisticsData();
  const [activeTab, setActiveTab] = useState<'weighbridge' | 'lab' | 'grn' | 'fleet'>('weighbridge');
  const [searchTerm, setSearchTerm] = useState('');

  const [isWeighbridgeModalOpen, setIsWeighbridgeModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const filteredLogs = weighbridgeLogs.filter(log => 
    log.truck_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInspections = qualityInspections.filter(qi => 
    qi.truck_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGRNs = (grns || []).filter(grn => 
    grn.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grn.purchaseOrderId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-[var(--color-main)] tracking-tight mb-2">
            {t('Inbound Logistics & Receiving')}
          </h1>
          <p className="text-[var(--color-text)]/60 max-w-2xl text-lg">
            {t('Manage weighbridge operations, quality control lab tests, and goods receipts.')}
          </p>
        </div>
        <div className="flex space-x-3 flex-wrap gap-y-3">
          <button 
            onClick={() => { setSelectedLog(null); setIsWeighbridgeModalOpen(true); }}
            className="flex items-center space-x-2 px-6 py-3 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-2xl font-bold hover:bg-[var(--color-main)]/20 transition-all"
          >
            <Scale size={18} />
            <span>{t('Log Truck Entry')}</span>
          </button>
          <button 
            onClick={() => setIsLabModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500/10 text-blue-600 rounded-2xl font-bold hover:bg-blue-500/20 transition-all"
          >
            <TestTube size={18} />
            <span>{t('New Lab Test')}</span>
          </button>
          <button 
            onClick={() => setIsGRNModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Package size={18} />
            <span>{t('Generate GRN')}</span>
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/5 overflow-hidden">
        <div className="p-6 border-b border-[var(--color-text)]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-1 bg-[var(--color-text)]/5 p-1 rounded-xl w-fit flex-wrap">
            <button 
              onClick={() => setActiveTab('weighbridge')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'weighbridge' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              <Truck size={16} />
              <span>{t('Weighbridge')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('lab')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'lab' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              <TestTube size={16} />
              <span>{t('Quality Lab')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('grn')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'grn' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              <FileCheck size={16} />
              <span>{t('Goods Receipts (GRN)')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('fleet')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'fleet' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              <Truck size={16} />
              <span>{t('Fleet Management')}</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30" />
            <input 
              type="text" 
              placeholder={t('Search...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[var(--color-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all text-[var(--color-text)] placeholder:text-[var(--color-text)]/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-[var(--color-text)]/30 animate-pulse">Loading {activeTab}...</div>
          ) : activeTab === 'weighbridge' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest bg-[var(--color-text)]/[0.02]">
                  <th className="px-8 py-4">{t('Truck')}</th>
                  <th className="px-8 py-4">{t('Reference')}</th>
                  <th className="px-8 py-4 text-right">{t('Gross (KG)')}</th>
                  <th className="px-8 py-4 text-right">{t('Tare (KG)')}</th>
                  <th className="px-8 py-4 text-right">{t('Net (KG)')}</th>
                  <th className="px-8 py-4">{t('Status')}</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {filteredLogs.map(log => (
                  <motion.tr key={log.id} initial={{opacity:0}} animate={{opacity:1}} className="hover:bg-[var(--color-text)]/[0.02]">
                    <td className="px-8 py-4">
                      <p className="font-bold text-[var(--color-text)]">{log.truck_plate}</p>
                      <p className="text-xs text-[var(--color-text)]/50">{log.driver_name}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-xs font-bold text-[var(--color-text)]/70">{log.reference_type}</p>
                      <p className="text-xs font-mono text-[var(--color-text)]/40">{log.reference_id?.slice(0,8)}</p>
                    </td>
                    <td className="px-8 py-4 text-right font-mono font-bold text-[var(--color-text)]/80">{log.gross_weight}</td>
                    <td className="px-8 py-4 text-right font-mono font-bold text-[var(--color-text)]/80">{log.tare_weight || '-'}</td>
                    <td className="px-8 py-4 text-right font-mono font-bold text-[var(--color-main)]">{log.net_weight || '-'}</td>
                    <td className="px-8 py-4">
                      {log.exit_time ? (
                        <Badge color="emerald" label="Completed" />
                      ) : (
                        <Badge color="warning" label="Inside Yard" />
                      )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      {!log.exit_time && (
                        <button 
                          onClick={() => { setSelectedLog(log); setIsWeighbridgeModalOpen(true); }}
                          className="px-4 py-2 bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10 text-xs font-bold rounded-lg transition-all"
                        >
                          {t('Log Exit')}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'lab' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest bg-[var(--color-text)]/[0.02]">
                  <th className="px-8 py-4">{t('Truck / Date')}</th>
                  <th className="px-8 py-4">{t('Moisture')}</th>
                  <th className="px-8 py-4">{t('Protein')}</th>
                  <th className="px-8 py-4">{t('Ash')}</th>
                  <th className="px-8 py-4">{t('Verdict')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {filteredInspections.map(qi => (
                  <motion.tr key={qi.id} initial={{opacity:0}} animate={{opacity:1}} className="hover:bg-[var(--color-text)]/[0.02]">
                    <td className="px-8 py-4">
                      <p className="font-bold text-[var(--color-text)]">{qi.truck_plate}</p>
                      <p className="text-xs text-[var(--color-text)]/50">{new Date(qi.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-4 font-mono text-sm">{qi.moisture}%</td>
                    <td className="px-8 py-4 font-mono text-sm">{qi.protein}%</td>
                    <td className="px-8 py-4 font-mono text-sm">{qi.ash}%</td>
                    <td className="px-8 py-4">
                      <Badge 
                        color={qi.status === 'Approved' ? 'emerald' : qi.status === 'Rejected' ? 'error' : 'warning'}
                        label={qi.status}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'grn' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest bg-[var(--color-text)]/[0.02]">
                  <th className="px-8 py-4">{t('GRN ID')}</th>
                  <th className="px-8 py-4">{t('Purchase Order')}</th>
                  <th className="px-8 py-4">{t('Receipt Date')}</th>
                  <th className="px-8 py-4">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {filteredGRNs.map(grn => (
                  <motion.tr key={grn.id} initial={{opacity:0}} animate={{opacity:1}} className="hover:bg-[var(--color-text)]/[0.02]">
                    <td className="px-8 py-4 font-mono text-sm font-bold text-[var(--color-text)]">
                      GRN-{grn.id.slice(0,8)}
                    </td>
                    <td className="px-8 py-4 font-mono text-sm text-[var(--color-text)]/70">
                      PO-{grn.purchaseOrderId?.slice(0,8)}
                    </td>
                    <td className="px-8 py-4 text-sm text-[var(--color-text)]/70">
                      {new Date(grn.receiptDate).toLocaleString()}
                    </td>
                    <td className="px-8 py-4">
                      <Badge color="emerald" label={grn.status || 'Received'} />
                    </td>
                  </motion.tr>
                ))}
                {filteredGRNs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-[var(--color-text)]/40 text-sm">
                      No Goods Receipt Notes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <FleetManagement />
          )}
        </div>
      </div>

      <WeighbridgeModal 
        isOpen={isWeighbridgeModalOpen}
        onClose={() => setIsWeighbridgeModalOpen(false)}
        onSuccess={refreshData}
        purchaseOrders={purchaseOrders}
        log={selectedLog}
      />

      <QualityInspectionModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        onSuccess={refreshData}
        logs={weighbridgeLogs.filter(l => !l.exit_time)}
      />

      <GRNModal
        isOpen={isGRNModalOpen}
        onClose={() => setIsGRNModalOpen(false)}
        onSuccess={refreshData}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
};

export default LogisticsMain;
