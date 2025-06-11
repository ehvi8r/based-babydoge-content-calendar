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

      // Load team members
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: true });

      console.log('DEBUG - Profiles data:', profilesData);
      console.log('DEBUG - Number of profiles:', profilesData?.length);

      if (profilesError) {
        console.error('Error loading user profiles:', profilesError);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Get roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('DEBUG - Roles data:', rolesData);
      console.log('DEBUG - Number of roles:', rolesData?.length);

      if (rolesError) {
        console.error('Error loading user roles:', rolesError);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Combine profiles with roles
      const formattedMembers = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        console.log(`DEBUG - Processing profile ${profile.email}, found role:`, userRole);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role || 'user' as UserRole,
          created_at: profile.created_at
        };
      });

      console.log('DEBUG - Final formatted members:', formattedMembers);
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error loading team data:', error);
      setInvitations([]);
      setTeamMembers([]);
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

    // Create unique channel names to avoid conflicts
    const invitationChannelName = `team_invitations_changes_${Date.now()}_${Math.random()}`;
    const rolesChannelName = `user_roles_changes_${Date.now()}_${Math.random()}`;

    // Subscribe to changes
    const invitationChannel = supabase
      .channel(invitationChannelName)
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
      .channel(rolesChannelName)
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
