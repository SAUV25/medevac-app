
import React, { useState, useMemo, useEffect } from 'react';
// FIX: Corrected import path for types to be relative.
import { User, HeaderInfo, Shift, Impediment } from '../types';
import Card from '../components/Card';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, FileText, Ban, Flag, Trash2, Repeat, MessageSquare, Send } from 'lucide-react';
import { useTranslation } from '../providers/LanguageProvider';
// FIX: Corrected import path to be relative.
import { useData } from '../providers/DataProvider';
// FIX: Corrected import path to be relative.
import { useAuth } from '../providers/AuthProvider';
import { useNotification } from '../providers/NotificationProvider';

const ImpedimentModal: React.FC<{
    date: string;
    onClose: () => void;
    currentUser: User;
    impediments: Impediment[];
    saveImpediment: (imp: Omit<Impediment, 'id'>) => void;
    deleteImpediment: (userId: string, date: string) => void;
}> = ({ date, onClose, currentUser, impediments, saveImpediment, deleteImpediment }) => {
    const { addNotification } = useNotification();
    const existingImpediment = useMemo(() => 
        impediments.find(i => i.userId === currentUser.id && i.date === date),
    [impediments, currentUser, date]);

    const [reason, setReason] = useState(existingImpediment?.reason || '');

    const handleSave = () => {
        if (!reason.trim()) {
            addNotification("Veuillez fournir une raison pour votre empêchement.", 'error');
            return;
        }
        saveImpediment({
            userId: currentUser.id,
            date,
            reason,
        });
        onClose();
    };

    const handleDelete = () => {
        deleteImpediment(currentUser.id, date);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Déclarer un empêchement</h3>
                <p className="mb-4">Pour le: <strong>{new Date(date + 'T00:00:00').toLocaleDateString()}</strong></p>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Raison</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Ex: Rendez-vous médical, indisponible..."
                    />
                </div>
                <div className="flex justify-between items-center mt-6">
                    <div>
                        {existingImpediment && (
                             <button onClick={handleDelete} className="flex items-center px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 text-sm">
                                <Trash2 size={16} className="mr-2"/>
                                Retirer l'empêchement
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuler</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                            {existingImpediment ? 'Mettre à jour' : 'Déclarer'}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const ShiftChangeRequestModal: React.FC<{
    shift: Shift;
    onClose: () => void;
    currentUser: User;
    requestShiftChange: (shiftId: number, userId: string, reason: string) => void;
}> = ({ shift, onClose, currentUser, requestShiftChange }) => {
    const { addNotification } = useNotification();
    const [reason, setReason] = useState(shift.changeRequest?.reason || '');
    const isMyRequest = shift.changeRequest?.userId === currentUser.id;
    const isPending = shift.changeRequest?.status === 'pending';

    const handleSubmit = () => {
        if (!reason.trim()) {
            addNotification("Veuillez fournir une raison pour votre demande.", 'error');
            return;
        }
        if (shift.id) {
            requestShiftChange(shift.id, currentUser.id, reason);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Demande de changement de garde</h3>
                <p className="mb-2">Pour la garde du: <strong>{new Date(shift.date + 'T00:00:00').toLocaleDateString()}</strong></p>
                {shift.changeRequest && (
                    <div className={`p-3 rounded-md mb-4 text-sm ${isPending ? 'bg-warning/10 text-yellow-800' : 'bg-success/10 text-green-800'}`}>
                        <p><strong>Statut:</strong> {isPending ? 'En attente de validation admin.' : 'Traitée par l\'administration.'}</p>
                        {isMyRequest && <p><strong>Votre raison:</strong> {shift.changeRequest.reason}</p>}
                    </div>
                )}
                
                {(!shift.changeRequest || (isMyRequest && isPending)) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Raison de la demande</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                            placeholder="Ex: Échange avec un collègue, imprévu..."
                        />
                    </div>
                )}

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Fermer</button>
                    {(!shift.changeRequest || (isMyRequest && isPending)) && (
                         <button onClick={handleSubmit} className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                            <Send size={16} className="mr-2"/>
                            {shift.changeRequest ? 'Mettre à jour' : 'Envoyer la demande'}
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
};

const Planning: React.FC = () => {
    const { t, language } = useTranslation();
    const { currentUser } = useAuth();
    const { users = [], shifts = [], saveShift, headerInfo, impediments = [], saveImpediment, deleteImpediment, requestShiftChange } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignTeamDate, setAssignTeamDate] = useState<string | null>(null);
    const [managingImpedimentDate, setManagingImpedimentDate] = useState<string | null>(null);
    const [requestingChangeForShift, setRequestingChangeForShift] = useState<Shift | null>(null);

    const [selectedInfirmier, setSelectedInfirmier] = useState('');
    const [selectedAmbulancier, setSelectedAmbulancier] = useState('');
    
    const [infirmierConflictMessage, setInfirmierConflictMessage] = useState('');
    const [ambulancierConflictMessage, setAmbulancierConflictMessage] = useState('');
    const [infirmierImpediment, setInfirmierImpediment] = useState<Impediment | null>(null);
    const [ambulancierImpediment, setAmbulancierImpediment] = useState<Impediment | null>(null);

    const { infirmiers, ambulanciers } = useMemo(() => ({
        infirmiers: users.filter(u => u.role === 'infirmier'),
        ambulanciers: users.filter(u => u.role === 'ambulancier')
    }), [users]);

    const checkShiftConflict = (userId: string, dateStr: string): string => {
        const parts = dateStr.split('-').map(Number);
        const checkDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

        const prevDate = new Date(checkDate); prevDate.setUTCDate(prevDate.getUTCDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];

        const nextDate = new Date(checkDate); nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        const worksOnPrevDay = shifts.some(s => s.date === prevDateStr && (s.infirmierId === userId || s.ambulancierId === userId));
        const worksOnNextDay = shifts.some(s => s.date === nextDateStr && (s.infirmierId === userId || s.ambulancierId === userId));

        if (worksOnPrevDay && worksOnNextDay) return "Ce membre travaille la veille ET le lendemain.";
        if (worksOnPrevDay) return "Ce membre travaille la veille.";
        if (worksOnNextDay) return "Ce membre travaille le lendemain.";
        return "";
    };
    
    const checkImpediment = (userId: string, dateStr: string): Impediment | null => {
        return impediments.find(i => i.userId === userId && i.date === dateStr) || null;
    };

    useEffect(() => {
        if (assignTeamDate && selectedInfirmier) {
            setInfirmierConflictMessage(checkShiftConflict(selectedInfirmier, assignTeamDate));
            setInfirmierImpediment(checkImpediment(selectedInfirmier, assignTeamDate));
        } else {
            setInfirmierConflictMessage('');
            setInfirmierImpediment(null);
        }
    }, [selectedInfirmier, assignTeamDate, shifts, impediments]);

    useEffect(() => {
        if (assignTeamDate && selectedAmbulancier) {
            setAmbulancierConflictMessage(checkShiftConflict(selectedAmbulancier, assignTeamDate));
            setAmbulancierImpediment(checkImpediment(selectedAmbulancier, assignTeamDate));
        } else {
            setAmbulancierConflictMessage('');
            setAmbulancierImpediment(null);
        }
    }, [selectedAmbulancier, assignTeamDate, shifts, impediments]);

    const handleMonthChange = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleDayClick = (dateStr: string) => {
        if (currentUser?.role === 'admin') {
            const existingShift = shifts.find(s => s.date === dateStr);
            setSelectedInfirmier(existingShift?.infirmierId || '');
            setSelectedAmbulancier(existingShift?.ambulancierId || '');
            setAssignTeamDate(dateStr);
        } else if (currentUser) {
            const myShift = shifts.find(s => s.date === dateStr && (s.infirmierId === currentUser.id || s.ambulancierId === currentUser.id));
            if (myShift) {
                setRequestingChangeForShift(myShift);
            } else {
                setManagingImpedimentDate(dateStr);
            }
        }
    };
    
    const handleSaveShift = () => {
        if (assignTeamDate && selectedInfirmier && selectedAmbulancier) {
            const newShift: Omit<Shift, 'id'> = { date: assignTeamDate, infirmierId: selectedInfirmier, ambulancierId: selectedAmbulancier };
            saveShift(newShift);
            setAssignTeamDate(null);
        }
    };
    
    const handlePrintPDF = () => {
        const printHeaderInfo: HeaderInfo = headerInfo || { id:1, logo: null, companyName: 'MedEvac', address: '', phone: '', email: '', nif:'', rc:'', ice:'', cnss:'', website:'' };
        const currentMonthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthShifts = shifts.filter(s => s.date.startsWith(currentMonthStr)).sort((a,b) => a.date.localeCompare(b.date));
        const monthName = currentDate.toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES', { month: 'long', year: 'numeric' });

        const printContent = `
            <html><head><title>${t.planning.scheduleFor} ${monthName}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; }
                .page { max-width: 800px; margin: auto; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #0066CC; }
                .logo { max-width: 150px; max-height: 70px; } .company-details { font-size: 10px; line-height: 1.4; color: #555;}
                h1, h2 { color: #0066CC; margin: 0; } h1 { font-size: 24px; text-align: right; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .impediment { color: #DC3545; font-weight: bold; }
            </style></head><body>
            <div class="page"><div class="header">
                <div>
                   ${printHeaderInfo.logo ? `<img src="${printHeaderInfo.logo}" alt="Logo" class="logo"/>` : `<h2 style="font-size: 24px;">${printHeaderInfo.companyName}</h2>`}
                   <div class="company-details">${printHeaderInfo.address.replace(/\n/g, '<br>')}<br>${printHeaderInfo.phone ? `Tél: ${printHeaderInfo.phone}<br>` : ''}${printHeaderInfo.email ? `Email: ${printHeaderInfo.email}` : ''}</div>
                </div><div><h1>${t.planning.scheduleFor}</h1><p style="text-align: right; margin:0;">${monthName}</p></div></div>
                <table><thead><tr><th>Date</th><th>${t.planning.nurse}</th><th>${t.planning.paramedic}</th></tr></thead><tbody>
                    ${monthShifts.map(shift => {
                        const infirmierImp = checkImpediment(shift.infirmierId, shift.date);
                        const ambulancierImp = checkImpediment(shift.ambulancierId, shift.date);
                        return `<tr>
                            <td>${new Date(shift.date + 'T00:00:00').toLocaleDateString(language === 'fr' ? 'fr-FR' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
                            <td>${users.find(u => u.id === shift.infirmierId)?.nom || 'N/A'} ${infirmierImp ? `<span class="impediment">(Empêchement)</span>` : ''}</td>
                            <td>${users.find(u => u.id === shift.ambulancierId)?.nom || 'N/A'} ${ambulancierImp ? `<span class="impediment">(Empêchement)</span>` : ''}</td>
                        </tr>`;
                    }).join('')}
                </tbody></table></div></body></html>`;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() -1;
    const daysInMonth = endOfMonth.getDate();
    const calendarDays = [];
    for (let i = 0; i < startDay; i++) { calendarDays.push(<div key={`empty-${i}`} className="border rounded-md p-2 h-32 bg-gray-50"></div>); }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const shift = shifts.find(s => s.date === dateStr);
        const infirmierImpediment = shift && checkImpediment(shift.infirmierId, dateStr);
        const ambulancierImpediment = shift && checkImpediment(shift.ambulancierId, dateStr);
        const currentUserImpediment = currentUser && !shift && checkImpediment(currentUser.id, dateStr);

        calendarDays.push(
            <div key={day} className="border rounded-md p-2 h-32 flex flex-col relative transition-colors hover:bg-gray-50">
                <div className="flex justify-between items-center">
                    <span className="font-bold">{day}</span>
                    <div className="flex items-center gap-1">
                        {shift?.changeRequest?.status === 'pending' && <span title="Demande de changement en cours"><Repeat size={16} className="text-info" /></span>}
                        {(infirmierImpediment || ambulancierImpediment || currentUserImpediment) && <span title="Empêchement déclaré"><Flag size={16} className="text-danger" /></span>}
                    </div>
                </div>
                {shift && (
                    <div className="text-xs mt-2 space-y-1 overflow-hidden">
                        <p className={`p-1 rounded truncate ${infirmierImpediment ? 'bg-danger/20 text-danger font-bold' : 'bg-blue-100 text-blue-800'}`}>👨‍⚕️ {users.find(u => u.id === shift.infirmierId)?.nom || 'N/A'}</p>
                        <p className={`p-1 rounded truncate ${ambulancierImpediment ? 'bg-danger/20 text-danger font-bold' : 'bg-green-100 text-green-800'}`}>🚑 {users.find(u => u.id === shift.ambulancierId)?.nom || 'N/A'}</p>
                    </div>
                )}
                 <button onClick={() => handleDayClick(dateStr)} className="absolute bottom-1 right-1 p-1 bg-primary/80 text-white rounded-full hover:bg-primary"><Plus size={16}/></button>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t.planning.title}</h1>

            <Card>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <div className="flex items-center">
                        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft/></button>
                        <h2 className="text-xl font-bold mx-4">{currentDate.toLocaleString(language === 'fr' ? 'fr-FR' : 'es-ES', { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight/></button>
                    </div>
                    {currentUser?.role === 'admin' && <button onClick={handlePrintPDF} className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"><FileText size={16} className="mr-2"/>{t.planning.exportPdf}</button>}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center font-semibold mb-2">
                    <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays}
                </div>
            </Card>

            {currentUser && managingImpedimentDate && (
                <ImpedimentModal
                    date={managingImpedimentDate}
                    onClose={() => setManagingImpedimentDate(null)}
                    currentUser={currentUser}
                    impediments={impediments}
                    saveImpediment={saveImpediment}
                    deleteImpediment={deleteImpediment}
                />
            )}
            
            {currentUser && requestingChangeForShift && (
                <ShiftChangeRequestModal
                    shift={requestingChangeForShift}
                    onClose={() => setRequestingChangeForShift(null)}
                    currentUser={currentUser}
                    requestShiftChange={requestShiftChange}
                />
            )}


            {assignTeamDate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">{t.planning.assignTeamFor} {new Date(assignTeamDate + 'T00:00:00').toLocaleDateString(language === 'fr' ? 'fr-FR' : 'es-ES')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.planning.nurse}</label>
                                <select value={selectedInfirmier} onChange={(e) => setSelectedInfirmier(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                                    <option value="">{t.planning.select}</option>
                                    {infirmiers.map(i => {
                                        const shiftConflict = assignTeamDate ? checkShiftConflict(i.id, assignTeamDate) : '';
                                        const impediment = assignTeamDate ? checkImpediment(i.id, assignTeamDate) : null;
                                        return <option key={i.id} value={i.id}>{impediment ? '🚫 ' : shiftConflict ? '⚠️ ' : ''}{i.nom}</option>
                                    })}
                                </select>
                                {infirmierImpediment && <p className="text-xs text-danger mt-1 flex items-center"><Ban size={14} className="mr-1"/><b>Empêchement:</b> {infirmierImpediment.reason}</p>}
                                {infirmierConflictMessage && <p className="text-xs text-orange-600 mt-1 flex items-center"><AlertTriangle size={14} className="mr-1"/>{infirmierConflictMessage}</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{t.planning.paramedic}</label>
                                <select value={selectedAmbulancier} onChange={(e) => setSelectedAmbulancier(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                                    <option value="">{t.planning.select}</option>
                                    {ambulanciers.map(a => {
                                        const shiftConflict = assignTeamDate ? checkShiftConflict(a.id, assignTeamDate) : '';
                                        const impediment = assignTeamDate ? checkImpediment(a.id, assignTeamDate) : null;
                                        return <option key={a.id} value={a.id}>{impediment ? '🚫 ' : shiftConflict ? '⚠️ ' : ''}{a.nom}</option>
                                    })}
                                </select>
                                {ambulancierImpediment && <p className="text-xs text-danger mt-1 flex items-center"><Ban size={14} className="mr-1"/><b>Empêchement:</b> {ambulancierImpediment.reason}</p>}
                                {ambulancierConflictMessage && <p className="text-xs text-orange-600 mt-1 flex items-center"><AlertTriangle size={14} className="mr-1"/>{ambulancierConflictMessage}</p>}
                            </div>
                        </div>
                         <div className="flex justify-end space-x-4 mt-6">
                            <button onClick={() => setAssignTeamDate(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t.planning.cancel}</button>
                            <button onClick={handleSaveShift} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">{t.planning.confirm}</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Planning;
