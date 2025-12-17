
import React, { useState, useMemo } from 'react';
// FIX: Corrected import path for types to be relative.
import { StockItem, StockCategory } from '../types';
import Card from '../components/Card';
import { Plus, X, Edit, Trash2, AlertTriangle, Search, Package, Filter, Calendar, MinusCircle, PlusCircle, Activity, ScanBarcode, Loader2 } from 'lucide-react';
// FIX: Corrected import path to be relative.
import { useData } from '../providers/DataProvider';
import ConfirmationModal from '../components/ConfirmationModal';
// FIX: Corrected import path to be relative.
import { useAuth } from '../providers/AuthProvider';

const STOCK_CATEGORIES: StockCategory[] = ["Médicaments", "Consommables médicaux"];

const StockForm: React.FC<{ item?: StockItem; onSave: (item: StockItem) => void; onCancel: () => void; }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState<StockItem>(item || {
        id: item ? item.id : Date.now().toString(),
        nom: '',
        categorie: 'Médicaments',
        quantite: 0,
        seuilAlerte: 10,
        datePeremption: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] // Default +1 year
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === 'number' ? parseInt(value) : value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl animate-slide-in">
                <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {item ? <Edit className="text-primary"/> : <Plus className="text-primary"/>}
                        {item ? "Modifier l'article" : "Nouvel article"}
                    </h2>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du produit</label>
                        <input type="text" name="nom" value={formData.nom} onChange={handleChange} required className="input w-full font-medium" placeholder="Ex: Adrénaline 1mg/ml" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                        <select name="categorie" value={formData.categorie} onChange={handleChange} className="input w-full">
                            {STOCK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité actuelle</label>
                            <div className="relative">
                                <input type="number" name="quantite" value={formData.quantite} onChange={handleChange} className="input w-full pl-10" min="0" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Package size={16} className="text-gray-400"/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seuil d'alerte</label>
                            <div className="relative">
                                <input type="number" name="seuilAlerte" value={formData.seuilAlerte} onChange={handleChange} className="input w-full pl-10" min="0" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <AlertTriangle size={16} className="text-gray-400"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de péremption</label>
                        <input type="date" name="datePeremption" value={formData.datePeremption} onChange={handleChange} className="input w-full" />
                    </div>
                     <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onCancel} className="btn-secondary px-4">Annuler</button>
                        <button type="submit" className="btn-primary px-6">Enregistrer</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const StockLevelBar: React.FC<{ current: number; max: number; threshold: number }> = ({ current, max, threshold }) => {
    // Determine visuals
    let colorClass = 'bg-success';
    if (current === 0) colorClass = 'bg-gray-400';
    else if (current <= threshold) colorClass = 'bg-danger';
    else if (current <= threshold * 1.5) colorClass = 'bg-warning';

    // Calculate percentage for the bar (cap at 100%)
    // Base the scale on "Alert Threshold * 3" as a "Healthy Max" visual reference, or strict max if provided
    const visualMax = Math.max(current, threshold * 3); 
    const percentage = Math.min((current / visualMax) * 100, 100);

    return (
        <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            {current <= threshold && (
                <AlertTriangle size={14} className="text-danger animate-pulse" />
            )}
        </div>
    );
};

const Stock: React.FC = () => {
    const { stockItems = [], addStockItem, updateStockItem, deleteStockItem } = useData();
    const { currentUser } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | undefined>(undefined);
    const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'Tous' | StockCategory>('Tous');
    const [isScanning, setIsScanning] = useState(false);

    const handleSave = (item: StockItem) => {
        const index = stockItems.findIndex(i => i.id === item.id);
        if (index > -1) {
            updateStockItem(item);
        } else {
            addStockItem(item);
        }
        setIsFormOpen(false);
        setEditingItem(undefined);
    };

    const handleDelete = () => {
        if(deletingItem){
            deleteStockItem(deletingItem.id);
            setDeletingItem(null);
        }
    };

    const handleQuickAdjust = (item: StockItem, amount: number) => {
        const newQuantity = Math.max(0, item.quantite + amount);
        updateStockItem({ ...item, quantite: newQuantity });
    };

    // --- Simulated Scan ---
    const handleScan = () => {
        setIsScanning(true);
        // Simulate scan delay
        setTimeout(() => {
            if (stockItems.length > 0) {
                // Pick a random item to simulate scanning it
                const randomItem = stockItems[Math.floor(Math.random() * stockItems.length)];
                setSearchTerm(randomItem.nom);
            }
            setIsScanning(false);
        }, 1200);
    };

    // --- KPIs Calculation ---
    const stats = useMemo(() => {
        const totalItems = stockItems.length;
        const lowStock = stockItems.filter(i => i.quantite <= i.seuilAlerte).length;
        const expired = stockItems.filter(i => new Date(i.datePeremption) < new Date()).length;
        const totalQuantity = stockItems.reduce((acc, i) => acc + i.quantite, 0);
        return { totalItems, lowStock, expired, totalQuantity };
    }, [stockItems]);

    // --- Filtering & Sorting ---
    const filteredItems = useMemo(() => {
        return stockItems.filter(item => {
            const matchesSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'Tous' || item.categorie === categoryFilter;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            // Sort by status priority: Expired > Low Stock > Normal
            const isExpiredA = new Date(a.datePeremption) < new Date();
            const isExpiredB = new Date(b.datePeremption) < new Date();
            if (isExpiredA !== isExpiredB) return isExpiredA ? -1 : 1;

            const isLowA = a.quantite <= a.seuilAlerte;
            const isLowB = b.quantite <= b.seuilAlerte;
            if (isLowA !== isLowB) return isLowA ? -1 : 1;

            return a.nom.localeCompare(b.nom);
        });
    }, [stockItems, searchTerm, categoryFilter]);

    return (
        <div className="space-y-6">
            
            {/* Header & KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="flex items-center p-4 border-l-4 border-primary">
                    <div className="p-3 bg-primary/10 text-primary rounded-full mr-4"><Package size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Références</p>
                        <p className="text-2xl font-bold">{stats.totalItems}</p>
                    </div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-blue-500">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4"><Activity size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Vol. Total</p>
                        <p className="text-2xl font-bold">{stats.totalQuantity}</p>
                    </div>
                </Card>
                <Card className={`flex items-center p-4 border-l-4 ${stats.lowStock > 0 ? 'border-warning bg-warning/5' : 'border-gray-300'}`}>
                    <div className={`p-3 rounded-full mr-4 ${stats.lowStock > 0 ? 'bg-warning/20 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}><AlertTriangle size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Stock Faible</p>
                        <p className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-yellow-700' : ''}`}>{stats.lowStock}</p>
                    </div>
                </Card>
                <Card className={`flex items-center p-4 border-l-4 ${stats.expired > 0 ? 'border-danger bg-danger/5' : 'border-gray-300'}`}>
                    <div className={`p-3 rounded-full mr-4 ${stats.expired > 0 ? 'bg-danger/20 text-danger' : 'bg-gray-100 text-gray-500'}`}><Calendar size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Périmés</p>
                        <p className={`text-2xl font-bold ${stats.expired > 0 ? 'text-danger' : ''}`}>{stats.expired}</p>
                    </div>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700">
                <div className="flex flex-1 w-full md:w-auto items-center gap-2">
                    <div className="relative flex-1 md:max-w-xs flex gap-2">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Rechercher ou scanner..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full"
                            />
                        </div>
                        <button 
                            onClick={handleScan} 
                            disabled={isScanning}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                            title="Simuler un scan code-barres"
                        >
                            {isScanning ? <Loader2 size={20} className="animate-spin text-primary"/> : <ScanBarcode size={20} className="text-gray-600 dark:text-gray-300"/>}
                        </button>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
                        {['Tous', ...STOCK_CATEGORIES].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat as any)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    categoryFilter === cat 
                                        ? 'bg-primary text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => { setEditingItem(undefined); setIsFormOpen(true); }} className="btn-primary flex items-center shadow-lg w-full md:w-auto justify-center">
                    <Plus size={20} className="mr-2" />
                    Ajouter Article
                </button>
            </div>
            
            {/* Main Table Card */}
            <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                            <tr>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Produit</th>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Catégorie</th>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300 w-1/4">État du Stock</th>
                                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-300">Inventaire</th>
                                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Péremption</th>
                                <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredItems.map(item => {
                                const isExpired = new Date(item.datePeremption) < new Date();
                                const isLow = item.quantite <= item.seuilAlerte;
                                
                                return (
                                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${isExpired ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800 dark:text-gray-100">{item.nom}</div>
                                            {isExpired && <span className="text-xs text-danger font-bold uppercase tracking-wider">Périmé</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                item.categorie === 'Médicaments' 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                                                    : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                            }`}>
                                                {item.categorie}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className={isLow ? 'text-danger font-bold' : 'text-gray-500'}>
                                                        {item.quantite} / {item.seuilAlerte} (Min)
                                                    </span>
                                                </div>
                                                <StockLevelBar current={item.quantite} max={item.seuilAlerte * 4} threshold={item.seuilAlerte} />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => handleQuickAdjust(item, -1)} 
                                                    className="text-gray-400 hover:text-danger hover:bg-red-50 rounded-full p-1 transition-colors"
                                                    title="-1"
                                                >
                                                    <MinusCircle size={20} />
                                                </button>
                                                <span className="font-mono font-bold text-lg w-8 text-center">{item.quantite}</span>
                                                <button 
                                                    onClick={() => handleQuickAdjust(item, 1)} 
                                                    className="text-gray-400 hover:text-success hover:bg-green-50 rounded-full p-1 transition-colors"
                                                    title="+1"
                                                >
                                                    <PlusCircle size={20} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className={`flex items-center ${isExpired ? 'text-danger font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                <Calendar size={14} className="mr-2 opacity-70"/>
                                                {new Date(item.datePeremption).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setEditingItem(item); setIsFormOpen(true); }} 
                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                >
                                                    <Edit size={18}/>
                                                </button>
                                                {currentUser?.role === 'admin' && (
                                                    <button 
                                                        onClick={() => setDeletingItem(item)} 
                                                        className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                                                    >
                                                        <Trash2 size={18}/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {filteredItems.length === 0 && (
                        <div className="text-center py-16">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center mb-3">
                                <Package className="text-gray-400" size={32}/>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun article trouvé.</p>
                            <p className="text-sm text-gray-400">Essayez de modifier vos filtres ou ajoutez un nouveau produit.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modals */}
            {isFormOpen && <StockForm item={editingItem} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            
            <ConfirmationModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleDelete}
                title="Supprimer l'article"
            >
                <p>Êtes-vous sûr de vouloir supprimer définitivement <strong>"{deletingItem?.nom}"</strong> du stock ?</p>
                <p className="mt-2 text-sm text-danger">Cette action est irréversible et supprimera l'historique associé.</p>
            </ConfirmationModal>
        </div>
    );
};

export default Stock;
