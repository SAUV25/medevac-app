
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import Card from '../components/Card';
import { Send, Loader2, Bot, User, HelpCircle } from 'lucide-react';
// FIX: Corrected import path for types to be relative.
import { ChatMessage, Patient, StockItem, Intervention } from '../types';
// FIX: Corrected import path to be relative.
import { useData } from '../providers/DataProvider';

const Tchat: React.FC = () => {
    const { tchatHistory: history = [], addChatMessage, patients = [], stockItems = [], interventions = [] } = useData();
    const [chat, setChat] = useState<Chat | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [history, loading]);

    // Define local functions the AI can call
    const get_stock_level = ({ itemName }: { itemName: string }): StockItem | { error: string } => {
        const item = stockItems.find(i => i.nom.toLowerCase().includes(itemName.toLowerCase()));
        return item || { error: `Article '${itemName}' non trouvé dans le stock.` };
    };

    const get_patient_info = ({ nom }: { nom: string }): Patient | { error: string } => {
        const patient = patients.find(p => p.nom.toLowerCase() === nom.toLowerCase());
        return patient || { error: `Patient avec le nom de famille '${nom}' non trouvé.` };
    };

    const get_last_intervention_for_patient = ({ nom }: { nom: string }): Intervention | { error: string } => {
        const patient = patients.find(p => p.nom.toLowerCase() === nom.toLowerCase());
        if (!patient) return { error: `Patient avec le nom de famille '${nom}' non trouvé.` };
        const patientInterventions = interventions.filter(i => i.patientId === patient.id || i.patientName === `${patient.prenom} ${patient.nom}`);
        if (patientInterventions.length === 0) return { error: `Aucune intervention trouvée pour ${patient.prenom} ${patient.nom}.` };
        
        return patientInterventions.sort((a,b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())[0];
    };
    
    // Define function declarations for the model
    const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
        functionDeclarations: [
            {
                name: "get_stock_level",
                description: "Obtenir la quantité actuelle et le seuil d'alerte pour un article de stock spécifique.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        itemName: { type: Type.STRING, description: "Le nom de l'article en stock." }
                    },
                    required: ["itemName"]
                }
            },
            {
                name: "get_patient_info",
                description: "Obtenir les détails d'un patient par son nom de famille.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        nom: { type: Type.STRING, description: "Le nom de famille du patient." }
                    },
                    required: ["nom"]
                }
            },
            {
                name: "get_last_intervention_for_patient",
                description: "Obtenir les détails de l'intervention la plus récente pour un patient spécifique par son nom de famille.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        nom: { type: Type.STRING, description: "Le nom de famille du patient." }
                    },
                    required: ["nom"]
                }
            }
        ]
    }];

    useEffect(() => {
        const initChat = () => {
            try {
                if (!process.env.API_KEY) {
                    console.error("API_KEY environment variable not set.");
                    alert("Configuration Error: The API key is missing.");
                    return;
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const geminiHistory = history.map(({ role, parts }) => ({ role, parts }));

                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    systemInstruction: "You are MedEvac AI, a helpful assistant for emergency medical services (SAMU). You can now also access real-time application data to answer questions about patients, stock levels, and interventions. Always provide concise, accurate, and professional information. Do not provide medical advice for real patients; instead, suggest consulting protocols or a supervising doctor. Your responses should be in French.",
                    history: geminiHistory,
                    config: { tools }
                });
                setChat(newChat);
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                alert("Failed to initialize AI Assistant. Please check the console for details.");
            }
        };
        initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !chat) return;

        const userMessageText = input;
        const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { role: 'user', parts: [{ text: userMessageText }] };
        
        setLoading(true);
        setInput('');
        await addChatMessage(userMessage);

        try {
            // First API call to get either a text response or a function call
            const response = await chat.sendMessage({ message: userMessageText });
            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const functionResponses = [];

                for (const fc of functionCalls) {
                    const { name, args } = fc;
                    let result: any;
                    
                    if (name === 'get_stock_level') {
                        result = get_stock_level(args as { itemName: string });
                    } else if (name === 'get_patient_info') {
                        result = get_patient_info(args as { nom: string });
                    } else if (name === 'get_last_intervention_for_patient') {
                        result = get_last_intervention_for_patient(args as { nom: string });
                    } else {
                        result = { error: `Fonction '${name}' non reconnue.` };
                    }
                    
                    functionResponses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result },
                    });
                }
                
                // Second API call with the function responses to get a final text response
                const finalResponse = await chat.sendMessage({ functionResponses: functionResponses });
                const modelMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { role: 'model', parts: [{ text: finalResponse.text }] };
                await addChatMessage(modelMessage);

            } else {
                // It's a direct text response, no function call needed
                const modelMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { role: 'model', parts: [{ text: response.text }] };
                await addChatMessage(modelMessage);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { role: 'model', parts: [{ text: "Désolé, une erreur est survenue. Veuillez réessayer." }] };
            await addChatMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const SuggestionChips = () => (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
            <HelpCircle size={16} className="text-gray-500"/>
            <span className="text-xs text-gray-500 self-center">Suggestions:</span>
            <button onClick={() => setInput("Quel est le stock d'Adrénaline ?")} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">Stock Adrénaline?</button>
            <button onClick={() => setInput("Infos sur le patient Dupont ?")} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">Patient Dupont?</button>
            <button onClick={() => setInput("Dernière intervention pour Dupont ?")} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">Intervention Dupont?</button>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 dark:text-gray-100">MedEvac AI Assistant</h1>
            <Card className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="p-2 bg-primary/80 text-white rounded-full flex-shrink-0"><Bot size={20}/></div>}
                            <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-primary/10 text-gray-800 dark:bg-primary/20 dark:text-gray-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.parts[0].text}</p>
                            </div>
                            {msg.role === 'user' && <div className="p-2 bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-full flex-shrink-0"><User size={20}/></div>}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/80 text-white rounded-full"><Bot size={20}/></div>
                            <div className="max-w-lg p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center">
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                <span>MedEvac AI réfléchit...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <SuggestionChips />
                <div className="p-4 border-t bg-white dark:bg-gray-800 rounded-b-xl dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Posez votre question à MedEvac AI..."
                            className="flex-1 input"
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()} className="btn-primary w-24 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Send size={18} className="mr-2"/> Envoyer</>}
                        </button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default Tchat;
