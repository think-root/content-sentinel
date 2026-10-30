import { useState } from 'react';
import type { ManualGenerateResponse } from '@/api/alchemist';
import { ResultDialog } from '../common/result-dialog';
import { ManualGenerateCard } from './manual-generate-card';
import { CollectPostsCard } from './collect-posts-card';

export interface GenerateResult {
  added: string[];
  notAdded: string[];
  errorMessages: Record<string, string>;
  context: 'manual' | 'collect';
}

interface GenerateFormProps {
  onManualGenerate: (url: string) => Promise<ManualGenerateResponse>;
  onAutoGenerate: (
    maxRepos: number,
    resource: string,
    since: string,
    spokenLanguageCode: string,
    period: string,
    language: string
  ) => Promise<ManualGenerateResponse>;
}

export function GenerateForm({ onManualGenerate, onAutoGenerate }: GenerateFormProps) {
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [result, setResult] = useState<GenerateResult>({
    added: [],
    notAdded: [],
    errorMessages: {},
    context: 'collect',
  });

  const showResult = (next: GenerateResult) => {
    setResult(next);
    setIsResultDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ResultDialog
        isOpen={isResultDialogOpen}
        onClose={() => setIsResultDialogOpen(false)}
        added={result.added}
        notAdded={result.notAdded}
        errorMessages={result.errorMessages}
        context={result.context}
        title={result.context === 'manual' ? 'Manual Generation' : 'Collect posts'}
      />

      <ManualGenerateCard onManualGenerate={onManualGenerate} onResult={showResult} />

      <CollectPostsCard onAutoGenerate={onAutoGenerate} onResult={showResult} />
    </div>
  );
}
