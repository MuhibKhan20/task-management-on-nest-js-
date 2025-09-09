import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import './assets/index.css';
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeContextProvider } from './context/ThemeContextProvider.tsx';
import { AuthContextProvider } from './context/AuthContextProvider.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import App from './App.tsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthContextProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeContextProvider>
          <NotificationProvider>
            <CssBaseline enableColorScheme />
            <App />
          </NotificationProvider>
        </ThemeContextProvider>
        <ReactQueryDevtools buttonPosition="bottom-right" />
      </QueryClientProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
