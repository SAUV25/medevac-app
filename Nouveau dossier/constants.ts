
// FIX: Corrected import path for types to be relative.
import { Tarif, User, InterventionType, Patient } from './types';

// Logo par défaut de l'application
export const DEFAULT_APP_LOGO = 'https://i.imgur.com/8Q5Z2gS.png';

export const DEFAULT_USERS: User[] = [
    { id: '0', nom: 'Administrateur', role: 'admin', email: 'admin@medevac.com', password: 'admin', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '1', nom: 'Alice Infirmier', role: 'infirmier', email: 'alice@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '2', nom: 'Bob Ambulancier', role: 'ambulancier', email: 'bob@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '3', nom: 'Carla Infirmier', role: 'infirmier', email: 'carla@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '4', nom: 'David Ambulancier', role: 'ambulancier', email: 'david@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '5', nom: 'Eva Infirmier', role: 'infirmier', email: 'eva@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '6', nom: 'Frank Ambulancier', role: 'ambulancier', email: 'frank@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '7', nom: 'Gérald Régulateur', role: 'regulateur', email: 'gerald@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() },
    { id: '8', nom: 'Dr. House', role: 'medecin', email: 'house@med.com', password: 'password', profilePicture: null, isActive: true, lastUpdated: new Date().toISOString() }
];

export const DEFAULT_PATIENTS: Patient[] = [
    {
        id: 'demo-patient-1',
        dateCreation: new Date().toISOString(),
        nom: 'Dupont',
        prenom: 'Jean',
        dateNaissance: '1985-06-15',
        age: '38',
        sexe: 'Homme',
        adresse: '12 Avenue de la République, 75011 Paris',
        telephone: '06 12 34 56 78',
        motifAppel: 'Traumatisme membre inférieur',
        circonstances: 'Chute de scooter à faible cinétique.',
        taSystolique: '130',
        taDiastolique: '80',
        frequenceCardiaque: '88',
        frequenceRespiratoire: '16',
        spO2: '98',
        temperature: '37.0',
        glycemie: '1.05',
        echelleDouleur: '6',
        scoreGlasgow: '15',
        gcs_eye: '4',
        gcs_verbal: '5',
        gcs_motor: '6',
        bilanPrimaireA: 'Voies aériennes libres, pas de stridor.',
        bilanPrimaireA_Status: 'stable',
        bilanPrimaireB: 'Eupnéique, murmure vésiculaire symétrique.',
        bilanPrimaireB_Status: 'stable',
        bilanPrimaireC: 'Hémodynamique stable, pouls pédieux perçus.',
        bilanPrimaireC_Status: 'stable',
        bilanPrimaireD: 'Conscient, orienté, GCS 15.',
        bilanPrimaireD_Status: 'stable',
        bilanPrimaireE: 'Dermabrasion genou droit.',
        bilanPrimaireE_Status: 'stable',
        plaintePrincipale: 'Douleur vive genou droit',
        descriptionPQRST: '',
        pqrst_p: 'Mouvement',
        pqrst_q: 'Brûlure/Lancement',
        pqrst_r: 'Genou Droit',
        pqrst_s: '6/10',
        pqrst_t: '30 min',
        examenPhysique: 'Douleur à la palpation rotule droite. Pas de déformation majeure. Mobilité réduite par la douleur.',
        injuries: [
            { id: 'inj-1', x: 105, y: 365, view: 'front', type: 'wound', description: 'Plaie superficielle' },
            { id: 'inj-2', x: 105, y: 375, view: 'front', type: 'bruise', description: 'Contusion rotulienne' }
        ],
        sampleSignes: 'Douleur, dermabrasion',
        allergies: 'Pénicilline',
        sampleMedicaments: 'Aucun',
        antecedents: 'Appendicectomie (2010)',
        sampleDernierRepas: 'Midi (Sandwich)',
        sampleEvenements: 'Glissade sur chaussée humide',
        observations: 'Transport vers CHU pour bilan radio. Immobilisation attelle.',
        contactUrgenceNom: 'Marie Dupont',
        contactUrgenceTelephone: '06 98 76 54 32',
        documents: []
    }
];

export const DEFAULT_TARIFS: Tarif[] = [
    { id: '1', description: "Transport d'urgence", prix: 1500 },
    { id: '2', description: "Transport programmé", prix: 800 },
    { id: '3', description: "Oxygénothérapie", prix: 250 },
    { id: '4', description: "Matériel médical", prix: 350 },
];

export const DEFAULT_NURSE_CHECKLIST_ITEMS = {
    "Matériel d'urgence": ["Défibrillateur", "Oxygène", "Aspirateur de mucosités"],
    "Médicaments d'urgence": ["Adrénaline", "Atropine", "Morphine", "Salbutamol"],
    "Perfusion et accès vasculaire": ["Cathéters", "Solutés", "Garrots"],
    "Immobilisation": ["Collier cervical", "Attelles", "Plan dur"],
    "Diagnostic et monitoring": ["Tensiomètre", "Oxymètre", "Glucomètre"],
    "Protection individuelle": ["Gants", "Masques", "Lunettes de protection"],
};

export const DEFAULT_AMBULANCIER_CHECKLIST_ITEMS = {
    "État du véhicule": ["Niveau de carburant", "Pression des pneus", "État des freins", "Propreté"],
    "Équipements de sécurité": ["Extincteur", "Gilets de sécurité", "Triangle de signalisation"],
    "Matériel de transport": ["Brancard", "Chaise de transport", "Sangles"],
    "Communication": ["Radio fonctionnelle", "Téléphone chargé"],
    "Documents": ["Assurance", "Carte grise", "Permis de conduire"],
};

export const HOSPITALS = [
    { id: 'h1', name: 'CHU Central', type: 'Trauma Center N1', address: 'Centre Ville', color: '#DC3545' },
    { id: 'h2', name: 'Clinique du Parc', type: 'Cardiologie', address: 'Quartier Nord', color: '#28A745' },
    { id: 'h3', name: 'Hôpital Mère-Enfant', type: 'Pédiatrie', address: 'Quartier Sud', color: '#FFC107' },
    { id: 'h4', name: 'Polyclinique Ouest', type: 'Urgences Générales', address: 'Zone Ouest', color: '#17A2B8' },
];

export interface InterventionTemplate {
    label: string;
    type: InterventionType;
    notes: string;
    severity: 'high' | 'medium' | 'low';
}

export const INTERVENTION_TEMPLATES: InterventionTemplate[] = [
    { label: 'AVP Grave', type: 'Urgence', notes: 'Accident Voie Publique. Cinétique élevée. Risque polytrauma.', severity: 'high' },
    { label: 'Douleur Thoracique', type: 'Urgence', notes: 'Suspicion SCA. Constrictive, irradiante bras gauche.', severity: 'high' },
    { label: 'Détresse Respiratoire', type: 'Urgence', notes: 'Dyspnée aiguë. Saturation basse. Tirage.', severity: 'high' },
    { label: 'Malaise Vagal', type: 'Urgence', notes: 'Malaise simple. Constantes stables.', severity: 'low' },
    { label: 'Transfert Inter-Hô', type: 'Transfert', notes: 'Transport médicalisé surveillé.', severity: 'medium' },
];