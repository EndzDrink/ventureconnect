import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User, AuthError } from '@supabase/supabase-js';

// Define the type for the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for changes in the authentication state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Initial check for the user's session
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setUser(data?.session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    // Clean up the listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
    return { error };
  };

  const value = { user, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default useAuth;

