
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Permissions, AppPermission } from '../../types';
import Card from '../../components/Card';
import { Save, RotateCcw, CheckSquare, Square, Shield, Lock } from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import { useNotification } from '../../providers/NotificationProvider';

const USER_ROLES: UserRole[] = ['admin', 'infirmier', 'ambulancier', 'regulateur', 'medecin'];

// Définition des groupes pour une meilleure lisibilité
const PERMISSION_GROUPS: { title: string; items: { id: AppPermission; label: string }[] }[] = [
    {
        title: "Général",
        items: [
            { id: 'dashboard', label: 'Tableau de bord' },
            { id: 'planning', label: 'Planning des gardes' },
            { id: 'profile', label: 'Mon Profil' },
        ]
    },
    {
        title: "Opérations Médicales",
        items: [
            { id: 'patients', label: 'Gestion Patients' },
            { id: 'interventions', label: 'Interventions' },
            { id: 'pma', label: 'Poste Médical Avancé' },
        ]
    },
    {
        title: "Logistique & Matériel",
        items: [
            { id: 'stock', label: 'Gestion du Stock' },
            { id: 'oxygen', label: 'Gestion Oxygène' },
            { id: 'nurse-verification', label: 'Checklist Infirmier' },
            { id: 'ambulancier-verification', label: 'Checklist Ambulancier' },
        ]
    },
    {
        title: "Administration & Finance",
        items: [
            { id: 'receipts', label: 'Facturation & Reçus' },
            { id: 'admin', label: 'Accès Administration' },
        ]
    }
];

const PermissionsManagement: React.FC = () => {
    const { permissions, updatePermissions } = useData();
    const { addNotification } = useNotification();
    const [localPermissions, setLocalPermissions] = useState<Permissions | undefined>(undefined);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (permissions) {
            setLocalPermissions(permissions);
            setHasChanges(false);
        }
    }, [permissions]);

    const handlePermissionChange = (role: UserRole, permissionId: AppPermission, checked: boolean) => {
        setLocalPermissions(prev => {
            if (!prev) return prev;
            const currentRolePerms = prev[role] || [];
            const updatedRolePermissions = checked
                ? [...currentRolePerms, permissionId]
                : currentRolePerms.filter(p => p !== permissionId);
            
            return { ...prev, [role]: updatedRolePermissions };
        });
        setHasChanges(true);
    };

    const toggleAllForRole = (role: UserRole) => {
        setLocalPermissions(prev => {
            if (!prev) return prev;
            const allPermissionIds = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.id));
            const currentCount = prev[role]?.length || 0;
            const shouldSelectAll = currentCount < allPermissionIds.length;

            return {
                ...prev,
                [role]: shouldSelectAll ? allPermissionIds : []
            };
        });
        setHasChanges(true);
    };

    const handleReset = () => {
        if (permissions) {
            setLocalPermissions(permissions);
            setHasChanges(false);
            addNotification("Modifications annulées.", 'info');
        }
    };

    const handleSave = async () => {
        if (localPermissions) {
            await updatePermissions(localPermissions);
            setHasChanges(false);
            addNotification("Permissions mises à jour avec succès.", 'success');
        }
    };

    if (!localPermissions) return <div>Chargement...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Lock className="text-primary"/> Matrice de Sécurité
                    </h2>
                    <p className="text-sm text-gray-500">Définissez précisément qui peut voir et faire quoi dans l'application.</p>
                </div>
                <div className="flex gap-3">
                    {hasChanges && (
                        <button 
                            onClick={handleReset} 
                            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            <RotateCcw size={18} className="mr-2" />
                            Annuler
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={!hasChanges}
                        className={`flex items-center px-4 py-2 text-white rounded-md shadow transition-all ${
                            hasChanges 
                                ? 'bg-primary hover:bg-primary/90 transform hover:scale-105' 
                                : 'bg-gray-400 cursor-not-allowed opacity-70'
                        }`}
                    >
                        <Save size={18} className="mr-2" />
                        {hasChanges ? 'Enregistrer les modifications' : 'À jour'}
                    </button>
                </div>
            </div>

            <Card className="!p-0 overflow-hidden shadow-xl border dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                                <th className="p-4 w-1/3 min-w-[200px] text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Module / Fonctionnalité
                                </th>
                                {USER_ROLES.map(role => (
                                    <th key={role} className="p-4 text-center min-w-[120px]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                                                ${role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' : 
                                                  role === 'infirmier' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                  role === 'ambulancier' ? 'bg-green-100 text-green-800 border-green-200' :
                                                  role === 'medecin' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                                  'bg-purple-100 text-purple-800 border-purple-200'
                                                }`}>
                                                {role}
                                            </div>
                                            <button 
                                                onClick={() => toggleAllForRole(role)}
                                                className="text-[10px] text-gray-400 hover:text-primary underline decoration-dotted"
                                                title="Tout cocher / décocher"
                                            >
                                                Inverser
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            {PERMISSION_GROUPS.map((group, groupIdx) => (
                                <React.Fragment key={groupIdx}>
                                    {/* Group Header Row */}
                                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                                        <td colSpan={USER_ROLES.length + 1} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-y dark:border-gray-700">
                                            {group.title}
                                        </td>
                                    </tr>
                                    
                                    {/* Permission Rows */}
                                    {group.items.map(perm => (
                                        <tr key={perm.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                                            <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-200 border-r dark:border-gray-800">
                                                {perm.label}
                                            </td>
                                            {USER_ROLES.map(role => {
                                                const isChecked = localPermissions[role]?.includes(perm.id) || false;
                                                
                                                return (
                                                    <td key={`${role}-${perm.id}`} className="p-0 text-center border-r dark:border-gray-800 last:border-0 relative">
                                                        <label className="flex items-center justify-center w-full h-full py-4 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={(e) => handlePermissionChange(role, perm.id, e.target.checked)}
                                                            />
                                                            <div className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 ${
                                                                isChecked 
                                                                    ? 'bg-primary text-white scale-110 shadow-sm' 
                                                                    : 'bg-gray-200 dark:bg-gray-700 text-transparent hover:bg-gray-300 dark:hover:bg-gray-600'
                                                            }`}>
                                                                <CheckSquare size={16} className={isChecked ? 'opacity-100' : 'opacity-0'} strokeWidth={3} />
                                                            </div>
                                                        </label>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <Shield className="text-primary mt-0.5" size={20} />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note de sécurité :</strong> Les modifications de permissions prennent effet immédiatement après l'enregistrement. 
                    Si vous retirez l'accès "Administration" à votre propre rôle, vous perdrez l'accès à cette page.
                </div>
            </div>
        </div>
    );
};

export default PermissionsManagement;
