import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

function Spinner() {
  return (
    <span className="inline-block mr-2 align-middle">
      <span className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin block" style={{ borderColor: '#a1a1aa', borderTopColor: '#000' }}></span>
    </span>
  );
}

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const token = searchParams.get('token');
    const user = searchParams.get('user');

    if (error) {
      toast.error(error);
      return;
    }

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Successfully authenticated with GitHub!');
        navigate('/dashboard');
      } catch (err) {
        console.error('Error parsing user data:', err);
        toast.error('Failed to process authentication data');
      }
      return;
    }

    // If we have a code, redirect to backend to handle OAuth exchange
    if (code) {
      setLoading(true);
      window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github/callback?code=${code}`;
    }
  }, [searchParams, navigate]);

  const handleGitHubLogin = () => {
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth`;
      
      // Debug logging
      console.log('GitHub Login - Environment Variables:', {
        clientId: clientId ? 'Present' : 'Missing',
        redirectUri,
        origin: window.location.origin,
        env: import.meta.env
      });

      if (!clientId) {
        toast.error('GitHub Client ID is not configured');
        return;
      }

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
      console.log('GitHub Auth URL:', githubAuthUrl);
      
      // Redirect in the same tab
      window.location.href = githubAuthUrl;
    } catch (error) {
      console.error('GitHub login error:', error);
      toast.error('Failed to initiate GitHub login');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'signup';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Show success message
      toast.success(isLogin ? 'Successfully logged in!' : 'Account created successfully!');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans" style={{ fontFamily: 'Inter, Roboto, Montserrat, Arial, sans-serif', fontWeight: 400 }}>
      {/* Toggle Button Top Right */}
      <div className="absolute top-8 right-12 z-10">
        <Button 
          variant="link" 
          className="text-white text-base font-medium px-6 py-2"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </Button>
      </div>
      {/* Left Side */}
      <div className="w-1/2 bg-zinc-900 text-white flex flex-col justify-between p-16" style={{ letterSpacing: '0.01em' }}>
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold mb-2">
            <span>⌘</span>
            <span>Acme Inc</span>
          </div>
        </div>
        <div className="mb-4">
          <blockquote className="text-2xl font-light leading-relaxed mb-4">
            "This library has saved me countless hours of work and helped me deliver stunning designs to my clients faster than ever before."
          </blockquote>
          <div className="mt-2 text-sm font-medium">Sofia Davis</div>
        </div>
      </div>
      {/* Right Side */}
      <div className="w-1/2 bg-zinc-950 flex flex-col justify-center items-center">
        <div className="w-full max-w-md px-10 py-14">
          <h2 className="text-3xl font-semibold mb-3 text-white text-center tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-zinc-200 text-center mb-8 text-base font-light">
            {isLogin ? 'Enter your credentials to login' : 'Enter your email below to create your account'}
          </p>
          <form className="space-y-5 mb-6" onSubmit={handleAuth}>
            <Input 
              type="email" 
              placeholder="name@example.com" 
              className="bg-zinc-900 text-white placeholder-zinc-400 px-4 py-3 rounded-md border border-zinc-800 focus:border-white focus:ring-0 font-light"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              type="password" 
              placeholder="Password" 
              className="bg-zinc-900 text-white placeholder-zinc-400 px-4 py-3 rounded-md border border-zinc-800 focus:border-white focus:ring-0 font-light"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-zinc-200 font-medium px-4 py-3 rounded-md transition-colors flex items-center justify-center" 
              disabled={loading}
            >
              {loading && <Spinner />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <div className="flex items-center my-8">
            <Separator className="flex-1 bg-zinc-800" />
            <span className="mx-4 text-zinc-400 text-sm font-light">OR CONTINUE WITH</span>
            <Separator className="flex-1 bg-zinc-800" />
          </div>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white border-zinc-700 font-light px-4 py-3 rounded-md"
            onClick={handleGitHubLogin}
            disabled={loading}
          >
            <svg height="20" width="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.415-4.033-1.415-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            {loading ? 'Authenticating...' : 'Continue with GitHub'}
          </Button>
          <p className="text-xs text-zinc-400 mt-8 text-center font-light">
            By clicking continue, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
