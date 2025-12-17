
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../providers/DataProvider';
import { useNotification } from '../providers/NotificationProvider';
import { Intervention, Shift, ViewContext } from '../types';
import { MapPin, User, Ambulance, AlertTriangle, Calendar, Navigation, Building, Waypoints, ExternalLink, X, PlusSquare } from 'lucide-react';
import { HOSPITALS } from '../constants';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 750;

// Simple hash function to create pseudo-random but deterministic coordinates from an address string
const geocodeAddress = (address: string): { x: number; y: number } => {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
        const char = address.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use two different parts of the hash for x and y to get more variation
    const xHash = (hash >> 16) & 0xffff;
    const yHash = hash & 0xffff;

    return {
        x: 50 + (Math.abs(xHash) % (MAP_WIDTH - 100)),
        y: 50 + (Math.abs(yHash) % (MAP_HEIGHT - 100)),
    };
};

const Marker: React.FC<{
    item: any;
    type: 'intervention' | 'vehicle' | 'user' | 'hospital';
    onClick: () => void;
}> = ({ item, type, onClick }) => {
    let icon, color, pos, animation, size = 'w-8 h-8', shape = 'rounded-full';

    if (type === 'intervention') {
        pos = geocodeAddress(item.adresseDepart || 'Unknown');
        animation = item.status === 'En cours' ? 'animate-pulse' : '';
        if (item.type === 'Urgence') {
            icon = <AlertTriangle className="h-5 w-5 text-white" />;
            color = 'bg-danger';
        } else if (item.type === 'Programmé') {
            icon = <Calendar className="h-5 w-5 text-white" />;
            color = 'bg-info';
        } else {
            icon = <Waypoints className="h-5 w-5 text-white" />;
            color = 'bg-green-600';
        }
    } else if (type === 'vehicle') {
        pos = item.location;
        icon = <Ambulance className="h-5 w-5 text-white" />;
        color = 'bg-gray-700';
    } else if (type === 'hospital') {
        pos = geocodeAddress(item.address);
        icon = <PlusSquare className="h-5 w-5 text-white" />;
        color = 'bg-blue-600';
        shape = 'rounded-md'; // Hospitals are squares
    } else { // user
        pos = item.pos;
        icon = <Navigation className="h-5 w-5 text-white" />;
        color = 'bg-blue-500';
    }

    return (
        <button
            className={`absolute z-10 ${size} ${shape} flex items-center justify-center ${color} shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover:z-20 ${animation}`}
            style={{ left: `${(pos.x / MAP_WIDTH) * 100}%`, top: `${(pos.y / MAP_HEIGHT) * 100}%` }}
            onClick={onClick}
            title={type === 'intervention' ? item.patientName : type === 'vehicle' ? item.id : type === 'hospital' ? item.name : 'Votre position'}
        >
            {icon}
        </button>
    );
};

