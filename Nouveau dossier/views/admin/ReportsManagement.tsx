
import React, { useState, useMemo } from 'react';
import { InterventionType, InterventionStatus, HeaderInfo } from '../../types';
import Card from '../../components/Card';
import { Wallet, HeartPulse, Users, AlertTriangle, FileSpreadsheet, FileText } from 'lucide-react';
import { useData } from '../../providers/DataProvider';

const BarChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div>
            <h3 className="text-md font-semibold mb-2">{title}</h3>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className="text-xs w-20 truncate">{item.label}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                            <div
                                className="h-4 rounded-full text-white text-xs flex items-center justify-end pr-2"
                                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color }}
                            >
                                {item.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GroupedBarChart: React.FC<{ data: { label: string; total: number; problems: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.total), 1);

    return (
        <div className="space-y-6">
            {data.map((item) => (
                <div key={item.label} className="border-b dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    </div>
                    
                    {/* Barre Total */}
                    <div className="flex items-center mb-1">
                        <span className="text-[10px] uppercase text-gray-500 w-16">Total</span>
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full mx-2 overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: `${(item.total / maxValue) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold w-6 text-right">{item.total}</span>
                    </div>

                    {/* Barre Problèmes */}
                    <div className="flex items-center">
                        <span className="text-[10px] uppercase text-red-500 w-16">Problèmes</span>
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full mx-2 overflow-hidden">
                            <div 
                                className="h-full bg-red-500 rounded-full transition-all duration-500" 
                                style={{ width: `${(item.problems / maxValue) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-red-600 w-6 text-right">{item.problems}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};


const ReportsManagement: React.FC = () => {
    const { interventions = [], receipts = [], patients = [], verifications = [], headerInfo } = useData();
    
    const getMonthRange = () => {
        const start = new Date();
        start.setDate(1);
        return {
            startDate: start.toISOString().split('T')[0],
        };
    };

    const [startDate, setStartDate] = useState(getMonthRange().startDate);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const inDateRange = (dateStr: string) => {
            const date = new Date(dateStr);
            return date >= start && date <= end;
        };

        const filteredInterventions = interventions.filter(i => inDateRange(i.dateCreation));
        const filteredReceipts = receipts.filter(r => inDateRange(r.date));
        const filteredPatients = patients.filter(p => inDateRange(p.dateCreation));
        const filteredVerifications = verifications.filter(v => inDateRange(v.date));

        const totalRevenue = filteredReceipts.reduce((sum, r) => sum + r.total, 0);
        const totalInterventions = filteredInterventions.length;
        const newPatientsCount = filteredPatients.length;
        const verificationsWithProblems = filteredVerifications.filter(v => 
            Object.values(v.data).includes('Problème')
        ).length;

        // FIX: Explicitly type accumulator in reduce to prevent type inference issues.
        const interventionSummary = filteredInterventions.reduce(
            (acc: Record<InterventionType, Record<InterventionStatus | 'Total', number>>, i) => {
                const type = i.type as InterventionType;
                const status = i.status as InterventionStatus;
                if (!acc[type]) {
                    acc[type] = { 'En attente': 0, 'En cours': 0, 'Terminé': 0, 'Annulé': 0, 'Total': 0 };
                }
                acc[type][status]++;
                acc[type]['Total']++;
                return acc;
            },
            {} as Record<InterventionType, Record<InterventionStatus | 'Total', number>>
        );

        // FIX: Explicitly type accumulator in reduce to prevent type inference issues.
        const verificationSummary = filteredVerifications.reduce(
            (acc: Record<string, { total: number; problems: number }>, v) => {
                const type = v.type;
                if (!acc[type]) {
                    acc[type] = { total: 0, problems: 0 };
                }
                acc[type].total++;
                if (Object.values(v.data).includes('Problème')) {
                    acc[type].problems++;
                }
                return acc;
            },
            {} as Record<string, { total: number; problems: number }>
        );

        return {
            filteredInterventions,
            filteredReceipts,
            totalRevenue,
            totalInterventions,
            newPatientsCount,
            verificationsWithProblems,
            interventionSummary,
            verificationSummary
        };
    }, [startDate, endDate, interventions, receipts, patients, verifications]);
    
    const handleExportCSV = () => {
        // Préparation des données pour l'export Interventions
        const headers = ["ID", "Date", "Patient", "Type", "Status", "Depart", "Arrivee", "Equipe"];
        const rows = reportData.filteredInterventions.map(i => [
            i.id,
            new Date(i.dateCreation).toLocaleDateString(),
            `"${i.patientName || ''}"`,
            i.type,
            i.status,
            `"${i.adresseDepart || ''}"`,
            `"${i.adresseArrivee || ''}"`,
            `"${i.equipe || ''}"`
        ]);

        // Construction du contenu CSV
        const csvContent = 
            "data:text/csv;charset=utf-8," + 
            [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        // Téléchargement
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `medevac_interventions_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const period = `${new Date(startDate + 'T00:00:00').toLocaleDateString('fr-FR')} au ${new Date(endDate + 'T00:00:00').toLocaleDateString('fr-FR')}`;
        const printHeaderInfo: HeaderInfo = headerInfo || { id:1, logo: null, companyName: 'MedEvac', address: '', phone: '', email: '', nif:'', rc:'', ice:'', cnss:'', website:'' };
    
        let interventionTable = `
            <h3>Résumé des Interventions</h3>
            <table>
                <thead><tr><th>Type</th><th>Total</th><th>Terminées</th><th>En cours</th><th>En attente</th><th>Annulées</th></tr></thead>
                <tbody>
        `;
        for (const type in reportData.interventionSummary) {
            const stats = reportData.interventionSummary[type as InterventionType];
            interventionTable += `<tr>
                <td>${type}</td>
                <td>${stats.Total}</td>
                <td>${stats['Terminé']}</td>
                <td>${stats['En cours']}</td>
                <td>${stats['En attente']}</td>
                <td>${stats['Annulé']}</td>
            </tr>`;
        }
        interventionTable += '</tbody></table>';
        
        let verificationTable = `
            <h3>Résumé des Vérifications</h3>
            <table>
                <thead><tr><th>Rôle</th><th>Total</th><th>Avec Problèmes</th></tr></thead>
                <tbody>
        `;
        for (const type in reportData.verificationSummary) {
            const stats = reportData.verificationSummary[type];
            verificationTable += `<tr>
                <td>${type}</td>
                <td>${stats.total}</td>
                <td>${stats.problems}</td>
            </tr>`;
        }
        verificationTable += '</tbody></table>';
    
    
        const printContent = `
            <html><head><title>Rapport d'Activité - ${period}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; }
                .page { max-width: 800px; margin: auto; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #0066CC; }
                .logo { max-width: 150px; max-height: 70px; } .company-details { font-size: 10px; line-height: 1.4; color: #555;}
                h1, h2, h3 { color: #0066CC; margin-bottom: 10px; } h1 { font-size: 24px; text-align: right; margin-top: 0; } h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;}
                .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                .metric-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                .metric-card .label { font-size: 12px; color: #555; }
                .metric-card .value { font-size: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
            </style></head><body>
            <div class="page">
                <div class="header">
                    <div>
                       ${printHeaderInfo.logo ? `<img src="${printHeaderInfo.logo}" alt="Logo" class="logo"/>` : `<h2 style="font-size: 24px;">${printHeaderInfo.companyName}</h2>`}
                       <div class="company-details">${printHeaderInfo.address.replace(/\n/g, '<br>')}<br>${printHeaderInfo.phone ? `Tél: ${printHeaderInfo.phone}<br>` : ''}${printHeaderInfo.email ? `Email: ${printHeaderInfo.email}` : ''}</div>
                    </div>
                    <div><h1>Rapport d'Activité</h1><p style="text-align: right; margin:0;">${period}</p></div>
                </div>
    
                <div class="metrics">
                    <div class="metric-card">
                        <div class="label">Revenu Total</div>
                        <div class="value">${reportData.totalRevenue.toFixed(2)} DH</div>
                    </div>
                    <div class="metric-card">
                        <div class="label">Total Interventions</div>
                        <div class="value">${reportData.totalInterventions}</div>
                    </div>
                    <div class="metric-card">
                        <div class="label">Nouveaux Patients</div>
                        <div class="value">${reportData.newPatientsCount}</div>
                    </div>
                     <div class="metric-card">
                        <div class="label">Vérifications avec Problèmes</div>
                        <div class="value">${reportData.verificationsWithProblems}</div>
                    </div>
                </div>
    
                ${interventionTable}
                ${verificationTable}
    
            </div></body></html>`;
    
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };


    const MetricCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; color: string; }> = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white rounded-xl shadow p-4 flex items-center">
            <div className={`p-3 rounded-full mr-4`} style={{ backgroundColor: `${color}20` }}>
                <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );

    const interventionChartData = Object.entries(reportData.interventionSummary).map(([type, stats]) => ({
        label: type,
        value: stats['Total'] || 0,
        color: type === 'Urgence' ? '#DC3545' : type === 'Programmé' ? '#0066CC' : '#17A2B8',
    }));

    const verificationGroupedData = Object.entries(reportData.verificationSummary).map(([type, stats]) => {
        const s = stats as { total: number; problems: number };
        return {
            label: type,
            total: s.total,
            problems: s.problems
        };
    });

    return (
        <div className="space-y-6">
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleExportCSV} className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 border border-gray-300 transition-colors">
                            <FileSpreadsheet size={16} className="mr-2 text-green-600"/>Exporter CSV
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center px-3 py-2 text-sm bg-info text-white rounded-md hover:bg-info/90">
                            <FileText size={16} className="mr-2"/>Exporter PDF
                        </button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <MetricCard icon={Wallet} label="Revenu Total" value={`${reportData.totalRevenue.toFixed(2)} DH`} color="#28A745" />
                 <MetricCard icon={HeartPulse} label="Interventions" value={reportData.totalInterventions} color="#0066CC" />
                 <MetricCard icon={Users} label="Nouveaux Patients" value={reportData.newPatientsCount} color="#FFC107" />
                 <MetricCard icon={AlertTriangle} label="Vérifications avec Problèmes" value={reportData.verificationsWithProblems} color="#DC3545" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Interventions par Type">
                    <BarChart data={interventionChartData} title="" />
                </Card>
                <Card title="Conformité des Vérifications">
                    <GroupedBarChart data={verificationGroupedData} />
                </Card>
            </div>
        </div>
    );
};

export default ReportsManagement;
