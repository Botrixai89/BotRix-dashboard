import dbConnect from './mongodb';
import Bot from '@/models/Bot';

export interface FlowNode {
  id: string;
  type: 'message' | 'question' | 'condition' | 'action' | 'handover' | 'input' | 'api_call';
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
    options?: string[];
    variable?: string;
    apiUrl?: string;
    apiMethod?: string;
    apiHeaders?: Record<string, string>;
    conditions?: Condition[];
    actions?: Action[];
  };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
  };
}

export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
  label?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface Condition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
}

export interface Action {
  type: 'set_variable' | 'send_email' | 'webhook' | 'redirect';
  data: Record<string, any>;
}

export interface BotFlow {
  _id: string;
  botId: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  variables: Variable[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  description?: string;
}

export class BotBuilderService {
  /**
   * Create a new bot flow
   */
  async createFlow(botId: string, flowData: Partial<BotFlow>): Promise<BotFlow> {
    await dbConnect();

    const flow = new BotFlow({
      botId,
      nodes: flowData.nodes || this.getDefaultNodes(),
      connections: flowData.connections || [],
      variables: flowData.variables || [],
      isActive: false,
      version: 1
    });

    return await flow.save();
  }

  /**
   * Get default nodes for a new flow
   */
  getDefaultNodes(): FlowNode[] {
    return [
      {
        id: 'start',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          title: 'Welcome Message',
          content: 'Hello! How can I help you today?'
        },
        style: {
          backgroundColor: '#10b981',
          borderColor: '#059669',
          color: '#ffffff'
        }
      },
      {
        id: 'fallback',
        type: 'message',
        position: { x: 100, y: 300 },
        data: {
          title: 'Fallback Message',
          content: "I'm sorry, I didn't understand that. Can you please rephrase?"
        },
        style: {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          color: '#ffffff'
        }
      }
    ];
  }

  /**
   * Get flow by bot ID
   */
  async getFlow(botId: string): Promise<BotFlow | null> {
    await dbConnect();
    return await BotFlow.findOne({ botId }).sort({ version: -1 });
  }

  /**
   * Update flow
   */
  async updateFlow(botId: string, flowData: Partial<BotFlow>): Promise<BotFlow> {
    await dbConnect();

    const existingFlow = await this.getFlow(botId);
    if (!existingFlow) {
      throw new Error('Flow not found');
    }

    // Create new version
    const newFlow = new BotFlow({
      botId,
      nodes: flowData.nodes || existingFlow.nodes,
      connections: flowData.connections || existingFlow.connections,
      variables: flowData.variables || existingFlow.variables,
      isActive: flowData.isActive !== undefined ? flowData.isActive : existingFlow.isActive,
      version: existingFlow.version + 1
    });

    return await newFlow.save();
  }

  /**
   * Activate/deactivate flow
   */
  async toggleFlow(botId: string, isActive: boolean): Promise<BotFlow> {
    await dbConnect();

    const flow = await this.getFlow(botId);
    if (!flow) {
      throw new Error('Flow not found');
    }

    flow.isActive = isActive;
    return await flow.save();
  }

