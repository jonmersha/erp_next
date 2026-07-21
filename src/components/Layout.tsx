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
  Globe,
  HelpCircle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import HelpTooltip from './common/HelpTooltip';
import Modal from './Modal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, can, isAdmin, company, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const { t, i18n } = useTranslation();

  const PAGE_HELP_MAPPING: Record<string, { title: string, content: string }> = {
    '/': {
      title: 'Dashboard',
      content: 'Welcome to the Main Dashboard. This is your central command center for the ERP system.\n\nKey Capabilities:\n• View high-level Key Performance Indicators (KPIs) across all departments.\n• Monitor real-time system alerts, pending approvals, and low stock warnings.\n• Access quick links to frequently used modules like Procurement and Sales.\n\nTip: You can customize your widget layout in your profile settings.'
    },
    '/reports': {
      title: 'Reports & Analytics',
      content: 'The Reports & Analytics module provides deep, data-driven insights into your business operations.\n\nKey Capabilities:\n• Generate financial, operational, and sales reports using real-time data.\n• Export data visualizations (charts, graphs) to PDF or Excel for external sharing.\n• Build custom BI dashboards tailored to your department’s specific metrics.\n\nTip: Use the date range filters to compare current performance against historical data.'
    },
    '/supply-chain/sourcing': {
      title: 'Strategic Sourcing',
      content: 'Strategic Sourcing helps you identify, evaluate, and negotiate with suppliers to optimize procurement costs.\n\nKey Capabilities:\n• Compare supplier bids and analyze historical pricing trends.\n• Manage supplier contracts, SLAs, and compliance documentation.\n• Track supplier risk and performance scoring over time.'
    },
    '/procurement': {
      title: 'Procurement',
      content: 'The Procurement module manages the entire lifecycle of purchasing goods and services.\n\nKey Capabilities:\n• Create and manage Purchase Requisitions (PR) and Purchase Orders (PO).\n• Onboard new suppliers (Note: Requires managerial approval via the Maker-Checker system).\n• Track delivery statuses and reconcile received goods against original orders.\n\nImportant: To prevent fraud, the user who creates a supplier cannot be the one who approves them.'
    },
    '/inventory': {
      title: 'Warehouse Management',
      content: 'Warehouse Management tracks physical stock levels and controls the movement of goods.\n\nKey Capabilities:\n• Monitor real-time inventory levels for raw materials and finished goods.\n• Manage goods receipts, internal stock transfers, and dispatching.\n• Set up automated reorder points to prevent stockouts.\n\nTip: Use the barcode scanning feature (if enabled) to quickly update stock quantities during cycle counts.'
    },
    '/supply-chain/material-planning': {
      title: 'Material Planning',
      content: 'Material Requirements Planning (MRP) ensures you have the right materials available for production exactly when needed.\n\nKey Capabilities:\n• Generate material forecasts based on upcoming sales orders and production schedules.\n• Automatically calculate required purchasing quantities to fulfill manufacturing demands.\n• Identify potential material shortages before they impact the factory floor.'
    },
    '/supply-chain/traceability': {
      title: 'Batch Traceability',
      content: 'Batch Traceability provides complete end-to-end visibility of your supply chain.\n\nKey Capabilities:\n• Track finished goods back to their original raw material lots and suppliers.\n• Rapidly identify affected products in the event of a quality recall.\n• Ensure compliance with strict industry and safety regulations.'
    },
    '/planning': {
      title: 'Production Planning',
      content: 'Production Planning helps you schedule and optimize manufacturing operations.\n\nKey Capabilities:\n• Create and prioritize Production Orders based on customer demand.\n• Allocate factory resources, machinery, and labor to specific batches.\n• Use the interactive Gantt chart to visualize the manufacturing schedule and resolve bottlenecks.'
    },
    '/recipes': {
      title: 'Bill of Materials',
      content: 'The Bill of Materials (BOM) module manages the exact recipes and sub-components required to build your products.\n\nKey Capabilities:\n• Define hierarchical BOMs for complex, multi-stage manufacturing.\n• Manage version control for product recipes and formulas.\n• Calculate theoretical production costs based on the latest raw material prices.'
    },
    '/manufacturing/consumption': {
      title: 'Material Consumption',
      content: 'Material Consumption tracks the real-time usage of raw materials during the manufacturing process.\n\nKey Capabilities:\n• Record the exact quantities of materials issued to the factory floor.\n• Report material scrap, waste, or spoilage for accurate cost accounting.\n• Automatically deduct consumed materials from warehouse inventory.'
    },
    '/production': {
      title: 'Work-in-Progress Tracking',
      content: 'Work-in-Progress (WIP) Tracking monitors active production orders as they move through the factory.\n\nKey Capabilities:\n• Track the real-time stage and completion percentage of manufacturing batches.\n• Identify stalled orders and investigate production delays.\n• Capture direct labor hours associated with specific production runs.'
    },
    '/factory-floor': {
      title: 'Factory Floor',
      content: 'The Factory Floor dashboard provides a live, operational view of manufacturing activities.\n\nKey Capabilities:\n• Monitor real-time machine statuses (Running, Idle, Maintenance).\n• Track Overall Equipment Effectiveness (OEE) and production yield.\n• Allow machine operators to log production outputs directly via tablets or kiosks.'
    },
    '/workflow-templates': {
      title: 'Workflow Templates',
      content: 'Workflow Templates allow administrators to design custom approval matrices and operational procedures.\n\nKey Capabilities:\n• Define multi-step approval chains based on document types and monetary thresholds.\n• Automate email and system notifications for pending tasks.\n• Standardize business processes across the organization.'
    },
    '/quality/laboratory': {
      title: 'Laboratory Management',
      content: 'Laboratory Management (LIMS) tracks scientific testing and quality analysis.\n\nKey Capabilities:\n• Schedule and manage laboratory tests for raw materials and finished goods.\n• Record precise testing parameters, chemical compositions, and scientific results.\n• Automatically flag samples that fall outside of acceptable quality tolerances.'
    },
    '/quality/inspections': {
      title: 'Inspections',
      content: 'The Inspections module facilitates routine quality checks on the production line and receiving docks.\n\nKey Capabilities:\n• Create digital inspection checklists for different product categories.\n• Record pass/fail results, attach photos, and log inspector notes.\n• Automatically trigger Non-Conformance reports for failed inspections.'
    },
    '/quality/non-conformance': {
      title: 'Non-Conformance Management',
      content: 'Non-Conformance Management (NCMR) handles quality deviations and defective materials.\n\nKey Capabilities:\n• Log and track defective products or supplier material issues.\n• Assign Root Cause Analysis (RCA) tasks and corrective/preventative actions (CAPA).\n• Manage the quarantine, rework, or disposal of non-conforming inventory.'
    },
    '/quality': {
      title: 'Quality Assurance',
      content: 'The Quality Assurance dashboard provides an overview of your organization’s quality compliance metrics.\n\nKey Capabilities:\n• Monitor overall defect rates, first-pass yields, and supplier quality scores.\n• Ensure compliance with ISO standards and internal quality policies.\n• Track the resolution time for open Non-Conformance reports.'
    },
    '/maintenance': {
      title: 'Maintenance',
      content: 'The Maintenance module ensures your factory equipment and vehicles remain in optimal working condition.\n\nKey Capabilities:\n• Schedule preventative maintenance tasks based on calendar dates or usage meters.\n• Log unexpected equipment breakdowns and generate emergency work orders.\n• Manage spare parts inventory and track maintenance labor costs.'
    },
    '/finance/general-ledger': {
      title: 'General Ledger',
      content: 'The General Ledger is the core of the financial system, recording all accounting transactions.\n\nKey Capabilities:\n• Manage the centralized Chart of Accounts.\n• Create, review, and post manual journal entries.\n• Generate foundational financial statements like the Balance Sheet and Income Statement.'
    },
    '/finance/ap-ar': {
      title: 'Accounts Payable/Receivable',
      content: 'Accounts Payable (AP) and Accounts Receivable (AR) track the money entering and leaving the business.\n\nKey Capabilities:\n• Process incoming supplier bills and schedule outbound payments (AP).\n• Generate customer invoices, track aging receivables, and manage credit limits (AR).\n• Reconcile bank statements against system transactions.'
    },
    '/finance/assets': {
      title: 'Fixed Assets',
      content: 'The Fixed Assets module tracks the lifecycle and value of physical company properties.\n\nKey Capabilities:\n• Register new assets like factory machinery, vehicles, and IT equipment.\n• The system automatically calculates and posts monthly depreciation (e.g., Straight-Line or Declining Balance).\n• Track asset locations, maintenance history, and eventual disposal/sale.'
    },
    '/finance': {
      title: 'Advanced Cost Accounting',
      content: 'Cost Accounting analyzes the exact costs associated with running the business and manufacturing goods.\n\nKey Capabilities:\n• Calculate the true profitability per unit by absorbing overhead, labor, and direct material costs.\n• Identify cost variances by comparing standard theoretical costs against actual incurred costs.\n• Optimize pricing strategies based on accurate margin analysis.'
    },
    '/crm': {
      title: 'Customer Management',
      content: 'Customer Relationship Management (CRM) tracks all interactions with your clients and prospects.\n\nKey Capabilities:\n• Maintain a centralized database of customer contact information and organizational hierarchies.\n• Track communication history, meeting notes, and sales opportunities.\n• Manage customer support tickets and track resolution metrics.'
    },
    '/sales/pricing': {
      title: 'Dynamic Pricing',
      content: 'The Dynamic Pricing engine allows you to configure complex rules that automatically adjust sales prices.\n\nKey Capabilities:\n• Create rules for volume discounts (e.g., "10% off for >100 units").\n• Apply specific pricing tiers for VIP customers, seasonal events, or promotional campaigns.\n• Use the interactive Price Simulator to test your rules before pushing them live.'
    },
    '/sales/billing': {
      title: 'Billing',
      content: 'The Billing module handles the generation of invoices and the collection of revenue.\n\nKey Capabilities:\n• Automatically generate invoices from fulfilled Sales Orders.\n• Process customer payments via various methods (bank transfer, credit card).\n• Automatically integrate with the General Ledger to record revenue and taxation.'
    },
    '/sales': {
      title: 'Sales Orders',
      content: 'The Sales Orders module manages the entire order-to-cash process.\n\nKey Capabilities:\n• Create formal sales quotes and convert them into active Sales Orders.\n• Check real-time inventory availability before confirming orders.\n• Track order fulfillment, backorders, and shipping statuses.'
    },
    '/logistics': {
      title: 'Logistics & Delivery',
      content: 'Logistics & Delivery manages the physical transportation of goods to customers.\n\nKey Capabilities:\n• Plan and optimize delivery routes for the company fleet.\n• Track shipment statuses, proof of delivery, and driver logs.\n• Manage integrations with third-party shipping carriers.'
    },
    '/admin': {
      title: 'Admin Panel',
      content: 'The Admin Panel is the secure configuration area for system administrators.\n\nKey Capabilities:\n• Manage User accounts, passwords, and Role-Based Access Control (RBAC).\n• Configure global system settings, currency defaults, and localization options.\n• View security audit logs to track sensitive system changes.'
    }
  };

  const getHelpForCurrentPath = () => {
    // Exact match
    if (PAGE_HELP_MAPPING[pathname]) return PAGE_HELP_MAPPING[pathname];
    // Prefix match for nested routes
    const matches = Object.keys(PAGE_HELP_MAPPING).filter(key => key !== '/' && pathname.startsWith(key));
    if (matches.length > 0) return PAGE_HELP_MAPPING[matches[0]];
    return { title: 'System Help', content: 'Welcome to the ERP system. Select a module from the navigation bar to get started.' };
  };

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
    await logout();
  };

  const navItems = [
    {
      name: t('Dashboard'),
      path: '/',
      icon: LayoutDashboard,
      alwaysShow: true
    },
    {
      name: t('Reports & Analytics'),
      path: '/reports',
      icon: TrendingUp,
      alwaysShow: true
    },
    {
      name: t('Supply Chain & Inventory'),
      icon: Truck,
      submenu: [
        { name: t('Strategic Sourcing'), path: '/supply-chain/sourcing', icon: Package, module: 'procurement' },
        { name: t('Procurement'), path: '/procurement', icon: ShoppingCart, module: 'procurement' },
        { name: t('Warehouse Management'), path: '/inventory', icon: Warehouse, module: 'inventory' },
        { name: t('Material Planning'), path: '/supply-chain/material-planning', icon: Package, module: 'inventory' },
        { name: t('Batch Traceability'), path: '/supply-chain/traceability', icon: Package, module: 'inventory' },
      ]
    },
    {
      name: t('Manufacturing Operations'),
      icon: Factory,
      submenu: [
        { name: t('Production Planning'), path: '/planning', icon: Calendar, module: 'planning' },
        { name: t('Bill of Materials'), path: '/recipes', icon: BookOpen, module: 'recipes' },
        { name: t('Material Consumption'), path: '/manufacturing/consumption', icon: Factory, module: 'production' },
        { name: t('Work-in-Progress Tracking'), path: '/production', icon: Factory, module: 'production' },
        { name: t('Factory Floor'), path: '/factory-floor', icon: Factory, module: 'production' },
        { name: t('Workflow Templates'), path: '/workflow-templates', icon: Database, module: 'production' },
      ]
    },
    {
      name: t('Quality Management'),
      icon: CheckCircle2,
      submenu: [
        { name: t('Laboratory Management'), path: '/quality/laboratory', icon: CheckCircle2, module: 'quality' },
        { name: t('Quality Assurance'), path: '/quality', icon: CheckCircle2, module: 'quality' },
        { name: t('Inspections'), path: '/quality/inspections', icon: CheckCircle2, module: 'quality' },
        { name: t('Non-Conformance Management'), path: '/quality/non-conformance', icon: CheckCircle2, module: 'quality' },
        { name: t('Maintenance'), path: '/maintenance', icon: Wrench, module: 'maintenance' },
      ]
    },
    {
      name: t('Finance & Accounting'),
      icon: CreditCard,
      submenu: [
        { name: t('General Ledger'), path: '/finance/general-ledger', icon: CreditCard, module: 'finance' },
        { name: t('Accounts Payable/Receivable'), path: '/finance/ap-ar', icon: CreditCard, module: 'finance' },
        { name: t('Fixed Assets'), path: '/finance/assets', icon: CreditCard, module: 'finance' },
        { name: t('Advanced Cost Accounting'), path: '/finance', icon: CreditCard, module: 'finance' },
      ]
    },
    {
      name: t('Sales & Distribution'),
      icon: Users,
      submenu: [
        { name: t('Customer Management'), path: '/crm', icon: Users, module: 'sales' },
        { name: t('Sales Orders'), path: '/sales', icon: TrendingUp, module: 'sales' },
        { name: t('Dynamic Pricing'), path: '/sales/pricing', icon: TrendingUp, module: 'sales' },
        { name: t('Logistics & Delivery'), path: '/logistics', icon: Truck, module: 'logistics' },
        { name: t('Billing'), path: '/sales/billing', icon: CreditCard, module: 'sales' },
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

    if ('module' in item && item.module) {
      return can('read', item.module) ? item : null;
    }

    return null;
  }).filter(Boolean) as typeof navItems;

  // Auto-expand sidebar submenu based on current route
  useEffect(() => {
    setIsMobileMenuOpen(false);

    const activeParent = navItems.find(item =>
      item.submenu?.some(sub => pathname === sub.path || pathname.startsWith(sub.path + '/'))
    );

    if (activeParent) {
      setOpenSubmenu(activeParent.name);
    }
    // We intentionally don't set it to null here so that clicking a new menu doesn't immediately close it 
    // unless explicitly closed by the user or if they navigate to a completely different top-level section.
    // Actually, setting to null if there's no activeParent is good for top-level links like Dashboard.
    else if (!openSubmenu || !navItems.find(item => item.name === openSubmenu)?.submenu) {
      setOpenSubmenu(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">

      {/* Sidebar for Tablet (md to lg) */}
      <aside className={`w-64 bg-[var(--color-shell)] text-[var(--color-shell-text)] hidden xl:hidden flex-col h-full shadow-lg z-20 flex-shrink-0 nav-dropdown-container ${isDesktopSidebarOpen ? 'md:flex' : ''}`}>
        <div className="w-full px-6 h-16 flex items-center border-b border-black/10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Company Logo" className="h-8 w-8 object-contain rounded bg-white/10" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                <Factory size={16} className="text-white/60" />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-white truncate">
              {company?.name || 'Sheger ERP'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {filteredNavItems.map((item) => (
            <div key={item.name} className="w-full">
              {item.submenu ? (
                <button
                  onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                  className={`flex items-center justify-between w-full px-6 py-3 text-sm transition-colors ${openSubmenu === item.name ? 'bg-[var(--color-shell-hover)] text-white border-l-4 border-white' : 'text-white/80 hover:bg-[var(--color-shell-hover)] hover:text-white border-l-4 border-transparent'}`}
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
                  className={`flex items-center space-x-3 px-6 py-3 text-sm transition-colors ${pathname === item.path ? 'bg-[var(--color-shell-hover)] text-white border-l-4 border-white' : 'text-white/80 hover:bg-[var(--color-shell-hover)] hover:text-white border-l-4 border-transparent'}`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              )}

              {item.submenu && openSubmenu === item.name && (
                <div className="bg-[var(--color-shell-hover)]/50 py-1">
                  {item.submenu.map(sub => (
                    <Link
                      key={sub.path}
                      href={sub.path}
                      className={`flex items-center space-x-3 pl-12 pr-6 py-2.5 text-sm transition-colors ${pathname === sub.path ? 'text-white font-bold' : 'text-white/70 hover:text-white'}`}
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Tablet/Mobile Header (Hidden on lg) */}
        <header className="bg-[var(--color-surface)] text-[var(--color-text)] border-b border-[var(--color-border)] sticky top-0 z-10 shadow-sm flex-shrink-0 xl:hidden">
          <div className="w-full px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-lg md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <button
                className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-lg hidden md:block"
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-2">
                {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Company Logo" className="h-8 w-8 object-contain rounded border border-[var(--color-border)]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-8 w-8 rounded bg-[var(--color-main)] flex items-center justify-center text-white">
                    <Factory size={16} />
                  </div>
                )}
                <span className="text-lg font-bold tracking-tight">
                  {company?.name || 'ERP'}
                </span>
              </div>
            </div>

            {/* Desktop spacer to push icons to the right if there's no mobile menu button */}
            <div className="hidden md:block flex-1" />

            {/* Tablet/Mobile Tools */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="lang-dropdown-container relative group flex items-center">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-full transition-colors flex items-center"
                  title={t('Change Language')}
                >
                  <Globe size={20} />
                </button>
                {isLangMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] py-1 z-50 rounded-md">
                    <button onClick={() => changeLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">English</button>
                    <button onClick={() => changeLanguage('am')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">አማርኛ</button>
                    <button onClick={() => changeLanguage('om')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]">Afaan Oromoo</button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsHelpOpen(true)} className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-full transition-colors" title={t('Help')}>
                <HelpCircle size={20} />
              </button>
              <button onClick={toggleTheme} className="p-2 text-[var(--color-text)]/80 hover:bg-[var(--color-text)]/5 rounded-full transition-colors" title={t('Toggle Theme')}>
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <Link href="/profile" className="flex items-center space-x-2 px-2 py-1 ml-1 cursor-pointer hover:bg-[var(--color-text)]/5 rounded-full transition-colors" title={`${profile?.name} - View Profile`}>
                <div className="w-8 h-8 rounded-full bg-[var(--color-main)] flex items-center justify-center text-white text-sm font-bold shadow-sm hover:scale-105 transition-transform">
                  {profile?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button onClick={handleSignOut} className="p-2 text-[var(--color-text)]/80 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors" title={t('Sign Out')}>
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Header (Top Nav) (Hidden on < lg) */}
        <header className="bg-[var(--color-shell)] text-[var(--color-shell-text)] border-b border-black/10 hidden xl:flex flex-col sticky top-0 z-50 shadow-sm w-full flex-shrink-0">
          <div className="w-full px-4 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Company Logo" className="h-8 w-8 object-contain rounded bg-white/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                    <Factory size={16} className="text-white/60" />
                  </div>
                )}
                <span className="text-xl font-bold tracking-tight text-white">
                  {company?.name || 'Sheger ERP'}
                </span>
              </div>

              {/* Desktop Top Nav items */}
              <nav className="nav-dropdown-container flex items-center space-x-1 h-14 ml-4">
                {filteredNavItems.map((item) => (
                  <div key={item.name} className="relative group h-full flex items-center">
                    {item.submenu ? (
                      <button
                        onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                        className={`flex items-center space-x-2 px-3 h-full text-sm transition-colors ${openSubmenu === item.name ? 'bg-[var(--color-shell-hover)] text-white font-bold border-b-2 border-white' : 'text-white/80 hover:bg-[var(--color-shell-hover)] hover:text-white'
                          }`}
                      >
                        <item.icon size={16} />
                        <span>{item.name}</span>
                        <ChevronDown size={14} />
                      </button>
                    ) : (
                      <Link
                        href={item.path!}
                        className={`flex items-center space-x-2 px-3 h-full text-sm transition-colors ${pathname === item.path ? 'bg-[var(--color-shell-hover)] text-white font-bold border-b-2 border-white' : 'text-white/80 hover:bg-[var(--color-shell-hover)] hover:text-white'
                          }`}
                      >
                        <item.icon size={16} />
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {item.submenu && openSubmenu === item.name && (
                      <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)] py-1 z-50 rounded-b-md">
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

            {/* Desktop Tools */}
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
              <button onClick={() => setIsHelpOpen(true)} className="p-2 text-white/80 hover:bg-[var(--color-shell-hover)] rounded-full transition-colors" title={t('Help')}>
                <HelpCircle size={16} />
              </button>
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

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="fixed top-0 left-0 h-full w-64 bg-[var(--color-shell)] z-50 flex flex-col md:hidden pt-16 shadow-xl"
              >
                <nav className="flex flex-col h-full overflow-y-auto nav-dropdown-container">
                  {filteredNavItems.map((item) => (
                    <div key={item.name} className="w-full">
                      {item.submenu ? (
                        <button
                          onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                          className={`flex items-center justify-between w-full px-6 py-4 text-sm transition-colors text-white/80 hover:bg-[var(--color-shell-hover)]`}
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
                          className={`flex items-center space-x-3 px-6 py-4 text-sm transition-colors text-white/80 hover:bg-[var(--color-shell-hover)]`}
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
                              className="flex items-center space-x-3 px-10 py-3.5 text-sm text-left text-white/70 hover:text-white"
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

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 relative">
          {children}
        </main>
      </div>
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title={`${t('Help')}: ${t(getHelpForCurrentPath().title)}`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4 text-[var(--color-text)]/80">
            <div className="p-3 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl shrink-0">
              <Info size={24} />
            </div>
            <p className="leading-relaxed text-base whitespace-pre-line">
              {t(getHelpForCurrentPath().content)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--color-text)]/10 text-xs text-[var(--color-text)]/50">
            {t('For detailed documentation or technical support, please contact your system administrator.')}
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Layout;
