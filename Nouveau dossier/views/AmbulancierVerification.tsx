
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { Check, AlertCircle, Send, Calendar, Clock, User, History, Eye, Printer, X, Edit, Trash2, Fuel, Ambulance, Plus } from 'lucide-react';
// FIX: Corrected import path for types to be relative.
import { VerificationRecord } from '../types';
import { useTranslation } from '../providers/LanguageProvider';
// FIX: Corrected import path to be relative.
import { useData } from '../providers/DataProvider';
// FIX: Corrected import path to be relative.
import { useAuth } from '../providers/AuthProvider';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNotification } from '../providers/NotificationProvider';

type ChecklistValue = string | null;
type ChecklistState = Record<string, ChecklistValue>;

interface VerificationInfo {
    user: string;
    date: Date;
    vehicleId: string;
}

// Composant Jauge Carburant Visuelle
const FuelGauge: React.FC<{ value: ChecklistValue; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const levels = [
        { label: 'E', value: 'Vide', color: 'bg-red-500', hover: 'hover:bg-red-600' },
        { label: '1/4', value: '1/4', color: 'bg-orange-400', hover: 'hover:bg-orange-500' },
        { label: '1/2', value: '1/2', color: 'bg-yellow-400', hover: 'hover:bg-yellow-500' },
        { label: '3/4', value: '3/4', color: 'bg-lime-500', hover: 'hover:bg-lime-600' },
        { label: 'F', value: 'Plein', color: 'bg-green-500', hover: 'hover:bg-green-600' },
    ];

    return (
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <Fuel size={18} className="text-gray-500 ml-1" />
            <div className="flex space-x-1">
                {levels.map(level => (
                    <button
                        key={level.value}
                        onClick={() => onChange(level.value)}
                        className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${
                            value === level.value 
                                ? `${level.color} text-white ring-2 ring-gray-400 ring-offset-1 scale-105` 
                                : `bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200`
                        }`}
                    >
                        {level.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const AmbulancierVerification: React.FC = () => {
    const { language } = useTranslation();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    const { 
        verifications = [], addVerification, updateVerification, deleteVerification,
        ambulancierChecklistItems = {},
        vehicules = [],
        headerInfo 
    } = useData();
    
    const [checklist, setChecklist] = useState<ChecklistState>({});
    const [comments, setComments] = useState('');
    const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
    const [vehicleIdInput, setVehicleIdInput] = useState('');
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<VerificationRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<VerificationRecord | null>(null);

    const history = useMemo(() => verifications.filter(v => v.type === 'Ambulancier'), [verifications]);
    const user = currentUser?.nom || 'Utilisateur inconnu';

    const handleStartVerification = () => {
        if (!vehicleIdInput.trim()) {
            addNotification("Veuillez sélectionner le véhicule.", 'error');
            return;
        }
        setVerificationInfo({
            user: user,
            date: new Date(),
            vehicleId: vehicleIdInput.trim(),
        });
    };

    const handleEdit = (record: VerificationRecord) => {
        setEditingRecord(record);
        setChecklist(record.data);
        setComments(record.comments);
        setVerificationInfo({
            user: record.user,
            date: new Date(record.date),
            vehicleId: record.vehicleId,
        });
        setActiveTab('new');
    };

    const handleCancel = () => {
        setEditingRecord(null);
        setChecklist({});
        setComments('');
        setVerificationInfo(null);
        setVehicleIdInput('');
        setActiveTab('history');
    };

    const handleStatusChange = (item: string, value: ChecklistValue) => {
        setChecklist(prev => ({ ...prev, [item]: prev[item] === value ? null : value }));
    };

    const handleSubmit = () => {
        if (editingRecord) {
            const updatedRecord = { ...editingRecord, data: checklist, comments: comments };
            updateVerification(updatedRecord);
            addNotification('Vérification mise à jour avec succès !', 'success');
        } else {
            if (!verificationInfo) return;
            const totalItems = Object.values(ambulancierChecklistItems).flat().length;
            const newRecord: VerificationRecord = {
                id: Date.now().toString(),
                date: verificationInfo.date.toISOString(),
                user: verificationInfo.user,
                vehicleId: verificationInfo.vehicleId,
                type: 'Ambulancier',
                data: checklist,
                comments: comments,
                completed: Object.values(checklist).length === totalItems && totalItems > 0
            };
            addVerification(newRecord);
            addNotification('Checklist soumise avec succès !', 'success');
        }
        handleCancel();
    };

    const handleDelete = () => {
        if (deletingRecord) {
            deleteVerification(deletingRecord.id);
            setDeletingRecord(null);
        }
    };

    const handlePrint = (record: VerificationRecord) => {
        const hasProblems = Object.values(record.data).includes('Problème');
        const statusText = hasProblems ? 'Problèmes signalés' : 'Conforme';
        const statusColor = hasProblems ? '#DC3545' : '#28A745';

        let printContent = `
            <html>
            <head>
                <title>Fiche Contrôle Ambulancier - ${record.vehicleId}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
                    body { font-family: 'Roboto', sans-serif; margin: 0; padding: 20px; color: #333; font-size: 11px; -webkit-print-color-adjust: exact; }
                    .container { max-width: 210mm; margin: auto; }
                    
                    /* Header Styling */
                    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; border-bottom: 2px solid #0056b3; margin-bottom: 20px; }
                    .header-left { display: flex; align-items: center; gap: 15px; }
                    .logo { height: 50px; width: auto; object-fit: contain; }
                    .company-info { font-size: 10px; color: #555; line-height: 1.3; }
                    .company-name { font-size: 16px; font-weight: bold; color: #0056b3; text-transform: uppercase; margin-bottom: 2px; }
                    
                    .header-right { text-align: right; }
                    .doc-title { font-size: 22px; font-weight: 900; text-transform: uppercase; color: #222; margin: 0; letter-spacing: 1px; }
                    .doc-ref { font-size: 10px; color: #888; margin-top: 4px; font-family: monospace; }
                    .status-badge { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 4px; color: white; font-weight: bold; font-size: 12px; text-transform: uppercase; background-color: ${statusColor}; }

                    /* Info Banner */
                    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f4f6f8; padding: 12px; border-radius: 6px; border: 1px solid #e1e4e8; margin-bottom: 25px; }
                    .info-item { display: flex; flex-direction: column; }
                    .info-label { font-size: 9px; text-transform: uppercase; color: #6c757d; font-weight: bold; margin-bottom: 2px; }
                    .info-value { font-size: 13px; font-weight: bold; color: #212529; }

                    /* Checklist Layout - Multi-column */
                    .checklist-container { column-count: 2; column-gap: 25px; }
                    .category { break-inside: avoid; margin-bottom: 20px; border: 1px solid #eee; border-radius: 6px; padding: 10px; background: #fff; }
                    .category-title { font-size: 12px; font-weight: bold; color: #0056b3; border-bottom: 2px solid #e9ecef; padding-bottom: 6px; margin-bottom: 8px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
                    
                    /* Items */
                    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dotted #eee; font-size: 11px; }
                    .item-row:last-child { border-bottom: none; }
                    .item-name { font-weight: 500; color: #444; }
                    
                    .status-box { font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 2px 6px; border-radius: 3px; min-width: 25px; text-align: center; }
                    .status-ok { color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; }
                    .status-problem { color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; }
                    .status-empty { color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; }
                    .status-fuel { color: #004085; background-color: #cce5ff; border: 1px solid #b8daff; }

                    /* Comments */
                    .comments-section { margin-top: 20px; padding: 15px; border: 1px solid #dee2e6; background: #fdfdfe; border-radius: 6px; min-height: 60px; }
                    .comments-label { font-weight: bold; color: #495057; font-size: 12px; margin-bottom: 5px; display: block; }
                    .comments-text { font-style: italic; color: #555; }

                    /* Signatures */
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
                    .sig-box { border-top: 1px solid #ccc; padding-top: 10px; text-align: center; font-size: 11px; color: #555; }
                    .sig-title { font-weight: bold; text-transform: uppercase; margin-bottom: 30px; display: block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-left">
                            ${headerInfo?.logo ? `<img src="${headerInfo.logo}" alt="Logo" class="logo"/>` : ''}
                            <div class="company-info">
                                <div class="company-name">${headerInfo?.companyName || 'MedEvac Services'}</div>
                                <div>${headerInfo?.address.replace(/\n/g, '<br>')}</div>
                                <div>${headerInfo?.phone ? `Tél: ${headerInfo.phone}` : ''}</div>
                                <div>${headerInfo?.email || ''}</div>
                            </div>
                        </div>
                        <div class="header-right">
                            <h1 class="doc-title">Contrôle Ambulancier</h1>
                            <div class="doc-ref">REF: ${record.id.substring(0, 12).toUpperCase()}</div>
                            <span class="status-badge">${statusText}</span>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Date du contrôle</span>
                            <span class="info-value">${new Date(record.date).toLocaleDateString('fr-FR')} <small style="color:#666">${new Date(record.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</small></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Véhicule</span>
                            <span class="info-value" style="font-family:monospace; font-size: 14px;">${record.vehicleId}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Contrôleur</span>
                            <span class="info-value">${record.user}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Validation</span>
                            <span class="info-value">En attente</span>
                        </div>
                    </div>

                    <div class="checklist-container">
        `;

        Object.entries(ambulancierChecklistItems).forEach(([category, items]) => {
            printContent += `
                <div class="category">
                    <div class="category-title">${category}</div>
                    <div>`;
            
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const val = record.data[item];
                    let statusClass = 'status-empty';
                    let displayVal = val || '-';

                    if (val === 'OK') { statusClass = 'status-ok'; }
                    else if (val === 'Problème') { statusClass = 'status-problem'; displayVal = 'NOK'; }
                    else if (item === 'Niveau de carburant' && val) { statusClass = 'status-fuel'; }

                    printContent += `
                        <div class="item-row">
                            <span class="item-name">${item}</span>
                            <span class="status-box ${statusClass}">${displayVal}</span>
                        </div>`;
                });
            }
            printContent += `</div></div>`;
        });

        printContent += `
                    </div> <!-- End checklist-container -->

                    <div class="category">
                        <div class="comments-section">
                            <span class="comments-label">OBSERVATIONS & ANOMALIES</span>
                            <div class="comments-text">
                                ${record.comments ? record.comments.replace(/\n/g, '<br>') : 'Aucune observation particulière signalée.'}
                            </div>
                        </div>
                    </div>

                    <div class="signatures">
                        <div class="sig-box">
                            <span class="sig-title">Signature Ambulancier</span>
                            <div style="font-family: 'Brush Script MT', cursive; font-size: 18px; color: #0056b3;">${record.user}</div>
                        </div>
                        <div class="sig-box">
                            <span class="sig-title">Visa Chef de Parc / Superviseur</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const renderVerificationForm = () => {
        if (!verificationInfo) {
            const now = new Date();
            return (
                 <div className="flex justify-center items-start pt-10 md:pt-16 h-full">
                    <Card className="max-w-md w-full shadow-lg border-t-4 border-primary">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center"><Ambulance size={28} className="mr-3 text-primary"/>Checklist Ambulance</h2>
                        <div className="space-y-4 text-gray-600 dark:text-gray-300">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center"><Calendar size={18} className="mr-3 text-primary" /><span>Date</span></div>
                                <span className="font-mono font-bold">{now.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center"><Clock size={18} className="mr-3 text-primary" /><span>Heure</span></div>
                                <span className="font-mono font-bold">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center"><User size={18} className="mr-3 text-primary" /><span>Opérateur</span></div>
                                <span className="font-bold">{user}</span>
                            </div>
                        </div>
                        <div className="mt-8">
                            <label htmlFor="vehicleId" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sélectionner le Véhicule <span className="text-danger">*</span></label>
                            <select 
                                id="vehicleId" 
                                value={vehicleIdInput} 
                                onChange={(e) => setVehicleIdInput(e.target.value)}
                                className="input w-full p-3 text-lg"
                            >
                                <option value="">-- Choisir --</option>
                                {vehicules.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="mt-8">
                            <button 
                                onClick={handleStartVerification} 
                                disabled={!vehicleIdInput.trim()} 
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                            >
                                Commencer le contrôle <Check size={20} className="ml-2"/>
                            </button>
                        </div>
                    </Card>
                </div>
            );
        }
        return (
            <Card className="shadow-lg">
                <div className="flex justify-between items-center border-b pb-4 mb-6 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-primary flex items-center"><Ambulance size={24} className="mr-2"/> {verificationInfo.vehicleId}</h2>
                        <p className="text-sm text-gray-500">Contrôle en cours par {verificationInfo.user}</p>
                    </div>
                    <button onClick={handleCancel} className="btn-secondary text-sm">Annuler</button>
                </div>

                <div className="space-y-8">
                    {Object.entries(ambulancierChecklistItems).map(([category, items]) => (
                        <div key={category} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 border-l-4 border-primary pl-3">{category}</h3>
                            <div className="space-y-3">
                                {Array.isArray(items) && items.map(item => (
                                    <div key={item} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded shadow-sm hover:shadow-md transition-shadow">
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{item}</span>
                                        {item === "Niveau de carburant" ? (
                                            <FuelGauge value={checklist[item]} onChange={(value) => handleStatusChange(item, value)} />
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleStatusChange(item, 'OK')} className={`px-4 py-1.5 text-sm font-bold rounded-md flex items-center transition-colors ${checklist[item] === 'OK' ? 'bg-success text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}><Check size={16} className="mr-1"/> OK</button>
                                                <button onClick={() => handleStatusChange(item, 'Problème')} className={`px-4 py-1.5 text-sm font-bold rounded-md flex items-center transition-colors ${checklist[item] === 'Problème' ? 'bg-danger text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}><AlertCircle size={16} className="mr-1"/> NOK</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                     <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-2 flex items-center"><AlertCircle size={16} className="mr-2"/> Observations / Anomalies détectées</label>
                     <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} className="input w-full border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500" placeholder="Décrivez les problèmes éventuels ou ajoutez des remarques..."/>
                </div>

                <div className="mt-8 flex justify-end space-x-4 border-t pt-4 dark:border-gray-700">
                    <button onClick={handleSubmit} className="btn-primary flex items-center text-lg px-8 py-3 shadow-lg transform hover:scale-105 transition-all">
                        <Send size={20} className="mr-2"/>
                        {editingRecord ? 'Mettre à jour' : 'Valider le Contrôle'}
                    </button>
                </div>
            </Card>
        );
    };

    const renderHistory = () => (
        <Card className="overflow-hidden p-0">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 dark:text-gray-300">Historique des contrôles</h3>
                <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{history.length} fiches</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/30 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">
                        <tr>
                            <th className="p-4">Date / Heure</th>
                            <th className="p-4">Véhicule</th>
                            <th className="p-4">Contrôleur</th>
                            <th className="p-4 text-center">État</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
                             const hasProblems = Object.values(record.data).includes('Problème');
                             return (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{new Date(record.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="p-4 font-mono text-primary font-semibold">{record.vehicleId}</td>
                                    <td className="p-4 text-sm">{record.user}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hasProblems ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                            {hasProblems ? <><AlertCircle size={12} className="mr-1"/> Problèmes</> : <><Check size={12} className="mr-1"/> Conforme</>}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => setSelectedRecord(record)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title="Voir les détails"><Eye size={18}/></button>
                                            <button onClick={() => handlePrint(record)} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" title="Imprimer PDF"><Printer size={18} /></button>
                                            <button onClick={() => handleEdit(record)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors" title="Modifier"><Edit size={18}/></button>
                                            {(currentUser?.role === 'admin' || record.user === currentUser?.nom) && (
                                                <button onClick={() => setDeletingRecord(record)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Supprimer"><Trash2 size={18}/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
                {history.length === 0 && <div className="text-center text-gray-500 py-12 flex flex-col items-center"><History size={48} className="opacity-20 mb-2"/><p>Aucun historique de vérification.</p></div>}
            </div>
        </Card>
    );
    
    const renderDetailsModal = () => {
        if (!selectedRecord) return null;
        const hasProblems = Object.values(selectedRecord.data).includes('Problème');
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4 backdrop-blur-sm">
                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-start border-b pb-4 mb-6 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <Ambulance className="mr-2 text-primary" size={24}/> Détails Contrôle {selectedRecord.vehicleId}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(selectedRecord.date).toLocaleString()} par <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedRecord.user}</span>
                            </p>
                        </div>
                        <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={24} /></button>
                    </div>

                    <div className="mb-6 flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300">État Global</span>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide flex items-center ${hasProblems ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {hasProblems ? <><AlertCircle size={16} className="mr-2"/> Problèmes Détectés</> : <><Check size={16} className="mr-2"/> Véhicule Conforme</>}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(ambulancierChecklistItems).map(([category, items]) => (
                            <div key={category} className="border dark:border-gray-700 rounded-lg p-4">
                                <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wider">{category}</h3>
                                <ul className="space-y-2">
                                    {Array.isArray(items) && items.map(item => (
                                        <li key={item} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">{item}</span>
                                            <span className={`font-semibold ${
                                                selectedRecord.data[item] === 'Problème' ? 'text-red-600' : 
                                                selectedRecord.data[item] === 'OK' ? 'text-green-600' : 
                                                selectedRecord.data[item] ? 'text-blue-600' : 'text-gray-400'
                                            }`}>
                                                {selectedRecord.data[item] || 'N/A'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                     <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><AlertCircle size={16} className="mr-2"/> Commentaires</h3>
                        <p className="text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-4 rounded border dark:border-gray-700">
                            {selectedRecord.comments || 'Aucun commentaire.'}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={() => handlePrint(selectedRecord)} className="btn-primary flex items-center">
                            <Printer size={18} className="mr-2"/> Imprimer le rapport
                        </button>
                    </div>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold dark:text-gray-100 flex items-center"><Check size={32} className="mr-3 text-primary"/>Vérification Ambulancier</h1>
            
            <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border dark:border-gray-700 w-fit mb-6">
                <button 
                    onClick={() => setActiveTab('new')} 
                    className={`flex items-center px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'new' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <Plus size={16} className="mr-2"/> Nouvelle Vérification
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex items-center px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <History size={16} className="mr-2"/> Historique
                </button>
            </div>

            <ConfirmationModal
                isOpen={!!deletingRecord}
                onClose={() => setDeletingRecord(null)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
            >
                <p>Êtes-vous sûr de vouloir supprimer la vérification du <strong>{deletingRecord && new Date(deletingRecord.date).toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES')}</strong> ?</p>
                <p className="mt-2 text-sm text-danger font-bold">Cette action est irréversible.</p>
            </ConfirmationModal>
            
            {activeTab === 'new' ? renderVerificationForm() : renderHistory()}
            {renderDetailsModal()}
        </div>
    );
};

export default AmbulancierVerification;
