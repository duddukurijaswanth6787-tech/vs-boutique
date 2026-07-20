// ponytail: Strategy pattern — every business capability is a Tool. The registry
// holds them by name; the orchestrator/API dispatches by name. Adding a tool = new
// class + module provider, no changes elsewhere.
export interface ToolContext {
  userId?: string;
  roles?: string[];
}

export interface BusinessTool {
  name: string;
  description: string;
  /** JSON-schema-like description of the execute() input for LLM/tool calling. */
  schema(): Record<string, unknown>;
  /** Throws if input is invalid. Returns void on success. */
  validate(input: unknown): void;
  /** Runs the tool. Returns a JSON-serializable structured result. */
  execute(input: any, ctx: ToolContext): Promise<unknown>;
}
