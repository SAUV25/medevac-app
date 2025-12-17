
import React, { useState, useMemo } from 'react';
import { Tarif } from '../../types';
import Card from '../../components/Card';
import { 
    Edit2, Trash2, Plus, Search, Tag, DollarSign, TrendingUp, X, Save, 
    Layers, FolderOpen, ChevronDown, ChevronRight, Download, Filter,
    Ambulance, Stethoscope, Pill, Package, Check
} from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useNotification } from '../../providers/NotificationProvider';

const CATEGORY_OPTIONS = [
    { id: 'Transport', label: 'Transport', icon: Ambulance, color: 'blue', desc: 'Ambulance, VSL, SMUR' },
    { id: 'Acte', label: 'Acte / Soin', icon: Stethoscope, color: 'teal', desc: 'Consultation, injection...' },
    { id: 'Médicament', label: 'Médicament', icon: Pill, color: 'red', desc: 'Produits pharma.' },
    { id: 'Matériel', label: 'Matériel', icon: Package, color: 'orange', desc: 'Consommables, attelles' },
];

const getCategoryColor = (cat: string) => {
    const found = CATEGORY_OPTIONS.find(c => c.id === cat);
    return found ? found.color : 'gray';
};

const TarifForm: React.FC<{ 
    tarif?: Partial<Tarif>; 
    onSave: (data: Partial<Tarif>) => void; 
    onCancel: () => void; 
    existingCategories: string[];
}> = ({ tarif, onSave, onCancel, existingCategories }) => {
    const [formData, setFormData] = useState<Partial<Tarif>>(tarif || { description: '', prix: 0, categorie: '' });
    const [customCategory, setCustomCategory] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || formData.prix === undefined) return;
        onSave(formData);
    };

    const activeColor = getCategoryColor(formData.categorie || '');
    const isEditMode = !!tarif?.id;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg !p-0 overflow-hidden shadow-2xl scale-100">
                {/* Header Dynamique */}
                <div className={`p-6 border-b transition-colors duration-300 flex justify-between items-start 
                    ${formData.categorie === 'Transport' ? 'bg-blue-600 text-white' : 
                      formData.categorie === 'Acte' ? 'bg-teal-600 text-white' : 
                      formData.categorie === 'Médicament' ? 'bg-red-600 text-white' : 
                      formData.categorie === 'Matériel' ? 'bg-orange-500 text-white' : 
                      'bg-gray-800 text-white'}`}>
                    
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {isEditMode ? <Edit2 size={24}/> : <Plus size={24}/>}
                            {isEditMode ? "Modifier le Tarif" : "Nouveau Service"}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {formData.categorie ? `Catégorie : ${formData.categorie}` : 'Veuillez définir les détails du service'}
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-900">
                    
                    {/* Sélecteur de Catégorie Visuel */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wide">Type de prestation</label>
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORY_OPTIONS.map((opt) => {
                                const isSelected = formData.categorie === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => { setFormData({...formData, categorie: opt.id}); setCustomCategory(false); }}
                                        className={`relative flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                                            isSelected 
                                                ? `border-${opt.color}-500 bg-${opt.color}-50 dark:bg-${opt.color}-900/20` 
                                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg mb-2 ${isSelected ? `bg-${opt.color}-500 text-white` : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                            <opt.icon size={20} />
                                        </div>
                                        <span className={`font-bold text-sm ${isSelected ? `text-${opt.color}-700 dark:text-${opt.color}-300` : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</span>
                                        <span className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</span>
                                        
                                        {isSelected && (
                                            <div className={`absolute top-2 right-2 p-1 rounded-full bg-${opt.color}-500 text-white`}>
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Option Autre Catégorie */}
                        <div className="mt-3">
                            {!customCategory ? (
                                <button 
                                    type="button" 
                                    onClick={() => setCustomCategory(true)} 
                                    className="text-xs text-gray-500 hover:text-primary underline flex items-center"
                                >
                                    <Layers size={12} className="mr-1"/> Autre catégorie...
                                </button>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nom de la catégorie personnalisée</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            list="existing-cats"
                                            value={formData.categorie}
                                            onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                                            className="input w-full py-1 text-sm"
                                            placeholder="Ex: Administratif"
                                            autoFocus
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setCustomCategory(false)}
                                            className="p-2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16}/>
                                        </button>
                                        <datalist id="existing-cats">
                                            {existingCategories.map(c => <option key={c} value={c}/>)}
                                        </datalist>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Désignation</label>
                            <input 
                                type="text" 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                required 
                                className="input w-full text-lg font-medium" 
                                placeholder="Ex: Transport médicalisé 50km" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix Unitaire</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    value={formData.prix} 
                                    onChange={e => setFormData({...formData, prix: parseFloat(e.target.value)})} 
                                    required 
                                    className="input w-full pl-4 pr-12 py-3 font-mono text-2xl font-bold text-gray-800 dark:text-white border-primary focus:ring-primary" 
                                    placeholder="0.00" 
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-bold text-sm">MAD</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 mt-4">
                        <button type="button" onClick={onCancel} className="btn-secondary px-6 py-2.5">Annuler</button>
                        <button 
                            type="submit" 
                            className={`btn-primary px-8 py-2.5 flex items-center shadow-lg transition-transform hover:scale-105
                                ${formData.categorie === 'Transport' ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 
                                  formData.categorie === 'Acte' ? 'bg-teal-600 hover:bg-teal-700 border-teal-600' : 
                                  formData.categorie === 'Médicament' ? 'bg-red-600 hover:bg-red-700 border-red-600' : 
                                  formData.categorie === 'Matériel' ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : 
                                  'bg-gray-800 hover:bg-gray-900 border-gray-800'}
                            `}
                        >
                            <Save size={18} className="mr-2"/> {isEditMode ? 'Mettre à jour' : 'Créer le service'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const TarifsManagement: React.FC = () => {
    const { tarifs = [], addTarif, updateTarif, deleteTarif } = useData();
    const { addNotification } = useNotification();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTarif, setEditingTarif] = useState<Partial<Tarif> | undefined>(undefined);
    const [deletingTarif, setDeletingTarif] = useState<Tarif | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const uniqueCategories = useMemo(() => {
        const cats = new Set(tarifs.map(t => t.categorie || 'Général'));
        CATEGORY_OPTIONS.forEach(c => cats.add(c.id));
        return Array.from(cats).sort();
    }, [tarifs]);

    const filteredTarifs = useMemo(() => {
        return tarifs.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (t.categorie || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || (t.categorie || 'Général') === categoryFilter;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.description.localeCompare(b.description));
    }, [tarifs, searchTerm, categoryFilter]);

    // Grouping logic
    const groupedTarifs = useMemo(() => {
        const groups: Record<string, Tarif[]> = {};
        filteredTarifs.forEach(t => {
            const cat = t.categorie || 'Général';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(t);
        });
        
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const indexA = CATEGORY_OPTIONS.findIndex(c => c.id === a);
            const indexB = CATEGORY_OPTIONS.findIndex(c => c.id === b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
        return sortedKeys.map(key => ({ title: key, items: groups[key] }));
    }, [filteredTarifs]);

    const stats = useMemo(() => {
        const total = tarifs.length;
        const avg = total > 0 ? tarifs.reduce((acc, t) => acc + t.prix, 0) / total : 0;
        const max = total > 0 ? Math.max(...tarifs.map(t => t.prix)) : 0;
        return { total, avg, max };
    }, [tarifs]);

    const handleSave = async (data: Partial<Tarif>) => {
        try {
            if (data.id) {
                await updateTarif(data as Tarif);
                addNotification("Tarif mis à jour avec succès.", 'success');
            } else {
                await addTarif({
                    description: data.description!,
                    prix: data.prix!,
                    categorie: data.categorie || 'Général'
                });
                addNotification("Nouveau tarif ajouté.", 'success');
            }
            setIsFormOpen(false);
            setEditingTarif(undefined);
        } catch (e) {
            addNotification("Une erreur est survenue.", 'error');
        }
    };

    const handleDelete = async () => {
        if (deletingTarif) {
            await deleteTarif(deletingTarif.id);
            setDeletingTarif(null);
            addNotification("Tarif supprimé.", 'info');
        }
    };

    const toggleCategory = (title: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Catégorie", "Désignation", "Prix (MAD)"];
        const rows = filteredTarifs.map(t => [
            t.id,
            `"${t.categorie || 'Général'}"`,
            `"${t.description}"`,
            t.prix.toFixed(2)
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "catalogue_tarifs_medevac.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification("Catalogue exporté en CSV.", 'success');
    };

    // Helper pour l'affichage de l'icône dans la liste
    const getCategoryIcon = (category: string) => {
        const opt = CATEGORY_OPTIONS.find(c => c.id === category);
        const Icon = opt ? opt.icon : Tag;
        const color = opt ? opt.color : 'gray';
        return <div className={`p-1.5 rounded-md bg-${color}-100 text-${color}-600`}><Icon size={18}/></div>;
    };

    return (
        <div className="space-y-6">
            {/* KPI Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex items-center p-4 border-l-4 border-primary bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-800/50">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
                        <Tag size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Services</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
                    </div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-green-500 bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-gray-800/50">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Prix Moyen</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.avg.toFixed(0)} <span className="text-sm font-normal text-gray-500">MAD</span></p>
                    </div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-purple-500 bg-gradient-to-r from-white to-purple-50 dark:from-gray-800 dark:to-gray-800/50">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase">Max</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.max.toFixed(0)} <span className="text-sm font-normal text-gray-500">MAD</span></p>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="flex flex-col">
                <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex flex-1 w-full gap-4 flex-col sm:flex-row">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Rechercher un service..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        </div>
                        <div className="relative min-w-[200px]">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="input pl-10 w-full appearance-none cursor-pointer"
                            >
                                <option value="all">Toutes Catégories</option>
                                {uniqueCategories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full xl:w-auto">
                        <button 
                            onClick={handleExportCSV}
                            className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 xl:flex-none"
                            title="Exporter en CSV"
                        >
                            <Download size={18} className="mr-2"/> Export
                        </button>
                        <button 
                            onClick={() => { setEditingTarif(undefined); setIsFormOpen(true); }} 
                            className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-md transition-transform hover:scale-105 flex-1 xl:flex-none"
                        >
                            <Plus size={18} className="mr-2"/>
                            Nouveau Service
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {groupedTarifs.map(group => {
                            const isCollapsed = collapsedCategories[group.title];
                            
                            return (
                                <div key={group.title} className="bg-white dark:bg-gray-800">
                                    {/* Category Header */}
                                    <div 
                                        className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-y dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                                        onClick={() => toggleCategory(group.title)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? <ChevronRight size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                                            {getCategoryIcon(group.title)}
                                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                                                {group.title} <span className="text-xs font-normal text-gray-500 normal-case ml-1">({group.items.length})</span>
                                            </h3>
                                        </div>
                                        {/* Sous-total discret */}
                                        <div className="text-xs text-gray-400 font-mono">
                                            Moy: {(group.items.reduce((acc, i) => acc + i.prix, 0) / group.items.length).toFixed(0)} MAD
                                        </div>
                                    </div>
                                    
                                    {/* Items Table */}
                                    {!isCollapsed && (
                                        <table className="min-w-full animate-in fade-in slide-in-from-top-2 duration-200">
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {group.items.map((t) => (
                                                    <tr key={t.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                                                        <td className="p-4 font-medium text-gray-700 dark:text-gray-200 pl-12 border-l-4 border-transparent hover:border-primary">
                                                            {t.description}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 font-mono">
                                                                {t.prix.toFixed(2)} DH
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center w-24">
                                                            <div className="flex justify-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => { setEditingTarif(t); setIsFormOpen(true); }} 
                                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit2 size={18}/>
                                                                </button>
                                                                <button 
                                                                    onClick={() => setDeletingTarif(t)} 
                                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={18}/>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {filteredTarifs.length === 0 && (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center mb-3">
                                <Tag className="text-gray-400" size={32}/>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun tarif trouvé.</p>
                            <p className="text-sm text-gray-400">Ajoutez un nouveau service pour commencer.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modals */}
            {isFormOpen && (
                <TarifForm 
                    tarif={editingTarif} 
                    onSave={handleSave} 
                    onCancel={() => setIsFormOpen(false)} 
                    existingCategories={uniqueCategories}
                />
            )}

            <ConfirmationModal 
                isOpen={!!deletingTarif} 
                onClose={() => setDeletingTarif(null)} 
                onConfirm={handleDelete} 
                title="Confirmer la suppression"
            >
                <p>Êtes-vous sûr de vouloir supprimer le tarif <strong>"{deletingTarif?.description}"</strong> ?</p>
                <p className="text-sm text-red-500 mt-2">Cette action est irréversible et retirera ce tarif du catalogue.</p>
            </ConfirmationModal>
        </div>
    );
};

export default TarifsManagement;
