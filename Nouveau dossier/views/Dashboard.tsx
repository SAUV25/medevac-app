
import React, { useMemo, useState, useEffect } from 'react';
import Card from '../components/Card';
import { 
    HeartPulse, AlertTriangle, ListChecks, Users, PlusCircle, Activity, 
    Ambulance, Calendar, Clock, CheckCircle, Package, 
    TrendingUp, UserPlus, Stethoscope, Wind, Truck, Fuel, ClipboardList,
    Tent, AlertOctagon, MapPin, ArrowRight
} from 'lucide-react';
import { ViewContext, Intervention, User } from '../types';
import { useTranslation } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { useData } from '../providers/DataProvider';
import { DEFAULT_PATIENTS, DEFAULT_APP_LOGO } from '../constants';
import { useNotification } from '../providers/NotificationProvider';

interface DashboardProps {
  setCurrentView: (view: any, context?: ViewContext) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
    const { t, language } = useTranslation();
    const { currentUser } = useAuth();
    const { 
        interventions = [], 
        stockItems = [], 
        verifications = [], 
        shifts = [], 
        users = [], 
        vehicules = [], 
        oxygenBottles = [], 
        patients = [],
        headerInfo,
        addPatient 
    } = useData();
    const { addNotification } = useNotification();
    
    // Real-time Clock State
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const appLogo = headerInfo?.logo || DEFAULT_APP_LOGO;

