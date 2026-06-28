import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../services/api';
import { useCustomerAuth } from './CustomerAuthContext';

const AddressContext = createContext();

export function AddressProvider({ children }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCustomerAuth();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: isAuthenticated,
  });

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const addMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: invalidate,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateAddress(id, data),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: invalidate,
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: invalidate,
  });

  const addAddress = async (data) => {
    const result = await addMutation.mutateAsync(data);
    return result;
  };

  const editAddress = async (id, data) => {
    const result = await editMutation.mutateAsync({ id, data });
    return result;
  };

  const removeAddress = async (id) => {
    await removeMutation.mutateAsync(id);
  };

  const makeDefault = async (id) => {
    await defaultMutation.mutateAsync(id);
  };

  const refreshAddresses = () => invalidate();

  return (
    <AddressContext.Provider value={{
      addresses,
      defaultAddress,
      loading: isLoading,
      saving: addMutation.isPending || editMutation.isPending,
      refreshAddresses,
      addAddress,
      editAddress,
      removeAddress,
      makeDefault,
    }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used within AddressProvider');
  return ctx;
}
