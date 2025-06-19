
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatedUser {
  id: string;
  email: string;
  role: string;
  temporaryPassword: string;
}

const AdminUserCreation = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'team_member' | 'user'>('team_member');
  const [creating, setCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleCreateUser = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: email.trim(),
          full_name: fullName.trim(),
          role: role
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Add to created users list
      setCreatedUsers(prev => [...prev, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        temporaryPassword: data.temporaryPassword
      }]);

      // Reset form
      setEmail('');
      setFullName('');
      setRole('team_member');

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600';
      case 'team_member':
        return 'bg-blue-600';
      case 'user':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserPlus size={20} />
          Admin User Creation
          <Badge variant="secondary" className="bg-red-600 text-white">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Creation Form */}
        <div className="space-y-4 p-4 bg-slate-700/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-email" className="text-slate-300">Email Address *</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-600 border-slate-500 text-white"
              />
            </div>
            <div>
              <Label htmlFor="create-fullname" className="text-slate-300">Full Name</Label>
              <Input
                id="create-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="bg-slate-600 border-slate-500 text-white"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'team_member' | 'user') => setRole(value)}>
              <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">Team Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCreateUser}
            disabled={!email.trim() || creating}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            <UserPlus size={16} className="mr-2" />
            {creating ? 'Creating User...' : 'Create User Account'}
          </Button>
        </div>

        {/* Created Users List */}
        {createdUsers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Recently Created Users</h3>
            <div className="space-y-2">
              {createdUsers.map((user) => (
                <div key={user.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{user.email}</div>
                      <div className="text-xs text-slate-400">ID: {user.id}</div>
                    </div>
                    <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300 min-w-0 flex-1">
                        Email: {user.email}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(user.email, 'Email')}
                        className="text-xs"
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300 min-w-0 flex-1">
                        Password: {showPasswords[user.id] ? user.temporaryPassword : '••••••••••••'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="text-xs"
                      >
                        {showPasswords[user.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(user.temporaryPassword, 'Password')}
                        className="text-xs"
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-300">
                    <strong>Important:</strong> Share these credentials securely with the user. 
                    They should change their password on first login.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Create for the 3 Target Users */}
        <div className="space-y-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <h3 className="text-green-300 font-medium">Quick Create Target Users</h3>
          <p className="text-xs text-green-200">
            Click to quickly create the 3 users that need access to the shared calendar:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { email: 'geminikandrew@gmail.com', name: 'Gemini Andrew' },
              { email: 'popcatsr@gmail.com', name: 'Popcat SR' },
              { email: 'robearncash@gmail.com', name: 'Rob Earn Cash' }
            ].map((targetUser) => (
              <Button
                key={targetUser.email}
                size="sm"
                variant="outline"
                onClick={() => {
                  setEmail(targetUser.email);
                  setFullName(targetUser.name);
                  setRole('team_member');
                }}
                className="text-xs justify-start border-green-500/30 text-green-300 hover:bg-green-900/30"
              >
                Set up: {targetUser.email}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUserCreation;
