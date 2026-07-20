import { apiClient, setClientTokens, getClientRefreshToken } from '@/lib/api/client';

// Let's create a temporary backend type mapping if backend.types does not exist yet.
// Wait, we can declare our own types directly or import from types/auth.types.ts and types/api.types.ts!
// Let's import from '@/types/auth.types' and `@/types/api.types` for clarity and clean separation.
import { AuthTokens, UserProfile } from '@/types/auth.types';
import { StandardResponse } from '@/types/api.types';

export const authService = {
  login: async (credentials: Record<string, unknown>): Promise<AuthTokens> => {
    const response = await apiClient.post<StandardResponse<AuthTokens>>('/auth/login', credentials);
    const tokens = response.data.data;
    if (!tokens) throw new Error(response.data.message || 'Login failed');
    setClientTokens(tokens);
    return tokens;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getClientRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Silently catch so that frontend logout completes regardless
      }
    }
    setClientTokens(null);
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<StandardResponse<UserProfile>>('/auth/me');
    const profile = response.data.data;
    if (!profile) throw new Error(response.data.message || 'Failed to fetch user profile');
    return profile;
  },
};
