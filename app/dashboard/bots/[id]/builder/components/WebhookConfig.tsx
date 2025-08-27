'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, Trash2, Settings, Zap, Globe, TestTube, ExternalLink,
  AlertTriangle, CheckCircle, XCircle, Edit, Copy, MoreVertical,
  Save, RefreshCw, Target, GitBranch, Network, Shield
} from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'

interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  timeout: number;
  retryAttempts: number;
  isActive: boolean;
}

interface CustomWebhook extends WebhookConfig {
  id: string;
  name: string;
  triggerConditions: Array<{
    field: string;
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
    value: any;
  }>;
}

interface WebhookConfigProps {
  botId: string;
  initialConfig?: {
    primary: WebhookConfig;
    fallback: WebhookConfig;
    customWebhooks: CustomWebhook[];
  };
  onSave: (config: {
    primary: WebhookConfig;
    fallback: WebhookConfig;
    customWebhooks: CustomWebhook[];
  }) => void;
  onTest?: (webhook: WebhookConfig) => void;
}

const OPERATOR_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'regex', label: 'Regex match' }
];

const FIELD_OPTIONS = [
  { value: 'message', label: 'User Message' },
  { value: 'user_input', label: 'User Input' },
  { value: 'variable', label: 'Custom Variable' }
];

