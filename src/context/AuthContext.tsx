"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { apiService } from '../services/apiService';
import { UserProfile, Company, Role } from '../types';
import { AUTH_API_URL } from '../config';

interface AppAuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  company: Company | null;
  systemRoles: Role[];
  loading: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  can: (action: string, module: string) => boolean;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AppAuthContext = createContext<AppAuthContextType>({
  user: null,
  profile: null,
  company: null,
  systemRoles: [],
  loading: true,
  isAdmin: false,
  hasRole: () => false,
  can: () => false,
  logout: async () => { },
  authError: null,
  clearAuthError: () => { },
});

export const useAuth = () => useContext(AppAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [systemRoles, setSystemRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Monitor Firebase state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setLoading(true); // Ensure loading is true while we fetch profile
      } else {
        setProfile(null);
        setCompany(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // When user changes, fetch the profile
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user && !profile) {
        try {
          const uid = user.uid;
          if (!uid) return;

          // 1. Enforce Auth Service Synchronization & get Custom JWT
          const firebaseToken = await user.getIdToken();
          const email = (user as any).profile?.email || user.email || 'user@example.com';
          const name = (user as any).profile?.name || user.displayName || email.split('@')[0];

          const authData = {
            name: name,
            status: 'active',
            system: 'Web-ERP'
          };

          const authUrl = AUTH_API_URL;
          const authResponse = await fetch(`${authUrl}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${firebaseToken}`
            },
            body: JSON.stringify(authData)
          });

          if (!authResponse.ok) {
            let errorDetail = '';
            try {
              const errBody = await authResponse.json();
              errorDetail = errBody.details || errBody.sqlMessage || errBody.error || '';
            } catch (_) {}
            throw new Error(`Auth service failed to respond correctly (Status: ${authResponse.status})${errorDetail ? ': ' + errorDetail : ''}`);
          }

          const authJson = await authResponse.json();
          if (authJson.token) {
            localStorage.setItem('erp_custom_token', authJson.token);
          } else {
            throw new Error('No custom token returned from Auth Service');
          }

          // 2. Fetch Profile from Main Backend
          const profileData = await apiService.get<UserProfile>(`erp-users/${uid}`);
          if (profileData) {
            if (profileData.status === 'inactive') {
              setAuthError('Your account has been deactivated. Please contact your administrator.');
              await logout();
              return;
            }
            setProfile(profileData);
            if (profileData.companyId) {
              const companyData = await apiService.get<Company>(`companies/${profileData.companyId}`);
              setCompany(companyData);
            }
          }
        } catch (error) {
          console.error("Failed to sync with auth service or fetch profile:", error);
          setAuthError('Authentication service is currently unavailable. Please try again later.');
          await logout();
        }
      }
      setLoading(false);
    };

    if (user) {
      fetchProfileData();
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchSystemRoles = async () => {
      if (profile && profile.companyId) {
        try {
          const roles = await apiService.get<Role[]>(`roles?companyId=${profile.companyId}`);
          setSystemRoles(roles);
        } catch (err) {
          console.error("Failed to fetch roles", err);
        }
      }
    };
    fetchSystemRoles();
  }, [profile]);

  const isAdmin = profile?.roles?.includes('admin') || false;

  const hasRole = (roleName: string) => {
    if (isAdmin) return true;
    return profile?.roles?.includes(roleName) || false;
  };

  const can = (action: string, module: string) => {
    if (!profile?.roles || !systemRoles.length) return false;

    for (const roleName of profile.roles) {
      const role = systemRoles.find(r => r.name === roleName);
      if (role?.permissions && role.permissions[module]) {
        if (role.permissions[module].includes(action)) {
          return true;
        }
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('erp_custom_token');
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthError('Your session has expired. Please log in again.');
      logout();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-expired', handleAuthExpired);
      return () => window.removeEventListener('auth-expired', handleAuthExpired);
    }
  }, []);

  return (
    <AppAuthContext.Provider value={{
      user,
      profile,
      company,
      systemRoles,
      loading,
      isAdmin,
      hasRole,
      can,
      logout,
      authError,
      clearAuthError
    }}>
      {children}
    </AppAuthContext.Provider>
  );
};
