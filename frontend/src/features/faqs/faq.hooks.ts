import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqService } from './faq.service';
import { FaqQueryDto, CreateFaqDto, UpdateFaqDto } from './faq.types';

export const faqKeys = {
  all: ['faqs'] as const,
  lists: () => [...faqKeys.all, 'list'] as const,
  list: (query: FaqQueryDto) => [...faqKeys.lists(), query] as const,
  details: () => [...faqKeys.all, 'detail'] as const,
  detail: (id: string) => [...faqKeys.details(), id] as const,
};

export function useFaqs(query: FaqQueryDto = {}) {
  return useQuery({
    queryKey: faqKeys.list(query),
    queryFn: () => faqService.findAll(query),
  });
}

export function useFaq(id: string, enabled = true) {
  return useQuery({
    queryKey: faqKeys.detail(id),
    queryFn: () => faqService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFaqDto) => faqService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqKeys.lists() });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFaqDto }) =>
      faqService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: faqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: faqKeys.detail(data.id) });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => faqService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: faqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: faqKeys.detail(id) });
    },
  });
}

export function useMarkFaqHelpful() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => faqService.markHelpful(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: faqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: faqKeys.detail(data.id) });
    },
  });
}
