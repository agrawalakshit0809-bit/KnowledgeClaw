import { useState } from 'react';

interface ModuleRisk {
  module: string;
  owners: string[];
  busFactor: number;
  commits: number;
  risk: 'critical' | 'warning' | 'safe';
}

const modules: ModuleRisk[] = [
  { module: 'Payment Module', owners: ['Akshit'], busFactor: 1, commits: 23, risk: 'critical' },
  { module: 'Authentication', owners: ['Akshit', 'Ishita'], busFactor: 2, commits: 45, risk: 'safe' },
  { module: 'Database Layer', owners: ['Akshit', 'Ishita'], busFactor: 2, commits: 31, risk: 'safe' },
  { module: 'API Gateway', owners: ['Ishita'], busFactor: 1, commits: 18, risk: 'critical' },
  { module: 'Frontend Components', owners: ['Ishita'], busFactor: 1, commits: 12, risk: 'warning' },
  { module: 'Infrastructure', owners: ['Akshit', 'Ishita'], busFactor: 2, commits: 8, risk: 'safe' },
];

const riskConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', label: 'Critical', bar: 'bg-red-500' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', label: 'Warning', bar: 'bg-yellow-500' },
  safe: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', label: 'Safe', bar: 'bg-green-500' },
};

export default function BusFactor() {
  const [selected, setSelected] = useState<ModuleRisk | null>(null);
  const critical = modules.filter(m => m.risk === 'critical').length;
  const warning = modules.filter(m => m.risk === 'warning').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Bus Factor Radar</h1>
        <p className="text-gray-500 text-sm">Knowledge concentration risk across your codebase</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-sm text-red-600 mb-1">Critical Risk</p>
          <p className="text-3xl font-medium text-red-700">{critical}</p>
          <p className="text-xs text-red-500 mt-1">Only 1 person knows this</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-sm text-yellow-600 mb-1">Warning</p>
          <p className="text-3xl font-medium text-yellow-700">{warning}</p>
          <p className="text-xs text-yellow-500 mt-1">Limited knowledge spread</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-green-600 mb-1">Safe</p>
          <p className="text-3xl font-medium text-green-700">{modules.length - critical - warning}</p>
          <p className="text-xs text-green-500 mt-1">2+ people know this</p>
        </div>
      </div>

      {critical > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-red-800">Bus Factor Alert</p>
            <p className="text-xs text-red-600 mt-1">{critical} module(s) have a bus factor of 1. If this person leaves, critical knowledge is lost. Schedule knowledge transfer sessions immediately.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {modules.map(module => {
          const config = riskConfig[module.risk];
          return (
            <div
              key={module.module}
              onClick={() => setSelected(selected?.module === module.module ? null : module)}
              className={`border rounded-xl p-5 cursor-pointer transition-all ${config.bg} ${config.border} ${selected?.module === module.module ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:shadow-md'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900">{module.module}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                  {config.label}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Bus Factor</span>
                  <span>{module.busFactor}/3</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className={`h-2 rounded-full ${config.bar}`} style={{ width: `${(module.busFactor / 3) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                {module.owners.map(o => (
                  <span key={o} className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">{o}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400">{module.commits} commits</p>

              {selected?.module === module.module && module.risk === 'critical' && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                  <p className="text-xs font-medium text-red-700 mb-1">Recommended Action</p>
                  <p className="text-xs text-red-600">Schedule a knowledge transfer session. Ask {module.owners[0]} to document this module in the next sprint.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}