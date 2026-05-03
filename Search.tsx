import { useState } from 'react';

interface Source {
  decision: string;
  rationale: string;
  module: string;
  author: string;
  source: string;
}

const suggestions = ['Why JWT?', 'Payment webhook', 'Database choice', 'Groq API'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('http://localhost:5001/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Backend not running. Start: python src/query_api.py');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Search Knowledge</h1>
        <p className="text-gray-500 text-sm">Ask anything — powered by ChromaDB + Groq AI</p>
      </div>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder='e.g. "Why JWT?" or "payment webhook issue"'
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
        />
        <button onClick={handleSearch} disabled={loading}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
          {loading ? 'Searching...' : 'Ask'}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-8">
        {suggestions.map(s => (
          <button key={s} onClick={() => setQuery(s)}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200">
            {s}
          </button>
        ))}
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>}
      {loading && <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Searching knowledge base...</div>}
      {result && !loading && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">AI Answer</span>
              <span className="text-xs text-gray-400">{result.total_found} source(s) found</span>
            </div>
            <p className="text-gray-800 leading-relaxed">{result.answer}</p>
          </div>
          {result.sources?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Sources</p>
              {result.sources.map((src: Source, i: number) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-2">
                  <p className="text-sm font-medium text-gray-800 mb-1">{src.decision}</p>
                  <p className="text-xs text-gray-500 mb-2">{src.rationale}</p>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{src.module}</span>
                    <span>{src.author}</span>
                    <span>{src.source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!searched && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-200 text-5xl mb-4">🧠</p>
          <p className="text-gray-400 text-sm">Your team's institutional memory, instantly searchable</p>
        </div>
      )}
    </div>
  );
}