import { Bot } from '@/types';

export interface FlowNode {
  node_key: string;
  type: 'SEND_MSG' | 'SEND_IMAGE' | 'RCV_INP' | 'PAUSE_NODE' | 'WEBHOOK' | 'CONDITION' | 'WELCOME';
  node_name: string;
  message?: string;
  prompt?: string;
  variable?: string;
  duration?: number;
  url?: string;
  condition?: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface FlowData {
  root: string;
  nodes: Record<string, FlowNode>;
  edges: Record<string, string[]>;
}

export interface FlowExecutionContext {
  message: string;
  conversationId: string;
  userInfo: any;
  botId: string;
  timestamp: string;
  variables: Record<string, any>;
  currentNode: string;
  visitedNodes: Set<string>;
  maxSteps: number;
  currentStep: number;
}

export interface FlowExecutionResult {
  success: boolean;
  responses: Array<{
    type: 'text' | 'image';
    content: string;
    delay?: number;
  }>;
  variables: Record<string, any>;
  nextNode?: string;
  error?: string;
}

export class FlowExecutor {
  /**
   * Execute a conversation flow based on the visual builder data
   */
  async executeFlow(
    bot: Bot,
    message: string,
    context: Record<string, any> = {}
  ): Promise<FlowExecutionResult> {
    const flowData = bot.settings?.conversationFlows?.paths?.find(
      (path: any) => path.isActive
    )?.flowData;

    if (!flowData) {
      return {
        success: false,
        responses: [],
        variables: context,
        error: 'No active flow found'
      };
    }

    const executionContext: FlowExecutionContext = {
      message,
      conversationId: context.conversationId || '',
      userInfo: context.userInfo || {},
      botId: context.botId || '',
      timestamp: context.timestamp || new Date().toISOString(),
      variables: { ...context },
      currentNode: flowData.root,
      visitedNodes: new Set(),
      maxSteps: 50, // Prevent infinite loops
      currentStep: 0
    };

    return this.executeNode(flowData, executionContext);
  }

  /**
   * Execute a single node in the flow
   */
  private async executeNode(
    flowData: FlowData,
    context: FlowExecutionContext
  ): Promise<FlowExecutionResult> {
    if (context.currentStep >= context.maxSteps) {
      return {
        success: false,
        responses: [],
        variables: context.variables,
        error: 'Maximum execution steps reached'
      };
    }

    if (context.visitedNodes.has(context.currentNode)) {
      return {
        success: false,
        responses: [],
        variables: context.variables,
        error: 'Circular reference detected'
      };
    }

    const node = flowData.nodes[context.currentNode];
    if (!node) {
      return {
        success: false,
        responses: [],
        variables: context.variables,
        error: `Node ${context.currentNode} not found`
      };
    }

    context.visitedNodes.add(context.currentNode);
    context.currentStep++;

    const result: FlowExecutionResult = {
      success: true,
      responses: [],
      variables: context.variables
    };

    try {
      switch (node.type) {
        case 'WELCOME':
          await this.executeWelcomeNode(node, result, context);
          break;
        case 'SEND_MSG':
          await this.executeMessageNode(node, result, context);
          break;
        case 'SEND_IMAGE':
          await this.executeImageNode(node, result, context);
          break;
        case 'RCV_INP':
          await this.executeInputNode(node, result, context);
          break;
        case 'PAUSE_NODE':
          await this.executePauseNode(node, result, context);
          break;
        case 'WEBHOOK':
          await this.executeWebhookNode(node, result, context);
          break;
        case 'CONDITION':
          await this.executeConditionNode(node, result, context, flowData);
          break;
        default:
          result.success = false;
          result.error = `Unknown node type: ${node.type}`;
      }
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Execute welcome node
   */
  private async executeWelcomeNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext
  ): Promise<void> {
    const message = this.interpolateVariables(node.message || 'Welcome!', context.variables);
    result.responses.push({
      type: 'text',
      content: message
    });
  }

  /**
   * Execute message node
   */
  private async executeMessageNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext
  ): Promise<void> {
    const message = this.interpolateVariables(node.message || '', context.variables);
    if (message.trim()) {
      result.responses.push({
        type: 'text',
        content: message
      });
    }
  }

  /**
   * Execute image node
   */
  private async executeImageNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext
  ): Promise<void> {
    const imageUrl = this.interpolateVariables(node.imageUrl || '', context.variables);
    if (imageUrl.trim()) {
      result.responses.push({
        type: 'image',
        content: imageUrl
      });
    }
  }

