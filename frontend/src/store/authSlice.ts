import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      set({
        user: data.user,
        organization: data.user.organization,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    set({
      user: null,
      organization: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  setOrganization: (organization) => {
    set({ organization });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.valid) {
        // Use fresh data from server, not stale localStorage
        const user = data.user;

        // Update localStorage with fresh data
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token invalid, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      set({ isLoading: false });
    }
  },
}));
