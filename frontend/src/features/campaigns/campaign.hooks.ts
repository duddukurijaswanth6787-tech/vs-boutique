import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from './campaign.service';
import { CampaignQueryDto, CreateCampaignDto, UpdateCampaignDto } from './campaign.types';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (query: CampaignQueryDto) => [...campaignKeys.lists(), query] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

export function useCampaigns(query: CampaignQueryDto = {}) {
  return useQuery({
    queryKey: campaignKeys.list(query),
    queryFn: () => campaignService.findAll(query),
  });
}

export function useCampaign(id: string, enabled = true) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCampaignDto) => campaignService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignDto }) =>
      campaignService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignService.send(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
    },
  });
}
