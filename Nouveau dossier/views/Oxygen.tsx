
import React, { useState, useMemo } from 'react';
import { OxygenBottle, OxygenStatus } from '../types';
import Card from '../components/Card';
import { Plus, Edit, Trash2, Wind, AlertTriangle, CheckCircle, RefreshCcw, X, Info } from 'lucide-react';
import { useData } from '../providers/DataProvider';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../providers/AuthProvider';

const OxygenForm: React.FC<{ bottle?: OxygenBottle; onSave: (bottle: OxygenBottle) => void; onCancel: () => void; vehicles: string[] }> = ({ bottle, onSave, onCancel, vehicles }) => {
    const [formData, setFormData] = useState<Partial<OxygenBottle>>(bottle || {
        serialNumber: '',
        capacity: 5,
        currentPressure: 200,
        status: 'Pleine',
        location: 'Stock',
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? Number(value) : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newStatus = (formData.currentPressure || 0) < 10 ? 'Vide' : (formData.currentPressure || 0) < 180 ? 'En cours' : 'Pleine';
        const finalData = {
            ...formData,
            status: formData.status === 'Maintenance' ? 'Maintenance' : newStatus,
            lastRefill: formData.currentPressure === 200 ? new Date().toISOString() : (bottle?.lastRefill || new Date().toISOString())
        };
        
        onSave({
            id: bottle?.id || Date.now().toString(),
            ...finalData
        } as OxygenBottle);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{bottle ? "Modifier Bouteille" : "Nouvelle Bouteille O2"}</h2>
                    <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de Série</label>
                        <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} required className="mt-1 input uppercase" placeholder="ex: O2-12345" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacité (Litres)</label>
                            <select name="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 input">
                                <option value="2">2 L (Portable)</option>
                                <option value="5">5 L</option>
                                <option value="15">15 L (Fixe)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pression (Bars)</label>
                            <input type="number" name="currentPressure" max="200" min="0" value={formData.currentPressure} onChange={handleChange} className="mt-1 input" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emplacement</label>
                            <select name="location" value={formData.location} onChange={handleChange} className="mt-1 input">
                                <option value="Stock">Stock Central</option>
                                {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 input">
                                <option value="Pleine">Pleine</option>
                                <option value="En cours">En cours</option>
                                <option value="Vide">Vide</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiration Épreuve Hydraulique</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="mt-1 input" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-2">
                        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
                        <button type="submit" className="btn-primary">Enregistrer</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const OxygenBottleCard: React.FC<{ bottle: OxygenBottle; onEdit: () => void; onDelete: () => void }> = ({ bottle, onEdit, onDelete }) => {
    // Calcul de l'autonomie estimée (en minutes)
    // Formule: (Pression * Volume) / Débit
    const volumeRestant = bottle.currentPressure * bottle.capacity;
    const autonomie15L = Math.floor(volumeRestant / 15); // Débit urgence
    const autonomie2L = Math.floor(volumeRestant / 2); // Débit maintien

    const pressurePercentage = (bottle.currentPressure / 200) * 100;
    
    let gaugeColor = 'bg-success';
    if (bottle.status === 'Maintenance') gaugeColor = 'bg-gray-400';
    else if (bottle.currentPressure < 20) gaugeColor = 'bg-danger';
    else if (bottle.currentPressure < 100) gaugeColor = 'bg-warning';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 p-4 relative overflow-hidden transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-primary">
                        <Wind size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{bottle.serialNumber}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{bottle.capacity} Litres • {bottle.location}</span>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                    bottle.status === 'Pleine' ? 'bg-green-100 text-green-800' :
                    bottle.status === 'Vide' ? 'bg-red-100 text-red-800' :
                    bottle.status === 'Maintenance' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {bottle.status}
                </div>
            </div>

            {/* Gauge */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-300">
                    <span>Pression</span>
                    <span className="font-mono font-bold">{bottle.currentPressure} Bar</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${gaugeColor} transition-all duration-500`} style={{ width: `${pressurePercentage}%` }}></div>
                </div>
            </div>

            {/* Autonomie */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-700/30 p-2 rounded mb-4">
                <div className="text-center">
                    <span className="block text-gray-500 mb-1">15 L/min</span>
                    <span className="font-bold font-mono">{autonomie15L} min</span>
                </div>
                <div className="text-center border-l dark:border-gray-600">
                    <span className="block text-gray-500 mb-1">2 L/min</span>
                    <span className="font-bold font-mono">{Math.floor(autonomie2L / 60)}h {autonomie2L % 60}m</span>
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t dark:border-gray-700 pt-3">
                <button onClick={onEdit} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><Edit size={18}/></button>
                <button onClick={onDelete} className="p-2 text-gray-500 hover:text-danger hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><Trash2 size={18}/></button>
            </div>
        </div>
    );
};

const Oxygen: React.FC = () => {
    const { oxygenBottles = [], vehicules = [], addOxygenBottle, updateOxygenBottle, deleteOxygenBottle } = useData();
    const { currentUser } = useAuth();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBottle, setEditingBottle] = useState<OxygenBottle | undefined>(undefined);
    const [deletingBottle, setDeletingBottle] = useState<OxygenBottle | null>(null);
    const [filter, setFilter] = useState<'Tous' | 'Stock' | 'Véhicules' | 'Vide'>('Tous');

    const handleSave = (bottle: OxygenBottle) => {
        if (oxygenBottles.some(b => b.id === bottle.id)) {
            updateOxygenBottle(bottle);
        } else {
            addOxygenBottle(bottle);
        }
        setIsFormOpen(false);
        setEditingBottle(undefined);
    };

    const handleDelete = () => {
        if (deletingBottle) {
            deleteOxygenBottle(deletingBottle.id);
            setDeletingBottle(null);
        }
    };

    const filteredBottles = useMemo(() => {
        return oxygenBottles.filter(b => {
            if (filter === 'Stock') return b.location === 'Stock';
            if (filter === 'Véhicules') return b.location !== 'Stock';
            if (filter === 'Vide') return b.status === 'Vide' || b.currentPressure < 10;
            return true;
        }).sort((a, b) => a.location.localeCompare(b.location));
    }, [oxygenBottles, filter]);

    const totalVolume = oxygenBottles.reduce((acc, b) => acc + (b.capacity * b.currentPressure), 0);
    const totalBottles = oxygenBottles.length;
    const emptyBottles = oxygenBottles.filter(b => b.status === 'Vide').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold dark:text-gray-100 flex items-center">
                    <Wind className="mr-3 text-primary" /> Gestion de l'Oxygène
                </h1>
                <button onClick={() => { setEditingBottle(undefined); setIsFormOpen(true); }} className="btn-primary flex items-center shadow-lg">
                    <Plus size={20} className="mr-2" />
                    Ajouter une bouteille
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex items-center">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4"><Wind size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Volume Total Dispo</p>
                        <p className="text-2xl font-bold">{totalVolume.toLocaleString()} Litres</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex items-center">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4"><CheckCircle size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Bouteilles Actives</p>
                        <p className="text-2xl font-bold">{totalBottles}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex items-center">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full mr-4"><AlertTriangle size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">À Remplir</p>
                        <p className="text-2xl font-bold">{emptyBottles}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['Tous', 'Stock', 'Véhicules', 'Vide'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                            filter === f 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filteredBottles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBottles.map(bottle => (
                        <OxygenBottleCard 
                            key={bottle.id} 
                            bottle={bottle} 
                            onEdit={() => { setEditingBottle(bottle); setIsFormOpen(true); }}
                            onDelete={() => setDeletingBottle(bottle)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                    <Wind size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Aucune bouteille trouvée pour ce filtre.</p>
                </div>
            )}

            {/* Modals */}
            {isFormOpen && (
                <OxygenForm 
                    bottle={editingBottle} 
                    onSave={handleSave} 
                    onCancel={() => setIsFormOpen(false)} 
                    vehicles={vehicules}
                />
            )}

            <ConfirmationModal
                isOpen={!!deletingBottle}
                onClose={() => setDeletingBottle(null)}
                onConfirm={handleDelete}
                title="Supprimer Bouteille"
            >
                <p>Êtes-vous sûr de vouloir supprimer la bouteille <strong>{deletingBottle?.serialNumber}</strong> ?</p>
                <p className="mt-2 text-sm text-danger">Cette action est irréversible.</p>
            </ConfirmationModal>
        </div>
    );
};

export default Oxygen;
