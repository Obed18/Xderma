import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import {
  LanguageCode,
  TranslationKey,
  translate,
  translations,
} from '../i18n/translations';
import { supabase } from '../utils/supabase';

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
  verifyAccount: (email: string, code: string, password: string) => Promise<void>;
  resendAccountVerificationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyResetCode: (email: string, code: string) => Promise<void>;
  updatePassword: (email: string, code: string, password: string) => Promise<void>;
}

interface XdermaProviderProps {
  children: React.ReactNode;
}

const XdermaContext = createContext<XdermaState | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'xderma_language';

const isLanguageCode = (value: string): value is LanguageCode =>
  value in translations;

const createUserFromSession = async (session: Session): Promise<User> => {
  const authUser = session.user;
  const email = authUser.email ?? '';

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, avatar_url, created_at')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    id: authUser.id,
    email: profile?.email ?? email,
    avatar: profile?.avatar_url ?? '',
    joinedDate: profile?.created_at ?? authUser.created_at,
  };
};

const upsertProfile = async (session: Session) => {
  const authUser = session.user;

  const { error } = await supabase.from('profiles').upsert(
    {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: authUser.user_metadata?.full_name ?? null,
      avatar_url: authUser.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
};

const getFunctionErrorMessage = async (
  error: unknown,
  fallbackMessage: string
) => {
  const context = (error as { context?: Response })?.context;

  if (!context) {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  try {
    const data = await context.clone().json();
    return data?.message || data?.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

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

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      setAuthLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const nextUser = data.session
          ? await createUserFromSession(data.session)
          : null;

        if (isMounted) {
          setUser(nextUser);
        }
      } catch (error) {
        console.log(error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session) {
        setUser(null);
        return;
      }

      void createUserFromSession(session)
        .then((nextUser) => {
          if (isMounted) {
            setUser(nextUser);
          }
        })
        .catch((error) => console.log(error));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setLanguage = async (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('Unable to start a session. Please try again.');
      }

      await upsertProfile(data.session);
      setUser(await createUserFromSession(data.session));
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      await resendAccountVerificationCode(normalizedEmail);

      if (data.session) {
        await supabase.auth.signOut();
      }

      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const resendAccountVerificationCode = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.functions.invoke(
      'send-account-verification-code',
      {
        body: {
          email: normalizedEmail,
        },
      }
    );

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(
          error,
          'Unable to send account verification code.'
        )
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.message || 'Unable to send account verification code.'
      );
    }
  };

  const verifyAccount = async (email: string, code: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.functions.invoke(
      'verify-account-code',
      {
        body: {
          email: normalizedEmail,
          code,
        },
      }
    );

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(error, 'Unable to verify account.')
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.message || 'Unable to verify account.'
      );
    }

    await login(normalizedEmail, password);
  };

  const logout = async () => {
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.functions.invoke(
      'send-password-reset-code',
      {
        body: {
          email: normalizedEmail,
        },
      }
    );

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(
          error,
          'Unable to send password reset code.'
        )
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.message || 'Unable to send password reset code.'
      );
    }
  };

  const verifyResetCode = async (email: string, code: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.functions.invoke(
      'verify-reset-code',
      {
        body: {
          email: normalizedEmail,
          code,
        },
      }
    );

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(error, 'Unable to verify reset code.')
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.message || 'Unable to verify reset code.'
      );
    }
  };

  const updatePassword = async (email: string, code: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.functions.invoke(
      'update-password',
      {
        body: {
          email: normalizedEmail,
          code,
          password,
        },
      }
    );

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(error, 'Unable to update password.')
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.message || 'Unable to update password.'
      );
    }
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
      verifyAccount,
      resendAccountVerificationCode,
      logout,
      resetPassword,
      verifyResetCode,
      updatePassword,
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
