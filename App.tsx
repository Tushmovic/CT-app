
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChangePassword from './components/Auth/ChangePassword';
import { ClientDashboard } from './frontend/components/Dashboard/ClientDashboard';
import { ManagerDashboard } from './frontend/components/Dashboard/ManagerDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false); // Initial loading is now handled by the absence of a user

  useEffect(() => {
    // In a real application, you would check for a session token here
    // and attempt to re-authenticate the user with the backend.
    // For this simulation, user state is cleared on refresh.
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    // In a real app, a token would be stored here (e.g., in memory or httpOnly cookie)
    // localStorage.setItem('hub_session', JSON.stringify(u)); // Removed as per requirements
  };

  const handleLogout = () => {
    setUser(null);
    setImpersonatedUser(null);
    // localStorage.removeItem('hub_session'); // Removed as per requirements
    setView('LOGIN');
  };

  const handleImpersonate = (client: User) => {
    setImpersonatedUser(client);
  };

  const handleStopImpersonating = () => {
    setImpersonatedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-6 group">
            <div className="relative">
              <img 
                src="logo.png" 
                alt="Contribution Team Logo" 
                className="w-full h-full object-contain drop-shadow-2xl scale-110 group-hover:scale-125 transition-transform duration-500"
              />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">CONTRIBUTION TEAM</h1>
          <p className="mt-2 text-[10px] text-indigo-500 font-black uppercase tracking-[0.4em]">Transaction Management App</p>
        </div>

        <div className="mt-2 animate-in slide-in-from-bottom-8 duration-700 delay-150">
          {view === 'LOGIN' ? (
            <Login onLoginSuccess={handleLogin} onNavigateToRegister={() => setView('REGISTER')} />
          ) : (
            <Register onRegisterSuccess={() => setView('LOGIN')} onNavigateToLogin={() => setView('LOGIN')} />
          )}
        </div>
      </div>
    );
  }

  const activeUser = impersonatedUser || user;

  return (
    <Layout user={user} onLogout={handleLogout}>
      {activeUser.isFirstLogin && activeUser.role === UserRole.CLIENT && !impersonatedUser ? (
        <ChangePassword user={activeUser} onSuccess={handleLogin} />
      ) : impersonatedUser ? (
        <ClientDashboard 
          user={impersonatedUser} 
          isManagerPreview={true} 
          onBackToManager={handleStopImpersonating} 
        />
      ) : user.role === UserRole.ADMIN1 || user.role === UserRole.ADMIN2 ? (
        <ManagerDashboard user={user} onImpersonateClient={handleImpersonate} />
      ) : (
        <ClientDashboard user={user} />
      )}
    </Layout>
  );
};

export default App;