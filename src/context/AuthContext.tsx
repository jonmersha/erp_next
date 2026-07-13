"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { apiService } from '../services/apiService';
import { UserProfile, Company, Role } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  company: Company | null;
  systemRoles: Role[];
  loading: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  can: (action: string, module: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  company: null,
  systemRoles: [],
  loading: true,
  isAdmin: false,
  hasRole: () => false,
  can: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [systemRoles, setSystemRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: mounting');
    const timer = setTimeout(() => {
      console.log('Auth loading timed out after 10s, forcing loading=false');
      setLoading(false);
    }, 10000); // 10 seconds safety timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: onAuthStateChanged', user ? `user:${user.uid}` : 'no user');
      setUser(user);
      
      if (user) {
        console.log('User signed in. Fetching profile/company from backend.');
        try {
          // Add a check to fetch profile only if user exists
          const profileData = await apiService.get<UserProfile>(`users/${user.uid}`);
          console.log('AuthContext: Profile received', profileData);
          if (profileData) {
            if (profileData.status === 'inactive') {
              alert('Your account has been deactivated. Please contact your administrator.');
              import('firebase/auth').then(({ signOut }) => signOut(auth));
              setUser(null);
              setProfile(null);
              setCompany(null);
              setLoading(false);
              return;
            }
            
            setProfile(profileData);

            if (profileData.companyId) {
              console.log('AuthContext: Fetching company', profileData.companyId);
              try {
                const companyData = await apiService.get<Company>(`companies/${profileData.companyId}`);
                console.log('AuthContext: Company received', companyData);
                setCompany(companyData);
                
                const rolesData = await apiService.get<Role[]>(`roles?companyId=${profileData.companyId}`);
                if (rolesData) setSystemRoles(rolesData);
              } catch (compErr) {
                console.error("AuthContext: Failed to fetch company/roles", compErr);
              }
            }
          }
        } catch (e) {
          console.error("AuthContext: Failed to fetch profile/company", e);
        }
      } else {
        console.log('No user signed in');
        setProfile(null);
        setCompany(null);
        setSystemRoles([]);
      }
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const isAdmin = profile?.roles?.includes('admin') || user?.email === 'jonmersha@gmail.com';

  const hasRole = (role: string) => {
    if (isAdmin) return true;
    return profile?.roles?.includes(role as any) || false;
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

  return (
    <AuthContext.Provider value={{ user, profile, company, systemRoles, loading, isAdmin, hasRole, can }}>
      {children}
    </AuthContext.Provider>
  );
};
