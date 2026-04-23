'use client';

import { useState, useEffect } from 'react';
import type { ChatMessage, ChatResponse, FormData } from '@/lib/api';
import { sendChatMessage, getTemplates } from '@/lib/api';

interface ChatInterfaceProps {
  onComplete: (formData: FormData) => void;
  documentType: string;
}

export default function ChatInterface({ onComplete, documentType }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [documentName, setDocumentName] = useState('document');

  useEffect(() => {
    const fetchDocumentName = async () => {
      try {
        const templatesData = await getTemplates();
        const template = templatesData.templates.find(t => t.filename === documentType);
        if (template) {
          setDocumentName(template.name);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };
    fetchDocumentName();
  }, [documentType]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage(updatedMessages, documentType);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };

      setMessages([...updatedMessages, assistantMessage]);

      if (response.is_complete && response.form_data) {
        setIsComplete(true);
        onComplete(response.form_data);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setIsComplete(false);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-[#64748B]/20 rounded-lg bg-white/50">
        <div className="text-center max-w-md px-6">
          <h3 className="text-xl font-semibold text-[#0A1929] mb-3">
            AI-Powered Document Assistant
          </h3>
          <p className="text-[#64748B] mb-6">
            Let me guide you through creating your {documentName}. I'll ask a few questions to gather the necessary information.
          </p>
          <button
            onClick={() => {
              const welcomeMessage: ChatMessage = {
                role: 'assistant',
                content: `Hello! I'm here to help you create a ${documentName}. Let's start by understanding the purpose of this agreement. What is the business purpose or context for this ${documentName}?`,
              };
              setMessages([welcomeMessage]);
            }}
            className="px-6 py-3 bg-[#1E4976] text-white font-medium rounded-lg hover:bg-[#0A1929] transition-colors"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border border-[#64748B]/20 rounded-lg bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-[#1E4976] text-white'
                  : 'bg-[#F1F5F9] text-[#0A1929]'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-lg bg-[#F1F5F9] text-[#64748B]">
              <p>Typing...</p>
            </div>
          </div>
        )}
      </div>

      {isComplete ? (
        <div className="border-t border-[#64748B]/20 p-4 bg-[#10B981]/10">
          <div className="flex items-center justify-between">
            <p className="text-[#10B981] font-medium">
              Information gathered successfully! Review the form below.
            </p>
            <button
              onClick={startNewChat}
              className="px-4 py-2 text-sm text-[#1E4976] hover:text-[#0A1929] font-medium"
            >
              Start Over
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-[#64748B]/20 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-[#64748B]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4976] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-[#1E4976] text-white font-medium rounded-lg hover:bg-[#0A1929] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
