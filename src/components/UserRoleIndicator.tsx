
import { Badge } from '@/components/ui/badge';
import { Crown, Users, User } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const UserRoleIndicator = () => {
  const { userRole, loading } = useUserRole();

  if (loading || !userRole) {
    return null;
  }

  const getRoleConfig = () => {
    switch (userRole) {
      case 'admin':
        return {
          icon: Crown,
          label: 'Admin',
          className: 'bg-red-600 text-white',
          description: 'Full access'
        };
      case 'team_member':
        return {
          icon: Users,
          label: 'Team Member',
          className: 'bg-blue-600 text-white',
          description: 'Read-only access'
        };
      default:
        return {
          icon: User,
          label: 'User',
          className: 'bg-gray-600 text-white',
          description: 'Personal account'
        };
    }
  };

  const { icon: Icon, label, className, description } = getRoleConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className={className}>
        <Icon size={12} className="mr-1" />
        {label}
      </Badge>
      <span className="text-xs text-slate-400 hidden md:inline">
        {description}
      </span>
    </div>
  );
};

export default UserRoleIndicator;
