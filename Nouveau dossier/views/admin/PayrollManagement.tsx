
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, TauxSalarial, Payslip, HeaderInfo, User } from '../../types';
import Card from '../../components/Card';
import { Loader2, Save, DollarSign, ClipboardList, RefreshCw, FileText, Trash2, Mail, Stethoscope, Ambulance, XCircle, X, Headset, Activity } from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useTranslation } from '../../providers/LanguageProvider';
import { useNotification } from '../../providers/NotificationProvider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const payslipStyles: { [key: string]: React.CSSProperties } = {
    page: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '12px', lineHeight: 1.6, color: '#333', maxWidth: '800px', margin: 'auto', padding: '20px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '2px solid #0066CC' },
    logo: { maxWidth: '150px', maxHeight: '70px' },
    companyDetails: { fontSize: '10px', lineHeight: 1.4, color: '#555' },
    h1: { color: '#0066CC', margin: 0, fontSize: '24px', textAlign: 'right' },
    h2: { color: '#0066CC', margin: 0 },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' },
    td: { border: '1px solid #ddd', padding: '8px', textAlign: 'left' },
    textRight: { textAlign: 'right' },
    fontBold: { fontWeight: 'bold' },
    totalsTd: { border: '1px solid #ddd', padding: '8px', textAlign: 'left', borderTop: '2px solid #333' },
    bgGray100: { backgroundColor: '#f9fafb' },
};

