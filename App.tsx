import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import KnowledgeMap from './pages/KnowledgeMap';
import BusFactor from './pages/BusFactor';
import Search from './pages/Search';

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav>
          <span>KnowledgeClaw</span>
          <Link to="/">Knowledge Map</Link>
          <Link to="/bus-factor">Bus Factor</Link>
          <Link to="/search">Search</Link>
        </nav>
        <Routes>
          <Route path="/" element={<KnowledgeMap />} />
          <Route path="/bus-factor" element={<BusFactor />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App; 