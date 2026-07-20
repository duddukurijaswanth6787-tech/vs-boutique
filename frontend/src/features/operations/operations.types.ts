export interface SubsystemHealth {
  status: 'up' | 'down' | 'degraded';
  [key: string]: unknown;
}

export interface SystemHealth {
  status: 'ok' | 'error' | 'shutting_down';
  info?: {
    database?: SubsystemHealth;
    migrations?: SubsystemHealth;
    redis?: SubsystemHealth;
    queue?: SubsystemHealth;
    storage?: SubsystemHealth;
    rag?: SubsystemHealth;
    app?: SubsystemHealth;
  };
  error?: unknown;
  details?: {
    database?: SubsystemHealth;
    migrations?: SubsystemHealth;
    redis?: SubsystemHealth;
    queue?: SubsystemHealth;
    storage?: SubsystemHealth;
    rag?: SubsystemHealth;
    app?: SubsystemHealth;
  };
}
