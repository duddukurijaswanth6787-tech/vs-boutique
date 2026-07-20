import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from './settings.service';
import { SettingQueryDto, CreateSettingDto, UpdateSettingDto } from './settings.types';

export function useSettings(query: SettingQueryDto) {
  return useQuery({
    queryKey: ['settings', query],
    queryFn: () => settingsService.getSettings(query),
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: () => settingsService.getSettingByKey(key),
    enabled: !!key,
  });
}

export function useCreateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSettingDto) => settingsService.createSetting(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSettingDto }) =>
      settingsService.updateSetting(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
