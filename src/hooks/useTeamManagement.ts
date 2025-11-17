
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

  const loadTeamData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        console.log('🔄 Force refreshing team data...');
      }
      
      setLoading(true);

      // Load pending invitations - now includes role field
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select('id, email, role, token, expires_at, accepted_at, created_at')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitationError) {
        console.error('Error loading invitations:', invitationError);
      } else {
        console.log('📧 Loaded invitations:', invitationData?.length || 0);
        setInvitations(invitationData || []);
      }

      // Load ALL user profiles from the database
      console.log('👥 Fetching user profiles...');
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: true });

      console.log('📊 Raw profiles data:', profilesData);
      console.log('📈 Number of profiles found:', profilesData?.length);

      if (profilesError) {
        console.error('❌ Error loading user profiles:', profilesError);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Get roles for all users
      console.log('🔑 Fetching user roles...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('🎭 Raw roles data:', rolesData);
      console.log('📊 Number of roles found:', rolesData?.length);

      if (rolesError) {
        console.error('❌ Error loading user roles:', rolesError);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Combine profiles with roles
      console.log('🔗 Combining profiles with roles...');
      const formattedMembers = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        console.log(`👤 Processing: ${profile.email} (ID: ${profile.id})`);
        console.log(`🎭 Found role:`, userRole);
        
        const member = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role || 'user' as UserRole,
          created_at: profile.created_at
        };
        
        console.log(`✅ Formatted member:`, member);
        return member;
      });

      console.log('🎯 Final team members array:', formattedMembers);
      console.log('📊 Setting team members count:', formattedMembers.length);
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('💥 Critical error loading team data:', error);
      setInvitations([]);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function that can be called externally
  const refreshTeamData = () => {
    console.log('🔄 Manual refresh triggered');
    loadTeamData(true);
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

  const removeUser = async (userId: string, userEmail: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to remove users",
          variant: "destructive",
        });
        return false;
      }

      // Prevent admins from removing themselves
      if (user.id === userId) {
        toast({
          title: "Cannot Remove Yourself",
          description: "You cannot remove your own admin account",
          variant: "destructive",
        });
        return false;
      }

      // Delete the user's role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user:', error);
        toast({
          title: "Error",
          description: "Failed to remove user",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "User Removed",
        description: `${userEmail} has been removed from the team`,
      });

      loadTeamData();
      return true;
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('🚀 useTeamManagement hook initializing...');
    loadTeamData();

    // Create unique channel names to avoid conflicts
    const invitationChannelName = `team_invitations_changes_${Date.now()}_${Math.random()}`;
    const rolesChannelName = `user_roles_changes_${Date.now()}_${Math.random()}`;
    const profilesChannelName = `user_profiles_changes_${Date.now()}_${Math.random()}`;

    console.log('📡 Setting up realtime subscriptions...');

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
          console.log('📧 Team invitations changed, refreshing...');
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
          console.log('🎭 User roles changed, refreshing...');
          loadTeamData();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel(profilesChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          console.log('👥 User profiles changed, refreshing...');
          loadTeamData();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up subscriptions...');
      supabase.removeChannel(invitationChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  return {
    invitations,
    teamMembers,
    loading,
    inviteTeamMember,
    acceptInvitation,
    removeUser,
    loadTeamData,
    refreshTeamData
  };
};
