import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './lib/auth';
import { BrandingProvider } from './lib/branding';
import './index.css';

// staleTime was 5 minutes, which meant any page visited in the last five
// minutes rendered from cache without refetching. New rows — a fresh report in
// the moderation queue, a new ticket, someone's post — only appeared after a
// hard reload, which reads as data loss rather than caching. Thirty seconds
// still spares the rapid back-and-forth navigation the cache is there for,
// while making every page feel live.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BrandingProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrandingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
