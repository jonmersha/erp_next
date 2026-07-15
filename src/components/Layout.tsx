"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Factory, 
  Users, 
  LogOut, 
  TrendingUp,
  Warehouse,
  Database,
  CreditCard,
  Calendar,
  CheckCircle2,
  BookOpen,
  Wrench,
  Truck,
  ChevronDown,
  Sun,
  Moon,
  Shield,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, can, isAdmin, company } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown-container')) {
        setOpenSubmenu(null);
      }
      if (!target.closest('.lang-dropdown-container')) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const navItems = [
    { 
      name: t('Dashboard'), 
      path: '/', 
      icon: LayoutDashboard, 
      alwaysShow: true 
    },
    { 
      name: t('Operations'), 
      icon: Factory, 
      submenu: [
        { name: t('Planning'), path: '/planning', icon: Calendar, module: 'planning' },
        { name: t('Procurement'), path: '/procurement', icon: ShoppingCart, module: 'procurement' },
        { name: t('Inventory'), path: '/inventory', icon: Warehouse, module: 'inventory' },
        { name: t('Production'), path: '/production', icon: Factory, module: 'production' },
        { name: t('Factory Floor'), path: '/factory-floor', icon: Factory, module: 'production' },
        { name: t('Workflow Templates'), path: '/workflow-templates', icon: Database, module: 'production' },
        { name: t('Recipes'), path: '/recipes', icon: BookOpen, module: 'recipes' },
        { name: t('Maintenance'), path: '/maintenance', icon: Wrench, module: 'maintenance' },
        { name: t('Logistics'), path: '/logistics', icon: Truck, module: 'logistics' },
        { name: t('Quality'), path: '/quality', icon: CheckCircle2, module: 'quality' },
      ]
    },
    { 
      name: t('Sales & Finance'), 
      icon: CreditCard, 
      submenu: [
        { name: t('Sales'), path: '/sales', icon: TrendingUp, module: 'sales' },
        { name: t('CRM'), path: '/crm', icon: Users, module: 'sales' },
        { name: t('Finance'), path: '/finance', icon: CreditCard, module: 'finance' },
      ]
    },
    { 
      name: t('Admin Panel'), 
      path: '/admin', 
      icon: Shield, 
      adminOnly: true 
    },
  ];

  const filteredNavItems = navItems.map(item => {
    if (item.alwaysShow || (item.adminOnly && isAdmin)) return item;
    if (item.adminOnly && !isAdmin) return null;
    
    if (item.submenu) {
      const filteredSub = item.submenu.filter(sub => can('read', sub.module));
      if (filteredSub.length > 0) {
        return { ...item, submenu: filteredSub };
      }
      return null;
    }
    
    return null;
  }).filter(Boolean) as typeof navItems;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="bg-[var(--color-shell)] text-[var(--color-shell-text)] border-b border-black/10 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
               {company?.logoUrl ? (
                 <img src={company.logoUrl} alt="Company Logo" className="h-8 w-8 object-contain rounded bg-white/10" referrerPolicy="no-referrer" />
               ) : (
                 <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                   <Factory size={16} className="text-white/60" />
                 </div>
               )}
               <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">
                 {company?.name || 'Sheger ERP'}
               </span>
            </div>
            {/* Mobile Hamburger Button */}
            <button 
              className="lg:hidden p-2 text-white/80"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="fixed top-0 left-0 h-full w-64 bg-[var(--color-shell)] z-50 flex flex-col lg:hidden pt-12 shadow-xl"
                  >
                    <nav className="flex flex-col h-full overflow-y-auto">
                      {filteredNavItems.map((item) => (
                        <div key={item.name} className="w-full">
                          {item.submenu ? (
                            <button
                              onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                              className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors text-white/80 hover:bg-[var(--color-shell-hover)]`}
                            >
                              <div className="flex items-center space-x-3">
                                <item.icon size={18} />
                                <span>{item.name}</span>
                              </div>
                              <ChevronDown size={14} className={`transform transition-transform ${openSubmenu === item.name ? 'rotate-180' : ''}`} />
                            </button>
                          ) : (
                            <Link
                              href={item.path!}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors text-white/80 hover:bg-[var(--color-shell-hover)]`}
                            >
                              <item.icon size={18} />
                              <span>{item.name}</span>
                            </Link>
                          )}
                          
                          {item.submenu && openSubmenu === item.name && (
                            <div className="bg-[var(--color-shell-hover)]">
                              {item.submenu.map(sub => (
                                <Link
                                  key={sub.path}
                                  href={sub.path}
                                  onClick={() => { setOpenSubmenu(null); setIsMobileMenuOpen(false); }}
                                  className="flex items-center space-x-3 px-8 py-3 text-sm text-white/70 hover:text-white"
                                >
                                  <sub.icon size={16} />
                                  <span>{sub.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            <nav className="nav-dropdown-container hidden lg:flex items-center space-x-1 h-12">
              {filteredNavItems.map((item) => (
                <div key={item.name} className="relative group h-full flex items-center">
                  {item.submenu ? (
                    <button
                      onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                      className={`flex items-center space-x-2 px-3 h-full text-sm transition-colors ${
                        openSubmenu === item.name ? 'bg-[var(--color-shell-hover)] text-white font-bold border-b-2 border-white' : 'text-white/80 hover:bg-[var(--color-shell-hover)] hover:text-white'
                      }`}
                    >
                      <item.icon size={16} />
                      <span>{item.name}</span>
                      <ChevronDown size={14} />
                    </button>
                  ) : (
                    <Link
                      href={item.path!}
                      className={`flex items-center space-x-2 px-3 h-full text-sm transition-colors ${
                        pathname === item.path ? 'bg-[var(--color-shell-hover)] text-white font-bold border-b-2 border-white' : 'text-white/80 hover:bg-[var(--color-shell-hover)] hover:text-white'
                      }`}
                    >
                      <item.icon size={16} />
                      <span>{item.name}</span>
                    </Link>
                  )}
                  
                  {item.submenu && openSubmenu === item.name && (
                    <div className="absolute top-full left-0 mt-0 w-48 bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] py-1 z-50">
                      {item.submenu.map(sub => (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          onClick={() => { setOpenSubmenu(null); }}
                          className="flex items-center space-x-2 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                        >
                          <sub.icon size={16} className="text-[var(--color-main)]" />
                          <span>{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <div className="lang-dropdown-container relative group flex items-center">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
                className="p-2 text-white/80 hover:bg-[var(--color-shell-hover)] rounded-full transition-colors flex items-center" 
                title={t('Change Language')}
              >
                <Globe size={16} />
              </button>
              {isLangMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] py-1 z-50 rounded-md">
                  <button onClick={() => changeLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">English</button>
                  <button onClick={() => changeLanguage('am')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">አማርኛ</button>
                  <button onClick={() => changeLanguage('om')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">Afaan Oromoo</button>
                </div>
              )}
            </div>
            <button onClick={toggleTheme} className="p-2 text-white/80 hover:bg-[var(--color-shell-hover)] rounded-full transition-colors" title={t('Toggle Theme')}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link href="/profile" className="flex items-center space-x-2 px-3 py-1 cursor-pointer hover:bg-[var(--color-shell-hover)] rounded-full transition-colors" title={`${profile?.name} - View Profile`}>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold border border-white/30 hover:scale-105 transition-transform">
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
            <button onClick={handleSignOut} className="p-2 text-white/80 hover:bg-red-500/80 hover:text-white rounded-full transition-colors" title={t('Sign Out')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
