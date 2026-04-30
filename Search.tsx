import { useState } from 'react';

interface KnowledgeEntry {
  id: string;
  decision: string;
  rationale: string;
  module: string;
  author: string;
  date: string;
  source: string;
  impact: 'high' | 'medium' | 'low';
}

const dummyEntries: KnowledgeEntry[] = [
  { id: '1', decision: 'Use JWT for authentication over sessions', rationale: 'Mobile team needed stateless auth across multiple services. Sessions rejected due to sticky session complexity on load balancer.', module: 'Authentication', author: 'Akshit', date: '2025-10-14', source: 'PR #31', impact: 'high' },
  { id: '2', decision: 'PostgreSQL chosen over MongoDB', rationale: 'Data has strong relational structure. ACID compliance needed for payment records. MongoDB rejected as overkill for current scale.', module: 'Database Layer', author: 'Ishita', date: '2025-09-02', source: 'PR #12', impact: 'high' },
  { id: '3', decision: 'Groq API over OpenAI for AI inference', rationale: 'Free tier sufficient for MVP. 10x faster inference. Can switch to OpenAI when scaling.', module: 'API Gateway', author: 'Akshit', date: '2025-11-20', source: 'commit a3f2c', impact: 'medium' },
  { id: '4', decision: 'Webhook deduplication using idempotency keys', rationale: 'Payment webhooks were firing twice causing duplicate charges. Fixed with Redis-based idempotency key check.', module: 'Payment Module', author: 'Akshit', date: '2025-12-01', source: 'PR #58', impact: 'high' },
  { id: '5', decision: 'ChromaDB for vector storage over Pinecone', rationale: 'Runs locally with no cost. Sufficient for current scale. Pinecone adds $70/month with no benefit at this stage.', module: 'Infrastructure', author: 'Ishita', date: '2026-01-15', source: 'PR #71', impact: 'medium' },
];

const impactColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeEntry[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    setTimeout(() => {
      const filtered = dummyEntries.filter(e =>
        e.decision.toLowerCase().includes(query.toLowerCase()) ||
        e.rationale.toLowerCase().includes(query.toLowerCase()) ||
        e.module.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Search Knowledge</h1>
        <p className="text-gray-500 text-sm">Ask anything about your codebase decisions</p>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder='Try: "why JWT?" or "payment webhook" or "database choice"'
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
        />
        <button
          onClick={handleSearch}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Search
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        {['Why JWT?', 'Payment issue', 'Database decision', 'Groq API'].map(suggestion => (
          <button
            key={suggestion}
            onClick={() => { setQuery(suggestion); }}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">Searching knowledge base...</div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No knowledge entries found for "{query}"</p>
          <p className="text-gray-300 text-xs mt-1">Try different keywords</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          {results.map(entry => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900 flex-1 pr-4">{entry.decision}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${impactColors[entry.impact]}`}>
                  {entry.impact} impact
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{entry.rationale}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{entry.module}</span>
                <span>{entry.author}</span>
                <span>{entry.source}</span>
                <span>{new Date(entry.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16">
          <p className="text-gray-300 text-4xl mb-4">🔍</p>
          <p className="text-gray-400 text-sm">Search your team's institutional memory</p>
          <p className="text-gray-300 text-xs mt-1">Every decision your team ever made, instantly findable</p>
        </div>
      )}
    </div>
  );
}