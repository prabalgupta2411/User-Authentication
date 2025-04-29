import { createBrowserRouter, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FileUpload from "./pages/FileUpload";
import FileParser from "./pages/FileParser";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

// Private route wrapper component
const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
};

// Auth callback component
const AuthCallback = () => {
  const { loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!loading) {
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
};

// Create router configuration
export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/file-upload",
    element: (
      <PrivateRoute>
        <FileUpload />
      </PrivateRoute>
    ),
  },
  {
    path: "/file-parser",
    element: (
      <PrivateRoute>
        <FileParser />
      </PrivateRoute>
    ),
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]); 