import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  authCreateSession,
  authCreateAccount,
  authGetSession,
} from '../lib/medusa';

interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authGetSession()
      .then(c => setCustomer(c as unknown as Customer))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const c = await authCreateSession(email, password);
    setCustomer(c as unknown as Customer);
  }, []);

  const register = useCallback(async (data: { first_name: string; last_name: string; email: string; password: string }) => {
    const c = await authCreateAccount(data);
    setCustomer(c as unknown as Customer);
  }, []);

  const logout = useCallback(async () => {
    // Just clear local state — medusa-js doesn't have a logout method
    setCustomer(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ customer, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
