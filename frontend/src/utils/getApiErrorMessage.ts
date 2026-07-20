import { AxiosError } from 'axios';

// ponytail: single source of truth for extracting user-friendly error messages
// from any error shape the API layer can produce
export function getApiErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  // Axios error — most common
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;

    // Server sent a structured message
    if (data?.message) {
      if (Array.isArray(data.message)) return data.message.join(', ');
      return String(data.message);
    }
    if (data?.error) return String(data.error);

    // Network / timeout
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (error.code === 'ERR_NETWORK' || !error.response) return 'Could not reach the server. Check your connection.';

    // Status-based fallbacks
    if (status === 400) return 'Invalid request. Please check your input.';
    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 409) return 'This action conflicts with the current state.';
    if (status === 422) return 'Validation failed. Please check your input.';
    if (status === 429) return 'Too many requests. Please wait a moment.';
    if (status && status >= 500) return 'A server error occurred. Please try again later.';
  }

  // Standard Error with message
  if (error instanceof Error && error.message) {
    // Don't expose internal stack traces
    if (error.message === 'Network Error') return 'Could not reach the server. Check your connection.';
    return error.message;
  }

  // String error
  if (typeof error === 'string') return error;

  return 'An unexpected error occurred.';
}
