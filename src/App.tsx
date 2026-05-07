import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import KnowledgeMap from './pages/KnowledgeMap';
import BusFactor from './pages/BusFactor';
import Search from './pages/Search';

function Navbar() {
  const location = useLocation();
  const links = [
    { to: '/', label: 'Knowledge Map' },
    { to: '/bus-factor', label: 'Bus Factor' },
    { to: '/search', label: 'Search' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 px-8 py-0 flex items-center gap-8 h-14 sticky top-0 z-10">
      <span className="font-semibold text-gray-900 text-base mr-4">🦞 KnowledgeClaw</span>
      <div className="flex items-center gap-1 h-full">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 h-full flex items-center text-sm border-b-2 transition-colors ${
              location.pathname === link.to
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-xs text-gray-400">Live</span>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<KnowledgeMap />} />
          <Route path="/bus-factor" element={<BusFactor />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}