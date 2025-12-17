
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../components/Card';
import { useData } from '../providers/DataProvider';
import { useAuth } from '../providers/AuthProvider';
import { User } from '../types';
import { Search, Send, Check, CheckCheck, Lock, MoreVertical, Phone, Paperclip, FileText, X, Image as ImageIcon, Download, Users as UsersIcon, Plus } from 'lucide-react';
import { useNotification } from '../providers/NotificationProvider';

const UserAvatar: React.FC<{ user?: User; size?: string; status?: boolean; isGroup?: boolean; name?: string }> = ({ user, size = "w-10 h-10", status = true, isGroup = false, name }) => {
    if (isGroup) {
        return (
            <div className={`relative ${size} flex-shrink-0`}>
                <div className="w-full h-full rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200 dark:bg-indigo-900/50 dark:border-indigo-800 dark:text-indigo-300">
                    <UsersIcon size={20} />
                </div>
            </div>
        );
    }

    if (!user) return <div className={`${size} bg-gray-200 rounded-full`}></div>;

    return (
        <div className={`relative ${size} flex-shrink-0`}>
            {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.nom} className="w-full h-full rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
                <div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-gray-200 dark:border-gray-700">
                    {user.nom.charAt(0).toUpperCase()}
                </div>
            )}
            {status && (
                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            )}
        </div>
    );
};

