import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Only factory managers (and admins) get these notifications for now
  const canSeeNotifications = profile?.role === 'factory_manager' || profile?.role === 'admin';

  useEffect(() => {
    if (!canSeeNotifications || !profile?.companyId) return;

    const fetchNotifications = async () => {
      try {
        const response = await apiService.get(`notifications?companyId=${profile.companyId}`);
        if (response && response.items) {
          setNotifications(response.items);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [canSeeNotifications, profile?.companyId]);

  if (!canSeeNotifications) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full hover:bg-[var(--color-text)]/5 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-all relative"
        title="Notifications"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--color-bg)]"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-text)]/5 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-[var(--color-text)]/5 bg-[var(--color-text)]/[0.02]">
              <h3 className="font-bold text-[var(--color-text)]">Notifications</h3>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[var(--color-text)]/40 text-sm">
                  You're all caught up!
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-text)]/5">
                  {notifications.map((notif: any, i: number) => (
                    <div 
                      key={`${notif.id}-${i}`}
                      className="p-4 hover:bg-[var(--color-text)]/[0.02] cursor-pointer transition-colors"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/procurement');
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-main)]">Approval Required</span>
                        <span className="text-[10px] text-[var(--color-text)]/40">Just now</span>
                      </div>
                      <p className="text-sm text-[var(--color-text)]">
                        A <span className="font-semibold">{notif.type}</span> is pending your approval.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div 
                className="p-3 border-t border-[var(--color-text)]/5 bg-[var(--color-text)]/[0.02] text-center"
              >
                <button 
                  onClick={() => { setIsOpen(false); router.push('/procurement'); }}
                  className="text-xs font-bold text-[var(--color-main)] hover:underline"
                >
                  View All Approvals
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
