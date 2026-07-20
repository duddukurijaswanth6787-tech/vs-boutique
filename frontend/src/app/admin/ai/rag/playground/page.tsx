'use client';

import React, { useState } from 'react';
import {
  useRagAgents,
  useTestAgent,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  Bot,
  User,
  Send,
  Clock,
  ThumbsUp,
  ShieldAlert,
  Terminal,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

interface Message {
  id: string;
  senderType: 'USER' | 'ASSISTANT';
  content: string;
  latencyMs?: number;
  relevanceScore?: number;
  citations?: Array<{
    id: string;
    sourceTitle: string;
    excerpt: string;
    relevanceScore?: number;
  }>;
  toolCalls?: Array<{
    id: string;
    toolName: string;
    status: string;
    input: unknown;
    output: unknown;
  }>;
}

interface ToolCallInspector {
  id: string;
  toolName: string;
  status: string;
  input: unknown;
  output: unknown;
}

export default function RagPlaygroundPage() {
  const { data: agentsData, isLoading: agentsLoading } = useRagAgents(1, 100);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [selectedCitation, setSelectedCitation] = useState<{ sourceTitle: string; excerpt: string } | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCallInspector | null>(null);

  const testAgentMutation = useTestAgent();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      toast.error('Please select a RAG agent first.');
      return;
    }
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      senderType: 'USER',
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Send RAG test request to NestJS
      const response = await testAgentMutation.mutateAsync({
        id: selectedAgentId,
        dto: {
          message: userMessage.content,
          conversationId,
        },
      });

      const data = (response.data ?? response) as {
        conversationId?: string;
        response?: string;
        content?: string;
        message?: string;
        latencyMs?: number;
        relevanceScore?: number;
        citations?: unknown;
        toolCalls?: unknown;
        [key: string]: unknown;
      };
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        senderType: 'ASSISTANT',
        content: data.response || 'No response returned.',
        latencyMs: data.latencyMs,
        relevanceScore: data.relevanceScore,
        citations: data.citations as Message['citations'],
        toolCalls: data.toolCalls as Message['toolCalls'],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message
        : getApiErrorMessage(err) || 'RAG generation failed.';
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        senderType: 'ASSISTANT',
        content: `Error: ${errMsg}`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  if (agentsLoading) {
    return <SectionLoader message="Loading RAG agents playground..." />;
  }

  const agents = agentsData?.data || [];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-sans">RAG Playground</h1>
          <p className="text-sm text-neutral-500 mt-1">Interact with RAG agents to audit response relevance and tool execution paths.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(e.target.value);
              handleClear();
            }}
            className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white min-w-[200px]"
          >
            <option value="">Select Agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Clear Conversation
          </button>
        </div>
      </div>

      {/* Chat pane grid layout */}
      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        {/* Chat message thread */}
        <div className="col-span-3 rounded-xl border border-neutral-200 bg-white flex flex-col overflow-hidden shadow-sm h-full">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const isUser = msg.senderType === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-4 space-y-2 max-w-2xl
                      ${
                        isUser
                          ? 'border-neutral-200 bg-white ml-auto'
                          : 'border-purple-100 bg-purple-50/10 mr-auto'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 border-b border-neutral-100/50 pb-1.5">
                      <div className={`rounded p-1
                        ${isUser ? 'bg-neutral-100 text-neutral-600' : 'bg-purple-100 text-purple-600'}
                      `}>
                        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-[10px] font-bold text-neutral-900">
                        {isUser ? 'YOU (ADMIN TESTER)' : 'AGENT ANSWER'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {!isUser && (msg.latencyMs || msg.relevanceScore) && (
                      <div className="flex items-center gap-4 text-[9px] text-neutral-400 font-bold uppercase pt-1">
                        {msg.latencyMs && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Latency: {(msg.latencyMs / 1000).toFixed(2)}s
                          </span>
                        )}
                        {msg.relevanceScore && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> Relevance: {(msg.relevanceScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Citations list */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                          Citations grounded:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite) => (
                            <button
                              key={cite.id}
                              onClick={() => setSelectedCitation({ sourceTitle: cite.sourceTitle, excerpt: cite.excerpt })}
                              className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              Grounded: {cite.sourceTitle} ({(cite.relevanceScore ? cite.relevanceScore * 100 : 90).toFixed(0)}%)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tool dispatches */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="pt-2 border-t border-neutral-100/50 mt-2">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                          Tool Call execution:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.toolCalls.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => setSelectedToolCall(tool)}
                              className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                            >
                              Tool: {tool.toolName} ({tool.status})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Bot className="h-10 w-10 text-neutral-300 mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-neutral-500">Playground active</p>
                <p className="text-[11px] text-neutral-400 mt-1 max-w-sm">
                  Select an agent and write a message below to test retrieval relevance.
                </p>
              </div>
            )}

            {isSending && (
              <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg max-w-[200px] border border-neutral-100 animate-pulse">
                <Activity className="h-4 w-4 animate-spin text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-500">Agent thinking...</span>
              </div>
            )}
          </div>

          {/* Form message input */}
          <form onSubmit={handleSend} className="border-t border-neutral-200 p-4 flex gap-2 bg-neutral-50">
            <input
              type="text"
              disabled={isSending || !selectedAgentId}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs focus:border-neutral-900 focus:outline-none disabled:opacity-50"
              placeholder={selectedAgentId ? 'Ask agent a question...' : 'Please select an agent to start...'}
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim() || !selectedAgentId}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-white hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Sidebar: System Prompt info */}
        <div className="col-span-1 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4 h-full overflow-y-auto">
          <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2 flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-neutral-400" /> Debug console
          </h3>

          <div className="space-y-4 text-[11px] leading-relaxed text-neutral-600">
            <div>
              <span className="font-bold text-neutral-400 uppercase tracking-wider block">Session Reference</span>
              <p className="font-mono mt-1 bg-neutral-50 p-2 rounded border border-neutral-100 truncate">
                {conversationId || 'No active session'}
              </p>
            </div>

            <div>
              <span className="font-bold text-neutral-400 uppercase tracking-wider block">Instructions Scope</span>
              <p className="mt-1">
                Admin Playground invokes the real NestJS engine. Tool authorization matches admin RBAC profile privileges.
              </p>
            </div>

            <div className="border-t border-neutral-50 pt-3">
              <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-2">Example Prompts</span>
              <div className="space-y-1.5">
                {[
                  'What is your return policy?',
                  'Show dresses under ₹2000',
                  'Is product SKU TEST-SKU-100 in stock?',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={!selectedAgentId || isSending}
                    onClick={() => setInputMessage(prompt)}
                    className="w-full text-left p-2 rounded border border-neutral-100 hover:bg-neutral-50 font-medium text-neutral-700 leading-tight transition-colors disabled:opacity-50"
                  >
                    &quot;{prompt}&quot;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSPECT CITATION DIALOG */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Grounding Citation Excerpt</h3>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-xs text-neutral-400 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                <span>TITLE: {selectedCitation.sourceTitle}</span>
                <span>MATCH: VECTOR RETRIEVAL</span>
              </div>
              <p className="text-xs text-neutral-700 whitespace-pre-wrap font-mono bg-neutral-50 p-4 rounded-lg border border-neutral-100 leading-relaxed">
                 &quot;{selectedCitation.excerpt}&quot;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT TOOL CALL DIALOG */}
      {selectedToolCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Tool Call Inspector</h3>
              <button
                onClick={() => setSelectedToolCall(null)}
                className="text-xs text-neutral-400 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Tool Name</span>
                  <p className="font-mono font-bold text-neutral-800 mt-1">{selectedToolCall.toolName}</p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Status</span>
                  <p className={`font-bold mt-1 ${selectedToolCall.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedToolCall.status}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-400 uppercase">Input Payload</span>
                <pre className="p-3 bg-neutral-950 rounded-lg text-neutral-200 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedToolCall.input, null, 2)}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-400 uppercase">Execution Output</span>
                <pre className="p-3 bg-neutral-950 rounded-lg text-neutral-200 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedToolCall.output, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