const PayslipViewer: React.FC<{ payslip: Payslip; onClose: () => void; headerInfo?: HeaderInfo; user?: User; language: string; isForPdf?: boolean; }> = ({ payslip, onClose, headerInfo, user, language, isForPdf = false }) => {
    const handlePrint = () => {
        const printContentEl = document.getElementById('payslip-to-print');
        if (printContentEl) {
            const printContent = printContentEl.innerHTML;
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<html><head><title>Bulletin de Paie</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: '#333'; }
                    .page { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #0066CC; }
                    .logo { max-width: 150px; max-height: 70px; }
                    .company-details { font-size: 10px; line-height: 1.4; color: #555;}
                    h1, h2 { color: #0066CC; margin: 0; }
                    h1 { font-size: 24px; text-align: right; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    tr.totals td { border-top: 2px solid #333; }
                </style>
                </head><body>${printContent}</body></html>`);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
            }
        }
    };

    const printHeaderInfo: HeaderInfo = headerInfo || { id: 1, logo: null, companyName: 'MedEvac', address: '', phone: '', email: '', nif: '', rc: '', ice: '', cnss: '', website: '' };
    const periodDate = new Date(`${payslip.period}-02`);
    const periodName = periodDate.toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES', { month: 'long', year: 'numeric' });

    const gains = payslip.items.filter(i => i.type === 'gain');
    const deductions = payslip.items.filter(i => i.type === 'deduction');

    const payslipContent = (
            <div id={isForPdf ? '' : 'payslip-to-print'} style={payslipStyles.page}>
                <div style={payslipStyles.header}>
                    <div>
                        {printHeaderInfo.logo ? <img src={printHeaderInfo.logo} alt="Logo" style={payslipStyles.logo}/> : <h2 style={payslipStyles.h2}>{printHeaderInfo.companyName}</h2>}
                        <div style={payslipStyles.companyDetails}>{printHeaderInfo.address.replace(/\n/g, '<br/>')}<br/>{printHeaderInfo.phone ? `Tél: ${printHeaderInfo.phone}<br/>` : ''}{printHeaderInfo.email ? `Email: ${printHeaderInfo.email}` : ''}</div>
                    </div>
                    <div>
                        <h1 style={payslipStyles.h1}>Bulletin de Paie</h1>
                        <p style={{ textAlign: 'right', margin: 0 }}>Période: {periodName}</p>
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <p><strong>Employé:</strong> {user?.nom || payslip.userName}</p>
                    <p><strong>Rôle:</strong> {user?.role}</p>
                    <p><strong>Date de génération:</strong> {new Date(payslip.dateGeneration).toLocaleDateString()}</p>
                </div>
                <table style={payslipStyles.table}>
                    <thead>
                        <tr>
                            <th style={payslipStyles.th}>Description</th>
                            <th style={{...payslipStyles.th, ...payslipStyles.textRight}}>Quantité</th>
                            <th style={{...payslipStyles.th, ...payslipStyles.textRight}}>Taux</th>
                            <th style={{...payslipStyles.th, ...payslipStyles.textRight}}>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colSpan={4} style={{...payslipStyles.td, ...payslipStyles.fontBold, ...payslipStyles.bgGray100}}>Gains</td></tr>
                        {gains.map((item, index) => (
                            <tr key={`gain-${index}`}>
                                <td style={payslipStyles.td}>{item.description}</td>
                                <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.quantite}</td>
                                <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.taux.toFixed(2)}</td>
                                <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.montant.toFixed(2)}</td>
                            </tr>
                        ))}
                         <tr className="totals">
                            <td colSpan={3} style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold}}>Salaire Brut</td>
                            <td style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold}}>{payslip.brut.toFixed(2)} DH</td>
                        </tr>
                        {deductions.length > 0 && <>
                           <tr><td colSpan={4} style={{...payslipStyles.td, ...payslipStyles.fontBold, ...payslipStyles.bgGray100}}>Déductions</td></tr>
                           {deductions.map((item, index) => (
                               <tr key={`deduction-${index}`}>
                                   <td style={payslipStyles.td}>{item.description}</td>
                                   <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.quantite}</td>
                                   <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.taux.toFixed(2)}</td>
                                   <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.montant.toFixed(2)}</td>
                               </tr>
                           ))}
                           <tr className="totals">
                                <td colSpan={3} style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold}}>Total Déductions</td>
                                <td style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold}}>{payslip.totalDeductions.toFixed(2)} DH</td>
                            </tr>
                        </>}
                        <tr className="totals">
                            <td colSpan={3} style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold, fontSize: '1.1rem'}}>Net à Payer</td>
                            <td style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold, fontSize: '1.1rem'}}>{payslip.net.toFixed(2)} DH</td>
                        </tr>
                    </tbody>
                </table>
            </div>
    );
    
    if(isForPdf) return payslipContent;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Bulletin - {periodName}</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-2 flex items-center bg-info text-white rounded-md text-sm"><FileText size={16} className="mr-2" /> Imprimer</button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><XCircle /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                    {payslipContent}
                </div>
            </Card>
        </div>
    );
};


const PayrollManagement: React.FC = () => {
    const { users = [], shifts = [], tauxSalariaux = [], updateTauxSalarial, bulkAddPayslips, payslips = [], updatePayslip, deletePayslip, headerInfo } = useData();
    const { language } = useTranslation();
    const { addNotification } = useNotification();
    const [localTaux, setLocalTaux] = useState<Record<UserRole, number> | null>(null);
    const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSending, setIsSending] = useState<string | null>(null); // Store payslip ID while sending

    const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
    const [deletingPayslip, setDeletingPayslip] = useState<Payslip | null>(null);
    const [pdfGeneratorData, setPdfGeneratorData] = useState<{ payslip: Payslip; user?: User } | null>(null);

    useEffect(() => {
        if (tauxSalariaux) {
            setLocalTaux({
                admin: 0,
                infirmier: tauxSalariaux.find(t => t.role === 'infirmier')?.tauxParGarde || 0,
                ambulancier: tauxSalariaux.find(t => t.role === 'ambulancier')?.tauxParGarde || 0,
                regulateur: tauxSalariaux.find(t => t.role === 'regulateur')?.tauxParGarde || 0,
                medecin: tauxSalariaux.find(t => t.role === 'medecin')?.tauxParGarde || 0,
            });
        }
    }, [tauxSalariaux]);

    const combinedReportData = useMemo(() => {
        if (!users.length || !shifts.length || !tauxSalariaux.length) return [];
        
        const filteredShifts = shifts.filter(s => s.date.startsWith(reportPeriod));
        const shiftCounts: Record<string, number> = {};
        for (const shift of filteredShifts) {
            shiftCounts[shift.infirmierId] = (shiftCounts[shift.infirmierId] || 0) + 1;
            shiftCounts[shift.ambulancierId] = (shiftCounts[shift.ambulancierId] || 0) + 1;
        }

        return users
            .filter(u => u.role !== 'admin' && (shiftCounts[u.id] || 0) > 0)
            .map(user => {
                const gardes = shiftCounts[user.id] || 0;
                const taux = tauxSalariaux.find(t => t.role === user.role)?.tauxParGarde || 0;
                const brutEstime = gardes * taux;
                const payslip = payslips.find(p => p.userId === user.id && p.period === reportPeriod);
                
                let status: 'Non généré' | 'Généré' | 'Envoyé' = 'Non généré';
                if (payslip) {
                    status = payslip.sentDate ? 'Envoyé' : 'Généré';
                }

                return { 
                    id: user.id, 
                    nom: user.nom, 
                    role: user.role, 
                    gardes, 
                    taux, 
                    brutEstime, 
                    status,
                    payslip
                };
            }).sort((a,b) => b.gardes - a.gardes);
    }, [reportPeriod, users, shifts, tauxSalariaux, payslips]);
    
    const totalReport = useMemo(() => {
        return combinedReportData.reduce((acc, curr) => {
            acc.gardes += curr.gardes;
            acc.brutEstime += curr.brutEstime;
            return acc;
        }, { gardes: 0, brutEstime: 0 });
    }, [combinedReportData]);

    const handleTauxChange = (role: UserRole, value: string) => {
        if(localTaux) setLocalTaux(prev => ({...prev!, [role]: Number(value)}));
    };

    const handleSaveTaux = () => {
        if(localTaux) {
            Object.entries(localTaux).forEach(([role, taux]) => {
                if(role !== 'admin') updateTauxSalarial({ role: role as UserRole, tauxParGarde: taux });
            });
            addNotification("Taux salariaux mis à jour.", 'success');
        }
    };
    
    const handleGeneratePayslips = async () => {
        setIsConfirming(false);
        setIsGenerating(true);
        try {
            const reportData = combinedReportData.filter(d => d.gardes > 0);
            const payslipsToGenerate = reportData.map(d => ({
                id: `${d.id}-${reportPeriod}`, userId: d.id, userName: d.nom, period: reportPeriod,
                dateGeneration: new Date().toISOString(),
                items: [{ description: `Salaire de base (${d.gardes} gardes)`, quantite: d.gardes, taux: d.taux, montant: d.brutEstime, type: 'gain' as 'gain' | 'deduction' }],
                brut: d.brutEstime, totalDeductions: 0, net: d.brutEstime
            }));
            
            if (payslipsToGenerate.length > 0) {
                await bulkAddPayslips(payslipsToGenerate, reportPeriod);
                addNotification(`${payslipsToGenerate.length} bulletin(s) généré(s) pour ${reportPeriod}.`, 'success');
            } else {
                addNotification(`Aucune garde à facturer pour cette période.`, 'info');
            }
        } catch (error) {
            console.error(error);
            addNotification("Erreur lors de la génération des bulletins.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (pdfGeneratorData) {
            const generateAndSend = async () => {
                // Wait for the next frame to ensure the off-screen component is rendered
                await new Promise(resolve => requestAnimationFrame(resolve));
    
                const { payslip, user } = pdfGeneratorData;
                const element = document.getElementById('payslip-pdf-generator');
                if (!element) {
                    addNotification("Erreur: Conteneur de PDF non trouvé.", 'error');
                    setPdfGeneratorData(null);
                    setIsSending(null);
                    return;
                }
    
                try {
                    const canvas = await html2canvas(element, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
                    const periodName = new Date(`${payslip.period}-02`).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                    const filename = `bulletin-paie-${user?.nom.replace(' ', '_')}-${payslip.period}.pdf`;
                    pdf.save(filename);
    
                    if (user?.email) {
                        const subject = `Votre bulletin de paie pour ${periodName}`;
                        const body = `Bonjour ${user.nom},\n\nMerci de trouver en pièce jointe votre bulletin de paie pour la période de ${periodName}.\n\nLe fichier PDF vient d'être téléchargé sur votre ordinateur. Veuillez le joindre à cet email avant de l'envoyer.\n\nCordialement,\nL'équipe MedEvac`;
                        const mailtoLink = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.location.href = mailtoLink;
                    }
    
                    await updatePayslip({ ...payslip, sentDate: new Date().toISOString() });
                    addNotification(`Bulletin téléchargé. Préparez l'envoi pour ${payslip.userName}.`, 'info');
                } catch (error) {
                    console.error("PDF Generation failed:", error);
                    addNotification("La génération du PDF a échoué.", "error");
                } finally {
                    setPdfGeneratorData(null);
                    setIsSending(null);
                }
            };
            generateAndSend();
        }
    }, [pdfGeneratorData, headerInfo, language, updatePayslip, addNotification]);

    const handleSend = (payslip: Payslip) => {
        const user = users.find(u => u.id === payslip.userId);
        if (!user || !user.email) {
            addNotification(`Envoi échoué: email manquant pour ${payslip.userName}.`, 'error');
            return;
        }
        setIsSending(payslip.id);
        addNotification("Préparation du PDF...", 'info');
        setPdfGeneratorData({ payslip, user });
    };

    const handleSendAll = async () => {
        const unsentPayslips = combinedReportData
            .filter(d => d.status === 'Généré' && d.payslip)
            .map(d => d.payslip!);
        
        if (unsentPayslips.length === 0) {
            addNotification("Tous les bulletins générés ont déjà été marqués comme envoyés.", 'info');
            return;
        }

        for (const payslip of unsentPayslips) {
            await updatePayslip({ ...payslip, sentDate: new Date().toISOString() });
        }
        addNotification(`${unsentPayslips.length} bulletin(s) ont été marqués comme envoyés.`, 'success');
    };

    const handleDelete = () => {
        if (deletingPayslip) {
            deletePayslip(deletingPayslip.id);
            setDeletingPayslip(null);
            addNotification(`Bulletin pour ${deletingPayslip.userName} supprimé.`, 'info');
        }
    };

    if (!localTaux) return <Card><div className="flex items-center justify-center p-4"><Loader2 className="animate-spin mr-2" /> Chargement...</div></Card>;

    const StatusBadge: React.FC<{ status: 'Non généré' | 'Généré' | 'Envoyé' }> = ({ status }) => {
        const styles = {
            'Non généré': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
            'Généré': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
            'Envoyé': 'bg-success/10 text-success dark:bg-green-900/50 dark:text-green-300'
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="space-y-6">
            {/* FIX: Corrected syntax for language prop and added closing tag for PayslipViewer */}
            {viewingPayslip && <PayslipViewer payslip={viewingPayslip} onClose={() => setViewingPayslip(null)} headerInfo={headerInfo} user={users.find(u => u.id === viewingPayslip.userId)} language={language} />}

            <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                {pdfGeneratorData && <PayslipViewer payslip={pdfGeneratorData.payslip} onClose={() => {}} headerInfo={headerInfo} user={pdfGeneratorData.user} language={language} isForPdf={true} />}
                 <div id="payslip-pdf-generator">
                    {pdfGeneratorData && <PayslipViewer payslip={pdfGeneratorData.payslip} onClose={() => {}} headerInfo={headerInfo} user={pdfGeneratorData.user} language={language} isForPdf={true} />}
                </div>
            </div>

             <ConfirmationModal isOpen={isConfirming} onClose={() => setIsConfirming(false)} onConfirm={handleGeneratePayslips} title="Confirmer la génération">
                <p>Ceci générera les bulletins de paie pour <strong>{new Date(reportPeriod + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</strong>.</p>
                <p className="mt-2 text-sm text-danger">Les bulletins existants pour cette période seront écrasés.</p>
            </ConfirmationModal>
             <ConfirmationModal isOpen={!!deletingPayslip} onClose={() => setDeletingPayslip(null)} onConfirm={handleDelete} title="Confirmer la suppression">
                <p>Êtes-vous sûr de vouloir supprimer le bulletin de paie de <strong>{deletingPayslip?.userName}</strong> pour cette période ?</p>
            </ConfirmationModal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold flex items-center mb-4"><DollarSign className="mr-2"/> Taux Salariaux par Garde</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="text-indigo-500"/>
                            <label className="w-24">Médecin</label>
                            <input type="number" value={localTaux.medecin} onChange={e => handleTauxChange('medecin', e.target.value)} className="input w-full"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Stethoscope className="text-blue-500"/>
                            <label className="w-24">Infirmier</label>
                            <input type="number" value={localTaux.infirmier} onChange={e => handleTauxChange('infirmier', e.target.value)} className="input w-full"/>
                        </div>
                        <div className="flex items-center gap-2">
                             <Ambulance className="text-green-500"/>
                             <label className="w-24">Ambulancier</label>
                            <input type="number" value={localTaux.ambulancier} onChange={e => handleTauxChange('ambulancier', e.target.value)} className="input w-full"/>
                        </div>
                        <div className="flex items-center gap-2">
                             <Headset className="text-purple-500"/>
                             <label className="w-24">Régulateur</label>
                            <input type="number" value={localTaux.regulateur} onChange={e => handleTauxChange('regulateur', e.target.value)} className="input w-full"/>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={handleSaveTaux} className="flex items-center px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90"><Save size={16} className="mr-2"/> Enregistrer les taux</button>
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-bold flex items-center mb-4"><ClipboardList className="mr-2"/> Rapport de Paie</h3>
                    <div className="flex items-end gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium">Sélectionner un mois</label>
                            <input type="month" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} className="mt-1 input"/>
                        </div>
                        <button onClick={() => setIsConfirming(true)} disabled={isGenerating} className="btn-primary flex items-center disabled:opacity-50">
                            {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <RefreshCw className="mr-2"/>}
                            {isGenerating ? 'Génération...' : 'Générer les bulletins'}
                        </button>
                    </div>
                    <div className="flex justify-end mb-2">
                         <button onClick={handleSendAll} className="text-sm flex items-center text-info font-semibold hover:underline">
                            <Mail size={16} className="mr-1"/> Marquer tout comme envoyé
                        </button>
                    </div>
                </Card>
            </div>

             <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="text-left p-3 font-semibold">Employé</th>
                                <th className="text-center p-3 font-semibold">Gardes</th>
                                <th className="text-right p-3 font-semibold">Taux</th>
                                <th className="text-right p-3 font-semibold">Brut Estimé</th>
                                <th className="text-center p-3 font-semibold">Statut</th>
                                <th className="text-center p-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                           {combinedReportData.map(d => (
                               <tr key={d.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                   <td className="p-3 font-medium">{d.nom} <span className="text-xs text-gray-500 capitalize">({d.role})</span></td>
                                   <td className="p-3 text-center">{d.gardes}</td>
                                   <td className="p-3 text-right font-mono">{d.taux.toFixed(2)}</td>
                                   <td className="p-3 text-right font-mono font-semibold">{d.brutEstime.toFixed(2)} DH</td>
                                   <td className="p-3 text-center"><StatusBadge status={d.status} /></td>
                                   <td className="p-3">
                                        <div className="flex justify-center items-center gap-1">
                                            {d.payslip && (
                                                <>
                                                    <button onClick={() => setViewingPayslip(d.payslip!)} className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" title="Voir"><FileText size={18}/></button>
                                                    <button onClick={() => handleSend(d.payslip!)} disabled={isSending === d.payslip.id} className="p-2 text-gray-500 hover:text-info rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50" title="Envoyer">
                                                        {isSending === d.payslip.id ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18}/>}
                                                    </button>
                                                    <button onClick={() => setDeletingPayslip(d.payslip!)} className="p-2 text-gray-500 hover:text-danger rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" title="Supprimer"><Trash2 size={18}/></button>
                                                </>
                                            )}
                                        </div>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                            <tr>
                                <td className="p-3">Total</td>
                                <td className="p-3 text-center">{totalReport.gardes}</td>
                                <td className="p-3"></td>
                                <td className="p-3 text-right font-mono">{totalReport.brutEstime.toFixed(2)} DH</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                    {combinedReportData.length === 0 && <p className="text-center py-8 text-gray-500">Aucune garde trouvée pour cette période.</p>}
                </div>
            </Card>
        </div>
    );
};

export default PayrollManagement;
