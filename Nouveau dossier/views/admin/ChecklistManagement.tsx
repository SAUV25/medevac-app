
import React, { useState, useEffect, useCallback } from 'react';
import { ChecklistItems } from '../../types';
import Card from '../../components/Card';
import { 
    Save, ChevronDown, ChevronUp, Edit2, Trash2, X, Plus, 
    ArrowUp, ArrowDown, RotateCcw, AlertCircle, CheckSquare, Stethoscope, Ambulance, Tent
} from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useNotification } from '../../providers/NotificationProvider';

type ChecklistType = 'nurse' | 'ambulancier' | 'pma';

const ChecklistManagement: React.FC = () => {
    const { nurseChecklistItems, ambulancierChecklistItems, pmaChecklistItems, updateNurseChecklistItems, updateAmbulancierChecklistItems, updatePmaChecklistItems } = useData();
    const { addNotification } = useNotification();
    
    // États locaux
    const [activeTab, setActiveTab] = useState<ChecklistType>('nurse');
    const [localItems, setLocalItems] = useState<ChecklistItems>({});
    const [initialItems, setInitialItems] = useState<ChecklistItems>({}); // Pour détecter les changements
    const [isDirty, setIsDirty] = useState(false);
    
    // États d'édition
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [editingItem, setEditingItem] = useState<{ category: string; index: number; value: string } | null>(null);
    const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
    const [newItemValues, setNewItemValues] = useState<Record<string, string>>({});
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // Modals
    const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

    // Initialisation
    useEffect(() => {
        let source;
        if (activeTab === 'nurse') source = nurseChecklistItems;
        else if (activeTab === 'ambulancier') source = ambulancierChecklistItems;
        else source = pmaChecklistItems;

        if (source) {
            setLocalItems(JSON.parse(JSON.stringify(source))); // Deep copy
            setInitialItems(JSON.parse(JSON.stringify(source)));
            setIsDirty(false);
            // Ouvrir la première catégorie par défaut
            const firstCat = Object.keys(source)[0];
            if (firstCat) setOpenCategories({ [firstCat]: true });
        }
    }, [activeTab, nurseChecklistItems, ambulancierChecklistItems, pmaChecklistItems]);

    // Détection des changements
    useEffect(() => {
        setIsDirty(JSON.stringify(localItems) !== JSON.stringify(initialItems));
    }, [localItems, initialItems]);

    const handleSave = async () => {
        try {
            if (activeTab === 'nurse') {
                await updateNurseChecklistItems(localItems);
            } else if (activeTab === 'ambulancier') {
                await updateAmbulancierChecklistItems(localItems);
            } else {
                await updatePmaChecklistItems(localItems);
            }
            setInitialItems(JSON.parse(JSON.stringify(localItems)));
            setIsDirty(false);
            addNotification("Checklist sauvegardée avec succès.", 'success');
        } catch (e) {
            addNotification("Erreur lors de la sauvegarde.", 'error');
        }
    };

    const handleReset = () => {
        setLocalItems(JSON.parse(JSON.stringify(initialItems)));
        addNotification("Modifications annulées.", 'info');
    };

    // --- Gestion des Catégories ---

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const addCategory = () => {
        const name = newCategoryName.trim();
        if (!name) return;
        if (localItems[name]) {
            addNotification("Cette catégorie existe déjà.", 'error');
            return;
        }
        setLocalItems(prev => ({ ...prev, [name]: [] }));
        setNewCategoryName('');
        setOpenCategories(prev => ({ ...prev, [name]: true }));
    };

    const deleteCategory = () => {
        if (!deletingCategory) return;
        setLocalItems(prev => {
            const next = { ...prev };
            delete next[deletingCategory];
            return next;
        });
        setDeletingCategory(null);
    };

    const renameCategory = () => {
        if (!editingCategory) return;
        const { oldName, newName } = editingCategory;
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) {
            setEditingCategory(null);
            return;
        }
        if (localItems[trimmed]) {
            addNotification("Une catégorie avec ce nom existe déjà.", 'error');
            return;
        }

        setLocalItems(prev => {
            const next = {};
            // Reconstruct object to maintain order roughly, but replacing key
            Object.keys(prev).forEach(key => {
                if (key === oldName) {
                    (next as any)[trimmed] = prev[key];
                } else {
                    (next as any)[key] = prev[key];
                }
            });
            return next;
        });
        setEditingCategory(null);
    };

    // --- Gestion des Items ---

    const addItem = (category: string) => {
        const val = newItemValues[category]?.trim();
        if (!val) return;
        setLocalItems(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), val]
        }));
        setNewItemValues(prev => ({ ...prev, [category]: '' }));
    };

    const deleteItem = (category: string, index: number) => {
        setLocalItems(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    const moveItem = (category: string, index: number, direction: 'up' | 'down') => {
        const list = [...localItems[category]];
        if (direction === 'up') {
            if (index === 0) return;
            [list[index - 1], list[index]] = [list[index], list[index - 1]];
        } else {
            if (index === list.length - 1) return;
            [list[index + 1], list[index]] = [list[index], list[index + 1]];
        }
        setLocalItems(prev => ({ ...prev, [category]: list }));
    };

    const startEditingItem = (category: string, index: number, value: string) => {
        setEditingItem({ category, index, value });
    };

    const saveEditingItem = () => {
        if (!editingItem) return;
        const { category, index, value } = editingItem;
        if (!value.trim()) return;

        setLocalItems(prev => {
            const newList = [...prev[category]];
            newList[index] = value.trim();
            return { ...prev, [category]: newList };
        });
        setEditingItem(null);
    };

    return (
        <div className="space-y-6 relative pb-20">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <CheckSquare className="text-primary" /> Configuration des Checklists
                    </h2>
                    <p className="text-sm text-gray-500">Personnalisez le matériel et les vérifications pour chaque type de véhicule.</p>
                </div>
                
                <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => !isDirty ? setActiveTab('nurse') : addNotification("Sauvegardez d'abord les changements.", 'error')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'nurse' 
                                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        <Stethoscope size={16} className="mr-2" /> Infirmier
                    </button>
                    <button
                        onClick={() => !isDirty ? setActiveTab('ambulancier') : addNotification("Sauvegardez d'abord les changements.", 'error')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'ambulancier' 
                                ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        <Ambulance size={16} className="mr-2" /> Ambulancier
                    </button>
                    <button
                        onClick={() => !isDirty ? setActiveTab('pma') : addNotification("Sauvegardez d'abord les changements.", 'error')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'pma' 
                                ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        <Tent size={16} className="mr-2" /> PMA
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <Card className="min-h-[500px]">
                <div className="space-y-4">
                    {Object.entries(localItems).map(([category, items]) => {
                        const typedItems = items as string[];
                        return (
                        <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                            {/* Category Header */}
                            <div 
                                className="bg-gray-50 dark:bg-gray-700/50 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => toggleCategory(category)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`p-1.5 rounded bg-white dark:bg-gray-600 border dark:border-gray-500 shadow-sm`}>
                                        {openCategories[category] ? <ChevronUp size={16} className="text-primary"/> : <ChevronDown size={16} className="text-gray-400"/>}
                                    </div>
                                    
                                    {editingCategory?.oldName === category ? (
                                        <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="text" 
                                                value={editingCategory.newName}
                                                onChange={e => setEditingCategory({...editingCategory, newName: e.target.value})}
                                                className="input py-1 px-2 text-sm font-bold w-full max-w-xs"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && renameCategory()}
                                            />
                                            <button onClick={renameCategory} className="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200"><Save size={16}/></button>
                                            <button onClick={() => setEditingCategory(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded"><X size={16}/></button>
                                        </div>
                                    ) : (
                                        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide select-none">
                                            {category} <span className="ml-2 text-xs font-normal text-gray-400 normal-case bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full border dark:border-gray-500">{typedItems.length} items</span>
                                        </h3>
                                    )}
                                </div>

                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    {!editingCategory && (
                                        <>
                                            <button 
                                                onClick={() => setEditingCategory({ oldName: category, newName: category })} 
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDeletingCategory(category)} 
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Items List */}
                            {openCategories[category] && (
                                <div className="p-2 bg-white dark:bg-gray-800">
                                    <ul className="space-y-1">
                                        {typedItems.map((item, idx) => (
                                            <li key={idx} className="group flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                                                {editingItem?.category === category && editingItem.index === idx ? (
                                                    <div className="flex items-center gap-2 flex-1 w-full">
                                                        <input 
                                                            type="text" 
                                                            value={editingItem.value}
                                                            onChange={e => setEditingItem({...editingItem, value: e.target.value})}
                                                            className="input py-1 px-2 text-sm w-full"
                                                            autoFocus
                                                            onKeyDown={e => e.key === 'Enter' && saveEditingItem()}
                                                        />
                                                        <button onClick={saveEditingItem} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 pl-2">{item}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex flex-col mr-2">
                                                                <button 
                                                                    onClick={() => moveItem(category, idx, 'up')} 
                                                                    disabled={idx === 0}
                                                                    className="text-gray-400 hover:text-primary disabled:opacity-20 hover:bg-gray-100 rounded"
                                                                >
                                                                    <ArrowUp size={12}/>
                                                                </button>
                                                                <button 
                                                                    onClick={() => moveItem(category, idx, 'down')} 
                                                                    disabled={idx === typedItems.length - 1}
                                                                    className="text-gray-400 hover:text-primary disabled:opacity-20 hover:bg-gray-100 rounded"
                                                                >
                                                                    <ArrowDown size={12}/>
                                                                </button>
                                                            </div>
                                                            <button onClick={() => startEditingItem(category, idx, item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                                                            <button onClick={() => deleteItem(category, idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    {/* Add Item Input */}
                                    <div className="mt-3 pl-2 flex items-center gap-2">
                                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">
                                            <Plus size={14} />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Ajouter un élément..." 
                                            className="text-sm bg-transparent border-none focus:ring-0 w-full placeholder-gray-400"
                                            value={newItemValues[category] || ''}
                                            onChange={e => setNewItemValues({...newItemValues, [category]: e.target.value})}
                                            onKeyDown={e => e.key === 'Enter' && addItem(category)}
                                        />
                                        <button 
                                            onClick={() => addItem(category)}
                                            disabled={!newItemValues[category]}
                                            className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 disabled:opacity-0 transition-opacity"
                                        >
                                            AJOUTER
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })}

                    {/* Add Category Block */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex gap-3 w-full max-w-md">
                            <input 
                                type="text" 
                                placeholder="Nouvelle Catégorie (ex: Kit Intubation)" 
                                className="input flex-1"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addCategory()}
                            />
                            <button onClick={addCategory} disabled={!newCategoryName.trim()} className="btn-secondary flex items-center disabled:opacity-50">
                                <Plus size={18} className="mr-2"/> Créer
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Floating Save Bar (Visible only when dirty) */}
            <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 transition-all duration-300 z-50 ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="text-yellow-400" size={20} />
                    <span>Modifications non enregistrées</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleReset}
                        className="px-4 py-1.5 rounded-full hover:bg-white/10 text-sm transition-colors flex items-center text-gray-300 hover:text-white"
                    >
                        <RotateCcw size={14} className="mr-2"/> Annuler
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-5 py-1.5 bg-primary hover:bg-blue-600 rounded-full text-sm font-bold shadow-lg transition-colors flex items-center"
                    >
                        <Save size={16} className="mr-2"/> Enregistrer
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deletingCategory}
                onClose={() => setDeletingCategory(null)}
                onConfirm={deleteCategory}
                title="Supprimer la catégorie"
            >
                <p>Êtes-vous sûr de vouloir supprimer <strong>"{deletingCategory}"</strong> et tous les éléments qu'elle contient ?</p>
            </ConfirmationModal>
        </div>
    );
};

export default ChecklistManagement;