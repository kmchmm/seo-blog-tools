import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Provider as DarkModeProvider } from './context/DarkModeContext';
import { Provider as UserProvider } from './context/UserContext';
import { Provider as ToastProvider } from './context/ToastContext';
import { Provider as BatchProgressProvider } from './context/SB37ProgressContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DarkModeProvider>
      <UserProvider>
        <ToastProvider>
          <BatchProgressProvider>
            <App />
          </BatchProgressProvider>
        </ToastProvider>
      </UserProvider>
    </DarkModeProvider>
  </StrictMode>
);
