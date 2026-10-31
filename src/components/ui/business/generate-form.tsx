import { useState } from 'react';
import { Clock, Loader2, Send } from 'lucide-react';
import { getRepositoryByUrl, promoteRepositoryToNext, type ManualGenerateResponse } from '@/api/alchemist';
import type { ApiConfig } from '@/api/api-configs';
import { enabledIntegrations } from '@/utils/message-publish';
import type { Repository } from '@/types';
import { ResultDialog } from '../common/result-dialog';
import { toast } from '../common/toast-config';
import { Button } from '../base/button';
import { ManualGenerateCard } from './manual-generate-card';
import { CollectPostsCard } from './collect-posts-card';
import { PublishRepositoryDialog } from './publish-repository-dialog';

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
  nextPostId?: number;
  integrations?: ApiConfig[];
  integrationsLoading?: boolean;
  /** Refreshes the repository list after a promotion or publication. */
  onRepositoryUpdate: () => Promise<void>;
}

export function GenerateForm({
  onManualGenerate,
  onAutoGenerate,
  nextPostId,
  integrations,
  integrationsLoading,
  onRepositoryUpdate,
}: GenerateFormProps) {
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [result, setResult] = useState<GenerateResult>({
    added: [],
    notAdded: [],
    errorMessages: {},
    context: 'collect',
  });
  // The one repository a manual generation added, to publish it right away.
  const [addedRepository, setAddedRepository] = useState<Repository | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [publishTarget, setPublishTarget] = useState<Repository | null>(null);

  const showResult = (next: GenerateResult) => {
    setResult(next);
    setAddedRepository(null);
    setIsResultDialogOpen(true);

    if (next.context === 'manual' && next.added.length === 1) {
      // Without the repository's id there is nothing to promote, so the
      // buttons simply don't show when it can't be read.
      getRepositoryByUrl(next.added[0])
        .then(repository => setAddedRepository(repository && !repository.posted ? repository : null))
        .catch(error => console.warn('Could not load the added repository:', error));
    }
  };

  const closeResult = () => {
    setIsResultDialogOpen(false);
    setAddedRepository(null);
  };

  const handlePublishNext = async () => {
    if (!addedRepository || promoting) return;

    setPromoting(true);
    try {
      const response = await promoteRepositoryToNext({ id: addedRepository.id });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      toast.success('Repository will be published next', { id: `promote-${addedRepository.id}` });
      closeResult();
      await onRepositoryUpdate();
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Failed to promote repository';
      toast.error(message, { id: `promote-error-${addedRepository.id}` });
    } finally {
      setPromoting(false);
    }
  };

  const handlePublishNow = () => {
    if (!addedRepository) return;
    setPublishTarget(addedRepository);
    closeResult();
  };

  const isNext = addedRepository !== null && addedRepository.id === nextPostId;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ResultDialog
        isOpen={isResultDialogOpen}
        onClose={closeResult}
        added={result.added}
        notAdded={result.notAdded}
        errorMessages={result.errorMessages}
        context={result.context}
        title={result.context === 'manual' ? 'Manual Generation' : 'Collect posts'}
        actions={addedRepository && (
          <>
            <Button
              variant="outline"
              onClick={handlePublishNext}
              disabled={promoting || isNext}
              title={isNext ? 'Already next in the queue' : undefined}
            >
              {promoting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
              Publish next
            </Button>
            <Button onClick={handlePublishNow} disabled={promoting}>
              <Send className="h-4 w-4 mr-2" />
              Publish now
            </Button>
          </>
        )}
      />

      <PublishRepositoryDialog
        repository={publishTarget}
        isNext={publishTarget !== null && publishTarget.id === nextPostId}
        integrations={enabledIntegrations(integrations ?? [])}
        integrationsLoading={integrationsLoading}
        autoPublish
        onClose={() => setPublishTarget(null)}
        onPromote={async repo => {
          const response = await promoteRepositoryToNext({ id: repo.id });
          if (response.status === 'error') {
            toast.error(response.message || 'Failed to promote repository');
            throw new Error(response.message);
          }
          toast.success('Repository will be published next', { id: `promote-${repo.id}` });
          await onRepositoryUpdate();
        }}
        onPublished={onRepositoryUpdate}
      />

      <ManualGenerateCard onManualGenerate={onManualGenerate} onResult={showResult} />

      <CollectPostsCard onAutoGenerate={onAutoGenerate} onResult={showResult} />
    </div>
  );
}
