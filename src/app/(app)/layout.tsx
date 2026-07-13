"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('ProtectedLayout: loading=', loading, 'user=', !!user, 'profile=', !!profile);
    if (!loading) {
      if (!user || !profile?.companyId) {
        console.log('ProtectedLayout: redirecting to /login');
        router.push('/login');
      } else if (pathname === '/admin' && !isAdmin) {
        console.log('ProtectedLayout: redirecting to /');
        router.push('/');
      }
    }
  }, [user, profile, loading, isAdmin, pathname, router]);

  if (loading) {
    console.log('ProtectedLayout: still loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-12 h-12 border-4 border-[var(--color-main)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile?.companyId) {
    return null; // Will redirect
  }

  if (pathname === '/admin' && !isAdmin) {
    return null; // Will redirect
  }

  if (!profile.roles || profile.roles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Pending Access</h2>
          <p className="text-[var(--color-text)]/70">
            Your account has been created successfully, but you do not have any roles assigned yet. 
            Please contact your administrator to grant you access to the system.
          </p>
          <div className="pt-6">
            <button 
              onClick={async () => {
                const { signOut } = await import('firebase/auth');
                const { auth } = await import('../../firebase');
                await signOut(auth);
                router.push('/login');
              }}
              className="w-full py-3 bg-[var(--color-main)] text-white rounded-xl hover:bg-[var(--color-main)]/90 transition-colors font-medium shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
