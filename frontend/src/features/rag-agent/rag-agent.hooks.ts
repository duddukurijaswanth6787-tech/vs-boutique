import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ragAgentService } from './rag-agent.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  TestAgentDto,
  CreateKnowledgeSourceDto,
  UpdateKnowledgeSourceDto,
  UploadUrlRequestDto,
  ConfirmUploadDto,
} from './rag-agent.types';

export const ragAgentKeys = {
  all: ['rag-agent'] as const,
  agents: () => [...ragAgentKeys.all, 'agents'] as const,
  agentList: (page: number, limit: number) => [...ragAgentKeys.agents(), 'list', { page, limit }] as const,
  agentDetails: () => [...ragAgentKeys.agents(), 'detail'] as const,
  agentDetail: (id: string) => [...ragAgentKeys.agentDetails(), id] as const,

  knowledge: () => [...ragAgentKeys.all, 'knowledge'] as const,
  knowledgeList: (page: number, limit: number) => [...ragAgentKeys.knowledge(), 'list', { page, limit }] as const,
  knowledgeDetails: () => [...ragAgentKeys.knowledge(), 'detail'] as const,
  knowledgeDetail: (id: string) => [...ragAgentKeys.knowledgeDetails(), id] as const,
  chunks: (id: string, page: number, limit: number) => [...ragAgentKeys.knowledgeDetail(id), 'chunks', { page, limit }] as const,

  conversations: () => [...ragAgentKeys.all, 'conversations'] as const,
  conversationList: (page: number, limit: number) => [...ragAgentKeys.conversations(), 'list', { page, limit }] as const,
  conversationDetail: (id: string, page: number, limit: number) => [...ragAgentKeys.conversations(), 'detail', id, { page, limit }] as const,

  analytics: () => [...ragAgentKeys.all, 'analytics'] as const,
  summary: () => [...ragAgentKeys.analytics(), 'summary'] as const,
  agentPerformance: (agentId: string) => [...ragAgentKeys.analytics(), 'agent', agentId] as const,
  intents: () => [...ragAgentKeys.analytics(), 'intents'] as const,

  health: () => [...ragAgentKeys.all, 'health'] as const,
};

// ─── Agents Hooks ──────────────────────────────────────────
export function useRagAgents(page = 1, limit = 10) {
  return useQuery({
    queryKey: ragAgentKeys.agentList(page, limit),
    queryFn: () => ragAgentService.getAgents(page, limit),
  });
}

export function useRagAgent(id: string, enabled = true) {
  return useQuery({
    queryKey: ragAgentKeys.agentDetail(id),
    queryFn: () => ragAgentService.getAgentById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateRagAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAgentDto) => ragAgentService.createAgent(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agents() });
    },
  });
}

export function useUpdateRagAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAgentDto }) =>
      ragAgentService.updateAgent(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agents() });
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agentDetail(data.id) });
    },
  });
}

export function useDeleteRagAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ragAgentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agents() });
    },
  });
}

export function useRestoreRagAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ragAgentService.restoreAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agents() });
    },
  });
}

export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ACTIVATE' | 'DEACTIVATE' }) =>
      ragAgentService.updateAgentStatus(id, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agents() });
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agentDetail(data.id) });
    },
  });
}

export function useAssignKnowledgeSources() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, knowledgeSourceIds }: { id: string; knowledgeSourceIds: string[] }) =>
      ragAgentService.assignKnowledgeSources(id, knowledgeSourceIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agentDetail(variables.id) });
    },
  });
}

export function useConfigureTools() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tools }: { id: string; tools: string[] }) =>
      ragAgentService.configureTools(id, tools),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.agentDetail(variables.id) });
    },
  });
}

export function useTestAgent() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TestAgentDto }) =>
      ragAgentService.testAgent(id, dto),
  });
}

// ─── Knowledge Sources Hooks ─────────────────────────────────
export function useKnowledgeSources(page = 1, limit = 10) {
  return useQuery({
    queryKey: ragAgentKeys.knowledgeList(page, limit),
    queryFn: () => ragAgentService.getKnowledgeSources(page, limit),
  });
}

export function useKnowledgeSource(id: string, enabled = true) {
  return useQuery({
    queryKey: ragAgentKeys.knowledgeDetail(id),
    queryFn: () => ragAgentService.getKnowledgeSourceById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateKnowledgeSourceDto) => ragAgentService.createKnowledgeSource(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledge() });
    },
  });
}

export function useUpdateKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateKnowledgeSourceDto }) =>
      ragAgentService.updateKnowledgeSource(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledge() });
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledgeDetail(data.id) });
    },
  });
}

export function useDeleteKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ragAgentService.deleteKnowledgeSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledge() });
    },
  });
}

export function useRestoreKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ragAgentService.restoreKnowledgeSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledge() });
    },
  });
}

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: (dto: UploadUrlRequestDto) => ragAgentService.getUploadUrl(dto),
  });
}

export function useConfirmUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ConfirmUploadDto }) =>
      ragAgentService.confirmUpload(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledge() });
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledgeDetail(data.id) });
    },
  });
}

export function useReindex() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ragAgentService.reindex(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledge() });
      queryClient.invalidateQueries({ queryKey: ragAgentKeys.knowledgeDetail(id) });
    },
  });
}

export function useIndexingStatus(id: string, refetchInterval: number | false = false) {
  return useQuery({
    queryKey: [...ragAgentKeys.knowledgeDetail(id), 'indexing-status'] as const,
    queryFn: () => ragAgentService.getIndexingStatus(id),
    enabled: !!id,
    refetchInterval,
  });
}

export function useChunks(id: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ragAgentKeys.chunks(id, page, limit),
    queryFn: () => ragAgentService.getChunks(id, page, limit),
    enabled: !!id,
  });
}

// ─── Conversations Hooks ─────────────────────────────────────
export function useConversations(page = 1, limit = 10) {
  return useQuery({
    queryKey: ragAgentKeys.conversationList(page, limit),
    queryFn: () => ragAgentService.getConversations(page, limit),
  });
}

export function useConversationDetails(id: string, page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: ragAgentKeys.conversationDetail(id, page, limit),
    queryFn: () => ragAgentService.getConversationDetails(id, page, limit),
    enabled: !!id && enabled,
  });
}

// ─── Analytics Hooks ───────────────────────────────────────
export function useRagSummaryAnalytics() {
  return useQuery({
    queryKey: ragAgentKeys.summary(),
    queryFn: () => ragAgentService.getSummaryAnalytics(),
  });
}

export function useAgentAnalytics(agentId: string) {
  return useQuery({
    queryKey: ragAgentKeys.agentPerformance(agentId),
    queryFn: () => ragAgentService.getAgentAnalytics(agentId),
    enabled: !!agentId,
  });
}

export function useIntents() {
  return useQuery({
    queryKey: ragAgentKeys.intents(),
    queryFn: () => ragAgentService.getIntents(),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ragAgentKeys.health(),
    queryFn: () => ragAgentService.getHealth(),
  });
}
