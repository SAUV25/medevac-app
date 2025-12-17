
import React, { useState } from 'react';
import Card from '../components/Card';
import { useData } from '../providers/DataProvider';
import { useAuth } from '../providers/AuthProvider';
import { FileText, Download, Calendar, DollarSign, X } from 'lucide-react';
import { Payslip, HeaderInfo } from '../types';
import { useTranslation } from '../providers/LanguageProvider';

// Styles for the printable payslip (Embedded to ensure portability)
const payslipStyles: { [key: string]: React.CSSProperties } = {
    page: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '12px', lineHeight: 1.6, color: '#333', maxWidth: '800px', margin: 'auto', padding: '20px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)', backgroundColor: 'white' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '2px solid #0066CC' },
    logo: { maxWidth: '150px', maxHeight: '70px' },
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

const PayslipModal: React.FC<{ payslip: Payslip; onClose: () => void; headerInfo?: HeaderInfo; language: string }> = ({ payslip, onClose, headerInfo, language }) => {
    const handlePrint = () => {
        const printContentEl = document.getElementById('user-payslip-print');
        if (printContentEl) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<html><head><title>Bulletin de Paie - ${payslip.period}</title></head><body>${printContentEl.innerHTML}</body></html>`);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
            }
        }
    };

    const periodDate = new Date(`${payslip.period}-02`);
    const periodName = periodDate.toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES', { month: 'long', year: 'numeric' });
    const printHeaderInfo = headerInfo || { companyName: 'MedEvac', address: '', phone: '', email: '' } as HeaderInfo;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Bulletin - {periodName}</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="btn-primary flex items-center text-sm"><FileText size={16} className="mr-2" /> Imprimer</button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900 rounded border dark:border-gray-700">
                    <div id="user-payslip-print" style={payslipStyles.page}>
                        <div style={payslipStyles.header}>
                            <div>
                                {printHeaderInfo.logo ? <img src={printHeaderInfo.logo} alt="Logo" style={payslipStyles.logo}/> : <h2 style={payslipStyles.h2}>{printHeaderInfo.companyName}</h2>}
                                <div style={{ fontSize: '10px', color: '#555' }}>
                                    {printHeaderInfo.address}<br/>{printHeaderInfo.email}
                                </div>
                            </div>
                            <div>
                                <h1 style={payslipStyles.h1}>Bulletin de Paie</h1>
                                <p style={{ textAlign: 'right', margin: 0 }}>Période: {periodName}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <p><strong>Employé:</strong> {payslip.userName}</p>
                            <p><strong>Date d'émission:</strong> {new Date(payslip.dateGeneration).toLocaleDateString()}</p>
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
                                {payslip.items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={payslipStyles.td}>{item.description}</td>
                                        <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.quantite}</td>
                                        <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.taux}</td>
                                        <td style={{...payslipStyles.td, ...payslipStyles.textRight}}>{item.montant.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={3} style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold}}>Net à Payer</td>
                                    <td style={{...payslipStyles.totalsTd, ...payslipStyles.textRight, ...payslipStyles.fontBold, fontSize: '1.2em'}}>{payslip.net.toFixed(2)} DH</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const PayslipView: React.FC = () => {
    const { currentUser } = useAuth();
    const { payslips = [], headerInfo } = useData();
    const { language } = useTranslation();
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

    const myPayslips = payslips
        .filter(p => p.userId === currentUser?.id && p.sentDate) // Only show sent payslips
        .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold dark:text-gray-100">Mes Bulletins de Paie</h1>
            {selectedPayslip && <PayslipModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} headerInfo={headerInfo} language={language} />}
            
            <Card>
                {myPayslips.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Aucun bulletin de paie disponible pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myPayslips.map(payslip => (
                            <div key={payslip.id} onClick={() => setSelectedPayslip(payslip)} className="cursor-pointer group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-primary">
                                        <Calendar size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-gray-400">{new Date(payslip.dateGeneration).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 capitalize">
                                    {new Date(payslip.period + '-02').toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center text-green-600 font-bold text-lg">
                                        <DollarSign size={18} className="mr-1" />
                                        {payslip.net.toFixed(2)} DH
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Download size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PayslipView;
