import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Vehicle, VehicleRequest, FleetConsumption } from '../../types';
import { 
  getVehicles, createVehicle, updateVehicle,
  getVehicleRequests, createVehicleRequest, updateVehicleRequest, approveVehicleRequest, rejectVehicleRequest,
  getFleetConsumptions, createFleetConsumption, updateFleetConsumption
} from '../../services/fleetService';
import { getEmployees } from '../../services/hrService';
import { getCostCenters } from '../../services/expenseService';
import { Loader2, Plus, CheckCircle, Clock, XCircle, Car, Fuel, AlertTriangle, Edit2 } from 'lucide-react';

const FleetManagement: React.FC = () => {
  const { t } = useTranslation();
  const { profile, hasRole, isAdmin } = useAuth();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [consumptions, setConsumptions] = useState<FleetConsumption[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'requests' | 'vehicles' | 'consumptions'>('requests');
  
  // Modals
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showNewConsumption, setShowNewConsumption] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null); // holds request ID

  // Edit State
  const [editVehicleRecord, setEditVehicleRecord] = useState<Vehicle | null>(null);
  const [editRequestRecord, setEditRequestRecord] = useState<VehicleRequest | null>(null);
  const [editConsumptionRecord, setEditConsumptionRecord] = useState<FleetConsumption | null>(null);

  const formatDateTimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const loadData = async () => {
    if (!profile?.companyId) return;
    setLoading(true);
    try {
      const [vData, rData, cData, eData, ccData] = await Promise.all([
        getVehicles(profile.companyId),
        getVehicleRequests(profile.companyId),
        getFleetConsumptions(profile.companyId),
        getEmployees(profile.companyId),
        getCostCenters(profile.companyId)
      ]);
      setVehicles(vData);
      setRequests(rData);
      setConsumptions(cData);
      setEmployees(eData);
      setCostCenters(ccData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.companyId]);

  const handleCreateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      plateNumber: formData.get('plateNumber') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      type: formData.get('type') as any,
      status: (formData.get('status') as any) || 'active',
      companyId: profile!.companyId
    };
    try {
      if (editVehicleRecord) {
        await updateVehicle(editVehicleRecord.id, data);
        setEditVehicleRecord(null);
      } else {
        await createVehicle(data);
      }
      setShowNewVehicle(false);
      loadData();
    } catch (err) {
      alert('Failed to save vehicle');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      employeeId: formData.get('employeeId') as string,
      travelers: formData.getAll('travelers') as string[],
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      purpose: formData.get('purpose') as string,
      costCenterId: formData.get('costCenterId') as string || undefined,
      companyId: profile!.companyId,
      createdBy: profile!.uid
    };
    try {
      if (editRequestRecord) {
        await updateVehicleRequest(editRequestRecord.id, data);
        setEditRequestRecord(null);
      } else {
        await createVehicleRequest(data);
      }
      setShowNewRequest(false);
      loadData();
    } catch (err) {
      alert('Failed to save request');
    }
  };

  const handleCreateConsumption = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      vehicleId: formData.get('vehicleId') as string,
      type: formData.get('type') as any,
      cost: parseFloat(formData.get('cost') as string),
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      costCenterId: formData.get('costCenterId') as string || undefined,
      companyId: profile!.companyId,
      recordedBy: profile!.uid
    };
    try {
      if (editConsumptionRecord) {
        await updateFleetConsumption(editConsumptionRecord.id, data);
        setEditConsumptionRecord(null);
      } else {
        await createFleetConsumption(data);
      }
      setShowNewConsumption(false);
      loadData();
    } catch (err) {
      alert('Failed to save consumption');
    }
  };

  const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showApproveModal) return;
    const formData = new FormData(e.currentTarget);
    try {
      await approveVehicleRequest(showApproveModal, profile!.uid!, formData.get('vehicleId') as string);
      setShowApproveModal(null);
      loadData();
    } catch (err) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectVehicleRequest(id, profile!.uid!);
      loadData();
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--color-main)]" /></div>;

  const canManageFleet = isAdmin || hasRole('logistics_manager') || hasRole('admin');

  return (
    <div className="space-y-6 text-[var(--color-text)]">
      <div className="flex border-b border-[var(--color-text)]/10">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`pb-4 px-6 font-bold ${activeTab === 'requests' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}
        >
          {t('Travel Requests')}
        </button>
        <button 
          onClick={() => setActiveTab('vehicles')}
          className={`pb-4 px-6 font-bold ${activeTab === 'vehicles' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}
        >
          {t('Vehicles')}
        </button>
        <button 
          onClick={() => setActiveTab('consumptions')}
          className={`pb-4 px-6 font-bold ${activeTab === 'consumptions' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}
        >
          {t('Consumptions')}
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl">{t('Vehicle Requests')}</h3>
            <button onClick={() => setShowNewRequest(true)} className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl">
              <Plus size={16} /> <span>{t('New Request')}</span>
            </button>
          </div>
          
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-text)]/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--color-text)]/5">
                <tr className="text-[var(--color-text)]/50 text-sm">
                  <th className="p-4">{t('Employee & Travelers')}</th>
                  <th className="p-4">{t('Period')}</th>
                  <th className="p-4">{t('Purpose')}</th>
                  <th className="p-4">{t('Cost Center')}</th>
                  <th className="p-4">{t('Assigned Vehicle')}</th>
                  <th className="p-4">{t('Status')}</th>
                  <th className="p-4">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-[var(--color-text)]/5">
                    <td className="p-4">
                      <div className="font-bold">{req.employeeName}</div>
                      {req.travelers && req.travelers.length > 0 && (
                        <div className="text-xs text-[var(--color-text)]/60">+{req.travelers.length} traveler(s)</div>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(req.startDate).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} - {new Date(req.endDate).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm max-w-[200px] truncate" title={req.purpose}>{req.purpose}</td>
                    <td className="p-4 text-sm">{req.costCenterName || '-'}</td>
                    <td className="p-4 font-bold">{req.vehiclePlate || '-'}</td>
                    <td className="p-4">
                      {req.status === 'approved' ? (
                        <span className="flex items-center space-x-1 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-full w-max">
                          <CheckCircle size={14} /> <span>{t('Approved')}</span>
                        </span>
                      ) : req.status === 'pending_approval' ? (
                        <span className="flex items-center space-x-1 text-amber-500 text-sm font-bold bg-amber-500/10 px-2 py-1 rounded-full w-max">
                          <Clock size={14} /> <span>{t('Pending')}</span>
                        </span>
                      ) : req.status === 'rejected' ? (
                         <span className="flex items-center space-x-1 text-rose-500 text-sm font-bold bg-rose-500/10 px-2 py-1 rounded-full w-max">
                          <XCircle size={14} /> <span>{t('Rejected')}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--color-text)]/50 capitalize">{req.status.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td className="p-4 space-x-2 flex items-center">
                      {req.status === 'pending_approval' && (
                        <button 
                          onClick={() => { setEditRequestRecord(req); setShowNewRequest(true); }}
                          className="text-blue-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
                        >
                          <Edit2 size={14} /> {t('Edit')}
                        </button>
                      )}
                      {req.status === 'pending_approval' && canManageFleet && req.createdBy !== profile?.uid && (
                        <>
                          <button onClick={() => setShowApproveModal(req.id)} className="text-emerald-500 hover:text-emerald-600 font-bold text-sm">
                            {t('Approve')}
                          </button>
                          <button onClick={() => handleReject(req.id)} className="text-rose-500 hover:text-rose-600 font-bold text-sm">
                            {t('Reject')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-[var(--color-text)]/50">{t('No requests found')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl">{t('Fleet Vehicles')}</h3>
            {canManageFleet && (
              <button onClick={() => setShowNewVehicle(true)} className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl">
                <Plus size={16} /> <span>{t('Add Vehicle')}</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <div key={v.id} className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center font-bold">
                      <Car size={24} />
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      v.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
                      v.status === 'maintenance' ? 'bg-amber-500/10 text-amber-500' : 
                      'bg-rose-500/10 text-rose-500'
                    }`}>
                      {t(v.status)}
                    </span>
                  </div>
                  <h4 className="font-bold text-2xl mb-1">{v.plateNumber}</h4>
                  <p className="text-[var(--color-text)]/60 text-sm">{v.make} {v.model}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-text)]/10 flex justify-between items-center">
                  <span className="text-xs uppercase font-bold text-[var(--color-text)]/40">{t(v.type)}</span>
                  {canManageFleet && (
                    <button 
                      onClick={() => { setEditVehicleRecord(v); setShowNewVehicle(true); }}
                      className="text-blue-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
                    >
                      <Edit2 size={14} /> {t('Edit')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'consumptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl">{t('Fleet Consumptions')}</h3>
            <button onClick={() => setShowNewConsumption(true)} className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl">
              <Fuel size={16} /> <span>{t('Log Consumption')}</span>
            </button>
          </div>
          
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-text)]/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--color-text)]/5">
                <tr className="text-[var(--color-text)]/50 text-sm">
                  <th className="p-4">{t('Date')}</th>
                  <th className="p-4">{t('Vehicle')}</th>
                  <th className="p-4">{t('Type')}</th>
                  <th className="p-4">{t('Cost')}</th>
                  <th className="p-4">{t('Description')}</th>
                  <th className="p-4">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {consumptions.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--color-text)]/5">
                    <td className="p-4">{new Date(c.date).toLocaleDateString()}</td>
                    <td className="p-4 font-bold">{c.vehiclePlate}</td>
                    <td className="p-4 capitalize">
                      {c.type === 'fuel' ? <span className="text-amber-500 flex items-center gap-1"><Fuel size={14}/> Fuel</span> :
                       c.type === 'maintenance' || c.type === 'repair' ? <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={14}/> {c.type}</span> :
                       c.type}
                    </td>
                    <td className="p-4 font-bold text-[var(--color-text)]">${c.cost.toLocaleString()}</td>
                    <td className="p-4 text-sm text-[var(--color-text)]/60">{c.description}</td>
                    <td className="p-4">
                      {canManageFleet && (
                        <button 
                          onClick={() => { setEditConsumptionRecord(c); setShowNewConsumption(true); }}
                          className="text-blue-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
                        >
                          <Edit2 size={14} /> {t('Edit')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateRequest} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{editRequestRecord ? t('Edit Vehicle Request') : t('Vehicle Request')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Employee (Requester)')}</label>
                <select name="employeeId" required defaultValue={editRequestRecord?.employeeId} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Requester')}</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Additional Travelers')}</label>
                <select name="travelers" multiple defaultValue={editRequestRecord?.travelers} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3 h-24">
                  {employees.map(e => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                </select>
                <p className="text-xs text-[var(--color-text)]/40 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Start Date')}</label>
                  <input name="startDate" type="datetime-local" required defaultValue={formatDateTimeLocal(editRequestRecord?.startDate)} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('End Date')}</label>
                  <input name="endDate" type="datetime-local" required defaultValue={formatDateTimeLocal(editRequestRecord?.endDate)} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Cost Center (Optional)')}</label>
                <select name="costCenterId" defaultValue={editRequestRecord?.costCenterId} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Cost Center')}</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Purpose')}</label>
                <textarea name="purpose" required defaultValue={editRequestRecord?.purpose} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" rows={3} />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowNewRequest(false); setEditRequestRecord(null); }} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white rounded-xl font-bold">{editRequestRecord ? t('Save Changes') : t('Submit Request')}</button>
            </div>
          </form>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleApprove} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{t('Assign Vehicle & Approve')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Assign Vehicle')}</label>
                <select name="vehicleId" required className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Vehicle')}</option>
                  {vehicles.filter(v => v.status === 'active').map(v => (
                    <option key={v.id} value={v.id}>{v.plateNumber} ({v.make} {v.model})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowApproveModal(null)} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold">{t('Approve')}</button>
            </div>
          </form>
        </div>
      )}

      {showNewVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateVehicle} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{editVehicleRecord ? t('Edit Vehicle') : t('Add Vehicle')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Plate Number')}</label>
                <input name="plateNumber" required defaultValue={editVehicleRecord?.plateNumber} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" placeholder="e.g. ABC-1234" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Make')}</label>
                  <input name="make" required defaultValue={editVehicleRecord?.make} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" placeholder="e.g. Toyota" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Model')}</label>
                  <input name="model" required defaultValue={editVehicleRecord?.model} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" placeholder="e.g. Hilux" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Type')}</label>
                  <select name="type" required defaultValue={editVehicleRecord?.type} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                    <option value="car">Car</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Motorcycle</option>
                  </select>
                </div>
                {editVehicleRecord && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Status')}</label>
                    <select name="status" required defaultValue={editVehicleRecord?.status} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                      <option value="active">{t('Active')}</option>
                      <option value="maintenance">{t('Maintenance')}</option>
                      <option value="retired">{t('Retired')}</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowNewVehicle(false); setEditVehicleRecord(null); }} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white rounded-xl font-bold">{editVehicleRecord ? t('Save Changes') : t('Save')}</button>
            </div>
          </form>
        </div>
      )}

      {showNewConsumption && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateConsumption} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{editConsumptionRecord ? t('Edit Consumption') : t('Log Consumption')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Vehicle')}</label>
                <select name="vehicleId" required defaultValue={editConsumptionRecord?.vehicleId} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Vehicle')}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plateNumber} ({v.make} {v.model})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Type')}</label>
                  <select name="type" required defaultValue={editConsumptionRecord?.type} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                    <option value="fuel">Fuel</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Date')}</label>
                  <input name="date" type="date" required defaultValue={editConsumptionRecord?.date ? new Date(editConsumptionRecord.date).toISOString().slice(0, 10) : ''} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Cost')}</label>
                <input name="cost" type="number" step="0.01" required defaultValue={editConsumptionRecord?.cost} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Cost Center (Optional)')}</label>
                <select name="costCenterId" defaultValue={editConsumptionRecord?.costCenterId} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Cost Center')}</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Description')}</label>
                <textarea name="description" required defaultValue={editConsumptionRecord?.description} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" rows={3} />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowNewConsumption(false); setEditConsumptionRecord(null); }} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white rounded-xl font-bold">{editConsumptionRecord ? t('Save Changes') : t('Save')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
