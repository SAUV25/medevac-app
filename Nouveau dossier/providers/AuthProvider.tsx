
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useData } from './DataProvider';
import { useNotification } from './NotificationProvider';
import useLocalStorage from '../hooks/useLocalStorage';
import { mockedFetch } from '../api/mockApi';

interface AuthContextType {
    currentUser: User | null;
    users: User[];
    login: (userId: string, password: string) => Promise<{ require2FA?: boolean; userId?: string }>;
    verify2FA: (userId: string, code: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { users, updateUser: updateUserDataInDb } = useData();
    const { addNotification } = useNotification();
    const [token, setToken] = useLocalStorage<string | null>('authToken', null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const loadUserFromToken = useCallback(async () => {
        if (token) {
            // FIX: Si la liste des utilisateurs n'est pas encore chargée (vide), 
            // on ne fait rien pour éviter de déconnecter l'utilisateur par erreur.
            if (users.length === 0) return;

            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                const user = users.find(u => u.id === decoded.id);
                if (user) {
                    setCurrentUser(user);
                } else {
                    // Token is invalid or user was deleted
                    setToken(null);
                    setCurrentUser(null);
                }
            } catch {
                setToken(null);
                setCurrentUser(null);
            }
        }
    }, [token, setToken, users]);

    useEffect(() => {
        loadUserFromToken();
    }, [loadUserFromToken]);

    const login = async (userId: string, password: string): Promise<{ require2FA?: boolean; userId?: string }> => {
        try {
            const response = await mockedFetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Check for 2FA requirement
            if (data.require2FA) {
                addNotification(data.message || "Veuillez entrer le code de vérification.", 'info');
                return { require2FA: true, userId: data.userId };
            }
            
            // Standard login success
            setToken(data.token);
            setCurrentUser(data.user);
            addNotification(`Bienvenue, ${data.user.nom}!`, 'success');
            return { require2FA: false };

        } catch (err: any) {
            addNotification(err.message || "ID utilisateur ou mot de passe incorrect.", 'error');
            throw new Error(err.message || 'ID utilisateur ou mot de passe incorrect.');
        }
    };

    const verify2FA = async (userId: string, code: string) => {
        try {
            const response = await mockedFetch('/api/login/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Vérification échouée');
            }

            setToken(data.token);
            setCurrentUser(data.user);
            addNotification(`Connexion 2FA réussie. Bienvenue, ${data.user.nom}!`, 'success');
        } catch (err: any) {
            addNotification(err.message || "Code invalide.", 'error');
            throw err;
        }
    };

    const logout = () => {
        const user = currentUser;
        setToken(null);
        setCurrentUser(null);
        if (user) {
            // Log is now handled by backend
        }
    };

    const updateUser = (user: User) => {
        updateUserDataInDb(user); // This will call the API via DataProvider
        if (currentUser && currentUser.id === user.id) {
            setCurrentUser(user);
        }
        addNotification('Profil mis à jour avec succès.', 'success');
    };

    return (
        <AuthContext.Provider value={{ currentUser, users, login, verify2FA, logout, updateUser, token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
