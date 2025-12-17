
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/Card';
import { useData } from '../providers/DataProvider';
import { Patient, TriageStatus } from '../types';
import { 
    Tent, AlertOctagon, Plus, Activity, User, ArrowRight, 
    Clock, Search, Stethoscope, Skull, AlertTriangle, CheckCircle,
    ClipboardCheck, Box, Trophy, PersonStanding, Flag, Undo2,
    CheckSquare, Square, Ticket, Ambulance, FileText, Download, Loader2, X,
    Save, Thermometer, HeartPulse, Wind, Droplet, ChevronRight, MapPin
} from 'lucide-react';
import { useNotification } from '../providers/NotificationProvider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- COMPOSANT FORMULAIRE DE SAISIE DPS (STRUCTURÉ) ---
const DPSInputModal: React.FC<{
    patient?: Patient;
    onSave: (data: Patient) => void;
    onClose: () => void;
}> = ({ patient, onSave, onClose }) => {
    const [activeStep, setActiveStep] = useState<'identite' | 'contexte' | 'bilan' | 'soins' | 'orientation'>('identite');
    
    // Parsing des données existantes
    const parseMeta = (text: string, key: string) => {
        if (!text) return '';
        const match = text.match(new RegExp(`${key}:\\s*([^|]+)`));
        return match ? match[1].trim() : '';
    };

    const initialMeca = parseMeta(patient?.circonstances || '', 'Meca');
    const initialTeam = parseMeta(patient?.circonstances || '', 'Team');
    const initialDesc = patient?.circonstances?.split('|').pop()?.trim() || '';

    // Parsing des soins depuis les observations (format [Soins: ...])
    const parseSoins = (text: string) => {
        if(!text) return [];
        const match = text.match(/\[Soins:\s*([^\]]+)\]/);
        return match ? match[1].split(', ') : [];
    };

    const [formData, setFormData] = useState({
        // Identité
        dossard: patient?.sinusId || '',
        nom: patient?.nom === 'Inconnu' || patient?.nom === 'Participant' ? '' : patient?.nom || '',
        prenom: patient?.prenom?.startsWith('#') ? '' : patient?.prenom || '',
        sexe: patient?.sexe || 'Homme',
        age: patient?.age || '',
        equipe: initialTeam,
        
        // Mécanisme
        mecanisme: initialMeca ? initialMeca.split(', ') : [] as string[],
        descriptionAccident: initialDesc,
        
        // État Initial
        conscience: patient?.bilanPrimaireD?.includes('Inconscient') ? 'Inconsciente' : 'Consciente',
        glasgow: patient?.scoreGlasgow || '15',
        respiration: patient?.bilanPrimaireB || 'Normale',
        pouls: patient?.bilanPrimaireC || 'Normal',
        douleur: patient?.echelleDouleur || '0',
        
        // Vitaux
        taSystolique: patient?.taSystolique || '',
        taDiastolique: patient?.taDiastolique || '',
        fc: patient?.frequenceCardiaque || '',
        fr: patient?.frequenceRespiratoire || '',
        spO2: patient?.spO2 || '',
        temp: patient?.temperature || '',
        glycemie: patient?.glycemie || '',
        
        // Soins & Bilan
        soins: parseSoins(patient?.observations || ''),
        lesions: patient?.examenPhysique || '', 
        observations: patient?.observations?.replace(/\[Soins:[^\]]+\]\s*/, '').replace(/\[Décision:[^\]]+\](?:\s*via\s*[^\n]*)?\s*/, '') || '',
        
        // Orientation
        orientation: '',
        destination: ''
    });

    const steps = [
        { id: 'identite', label: '1. Identité', icon: User },
        { id: 'contexte', label: '2. Contexte', icon: AlertTriangle },
        { id: 'bilan', label: '3. Bilan Vital', icon: HeartPulse },
        { id: 'soins', label: '4. Soins', icon: Stethoscope },
        { id: 'orientation', label: '5. Décision', icon: Flag },
    ];

    const mecanismesOptions = ["Chute", "Collision", "Coup direct", "Malaise", "Surmenage / Déshydratation", "Autre"];
    const soinsOptions = ["Mise au repos", "Immobilisation", "Pansement / Compression", "Glace", "Oxygénothérapie", "RCP", "Défibrillation", "Médication"];
    const orientationOptions = ["Reprise de l’activité", "Surveillance sur site", "Évacuation médicale"];
    const evacOptions = ["Ambulance", "Véhicule médicalisé", "Hélicoptère"];

    const toggleList = (listKey: 'mecanisme' | 'soins', item: string) => {
        setFormData(prev => ({
            ...prev,
            [listKey]: prev[listKey].includes(item) ? prev[listKey].filter(i => i !== item) : [...prev[listKey], item]
        }));
    };

    const handleSubmit = () => {
        // Reconstruction des données
        const circonstances = `Team: ${formData.equipe} | Meca: ${formData.mecanisme.join(', ')} | ${formData.descriptionAccident}`;
        
        let obs = formData.observations;
        if (formData.soins.length > 0) obs = `[Soins: ${formData.soins.join(', ')}]\n` + obs;
        if (formData.orientation) obs += `\n[Décision: ${formData.orientation}]`;
        if (formData.orientation === 'Évacuation médicale' && formData.destination) obs += ` via ${formData.destination}`;

        const newPatient: any = {
            id: patient?.id || Date.now().toString(),
            dateCreation: patient?.dateCreation || new Date().toISOString(),
            nom: formData.nom || 'Participant',
            prenom: formData.prenom || (formData.dossard ? '' : 'Inconnu'),
            sinusId: formData.dossard,
            sexe: formData.sexe as any,
            age: formData.age,
            circonstances: circonstances,
            
            scoreGlasgow: formData.glasgow,
            bilanPrimaireD: formData.conscience,
            bilanPrimaireB: formData.respiration,
            bilanPrimaireC: formData.pouls,
            echelleDouleur: formData.douleur,

            taSystolique: formData.taSystolique,
            taDiastolique: formData.taDiastolique,
            frequenceCardiaque: formData.fc,
            frequenceRespiratoire: formData.fr,
            spO2: formData.spO2,
            temperature: formData.temp,
            glycemie: formData.glycemie,

            examenPhysique: formData.lesions,
            observations: obs,
            motifAppel: formData.mecanisme.length > 0 ? formData.mecanisme[0] : 'Prise en charge DPS',
            
            triageStatus: 'UIMP',
            adresse: 'DPS',
            telephone: '',
            injuries: patient?.injuries || [],
            documents: patient?.documents || []
        };

        onSave(newPatient);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
            <Card className="w-full max-w-5xl h-[90vh] flex flex-col !p-0 overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-2xl">
                
                {/* HEADER & TABS */}
                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <FileText className="text-primary"/> Fiche de Prise en Charge
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar px-4">
                        {steps.map((step) => {
                            const isActive = activeStep === step.id;
                            const isDone = steps.findIndex(s => s.id === activeStep) > steps.findIndex(s => s.id === step.id);
                            return (
                                <button 
                                    key={step.id} 
                                    onClick={() => setActiveStep(step.id as any)}
                                    className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap
                                        ${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                                    `}
                                >
                                    <div className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-primary text-white' : isDone ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        {isDone ? <CheckSquare size={12}/> : <step.icon size={12}/>}
                                    </div>
                                    {step.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        
                        {/* 1. IDENTITÉ */}
                        {activeStep === 'identite' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card title="Identification">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="label-form">Numéro de Dossard</label>
                                            <div className="relative">
                                                <Ticket className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                                <input type="text" value={formData.dossard} onChange={e => setFormData({...formData, dossard: e.target.value})} className="input pl-10 text-xl font-mono font-bold uppercase" placeholder="ex: 1042"/>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-form">Équipe / Club</label>
                                            <input type="text" value={formData.equipe} onChange={e => setFormData({...formData, equipe: e.target.value})} className="input" placeholder="Club..."/>
                                        </div>
                                    </div>
                                </Card>
                                <Card title="État Civil">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-form">Prénom</label>
                                                <input type="text" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="input"/>
                                            </div>
                                            <div>
                                                <label className="label-form">Nom</label>
                                                <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="input"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-form">Sexe</label>
                                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                                    {['Homme', 'Femme'].map(s => (
                                                        <button key={s} onClick={() => setFormData({...formData, sexe: s as any})} className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-all ${formData.sexe === s ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-500'}`}>{s}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-form">Âge</label>
                                                <input type="text" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="input" placeholder="Ans"/>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* 2. CONTEXTE */}
                        {activeStep === 'contexte' && (
                            <Card className="space-y-6">
                                <div>
                                    <label className="label-form mb-3 block">Type d'incident</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {mecanismesOptions.map(m => (
                                            <button 
                                                key={m} 
                                                onClick={() => toggleList('mecanisme', m)}
                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                    formData.mecanisme.includes(m) 
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="flex items-center">
                                                    {formData.mecanisme.includes(m) ? <CheckSquare className="mr-2 text-blue-500" size={18}/> : <Square className="mr-2 text-gray-300" size={18}/>}
                                                    <span className="font-semibold">{m}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="label-form">Description des circonstances</label>
                                    <textarea 
                                        value={formData.descriptionAccident} 
                                        onChange={e => setFormData({...formData, descriptionAccident: e.target.value})} 
                                        className="input w-full" 
                                        rows={4} 
                                        placeholder="Décrire ce qu'il s'est passé (cinétique, environnement...)"
                                    />
                                </div>
                            </Card>
                        )}

                        {/* 3. BILAN */}
                        {activeStep === 'bilan' && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><Activity className="mr-2 text-primary"/> Bilan Neurologique & Respiratoire</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <label className="font-bold text-sm">Conscience</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setFormData({...formData, conscience: 'Consciente'})} className={`px-3 py-1.5 rounded text-sm font-bold border ${formData.conscience === 'Consciente' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-200 text-gray-500'}`}>Conscient</button>
                                                    <button onClick={() => setFormData({...formData, conscience: 'Inconsciente'})} className={`px-3 py-1.5 rounded text-sm font-bold border ${formData.conscience === 'Inconsciente' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white border-gray-200 text-gray-500'}`}>Inconscient</button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="label-form">Glasgow</label>
                                                    <input type="number" max="15" value={formData.glasgow} onChange={e => setFormData({...formData, glasgow: e.target.value})} className="input text-center font-mono font-bold"/>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="label-form">Douleur (EVA)</label>
                                                    <input type="number" max="10" value={formData.douleur} onChange={e => setFormData({...formData, douleur: e.target.value})} className="input text-center font-mono font-bold"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="label-form">Respiration</label>
                                                <select value={formData.respiration} onChange={e => setFormData({...formData, respiration: e.target.value})} className="input w-full">
                                                    <option>Normale</option><option>Difficile (Dyspnée)</option><option>Rapide (Polypnée)</option><option>Absente</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label-form">Pouls</label>
                                                <select value={formData.pouls} onChange={e => setFormData({...formData, pouls: e.target.value})} className="input w-full">
                                                    <option>Normal</option><option>Rapide (Tachy)</option><option>Lent (Brady)</option><option>Filant</option><option>Absent</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><HeartPulse className="mr-2 text-red-500"/> Constantes Vitales</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-2 bg-blue-50 dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tension</label>
                                            <div className="flex items-center justify-center gap-1">
                                                <input type="text" placeholder="120" value={formData.taSystolique} onChange={e => setFormData({...formData, taSystolique: e.target.value})} className="w-8 text-center bg-transparent font-mono font-bold border-b border-gray-300 focus:border-blue-500 outline-none"/>
                                                <span>/</span>
                                                <input type="text" placeholder="80" value={formData.taDiastolique} onChange={e => setFormData({...formData, taDiastolique: e.target.value})} className="w-8 text-center bg-transparent font-mono font-bold border-b border-gray-300 focus:border-blue-500 outline-none"/>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-red-50 dark:bg-gray-800 rounded border border-red-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Fréq. Card.</label>
                                            <input type="number" placeholder="--" value={formData.fc} onChange={e => setFormData({...formData, fc: e.target.value})} className="w-full text-center bg-transparent font-mono font-bold text-lg outline-none"/>
                                        </div>
                                        <div className="p-2 bg-cyan-50 dark:bg-gray-800 rounded border border-cyan-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">SpO2 %</label>
                                            <input type="number" placeholder="--" value={formData.spO2} onChange={e => setFormData({...formData, spO2: e.target.value})} className="w-full text-center bg-transparent font-mono font-bold text-lg outline-none"/>
                                        </div>
                                        <div className="p-2 bg-orange-50 dark:bg-gray-800 rounded border border-orange-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Temp °C</label>
                                            <input type="number" placeholder="--" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} className="w-full text-center bg-transparent font-mono font-bold text-lg outline-none"/>
                                        </div>
                                        <div className="p-2 bg-purple-50 dark:bg-gray-800 rounded border border-purple-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Glycémie</label>
                                            <input type="number" placeholder="--" value={formData.glycemie} onChange={e => setFormData({...formData, glycemie: e.target.value})} className="w-full text-center bg-transparent font-mono font-bold text-lg outline-none"/>
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card title="Bilan Lésionnel">
                                    <textarea 
                                        className="input w-full" 
                                        rows={3} 
                                        placeholder="Décrire les lésions (ex: Plaie genou droit, déformation poignet gauche...)"
                                        value={formData.lesions}
                                        onChange={e => setFormData({...formData, lesions: e.target.value})}
                                    />
                                </Card>
                            </div>
                        )}

                        {/* 4. SOINS */}
                        {activeStep === 'soins' && (
                            <Card className="space-y-6">
                                <div>
                                    <label className="label-form mb-3 block">Gestes effectués</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {soinsOptions.map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => toggleList('soins', s)}
                                                className={`p-2.5 rounded-lg border text-left text-sm transition-all flex items-center ${
                                                    formData.soins.includes(s) 
                                                        ? 'bg-green-50 border-green-500 text-green-800 ring-1 ring-green-500 font-semibold' 
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {formData.soins.includes(s) ? <CheckCircle className="mr-2 text-green-600 flex-shrink-0" size={16}/> : <div className="w-4 h-4 mr-2 border rounded-full border-gray-300 flex-shrink-0"/>}
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="label-form">Observations / Médication / Transmissions</label>
                                    <textarea 
                                        value={formData.observations} 
                                        onChange={e => setFormData({...formData, observations: e.target.value})} 
                                        className="input w-full" 
                                        rows={4} 
                                        placeholder="Détails des soins, médicaments administrés, évolution..."
                                    />
                                </div>
                            </Card>
                        )}

                        {/* 5. ORIENTATION */}
                        {activeStep === 'orientation' && (
                            <div className="space-y-6">
                                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                                    <h3 className="font-bold text-green-800 dark:text-green-400 mb-4 flex items-center"><Flag className="mr-2"/> Décision de sortie</h3>
                                    <div className="space-y-3">
                                        {orientationOptions.map(opt => (
                                            <label key={opt} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.orientation === opt ? 'bg-white shadow-md border-green-500' : 'bg-white/50 border-transparent hover:bg-white'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="orientation" 
                                                    value={opt} 
                                                    checked={formData.orientation === opt} 
                                                    onChange={e => setFormData({...formData, orientation: e.target.value})}
                                                    className="w-5 h-5 text-green-600 focus:ring-green-500"
                                                />
                                                <span className="ml-3 font-semibold text-gray-800">{opt}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {formData.orientation === 'Évacuation médicale' && (
                                        <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2">
                                            <label className="label-form mb-2 block">Moyen d'évacuation</label>
                                            <div className="flex gap-3 mb-3">
                                                {evacOptions.map(ev => (
                                                    <button 
                                                        key={ev}
                                                        onClick={() => setFormData({...formData, destination: ev})}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${formData.destination === ev ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                                                    >
                                                        {ev}
                                                    </button>
                                                ))}
                                            </div>
                                            <input 
                                                type="text" 
                                                value={formData.destination} 
                                                onChange={e => setFormData({...formData, destination: e.target.value})}
                                                className="input w-full" 
                                                placeholder="Préciser destination (ex: CHU, Centre Médical...)"
                                            />
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-between items-center">
                    <button 
                        onClick={() => {
                            const prevIndex = steps.findIndex(s => s.id === activeStep) - 1;
                            if (prevIndex >= 0) setActiveStep(steps[prevIndex].id as any);
                        }}
                        disabled={activeStep === 'identite'}
                        className="btn-secondary px-4 disabled:opacity-50"
                    >
                        Précédent
                    </button>

                    {activeStep === 'orientation' ? (
                        <button onClick={handleSubmit} className="btn-primary px-8 py-3 flex items-center shadow-lg text-lg font-bold">
                            <Save size={20} className="mr-2"/> Enregistrer Fiche
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                const nextIndex = steps.findIndex(s => s.id === activeStep) + 1;
                                if (nextIndex < steps.length) setActiveStep(steps[nextIndex].id as any);
                            }}
                            className="btn-primary px-6 flex items-center"
                        >
                            Suivant <ChevronRight size={18} className="ml-1"/>
                        </button>
                    )}
                </div>
                
                <style>{`.label-form { @apply block text-xs font-bold uppercase text-gray-500 mb-1.5 tracking-wider; }`}</style>
            </Card>
        </div>
    );
};

// --- COMPOSANT FICHE BILAN DPS (PDF) ---
const DPSReportModal: React.FC<{ 
    patient: Patient; 
    onClose: () => void; 
}> = ({ patient, onClose }) => {
    const { headerInfo } = useData();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        const input = document.getElementById('dps-report-content');
        if (input) {
            try {
                const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Fiche_DPS_${patient.sinusId || 'Inconnu'}.pdf`);
            } catch (error) {
                console.error("Erreur PDF", error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <Card className="w-full max-w-4xl h-[90vh] flex flex-col !p-0 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="text-primary"/> Fiche de Prise en Charge (DPS)
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handleDownload} disabled={isGenerating} className="btn-primary flex items-center text-sm">
                            {isGenerating ? <Loader2 className="animate-spin mr-2" size={16}/> : <Download size={16} className="mr-2"/>}
                            Télécharger PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8 flex justify-center">
                    {/* FEUILLE A4 VISUELLE */}
                    <div id="dps-report-content" className="bg-white text-black w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl text-sm relative flex flex-col">
                        
                        {/* EN-TÊTE */}
                        <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
                            <div className="flex items-center gap-4">
                                {headerInfo?.logo && <img src={headerInfo.logo} alt="Logo" className="h-16 w-auto object-contain"/>}
                                <div>
                                    <h1 className="text-xl font-black uppercase text-blue-800">{headerInfo?.companyName || 'SERVICE DE SECOURS'}</h1>
                                    <p className="text-xs text-gray-500">Dispositif Prévisionnel de Secours</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-800">FICHE VICTIME</div>
                                <div className="text-sm font-mono mt-1 bg-gray-100 px-2 py-1 rounded inline-block">N°: {patient.sinusId || patient.id.slice(0,8).toUpperCase()}</div>
                                <div className="text-xs text-gray-500 mt-1">{new Date(patient.dateCreation).toLocaleDateString()} à {new Date(patient.pmaAdmissionDate || patient.dateCreation).toLocaleTimeString()}</div>
                            </div>
                        </div>

                        {/* INFO VICTIME & CONTEXTE */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="border border-gray-300 rounded p-3">
                                <div className="font-bold bg-gray-100 px-2 py-1 -mx-3 -mt-3 mb-2 border-b border-gray-300 text-xs uppercase flex justify-between">
                                    <span>Identité / Dossard</span>
                                    <User size={12}/>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    <div className="col-span-2"><span className="text-gray-500 text-xs block">Nom Prénom:</span> <strong className="text-lg">{patient.nom} {patient.prenom}</strong></div>
                                    <div><span className="text-gray-500 text-xs block">Sexe / Âge:</span> {patient.sexe} / <strong>{patient.age || '?'} ans</strong></div>
                                    <div><span className="text-gray-500 text-xs block">Club / Équipe:</span> {patient.circonstances?.match(/Team:\s*([^|]+)/)?.[1] || '-'}</div>
                                </div>
                            </div>
                            <div className="border border-gray-300 rounded p-3">
                                <div className="font-bold bg-gray-100 px-2 py-1 -mx-3 -mt-3 mb-2 border-b border-gray-300 text-xs uppercase flex justify-between">
                                    <span>Circonstances</span>
                                    <AlertTriangle size={12}/>
                                </div>
                                <div className="space-y-2">
                                    <div><span className="text-gray-500 text-xs block">Motif Principal:</span> <strong>{patient.motifAppel}</strong></div>
                                    <div><span className="text-gray-500 text-xs block">Mécanisme:</span> {patient.circonstances?.match(/Meca:\s*([^|]+)/)?.[1] || '-'}</div>
                                    <div><span className="text-gray-500 text-xs block">Description:</span> <span className="italic">{patient.circonstances?.split('|').pop()?.trim() || '-'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* BILAN CLINIQUE RAPIDE */}
                        <div className="border border-gray-300 rounded mb-6">
                            <div className="font-bold bg-blue-50 px-3 py-1 border-b border-gray-300 text-blue-800 uppercase text-xs flex items-center">
                                <HeartPulse size={12} className="mr-2"/> Bilan Secouriste
                            </div>
                            <div className="grid grid-cols-5 divide-x divide-gray-300">
                                <div className="p-3 text-center">
                                    <span className="block text-gray-500 text-[10px] uppercase">Conscience</span>
                                    <span className="font-bold text-lg">{patient.scoreGlasgow ? `GCS ${patient.scoreGlasgow}` : 'Non évalué'}</span>
                                    <div className="text-xs text-gray-400">{patient.bilanPrimaireD || ''}</div>
                                </div>
                                <div className="p-3 text-center bg-red-50/30">
                                    <span className="block text-gray-500 text-[10px] uppercase">Pouls (FC)</span>
                                    <span className="font-bold text-lg">{patient.frequenceCardiaque || '--'}</span> <small>bpm</small>
                                </div>
                                <div className="p-3 text-center">
                                    <span className="block text-gray-500 text-[10px] uppercase">Tension (TA)</span>
                                    <span className="font-bold text-lg">{patient.taSystolique ? `${patient.taSystolique}/${patient.taDiastolique}` : '--'}</span>
                                </div>
                                <div className="p-3 text-center bg-blue-50/30">
                                    <span className="block text-gray-500 text-[10px] uppercase">SpO2</span>
                                    <span className="font-bold text-lg">{patient.spO2 || '--'}</span> <small>%</small>
                                </div>
                                <div className="p-3 text-center">
                                    <span className="block text-gray-500 text-[10px] uppercase">Douleur</span>
                                    <span className="font-bold text-lg">{patient.echelleDouleur || '0'}</span> <small>/10</small>
                                </div>
                            </div>
                            <div className="border-t border-gray-300 p-3 bg-gray-50 flex gap-4">
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Bilan Lésionnel:</span>
                                    <p className="text-sm text-gray-800">{patient.examenPhysique || "Aucune lésion apparente."}</p>
                                </div>
                            </div>
                        </div>

                        {/* OBSERVATIONS & SOINS */}
                        <div className="border border-gray-300 rounded mb-6 flex-1">
                            <div className="font-bold bg-gray-100 px-3 py-1 border-b border-gray-300 text-xs uppercase flex items-center">
                                <Stethoscope size={12} className="mr-2"/> Soins & Observations
                            </div>
                            <div className="p-3">
                                <p className="whitespace-pre-wrap leading-relaxed text-sm font-mono">{patient.observations || "Soins courants / Repos."}</p>
                            </div>
                        </div>

                        {/* PIED DE PAGE: DEVENIR & SIGNATURE */}
                        <div className="border-t-2 border-gray-800 pt-4 mt-auto">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-xs font-bold uppercase mb-3 flex items-center"><Flag size={12} className="mr-1"/> Orientation :</div>
                                    <div className="flex flex-col gap-2 text-sm border p-3 rounded bg-gray-50">
                                        <div className={`flex items-center ${patient.observations?.includes('Retour Course') ? 'font-bold text-green-700' : ''}`}>
                                            <div className={`w-4 h-4 border border-black mr-2 flex items-center justify-center ${patient.observations?.includes('Retour Course') ? 'bg-black text-white' : ''}`}>{patient.observations?.includes('Retour Course') ? 'X' : ''}</div> Reprise de l'activité
                                        </div>
                                        <div className={`flex items-center ${patient.observations?.includes('Évacuation') ? 'font-bold text-red-700' : ''}`}>
                                            <div className={`w-4 h-4 border border-black mr-2 flex items-center justify-center ${patient.observations?.includes('Évacuation') ? 'bg-black text-white' : ''}`}>{patient.observations?.includes('Évacuation') ? 'X' : ''}</div> Évacuation Médicale
                                        </div>
                                        <div className={`flex items-center ${!patient.observations?.includes('Retour') && !patient.observations?.includes('Évacuation') ? 'font-bold' : ''}`}>
                                            <div className={`w-4 h-4 border border-black mr-2 flex items-center justify-center ${!patient.observations?.includes('Retour') && !patient.observations?.includes('Évacuation') ? 'bg-black text-white' : ''}`}>{!patient.observations?.includes('Retour') && !patient.observations?.includes('Évacuation') ? 'X' : ''}</div> Surveillance / Laissé sur place
                                        </div>
                                    </div>
                                </div>
                                <div className="border border-gray-400 h-28 p-2 relative rounded">
                                    <span className="text-xs text-gray-500 absolute top-1 left-2 uppercase font-bold">Visa du Chef de Poste / Médecin</span>
                                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">Cachet & Signature</div>
                                </div>
                            </div>
                            <div className="text-center text-[10px] text-gray-400 mt-4 border-t pt-2">
                                Document généré informatiquement via MedEvac - Ne pas jeter sur la voie publique.
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const TriageCard: React.FC<{ 
    label: string; 
    count: number; 
    color: string; 
    textColor: string; 
    icon: React.ElementType 
}> = ({ label, count, color, textColor, icon: Icon }) => (
    <div className={`p-4 rounded-xl border ${color} shadow-sm flex items-center justify-between`}>
        <div>
            <p className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>{label}</p>
            <p className={`text-3xl font-black mt-1 ${textColor}`}>{count}</p>
        </div>
        <div className={`p-3 rounded-full bg-white/20 ${textColor}`}>
            <Icon size={28} />
        </div>
    </div>
);

const PMA: React.FC = () => {
    const { patients = [], addPatient, updatePatient, pmaChecklistItems } = useData();
    const { addNotification } = useNotification();
    
    // Navigation Onglets
    const [activeTab, setActiveTab] = useState<'victims' | 'verification'>('victims');

    // États pour le formulaire d'ajout rapide (Victime)
    const [isAdding, setIsAdding] = useState(false);
    const [isDPSFormOpen, setIsDPSFormOpen] = useState(false); // État pour le formulaire complet
    const [newVictim, setNewVictim] = useState<{
        sinusId: string; // Utilisé pour Dossard
        triageStatus: TriageStatus;
        genre: 'Homme' | 'Femme' | 'Autre';
        ageApprox: string;
        motif: string;
        secteur?: string;
    }>({
        sinusId: '',
        triageStatus: 'UIMP', // Défaut à Vert/Soins légers
        genre: 'Homme',
        ageApprox: '',
        motif: '',
        secteur: ''
    });

    // État pour la génération de rapport
    const [viewingReportPatient, setViewingReportPatient] = useState<Patient | null>(null);
    const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);

    // État local pour la checklist
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrer les patients qui sont dans le circuit PMA
    const pmaPatients = useMemo(() => {
        return patients
            .filter(p => p.triageStatus || p.sinusId || p.pmaAdmissionDate)
            .sort((a, b) => {
                const priorities = { 'UA': 0, 'UR': 1, 'UIMP': 2, 'DCD': 3, null: 4 };
                const pA = priorities[a.triageStatus || 'null'] || 4;
                const pB = priorities[b.triageStatus || 'null'] || 4;
                if (pA !== pB) return pA - pB;
                return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
            });
    }, [patients]);

    const filteredPatients = useMemo(() => {
        return pmaPatients.filter(p => 
            (p.nom && p.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.sinusId && p.sinusId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.motifAppel && p.motifAppel.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [pmaPatients, searchTerm]);

    // Statistiques DPS Sportif
    const stats = useMemo(() => {
        return {
            card1: { label: 'Soins Médicaux', count: pmaPatients.filter(p => p.triageStatus === 'UA' || p.triageStatus === 'UR').length, color: 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800', textColor: 'text-red-700 dark:text-red-400', icon: Stethoscope },
            card2: { label: 'Bobologie', count: pmaPatients.filter(p => p.triageStatus === 'UIMP').length, color: 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800', textColor: 'text-green-700 dark:text-green-400', icon: PersonStanding },
            card3: { label: 'Évacuations', count: pmaPatients.filter(p => p.observations?.includes('Évacuation')).length, color: 'bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800', textColor: 'text-orange-700 dark:text-orange-400', icon: Ambulance },
            card4: { label: 'Total Prise en charge', count: pmaPatients.length, color: 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-400', icon: Activity },
        };
    }, [pmaPatients]);

    // Actions
    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Générer un ID fictif si ID non fourni
        const idBase = 'DOSS-';
        const victimId = newVictim.sinusId || `${idBase}${Math.floor(Math.random()*10000)}`;
        
        const patient: Omit<Patient, 'id' | 'dateCreation'> = {
            nom: 'Participant',
            prenom: `#${victimId}`,
            sinusId: newVictim.sinusId,
            triageStatus: newVictim.triageStatus,
            sexe: newVictim.genre,
            age: newVictim.ageApprox,
            dateNaissance: '',
            adresse: 'PMA',
            telephone: '',
            motifAppel: newVictim.motif || 'Soins course',
            circonstances: newVictim.secteur ? `Secteur: ${newVictim.secteur}` : 'DPS Sportif',
            pmaAdmissionDate: new Date().toISOString(),
            // Default empty fields
            taSystolique: '', taDiastolique: '', frequenceCardiaque: '', frequenceRespiratoire: '',
            spO2: '', temperature: '', glycemie: '', echelleDouleur: '', scoreGlasgow: '',
            bilanPrimaireA: '', bilanPrimaireB: '', bilanPrimaireC: '', bilanPrimaireD: '', bilanPrimaireE: '',
            plaintePrincipale: '', descriptionPQRST: '', examenPhysique: '', injuries: [],
            sampleSignes: '', allergies: '', sampleMedicaments: '', antecedents: '', sampleDernierRepas: '', sampleEvenements: '',
            observations: '', contactUrgenceNom: '', contactUrgenceTelephone: '', documents: []
        };

        try {
            await addPatient(patient);
            addNotification(`Patient ${victimId} admis`, 'success');
            setIsAdding(false);
            setNewVictim({ sinusId: '', triageStatus: 'UIMP', genre: 'Homme', ageApprox: '', motif: '', secteur: '' });
        } catch (error) {
            addNotification("Erreur lors de l'ajout.", 'error');
        }
    };

    const handleSaveDPSForm = async (data: Patient) => {
        try {
            if (patients.some(p => p.id === data.id)) {
                await updatePatient(data);
                addNotification("Fiche DPS mise à jour.", 'success');
            } else {
                await addPatient(data);
                addNotification("Fiche DPS créée.", 'success');
            }
            setIsDPSFormOpen(false);
            setEditingPatient(undefined);
        } catch (error) {
            addNotification("Erreur sauvegarde fiche.", 'error');
        }
    };

    const updateStatus = async (patient: Patient, status: TriageStatus) => {
        try {
            await updatePatient({ ...patient, triageStatus: status });
            addNotification("Statut mis à jour.", 'info');
        } catch (e) {
            addNotification("Erreur mise à jour.", 'error');
        }
    };

    const handleDischarge = async (patient: Patient, type: 'race' | 'evac') => {
        try {
            const obs = type === 'race' ? 'Retour Course' : 'Évacuation Hôpital';
            await updatePatient({ 
                ...patient, 
                observations: (patient.observations ? patient.observations + '\n' : '') + `[${new Date().toLocaleTimeString()}] ${obs}`
            });
            addNotification(`${obs} validé pour ${patient.prenom}`, 'success');
        } catch (e) {
            addNotification("Erreur.", 'error');
        }
    }

    const toggleChecklistItem = (item: string) => {
        setChecklistState(prev => ({
            ...prev,
            [item]: !prev[item]
        }));
    };

    const getStatusStyle = (status?: TriageStatus) => {
        switch (status) {
            case 'UA': return 'bg-red-500 text-white border-red-600';
            case 'UR': return 'bg-yellow-400 text-black border-yellow-500';
            case 'UIMP': return 'bg-green-500 text-white border-green-600';
            case 'DCD': return 'bg-gray-800 text-white border-gray-900';
            default: return 'bg-gray-200 text-gray-600';
        }
    };

    const checklistProgress = useMemo(() => {
        if (!pmaChecklistItems) return 0;
        const total = Object.values(pmaChecklistItems).flat().length;
        if (total === 0) return 0;
        const checked = Object.values(checklistState).filter(Boolean).length;
        return Math.round((checked / total) * 100);
    }, [checklistState, pmaChecklistItems]);

    return (
        <div className="space-y-6">
            {/* Modal Fiche Bilan PDF */}
            {viewingReportPatient && (
                <DPSReportModal 
                    patient={viewingReportPatient} 
                    onClose={() => setViewingReportPatient(null)} 
                />
            )}

            {/* Modal Formulaire DPS Complet */}
            {isDPSFormOpen && (
                <DPSInputModal 
                    patient={editingPatient}
                    onSave={handleSaveDPSForm}
                    onClose={() => { setIsDPSFormOpen(false); setEditingPatient(undefined); }}
                />
            )}

            {/* HEADER PMA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                        <Trophy className="mr-3 text-primary" size={32} />
                        Poste de Secours (DPS)
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center text-blue-600 font-semibold"><Flag size={14} className="mr-1"/> Mode Événement Sportif</span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center"><Clock size={14} className="mr-1"/> {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Boutons d'action */}
                    {activeTab === 'victims' && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsAdding(!isAdding)}
                                className={`btn-primary shadow-lg flex items-center px-4 py-2 ${isAdding ? 'bg-gray-500 border-gray-500 hover:bg-gray-600' : ''}`}
                            >
                                {isAdding ? <X size={20} className="mr-2"/> : <Plus size={20} className="mr-2"/>}
                                Ajout Rapide
                            </button>
                            <button 
                                onClick={() => { setEditingPatient(undefined); setIsDPSFormOpen(true); }}
                                className="btn-primary bg-indigo-600 hover:bg-indigo-700 border-indigo-600 shadow-lg flex items-center px-4 py-2"
                            >
                                <FileText size={20} className="mr-2"/> Fiche Complète
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6">
                <button
                    onClick={() => setActiveTab('victims')}
                    className={`pb-3 flex items-center text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'victims'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <User size={18} className="mr-2" />
                    Main Courante
                    <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {pmaPatients.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('verification')}
                    className={`pb-3 flex items-center text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'verification'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <ClipboardCheck size={18} className="mr-2" />
                    Matériel & Logistique
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${checklistProgress === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                        {checklistProgress}%
                    </span>
                </button>
            </div>

            {/* VUE 1: SUIVI VICTIMES */}
            {activeTab === 'victims' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* DASHBOARD TRIAGE */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TriageCard {...stats.card1} />
                        <TriageCard {...stats.card2} />
                        <TriageCard {...stats.card3} />
                        <TriageCard {...stats.card4} />
                    </div>

                    {/* ZONE D'AJOUT RAPIDE (Toggle) */}
                    {isAdding && (
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-4">
                            <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        Gravité
                                    </label>
                                    <select 
                                        value={newVictim.triageStatus || 'UIMP'} 
                                        onChange={e => setNewVictim({...newVictim, triageStatus: e.target.value as TriageStatus})}
                                        className="input w-full font-bold"
                                    >
                                        <option value="UA">🔴 UA (Grave)</option>
                                        <option value="UR">🟡 UR (Modéré)</option>
                                        <option value="UIMP">🟢 Soins Légers</option>
                                        <option value="DCD">⚫ DCD</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        N° Dossard
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={newVictim.sinusId} 
                                            onChange={e => setNewVictim({...newVictim, sinusId: e.target.value})}
                                            placeholder="ex: 1042"
                                            className="input w-full font-mono pl-8"
                                        />
                                        <Ticket size={14} className="absolute left-2.5 top-3 text-gray-400"/>
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Secteur / KM</label>
                                    <input 
                                        type="text" 
                                        value={newVictim.secteur} 
                                        onChange={e => setNewVictim({...newVictim, secteur: e.target.value})}
                                        placeholder="ex: Arrivée, KM 10"
                                        className="input w-full"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Genre</label>
                                    <select 
                                        value={newVictim.genre} 
                                        onChange={e => setNewVictim({...newVictim, genre: e.target.value as any})}
                                        className="input w-full"
                                    >
                                        <option>Homme</option>
                                        <option>Femme</option>
                                        <option>Autre</option>
                                    </select>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Motif / Lésion</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newVictim.motif} 
                                            onChange={e => setNewVictim({...newVictim, motif: e.target.value})}
                                            placeholder="ex: Crampes, Malaise..."
                                            className="input w-full"
                                            list="motifs-list"
                                        />
                                        <datalist id="motifs-list">
                                            <option value="Crampes" />
                                            <option value="Déshydratation" />
                                            <option value="Hypoglycémie" />
                                            <option value="Malaise vagal" />
                                            <option value="Entorse Cheville" />
                                            <option value="Ampoules" />
                                            <option value="Trauma Chute" />
                                        </datalist>
                                        <button type="submit" className="btn-primary px-6 flex-shrink-0">Ajouter</button>
                                    </div>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* LISTE DES VICTIMES */}
                    <Card className="!p-0 overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                            <h2 className="font-bold text-gray-700 dark:text-gray-200">
                                Participants pris en charge
                            </h2>
                            <div className="relative w-64">
                                <input 
                                    type="text" 
                                    placeholder="Rechercher dossard..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input w-full pl-9 py-1.5 text-sm"
                                />
                                <Search className="absolute left-3 top-2 text-gray-400" size={16}/>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-4 text-left">Gravité</th>
                                        <th className="p-4 text-left">Dossard / Nom</th>
                                        <th className="p-4 text-left">Motif</th>
                                        <th className="p-4 text-left">Secteur</th>
                                        <th className="p-4 text-left">Heure Adm.</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {filteredPatients.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => { setEditingPatient(p); setIsDPSFormOpen(true); }}>
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <span className={`px-3 py-1 rounded font-bold text-xs border ${getStatusStyle(p.triageStatus)}`}>
                                                    {p.triageStatus || 'Non trié'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                                    {p.sinusId && <span className="bg-gray-200 text-gray-700 px-1.5 rounded mr-2 text-xs font-mono">#{p.sinusId}</span>}
                                                    {p.prenom} {p.nom !== 'Inconnu' && p.nom !== 'Participant' ? p.nom : ''}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {p.sexe} {p.age ? `• ${p.age} ans` : ''}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                                                {p.motifAppel || '-'}
                                                {p.observations?.includes('Retour Course') && <span className="block text-[10px] text-green-600 font-bold mt-1">RETOUR COURSE</span>}
                                                {p.observations?.includes('Évacuation') && <span className="block text-[10px] text-orange-600 font-bold mt-1">ÉVACUÉ</span>}
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs">
                                                {p.circonstances?.replace('Secteur: ', '') || '-'}
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {p.pmaAdmissionDate ? new Date(p.pmaAdmissionDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => setViewingReportPatient(p)} 
                                                        className="btn-secondary px-3 py-1 text-xs flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700" 
                                                        title="Imprimer Fiche PDF"
                                                    >
                                                        <FileText size={14}/>
                                                    </button>
                                                    
                                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                                                        <button onClick={() => updateStatus(p, 'UA')} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-red-600" title="Passer en UA"><AlertOctagon size={16}/></button>
                                                        <button onClick={() => updateStatus(p, 'UR')} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-yellow-600" title="Passer en UR"><AlertTriangle size={16}/></button>
                                                        <button onClick={() => updateStatus(p, 'UIMP')} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-green-600" title="Passer en Soins Légers"><User size={16}/></button>
                                                    </div>
                                                    
                                                    <button onClick={() => handleDischarge(p, 'race')} className="btn-secondary px-3 py-1 text-xs flex items-center text-green-700 bg-green-50 hover:bg-green-100 border-green-200" title="Retour Course">
                                                        <Undo2 size={14} className="mr-1"/> Course
                                                    </button>
                                                    <button onClick={() => handleDischarge(p, 'evac')} className="btn-primary bg-indigo-600 hover:bg-indigo-700 border-indigo-600 px-3 py-1 text-xs flex items-center">
                                                        <Ambulance size={14}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredPatients.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Tent size={48} className="mx-auto mb-2 opacity-20"/>
                                    <p>Aucun patient dans le poste.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* VUE 2: VÉRIFICATION LOGISTIQUE */}
            {activeTab === 'verification' && (
                <div className="space-y-6 animate-in fade-in">
                    <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-none shadow-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle className="text-green-400"/> État opérationnel du PMA
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Assurez-vous que tous les postes logistiques et matériels sont opérationnels.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-green-400">{checklistProgress}%</div>
                                <div className="text-xs uppercase text-slate-500 font-bold">Opérationnel</div>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${checklistProgress}%` }}></div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pmaChecklistItems && Object.entries(pmaChecklistItems).map(([category, items]) => {
                            let Icon = ClipboardCheck;
                            if (category.includes("Infrastructure")) Icon = Tent;
                            if (category.includes("Soins")) Icon = Activity;
                            if (category.includes("Logistique")) Icon = Box;

                            return (
                                <Card key={category} className="border-t-4 border-primary">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center mb-4">
                                        <Icon size={20} className="mr-2 text-primary" /> {category}
                                    </h3>
                                    <div className="space-y-3">
                                        {Array.isArray(items) && items.map(item => {
                                            const isChecked = checklistState[item] || false;
                                            return (
                                                <div 
                                                    key={item} 
                                                    onClick={() => toggleChecklistItem(item)}
                                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                                        isChecked 
                                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <span className={`text-sm ${isChecked ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {item}
                                                    </span>
                                                    <div className={`p-1 rounded ${isChecked ? 'text-green-600' : 'text-gray-300'}`}>
                                                        {isChecked ? <CheckSquare size={20}/> : <Square size={20}/>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            );
                        })}
                        {(!pmaChecklistItems || Object.keys(pmaChecklistItems).length === 0) && (
                            <p className="text-gray-500 italic col-span-2 text-center py-4">
                                Aucune checklist configurée. Rendez-vous dans le menu Administration pour configurer.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PMA;
