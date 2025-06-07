
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'printer';
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  taxNumber?: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.status === 401) {
          return null; // Not authenticated - this is normal
        }
        
        if (!response.ok) {
          return null;
        }
        
        const userData = await response.json();
        return userData;
      } catch (error) {
        return null;
      }
    },
    retry: false, // Don't retry auth requests
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Giriş başarısız' }));
        throw new Error(errorData.message || 'Giriş başarısız');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Redirect based on user role or provided URL
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 100);
      } else if (data.user?.role) {
        const redirectUrls = {
          customer: '/customer-dashboard',
          printer: '/printer-dashboard',
          admin: '/admin-dashboard'
        };
        
        const redirectUrl = redirectUrls[data.user.role as keyof typeof redirectUrls] || '/customer-dashboard';
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
    }
  });

  const register = useMutation({
    mutationFn: async (registerData: RegisterData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Registration failed`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Redirect based on registration success
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Force redirect even on error
      queryClient.clear();
      window.location.href = '/';
    }
  });

  const isAuthenticated = !!user && !error;

  // Session check function
  const checkSession = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refetch,
    checkSession,
    error,
  };
};
