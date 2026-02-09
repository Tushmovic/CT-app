

import React, { useState, useEffect, useRef } from 'react';
import { User, Payment, PaymentStatus, UserStatus, PAYMENT_TYPES, UserRole, Loan, PaymentType } from '../../../types';
import { api } from '../../apiService';
import { subscribeToUpdates, RealtimeEvent } from '../../services/realtimeService'; // Import the new realtime service

interface ManagerDashboardProps {
  user: User; // The current admin logged in
  onImpersonateClient?: (client: User) => void;
}

const ApprovalForm: React.FC<{ user: User, onProcessed: () => void }> = ({ user, onProcessed }) => {
  const [jersey, setJersey] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!jersey || !pass) return alert('Please enter both a Jersey Number and Password');
    setLoading(true);
    try {
      await api.approveClient(user.id, jersey, pass);
      onProcessed(); // Trigger reload of manager data
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject and delete ${user.name}'s registration?`)) return;
    setLoading(true);
    try {
      await api.rejectClient(user.id);
      onProcessed(); // Trigger reload of manager data
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border-2 border-slate-50 hover:border-indigo-100 transition-all bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-lg font-bold text-slate-800 leading-none mb-1">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md uppercase">Pending Request</span>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Jersey #</label>
            <input 
              type="text" 
              placeholder="e.g. TEAM-01" 
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg outline-none uppercase font-bold focus:ring-2 focus:ring-indigo-500 transition-all" 
              value={jersey}
              onChange={e => setJersey(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Temp Password</label>
            <input 
              type="text" 
              placeholder="e.g. Pass123" 
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all" 
              value={pass}
              onChange={e => setPass(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          disabled={loading}
          className="flex-grow bg-indigo-600 text-white text-xs font-black py-3 rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50 transition-all active:scale-95"
          onClick={handleApprove}
        >
          {loading ? 'Processing...' : 'Approve Access'}
        </button>
        <button 
          disabled={loading}
          className="px-4 bg-white text-red-500 border border-red-100 text-xs font-bold py-3 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
          onClick={handleReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
};


export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user: currentAdmin, onImpersonateClient }) => {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'approvals' | 'payments' | 'ledger' | 'loans' | 'team' | 'messaging' | 'settings'>('approvals');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'ALL'>(PaymentStatus.PENDING);
  const [msgForm, setMsgForm] = useState({ msg: '', target: 'ALL' });
  const [loanForm, setLoanForm] = useState({ clientId: '', amount: '' });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const load = async () => {
    setIsSyncing(true);
    try {
      const res = await api.getManagerDashboard();
      setData(res);
    } catch (error) {
      console.error('Failed to load manager dashboard data:', error);
      // Optionally show an error message
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    load();
    
    // Subscribe to real-time updates from the simulated backend
    const unsubscribe = subscribeToUpdates((event, payload) => {
      console.log('Real-time update detected:', event, payload);
      // Trigger a reload of data when relevant events occur
      // This ensures the manager dashboard is always up-to-date
      if (
        event === RealtimeEvent.USER_UPDATED ||
        event === RealtimeEvent.USER_DELETED ||
        event === RealtimeEvent.PAYMENT_UPDATED ||
        event === RealtimeEvent.LOAN_UPDATED ||
        event === RealtimeEvent.NOTIFICATION_DISPATCHED ||
        event === RealtimeEvent.SETTINGS_UPDATED
      ) {
        load();
      }
    });

    return () => {
      unsubscribe(); // Cleanup subscription on unmount
    };
  }, []);

  const isAdmin = currentAdmin.role === UserRole.ADMIN1 || currentAdmin.role === UserRole.ADMIN2;
  const canIssueLoans = isAdmin;
  const canApprovePayments = isAdmin;

  const handleToggleReminders = async () => {
    setIsUpdatingSettings(true);
    const newSettings = { ...data.settings, automatedRemindersEnabled: !data.settings.automatedRemindersEnabled };
    try {
      await api.updateSettings(newSettings);
      // load() will be called by the realtime service, so no explicit call needed here
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings.');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this client from the database?')) return;
    try {
      await api.deleteUser(userId);
      // load() will be called by the realtime service
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user.');
    }
  };

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canIssueLoans) return alert('Access Denied.');
    if (!loanForm.clientId || !loanForm.amount) return;
    const client = data.activeClients.find((u: User) => u.id === loanForm.clientId);
    if (!client) return;
    
    try {
      await api.issueLoan(client.id, client.name, parseFloat(loanForm.amount));
      setLoanForm({ clientId: '', amount: '' });
      alert('Loan issued successfully!');
      // load() will be called by the realtime service
    } catch (error) {
      console.error('Failed to issue loan:', error);
      alert('Failed to issue loan.');
    }
  };

  if (!data) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Initializing Secure Cloud Listener...</p>
    </div>
  );

  const paymentTotals = PAYMENT_TYPES.reduce((acc, pt) => {
    acc[pt] = (data.allPayments as Payment[])
      .filter((p: Payment) => p.type === pt && p.status === PaymentStatus.APPROVED)
      .reduce((s: number, p: Payment) => s + p.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalInflow: number = Object.values(paymentTotals).reduce((a: number, b: number) => a + b, 0);
  const totalCashDisbursed: number = (data.allLoans as Loan[]).reduce((sum: number, l: Loan) => sum + (l.disbursementAmount || l.amount), 0);
  const totalPrincipalOwed: number = (data.allLoans as Loan[]).reduce((sum: number, l: Loan) => sum + l.amount, 0);
  const netLiquidity = totalInflow - totalCashDisbursed;

  const filteredPayments = data.allPayments.filter((p: Payment) => 
    paymentFilter === 'ALL' ? true : p.status === paymentFilter
  ).sort((a: Payment, b: Payment) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredUsers = data.allUsers.filter((u: User) => {
    const s = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(s) || (u.jerseyNumber && u.jerseyNumber.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Cloud Hub Sync Visualizer */}
      <div className="flex items-center justify-end px-4 -mb-6 space-x-2">
        <div className="flex items-center bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
           <span className="flex h-1.5 w-1.5 relative mr-2">
             <span className={`absolute inline-flex h-full w-full rounded-full ${isSyncing ? 'animate-ping bg-indigo-400' : 'bg-emerald-400'} opacity-75`}></span>
             <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isSyncing ? 'bg-indigo-600' : 'bg-emerald-600'}`}></span>
           </span>
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
             {isSyncing ? 'Cloud Syncing...' : 'Real-time Hub Active'}
           </span>
        </div>
      </div>

      <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Organizational Liquidity</p>
                <h1 className="text-5xl font-black">₦{netLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h1>
             </div>
             <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5 text-right">
                <p className="text-[10px] font-bold text-indigo-300 uppercase">Administrator System</p>
                <p className="text-sm font-black">{currentAdmin.name}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            {PAYMENT_TYPES.map(pt => (
              <div key={pt} className="bg-white bg-opacity-5 p-4 rounded-2xl border border-white border-opacity-10">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 truncate">{pt}</p>
                <p className="text-lg font-bold">₦{paymentTotals[pt].toLocaleString()}</p>
              </div>
            ))}
            <div className="bg-rose-500 bg-opacity-10 p-4 rounded-2xl border border-rose-500 border-opacity-20">
                <p className="text-rose-300 text-[10px] font-bold uppercase mb-1 truncate">Total Disbursed</p>
                <p className="text-lg font-bold text-rose-100">₦{totalCashDisbursed.toLocaleString()}</p>
            </div>
            <div className="bg-amber-500 bg-opacity-10 p-4 rounded-2xl border border-amber-500 border-opacity-20">
                <p className="text-amber-300 text-[10px] font-bold uppercase mb-1 truncate">Total Debt Owed</p>
                <p className="text-lg font-bold text-amber-100">₦{totalPrincipalOwed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'approvals', label: 'Approvals', count: data.pendingUsers.length, color: 'bg-red-500' },
          { id: 'payments', label: 'Payments', count: data.pendingPayments.length, color: 'bg-indigo-500' },
          { id: 'ledger', label: 'Ledger' },
          { id: 'loans', label: 'Loans' },
          { id: 'team', label: 'Team' },
          { id: 'messaging', label: 'Messaging' },
          { id: 'settings', label: 'Settings' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id as any)} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${tab === t.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 ${t.color} text-white rounded-full text-[8px] border-2 border-slate-100`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
        {tab === 'approvals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800">Registration Requests</h2>
            <p className="text-xs text-slate-400 font-bold -mt-4 uppercase tracking-tight">Listening for remote registration access requests...</p>
            {data.pendingUsers.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No pending requests at this time.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
                {data.pendingUsers.map((u: User) => (
                  <ApprovalForm key={u.id} user={u} onProcessed={load} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Payment Authorization</h2>
                <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">Cross-Category Review Queue</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
                  <button key={f} onClick={() => setPaymentFilter(f as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${paymentFilter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{f}</button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="pb-4 px-4">Client</th>
                    <th className="pb-4 px-4">Amount</th>
                    <th className="pb-4 px-4">Type</th>
                    <th className="pb-4 px-4 text-center">Receipt</th>
                    <th className="pb-4 px-4 text-center">Status</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayments.map((p: Payment) => (
                    <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4"><p className="font-bold text-slate-700">{p.clientName}</p><p className="text-[10px] text-slate-400 font-bold">{new Date(p.date).toLocaleDateString()}</p></td>
                      <td className="py-4 px-4 font-black text-indigo-600">₦{p.amount.toFixed(2)}</td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-500">{p.type}</td>
                      <td className="py-4 px-4 text-center"><a href={p.receiptUrl} target="_blank" className="text-indigo-400 hover:text-indigo-600 font-bold text-xs underline">View</a></td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1">
                        {canApprovePayments ? (
                           p.status === PaymentStatus.PENDING ? (
                             <>
                               <button className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-lg hover:bg-green-100" onClick={async () => { await api.processPayment(p.id, PaymentStatus.APPROVED); /* load() will be called by realtime service */ }}>Approve</button>
                               <button className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg hover:bg-red-100" onClick={async () => { await api.processPayment(p.id, PaymentStatus.REJECTED); /* load() will be called by realtime service */ }}>Reject</button>
                             </>
                           ) : (
                             <button className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-lg hover:bg-slate-100" onClick={async () => { await api.processPayment(p.id, PaymentStatus.PENDING); /* load() will be called by realtime service */ }}>Reset</button>
                           )
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'loans' && (
          <div className="space-y-8">
            <div className={`p-8 rounded-3xl border max-w-xl mx-auto bg-slate-50 border-slate-100`}>
              <h3 className="text-xl font-black text-slate-800 mb-2">Issue New Loan</h3>
              <p className="text-indigo-600 text-xs font-bold mb-6 uppercase tracking-widest">Capital Disbursement Protocol</p>
              <form onSubmit={handleIssueLoan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Recipient Client</label>
                  <select required className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 shadow-inner" value={loanForm.clientId} onChange={e => setLoanForm({...loanForm, clientId: e.target.value})}>
                    <option value="">Select a member...</option>
                    {data.activeClients.map((c: User) => <option key={c.id} value={c.id}>{c.name} ({c.jerseyNumber})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Principal Amount (₦)</label>
                  <input type="number" required className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold shadow-inner" value={loanForm.amount} onChange={e => setLoanForm({...loanForm, amount: e.target.value})} />
                  <p className="mt-2 text-[10px] text-slate-400 font-bold italic">* 5% interest upfront deduction</p>
                </div>
                <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all active:scale-95">
                  Authorize & Issue Loan
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-800">Global Loan Registry</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="p-4">Member</th>
                      <th className="p-4">Principal (Debt)</th>
                      <th className="p-4">Disbursed (Cash)</th>
                      <th className="p-4">Accrued Interest</th>
                      <th className="p-4">Balance Due</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.allLoans.map((l: Loan) => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700">{l.clientName}</td>
                        <td className="p-4">₦{l.amount.toLocaleString()}</td>
                        <td className="p-4 text-rose-500 font-bold">₦{l.disbursementAmount.toLocaleString()}</td>
                        <td className="p-4 text-rose-400">₦{l.interestAmount.toLocaleString()}</td>
                        <td className="p-4 font-black text-indigo-700">₦{l.balance.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${l.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'ledger' && (
           <div className="space-y-6">
             <h2 className="text-2xl font-black text-slate-800">Master Ledger</h2>
             <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                      <tr>
                        <th className="p-4">Identity</th>
                        {PAYMENT_TYPES.map(pt => <th key={pt} className="p-4">{pt}</th>)}
                        <th className="p-4 text-right">Preview</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {data.activeClients.map((c: User) => {
                        const cp = data.allPayments.filter((p: Payment) => p.clientId === c.id && p.status === 'APPROVED');
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4"><p className="font-bold text-slate-700">{c.name}</p><p className="text-[10px] text-indigo-500 font-bold uppercase">{c.jerseyNumber}</p></td>
                            {PAYMENT_TYPES.map(pt => (
                               <td key={pt} className="p-4 text-slate-500">₦{cp.filter((p: Payment) => p.type === pt).reduce((s: number, p: Payment) => s + p.amount, 0).toLocaleString()}</td>
                            ))}
                            <td className="p-4 text-right">
                              <button onClick={() => onImpersonateClient?.(c)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Deep View</button>
                            </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {tab === 'team' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800">Personnel Management</h2>
            <div className="flex bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
              <input 
                type="text" 
                placeholder="Filter by Name or Jersey #..." 
                className="w-full bg-transparent outline-none text-sm font-bold placeholder:text-slate-300"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                  <tr><th className="p-4">Name / Contact</th><th className="p-4">ID</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((u: User) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4"><p className="font-bold text-slate-700">{u.name}</p><p className="text-[10px] text-slate-400">{u.email}</p></td>
                      <td className="p-4 text-xs font-black text-indigo-600">{u.jerseyNumber || 'PENDING'}</td>
                      <td className="p-4 text-[10px] font-black uppercase text-slate-400">{u.role}</td>
                      <td className="p-4 text-right space-x-1">
                        {u.role === UserRole.CLIENT && (
                          <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg hover:bg-red-600 hover:text-white transition-all">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'messaging' && (
          <div className="max-w-xl mx-auto space-y-6 py-10">
            <h2 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tighter">Team Broadcast</h2>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Recipient Group</label>
                    <select className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 shadow-inner font-medium" value={msgForm.target} onChange={e => setMsgForm({...msgForm, target: e.target.value})}>
                       <option value="ALL">Broadast to All Members</option>
                       {data.activeClients.map((c: User) => <option key={c.id} value={c.id}>{c.name} ({c.jerseyNumber})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Notification Content</label>
                    <textarea rows={4} className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner font-medium" placeholder="Type your message..." value={msgForm.msg} onChange={e => setMsgForm({...msgForm, msg: e.target.value})} />
                  </div>
                  <button className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-900 shadow-lg transition-all active:scale-95" onClick={async () => { await api.broadcast(msgForm.target, msgForm.msg); setMsgForm({...msgForm, msg: ''}); alert('Notification Dispatched!'); /* load() will be called by realtime service */ }}>Dispatch Notification</button>
               </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-8 py-10 text-center">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">System Configuration</h2>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="text-left">
                <p className="font-bold text-slate-800">Automated Payment Reminders</p>
                <p className="text-xs text-slate-500 mt-1">Triggers the 12th-of-month deadline countdown for all clients.</p>
              </div>
              <button onClick={handleToggleReminders} disabled={isUpdatingSettings} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${data.settings.automatedRemindersEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${data.settings.automatedRemindersEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Note: Changes made here are synced instantly to all active management sessions via the Event Synchronization Hub.</p>
          </div>
        )}
      </div>
    </div>
  );
};