export default function WebhookConfig({ botId, initialConfig, onSave, onTest }: WebhookConfigProps) {
  const [config, setConfig] = useState<{
    primary: WebhookConfig;
    fallback: WebhookConfig;
    customWebhooks: CustomWebhook[];
  }>({
    primary: {
      url: '',
      method: 'POST',
      headers: {},
      timeout: 30,
      retryAttempts: 2,
      isActive: true
    },
    fallback: {
      url: '',
      method: 'POST',
      headers: {},
      timeout: 30,
      retryAttempts: 1,
      isActive: false
    },
    customWebhooks: []
  });

  const [editingWebhook, setEditingWebhook] = useState<CustomWebhook | null>(null);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const updatePrimary = (updates: Partial<WebhookConfig>) => {
    setConfig(prev => ({
      ...prev,
      primary: { ...prev.primary, ...updates }
    }));
  };

  const updateFallback = (updates: Partial<WebhookConfig>) => {
    setConfig(prev => ({
      ...prev,
      fallback: { ...prev.fallback, ...updates }
    }));
  };

  const addCustomWebhook = () => {
    const newWebhook: CustomWebhook = {
      id: `webhook-${Date.now()}`,
      name: 'New Custom Webhook',
      url: '',
      method: 'POST',
      headers: {},
      timeout: 30,
      retryAttempts: 1,
      isActive: true,
      triggerConditions: [
        {
          field: 'message',
          operator: 'contains',
          value: ''
        }
      ]
    };

    setConfig(prev => ({
      ...prev,
      customWebhooks: [...prev.customWebhooks, newWebhook]
    }));

    setEditingWebhook(newWebhook);
    setIsAddingWebhook(true);
  };

  const updateCustomWebhook = (id: string, updates: Partial<CustomWebhook>) => {
    setConfig(prev => ({
      ...prev,
      customWebhooks: prev.customWebhooks.map(webhook =>
        webhook.id === id ? { ...webhook, ...updates } : webhook
      )
    }));

    if (editingWebhook?.id === id) {
      setEditingWebhook({ ...editingWebhook, ...updates });
    }
  };

  const deleteCustomWebhook = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customWebhooks: prev.customWebhooks.filter(webhook => webhook.id !== id)
    }));

    if (editingWebhook?.id === id) {
      setEditingWebhook(null);
      setIsAddingWebhook(false);
    }
  };

  const addTriggerCondition = (webhookId: string) => {
    const newCondition = {
      field: 'message',
      operator: 'contains' as const,
      value: ''
    };

    updateCustomWebhook(webhookId, {
      triggerConditions: [...(editingWebhook?.triggerConditions || []), newCondition]
    });
  };

  const updateTriggerCondition = (webhookId: string, conditionIndex: number, updates: any) => {
    const webhook = config.customWebhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    const updatedConditions = [...webhook.triggerConditions];
    updatedConditions[conditionIndex] = { ...updatedConditions[conditionIndex], ...updates };

    updateCustomWebhook(webhookId, { triggerConditions: updatedConditions });
  };

  const deleteTriggerCondition = (webhookId: string, conditionIndex: number) => {
    const webhook = config.customWebhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    const updatedConditions = webhook.triggerConditions.filter((_, index) => index !== conditionIndex);
    updateCustomWebhook(webhookId, { triggerConditions: updatedConditions });
  };

  const handleSave = () => {
    onSave(config);
    showSuccess('Webhook configuration saved successfully!');
  };

  const testWebhook = (webhook: WebhookConfig) => {
    if (onTest) {
      onTest(webhook);
    }
  };

  const renderWebhookForm = (webhook: WebhookConfig, title: string, onUpdate: (updates: Partial<WebhookConfig>) => void) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Webhook URL</Label>
          <Input
            value={webhook.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://api.example.com/webhook"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Method</Label>
            <Select value={webhook.method} onValueChange={(value: any) => onUpdate({ method: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timeout (seconds)</Label>
            <Input
              type="number"
              value={webhook.timeout}
              onChange={(e) => onUpdate({ timeout: parseInt(e.target.value) || 30 })}
              min="1"
              max="300"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Retry Attempts</Label>
            <Input
              type="number"
              value={webhook.retryAttempts}
              onChange={(e) => onUpdate({ retryAttempts: parseInt(e.target.value) || 0 })}
              min="0"
              max="5"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={webhook.isActive}
              onCheckedChange={(checked) => onUpdate({ isActive: checked })}
            />
            <Label>Active</Label>
          </div>
        </div>

        <div>
          <Label>Custom Headers (JSON)</Label>
          <Textarea
            value={JSON.stringify(webhook.headers, null, 2)}
            onChange={(e) => {
              try {
                const headers = JSON.parse(e.target.value);
                onUpdate({ headers });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
            rows={3}
          />
        </div>

        {webhook.url && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWebhook(webhook)}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Webhook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(webhook.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open URL
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCustomWebhookForm = (webhook: CustomWebhook) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Custom Webhook</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWebhook(webhook)}
            >
              <TestTube className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteCustomWebhook(webhook.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Webhook Name</Label>
          <Input
            value={webhook.name}
            onChange={(e) => updateCustomWebhook(webhook.id, { name: e.target.value })}
            placeholder="Enter webhook name"
          />
        </div>

        <div>
          <Label>Webhook URL</Label>
          <Input
            value={webhook.url}
            onChange={(e) => updateCustomWebhook(webhook.id, { url: e.target.value })}
            placeholder="https://api.example.com/webhook"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Method</Label>
            <Select value={webhook.method} onValueChange={(value: any) => updateCustomWebhook(webhook.id, { method: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={webhook.isActive}
              onCheckedChange={(checked) => updateCustomWebhook(webhook.id, { isActive: checked })}
            />
            <Label>Active</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Timeout (seconds)</Label>
            <Input
              type="number"
              value={webhook.timeout}
              onChange={(e) => updateCustomWebhook(webhook.id, { timeout: parseInt(e.target.value) || 30 })}
              min="1"
              max="300"
            />
          </div>
          <div>
            <Label>Retry Attempts</Label>
            <Input
              type="number"
              value={webhook.retryAttempts}
              onChange={(e) => updateCustomWebhook(webhook.id, { retryAttempts: parseInt(e.target.value) || 0 })}
              min="0"
              max="3"
            />
          </div>
        </div>

        {/* Trigger Conditions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Trigger Conditions</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addTriggerCondition(webhook.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
          <div className="space-y-2">
            {webhook.triggerConditions.map((condition, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Condition {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTriggerCondition(webhook.id, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateTriggerCondition(webhook.id, index, { field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(value: any) => updateTriggerCondition(webhook.id, index, { operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateTriggerCondition(webhook.id, index, { value: e.target.value })}
                    placeholder="Value"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Custom Headers (JSON)</Label>
          <Textarea
            value={JSON.stringify(webhook.headers, null, 2)}
            onChange={(e) => {
              try {
                const headers = JSON.parse(e.target.value);
                updateCustomWebhook(webhook.id, { headers });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Configuration</h2>
          <p className="text-gray-600">Configure webhooks for your bot</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </Button>
          <Button onClick={addCustomWebhook} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Custom Webhook</span>
          </Button>
        </div>
      </div>

      {/* Primary Webhook */}
      {renderWebhookForm(config.primary, 'Primary Webhook', updatePrimary)}

      {/* Fallback Webhook */}
      {renderWebhookForm(config.fallback, 'Fallback Webhook', updateFallback)}

      {/* Custom Webhooks */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Custom Webhooks ({config.customWebhooks.length})</h3>
        </div>
        
        {config.customWebhooks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No custom webhooks configured</p>
                <Button onClick={addCustomWebhook} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {config.customWebhooks.map((webhook) => (
              <div key={webhook.id}>
                {editingWebhook?.id === webhook.id ? (
                  renderCustomWebhookForm(webhook)
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{webhook.name}</div>
                          <div className="text-sm text-gray-500">
                            {webhook.method} {webhook.url}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {webhook.triggerConditions.length} trigger conditions
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingWebhook(webhook)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhook(webhook)}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
