
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import Dexie from 'dexie';
import { useLiveQuery } from "dexie-react-hooks";
import { db, initDB } from '../db';
import { mockedFetch } from '../api/mockApi';
import { useNotification } from './NotificationProvider';
import { 
    Patient, User, Intervention, Receipt, StockItem, OxygenBottle, Shift, 
    VerificationRecord, Tarif, ChecklistItems, HeaderInfo, Vehicle, Permissions,
    Impediment, AppNotification, ActivityLog, Payslip, TauxSalarial, ChatMessage, InternalMessage, ChatGroup
} from '../types';

const apiClient = async (input: RequestInfo | URL, init?: RequestInit): Promise<any> => {
    const response = await mockedFetch(input, init);
    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const data = await response.json();
            if(data && data.error) errorMsg = data.error;
        } catch(e) {}
        throw new Error(errorMsg);
    }
    if (response.status !== 204) {
        return response.json();
    }
    return null;
};

interface DataContextType {
    patients?: Patient[];
    interventions?: Intervention[];
    receipts?: Receipt[];
    stockItems?: StockItem[];
    oxygenBottles?: OxygenBottle[];
    users?: User[];
    shifts?: Shift[];
    verifications?: VerificationRecord[];
    tarifs?: Tarif[];
    nurseChecklistItems?: ChecklistItems;
    ambulancierChecklistItems?: ChecklistItems;
    pmaChecklistItems?: ChecklistItems;
    headerInfo?: HeaderInfo;
    vehiculesData: Vehicle[];
    vehicules: string[]; 
    permissions?: Permissions;
    impediments?: Impediment[];
    appNotifications?: AppNotification[]; 
    allNotifications?: AppNotification[]; 
    activityLogs?: ActivityLog[];
    payslips?: Payslip[];
    tauxSalariaux?: TauxSalarial[];
    tchatHistory?: ChatMessage[];
    internalMessages?: InternalMessage[];
    chatGroups?: ChatGroup[];

    addPatient: (patient: Omit<Patient, 'id' | 'dateCreation'>) => Promise<void>;
    updatePatient: (patient: Patient) => Promise<void>;
    deletePatient: (patientId: string) => Promise<void>;

    addUser: (user: Omit<User, 'id' | 'profilePicture' | 'lastUpdated'>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string, userName?: string) => Promise<void>;
    
    addIntervention: (intervention: Omit<Intervention, 'id' | 'dateCreation'>) => Promise<void>;
    updateIntervention: (intervention: Intervention) => Promise<void>;
    deleteIntervention: (interventionId: string, patientName?: string) => Promise<void>;
    alertInterventionTeam: (interventionId: string) => Promise<void>;

    addReceipt: (receipt: Receipt) => Promise<void>;
    updateReceipt: (receipt: Receipt) => Promise<void>;
    deleteReceipt: (receiptId: string, receiptNumber?: string) => Promise<void>;
    
    addStockItem: (item: Omit<StockItem, 'id'>) => Promise<void>;
    updateStockItem: (item: StockItem) => Promise<void>;
    deleteStockItem: (itemId: string, itemName?: string) => Promise<void>;
    
    addOxygenBottle: (item: Omit<OxygenBottle, 'id'>) => Promise<void>;
    updateOxygenBottle: (item: OxygenBottle) => Promise<void>;
    deleteOxygenBottle: (itemId: string, serial?: string) => Promise<void>;

    saveShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
    bulkAddShifts: (shifts: Shift[]) => Promise<void>;
    requestShiftChange: (shiftId: number, userId: string, reason: string) => Promise<void>;
    resolveShiftChange: (shiftId: number) => Promise<void>;
    
    addVerification: (record: VerificationRecord) => Promise<void>;
    updateVerification: (record: VerificationRecord) => Promise<void>;
    deleteVerification: (recordId: string) => Promise<void>;
    
    addTarif: (tarif: Omit<Tarif, 'id'>) => Promise<void>;
    updateTarif: (tarif: Tarif) => Promise<void>;
    deleteTarif: (tarifId: string) => Promise<void>;
    
    updateNurseChecklistItems: (items: ChecklistItems) => Promise<void>;
    updateAmbulancierChecklistItems: (items: ChecklistItems) => Promise<void>;
    updatePmaChecklistItems: (items: ChecklistItems) => Promise<void>;
    updateHeaderInfo: (info: HeaderInfo) => Promise<void>;
    
