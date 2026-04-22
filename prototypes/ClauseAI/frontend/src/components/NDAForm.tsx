import { useState } from 'react';
import { generateDocument, type FormData } from '@/lib/api';

export default function NDAForm() {
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDocument('Mutual-NDA', formData);
      setPreview(result.content);
    } catch (error) {
      console.error('Failed to generate document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDocument('Mutual-NDA', formData);
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

  return (
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

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 bg-[var(--steel-blue)] text-white py-3 rounded-lg font-medium hover:bg-[var(--deep-navy)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Preview Document'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 bg-[var(--success-green)] text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isGenerating ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="bg-white rounded-lg border border-[var(--stroke)] p-6">
        <h2 className="text-xl font-semibold mb-6 text-[var(--deep-navy)]">Document Preview</h2>
        {preview ? (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{preview}</pre>
          </div>
        ) : (
          <p className="text-[var(--slate-gray)] text-sm">
            Click &quot;Preview Document&quot; to see the populated NDA with your details.
          </p>
        )}
      </div>
    </div>
  );
}
