"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Loader2, User as UserIcon, Mail, Shield, CheckCircle, Clock, CalendarRange, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useHRData } from '../hooks/useHRData';
import { logAttendance, applyLeave } from '../services/hrService';
import Modal from '../components/Modal';

const Profile: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { employees, attendance, leaves } = useHRData();
  const [activeTab, setActiveTab] = useState<'info' | 'timesheet' | 'leaves'>('info');

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const userEmployee = employees.find(emp => emp.email === profile?.email);
  const myAttendance = attendance.filter(a => a.employee_id === userEmployee?.id);
  const myLeaves = leaves.filter(l => l.employee_id === userEmployee?.id);

  // Attendance State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: '',
    status: 'present',
    overtime_hours: 0
  });

  // Leave State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    type: 'annual',
    reason: ''
  });

  // Auto-calculate overtime when clock_in or clock_out changes
  useEffect(() => {
    if (attendanceForm.clock_in && attendanceForm.clock_out) {
      const inTime = new Date(attendanceForm.clock_in).getTime();
      const outTime = new Date(attendanceForm.clock_out).getTime();
      if (outTime > inTime) {
        const diffHours = (outTime - inTime) / (1000 * 60 * 60);
        // Standard shift is 9 hours (e.g. 08:00 to 17:00)
        const overtime = Math.max(0, diffHours - 9);
        setAttendanceForm(prev => ({
          ...prev,
          overtime_hours: Number(overtime.toFixed(1))
        }));
      }
    }
  }, [attendanceForm.clock_in, attendanceForm.clock_out]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setSubmitting(true);
    setMessage(null);
    try {
      await apiService.updateDocument('users', profile.uid, { 
        name,
        email: profile.email,
        roles: profile.roles,
        status: profile.status || 'active',
        companyId: profile.companyId
      });
      setMessage({ type: 'success', text: 'Profile updated successfully! Refreshing data...' });
      
      // Reload page to refresh profile context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await logAttendance(attendanceForm);
      setIsAttendanceModalOpen(false);
      setMessage({ type: 'success', text: 'Attendance logged successfully.' });
      window.location.reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to log attendance" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await applyLeave(leaveForm);
      setIsLeaveModalOpen(false);
      setMessage({ type: 'success', text: 'Leave requested successfully.' });
      window.location.reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to submit leave request" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <header>
        <h2 className="text-3xl font-serif font-bold text-[var(--color-main)]">{t('My Profile')}</h2>
        <p className="text-[var(--color-text)]/40 mt-1">{t('Manage your personal information and time')}</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[var(--color-text)]/10 pb-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('info')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'info' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <Info size={16} className="mr-2" /> {t('Personal Info')}
        </button>
        <button 
          onClick={() => setActiveTab('timesheet')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'timesheet' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <Clock size={16} className="mr-2" /> {t('My Timesheet')}
        </button>
        <button 
          onClick={() => setActiveTab('leaves')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'leaves' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <CalendarRange size={16} className="mr-2" /> {t('My Leaves')}
        </button>
      </div>

      {activeTab === 'info' && (
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="p-8 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg)] to-[var(--color-surface)] flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[var(--color-main)] flex items-center justify-center text-white font-serif font-bold text-4xl shadow-md border-4 border-white dark:border-[var(--color-surface)]">
            {profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-text)]">{profile.name}</h3>
            <div className="flex items-center gap-2 text-[var(--color-text)]/60 mt-1">
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.roles && profile.roles.map(role => (
                <span key={role} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider bg-[var(--color-main)]/10 text-[var(--color-main)] border border-[var(--color-main)]/20">
                  <Shield size={10} />
                  {role.replace('_', ' ')}
                </span>
              ))}
              {(!profile.roles || profile.roles.length === 0) && (
                <span className="text-xs text-[var(--color-text)]/40 italic">{t('No roles assigned')}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <Loader2 size={18} />}
              {message.text}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">{t('Full Name')}</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30" size={20} />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl focus:outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 transition-all font-medium text-[var(--color-text)]"
                placeholder="E.g., Jane Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">{t('Email Address')}</label>
            <div className="relative opacity-60 cursor-not-allowed">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30" size={20} />
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl transition-all font-medium text-[var(--color-text)] cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-[var(--color-text)]/40 pl-1">{t('Email is linked to your Google Account and cannot be changed.')}</p>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button 
              disabled={submitting || name.trim() === profile.name}
              type="submit"
              className="px-8 bg-[var(--color-main)] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-[var(--color-main)]/20 hover:bg-[var(--color-main)]/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {submitting ? t('Saving...') : t('Save Changes')}
            </button>
          </div>
        </form>
      </div>
      )}

      {activeTab === 'timesheet' && (
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{t('My Attendance Log')}</h3>
            <button 
              onClick={() => {
                if (!userEmployee) {
                  setMessage({ type: 'error', text: 'You do not have an associated employee record to log attendance.' });
                  return;
                }
                const dateStr = new Date().toISOString().split('T')[0];
                const d = new Date(dateStr + 'T12:00:00Z');
                let clockIn = '';
                let clockOut = '';
                if (d.getDay() !== 0) { // Not Sunday
                  clockIn = `${dateStr}T08:00`;
                  clockOut = `${dateStr}T17:00`;
                }
                
                setAttendanceForm({ 
                  employee_id: userEmployee.id, 
                  date: dateStr, 
                  clock_in: clockIn, 
                  clock_out: clockOut, 
                  status: 'present',
                  overtime_hours: 0
                });
                setIsAttendanceModalOpen(true);
              }}
              className="px-4 py-2 bg-[var(--color-main)]/10 text-[var(--color-main)] font-bold rounded-xl hover:bg-[var(--color-main)]/20 transition-colors flex items-center"
            >
              <Clock size={16} className="mr-2" /> {t('Log Attendance')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text)]">
              <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-text)]/20">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Date')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Clock In')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Clock Out')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Overtime')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {myAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="p-4 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-4">{record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : '-'}</td>
                    <td className="p-4">{record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : '-'}</td>
                    <td className="p-4">{record.overtime_hours > 0 ? `${record.overtime_hours} hrs` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'absent' ? 'bg-rose-100 text-rose-700' :
                        record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myAttendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--color-text)]/40">{t('No attendance records found.')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{t('My Leave Requests')}</h3>
            <button 
              onClick={() => {
                if (!userEmployee) {
                  setMessage({ type: 'error', text: 'You do not have an associated employee record to request leaves.' });
                  return;
                }
                setLeaveForm({ employee_id: userEmployee.id, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], type: 'annual', reason: '' });
                setIsLeaveModalOpen(true);
              }}
              className="px-4 py-2 bg-[var(--color-main)]/10 text-[var(--color-main)] font-bold rounded-xl hover:bg-[var(--color-main)]/20 transition-colors flex items-center"
            >
              <CalendarRange size={16} className="mr-2" /> {t('Apply Leave')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text)]">
              <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-text)]/20">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Leave Type')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Dates')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Reason')}</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {myLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="p-4 font-medium capitalize">{leave.type.replace('_', ' ')}</td>
                    <td className="p-4">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-[var(--color-text)]/80 max-w-xs truncate" title={leave.reason}>{leave.reason || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myLeaves.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--color-text)]/40">{t('No leave requests found.')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={t('Log My Attendance')}>
        <form onSubmit={handleAttendanceSubmit} className="space-y-6">
          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Date')}</label>
              <button 
                type="button"
                onClick={() => {
                  const d = new Date(attendanceForm.date + 'T12:00:00Z');
                  if (d.getDay() === 0) { // Sunday
                    setMessage({ type: 'error', text: 'Cannot set standard shift on a Sunday (Rest Day).' });
                    return;
                  }
                  setAttendanceForm({
                    ...attendanceForm,
                    clock_in: `${attendanceForm.date}T08:00`,
                    clock_out: `${attendanceForm.date}T17:00`
                  });
                }}
                className="text-xs font-bold text-[var(--color-main)] hover:underline"
              >
                {t('Set Standard Shift (08:00 - 17:00)')}
              </button>
            </div>
            <input type="date" required value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Clock In')}</label>
              <input type="datetime-local" value={attendanceForm.clock_in} onChange={e => setAttendanceForm({ ...attendanceForm, clock_in: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Clock Out')}</label>
              <input type="datetime-local" value={attendanceForm.clock_out} onChange={e => setAttendanceForm({ ...attendanceForm, clock_out: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Status')}</label>
              <select required value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
                <option value="present">{t('Present')}</option>
                <option value="absent">{t('Absent')}</option>
                <option value="late">{t('Late')}</option>
                <option value="half_day">{t('Half Day')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Overtime (Hrs)')}</label>
              <input type="number" step="0.5" min="0" value={attendanceForm.overtime_hours} onChange={e => setAttendanceForm({ ...attendanceForm, overtime_hours: parseFloat(e.target.value) || 0 })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg">
            {submitting ? t('Saving...') : t('Log Attendance')}
          </button>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title={t('Apply for Leave')}>
        <form onSubmit={handleLeaveSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Start Date')}</label>
              <input type="date" required value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('End Date')}</label>
              <input type="date" required value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Leave Type')}</label>
            <select required value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
              <option value="annual">{t('Annual Leave')}</option>
              <option value="sick">{t('Sick Leave')}</option>
              <option value="maternity">{t('Maternity/Paternity Leave')}</option>
              <option value="unpaid">{t('Unpaid Leave')}</option>
              <option value="other">{t('Other')}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Reason')}</label>
            <textarea required value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg">
            {submitting ? t('Submitting...') : t('Submit Request')}
          </button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Profile;
