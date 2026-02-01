import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiConfig, CreateApiConfigRequest } from '@/api/api-configs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../base/dialog';
import { Button } from '../base/button';
import { Input } from '../base/input';
import { Textarea } from '../base/textarea';
import { Label } from '../base/label';
import { Switch } from '../base/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ApiConfig | null;
  onSubmit: (data: CreateApiConfigRequest) => Promise<void>;
  saving: boolean;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api_key', label: 'API Key' },
] as const;
const CONTENT_TYPES = [
  { value: 'json', label: 'JSON' },
  { value: 'multipart', label: 'Multipart' },
] as const;

const getDefaultFormData = (): CreateApiConfigRequest => ({
  name: '',
  url: '',
  method: 'POST',
  auth_type: 'none',
  token_env_var: '',
  token_header: 'X-API-Key',
  content_type: 'multipart',
  timeout: 30,
  success_code: 200,
  enabled: true,
  response_type: 'json',
  text_language: 'en',
  socialify_image: false,
  default_json_body: '',
});

export const ApiConfigDialog = ({
  open,
  onOpenChange,
  config,
  onSubmit,
  saving,
}: ApiConfigDialogProps) => {
  const [formData, setFormData] = useState<CreateApiConfigRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = config !== null;

  useEffect(() => {
    if (open) {
      if (config) {
        setFormData({
          name: config.name,
          url: config.url,
          method: config.method,
          auth_type: config.auth_type,
          token_env_var: config.token_env_var,
          token_header: config.token_header,
          content_type: config.content_type,
          timeout: config.timeout,
          success_code: config.success_code,
          enabled: config.enabled,
          response_type: config.response_type,
          text_language: config.text_language,
          socialify_image: config.socialify_image,
          default_json_body: config.default_json_body,
        });
      } else {
        setFormData(getDefaultFormData());
      }
      setErrors({});
    }
  }, [open, config]);

  const handleFieldChange = (field: keyof CreateApiConfigRequest, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters, numbers, hyphens and underscores';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    }

    if (formData.timeout <= 0) {
      newErrors.timeout = 'Timeout must be greater than 0';
    }

    if (formData.success_code < 100 || formData.success_code > 599) {
      newErrors.success_code = 'Success code must be between 100 and 599';
    }

    if (formData.auth_type === 'api_key' && !formData.token_header?.trim()) {
      newErrors.token_header = 'Token header is required for API key auth';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Integration: ${config.name}` : 'Add New Integration'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={isEditing || saving}
              placeholder="e.g., twitter, telegram"
              variant={errors.name ? 'error' : 'default'}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => handleFieldChange('url', e.target.value)}
              disabled={saving}
              placeholder="{env.API_URL}/endpoint"
              variant={errors.url ? 'error' : 'default'}
            />
            <p className="text-xs text-muted-foreground">
              Supports {'{env.VAR}'} syntax for environment variables
            </p>
            {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
          </div>

          {/* Method & Content Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => handleFieldChange('method', value as typeof formData.method)}
                disabled={saving}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_type">Content Type</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => handleFieldChange('content_type', value as typeof formData.content_type)}
                disabled={saving}
              >
                <SelectTrigger id="content_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auth Type */}
          <div className="space-y-2">
            <Label htmlFor="auth_type">Authentication</Label>
            <Select
              value={formData.auth_type || 'none'}
              onValueChange={(value) => handleFieldChange('auth_type', value as "" | "bearer" | "api_key")}
              disabled={saving}
            >
              <SelectTrigger id="auth_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token Env Var & Token Header (conditional) */}
          {(formData.auth_type === 'bearer' || formData.auth_type === 'api_key') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="token_env_var">Token Env Variable</Label>
                <Input
                  id="token_env_var"
                  value={formData.token_env_var || ''}
                  onChange={(e) => handleFieldChange('token_env_var', e.target.value)}
                  disabled={saving}
                  placeholder="API_TOKEN"
                />
              </div>

              {formData.auth_type === 'api_key' && (
                <div className="space-y-2">
                  <Label htmlFor="token_header">
                    Token Header <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="token_header"
                    value={formData.token_header || ''}
                    onChange={(e) => handleFieldChange('token_header', e.target.value)}
                    disabled={saving}
                    placeholder="X-API-Key"
                    variant={errors.token_header ? 'error' : 'default'}
                  />
                  {errors.token_header && (
                    <p className="text-xs text-destructive">{errors.token_header}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeout & Success Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min={1}
                value={formData.timeout}
                onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value) || 0)}
                disabled={saving}
                variant={errors.timeout ? 'error' : 'default'}
              />
              {errors.timeout && <p className="text-xs text-destructive">{errors.timeout}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="success_code">Success Code</Label>
              <Input
                id="success_code"
                type="number"
                min={100}
                max={599}
                value={formData.success_code}
                onChange={(e) => handleFieldChange('success_code', parseInt(e.target.value) || 0)}
                disabled={saving}
                variant={errors.success_code ? 'error' : 'default'}
              />
              {errors.success_code && <p className="text-xs text-destructive">{errors.success_code}</p>}
            </div>
          </div>

          {/* Language & Response Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="text_language">Text Language</Label>
              <Input
                id="text_language"
                value={formData.text_language || ''}
                onChange={(e) => handleFieldChange('text_language', e.target.value)}
                disabled={saving}
                placeholder="en"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="response_type">Response Type</Label>
              <Input
                id="response_type"
                value={formData.response_type || ''}
                onChange={(e) => handleFieldChange('response_type', e.target.value)}
                disabled={saving}
                placeholder="json"
              />
            </div>
          </div>

          {/* Switches */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleFieldChange('enabled', checked)}
                disabled={saving}
              />
              <Label htmlFor="enabled" className="cursor-pointer">Enabled</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="socialify_image"
                checked={formData.socialify_image}
                onCheckedChange={(checked) => handleFieldChange('socialify_image', checked)}
                disabled={saving}
              />
              <Label htmlFor="socialify_image" className="cursor-pointer">Socialify Image</Label>
            </div>
          </div>

          {/* Default JSON Body */}
          <div className="space-y-2">
            <Label htmlFor="default_json_body">Default JSON Body</Label>
            <Textarea
              id="default_json_body"
              value={formData.default_json_body || ''}
              onChange={(e) => handleFieldChange('default_json_body', e.target.value)}
              disabled={saving}
              placeholder='{"key": "value"}'
              className="min-h-[80px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              JSON string for default request body. Supports {'{env.VAR}'} syntax.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
