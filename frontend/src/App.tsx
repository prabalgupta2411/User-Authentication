import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FileUpload from "./pages/FileUpload";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function AuthCallback() {
  const { loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for the session to be updated
        if (!loading) {
          // Check if we have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            window.location.href = '/dashboard';
          } else {
            setError('Authentication failed. Please try again.');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during authentication. Please try again.');
      }
    };

    handleCallback();
  }, [loading]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Authentication Error</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <a href="/auth" className="text-blue-400 hover:text-blue-300">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/file-upload" element={
            <PrivateRoute>
              <FileUpload />
            </PrivateRoute>
          } />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
