import { useState } from 'react'; // Removed useEffect since signupSuccess is gone
import { Link, useNavigate } from 'react-router-dom'; 
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const navigate = useNavigate(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // Used for button only
  const [processing, setProcessing] = useState(false); // Absolute blocker state
  // const [signupSuccess, setSignupSuccess] = useState(false); // REMOVED
  const [error, setError] = useState<string | null>(null);

  // The useEffect for signupSuccess is REMOVED

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Disable button
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim(); 
    const trimmedPassword = password.trim(); 

    try {
        // SET FLAG: Tell the redirect component to stand down
        localStorage.setItem('isSigningUp', 'true'); // <--- CRITICAL NEW LINE
        
        // 1. SIGN UP
        const { error } = await (supabase.auth.signUp as any)({
          email: trimmedEmail,
          password: trimmedPassword,
          options: { 
              shouldCreateUserSession: false, 
          }
        });
        
        if (error) throw error;
        
        // 2. FORCED LOGOUT
        await supabase.auth.signOut();
        
        // 3. CRITICAL: Add the stabilizing delay (500ms).
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // 4. REMOVE FLAG and REDIRECT
        localStorage.removeItem('isSigningUp'); // <--- CRITICAL NEW LINE
        navigate('/login?success=true'); 
        
      } catch (error: any) {
        localStorage.removeItem('isSigningUp'); // Remove on error too
        setError(error.message);
      } finally {
        setLoading(false); 
      } 
  };

  // -------------------------------------------------------------
  // CRITICAL RENDER LOGIC: BLOCK ALL VIEWS DURING PROCESSING
  // -------------------------------------------------------------
  if (processing) {
      return (
          <div className="flex items-center justify-center min-h-screen text-xl text-gray-500">
              Processing Signup...
          </div>
      );
  }
  // -------------------------------------------------------------
  // END CRITICAL RENDER LOGIC
  // -------------------------------------------------------------


  // Render the signup form (only runs if !processing)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm rounded-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-500 dark:text-gray-200">Join <br/> The Adventure</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <Button type="submit" className="w-full rounded-md shadow-sm transition-transform transform hover:scale-105" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}