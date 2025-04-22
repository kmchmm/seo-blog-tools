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
import CrossSitePosting from './pages/CrossSitePosting';
import Kompass from './pages/Kompass';
import Loom from './pages/Loom';
import Chronos from './pages/Chronos';
import Monitoring from './pages/Monitoring';
import Chat from './pages/Chat';
import TitleTweak from './pages/TitleTweak';
import HtmlCleaner from './pages/HtmlCleaner';
import DupeKiller from './pages/DupeKiller';

import Login from './pages/Login';
import Logout from './pages/Logout';

import { TOOL_ROUTES } from './types';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path={TOOL_ROUTES.NEWS} element={<NewsScraper />} />
          <Route path={TOOL_ROUTES.PAA} element={<PAAScraper />} />
          <Route path={TOOL_ROUTES.GMAP} element={<GMAPScraper />} />

          <Route path={TOOL_ROUTES.JEDI_INSIGHTS} element={<JediInsights />} />
          <Route path={TOOL_ROUTES.SERP_RANK} element={<SERPRank />} />
          <Route path={TOOL_ROUTES.HUNTER} element={<Hunter />} />
          <Route path={TOOL_ROUTES.HARVESTER} element={<P1Harvester />} />

          <Route path={TOOL_ROUTES.CROSS_SITE_POSTING} element={<CrossSitePosting />} />
          <Route path={TOOL_ROUTES.KOMPASS} element={<Kompass />} />
          <Route path={TOOL_ROUTES.LOOM} element={<Loom />} />

          <Route path={TOOL_ROUTES.CHRONOS} element={<Chronos />} />
          <Route path={TOOL_ROUTES.MONITORING} element={<Monitoring />} />

          <Route path={TOOL_ROUTES.CHAT} element={<Chat />} />

          <Route path={TOOL_ROUTES.TITLE_TWEAK} element={<TitleTweak />} />
          <Route path={TOOL_ROUTES.HTML_CLEANER} element={<HtmlCleaner />} />
          <Route path={TOOL_ROUTES.DUPE_KILLER} element={<DupeKiller />} />

          <Route path="/logout" element={<Logout />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