  /**
   * Execute input node
   */
  private async executeInputNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext
  ): Promise<void> {
    const prompt = this.interpolateVariables(node.prompt || 'Please provide input:', context.variables);
    result.responses.push({
      type: 'text',
      content: prompt
    });

    // Store user input in variables if variable name is specified
    if (node.variable && context.message) {
      context.variables[node.variable] = context.message;
    }
  }

  /**
   * Execute pause node
   */
  private async executePauseNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext
  ): Promise<void> {
    const duration = node.duration || 2;
    result.responses.push({
      type: 'text',
      content: 'Processing...',
      delay: duration * 1000
    });
  }

  /**
   * Execute webhook node
   */
  private async executeWebhookNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext
  ): Promise<void> {
    const url = this.interpolateVariables(node.url || '', context.variables);
    if (!url) {
      result.success = false;
      result.error = 'No webhook URL provided';
      return;
    }

    try {
      const payload = {
        message: context.message,
        variables: context.variables,
        timestamp: context.timestamp,
        userInfo: context.userInfo
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Botrix-FlowBot/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Extract response text from various possible formats
        let responseText = '';
        if (responseData.output) {
          responseText = responseData.output;
        } else if (responseData.message) {
          responseText = responseData.message;
        } else if (responseData.response) {
          responseText = responseData.response;
        } else if (responseData.text) {
          responseText = responseData.text;
        } else if (typeof responseData === 'string') {
          responseText = responseData;
        }

        if (responseText) {
          result.responses.push({
            type: 'text',
            content: responseText
          });
        }

        // Store webhook response in variables
        context.variables[`webhook_response_${node.node_key}`] = responseData;
      } else {
        result.success = false;
        result.error = `Webhook failed: ${response.status} ${response.statusText}`;
      }
    } catch (error) {
      result.success = false;
      result.error = `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(
    node: FlowNode,
    result: FlowExecutionResult,
    context: FlowExecutionContext,
    flowData: FlowData
  ): Promise<void> {
    const condition = node.condition || '';
    const edges = flowData.edges[context.currentNode] || [];
    
    if (!condition || edges.length === 0) {
      // No condition or edges, continue to first edge
      result.nextNode = edges[0];
      return;
    }

    // Simple condition evaluation
    const conditionMet = this.evaluateCondition(condition, context);
    
    if (conditionMet && edges.length > 0) {
      result.nextNode = edges[0]; // True path
    } else if (edges.length > 1) {
      result.nextNode = edges[1]; // False path
    }
  }

  /**
   * Evaluate a condition string
   */
  private evaluateCondition(condition: string, context: FlowExecutionContext): boolean {
    try {
      // Replace variables in condition
      let processedCondition = condition;
      for (const [key, value] of Object.entries(context.variables)) {
        const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, 'g');
        processedCondition = processedCondition.replace(regex, JSON.stringify(value));
      }

      // Replace message variable
      processedCondition = processedCondition.replace(/\{\s*message\s*\}/g, JSON.stringify(context.message));

      // Simple evaluation (be careful with this in production)
      return eval(processedCondition);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Interpolate variables in a string
   */
  private interpolateVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\s*(\w+)\s*\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  }

  /**
   * Get the next node in the flow
   */
  private getNextNode(flowData: FlowData, currentNode: string, conditionResult?: boolean): string | null {
    const edges = flowData.edges[currentNode];
    if (!edges || edges.length === 0) {
      return null;
    }

    if (conditionResult !== undefined && edges.length > 1) {
      return conditionResult ? edges[0] : edges[1];
    }

    return edges[0];
  }

  /**
   * Execute a complete flow path
   */
  async executeFlowPath(
    bot: Bot,
    message: string,
    context: Record<string, any> = {}
  ): Promise<FlowExecutionResult> {
    const flowData = bot.settings?.conversationFlows?.paths?.find(
      (path: any) => path.isActive
    )?.flowData;

    if (!flowData) {
      return {
        success: false,
        responses: [],
        variables: context,
        error: 'No active flow found'
      };
    }

    const executionContext: FlowExecutionContext = {
      message,
      conversationId: context.conversationId || '',
      userInfo: context.userInfo || {},
      botId: context.botId || '',
      timestamp: context.timestamp || new Date().toISOString(),
      variables: { ...context },
      currentNode: flowData.root,
      visitedNodes: new Set(),
      maxSteps: 20, // Limit steps for complete path execution
      currentStep: 0
    };

    const allResponses: Array<{
      type: 'text' | 'image';
      content: string;
      delay?: number;
    }> = [];

    let currentNode: string | null = flowData.root;
    let stepCount = 0;

    while (currentNode && stepCount < executionContext.maxSteps) {
      const nodeResult = await this.executeNode(flowData, {
        ...executionContext,
        currentNode,
        currentStep: stepCount
      });

      if (!nodeResult.success) {
        return nodeResult;
      }

      allResponses.push(...nodeResult.responses);
      executionContext.variables = { ...executionContext.variables, ...nodeResult.variables };

      // Get next node
      const node = flowData.nodes[currentNode];
      if (node?.type === 'CONDITION') {
        const conditionMet = this.evaluateCondition(node.condition || '', executionContext);
        currentNode = this.getNextNode(flowData, currentNode, conditionMet) || null;
      } else {
        currentNode = this.getNextNode(flowData, currentNode) || null;
      }

      stepCount++;
    }

    return {
      success: true,
      responses: allResponses,
      variables: executionContext.variables
    };
  }
}

export const flowExecutor = new FlowExecutor();
