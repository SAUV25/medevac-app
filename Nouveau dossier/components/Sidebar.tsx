
import React, { useState, useMemo } from 'react';
import { 
    LayoutDashboard, Users, HeartPulse, Receipt, Calendar, 
    Warehouse, UserCheck, Ambulance, Settings, User as UserIcon, 
    ChevronsLeft, ChevronsRight, LogOut, Wind, ChevronRight, MessageSquare,
    Tent
} from 'lucide-react';
import { useTranslation } from '../providers/LanguageProvider';
// FIX: Corrected import path for types to be relative.
import { ViewContext, UserRole } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { useData } from '../providers/DataProvider';
import { DEFAULT_APP_LOGO } from '../constants';

type View = 'dashboard' | 'patients' | 'interventions' | 'receipts' | 'planning' | 'stock' | 'oxygen' | 'nurse-verification' | 'ambulancier-verification' | 'admin' | 'profile' | 'messages' | 'pma';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View, context?: ViewContext) => void;
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isMobileOpen = false, onCloseMobile }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { t } = useTranslation();
    const { currentUser, logout } = useAuth();
    const { permissions, interventions = [], stockItems = [], internalMessages = [], patients = [], headerInfo } = useData();

    const appLogo = headerInfo?.logo || DEFAULT_APP_LOGO;

    // Calcul des badges de notification
    const activeInterventionsCount = interventions.filter(i => i.status === 'En cours' || i.status === 'En attente').length;
    const lowStockCount = stockItems.filter(i => i.quantite <= i.seuilAlerte).length;
    const unreadMessagesCount = useMemo(() => {
        if (!currentUser) return 0;
        return internalMessages?.filter(m => m.receiverId === currentUser.id && !m.isRead).length || 0;
    }, [internalMessages, currentUser]);
    
    // Count active PMA patients (those with a triage status and not DCD - or simple count)
    const pmaActiveCount = useMemo(() => {
        return patients?.filter(p => p.triageStatus && p.triageStatus !== 'DCD').length || 0;
    }, [patients]);

    const userPermissions = useMemo(() => {
        if (!currentUser || !permissions) return [];
        return permissions[currentUser.role] || [];
    }, [currentUser, permissions]);

    // Structure du menu
    const menuGroups: { title: string; items: { id: View; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] }[] = [
        {
            title: "Général",
            items: [
                { id: 'dashboard', label: t.sidebar.dashboard, icon: LayoutDashboard },
                { id: 'planning', label: t.sidebar.planning, icon: Calendar },
                { id: 'messages', label: 'Messagerie', icon: MessageSquare, badge: unreadMessagesCount, badgeColor: 'bg-indigo-500' },
            ]
        },
        {
            title: "Opérations",
            items: [
                { id: 'interventions', label: t.sidebar.interventions, icon: HeartPulse, badge: activeInterventionsCount, badgeColor: 'bg-red-500' },
                { id: 'patients', label: t.sidebar.patients, icon: Users },
                { id: 'pma', label: t.sidebar.pma, icon: Tent, badge: pmaActiveCount, badgeColor: 'bg-orange-500' },
            ]
        },
        {
            title: "Logistique",
            items: [
                { id: 'stock', label: t.sidebar.stock, icon: Warehouse, badge: lowStockCount, badgeColor: 'bg-orange-500' },
                { id: 'oxygen', label: t.sidebar.oxygen, icon: Wind },
                { id: 'nurse-verification', label: t.sidebar.nurseVerification, icon: UserCheck },
                { id: 'ambulancier-verification', label: t.sidebar.ambulancierVerification, icon: Ambulance },
            ]
        },
        {
            title: "Finance",
            items: [
                { id: 'receipts', label: t.sidebar.receipts, icon: Receipt },
            ]
        }
    ];

    // Filtrer les éléments selon les permissions
    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => userPermissions.includes(item.id as any))
    })).filter(group => group.items.length > 0);

    const hasAdminAccess = userPermissions.includes('admin');
    const hasProfileAccess = userPermissions.includes('profile');

    return (
        <>
            {/* Backdrop Mobile */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onCloseMobile}
                />
            )}

            {/* Sidebar Container */}
            <aside 
                className={`
                    fixed md:static inset-y-0 left-0 z-40
                    flex flex-col bg-white dark:bg-gray-900 border-r dark:border-gray-800 
                    transition-all duration-300 shadow-xl md:shadow-none
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${isCollapsed ? 'w-20' : 'w-72'}
                `}
            >
                {/* --- HEADER --- */}
                <div className="h-20 flex items-center px-6 border-b dark:border-gray-800 shrink-0 justify-between">
                    <div className={`flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <div className="p-1 bg-white/5 rounded-lg">
                            <img src={appLogo} alt="Logo" className="h-10 w-auto object-contain" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-xl leading-none text-gray-900 dark:text-white tracking-tight">MedEvac</span>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">Médicale services</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- TOGGLE BUTTON (Desktop Only) --- */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)} 
                    className="absolute -right-3 top-24 bg-white dark:bg-gray-800 border dark:border-gray-700 p-1 rounded-full shadow-md text-gray-500 hover:text-primary transition-colors z-30 hidden md:block"
                >
                    {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                </button>

                {/* --- NAVIGATION --- */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 no-scrollbar">
                    {filteredGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {!isCollapsed && (
                                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}
                            <ul className="space-y-1">
                                {group.items.map(item => {
                                    const isActive = currentView === item.id;
                                    return (
                                        <li key={item.id} className="relative group/tooltip">
                                            <button
                                                onClick={() => setCurrentView(item.id)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                                                    ${isActive 
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                                    }
                                                    ${isCollapsed ? 'justify-center' : ''}
                                                `}
                                            >
                                                <item.icon 
                                                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`} 
                                                />
                                                
                                                {!isCollapsed && (
                                                    <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                                                )}

                                                {/* Badge Counter */}
                                                {item.badge !== undefined && item.badge > 0 && (
                                                    <span className={`
                                                        flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold text-white
                                                        ${item.badgeColor || 'bg-primary'}
                                                        ${isCollapsed ? 'absolute -top-1 -right-1 border-2 border-white dark:border-gray-900' : ''}
                                                    `}>
                                                        {item.badge > 99 ? '99+' : item.badge}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Tooltip for collapsed mode */}
                                            {isCollapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                                    {item.label}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {/* --- SYSTEM MENU --- */}
                    {((hasAdminAccess || hasProfileAccess) && !isCollapsed) && (
                        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2 border-t dark:border-gray-800">
                            Système
                        </h3>
                    )}
                    
                    <ul className="space-y-1">
                        {hasAdminAccess && (
                            <li>
                                <button
                                    onClick={() => setCurrentView('admin')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${currentView === 'admin' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'} ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <Settings className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span className="text-sm font-medium">Administration</span>}
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>

                {/* --- USER FOOTER --- */}
                <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
                        <div 
                            className="relative cursor-pointer group"
                            onClick={() => hasProfileAccess && setCurrentView('profile')}
                        >
                            {currentUser?.profilePicture ? (
                                <img 
                                    src={currentUser.profilePicture} 
                                    alt="User" 
                                    className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm font-bold">
                                    {currentUser?.nom.charAt(0)}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {currentUser?.nom}
                                </p>
                                <p className="text-xs text-gray-500 truncate capitalize">
                                    {currentUser?.role}
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={logout} 
                            className={`text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 ${isCollapsed ? 'mt-2' : ''}`}
                            title="Déconnexion"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;