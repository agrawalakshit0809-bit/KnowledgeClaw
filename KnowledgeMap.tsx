import { useEffect, useState } from "react";
import { apiGet } from "../api";

const riskColors = {
  low: { bg: "bg-green-100", text: "text-green-800", label: "Healthy" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Moderate" },
  high: { bg: "bg-red-100", text: "text-red-800", label: "At Risk" },
};

export default function KnowledgeMap() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [modules, setModules] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [map, bus] = await Promise.all([
          apiGet("/knowledge-map"),
          apiGet("/bus-factor"),
        ]);

        const riskByModule = new Map(
          bus.modules.map((m: any) => [m.module, m])
        );

        const liveModules = map.nodes
          .filter((n: any) => n.type === "module")
          .map((n: any) => {
            const links = map.links.filter((l: any) => l.source === n.id);
            const risk = riskByModule.get(n.id) as any;
            return {
              name: n.id,
              entries: n.count,
              contributors: links.map((l: any) => l.target),
              riskLevel: risk?.risk || "low",
              lastUpdated: "Live memory",
            };
          });

        setModules(liveModules);
      } catch (err: any) {
        setError(err.message);
      }
    }

    load();
  }, []);

  const filtered = modules.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.riskLevel === filter;
    return matchSearch && matchFilter;
  });

  const total = modules.length;
  const atRisk = modules.filter(m => m.riskLevel === "high").length;
  const totalEntries = modules.reduce((a, b) => a + b.entries, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Knowledge Map</h1>
        <p className="text-gray-500 text-sm">Live team memory from ChromaDB</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">API error: {error}</div>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4"><p className="text-sm text-gray-500 mb-1">Total Modules</p><p className="text-3xl font-medium">{total}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-sm text-red-600 mb-1">At Risk</p><p className="text-3xl font-medium text-red-700">{atRisk}</p></div>
        <div className="bg-blue-50 rounded-xl p-4"><p className="text-sm text-blue-600 mb-1">Knowledge Entries</p><p className="text-3xl font-medium text-blue-700">{totalEntries}</p></div>
      </div>

      <div className="flex gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search modules..." className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1" />
        {(["all", "low", "medium", "high"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize ${filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>{f}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(module => {
          const risk = riskColors[module.riskLevel as keyof typeof riskColors];
          return (
            <div key={module.name} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between mb-3">
                <h3 className="font-medium text-gray-900">{module.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${risk.bg} ${risk.text}`}>{risk.label}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{module.entries} memory entries · {module.lastUpdated}</p>
              <div className="flex gap-2 flex-wrap">
                {module.contributors.map((c: string) => <span key={c} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{c}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}