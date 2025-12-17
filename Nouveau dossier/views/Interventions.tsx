
import React, { useState, useEffect, useMemo } from 'react';
// FIX: Corrected import path for types to be relative.
import { Intervention, InterventionStatus, InterventionType, Patient, ViewContext, User, Shift } from '../types';
import Card from '../components/Card';
import { Plus, X, Edit, Trash2, MapPin, BellRing, Loader2, CalendarCheck } from 'lucide-react';
// FIX: Corrected import path to be relative.
import { useData } from '../providers/DataProvider';
import ConfirmationModal from '../components/ConfirmationModal';
// FIX: Corrected import path to be relative.
import { useAuth } from '../providers/AuthProvider';
import { useNotification } from '../providers/NotificationProvider';

const INTERVENTION_STATUSES: InterventionStatus[] = ["En attente", "En cours", "Terminé", "Annulé"];
const INTERVENTION_TYPES: InterventionType[] = ["Urgence", "Programmé", "Transfert"];


const InterventionForm: React.FC<{ 
    intervention?: Intervention; 
    onSave: (intervention: Intervention) => void; 
    onCancel: () => void; 
    patients: Patient[];
    users: User[];
    shifts: Shift[];
}> = ({ intervention, onSave, onCancel, patients, users, shifts }) => {
    const [formData, setFormData] = useState<Intervention>(intervention || {
        id: intervention ? intervention.id : Date.now().toString(),
        patientName: '',
        adresseDepart: '',
        adresseArrivee: '',
        type: 'Urgence',
        status: 'En attente',
        equipe: '',
        infirmierId: '',
        ambulancierId: '',
        notes: '',
        dateCreation: new Date().toISOString()
    });

    const [autoFilled, setAutoFilled] = useState(false);

    // Auto-fill logic based on shifts
    useEffect(() => {
        // Only trigger for new interventions (no ID or explicit editing of existing)
        if (!intervention && !autoFilled) {
            const today = new Date().toISOString().split('T')[0];
            const currentShift = shifts.find(s => s.date === today);
            
            if (currentShift) {
                setFormData(prev => ({
                    ...prev,
                    infirmierId: prev.infirmierId || currentShift.infirmierId,
                    ambulancierId: prev.ambulancierId || currentShift.ambulancierId
                }));
                setAutoFilled(true);
            }
        }
    }, [intervention, shifts, autoFilled]);

    useEffect(() => {
        if (intervention) {
            let initialName = intervention.patientName || '';
            if (!initialName && intervention.patientId) {
                const patient = patients.find(p => p.id === intervention.patientId);
                if (patient) {
                    initialName = `${patient.prenom} ${patient.nom}`;
                }
            }
            setFormData({...intervention, patientName: initialName});
        }
    }, [intervention, patients]);

    const { infirmiers, ambulanciers } = useMemo(() => ({
        infirmiers: users.filter(u => u.role === 'infirmier'),
        ambulanciers: users.filter(u => u.role === 'ambulancier')
    }), [users]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const selectedPatient = patients.find(p => `${p.prenom} ${p.nom}` === name);
        setFormData(prev => ({ 
            ...prev,
            patientName: name,
            patientId: selectedPatient ? selectedPatient.id : undefined
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Construct the legacy 'equipe' string for display compatibility
        const infName = infirmiers.find(i => i.id === formData.infirmierId)?.nom || '';
        const ambName = ambulanciers.find(a => a.id === formData.ambulancierId)?.nom || '';
        const equipeStr = [infName, ambName].filter(Boolean).join(' & ');
        
        onSave({ ...formData, equipe: equipeStr });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{intervention ? "Modifier l'Intervention" : "Nouvelle Intervention"}</h2>
                    <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient</label>
                        <input
                            type="text"
                            name="patientName"
                            value={formData.patientName || ''}
                            onChange={handlePatientNameChange}
                            list="patients-list"
                            required
                            className="mt-1 input"
                            placeholder="Rechercher ou saisir un nom"
                        />
                        <datalist id="patients-list">
                            {patients.map(p => <option key={p.id} value={`${p.prenom} ${p.nom}`} />)}
                        </datalist>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="mt-1 input">
                                {INTERVENTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 input">
                                {INTERVENTION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse de départ</label>
                        <input type="text" name="adresseDepart" value={formData.adresseDepart} onChange={handleChange} className="mt-1 input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse d'arrivée</label>
                        <input type="text" name="adresseArrivee" value={formData.adresseArrivee} onChange={handleChange} className="mt-1 input" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-md relative">
                        <div className="col-span-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Affectation de l'équipe</span>
                            {autoFilled && !intervention && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center">
                                    <CalendarCheck size={10} className="mr-1"/> Garde auto
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Infirmier</label>
                            <select name="infirmierId" value={formData.infirmierId || ''} onChange={handleChange} className="mt-1 input text-sm">
                                <option value="">Sélectionner...</option>
                                {infirmiers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Ambulancier</label>
                            <select name="ambulancierId" value={formData.ambulancierId || ''} onChange={handleChange} className="mt-1 input text-sm">
                                <option value="">Sélectionner...</option>
                                {ambulanciers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 input" />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
                        <button type="submit" className="btn-primary">Enregistrer</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

interface InterventionsProps {
    context?: ViewContext;
    setContext?: (context: ViewContext) => void;
}

const Interventions: React.FC<InterventionsProps> = ({ context, setContext }) => {
    const { interventions = [], patients = [], users = [], shifts = [], addIntervention, updateIntervention, deleteIntervention, alertInterventionTeam } = useData();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingIntervention, setEditingIntervention] = useState<Intervention | undefined>(undefined);
    const [deletingIntervention, setDeletingIntervention] = useState<Intervention | null>(null);
    const [alertingId, setAlertingId] = useState<string | null>(null);

    useEffect(() => {
        if (context?.id) {
            const interventionToEdit = interventions.find(i => i.id === context.id);
            if (interventionToEdit) {
                setEditingIntervention(interventionToEdit);
                setIsFormOpen(true);
                setContext?.({}); 
            }
        }
    }, [context, interventions, setContext]);

    const handleSave = (intervention: Intervention) => {
        const index = interventions.findIndex(i => i.id === intervention.id);
        if (index > -1) {
            updateIntervention(intervention);
        } else {
            addIntervention(intervention);
        }
        setIsFormOpen(false);
        setEditingIntervention(undefined);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingIntervention(undefined);
    };

    const handleDelete = () => {
        if (deletingIntervention) {
            deleteIntervention(deletingIntervention.id);
            setDeletingIntervention(null);
        }
    };
    
    const handleAlertTeam = async (intervention: Intervention) => {
        if (!intervention.infirmierId && !intervention.ambulancierId) {
            addNotification("Veuillez d'abord assigner un infirmier ou un ambulancier à cette intervention.", 'error');
            setEditingIntervention(intervention);
            setIsFormOpen(true);
            return;
        }
        
        setAlertingId(intervention.id);
        try {
            await alertInterventionTeam(intervention.id);
            addNotification("L'équipe a été alertée avec succès.", 'success');
        } catch (error: any) {
            addNotification(error.message || "Erreur lors de l'envoi de l'alerte.", 'error');
        } finally {
            setAlertingId(null);
        }
    };
    
    const getInterventionPatientName = (intervention: Intervention) => {
        if (intervention.patientName) {
            return intervention.patientName;
        }
        if (intervention.patientId) {
            const patient = patients.find(p => p.id === intervention.patientId);
            return patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu';
        }
        return 'Patient non spécifié';
    };

    const statusBadgeClass = (status: InterventionStatus) => {
        switch (status) {
            case "Terminé": return 'bg-success/20 text-success';
            case "En cours": return 'bg-info/20 text-info';
            case "Annulé": return 'bg-danger/20 text-danger';
            case "En attente": return 'bg-warning/20 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const canAlert = currentUser?.role === 'regulateur' || currentUser?.role === 'admin';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold dark:text-gray-100">Gestion des Interventions</h1>
                <button onClick={() => { setEditingIntervention(undefined); setIsFormOpen(true); }} className="btn-primary flex items-center">
                    <Plus size={20} className="mr-2" />
                    Nouvelle Intervention
                </button>
            </div>
            
            {isFormOpen && <InterventionForm intervention={editingIntervention} onSave={handleSave} onCancel={handleCancel} patients={patients} users={users} shifts={shifts} />}

            <ConfirmationModal
                isOpen={!!deletingIntervention}
                onClose={() => setDeletingIntervention(null)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
            >
                <p>Êtes-vous sûr de vouloir supprimer l'intervention pour <strong>{deletingIntervention && getInterventionPatientName(deletingIntervention)}</strong> ?</p>
                <p className="mt-2 text-sm text-danger">Cette action est irréversible.</p>
            </ConfirmationModal>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="text-left p-3 font-semibold dark:text-gray-300">Patient</th>
                            <th className="text-left p-3 font-semibold dark:text-gray-300">Type</th>
                            <th className="text-left p-3 font-semibold dark:text-gray-300">Trajet</th>
                            <th className="text-left p-3 font-semibold dark:text-gray-300">Équipe</th>
                            <th className="text-left p-3 font-semibold dark:text-gray-300">Statut</th>
                            <th className="text-left p-3 font-semibold dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interventions.map(i => (
                            <tr key={i.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3">{getInterventionPatientName(i)}</td>
                                <td className="p-3">{i.type}</td>
                                <td className="p-3 flex items-center"><MapPin size={16} className="mr-2 text-gray-400"/> {i.adresseDepart} <span className="mx-2">→</span> {i.adresseArrivee}</td>
                                <td className="p-3">
                                    {i.equipe || <span className="text-gray-400 text-sm italic">Non assignée</span>}
                                </td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(i.status)}`}>{i.status}</span></td>
                                <td className="p-3">
                                    <div className="flex space-x-2">
                                        {canAlert && (i.status === 'En attente' || i.status === 'En cours') && (
                                            <button 
                                                onClick={() => handleAlertTeam(i)} 
                                                className="p-2 text-white bg-danger rounded-full hover:bg-danger/90 shadow-md transform hover:scale-105 transition-all" 
                                                title="Alerter l'équipe"
                                                disabled={alertingId === i.id}
                                            >
                                                {alertingId === i.id ? <Loader2 size={18} className="animate-spin"/> : <BellRing size={18}/>}
                                            </button>
                                        )}
                                        <button onClick={() => { setEditingIntervention(i); setIsFormOpen(true); }} className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"><Edit size={18}/></button>
                                        {currentUser?.role === 'admin' && (
                                            <button onClick={() => setDeletingIntervention(i)} className="p-2 text-gray-500 hover:text-danger rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"><Trash2 size={18}/></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {interventions.length === 0 && <Card className="mt-4 text-center text-gray-500 dark:text-gray-400">Aucune intervention enregistrée.</Card>}
            </div>
        </div>
    );
};

export default Interventions;
