export interface KnowledgeModule {
  name: string;
  entries: number;
  contributors: string[];
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high';
}