    // --- Common Data ---
    const today = new Date().toISOString().split('T')[0];
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bonjour";
        if (hour < 18) return "Bonne après-midi";
        return "Bonsoir";
    }, []);

    // --- Role Specific Data Filtering ---
    
    // My Interventions (Assignées à moi)
    const myInterventions = useMemo(() => {
        if (!currentUser) return [];
        return interventions.filter(i => 
            (i.infirmierId === currentUser.id || i.ambulancierId === currentUser.id) &&
            (i.status === 'En cours' || i.status === 'En attente')
        );
    }, [interventions, currentUser]);

    // Global Stats
    const activeInterventions = interventions.filter(i => i.status === 'En cours');
    const pmaPatients = patients.filter(p => p.triageStatus && p.triageStatus !== 'DCD');
    const availableVehicles = vehicules.filter(v => 
        // Mock logic: Vehicle available if not assigned to active intervention
        !interventions.some(i => i.status === 'En cours' && i.equipe?.includes(v))
    );
    
    const lowStockItems = stockItems.filter(item => item.quantite <= item.seuilAlerte);
    const stockHealth = Math.max(0, 100 - ((lowStockItems.length / (stockItems.length || 1)) * 100));
    
    const checklistsToday = verifications.filter(h => h.date.startsWith(today));
    const checklistProgress = Math.min(100, (checklistsToday.length / 2) * 100);
    
    const todayShift = shifts.find(s => s.date === today);
    const nurseOnDuty = todayShift ? users.find(u => u.id === todayShift.infirmierId) : null;
    const paramedicOnDuty = todayShift ? users.find(u => u.id === todayShift.ambulancierId) : null;

    // --- Actions ---
    const handleCreateDemoPatient = async () => {
        try {
            const demoTemplate = DEFAULT_PATIENTS[0];
            const { id, dateCreation, ...patientData } = demoTemplate;
            await addPatient({
                ...patientData,
                nom: `${patientData.nom} ${Math.floor(Math.random() * 1000)}`,
                prenom: patientData.prenom
            });
            addNotification("Patient de démonstration ajouté.", 'success');
        } catch (error) {
            console.error(error);
        }
    };

    // --- HELPER COMPONENTS ---

    const QuickAction: React.FC<{ 
        icon: React.ElementType, 
        label: string, 
        color: string, 
        onClick: () => void 
    }> = ({ icon: Icon, label, color, onClick }) => (
        <button 
            onClick={onClick} 
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group hover:border-${color}-500`}
        >
            <div className={`p-3 rounded-full bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <span className="font-semibold text-xs text-gray-600 dark:text-gray-300 text-center">{label}</span>
        </button>
    );

    const StatWidget: React.FC<{
        label: string,
        value: string | number,
        subtext?: string,
        icon: React.ElementType,
        color: string
    }> = ({ label, value, subtext, icon: Icon, color }) => (
        <Card className={`relative overflow-hidden border-l-4 border-${color}-500`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-1">{label}</p>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100">{value}</h3>
                    {subtext && <p className={`text-xs font-medium mt-1 text-${color}-600`}>{subtext}</p>}
                </div>
                <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600`}>
                    <Icon size={24} />
                </div>
            </div>
        </Card>
    );

    // --- RENDERERS BY ROLE ---

    const renderInfirmierDashboard = () => {
        const medicalStockIssues = stockItems.filter(i => i.categorie === 'Médicaments' && i.quantite <= i.seuilAlerte);
        const myChecklistDone = verifications.some(v => v.date.startsWith(today) && v.user === currentUser?.nom && v.type === 'Infirmier');

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 font-medium text-sm mb-2">Mes Patients Actifs</p>
                        <div className="flex justify-between items-end">
                            <h3 className="text-4xl font-bold">{myInterventions.length}</h3>
                            <HeartPulse size={32} className="opacity-80 text-yellow-300"/>
                        </div>
                        <div className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded">
                            {myInterventions.filter(i => i.type === 'Urgence').length} Urgences
                        </div>
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </Card>

                <StatWidget 
                    label="Pharmacie & Sac" 
                    value={medicalStockIssues.length > 0 ? "Attention" : "OK"} 
                    subtext={medicalStockIssues.length > 0 ? `${medicalStockIssues.length} ruptures` : "Stock complet"}
                    icon={Package} 
                    color={medicalStockIssues.length > 0 ? "red" : "green"} 
                />

                <div onClick={() => setCurrentView('nurse-verification')} className="cursor-pointer">
                    <StatWidget 
                        label="Checklist Départ" 
                        value={myChecklistDone ? "Fait" : "À Faire"} 
                        subtext={myChecklistDone ? "Validé ce jour" : "Requis avant départ"}
                        icon={ListChecks} 
                        color={myChecklistDone ? "green" : "orange"} 
                    />
                </div>

                {/* Actions Grid */}
                <div className="md:col-span-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Actions Rapides</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickAction icon={UserPlus} label="Nouveau Patient" color="blue" onClick={() => setCurrentView('patients')} />
                        <QuickAction icon={Stethoscope} label="Bilan de Soins" color="red" onClick={() => setCurrentView('interventions')} />
                        <QuickAction icon={Tent} label="Accès PMA" color="orange" onClick={() => setCurrentView('pma')} />
                        <QuickAction icon={ClipboardList} label="Ma Checklist" color="green" onClick={() => setCurrentView('nurse-verification')} />
                    </div>
                </div>

                {/* Active Task List */}
                <div className="md:col-span-3">
                    <Card title="Mes Interventions en cours">
                        {myInterventions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Activity size={32} className="mx-auto mb-2 opacity-30"/>
                                <p>Aucune intervention assignée pour le moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myInterventions.map(i => (
                                    <div key={i.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600">
                                                {i.type === 'Urgence' ? <AlertOctagon size={20}/> : <Ambulance size={20}/>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-gray-100">{i.patientName}</div>
                                                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                    <MapPin size={10} className="mr-1"/> {i.adresseDepart}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setCurrentView('interventions', { id: i.id })} className="btn-secondary text-xs px-3 py-1">
                                            Dossier
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    };

    const renderAmbulancierDashboard = () => {
        const oxygenAlerts = oxygenBottles.filter(b => b.status === 'Vide' || b.currentPressure < 50);
        const myChecklistDone = verifications.some(v => v.date.startsWith(today) && v.user === currentUser?.nom && v.type === 'Ambulancier');
        const myVehicle = vehicules[0]; // Mock

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-green-100 font-medium text-sm mb-2">Mon Véhicule (Jour)</p>
                        <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-bold">{myVehicle || 'Non assigné'}</h3>
                            <Truck size={32} className="opacity-80"/>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-white/20 px-2 py-1 rounded flex items-center"><Fuel size={12} className="mr-1"/> 3/4</span>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">250 km auj.</span>
                        </div>
                    </div>
                </Card>

                <StatWidget 
                    label="Parc Oxygène" 
                    value={oxygenAlerts.length > 0 ? `${oxygenAlerts.length} Alertes` : "Optimal"} 
                    subtext={oxygenAlerts.length > 0 ? "Bouteilles à changer" : "Pression OK"}
                    icon={Wind} 
                    color={oxygenAlerts.length > 0 ? "red" : "blue"} 
                />

                <div onClick={() => setCurrentView('ambulancier-verification')} className="cursor-pointer">
                    <StatWidget 
                        label="Checklist Véhicule" 
                        value={myChecklistDone ? "Fait" : "À Faire"} 
                        subtext={myChecklistDone ? "Prêt au départ" : "Vérification requise"}
                        icon={ListChecks} 
                        color={myChecklistDone ? "green" : "orange"} 
                    />
                </div>

                {/* Actions Grid */}
                <div className="md:col-span-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Actions Rapides</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickAction icon={ListChecks} label="Checklist Véhicule" color="green" onClick={() => setCurrentView('ambulancier-verification')} />
                        <QuickAction icon={Wind} label="Gestion Oxygène" color="blue" onClick={() => setCurrentView('oxygen')} />
                        <QuickAction icon={Ambulance} label="Mes Missions" color="red" onClick={() => setCurrentView('interventions')} />
                        <QuickAction icon={Tent} label="Support PMA" color="orange" onClick={() => setCurrentView('pma')} />
                    </div>
                </div>

                {/* Roadmap */}
                <div className="md:col-span-3">
                    <Card title="Feuille de route du jour">
                        {myInterventions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Truck size={32} className="mx-auto mb-2 opacity-30"/>
                                <p>Aucune mission de transport en cours.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myInterventions.map(i => (
                                    <div key={i.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 shadow-sm">
                                        <div>
                                            <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                {i.type === 'Urgence' && <AlertTriangle size={16} className="text-red-500"/>}
                                                Transport: {i.adresseArrivee}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Patient: {i.patientName} • Départ: {i.adresseDepart}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300 border dark:border-gray-600">{i.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    };

    const renderAdminDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Global Stats Widgets */}
            <StatWidget 
                label="Interventions Actives" 
                value={activeInterventions.length} 
                subtext="En cours de traitement"
                icon={Activity} 
                color="blue" 
            />
            <StatWidget 
                label="Patients PMA" 
                value={pmaPatients.length} 
                subtext="Prise en charge poste"
                icon={Tent} 
                color="orange" 
            />
            <StatWidget 
                label="Flotte Disponible" 
                value={availableVehicles.length} 
                subtext={`${vehicules.length} véhicules total`}
                icon={Ambulance} 
                color="green" 
            />
            <StatWidget 
                label="Santé du Stock" 
                value={`${Math.round(stockHealth)}%`} 
                subtext={lowStockItems.length > 0 ? `${lowStockItems.length} alertes` : "Optimal"}
                icon={Package} 
                color={stockHealth < 50 ? "red" : "purple"} 
            />

            {/* Quick Actions */}
            <div className="md:col-span-2 lg:col-span-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Commandes Rapides</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <QuickAction icon={UserPlus} label="Nouveau Patient" color="blue" onClick={() => setCurrentView('patients')} />
                    <QuickAction icon={Stethoscope} label="Intervention" color="red" onClick={() => setCurrentView('interventions')} />
                    <QuickAction icon={Tent} label="Gestion PMA" color="orange" onClick={() => setCurrentView('pma')} />
                    <QuickAction icon={Package} label="Stock" color="purple" onClick={() => setCurrentView('stock')} />
                    <QuickAction icon={Calendar} label="Planning" color="indigo" onClick={() => setCurrentView('planning')} />
                    <QuickAction icon={ListChecks} label="Checklists" color="green" onClick={() => setCurrentView('nurse-verification')} />
                </div>
            </div>

            {/* Team on Duty */}
            <Card className="md:col-span-1 lg:col-span-2 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Users size={18} className="mr-2 text-primary" /> Équipe de Garde
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Aujourd'hui</span>
                </div>
                
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-white dark:border-gray-700 shadow-sm">
                                {nurseOnDuty ? nurseOnDuty.nom.charAt(0) : '?'}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${nurseOnDuty ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Infirmier(ère)</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{nurseOnDuty ? nurseOnDuty.nom : 'Non assigné'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl border-2 border-white dark:border-gray-700 shadow-sm">
                                {paramedicOnDuty ? paramedicOnDuty.nom.charAt(0) : '?'}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${paramedicOnDuty ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ambulancier</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{paramedicOnDuty ? paramedicOnDuty.nom : 'Non assigné'}</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-auto pt-4 border-t dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500">Conformité Matériel</span>
                        <span className="text-xs font-bold text-primary">{Math.round(checklistProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-1000" style={{ width: `${checklistProgress}%` }}></div>
                    </div>
                </div>
            </Card>

            {/* Recent Activity / Timeline */}
            <Card className="md:col-span-1 lg:col-span-2 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-primary" /> Activité Récente
                    </h3>
                    <button onClick={() => setCurrentView('admin')} className="text-xs text-primary hover:underline flex items-center">
                        Voir tout <ArrowRight size={12} className="ml-1"/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {interventions.slice(0, 5).map(i => (
                        <div key={i.id} className="flex gap-3 items-start">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${i.type === 'Urgence' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {i.type === 'Urgence' ? 'Urgence :' : 'Transport :'} {i.patientName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(i.dateCreation).toLocaleTimeString()} • {i.status}
                                </p>
                            </div>
                        </div>
                    ))}
                    {interventions.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">Aucune activité récente.</p>
                    )}
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6 animate-slide-in">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg flex items-center justify-center text-white border-2 border-white dark:border-gray-700 p-2">
                        <img src={appLogo} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-baseline">
                            {greeting}, <span className="text-primary ml-2">{currentUser?.nom.split(' ')[0]}</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1 text-sm font-medium">
                            <Calendar size={16} className="mr-2" />
                            {currentTime.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                
                {/* Clock Badge */}
                <div className="hidden md:block">
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-md font-mono text-xl tracking-widest border border-gray-700 flex items-center gap-2">
                        <Clock size={18} className="text-primary"/>
                        {currentTime.toLocaleTimeString('fr-FR')}
                    </div>
                </div>
            </div>

            {/* Content Switcher based on Role */}
            {currentUser?.role === 'infirmier' && renderInfirmierDashboard()}
            {currentUser?.role === 'ambulancier' && renderAmbulancierDashboard()}
            {(currentUser?.role === 'admin' || currentUser?.role === 'medecin' || !['infirmier', 'ambulancier', 'regulateur'].includes(currentUser?.role || '')) && renderAdminDashboard()}

        </div>
    );
};

export default Dashboard;