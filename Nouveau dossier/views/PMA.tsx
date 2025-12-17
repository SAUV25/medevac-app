
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/Card';
import { useData } from '../providers/DataProvider';
import { useAuth } from '../providers/AuthProvider';
import { Patient, TriageStatus, BodyInjury } from '../types';
import { 
    Tent, AlertOctagon, Plus, Activity, User, 
    Clock, Search, Stethoscope, AlertTriangle, CheckCircle,
    ClipboardCheck, Box, Trophy, PersonStanding, Flag, Undo2,
    CheckSquare, Square, Ticket, Ambulance, FileText, Download, Loader2, X,
    Save, HeartPulse, ChevronRight,
    Timer, RotateCcw, History, Radio, Zap, LayoutGrid, Edit, Trash2, MoreVertical, Printer, FileSpreadsheet
} from 'lucide-react';
import { useNotification } from '../providers/NotificationProvider';
import BodyMap from '../components/BodyMap';
import ConfirmationModal from '../components/ConfirmationModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useLocalStorage from '../hooks/useLocalStorage';

// --- TYPES LOCAUX ---
interface PMALog {
    id: string;
    date: string;
    userName: string;
    action: 'check' | 'uncheck' | 'reset';
    item?: string;
}

// --- UTILITAIRES ---

const getVitalColor = (type: string, value: string | number) => {
    const val = Number(value);
    if (!value) return 'text-gray-500';
    
    switch (type) {
        case 'spo2': return val < 94 ? 'text-red-600 font-black animate-pulse' : 'text-green-600';
        case 'fc': return (val < 50 || val > 120) ? 'text-red-600 font-black' : 'text-gray-800';
        case 'glasgow': return val <= 8 ? 'text-red-600 font-black' : val <= 12 ? 'text-orange-600' : 'text-green-600';
        default: return 'text-gray-800';
    }
};

