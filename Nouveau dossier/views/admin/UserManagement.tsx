
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole } from '../../types';
import Card from '../../components/Card';
import { Plus, X, Edit, Trash2, Search, Filter, Shield, User as UserIcon, Mail, Lock, CheckCircle, Ban, Power, Smartphone } from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useNotification } from '../../providers/NotificationProvider';

const USER_ROLES: UserRole[] = ['admin', 'infirmier', 'ambulancier', 'regulateur', 'medecin'];

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const styles = {
        admin: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        regulateur: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
        infirmier: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        ambulancier: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        medecin: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
            {role}
        </span>
    );
};

const UserAvatar: React.FC<{ user: User; size?: string }> = ({ user, size = "w-10 h-10" }) => {
    if (user.profilePicture) {
        return <img src={user.profilePicture} alt={user.nom} className={`${size} rounded-full object-cover border-2 border-white shadow-sm ${!user.isActive ? 'grayscale opacity-70' : ''}`} />;
    }
    return (
        <div className={`${size} rounded-full flex items-center justify-center text-gray-500 font-bold border-2 border-white dark:border-gray-600 shadow-sm ${!user.isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gray-200 dark:bg-gray-700'}`}>
            {user.nom.charAt(0).toUpperCase()}
        </div>
    );
};

