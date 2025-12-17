
import React, { useState } from 'react';
import { 
    Shield, Users, Calendar, FileText, Tag, Truck, ListChecks, 
    Building, Key, Database, Bell, Activity, DollarSign, BookOpen, Palette,
    LayoutDashboard, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

// Import all admin sub-components
import AdminDashboard from './admin/AdminDashboard';
import UserManagement from './admin/UserManagement';
import PlanningManagement from './admin/PlanningManagement';
import ReportsManagement from './admin/ReportsManagement';
import TarifsManagement from './admin/TarifsManagement';
import VehiculeManagement from './admin/VehiculeManagement';
import ChecklistManagement from './admin/ChecklistManagement';
import CompanyInfoManagement from './admin/CompanyInfoManagement';
import PermissionsManagement from './admin/PermissionsManagement';
import DataManagement from './admin/DataManagement';
import NotificationManagement from './admin/NotificationManagement';
import ActivityLogsManagement from './admin/ActivityLogsManagement';
import PayrollManagement from './admin/PayrollManagement';
import Documentation from './admin/Documentation';
import StyleGuide from './admin/StyleGuide';

type AdminTab = 
    | 'dashboard' 
    | 'users' | 'planning' | 'payroll' | 'permissions'
    | 'reports' | 'tarifs' | 'vehicules' | 'checklists' 
    | 'company' | 'notifications' | 'data' | 'logs'
    | 'docs' | 'styleguide';

interface MenuSection {
    title: string;
    items: {
        id: AdminTab;
        label: string;
        icon: React.ElementType;
        description: string;
    }[];
}

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuStructure: MenuSection[] = [
        {
            title: "Vue d'ensemble",
            items: [
                { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: 'Métriques clés et alertes système' },
                { id: 'reports', label: 'Rapports', icon: FileText, description: 'Statistiques opérationnelles et financières' },
            ]
        },
        {
            title: "RH & Équipes",
            items: [
                { id: 'users', label: 'Utilisateurs', icon: Users, description: 'Gestion des comptes et profils' },
                { id: 'planning', label: 'Planning', icon: Calendar, description: 'Génération et gestion des plannings' },
                { id: 'payroll', label: 'Paie', icon: DollarSign, description: 'Calcul des primes et bulletins' },
                { id: 'permissions', label: 'Permissions', icon: Key, description: 'Contrôle d\'accès par rôle' },
            ]
        },
        {
            title: "Opérations",
            items: [
                { id: 'vehicules', label: 'Véhicules', icon: Truck, description: 'Gestion du parc ambulancier' },
                { id: 'checklists', label: 'Checklists', icon: ListChecks, description: 'Configuration des vérifications matériel' },
                { id: 'tarifs', label: 'Tarifs', icon: Tag, description: 'Catalogue des prestations' },
            ]
        },
        {
            title: "Système",
            items: [
                { id: 'company', label: 'Entreprise', icon: Building, description: 'Informations légales et logo' },
                { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Centre d\'envoi de messages' },
                { id: 'logs', label: 'Logs', icon: Activity, description: 'Audit et traçabilité des actions' },
                { id: 'data', label: 'Données', icon: Database, description: 'Maintenance et réinitialisation' },
            ]
        },
        {
            title: "Aide",
            items: [
                { id: 'docs', label: 'Docs', icon: BookOpen, description: 'Manuel utilisateur' },
                { id: 'styleguide', label: 'Style', icon: Palette, description: 'Composants UI' },
            ]
        }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <AdminDashboard setActiveTab={(t) => setActiveTab(t as AdminTab)} />;
            case 'users': return <UserManagement />;
            case 'planning': return <PlanningManagement />;
            case 'payroll': return <PayrollManagement />;
            case 'permissions': return <PermissionsManagement />;
            case 'reports': return <ReportsManagement />;
            case 'tarifs': return <TarifsManagement />;
            case 'vehicules': return <VehiculeManagement />;
            case 'checklists': return <ChecklistManagement />;
            case 'company': return <CompanyInfoManagement />;
            case 'notifications': return <NotificationManagement />;
            case 'logs': return <ActivityLogsManagement />;
            case 'data': return <DataManagement />;
            case 'docs': return <Documentation />;
            case 'styleguide': return <StyleGuide />;
            default: return <AdminDashboard setActiveTab={(t) => setActiveTab(t as AdminTab)} />;
        }
    };

    const activeItemInfo = menuStructure.flatMap(s => s.items).find(i => i.id === activeTab);

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] bg-gray-100 dark:bg-gray-900 transition-all duration-300">
            
            {/* --- MOBILE NAVIGATION (Horizontal Scroll) --- */}
            <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
                <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                     <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Shield className="mr-2 text-primary" size={20} /> Administration
                    </h2>
                </div>
                <div className="overflow-x-auto no-scrollbar p-2">
                    <div className="flex space-x-2">
                        {menuStructure.flatMap(section => section.items).map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    flex-shrink-0 flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all
                                    ${activeTab === item.id
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }
                                `}
                            >
                                <item.icon size={16} className="mr-2" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- DESKTOP NAVIGATION (Collapsible Sidebar) --- */}
            <aside 
                className={`
                    hidden lg:flex flex-col shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 
                    overflow-y-auto h-[calc(100vh-64px)] sticky top-0 custom-scrollbar
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-20' : 'w-72'}
                `}
            >
                <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b dark:border-gray-700/50 mb-2`}>
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                Administration
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Configuration</p>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                        title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-3 pb-6 space-y-6">
                    {menuStructure.map((section, idx) => (
                        <div key={idx}>
                            {!isCollapsed && (
                                <h3 className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider opacity-80 animate-in fade-in duration-300">
                                    {section.title}
                                </h3>
                            )}
                            {isCollapsed && idx > 0 && <div className="border-t dark:border-gray-700/50 my-2 mx-2"></div>}
                            
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            title={isCollapsed ? item.label : ''}
                                            className={`
                                                w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                                                ${isActive
                                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                                }
                                                ${isCollapsed ? 'justify-center' : 'justify-between'}
                                            `}
                                        >
                                            <div className="flex items-center">
                                                <item.icon 
                                                    size={20} 
                                                    className={`
                                                        transition-colors 
                                                        ${isActive ? 'text-primary dark:text-blue-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                                                        ${!isCollapsed ? 'mr-3' : ''}
                                                    `} 
                                                />
                                                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                                            </div>
                                            {!isCollapsed && isActive && <ChevronRight size={14} className="text-primary opacity-100" />}
                                            
                                            {/* Tooltip on Hover when collapsed */}
                                            {isCollapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                                    {item.label}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
                {/* Context Header */}
                <div className="mb-8 hidden lg:flex flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
                        {activeItemInfo?.icon && React.createElement(activeItemInfo.icon, { className: "text-primary h-8 w-8" })}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {activeItemInfo?.label}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {activeItemInfo?.description}
                        </p>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Admin;