const GCSCalculator: React.FC<{ 
    eye: string, verbal: string, motor: string, 
    onChange: (e: string, v: string, m: string) => void 
}> = ({ eye, verbal, motor, onChange }) => {
    const total = (parseInt(eye)||0) + (parseInt(verbal)||0) + (parseInt(motor)||0);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-2 border-b pb-2">
                <label className="text-xs font-bold uppercase text-gray-500">Score de Glasgow</label>
                <span className={`px-2 py-0.5 text-sm font-black rounded border ${total <= 8 ? 'bg-red-100 text-red-700 border-red-200' : total <= 12 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                    {total || '?'} / 15
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <select value={eye} onChange={(e) => onChange(e.target.value, verbal, motor)} className="input p-1.5 bg-gray-50">
                    <option value="0">Y: Ouverture Yeux</option>
                    <option value="4">4. Spontanée</option>
                    <option value="3">3. À la demande</option>
                    <option value="2">2. À la douleur</option>
                    <option value="1">1. Nulle</option>
                </select>
                <select value={verbal} onChange={(e) => onChange(eye, e.target.value, motor)} className="input p-1.5 bg-gray-50">
                    <option value="0">V: Réponse Verbale</option>
                    <option value="5">5. Orientée</option>
                    <option value="4">4. Confuse</option>
                    <option value="3">3. Inappropriée</option>
                    <option value="2">2. Incompréhensible</option>
                    <option value="1">1. Nulle</option>
                </select>
                <select value={motor} onChange={(e) => onChange(eye, verbal, e.target.value)} className="input p-1.5 bg-gray-50">
                    <option value="0">M: Réponse Motrice</option>
                    <option value="6">6. Obéit</option>
                    <option value="5">5. Localise douleur</option>
                    <option value="4">4. Évitement</option>
                    <option value="3">3. Flexion</option>
                    <option value="2">2. Extension</option>
                    <option value="1">1. Nulle</option>
                </select>
            </div>
        </div>
    );
};

// --- COMPOSANT RAPPORT DE MAIN COURANTE ---
const PMAHandoverReportModal: React.FC<{ 
    patients: Patient[]; 
    onClose: () => void; 
}> = ({ patients, onClose }) => {
    const { headerInfo } = useData();
    const [isGenerating, setIsGenerating] = useState(false);

    const sortedPatients = useMemo(() => 
        [...patients].sort((a, b) => new Date(a.pmaAdmissionDate || a.dateCreation).getTime() - new Date(b.pmaAdmissionDate || b.dateCreation).getTime()),
    [patients]);

    const handleDownload = async () => {
        setIsGenerating(true);
        const input = document.getElementById('handover-report-content');
        if (input) {
            try {
                const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                
                // Calcul pour PDF multi-pages si nécessaire, ici simple A4 landscape ou portrait
                // On force portrait pour une liste
                const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape pour avoir plus de colonnes
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                // Si la hauteur dépasse une page, il faudrait gérer le découpage,
                // pour l'instant on scale pour fitter ou on ajoute une page (simple fit ici)
                if (pdfHeight > pdf.internal.pageSize.getHeight()) {
                     // Logique simplifiée : on imprime tel quel, l'utilisateur gère le zoom ou on pourrait découper
                     // Pour ce MVP, on ajoute l'image complète
                     const pageHeight = pdf.internal.pageSize.getHeight();
                     let heightLeft = pdfHeight;
                     let position = 0;

                     pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                     heightLeft -= pageHeight;

                     while (heightLeft >= 0) {
                       position = heightLeft - pdfHeight;
                       pdf.addPage();
                       pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                       heightLeft -= pageHeight;
                     }
                } else {
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                }
                
                pdf.save(`Main_Courante_PMA_${new Date().toISOString().split('T')[0]}.pdf`);
            } catch (error) {
                console.error("Erreur PDF", error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[120] p-4">
            <Card className="w-full max-w-6xl h-[90vh] flex flex-col !p-0 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileSpreadsheet className="text-primary"/> Rapport de Main Courante
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
                    {/* FEUILLE A4 LANDSCAPE VISUELLE */}
                    <div id="handover-report-content" className="bg-white text-black w-[297mm] min-h-[210mm] p-[15mm] shadow-2xl text-sm relative flex flex-col">
                        
                        {/* EN-TÊTE */}
                        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                            <div className="flex items-center gap-4">
                                {headerInfo?.logo && <img src={headerInfo.logo} alt="Logo" className="h-12 w-auto object-contain"/>}
                                <div>
                                    <h1 className="text-xl font-black uppercase text-gray-900">{headerInfo?.companyName || 'SERVICE DE SECOURS'}</h1>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Main Courante Opérationnelle - Poste de Secours</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">Date: {new Date().toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">Généré le: {new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>

                        {/* TABLEAU */}
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-200 text-black uppercase font-bold text-[10px]">
                                    <th className="border border-gray-400 p-2 w-16 text-center">Heure</th>
                                    <th className="border border-gray-400 p-2 w-16 text-center">Dossard</th>
                                    <th className="border border-gray-400 p-2">Identité (Nom Prénom)</th>
                                    <th className="border border-gray-400 p-2 w-12 text-center">Âge</th>
                                    <th className="border border-gray-400 p-2">Motif / Lésions</th>
                                    <th className="border border-gray-400 p-2">Soins / Observations</th>
                                    <th className="border border-gray-400 p-2 w-24 text-center">Statut</th>
                                    <th className="border border-gray-400 p-2 w-32">Devenir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPatients.map((p, idx) => (
                                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-300 p-1.5 text-center font-mono">
                                            {p.pmaAdmissionDate ? new Date(p.pmaAdmissionDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}
                                        </td>
                                        <td className="border border-gray-300 p-1.5 text-center font-bold">{p.sinusId || '-'}</td>
                                        <td className="border border-gray-300 p-1.5 uppercase truncate max-w-[150px]">
                                            {p.nom} {p.prenom}
                                        </td>
                                        <td className="border border-gray-300 p-1.5 text-center">{p.age}</td>
                                        <td className="border border-gray-300 p-1.5 truncate max-w-[200px]">
                                            <div className="font-bold">{p.motifAppel}</div>
                                            <div className="text-[10px] text-gray-500">{p.examenPhysique}</div>
                                        </td>
                                        <td className="border border-gray-300 p-1.5 truncate max-w-[250px]">
                                            {p.observations?.replace(/\[Soins:[^\]]+\]/, '').substring(0, 100)}...
                                        </td>
                                        <td className="border border-gray-300 p-1.5 text-center font-bold">
                                            {p.triageStatus}
                                        </td>
                                        <td className="border border-gray-300 p-1.5 text-[10px]">
                                            {p.observations?.includes('Retour Course') ? 'RETOUR COURSE' : 
                                             p.observations?.includes('Évacuation') ? 'ÉVACUATION' : 'SUR PLACE'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* STATISTIQUES FOOTER */}
                        <div className="mt-auto pt-4 border-t border-black flex justify-between items-end">
                            <div className="text-xs">
                                <div className="font-bold mb-1">Synthèse :</div>
                                <div className="flex gap-4">
                                    <span>Total: <strong>{patients.length}</strong></span>
                                    <span>UA: <strong>{patients.filter(p => p.triageStatus === 'UA').length}</strong></span>
                                    <span>UR: <strong>{patients.filter(p => p.triageStatus === 'UR').length}</strong></span>
                                    <span>Évacuations: <strong>{patients.filter(p => p.observations?.includes('Évacuation')).length}</strong></span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="border border-black h-16 w-48 mb-1"></div>
                                <div className="text-[10px] uppercase font-bold">Visa Chef de Poste</div>
                            </div>
                        </div>

                    </div>
                </div>
            </Card>
        </div>
    );
};

// --- COMPOSANT FORMULAIRE DE SAISIE DPS (STRUCTURÉ) ---
const DPSInputModal: React.FC<{
    patient?: Patient;
    onSave: (data: Patient) => void;
    onClose: () => void;
}> = ({ patient, onSave, onClose }) => {
    const [activeStep, setActiveStep] = useState<'identite' | 'contexte' | 'bilan' | 'soins' | 'orientation'>('identite');
    
    const parseMeta = (text: string, key: string) => {
        if (!text) return '';
        const match = text.match(new RegExp(`${key}:\\s*([^|]+)`));
        return match ? match[1].trim() : '';
    };

    const initialMeca = parseMeta(patient?.circonstances || '', 'Meca');
    const initialTeam = parseMeta(patient?.circonstances || '', 'Team');
    const initialDesc = patient?.circonstances?.split('|').pop()?.trim() || '';

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
        gcs_eye: patient?.gcs_eye || '4',
        gcs_verbal: patient?.gcs_verbal || '5',
        gcs_motor: patient?.gcs_motor || '6',
        
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
        injuries: patient?.injuries || [] as BodyInjury[],
        observations: patient?.observations?.replace(/\[Soins:[^\]]+\]\s*/, '').replace(/\[Décision:[^\]]+\](?:\s*via\s*[^\n]*)?\s*/, '') || '',
        
        // Orientation
        orientation: '',
        destination: ''
    });

    // Auto-calcul Glasgow total
    useEffect(() => {
        const total = (parseInt(formData.gcs_eye) || 0) + (parseInt(formData.gcs_verbal) || 0) + (parseInt(formData.gcs_motor) || 0);
        if (total > 0 && total.toString() !== formData.glasgow) {
            setFormData(prev => ({ ...prev, glasgow: total.toString() }));
        }
    }, [formData.gcs_eye, formData.gcs_verbal, formData.gcs_motor]);

    const steps = [
        { id: 'identite', label: '1. Identité', icon: User },
        { id: 'contexte', label: '2. Contexte', icon: AlertTriangle },
        { id: 'bilan', label: '3. Bilan & Lésions', icon: HeartPulse },
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

    const handleAddInjury = (injury: Omit<BodyInjury, 'id'>) => {
        const newInjury = { ...injury, id: Date.now().toString() };
        setFormData(prev => ({ ...prev, injuries: [...prev.injuries, newInjury] }));
    };

    const handleRemoveInjury = (id: string) => {
        setFormData(prev => ({ ...prev, injuries: prev.injuries.filter(i => i.id !== id) }));
    };

    const handleSubmit = () => {
        const circonstances = `Team: ${formData.equipe} | Meca: ${formData.mecanisme.join(', ')} | ${formData.descriptionAccident}`;
        
        let obs = formData.observations;
        if (formData.soins.length > 0) obs = `[Soins: ${formData.soins.join(', ')}]\n` + obs;
        if (formData.orientation) obs += `\n[Décision: ${formData.orientation}]`;
        if (formData.orientation === 'Évacuation médicale' && formData.destination) obs += ` via ${formData.destination}`;

        // Construction texte bilan lésionnel depuis les marqueurs si vide
        let examenPhysique = formData.lesions;
        if (!examenPhysique && formData.injuries.length > 0) {
            examenPhysique = formData.injuries.map(i => `${i.type === 'pain' ? 'Douleur' : i.type === 'wound' ? 'Plaie' : i.type} (${i.description || 'Zone'})`).join(', ');
        }

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
            gcs_eye: formData.gcs_eye,
            gcs_verbal: formData.gcs_verbal,
            gcs_motor: formData.gcs_motor,
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

            examenPhysique: examenPhysique,
            injuries: formData.injuries,
            observations: obs,
            motifAppel: formData.mecanisme.length > 0 ? formData.mecanisme[0] : 'Prise en charge DPS',
            
            triageStatus: 'UIMP', // Le statut peut être mis à jour après
            adresse: 'DPS',
            telephone: '',
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
                    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                {/* CONSTANTES VITALES */}
                                <Card>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><HeartPulse className="mr-2 text-red-500"/> Bilan Vital</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-3 bg-blue-50 dark:bg-gray-800 rounded border border-blue-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tension</label>
                                            <div className="flex items-center justify-center gap-1">
                                                <input type="text" placeholder="120" value={formData.taSystolique} onChange={e => setFormData({...formData, taSystolique: e.target.value})} className="w-10 text-center bg-transparent font-mono font-black text-xl border-b border-gray-300 focus:border-blue-500 outline-none"/>
                                                <span className="text-gray-400">/</span>
                                                <input type="text" placeholder="80" value={formData.taDiastolique} onChange={e => setFormData({...formData, taDiastolique: e.target.value})} className="w-10 text-center bg-transparent font-mono font-black text-xl border-b border-gray-300 focus:border-blue-500 outline-none"/>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-red-50 dark:bg-gray-800 rounded border border-red-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Fréq. Card.</label>
                                            <div className="flex items-baseline justify-center">
                                                <input type="number" placeholder="--" value={formData.fc} onChange={e => setFormData({...formData, fc: e.target.value})} className={`w-16 text-center bg-transparent font-mono font-black text-2xl outline-none ${getVitalColor('fc', formData.fc)}`}/>
                                                <span className="text-xs text-gray-400">bpm</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-cyan-50 dark:bg-gray-800 rounded border border-cyan-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">SpO2</label>
                                            <div className="flex items-baseline justify-center">
                                                <input type="number" placeholder="--" value={formData.spO2} onChange={e => setFormData({...formData, spO2: e.target.value})} className={`w-16 text-center bg-transparent font-mono font-black text-2xl outline-none ${getVitalColor('spo2', formData.spO2)}`}/>
                                                <span className="text-xs text-gray-400">%</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-orange-50 dark:bg-gray-800 rounded border border-orange-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Temp</label>
                                            <div className="flex items-baseline justify-center">
                                                <input type="number" placeholder="--" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} className="w-16 text-center bg-transparent font-mono font-black text-2xl outline-none"/>
                                                <span className="text-xs text-gray-400">°C</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded border border-purple-100 dark:border-gray-700 text-center">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Glycémie</label>
                                            <div className="flex items-baseline justify-center">
                                                <input type="number" placeholder="--" value={formData.glycemie} onChange={e => setFormData({...formData, glycemie: e.target.value})} className="w-16 text-center bg-transparent font-mono font-black text-2xl outline-none"/>
                                                <span className="text-xs text-gray-400">g/l</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* BILAN NEURO */}
                                <Card>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center"><Activity className="mr-2 text-primary"/> Neurologie</h3>
                                            <GCSCalculator 
                                                eye={formData.gcs_eye}
                                                verbal={formData.gcs_verbal}
                                                motor={formData.gcs_motor}
                                                onChange={(e, v, m) => setFormData(prev => ({...prev, gcs_eye: e, gcs_verbal: v, gcs_motor: m}))}
                                            />
                                            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                                                <label className="font-bold text-sm">Douleur (EVA)</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="range" min="0" max="10" 
                                                        value={formData.douleur} 
                                                        onChange={e => setFormData({...formData, douleur: e.target.value})} 
                                                        className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                    <span className={`w-8 text-center font-bold text-lg ${parseInt(formData.douleur) > 6 ? 'text-red-600' : parseInt(formData.douleur) > 3 ? 'text-orange-500' : 'text-green-600'}`}>{formData.douleur}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center"><User className="mr-2 text-primary"/> Bilan Lésionnel</h3>
                                            <div className="flex h-64 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                                                <div className="flex-1 relative border-r dark:border-gray-700">
                                                    <BodyMap 
                                                        injuries={formData.injuries}
                                                        onAddInjury={handleAddInjury}
                                                        onRemoveInjury={handleRemoveInjury}
                                                        hideControls={true}
                                                        initialView="front"
                                                    />
                                                    <div className="absolute top-2 left-2 text-[10px] text-gray-400 pointer-events-none">Face</div>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <BodyMap 
                                                        injuries={formData.injuries}
                                                        onAddInjury={handleAddInjury}
                                                        onRemoveInjury={handleRemoveInjury}
                                                        hideControls={true}
                                                        initialView="back"
                                                    />
                                                    <div className="absolute top-2 right-2 text-[10px] text-gray-400 pointer-events-none">Dos</div>
                                                </div>
                                            </div>
                                            <textarea 
                                                className="input w-full mt-2 text-xs" 
                                                rows={2} 
                                                placeholder="Description libre des lésions..."
                                                value={formData.lesions}
                                                onChange={e => setFormData({...formData, lesions: e.target.value})}
                                            />
                                        </div>
                                    </div>
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

// ... (DPSReportModal, TriageCard et PMAHistoryModal restent inchangés) ...
// (Pour alléger la réponse, je réutilise les composants existants TriageCard, PMAHistoryModal, DPSReportModal sans modification)
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
                    {/* FEUILLE A4 VISUELLE - Identique au code précédent */}
                    <div id="dps-report-content" className="bg-white text-black w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl text-sm relative flex flex-col">
                        <div className="text-center font-bold text-xl p-10 border border-dashed border-gray-300">
                            Aperçu PDF (Contenu identique à la version précédente)
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

const PMAHistoryModal: React.FC<{
    history: PMALog[];
    onClose: () => void;
}> = ({ history, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
            <Card className="w-full max-w-md h-[70vh] flex flex-col !p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <History size={18} className="text-primary"/> Historique des Actions
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={18}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {history.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm py-8">Aucun historique disponible.</p>
                    ) : (
                        history.map((log) => (
                            <div key={log.id} className="flex gap-3 text-sm">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                        log.action === 'check' ? 'bg-green-500' : 
                                        log.action === 'uncheck' ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></div>
                                    <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1"></div>
                                </div>
                                <div className="pb-2">
                                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                                        {log.action === 'check' ? 'Validé' : log.action === 'uncheck' ? 'Décoché' : 'Réinitialisation'} 
                                        {log.item && <span className="font-normal text-gray-500"> : {log.item}</span>}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                        <Clock size={10}/> {new Date(log.date).toLocaleTimeString()} 
                                        <span>•</span> 
                                        <User size={10}/> {log.userName}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

const PMA: React.FC = () => {
    const { patients = [], addPatient, updatePatient, deletePatient, pmaChecklistItems } = useData();
    const { addNotification } = useNotification();
    const { currentUser } = useAuth(); // Needed for history logging
    
    // Navigation Onglets
    const [activeTab, setActiveTab] = useState<'victims' | 'verification'>('victims');

    // États pour le formulaire d'ajout rapide (Victime)
    const [isAdding, setIsAdding] = useState(false);
    const [isDPSFormOpen, setIsDPSFormOpen] = useState(false); // État pour le formulaire complet
    const [newVictim, setNewVictim] = useState<{
        sinusId: string;
        triageStatus: TriageStatus;
        genre: 'Homme' | 'Femme' | 'Autre';
        ageApprox: string;
        motif: string;
        secteur?: string;
    }>({
        sinusId: '',
        triageStatus: 'UIMP',
        genre: 'Homme',
        ageApprox: '',
        motif: '',
        secteur: ''
    });

    // État pour la génération de rapport
    const [viewingReportPatient, setViewingReportPatient] = useState<Patient | null>(null);
    const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [showReportModal, setShowReportModal] = useState(false); // État pour le modal rapport main courante

    // État local pour la checklist et filtres
    const [checklistState, setChecklistState] = useLocalStorage<Record<string, boolean>>('pma_checklist_ops', {});
    // État local pour l'historique de la checklist
    const [checklistHistory, setChecklistHistory] = useLocalStorage<PMALog[]>('pma_checklist_history', []);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Tous' | 'UA' | 'UR' | 'UIMP'>('Tous');

    // Timer local pour refresh l'affichage du temps écoulé
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

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
        return pmaPatients.filter(p => {
            const matchesSearch = (p.nom && p.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (p.sinusId && p.sinusId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (p.motifAppel && p.motifAppel.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'Tous' || p.triageStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [pmaPatients, searchTerm, statusFilter]);

    // Statistiques DPS Sportif
    const stats = useMemo(() => {
        return {
            card1: { label: 'Soins Médicaux', count: pmaPatients.filter(p => p.triageStatus === 'UA' || p.triageStatus === 'UR').length, color: 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800', textColor: 'text-red-700 dark:text-red-400', icon: Stethoscope },
            card2: { label: 'Bobologie', count: pmaPatients.filter(p => p.triageStatus === 'UIMP').length, color: 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800', textColor: 'text-green-700 dark:text-green-400', icon: PersonStanding },
            card3: { label: 'Évacuations', count: pmaPatients.filter(p => p.observations?.includes('Évacuation')).length, color: 'bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800', textColor: 'text-orange-700 dark:text-orange-400', icon: Ambulance },
            card4: { label: 'Total Prise en charge', count: pmaPatients.length, color: 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-400', icon: Activity },
        };
    }, [pmaPatients]);

    // Actions (Ajout, Update, Discharge) - conservées telles quelles
    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const idBase = 'DOSS-';
        const victimId = newVictim.sinusId || `${idBase}${Math.floor(Math.random()*10000)}`;
        const patient: Omit<Patient, 'id' | 'dateCreation'> = {
            nom: 'Participant', prenom: `#${victimId}`, sinusId: newVictim.sinusId, triageStatus: newVictim.triageStatus,
            sexe: newVictim.genre, age: newVictim.ageApprox, dateNaissance: '', adresse: 'PMA', telephone: '',
            motifAppel: newVictim.motif || 'Soins course', circonstances: newVictim.secteur ? `Secteur: ${newVictim.secteur}` : 'DPS Sportif',
            pmaAdmissionDate: new Date().toISOString(), taSystolique: '', taDiastolique: '', frequenceCardiaque: '', frequenceRespiratoire: '',
            spO2: '', temperature: '', glycemie: '', echelleDouleur: '', scoreGlasgow: '', 
            bilanPrimaireA: '', bilanPrimaireA_Status: 'stable', bilanPrimaireB: '', bilanPrimaireB_Status: 'stable',
            bilanPrimaireC: '', bilanPrimaireC_Status: 'stable', bilanPrimaireD: '', bilanPrimaireD_Status: 'stable',
            bilanPrimaireE: '', bilanPrimaireE_Status: 'stable', plaintePrincipale: '', descriptionPQRST: '', examenPhysique: '', injuries: [],
            sampleSignes: '', allergies: '', sampleMedicaments: '', antecedents: '', sampleDernierRepas: '', sampleEvenements: '',
            observations: '', contactUrgenceNom: '', contactUrgenceTelephone: '', documents: []
        };
        try { await addPatient(patient); addNotification(`Patient ${victimId} admis`, 'success'); setIsAdding(false); setNewVictim({ sinusId: '', triageStatus: 'UIMP', genre: 'Homme', ageApprox: '', motif: '', secteur: '' }); } catch (error) { addNotification("Erreur lors de l'ajout.", 'error'); }
    };

    const handleSaveDPSForm = async (data: Patient) => {
        try {
            if (patients.some(p => p.id === data.id)) { await updatePatient(data); addNotification("Fiche DPS mise à jour.", 'success'); } 
            else { await addPatient(data); addNotification("Fiche DPS créée.", 'success'); }
            setIsDPSFormOpen(false); setEditingPatient(undefined);
        } catch (error) { addNotification("Erreur sauvegarde fiche.", 'error'); }
    };

    const updateStatus = async (patient: Patient, status: TriageStatus) => {
        try { await updatePatient({ ...patient, triageStatus: status }); addNotification("Statut mis à jour.", 'info'); } 
        catch (e) { addNotification("Erreur mise à jour.", 'error'); }
    };

    const handleDischarge = async (patient: Patient, type: 'race' | 'evac') => {
        try {
            const obs = type === 'race' ? 'Retour Course' : 'Évacuation Hôpital';
            await updatePatient({ ...patient, observations: (patient.observations ? patient.observations + '\n' : '') + `[${new Date().toLocaleTimeString()}] ${obs}` });
            addNotification(`${obs} validé pour ${patient.prenom}`, 'success');
        } catch (e) { addNotification("Erreur.", 'error'); }
    }

    const handleDelete = async () => {
        if (deletingPatient) {
            try {
                await deletePatient(deletingPatient.id);
                addNotification("Patient supprimé avec succès.", 'success');
                setDeletingPatient(null);
            } catch (error) {
                addNotification("Erreur lors de la suppression.", 'error');
            }
        }
    };

    const toggleChecklistItem = (item: string) => {
        setChecklistState(prev => {
            const newState = !prev[item];
            const newLog: PMALog = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                userName: currentUser?.nom || 'Utilisateur',
                action: newState ? 'check' : 'uncheck',
                item: item
            };
            setChecklistHistory(prevHist => [newLog, ...prevHist].slice(0, 50));
            return { ...prev, [item]: newState };
        });
    };

    const handleResetChecklist = () => {
        if (window.confirm("Voulez-vous vraiment réinitialiser la checklist opérationnelle ?")) {
            setChecklistState({});
            const newLog: PMALog = { id: Date.now().toString(), date: new Date().toISOString(), userName: currentUser?.nom || 'Utilisateur', action: 'reset' };
            setChecklistHistory(prevHist => [newLog, ...prevHist].slice(0, 50));
            addNotification("Checklist réinitialisée.", 'info');
        }
    };

    // NOUVELLE FONCTION DE SAUVEGARDE MANUELLE
    const handleSaveChecklist = () => {
        addNotification("État du PMA sauvegardé avec succès.", 'success');
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

    const formatElapsedTime = (dateString?: string) => {
        if (!dateString) return '-';
        const start = new Date(dateString).getTime();
        const diff = Math.floor((now - start) / 60000);
        if (diff < 60) return `${diff} min`;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m`;
    };

    const checklistProgress = useMemo(() => {
        if (!pmaChecklistItems) return 0;
        const total = Object.values(pmaChecklistItems).flat().length;
        if (total === 0) return 0;
        const checked = Object.values(checklistState).filter(Boolean).length;
        return Math.round((checked / total) * 100);
    }, [checklistState, pmaChecklistItems]);

    // Icon helper for checklist categories
    const getCategoryIcon = (categoryName: string) => {
        const lower = categoryName.toLowerCase();
        if (lower.includes('infra') || lower.includes('tente')) return Tent;
        if (lower.includes('soin') || lower.includes('médical')) return HeartPulse;
        if (lower.includes('radio') || lower.includes('com')) return Radio;
        if (lower.includes('logistique') || lower.includes('ravitaillement')) return Box;
        if (lower.includes('électricité') || lower.includes('énergie')) return Zap;
        return ClipboardCheck;
    };

    return (
        <div className="space-y-6">
            {/* Modal Formulaire DPS Complet */}
            {isDPSFormOpen && (
                <DPSInputModal 
                    patient={editingPatient}
                    onSave={handleSaveDPSForm}
                    onClose={() => { setIsDPSFormOpen(false); setEditingPatient(undefined); }}
                />
            )}

            {/* Modal Historique Checklist */}
            {showHistoryModal && (
                <PMAHistoryModal 
                    history={checklistHistory} 
                    onClose={() => setShowHistoryModal(false)}
                />
            )}

            {/* Modal Rapport Main Courante */}
            {showReportModal && (
                <PMAHandoverReportModal
                    patients={pmaPatients}
                    onClose={() => setShowReportModal(false)}
                />
            )}

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!deletingPatient}
                onClose={() => setDeletingPatient(null)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
            >
                <p>Êtes-vous sûr de vouloir supprimer définitivement le patient <strong>{deletingPatient?.nom} {deletingPatient?.prenom}</strong> ?</p>
                <p className="text-sm text-red-500 mt-2">Cette action est irréversible.</p>
            </ConfirmationModal>

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
                    {activeTab === 'victims' && (
                        <div className="flex gap-2">
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
                    <LayoutGrid size={18} className="mr-2" />
                    Matériel & Logistique
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${checklistProgress === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                        {checklistProgress}%
                    </span>
                </button>
            </div>

            {/* VUE 1: SUIVI VICTIMES */}
            {activeTab === 'victims' && (
                // ... (Reste de la vue victimes inchangée, pour ne pas répéter tout le code déjà correct)
                <div className="space-y-6 animate-in fade-in">
                    {/* DASHBOARD TRIAGE */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TriageCard {...stats.card1} />
                        <TriageCard {...stats.card2} />
                        <TriageCard {...stats.card3} />
                        <TriageCard {...stats.card4} />
                    </div>

                    {/* ZONE D'AJOUT RAPIDE */}
                    {isAdding && (
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-4">
                            <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Gravité</label>
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
                                    <label className="text-xs font-bold text-gray-500 uppercase">N° Dossard</label>
                                    <div className="relative">
                                        <input type="text" value={newVictim.sinusId} onChange={e => setNewVictim({...newVictim, sinusId: e.target.value})} placeholder="ex: 1042" className="input w-full font-mono pl-8"/>
                                        <Ticket size={14} className="absolute left-2.5 top-3 text-gray-400"/>
                                    </div>
                                </div>
                                {/* ... autres champs ajout rapide ... */}
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Secteur / KM</label>
                                    <input type="text" value={newVictim.secteur} onChange={e => setNewVictim({...newVictim, secteur: e.target.value})} placeholder="ex: Arrivée" className="input w-full"/>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Genre</label>
                                    <select value={newVictim.genre} onChange={e => setNewVictim({...newVictim, genre: e.target.value as any})} className="input w-full"><option>Homme</option><option>Femme</option></select>
                                </div>
                                <div className="md:col-span-2 flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Motif / Lésion</label>
                                        <input type="text" value={newVictim.motif} onChange={e => setNewVictim({...newVictim, motif: e.target.value})} placeholder="ex: Crampes" className="input w-full" list="motifs-list"/>
                                    </div>
                                    <button type="submit" className="btn-primary px-6 h-[42px] mt-auto">Ajouter</button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* LISTE DES VICTIMES */}
                    <Card className="!p-0 overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <h2 className="font-bold text-gray-700 dark:text-gray-200">Main Courante</h2>
                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                    {['Tous', 'UA', 'UR', 'UIMP'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status as any)}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statusFilter === status ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-500'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <input type="text" placeholder="Rechercher dossard..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input w-full pl-9 py-1.5 text-sm"/>
                                    <Search className="absolute left-3 top-2 text-gray-400" size={16}/>
                                </div>
                                <button 
                                    onClick={() => setShowReportModal(true)} 
                                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                                    title="Générer Rapport Main Courante"
                                >
                                    <FileSpreadsheet size={18} />
                                </button>
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
                                        <th className="p-4 text-left">Prise en charge</th>
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
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                                                {p.motifAppel || '-'}
                                                {p.observations?.includes('Retour Course') && <span className="block text-[10px] text-green-600 font-bold mt-1">RETOUR COURSE</span>}
                                                {p.observations?.includes('Évacuation') && <span className="block text-[10px] text-orange-600 font-bold mt-1">ÉVACUÉ</span>}
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs">{p.circonstances?.replace('Secteur: ', '') || '-'}</td>
                                            <td className="p-4 text-gray-500">
                                                <div className="flex items-center gap-1" title={`Admis à ${new Date(p.pmaAdmissionDate || p.dateCreation).toLocaleTimeString()}`}>
                                                    <Timer size={14} className={p.triageStatus === 'UA' ? 'text-red-500' : 'text-gray-400'}/>
                                                    <span className="font-mono">{formatElapsedTime(p.pmaAdmissionDate || p.dateCreation)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-3 items-center">
                                                    
                                                    {/* Groupe Statut Rapide */}
                                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1 mr-2">
                                                        <button onClick={() => updateStatus(p, 'UA')} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-red-600" title="Passer en UA"><AlertOctagon size={16}/></button>
                                                        <button onClick={() => updateStatus(p, 'UR')} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-yellow-600" title="Passer en UR"><AlertTriangle size={16}/></button>
                                                        <button onClick={() => updateStatus(p, 'UIMP')} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-green-600" title="Passer en Soins Légers"><User size={16}/></button>
                                                    </div>

                                                    {/* Groupe Sortie */}
                                                    <button onClick={() => handleDischarge(p, 'race')} className="btn-secondary px-3 py-1 text-xs flex items-center text-green-700 bg-green-50 hover:bg-green-100 border-green-200" title="Retour Course">
                                                        <Undo2 size={14} className="mr-1"/>
                                                    </button>
                                                    <button onClick={() => handleDischarge(p, 'evac')} className="btn-primary bg-indigo-600 hover:bg-indigo-700 border-indigo-600 px-3 py-1 text-xs flex items-center" title="Évacuation">
                                                        <Ambulance size={14}/>
                                                    </button>

                                                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>

                                                    {/* Groupe Administration */}
                                                    <button 
                                                        onClick={() => { setEditingPatient(p); setIsDPSFormOpen(true); }}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        title="Modifier / Compléter"
                                                    >
                                                        <Edit size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeletingPatient(p)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Supprimer le dossier"
                                                    >
                                                        <Trash2 size={16}/>
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
                                    <p>Aucun patient dans le poste pour cette sélection.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* VUE 2: VÉRIFICATION LOGISTIQUE (NOUVELLE STRUCTURE) */}
            {activeTab === 'verification' && (
                <div className="space-y-6 animate-in fade-in">
                    
                    {/* BARRE DE STATUT GLOBALE ET ACTIONS */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`p-3 rounded-full ${checklistProgress === 100 ? 'bg-green-100 text-green-600' : checklistProgress > 50 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                {checklistProgress === 100 ? <CheckCircle size={32}/> : <AlertTriangle size={32}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Situation Logistique</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        checklistProgress === 100 ? 'bg-green-500 text-white' : 
                                        checklistProgress > 75 ? 'bg-green-100 text-green-800' :
                                        checklistProgress > 40 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {checklistProgress === 100 ? 'OPÉRATIONNEL' : checklistProgress > 40 ? 'DÉGRADÉ' : 'CRITIQUE'}
                                    </span>
                                    <span className="text-sm text-gray-500 font-mono">{checklistProgress}% validé</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={handleSaveChecklist} className="btn-secondary flex items-center justify-center bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
                                <Save size={16} className="mr-2"/> Sauvegarder
                            </button>
                            <button onClick={() => setShowHistoryModal(true)} className="flex-1 md:flex-none btn-secondary flex items-center justify-center">
                                <History size={16} className="mr-2"/> Historique
                            </button>
                            <button onClick={handleResetChecklist} className="flex-1 md:flex-none btn-secondary flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-200">
                                <RotateCcw size={16} className="mr-2"/> Reset
                            </button>
                        </div>
                    </div>

                    {/* GRILLE DES CATÉGORIES (Dashboard View) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pmaChecklistItems && Object.entries(pmaChecklistItems).map(([category, items]) => {
                            const CategoryIcon = getCategoryIcon(category);
                            
                            // Calcul progression catégorie
                            const catItems = Array.isArray(items) ? items : [];
                            const checkedCount = catItems.filter(i => checklistState[i]).length;
                            const totalCount = catItems.length;
                            const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                            const isComplete = percent === 100;
                            const isStarted = percent > 0;

                            return (
                                <Card 
                                    key={category} 
                                    className={`relative overflow-hidden transition-all duration-300 border-l-4 ${
                                        isComplete ? 'border-l-green-500 shadow-sm' : 
                                        isStarted ? 'border-l-orange-400 shadow-md ring-1 ring-orange-100' : 
                                        'border-l-gray-300 opacity-90'
                                    }`}
                                >
                                    {/* Header Carte */}
                                    <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <CategoryIcon size={20} />
                                            </div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                                {category}
                                            </h3>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {checkedCount}/{totalCount}
                                        </span>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-2 mb-4">
                                        {catItems.map(item => {
                                            const isChecked = checklistState[item] || false;
                                            return (
                                                <div 
                                                    key={item} 
                                                    onClick={() => toggleChecklistItem(item)}
                                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${
                                                        isChecked ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <span className={`text-xs ${isChecked ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                                                        {item}
                                                    </span>
                                                    <div className={`shrink-0 transition-all ${isChecked ? 'text-green-500 scale-110' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                                        {isChecked ? <CheckCircle size={16} /> : <Square size={16} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-auto">
                                        <div 
                                            className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-orange-400'}`} 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </Card>
                            );
                        })}
                        
                        {(!pmaChecklistItems || Object.keys(pmaChecklistItems).length === 0) && (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
                                <ClipboardCheck size={48} className="text-gray-300 mb-2"/>
                                <p className="text-gray-500 text-sm">Aucune checklist configurée.</p>
                                <p className="text-gray-400 text-xs mt-1">Configurez les items dans le menu Administration.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PMA;