// --- Helper pour la politique de mot de passe ---
const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) return { isValid: false, message: "8 caractères minimum" };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: "1 majuscule requise" };
    if (!/[0-9]/.test(password)) return { isValid: false, message: "1 chiffre requis" };
    if (!/[!@#$%^&*]/.test(password)) return { isValid: false, message: "1 caractère spécial requis" };
    return { isValid: true };
};

const UserForm: React.FC<{ user?: User; onSave: (user: User) => void; onCancel: () => void; }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        nom: '', email: '', password: '', role: 'infirmier', isActive: true, isTwoFactorEnabled: false
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' }); 
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        
        if (e.target.name === 'password' && (e.target.value || !user)) {
            const validation = validatePassword(e.target.value);
            if (!validation.isValid && e.target.value.length > 0) {
                setPasswordError(validation.message || 'Mot de passe faible');
            } else {
                setPasswordError(null);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nom || !formData.email) return;
        
        // Si création ou modification du mot de passe, on vérifie la force
        if ((!user || formData.password) && formData.password) {
            const validation = validatePassword(formData.password);
            if (!validation.isValid) {
                setPasswordError(validation.message || 'Mot de passe invalide');
                return;
            }
        } else if (!user && !formData.password) {
            setPasswordError('Mot de passe requis pour un nouvel utilisateur');
            return;
        }

        const userToSave: User = {
            id: user?.id || Date.now().toString(),
            nom: formData.nom!,
            role: formData.role as UserRole,
            email: formData.email!,
            password: formData.password || user?.password || 'password', 
            profilePicture: user?.profilePicture || null,
            isActive: formData.isActive ?? true,
            isTwoFactorEnabled: formData.isTwoFactorEnabled ?? false,
            lastUpdated: new Date().toISOString(),
        };

        onSave(userToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg overflow-hidden !p-0 shadow-2xl">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        {user ? <Edit size={20} className="text-primary"/> : <Plus size={20} className="text-primary"/>}
                        {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                    </h2>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-gray-900">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon size={18} className="text-gray-400"/>
                            </div>
                            <input type="text" name="nom" value={formData.nom} onChange={handleChange} required className="input pl-10" placeholder="Ex: Jean Dupont" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400"/>
                            </div>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input pl-10" placeholder="jean.dupont@medevac.com" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
                            <div className="relative">
                                <select name="role" value={formData.role} onChange={handleChange} className="input appearance-none pl-10">
                                    {USER_ROLES.map(role => <option key={role} value={role} className="capitalize">{role}</option>)}
                                </select>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield size={16} className="text-gray-400"/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400"/>
                                </div>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder={user ? "(Inchangé)" : "Requis"} 
                                    className={`input pl-10 ${passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                />
                            </div>
                            {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <label className="flex items-center gap-3 cursor-pointer w-full">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Compte Actif</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Accès autorisé</span>
                                </div>
                            </label>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                            <label className="flex items-center gap-3 cursor-pointer w-full">
                                <input
                                    type="checkbox"
                                    name="isTwoFactorEnabled"
                                    checked={formData.isTwoFactorEnabled}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">Double Auth (2FA)</span>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400">Sécurité renforcée</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3 border-t dark:border-gray-700 mt-6">
                        <button type="button" onClick={onCancel} className="btn-secondary px-4">Annuler</button>
                        <button type="submit" className="btn-primary px-6 shadow-md flex items-center">
                            <CheckCircle size={18} className="mr-2"/> Enregistrer
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const UserManagement: React.FC = () => {
    const { users, addUser, updateUser, deleteUser } = useData();
    const { addNotification } = useNotification();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' 
                ? true 
                : statusFilter === 'active' ? user.isActive 
                : !user.isActive;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const handleSave = async (user: User) => {
        try {
            if (users.some(u => u.id === user.id)) {
                await updateUser(user);
                addNotification("Profil utilisateur mis à jour avec succès.", 'success');
            } else {
                const { id, profilePicture, lastUpdated, ...userToAdd } = user;
                await addUser(userToAdd);
                addNotification(`Utilisateur ${user.nom} ajouté avec succès.`, 'success');
            }
            setIsFormOpen(false);
            setEditingUser(undefined);
        } catch (error) {
            addNotification("Une erreur est survenue lors de l'enregistrement.", 'error');
        }
    };

    const handleDelete = async () => {
        if (deletingUser) {
            try {
                await deleteUser(deletingUser.id, deletingUser.nom);
                addNotification(`Utilisateur ${deletingUser.nom} supprimé définitivement.`, 'info');
                setDeletingUser(null);
            } catch (error) {
                addNotification("Erreur lors de la suppression.", 'error');
            }
        }
    };

    const toggleUserStatus = async (user: User) => {
        try {
            await updateUser({ ...user, isActive: !user.isActive });
            addNotification(`Compte de ${user.nom} ${user.isActive ? 'désactivé' : 'activé'}.`, 'success');
        } catch (error) {
            addNotification("Erreur lors du changement de statut.", 'error');
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <ConfirmationModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={handleDelete}
                title="Suppression Définitive"
            >
                <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                    <UserAvatar user={deletingUser!} />
                    <div>
                        <p className="font-bold text-red-800 dark:text-red-300">{deletingUser?.nom}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">Cette action est irréversible et supprimera tout l'historique de cet utilisateur. Préférez la désactivation si vous souhaitez conserver les données.</p>
                    </div>
                </div>
            </ConfirmationModal>

            {isFormOpen && <UserForm user={editingUser} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            
            <Card className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[200px]">
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        </div>
                        
                        <div className="relative">
                            <select 
                                value={roleFilter} 
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                className="input pl-8 pr-8 appearance-none capitalize cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <option value="all">Tous Rôles</option>
                                {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <Shield className="absolute left-2.5 top-2.5 text-gray-400" size={16}/>
                        </div>

                        <div className="relative">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="input pl-8 pr-8 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <option value="all">Tout Statut</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                            <Power className="absolute left-2.5 top-2.5 text-gray-400" size={16}/>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setEditingUser(undefined); setIsFormOpen(true); }} 
                        className="flex items-center px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-lg transform hover:scale-105 transition-all w-full lg:w-auto justify-center font-medium"
                    >
                        <Plus size={18} className="mr-2"/>
                        Ajouter un utilisateur
                    </button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                    <table className="min-w-full bg-white dark:bg-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                            <tr>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Utilisateur</th>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Email</th>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Rôle</th>
                                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300">Sécurité</th>
                                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                                <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className={`transition-colors group ${!user.isActive ? 'bg-gray-50 dark:bg-gray-800/50 opacity-80' : 'hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={user} />
                                            <div>
                                                <div className={`font-bold ${!user.isActive ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>{user.nom}</div>
                                                <div className="text-xs text-gray-500 md:hidden">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">{user.email}</td>
                                    <td className="p-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="p-4 text-center">
                                        {user.isTwoFactorEnabled ? (
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                                                <Smartphone size={12}/> 2FA
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Standard</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {user.isActive ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle size={12} className="mr-1"/> Actif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                <Ban size={12} className="mr-1"/> Inactif
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => toggleUserStatus(user)} 
                                                className={`p-2 rounded-full transition-colors ${user.isActive ? 'text-orange-500 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`}
                                                title={user.isActive ? "Désactiver le compte" : "Réactiver le compte"}
                                            >
                                                <Power size={18}/>
                                            </button>
                                            <button 
                                                onClick={() => { setEditingUser(user); setIsFormOpen(true); }} 
                                                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit size={18}/>
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button 
                                                    onClick={() => setDeletingUser(user)} 
                                                    className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                                                    title="Supprimer définitivement"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center mb-3">
                                <Search className="text-gray-400" size={32}/>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun utilisateur trouvé.</p>
                            <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-4 text-xs text-gray-400 text-center flex justify-between px-4">
                    <span>Total : {filteredUsers.length}</span>
                    <span>Actifs : {filteredUsers.filter(u => u.isActive).length} / Inactifs : {filteredUsers.filter(u => !u.isActive).length}</span>
                </div>
            </Card>
        </div>
    );
};

export default UserManagement;
