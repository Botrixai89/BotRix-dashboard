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
  Plus, Trash2, Settings, Zap, MessageSquare, Image, Globe, 
  Variable, ArrowRight, Pause, Target, GitBranch, Save, TestTube,
  AlertTriangle, CheckCircle, XCircle, Edit, Copy, MoreVertical
} from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'

interface RuleCondition {
  field: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'in_list';
  value: any;
  caseSensitive?: boolean;
}

interface RuleAction {
  type: 'send_message' | 'send_image' | 'set_variable' | 'call_webhook' | 'redirect' | 'pause';
  data: any;
  order: number;
}

interface BotRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
}

interface RuleBuilderProps {
  botId: string;
  initialRules?: BotRule[];
  onSave: (rules: BotRule[]) => void;
  onTest?: (rule: BotRule) => void;
}

const FIELD_OPTIONS = [
  { value: 'message', label: 'User Message' },
  { value: 'user_input', label: 'User Input' },
  { value: 'variable', label: 'Custom Variable' }
];

const OPERATOR_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'regex', label: 'Regex match' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'in_list', label: 'In list' }
];

const ACTION_OPTIONS = [
  { value: 'send_message', label: 'Send Message', icon: MessageSquare },
  { value: 'send_image', label: 'Send Image', icon: Image },
  { value: 'set_variable', label: 'Set Variable', icon: Variable },
  { value: 'call_webhook', label: 'Call Webhook', icon: Globe },
  { value: 'redirect', label: 'Redirect', icon: ArrowRight },
  { value: 'pause', label: 'Pause', icon: Pause }
];

