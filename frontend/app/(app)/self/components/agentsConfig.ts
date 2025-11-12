export type InformationType = 
  | 'Payment'
  | 'Menus'
  | 'Inventory'
  | 'Customer Hub'
  | 'Loyalty'
  | 'Live Report Hub'
  | 'Activities';

export type KnowledgeType = 
  | 'Help Centre';

export interface AgentDetails {
  name: string;
  type: string;
  agentId: string;
  agentAliasId: string;
  knowledgeBase: InformationType[];
  knowledge: KnowledgeType[];
  model: string;
  activeAgents: number;
}

export interface AgentsContextType {
  agents: Record<string, AgentDetails>;
  addAgent: (agent: AgentDetails) => Promise<void>;
  updateAgent: (name: string, agent: AgentDetails) => Promise<void>;
  deleteAgent: (name: string) => Promise<void>;
}

export const AGENT_CONFIG: Record<string, AgentDetails> = {
  'George': {
    name: 'George',
    type: 'Research Analyst',
    agentId: 'B6GA2N90WU',
    agentAliasId: 'VTRJVBOA8A',
    knowledgeBase: [ 
      'Payment',
      'Menus',
      'Live Report Hub',
      'Customer Hub', 
      'Activities', 
      'Loyalty'
    ],
    knowledge: [],
    model: 'Claude 3.5',
    activeAgents: 3
  },
  'Michael': {
    name: 'Michael',
    type: 'Research Analyst',
    agentId: '3DC67HTC0L',
    agentAliasId: 'QK4FGMU7CQ',
    knowledgeBase: [],
    knowledge: ['Help Centre'],
    model: 'Claude 3.5',
    activeAgents: 1
  },  
  'Amanda': {
    name: 'Amanda',
    type: 'Marketing Analyst',
    agentId: 'YPROYWPOF8',
    agentAliasId: 'DWHIOM120B',
    knowledgeBase: [
      'Payment',
      'Menus',
      'Live Report Hub', 
      'Customer Hub', 
      'Activities', 
      'Loyalty'
    ],
    knowledge: [],
    model: 'Claude 3.5',
    activeAgents: 2
  },
  'Jerry': {
    name: 'Jerry',
    type: 'Operation Manager',
    agentId: 'HSHWQNAYKK',
    agentAliasId: 'KSWYAWA2HY',
    knowledgeBase: [
      'Payment', 
      'Activities', 
      'Live Report Hub'
    ],
    knowledge: [],
    model: 'Claude 3.5',
    activeAgents: 4
  },
  'Valyria': {
    name: 'Valyria',
    type: 'CRM Manager',
    agentId: 'Q8RJ94CRDE',
    agentAliasId: 'LKCPTZB2BD',
    knowledgeBase: [
      'Payment', 
      'Menus', 
      'Customer Hub'
    ],
    knowledge: [],
    model: 'Claude 3.5',
    activeAgents: 2
  }
}; 