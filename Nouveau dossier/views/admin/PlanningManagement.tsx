
import React, { useState, useMemo } from 'react';
import { Shift, User, UserRole } from '../../types';
import Card from '../../components/Card';
import { 
    ChevronLeft, ChevronRight, Calendar, Users, 
    Wand2, Save, X, Printer, Trash2, AlertTriangle, 
    CheckCircle, BarChart3, Lock, Plus, RefreshCw, Eraser, AlertOctagon
} from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import { useNotification } from '../../providers/NotificationProvider';

// --- Utility Components ---

const UserAvatarSmall: React.FC<{ user?: User; role: UserRole; conflict?: boolean }> = ({ user, role, conflict }) => {
    const color = role === 'infirmier' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200';
    
    if (!user) return (
        <div className="flex items-center gap-1.5 p-1 rounded-full border border-dashed border-gray-300 text-gray-400 bg-gray-50 text-[10px]">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">?</div>
            <span className="italic">Non assigné</span>
        </div>
    );
    
    return (
        <div className={`flex items-center gap-1.5 p-1 pr-2 rounded-full border ${conflict ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' : color} text-[10px] font-bold overflow-hidden shadow-sm transition-all`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${conflict ? 'bg-red-200' : 'bg-white'}`}>
                {user.nom.charAt(0)}
            </div>
            <span className="truncate max-w-[70px]">{user.nom.split(' ')[0]}</span>
            {conflict && <AlertOctagon size={10} className="text-red-600"/>}
        </div>
    );
};

// --- Logic Helpers ---

const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    // Adjust for Monday start (0 = Mon, 6 = Sun)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    return { days, firstDay: adjustedFirstDay };
};

const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const PlanningManagement: React.FC = () => {
    const { users = [], shifts = [], bulkAddShifts, saveShift, impediments = [], headerInfo } = useData();
    const { addNotification } = useNotification();
    
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [generatedShifts, setGeneratedShifts] = useState<Omit<Shift, 'id'>[] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Modal State
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedInfirmier, setSelectedInfirmier] = useState('');
    const [selectedAmbulancier, setSelectedAmbulancier] = useState('');

    // Resources
    const { infirmiers, ambulanciers } = useMemo(() => ({
        infirmiers: users.filter(u => u.role === 'infirmier' && u.isActive),
        ambulanciers: users.filter(u => u.role === 'ambulancier' && u.isActive)
    }), [users]);

    // Derived Data
    const currentMonthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const { days, firstDay } = getDaysInMonth(currentDate);
    
    const displayShifts = useMemo(() => {
        if (generatedShifts) return generatedShifts;
        return shifts.filter(s => s.date.startsWith(currentMonthStr));
    }, [generatedShifts, shifts, currentMonthStr]);

    // Statistics for Equity Panel
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        users.forEach(u => { counts[u.id] = 0; });

        displayShifts.forEach(s => {
            if (s.infirmierId) counts[s.infirmierId] = (counts[s.infirmierId] || 0) + 1;
            if (s.ambulancierId) counts[s.ambulancierId] = (counts[s.ambulancierId] || 0) + 1;
        });

        // Coverage Calculation
        const daysWithFullTeam = displayShifts.filter(s => s.infirmierId && s.ambulancierId).length;
        const coveragePercent = Math.round((daysWithFullTeam / days) * 100);

        return { counts, coveragePercent };
    }, [displayShifts, users, days]);

    // --- Actions ---

    const handleMonthChange = (offset: number) => {
        setGeneratedShifts(null); 
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleDayClick = (day: number) => {
        if (generatedShifts) return; 
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const existing = shifts.find(s => s.date === dateStr);
        
        setSelectedDate(dateStr);
        setSelectedInfirmier(existing?.infirmierId || '');
        setSelectedAmbulancier(existing?.ambulancierId || '');
    };

    const handleSaveSingleShift = async () => {
        if (selectedDate) {
            await saveShift({
                date: selectedDate,
                infirmierId: selectedInfirmier,
                ambulancierId: selectedAmbulancier
            });
            setSelectedDate(null);
            addNotification("Garde mise à jour.", 'success');
        }
    };

    const handleClearSingleShift = async () => {
        if (selectedDate) {
            await saveShift({
                date: selectedDate,
                infirmierId: '',
                ambulancierId: ''
            });
            setSelectedDate(null);
            addNotification("Garde effacée.", 'info');
        }
    }

    // --- ALGORITHM: Smart Load Balancer ---
    const generateSchedule = () => {
        setIsGenerating(true);
        // Simulate async calculation
        setTimeout(() => {
            const newShifts: Omit<Shift, 'id'>[] = [];
            
            // 1. Calculate Target Load
            // Ideal load = Total Days / Number of Staff. 
            // e.g., 30 days / 5 nurses = 6 shifts per nurse.
            // We use simple counters to try and stick to this average.
            const tempCounts: Record<string, number> = {};
            [...infirmiers, ...ambulanciers].forEach(u => tempCounts[u.id] = 0);

            let prevInfId: string | null = null;
            let prevAmbId: string | null = null;

            for (let day = 1; day <= days; day++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dateStr = formatDateLocal(date);

                // Helper: Pick best candidate (lowest shift count, not busy, not worked yesterday)
                const pickCandidate = (candidates: User[], prevId: string | null) => {
                    // Filter: Not impeded
                    let pool = candidates.filter(u => 
                        !impediments.some(imp => imp.userId === u.id && imp.date === dateStr)
                    );

                    // Filter: Not worked yesterday (Double shift prevention)
                    // Strict rule: try to avoid back-to-back
                    const strictPool = pool.filter(u => u.id !== prevId);
                    
                    // If strict pool is empty (everyone blocked or worked yesterday), fallback to allowing back-to-back if really necessary
                    // (But let's stick to strict for quality)
                    const finalPool = strictPool.length > 0 ? strictPool : pool;

                    if (finalPool.length === 0) return null; // No one available!

                    // Sort by workload (Ascending) -> Give shift to person with fewest shifts
                    finalPool.sort((a, b) => {
                        const countA = tempCounts[a.id] || 0;
                        const countB = tempCounts[b.id] || 0;
                        // Add randomness if counts are equal to distribute cleanly
                        if (countA === countB) return Math.random() - 0.5;
                        return countA - countB;
                    });

                    return finalPool[0];
                };

                const inf = pickCandidate(infirmiers, prevInfId);
                const amb = pickCandidate(ambulanciers, prevAmbId);

                // Even if one is missing, we create the shift object to show the gap
                if (inf || amb) {
                    newShifts.push({ 
                        date: dateStr, 
                        infirmierId: inf ? inf.id : '', 
                        ambulancierId: amb ? amb.id : '' 
                    });
                    
                    if (inf) { tempCounts[inf.id]++; prevInfId = inf.id; }
                    if (amb) { tempCounts[amb.id]++; prevAmbId = amb.id; }
                }
            }

            setGeneratedShifts(newShifts);
            setIsGenerating(false);
            addNotification("Proposition optimisée générée. Vérifiez l'équité à droite.", 'info');
        }, 600);
    };

    const confirmGeneration = async () => {
        if (generatedShifts) {
            await bulkAddShifts(generatedShifts as Shift[]);
            setGeneratedShifts(null);
            addNotification("Planning publié avec succès.", 'success');
        }
    };

    const checkConflict = (userId: string, dateStr: string) => {
        return impediments.find(i => i.userId === userId && i.date === dateStr);
    };

    const handlePrint = () => {
        window.print(); // Simple print trigger, CSS handles @media print
    };

    // --- Render Helpers ---
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-in fade-in">
            
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                        <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all"><ChevronLeft size={20}/></button>
                        <div className="px-6 font-bold text-lg min-w-[160px] text-center capitalize text-gray-800 dark:text-gray-100">
                            {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all"><ChevronRight size={20}/></button>
                    </div>
                    
                    {/* Coverage Indicator */}
                    <div className="hidden md:flex flex-col w-48">
                        <div className="flex justify-between text-xs font-bold uppercase text-gray-500 mb-1">
                            <span>Couverture Mois</span>
                            <span>{stats.coveragePercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${stats.coveragePercent === 100 ? 'bg-green-500' : stats.coveragePercent > 80 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                                style={{ width: `${stats.coveragePercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {generatedShifts ? (
                        <>
                            <button onClick={() => setGeneratedShifts(null)} className="btn-secondary flex items-center bg-red-50 text-red-600 hover:bg-red-100 border-red-200"><X size={18} className="mr-2"/>Annuler</button>
                            <button onClick={confirmGeneration} className="btn-primary bg-green-600 border-green-600 hover:bg-green-700 flex items-center shadow-lg transform hover:scale-105 transition-all"><CheckCircle size={18} className="mr-2"/>Publier</button>
                        </>
                    ) : (
                        <>
                            <button onClick={handlePrint} className="btn-secondary hidden md:flex items-center" title="Imprimer"><Printer size={18} className="mr-2"/> Imprimer</button>
                            <button onClick={generateSchedule} disabled={isGenerating} className="btn-primary flex items-center shadow-md bg-indigo-600 border-indigo-600 hover:bg-indigo-700">
                                {isGenerating ? <RefreshCw size={18} className="animate-spin mr-2"/> : <Wand2 size={18} className="mr-2"/>}
                                Génération Auto
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* CALENDAR GRID */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden flex flex-col">
                    {/* Headers */}
                    <div className="grid grid-cols-7 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center py-3 shrink-0">
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d, i) => (
                            <div key={d} className={`text-xs font-bold uppercase tracking-wider ${i >= 5 ? 'text-blue-600' : 'text-gray-500'}`}>
                                <span className="hidden md:inline">{d}</span>
                                <span className="md:hidden">{d.substring(0, 3)}</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 dark:bg-gray-700 gap-px overflow-y-auto">
                        {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-gray-100/50 dark:bg-gray-900/50" />)}
                        
                        {daysArray.map(day => {
                            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                            const shift = displayShifts.find(s => s.date === dateStr);
                            const isToday = new Date().toISOString().startsWith(dateStr);
                            const inf = users.find(u => u.id === shift?.infirmierId);
                            const amb = users.find(u => u.id === shift?.ambulancierId);
                            
                            // Check for impediments on assigned users
                            const infConflict = inf ? checkConflict(inf.id, dateStr) : null;
                            const ambConflict = amb ? checkConflict(amb.id, dateStr) : null;
                            const isEmpty = !shift || (!inf && !amb);
                            const isDraft = !!generatedShifts;

                            return (
                                <div 
                                    key={day} 
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        relative p-2 flex flex-col justify-between transition-all duration-200 group
                                        ${isDraft ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPgo8cmVjdCB3aWR0aD0nNCcgaGVpZ2h0PSc0JyBmaWxsPScjZmZmJy8+CjxwYXRoIGQ9J00wIDBMNCA0Wk00IDBMMCA0Wicgc3Ryb2tlPSIjZjNmNGY2IiBzdHJva2Utd2lkdGg9JzEnLz4KPC9zdmc+")]' : 'bg-white dark:bg-gray-800'}
                                        ${!isDraft ? 'hover:bg-blue-50 dark:hover:bg-gray-700/80 cursor-pointer' : ''}
                                        ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}
                                        ${isEmpty && !isDraft ? 'bg-red-50/30' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full
                                            ${isToday ? 'bg-blue-600 text-white' : 'text-gray-500'}
                                        `}>{day}</span>
                                        
                                        {/* Status Indicators */}
                                        <div className="flex gap-1">
                                            {(infConflict || ambConflict) && (
                                                <span className="text-red-500 animate-pulse" title="Conflit détecté"><AlertOctagon size={14}/></span>
                                            )}
                                            {shift?.changeRequest?.status === 'pending' && (
                                                <span className="text-orange-500" title="Demande de changement"><RefreshCw size={14}/></span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Shifts Display */}
                                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                                        {shift ? (
                                            <>
                                                <UserAvatarSmall user={inf} role="infirmier" conflict={!!infConflict} />
                                                <UserAvatarSmall user={amb} role="ambulancier" conflict={!!ambConflict} />
                                            </>
                                        ) : (
                                            !generatedShifts && (
                                                <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity">
                                                    <Plus className="text-gray-300" size={24} />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SIDEBAR: Stats & Load Analysis */}
                <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
                    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-xl shrink-0">
                        <h3 className="font-bold text-lg mb-2 flex items-center"><BarChart3 size={20} className="mr-2 text-indigo-400"/> Charge de travail</h3>
                        <p className="text-xs text-slate-400 mb-4">Objectif théorique : ~{Math.ceil(days / infirmiers.length)} gardes / pers.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold uppercase text-blue-300 block mb-2 tracking-wider">Infirmiers</span>
                                <div className="space-y-2">
                                    {infirmiers.map(u => {
                                        const count = stats.counts[u.id] || 0;
                                        const loadRatio = count / Math.ceil(days / infirmiers.length);
                                        let barColor = 'bg-blue-500';
                                        if (loadRatio > 1.2) barColor = 'bg-orange-500'; // Overworked
                                        if (loadRatio < 0.5) barColor = 'bg-slate-500';  // Underworked

                                        return (
                                            <div key={u.id} className="flex items-center justify-between text-xs">
                                                <span className="truncate w-24 opacity-90">{u.nom}</span>
                                                <div className="flex-1 mx-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${barColor}`} style={{ width: `${Math.min((count / 15) * 100, 100)}%` }}></div>
                                                </div>
                                                <span className={`font-mono font-bold w-5 text-right ${loadRatio > 1.2 ? 'text-orange-400' : 'text-white'}`}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-xs font-bold uppercase text-green-300 block mb-2 tracking-wider">Ambulanciers</span>
                                <div className="space-y-2">
                                    {ambulanciers.map(u => {
                                        const count = stats.counts[u.id] || 0;
                                        return (
                                            <div key={u.id} className="flex items-center justify-between text-xs">
                                                <span className="truncate w-24 opacity-90">{u.nom}</span>
                                                <div className="flex-1 mx-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${Math.min((count / 15) * 100, 100)}%` }}></div>
                                                </div>
                                                <span className="font-mono font-bold w-5 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Unavailability Info */}
                    <Card className="flex-1 overflow-hidden flex flex-col">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center"><Lock size={18} className="mr-2 text-red-500"/> Absences du mois</h3>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-sm">
                            {impediments.filter(i => i.date.startsWith(currentMonthStr)).length === 0 ? (
                                <p className="text-gray-400 italic text-center py-4">Aucune absence déclarée.</p>
                            ) : (
                                impediments.filter(i => i.date.startsWith(currentMonthStr)).sort((a,b) => a.date.localeCompare(b.date)).map(imp => {
                                    const user = users.find(u => u.id === imp.userId);
                                    return (
                                        <div key={imp.id} className="p-2 bg-red-50 dark:bg-red-900/10 border-l-2 border-red-400 rounded-r text-xs">
                                            <div className="flex justify-between font-bold text-gray-700 dark:text-gray-200">
                                                <span>{new Date(imp.date).toLocaleDateString()}</span>
                                                <span>{user?.nom}</span>
                                            </div>
                                            <div className="text-gray-500 mt-1 truncate" title={imp.reason}>{imp.reason}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* ASSIGNMENT MODAL */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                            <div>
                                <h3 className="text-xl font-bold dark:text-white flex items-center">
                                    <Calendar className="mr-2 text-primary"/> 
                                    {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-xs text-gray-500 uppercase font-bold mt-1">Assignation de l'équipe de garde</p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X/></button>
                        </div>

                        <div className="space-y-6">
                            {/* Infirmier Select */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Infirmier(ère)</label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar border rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                                    {infirmiers.map(u => {
                                        const imp = checkConflict(u.id, selectedDate);
                                        const isSelected = selectedInfirmier === u.id;
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => !imp && setSelectedInfirmier(u.id)}
                                                disabled={!!imp}
                                                className={`flex items-center justify-between p-2 rounded-md text-sm transition-all ${
                                                    isSelected ? 'bg-blue-100 text-blue-800 border-blue-300 border shadow-sm' : 
                                                    imp ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-white hover:shadow-sm'
                                                }`}
                                            >
                                                <span className="font-medium">{u.nom}</span>
                                                {imp ? <span className="text-xs text-red-500 font-bold flex items-center"><Lock size={10} className="mr-1"/> Absent</span> : isSelected && <CheckCircle size={16} className="text-blue-600"/>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Ambulancier Select */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Ambulancier(ère)</label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar border rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                                    {ambulanciers.map(u => {
                                        const imp = checkConflict(u.id, selectedDate);
                                        const isSelected = selectedAmbulancier === u.id;
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => !imp && setSelectedAmbulancier(u.id)}
                                                disabled={!!imp}
                                                className={`flex items-center justify-between p-2 rounded-md text-sm transition-all ${
                                                    isSelected ? 'bg-green-100 text-green-800 border-green-300 border shadow-sm' : 
                                                    imp ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-white hover:shadow-sm'
                                                }`}
                                            >
                                                <span className="font-medium">{u.nom}</span>
                                                {imp ? <span className="text-xs text-red-500 font-bold flex items-center"><Lock size={10} className="mr-1"/> Absent</span> : isSelected && <CheckCircle size={16} className="text-green-600"/>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-8 pt-4 border-t dark:border-gray-700">
                            <button onClick={handleClearSingleShift} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors flex items-center text-sm font-bold" title="Effacer la garde">
                                <Eraser size={16} className="mr-2"/> Vider
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setSelectedDate(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-md">Annuler</button>
                                <button 
                                    onClick={handleSaveSingleShift} 
                                    className="px-6 py-2 bg-primary text-white rounded-md font-bold shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                                >
                                    Valider
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PlanningManagement;