export default function RuleBuilder({ botId, initialRules = [], onSave, onTest }: RuleBuilderProps) {
  const [rules, setRules] = useState<BotRule[]>(initialRules);
  const [selectedRule, setSelectedRule] = useState<BotRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (rules.length === 0) {
      // Add default rules
      setRules([
        {
          id: 'greeting',
          name: 'Greeting Response',
          conditions: [
            {
              field: 'message',
              operator: 'contains',
              value: ['hello', 'hi', 'hey'],
              caseSensitive: false
            }
          ],
          actions: [
            {
              type: 'send_message',
              data: { message: 'Hello! How can I help you today?' },
              order: 1
            }
          ],
          priority: 1,
          isActive: true
        }
      ]);
    }
  }, []);

  const addRule = () => {
    const newRule: BotRule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      conditions: [
        {
          field: 'message',
          operator: 'contains',
          value: '',
          caseSensitive: false
        }
      ],
      actions: [
        {
          type: 'send_message',
          data: { message: '' },
          order: 1
        }
      ],
      priority: 1,
      isActive: true
    };

    setRules([...rules, newRule]);
    setSelectedRule(newRule);
    setIsEditing(true);
  };

  const updateRule = (ruleId: string, updates: Partial<BotRule>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
    
    if (selectedRule?.id === ruleId) {
      setSelectedRule({ ...selectedRule, ...updates });
    }
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
      setIsEditing(false);
    }
  };

  const addCondition = (ruleId: string) => {
    const newCondition: RuleCondition = {
      field: 'message',
      operator: 'contains',
      value: '',
      caseSensitive: false
    };

    updateRule(ruleId, {
      conditions: [...(selectedRule?.conditions || []), newCondition]
    });
  };

  const updateCondition = (ruleId: string, conditionIndex: number, updates: Partial<RuleCondition>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedConditions = [...rule.conditions];
    updatedConditions[conditionIndex] = { ...updatedConditions[conditionIndex], ...updates };

    updateRule(ruleId, { conditions: updatedConditions });
  };

  const deleteCondition = (ruleId: string, conditionIndex: number) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedConditions = rule.conditions.filter((_, index) => index !== conditionIndex);
    updateRule(ruleId, { conditions: updatedConditions });
  };

  const addAction = (ruleId: string) => {
    const newAction: RuleAction = {
      type: 'send_message',
      data: { message: '' },
      order: (selectedRule?.actions.length || 0) + 1
    };

    updateRule(ruleId, {
      actions: [...(selectedRule?.actions || []), newAction]
    });
  };

  const updateAction = (ruleId: string, actionIndex: number, updates: Partial<RuleAction>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedActions = [...rule.actions];
    updatedActions[actionIndex] = { ...updatedActions[actionIndex], ...updates };

    updateRule(ruleId, { actions: updatedActions });
  };

  const deleteAction = (ruleId: string, actionIndex: number) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedActions = rule.actions.filter((_, index) => index !== actionIndex);
    updateRule(ruleId, { actions: updatedActions });
  };

  const handleSave = () => {
    onSave(rules);
    showSuccess('Rules saved successfully!');
  };

  const testRule = (rule: BotRule) => {
    if (onTest) {
      onTest(rule);
    }
  };

  const renderConditionValue = (condition: RuleCondition, ruleId: string, index: number) => {
    if (condition.operator === 'in_list') {
      return (
        <Textarea
          value={Array.isArray(condition.value) ? condition.value.join('\n') : condition.value}
          onChange={(e) => {
            const values = e.target.value.split('\n').filter(v => v.trim());
            updateCondition(ruleId, index, { value: values });
          }}
          placeholder="Enter values, one per line"
          className="mt-1"
        />
      );
    }

    if (condition.operator === 'regex') {
      return (
        <Input
          value={condition.value}
          onChange={(e) => updateCondition(ruleId, index, { value: e.target.value })}
          placeholder="Enter regex pattern"
          className="mt-1"
        />
      );
    }

    return (
      <Input
        value={condition.value}
        onChange={(e) => updateCondition(ruleId, index, { value: e.target.value })}
        placeholder="Enter value"
        className="mt-1"
      />
    );
  };

  const renderActionData = (action: RuleAction, ruleId: string, index: number) => {
    switch (action.type) {
      case 'send_message':
        return (
          <Textarea
            value={action.data.message || ''}
            onChange={(e) => updateAction(ruleId, index, { 
              data: { ...action.data, message: e.target.value }
            })}
            placeholder="Enter message to send"
            className="mt-1"
          />
        );

      case 'send_image':
        return (
          <Input
            value={action.data.url || ''}
            onChange={(e) => updateAction(ruleId, index, { 
              data: { ...action.data, url: e.target.value }
            })}
            placeholder="Enter image URL"
            className="mt-1"
          />
        );

      case 'set_variable':
        return (
          <div className="space-y-2">
            <Input
              value={action.data.name || ''}
              onChange={(e) => updateAction(ruleId, index, { 
                data: { ...action.data, name: e.target.value }
              })}
              placeholder="Variable name"
              className="mt-1"
            />
            <Input
              value={action.data.value || ''}
              onChange={(e) => updateAction(ruleId, index, { 
                data: { ...action.data, value: e.target.value }
              })}
              placeholder="Variable value"
              className="mt-1"
            />
          </div>
        );

      case 'call_webhook':
        return (
          <div className="space-y-2">
            <Input
              value={action.data.url || ''}
              onChange={(e) => updateAction(ruleId, index, { 
                data: { ...action.data, url: e.target.value }
              })}
              placeholder="Webhook URL"
              className="mt-1"
            />
            <Select 
              value={action.data.method || 'POST'} 
              onValueChange={(value) => updateAction(ruleId, index, { 
                data: { ...action.data, method: value }
              })}
            >
              <SelectTrigger className="mt-1">
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
        );

      case 'redirect':
        return (
          <Input
            value={action.data.url || ''}
            onChange={(e) => updateAction(ruleId, index, { 
              data: { ...action.data, url: e.target.value }
            })}
            placeholder="Redirect URL"
            className="mt-1"
          />
        );

      case 'pause':
        return (
          <Input
            type="number"
            value={action.data.duration || 1000}
            onChange={(e) => updateAction(ruleId, index, { 
              data: { ...action.data, duration: parseInt(e.target.value) || 1000 }
            })}
            placeholder="Duration (ms)"
            className="mt-1"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rule-Based Bot Builder</h2>
          <p className="text-gray-600">Create rules to automatically respond to user messages</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Rules</span>
          </Button>
          <Button onClick={addRule} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" />
                <span>Rules ({rules.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRule?.id === rule.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedRule(rule);
                      setIsEditing(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rule.name}</div>
                        <div className="text-xs text-gray-500">
                          {rule.conditions.length} conditions, {rule.actions.length} actions
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">P{rule.priority}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rule Editor */}
        <div className="lg:col-span-2">
          {selectedRule && isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Edit Rule</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testRule(selectedRule)}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(selectedRule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rule Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input
                      value={selectedRule.name}
                      onChange={(e) => updateRule(selectedRule.id, { name: e.target.value })}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Input
                        type="number"
                        value={selectedRule.priority}
                        onChange={(e) => updateRule(selectedRule.id, { priority: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedRule.isActive}
                        onCheckedChange={(checked) => updateRule(selectedRule.id, { isActive: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Conditions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCondition(selectedRule.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Condition
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {selectedRule.conditions.map((condition, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Condition {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCondition(selectedRule.id, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={condition.field}
                            onValueChange={(value) => updateCondition(selectedRule.id, index, { field: value })}
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
                            onValueChange={(value: any) => updateCondition(selectedRule.id, index, { operator: value })}
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
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={condition.caseSensitive}
                              onCheckedChange={(checked) => updateCondition(selectedRule.id, index, { caseSensitive: checked })}
                            />
                            <Label className="text-xs">Case sensitive</Label>
                          </div>
                        </div>
                        {renderConditionValue(condition, selectedRule.id, index)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Actions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(selectedRule.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Action
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {selectedRule.actions.map((action, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Action {index + 1}</span>
                            <Badge variant="outline">Order {action.order}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAction(selectedRule.id, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Select
                          value={action.type}
                          onValueChange={(value: any) => updateAction(selectedRule.id, index, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <option.icon className="h-4 w-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {renderActionData(action, selectedRule.id, index)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a rule to edit or create a new one</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
