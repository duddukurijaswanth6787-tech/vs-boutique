import { createContext, useCallback, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyReturns, createReturnRequest, getMyExchanges, createExchangeRequest } from '../services/api';
import { useCustomerAuth } from './CustomerAuthContext';

export const ReturnsContext = createContext();

export function ReturnsProvider({ children }) {
  const queryClient = useQueryClient();

  const useReturnsData = () => {
    const { isAuthenticated } = useCustomerAuth();

    const { data: returns = [], isLoading: returnsLoading, error: returnsError } = useQuery({
      queryKey: ['my-returns'],
      queryFn: getMyReturns,
      enabled: isAuthenticated,
    });

    const { data: exchanges = [], isLoading: exchangesLoading, error: exchangesError } = useQuery({
      queryKey: ['my-exchanges'],
      queryFn: getMyExchanges,
      enabled: isAuthenticated,
    });

    const returnMutation = useMutation({
      mutationFn: createReturnRequest,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-returns'] });
      },
    });

    const exchangeMutation = useMutation({
      mutationFn: createExchangeRequest,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-exchanges'] });
      },
    });

    const refresh = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['my-returns'] });
      queryClient.invalidateQueries({ queryKey: ['my-exchanges'] });
    }, [queryClient]);

    return {
      returns,
      exchanges,
      loading: returnsLoading || exchangesLoading,
      error: returnsError || exchangesError,
      refresh,
      createReturn: returnMutation.mutateAsync,
      createExchange: exchangeMutation.mutateAsync,
      isCreatingReturn: returnMutation.isPending,
      isCreatingExchange: exchangeMutation.isPending,
      returnError: returnMutation.error,
      exchangeError: exchangeMutation.error,
    };
  };

  return (
    <ReturnsContext.Provider value={{ useReturnsData }}>
      {children}
    </ReturnsContext.Provider>
  );
}

export function useReturns() {
  const ctx = useContext(ReturnsContext);
  if (!ctx) throw new Error('useReturns must be used within ReturnsProvider');
  return ctx;
}
