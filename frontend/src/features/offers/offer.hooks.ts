import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerService } from './offer.service';
import { OfferQueryDto, CreateOfferDto, UpdateOfferDto } from './offer.types';

export const offerKeys = {
  all: ['offers'] as const,
  lists: () => [...offerKeys.all, 'list'] as const,
  list: (query: OfferQueryDto) => [...offerKeys.lists(), query] as const,
  active: () => [...offerKeys.all, 'active'] as const,
  details: () => [...offerKeys.all, 'detail'] as const,
  detail: (id: string) => [...offerKeys.details(), id] as const,
};

export function useOffers(query: OfferQueryDto = {}) {
  return useQuery({
    queryKey: offerKeys.list(query),
    queryFn: () => offerService.findAll(query),
  });
}

export function useActiveOffers() {
  return useQuery({
    queryKey: offerKeys.active(),
    queryFn: () => offerService.getActiveOffers(),
  });
}

export function useOffer(id: string, enabled = true) {
  return useQuery({
    queryKey: offerKeys.detail(id),
    queryFn: () => offerService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOfferDto) => offerService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.active() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOfferDto }) =>
      offerService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerKeys.active() });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}