const CreateGroupModal: React.FC<{ onClose: () => void; onCreate: (name: string, members: string[]) => void; users: User[]; currentUserId: string }> = ({ onClose, onCreate, users, currentUserId }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUserId]);

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleCreate = () => {
        if (groupName.trim() && selectedMembers.length > 1) {
            onCreate(groupName, selectedMembers);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Nouveau Groupe</h3>
                    <button onClick={onClose}><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom du groupe</label>
                        <input 
                            type="text" 
                            className="input w-full" 
                            placeholder="Ex: Équipe Nuit, Coordination..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Membres ({selectedMembers.length})</label>
                        <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">
                            {users.filter(u => u.id !== currentUserId).map(u => (
                                <div 
                                    key={u.id} 
                                    onClick={() => toggleMember(u.id)}
                                    className={`flex items-center gap-3 p-2 rounded cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedMembers.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                        {selectedMembers.includes(u.id) && <Check size={12} className="text-white"/>}
                                    </div>
                                    <UserAvatar user={u} size="w-8 h-8" status={false}/>
                                    <span className="text-sm font-medium">{u.nom}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button 
                        disabled={!groupName.trim() || selectedMembers.length < 2}
                        onClick={handleCreate}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        Créer le groupe
                    </button>
                </div>
            </Card>
        </div>
    );
};

const Messages: React.FC = () => {
    const { users = [], internalMessages = [], chatGroups = [], sendInternalMessage, markInternalMessageAsRead, createChatGroup } = useData();
    const { currentUser } = useAuth();
    const { addNotification } = useNotification();
    
    // State to track selection: either a user ID or a group ID
    const [selectedContext, setSelectedContext] = useState<{ type: 'user' | 'group', id: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<{ type: 'image' | 'file'; url: string; name: string } | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current conversation messages
    const currentConversation = useMemo(() => {
        if (!currentUser || !selectedContext) return [];
        
        if (selectedContext.type === 'user') {
            return internalMessages.filter(m => 
                (m.senderId === currentUser.id && m.receiverId === selectedContext.id) ||
                (m.senderId === selectedContext.id && m.receiverId === currentUser.id)
            ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        } else {
            return internalMessages.filter(m => m.groupId === selectedContext.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
    }, [internalMessages, currentUser, selectedContext]);

    // Mark messages as read when viewing conversation
    useEffect(() => {
        if (currentConversation.length > 0 && currentUser && selectedContext) {
            // Only mark direct messages or group messages not from me as read
            const unreadMessages = currentConversation.filter(m => m.senderId !== currentUser.id && !m.isRead);
            // Optimization: In a real app, we'd batch update or have a "markConversationAsRead" endpoint
            unreadMessages.forEach(m => markInternalMessageAsRead(m.id));
        }
    }, [currentConversation, currentUser, markInternalMessageAsRead, selectedContext]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentConversation]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !currentUser || !selectedContext) return;

        const payload: any = {
            senderId: currentUser.id,
            content: newMessage.trim(),
            attachment: attachment || undefined
        };

        if (selectedContext.type === 'user') {
            payload.receiverId = selectedContext.id;
        } else {
            payload.groupId = selectedContext.id;
        }

        await sendInternalMessage(payload);
        setNewMessage('');
        setAttachment(null);
    };

    const handleCreateGroup = async (name: string, members: string[]) => {
        if (!currentUser) return;
        try {
            await createChatGroup({
                name,
                members,
                createdBy: currentUser.id
            });
            addNotification('Groupe créé avec succès', 'success');
        } catch (e) {
            addNotification('Erreur lors de la création du groupe', 'error');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const type = file.type.startsWith('image/') ? 'image' : 'file';
                setAttachment({
                    type,
                    url: reader.result as string,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getUnreadCount = (contextId: string, type: 'user' | 'group') => {
        if (!currentUser) return 0;
        if (type === 'user') {
            return internalMessages.filter(m => m.senderId === contextId && m.receiverId === currentUser.id && !m.isRead).length;
        } else {
            return internalMessages.filter(m => m.groupId === contextId && m.senderId !== currentUser.id && !m.isRead).length;
        }
    };

    const getLastMessage = (contextId: string, type: 'user' | 'group') => {
        if (!currentUser) return null;
        let msgs;
        if (type === 'user') {
            msgs = internalMessages.filter(m => 
                (m.senderId === currentUser.id && m.receiverId === contextId) ||
                (m.senderId === contextId && m.receiverId === currentUser.id)
            );
        } else {
            msgs = internalMessages.filter(m => m.groupId === contextId);
        }
        msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return msgs.length > 0 ? msgs[0] : null;
    };

    if (!currentUser) return null;

    // Filter lists
    const filteredUsers = users.filter(u => 
        u.id !== currentUser.id && 
        u.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const myGroups = chatGroups?.filter(g => g.members.includes(currentUser.id) && g.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

    const getSelectedName = () => {
        if (!selectedContext) return '';
        if (selectedContext.type === 'user') {
            return users.find(u => u.id === selectedContext.id)?.nom || '';
        } else {
            return chatGroups?.find(g => g.id === selectedContext.id)?.name || '';
        }
    };

    const isSelected = (id: string, type: 'user' | 'group') => selectedContext?.id === id && selectedContext?.type === type;

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6 animate-in fade-in">
            {isCreateGroupOpen && currentUser && (
                <CreateGroupModal 
                    onClose={() => setIsCreateGroupOpen(false)} 
                    onCreate={handleCreateGroup} 
                    users={users} 
                    currentUserId={currentUser.id} 
                />
            )}

            {/* Sidebar List */}
            <Card className="w-full md:w-1/3 lg:w-1/4 flex flex-col !p-0 overflow-hidden shadow-lg border dark:border-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 space-y-4">
                    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                        <button 
                            onClick={() => setActiveTab('direct')} 
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'direct' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}
                        >
                            Collègues
                        </button>
                        <button 
                            onClick={() => setActiveTab('groups')} 
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'groups' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}
                        >
                            Groupes
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input w-full pl-8 py-1.5 text-sm"
                            />
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14}/>
                        </div>
                        {activeTab === 'groups' && (
                            <button onClick={() => setIsCreateGroupOpen(true)} className="p-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-colors">
                                <Plus size={16}/>
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'direct' ? (
                        filteredUsers.map(user => {
                            const lastMsg = getLastMessage(user.id, 'user');
                            const unread = getUnreadCount(user.id, 'user');
                            return (
                                <div 
                                    key={user.id} 
                                    onClick={() => setSelectedContext({ type: 'user', id: user.id })}
                                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 ${isSelected(user.id, 'user') ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <UserAvatar user={user} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{user.nom}</h3>
                                            {lastMsg && <span className="text-[10px] text-gray-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}>
                                                {lastMsg ? (
                                                    lastMsg.attachment 
                                                        ? <span className="flex items-center"><Paperclip size={10} className="mr-1"/> PJ</span> 
                                                        : (lastMsg.senderId === currentUser.id ? `Vous: ${lastMsg.content}` : lastMsg.content)
                                                ) : <span className="italic opacity-50">Aucun message</span>}
                                            </p>
                                            {unread > 0 && (
                                                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ml-2">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        myGroups.map(group => {
                            const lastMsg = getLastMessage(group.id, 'group');
                            const unread = getUnreadCount(group.id, 'group');
                            return (
                                <div 
                                    key={group.id} 
                                    onClick={() => setSelectedContext({ type: 'group', id: group.id })}
                                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 ${isSelected(group.id, 'group') ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                >
                                    <UserAvatar isGroup={true} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{group.name}</h3>
                                            {lastMsg && <span className="text-[10px] text-gray-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}>
                                                {lastMsg ? (
                                                    lastMsg.senderId === currentUser.id ? `Vous: ${lastMsg.content}` : 
                                                    <span className="flex items-center">
                                                        <span className="font-bold mr-1">{users.find(u=>u.id===lastMsg.senderId)?.nom.split(' ')[0]}:</span> {lastMsg.content}
                                                    </span>
                                                ) : <span className="italic opacity-50">Nouveau groupe</span>}
                                            </p>
                                            {unread > 0 && (
                                                <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ml-2">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="hidden md:flex flex-1 flex-col !p-0 overflow-hidden shadow-lg border dark:border-gray-700 relative">
                {selectedContext ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                {selectedContext.type === 'user' ? (
                                    <UserAvatar user={users.find(u => u.id === selectedContext.id)!} />
                                ) : (
                                    <UserAvatar isGroup={true} />
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{getSelectedName()}</h3>
                                    <div className="flex items-center text-xs text-green-600 font-medium">
                                        <Lock size={10} className="mr-1"/> 
                                        {selectedContext.type === 'user' ? 'Discussion privée' : `Groupe • ${chatGroups?.find(g => g.id === selectedContext.id)?.members.length} membres`}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" title="Appeler">
                                    <Phone size={20}/>
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <MoreVertical size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                            {currentConversation.map((msg) => {
                                const isMe = msg.senderId === currentUser.id;
                                const sender = users.find(u => u.id === msg.senderId);
                                
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                        {!isMe && selectedContext.type === 'group' && (
                                            <UserAvatar user={sender!} size="w-6 h-6" status={false} />
                                        )}
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative group ${
                                            isMe 
                                                ? 'bg-primary text-white rounded-br-none' 
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                        }`}>
                                            {!isMe && selectedContext.type === 'group' && (
                                                <p className="text-[10px] font-bold text-indigo-500 mb-1">{sender?.nom}</p>
                                            )}
                                            
                                            {/* Render Attachment */}
                                            {msg.attachment && (
                                                <div className="mb-2">
                                                    {msg.attachment.type === 'image' ? (
                                                        <a href={msg.attachment.url} download={msg.attachment.name} className="block">
                                                            <img 
                                                                src={msg.attachment.url} 
                                                                alt="Attachment" 
                                                                className="max-h-48 rounded-lg object-contain bg-black/10 dark:bg-white/10"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a 
                                                            href={msg.attachment.url} 
                                                            download={msg.attachment.name}
                                                            className={`flex items-center p-3 rounded-lg border transition-colors ${
                                                                isMe ? 'bg-primary-dark/20 border-white/20 hover:bg-primary-dark/30' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <div className="p-2 bg-white/20 rounded-full mr-3">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-sm font-bold truncate">{msg.attachment.name}</p>
                                                                <p className="text-xs opacity-70">Document</p>
                                                            </div>
                                                            <Download size={16} />
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {msg.content && <p className="text-sm">{msg.content}</p>}
                                            
                                            <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {isMe && (
                                                    msg.isRead ? <CheckCheck size={12}/> : <Check size={12}/>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                            {attachment && (
                                <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 animate-in slide-in-from-bottom-2 fade-in">
                                    <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {attachment.type === 'image' ? (
                                            <img src={attachment.url} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText size={20} className="text-gray-500 dark:text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{attachment.name}</p>
                                        <p className="text-[10px] text-gray-500">Prêt à envoyer</p>
                                    </div>
                                    <button 
                                        onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} 
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileSelect} 
                                    className="hidden" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mb-0.5"
                                    title="Joindre un fichier"
                                >
                                    <Paperclip size={20}/>
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Écrivez votre message..."
                                        className="input w-full py-3 px-4 rounded-full border-gray-300 dark:border-gray-600 focus:ring-primary"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim() && !attachment}
                                    className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all transform hover:scale-105 mb-0.5"
                                >
                                    <Send size={20} className={(newMessage.trim() || attachment) ? "ml-0.5" : ""}/>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Lock size={40} className="opacity-50"/>
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">Messagerie Sécurisée</h3>
                        <p className="max-w-xs">Sélectionnez un membre de l'équipe ou un groupe pour démarrer une discussion.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Messages;
