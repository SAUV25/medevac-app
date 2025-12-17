/* -------------------------------------------------------------------------- */
/*                                  SYSTEM                                    */
/* -------------------------------------------------------------------------- */

export type ViewContext = { [key: string]: any };

export interface HeaderInfo {
    id: number;
    logo: string | null;
    companyName: string;
    address: string;
    phone: string;
    email: string;
    nif: string;
    rc: string;
    ice: string;
    cnss: string;
    website: string;
}

export interface AppNotification {
    id: string;
    targetUserId?: string; // Who receives this
    message: string;
    type: 'stock_low' | 'stock_expired' | 'impediment' | 'intervention_alert' | 'general_message' | 'regulation_alert';
    timestamp: string;
    isRead: boolean;
    linkToView?: string; // Optional context link
}

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface ActivityLog {
    id?: number;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    parts: { text: string }[];
    timestamp: string;
}

// Interface pour les groupes de discussion
export interface ChatGroup {
    id: string;
    name: string;
    members: string[]; // Array of User IDs
    createdBy: string;
    createdAt: string;
}

// Updated Interface for Team Chat
export interface InternalMessage {
    id: string;
    senderId: string;
    receiverId?: string; // Null if group message
    groupId?: string;    // Null if direct message
    content: string;
    timestamp: string;
    isRead: boolean; // For groups, this might need more complex logic (readBy array), but kept simple for now
    attachment?: {
        type: 'image' | 'file';
        url: string; // Base64 string
        name: string;
    };
}

/* -------------------------------------------------------------------------- */
/*                                  DOMAIN                                    */
/* -------------------------------------------------------------------------- */

export type UserRole = 'admin' | 'infirmier' | 'ambulancier' | 'regulateur' | 'medecin';

export interface User {
    id: string;
    nom: string;
    role: UserRole;
    email: string;
    password: string;
    profilePicture: string | null;
    isActive: boolean;
    isTwoFactorEnabled?: boolean; // New security field
    lastUpdated: string;
}

export interface PatientDocument {
    id: string;
    name: string;
    type: string;
    url: string;
    dateAdded: string;
}

export interface BodyInjury {
    id: string;
    x: number;
    y: number;
    view: 'front' | 'back';
    type: 'pain' | 'wound' | 'bruise' | 'burn';
    description?: string;
}

export type TriageStatus = 'UA' | 'UR' | 'UIMP' | 'DCD' | null;

export interface Patient {
    id: string;
    dateCreation: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    age: string;
    sexe: 'Homme' | 'Femme' | 'Autre';
    adresse: string;
    telephone: string;
    motifAppel: string;
    circonstances: string;
    
    // Vitals
    taSystolique: string;
    taDiastolique: string;
    frequenceCardiaque: string;
    frequenceRespiratoire: string;
    spO2: string;
    temperature: string;
    glycemie: string;
    echelleDouleur: string;
    scoreGlasgow: string;
    gcs_eye?: string;
    gcs_verbal?: string;
    gcs_motor?: string;

    // Primary Survey (ABCDE)
    bilanPrimaireA: string;
    bilanPrimaireA_Status: 'stable' | 'unstable' | 'critical';
    bilanPrimaireB: string;
    bilanPrimaireB_Status: 'stable' | 'unstable' | 'critical';
    bilanPrimaireC: string;
    bilanPrimaireC_Status: 'stable' | 'unstable' | 'critical';
    bilanPrimaireD: string;
    bilanPrimaireD_Status: 'stable' | 'unstable' | 'critical';
    bilanPrimaireE: string;
    bilanPrimaireE_Status: 'stable' | 'unstable' | 'critical';

    // Secondary Survey
    plaintePrincipale: string;
    descriptionPQRST: string;
    pqrst_p?: string;
    pqrst_q?: string;
    pqrst_r?: string;
    pqrst_s?: string;
    pqrst_t?: string;
    
    examenPhysique: string;
    injuries: BodyInjury[];

    // SAMPLE
    sampleSignes: string;
    allergies: string;
    sampleMedicaments: string;
    antecedents: string;
    sampleDernierRepas: string;
    sampleEvenements: string;

