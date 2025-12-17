
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Patients from './views/Patients';
import Interventions from './views/Interventions';
import Receipts from './views/Receipts';
import Planning from './views/Planning';
import Stock from './views/Stock';
import Oxygen from './views/Oxygen';
import NurseVerification from './views/NurseVerification';
import AmbulancierVerification from './views/AmbulancierVerification';
import Admin from './views/Admin';
import Profile from './views/Profile';
import RegulationDashboard from './views/RegulationDashboard';
import Messages from './views/Messages';
import PMA from './views/PMA'; 
import ToastContainer from './components/Toast';
import { useAuth } from './providers/AuthProvider';
import { useData } from './providers/DataProvider';
import { ViewContext, User } from './types';
import { Loader2, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { DEFAULT_APP_LOGO } from './constants';

const App: React.FC = () => {
    const { currentUser, users, login, verify2FA } = useAuth();
    const { headerInfo } = useData();
    const [currentView, setCurrentView] = useState('dashboard');
    const [viewContext, setViewContext] = useState<ViewContext>({});
    
    // Login States
    const [selectedUserId, setSelectedUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // 2FA States
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const appLogo = headerInfo?.logo || DEFAULT_APP_LOGO;

    const handleViewChange = (view: string, context?: ViewContext) => {
        setCurrentView(view);
        if (context) {
            setViewContext(context);
        } else {
            setViewContext({});
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await login(selectedUserId, password);
            if (result.require2FA) {
                setRequires2FA(true);
                // Reset loading to allow 2FA input
                setIsLoading(false); 
            }
        } catch (error: any) {
            setError(error.message || "Échec de l'authentification");
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!twoFactorCode || !selectedUserId) return;
        setIsLoading(true);
        setError(null);
        try {
            await verify2FA(selectedUserId, twoFactorCode);
            // On success, currentUser will be set by AuthProvider, triggering re-render
        } catch (error: any) {
            setError("Code invalide. Essayez 123456.");
            setIsLoading(false);
        }
    };

    // 1. Écran de Connexion (Design Split-Screen Amélioré)
    if (!currentUser) {
        return (
            <div className="min-h-screen flex bg-white dark:bg-gray-900 font-sans">
                <ToastContainer />
                
                {/* LEFT SIDE - BRANDING & VISUALS */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
                    {/* Background Image with Overlay */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1584036561566-b45238f2e129?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80")' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-primary/80 to-purple-900/80" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                {/* Desktop Logo: 140-160px */}
                                <img src={appLogo} alt="Logo" className="w-[150px] h-auto object-contain" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">MedEvac</span>
                        </div>

                        <div className="space-y-6 max-w-lg">
                            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                                Gestion des Urgences <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                                    Simplifiée & Sécurisée.
                                </span>
                            </h1>
                            <p className="text-lg text-blue-100/80 leading-relaxed">
                                Une plateforme unifiée pour la régulation, le suivi des interventions, la gestion logistique et la facturation des services d'urgence.
                            </p>
                            
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/10 text-sm font-medium">
                                    <CheckCircle2 size={16} className="text-green-400"/> Données chiffrées
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/10 text-sm font-medium">
                                    <CheckCircle2 size={16} className="text-green-400"/> Disponible 24/7
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-blue-200/50">
                            &copy; {new Date().getFullYear()} MedEvac Solutions. Tous droits réservés.
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - FORM */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        {/* Mobile Header (Visible only on small screens) */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4 shadow-sm border border-primary/20">
                                {/* Mobile Logo: 90-110px, Tablet: 120-140px */}
                                <img src={appLogo} alt="Logo" className="w-[100px] md:w-[130px] h-auto object-contain" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MedEvac</h1>
                        </div>

                        {!requires2FA ? (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connexion</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Veuillez vous identifier pour accéder à votre espace.
                                    </p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Identifiant
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <UserIcon size={18} className="text-gray-400"/>
                                            </div>
                                            <select
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                className="block w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white sm:text-sm transition-all appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                required
                                            >
                                                <option value="" disabled>Sélectionner un profil...</option>
                                                {users?.map((user: User) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.nom} — {user.role.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <div className="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-500">▼</div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedUserId && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Mot de passe
                                                </label>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock size={18} className="text-gray-400"/>
                                                </div>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white sm:text-sm transition-all placeholder-gray-400"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 animate-in fade-in">
                                            <AlertCircle size={16} className="shrink-0"/>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || !selectedUserId}
                                        className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin h-5 w-5" />
                                        ) : (
                                            <>
                                                Se connecter <ArrowRight size={18} className="ml-2"/>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Smartphone size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Double Authentification</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                    Un code de sécurité a été envoyé à votre appareil. <br/>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">Simulation: 123456</span>
                                </p>

                                <form onSubmit={handleVerify2FA} className="space-y-6">
                                    <div>
                                        <input
                                            type="text"
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="block w-full text-center py-4 text-2xl font-mono tracking-[0.5em] bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white transition-all"
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-sm text-red-500 font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || twoFactorCode.length < 6}
                                        className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Vérifier'}
                                    </button>
                                </form>

                                <button
                                    onClick={() => { setRequires2FA(false); setTwoFactorCode(''); setError(null); }}
                                    className="mt-6 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white underline underline-offset-4"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        )}

                        <div className="text-center">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Logique de Routage (Router Logic)
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                if (currentUser.role === 'regulateur') return <RegulationDashboard />;
                return <Dashboard setCurrentView={handleViewChange} />;
            case 'patients':
                return <Patients context={viewContext} setContext={setViewContext} />;
            case 'interventions':
                return <Interventions context={viewContext} setContext={setViewContext} />;
            case 'receipts':
                return <Receipts />;
            case 'planning':
                return <Planning />;
            case 'stock':
                return <Stock />;
            case 'oxygen':
                return <Oxygen />;
            case 'nurse-verification':
                return <NurseVerification />;
            case 'ambulancier-verification':
                return <AmbulancierVerification />;
            case 'admin':
                return <Admin />;
            case 'profile':
                return <Profile />;
            case 'messages':
                return <Messages />;
            case 'pma': // New Route
                return <PMA />;
            default:
                return <Dashboard setCurrentView={handleViewChange} />;
        }
    };

    const getViewTitle = () => {
        switch (currentView) {
            case 'dashboard': return currentUser.role === 'regulateur' ? 'Cockpit Régulation' : 'Tableau de bord';
            case 'patients': return 'Patients';
            case 'interventions': return 'Interventions';
            case 'receipts': return 'Reçus';
            case 'planning': return 'Planning';
            case 'stock': return 'Stock';
            case 'oxygen': return 'Gestion Oxygène';
            case 'nurse-verification': return 'Vérification Infirmier';
            case 'ambulancier-verification': return 'Vérification Ambulancier';
            case 'admin': return 'Administration';
            case 'profile': return 'Mon Profil';
            case 'messages': return 'Messagerie Sécurisée';
            case 'pma': return 'Poste Médical Avancé'; // New Title
            default: return 'MedEvac';
        }
    };

    // 3. Rendu Principal avec Layout
    return (
        <Layout 
            currentView={currentView} 
            setCurrentView={handleViewChange} 
            title={getViewTitle()}
        >
            {renderView()}
        </Layout>
    );
};

export default App;
