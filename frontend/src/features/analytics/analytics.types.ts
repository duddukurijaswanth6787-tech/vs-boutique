export interface RagAnalyticsSummary {
  conversationsCount: number;
  messagesCount: number;
  averageLatency: number;
  errorRate: number;
  toolExecutions: number;
  knowledgeRetrievals: number;
  citations: number;
  agentPerformance?: Array<{
    agentKey: string;
    name: string;
    requestCount: number;
    successRate: number;
    avgLatency: number;
    errorCount: number;
  }>;
  toolPerformance?: Array<{
    toolName: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    avgDuration: number;
  }>;
}

export interface SocialPostAnalytics {
  id: string;
  caption: string;
  contentType: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  viewCount: number;
  playCount: number;
  media?: Array<{ id: string; url: string; mediaType: string }>;
}

export interface SocialAnalyticsSummary {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalShares: number;
  totalViews: number;
  totalPlays: number;
  topPosts: SocialPostAnalytics[];
}

export interface RagIntentCount {
  intent: string;
  count: number;
}
