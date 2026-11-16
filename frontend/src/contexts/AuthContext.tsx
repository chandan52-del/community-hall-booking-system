import React, { createContext, useContext, useEffect, useState } from 'react';
import type { DemoUser, UserRole } from '../types/booking';
import { authApi, TOKEN_KEY } from '../services/api';

export const DEMO_ACCOUNTS: Record<UserRole, DemoUser & { password: string }> = {
  customer: {
    name: 'Rohit Shenoy',
    email: 'rohit.shenoy@example.com',
    phone: '+91 98450 12345',
    role: 'customer',
    password: 'Customer@2026',
  },
  admin: {
    name: 'Hall Administrator',
    email: 'admin@sabhahalls.in',
    phone: '+91 80 4920 1800',
    role: 'admin',
    password: 'AdminPass@2026',
  },
};

interface AuthContextValue {
  user: DemoUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (role: UserRole, override?: Partial<DemoUser>) => Promise<DemoUser>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; name: string; phone: string; organization?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (patch: Partial<DemoUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = 'sabha-halls-demo-user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<DemoUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as DemoUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync token and user to localStorage
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // Attempt rehydration from backend if token exists
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data) {
            setUser({
              name: res.data.name,
              email: res.data.email,
              phone: res.data.phone,
              role: res.data.role.toLowerCase() as UserRole,
            });
          }
        } catch {
          // Token expired or server unreachable — fall back to stored user or clear
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login: AuthContextValue['login'] = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      if (res.data?.token) {
        setToken(res.data.token);
        const u: DemoUser = {
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          role: res.data.user.role.toLowerCase() as UserRole,
        };
        setUser(u);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const register: AuthContextValue['register'] = async (data) => {
    try {
      const res = await authApi.register(data);
      if (res.data?.token) {
        setToken(res.data.token);
        const u: DemoUser = {
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          role: res.data.user.role.toLowerCase() as UserRole,
        };
        setUser(u);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  const signIn: AuthContextValue['signIn'] = async (role, override) => {
    const account = DEMO_ACCOUNTS[role];
    const emailToUse = override?.email || account.email;
    const passwordToUse = account.password;

    // Try real API login first
    try {
      const res = await authApi.login(emailToUse, passwordToUse);
      if (res.data?.token) {
        setToken(res.data.token);
        const u: DemoUser = {
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          role,
        };
        setUser(u);
        return u;
      }
    } catch {
      // Backend not running or demo password override -> fallback cleanly
    }

    const { password: _pw, ...base } = account;
    void _pw;
    const next: DemoUser = { ...base, ...override, role };
    setUser(next);
    return next;
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const updateProfile = (patch: Partial<DemoUser>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
    authApi.updateMe({
      name: patch.name,
      phone: patch.phone,
    }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signIn,
        login,
        register,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export const useCustomer = (): DemoUser => {
  const { user } = useAuth();
  return (
    user ?? {
      name: 'Rohit Shenoy',
      email: 'rohit.shenoy@example.com',
      phone: '+91 98450 12345',
      role: 'customer',
    }
  );
};
