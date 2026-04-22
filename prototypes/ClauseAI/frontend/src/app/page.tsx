'use client';

import { useState } from 'react';
import NDAForm from '@/components/NDAForm';
import DocumentTypeSelector from '@/components/DocumentTypeSelector';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Mutual-NDA.md');

  return (
    <main>
      <header className="bg-[var(--deep-navy)] text-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-semibold">ClauseAI</h1>
          <p className="text-sm opacity-80 mt-1">AI-powered legal document assistant</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <DocumentTypeSelector value={selectedTemplate} onChange={setSelectedTemplate} />
        <NDAForm documentType={selectedTemplate} />
      </div>

      <footer className="mt-16 py-6 border-t border-[var(--stroke)] text-center text-sm text-[var(--slate-gray)]">
        ClauseAI V1 | Templates licensed under CC BY 4.0 from CommonPaper
      </footer>
    </main>
  );
}
