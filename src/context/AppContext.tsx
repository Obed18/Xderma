import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LanguageCode,
  TranslationKey,
  translate,
  translations,
} from '../i18n/translations';

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
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey, values?: Record<string, string>) => string;
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
const LANGUAGE_STORAGE_KEY = 'xderma_language';

const isLanguageCode = (value: string): value is LanguageCode =>
  value in translations;

export const XdermaProvider = ({ children }: XdermaProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [, setSearchQueryState] = useState('');

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage && isLanguageCode(savedLanguage)) {
        setLanguageState(savedLanguage);
      }
    };

    void loadLanguage();
  }, []);

  const setLanguage = async (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

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
      language,
      setLanguage,
      t: (key: TranslationKey, values?: Record<string, string>) =>
        translate(language, key, values),
      setSearchQuery,
      login,
      signup,
      logout,
      resetPassword,
    }),
    [authLoading, language, user]
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
