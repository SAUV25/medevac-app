
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './providers/LanguageProvider';
// FIX: Corrected import path to be relative.
import { AuthProvider } from './providers/AuthProvider';
// FIX: Corrected import path to be relative.
import { DataProvider } from './providers/DataProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { ThemeProvider } from './providers/ThemeProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <DataProvider>
              <AuthProvider>
                  <App />
              </AuthProvider>
          </DataProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
