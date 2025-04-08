// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';
import NewsScraper from './pages/NewsScraper';
import PAAScraper from './pages/PAAScraper';
import GMAPScraper from './pages/GMAPScraper';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsScraper />} />
          <Route path="/paa" element={<PAAScraper />} />
          <Route path="/gmap" element={<GMAPScraper />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