// New Component for Visualization Zones (Heatmap/Coverage)
const CoverageZone: React.FC<{ x: number, y: number, radius: number, type: 'good' | 'bad' }> = ({ x, y, radius, type }) => (
    <div 
        className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
            type === 'good' ? 'bg-green-400' : 'bg-orange-400'
        }`}
        style={{ 
            left: `${(x / MAP_WIDTH) * 100}%`, 
            top: `${(y / MAP_HEIGHT) * 100}%`,
            width: `${radius}px`,
            height: `${radius}px`,
            opacity: 0.15,
            filter: 'blur(10px)'
        }}
    />
);

const DetailsPanel: React.FC<{
    selectedItem: any;
    type: 'intervention' | 'vehicle' | 'hospital';
    onClose: () => void;
    setCurrentView: (view: any, context?: ViewContext) => void;
}> = ({ selectedItem, type, onClose, setCurrentView }) => {
    const { patients } = useData();

    if (!selectedItem) return null;

    const patient = selectedItem.patientId ? patients?.find(p => p.id === selectedItem.patientId) : null;
    const patientName = selectedItem.patientName || (patient ? `${patient.prenom} ${patient.nom}` : 'N/A');

    return (
        <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-white/90 backdrop-blur-sm shadow-2xl z-30 p-4 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center pb-2 border-b">
                <h2 className="text-xl font-bold">
                    {type === 'intervention' ? 'Détails Intervention' : type === 'vehicle' ? 'Détails Véhicule' : 'Détails Hôpital'}
                </h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                {type === 'intervention' && (
                    <>
                        <div className="flex items-center gap-3">
                            {selectedItem.type === 'Urgence' ? <AlertTriangle className="h-8 w-8 text-danger"/> : <Calendar className="h-8 w-8 text-info"/>}
                            <div>
                                <p className="font-bold text-lg">{patientName}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    selectedItem.status === 'En cours' ? 'bg-info/20 text-info' : 'bg-warning/20 text-yellow-800'
                                }`}>{selectedItem.status}</span>
                            </div>
                        </div>
                        <p><strong>Type:</strong> {selectedItem.type}</p>
                        <p className="flex items-start gap-2"><strong>Départ:</strong> <MapPin size={16} className="text-gray-500 mt-1"/> {selectedItem.adresseDepart}</p>
                        <p className="flex items-start gap-2"><strong>Arrivée:</strong> <MapPin size={16} className="text-gray-500 mt-1"/> {selectedItem.adresseArrivee}</p>
                        <p><strong>Équipe:</strong> {selectedItem.equipe || 'Non assignée'}</p>
                        <p><strong>Notes:</strong> {selectedItem.notes || 'Aucune'}</p>
                         <button onClick={() => setCurrentView('interventions', { id: selectedItem.id })} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                            <ExternalLink size={16} />
                            Voir l'intervention complète
                        </button>
                    </>
                )}
                 {type === 'vehicle' && (
                    <>
                        <div className="flex items-center gap-3">
                            <Ambulance className="h-8 w-8 text-gray-700"/>
                             <div>
                                <p className="font-bold text-lg">{selectedItem.id}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    selectedItem.status === 'Disponible' ? 'bg-success/20 text-success' : 'bg-warning/20 text-yellow-800'
                                }`}>{selectedItem.status}</span>
                            </div>
                        </div>
                        {selectedItem.status === 'En mission' && (
                            <>
                                <p><strong>Intervention:</strong> {selectedItem.intervention.patientName}</p>
                                <p><strong>Destination:</strong> {selectedItem.intervention.adresseArrivee}</p>
                                <p><strong>Équipe:</strong> {selectedItem.intervention.equipe}</p>
                            </>
                        )}
                        {selectedItem.status === 'Disponible' && (
                            <p>Le véhicule est actuellement à la base, en attente d'une mission.</p>
                        )}
                    </>
                )}
                {type === 'hospital' && (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                <PlusSquare className="h-8 w-8"/>
                            </div>
                             <div>
                                <p className="font-bold text-lg">{selectedItem.name}</p>
                                <span className="text-sm text-gray-500">{selectedItem.type}</span>
                            </div>
                        </div>
                        <p className="flex items-start gap-2 mt-4"><strong>Adresse:</strong> <MapPin size={16} className="text-gray-500 mt-1"/> {selectedItem.address}</p>
                        <div className="mt-4 p-3 bg-green-50 text-green-800 rounded border border-green-200">
                            <p className="font-bold text-sm">Disponibilité</p>
                            <p className="text-xs">Urgences: Fluide</p>
                            <p className="text-xs">Lit Réa: 2 dispos</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


interface LiveMapProps {
  setCurrentView: (view: any, context?: ViewContext) => void;
}

const LiveMap: React.FC<LiveMapProps> = ({ setCurrentView }) => {
    const { interventions, vehicules, shifts } = useData();
    const { addNotification } = useNotification();
    const [userPosition, setUserPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedItem, setSelectedItem] = useState<{ item: any; type: 'intervention' | 'vehicle' | 'hospital' } | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // We'll simulate a position on our map for the demo
                // In a real app, you would convert lat/lon to map coordinates
                setUserPosition({ x: 150, y: MAP_HEIGHT - 150 }); 
            },
            (error) => {
                console.warn(`Geolocation error: ${error.message}`);
                // addNotification("Impossible d'accéder à la géolocalisation.", 'info'); // Commented out to reduce noise
            },
            { enableHighAccuracy: true }
        );
    }, [addNotification]);
    
    const activeInterventions = useMemo(() => 
        interventions?.filter(i => i.status === 'En cours' || i.status === 'En attente') || [],
    [interventions]);
    
    const vehicleData = useMemo(() => {
        if (!vehicules || !shifts || !interventions) return [];
        const baseLocation = geocodeAddress("Base Opérationnelle MedEvac");

        return vehicules.map(vId => {
            const today = new Date().toISOString().split('T')[0];
            const todayShift = shifts.find(s => s.date === today);
            
            if (!todayShift) return { id: vId, status: 'Hors service', location: baseLocation, intervention: null };

            const assignedIntervention = interventions.find(i => 
                (i.status === 'En cours' || i.status === 'En attente') &&
                (i.equipe && i.equipe.includes(vId))
            );

            if (assignedIntervention) {
                return {
                    id: vId,
                    status: 'En mission',
                    location: geocodeAddress(assignedIntervention.adresseDepart),
                    intervention: assignedIntervention,
                };
            }
            return { id: vId, status: 'Disponible', location: baseLocation, intervention: null };
        });

    }, [vehicules, shifts, interventions]);


    return (
        <div className="relative w-full h-full bg-gray-200 rounded-lg overflow-hidden shadow-inner group">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'url("https://www.openstreetmap.org/assets/map/HD-5f61726a79e266a4146a7428f582d908.png")',
                    backgroundSize: 'cover',
                    opacity: 0.4,
                }}
            />

            {/* Radar Animation Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-spin-slow rounded-full blur-3xl"></div>
            </div>
            <style>{`
                @keyframes spin-slow {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>

            {/* Coverage Zones (Mocked) */}
            <div className="absolute inset-0 pointer-events-none">
                <CoverageZone x={500} y={375} radius={400} type="good" />
                <CoverageZone x={800} y={200} radius={200} type="bad" />
            </div>

            <div className="absolute inset-0">
                {HOSPITALS.map(hospital => (
                    <Marker key={hospital.id} item={hospital} type="hospital" onClick={() => setSelectedItem({ item: hospital, type: 'hospital' })} />
                ))}
                
                {activeInterventions.map(int => (
                    <Marker key={int.id} item={int} type="intervention" onClick={() => setSelectedItem({ item: int, type: 'intervention' })} />
                ))}
                {vehicleData.map(v => (
                     <Marker key={v.id} item={v} type="vehicle" onClick={() => setSelectedItem({ item: v, type: 'vehicle' })} />
                ))}
                {userPosition && (
                    <Marker item={{pos: userPosition}} type="user" onClick={() => {}} />
                )}
            </div>

            {selectedItem && (
                <DetailsPanel 
                    selectedItem={selectedItem.item} 
                    type={selectedItem.type} 
                    onClose={() => setSelectedItem(null)} 
                    setCurrentView={setCurrentView}
                />
            )}
        </div>
    );
};

export default LiveMap;
