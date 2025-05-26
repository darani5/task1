import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider withGlobalStyles
    
    theme={{
      colorScheme: 'light',
      // Optional: set primary color
      primaryColor: 'blue',
    }}>
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
