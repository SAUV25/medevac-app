
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../providers/DataProvider';
import { useAuth } from '../providers/AuthProvider';
import { Intervention, User, InterventionType, Patient, AppNotification } from '../types';
import { MapPin, Phone, AlertTriangle, Clock, Ambulance, CheckCircle, Shield, Plus, FileText, Siren, Radio, Zap, Filter, Activity, Bed, ChevronRight, X, PhoneIncoming, Save, Navigation, Search, User as UserIcon, Stethoscope, AlertOctagon, Timer, BellRing } from 'lucide-react';
import LiveMap from './LiveMap';
import Card from '../components/Card';
import { INTERVENTION_TEMPLATES, InterventionTemplate, HOSPITALS } from '../constants';
import { useNotification } from '../providers/NotificationProvider';

// Simulation de distance (pour la démo)
const getMockDistance = () => Math.floor(Math.random() * 25) + 2;

// Types locaux pour le Dashboard
type Tab = 'dashboard' | 'new_call';

interface NewCallState {
    callerPhone: string;
    callerType: 'Patient' | 'Tiers' | 'Pompier' | 'Police' | 'Medecin';
    patientName: string;
    patientId?: string; // Link to existing patient
    location: string;
    motive: string;
    severity: 1 | 2 | 3 | 4 | 5; // CCMU like
    notes: string;
    vitals: {
        spO2: string;
        fc: string;
        ta: string;
        glasgow: string;
    }
}

