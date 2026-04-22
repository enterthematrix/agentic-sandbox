'use client';

import { useEffect, useState } from 'react';
import { getTemplates, type TemplateInfo } from '@/lib/api';

interface DocumentTypeSelectorProps {
  value: string;
  onChange: (filename: string) => void;
}

export default function DocumentTypeSelector({ value, onChange }: DocumentTypeSelectorProps) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getTemplates();
        setTemplates(data.templates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  if (isLoading) {
    return <div className="text-[var(--slate-gray)]">Loading templates...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-[var(--stroke)] p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-[var(--deep-navy)]">Select Document Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.filename}
            onClick={() => onChange(template.filename)}
            disabled={!template.supported}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              value === template.filename
                ? 'border-[var(--steel-blue)] bg-[var(--steel-blue)]/10'
                : 'border-[var(--stroke)] hover:border-[var(--steel-blue)]/50'
            } ${
              !template.supported
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-[var(--deep-navy)]">{template.name}</h3>
              {!template.supported && (
                <span className="text-xs px-2 py-1 bg-[var(--slate-gray)]/20 text-[var(--slate-gray)] rounded">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--slate-gray)]">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
