
import React, { useState, useRef, useEffect } from 'react';
import { BodyInjury } from '../types';
import { Zap, Droplet, Flame, Disc, MousePointer2 } from 'lucide-react';

interface BodyMapProps {
    injuries: BodyInjury[];
    onAddInjury: (injury: Omit<BodyInjury, 'id'>) => void;
    onRemoveInjury: (id: string) => void;
    readOnly?: boolean;
    initialView?: 'front' | 'back';
    className?: string;
    hideControls?: boolean;
}

const BodyMap: React.FC<BodyMapProps> = ({ 
    injuries, 
    onAddInjury, 
    onRemoveInjury, 
    readOnly = false, 
    initialView = 'front',
    className = '',
    hideControls = false
}) => {
    const [view, setView] = useState<'front' | 'back'>(initialView);
    const [selectedType, setSelectedType] = useState<BodyInjury['type']>('pain');
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        setView(initialView);
    }, [initialView]);

    const VB_WIDTH = 300;
    const VB_HEIGHT = 600;

    const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (readOnly || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * VB_WIDTH;
        const y = ((e.clientY - rect.top) / rect.height) * VB_HEIGHT;

        // Détection de la zone cliquée via l'événement cible si c'est un path
        const target = e.target as SVGElement;
        const zoneId = target.getAttribute('id') || target.parentElement?.getAttribute('id');
        const description = zoneId ? `Zone: ${formatZoneName(zoneId)}` : '';

        onAddInjury({
            x, 
            y,
            view,
            type: selectedType,
            description
        });
    };

    const formatZoneName = (id: string) => {
        const map: Record<string, string> = {
            'head': 'Tête', 'neck': 'Cou', 'chest': 'Thorax', 'abdomen': 'Abdomen', 'pelvis': 'Bassin',
            'shoulder_right': 'Épaule D', 'arm_right': 'Bras D', 'forearm_right': 'Avant-bras D', 'hand_right': 'Main D',
            'shoulder_left': 'Épaule G', 'arm_left': 'Bras G', 'forearm_left': 'Avant-bras G', 'hand_left': 'Main G',
            'thigh_right': 'Cuisse D', 'knee_right': 'Genou D', 'leg_right': 'Jambe D', 'foot_right': 'Pied D',
            'thigh_left': 'Cuisse G', 'knee_left': 'Genou G', 'leg_left': 'Jambe G', 'foot_left': 'Pied G',
            'back_upper': 'Dos (Haut)', 'back_lower': 'Lombaires', 'gluteal': 'Fessiers'
        };
        return map[id] || id.replace(/_/g, ' ');
    };

    const tools = [
        { id: 'pain', label: 'Douleur', icon: Zap, color: '#3B82F6', ring: 'ring-blue-400', fill: 'fill-blue-500' },
        { id: 'wound', label: 'Plaie/Sgnt', icon: Droplet, color: '#EF4444', ring: 'ring-red-400', fill: 'fill-red-500' },
        { id: 'bruise', label: 'Hématome', icon: Disc, color: '#8B5CF6', ring: 'ring-purple-400', fill: 'fill-purple-500' },
        { id: 'burn', label: 'Brûlure', icon: Flame, color: '#F97316', ring: 'ring-orange-400', fill: 'fill-orange-500' },
    ];

    const getToolColor = (type?: string) => tools.find(t => t.id === type)?.color || '#3B82F6';

    // --- STYLES ANATOMIQUES REALISTES ---
    // Utilisation de gradients et de contours plus fins
    const baseStyle = "fill-[url(#skinGradient)] stroke-slate-400/50 stroke-[0.5] transition-all duration-200 cursor-pointer outline-none";
    const hoverStyle = "hover:fill-[url(#hoverGradient)] hover:stroke-blue-400 hover:stroke-[1] hover:filter hover:drop-shadow-lg";
    const labelStyle = "font-sans text-[10px] fill-slate-400 dark:fill-slate-500 font-bold uppercase tracking-widest select-none opacity-50";

    const commonProps = {
        className: `${baseStyle} ${!readOnly ? hoverStyle : ''}`,
        onMouseEnter: (e: React.MouseEvent) => setHoveredZone((e.target as Element).id),
        onMouseLeave: () => setHoveredZone(null)
    };

    // --- PATHS ANATOMIQUES (Formes Organiques) ---
    
    const FrontView = (
        <g id="front_view" filter="url(#bodyShadow)">
            <text x="30" y="40" className={labelStyle} textAnchor="start">Droit</text>
            <text x="270" y="40" className={labelStyle} textAnchor="end">Gauche</text>

            {/* HEAD & NECK */}
            <path id="head" d="M150,25 C135,25 128,45 128,65 C128,90 138,100 150,100 C162,100 172,90 172,65 C172,45 165,25 150,25 Z" {...commonProps} />
            <path id="neck" d="M138,95 Q135,110 130,115 L170,115 Q165,110 162,95 Z" {...commonProps} />

            {/* TORSO */}
            <path id="chest" d="M130,115 L170,115 Q195,120 185,165 Q150,175 115,165 Q105,120 130,115 Z" {...commonProps} />
            <path id="abdomen" d="M115,165 Q150,175 185,165 Q182,200 175,220 L125,220 Q118,200 115,165 Z" {...commonProps} />
            <path id="pelvis" d="M125,220 L175,220 Q185,235 188,250 L150,270 L112,250 Q115,235 125,220 Z" {...commonProps} />

            {/* ARMS (RIGHT - Screen Left) */}
            <path id="shoulder_right" d="M130,115 Q110,115 100,125 Q92,135 95,150 L115,145 L130,115" {...commonProps} />
            <path id="arm_right" d="M95,150 Q88,180 90,200 L112,195 Q115,170 115,145 Z" {...commonProps} />
            <path id="forearm_right" d="M90,200 Q82,230 80,260 L98,265 Q108,230 112,195 Z" {...commonProps} />
            <path id="hand_right" d="M80,260 Q70,270 65,290 Q80,300 90,290 Q100,275 98,265 Z" {...commonProps} />

            {/* ARMS (LEFT - Screen Right) */}
            <path id="shoulder_left" d="M170,115 Q190,115 200,125 Q208,135 205,150 L185,145 L170,115" {...commonProps} />
            <path id="arm_left" d="M205,150 Q212,180 210,200 L188,195 Q185,170 185,145 Z" {...commonProps} />
            <path id="forearm_left" d="M210,200 Q218,230 220,260 L202,265 Q192,230 188,195 Z" {...commonProps} />
            <path id="hand_left" d="M220,260 Q230,270 235,290 Q220,300 210,290 Q200,275 202,265 Z" {...commonProps} />

            {/* LEGS (RIGHT - Screen Left) */}
            <path id="thigh_right" d="M112,250 L150,270 L145,380 Q125,385 105,375 Q102,300 112,250 Z" {...commonProps} />
            <path id="knee_right" d="M105,375 Q125,385 145,380 L142,410 Q125,415 108,405 Z" {...commonProps} />
            <path id="leg_right" d="M108,405 Q125,415 142,410 Q140,480 135,520 L115,520 Q110,480 108,405 Z" {...commonProps} />
            <path id="foot_right" d="M115,520 L135,520 L138,550 Q125,560 112,550 Z" {...commonProps} />

            {/* LEGS (LEFT - Screen Right) */}
            <path id="thigh_left" d="M188,250 L150,270 L155,380 Q175,385 195,375 Q198,300 188,250 Z" {...commonProps} />
            <path id="knee_left" d="M195,375 Q175,385 155,380 L158,410 Q175,415 192,405 Z" {...commonProps} />
            <path id="leg_left" d="M192,405 Q175,415 158,410 Q160,480 165,520 L185,520 Q190,480 192,405 Z" {...commonProps} />
            <path id="foot_left" d="M185,520 L165,520 L162,550 Q175,560 188,550 Z" {...commonProps} />
        </g>
    );

    const BackView = (
        <g id="back_view" filter="url(#bodyShadow)">
            <text x="30" y="40" className={labelStyle} textAnchor="start">Gauche</text>
            <text x="270" y="40" className={labelStyle} textAnchor="end">Droit</text>

            {/* HEAD & NECK */}
            <path id="head" d="M150,25 C135,25 128,45 128,65 C128,90 138,100 150,100 C162,100 172,90 172,65 C172,45 165,25 150,25 Z" {...commonProps} />
            <path id="neck" d="M138,95 Q135,110 130,115 L170,115 Q165,110 162,95 Z" {...commonProps} />

            {/* BACK TORSO */}
            <path id="back_upper" d="M130,115 L170,115 Q195,120 185,165 Q150,160 115,165 Q105,120 130,115 Z" {...commonProps} />
            <path id="back_lower" d="M115,165 Q150,160 185,165 Q182,200 175,220 L125,220 Q118,200 115,165 Z" {...commonProps} />
            <path id="gluteal" d="M125,220 L175,220 Q185,235 188,260 L150,285 L112,260 Q115,235 125,220 Z" {...commonProps} />

            {/* ARMS (LEFT - Screen Left) */}
            <path id="shoulder_left" d="M130,115 Q110,115 100,125 Q92,135 95,150 L115,145 L130,115" {...commonProps} />
            <path id="arm_left" d="M95,150 Q88,180 90,200 L112,195 Q115,170 115,145 Z" {...commonProps} />
            <path id="elbow_left" d="M90,200 L88,215 L110,210 L112,195 Z" {...commonProps} />
            <path id="forearm_left" d="M88,215 Q82,240 80,260 L98,265 Q105,240 110,210 Z" {...commonProps} />
            <path id="hand_left" d="M80,260 Q70,270 65,290 Q80,300 90,290 Q100,275 98,265 Z" {...commonProps} />

            {/* ARMS (RIGHT - Screen Right) */}
            <path id="shoulder_right" d="M170,115 Q190,115 200,125 Q208,135 205,150 L185,145 L170,115" {...commonProps} />
            <path id="arm_right" d="M205,150 Q212,180 210,200 L188,195 Q185,170 185,145 Z" {...commonProps} />
            <path id="elbow_right" d="M210,200 L212,215 L190,210 L188,195 Z" {...commonProps} />
            <path id="forearm_right" d="M212,215 Q218,240 220,260 L202,265 Q195,240 190,210 Z" {...commonProps} />
            <path id="hand_right" d="M220,260 Q230,270 235,290 Q220,300 210,290 Q200,275 202,265 Z" {...commonProps} />

            {/* LEGS (LEFT - Screen Left) */}
            <path id="thigh_left" d="M112,260 L150,285 L145,380 Q125,385 105,375 Q102,300 112,260 Z" {...commonProps} />
            <path id="knee_left" d="M105,375 Q125,385 145,380 L142,410 Q125,415 108,405 Z" {...commonProps} />
            <path id="leg_left" d="M108,405 Q125,415 142,410 Q140,480 135,520 L115,520 Q110,480 108,405 Z" {...commonProps} />
            <path id="foot_left" d="M115,520 L135,520 L138,550 Q125,560 112,550 Z" {...commonProps} />

            {/* LEGS (RIGHT - Screen Right) */}
            <path id="thigh_right" d="M188,260 L150,285 L155,380 Q175,385 195,375 Q198,300 188,260 Z" {...commonProps} />
            <path id="knee_right" d="M195,375 Q175,385 155,380 L158,410 Q175,415 192,405 Z" {...commonProps} />
            <path id="leg_right" d="M192,405 Q175,415 158,410 Q160,480 165,520 L185,520 Q190,480 192,405 Z" {...commonProps} />
            <path id="foot_right" d="M185,520 L165,520 L162,550 Q175,560 188,550 Z" {...commonProps} />
        </g>
    );

    return (
        <div className={`flex flex-col h-full select-none ${className}`}>
            
            {/* BARRE D'OUTILS FLOTTANTE */}
            {!hideControls && (
                <div className="flex flex-col gap-2 mb-3">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 w-full shadow-sm">
                        <button 
                            type="button"
                            onClick={() => setView('front')} 
                            className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase rounded-md transition-all ${view === 'front' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                        >
                            Face
                        </button>
                        <button 
                            type="button"
                            onClick={() => setView('back')} 
                            className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase rounded-md transition-all ${view === 'back' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                        >
                            Dos
                        </button>
                    </div>

                    {!readOnly && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-2 shadow-sm">
                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1">Outil de marquage</div>
                            <div className="grid grid-cols-2 gap-2">
                                {tools.map((tool) => (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        onClick={() => setSelectedType(tool.id as BodyInjury['type'])}
                                        className={`flex items-center p-1.5 rounded-md border transition-all text-xs ${
                                            selectedType === tool.id 
                                                ? `bg-${tool.color}/10 border-${tool.color} text-gray-800 dark:text-white font-medium ring-1 ${tool.ring}` 
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500'
                                        }`}
                                        style={{ borderColor: selectedType === tool.id ? tool.color : 'transparent' }}
                                    >
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white mr-2 shadow-sm" style={{ backgroundColor: tool.color }}>
                                            <tool.icon size={12} />
                                        </div>
                                        {tool.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ZONE SVG */}
            <div className={`relative flex-1 bg-white dark:bg-gray-800/50 rounded-xl border dark:border-gray-700 overflow-hidden shadow-inner group ${hideControls ? 'bg-transparent border-0 shadow-none' : ''}`}>
                
                {/* Instruction Overlay */}
                {!readOnly && !hideControls && (
                    <div className="absolute top-2 left-0 right-0 flex justify-center opacity-60 group-hover:opacity-0 transition-opacity pointer-events-none z-10">
                        <span className="text-[10px] bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full backdrop-blur-sm flex items-center shadow-sm border dark:border-gray-600">
                            <MousePointer2 size={10} className="mr-1.5"/> Sélectionnez une zone
                        </span>
                    </div>
                )}

                {/* Info bulle au survol d'une zone */}
                {hoveredZone && !readOnly && (
                    <div className="absolute top-3 right-3 z-20 pointer-events-none">
                        <span className="text-[10px] font-bold bg-slate-800/90 text-white px-2.5 py-1 rounded shadow-lg capitalize animate-in fade-in zoom-in duration-200 backdrop-blur-md">
                            {formatZoneName(hoveredZone)}
                        </span>
                    </div>
                )}

                <svg 
                    ref={svgRef}
                    viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} 
                    className={`w-full h-full mx-auto transition-transform duration-300 ${!readOnly ? 'cursor-crosshair' : 'cursor-default'}`}
                    onClick={handleMapClick}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Ombre portée pour le corps entier */}
                        <filter id="bodyShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" floodColor="#000"/>
                        </filter>
                        
                        {/* Ombre portée pour les marqueurs */}
                        <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3"/>
                        </filter>

                        {/* Dégradé peau réaliste (Style médical plastique) */}
                        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#e2e8f0" /> {/* slate-200 */}
                            <stop offset="50%" stopColor="#f1f5f9" /> {/* slate-100 highlight */}
                            <stop offset="100%" stopColor="#cbd5e1" /> {/* slate-300 shadow */}
                        </linearGradient>

                        {/* Dégradé pour le hover */}
                        <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#dbeafe" /> {/* blue-100 */}
                            <stop offset="100%" stopColor="#bfdbfe" /> {/* blue-200 */}
                        </linearGradient>

                        {/* Pattern de grille subtile */}
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700/50" />
                        </pattern>
                    </defs>

                    {!hideControls && <rect width="100%" height="100%" fill="url(#grid)" />}

                    {view === 'front' ? FrontView : BackView}
                    
                    {/* Les Lésions (Markers) */}
                    {injuries.map((injury, idx) => {
                        if (injury.view !== view) return null;
                        const displayIndex = idx + 1; 
                        const color = getToolColor(injury.type);

                        return (
                            <g 
                                key={injury.id} 
                                className="cursor-pointer hover:opacity-90 transition-all"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!readOnly) onRemoveInjury(injury.id); 
                                }}
                            >
                                {/* Zone d'effet radar */}
                                <circle 
                                    cx={injury.x}
                                    cy={injury.y}
                                    r="16" 
                                    fill={color} 
                                    fillOpacity="0.15"
                                    className="animate-pulse origin-center"
                                >
                                    <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                                </circle>
                                
                                {/* Cible précise */}
                                <circle 
                                    cx={injury.x} 
                                    cy={injury.y} 
                                    r="3" 
                                    fill={color} 
                                    stroke="white" 
                                    strokeWidth="1"
                                    filter="url(#markerShadow)"
                                />
                                <line x1={injury.x - 6} y1={injury.y} x2={injury.x + 6} y2={injury.y} stroke={color} strokeWidth="1.5" />
                                <line x1={injury.x} y1={injury.y - 6} x2={injury.x} y2={injury.y + 6} stroke={color} strokeWidth="1.5" />
                                
                                {/* Badge Numéro */}
                                <g transform={`translate(${injury.x + 8}, ${injury.y - 14})`}>
                                    <rect x="0" y="0" width="14" height="14" rx="4" fill={color} filter="url(#markerShadow)"/>
                                    <text
                                        x="7"
                                        y="10"
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="9"
                                        fontWeight="900"
                                        fontFamily="sans-serif"
                                        pointerEvents="none"
                                    >
                                        {displayIndex}
                                    </text>
                                </g>
                                
                                {/* Croix de suppression (Hover) */}
                                {!readOnly && (
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <circle cx={injury.x} cy={injury.y} r="8" fill="rgba(255,255,255,0.8)" />
                                        <path transform={`translate(${injury.x - 3}, ${injury.y - 3}) scale(0.6)`} d="M10 0L0 10M0 0l10 10" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default BodyMap;
