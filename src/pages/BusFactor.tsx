import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

interface ModuleRisk {
  module: string;
  owners: string[];
  busFactor: number;
  commits: number;
  risk: "critical" | "warning" | "safe";
  recommendation: string;
}

const riskConfig = {
  critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", label: "Critical", bar: "bg-red-500" },
  warning: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", label: "Warning", bar: "bg-yellow-500" },
  safe: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-800", label: "Safe", bar: "bg-green-500" },
};

export default function BusFactor() {
  const [modules, setModules] = useState<ModuleRisk[]>([]);
  const [selected, setSelected] = useState<ModuleRisk | null>(null);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiGet("/bus-factor")
      .then(data => {
        setError("");
        const live = data.modules.map((m: any) => ({
          module: m.module,
          owners: [m.primary_owner],
          busFactor: m.contributors,
          commits: m.memory_entries,
          risk: m.risk === "high" ? "critical" : m.risk === "medium" ? "warning" : "safe",
          recommendation: m.recommendation,
        }));
        setModules(live);
      })
      .catch(err => setError("API error: " + err.message));
  }, []);

  const simulateChange = async () => {
    setSending(true);
    setError("");
    setAlert(null);

    try {
      const data = await apiPost("/simulate-change", {
        file: "auth/middleware.js",
      });
      setAlert(data);
    } catch (err: any) {
      setError("API error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const critical = modules.filter(m => m.risk === "critical").length;
  const warning = modules.filter(m => m.risk === "warning").length;
  const safe = modules.length - critical - warning;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Bus Factor Radar</h1>
          <p className="text-gray-500 text-sm">Live ownership risk from KnowledgeClaw memory</p>
        </div>

        <button
          onClick={simulateChange}
          disabled={sending}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {sending ? "Sending alert..." : "Simulate Risky Auth Change"}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      {alert && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <p className="font-medium">KnowledgeClaw Alert Generated</p>
          <p className="mt-1">{alert.warning}</p>
          <p className="mt-2 text-xs">
            WhatsApp: {alert.whatsapp_sent ? "sent successfully" : alert.whatsapp_status}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-sm text-red-600 mb-1">Critical Risk</p>
          <p className="text-3xl font-medium text-red-700">{critical}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-sm text-yellow-600 mb-1">Warning</p>
          <p className="text-3xl font-medium text-yellow-700">{warning}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-green-600 mb-1">Safe</p>
          <p className="text-3xl font-medium text-green-700">{safe}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {modules.map(module => {
          const config = riskConfig[module.risk];

          return (
            <div
              key={module.module}
              onClick={() => setSelected(selected?.module === module.module ? null : module)}
              className={`border rounded-xl p-5 cursor-pointer transition-all ${config.bg} ${config.border} ${
                selected?.module === module.module ? "ring-2 ring-offset-1 ring-gray-400" : "hover:shadow-md"
              }`}
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
                  <div className={`h-2 rounded-full ${config.bar}`} style={{ width: `${(Math.min(module.busFactor, 3) / 3) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                {module.owners.map(owner => (
                  <span key={owner} className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                    {owner}
                  </span>
                ))}
              </div>

              <p className="text-xs text-gray-400">{module.commits} memory entries</p>

              {selected?.module === module.module && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-800 mb-1">Recommended Action</p>
                  <p className="text-xs text-gray-600">{module.recommendation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}