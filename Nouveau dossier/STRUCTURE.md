
# Structure de l'application MedEvac

Cette application est une Single Page Application (SPA) React conçue pour la gestion des services médicaux d'urgence. Elle fonctionne entièrement dans le navigateur grâce à une base de données locale (IndexedDB) et une API simulée, garantissant une résilience hors ligne et des performances élevées.

## Architecture Générale

*   **Framework Frontend** : React 19 avec TypeScript pour un typage statique robuste.
*   **Styling** : Tailwind CSS pour un design utilitaire, cohérent et réactif (mode sombre inclus).
*   **Persistance des Données** : `Dexie.js` (wrapper IndexedDB) pour le stockage local (`src/db.ts`).
*   **Backend Simulé** : Une couche d'interception `mockApi.ts` qui simule des appels API REST en interagissant directement avec Dexie. Cela permet de développer comme avec un vrai backend.
*   **Gestion d'État** : Utilisation exclusive de l'API Context de React pour la gestion d'état global, évitant la complexité de bibliothèques tierces comme Redux.

## Organisation des Fichiers

### Racine (`/`)
*   `App.tsx` : Le composant racine. Il a été simplifié pour ne gérer que :
    *   L'état d'authentification (Login).
    *   Le routage principal (Switch case).
    *   L'intégration du composant `Layout`.
*   `index.tsx` : Point d'entrée. Encapsule `App` avec les Providers (`ThemeProvider`, `LanguageProvider`, etc.).
*   `types.ts` : Définitions centralisées des interfaces TypeScript, regroupées par domaine (Auth, Médical, Ops).
*   `constants.ts` : Données statiques de référence.
*   `db.ts` : Configuration de la base de données Dexie.

### Components (`/components`)
Composants UI réutilisables :
*   **`Layout.tsx`** : **Nouveau** - Structure principale de l'application. Contient la Sidebar, le Header et la zone de contenu.
*   `Sidebar.tsx` : Navigation latérale.
*   `Header.tsx` : Barre supérieure.
*   `Card.tsx`, `Toast.tsx`, `ConfirmationModal.tsx` : Composants UI génériques.

### Providers (`/providers`)
Isolation de la logique métier et de l'état :
*   `AuthProvider.tsx` : Gestion de session utilisateur.
*   `DataProvider.tsx` : Gestion CRUD et synchronisation IndexedDB.
*   `LanguageProvider.tsx`, `NotificationProvider.tsx`, `ThemeProvider.tsx`.

### Vues (`/views`)
Écrans principaux :
*   `Dashboard.tsx`, `RegulationDashboard.tsx` : Tableaux de bord.
*   `Patients.tsx`, `Interventions.tsx` : Gestion opérationnelle.
*   `Admin.tsx` : Administration modulaire (sous-dossier `/views/admin/`).

## Flux de Données

1.  **UI** : L'utilisateur interagit avec une vue (ex: `Patients.tsx`).
2.  **Context** : La vue appelle une fonction du `DataProvider`.
3.  **API Client** : `DataProvider` appelle `mockApi.ts`.
4.  **Mock Server** : Intercepte la requête et met à jour `Dexie` (IndexedDB).
5.  **Réactivité** : Les hooks `useLiveCollection` mettent à jour l'UI automatiquement.
