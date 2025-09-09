import { useAuth } from '../context/AuthContextProvider';

interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const hasAccess = allowedRoles.includes(user.role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};