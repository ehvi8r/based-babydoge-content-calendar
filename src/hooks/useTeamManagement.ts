
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

interface TeamInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

export const useTeamManagement = () => {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTeamData = async () => {
    try {
      // Load pending invitations
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitationError) {
        console.error('Error loading invitations:', invitationError);
      } else {
        setInvitations(invitationData || []);
      }

      // Load team members (users with roles)
      const { data: memberData, error: memberError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_roles (role)
        `)
        .not('user_roles.role', 'is', null);

      if (memberError) {
        console.error('Error loading team members:', memberError);
      } else {
        const formattedMembers = memberData?.map(member => ({
          id: member.id,
          email: member.email,
          full_name: member.full_name,
          role: (member as any).user_roles?.role || 'user',
          created_at: member.created_at
        })) || [];
        setTeamMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteTeamMember = async (email: string, role: UserRole = 'team_member') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          email,
          role,
          invited_by: user.id
        });

      if (error) {
        console.error('Error sending invitation:', error);
        toast({
          title: "Error",
          description: "Failed to send invitation",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${email}`,
      });

      loadTeamData();
      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
      return false;
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_team_invitation', { 
        _token: token 
      });

      if (error || !data) {
        console.error('Error accepting invitation:', error);
        toast({
          title: "Error",
          description: "Failed to accept invitation or invitation expired",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Welcome to the Team!",
        description: "You have successfully joined the team",
      });

      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  useEffect(() => {
    loadTeamData();

    // Subscribe to changes
    const invitationChannel = supabase
      .channel('team_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_invitations'
        },
        () => {
          loadTeamData();
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          loadTeamData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invitationChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  return {
    invitations,
    teamMembers,
    loading,
    inviteTeamMember,
    acceptInvitation,
    loadTeamData
  };
};
