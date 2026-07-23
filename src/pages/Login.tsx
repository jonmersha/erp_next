"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { seedDatabase } from '../utils/seedData';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const Login: React.FC = () => {
  const { user, profile, loading: authLoading, loginWithOidc } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const router = useRouter();
  const setupInProgress = React.useRef(false);

  React.useEffect(() => {
    const checkProfile = async () => {
      if (!authLoading && user) {
        if (profile?.companyId) {
          router.push('/');
        } else {
          if (!setupInProgress.current) {
            setupInProgress.current = true;
            await autoSetupDefaultCompany(user);
          }
        }
      }
    };
    checkProfile();
  }, [user, profile, authLoading, router]);

  const autoSetupDefaultCompany = async (currentUser: any) => {
    setLoading(true);
    setError(null);
    try {
      const companies = await apiService.get<any[]>('companies');
      let defaultCompany = companies && companies.length > 0 ? companies[0] : null;
      let finalCompanyId = '';
      let isNewCompany = false;

      const uid = currentUser.profile ? currentUser.profile.sub : currentUser.uid;

      if (!defaultCompany) {
        const companyData = {
          name: 'Our Organization',
          address: 'Headquarters',
          phone: '',
          email: '',
          logoUrl: '',
          ownerId: uid,
        };
        const createdCompany = await apiService.post<any>('companies', companyData);
        finalCompanyId = createdCompany.id || createdCompany._id;
        isNewCompany = true;
      } else {
        finalCompanyId = defaultCompany.id || defaultCompany._id;
      }

      const email = (currentUser.profile && currentUser.profile.email) || currentUser.email || 'user@example.com';
      const name = (currentUser.profile && currentUser.profile.name) || currentUser.displayName || email.split('@')[0];

      // 1. Register identity in auth-service (only handles name/status)
      const authData = {
        name: name,
        status: 'active',
        system: 'Web-ERP'
      };
      
      console.log('Registering identity with auth-service:', authData);
      await apiService.post('users', authData);

      // 2. Register ERP-specific profile in main backend (handles company & roles)
      const erpProfileData = {
        email: email,
        name: name,
        roles: ['admin'], // Temporarily grant admin to everyone for testing
        companyId: finalCompanyId,
      };

      console.log('Registering ERP profile with main backend:', erpProfileData);
      await apiService.post('erp-users', erpProfileData);

      if (isNewCompany) {
        try {
          await seedDatabase(finalCompanyId);
        } catch (seedError) {
          console.error("Failed to seed database", seedError);
        }
      }

      window.location.href = '/';
    } catch (err: any) {
      console.error("Auto setup failed:", err);
      setError(err.message || "Failed to initialize the system.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to login with Google.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-md w-full bg-white dark:bg-[var(--color-surface)] rounded-sm shadow-md p-10 border border-[var(--color-border)]"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--color-main)] rounded-sm flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-light text-[var(--color-text)]">Sheger ERP</h1>
            <p className="text-[var(--color-text)]/60 mt-2 text-sm">Enterprise Service Portal</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-sm mb-6 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] p-3 rounded-sm transition-colors duration-200 group disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              <span className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-main)]">Sign in with Google</span>
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text)]/40 uppercase tracking-widest font-normal">
              Secured by OIDC
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;
