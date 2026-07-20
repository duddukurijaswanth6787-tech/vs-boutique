import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';
import { AuditService } from '@domains/audit/audit.service';
import type {
  BusinessTool as BT,
  ToolContext,
} from './business-tool.interface';

export const BUSINESS_TOOLS = 'BUSINESS_TOOLS';

// ponytail: Registry is the single source of truth for available tools.
// Tools self-register via DI array; no orchestrator edits when adding a tool.
@Injectable()
export class ToolRegistryService {
  private readonly tools = new Map<string, BT>();
  private readonly execCounter: Counter<string>;
  private readonly execLatency: Histogram<string>;

  constructor(
    @Inject(BUSINESS_TOOLS) tools: BT[],
    private readonly metrics: MetricsService,
    private readonly audit: AuditService,
  ) {
    for (const t of tools) this.tools.set(t.name, t);
    this.execCounter = new Counter({
      name: 'vasanthi_rag_tool_executions_total',
      help: 'Total business tool executions',
      labelNames: ['tool', 'status'],
      registers: [this.metrics.registry],
    });
    this.execLatency = new Histogram({
      name: 'vasanthi_rag_tool_execution_seconds',
      help: 'Business tool execution time',
      labelNames: ['tool'],
      registers: [this.metrics.registry],
    });
  }

  list(): Array<{
    name: string;
    description: string;
    schema: Record<string, unknown>;
  }> {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      schema: t.schema(),
    }));
  }

  get(name: string): BT {
    const t = this.tools.get(name);
    if (!t) throw new NotFoundException(`Tool not found: ${name}`);
    return t;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(
    name: string,
    input: unknown,
    ctx: ToolContext,
    actorId?: string,
  ): Promise<unknown> {
    const tool = this.get(name);
    try {
      tool.validate(input);
    } catch (e) {
      this.execCounter.inc({ tool: name, status: 'invalid' });
      throw e instanceof BadRequestException
        ? e
        : new BadRequestException((e as Error).message);
    }
    const start = Date.now();
    try {
      const result = await tool.execute(input, ctx);
      this.execCounter.inc({ tool: name, status: 'success' });
      this.execLatency.observe((Date.now() - start) / 1000);
      this.audit.log({
        action: 'tool.execute',
        module: 'rag',
        resource: 'Tool',
        resourceId: name,
        userId: actorId,
      });
      return result;
    } catch (e) {
      this.execCounter.inc({ tool: name, status: 'error' });
      this.execLatency.observe((Date.now() - start) / 1000);
      throw e;
    }
  }

  health(): { total: number; tools: string[]; status: string } {
    const tools = [...this.tools.keys()];
    return {
      total: tools.length,
      tools,
      status: tools.length > 0 ? 'healthy' : 'degraded',
    };
  }
}