    observations: string;
    contactUrgenceNom: string;
    contactUrgenceTelephone: string;
    documents: PatientDocument[];

    // PMA Specific
    sinusId?: string;
    triageStatus?: TriageStatus;
    pmaAdmissionDate?: string;
}

export type InterventionStatus = "En attente" | "En cours" | "Terminé" | "Annulé";
export type InterventionType = "Urgence" | "Programmé" | "Transfert";

export interface Intervention {
    id: string;
    patientName: string;
    patientId?: string;
    adresseDepart: string;
    adresseArrivee: string;
    type: InterventionType;
    status: InterventionStatus;
    equipe: string;
    infirmierId?: string;
    ambulancierId?: string;
    medecinId?: string;
    notes: string;
    dateCreation: string;
}

export interface Tarif {
    id: string;
    description: string;
    prix: number;
    categorie?: string;
}

export interface ReceiptItem extends Tarif {
    quantite: number;
}

export interface ModificationLog {
    date: string;
    user: string;
    action: 'created' | 'modified';
}

export interface Receipt {
    id: string;
    numero: string;
    date: string;
    patientId?: string;
    patientName?: string;
    patientAddress?: string;
    items: ReceiptItem[];
    sousTotal: number;
    total: number;
    notes?: string;
    history: ModificationLog[];
}

export type StockCategory = "Médicaments" | "Consommables médicaux";

export interface StockItem {
    id: string;
    nom: string;
    categorie: StockCategory;
    quantite: number;
    seuilAlerte: number;
    datePeremption: string;
}

export type OxygenStatus = 'Pleine' | 'En cours' | 'Vide' | 'Maintenance';

export interface OxygenBottle {
    id: string;
    serialNumber: string;
    capacity: number;
    currentPressure: number;
    status: OxygenStatus;
    location: string;
    lastRefill: string;
    expiryDate: string;
}

export interface Shift {
    id?: number;
    date: string;
    infirmierId: string;
    ambulancierId: string;
    medecinId?: string;
    changeRequest?: {
        userId: string;
        reason: string;
        status: 'pending' | 'resolved' | 'rejected';
        timestamp: string;
    };
}

export interface Impediment {
    id?: number;
    userId: string;
    date: string;
    reason: string;
    acknowledged?: boolean;
}

export type ChecklistItems = Record<string, string[]>;

export interface VerificationRecord {
    id: string;
    date: string;
    user: string;
    userId?: string;
    vehicleId: string;
    type: 'Infirmier' | 'Ambulancier';
    data: Record<string, string | null>;
    comments: string;
    completed: boolean;
}

export type VehicleStatus = 'Disponible' | 'En mission' | 'Maintenance' | 'Hors service';
export type VehicleType = 'ASSU' | 'VSL' | 'UMH' | 'VLM';

export interface Vehicle {
    id: string;
    type: VehicleType;
    brand: string;
    model: string;
    status: VehicleStatus;
    mileage: number;
    fuelLevel?: string;
    lastMaintenance: string;
    nextMaintenance: string;
    registrationDate: string;
    insuranceExpiry: string;
    technicalVisitExpiry: string;
    additionalTracking?: string;
}

export type AppPermission = 
    | 'dashboard' 
    | 'patients' 
    | 'interventions' 
    | 'receipts' 
    | 'planning' 
    | 'stock' 
    | 'oxygen' 
    | 'nurse-verification' 
    | 'ambulancier-verification' 
    | 'admin' 
    | 'profile' 
    | 'messages' 
    | 'pma';

export type Permissions = Record<UserRole, AppPermission[]>;

export interface TauxSalarial {
    id?: number;
    role: UserRole;
    tauxParGarde: number;
}

export interface Payslip {
    id: string;
    userId: string;
    userName: string;
    period: string;
    dateGeneration: string;
    items: {
        description: string;
        quantite: number;
        taux: number;
        montant: number;
        type: 'gain' | 'deduction';
    }[];
    brut: number;
    totalDeductions: number;
    net: number;
    sentDate?: string;
}