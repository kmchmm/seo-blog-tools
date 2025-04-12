// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';
import NewsScraper from './pages/NewsScraper';
import PAAScraper from './pages/PAAScraper';
import GMAPScraper from './pages/GMAPScraper';
import JediInsights from './pages/JediInsights';
import SERPRank from './pages/SERPRank';
import Hunter from './pages/Hunter';
import P1Harvester from './pages/P1Harvester';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/scrape/news" element={<NewsScraper />} />
          <Route path="/scrape/paa" element={<PAAScraper />} />
          <Route path="/scrape/gmap" element={<GMAPScraper />} />

          <Route path="/seo/jedi-insights" element={<JediInsights />} />
          <Route path="/seo/serp-checker" element={<SERPRank />} />
          <Route path="/seo/hunter" element={<Hunter />} />
          <Route path="/seo/harvester" element={<P1Harvester />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
