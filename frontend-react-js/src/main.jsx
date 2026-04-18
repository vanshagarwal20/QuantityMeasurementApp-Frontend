import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

// ✅ FIX: Remove React.StrictMode.
// In development StrictMode renders every component TWICE intentionally.
// This causes GoogleOAuthProvider to mount twice → google.accounts.id.initialize()
// is called twice → "called multiple times" warning → Cross-Origin-Opener-Policy
// postMessage errors because the second Google popup tries to communicate with
// a stale/duplicate iframe from the first initialization.
ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
