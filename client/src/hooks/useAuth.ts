export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        if (!response.ok) {
          if (response.status === 401) {
            return null; // Not authenticated
          }
          throw new Error('Failed to fetch user');
        }
        return response.json();
      } catch (error) {
        console.error('Auth check failed:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        credentials: 'include'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetch,
  };
};