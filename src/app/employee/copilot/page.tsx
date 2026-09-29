'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  Sparkles,
  Send,
  ShieldAlert,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  isCompliant?: boolean;
  warning?: string;
  sources?: Array<{ title: string; category: string }>;
}

export default function EmployeeCopilotPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: 'Hello! I am your TWM Operational AI Copilot. I can search approved SOPs, explain onboarding workflows, draft professional customer follow-ups, and help you prepare daily reports.\n\nNote: I am strictly bounded by SEBI compliance and cannot provide stock tips, buy/sell calls, or guaranteed return statements.',
      isCompliant: true,
    },
  ]);

  async function handleSend(promptText?: string) {
    const textToSend = promptText || query;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });
      const data = await res.json();

      if (data.response) {
        const copilotMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: 'copilot',
          text: data.response.answer,
          isCompliant: data.response.isCompliant,
          warning: data.response.warning,
          sources: data.response.sources,
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'copilot',
          text: `Error processing query: ${e.message}`,
          isCompliant: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Employee Copilot</h1>
            <p className="text-xs text-slate-400">
              Operational SOP lookups, customer drafting &amp; compliance assistant
            </p>
          </div>
        </div>
      </div>

      <StatusBanner
        type="regulatory"
        title="Regulatory Boundary Guardrails Active"
        message="This assistant operates strictly on TWM approved internal knowledge. It does not provide stock recommendations, price targets, or loan approvals."
      />

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => handleSend('What is the approved SOP for SMC Demat onboarding?')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap"
        >
          📋 SOP: Demat Onboarding
        </button>
        <button
          onClick={() => handleSend('Draft a polite follow-up message to a client inquiring about SIP.')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap"
        >
          ✍️ Draft: SIP Follow-up
        </button>
        <button
          onClick={() => handleSend('What are the SEBI compliance boundaries for our representatives?')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap"
        >
          🛡️ SEBI Regulatory Guidelines
        </button>
        <button
          onClick={() => handleSend('Which stock should I tell the client to buy today?')}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/40 whitespace-nowrap"
          title="Test advisory query blocking"
        >
          ⚠️ Test Compliance Boundary
        </button>
      </div>

      {/* Chat Messages Log */}
      <Card className="p-4 sm:p-5 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 bg-[#111927]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.isCompliant === false
                  ? 'bg-rose-950/80 border border-rose-800 text-rose-200 rounded-bl-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.warning && (
                <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1.5 pb-1 border-b border-rose-800/80">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{msg.warning}</span>
                </div>
              )}

              {msg.text}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Approved Sources:</div>
                  {msg.sources.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-400" />
                      <span>{s.title} ({s.category})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
            <span>Consulting approved knowledge base...</span>
          </div>
        )}
      </Card>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Ask Copilot about SOPs, onboarding protocols, or message drafting..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
