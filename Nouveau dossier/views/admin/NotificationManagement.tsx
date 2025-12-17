
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../components/Card';
import { 
    Send, Users, User, Info, CheckCircle, Loader2, 
    Megaphone, AlertTriangle, BellRing, Clock, X,
    MessageSquare, Sparkles, History
} from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import { useNotification } from '../../providers/NotificationProvider';
import { UserRole, AppNotification } from '../../types';
import { useAuth } from '../../providers/AuthProvider';

const TEMPLATES = [
    { label: "Rappel Inventaire", text: "Merci de bien vouloir finaliser l'inventaire avant 18h aujourd'hui." },
    { label: "Réunion Équipe", text: "Réunion de coordination prévue demain matin à 09h00 en salle de régulation." },
    { label: "Maintenance Véhicules", text: "Rappel : Le véhicule VSL-02 doit passer en maintenance ce jour." },
    { label: "Urgence Absolue", text: "ATTENTION : Plan Blanc déclenché. Mobilisation générale requise." },
];

const NotificationManagement: React.FC = () => {
    const { users = [], sendAppNotification, allNotifications = [] } = useData();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'all' | 'role' | 'individual'>('all');
    const [priority, setPriority] = useState<'info' | 'urgent'>('info');
    const [selectedRole, setSelectedRole] = useState<UserRole>('infirmier');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

    // Initialiser selectedUser avec le premier utilisateur dispo si nécessaire
    useEffect(() => {
        if (targetType === 'individual' && !selectedUser && users.length > 0) {
            setSelectedUser(users[0].id);
        }
    }, [targetType, users, selectedUser]);

    const sentHistory = useMemo(() => {
        // Filtrer les messages envoyés manuellement (general_message ou regulation_alert sans lien automatique)
        return allNotifications
            .filter(n => (n.type === 'general_message' || n.type === 'regulation_alert') && !n.id.startsWith('alert-')) // Exclure les alertes automatiques d'intervention
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [allNotifications]);

    const handleSend = async () => {
        if (!message.trim()) {
            addNotification("Veuillez saisir un message.", 'error');
            return;
        }

        let targets: string[] = [];

        if (targetType === 'all') {
            targets = users.map(u => u.id);
        } else if (targetType === 'role') {
            targets = users.filter(u => u.role === selectedRole).map(u => u.id);
        } else if (targetType === 'individual') {
            if (!selectedUser) {
                addNotification("Veuillez sélectionner un utilisateur.", 'error');
                return;
            }
            targets = [selectedUser];
        }

        if (targets.length === 0) {
            addNotification("Aucun destinataire trouvé.", 'error');
            return;
        }

        setIsSending(true);
        try {
            // Note: DataProvider.sendAppNotification envoie 'general_message' par défaut.
            // Pour supporter la priorité 'urgent', il faudrait idéalement modifier DataProvider,
            // mais ici nous allons simuler l'urgence par le texte ou utiliser la fonction telle quelle
            // si elle ne permet pas de changer le type.
            // Hack pour la démo : on utilise le message pour passer l'urgence si le backend ne le gère pas,
            // ou on suppose que sendAppNotification pourrait être mis à jour.
            // Ici, nous utilisons la méthode standard.
            
            // Pour simuler l'urgence visuelle dans l'historique local (si on pouvait), 
            // mais l'appel API est fixe. On va préfixer le message si Urgent.
            const finalMessage = priority === 'urgent' ? `[URGENT] ${message}` : message;
            
            await sendAppNotification(targets, finalMessage);
            
            addNotification("Diffusion réussie.", 'success');
            setMessage('');
            setPriority('info');
        } catch (error) {
            console.error(error);
            addNotification("Erreur lors de l'envoi.", 'error');
        } finally {
            setIsSending(false);
        }
    };

    const getTargetLabel = () => {
        if (targetType === 'all') return "Tout le personnel";
        if (targetType === 'role') return `Équipe ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}s`;
        const u = users.find(u => u.id === selectedUser);
        return u ? u.nom : "Utilisateur";
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Megaphone className="mr-3 text-primary" /> Centre de Diffusion
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Envoyez des messages et alertes aux équipes en temps réel.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* COLONNE GAUCHE : COMPOSITION */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    <Card className="flex-1 flex flex-col shadow-xl border-t-4 border-primary">
                        
                        {/* 1. Cible */}
                        <div className="mb-6">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block tracking-wider">1. Destinataires</label>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <button
                                    onClick={() => setTargetType('all')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                        targetType === 'all'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                    }`}
                                >
                                    <Users size={20} className="mb-1" />
                                    <span className="text-sm font-semibold">Tous</span>
                                </button>
                                <button
                                    onClick={() => setTargetType('role')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                        targetType === 'role'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                    }`}
                                >
                                    <Users size={20} className="mb-1" />
                                    <span className="text-sm font-semibold">Par Rôle</span>
                                </button>
                                <button
                                    onClick={() => setTargetType('individual')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                        targetType === 'individual'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                    }`}
                                >
                                    <User size={20} className="mb-1" />
                                    <span className="text-sm font-semibold">Individuel</span>
                                </button>
                            </div>

                            {/* Sous-sélection */}
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                {targetType === 'role' && (
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                        className="input w-full"
                                    >
                                        <option value="infirmier">Infirmiers</option>
                                        <option value="ambulancier">Ambulanciers</option>
                                        <option value="regulateur">Régulateurs</option>
                                        <option value="admin">Administrateurs</option>
                                    </select>
                                )}

                                {targetType === 'individual' && (
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="input w-full"
                                    >
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.nom} ({u.role})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* 2. Message & Priorité */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">2. Message</label>
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button 
                                        onClick={() => setPriority('info')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center ${priority === 'info' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}
                                    >
                                        <Info size={14} className="mr-1"/> Info
                                    </button>
                                    <button 
                                        onClick={() => setPriority('urgent')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center ${priority === 'urgent' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}
                                    >
                                        <AlertTriangle size={14} className="mr-1"/> Urgent
                                    </button>
                                </div>
                            </div>

                            {/* Templates Rapides */}
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                {TEMPLATES.map((tpl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMessage(tpl.text)}
                                        className="flex-shrink-0 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors flex items-center"
                                    >
                                        <Sparkles size={12} className="mr-1 text-yellow-500"/> {tpl.label}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Rédigez votre message ici..."
                                className={`input w-full resize-none flex-1 text-base p-4 ${priority === 'urgent' ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10' : ''}`}
                            />
                            
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-400">{message.length} caractères</span>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end">
                            <button
                                onClick={handleSend}
                                disabled={isSending || !message.trim()}
                                className={`btn-primary flex items-center px-8 py-3 text-lg font-bold shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${priority === 'urgent' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                            >
                                {isSending ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
                                {priority === 'urgent' ? 'DIFFUSER ALERTE' : 'Envoyer'}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* COLONNE DROITE : APERÇU & HISTORIQUE */}
                <div className="space-y-6 flex flex-col">
                    
                    {/* Carte Aperçu */}
                    <Card className="bg-gray-50 dark:bg-gray-800/50 border-dashed border-2 border-gray-300 dark:border-gray-600">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 text-center">Aperçu en temps réel</h3>
                        
                        {/* Simulation Notification */}
                        <div className={`relative overflow-hidden rounded-lg shadow-md bg-white dark:bg-gray-800 border-l-4 p-4 ${priority === 'urgent' ? 'border-red-500' : 'border-blue-500'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full shrink-0 ${priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {priority === 'urgent' ? <BellRing size={20} className="animate-pulse"/> : <MessageSquare size={20}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={`font-bold text-sm ${priority === 'urgent' ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>
                                            {priority === 'urgent' ? 'Alerte Régulation' : 'Message Général'}
                                        </p>
                                        <span className="text-[10px] text-gray-400">Maintenant</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                                        {priority === 'urgent' && <span className="font-bold text-red-600">[URGENT] </span>}
                                        {message || <span className="italic text-gray-400">Votre message apparaîtra ici...</span>}
                                    </p>
                                    <div className="mt-2 text-[10px] text-gray-400 flex items-center">
                                        <Users size={10} className="mr-1"/> Pour: {getTargetLabel()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Carte Historique */}
                    <Card className="flex-1 flex flex-col overflow-hidden !p-0">
                        <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2 bg-white dark:bg-gray-800">
                            <History size={18} className="text-gray-400"/>
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Derniers envois</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {sentHistory.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-400">
                                    <p className="text-sm">Aucun historique récent.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {sentHistory.map((notif) => {
                                        const isUrgent = notif.message.includes('[URGENT]') || notif.type === 'regulation_alert';
                                        return (
                                            <div key={notif.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {isUrgent ? 'Urgent' : 'Info'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 flex items-center">
                                                        <Clock size={10} className="mr-1"/>
                                                        {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-2 mb-1">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                                                        {notif.targetUserId ? 
                                                            (users.find(u => u.id === notif.targetUserId)?.nom || 'Utilisateur') : 
                                                            'Diffusion'
                                                        }
                                                    </span>
                                                    {notif.isRead ? (
                                                        <div title="Lu"><CheckCircle size={12} className="text-green-500" /></div>
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-gray-300" title="Non lu"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default NotificationManagement;
