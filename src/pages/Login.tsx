import { useState } from 'react';
// REMOVE THE ORIGINAL IMPORT: // import { supabase } from '@/integrations/supabase/client'; 

// --- START TEMPORARY CLIENT INITIALIZATION BLOCK ---
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/database.types'; // Import the type for correct typing

const SUPABASE_URL = "https://ilidtqlbkwyoxoowyggl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaWR0cWxia3d5b3hvb3d5Z2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDE3NDIsImV4cCI6MjA3MTc3Nzc0Mn0.hvBhSWEJuu8rXBwm7d6-h0ywNULDrh8J1td4_WGHOgo";

// Create the temporary client here, including the auth configuration
const tempSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, 
  }
});
// --- END TEMPORARY CLIENT INITIALIZATION BLOCK ---

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // CRITICAL FIX: Trim whitespace from inputs before sending to Supabase
    const trimmedEmail = email.trim(); 
    const trimmedPassword = password.trim(); 

    // Basic validation to prevent empty submissions, though 'required' handles this
    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      // **USE THE TEMPORARY CLIENT:**
      const { error } = await tempSupabase.auth.signInWithPassword({ 
        email: trimmedEmail, // Use trimmed email
        password: trimmedPassword, // Use trimmed password
      });

      if (error) {
        // Supabase returns the generic 'Invalid login credentials' for security.
        // We catch it here to display to the user.
        throw error;
      }
      
      // Success: AuthProvider will handle the session change and redirection.
    } catch (error: any) {
        console.error("Login attempt failed:", error.message); // <--- ADD THIS
        setError(error.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm rounded-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-500 dark:text-gray-800">Welcome <br/> to <br/> VentureConnect</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-blue-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <Button type="submit" className="w-full rounded-md shadow-sm transition-transform transform hover:scale-105" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}