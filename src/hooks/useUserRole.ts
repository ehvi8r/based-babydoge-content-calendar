
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading user role:', error);
          setUserRole('user'); // Default to user role
        } else {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();

    // Create a unique channel name to avoid conflicts
    const channelName = `user_roles_changes_${Date.now()}_${Math.random()}`;

    // Subscribe to role changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          loadUserRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isAdmin = userRole === 'admin';
  const isTeamMember = userRole === 'team_member';
  const isRegularUser = userRole === 'user';

  return {
    userRole,
    loading,
    isAdmin,
    isTeamMember,
    isRegularUser
  };
};
