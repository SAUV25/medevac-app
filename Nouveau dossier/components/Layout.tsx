
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './Toast';
import { ViewContext } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentView: string;
    setCurrentView: (view: any, context?: ViewContext) => void;
    title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, title }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans">
            <Sidebar 
                currentView={currentView as any} 
                setCurrentView={(view, context) => {
                    setCurrentView(view, context);
                    setIsMobileMenuOpen(false); // Ferme le menu sur mobile après un clic
                }} 
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header 
                    title={title} 
                    currentView={currentView}
                    onOpenMenu={() => setIsMobileMenuOpen(true)}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 transition-all relative">
                    {children}
                </main>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Layout;
