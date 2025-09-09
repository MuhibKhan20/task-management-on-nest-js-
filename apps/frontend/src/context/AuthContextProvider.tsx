import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getUserFromToken } from '../lib/jwt';

type AuthConextType = {
  accessToken: string | null;
  refreshToken: string | null;
  user: { userId: string; email: string; role: string } | null;
  isAdmin: boolean;
  setToken: (access_token: string, refresh_token: string) => void;
  clearToken: () => void;
};

const AuthContext = createContext<AuthConextType>({
  accessToken: '',
  refreshToken: '',
  user: null,
  isAdmin: false,
  setToken: () => {},
  clearToken: () => {}
});

const AuthContextProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  // State to hold the authentication token
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('access_token')
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refresh_token')
  );
  
  // Derive user info from access token
  const user = getUserFromToken(accessToken);
  const isAdmin = user?.role === 'ADMIN';

  const [mounted, setMounted] = useState(false);

  // Function to set the authentication token
  const setToken = (access_token: string, refresh_token: string) => {
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
  };

  // Function to clear the authentication token
  const clearToken = () => {
    setAccessToken('');
    setRefreshToken('');
  };

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    } else {
      localStorage.removeItem('access_token');
    }

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }, [accessToken, refreshToken]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAdmin,
      setToken,
      clearToken
    }),
    [accessToken, refreshToken, user, isAdmin]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>
      {mounted && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContextProvider, useAuth };
