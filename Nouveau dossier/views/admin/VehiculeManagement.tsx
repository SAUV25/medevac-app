
import React, { useState, useMemo } from 'react';
import Card from '../../components/Card';
import { Trash2, Edit2, Plus, Truck, Calendar, Activity, Fuel, PenTool, CheckCircle, AlertTriangle, X, Siren, Car, Zap, Shield, Check, FileText, ClipboardList } from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useNotification } from '../../providers/NotificationProvider';

const VEHICLE_TYPES_OPTIONS = [
    { id: 'ASSU', label: 'ASSU', icon: Truck, color: 'orange', desc: 'Amb. Secours & Soins Urgence', bg: 'bg-orange-500' },
    { id: 'VSL', label: 'VSL', icon: Car, color: 'green', desc: 'Véhicule Sanitaire Léger', bg: 'bg-green-600' },
    { id: 'UMH', label: 'UMH / SMUR', icon: Siren, color: 'red', desc: 'Unité Mobile Hospitalière', bg: 'bg-red-600' },
    { id: 'VLM', label: 'VLM', icon: Zap, color: 'blue', desc: 'Véhicule Léger Médicalisé', bg: 'bg-blue-600' },
];

const VehicleForm: React.FC<{ 
    vehicle?: Vehicle; 
    onSave: (v: Vehicle) => void; 
    onCancel: () => void; 
}> = ({ vehicle, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Vehicle>(vehicle || {
        id: '',
        type: 'ASSU',
        brand: '',
        model: '',
        status: 'Disponible',
        mileage: 0,
        fuelLevel: 'Plein',
        lastMaintenance: new Date().toISOString().split('T')[0],
        nextMaintenance: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        registrationDate: '',
        insuranceExpiry: '',
        technicalVisitExpiry: '',
        additionalTracking: ''
    });

    const isEdit = !!vehicle;

    // Helper pour récupérer la couleur du type sélectionné
    const activeType = VEHICLE_TYPES_OPTIONS.find(t => t.id === formData.type) || VEHICLE_TYPES_OPTIONS[0];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-xl !p-0 overflow-hidden shadow-2xl">
                {/* Header Dynamique */}
                <div className={`p-6 border-b transition-colors duration-300 flex justify-between items-start ${activeType.bg} text-white`}>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {isEdit ? <Edit2 size={24} className="text-white/80"/> : <Plus size={24} className="text-white/80"/>}
                            {isEdit ? "Modifier le Véhicule" : "Nouveau Véhicule"}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {formData.id ? `Immatriculation : ${formData.id}` : 'Saisissez les détails de la flotte'}
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-900 overflow-y-auto max-h-[80vh]">
                    
                    {/* Sélecteur de Type (Tuiles) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wide">Type de véhicule</label>
                        <div className="grid grid-cols-2 gap-3">
                            {VEHICLE_TYPES_OPTIONS.map((opt) => {
                                const isSelected = formData.type === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, type: opt.id as VehicleType})}
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
                    </div>

                    {/* Identification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Immatriculation / Identifiant</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="id" 
                                    value={formData.id} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={isEdit}
                                    className="input w-full pl-10 font-mono uppercase text-lg font-bold tracking-wider" 
                                    placeholder="AA-123-BB" 
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className="bg-blue-800 text-white text-[8px] px-1 rounded font-bold">F</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marque</label>
                            <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="input" placeholder="Renault" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modèle</label>
                            <input type="text" name="model" value={formData.model} onChange={handleChange} className="input" placeholder="Master III" required/>
                        </div>
                    </div>

                    {/* État & Kilométrage */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kilométrage Actuel</label>
                                <div className="relative">
                                    <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="input pl-9 font-mono" min="0" />
                                    <Activity size={16} className="absolute left-3 top-3 text-gray-400"/>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-xs text-gray-400 font-bold">km</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Statut Opérationnel</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="input">
                                    <option value="Disponible">🟢 Disponible</option>
                                    <option value="En mission">🔵 En mission</option>
                                    <option value="Maintenance">🟠 Maintenance</option>
                                    <option value="Hors service">🔴 Hors service</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Dates */}
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center"><PenTool size={14} className="mr-1"/> Suivi Maintenance</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">Dernier Entretien</label>
                                <input type="date" name="lastMaintenance" value={formData.lastMaintenance} onChange={handleChange} className="input text-sm py-1.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">Prochain Entretien</label>
                                <input type="date" name="nextMaintenance" value={formData.nextMaintenance} onChange={handleChange} className="input text-sm py-1.5 border-orange-200 focus:border-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Section Documents Administratifs */}
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center"><FileText size={14} className="mr-1"/> Documents & Suivi Administratif</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">Carte Grise (Date)</label>
                                <input type="date" name="registrationDate" value={formData.registrationDate || ''} onChange={handleChange} className="input text-sm py-1.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1 flex justify-between">
                                    <span>Assurance (Exp.)</span>
                                    <Shield size={12} className="text-blue-500"/>
                                </label>
                                <input type="date" name="insuranceExpiry" value={formData.insuranceExpiry || ''} onChange={handleChange} className="input text-sm py-1.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1 flex justify-between">
                                    <span>Visite Technique (Exp.)</span>
                                    <Activity size={12} className="text-purple-500"/>
                                </label>
                                <input type="date" name="technicalVisitExpiry" value={formData.technicalVisitExpiry || ''} onChange={handleChange} className="input text-sm py-1.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1 flex items-center">
                                <ClipboardList size={12} className="mr-1"/> Suivi Divers / Notes
                            </label>
                            <textarea 
                                name="additionalTracking" 
                                value={formData.additionalTracking || ''} 
                                onChange={handleChange} 
                                className="input text-sm" 
                                rows={2}
                                placeholder="Notes libres, réparations mineures à prévoir..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
                        <button 
                            type="submit" 
                            className={`btn-primary flex items-center shadow-lg transition-transform hover:scale-105 ${activeType.bg} border-transparent`}
                        >
                            <CheckCircle size={18} className="mr-2"/> Enregistrer
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const VehicleCard: React.FC<{ vehicle: Vehicle; onEdit: () => void; onDelete: () => void }> = ({ vehicle, onEdit, onDelete }) => {
    const statusColors = {
        'Disponible': 'bg-green-100 text-green-800 border-green-200',
        'En mission': 'bg-blue-100 text-blue-800 border-blue-200',
        'Maintenance': 'bg-orange-100 text-orange-800 border-orange-200',
        'Hors service': 'bg-red-100 text-red-800 border-red-200',
    };

    const isMaintenanceDue = new Date(vehicle.nextMaintenance) < new Date();
    
    // Check expiry for Insurance and Tech Visit
    const now = new Date();
    const isInsuranceExpired = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) < now : false;
    const isTechVisitExpired = vehicle.technicalVisitExpiry ? new Date(vehicle.technicalVisitExpiry) < now : false;
    const isDocAlert = isInsuranceExpired || isTechVisitExpired;

    // Icone selon type
    const TypeIcon = VEHICLE_TYPES_OPTIONS.find(t => t.id === vehicle.type)?.icon || Truck;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group relative hover:-translate-y-1">
            {/* Status Stripe */}
            <div className={`h-1.5 w-full ${
                vehicle.status === 'Disponible' ? 'bg-green-500' : 
                vehicle.status === 'En mission' ? 'bg-blue-500' : 
                vehicle.status === 'Maintenance' ? 'bg-orange-500' : 'bg-red-500'
            }`}></div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            vehicle.type === 'UMH' ? 'bg-red-100 text-red-600' : 
                            vehicle.type === 'VSL' ? 'bg-green-100 text-green-600' : 
                            vehicle.type === 'VLM' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                            <TypeIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">{vehicle.id}</h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{vehicle.brand} {vehicle.model}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${statusColors[vehicle.status]}`}>
                        {vehicle.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded flex flex-col items-center justify-center border border-gray-100 dark:border-gray-600">
                        <Activity size={14} className="text-gray-400 mb-1"/>
                        <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{vehicle.mileage.toLocaleString()} <span className="text-[10px] font-normal">km</span></span>
                    </div>
                    <div className={`p-2 rounded flex flex-col items-center justify-center border ${isMaintenanceDue ? 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-100' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-600'}`}>
                        {isMaintenanceDue ? <AlertTriangle size={14} className="mb-1 animate-pulse"/> : <Calendar size={14} className="mb-1 opacity-50"/>}
                        <span className="font-bold text-xs">{new Date(vehicle.nextMaintenance).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Documents Status */}
                {(vehicle.insuranceExpiry || vehicle.technicalVisitExpiry) && (
                    <div className={`text-[10px] p-2 rounded mb-2 border flex justify-between items-center ${isDocAlert ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        <div className="flex gap-2">
                            {vehicle.insuranceExpiry && (
                                <span className={`flex items-center ${isInsuranceExpired ? 'font-bold underline' : ''}`} title="Assurance">
                                    <Shield size={10} className="mr-1"/> {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                                </span>
                            )}
                            {vehicle.technicalVisitExpiry && (
                                <span className={`flex items-center ${isTechVisitExpired ? 'font-bold underline' : ''}`} title="Visite Technique">
                                    <Activity size={10} className="mr-1"/> {new Date(vehicle.technicalVisitExpiry).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        {isDocAlert && <AlertTriangle size={12}/>}
                    </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{vehicle.type}</span>
                    <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors">
                            <Edit2 size={16}/>
                        </button>
                        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VehiculeManagement: React.FC = () => {
    const { vehiculesData = [], addVehicule, updateVehicule, deleteVehicule } = useData();
    const { addNotification } = useNotification();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);
    const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
    const [filter, setFilter] = useState<'Tous' | VehicleType>('Tous');

    // Stats
    const stats = useMemo(() => {
        return {
            total: vehiculesData.length,
            available: vehiculesData.filter(v => v.status === 'Disponible').length,
            maintenance: vehiculesData.filter(v => v.status === 'Maintenance').length
        };
    }, [vehiculesData]);

    const filteredVehicles = useMemo(() => {
        if (filter === 'Tous') return vehiculesData;
        return vehiculesData.filter(v => v.type === filter);
    }, [vehiculesData, filter]);

    const handleSave = async (vehicle: Vehicle) => {
        try {
            if (vehiculesData.some(v => v.id === vehicle.id && !editingVehicle)) {
                addNotification("Un véhicule avec cet ID existe déjà.", 'error');
                return;
            }
            
            if (editingVehicle) {
                await updateVehicule(vehicle);
                addNotification("Véhicule mis à jour.", 'success');
            } else {
                await addVehicule(vehicle);
                addNotification("Véhicule ajouté.", 'success');
            }
            setIsFormOpen(false);
            setEditingVehicle(undefined);
        } catch (e) {
            addNotification("Erreur lors de l'enregistrement.", 'error');
        }
    };

    const handleDelete = async () => {
        if (deletingVehicle) {
            await deleteVehicule(deletingVehicle.id);
            setDeletingVehicle(null);
            addNotification("Véhicule supprimé.", 'info');
        }
    };
    
    return (
        <div className="space-y-6">
            
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="flex items-center p-4 border-l-4 border-blue-500">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4"><Truck size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Flotte Totale</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-green-500">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4"><CheckCircle size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Disponibles</p>
                        <p className="text-2xl font-bold">{stats.available}</p>
                    </div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-orange-500">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4"><PenTool size={24}/></div>
                    <div>
                        <p className="text-sm text-gray-500">Maintenance</p>
                        <p className="text-2xl font-bold">{stats.maintenance}</p>
                    </div>
                </Card>
                <div className="flex items-center justify-end md:justify-center">
                    <button 
                        onClick={() => { setEditingVehicle(undefined); setIsFormOpen(true); }} 
                        className="btn-primary flex items-center shadow-lg w-full md:w-auto justify-center py-4 hover:scale-105 transition-transform"
                    >
                        <Plus size={20} className="mr-2"/> Ajouter un véhicule
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['Tous', 'ASSU', 'VSL', 'UMH', 'VLM'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            filter === f 
                                ? 'bg-gray-800 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map(v => (
                    <VehicleCard 
                        key={v.id} 
                        vehicle={v} 
                        onEdit={() => { setEditingVehicle(v); setIsFormOpen(true); }}
                        onDelete={() => setDeletingVehicle(v)}
                    />
                ))}
                {filteredVehicles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed dark:border-gray-700">
                        <Truck size={48} className="mx-auto mb-2 opacity-20"/>
                        <p>Aucun véhicule trouvé.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isFormOpen && <VehicleForm vehicle={editingVehicle} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            
            <ConfirmationModal 
                isOpen={!!deletingVehicle} 
                onClose={() => setDeletingVehicle(null)} 
                onConfirm={handleDelete} 
                title="Supprimer Véhicule"
            >
                <p>Êtes-vous sûr de vouloir supprimer le véhicule <strong>{deletingVehicle?.id}</strong> ?</p>
                <p className="text-sm text-red-500 mt-2">Cette action supprimera également l'historique des maintenances associé.</p>
            </ConfirmationModal>
        </div>
    );
};

export default VehiculeManagement;
