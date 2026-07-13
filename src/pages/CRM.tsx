"use client";
import React, { useState, useMemo } from 'react';
import { useCRMData, Customer, Ticket, Interaction } from '../hooks/useCRMData';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageSquare, Activity, Plus, Search, Loader2, Phone, Mail, MapPin, 
  XCircle, CheckCircle2, AlertCircle, Edit2, Trash2, ChevronRight, BarChart2, PieChart
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CRM: React.FC = () => {
  const { customers, tickets, interactions, loading, createCustomer, updateCustomer, deleteCustomer, createTicket, updateTicket, createInteraction } = useCRMData();
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets' | 'interactions' | 'reports'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  
  // Editing state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  
  // View Profile
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  // Forms
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [ticketForm, setTicketForm] = useState({ customerId: '', type: 'inquiry', status: 'open', resolutionNotes: '' });
  const [interactionForm, setInteractionForm] = useState({ customerId: '', interactionType: 'general', notes: '' });

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTickets = tickets.filter(t => t.id.includes(searchTerm) || customers.find(c => c.id === t.customer_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInteractions = interactions.filter(i => i.notes.toLowerCase().includes(searchTerm.toLowerCase()));

  // Submit Handlers
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, customerForm);
      if (viewCustomer && viewCustomer.id === editingCustomer.id) {
        setViewCustomer({ ...viewCustomer, ...customerForm } as Customer);
      }
    } else {
      await createCustomer(customerForm);
    }
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
    setCustomerForm({ name: '', phone: '', email: '', address: '' });
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This will also delete their tickets and interactions.')) {
      await deleteCustomer(id);
      if (viewCustomer?.id === id) setViewCustomer(null);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTicket) {
      await updateTicket(editingTicket.id, {
        type: ticketForm.type as any,
        status: ticketForm.status as any,
        resolution_notes: ticketForm.resolutionNotes
      });
    } else {
      await createTicket({
        customer_id: ticketForm.customerId,
        type: ticketForm.type as any,
        status: ticketForm.status as any,
        resolution_notes: ticketForm.resolutionNotes
      });
    }
    setIsTicketModalOpen(false);
    setEditingTicket(null);
    setTicketForm({ customerId: '', type: 'inquiry', status: 'open', resolutionNotes: '' });
  };

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInteraction({
      customer_id: interactionForm.customerId,
      interaction_type: interactionForm.interactionType as any,
      notes: interactionForm.notes
    });
    setIsInteractionModalOpen(false);
    setInteractionForm({ customerId: '', interactionType: 'general', notes: '' });
  };

  // Open Edit Modals
  const openEditCustomer = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setIsCustomerModalOpen(true);
  };

  const openEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTicketForm({
      customerId: ticket.customer_id,
      type: ticket.type,
      status: ticket.status,
      resolutionNotes: ticket.resolution_notes || ''
    });
    setIsTicketModalOpen(true);
  };

  // Chart Data Preparation
  const ticketsByStatus = useMemo(() => {
    const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return Object.keys(counts).map(k => ({ name: k.replace('_', ' '), value: counts[k as keyof typeof counts] }));
  }, [tickets]);

  const ticketsByType = useMemo(() => {
    const counts = { inquiry: 0, complaint: 0, feedback: 0 };
    tickets.forEach(t => { if (counts[t.type] !== undefined) counts[t.type]++; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k as keyof typeof counts] }));
  }, [tickets]);

  const interactionsByDate = useMemo(() => {
    const dates: Record<string, number> = {};
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    
    last30Days.forEach(d => dates[d] = 0);
    interactions.forEach(i => {
      const d = i.interaction_date.split('T')[0];
      if (dates[d] !== undefined) dates[d]++;
    });

    return last30Days.map(d => ({ date: d.substring(5), count: dates[d] }));
  }, [interactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">CRM</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Manage customers, support tickets, and interactions.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setEditingCustomer(null);
              setCustomerForm({ name: '', phone: '', email: '', address: '' });
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--color-main)]/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={16} />
            <span>New Customer</span>
          </button>
        </div>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Total Customers</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{customers.length}</h3>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <MessageSquare size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Open Tickets</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length}</h3>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Total Interactions</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{interactions.length}</h3>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-text)]/5 overflow-hidden">
        <div className="border-b border-[var(--color-text)]/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-6 overflow-x-auto">
            <button onClick={() => setActiveTab('customers')} className={`pb-4 border-b-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'customers' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}>
              <div className="flex items-center space-x-2"><Users size={18} /><span>Customers</span></div>
            </button>
            <button onClick={() => setActiveTab('tickets')} className={`pb-4 border-b-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'tickets' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}>
              <div className="flex items-center space-x-2"><MessageSquare size={18} /><span>Tickets</span></div>
            </button>
            <button onClick={() => setActiveTab('interactions')} className={`pb-4 border-b-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'interactions' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}>
              <div className="flex items-center space-x-2"><Activity size={18} /><span>Interactions</span></div>
            </button>
            <button onClick={() => setActiveTab('reports')} className={`pb-4 border-b-2 font-medium whitespace-nowrap transition-colors ${activeTab === 'reports' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}>
              <div className="flex items-center space-x-2"><BarChart2 size={18} /><span>Reports</span></div>
            </button>
          </div>
          {activeTab !== 'reports' && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40" size={16} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-[var(--color-text)]/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none w-64" />
              </div>
              {activeTab === 'tickets' && (
                <button onClick={() => { setEditingTicket(null); setTicketForm({ customerId: '', type: 'inquiry', status: 'open', resolutionNotes: '' }); setIsTicketModalOpen(true); }} className="p-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl hover:bg-[var(--color-main)]/20 transition-colors">
                  <Plus size={16} />
                </button>
              )}
              {activeTab === 'interactions' && (
                <button onClick={() => { setInteractionForm({ customerId: '', interactionType: 'general', notes: '' }); setIsInteractionModalOpen(true); }} className="p-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl hover:bg-[var(--color-main)]/20 transition-colors">
                  <Plus size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6 overflow-x-auto min-h-[400px]">
          {activeTab === 'customers' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text)]/40 border-b border-[var(--color-text)]/5">
                  <th className="pb-4 font-medium pl-4">Customer Name</th>
                  <th className="pb-4 font-medium">Contact</th>
                  <th className="pb-4 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    key={customer.id} 
                    onClick={() => setViewCustomer(customer)}
                    className="border-b border-[var(--color-text)]/5 hover:bg-[var(--color-text)]/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="py-4 pl-4 font-medium">
                      <div className="flex flex-col">
                        <span>{customer.name}</span>
                        {customer.address && <span className="text-xs text-[var(--color-text)]/40 font-normal mt-1 flex items-center gap-1"><MapPin size={10}/>{customer.address}</span>}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col space-y-1">
                        {customer.phone && <div className="flex items-center space-x-2 text-[var(--color-text)]/60 text-xs"><Phone size={12} /><span>{customer.phone}</span></div>}
                        {customer.email && <div className="flex items-center space-x-2 text-[var(--color-text)]/60 text-xs"><Mail size={12} /><span>{customer.email}</span></div>}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button onClick={(e) => openEditCustomer(customer, e)} className="p-2 text-[var(--color-text)]/40 hover:text-[var(--color-main)] transition-colors"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }} className="p-2 text-[var(--color-text)]/40 hover:text-red-500 transition-colors mr-2"><Trash2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setInteractionForm(prev => ({...prev, customerId: customer.id})); setIsInteractionModalOpen(true); }} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors mr-2">Log Inter.</button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingTicket(null); setTicketForm({ customerId: customer.id, type: 'inquiry', status: 'open', resolutionNotes: '' }); setIsTicketModalOpen(true); }} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"><MessageSquare size={14} className="inline mr-1"/> Ticket</button>
                    </td>
                  </motion.tr>
                ))}
                {filteredCustomers.length === 0 && <tr><td colSpan={3} className="py-12 text-center text-[var(--color-text)]/40">No customers found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'tickets' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text)]/40 border-b border-[var(--color-text)]/5">
                  <th className="pb-4 font-medium pl-4">ID / Customer</th>
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => {
                  const cust = customers.find(c => c.id === ticket.customer_id);
                  return (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={ticket.id} className="border-b border-[var(--color-text)]/5 hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="py-4 pl-4">
                        <div className="font-medium text-[var(--color-text)]">{cust?.name || 'Unknown'}</div>
                        <div className="text-xs text-[var(--color-text)]/40 uppercase tracking-widest mt-1">#{ticket.id.substring(0,8)}</div>
                      </td>
                      <td className="py-4 capitalize text-[var(--color-text)]/60">{ticket.type.replace('_', ' ')}</td>
                      <td className="py-4">
                        <Badge color={ticket.status === 'open' ? 'red' : ticket.status === 'in_progress' ? 'amber' : 'emerald'} label={ticket.status.replace('_', ' ')} />
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <button onClick={() => openEditTicket(ticket)} className="text-xs px-3 py-1.5 bg-[var(--color-text)]/5 text-[var(--color-text)] rounded-lg hover:bg-[var(--color-text)]/10 transition-colors mr-2">Edit</button>
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <button onClick={() => updateTicket(ticket.id, { status: 'resolved' })} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">Resolve</button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredTickets.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-[var(--color-text)]/40">No tickets found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'interactions' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text)]/40 border-b border-[var(--color-text)]/5">
                  <th className="pb-4 font-medium pl-4">Date</th>
                  <th className="pb-4 font-medium">Customer</th>
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium w-1/2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredInteractions.map(interaction => {
                  const cust = customers.find(c => c.id === interaction.customer_id);
                  return (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={interaction.id} className="border-b border-[var(--color-text)]/5 hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="py-4 pl-4 text-[var(--color-text)]/60">{new Date(interaction.interaction_date).toLocaleString()}</td>
                      <td className="py-4 font-medium text-[var(--color-text)]">{cust?.name || 'Unknown'}</td>
                      <td className="py-4 capitalize text-[var(--color-text)]/60">
                         <Badge color={interaction.interaction_type === 'sales' ? 'blue' : interaction.interaction_type === 'support' ? 'amber' : interaction.interaction_type === 'delivery' ? 'emerald' : 'gray'} label={interaction.interaction_type} />
                      </td>
                      <td className="py-4 pr-4 text-[var(--color-text)]/80">{interaction.notes}</td>
                    </motion.tr>
                  );
                })}
                {filteredInteractions.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-[var(--color-text)]/40">No interactions found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tickets by Status */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/5 rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-6">Tickets by Status</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={ticketsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {ticketsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tickets by Type */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/5 rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-6">Tickets by Type</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketsByType}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-text)" strokeOpacity={0.05} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="capitalize" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="var(--color-main)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Interactions Timeline */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/5 rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-6">Interactions (Last 30 Days)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={interactionsByDate}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-text)" strokeOpacity={0.05} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="count" stroke="var(--color-main)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer View Slide-over */}
      <AnimatePresence>
        {viewCustomer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewCustomer(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[var(--color-surface)] shadow-2xl z-50 border-l border-[var(--color-text)]/5 overflow-y-auto"
            >
              <div className="p-6 border-b border-[var(--color-text)]/5 flex justify-between items-center sticky top-0 bg-[var(--color-surface)]/80 backdrop-blur-xl z-10">
                <h3 className="text-xl font-bold font-serif text-[var(--color-main)]">Customer Profile</h3>
                <button onClick={() => setViewCustomer(null)} className="p-2 bg-[var(--color-text)]/5 rounded-full hover:bg-[var(--color-text)]/10"><XCircle size={20}/></button>
              </div>
              <div className="p-6 space-y-8">
                {/* Info */}
                <div className="bg-[var(--color-main)]/5 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{viewCustomer.name}</h2>
                    <button onClick={(e) => { openEditCustomer(viewCustomer, e as any); }} className="p-2 bg-white rounded-xl shadow-sm text-[var(--color-main)] hover:scale-105 transition-transform"><Edit2 size={16}/></button>
                  </div>
                  <div className="space-y-3">
                    {viewCustomer.phone && <div className="flex items-center space-x-3 text-[var(--color-text)]/70"><Phone size={16} /><span>{viewCustomer.phone}</span></div>}
                    {viewCustomer.email && <div className="flex items-center space-x-3 text-[var(--color-text)]/70"><Mail size={16} /><span>{viewCustomer.email}</span></div>}
                    {viewCustomer.address && <div className="flex items-center space-x-3 text-[var(--color-text)]/70"><MapPin size={16} /><span>{viewCustomer.address}</span></div>}
                    <div className="flex items-center space-x-3 text-[var(--color-text)]/40 text-sm mt-4 pt-4 border-t border-[var(--color-text)]/10">
                      <span>Customer since {new Date(viewCustomer.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* History */}
                <div>
                  <h4 className="font-bold text-lg mb-4 flex items-center justify-between">
                    <span>Recent Interactions</span>
                    <button onClick={() => { setInteractionForm(prev => ({...prev, customerId: viewCustomer.id})); setIsInteractionModalOpen(true); }} className="text-xs px-3 py-1 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg">Add Note</button>
                  </h4>
                  <div className="space-y-4">
                    {interactions.filter(i => i.customer_id === viewCustomer.id).slice(0, 5).map(i => (
                      <div key={i.id} className="p-4 rounded-2xl border border-[var(--color-text)]/5 bg-[var(--color-text)]/[0.01]">
                        <div className="flex justify-between items-center mb-2">
                          <Badge color="blue" label={i.interaction_type} />
                          <span className="text-xs text-[var(--color-text)]/40">{new Date(i.interaction_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-[var(--color-text)]/80">{i.notes}</p>
                      </div>
                    ))}
                    {interactions.filter(i => i.customer_id === viewCustomer.id).length === 0 && <p className="text-sm text-[var(--color-text)]/40 italic">No interactions logged yet.</p>}
                  </div>
                </div>

                {/* Tickets */}
                <div>
                  <h4 className="font-bold text-lg mb-4 flex items-center justify-between">
                    <span>Support Tickets</span>
                    <button onClick={() => { setEditingTicket(null); setTicketForm({ customerId: viewCustomer.id, type: 'inquiry', status: 'open', resolutionNotes: '' }); setIsTicketModalOpen(true); }} className="text-xs px-3 py-1 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg">New Ticket</button>
                  </h4>
                  <div className="space-y-4">
                    {tickets.filter(t => t.customer_id === viewCustomer.id).map(t => (
                      <div key={t.id} className="p-4 rounded-2xl border border-[var(--color-text)]/5 bg-[var(--color-text)]/[0.01]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold capitalize">{t.type}</span>
                          <Badge color={t.status === 'open' ? 'red' : t.status === 'in_progress' ? 'amber' : 'emerald'} label={t.status.replace('_', ' ')} />
                        </div>
                        <div className="text-xs text-[var(--color-text)]/40 uppercase tracking-widest mb-2">#{t.id.substring(0,8)}</div>
                        {t.resolution_notes && <p className="text-sm text-[var(--color-text)]/80 mt-2 p-3 bg-[var(--color-text)]/5 rounded-xl">{t.resolution_notes}</p>}
                        <div className="mt-3 flex justify-end">
                           <button onClick={() => openEditTicket(t)} className="text-xs px-3 py-1 bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10 rounded-lg transition-colors">Edit Ticket</button>
                        </div>
                      </div>
                    ))}
                    {tickets.filter(t => t.customer_id === viewCustomer.id).length === 0 && <p className="text-sm text-[var(--color-text)]/40 italic">No support tickets found.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--color-surface)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--color-text)]/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-[var(--color-main)]">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
                <button onClick={() => setIsCustomerModalOpen(false)} className="text-[var(--color-text)]/40 hover:text-[var(--color-text)]"><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Name</label>
                  <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Phone</label>
                    <input type="text" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Email</label>
                    <input type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Address</label>
                  <input type="text" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none" />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 py-3 bg-[var(--color-text)]/5 text-[var(--color-text)] font-bold rounded-xl hover:bg-[var(--color-text)]/10 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white font-bold rounded-xl hover:bg-[var(--color-main)]/90 transition-colors shadow-lg shadow-[var(--color-main)]/20">{editingCustomer ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTicketModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--color-surface)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--color-text)]/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-[var(--color-main)]">{editingTicket ? 'Edit Ticket' : 'Open Ticket'}</h3>
                <button onClick={() => setIsTicketModalOpen(false)} className="text-[var(--color-text)]/40 hover:text-[var(--color-text)]"><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Customer</label>
                  <select disabled={!!editingTicket} required value={ticketForm.customerId} onChange={e => setTicketForm({...ticketForm, customerId: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none disabled:opacity-50">
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Type</label>
                    <select value={ticketForm.type} onChange={e => setTicketForm({...ticketForm, type: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none">
                      <option value="inquiry">Inquiry</option>
                      <option value="complaint">Complaint</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Status</label>
                    <select value={ticketForm.status} onChange={e => setTicketForm({...ticketForm, status: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none">
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Notes & Resolution</label>
                  <textarea rows={3} value={ticketForm.resolutionNotes} onChange={e => setTicketForm({...ticketForm, resolutionNotes: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none"></textarea>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsTicketModalOpen(false)} className="flex-1 py-3 bg-[var(--color-text)]/5 text-[var(--color-text)] font-bold rounded-xl hover:bg-[var(--color-text)]/10 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white font-bold rounded-xl hover:bg-[var(--color-main)]/90 transition-colors shadow-lg shadow-[var(--color-main)]/20">{editingTicket ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInteractionModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--color-surface)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--color-text)]/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-[var(--color-main)]">Log Interaction</h3>
                <button onClick={() => setIsInteractionModalOpen(false)} className="text-[var(--color-text)]/40 hover:text-[var(--color-text)]"><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleInteractionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Customer</label>
                  <select required disabled={!!viewCustomer && interactionForm.customerId === viewCustomer.id} value={interactionForm.customerId} onChange={e => setInteractionForm({...interactionForm, customerId: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none disabled:opacity-50">
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Interaction Type</label>
                  <select value={interactionForm.interactionType} onChange={e => setInteractionForm({...interactionForm, interactionType: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none">
                    <option value="general">General</option>
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">Notes</label>
                  <textarea required rows={4} value={interactionForm.notes} onChange={e => setInteractionForm({...interactionForm, notes: e.target.value})} className="w-full bg-[var(--color-text)]/5 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none"></textarea>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsInteractionModalOpen(false)} className="flex-1 py-3 bg-[var(--color-text)]/5 text-[var(--color-text)] font-bold rounded-xl hover:bg-[var(--color-text)]/10 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white font-bold rounded-xl hover:bg-[var(--color-main)]/90 transition-colors shadow-lg shadow-[var(--color-main)]/20">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRM;
