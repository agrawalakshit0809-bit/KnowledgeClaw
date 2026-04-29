import { useState } from 'react';
import { KnowledgeModule } from '../types';

const dummyModules: KnowledgeModule[] = [
  { name: 'Authentication', entries: 12, contributors: ['Akshit', 'Ishita'], lastUpdated: '2 days ago', riskLevel: 'low' },
  { name: 'Payment Module', entries: 3, contributors: ['Akshit'], lastUpdated: '5 days ago', riskLevel: 'high' },
  { name: 'Database Layer', entries: 8, contributors: ['Akshit', 'Ishita'], lastUpdated: '1 day ago', riskLevel: 'low' },
  { name: 'API Gateway', entries: 5, contributors: ['Ishita'], lastUpdated: '3 days ago', riskLevel: 'medium' },
  { name: 'Frontend Components', entries: 2, contributors: ['Ishita'], lastUpdated: '1 week ago', riskLevel: 'high' },
  { name: 'Infrastructure', entries: 7, contributors: ['Akshit', 'Ishita'], lastUpdated: '4 days ago', riskLevel: 'low' },
];

const riskColors = {
  low: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Healthy' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Moderate' },
  high: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'At Risk' },
};

export default function KnowledgeMap() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filtered = dummyModules.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.riskLevel === filter;
    return matchSearch && matchFilter;
  });

  const total = dummyModules.length;
  const atRisk = dummyModules.filter(m => m.riskLevel === 'high').length;
  const totalEntries = dummyModules.reduce((a, b) => a + b.entries, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Knowledge Map</h1>
        <p className="text-gray-500 text-sm">Team's institutional memory across all modules</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">Total Modules</p>
          <p className="text-3xl font-medium text-gray-900">{total}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-red-600 mb-1">At Risk</p>
          <p className="text-3xl font-medium text-red-700">{atRisk}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 mb-1">Knowledge Entries</p>
          <p className="text-3xl font-medium text-blue-700">{totalEntries}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search modules..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 focus:outline-none focus:border-blue-400"
        />
        {(['all', 'low', 'medium', 'high'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(module => {
          const risk = riskColors[module.riskLevel];
          return (
            <div key={module.name} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900">{module.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${risk.bg} ${risk.text}`}>
                  {risk.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>{module.entries} entries</span>
                <span>Updated {module.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Contributors:</span>
                {module.contributors.map(c => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
              {module.riskLevel === 'high' && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  Bus factor: 1 — Only one person knows this module
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}