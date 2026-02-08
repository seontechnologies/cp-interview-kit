import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organization?: Organization;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  checkAuth: () => Promise<void>;
}

// Initialize auth state from localStorage
const getInitialAuthState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        user,
        organization: user.organization || null,
        isAuthenticated: true,
      };
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  return {
    user: null,
    organization: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initialState = getInitialAuthState();

  // Helper: Clear all authentication data
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  // Helper: Verify token and get user data
  const verifyTokenAndGetUser = async (): Promise<User | null> => {
    const response = await api.get('/auth/verify');
    const data = response.data;

    if (!data.valid) {
      return null;
    }

    // Try to get user from verify response first
    let user = data.user;

    // Fallback: fetch user from /auth/me if not included in verify
    if (!user) {
      try {
        const userResponse = await api.get('/auth/me');
        user = userResponse.data;
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        return null;
      }
    }

    return user;
  };

  const isValidUserData = (user: any): boolean => {
    return !!(user && user.id && user.role);
  };

  const setAuthenticatedUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({
      user,
      organization: user.organization || null,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const attemptTokenRefresh = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh token...');
      await get().refreshToken();

      // Verify again!!
      const verifyResponse = await api.get('/auth/verify');
      const data = verifyResponse.data;

      if (data.valid && data.user) {
        setAuthenticatedUser(data.user);
        return true;
      }

      return false;
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      return false;
    }
  };

  return {
    ...initialState,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });

      try {
        const response = await api.post('/auth/login', { email, password });
        const data = response.data;

        if (!data) {
          throw new Error(response.statusText || 'Login failed');
        }
        localStorage.setItem('token', data.token);
        setAuthenticatedUser(data.user);
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
      clearAuthData();
    },

    refreshToken: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token available');
        }

        const response = await api.post('/auth/refresh');
        const newToken = response.data.token;

        localStorage.setItem('token', newToken);

        set({
          user: response.data.user,
          isAuthenticated: true,
        });
      } catch (error: any) {
        console.error('Token refresh failed:', error);
        get().logout();
        throw error;
      }
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
      // Step 1: Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isAuthenticated: false, user: null, organization: null });
        return;
      }

      set({ isLoading: true });

      try {
        // Step 2: Verify token and get user data
        const user = await verifyTokenAndGetUser();

        // Step 3: Handle invalid token
        if (!user) {
          clearAuthData();
          return;
        }

        // Step 4: Validate user data integrity
        if (!isValidUserData(user)) {
          console.error('Invalid user data:', user);
          clearAuthData();
          return;
        }

        // Step 5: Set authenticated state
        setAuthenticatedUser(user);
      } catch (error: any) {
        console.error('Auth check failed:', error);

        // Step 6: Handle 401 errors with token refresh
        if (error.response?.status === 401) {
          const refreshSuccessful = await attemptTokenRefresh();
          if (refreshSuccessful) {
            return; // Token refreshed and user authenticated
          }
        }

        // Step 7: Clear authentication on any unrecoverable error
        clearAuthData();
      }
    },
  };
});
