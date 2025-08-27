import { Bot } from '@/types';

export interface RuleCondition {
  field: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'in_list';
  value: any;
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'send_message' | 'send_image' | 'set_variable' | 'call_webhook' | 'redirect' | 'pause';
  data: any;
  order: number;
}

export interface BotRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
}

export interface RuleExecutionResult {
  matched: boolean;
  actions: RuleAction[];
  variables: Record<string, any>;
  response?: string;
  imageUrl?: string;
  webhookCalls?: Array<{
    url: string;
    method: string;
    payload: any;
    response?: any;
  }>;
}

export class RuleBasedBotService {
  /**
   * Execute rules for a given message and context
   */
  async executeRules(
    bot: Bot,
    message: string,
    context: Record<string, any> = {}
  ): Promise<RuleExecutionResult> {
    if (!bot.settings.ruleBasedConfig?.enabled || !bot.settings.ruleBasedConfig.rules) {
      return {
        matched: false,
        actions: [],
        variables: context
      };
    }

    const rules = bot.settings.ruleBasedConfig.rules
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    let variables = { ...context };
    let matchedRule: BotRule | null = null;
    let matchedActions: RuleAction[] = [];

    // Find the first matching rule
    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, message, variables)) {
        matchedRule = rule;
        matchedActions = [...rule.actions].sort((a, b) => a.order - b.order);
        break;
      }
    }

    if (!matchedRule) {
      return {
        matched: false,
        actions: [],
        variables
      };
    }

    // Execute actions
    const result: RuleExecutionResult = {
      matched: true,
      actions: matchedActions,
      variables,
      webhookCalls: []
    };

    for (const action of matchedActions) {
      await this.executeAction(action, result, bot);
    }

    return result;
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(
    conditions: RuleCondition[],
    message: string,
    variables: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field, message, variables);
      return this.evaluateCondition(condition, fieldValue);
    });
  }

  /**
   * Get field value from message or variables
   */
  private getFieldValue(field: string, message: string, variables: Record<string, any>): any {
    switch (field) {
      case 'message':
      case 'user_input':
        return message;
      default:
        return variables[field] || '';
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, fieldValue: any): boolean {
    const value = condition.value;
    const fieldStr = String(fieldValue);
    const compareStr = String(value);

    if (!condition.caseSensitive) {
      const fieldLower = fieldStr.toLowerCase();
      const compareLower = compareStr.toLowerCase();

      switch (condition.operator) {
        case 'contains':
          return fieldLower.includes(compareLower);
        case 'equals':
          return fieldLower === compareLower;
        case 'starts_with':
          return fieldLower.startsWith(compareLower);
        case 'ends_with':
          return fieldLower.endsWith(compareLower);
        case 'regex':
          try {
            const regex = new RegExp(value, condition.caseSensitive ? '' : 'i');
            return regex.test(fieldStr);
          } catch {
            return false;
          }
        case 'greater_than':
          return Number(fieldValue) > Number(value);
        case 'less_than':
          return Number(fieldValue) < Number(value);
        case 'in_list':
          const list = Array.isArray(value) ? value : [value];
          return list.some(item => 
            String(item).toLowerCase() === fieldLower
          );
        default:
          return false;
      }
    } else {
      switch (condition.operator) {
        case 'contains':
          return fieldStr.includes(compareStr);
        case 'equals':
          return fieldStr === compareStr;
        case 'starts_with':
          return fieldStr.startsWith(compareStr);
        case 'ends_with':
          return fieldStr.endsWith(compareStr);
        case 'regex':
          try {
            const regex = new RegExp(value);
            return regex.test(fieldStr);
          } catch {
            return false;
          }
        case 'greater_than':
          return Number(fieldValue) > Number(value);
        case 'less_than':
          return Number(fieldValue) < Number(value);
        case 'in_list':
          const list = Array.isArray(value) ? value : [value];
          return list.some(item => String(item) === fieldStr);
        default:
          return false;
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: RuleAction,
    result: RuleExecutionResult,
    bot: Bot
  ): Promise<void> {
    switch (action.type) {
      case 'send_message':
        result.response = action.data.message || action.data.text || '';
        break;

      case 'send_image':
        result.imageUrl = action.data.url || action.data.imageUrl || '';
        break;

      case 'set_variable':
        if (action.data.name && action.data.value !== undefined) {
          result.variables[action.data.name] = action.data.value;
        }
        break;

      case 'call_webhook':
        await this.executeWebhookAction(action, result, bot);
        break;

      case 'redirect':
        result.variables.redirectUrl = action.data.url;
        break;

      case 'pause':
        const delay = action.data.duration || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        break;
    }
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(
    action: RuleAction,
    result: RuleExecutionResult,
    bot: Bot
  ): Promise<void> {
    const webhookConfig = action.data.webhookConfig || {};
    const url = webhookConfig.url || action.data.url;
    const method = webhookConfig.method || action.data.method || 'POST';
    const headers = webhookConfig.headers || action.data.headers || {};
    const timeout = webhookConfig.timeout || action.data.timeout || 30;
    const retryAttempts = webhookConfig.retryAttempts || action.data.retryAttempts || 1;

    if (!url) {
      console.error('No webhook URL provided for action:', action);
      return;
    }

    const payload = {
      ...action.data.payload,
      message: result.variables.message || '',
      variables: result.variables,
      timestamp: new Date().toISOString()
    };

    const webhookCall = {
      url,
      method,
      payload,
      response: undefined
    };

    // Execute webhook with retry logic
    let lastError: string | null = null;
    for (let attempt = 1; attempt <= retryAttempts + 1; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Botrix-RuleBot/1.0',
            ...headers
          },
          body: method !== 'GET' ? JSON.stringify(payload) : undefined,
          signal: AbortSignal.timeout(timeout * 1000)
        });

        if (response.ok) {
          const responseData = await response.json();
          webhookCall.response = responseData;
          
          // Update variables with webhook response if specified
          if (action.data.responseVariable) {
            result.variables[action.data.responseVariable] = responseData;
          }
          
          // Set response message if webhook returns one
          if (responseData.message || responseData.response || responseData.text) {
            result.response = responseData.message || responseData.response || responseData.text;
          }
          
          break;
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          if (response.status < 500) break; // Don't retry on client errors
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt <= retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (lastError) {
      console.error(`Webhook failed after ${retryAttempts + 1} attempts:`, lastError);
    }

    result.webhookCalls!.push(webhookCall);
  }

  /**
   * Create a default rule set for common use cases
   */
  createDefaultRules(): BotRule[] {
    return [
      {
        id: 'greeting',
        name: 'Greeting Response',
        conditions: [
          {
            field: 'message',
            operator: 'contains',
            value: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
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
      },
      {
        id: 'farewell',
        name: 'Farewell Response',
        conditions: [
          {
            field: 'message',
            operator: 'contains',
            value: ['bye', 'goodbye', 'see you', 'thank you', 'thanks'],
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'send_message',
            data: { message: 'Thank you for chatting with us! Have a great day!' },
            order: 1
          }
        ],
        priority: 1,
        isActive: true
      },
      {
        id: 'help',
        name: 'Help Request',
        conditions: [
          {
            field: 'message',
            operator: 'contains',
            value: ['help', 'support', 'assist'],
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'send_message',
            data: { message: 'I\'m here to help! What would you like to know?' },
            order: 1
          }
        ],
        priority: 2,
        isActive: true
      }
    ];
  }

  /**
   * Validate rule configuration
   */
  validateRule(rule: BotRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim() === '') {
      errors.push('Rule name is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // Validate conditions
    rule.conditions?.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index + 1}: Field is required`);
      }
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      if (condition.value === undefined || condition.value === null) {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    // Validate actions
    rule.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push(`Action ${index + 1}: Type is required`);
      }
      if (action.order === undefined || action.order < 0) {
        errors.push(`Action ${index + 1}: Order must be a non-negative number`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const ruleBasedBotService = new RuleBasedBotService();
