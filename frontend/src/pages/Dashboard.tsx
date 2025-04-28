import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to auth page
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button 
            variant="outline" 
            className="bg-zinc-900 text-white border-zinc-700 hover:bg-zinc-800"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-zinc-400 text-sm">+12% from last month</p>
          </div>

          {/* Activity Card */}
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <ul className="space-y-2">
              <li className="text-sm">New user registered</li>
              <li className="text-sm">Profile updated</li>
              <li className="text-sm">Settings changed</li>
            </ul>
          </div>

          {/* Profile Card */}
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-zinc-400">Email:</span> {JSON.parse(localStorage.getItem('user') || '{}').email}
              </p>
              <p className="text-sm">
                <span className="text-zinc-400">Member since:</span> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 