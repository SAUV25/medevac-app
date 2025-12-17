import React, { useState, useMemo, useEffect } from 'react';
// FIX: Corrected import path for types to be relative.
import { Receipt, ReceiptItem, Tarif, Patient, ModificationLog, HeaderInfo } from '../types';
import Card from '../components/Card';
import { Plus, X, Printer, Trash2, Edit, History, Search, XCircle, User, ShoppingCart, CheckCircle, Minus, FileText, Calculator, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { useTranslation } from '../providers/LanguageProvider';
// FIX: Corrected import path to be relative.
import { useData } from '../providers/DataProvider';
// FIX: Corrected import path to be relative.
import { useAuth } from '../providers/AuthProvider';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNotification } from '../providers/NotificationProvider';

// --- Sub-components ---

const ReceiptStats: React.FC<{ receipts: Receipt[] }> = ({ receipts }) => {
    const totalRevenue = receipts.reduce((acc, r) => acc + r.total, 0);
    const averageBasket = receipts.length > 0 ? totalRevenue / receipts.length : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="flex items-center p-4 border-l-4 border-green-500 bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-gray-800/50">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4 shadow-sm">
                    <Wallet size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Chiffre d'Affaires</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalRevenue.toFixed(2)} <span className="text-sm font-normal text-gray-500">MAD</span></p>
                </div>
            </Card>
            
            <Card className="flex items-center p-4 border-l-4 border-blue-500 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-800/50">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4 shadow-sm">
                    <FileText size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Reçus Émis</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{receipts.length}</p>
                </div>
            </Card>

            <Card className="flex items-center p-4 border-l-4 border-purple-500 bg-gradient-to-r from-white to-purple-50 dark:from-gray-800 dark:to-gray-800/50">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4 shadow-sm">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Panier Moyen</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{averageBasket.toFixed(2)} <span className="text-sm font-normal text-gray-500">MAD</span></p>
                </div>
            </Card>
        </div>
    );
};

