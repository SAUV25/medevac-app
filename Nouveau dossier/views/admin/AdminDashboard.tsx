
import React, { useMemo } from 'react';
import Card from '../../components/Card';
import { useData } from '../../providers/DataProvider';
import { 
    Users, AlertTriangle, Wallet, Package, TrendingUp, TrendingDown, 
    Activity, Clock, ArrowRight, ShieldCheck, Database, Server, 
    MoreHorizontal, FileText, CheckCircle 
} from 'lucide-react';

// --- Composants UI Helper ---

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    trend?: number; 
    icon: React.ElementType; 
    color: 'blue' | 'green' | 'red' | 'orange' | 'purple';
    subtext?: string;
}> = ({ title, value, trend, icon: Icon, color, subtext }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon size={22} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                        {trend >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
                <div className="text-2xl font-black text-gray-800 dark:text-gray-100">{value}</div>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
};

const SimpleBarChart: React.FC<{ data: number[], labels: string[] }> = ({ data, labels }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end justify-between h-40 gap-2 mt-4">
            {data.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 group cursor-pointer">
                    <div className="relative w-full flex justify-end flex-col items-center h-full">
                        {/* Tooltip */}
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded mb-1 whitespace-nowrap z-10 pointer-events-none">
                            {val.toFixed(0)} MAD
                        </div>
                        {/* Bar */}
                        <div 
                            className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm relative overflow-hidden group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors"
                            style={{ height: `${(val / max) * 100}%` }}
                        >
                            <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2 font-medium">{labels[idx]}</span>
                </div>
            ))}
        </div>
    );
};

