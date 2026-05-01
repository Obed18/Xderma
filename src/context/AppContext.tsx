import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

export interface User {
  id: string;
  email: string;
  avatar: string;
  joinedDate: string;
}

interface XdermaState {
  user: User | null;
  isLoggedIn: boolean;
  authLoading: boolean;
  setSearchQuery: (query: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface XdermaProviderProps {
  children: React.ReactNode;
}

const XdermaContext = createContext<XdermaState | undefined>(undefined);

export const XdermaProvider = ({ children }: XdermaProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [, setSearchQueryState] = useState('');

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
  };

  const login = async (email: string, _password: string) => {
    setAuthLoading(true);
    try {
      setUser({
        id: 'demo-user',
        email,
        avatar: '',
        joinedDate: new Date().toISOString(),
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, _password: string) => {
    setAuthLoading(true);
    try {
      setUser({
        id: 'demo-user',
        email,
        avatar: '',
        joinedDate: new Date().toISOString(),
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
  };

  const resetPassword = async (_email: string) => {
    return Promise.resolve();
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      authLoading,
      setSearchQuery,
      login,
      signup,
      logout,
      resetPassword,
    }),
    [authLoading, user]
  );

  return (
    <XdermaContext.Provider value={value}>
      {children}
    </XdermaContext.Provider>
  );
};

export const useXderma = () => {
  const context = useContext(XdermaContext);
  if (!context) {
    throw new Error('useXderma must be used inside XdermaProvider');
  }
  return context;
};
