import { apiClient } from '@/lib/api/client';
import {
  UserProfileResponse,
  CustomerProfileDetails,
  CustomerAddressResponse,
  CustomerWishlistItem,
  CustomerCartResponse,
  CustomerWalletResponse,
  WalletTransactionResponse,
  WalletTransactionDto,
  UserQueryDto,
} from './customers.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const customersService = {
  async getCustomers(query: UserQueryDto): Promise<PaginatedResponse<UserProfileResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<UserProfileResponse>>>('/users', {
      params: { ...query, userType: 'CUSTOMER' },
    });
    return res.data.data!;
  },

  async getCustomerById(id: string): Promise<UserProfileResponse> {
    const res = await apiClient.get<ApiResponse<UserProfileResponse>>(`/users/${id}`);
    return res.data.data!;
  },

  async getCustomerProfile(userId: string): Promise<CustomerProfileDetails> {
    const res = await apiClient.get<ApiResponse<CustomerProfileDetails>>(`/customer-profile/admin/${userId}`);
    return res.data.data!;
  },

  async updateCustomerProfile(userId: string, dto: Partial<CustomerProfileDetails>): Promise<CustomerProfileDetails> {
    const res = await apiClient.patch<ApiResponse<CustomerProfileDetails>>(`/customer-profile/admin/${userId}`, dto);
    return res.data.data!;
  },

  async getCustomerAddresses(customerId: string): Promise<CustomerAddressResponse[]> {
    const res = await apiClient.get<ApiResponse<CustomerAddressResponse[]>>(`/customer-addresses/admin/customer/${customerId}`);
    return res.data.data!;
  },

  async getCustomerWishlist(customerId: string): Promise<PaginatedResponse<CustomerWishlistItem>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<CustomerWishlistItem>>>(`/wishlist/admin/customer/${customerId}/items`);
    return res.data.data!;
  },

  async getCustomerCart(customerId: string): Promise<CustomerCartResponse> {
    const res = await apiClient.get<ApiResponse<CustomerCartResponse>>(`/cart/admin/customer/${customerId}`);
    return res.data.data!;
  },

  async getCustomerWallet(customerId: string): Promise<CustomerWalletResponse> {
    const res = await apiClient.get<ApiResponse<CustomerWalletResponse>>(`/wallet/admin/customer/${customerId}`);
    return res.data.data!;
  },

  async getCustomerWalletTransactions(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<WalletTransactionResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<WalletTransactionResponse>>>(
      `/wallet/admin/customer/${customerId}/transactions`,
      { params: { page, limit } },
    );
    return res.data.data!;
  },

  async creditCustomerWallet(customerId: string, dto: WalletTransactionDto): Promise<unknown> {
    const res = await apiClient.post<ApiResponse<unknown>>(`/wallet/admin/customer/${customerId}/credit`, dto);
    return res.data.data!;
  },

  async debitCustomerWallet(customerId: string, dto: WalletTransactionDto): Promise<unknown> {
    const res = await apiClient.post<ApiResponse<unknown>>(`/wallet/admin/customer/${customerId}/debit`, dto);
    return res.data.data!;
  },

  async activateCustomer(id: string): Promise<UserProfileResponse> {
    const res = await apiClient.post<ApiResponse<UserProfileResponse>>(`/users/${id}/activate`);
    return res.data.data!;
  },

  async deactivateCustomer(id: string): Promise<UserProfileResponse> {
    const res = await apiClient.post<ApiResponse<UserProfileResponse>>(`/users/${id}/deactivate`);
    return res.data.data!;
  },

  async suspendCustomer(id: string): Promise<UserProfileResponse> {
    const res = await apiClient.post<ApiResponse<UserProfileResponse>>(`/users/${id}/suspend`);
    return res.data.data!;
  },

  async unlockCustomer(id: string): Promise<UserProfileResponse> {
    const res = await apiClient.post<ApiResponse<UserProfileResponse>>(`/users/${id}/unlock`);
    return res.data.data!;
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
