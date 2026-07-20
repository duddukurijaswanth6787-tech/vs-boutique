import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingService } from './shipping.service';
import { CreateShippingMethodDto, CreateShippingZoneDto, CalculateShippingDto } from './shipping.types';

export const shippingKeys = {
  all: ['shipping'] as const,
  methods: () => [...shippingKeys.all, 'methods'] as const,
  calculate: (code: string, query: CalculateShippingDto) => [...shippingKeys.all, 'calculate', code, query] as const,
  zones: (methodId?: string) => [...shippingKeys.all, 'zones', methodId] as const,
};

export function useShippingMethods() {
  return useQuery({
    queryKey: shippingKeys.methods(),
    queryFn: () => shippingService.getMethods(),
  });
}

export function useCalculateShipping(code: string, query: CalculateShippingDto, enabled = true) {
  return useQuery({
    queryKey: shippingKeys.calculate(code, query),
    queryFn: () => shippingService.calculateShipping(code, query),
    enabled: !!code && enabled,
  });
}

export function useShippingZones(methodId?: string) {
  return useQuery({
    queryKey: shippingKeys.zones(methodId),
    queryFn: () => shippingService.getZones(methodId),
  });
}

export function useCreateShippingMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateShippingMethodDto) => shippingService.createMethod(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.methods() });
    },
  });
}

export function useCreateShippingZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateShippingZoneDto) => shippingService.createZone(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.zones(data.methodId) });
      queryClient.invalidateQueries({ queryKey: shippingKeys.zones() });
    },
  });
}
