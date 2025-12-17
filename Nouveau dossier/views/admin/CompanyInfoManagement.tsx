
import React, { useState, useEffect, useRef } from 'react';
import { HeaderInfo } from '../../types';
import Card from '../../components/Card';
import { Upload, Trash, Info, Save, Globe, Phone, Mail, Hash } from 'lucide-react';
import { useData } from '../../providers/DataProvider';
import { useNotification } from '../../providers/NotificationProvider';

const CompanyInfoManagement: React.FC = () => {
    const { headerInfo, updateHeaderInfo } = useData();
    const { addNotification } = useNotification();
    const [info, setInfo] = useState<HeaderInfo | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (headerInfo) {
            setInfo(headerInfo);
        }
    }, [headerInfo]);

    const handleSave = () => {
        if (info) {
            updateHeaderInfo(info);
            addNotification("Informations de l'entreprise mises à jour.", 'success');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && info) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setInfo({ ...info, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    if (!info) {
        return <Card>Chargement des informations...</Card>;
    }

    return (
        <Card>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                    <div className="mt-2 flex items-center gap-4">
                        {info.logo ? (
                            <img src={info.logo} alt="Logo" className="h-20 w-auto border dark:border-gray-600 p-1 rounded-md bg-gray-50 dark:bg-gray-700"/>
                        ) : (
                            <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400 text-sm">Aucun logo</div>
                        )}
                        <div className="flex flex-col gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                                <Upload size={16} className="mr-2"/>Changer
                            </button>
                            {info.logo && (
                                <button onClick={() => setInfo(prev => prev ? {...prev, logo: null} : null)} className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-danger">
                                    <Trash size={16} className="mr-2"/>Retirer
                                </button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'entreprise</label>
                        <Info size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.companyName} onChange={e => setInfo({...info, companyName: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                     <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Web</label>
                        <Globe size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.website} onChange={e => setInfo({...info, website: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
                    <textarea value={info.address} onChange={e => setInfo({...info, address: e.target.value})} rows={3} className="mt-1 input w-full" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                        <Phone size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                     <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <Mail size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="email" value={info.email} onChange={e => setInfo({...info, email: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 pt-4 border-t dark:border-gray-700">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIF</label>
                        <Hash size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.nif} onChange={e => setInfo({...info, nif: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                     <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RC</label>
                        <Hash size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.rc} onChange={e => setInfo({...info, rc: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                     <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ICE</label>
                        <Hash size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.ice} onChange={e => setInfo({...info, ice: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                     <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNSS</label>
                        <Hash size={16} className="absolute left-3 top-10 text-gray-400" />
                        <input type="text" value={info.cnss} onChange={e => setInfo({...info, cnss: e.target.value})} className="mt-1 input w-full pl-10" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-8 border-t dark:border-gray-700 pt-4">
                <button onClick={handleSave} className="btn-primary flex items-center">
                    <Save size={18} className="mr-2" />
                    Enregistrer les informations
                </button>
            </div>
        </Card>
    );
};

export default CompanyInfoManagement;
