"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { apiService } from '../services/apiService';
import { UserProfile, Company, Role } from '../types';

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
  logout: async () => {},
});

export const useAuth = () => useContext(AppAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [systemRoles, setSystemRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Token is handled dynamically by apiService
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

          const profileData = await apiService.get<UserProfile>(`users/${uid}`);
          if (profileData) {
             if (profileData.status === 'inactive') {
               alert('Your account has been deactivated. Please contact your administrator.');
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
          console.error("Failed to fetch profile or company:", error);
          alert('Authentication service is currently unavailable. Please try again later.');
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
    if (isAdmin) return true;
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
      // apiService.setToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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
    }}>
      {children}
    </AppAuthContext.Provider>
  );
};
