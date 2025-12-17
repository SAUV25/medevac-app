
import React, { createContext, useContext, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

type Language = 'fr' | 'es';

const translations = {
    fr: {
        sidebar: {
            dashboard: 'Tableau de bord',
            patients: 'Patients',
            interventions: 'Interventions',
            receipts: 'Reçus',
            planning: 'Planning',
            stock: 'Stock',
            oxygen: 'Gestion Oxygène',
            nurseVerification: 'Vérification Infirmier',
            ambulancierVerification: 'Vérification Ambulancier',
            admin: 'Administration',
            profile: 'Mon Profil',
            pma: 'PMA', // Updated
        },
        header: {
            welcome: 'Bienvenue',
        },
        dashboard: {
            title: 'Tableau de bord',
            welcome: 'Bienvenue',
            date: `Aujourd'hui, c'est le`,
            stats: {
                activeInterventions: 'Interventions Actives',
                detectedProblems: 'Problèmes Détectés',
                checklistsCompleted: 'Checklists Complétées',
                patientsRegistered: 'Patients Enregistrés',
            },
            actions: {
                title: 'Actions Rapides',
                newPatient: 'Nouveau Patient',
                newIntervention: 'Nouvelle Intervention',
                newChecklist: 'Nouvelle Checklist',
            },
        },
        patients: {
            title: 'Gestion des Patients',
            addPatient: 'Ajouter un Patient',
            noPatients: 'Aucun patient enregistré.',
        },
        planning: {
            title: 'Planning des Équipes',
            generateSchedule: 'Générer Planning',
            generateMonthly: 'Générer le planning du mois',
            generateYearly: 'Générer le planning de l\'année',
            exportPdf: 'Exporter en PDF',
            assignTeamFor: 'Assigner une équipe pour le',
            nurse: 'Infirmier(ère)',
            paramedic: 'Ambulancier(ère)',
            select: 'Sélectionner',
            confirm: 'Confirmer',
            cancel: 'Annuler',
            conflictWarning: "Avertissement : Ce membre d'équipe travaille déjà la veille.",
            scheduleFor: 'Planning pour',
            generationConfirm: "Générer un nouveau planning écrasera les gardes existantes pour cette période. Continuer ?",
        },
        // ... more french translations
    },
    es: {
        sidebar: {
            dashboard: 'Panel de Control',
            patients: 'Pacientes',
            interventions: 'Intervenciones',
            receipts: 'Recibos',
            planning: 'Planificación',
            stock: 'Inventario',
            oxygen: 'Gestión de Oxígeno',
            nurseVerification: 'Verificación Enfermero',
            ambulancierVerification: 'Verificación Paramédico',
            admin: 'Administración',
            profile: 'Mi Perfil',
            pma: 'PMA', // Updated
        },
        header: {
            welcome: 'Bienvenido',
        },
        dashboard: {
            title: 'Panel de Control',
            welcome: 'Bienvenido',
            date: 'Hoy es',
            stats: {
                activeInterventions: 'Intervenciones Activas',
                detectedProblems: 'Problemas Detectados',
                checklistsCompleted: 'Checklists Completadas',
                patientsRegistered: 'Pacientes Registrados',
            },
            actions: {
                title: 'Acciones Rápidas',
                newPatient: 'Nuevo Paciente',
                newIntervention: 'Nueva Intervención',
                newChecklist: 'Nueva Checklist',
            },
        },
        patients: {
            title: 'Gestión de Pacientes',
            addPatient: 'Añadir Paciente',
            noPatients: 'No hay pacientes registrados.',
        },
        planning: {
            title: 'Planificación de Equipos',
            generateSchedule: 'Generar Planificación',
            generateMonthly: 'Generar planificación mensual',
            generateYearly: 'Generar planificación anual',
            exportPdf: 'Exportar a PDF',
            assignTeamFor: 'Asignar un equipo para el',
            nurse: 'Enfermero(a)',
            paramedic: 'Paramédico',
            select: 'Seleccionar',
            confirm: 'Confirmar',
            cancel: 'Cancelar',
            conflictWarning: 'Advertencia: Este miembro del equipo ya trabaja el día anterior.',
            scheduleFor: 'Planificación para',
            generationConfirm: "Generar una nueva planificación sobreescribirá los turnos existentes para este período. ¿Continuar?",
        },
        // ... more spanish translations
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations.fr;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useLocalStorage<Language>('app_language', 'fr');

    const t = useMemo(() => translations[language], [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