    addVehicule: (vehicle: Vehicle) => Promise<void>;
    updateVehicule: (vehicle: Vehicle) => Promise<void>;
    deleteVehicule: (id: string) => Promise<void>;
    
    updatePermissions: (permissions: Permissions) => Promise<void>;
    saveImpediment: (impediment: Omit<Impediment, 'id'>) => Promise<void>;
    deleteImpediment: (userId: string, date: string) => Promise<void>;
    acknowledgeImpediment: (impedimentId: number) => Promise<void>;
    
    sendAppNotification: (targetIds: string[], message: string) => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    
    updateTauxSalarial: (taux: Omit<TauxSalarial, 'id'>) => Promise<void>;
    bulkAddPayslips: (payslips: Payslip[], period: string) => Promise<void>;
    updatePayslip: (payslip: Payslip) => Promise<void>;
    deletePayslip: (payslipId: string) => Promise<void>;

    addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
    
    sendInternalMessage: (message: Omit<InternalMessage, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
    markInternalMessageAsRead: (id: string) => Promise<void>;
    
    createChatGroup: (group: Omit<ChatGroup, 'id' | 'createdAt'>) => Promise<void>;

    clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function useLiveCollection<T>(table: Dexie.Table<T, any>): T[] | undefined {
    return useLiveQuery(() => table.toArray(), [table]);
}

function useLiveDocument<T>(table: Dexie.Table<T, any>, key: any): T | undefined {
    return useLiveQuery(() => key !== undefined && key !== null ? table.get(key) : undefined, [table, key]);
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDbReady, setIsDbReady] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const openDatabase = async () => {
            try {
                await (db as any).open();
                await initDB(); 
                setIsDbReady(true);
            } catch (err: any) {
                console.error("Failed to open database:", err);
                setDbError(err.message || "Could not initialize the database.");
            }
        };
        openDatabase();
        
        const checkUser = () => {
            const token = localStorage.getItem('authToken');
            if(token) {
                try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUserId(decoded.id);
                } catch(e) { setCurrentUserId(null); }
            } else {
                setCurrentUserId(null);
            }
        };
        checkUser();
        window.addEventListener('storage', checkUser);
    }, []);

    const patients = useLiveCollection<Patient>(db.patients);
    const users = useLiveCollection<User>(db.users) || [];
    const interventions = useLiveCollection<Intervention>(db.interventions);
    const receipts = useLiveCollection<Receipt>(db.receipts);
    const stockItems = useLiveCollection<StockItem>(db.stockItems);
    const oxygenBottles = useLiveCollection<OxygenBottle>(db.oxygenBottles);
    const shifts = useLiveCollection<Shift>(db.shifts);
    const verifications = useLiveCollection<VerificationRecord>(db.verifications);
    const tarifs = useLiveCollection<Tarif>(db.tarifs);
    const nurseChecklistItems = useLiveDocument<{ id: number, items: ChecklistItems }>(db.nurseChecklistItems, 1)?.items;
    const ambulancierChecklistItems = useLiveDocument<{ id: number, items: ChecklistItems }>(db.ambulancierChecklistItems, 1)?.items;
    const pmaChecklistItems = useLiveDocument<{ id: number, items: ChecklistItems }>(db.pmaChecklistItems, 1)?.items;
    const headerInfo = useLiveDocument<HeaderInfo>(db.headerInfo, 1);
    
    const vehiculesData = useLiveCollection<Vehicle>(db.vehicules) || [];
    const vehicules = useMemo(() => vehiculesData.map(v => v.id), [vehiculesData]);
    
    const permissions = useLiveDocument<{ id: number, permissions: Permissions }>(db.permissions, 1)?.permissions;
    const impediments = useLiveCollection<Impediment>(db.impediments);
    const activityLogs = useLiveCollection<ActivityLog>(db.activityLogs);
    const payslips = useLiveCollection<Payslip>(db.payslips);
    const tauxSalariaux = useLiveCollection<TauxSalarial>(db.tauxSalariaux);
    const tchatHistory = useLiveCollection<ChatMessage>(db.tchatHistory);
    const internalMessages = useLiveCollection<InternalMessage>(db.internalMessages);
    const chatGroups = useLiveCollection<ChatGroup>(db.chatGroups);

    const dbNotifications = useLiveCollection<AppNotification>(db.appNotifications);
    const appNotifications = useMemo(() => {
        const generatedNotifications: AppNotification[] = [];
        const now = new Date();
        
        stockItems?.forEach(item => {
            const lowStockId = `stock-low-${item.id}`;
            if (item.quantite <= item.seuilAlerte) {
                generatedNotifications.push({
                    id: lowStockId,
                    message: `Stock faible pour ${item.nom}. Quantité restante : ${item.quantite}.`,
                    type: 'stock_low',
                    timestamp: now.toISOString(),
                    isRead: false
                });
            }
            const expiryDate = new Date(item.datePeremption);
            const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
            const expiredId = `stock-exp-${item.id}`;
            if (daysUntilExpiry < 0) {
                 generatedNotifications.push({
                    id: expiredId,
                    message: `${item.nom} est périmé depuis le ${expiryDate.toLocaleDateString()}.`,
                    type: 'stock_expired',
                    timestamp: now.toISOString(),
                    isRead: false
                });
            }
        });
        
        impediments?.forEach(imp => {
            const impedimentId = `impediment-${imp.id}`;
            if (!imp.acknowledged) {
                const user = users.find(u => u.id === imp.userId);
                 generatedNotifications.push({
                    id: impedimentId,
                    message: `${user?.nom} a déclaré un empêchement le ${new Date(imp.date + 'T00:00:00').toLocaleDateString()}.`,
                    type: 'impediment',
                    timestamp: imp.id ? new Date(imp.id).toISOString() : now.toISOString(),
                    isRead: false
                });
            }
        });

        const DELAY_ON_SCENE_LIMIT = 45 * 60 * 1000;
        const DELAY_ENGAGEMENT_LIMIT = 10 * 60 * 1000;
        const CRITICAL_RESOURCE_THRESHOLD = 2;

        interventions?.forEach(interv => {
            const creationTime = new Date(interv.dateCreation).getTime();
            const elapsedTime = now.getTime() - creationTime;

            if (interv.status === 'En attente' && elapsedTime > DELAY_ENGAGEMENT_LIMIT) {
                generatedNotifications.push({
                    id: `reg-delay-eng-${interv.id}`,
                    message: `⚠️ Retard d'engagement : ${interv.patientName} attend depuis ${Math.floor(elapsedTime / 60000)} min.`,
                    type: 'regulation_alert',
                    timestamp: now.toISOString(),
                    isRead: false
                });
            }

            if (interv.status === 'En cours' && elapsedTime > DELAY_ON_SCENE_LIMIT) {
                generatedNotifications.push({
                    id: `reg-delay-scene-${interv.id}`,
                    message: `⚠️ Délai opérationnel : L'équipe pour ${interv.patientName} est engagée depuis +${Math.floor(elapsedTime / 60000)} min.`,
                    type: 'regulation_alert',
                    timestamp: now.toISOString(),
                    isRead: false
                });
            }
        });

        if (vehicules.length > 0 && interventions) {
            const activeMissions = interventions.filter(i => i.status === 'En cours').length;
            const availableCount = vehicules.length - activeMissions;
            
            if (availableCount < CRITICAL_RESOURCE_THRESHOLD) {
                generatedNotifications.push({
                    id: `reg-low-resource-${now.getHours()}`,
                    message: `🔴 Ressources Critiques : Seulement ${availableCount} véhicule(s) disponible(s).`,
                    type: 'regulation_alert',
                    timestamp: now.toISOString(),
                    isRead: false
                });
            }
        }
        
        if (dbNotifications && currentUserId) {
            const myNotifications = dbNotifications.filter(n => n.targetUserId === currentUserId);
            generatedNotifications.push(...myNotifications);
        }
        
        return generatedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [stockItems, impediments, users, dbNotifications, currentUserId, interventions, vehicules]);

    const { addNotification } = useNotification();
    const handleApiError = (error: any, operation: string) => {
        console.error(`${operation} failed:`, error);
        addNotification(error.message || `L'opération "${operation}" a échoué.`, 'error');
    };
    
    const createApiFunction = (endpoint: string, method: 'POST' | 'PUT' | 'DELETE', operationName: string) => 
        async (data?: any) => {
            try {
                let fullEndpoint = endpoint;
                if( (method === 'DELETE' || method === 'PUT') && typeof data === 'string' ) {
                    fullEndpoint = `${endpoint}/${data}`;
                    data = undefined;
                }
                await apiClient(fullEndpoint, { method, ...(data && { body: JSON.stringify(data) }) });
            } catch (e) {
                handleApiError(e, operationName);
            }
        };

    const contextValue: DataContextType = {
        patients, interventions, receipts, stockItems, oxygenBottles, users, shifts, verifications, tarifs, nurseChecklistItems, ambulancierChecklistItems, pmaChecklistItems, headerInfo, 
        vehiculesData, vehicules, 
        permissions, impediments, appNotifications, activityLogs, payslips, tauxSalariaux, tchatHistory, internalMessages, chatGroups,
        allNotifications: dbNotifications,

        addPatient: createApiFunction('/api/patients', 'POST', 'addPatient'),
        updatePatient: createApiFunction('/api/patients', 'PUT', 'updatePatient'),
        deletePatient: createApiFunction('/api/patients', 'DELETE', 'deletePatient'),
        addUser: createApiFunction('/api/users', 'POST', 'addUser'),
        updateUser: createApiFunction('/api/users', 'PUT', 'updateUser'),
        deleteUser: createApiFunction('/api/users', 'DELETE', 'deleteUser'),
        addIntervention: createApiFunction('/api/interventions', 'POST', 'addIntervention'),
        updateIntervention: createApiFunction('/api/interventions', 'PUT', 'updateIntervention'),
        deleteIntervention: createApiFunction('/api/interventions', 'DELETE', 'deleteIntervention'),
        
        addReceipt: createApiFunction('/api/receipts', 'POST', 'addReceipt'),
        updateReceipt: createApiFunction('/api/receipts', 'PUT', 'updateReceipt'),
        deleteReceipt: createApiFunction('/api/receipts', 'DELETE', 'deleteReceipt'),
        addStockItem: createApiFunction('/api/stock', 'POST', 'addStockItem'),
        updateStockItem: createApiFunction('/api/stock', 'PUT', 'updateStockItem'),
        deleteStockItem: createApiFunction('/api/stock', 'DELETE', 'deleteStockItem'),
        
        addOxygenBottle: createApiFunction('/api/oxygen', 'POST', 'addOxygenBottle'),
        updateOxygenBottle: createApiFunction('/api/oxygen', 'PUT', 'updateOxygenBottle'),
        deleteOxygenBottle: createApiFunction('/api/oxygen', 'DELETE', 'deleteOxygenBottle'),

        saveShift: createApiFunction('/api/shifts', 'POST', 'saveShift'),
        bulkAddShifts: createApiFunction('/api/shifts/bulk', 'POST', 'bulkAddShifts'),
        addVerification: createApiFunction('/api/verifications', 'POST', 'addVerification'),
        updateVerification: createApiFunction('/api/verifications', 'PUT', 'updateVerification'),
        deleteVerification: createApiFunction('/api/verifications', 'DELETE', 'deleteVerification'),
        addTarif: createApiFunction('/api/tarifs', 'POST', 'addTarif'),
        updateTarif: createApiFunction('/api/tarifs', 'PUT', 'updateTarif'),
        deleteTarif: createApiFunction('/api/tarifs', 'DELETE', 'deleteTarif'),
        updateNurseChecklistItems: createApiFunction('/api/checklists/nurse', 'POST', 'updateNurseChecklistItems'),
        updateAmbulancierChecklistItems: createApiFunction('/api/checklists/ambulancier', 'POST', 'updateAmbulancierChecklistItems'),
        updatePmaChecklistItems: createApiFunction('/api/checklists/pma', 'POST', 'updatePmaChecklistItems'),
        updateHeaderInfo: createApiFunction('/api/company-info', 'POST', 'updateHeaderInfo'),
        
        addVehicule: createApiFunction('/api/vehicules', 'POST', 'addVehicule'),
        updateVehicule: createApiFunction('/api/vehicules', 'PUT', 'updateVehicule'),
        deleteVehicule: createApiFunction('/api/vehicules', 'DELETE', 'deleteVehicule'),
        
        updatePermissions: createApiFunction('/api/permissions', 'POST', 'updatePermissions'),
        saveImpediment: createApiFunction('/api/impediments', 'POST', 'saveImpediment'),
        
        requestShiftChange: async (shiftId, userId, reason) => { try { await apiClient(`/api/shifts/${shiftId}/request-change`, { method: 'POST', body: JSON.stringify({ userId, reason }) }); } catch(e) { handleApiError(e, 'requestShiftChange'); }},
        resolveShiftChange: async (shiftId) => { try { await apiClient(`/api/shifts/${shiftId}/resolve-change`, { method: 'POST' }); } catch(e) { handleApiError(e, 'resolveShiftChange'); }},
        deleteImpediment: async (userId, date) => { try { await apiClient(`/api/impediments`, { method: 'DELETE', body: JSON.stringify({ userId, date }) }); } catch(e) { handleApiError(e, 'deleteImpediment'); }},
        acknowledgeImpediment: async (id) => { try { await apiClient(`/api/impediments/${id}/ack`, { method: 'POST' }); } catch(e) { handleApiError(e, 'acknowledgeImpediment'); }},
        
        alertInterventionTeam: async (interventionId: string) => {
            const intervention = interventions?.find(i => i.id === interventionId);
            if (!intervention) throw new Error("Intervention non trouvée");
            const targets = [];
            if (intervention.infirmierId) targets.push(intervention.infirmierId);
            if (intervention.ambulancierId) targets.push(intervention.ambulancierId);
            if (targets.length === 0) throw new Error("Aucune équipe assignée à alerter.");
            const now = new Date().toISOString();
            const message = `Nouvelle intervention urgente ! Patient: ${intervention.patientName || 'Inconnu'}, Départ: ${intervention.adresseDepart}`;
            await Promise.all(targets.map(userId => 
                db.appNotifications.add({
                    id: `alert-${Date.now()}-${userId}`,
                    targetUserId: userId,
                    message,
                    type: 'intervention_alert',
                    timestamp: now,
                    isRead: false,
                    linkToView: 'interventions'
                })
            ));
        },
        
        sendAppNotification: async (targetIds: string[], message: string) => {
            const notifications = targetIds.map(userId => ({
                id: `msg-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 5)}`,
                targetUserId: userId,
                message,
                type: 'general_message' as 'general_message',
                timestamp: new Date().toISOString(),
                isRead: false
            }));
            try {
                await apiClient('/api/notifications', { method: 'POST', body: JSON.stringify(notifications) });
            } catch (e) {
                handleApiError(e, 'sendAppNotification');
            }
        },

        markNotificationAsRead: async (id: string) => {
            try { await db.appNotifications.update(id, { isRead: true }); } catch(e) { console.error("Failed to mark notification as read", e); }
        },
        markAllNotificationsAsRead: async () => {
             try { 
                const unread = appNotifications?.filter(n => !n.isRead && n.targetUserId === currentUserId) || [];
                await Promise.all(unread.map(n => {
                    if(n.id.startsWith('alert-') || n.id.startsWith('msg-')) {
                        return db.appNotifications.update(n.id, { isRead: true });
                    }
                    return Promise.resolve();
                }));
             } catch(e) { console.error("Failed to mark all as read", e); }
        },
        
        updateTauxSalarial: createApiFunction('/api/taux-salariaux', 'POST', 'updateTauxSalarial'),
        updatePayslip: createApiFunction('/api/payslips', 'PUT', 'updatePayslip'),
        deletePayslip: createApiFunction('/api/payslips', 'DELETE', 'deletePayslip'),
        bulkAddPayslips: async (payslips, period) => {
            try {
                await apiClient('/api/payslips/bulk', { method: 'POST', body: JSON.stringify({ payslips, period }) });
            } catch (e) {
                handleApiError(e, 'bulkAddPayslips');
            }
        },

        addChatMessage: async (message) => {
            try {
                await db.tchatHistory.add({ ...message, id: Date.now().toString(), timestamp: new Date().toISOString() });
            } catch(e) {
                console.error("Failed to save chat message", e);
            }
        },

        sendInternalMessage: async (message) => {
            try {
                await apiClient('/api/messages', { method: 'POST', body: JSON.stringify(message) });
            } catch(e) {
                handleApiError(e, 'sendInternalMessage');
            }
        },

        markInternalMessageAsRead: async (id) => {
            try {
                await db.internalMessages.update(id, { isRead: true });
            } catch (e) {
                console.error("Failed to mark message as read", e);
            }
        },

        createChatGroup: createApiFunction('/api/chat-groups', 'POST', 'createChatGroup'),

        clearAllData: createApiFunction('/api/data/reset', 'POST', 'clearAllData')
    };
    
    if (dbError) {
        return <div className="p-4 text-red-600">Erreur DB: {dbError}</div>;
    }

    if (!isDbReady) {
        return <div className="p-4">Chargement...</div>;
    }
    
    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
