'use client';

import { useState, useEffect } from 'react';
import { generateDocument, generatePDF, createSession, type FormData, type SessionResponse } from '@/lib/api';
import ChatInterface from './ChatInterface';
import ReactMarkdown from 'react-markdown';

type InputMode = 'form' | 'chat';

interface NDAFormProps {
  documentType: string;
  userId: string;
  initialSession?: SessionResponse | null;
}

export default function NDAForm({ documentType, userId, initialSession }: NDAFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>('form');
  const [formData, setFormData] = useState<FormData>({
    purpose: 'Exploring a potential business partnership',
    effective_date: new Date().toISOString().split('T')[0],
    mnda_term: '2 years',
    confidentiality_term: '5 years',
    governing_law: 'California',
    jurisdiction: 'San Francisco, California',
  });

  const [preview, setPreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSession) {
      setFormData(initialSession.form_data);
    }
  }, [initialSession]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDocument(documentType, formData, userId);
      setPreview(result.content);
    } catch (error) {
      console.error('Failed to generate document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createSession(documentType, formData, userId);
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDocument(documentType, formData, userId);
      const blob = new Blob([result.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePDF(documentType, formData, userId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatComplete = async (chatFormData: FormData) => {
    setFormData(chatFormData);
    setInputMode('form');
    setIsGenerating(true);
    try {
      const result = await generateDocument(documentType, chatFormData, userId);
      setPreview(result.content);
    } catch (error) {
      console.error('Failed to generate document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-2 border-b border-[var(--stroke)]">
        <button
          onClick={() => setInputMode('form')}
          className={`px-6 py-3 font-medium transition-colors ${
            inputMode === 'form'
              ? 'text-[var(--steel-blue)] border-b-2 border-[var(--steel-blue)]'
              : 'text-[var(--slate-gray)] hover:text-[var(--steel-blue)]'
          }`}
        >
          Manual Form
        </button>
        <button
          onClick={() => setInputMode('chat')}
          className={`px-6 py-3 font-medium transition-colors ${
            inputMode === 'chat'
              ? 'text-[var(--steel-blue)] border-b-2 border-[var(--steel-blue)]'
              : 'text-[var(--slate-gray)] hover:text-[var(--steel-blue)]'
          }`}
        >
          AI Chat Assistant
        </button>
      </div>

      {inputMode === 'chat' ? (
        <ChatInterface onComplete={handleChatComplete} documentType={documentType} />
      ) : documentType === 'Mutual-NDA' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="bg-white rounded-lg border border-[var(--stroke)] p-6">
            <h2 className="text-xl font-semibold mb-6 text-[var(--deep-navy)]">Mutual NDA Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--steel-blue)] mb-2">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--stroke)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)] focus:border-transparent"
              rows={3}
              placeholder="e.g., Exploring a potential business partnership"
            />
            <p className="text-xs text-[var(--slate-gray)] mt-1">
              What is the business purpose for sharing confidential information?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--steel-blue)] mb-2">
              Effective Date
            </label>
            <input
              type="date"
              value={formData.effective_date}
              onChange={(e) => handleInputChange('effective_date', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--stroke)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--steel-blue)] mb-2">
              MNDA Term
            </label>
            <input
              type="text"
              value={formData.mnda_term}
              onChange={(e) => handleInputChange('mnda_term', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--stroke)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)] focus:border-transparent"
              placeholder="e.g., 2 years"
            />
            <p className="text-xs text-[var(--slate-gray)] mt-1">
              How long will this agreement last?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--steel-blue)] mb-2">
              Term of Confidentiality
            </label>
            <input
              type="text"
              value={formData.confidentiality_term}
              onChange={(e) => handleInputChange('confidentiality_term', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--stroke)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)] focus:border-transparent"
              placeholder="e.g., 5 years"
            />
            <p className="text-xs text-[var(--slate-gray)] mt-1">
              How long must confidential information remain protected?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--steel-blue)] mb-2">
              Governing Law
            </label>
            <input
              type="text"
              value={formData.governing_law}
              onChange={(e) => handleInputChange('governing_law', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--stroke)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)] focus:border-transparent"
              placeholder="e.g., California"
            />
            <p className="text-xs text-[var(--slate-gray)] mt-1">
              Which US state's laws govern this agreement?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--steel-blue)] mb-2">
              Jurisdiction
            </label>
            <input
              type="text"
              value={formData.jurisdiction}
              onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--stroke)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--steel-blue)] focus:border-transparent"
              placeholder="e.g., San Francisco, California"
            />
            <p className="text-xs text-[var(--slate-gray)] mt-1">
              Where will legal disputes be resolved?
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isSaving}
                className="flex-1 bg-[var(--steel-blue)] text-white py-3 rounded-lg font-medium hover:bg-[var(--deep-navy)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Preview Document'}
              </button>
              <button
                onClick={handleSave}
                disabled={isGenerating || isSaving}
                className="flex-1 bg-[var(--gold-accent)] text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={isGenerating || isSaving}
                className="flex-1 bg-[var(--success-green)] text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Download Markdown
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating || isSaving}
                className="flex-1 bg-[var(--success-green)] text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="bg-white rounded-lg border border-[var(--stroke)] p-6">
        <h2 className="text-xl font-semibold mb-6 text-[var(--deep-navy)]">Document Preview</h2>
        {preview ? (
          <div className="pdf-preview bg-white border border-gray-200 rounded shadow-sm p-8 max-h-[800px] overflow-y-auto">
            <div className="markdown-body">
              <ReactMarkdown
                components={{
                  h1: ({...props}) => <h1 className="text-2xl font-bold mb-6 text-gray-900" {...props} />,
                  h2: ({...props}) => <h2 className="text-xl font-semibold mb-4 mt-6 text-gray-900" {...props} />,
                  h3: ({...props}) => <h3 className="text-lg font-semibold mb-3 mt-4 text-gray-900" {...props} />,
                  p: ({...props}) => <p className="text-sm leading-relaxed mb-4 text-gray-800" {...props} />,
                  ul: ({...props}) => <ul className="list-disc ml-6 mb-4 text-sm text-gray-800" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal ml-6 mb-4 text-sm text-gray-800" {...props} />,
                  li: ({...props}) => <li className="mb-2 leading-relaxed" {...props} />,
                  strong: ({...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                  em: ({...props}) => <em className="italic" {...props} />,
                  blockquote: ({...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700" {...props} />,
                }}
              >
                {preview}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <p className="text-[var(--slate-gray)] text-sm">
            Click &quot;Preview Document&quot; to see the populated document with your details.
          </p>
        )}
      </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[var(--stroke)] p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-[var(--deep-navy)]">Document Type Not Yet Supported</h2>
          <p className="text-[var(--slate-gray)] mb-6">
            Manual form entry is currently only available for Mutual NDAs. Please use the AI Chat Assistant tab to explore other document types, or select Mutual NDA from the document selector above.
          </p>
          <button
            onClick={() => setInputMode('chat')}
            className="px-6 py-3 bg-[var(--steel-blue)] text-white font-medium rounded-lg hover:bg-[var(--deep-navy)] transition-colors"
          >
            Switch to AI Chat
          </button>
        </div>
      )}
    </div>
  );
}
