
import Dexie, { type Table } from 'dexie';
import { 
    Patient, Intervention, Receipt, StockItem, User, Shift, VerificationRecord, Tarif,
    ChecklistItems, HeaderInfo, Permissions,
    Impediment, AppNotification, ActivityLog, Payslip, TauxSalarial, ChatMessage, OxygenBottle, Vehicle, InternalMessage, ChatGroup
} from './types';
import { 
    DEFAULT_USERS, DEFAULT_TARIFS, DEFAULT_NURSE_CHECKLIST_ITEMS, 
    DEFAULT_AMBULANCIER_CHECKLIST_ITEMS, DEFAULT_PATIENTS, DEFAULT_APP_LOGO
} from './constants';

const DEFAULT_HEADER_INFO: HeaderInfo = {
    id: 1,
    logo: DEFAULT_APP_LOGO,
    companyName: 'MedEvac',
    address: '123 Rue de la Santé\n75001 Paris, France',
    phone: '01 23 45 67 89',
    email: 'contact@medevac.com',
    nif: '123456789',
    rc: 'RCS Paris B 123 456 789',
    ice: '001234567890123',
    cnss: '987654321',
    website: 'www.medevac-demo.com'
};

const DEFAULT_PERMISSIONS: Permissions = {
    admin: ['dashboard', 'patients', 'interventions', 'receipts', 'planning', 'stock', 'oxygen', 'nurse-verification', 'ambulancier-verification', 'admin', 'profile', 'messages', 'pma'],
    infirmier: ['dashboard', 'patients', 'interventions', 'planning', 'stock', 'oxygen', 'nurse-verification', 'profile', 'messages', 'pma'],
    ambulancier: ['dashboard', 'interventions', 'planning', 'oxygen', 'ambulancier-verification', 'profile', 'messages', 'pma'],
    regulateur: ['dashboard', 'patients', 'interventions', 'planning', 'profile', 'messages', 'pma'],
    medecin: ['dashboard', 'patients', 'interventions', 'planning', 'stock', 'oxygen', 'nurse-verification', 'profile', 'messages', 'pma']
};

const DEFAULT_PMA_CHECKLIST_ITEMS: ChecklistItems = {
    "Infrastructure & Sécurité": [
        "Tente PMA montée et sécurisée",
        "Balisage Entrée / Sortie en place",
        "Éclairage zone de soins fonctionnel",
        "Groupe électrogène opérationnel",
        "Zone de dépose brancards dégagée"
    ],
    "Poste de Triage (Entrée)": [
        "Médecin trieur en place",
        "Bracelets / Fiches de triage disponibles",
        "Tableau de régulation (Main courante) prêt",
        "Radio communication testée"
    ],
    "Zone de Soins (UA/UR)": [
        "Oxygène (Multi-postes) disponible",
        "Sacs PS / Lots catastrophe répartis",
        "Défibrillateur / Scope prêt",
        "Glacière / Gestion des corps (DCD)"
    ],
    "Logistique & Évacuation": [
        "Norias d'ambulances organisées",
        "Gestion des déchets (DASRI)",
        "Ravitaillement en eau potable",
        "Couvertures de survie en nombre suffisant"
    ]
};

export class MedEvacDB extends Dexie {
    patients!: Table<Patient>;
    interventions!: Table<Intervention>;
    receipts!: Table<Receipt>;
    stockItems!: Table<StockItem>;
    oxygenBottles!: Table<OxygenBottle>;
    users!: Table<User>;
    shifts!: Table<Shift>;
    verifications!: Table<VerificationRecord>;
    tarifs!: Table<Tarif>;
    nurseChecklistItems!: Table<{ id: number; items: ChecklistItems }>;
    ambulancierChecklistItems!: Table<{ id: number; items: ChecklistItems }>;
    pmaChecklistItems!: Table<{ id: number; items: ChecklistItems }>;
    headerInfo!: Table<HeaderInfo>;
    vehicules!: Table<Vehicle>;
    permissions!: Table<{ id: number; permissions: Permissions }>;
    impediments!: Table<Impediment>;
    appNotifications!: Table<AppNotification>;
    activityLogs!: Table<ActivityLog>;
    payslips!: Table<Payslip>;
    tauxSalariaux!: Table<TauxSalarial>;
    tchatHistory!: Table<ChatMessage>;
    internalMessages!: Table<InternalMessage>;
    chatGroups!: Table<ChatGroup>; // Nouvelle table

    constructor() {
        super('medevacDB');
        (this as any).version(1).stores({
            patients: 'id, dateCreation, nom, prenom, triageStatus', 
            interventions: 'id, dateCreation, patientId, status, type, infirmierId, ambulancierId',
            receipts: 'id, numero, date, patientId',
            stockItems: 'id, nom, categorie, datePeremption, quantite',
            oxygenBottles: 'id, serialNumber, status, location',
            users: 'id, nom, role, email',
            shifts: '++id, date, infirmierId, ambulancierId, medecinId',
            verifications: 'id, date, user, userId, type, vehicleId',
            tarifs: 'id',
            nurseChecklistItems: 'id',
            ambulancierChecklistItems: 'id',
            pmaChecklistItems: 'id',
            headerInfo: 'id',
            vehicules: 'id, type, status',
            permissions: 'id',
            impediments: '++id, &[userId+date], userId, date',
            appNotifications: 'id, isRead, timestamp, targetUserId',
            activityLogs: '++id, timestamp, userId, action',
            payslips: 'id, userId, period, sentDate', 
            tauxSalariaux: '++id, role', 
            tchatHistory: '++id, timestamp',
            internalMessages: 'id, timestamp, senderId, receiverId, groupId, isRead', // Added groupId
            chatGroups: 'id, name' // New table definition
        });
    }
}

