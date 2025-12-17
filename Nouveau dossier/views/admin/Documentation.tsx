
import React from 'react';
import Card from '../../components/Card';
import { Folder, Database, Server, Layers, FileCode, Box, Monitor, HeartPulse, Receipt, Map, MessageSquare } from 'lucide-react';

const Documentation: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Documentation Technique & Fonctionnelle</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Architecture Technique">
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            MedEvac est une Progressive Web App (PWA) conçue avec une architecture <strong>Offline-First</strong> robuste.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <Box className="text-blue-500 flex-shrink-0" size={20} />
                                <div>
                                    <span className="font-semibold dark:text-gray-200 block">Frontend</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">React 19, TypeScript, Vite</span>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <Layers className="text-teal-500 flex-shrink-0" size={20} />
                                <div>
                                    <span className="font-semibold dark:text-gray-200 block">Design System</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Tailwind CSS, Lucide Icons, Responsive UI</span>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <Database className="text-purple-500 flex-shrink-0" size={20} />
                                <div>
                                    <span className="font-semibold dark:text-gray-200 block">Persistance Locale</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Dexie.js (IndexedDB wrapper) pour le stockage client.</span>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <Server className="text-orange-500 flex-shrink-0" size={20} />
                                <div>
                                    <span className="font-semibold dark:text-gray-200 block">Backend Simulé</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Mock API interceptant `fetch` pour simuler un serveur REST.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </Card>

                <Card title="Modules Fonctionnels">
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                <Monitor className="text-indigo-500 mt-1 flex-shrink-0" size={18} />
                                <div>
                                    <strong className="block text-gray-800 dark:text-gray-200">Cockpit de Régulation</strong>
                                    Gestion centralisée des urgences, assignation intelligente des équipes et visualisation 360°.
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                <Map className="text-green-500 mt-1 flex-shrink-0" size={18} />
                                <div>
                                    <strong className="block text-gray-800 dark:text-gray-200">Live Map & Géolocalisation</strong>
                                    Suivi en temps réel des ambulances, des hôpitaux et des zones de couverture.
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                <HeartPulse className="text-red-500 mt-1 flex-shrink-0" size={18} />
                                <div>
                                    <strong className="block text-gray-800 dark:text-gray-200">Gestion Opérationnelle</strong>
                                    Dossiers patients, checklists véhicules (Infirmier/Ambulancier), gestion des stocks.
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                <Receipt className="text-yellow-500 mt-1 flex-shrink-0" size={18} />
                                <div>
                                    <strong className="block text-gray-800 dark:text-gray-200">Administratif & Financier</strong>
                                    Facturation, génération de reçus, gestion des plannings et calcul de la paie.
                                </div>
                            </li>
                        </ul>
                    </div>
                </Card>
            </div>

            <Card title="Structure du Projet">
                <div className="space-y-2 font-mono text-sm">
                    <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-bold">
                        <Folder size={16} className="text-yellow-500" />
                        <span>/ (Racine)</span>
                    </div>
                    <div className="pl-6 space-y-1 text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                        <div className="flex items-center gap-2"><FileCode size={14} className="text-blue-400"/> App.tsx <span className="text-gray-400 italic">// Routing principal</span></div>
                        <div className="flex items-center gap-2"><FileCode size={14} className="text-blue-400"/> db.ts <span className="text-gray-400 italic">// Schéma Dexie DB</span></div>
                        <div className="flex items-center gap-2"><FileCode size={14} className="text-blue-400"/> types.ts <span className="text-gray-400 italic">// Définitions TypeScript</span></div>
                        
                        <div className="mt-2">
                            <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300"><Folder size={14} className="text-yellow-500"/> providers</div>
                            <div className="pl-4 text-xs">Auth, Data (Logique métier), Theme, Language, Notification.</div>
                        </div>

                        <div className="mt-2">
                            <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300"><Folder size={14} className="text-yellow-500"/> views</div>
                            <div className="pl-4 space-y-1 text-xs">
                                <div>Dashboard.tsx, RegulationDashboard.tsx</div>
                                <div>Patients.tsx, Interventions.tsx, Planning.tsx</div>
                                <div>LiveMap.tsx</div>
                                <div>Admin.tsx (et sous-dossier /admin/...)</div>
                            </div>
                        </div>

                        <div className="mt-2">
                            <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300"><Folder size={14} className="text-yellow-500"/> api</div>
                            <div className="pl-4 text-xs">mockApi.ts (Intercepteur réseau)</div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Documentation;
