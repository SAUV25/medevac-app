
import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { useTranslation } from '../providers/LanguageProvider';
// FIX: Corrected import path to be relative.
import { useAuth } from '../providers/AuthProvider';
import { User as UserIcon, Shield, Calendar, Globe, ChevronDown, LogOut, Camera, Edit, Save, X, Key, Mail, Smartphone, CheckCircle, Download } from 'lucide-react';

const Profile: React.FC = () => {
    const { language, setLanguage } = useTranslation();
    const { currentUser, updateUser, logout } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(currentUser);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setFormData(currentUser);
        }
    }, [currentUser]);

    // Gestion de l'événement d'installation PWA
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    if (!currentUser) {
        return (
            <div className="space-y-6 max-w-sm mx-auto pt-10 text-center">
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Erreur</h2>
                    <p className="text-gray-600 mb-6">Utilisateur non trouvé. Veuillez vous reconnecter.</p>
                    <button
                        onClick={logout}
                        className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        Retour à la connexion
                    </button>
                </Card>
            </div>
        );
    }
    
    const handleSave = () => {
        if (formData) {
            updateUser(formData);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setFormData(currentUser);
        setIsEditing(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData) {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };
    
    const toggle2FA = () => {
        if (formData) {
            updateUser({ ...formData, isTwoFactorEnabled: !formData.isTwoFactorEnabled });
        }
    };
    
    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && formData) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedUser = { ...formData, profilePicture: reader.result as string };
                setFormData(updatedUser);
                updateUser(updatedUser);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const InfoRow: React.FC<{ icon: React.ElementType, label: string, value: string, isLast?: boolean }> = ({ icon: Icon, label, value, isLast = false }) => (
        <div className={`flex items-center gap-4 px-4 py-3 ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    );
    
    const lastUpdatedDate = currentUser.lastUpdated 
        ? new Date(currentUser.lastUpdated).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : "Jamais";


    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-20">
             <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            {/* Profile Header */}
            <div className="flex flex-col items-center pt-4 text-center">
                 <div className="relative w-32 h-32 mb-4 group">
                    {currentUser.profilePicture ? (
                        <img src={currentUser.profilePicture} alt="Profil" className="w-full h-full rounded-full object-cover border-4 border-primary"/>
                    ) : (
                        <div className="w-full h-full rounded-full border-4 border-primary bg-primary/10 flex items-center justify-center text-primary">
                            <UserIcon size={64} />
                        </div>
                    )}
                    <button 
                        onClick={triggerImageUpload}
                        aria-label="Changer la photo de profil"
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity cursor-pointer"
                    >
                       <Camera size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{currentUser.nom}</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                            <Edit size={20} />
                        </button>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-primary border border-primary/20">
                    <Shield size={16} />
                    <span className="capitalize">{currentUser.role}</span>
                </div>
            </div>

            {/* PWA Installation Banner (Visible only if installable) */}
            {installPrompt && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Installer l'application</h3>
                            <p className="text-sm text-blue-100">Accès rapide et mode hors ligne</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleInstallClick}
                        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors"
                    >
                        Installer
                    </button>
                </div>
            )}

            {/* Personal Information */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">Informations personnelles</h3>
                <Card className="!p-0">
                    {isEditing ? (
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                                <input type="text" name="nom" value={formData?.nom || ''} onChange={handleInputChange} className="mt-1 input"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" name="email" value={formData?.email || ''} onChange={handleInputChange} className="mt-1 input"/>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={handleCancel} className="btn-secondary flex items-center gap-2"><X size={18}/>Annuler</button>
                                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 font-semibold"><Save size={18}/>Enregistrer</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <InfoRow icon={UserIcon} label="Nom" value={currentUser.nom} />
                            <InfoRow icon={Mail} label="Email" value={currentUser.email} />
                            <InfoRow icon={Shield} label="Rôle" value={currentUser.role} />
                            <InfoRow icon={Calendar} label="Dernière mise à jour" value={lastUpdatedDate} isLast={true} />
                        </>
                    )}
                </Card>
            </div>
            
             {/* Security */}
             <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">Sécurité</h3>
                 <Card className="!p-0">
                    <button onClick={toggle2FA} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">Double Authentification (2FA)</p>
                                <p className="text-xs text-gray-500">Sécuriser la connexion avec un code</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${currentUser.isTwoFactorEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${currentUser.isTwoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </button>

                    <button className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-b-xl">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                            <Key className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Changer le mot de passe</p>
                        </div>
                    </button>
                </Card>
            </div>

            {/* Preferences */}
             <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">Préférences</h3>
                <Card className="!p-0">
                   <div className="relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                                    <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Langue</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{language === 'fr' ? 'Français' : 'Español'}</p>
                                </div>
                            </div>
                            <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
                        </div>
                         <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'fr' | 'es')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Sélectionner la langue"
                        >
                            <option value="fr">Français</option>
                            <option value="es">Español</option>
                        </select>
                   </div>
                </Card>
            </div>

            {/* Logout */}
            <div>
                 <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-danger text-white font-semibold rounded-lg hover:bg-danger/90 transition-colors shadow-sm">
                    <LogOut size={20}/>
                    Déconnexion
                </button>
            </div>
        </div>
    );
};

export default Profile;
