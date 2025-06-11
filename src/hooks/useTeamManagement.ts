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

      // Load team members - use a simpler approach with separate queries
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: true });

      console.log('Profiles query result:', { profilesData, profilesError });

      if (profilesError) {
        console.error('Error loading user profiles:', profilesError);
        // Don't return early, continue with empty profiles
      }

      // Get roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('Roles query result:', { rolesData, rolesError });

      if (rolesError) {
        console.error('Error loading user roles:', rolesError);
        // Don't return early, continue with empty roles
      }

      // If we have no profiles but we have roles, there's a data inconsistency
      if ((!profilesData || profilesData.length === 0) && rolesData && rolesData.length > 0) {
        console.warn('Data inconsistency: Found roles but no profiles. This suggests missing user profiles.');
        
        // Try to get user info directly from auth.users via a different approach
        // Since we can't query auth.users directly, we'll show the roles without profile info
        const formattedFromRoles = rolesData.map(role => ({
          id: role.user_id,
          email: `User ${role.user_id.slice(0, 8)}...`, // Fallback email
          full_name: undefined,
          role: role.role as UserRole,
          created_at: new Date().toISOString()
        }));
        
        console.log('Formatted members from roles only:', formattedFromRoles);
        setTeamMembers(formattedFromRoles);
        setLoading(false);
        return;
      }

      // Combine profiles with roles - include all users, even those without explicit roles
      const formattedMembers = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role || 'user' as UserRole,
          created_at: profile.created_at
        };
      });

      console.log('Formatted members:', formattedMembers);
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
