
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bell, UserCircle, AlertTriangle, PackageX, UserX, CheckCircle, X, Sun, Moon, Siren, Timer, Menu, ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { useData } from '../providers/DataProvider';
// FIX: Corrected import path for types to be relative.
import { AppNotification } from '../types';
import { useTheme } from '../providers/ThemeProvider';

const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `Il y a ${Math.floor(interval)} an(s)`;
    interval = seconds / 2592000;
    if (interval > 1) return `Il y a ${Math.floor(interval)} mois`;
    interval = seconds / 86400;
    if (interval > 1) return `Il y a ${Math.floor(interval)} jour(s)`;
    interval = seconds / 3600;
    if (interval > 1) return `Il y a ${Math.floor(interval)} heure(s)`;
    interval = seconds / 60;
    if (interval > 1) return `Il y a ${Math.floor(interval)} minute(s)`;
    return "À l'instant";
};

const VIEW_BREADCRUMBS: Record<string, string[]> = {
    'dashboard': ['Accueil', 'Tableau de bord'],
    'patients': ['Opérations', 'Patients'],
    'interventions': ['Opérations', 'Interventions'],
    'pma': ['Opérations', 'Poste Médical Avancé'],
    'planning': ['Général', 'Planning'],
    'messages': ['Général', 'Messagerie'],
    'stock': ['Logistique', 'Stock'],
    'oxygen': ['Logistique', 'Oxygène'],
    'nurse-verification': ['Logistique', 'Vérif. Infirmier'],
    'ambulancier-verification': ['Logistique', 'Vérif. Ambulancier'],
    'receipts': ['Finance', 'Reçus'],
    'admin': ['Système', 'Administration'],
    'profile': ['Système', 'Mon Profil'],
};

const NotificationPanel: React.FC<{
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'stock_low': return <AlertTriangle className="h-5 w-5 text-warning" />;
            case 'stock_expired': return <PackageX className="h-5 w-5 text-danger" />;
            case 'impediment': return <UserX className="h-5 w-5 text-info" />;
            case 'intervention_alert': return <Siren className="h-5 w-5 text-danger animate-pulse" />;
            case 'regulation_alert': return <Timer className="h-5 w-5 text-orange-500 animate-pulse" />;
            default: return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const unreadNotifications = notifications.filter(n => !n.isRead);
    const readNotifications = notifications.filter(n => n.isRead);

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border dark:border-gray-700">
            <div className="p-3 flex justify-between items-center border-b dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Notifications</h3>
                {unreadNotifications.length > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-xs text-primary font-semibold hover:underline">
                        Tout marquer comme lu
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto">
                {unreadNotifications.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-3 pt-2">Non lues</h4>
                        {unreadNotifications.map(n => (
                            <div key={n.id} className={`flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${n.type === 'intervention_alert' || n.type === 'regulation_alert' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                <div className="mt-1">{getIcon(n.type)}</div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{n.message}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{timeSince(new Date(n.timestamp))}</p>
                                </div>
                                <button onClick={() => onMarkAsRead(n.id)} className="p-1" title="Marquer comme lu">
                                    <CheckCircle className="h-5 w-5 text-gray-300 hover:text-success" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                 {readNotifications.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-3 pt-2">Lues</h4>
                        {readNotifications.slice(0, 5).map(n => (
                            <div key={n.id} className="flex items-start gap-3 p-3 opacity-60">
                                <div>{getIcon(n.type)}</div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{n.message}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{timeSince(new Date(n.timestamp))}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {notifications.length === 0 && (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 p-8">Aucune notification pour le moment.</p>
                )}
            </div>
        </div>
    );
};

const Header: React.FC<{ title: string; currentView: string; onOpenMenu?: () => void }> = ({ title, currentView, onOpenMenu }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { appNotifications = [], markNotificationAsRead, markAllNotificationsAsRead } = useData();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { theme, toggleTheme } = useTheme();

    const unreadCount = useMemo(() => appNotifications.filter(n => !n.isRead).length, [appNotifications]);
    const sortedNotifications = useMemo(() => [...appNotifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [appNotifications]);

    // Check for high priority alerts (Urgence ou Régulation)
    const hasEmergencyAlert = useMemo(() => appNotifications.some(n => !n.isRead && (n.type === 'intervention_alert' || n.type === 'regulation_alert')), [appNotifications]);

    // Breadcrumbs Logic
    const breadcrumbs = useMemo(() => {
        return VIEW_BREADCRUMBS[currentView] || ['Application', title];
    }, [currentView, title]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex justify-between items-center dark:border-b dark:border-gray-700 h-auto shrink-0 transition-all">
            <div className="flex items-center gap-3">
                {onOpenMenu && (
                    <button 
                        onClick={onOpenMenu} 
                        className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Menu size={24} />
                    </button>
                )}
                <div className="flex flex-col">
                    <nav className="hidden md:flex items-center text-xs text-gray-500 dark:text-gray-400 mb-0.5" aria-label="Breadcrumb">
                        <Home size={10} className="mr-1" />
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <ChevronRight size={10} className="mx-1 text-gray-400" />}
                                <span className={index === breadcrumbs.length - 1 ? "font-semibold text-gray-700 dark:text-gray-200" : ""}>
                                    {crumb}
                                </span>
                            </React.Fragment>
                        ))}
                    </nav>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate leading-none">
                        {title}
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
                <div className="relative" ref={panelRef}>
                    <button onClick={() => setIsPanelOpen(prev => !prev)} className={`relative p-1 ${hasEmergencyAlert ? 'text-danger animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}>
                        {hasEmergencyAlert ? <Siren size={24} /> : <Bell size={24} />}
                        {unreadCount > 0 && (
                             <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isPanelOpen && (
                        <NotificationPanel
                            notifications={sortedNotifications}
                            onMarkAsRead={markNotificationAsRead}
                            onMarkAllAsRead={markAllNotificationsAsRead}
                        />
                    )}
                </div>
                <div className="flex items-center">
                    {currentUser?.profilePicture ? (
                        <img src={currentUser.profilePicture} alt="Profil" className="h-9 w-9 rounded-full object-cover"/>
                    ) : (
                         <UserCircle size={32} className="text-gray-500 dark:text-gray-400" />
                    )}
                    <div className="ml-2 hidden md:block">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                            {currentUser ? currentUser.nom : t.header.welcome}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