const ReceiptForm: React.FC<{ 
    receipt?: Receipt; 
    onSave: (receipt: Receipt) => void; 
    onCancel: () => void; 
    lastReceiptNumber: number; 
    tarifs: Tarif[], 
    patients: Patient[] 
}> = ({ receipt, onSave, onCancel, lastReceiptNumber, tarifs, patients }) => {
    const isEditing = !!receipt;
    
    const [formData, setFormData] = useState(() => {
        const defaults = {
            patientId: '',
            patientName: '',
            patientAddress: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            items: [] as ReceiptItem[],
        };
        if (isEditing) {
            const patient = receipt.patientId ? patients.find(p => p.id === receipt.patientId) : null;
            return {
                patientId: receipt.patientId || '',
                patientName: receipt.patientName || (patient ? `${patient.prenom} ${patient.nom}`: ''),
                patientAddress: receipt.patientAddress || '',
                date: new Date(receipt.date).toISOString().split('T')[0],
                notes: receipt.notes || '',
                items: receipt.items || [],
            }
        }
        return defaults;
    });

    const [filterService, setFilterService] = useState('');

    const numero = useMemo(() => {
        if (isEditing) return receipt.numero;
        const year = new Date().getFullYear();
        const nextId = (lastReceiptNumber + 1).toString().padStart(4, '0');
        return `REC-${year}-${nextId}`;
    }, [lastReceiptNumber, isEditing, receipt]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'patientId' && value) {
            const selectedPatient = patients.find(p => p.id === value);
            if (selectedPatient) {
                setFormData(prev => ({ 
                    ...prev, 
                    patientName: `${selectedPatient.prenom} ${selectedPatient.nom}`,
                    patientAddress: selectedPatient.adresse || ''
                }));
            }
        }
    };

    const handleAddItem = (tarif: Tarif) => {
        setFormData(prev => {
            const existingItem = prev.items.find(item => item.id === tarif.id);
            if (existingItem) {
                return { ...prev, items: prev.items.map(item => item.id === tarif.id ? { ...item, quantite: item.quantite + 1 } : item) };
            }
            return { ...prev, items: [...prev.items, { ...tarif, quantite: 1 }] };
        });
    };

    const handleUpdateQuantity = (itemId: string, change: number) => {
        setFormData(prev => {
            const updatedItems = prev.items.map(item => {
                if (item.id === itemId) {
                    return { ...item, quantite: Math.max(0, item.quantite + change) };
                }
                return item;
            }).filter(item => item.quantite > 0);
            return { ...prev, items: updatedItems };
        });
    };
    
    const handleRemoveItem = (itemId: string) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
    };

    const calculations = useMemo(() => {
        const items = formData.items || [];
        const sousTotal = items.reduce((acc, item) => acc + (item.prix * item.quantite), 0);
        const total = sousTotal;
        return { sousTotal, total };
    }, [formData.items]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: isEditing ? receipt.id : Date.now().toString(),
            numero,
            date: new Date(formData.date).toISOString(),
            items: formData.items || [],
            patientId: formData.patientId,
            patientName: formData.patientName,
            patientAddress: formData.patientAddress,
            notes: formData.notes,
            history: isEditing ? receipt.history : [],
            ...calculations
        });
    };

    const filteredTarifs = tarifs.filter(t => t.description.toLowerCase().includes(filterService.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-6xl h-[90vh] flex flex-col !p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            {isEditing ? <Edit size={20} className="mr-2 text-primary"/> : <Plus size={20} className="mr-2 text-primary"/>}
                            {isEditing ? `Édition Reçu ${numero}` : `Nouveau Reçu ${numero}`}
                        </h2>
                        <p className="text-xs text-gray-500">Date d'émission : {new Date(formData.date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT COLUMN: Patient & Current Items */}
                    <div className="w-full md:w-2/3 flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-900">
                        {/* Patient Info Section */}
                        <div className="p-4 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Patient (Existant)</label>
                                    <div className="relative">
                                        <select name="patientId" value={formData.patientId || ''} onChange={handleChange} className="input w-full pl-8 py-1.5 text-sm">
                                            <option value="">-- Sélection rapide --</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                                        </select>
                                        <User size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Date</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="input w-full py-1.5 text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nom Complet (Facture)</label>
                                    <input type="text" name="patientName" value={formData.patientName} onChange={handleChange} placeholder="Nom du client" className="input w-full py-1.5 font-semibold" />
                                </div>
                                <div className="md:col-span-2">
                                    <input type="text" name="patientAddress" value={formData.patientAddress} onChange={handleChange} placeholder="Adresse de facturation (Optionnel)" className="input w-full py-1.5 text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Items List (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900/50">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <ShoppingCart size={18} className="mr-2"/> Prestations Ajoutées
                            </h3>
                            {formData.items.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                    <ShoppingCart size={40} className="mb-2 opacity-50"/>
                                    <p className="text-sm">Le panier est vide.</p>
                                    <p className="text-xs">Sélectionnez des services à droite.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {formData.items.map(item => (
                                        <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{item.description}</p>
                                                <p className="text-xs text-gray-500">{item.prix.toFixed(2)} MAD / unité</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                                    <button onClick={() => handleUpdateQuantity(item.id!, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition-all"><Minus size={12}/></button>
                                                    <span className="w-8 text-center font-bold text-sm">{item.quantite}</span>
                                                    <button onClick={() => handleUpdateQuantity(item.id!, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition-all"><Plus size={12}/></button>
                                                </div>
                                                <div className="text-right w-20">
                                                    <p className="font-bold text-primary">{(item.prix * item.quantite).toFixed(2)}</p>
                                                </div>
                                                <button onClick={() => handleRemoveItem(item.id!)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Totals */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500 font-medium">Total à payer</span>
                                <span className="text-3xl font-black text-primary">{calculations.total.toFixed(2)} <small className="text-sm font-normal text-gray-500">MAD</small></span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <button type="button" onClick={onCancel} className="btn-secondary flex-1">Annuler</button>
                                <button type="button" onClick={handleSubmit} disabled={formData.items.length === 0} className="btn-primary flex-1 flex justify-center items-center py-3 text-lg shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle size={20} className="mr-2"/> Enregistrer le Reçu
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Catalog */}
                    <div className="hidden md:flex md:w-1/3 bg-gray-50 dark:bg-gray-800/50 flex-col border-l dark:border-gray-700">
                        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Catalogue Services</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher une prestation..." 
                                    value={filterService}
                                    onChange={e => setFilterService(e.target.value)}
                                    className="input w-full pl-9 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filteredTarifs.map(tarif => (
                                <button 
                                    key={tarif.id} 
                                    onClick={() => handleAddItem(tarif)}
                                    className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{tarif.description}</span>
                                        <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"/>
                                    </div>
                                    <div className="mt-1 text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">
                                        {tarif.prix.toFixed(2)} MAD
                                    </div>
                                </button>
                            ))}
                            {filteredTarifs.length === 0 && (
                                <p className="text-center text-gray-400 text-sm mt-8">Aucun service trouvé.</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const HistoryModal: React.FC<{ receipt: Receipt; onClose: () => void }> = ({ receipt, onClose }) => {
    const { language } = useTranslation();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold flex items-center gap-2"><History className="text-primary"/> Historique {receipt.numero}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                {receipt.history && receipt.history.length > 0 ? (
                    <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6 my-4">
                        {receipt.history.slice().reverse().map((log, index) => (
                            <div key={index} className="relative pl-6">
                                <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${log.action === 'created' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                    {log.action === 'created' ? 'Création du reçu' : 'Modification'}
                                </p>
                                <p className="text-xs text-gray-500">Par {log.user}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(log.date).toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES')}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Aucun historique disponible.</p>
                )}
                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="btn-secondary text-sm">Fermer</button>
                </div>
            </Card>
        </div>
    );
};

const Receipts: React.FC = () => {
    const { language } = useTranslation();
    const { currentUser } = useAuth();
    const { 
        receipts = [], addReceipt, updateReceipt, deleteReceipt,
        tarifs = [], 
        patients = [],
        headerInfo
    } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<Receipt | undefined>(undefined);
    const [viewingHistoryOf, setViewingHistoryOf] = useState<Receipt | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deletingReceipt, setDeletingReceipt] = useState<Receipt | null>(null);

    // --- Logic for Receipt Number ---
    const lastReceiptNumber = useMemo(() => {
        if (receipts.length === 0) return 0;
        const sortedReceipts = [...receipts].sort((a, b) => {
            const numA = parseInt(a.numero.split('-')[2] || '0');
            const numB = parseInt(b.numero.split('-')[2] || '0');
            return numA - numB;
        });
        const lastNumero = sortedReceipts[sortedReceipts.length - 1].numero;
        return parseInt(lastNumero.split('-')[2], 10) || 0;
    }, [receipts]);
    
    // --- Handlers ---
    const handleSave = (receipt: Receipt) => {
        if (!currentUser) return;
        const isEditing = receipts.some(r => r.id === receipt.id);
        const user = currentUser?.nom || 'Système';
    
        let updatedReceipt: Receipt;
    
        if (isEditing) {
            const originalReceipt = receipts.find(r => r.id === receipt.id);
            const newHistoryEntry: ModificationLog = {
                date: new Date().toISOString(),
                user,
                action: 'modified'
            };
            const existingHistory = originalReceipt?.history || [];
            updatedReceipt = { ...receipt, history: [...existingHistory, newHistoryEntry] };
            updateReceipt(updatedReceipt);
        } else {
            const newHistoryEntry: ModificationLog = {
                date: new Date().toISOString(),
                user,
                action: 'created'
            };
            updatedReceipt = { ...receipt, history: [newHistoryEntry] };
            addReceipt(updatedReceipt);
        }
    
        setIsFormOpen(false);
        setEditingReceipt(undefined);
    };

     const handleDelete = () => {
        if(deletingReceipt){
            deleteReceipt(deletingReceipt.id);
            setDeletingReceipt(null);
        }
    }

    const handleEdit = (receipt: Receipt) => {
        setEditingReceipt(receipt);
        setIsFormOpen(true);
    };
    
    // --- Filtering ---
    const filteredReceipts = useMemo(() => {
        return receipts.filter(r => {
            const term = searchTerm.toLowerCase();
            const pName = r.patientName || '';
            if (term && !r.numero.toLowerCase().includes(term) && !pName.toLowerCase().includes(term)) {
                return false;
            }

            const receiptDate = new Date(r.date);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (receiptDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (receiptDate > end) return false;
            }

            return true;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [receipts, searchTerm, startDate, endDate]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };
    
    // --- Professional Printing ---
    const handlePrint = (receipt: Receipt) => {
        const printHeaderInfo: HeaderInfo = headerInfo || {
            id: 0, logo: null, companyName: 'MedEvac', address: '', phone: '', email: '', nif: '', rc: '', ice: '', cnss: '', website: ''
        };
        
        let itemsHtml = '';
        receipt.items.forEach((item, index) => {
            const bgClass = index % 2 === 0 ? 'bg-gray-50' : '';
            itemsHtml += `
                <tr class="${bgClass}">
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantite}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.prix.toFixed(2)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${(item.prix * item.quantite).toFixed(2)}</td>
                </tr>`;
        });

        const logoHtml = printHeaderInfo.logo 
            ? `<img src="${printHeaderInfo.logo}" alt="Logo" style="height: 60px; width: auto;" />` 
            : `<h1 style="font-size: 24px; font-weight: bold; color: #2563EB; margin: 0;">${printHeaderInfo.companyName}</h1>`;

        const printContent = `
            <html>
            <head>
                <title>Facture ${receipt.numero}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1F2937; font-size: 14px; -webkit-print-color-adjust: exact; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #E5E7EB; }
                    .company-info { font-size: 12px; color: #4B5563; line-height: 1.5; margin-top: 8px; }
                    .invoice-title { font-size: 32px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: -1px; text-align: right; }
                    .invoice-meta { text-align: right; margin-top: 10px; font-size: 14px; color: #6B7280; }
                    
                    .client-box { background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 40px; display: flex; justify-content: space-between; }
                    .bill-to-label { font-size: 10px; uppercase; font-weight: bold; color: #9CA3AF; letter-spacing: 1px; margin-bottom: 5px; }
                    .client-name { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #111827; color: white; text-transform: uppercase; font-size: 12px; padding: 12px 8px; text-align: left; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    
                    .totals-area { display: flex; justify-content: flex-end; }
                    .totals-table { width: 300px; border-collapse: collapse; }
                    .totals-table td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
                    .total-final { font-size: 20px; font-weight: bold; color: #2563EB; border-top: 2px solid #2563EB; }
                    
                    .footer { margin-top: 60px; pt-4; border-top: 1px solid #E5E7EB; text-align: center; font-size: 10px; color: #9CA3AF; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        ${logoHtml}
                        <div class="company-info">
                            ${printHeaderInfo.address.replace(/\n/g, '<br>')}<br>
                            ${printHeaderInfo.phone ? `Tél: ${printHeaderInfo.phone}` : ''} | ${printHeaderInfo.email || ''}<br>
                            ${printHeaderInfo.ice ? `ICE: ${printHeaderInfo.ice}` : ''}
                        </div>
                    </div>
                    <div>
                        <div class="invoice-title">FACTURE</div>
                        <div class="invoice-meta">
                            <strong>N°:</strong> ${receipt.numero}<br>
                            <strong>Date:</strong> ${new Date(receipt.date).toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                </div>

                <div class="client-box">
                    <div>
                        <div class="bill-to-label">FACTURÉ À</div>
                        <div class="client-name">${receipt.patientName}</div>
                        <div style="color: #4B5563;">${receipt.patientAddress || ''}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Désignation</th>
                            <th class="text-center">Qté</th>
                            <th class="text-right">Prix Unit.</th>
                            <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Total HT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="totals-area">
                    <table class="totals-table">
                        <tr>
                            <td><strong>Total HT</strong></td>
                            <td class="text-right">${receipt.total.toFixed(2)} DH</td>
                        </tr>
                        <tr>
                            <td class="total-final">NET À PAYER</td>
                            <td class="total-final text-right">${receipt.total.toFixed(2)} DH</td>
                        </tr>
                    </table>
                </div>

                ${receipt.notes ? `<div style="margin-top: 30px; font-style: italic; color: #6B7280; font-size: 12px;">Note: ${receipt.notes}</div>` : ''}

                <div class="footer">
                    <p>Merci de votre confiance.</p>
                    <p>${printHeaderInfo.companyName} - RC: ${printHeaderInfo.rc || 'N/A'} - NIF: ${printHeaderInfo.nif || 'N/A'}</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold dark:text-gray-100">Gestion Financière</h1>
                <button onClick={() => { setEditingReceipt(undefined); setIsFormOpen(true); }} className="btn-primary flex items-center shadow-lg">
                    <Plus size={20} className="mr-2" />
                    Créer un Reçu
                </button>
            </div>
            
            <ReceiptStats receipts={filteredReceipts} />

            {isFormOpen && (
                <ReceiptForm 
                    receipt={editingReceipt} 
                    onSave={handleSave} 
                    onCancel={() => { setIsFormOpen(false); setEditingReceipt(undefined); }} 
                    lastReceiptNumber={lastReceiptNumber} 
                    tarifs={tarifs} 
                    patients={patients} 
                />
            )}
            
            {viewingHistoryOf && <HistoryModal receipt={viewingHistoryOf} onClose={() => setViewingHistoryOf(null)} />}
            
            <ConfirmationModal
                isOpen={!!deletingReceipt}
                onClose={() => setDeletingReceipt(null)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
            >
                <p>Êtes-vous sûr de vouloir supprimer le reçu <strong>{deletingReceipt?.numero}</strong> ?</p>
                <p className="mt-2 text-sm text-danger">Cette action est irréversible.</p>
            </ConfirmationModal>

            <Card className="!p-0 overflow-hidden shadow-lg border-t-4 border-primary">
                {/* Search & Filter Toolbar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 items-end">
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Recherche</label>
                        <div className="relative">
                             <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="N° reçu, patient..." className="input w-full pl-9" />
                             <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Période (Début)</label>
                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-full" />
                    </div>
                    <div className="md:col-span-3">
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Période (Fin)</label>
                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input w-full" />
                    </div>
                     <div className="md:col-span-2">
                        <button onClick={handleResetFilters} className="btn-secondary w-full flex items-center justify-center">
                            <XCircle size={16} className="mr-2"/> Reset
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700/50 border-b dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="text-left p-4">Numéro</th>
                                <th className="text-left p-4">Date</th>
                                <th className="text-left p-4">Client</th>
                                <th className="text-right p-4">Montant</th>
                                <th className="text-center p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {filteredReceipts.map(r => (
                                <tr key={r.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-primary">{r.numero}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400"/>
                                            {new Date(r.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'es-ES')}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                        {r.patientName || <span className="italic text-gray-400">Client Inconnu</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{r.total.toFixed(2)}</span> <span className="text-xs text-gray-500">DH</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(r)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Modifier"><Edit size={16}/></button>
                                            <button onClick={() => handlePrint(r)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-md transition-colors" title="Imprimer"><Printer size={16}/></button>
                                            <button onClick={() => setViewingHistoryOf(r)} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded-md transition-colors" title="Historique"><History size={16}/></button>
                                            {currentUser?.role === 'admin' && (
                                                <button onClick={() => setDeletingReceipt(r)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Supprimer"><Trash2 size={16}/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {receipts.length > 0 && filteredReceipts.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="mx-auto h-12 w-12 text-gray-300 mb-2"/>
                            <p className="text-gray-500">Aucun résultat pour cette recherche.</p>
                        </div>
                    )}
                    {receipts.length === 0 && (
                        <div className="text-center py-16">
                            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="text-gray-400" size={32}/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Aucun reçu</h3>
                            <p className="text-gray-500">Commencez par créer votre premier reçu.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Receipts;