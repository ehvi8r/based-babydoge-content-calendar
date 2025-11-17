
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Mail, Plus, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useUserRole } from '@/hooks/useUserRole';
import AdminUserCreation from './AdminUserCreation';
import TeamSystemTest from './TeamSystemTest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TeamManagement = () => {
  const { invitations, teamMembers, inviteTeamMember, removeUser, loading, refreshTeamData } = useTeamManagement();
  const { isAdmin } = useUserRole();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ id: string; email: string } | null>(null);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTeamData();
    setTimeout(() => setRefreshing(false), 1000); // Visual feedback
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;
    
    const success = await removeUser(userToRemove.id, userToRemove.email);
    if (success) {
      setUserToRemove(null);
    }
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
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="team-management" className="bg-slate-800/50 border-blue-500/20 rounded-lg">
        <AccordionTrigger className="px-6 py-4 text-white hover:no-underline">
          <div className="flex items-center gap-2">
            <Users className="text-blue-400" size={20} />
            Team Management
            <Badge variant="secondary" className="bg-blue-600 text-white">
              Admin Only
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="flex justify-end mb-6">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
              <TabsTrigger value="create" className="text-white data-[state=active]:bg-green-600">
                Create Users
              </TabsTrigger>
              <TabsTrigger value="manage" className="text-white data-[state=active]:bg-blue-600">
                Manage Team
              </TabsTrigger>
              <TabsTrigger value="test" className="text-white data-[state=active]:bg-purple-600">
                Test System
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <AdminUserCreation />
            </TabsContent>

            <TabsContent value="manage" className="space-y-6 mt-6">
              {/* Invite New Team Member */}
              <div className="space-y-4 p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Mail size={16} />
                  Send Invitation (Traditional Method)
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
                  All Users ({teamMembers.length})
                </h3>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    No users found. Try clicking the refresh button above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              {member.full_name || member.email}
                            </div>
                            {member.full_name && (
                              <div className="text-sm text-slate-400">{member.email}</div>
                            )}
                            <div className="text-xs text-slate-400">
                              Joined: {new Date(member.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {member.id}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getRoleBadgeColor(member.role)}>
                              {member.role.replace('_', ' ')}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToRemove({ id: member.id, email: member.email })}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              <TeamSystemTest />
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent className="bg-slate-800 border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to remove <span className="font-semibold text-white">{userToRemove?.email}</span> from the team?
              This action will revoke their access and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Accordion>
  );
};

export default TeamManagement;