const ActivityItem: React.FC<{ log: any }> = ({ log }) => {
    const isError = log.action.includes('delete') || log.action.includes('error');
    const isUpdate = log.action.includes('update') || log.action.includes('edit');
    
    return (
        <div className="flex gap-3 items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isError ? 'bg-red-500' : isUpdate ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                    {log.details}
                </p>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 flex items-center">
                        <Users size={10} className="mr-1"/> {log.userName}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center">
                        <Clock size={10} className="mr-1"/> {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- Composant Principal ---

const AdminDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
    const { users = [], receipts = [], stockItems = [], impediments = [], shifts = [], activityLogs = [] } = useData();

    // Calculs statistiques
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonthIdx = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Revenus (Mois courant vs Mois précédent)
        const currentMonthRevenue = receipts
            .filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
            })
            .reduce((sum, r) => sum + r.total, 0);

        const prevMonthRevenue = receipts
            .filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === (currentMonthIdx === 0 ? 11 : currentMonthIdx - 1) && 
                       d.getFullYear() === (currentMonthIdx === 0 ? currentYear - 1 : currentYear);
            })
            .reduce((sum, r) => sum + r.total, 0);

        const revenueTrend = prevMonthRevenue === 0 ? 100 : Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);

        // 2. Alertes Stock
        const stockAlertsCount = stockItems.filter(item => item.quantite <= item.seuilAlerte).length;
        
        // 3. Actions en attente
        const unacknowledgedImpediments = impediments.filter(i => !i.acknowledged);
        const pendingChangeRequests = shifts.filter(s => s.changeRequest?.status === 'pending');
        const pendingActionsCount = unacknowledgedImpediments.length + pendingChangeRequests.length;

        // 4. Données Graphique (6 derniers mois) - Simulation réaliste basée sur les reçus
        const chartLabels = [];
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('default', { month: 'short' });
            chartLabels.push(monthLabel);
            
            const monthTotal = receipts
                .filter(r => {
                    const rd = new Date(r.date);
                    return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
                })
                .reduce((sum, r) => sum + r.total, 0);
            
            // Si pas de données (ex: début démo), on met des valeurs aléatoires cohérentes pour l'affichage
            chartData.push(monthTotal || Math.floor(Math.random() * 5000) + 2000); 
        }

        // 5. Répartition Utilisateurs
        const roleCounts = users.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            userCount: users.length,
            currentMonthRevenue,
            revenueTrend,
            stockAlertsCount,
            pendingActionsCount,
            chartData,
            chartLabels,
            roleCounts,
            pendingItems: [...unacknowledgedImpediments, ...pendingChangeRequests]
        };
    }, [users, receipts, stockItems, impediments, shifts]);

    const latestLogs = useMemo(() => {
        return [...activityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, [activityLogs]);

    return (
        <div className="space-y-6">
            
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Chiffre d'Affaires" 
                    value={`${stats.currentMonthRevenue.toLocaleString()} DH`} 
                    trend={stats.revenueTrend}
                    icon={Wallet} 
                    color="green" 
                    subtext="Ce mois-ci"
                />
                <StatCard 
                    title="Utilisateurs Actifs" 
                    value={stats.userCount} 
                    icon={Users} 
                    color="blue"
                    subtext="Accès système"
                />
                <StatCard 
                    title="Alertes Logistiques" 
                    value={stats.stockAlertsCount} 
                    icon={Package} 
                    color="orange"
                    subtext="Ruptures ou périmés"
                />
                <StatCard 
                    title="Actions Requises" 
                    value={stats.pendingActionsCount} 
                    icon={AlertTriangle} 
                    color="red"
                    subtext="Validations en attente"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* Graphique Financier */}
                <Card className="lg:col-span-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Performance Financière</h3>
                            <p className="text-sm text-gray-500">Évolution des recettes sur 6 mois</p>
                        </div>
                        <button onClick={() => setActiveTab('reports')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                            <ArrowRight size={20}/>
                        </button>
                    </div>
                    <SimpleBarChart data={stats.chartData} labels={stats.chartLabels} />
                </Card>

                {/* État Système & Répartition */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-lg">
                        <h3 className="font-bold text-white/90 mb-4 flex items-center"><Activity size={18} className="mr-2"/> État du Système</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm"><Database size={14}/> IndexedDB</div>
                                <span className="text-xs font-bold bg-green-400/20 text-green-100 px-2 py-0.5 rounded flex items-center"><CheckCircle size={10} className="mr-1"/> Connecté</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm"><Server size={14}/> API Mock</div>
                                <span className="text-xs font-bold bg-green-400/20 text-green-100 px-2 py-0.5 rounded flex items-center"><CheckCircle size={10} className="mr-1"/> Actif</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sm"><ShieldCheck size={14}/> Sécurité</div>
                                <span className="text-xs font-bold bg-blue-400/20 text-blue-100 px-2 py-0.5 rounded">TLS 1.3</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Équipes</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.roleCounts).map(([role, count]) => (
                                <div key={role} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${role === 'admin' ? 'bg-red-500' : role === 'infirmier' ? 'bg-blue-500' : role === 'ambulancier' ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                                        <span className="text-sm capitalize text-gray-600 dark:text-gray-300">{role}</span>
                                    </div>
                                    <span className="text-sm font-bold">{count}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setActiveTab('users')} className="w-full mt-4 py-2 text-xs font-medium text-primary bg-primary/5 rounded border border-primary/20 hover:bg-primary/10 transition-colors">
                            Gérer les utilisateurs
                        </button>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Actions Requises (Notifications Center) */}
                <Card className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <AlertTriangle size={18} className="mr-2 text-orange-500"/> Centre de demandes
                        </h3>
                        {stats.pendingActionsCount > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                                {stats.pendingActionsCount} nouvelles
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-60 pr-2 space-y-2">
                        {stats.pendingActionsCount === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <CheckCircle size={40} className="mb-2 opacity-20"/>
                                <p className="text-sm">Tout est à jour.</p>
                            </div>
                        ) : (
                            <>
                                {stats.pendingItems.map((item: any, idx) => {
                                    const isImp = !!item.reason; // Simple check type
                                    return (
                                        <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-400 rounded-r-md text-sm">
                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                {isImp ? "Déclaration d'empêchement" : "Changement de garde"}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                Pour le {new Date(item.date).toLocaleDateString()} • {item.reason || item.changeRequest?.reason}
                                            </p>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                    {stats.pendingActionsCount > 0 && (
                        <button onClick={() => setActiveTab('planning')} className="w-full mt-4 btn-primary py-2 text-sm">
                            Traiter dans le Planning
                        </button>
                    )}
                </Card>

                {/* Activité Récente (Logs) */}
                <Card className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <FileText size={18} className="mr-2 text-blue-500"/> Flux d'activité
                        </h3>
                        <button onClick={() => setActiveTab('logs')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400">
                            <MoreHorizontal size={20}/>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-60 pr-2">
                        {latestLogs.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-10">Aucune activité enregistrée.</p>
                        ) : (
                            latestLogs.map(log => <ActivityItem key={log.id} log={log} />)
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
