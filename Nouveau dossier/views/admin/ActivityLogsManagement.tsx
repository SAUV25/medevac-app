import React, { useMemo, useState } from 'react';
import Card from '../../components/Card';
import { useData } from '../../providers/DataProvider';
import { useAuth } from '../../providers/AuthProvider';
import { User, ActivityLog } from '../../types';
import { 
    Search, Filter, Download, ChevronLeft, ChevronRight, 
    Shield, Database, UserCheck, AlertTriangle, FileText,
    PlusCircle, Edit, Trash2, LogIn, LogOut, RefreshCw, Calendar, Info, CheckCircle, Activity
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

// --- Helper Components ---

const LogBadge: React.FC<{ action: string }> = ({ action }) => {
    let color = 'bg-gray-100 text-gray-700 border-gray-200';
    let Icon = Info;
    let label = action;

    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('login')) {
        color = 'bg-green-100 text-green-700 border-green-200';
        Icon = LogIn;
        label = 'Connexion';
    } else if (lowerAction.includes('logout')) {
        color = 'bg-gray-100 text-gray-600 border-gray-200';
        Icon = LogOut;
        label = 'Déconnexion';
    } else if (lowerAction.includes('create') || lowerAction.includes('add')) {
        color = 'bg-blue-50 text-blue-700 border-blue-200';
        Icon = PlusCircle;
        label = 'Création';
    } else if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('save')) {
        color = 'bg-orange-50 text-orange-700 border-orange-200';
        Icon = Edit;
        label = 'Modification';
    } else if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
        color = 'bg-red-50 text-red-700 border-red-200';
        Icon = Trash2;
        label = 'Suppression';
    } else if (lowerAction.includes('generate')) {
        color = 'bg-purple-50 text-purple-700 border-purple-200';
        Icon = RefreshCw;
        label = 'Génération';
    } else if (lowerAction.includes('request')) {
        color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        Icon = Calendar;
        label = 'Demande';
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            <Icon size={12} />
            {label}
        </span>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
        <div className={`p-3 rounded-full mr-4 bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{label}</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

// --- Main Component ---

const ActivityLogsManagement: React.FC = () => {
    const { activityLogs = [] } = useData();
    const { users = [] } = useAuth();
    
    // Filters State
    const [selectedUserId, setSelectedUserId] = useState('');
    const [actionType, setActionType] = useState<'all' | 'auth' | 'write' | 'delete'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return activityLogs
            .filter(log => {
                if (selectedUserId && log.userId !== selectedUserId) return false;

                const logDate = new Date(log.timestamp);
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (logDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (logDate > end) return false;
                }
                
                if (actionType !== 'all') {
                    const act = log.action.toLowerCase();
                    if (actionType === 'auth' && !act.includes('login') && !act.includes('logout')) return false;
                    if (actionType === 'write' && !act.includes('create') && !act.includes('add') && !act.includes('update')) return false;
                    if (actionType === 'delete' && !act.includes('delete')) return false;
                }

                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    return log.details.toLowerCase().includes(term) || 
                           log.action.toLowerCase().includes(term) || 
                           log.userName.toLowerCase().includes(term);
                }

                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [activityLogs, selectedUserId, startDate, endDate, searchTerm, actionType]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Stats Calculation
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        return {
            total: activityLogs.length,
            todayCount: activityLogs.filter(l => new Date(l.timestamp).toDateString() === today).length,
            errors: activityLogs.filter(l => l.action.includes('error') || l.action.includes('fail')).length,
            activeUsers: new Set(activityLogs.filter(l => new Date(l.timestamp).toDateString() === today).map(l => l.userId)).size
        };
    }, [activityLogs]);

    // Export CSV
    const handleExport = () => {
        const headers = ["Date", "Heure", "Utilisateur", "Action", "Détails"];
        const rows = filteredLogs.map(log => [
            new Date(log.timestamp).toLocaleDateString(),
            new Date(log.timestamp).toLocaleTimeString(),
            `"${log.userName}"`,
            log.action,
            `"${log.details.replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + 
            [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `medevac_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetFilters = () => {
        setSelectedUserId('');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setActionType('all');
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Événements" value={stats.total} icon={Database} color="blue" />
                <StatCard label="Actions Aujourd'hui" value={stats.todayCount} icon={Activity} color="green" />
                <StatCard label="Utilisateurs Actifs" value={stats.activeUsers} icon={UserCheck} color="purple" />
                <StatCard label="Erreurs / Alertes" value={stats.errors} icon={AlertTriangle} color="red" />
            </div>

            <Card className="flex flex-col">
                {/* Filters Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 pb-6 border-b dark:border-gray-700 mb-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Période</label>
                            <div className="flex gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input text-xs py-1.5" />
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input text-xs py-1.5" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Utilisateur</label>
                            <select
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                                className="input w-full text-sm py-1.5"
                            >
                                <option value="">Tous les utilisateurs</option>
                                {users.map((user: User) => (
                                    <option key={user.id} value={user.id}>{user.nom}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Type d'action</label>
                            <select
                                value={actionType}
                                onChange={e => setActionType(e.target.value as any)}
                                className="input w-full text-sm py-1.5"
                            >
                                <option value="all">Tout voir</option>
                                <option value="auth">Connexions / Sécurité</option>
                                <option value="write">Créations / Modifs</option>
                                <option value="delete">Suppressions</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Recherche</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    placeholder="Mot-clé..." 
                                    className="input w-full pl-8 py-1.5 text-sm"
                                />
                                <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full xl:w-auto">
                        <button onClick={handleResetFilters} className="btn-secondary flex items-center justify-center flex-1 xl:flex-none py-2 px-3 text-sm">
                            <Filter size={16} className="mr-2"/> Reset
                        </button>
                        <button onClick={handleExport} className="btn-primary flex items-center justify-center flex-1 xl:flex-none py-2 px-3 text-sm shadow-sm">
                            <Download size={16} className="mr-2"/> Export CSV
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-lg border dark:border-gray-700 mb-4">
                    <table className="min-w-full bg-white dark:bg-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">
                            <tr>
                                <th className="p-3 w-40">Horodatage</th>
                                <th className="p-3 w-48">Utilisateur</th>
                                <th className="p-3 w-32 text-center">Type</th>
                                <th className="p-3">Détails de l'action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginatedLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                                    <td className="p-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                                        {new Date(log.timestamp).toLocaleDateString()} <span className="text-gray-400">|</span> {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="p-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {log.userName}
                                    </td>
                                    <td className="p-3 text-center">
                                        <LogBadge action={log.action} />
                                    </td>
                                    <td className="p-3 text-sm text-gray-600 dark:text-gray-300 break-words max-w-md">
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3 w-12 h-12 mx-auto flex items-center justify-center mb-3">
                                <FileText className="text-gray-400" size={24}/>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun résultat pour cette recherche.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredLogs.length > 0 && (
                    <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} sur {filteredLogs.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)} 
                                disabled={currentPage === 1}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)} 
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ActivityLogsManagement;