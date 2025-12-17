
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Patient, ViewContext, PatientDocument, BodyInjury } from '../types';
import Card from '../components/Card';
import { 
    Plus, X, Edit, Trash2, Search, User, Activity, FileText, ClipboardList, 
    Stethoscope, HeartPulse, Brain, Wind, Thermometer, Droplet, UserCheck, 
    Camera, Eye, Download, Loader2, Calendar, Phone, MapPin, AlertCircle, 
    Clock, ChevronRight, FileCheck, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
    ShieldAlert, Siren, FilePlus, UploadCloud, Image as ImageIcon, File, Paperclip,
    Ambulance
} from 'lucide-react';
import { useData } from '../providers/DataProvider';
import ConfirmationModal from '../components/ConfirmationModal';
import BodyMap from '../components/BodyMap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- NEW COMPONENT: Full Patient Report Preview (Professional Medical Report) ---
const PatientReportModal: React.FC<{ 
    patient: Patient; 
    onClose: () => void; 
}> = ({ patient, onClose }) => {
    const { headerInfo } = useData(); // Récupération des infos entreprise
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        const pages = document.querySelectorAll('.report-page');
        if (pages.length > 0) {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i] as HTMLElement;
                    const canvas = await html2canvas(page, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                }
                
                pdf.save(`Fiche_Intervention_${patient.nom}_${patient.prenom}.pdf`);
            } catch (error) {
                console.error("PDF generation failed", error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    // Calculate PAM
    const pam = (patient.taSystolique && patient.taDiastolique) 
        ? Math.round((2 * parseInt(patient.taDiastolique) + parseInt(patient.taSystolique)) / 3) 
        : null;

    // Helper Components for Report
    const ReportSection = ({ title, icon: Icon, children, className = "" }: any) => (
        <div className={`mb-4 border border-slate-300 rounded-sm overflow-hidden ${className}`}>
            <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
                {Icon && <Icon size={14} className="text-slate-600"/>}
                <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">{title}</h3>
            </div>
            <div className="p-3 bg-white">
                {children}
            </div>
        </div>
    );

    const InfoField = ({ label, value, important = false }: any) => (
        <div className="mb-2">
            <div className="text-[9px] text-slate-500 uppercase font-semibold">{label}</div>
            <div className={`text-sm leading-tight ${important ? 'font-black text-slate-900' : 'font-medium text-slate-800'} ${!value ? 'italic text-slate-400' : ''}`}>
                {value || '-'}
            </div>
        </div>
    );

    const VitalBox = ({ label, value, unit, color = "text-slate-800" }: any) => (
        <div className="flex flex-col items-center justify-center p-3 border-r border-slate-200 last:border-0 h-24">
            <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">{label}</span>
            <span className={`text-3xl font-black ${color} leading-none mb-1`}>{value || '--'}</span>
            <span className="text-[10px] text-slate-400">{unit}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] p-4 backdrop-blur-sm">
            <Card className="w-full max-w-6xl h-[95vh] flex flex-col !p-0 overflow-hidden bg-slate-900 border-none">
                {/* Toolbar */}
                <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700 shadow-md z-10 shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-3 text-white">
                        <FileCheck className="text-primary"/> Fiche d'Intervention (2 Pages)
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={handleDownload} disabled={isGenerating} className="btn-primary flex items-center text-sm shadow-lg hover:scale-105 transition-transform">
                            {isGenerating ? <Loader2 className="animate-spin mr-2" size={16}/> : <Download size={16} className="mr-2"/>}
                            Télécharger PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                {/* Preview Area - Scrollable Container */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50 flex flex-col items-center gap-8">
                    
                    {/* --- PAGE 1: IDENTITÉ, CONSTANTES, ABCDE --- */}
                    <div 
                        className="report-page bg-white text-slate-900 shadow-2xl relative flex flex-col"
                        style={{ width: '210mm', height: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif' }}
                    >
                        {/* Header Officiel Personnalisé */}
                        <div className="flex justify-between items-start border-b-4 border-blue-800 pb-4 mb-6">
                            {/* Colonne Gauche: Logo & Entreprise */}
                            <div className="flex gap-4 items-center">
                                {headerInfo?.logo ? (
                                    <img src={headerInfo.logo} alt="Logo" className="h-20 w-auto max-w-[120px] object-contain" />
                                ) : (
                                    <div className="h-16 w-16 bg-blue-600 text-white flex items-center justify-center rounded-full shadow-sm">
                                        <Siren size={32} />
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-bold text-lg text-slate-900 uppercase leading-none mb-1">
                                        {headerInfo?.companyName || 'MedEvac Services'}
                                    </h2>
                                    <div className="text-[10px] text-slate-500 leading-tight">
                                        {headerInfo?.address && <p>{headerInfo.address}</p>}
                                        <p>
                                            {headerInfo?.phone && `Tél: ${headerInfo.phone}`} 
                                            {headerInfo?.email && ` | Email: ${headerInfo.email}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Colonne Droite: Titre Fiche & Dates */}
                            <div className="text-right">
                                <h1 className="text-3xl font-black text-blue-700 tracking-tight uppercase mb-1">
                                    Fiche d'Intervention
                                </h1>
                                <div className="text-xs text-slate-500 font-mono">
                                    <p>Réf: <span className="font-bold text-slate-900">{patient.id.substring(0, 12).toUpperCase()}</span></p>
                                    <p>Date: <span className="font-bold text-slate-800">{new Date(patient.dateCreation).toLocaleDateString('fr-FR')}</span></p>
                                    <p>Heure: <span className="font-bold text-slate-800">{new Date(patient.dateCreation).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Identité & Contexte */}
                        <div className="grid grid-cols-12 gap-6 mb-6">
                            <div className="col-span-5 border border-slate-300 rounded-sm bg-slate-50 p-4 relative">
                                <div className="absolute top-0 left-0 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 uppercase">Patient</div>
                                <div className="mt-2">
                                    <div className="text-2xl font-black text-slate-900 uppercase mb-1">{patient.nom}</div>
                                    <div className="text-xl font-medium text-slate-700 mb-4">{patient.prenom}</div>
                                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-200 pt-3">
                                        <InfoField label="Sexe / Âge" value={`${patient.sexe === 'Homme' ? 'M' : 'F'} / ${patient.age} ans`} />
                                        <InfoField label="Né(e) le" value={patient.dateNaissance ? new Date(patient.dateNaissance).toLocaleDateString('fr-FR') : ''} />
                                        <div className="col-span-2">
                                            <InfoField label="Adresse" value={patient.adresse} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-7 border border-slate-300 rounded-sm p-4 flex flex-col justify-center">
                                <InfoField label="Motif de l'appel" value={patient.motifAppel} important />
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <InfoField label="Circonstances / Histoire de la maladie" value={patient.circonstances} />
                                </div>
                            </div>
                        </div>

                        {/* BIG MONITOR: Constantes Vitales */}
                        <div className="mb-8 border border-slate-300 rounded-md overflow-hidden shadow-sm">
                            <div className="bg-slate-800 text-white text-xs font-bold px-4 py-2 uppercase flex justify-between items-center">
                                <span className="flex items-center gap-2"><Activity size={16} /> Bilan des Constantes Vitales</span>
                                <span className="opacity-70">Prise unique</span>
                            </div>
                            <div className="grid grid-cols-4 divide-x divide-y divide-slate-200 bg-slate-50">
                                <VitalBox label="Fréquence Cardiaque" value={patient.frequenceCardiaque} unit="bpm" color="text-green-600" />
                                <VitalBox label="Pression Artérielle" value={`${patient.taSystolique}/${patient.taDiastolique}`} unit="mmHg" color="text-blue-600" />
                                <VitalBox label="Saturation SpO2" value={patient.spO2} unit="%" color="text-cyan-600" />
                                <VitalBox label="Fréquence Respiratoire" value={patient.frequenceRespiratoire} unit="cpm" color="text-teal-600" />
                                <VitalBox label="Température" value={patient.temperature} unit="°C" color="text-orange-500" />
                                <VitalBox label="Glycémie Capillaire" value={patient.glycemie} unit="g/L" />
                                <VitalBox label="Douleur (EVA)" value={patient.echelleDouleur} unit="/ 10" />
                                <div className="flex flex-col items-center justify-center p-3 h-24 bg-slate-100">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Glasgow (GCS)</span>
                                    <span className="text-3xl font-black text-purple-700 mb-1">{patient.scoreGlasgow || '--'}<span className="text-sm font-medium text-slate-400">/15</span></span>
                                    <span className="text-[9px] text-slate-500">E{patient.gcs_eye} V{patient.gcs_verbal} M{patient.gcs_motor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bilan ABCDE */}
                        <div className="flex-1">
                            <ReportSection title="Bilan Primaire (ABCDE)" icon={ShieldAlert} className="h-full">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                        <tr>
                                            <th className="py-2 px-2 text-left w-10">#</th>
                                            <th className="py-2 px-2 text-left w-32">Fonction</th>
                                            <th className="py-2 px-2 text-left">Observations</th>
                                            <th className="py-2 px-2 text-right w-24">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="py-3 px-2 font-black text-blue-600">A</td>
                                            <td className="py-3 px-2 font-bold text-slate-700">Airway</td>
                                            <td className="py-3 px-2">{patient.bilanPrimaireA || 'Voies aériennes libres'}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${patient.bilanPrimaireA_Status === 'stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {patient.bilanPrimaireA_Status || 'Non évalué'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-2 font-black text-blue-600">B</td>
                                            <td className="py-3 px-2 font-bold text-slate-700">Breathing</td>
                                            <td className="py-3 px-2">{patient.bilanPrimaireB || 'Eupnéique'}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${patient.bilanPrimaireB_Status === 'stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {patient.bilanPrimaireB_Status || 'Non évalué'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-2 font-black text-blue-600">C</td>
                                            <td className="py-3 px-2 font-bold text-slate-700">Circulation</td>
                                            <td className="py-3 px-2">{patient.bilanPrimaireC || 'Hémodynamique stable'}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${patient.bilanPrimaireC_Status === 'stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {patient.bilanPrimaireC_Status || 'Non évalué'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-2 font-black text-blue-600">D</td>
                                            <td className="py-3 px-2 font-bold text-slate-700">Disability</td>
                                            <td className="py-3 px-2">{patient.bilanPrimaireD || 'Conscient, orienté'}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${patient.bilanPrimaireD_Status === 'stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {patient.bilanPrimaireD_Status || 'Non évalué'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-2 font-black text-blue-600">E</td>
                                            <td className="py-3 px-2 font-bold text-slate-700">Exposure</td>
                                            <td className="py-3 px-2">{patient.bilanPrimaireE || 'RAS'}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${patient.bilanPrimaireE_Status === 'stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {patient.bilanPrimaireE_Status || 'Non évalué'}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </ReportSection>
                        </div>

                        {/* Page Footer */}
                        <div className="mt-auto pt-4 border-t border-slate-200 text-right text-[10px] text-slate-400 flex justify-between">
                            <span>{headerInfo?.companyName}</span>
                            <span>Page 1/2 • Fiche générée par MedEvac</span>
                        </div>
                    </div>

                    {/* --- PAGE 2: SECONDAIRE & OBSERVATIONS --- */}
                    <div 
                        className="report-page bg-white text-slate-900 shadow-2xl relative flex flex-col"
                        style={{ width: '210mm', height: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif' }}
                    >
                        {/* Mini Header Rappel */}
                        <div className="border-b border-slate-200 pb-2 mb-6 flex justify-between items-center opacity-70">
                            <span className="text-xs font-bold uppercase text-slate-500">{headerInfo?.companyName || 'MedEvac'} - Suite Intervention</span>
                            <span className="text-xs font-bold uppercase text-slate-900">{patient.nom} {patient.prenom} (Suite)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* SAMPLE */}
                            <ReportSection title="Anamnèse (SAMPLE)" icon={ClipboardList}>
                                <div className="text-xs space-y-3">
                                    <div className="grid grid-cols-[20px_1fr] gap-2">
                                        <span className="font-bold text-slate-400 text-sm">S</span>
                                        <div><span className="font-bold text-slate-700">Symptômes:</span> {patient.sampleSignes || 'Néant'}</div>
                                    </div>
                                    <div className="grid grid-cols-[20px_1fr] gap-2">
                                        <span className="font-bold text-slate-400 text-sm">A</span>
                                        <div><span className="font-bold text-slate-700">Allergies:</span> <span className="text-red-600 font-bold">{patient.allergies || 'Néant'}</span></div>
                                    </div>
                                    <div className="grid grid-cols-[20px_1fr] gap-2">
                                        <span className="font-bold text-slate-400 text-sm">M</span>
                                        <div><span className="font-bold text-slate-700">Médicaments:</span> {patient.sampleMedicaments || 'Néant'}</div>
                                    </div>
                                    <div className="grid grid-cols-[20px_1fr] gap-2">
                                        <span className="font-bold text-slate-400 text-sm">P</span>
                                        <div><span className="font-bold text-slate-700">Passé Médical:</span> {patient.antecedents || 'RAS'}</div>
                                    </div>
                                    <div className="grid grid-cols-[20px_1fr] gap-2">
                                        <span className="font-bold text-slate-400 text-sm">L</span>
                                        <div><span className="font-bold text-slate-700">Last Meal:</span> {patient.sampleDernierRepas || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-[20px_1fr] gap-2">
                                        <span className="font-bold text-slate-400 text-sm">E</span>
                                        <div><span className="font-bold text-slate-700">Events:</span> {patient.sampleEvenements || '-'}</div>
                                    </div>
                                </div>
                            </ReportSection>

                            {/* PQRST & Examen */}
                            <ReportSection title="Détail de la plainte" icon={Stethoscope}>
                                <div className="mb-3">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Analyse PQRST</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs border border-slate-100 rounded bg-slate-50 p-2">
                                        <div><span className="font-semibold">P:</span> {patient.pqrst_p || '-'}</div>
                                        <div><span className="font-semibold">Q:</span> {patient.pqrst_q || '-'}</div>
                                        <div><span className="font-semibold">R:</span> {patient.pqrst_r || '-'}</div>
                                        <div><span className="font-semibold">S:</span> {patient.pqrst_s ? `${patient.pqrst_s}/10` : '-'}</div>
                                        <div className="col-span-2"><span className="font-semibold">T:</span> {patient.pqrst_t || '-'}</div>
                                    </div>
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-slate-700 block mb-1">Examen Physique:</span>
                                    <p className="text-slate-800 whitespace-pre-wrap">{patient.examenPhysique || "Examen sans particularité notable."}</p>
                                </div>
                            </ReportSection>
                        </div>

                        {/* Bilan Lésionnel Visuel */}
                        <ReportSection title="Bilan Lésionnel" icon={UserCheck}>
                            <div className="flex gap-8 items-start">
                                {/* Simplified BodyMap for Print */}
                                <div className="w-[120px] h-[240px] border border-slate-100 bg-slate-50 flex-shrink-0 relative self-center">
                                    <div className="absolute top-0 w-full text-center text-[8px] text-slate-400 uppercase">Schéma</div>
                                    <BodyMap 
                                        injuries={patient.injuries || []} 
                                        onAddInjury={()=>{}} 
                                        onRemoveInjury={()=>{}} 
                                        readOnly={true} 
                                        initialView="front"
                                        hideControls={true} 
                                        className="h-full w-full" 
                                    />
                                </div>
                                <div className="flex-1">
                                    {(patient.injuries && patient.injuries.length > 0) ? (
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-slate-500">
                                                    <th className="text-left font-normal pb-2 w-10">#</th>
                                                    <th className="text-left font-normal pb-2 w-24">Type</th>
                                                    <th className="text-left font-normal pb-2">Description / Note</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {patient.injuries.map((inj, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                        <td className="py-2 font-bold">{idx+1}</td>
                                                        <td className="py-2 capitalize font-medium">{
                                                            inj.type === 'wound' ? 'Plaie' : 
                                                            inj.type === 'bruise' ? 'Hématome' : 
                                                            inj.type === 'burn' ? 'Brûlure' : 'Douleur'
                                                        }</td>
                                                        <td className="py-2 text-slate-600">{inj.description || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-sm text-slate-400 italic py-8 border-l-4 border-slate-100 pl-4">
                                            Aucune lésion traumatique n'a été marquée sur le schéma corporel.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ReportSection>

                        {/* Observations & Conclusion */}
                        <ReportSection title="Conclusion & Orientation" icon={FileText} className="flex-1">
                            <div className="min-h-[100px] text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {patient.observations || "Pas d'observations complémentaires."}
                            </div>
                        </ReportSection>

                        {/* Documents Annexés */}
                        {patient.documents && patient.documents.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><Paperclip size={14}/> Pièces Jointes</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {patient.documents.map((doc, idx) => (
                                        <div key={idx} className="text-[10px] border rounded p-1 bg-slate-50 truncate text-slate-600">
                                            {doc.name} ({doc.type})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer (No Signatures as requested) */}
                        <div className="mt-auto pt-4 border-t-2 border-slate-200">
                            <div className="text-[10px] text-slate-400 flex flex-col items-end text-right">
                                <p>Document généré par MedEvac Platform</p>
                                <p>ID: {patient.id}</p>
                                <p>Page 2/2</p>
                            </div>
                        </div>
                    </div>

                </div>
            </Card>
        </div>
    );
};

// --- Glasgow Calculator Component ---
const GCSCalculator: React.FC<{ 
    eye: string, verbal: string, motor: string, 
    onChange: (e: string, v: string, m: string) => void 
}> = ({ eye, verbal, motor, onChange }) => {
    const total = (parseInt(eye)||0) + (parseInt(verbal)||0) + (parseInt(motor)||0);
    const getScoreColor = (s: number) => {
        if(s <= 8) return 'bg-red-100 text-red-700 border-red-200';
        if(s <= 12) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">Glasgow (GCS)</label>
                <span className={`px-2 py-0.5 text-sm font-bold rounded border ${getScoreColor(total)}`}>Total: {total || '-'} / 15</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
                <select value={eye} onChange={(e) => onChange(e.target.value, verbal, motor)} className="input p-1">
                    <option value="">Y: Ouverture Yeux</option>
                    <option value="4">4. Spontanée</option>
                    <option value="3">3. À la demande</option>
                    <option value="2">2. À la douleur</option>
                    <option value="1">1. Nulle</option>
                </select>
                <select value={verbal} onChange={(e) => onChange(eye, e.target.value, motor)} className="input p-1">
                    <option value="">V: Réponse Verbale</option>
                    <option value="5">5. Orientée</option>
                    <option value="4">4. Confuse</option>
                    <option value="3">3. Inappropriée</option>
                    <option value="2">2. Incompréhensible</option>
                    <option value="1">1. Nulle</option>
                </select>
                <select value={motor} onChange={(e) => onChange(eye, verbal, e.target.value)} className="input p-1">
                    <option value="">M: Réponse Motrice</option>
                    <option value="6">6. Obéit</option>
                    <option value="5">5. Localise douleur</option>
                    <option value="4">4. Évitement</option>
                    <option value="3">3. Flexion (Décortication)</option>
                    <option value="2">2. Extension (Décérébration)</option>
                    <option value="1">1. Nulle</option>
                </select>
            </div>
        </div>
    );
};

// --- ABCDE Component ---
const ABCDEBlock: React.FC<{ 
    letter: string, 
    title: string, 
    value: string, 
    status: 'stable' | 'unstable' | 'critical' | undefined, 
    onChange: (val: string, status: string) => void 
}> = ({ letter, title, value, status, onChange }) => {
    return (
        <div className={`border rounded-lg overflow-hidden transition-all ${status === 'critical' ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : status === 'unstable' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
            <div className="flex items-center p-2 gap-3 border-b border-gray-100 dark:border-gray-700/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                    letter === 'A' ? 'bg-blue-500' : letter === 'B' ? 'bg-cyan-500' : letter === 'C' ? 'bg-red-500' : letter === 'D' ? 'bg-yellow-500' : 'bg-purple-500'
                }`}>
                    {letter}
                </div>
                <h4 className="flex-1 font-bold text-gray-700 dark:text-gray-200 text-sm">{title}</h4>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded">
                    <button type="button" onClick={() => onChange(value, 'stable')} title="Stable" className={`p-1 rounded ${status === 'stable' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-green-500'}`}><CheckCircle size={14}/></button>
                    <button type="button" onClick={() => onChange(value, 'unstable')} title="Instable" className={`p-1 rounded ${status === 'unstable' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-orange-500'}`}><AlertCircle size={14}/></button>
                    <button type="button" onClick={() => onChange(value, 'critical')} title="Critique" className={`p-1 rounded ${status === 'critical' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-red-500'}`}><AlertTriangle size={14}/></button>
                </div>
            </div>
            <textarea 
                className="w-full p-2 text-sm bg-transparent border-none focus:ring-0 resize-none placeholder-gray-400"
                placeholder={`Observations ${letter}...`}
                rows={2}
                value={value}
                onChange={(e) => onChange(e.target.value, status || 'stable')}
            />
        </div>
    );
};

const PatientForm: React.FC<{ patient?: Patient; onSave: (patient: Patient) => void; onCancel: () => void; }> = ({ patient, onSave, onCancel }) => {
    const { interventions = [] } = useData();
    const [activeTab, setActiveTab] = useState<'civil' | 'clinique' | 'lesionnel' | 'histoire' | 'documents' | 'interventions'>('civil');
    
    const [formData, setFormData] = useState<Omit<Patient, 'id' | 'dateCreation'>>({
        nom: '', prenom: '', dateNaissance: '', age: '', sexe: 'Homme', adresse: '', telephone: '',
        taSystolique: '', taDiastolique: '', frequenceCardiaque: '', frequenceRespiratoire: '',
        spO2: '', temperature: '', scoreGlasgow: '', glycemie: '', echelleDouleur: '',
        gcs_eye: '', gcs_verbal: '', gcs_motor: '',
        motifAppel: '', circonstances: '',
        bilanPrimaireA: '', bilanPrimaireA_Status: 'stable',
        bilanPrimaireB: '', bilanPrimaireB_Status: 'stable',
        bilanPrimaireC: '', bilanPrimaireC_Status: 'stable',
        bilanPrimaireD: '', bilanPrimaireD_Status: 'stable',
        bilanPrimaireE: '', bilanPrimaireE_Status: 'stable',
        plaintePrincipale: '', descriptionPQRST: '', 
        pqrst_p: '', pqrst_q: '', pqrst_r: '', pqrst_s: '', pqrst_t: '',
        examenPhysique: '',
        injuries: [],
        sampleSignes: '', allergies: '', sampleMedicaments: '', antecedents: '', sampleDernierRepas: '', sampleEvenements: '',
        observations: '', contactUrgenceNom: '', contactUrgenceTelephone: '', documents: []
    });

    // New Document State
    const [newDoc, setNewDoc] = useState<{ name: string; type: string; file: string | null }>({ name: '', type: 'Autre', file: null });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (patient) {
            setFormData(patient);
        }
    }, [patient]);

    // Filtrer les interventions liées au patient
    const associatedInterventions = useMemo(() => {
        if (!patient && !formData.nom) return [];
        return interventions.filter(i => 
            (patient && i.patientId === patient.id) || 
            (formData.nom && i.patientName?.toLowerCase().includes(formData.nom.toLowerCase()) && 
             formData.prenom && i.patientName?.toLowerCase().includes(formData.prenom.toLowerCase()))
        ).sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
    }, [interventions, patient, formData.nom, formData.prenom]);

    // Calcul automatique de l'âge
    useEffect(() => {
        if (formData.dateNaissance) {
            const birthDate = new Date(formData.dateNaissance);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age >= 0) {
                setFormData(prev => ({ ...prev, age: age.toString() }));
            }
        }
    }, [formData.dateNaissance]);

    // Auto-calcul du total Glasgow si les sous-composants changent
    useEffect(() => {
        const total = (parseInt(formData.gcs_eye || '0') + parseInt(formData.gcs_verbal || '0') + parseInt(formData.gcs_motor || '0'));
        if(total > 0) setFormData(prev => ({ ...prev, scoreGlasgow: total.toString() }));
    }, [formData.gcs_eye, formData.gcs_verbal, formData.gcs_motor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddInjury = (injury: Omit<BodyInjury, 'id'>) => {
        const newInjury = { ...injury, id: Date.now().toString() };
        setFormData(prev => ({ ...prev, injuries: [...(prev.injuries || []), newInjury] }));
    };

    const handleRemoveInjury = (id: string) => {
        setFormData(prev => ({ ...prev, injuries: (prev.injuries || []).filter(i => i.id !== id) }));
    };

    const handleUpdateInjury = (id: string, updates: Partial<BodyInjury>) => {
        setFormData(prev => ({
            ...prev,
            injuries: (prev.injuries || []).map(i => i.id === id ? { ...i, ...updates } : i)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: patient?.id || Date.now().toString(),
            dateCreation: patient?.dateCreation || new Date().toISOString(),
            ...formData,
        });
    };

    // Document Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewDoc(prev => ({ ...prev, file: reader.result as string, name: prev.name || file.name }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addDocument = () => {
        if (!newDoc.file || !newDoc.name) return;
        const doc: PatientDocument = {
            id: Date.now().toString(),
            name: newDoc.name,
            type: newDoc.type,
            url: newDoc.file,
            dateAdded: new Date().toISOString()
        };
        setFormData(prev => ({ ...prev, documents: [...prev.documents, doc] }));
        setNewDoc({ name: '', type: 'Autre', file: null });
    };

    const removeDocument = (id: string) => {
        setFormData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
    };

    // --- LOGIQUE DE VALIDATION DES SIGNES VITAUX ---
    type VitalStatus = 'normal' | 'warning' | 'critical';

    const getVitalStatus = (name: string, value: string): VitalStatus => {
        const n = parseFloat(value);
        if (isNaN(n) || value === '') return 'normal';

        switch (name) {
            case 'spO2':
                if (n < 90) return 'critical';
                if (n < 95) return 'warning';
                return 'normal';
            case 'frequenceCardiaque':
                if (n < 40 || n > 140) return 'critical';
                if (n < 50 || n > 100) return 'warning';
                return 'normal';
            case 'frequenceRespiratoire':
                if (n < 8 || n > 30) return 'critical';
                if (n < 12 || n > 22) return 'warning';
                return 'normal';
            case 'temperature':
                if (n < 35 || n > 40) return 'critical';
                if (n < 36 || n > 38) return 'warning';
                return 'normal';
            case 'glycemie':
                if (n < 0.5 || n > 4) return 'critical';
                if (n < 0.7 || n > 1.8) return 'warning';
                return 'normal';
            case 'taSystolique':
                if (n < 80 || n > 180) return 'critical';
                if (n < 100 || n > 150) return 'warning';
                return 'normal';
            case 'taDiastolique':
                if (n < 40 || n > 110) return 'critical';
                if (n < 60 || n > 90) return 'warning';
                return 'normal';
            default:
                return 'normal';
        }
    };

    // Helper for Vitals Input with visual feedback
    const VitalInput = ({ label, name, unit, icon: Icon, color = "gray", type = "number", max, min, step }: any) => {
        const val = (formData as any)[name];
        const status = getVitalStatus(name, val);

        const borderClass = status === 'critical' ? 'border-red-500 ring-1 ring-red-500' :
                            status === 'warning' ? 'border-orange-400 ring-1 ring-orange-400' :
                            'border-gray-200 dark:border-gray-600 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary';
        
        const bgClass = status === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                        status === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' :
                        'bg-white dark:bg-gray-700';

        const textClass = status === 'critical' ? 'text-red-700 dark:text-red-300' :
                          status === 'warning' ? 'text-orange-700 dark:text-orange-300' :
                          'text-gray-800 dark:text-white';

        return (
            <div className={`relative flex items-center p-2 rounded-lg border transition-all ${borderClass} ${bgClass}`}>
                <div className={`p-2 rounded-full mr-3 ${status === 'critical' ? 'bg-red-100 text-red-600' : status === 'warning' ? 'bg-orange-100 text-orange-600' : (color === 'red' ? 'bg-red-100 text-red-600' : color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600')}`}>
                    <Icon size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block">{label}</label>
                        {status === 'critical' && <AlertTriangle size={12} className="text-red-500 animate-pulse"/>}
                        {status === 'warning' && <AlertCircle size={12} className="text-orange-500"/>}
                    </div>
                    <div className="flex items-baseline">
                        <input 
                            type={type} 
                            name={name} 
                            value={val} 
                            onChange={handleChange} 
                            max={max}
                            min={min}
                            step={step}
                            className={`w-full bg-transparent font-bold text-lg focus:outline-none ${textClass}`}
                            placeholder="--"
                        />
                        <span className="text-xs text-gray-400 ml-1">{unit}</span>
                    </div>
                </div>
            </div>
        );
    };

    // Calculate MAP for display
    const pam = (formData.taSystolique && formData.taDiastolique) 
        ? Math.round((2 * parseInt(formData.taDiastolique) + parseInt(formData.taSystolique)) / 3) 
        : null;

    const sysStatus = getVitalStatus('taSystolique', formData.taSystolique);
    const diaStatus = getVitalStatus('taDiastolique', formData.taDiastolique);
    const taBoxClass = (sysStatus === 'critical' || diaStatus === 'critical') ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                       (sysStatus === 'warning' || diaStatus === 'warning') ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 
                       'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-6xl h-[90vh] flex flex-col !p-0 overflow-hidden bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 shadow-2xl">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                            {formData.prenom ? formData.prenom.charAt(0) : <User/>}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
                                {formData.nom || "Nouveau"} {formData.prenom || "Patient"}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {formData.age ? `${formData.age} ans` : 'Âge inconnu'} • {formData.sexe}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onCancel} className="btn-secondary">Annuler</button>
                        <button onClick={handleSubmit} className="btn-primary flex items-center shadow-lg"><FileCheck size={18} className="mr-2"/> Enregistrer</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 space-x-6 shrink-0 overflow-x-auto">
                    {[
                        { id: 'civil', label: 'Administratif', icon: User },
                        { id: 'clinique', label: 'Clinique & Vitals', icon: Activity },
                        { id: 'lesionnel', label: 'Lésionnel', icon: UserCheck },
                        { id: 'histoire', label: 'Histoire (SAMPLE)', icon: ClipboardList },
                        { id: 'interventions', label: 'Interventions', icon: Ambulance },
                        { id: 'documents', label: 'Documents', icon: FilePlus },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center py-4 text-sm font-medium border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'civil' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-in">
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center border-b pb-2"><User size={18} className="mr-2 text-primary"/> Identité</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label">Prénom</label><input name="prenom" value={formData.prenom} onChange={handleChange} className="input" placeholder="Prénom" /></div>
                                    <div><label className="label">Nom</label><input name="nom" value={formData.nom} onChange={handleChange} className="input" placeholder="Nom" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label">Date Naissance</label><input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} className="input" /></div>
                                    <div><label className="label">Sexe</label>
                                        <select name="sexe" value={formData.sexe} onChange={handleChange} className="input">
                                            <option>Homme</option><option>Femme</option><option>Autre</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center border-b pb-2"><Phone size={18} className="mr-2 text-primary"/> Contact & Divers</h3>
                                <div><label className="label">Téléphone</label><input name="telephone" value={formData.telephone} onChange={handleChange} className="input" placeholder="06..." /></div>
                                <div><label className="label">Adresse</label><textarea name="adresse" value={formData.adresse} onChange={handleChange} className="input" rows={2} placeholder="Adresse complète..." /></div>
                                <div><label className="label">Motif d'appel (Régulation)</label><input name="motifAppel" value={formData.motifAppel} onChange={handleChange} className="input" placeholder="Ex: Douleur thoracique" /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clinique' && (
                        <div className="space-y-6 animate-slide-in">
                            {/* Vitals Banner */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                <VitalInput label="SpO2" name="spO2" unit="%" icon={Wind} color="blue" max="100" />
                                <VitalInput label="Fréq. Card." name="frequenceCardiaque" unit="bpm" icon={HeartPulse} color="red" />
                                <VitalInput label="Fréq. Resp." name="frequenceRespiratoire" unit="/min" icon={Activity} />
                                
                                {/* TA BLOCK CUSTOM */}
                                <div className={`col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2 border rounded-lg p-1 transition-colors ${taBoxClass}`}>
                                    <div className="p-1 relative">
                                        <div className="flex justify-between">
                                            <label className="text-[9px] font-bold uppercase text-gray-500 block">TA Sys</label>
                                            {sysStatus === 'critical' && <AlertTriangle size={10} className="text-red-500"/>}
                                        </div>
                                        <input type="number" name="taSystolique" value={formData.taSystolique} onChange={handleChange} className={`w-full font-bold text-lg bg-transparent focus:outline-none ${sysStatus === 'critical' ? 'text-red-600' : sysStatus === 'warning' ? 'text-orange-600' : 'text-gray-800 dark:text-white'}`} placeholder="---"/>
                                    </div>
                                    <div className="p-1 border-l dark:border-gray-600 relative">
                                        <div className="flex justify-between">
                                            <label className="text-[9px] font-bold uppercase text-gray-500 block">TA Dia</label>
                                            {diaStatus === 'critical' && <AlertTriangle size={10} className="text-red-500"/>}
                                        </div>
                                        <input type="number" name="taDiastolique" value={formData.taDiastolique} onChange={handleChange} className={`w-full font-bold text-lg bg-transparent focus:outline-none ${diaStatus === 'critical' ? 'text-red-600' : diaStatus === 'warning' ? 'text-orange-600' : 'text-gray-800 dark:text-white'}`} placeholder="---"/>
                                    </div>
                                    {pam && <div className="col-span-2 text-center text-xs font-mono text-primary border-t dark:border-gray-600 pt-1">PAM: {pam} mmHg</div>}
                                </div>

                                <VitalInput label="Température" name="temperature" unit="°C" icon={Thermometer} step="0.1" />
                                <VitalInput label="Glycémie" name="glycemie" unit="g/L" icon={Droplet} step="0.01" />
                                <div className="md:col-span-2">
                                    <GCSCalculator 
                                        eye={formData.gcs_eye||''} 
                                        verbal={formData.gcs_verbal||''} 
                                        motor={formData.gcs_motor||''} 
                                        onChange={(e, v, m) => setFormData(prev => ({...prev, gcs_eye: e, gcs_verbal: v, gcs_motor: m}))}
                                    />
                                </div>
                            </div>

                            {/* Bilan ABCDE */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-4 flex items-center"><Activity size={18} className="mr-2"/> Bilan Primaire (ABCDE)</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <ABCDEBlock letter="A" title="Airway (Voies Aériennes)" value={formData.bilanPrimaireA} status={formData.bilanPrimaireA_Status} onChange={(v, s) => setFormData(prev => ({...prev, bilanPrimaireA: v, bilanPrimaireA_Status: s as any}))} />
                                    <ABCDEBlock letter="B" title="Breathing (Respiration)" value={formData.bilanPrimaireB} status={formData.bilanPrimaireB_Status} onChange={(v, s) => setFormData(prev => ({...prev, bilanPrimaireB: v, bilanPrimaireB_Status: s as any}))} />
                                    <ABCDEBlock letter="C" title="Circulation" value={formData.bilanPrimaireC} status={formData.bilanPrimaireC_Status} onChange={(v, s) => setFormData(prev => ({...prev, bilanPrimaireC: v, bilanPrimaireC_Status: s as any}))} />
                                    <ABCDEBlock letter="D" title="Disability (Neurologique)" value={formData.bilanPrimaireD} status={formData.bilanPrimaireD_Status} onChange={(v, s) => setFormData(prev => ({...prev, bilanPrimaireD: v, bilanPrimaireD_Status: s as any}))} />
                                    <ABCDEBlock letter="E" title="Exposure (Environnement)" value={formData.bilanPrimaireE} status={formData.bilanPrimaireE_Status} onChange={(v, s) => setFormData(prev => ({...prev, bilanPrimaireE: v, bilanPrimaireE_Status: s as any}))} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'lesionnel' && (
                        <div className="flex flex-col lg:flex-row gap-6 animate-slide-in h-full">
                            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 flex flex-col">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Localisation</h3>
                                <div className="flex-1 min-h-[400px]">
                                    <BodyMap 
                                        injuries={formData.injuries || []} 
                                        onAddInjury={handleAddInjury} 
                                        onRemoveInjury={handleRemoveInjury} 
                                    />
                                </div>
                            </div>
                            <div className="lg:w-1/3 space-y-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-3">Analyse de la Plainte (PQRST)</h3>
                                    <div className="space-y-3">
                                        <div><label className="label">Plainte Principale</label><input name="plaintePrincipale" value={formData.plaintePrincipale} onChange={handleChange} className="input font-semibold" placeholder="Ex: Douleur Thoracique"/></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-2"><label className="label">P (Provoqué/Pallié)</label><input name="pqrst_p" value={formData.pqrst_p} onChange={handleChange} className="input text-sm" placeholder="Effort, Repos..."/></div>
                                            <div className="col-span-2"><label className="label">Q (Qualité)</label><input name="pqrst_q" value={formData.pqrst_q} onChange={handleChange} className="input text-sm" placeholder="Brûlure, Serrement..."/></div>
                                            <div className="col-span-2"><label className="label">R (Région/Irradiation)</label><input name="pqrst_r" value={formData.pqrst_r} onChange={handleChange} className="input text-sm" placeholder="Rétrosternal -> Bras G..."/></div>
                                            <div><label className="label">S (Sévérité /10)</label><input type="number" max="10" name="pqrst_s" value={formData.pqrst_s} onChange={handleChange} className="input text-sm"/></div>
                                            <div><label className="label">T (Temps)</label><input name="pqrst_t" value={formData.pqrst_t} onChange={handleChange} className="input text-sm" placeholder="Depuis 30 min..."/></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 flex flex-col h-[400px]">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex justify-between items-center">
                                        <span>Liste des lésions</span>
                                        <span className="text-xs font-normal text-gray-500">{formData.injuries?.length || 0} marquée(s)</span>
                                    </h3>
                                    {(formData.injuries || []).length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 italic text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                            <p>Aucune lésion.</p>
                                            <p className="text-xs">Cliquez sur le schéma pour ajouter.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                                            {formData.injuries?.map((inj, idx) => (
                                                <div key={inj.id} className="p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/30 group transition-all hover:shadow-sm hover:border-primary/30">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-[10px] font-bold text-gray-700 dark:text-gray-300">
                                                                {idx + 1}
                                                            </span>
                                                            <span className={`w-2 h-2 rounded-full ${
                                                                inj.type === 'wound' ? 'bg-red-500' : 
                                                                inj.type === 'bruise' ? 'bg-purple-500' : 
                                                                inj.type === 'burn' ? 'bg-orange-500' : 'bg-blue-500'
                                                            }`}></span>
                                                            <span className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                                                                {inj.type === 'wound' ? 'Plaie' : 
                                                                 inj.type === 'bruise' ? 'Hématome' : 
                                                                 inj.type === 'burn' ? 'Brûlure' : 'Douleur'}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveInjury(inj.id)} 
                                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                            title="Supprimer"
                                                        >
                                                            <X size={14}/>
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={inj.description || ''} 
                                                        onChange={(e) => handleUpdateInjury(inj.id, { description: e.target.value })}
                                                        className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder="Ajouter une description..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'histoire' && (
                        <div className="space-y-6 animate-slide-in">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-4">Mnémonique SAMPLE</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
                                        <span className="font-bold text-gray-400">S</span>
                                        <input name="sampleSignes" value={formData.sampleSignes} onChange={handleChange} className="input" placeholder="Signes & Symptômes associés" />
                                    </div>
                                    <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
                                        <span className="font-bold text-gray-400">A</span>
                                        <input name="allergies" value={formData.allergies} onChange={handleChange} className="input border-red-200 focus:border-red-500" placeholder="Allergies connues" />
                                    </div>
                                    <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
                                        <span className="font-bold text-gray-400">M</span>
                                        <input name="sampleMedicaments" value={formData.sampleMedicaments} onChange={handleChange} className="input" placeholder="Traitements en cours" />
                                    </div>
                                    <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
                                        <span className="font-bold text-gray-400">P</span>
                                        <input name="antecedents" value={formData.antecedents} onChange={handleChange} className="input" placeholder="Passé médical / Chirurgical" />
                                    </div>
                                    <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
                                        <span className="font-bold text-gray-400">L</span>
                                        <input name="sampleDernierRepas" value={formData.sampleDernierRepas} onChange={handleChange} className="input" placeholder="Last Meal (Dernier repas)" />
                                    </div>
                                    <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
                                        <span className="font-bold text-gray-400">E</span>
                                        <textarea name="sampleEvenements" value={formData.sampleEvenements} onChange={handleChange} className="input" rows={2} placeholder="Events (Événements ayant conduit à l'appel)" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                <label className="label">Observations Libres / Conclusion</label>
                                <textarea name="observations" value={formData.observations} onChange={handleChange} className="input" rows={6} placeholder="Synthèse, hypothèses diagnostiques..." />
                            </div>
                        </div>
                    )}

                    {activeTab === 'interventions' && (
                        <div className="space-y-6 animate-slide-in">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-4 flex items-center">
                                    <Ambulance size={18} className="mr-2"/> Historique des Interventions
                                </h3>
                                {associatedInterventions.length === 0 ? (
                                    <p className="text-gray-500 italic text-center py-8">Aucune intervention enregistrée pour ce patient.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-left">
                                                    <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                                                    <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Type</th>
                                                    <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                                                    <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Équipe</th>
                                                    <th className="p-3 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {associatedInterventions.map((intervention) => (
                                                    <tr key={intervention.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="p-3 whitespace-nowrap">
                                                            <div className="font-medium">{new Date(intervention.dateCreation).toLocaleDateString()}</div>
                                                            <div className="text-xs text-gray-500">{new Date(intervention.dateCreation).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                                intervention.type === 'Urgence' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {intervention.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                                intervention.status === 'Terminé' ? 'bg-green-100 text-green-700' : 
                                                                intervention.status === 'En cours' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {intervention.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300">{intervention.equipe || '-'}</td>
                                                        <td className="p-3 text-gray-600 dark:text-gray-400 italic max-w-xs truncate" title={intervention.notes}>
                                                            {intervention.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="space-y-6 animate-slide-in">
                            {/* AJOUT DOCUMENT */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                <h3 className="font-bold text-primary mb-4 flex items-center"><Camera size={18} className="mr-2"/> Ajouter un document ou scanner</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="label">Nom du document</label>
                                            <input 
                                                type="text" 
                                                value={newDoc.name} 
                                                onChange={e => setNewDoc({...newDoc, name: e.target.value})} 
                                                className="input w-full" 
                                                placeholder="Ex: Ordonnance, ECG..."
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Type</label>
                                            <select 
                                                value={newDoc.type} 
                                                onChange={e => setNewDoc({...newDoc, type: e.target.value})}
                                                className="input w-full"
                                            >
                                                <option>Ordonnance</option>
                                                <option>Identité</option>
                                                <option>Analyse</option>
                                                <option>ECG</option>
                                                <option>Compte Rendu</option>
                                                <option>Autre</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            {/* Bouton pour upload fichier standard */}
                                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 btn-secondary flex justify-center items-center">
                                                <UploadCloud size={18} className="mr-2"/> Importer
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileSelect} 
                                                className="hidden" 
                                                accept="image/*,.pdf" 
                                            />

                                            {/* Bouton pour caméra (mobile) */}
                                            <button onClick={() => cameraInputRef.current?.click()} className="flex-1 btn-secondary flex justify-center items-center">
                                                <Camera size={18} className="mr-2"/> Scanner
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={cameraInputRef} 
                                                onChange={handleFileSelect} 
                                                className="hidden" 
                                                accept="image/*" 
                                                capture="environment" // Force camera on mobile
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Preview Zone */}
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50 min-h-[200px]">
                                        {newDoc.file ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                {newDoc.file.startsWith('data:image') ? (
                                                    <img src={newDoc.file} alt="Preview" className="max-h-48 rounded shadow-sm object-contain" />
                                                ) : (
                                                    <div className="text-center">
                                                        <FileText size={48} className="mx-auto text-gray-400 mb-2"/>
                                                        <span className="text-sm font-medium">Document PDF</span>
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={addDocument} 
                                                    className="absolute -bottom-2 right-0 btn-primary shadow-lg flex items-center"
                                                >
                                                    <Plus size={16} className="mr-1"/> Ajouter
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <ImageIcon size={32} className="mx-auto mb-2 opacity-50"/>
                                                <p className="text-xs">Aperçu du document</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* LISTE DOCUMENTS */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Documents du patient ({formData.documents?.length || 0})</h3>
                                {formData.documents && formData.documents.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {formData.documents.map(doc => (
                                            <div key={doc.id} className="border dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50 hover:shadow-md transition-shadow relative group">
                                                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center overflow-hidden">
                                                    {doc.url.startsWith('data:image') ? (
                                                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileText size={32} className="text-gray-400"/>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold truncate">{doc.name}</div>
                                                <div className="text-[10px] text-gray-500">{doc.type} • {new Date(doc.dateAdded).toLocaleDateString()}</div>
                                                
                                                {/* Actions Overlay */}
                                                <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const win = window.open();
                                                            win?.document.write(`<iframe src="${doc.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                        }} 
                                                        className="p-2 bg-white rounded-full hover:bg-blue-50 text-blue-600" 
                                                        title="Voir"
                                                    >
                                                        <Eye size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => removeDocument(doc.id)} 
                                                        className="p-2 bg-white rounded-full hover:bg-red-50 text-red-600" 
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 py-8 italic">Aucun document attaché.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
            <style>{`.label { @apply block text-xs font-bold uppercase text-gray-500 mb-1; }`}</style>
        </div>
    );
};

const PatientStats: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const total = patients.length;
    const avgAge = Math.round(patients.reduce((acc, p) => acc + (parseInt(p.age) || 0), 0) / (total || 1));
    const recent = patients.filter(p => new Date(p.dateCreation) > new Date(Date.now() - 86400000)).length;
    const critical = patients.filter(p => p.scoreGlasgow && parseInt(p.scoreGlasgow) < 13).length;

    const StatBox = ({ label, value, icon: Icon, color }: any) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex items-center">
            <div className={`p-3 rounded-full mr-4 bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">{label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox label="Total Patients" value={total} icon={User} color="blue" />
            <StatBox label="Nouveaux (24h)" value={recent} icon={Clock} color="green" />
            <StatBox label="Âge Moyen" value={`${avgAge} ans`} icon={Calendar} color="purple" />
            <StatBox label="Critiques" value={critical} icon={AlertCircle} color="red" />
        </div>
    );
};

interface PatientsProps {
    context?: ViewContext;
    setContext?: (context: ViewContext) => void;
}

const Patients: React.FC<PatientsProps> = ({ context, setContext }) => {
    const { patients = [], addPatient, updatePatient, deletePatient } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [viewingReportPatient, setViewingReportPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = useMemo(() => {
        return patients.filter(p =>
            `${p.prenom} ${p.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
    }, [patients, searchTerm]);

    const handleSave = (patient: Patient) => {
        if (patients.some(p => p.id === patient.id)) {
            updatePatient(patient);
        } else {
            addPatient(patient);
        }
        setIsFormOpen(false);
        setEditingPatient(undefined);
    };

    const handleDelete = () => {
        if (deletingPatient) {
            deletePatient(deletingPatient.id);
            setDeletingPatient(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold dark:text-gray-100">Gestion des Patients</h1>
                <button onClick={() => { setEditingPatient(undefined); setIsFormOpen(true); }} className="btn-primary flex items-center shadow-lg">
                    <Plus size={20} className="mr-2" />
                    Nouveau Dossier
                </button>
            </div>

            <PatientStats patients={patients} />

            {isFormOpen && <PatientForm patient={editingPatient} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
            
            {viewingReportPatient && (
                <PatientReportModal 
                    patient={viewingReportPatient} 
                    onClose={() => setViewingReportPatient(null)}
                />
            )}

            <ConfirmationModal isOpen={!!deletingPatient} onClose={() => setDeletingPatient(null)} onConfirm={handleDelete} title="Confirmer la suppression">
                <p>Êtes-vous sûr de vouloir supprimer le dossier de <strong>{deletingPatient?.prenom} {deletingPatient?.nom}</strong> ?</p>
            </ConfirmationModal>

            <Card className="!p-0 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                     <div className="relative max-w-md">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un patient (Nom, Prénom)..." className="w-full pl-10 input bg-white dark:bg-gray-700" />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">
                            <tr>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Âge / Sexe</th>
                                <th className="p-4">Derniers Vitaux</th>
                                <th className="p-4">Motif Admission</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredPatients.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors" onClick={() => { setEditingPatient(p); setIsFormOpen(true); }}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {p.nom.charAt(0)}{p.prenom.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-gray-100">{p.nom} {p.prenom}</div>
                                                <div className="text-xs text-gray-500">{new Date(p.dateCreation).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium">{p.age ? `${p.age} ans` : 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{p.sexe}</div>
                                    </td>
                                    <td className="p-4">
                                        {p.taSystolique ? (
                                            <div className="flex gap-2 text-xs font-mono">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">TA {p.taSystolique}/{p.taDiastolique}</span>
                                                <span className={`px-2 py-1 rounded ${parseInt(p.spO2) < 95 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>SpO2 {p.spO2}%</span>
                                            </div>
                                        ) : <span className="text-gray-400 italic text-xs">Non renseigné</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium max-w-xs truncate">{p.motifAppel || '-'}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setViewingReportPatient(p)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors" title="PDF"><FileText size={18}/></button>
                                            <button onClick={() => { setEditingPatient(p); setIsFormOpen(true); }} className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-primary/10 dark:hover:bg-gray-600 transition-colors"><Edit size={18}/></button>
                                            <button onClick={() => setDeletingPatient(p)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-gray-600 transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {patients.length > 0 && filteredPatients.length === 0 && <p className="text-center text-gray-500 py-12">Aucun patient trouvé.</p>}
                    {patients.length === 0 && <p className="text-center text-gray-500 py-12">Aucun patient enregistré.</p>}
                </div>
            </Card>
        </div>
    );
};

export default Patients;
