// RedirectIfAuthenticated.tsx

import { useAuth } from "@/hooks/useAuth"; 
import { Navigate } from "react-router-dom";
import React from "react";

const RedirectIfAuthenticated = ({ element }: { element: React.ReactElement }) => {
  const { user, loading } = useAuth();
  
  // CRITICAL CHECK: Get the status from local storage
  const isSigningUp = localStorage.getItem('isSigningUp') === 'true';

  // 1. If still loading, or if the flag is set, show loading/wait.
  // The flag ensures that if a session *is* found during signup, we don't redirect.
  if (loading || isSigningUp) {
    // Show nothing or a small spinner while checking session
    return <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    {/* Replace with your actual spinner component (e.g., from shadcn/ui or a simple CSS animation) */}
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-blue-500 border-gray-200 mb-4" />
    
    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
      Checking authentication...
    </p>
  </div>
  }

  // 2. If the user is logged in AND the flag is NOT set, redirect them away.
  if (user) {
    return <Navigate to="/" replace />;
  }

  // 3. If the user is logged out (user is null), render the login/signup page.
  return element;
};

export default RedirectIfAuthenticated;