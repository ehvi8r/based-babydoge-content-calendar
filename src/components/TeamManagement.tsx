
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Plus, Clock } from 'lucide-react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useUserRole } from '@/hooks/useUserRole';

const TeamManagement = () => {
  const { invitations, teamMembers, inviteTeamMember, loading } = useTeamManagement();
  const { isAdmin } = useUserRole();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (!isAdmin) {
    return null; // Only admins can manage team
  }

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setSending(true);
    const success = await inviteTeamMember(email.trim(), 'team_member');
    if (success) {
      setEmail('');
    }
    setSending(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600';
      case 'team_member':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardContent className="p-6">
          <div className="text-center text-white">Loading team data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="text-blue-400" size={20} />
          Team Management
          <Badge variant="secondary" className="bg-blue-600 text-white">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite New Team Member */}
        <div className="space-y-4 p-4 bg-slate-700/50 rounded-lg">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Mail size={16} />
            Invite Team Member
          </h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="bg-slate-600 border-slate-500 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleInvite}
                disabled={!email.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={16} className="mr-2" />
                {sending ? 'Sending...' : 'Invite'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Team members will have read-only access to your content and will use your API keys.
          </p>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Clock size={16} />
              Pending Invitations ({invitations.length})
            </h3>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{invitation.email}</div>
                      <div className="text-xs text-slate-400">
                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getRoleBadgeColor(invitation.role)}>
                        {invitation.role.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                        Pending
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="space-y-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Users size={16} />
            Team Members ({teamMembers.length})
          </h3>
          {teamMembers.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              No team members yet
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">
                        {member.full_name || member.email}
                      </div>
                      {member.full_name && (
                        <div className="text-sm text-slate-400">{member.email}</div>
                      )}
                      <div className="text-xs text-slate-400">
                        Joined: {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getRoleBadgeColor(member.role)}>
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManagement;
