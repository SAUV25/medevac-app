import React from 'react';
import Card from './Card';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <Card 
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <AlertTriangle className="text-danger mr-3" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="text-gray-600 mb-6">
                    {children}
                </div>

                <div className="flex justify-end space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex items-center px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 font-semibold shadow-sm"
                    >
                        <Trash2 size={18} className="mr-2" />
                        Confirmer la suppression
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default ConfirmationModal;