export const db = new MedEvacDB();

export const initDB = async () => {
    // FIX: Cast db to any to avoid TS error 'Property transaction/tables does not exist on type MedEvacDB'
    await (db as any).transaction('rw', (db as any).tables, async () => {
        const count = await db.users.count();
        if (count === 0) {
            await db.users.bulkAdd(DEFAULT_USERS);
            await db.patients.bulkAdd(DEFAULT_PATIENTS);
            await db.tarifs.bulkAdd(DEFAULT_TARIFS);
            await db.nurseChecklistItems.add({ id: 1, items: DEFAULT_NURSE_CHECKLIST_ITEMS });
            await db.ambulancierChecklistItems.add({ id: 1, items: DEFAULT_AMBULANCIER_CHECKLIST_ITEMS });
            await db.pmaChecklistItems.add({ id: 1, items: DEFAULT_PMA_CHECKLIST_ITEMS });
            await db.headerInfo.add(DEFAULT_HEADER_INFO);
            await db.vehicules.bulkAdd([
                { 
                    id: 'AMB-001', 
                    type: 'ASSU', 
                    brand: 'Mercedes', 
                    model: 'Sprinter', 
                    status: 'Disponible', 
                    mileage: 125000, 
                    lastMaintenance: '2023-12-01', 
                    nextMaintenance: '2024-06-01',
                    registrationDate: '2020-01-01',
                    insuranceExpiry: '2025-01-01',
                    technicalVisitExpiry: '2025-01-01'
                },
                { 
                    id: 'AMB-002', 
                    type: 'VSL', 
                    brand: 'Renault', 
                    model: 'Traffic', 
                    status: 'En mission', 
                    mileage: 89000, 
                    lastMaintenance: '2024-01-15', 
                    nextMaintenance: '2024-07-15',
                    registrationDate: '2021-01-01',
                    insuranceExpiry: '2025-01-01',
                    technicalVisitExpiry: '2025-01-01'
                }
            ]);
            await db.permissions.add({ id: 1, permissions: DEFAULT_PERMISSIONS });
            await db.tauxSalariaux.bulkAdd([
                { role: 'infirmier', tauxParGarde: 300 },
                { role: 'ambulancier', tauxParGarde: 250 },
                { role: 'regulateur', tauxParGarde: 350 },
                { role: 'medecin', tauxParGarde: 500 },
            ]);
            await db.oxygenBottles.bulkAdd([
                { id: '1', serialNumber: 'O2-A101', capacity: 5, currentPressure: 200, status: 'Pleine', location: 'AMB-001', lastRefill: new Date().toISOString(), expiryDate: '2026-01-01' },
                { id: '2', serialNumber: 'O2-B202', capacity: 2, currentPressure: 50, status: 'En cours', location: 'AMB-001', lastRefill: '2023-12-01', expiryDate: '2025-06-01' },
                { id: '3', serialNumber: 'O2-C303', capacity: 15, currentPressure: 10, status: 'Vide', location: 'Stock', lastRefill: '2023-10-01', expiryDate: '2025-12-31' },
            ]);
            
            // Créer un groupe par défaut pour la démo
            await db.chatGroups.add({
                id: 'group-general',
                name: 'Général',
                members: DEFAULT_USERS.map(u => u.id),
                createdBy: '0',
                createdAt: new Date().toISOString()
            });
        } else {
            // Migrations existantes...
            const permRecord = await db.permissions.get(1);
            if (permRecord) {
                if (!permRecord.permissions.medecin) {
                    await db.permissions.update(1, { permissions: DEFAULT_PERMISSIONS });
                }
                if (!permRecord.permissions.admin.includes('pma')) {
                    await db.permissions.update(1, { permissions: DEFAULT_PERMISSIONS });
                }
            }
            const medecinRate = await db.tauxSalariaux.where('role').equals('medecin').first();
            if (!medecinRate) {
                await db.tauxSalariaux.add({ role: 'medecin', tauxParGarde: 500 });
            }
            const pmaCheck = await db.pmaChecklistItems.get(1);
            if (!pmaCheck) {
                await db.pmaChecklistItems.add({ id: 1, items: DEFAULT_PMA_CHECKLIST_ITEMS });
            }
            // Check si le groupe général existe (migration)
            const generalGroup = await db.chatGroups.get('group-general');
            if (!generalGroup) {
                // Récupérer tous les users actuels
                const allUsers = await db.users.toArray();
                await db.chatGroups.add({
                    id: 'group-general',
                    name: 'Général',
                    members: allUsers.map(u => u.id),
                    createdBy: 'system',
                    createdAt: new Date().toISOString()
                });
            }
        }
    });
};

(db as any).on('populate', initDB);