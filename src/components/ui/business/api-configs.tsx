import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { IntegrationIcon, getLanguageFlag } from './integration-icons';
import { formatDate } from '@/utils/date-format';
import { toast } from '../common/toast-config';
import { ConfirmDialog } from '../common/confirm-dialog';
import { ApiConfig, UpdateApiConfigRequest, CreateApiConfigRequest } from '@/api/api-configs';
import { ApiConfigDialog } from './api-config-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../base/table';
import { Switch } from '../base/switch';
import { Button } from '../base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Skeleton } from '../common/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../base/tooltip';


interface ApiConfigsProps {
  configs: ApiConfig[];
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  isApiReady?: boolean;
  onAdd: (config: CreateApiConfigRequest) => Promise<ApiConfig>;
  onEdit: (name: string, updates: UpdateApiConfigRequest) => Promise<ApiConfig>;
  onDelete: (name: string) => Promise<void>;
}

export const ApiConfigs = ({
  configs,
  loading,
  saving,
  deleting,
  isApiReady = true,
  onAdd,
  onEdit,
  onDelete,
}: ApiConfigsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Sort configs: enabled first (alphabetically), then disabled (alphabetically)
  const sortedConfigs = useMemo(() => {
    return [...configs].sort((a, b) => {
      // First, sort by enabled status (enabled first)
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [configs]);

  const handleAddClick = () => {
    setEditingConfig(null);
    setDialogOpen(true);
  };

  const handleEditClick = (config: ApiConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleDeleteClick = (name: string) => {
    setConfigToDelete(name);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;
    try {
      await onDelete(configToDelete);
      toast.success(`Integration "${configToDelete}" deleted successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete integration';
      toast.error(message);
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleToggleEnabled = async (config: ApiConfig) => {
    setTogglingStatus(config.name);
    try {
      await onEdit(config.name, { enabled: !config.enabled });
      toast.success(`Integration "${config.name}" ${!config.enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update integration';
      toast.error(message);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDialogSubmit = async (data: CreateApiConfigRequest) => {
    try {
      if (editingConfig) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, ...updates } = data;
        await onEdit(editingConfig.name, updates);
        toast.success(`Integration "${editingConfig.name}" updated successfully`);
      } else {
        await onAdd(data);
        toast.success(`Integration "${data.name}" created successfully`);
      }
      setDialogOpen(false);
      setEditingConfig(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save integration';
      toast.error(message);
    }
  };

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[15%]">Name</TableHead>
          <TableHead className="w-[30%]">URL</TableHead>
          <TableHead className="w-[10%]">Method</TableHead>
          <TableHead className="w-[15%]">Language</TableHead>
          <TableHead className="w-[15%]">Updated</TableHead>
          <TableHead className="w-[15%] text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedConfigs.length > 0 ? (
          sortedConfigs.map((config) => (
            <TableRow key={config.name} className="group">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <IntegrationIcon name={config.name} className="h-4 w-4 shrink-0" />
                  <span>{config.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-xs truncate block max-w-[250px]">
                        {config.url.replace(/\{env\.[^}]+\}/, '')}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[400px]">
                      <p className="break-all">{config.url}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted">
                  {config.method}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none" title={config.text_language}>{getLanguageFlag(config.text_language) || <span className="text-sm">{config.text_language || '-'}</span>}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(config.updated_at)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={() => handleToggleEnabled(config)}
                    disabled={togglingStatus === config.name || saving}
                    className="data-[state=checked]:bg-success mr-2"
                    title={config.enabled ? 'Click to disable' : 'Click to enable'}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(config)}
                    disabled={saving}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(config.name)}
                    disabled={deleting}
                    className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No integrations configured. Click "Add Integration" to create one.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {sortedConfigs.length > 0 ? (
        sortedConfigs.map((config, index) => (
          <div
            key={config.name}
            className={`bg-card border ${index !== sortedConfigs.length - 1 ? 'border-b' : ''} p-4 rounded-lg`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">

                  <IntegrationIcon name={config.name} className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{config.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">
                    {config.method}
                  </span>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => handleToggleEnabled(config)}
                  disabled={togglingStatus === config.name || saving}
                  className="data-[state=checked]:bg-success"
                />
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">URL</div>
                <div className="text-sm font-mono truncate">{config.url.replace(/\{env\.[^}]+\}/, '')}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">Language</div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-xl leading-none" title={config.text_language}>{getLanguageFlag(config.text_language) || <span className="text-sm">{config.text_language || '-'}</span>}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">Updated</div>
                  <div className="text-sm">{formatDate(config.updated_at)}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(config)}
                  disabled={saving}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(config.name)}
                  disabled={deleting}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No integrations configured. Click "Add Integration" to create one.
        </div>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderApiNotReady = () => (
    <div className="text-center text-muted-foreground">
      Data could not be loaded because API keys are not configured
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>
            Integrations
          </CardTitle>
          {isApiReady && (
            <Button onClick={handleAddClick} size="sm" disabled={saving || loading}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Integration
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isApiReady ? (
            renderApiNotReady()
          ) : loading ? (
            renderLoadingState()
          ) : (
            <>
              <div className="hidden md:block">
                {renderDesktopView()}
              </div>
              <div className="md:hidden block">
                {renderMobileView()}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ApiConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        onSubmit={handleDialogSubmit}
        saving={saving}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Integration"
        message={`Are you sure you want to delete "${configToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setConfigToDelete(null);
        }}
        variant="warning"
      />
    </>
  );
};
