import React, { useState } from 'react';
import Card from '../../components/Card';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useNotification } from '../../providers/NotificationProvider';
import { useAuth } from '../../providers/AuthProvider';

const DataManagement: React.FC = () => {
    const { clearAllData } = useData();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    const [isConfirming, setIsConfirming] = useState(false);

    const handleReset = async () => {
        setIsConfirming(false);
        if (!currentUser) {
            addNotification("Vous n'êtes pas autorisé à effectuer cette action.", 'error');
            return;
        }
        try {
            if (clearAllData) {
                await clearAllData();
                addNotification("Toutes les données de l'application ont été réinitialisées.", 'success');
                // Force a reload to re-initialize the app state from the newly populated DB.
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to reset data:", error);
            addNotification("La réinitialisation des données a échoué.", 'error');
        }
    };

    return (
        <Card>
            <ConfirmationModal
                isOpen={isConfirming}
                onClose={() => setIsConfirming(false)}
                onConfirm={handleReset}
                title="Confirmer la réinitialisation"
            >
                <p>Êtes-vous absolument sûr ? Cette action est irréversible et supprimera <strong>toutes les données</strong> de l'application (patients, interventions, utilisateurs, etc.).</p>
                <p className="mt-2 font-bold text-danger">L'application sera réinitialisée à son état par défaut.</p>
            </ConfirmationModal>

            <h2 className="text-xl font-bold text-danger mb-4 flex items-center">
                <AlertTriangle className="mr-3" />
                Zone de Danger
            </h2>
            <p className="text-gray-600 mb-6">
                Les actions ci-dessous sont irréversibles. Soyez certain avant de continuer.
            </p>
            <div className="border-t pt-6">
                <button
                    onClick={() => setIsConfirming(true)}
                    className="flex items-center px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 font-semibold shadow-sm"
                >
                    <Trash2 size={18} className="mr-2" />
                    Réinitialiser toutes les données de l'application
                </button>
            </div>
        </Card>
    );
};

export default DataManagement;