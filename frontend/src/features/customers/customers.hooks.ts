import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from './customers.service';
import { UserQueryDto, WalletTransactionDto, CustomerProfileDetails } from './customers.types';

export function useCustomers(query: UserQueryDto) {
  return useQuery({
    queryKey: ['customers', query],
    queryFn: () => customersService.getCustomers(query),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersService.getCustomerById(id),
    enabled: !!id,
  });
}

export function useCustomerProfile(userId: string) {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: () => customersService.getCustomerProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: Partial<CustomerProfileDetails> }) =>
      customersService.updateCustomerProfile(userId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile', variables.userId] });
    },
  });
}

export function useCustomerAddresses(customerId: string) {
  return useQuery({
    queryKey: ['customer-addresses', customerId],
    queryFn: () => customersService.getCustomerAddresses(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerWishlist(customerId: string) {
  return useQuery({
    queryKey: ['customer-wishlist', customerId],
    queryFn: () => customersService.getCustomerWishlist(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerCart(customerId: string) {
  return useQuery({
    queryKey: ['customer-cart', customerId],
    queryFn: () => customersService.getCustomerCart(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerWallet(customerId: string) {
  return useQuery({
    queryKey: ['customer-wallet', customerId],
    queryFn: () => customersService.getCustomerWallet(customerId),
    enabled: !!customerId,
  });
}

export function useCustomerWalletTransactions(customerId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['customer-wallet-transactions', customerId, page, limit],
    queryFn: () => customersService.getCustomerWalletTransactions(customerId, page, limit),
    enabled: !!customerId,
  });
}

export function useCreditCustomerWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, dto }: { customerId: string; dto: WalletTransactionDto }) =>
      customersService.creditCustomerWallet(customerId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-wallet', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-wallet-transactions', variables.customerId] });
    },
  });
}

export function useDebitCustomerWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, dto }: { customerId: string; dto: WalletTransactionDto }) =>
      customersService.debitCustomerWallet(customerId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-wallet', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-wallet-transactions', variables.customerId] });
    },
  });
}

export function useActivateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.activateCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.deactivateCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useSuspendCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.suspendCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUnlockCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.unlockCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
