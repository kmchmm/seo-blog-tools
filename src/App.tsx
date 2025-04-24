// src/App.tsx
import { FC, use } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { UserContext } from './context/UserContext';
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

import { TOOLS, TOOL_ROUTES } from './types';
import Unauthorized from './pages/Unauthorized';

const App: FC = () => {
  const { toolsAccess } = use(UserContext);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path={TOOL_ROUTES.NEWS} element={
            toolsAccess.includes(TOOLS.NEWS) ?
            <NewsScraper /> :
            <Unauthorized/>
          } />
          <Route path={TOOL_ROUTES.PAA} element={
            toolsAccess.includes(TOOLS.PAA) ?
            <PAAScraper /> :
            <Unauthorized/>
          } />
          <Route path={TOOL_ROUTES.GMAP} element={
            toolsAccess.includes(TOOLS.GMAP) ?
            <GMAPScraper /> :
            <Unauthorized/>
          } />

          <Route path={TOOL_ROUTES.JEDI_INSIGHTS} element={
            toolsAccess.includes(TOOLS.JEDI_INSIGHTS) ?
            <JediInsights /> :
            <Unauthorized/>
          } />
          <Route path={TOOL_ROUTES.SERP_RANK} element={
            toolsAccess.includes(TOOLS.SERP_RANK) ?
            <SERPRank /> :
            <Unauthorized/>
          } />
          <Route path={TOOL_ROUTES.HUNTER} element={
            toolsAccess.includes(TOOLS.HUNTER) ?
            <Hunter /> :
            <Unauthorized/>
          } />          
          <Route path={TOOL_ROUTES.HARVESTER} element={
            toolsAccess.includes(TOOLS.HARVESTER) ?
            <P1Harvester /> :
            <Unauthorized/>
          } />           

          <Route path={TOOL_ROUTES.CROSS_SITE_POSTING} element={
            toolsAccess.includes(TOOLS.CROSS_SITE_POSTING) ?
            <CrossSitePosting /> :
            <Unauthorized/>
          } />   
          <Route path={TOOL_ROUTES.KOMPASS} element={
            toolsAccess.includes(TOOLS.KOMPASS) ?
            <Kompass /> :
            <Unauthorized/>
          } />
          <Route path={TOOL_ROUTES.LOOM} element={
            toolsAccess.includes(TOOLS.LOOM) ?
            <Loom /> :
            <Unauthorized/>
          } />

          <Route path={TOOL_ROUTES.CHRONOS} element={
            toolsAccess.includes(TOOLS.CHRONOS) ?
            <Chronos /> :
            <Unauthorized/>
          } />
          <Route path={TOOL_ROUTES.MONITORING} element={
            toolsAccess.includes(TOOLS.MONITORING) ?
            <Monitoring /> :
            <Unauthorized/>
          } />

          <Route path={TOOL_ROUTES.CHAT} element={
            toolsAccess.includes(TOOLS.CHAT) ?
            <Chat /> :
            <Unauthorized/>
          } />

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