// Composant Chronomètre simple
const CallTimer: React.FC = () => {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    
    const format = (s: number) => {
        const mins = Math.floor(s / 60).toString().padStart(2, '0');
        const secs = (s % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className={`font-mono text-xl font-bold flex items-center gap-2 ${seconds > 180 ? 'text-red-500 animate-pulse' : 'text-gray-700 dark:text-gray-200'}`}>
            <Timer size={20}/> {format(seconds)}
        </div>
    );
};

const RegulationDashboard: React.FC = () => {
    const { interventions = [], users = [], vehicules = [], patients = [], addIntervention, updateIntervention, appNotifications = [] } = useData();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    
    // États
    const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [hospitalCapacities, setHospitalCapacities] = useState(HOSPITALS.map(h => ({ ...h, availableBeds: Math.floor(Math.random() * 5), saturation: Math.random() * 100 })));
    
    // État du formulaire "Nouvel Appel"
    const [newCall, setNewCall] = useState<NewCallState>({
        callerPhone: '',
        callerType: 'Patient',
        patientName: '',
        location: '',
        motive: '',
        severity: 3,
        notes: '',
        vitals: { spO2: '', fc: '', ta: '', glasgow: '' }
    });
    
    // Pour la recherche patient
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [foundPatients, setFoundPatients] = useState<Patient[]>([]);

    // Données dérivées
    const selectedIntervention = useMemo(() => 
        interventions.find(i => i.id === selectedInterventionId), 
    [interventions, selectedInterventionId]);

    const activeInterventions = useMemo(() => 
        interventions
            .filter(i => i.status === 'En cours' || i.status === 'En attente')
            .sort((a, b) => {
                // Tri par priorité (Urgence > autre) puis par date
                if (a.type === 'Urgence' && b.type !== 'Urgence') return -1;
                if (a.type !== 'Urgence' && b.type === 'Urgence') return 1;
                return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
            }),
    [interventions]);

    const availableResources = useMemo(() => {
        return vehicules.map(v => {
            const activeMission = activeInterventions.find(i => i.equipe?.includes(v));
            const distance = selectedIntervention ? getMockDistance() : null;
            return {
                id: v,
                type: v.includes('SMUR') ? 'UMH' : 'VSAV',
                status: activeMission ? 'Indisponible' : 'Disponible',
                mission: activeMission,
                distance: distance,
                eta: distance ? Math.round(distance * 1.5) : null // 1.5 min par km (urbain)
            };
        }).sort((a, b) => {
            if (a.status === 'Disponible' && b.status !== 'Disponible') return -1;
            if (a.status !== 'Disponible' && b.status === 'Disponible') return 1;
            return (a.distance || 999) - (b.distance || 999);
        });
    }, [vehicules, activeInterventions, selectedIntervention]);

    // Alertes de régulation calculées par DataProvider
    const activeAlerts = useMemo(() => 
        appNotifications.filter(n => n.type === 'regulation_alert'),
    [appNotifications]);

    // Actions
    const handleTakeCall = () => {
        setNewCall({
            callerPhone: '06' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
            callerType: 'Patient',
            patientName: '',
            location: '',
            motive: '',
            severity: 3,
            notes: '',
            vitals: { spO2: '', fc: '', ta: '', glasgow: '' }
        });
        setPatientSearchTerm('');
        setFoundPatients([]);
        setActiveTab('new_call');
    };

    const handlePatientSearch = (term: string) => {
        setPatientSearchTerm(term);
        if (term.length > 2) {
            const results = patients.filter(p => 
                p.nom.toLowerCase().includes(term.toLowerCase()) || 
                p.prenom.toLowerCase().includes(term.toLowerCase())
            );
            setFoundPatients(results);
        } else {
            setFoundPatients([]);
        }
        // Also update the manual name field
        setNewCall(prev => ({ ...prev, patientName: term }));
    };

    const handleSelectPatient = (patient: Patient) => {
        setNewCall(prev => ({
            ...prev,
            patientName: `${patient.prenom} ${patient.nom}`,
            patientId: patient.id,
            // Pre-fill location if address is in observations or similar (mock logic)
            location: prev.location || "Domicile connu" 
        }));
        setPatientSearchTerm(`${patient.prenom} ${patient.nom}`);
        setFoundPatients([]);
    };

    const handleSubmitCall = async (e: React.FormEvent) => {
        e.preventDefault();
        const type: InterventionType = newCall.severity <= 2 ? 'Urgence' : 'Programmé';
        
        // Construct vitals string
        const vitalsStr = Object.values(newCall.vitals).some(v => v) 
            ? ` | Constantes: TA ${newCall.vitals.ta || '?'} - FC ${newCall.vitals.fc || '?'} - SpO2 ${newCall.vitals.spO2 || '?'}%`
            : '';

        await addIntervention({
            patientName: newCall.patientName || 'Inconnu (Appel 15)',
            patientId: newCall.patientId,
            adresseDepart: newCall.location,
            adresseArrivee: 'À déterminer',
            type: type,
            status: 'En attente',
            equipe: '',
            notes: `[CCMU ${newCall.severity}] Motif: ${newCall.motive}. Appelant: ${newCall.callerType} (${newCall.callerPhone}). ${newCall.notes}${vitalsStr}`
        });
        
        addNotification(`Dossier créé pour ${newCall.patientName || 'Inconnu'}`, 'success');
        setActiveTab('dashboard');
    };

    const handleMedicalAdvice = async () => {
        // Validation minimale
        if (!newCall.motive) {
            addNotification("Veuillez sélectionner un motif avant de clôturer en conseil.", "error");
            return;
        }

        const vitalsStr = Object.values(newCall.vitals).some(v => v) 
            ? ` | Constantes: TA ${newCall.vitals.ta || '?'} - FC ${newCall.vitals.fc || '?'} - SpO2 ${newCall.vitals.spO2 || '?'}%`
            : '';

        await addIntervention({
            patientName: newCall.patientName || 'Inconnu (Conseil)',
            patientId: newCall.patientId,
            adresseDepart: newCall.location || 'Non renseigné',
            adresseArrivee: 'N/A',
            type: 'Urgence',
            status: 'Terminé', // Clôturé immédiatement
            equipe: 'Régulation Médicale',
            notes: `[CONSEIL MÉDICAL] [CCMU ${newCall.severity}] Motif: ${newCall.motive}. Appelant: ${newCall.callerType} (${newCall.callerPhone}). ${newCall.notes}${vitalsStr}`
        });

        addNotification(`Dossier clôturé en Conseil Médical.`, 'success');
        setActiveTab('dashboard');
    };

    const handleAssignTeam = (resourceId: string) => {
        if (!selectedIntervention) return;
        updateIntervention({
            ...selectedIntervention,
            status: 'En cours',
            equipe: resourceId
        });
        addNotification(`Moyen ${resourceId} engagé sur l'intervention.`, 'success');
    };

    const getSeverityColor = (severity: number) => {
        switch(severity) {
            case 1: return 'bg-red-600 text-white ring-red-600'; // Vital
            case 2: return 'bg-orange-500 text-white ring-orange-500'; // Urgent
            case 3: return 'bg-yellow-400 text-black ring-yellow-400'; // Relatif
            case 4: return 'bg-green-500 text-white ring-green-500'; // Consult
            default: return 'bg-blue-500 text-white ring-blue-500'; // Différé
        }
    };

    // Rendu Composant : Formulaire Nouvel Appel
    if (activeTab === 'new_call') {
        const selectedPatientData = patients.find(p => p.id === newCall.patientId);

        return (
            <div className="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-900 p-4 animate-slide-in">
                <Card className="w-full max-w-5xl border-t-8 border-primary flex flex-col h-[90vh] overflow-hidden !p-0">
                    {/* Header Appel */}
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse text-red-600 border border-red-200 dark:border-red-800">
                                <PhoneIncoming size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                                    Dossier de Régulation <span className="text-sm font-normal bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">ID: #{Math.floor(Math.random()*10000)}</span>
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center"><Phone size={14} className="mr-1"/> {newCall.callerPhone}</span>
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    <CallTimer />
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('dashboard')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmitCall} className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-6 bg-gray-50 dark:bg-gray-900/50">
                        
                        {/* GAUCHE : Contexte & Patient */}
                        <div className="col-span-12 md:col-span-5 space-y-6">
                            
                            {/* Qualification Appelant */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wider flex items-center"><UserIcon size={16} className="mr-2"/> Qualité de l'appelant</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Patient', 'Tiers', 'Pompier', 'Police', 'Medecin'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewCall({...newCall, callerType: type as any})}
                                            className={`px-3 py-2 text-sm rounded-md border transition-all ${
                                                newCall.callerType === type 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recherche Patient */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 relative">
                                <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wider flex items-center"><Search size={16} className="mr-2"/> Identification Patient</h3>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={patientSearchTerm}
                                        onChange={(e) => handlePatientSearch(e.target.value)}
                                        className="input pl-10"
                                        placeholder="Rechercher nom, prénom..."
                                    />
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                                </div>
                                {foundPatients.length > 0 && (
                                    <div className="absolute z-10 w-full left-0 mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                        {foundPatients.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => handleSelectPatient(p)}
                                                className="p-3 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600 last:border-0"
                                            >
                                                <div className="font-bold">{p.nom} {p.prenom}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-300">{p.age} ans - {p.sexe}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Carte Patient (Si identifié) */}
                                {selectedPatientData && (
                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md text-sm animate-slide-in">
                                        <div className="flex justify-between font-bold text-blue-800 dark:text-blue-300 mb-2">
                                            <span>Dossier Médical</span>
                                            <span>Âge: {selectedPatientData.age}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p><span className="font-semibold">Antécédents:</span> {selectedPatientData.antecedents || 'RAS'}</p>
                                            <p><span className="font-semibold">Allergies:</span> <span className="text-red-600 font-bold">{selectedPatientData.allergies || 'Aucune'}</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Localisation */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wider flex items-center"><MapPin size={16} className="mr-2"/> Localisation de l'urgence</h3>
                                <div className="flex gap-2">
                                    <input 
                                        value={newCall.location}
                                        onChange={e => setNewCall({...newCall, location: e.target.value})}
                                        className="input flex-1"
                                        placeholder="Adresse précise, étage, code..."
                                        required
                                    />
                                    <button type="button" className="p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200" title="Géolocaliser"><Navigation size={20}/></button>
                                </div>
                            </div>
                        </div>

                        {/* DROITE : Médical & Décision */}
                        <div className="col-span-12 md:col-span-7 space-y-6">
                            
                            {/* Motif & Constantes */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider flex items-center"><Stethoscope size={16} className="mr-2"/> Bilan Clinique</h3>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Motif Principal</label>
                                    <select 
                                        value={newCall.motive}
                                        onChange={e => setNewCall({...newCall, motive: e.target.value})}
                                        className="input w-full text-lg"
                                        required
                                    >
                                        <option value="">-- Sélectionner le motif --</option>
                                        <option value="Douleur Thoracique">Douleur Thoracique</option>
                                        <option value="Détresse Respiratoire">Détresse Respiratoire</option>
                                        <option value="AVP">Accident de la Voie Publique</option>
                                        <option value="Inconscience">Inconscience / Coma</option>
                                        <option value="Arrêt Cardiaque">Arrêt Cardio-Respiratoire</option>
                                        <option value="Traumatisme">Traumatisme / Chute</option>
                                        <option value="Malaise">Malaise Vagal / Indéterminé</option>
                                        <option value="Psychiatrie">Troubles Psychiatriques</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border dark:border-gray-600">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">SpO2 (%)</label>
                                        <input type="number" placeholder="98" className="input text-center font-mono" value={newCall.vitals.spO2} onChange={e => setNewCall({...newCall, vitals: {...newCall.vitals, spO2: e.target.value}})}/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">FC (bpm)</label>
                                        <input type="number" placeholder="80" className="input text-center font-mono" value={newCall.vitals.fc} onChange={e => setNewCall({...newCall, vitals: {...newCall.vitals, fc: e.target.value}})}/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">TA (mmHg)</label>
                                        <input type="text" placeholder="12/8" className="input text-center font-mono" value={newCall.vitals.ta} onChange={e => setNewCall({...newCall, vitals: {...newCall.vitals, ta: e.target.value}})}/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Glasgow</label>
                                        <input type="number" max="15" placeholder="15" className="input text-center font-mono" value={newCall.vitals.glasgow} onChange={e => setNewCall({...newCall, vitals: {...newCall.vitals, glasgow: e.target.value}})}/>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1">Interrogatoire / Notes</label>
                                    <textarea 
                                        rows={4} 
                                        className="input w-full resize-none" 
                                        placeholder="Circonstances, signes associés, traitement pris..."
                                        value={newCall.notes}
                                        onChange={e => setNewCall({...newCall, notes: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Décision Régulation (CCMU) */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider flex items-center"><AlertOctagon size={16} className="mr-2"/> Décision & Gravité (CCMU)</h3>
                                
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map((lvl) => (
                                        <button
                                            type="button"
                                            key={lvl}
                                            onClick={() => setNewCall({...newCall, severity: lvl as any})}
                                            className={`py-4 rounded-xl border font-bold text-xl transition-all shadow-sm flex flex-col items-center justify-center ${
                                                newCall.severity === lvl 
                                                    ? `${getSeverityColor(lvl)} ring-2 ring-offset-2 transform scale-105 z-10` 
                                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span>{lvl}</span>
                                            <span className="text-[10px] uppercase font-normal mt-1 opacity-80">
                                                {lvl === 1 ? 'Vital' : lvl === 2 ? 'Urgent' : lvl === 3 ? 'Relatif' : lvl === 4 ? 'Consult' : 'Différé'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex justify-between items-center">
                        <button type="button" onClick={() => setActiveTab('dashboard')} className="btn-secondary px-6">
                            Annuler / Requalifier
                        </button>
                        <div className="flex gap-4">
                            <button 
                                type="button"
                                onClick={handleMedicalAdvice}
                                className="px-6 py-3 bg-orange-100 text-orange-700 font-bold rounded-lg hover:bg-orange-200 transition-colors border border-orange-200"
                            >
                                Conseil Médical
                            </button>
                            <button onClick={handleSubmitCall} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg transform hover:scale-105 transition-all flex items-center">
                                <Siren className="mr-2 animate-pulse"/> DÉCLENCHER SMUR/VSAV
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Rendu Principal : Dashboard
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            
            {/* Top Bar : Indicateurs & Actions Rapides */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-3 flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold flex items-center text-primary">
                        <Siren className="mr-2" /> ARM Cockpit
                    </h1>
                    <div className="flex gap-3">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded border border-red-100 dark:border-red-900 flex items-center text-sm font-bold">
                            <Activity size={16} className="mr-2"/> En cours: {activeInterventions.length}
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded border border-green-100 dark:border-green-900 flex items-center text-sm font-bold">
                            <Ambulance size={16} className="mr-2"/> Dispo: {availableResources.filter(r => r.status === 'Disponible').length}
                        </div>
                    </div>
                </div>
                <div>
                    <button 
                        onClick={handleTakeCall}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md shadow-lg flex items-center font-bold animate-pulse"
                    >
                        <PhoneIncoming size={20} className="mr-2"/> Prise d'appel (15)
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                
                {/* COLONNE 1 : Liste des Interventions (Main Courante) */}
                <div className="w-1/4 min-w-[300px] flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                    <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-semibold text-sm text-gray-500 uppercase flex justify-between items-center">
                        <span>Dossiers Actifs</span>
                        <Filter size={16} className="cursor-pointer hover:text-primary"/>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {activeInterventions.map(mission => (
                            <div 
                                key={mission.id}
                                onClick={() => setSelectedInterventionId(mission.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedInterventionId === mission.id 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                        mission.type === 'Urgence' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {mission.type}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {new Date(mission.dateCreation).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className="font-bold text-gray-800 dark:text-gray-200 truncate">
                                    {mission.patientName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1 truncate">
                                    <MapPin size={12} className="mr-1 flex-shrink-0"/> {mission.adresseDepart}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    {mission.equipe ? (
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300 font-mono flex items-center">
                                            <Ambulance size={12} className="mr-1"/> {mission.equipe}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-orange-600 font-bold flex items-center animate-pulse">
                                            <AlertTriangle size={12} className="mr-1"/> À assigner
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {activeInterventions.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <CheckCircle size={48} className="mx-auto mb-2 opacity-50"/>
                                <p>Aucune intervention active</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNE 2 : Carte (Live Map) */}
                <div className="flex-1 relative bg-gray-200 dark:bg-gray-900">
                    <LiveMap setCurrentView={() => {}} />
                    
                    {/* WIDGET D'ALERTES RÉGULATION */}
                    {activeAlerts.length > 0 && (
                        <div className="absolute top-4 left-4 z-30 w-80">
                            <div className="bg-red-600 text-white p-2 rounded-t-lg flex items-center justify-between shadow-lg">
                                <div className="flex items-center text-sm font-bold animate-pulse">
                                    <BellRing size={16} className="mr-2"/> Centrale d'Alertes ({activeAlerts.length})
                                </div>
                            </div>
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-xl rounded-b-lg border-x border-b border-red-200 dark:border-gray-700 p-2 max-h-48 overflow-y-auto">
                                {activeAlerts.map(alert => (
                                    <div key={alert.id} className="text-xs p-2 mb-1 rounded bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-100 dark:border-red-900">
                                        {alert.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Overlay: Détail Intervention Sélectionnée */}
                    {selectedIntervention && (
                        <div className="absolute top-4 right-4 md:w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-2xl rounded-xl border dark:border-gray-700 p-4 animate-slide-in z-30">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="font-bold text-lg">{selectedIntervention.patientName}</h2>
                                    <p className="text-xs text-gray-500 flex items-center">
                                        <MapPin size={12} className="mr-1"/> {selectedIntervention.adresseDepart}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedInterventionId(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm mb-4 border dark:border-gray-600">
                                <p className="italic text-gray-600 dark:text-gray-300">"{selectedIntervention.notes || 'Pas de notes'}"</p>
                            </div>

                            {/* Section Assignation */}
                            {!selectedIntervention.equipe ? (
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Moyens disponibles les plus proches</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {availableResources.filter(r => r.status === 'Disponible').slice(0, 3).map(res => (
                                            <div key={res.id} className="flex justify-between items-center p-2 border dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer group" onClick={() => handleAssignTeam(res.id)}>
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-gray-200 dark:bg-gray-600 p-1.5 rounded text-gray-600 dark:text-gray-300">
                                                        <Ambulance size={16}/>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{res.id}</div>
                                                        <div className="text-xs text-gray-500">{res.type} • {res.distance} km ({res.eta} min)</div>
                                                    </div>
                                                </div>
                                                <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Engager
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded text-green-800 dark:text-green-300 flex items-center justify-center font-bold">
                                    <CheckCircle size={18} className="mr-2"/> Moyen {selectedIntervention.equipe} engagé
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* COLONNE 3 : Ressources & Hôpitaux */}
                <div className="w-1/5 min-w-[250px] bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col z-10">
                    
                    {/* Widget Capacité Hôpitaux */}
                    <div className="p-3 border-b dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
                            <Bed size={14} className="mr-1"/> Capacités Lits (Réa/Urg)
                        </h3>
                        <div className="space-y-3">
                            {hospitalCapacities.map(h => (
                                <div key={h.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.availableBeds > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="truncate" title={h.name}>{h.name}</span>
                                    </div>
                                    <span className={`font-mono font-bold px-1.5 rounded ${h.availableBeds === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {h.availableBeds}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* État des Forces Simplifié */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
                            <Radio size={14} className="mr-1"/> État des forces
                        </h3>
                        <div className="space-y-2">
                            {availableResources.map(res => (
                                <div key={res.id} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                                    <span className="font-bold">{res.id}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        res.status === 'Disponible' 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                        {res.status === 'Disponible' ? 'Dispo' : 'Occupé'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RegulationDashboard;