  /**
   * Validate flow structure
   */
  validateFlow(nodes: FlowNode[], connections: FlowConnection[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    connections.forEach(conn => {
      connectedNodeIds.add(conn.source);
      connectedNodeIds.add(conn.target);
    });

    nodes.forEach(node => {
      if (!connectedNodeIds.has(node.id) && node.id !== 'start') {
        warnings.push(`Node "${node.data.title}" is not connected`);
      }
    });

    // Check for cycles
    if (this.hasCycle(nodes, connections)) {
      errors.push('Flow contains cycles which are not allowed');
    }

    // Check for unreachable nodes
    const reachableNodes = this.getReachableNodes(nodes, connections);
    nodes.forEach(node => {
      if (!reachableNodes.has(node.id) && node.id !== 'start') {
        errors.push(`Node "${node.data.title}" is unreachable`);
      }
    });

    // Validate node types
    nodes.forEach(node => {
      if (!this.isValidNodeType(node.type)) {
        errors.push(`Invalid node type: ${node.type}`);
      }
    });

    // Check for required fields
    nodes.forEach(node => {
      if (!node.data.title || !node.data.content) {
        errors.push(`Node "${node.id}" is missing required fields`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if flow has cycles
   */
  private hasCycle(nodes: FlowNode[], connections: FlowConnection[]): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    connections.forEach(conn => {
      const neighbors = graph.get(conn.source) || [];
      neighbors.push(conn.target);
      graph.set(conn.source, neighbors);
    });

    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycleDFS(neighbor)) return true;
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true;
      }
    }

    return false;
  }

  /**
   * Get reachable nodes from start
   */
  private getReachableNodes(nodes: FlowNode[], connections: FlowConnection[]): Set<string> {
    const graph = new Map<string, string[]>();
    
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    connections.forEach(conn => {
      const neighbors = graph.get(conn.source) || [];
      neighbors.push(conn.target);
      graph.set(conn.source, neighbors);
    });

    const reachable = new Set<string>();
    const queue = ['start'];
    reachable.add('start');

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = graph.get(current) || [];

      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return reachable;
  }

  /**
   * Validate node type
   */
  private isValidNodeType(type: string): boolean {
    const validTypes = ['message', 'question', 'condition', 'action', 'handover', 'input', 'api_call'];
    return validTypes.includes(type);
  }

  /**
   * Execute flow logic
   */
  async executeFlow(
    flow: BotFlow,
    userInput: string,
    context: Record<string, any> = {}
  ): Promise<{
    response: string;
    nextNode?: string;
    variables: Record<string, any>;
    actions: Action[];
  }> {
    const variables = { ...context };
    const actions: Action[] = [];

    // Find start node
    const startNode = flow.nodes.find(node => node.id === 'start');
    if (!startNode) {
      return {
        response: "I'm sorry, there was an error processing your request.",
        variables,
        actions
      };
    }

    // Execute flow logic
    let currentNode = startNode;
    let response = '';

    while (currentNode) {
      const result = await this.executeNode(currentNode, userInput, variables);
      response = result.response;
      variables = { ...variables, ...result.variables };
      actions.push(...result.actions);

      // Find next node
      const nextConnection = flow.connections.find(conn => conn.source === currentNode.id);
      if (nextConnection) {
        currentNode = flow.nodes.find(node => node.id === nextConnection.target);
      } else {
        currentNode = null;
      }
    }

    return {
      response,
      variables,
      actions
    };
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: FlowNode,
    userInput: string,
    variables: Record<string, any>
  ): Promise<{
    response: string;
    variables: Record<string, any>;
    actions: Action[];
  }> {
    const actions: Action[] = [];
    let response = '';

    switch (node.type) {
      case 'message':
        response = this.interpolateVariables(node.data.content, variables);
        break;

      case 'question':
        response = this.interpolateVariables(node.data.content, variables);
        break;

      case 'condition':
        const conditionResult = this.evaluateConditions(node.data.conditions || [], userInput, variables);
        response = conditionResult ? 'Condition met' : 'Condition not met';
        break;

      case 'action':
        actions.push(...(node.data.actions || []));
        response = 'Action executed';
        break;

      case 'api_call':
        const apiResult = await this.executeApiCall(node.data, variables);
        response = apiResult.response;
        Object.assign(variables, apiResult.variables);
        break;

      case 'input':
        // Store user input in variable
        if (node.data.variable) {
          variables[node.data.variable] = userInput;
        }
        response = this.interpolateVariables(node.data.content, variables);
        break;

      default:
        response = "I'm sorry, I encountered an error.";
    }

    return { response, variables, actions };
  }

  /**
   * Interpolate variables in text
   */
  private interpolateVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] || match;
    });
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: Condition[],
    userInput: string,
    variables: Record<string, any>
  ): boolean {
    return conditions.every(condition => {
      const value = variables[condition.field] || userInput;
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return value.toLowerCase().includes(condition.value.toLowerCase());
        case 'starts_with':
          return value.toLowerCase().startsWith(condition.value.toLowerCase());
        case 'ends_with':
          return value.toLowerCase().endsWith(condition.value.toLowerCase());
        case 'greater_than':
          return parseFloat(value) > parseFloat(condition.value);
        case 'less_than':
          return parseFloat(value) < parseFloat(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Execute API call
   */
  private async executeApiCall(
    data: any,
    variables: Record<string, any>
  ): Promise<{ response: string; variables: Record<string, any> }> {
    try {
      const url = this.interpolateVariables(data.apiUrl || '', variables);
      const method = data.apiMethod || 'GET';
      const headers = data.apiHeaders || {};

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });

      const result = await response.json();
      
      // Store result in variables
      const newVariables = { ...variables };
      if (data.variable) {
        newVariables[data.variable] = result;
      }

      return {
        response: 'API call successful',
        variables: newVariables
      };
    } catch (error) {
      return {
        response: 'API call failed',
        variables
      };
    }
  }
}

// Export default instance
export const botBuilderService = new BotBuilderService(); 