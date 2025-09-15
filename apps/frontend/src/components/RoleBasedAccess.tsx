import { useAuth } from '../context/AuthContextProvider';

interface RoleBasedAccessProps {
  allowedRoles?: string[];
  hiddenRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  hiddenRoles,
  children,
  fallback = null
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  let hasAccess = true;

  // If allowedRoles is provided, check if user role is in allowed list
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(user.role);
  }

  // If hiddenRoles is provided, check if user role is NOT in hidden list
  if (hiddenRoles && hiddenRoles.length > 0) {
    hasAccess = !hiddenRoles.includes(user.role);
  }


  return hasAccess ? <>{children}</> : <>{fallback}</>;
};