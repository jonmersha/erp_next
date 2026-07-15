"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { seedDatabase } from '../utils/seedData';
import { fetchCollection } from '../utils/firestore';
import { 
  Factory as FactoryIcon,
  Warehouse, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Building2,
  MapPin,
  Phone,
  Settings,
  ClipboardList,
  Truck,
  Activity,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Product } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: any; trend?: number; color: string; onClick?: () => void }> = ({ title, value, icon: Icon, trend, color, onClick }) => {
  const { t } = useTranslation();
  return (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`bg-[var(--color-surface)] p-4 h-40 flex flex-col justify-between shadow-sm border-b-[3px] border-b-[var(--color-border)] hover:border-b-[var(--color-main)] transition-colors ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-start">
      <h3 className="text-[var(--color-text)] text-sm font-normal text-left max-w-[70%]">{title}</h3>
      <Icon size={20} className="text-[var(--color-main)] opacity-80" />
    </div>
    
    <div>
      <p className="text-3xl font-light text-[var(--color-text)] mt-1">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 text-xs font-medium mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}% {t('vs last month')}</span>
        </div>
      )}
    </div>
  </motion.div>
  );
};

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from '../components/Modal';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, profile, company } = useAuth();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [stats, setStats] = useState({
    factories: 0,
    warehouses: 0,
    outlets: 0,
    orders: 0,
    revenue: 0,
    lowStock: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allRuns, setAllRuns] = useState<any[]>([]);
  const [procurementStats, setProcurementStats] = useState<any[]>([]);
  const [planningStats, setPlanningStats] = useState<any[]>([]);

  const productionStats = React.useMemo(() => {
    const productSummary: Record<string, { name: string, actual: number, target: number }> = {};
    
    allRuns.forEach(run => {
      if (!productSummary[run.productId]) {
        const product = products.find(p => p.id === run.productId);
        productSummary[run.productId] = { name: product?.name || run.productName || 'Unknown', actual: 0, target: 0 };
      }
      productSummary[run.productId].actual += Number(run.actualQuantity || 0);
      productSummary[run.productId].target += Number(run.targetQuantity || 0);
    });

    return Object.values(productSummary).slice(0, 5);
  }, [allRuns, products]);



  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.companyId) return;
      
      try {
        const companyId = profile.companyId;
        
        // Fetch all data in parallel
        const results = await Promise.allSettled([
          fetchCollection('factories', companyId),
          fetchCollection('warehouses', companyId),
          fetchCollection('salesOrders', companyId),
          fetchCollection('inventory', companyId),
          fetchCollection('products', companyId),
          fetchCollection('salesOrders', companyId, { limitCount: 3, orderByField: 'createdAt', orderDir: 'desc' }),
          fetchCollection('productionRuns', companyId, { limitCount: 3, orderByField: 'startDate', orderDir: 'desc' }),
          fetchCollection('productionRuns', companyId),
          fetchCollection('procurementPlans', companyId),
          fetchCollection('productionPlans', companyId),
          fetchCollection('outlets', companyId)
        ]);

        const [
          factoriesData,
          warehousesData,
          ordersData,
          inventoryData,
          productsData,
          recentOrdersData,
          recentRunsData,
          allRunsData,
          procurementPlansData,
          productionPlansData,
          outletsData
        ] = results.map(r => r.status === 'fulfilled' ? r.value : []);

        if (results.some(r => r.status === 'rejected')) {
          console.warn('Some dashboard data failed to fetch');
        }

        // Update stats
        const totalRevenue = Array.isArray(ordersData) ? ordersData.reduce((acc: number, doc: any) => acc + Number(doc.totalAmount || 0), 0) : 0;
        const lowStockCount = Array.isArray(inventoryData) ? inventoryData.filter((doc: any) => doc.quantity < 100).length : 0;

        setStats({
          factories: Array.isArray(factoriesData) ? factoriesData.length : 0,
          warehouses: Array.isArray(warehousesData) ? warehousesData.length : 0,
          outlets: Array.isArray(outletsData) ? outletsData.length : 0,
          orders: Array.isArray(ordersData) ? ordersData.length : 0,
          revenue: totalRevenue,
          lowStock: lowStockCount
        });

        setProducts(Array.isArray(productsData) ? productsData : []);
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setRecentOrders(Array.isArray(recentOrdersData) ? recentOrdersData : []);
        setRecentRuns(Array.isArray(recentRunsData) ? recentRunsData : []);
        setAllRuns(Array.isArray(allRunsData) ? allRunsData : []);

        // Process Procurement Stats
        const procurementStatusCounts = { pending: 0, ordered: 0, received: 0 };
        if (Array.isArray(procurementPlansData)) {
          procurementPlansData.forEach((plan: any) => {
            const status = (plan.status || 'pending').toLowerCase();
            if (status in procurementStatusCounts) {
              procurementStatusCounts[status as keyof typeof procurementStatusCounts]++;
            }
          });
        }
        setProcurementStats([
          { name: 'Pending', value: procurementStatusCounts.pending, color: '#f59e0b' },
          { name: 'Ordered', value: procurementStatusCounts.ordered, color: '#3b82f6' },
          { name: 'Received', value: procurementStatusCounts.received, color: '#10b981' }
        ]);

        // Process Planning Stats
        const monthlyData: Record<string, number> = {};
        if (Array.isArray(productionPlansData)) {
          productionPlansData.forEach((plan: any) => {
            const date = new Date(plan.startDate || plan.createdAt || new Date());
            const month = date.toLocaleString('default', { month: 'short' });
            monthlyData[month] = Number(monthlyData[month] || 0) + Number(plan.totalQuantity || plan.targetQuantity || 0);
          });
        }
        setPlanningStats(Object.entries(monthlyData).map(([name, value]) => ({ name, value })));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    
    // Set up polling for "real-time" updates (every 30 seconds)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  return (
    <div className="space-y-6">
      {/* Company Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-8 h-28 overflow-hidden relative"
      >
        {/* Banner Background */}
        {company?.bannerUrl && (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)]/50 to-transparent z-10"></div>
            <img 
              src={company.bannerUrl} 
              alt={`${company.name} Banner`} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
        )}

        <div className="flex items-center space-x-6 shrink-0 z-10 relative w-fit max-w-full bg-[var(--color-surface)]/80 backdrop-blur-md p-4 rounded-2xl border border-[var(--color-border)]/50 shadow-sm">
          <div className="w-16 h-16 bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0 shadow-sm relative z-10 rounded-xl overflow-hidden">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Building2 size={24} className="text-[var(--color-main)]/60" />
            )}
          </div>
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-[var(--color-text)] drop-shadow-sm">{company?.name || t('Your Organization')}</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-[var(--color-text)]/90 drop-shadow-sm">
              {company?.address && (
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>{company.address}</span>
                </div>
              )}
              {company?.phone && (
                <div className="flex items-center space-x-1">
                  <Phone size={14} />
                  <span>{company.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>



      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--color-main)]">{t('Operational Overview')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1 text-sm">{t('Real-time performance metrics across all units')}</p>
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <button 
            onClick={() => router.push('/sales')}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--color-main)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={14} className="mr-1" /> {t('New Order')}
          </button>
          <button 
            onClick={() => router.push('/production')}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl text-xs font-bold hover:bg-[var(--color-bg)] transition-all"
          >
            <Plus size={14} className="mr-1 text-[var(--color-main)]" /> {t('New Run')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t("Active Factories")}
          value={stats.factories} 
          icon={FactoryIcon} 
          trend={12}
          color="bg-[var(--color-main)]" 
          onClick={() => router.push('/production')}
        />
        <StatCard 
          title={t("Total Revenue")}
          value={`$${stats.revenue.toLocaleString()}`} 
          icon={TrendingUp} 
          trend={8}
          color="bg-[var(--color-main)]" 
          onClick={() => router.push('/finance')}
        />
        <StatCard 
          title={t("Sales Orders")}
          value={stats.orders} 
          icon={ShoppingCart} 
          trend={-3}
          color="bg-[var(--color-main)]" 
          onClick={() => router.push('/sales')}
        />
        <StatCard 
          title={t("Low Stock Items")}
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color="bg-[var(--color-accent)]" 
          onClick={() => router.push('/inventory')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Product View */}
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Quick Product View')}</h3>
              <p className="text-sm text-[var(--color-text)]/40">{t('Top performing and key products')}</p>
            </div>
            <Package className="text-[var(--color-main)]" size={24} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map(product => {
              const productInventory = inventory.filter(i => i.productId === product.id);
              const totalStock = productInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
              return (
                <div key={product.id} className="p-4 rounded-2xl bg-[var(--color-bg)]/50 border border-[var(--color-text)]/20 transition-all hover:border-[var(--color-main)]/20">
                  <p className="font-bold text-[var(--color-text)] text-sm truncate">{product.name}</p>
                  <p className="text-xs text-[var(--color-text)]/40 mt-1">{product.category}</p>
                  <div className="mt-3 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Stock')}</p>
                      <p className={`text-sm font-bold ${totalStock < 100 ? 'text-rose-500' : 'text-[var(--color-text)]'}`}>{totalStock.toLocaleString()} {product.unit}</p>
                    </div>
                    <button 
                      onClick={() => router.push('/inventory')}
                      className="text-[10px] font-bold text-[var(--color-main)] hover:underline uppercase"
                    >
                      {t('Manage')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Stock Alerts')}</h3>
              <p className="text-sm text-[var(--color-text)]/40">{t('Items requiring immediate attention')}</p>
            </div>
            <AlertTriangle className="text-rose-500" size={24} />
          </div>
          <div className="space-y-4">
            {inventory.filter(i => i.quantity < 100).slice(0, 3).map((item, idx) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/30 border border-rose-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-rose-900 text-sm">{product?.name || item.productName || t('Unknown Product')}</p>
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{t('Low Stock: ')}{item.quantity.toLocaleString()}{t(' remaining')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push('/procurement')}
                    className="px-4 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors uppercase"
                  >
                    {t('Restock')}
                  </button>
                </div>
              );
            })}
            {inventory.filter(i => i.quantity < 100).length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm text-[var(--color-text)]/40">{t('All inventory levels are optimal.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Production Progress Chart */}
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Production Progress')}</h3>
              <p className="text-sm text-[var(--color-text)]/40">{t('Actual vs Target Quantity by Product')}</p>
            </div>
            <Activity className="text-[var(--color-main)]" size={24} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text)', opacity: 0.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text)', opacity: 0.5 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="target" fill="var(--color-bg)" radius={[4, 4, 0, 0]} name={t("Target")} />
                <Bar dataKey="actual" fill="var(--color-main)" radius={[4, 4, 0, 0]} name={t("Actual")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procurement Status Chart */}
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Procurement Status')}</h3>
              <p className="text-sm text-[var(--color-text)]/40">{t('Distribution of material plans')}</p>
            </div>
            <Truck className="text-[var(--color-main)]" size={24} />
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={procurementStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {procurementStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col space-y-2 ml-4">
              {procurementStats.map((stat, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-xs font-medium text-[var(--color-text)]/60">{stat.name}: {stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Planning Trend Chart */}
        <div className="lg:col-span-3 bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Planning Trend')}</h3>
              <p className="text-sm text-[var(--color-text)]/40">{t('Monthly target production volume')}</p>
            </div>
            <ClipboardList className="text-[var(--color-main)]" size={24} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={planningStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text)', opacity: 0.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text)', opacity: 0.5 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--color-main)" strokeWidth={3} dot={{ r: 6, fill: 'var(--color-main)', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 8 }} name={t("Planned Qty")} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Recent Sales Orders */}
          <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Recent Sales Orders')}</h3>
              <button 
                onClick={() => router.push('/sales')}
                className="text-sm font-medium text-[var(--color-main)] hover:underline"
              >
                {t('View All')}
              </button>
            </div>
            <div className="space-y-4">
              {recentOrders.length === 0 && <p className="text-sm text-[var(--color-text)]/40">{t('No recent sales orders.')}</p>}
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg)]/50 border border-[var(--color-text)]/20 cursor-pointer hover:bg-[var(--color-text)]/80 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[var(--color-surface)] rounded-xl flex items-center justify-center shadow-sm">
                      <ShoppingCart size={20} className="text-[var(--color-main)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{order.outletName || t('Unknown Outlet')}</p>
                      <p className="text-xs text-[var(--color-text)]/40">{order.items?.length || 0} {t('items')} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--color-text)]">${(order.totalAmount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'text-emerald-600 bg-emerald-50' : 
                      order.status === 'shipped' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Production Runs */}
          <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">{t('Manufacturing Schedule')}</h3>
              <button 
                onClick={() => router.push('/production')}
                className="text-sm font-medium text-[var(--color-main)] hover:underline"
              >
                {t('View All')}
              </button>
            </div>
            <div className="space-y-4">
              {recentRuns.length === 0 && <p className="text-sm text-[var(--color-text)]/40">{t('No recent production runs.')}</p>}
                {recentRuns.map((run) => {
                  const progress = run.quantity > 0 ? Math.round((run.quantityProduced / run.quantity) * 100) : 0;
                  return (
                    <div 
                      key={run.id} 
                      onClick={() => setSelectedRun(run)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg)]/50 border border-[var(--color-text)]/20 cursor-pointer hover:bg-[var(--color-text)]/80 transition-all"
                    >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[var(--color-surface)] rounded-xl flex items-center justify-center shadow-sm">
                        <FactoryIcon size={20} className="text-[var(--color-main)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text)]">
                          {products.find(p => p.id === run.productId)?.name || run.productName || t('Unknown Product')}
                        </p>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <p className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest">
                            {(run.quantityProduced || 0).toLocaleString()} / {(run.quantity || 0).toLocaleString()} {t('units')}
                          </p>
                          {run.status !== 'completed' && (
                            <span className="text-[10px] font-bold text-[var(--color-main)] uppercase tracking-widest">
                              • {((run.quantity || 0) - (run.quantityProduced || 0)).toLocaleString()}{t(' left')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-1">
                      <div className="w-24 h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-main)]" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
                        run.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 
                        run.status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                      }`}>
                        {run.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 p-8">
          <h3 className="text-xl font-serif font-bold text-[var(--color-text)] mb-8">{t('Unit Distribution')}</h3>
          <div className="space-y-6">
            <div className="space-y-2 cursor-pointer group" onClick={() => router.push('/production')}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]/60 group-hover:text-[var(--color-main)] transition-colors">{t('Factories')}</span>
                <span className="font-bold">{stats.factories}</span>
              </div>
              <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-main)]" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="space-y-2 cursor-pointer group" onClick={() => router.push('/inventory')}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]/60 group-hover:text-blue-600 transition-colors">{t('Warehouses')}</span>
                <span className="font-bold">{stats.warehouses}</span>
              </div>
              <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="space-y-2 cursor-pointer group" onClick={() => router.push('/sales')}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]/60 group-hover:text-amber-500 transition-colors">{t('Retail Outlets')}</span>
                <span className="font-bold">{stats.outlets}</span>
              </div>
              <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(stats.outlets * 10, 100)}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-6 rounded-2xl bg-[var(--color-main)] text-white">
            <h4 className="font-bold mb-2">{t('System Status')}</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              {t('All systems operational. Last sync: ')}{new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={t("Sales Order Details")}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Order ID')}</p>
                <p className="text-lg font-mono font-bold text-[var(--color-main)]">#{selectedOrder.id?.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Status')}</p>
                <span className={`inline-block mt-1 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                  selectedOrder.status === 'delivered' ? 'text-emerald-600 bg-emerald-50' : 
                  selectedOrder.status === 'shipped' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                }`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Customer Outlet')}</p>
                <p className="font-bold text-[var(--color-text)]">{selectedOrder.outletName || t('Unknown Outlet')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Order Date')}</p>
                <p className="font-bold text-[var(--color-text)]">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Order Items')}</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20">
                    <div>
                      <p className="font-bold text-sm text-[var(--color-text)]">{item.productName}</p>
                      <p className="text-xs text-[var(--color-text)]/40">{t('Qty: ')}{item.quantity} × ${item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-bold text-[var(--color-text)]">${(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-text)]/20 flex justify-between items-center">
              <p className="text-sm font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Total Amount')}</p>
              <p className="text-2xl font-serif font-bold text-[var(--color-text)]">
                ${(selectedOrder.totalAmount || 0).toLocaleString()}
              </p>
            </div>

            <button 
              onClick={() => {
                setSelectedOrder(null);
                router.push('/sales');
              }}
              className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
            >
              {t('Go to Sales Management')}
            </button>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={!!selectedRun} 
        onClose={() => setSelectedRun(null)} 
        title={t("Production Run Details")}
      >
        {selectedRun && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Run ID')}</p>
                <p className="font-mono font-bold text-[var(--color-main)]">#{selectedRun.id.slice(0, 12)}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Status')}</p>
                <div className={`inline-block mt-1 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                  selectedRun.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 
                  selectedRun.status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                }`}>
                  {selectedRun.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[var(--color-main)]/10 rounded-2xl text-[var(--color-main)]">
                  <FactoryIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">{t('Product')}</p>
                  <p className="font-bold text-[var(--color-text)]">
                    {products.find(p => p.id === selectedRun.productId)?.name || selectedRun.productName || t('Unknown Product')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-bg)] p-6 rounded-3xl border border-[var(--color-text)]/20">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Production Progress')}</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {((selectedRun.quantityProduced || 0)).toLocaleString()} / {((selectedRun.quantity || 0)).toLocaleString()}
                    <span className="text-sm text-[var(--color-text)]/40 ml-2">{t('units')}</span>
                  </p>
                  {selectedRun.status !== 'completed' && (
                    <p className="text-xs text-[var(--color-main)]/60 mt-1">
                      {((selectedRun.quantity || 0) - (selectedRun.quantityProduced || 0)).toLocaleString()} {t('units remaining')}
                    </p>
                  )}
                </div>
                <p className="text-xl font-bold text-[var(--color-main)]">
                  {selectedRun.quantity > 0 ? Math.round((selectedRun.quantityProduced / selectedRun.quantity) * 100) : 0}%
                </p>
              </div>
              <div className="h-3 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-main)] rounded-full"
                  style={{ width: `${selectedRun.quantity > 0 ? (selectedRun.quantityProduced / selectedRun.quantity) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Start Date')}</p>
                <p className="font-medium text-[var(--color-text)]">{new Date(selectedRun.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Last Updated')}</p>
                <p className="font-medium text-[var(--color-text)]">
                  {selectedRun.updatedAt ? new Date(selectedRun.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                setSelectedRun(null);
                router.push('/production');
              }}
              className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
            >
              {t('Go to Production Management')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
