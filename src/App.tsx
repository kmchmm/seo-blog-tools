import { FC, JSX, use } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { UserContext } from './context/UserContext';
import Layout from './pages/Layout';

import { TOOLS, TOOL_ROUTES } from './types';
import {
  ChatPage,
  ChronosPage,
  CrossSitePostingPage,
  DupeKillerPage,
  GeoTaggerPage,
  GMAPScraperPage,
  HomePage,
  HtmlCleanerPage,
  HunterPage,
  JediInsightsPage,
  KompassPage,
  LoginPage,
  LogoutPage,
  LoomPage,
  MonitoringPage,
  NewsScraperPage,
  P1HarvesterPage,
  PAAScraperPage,
  SERPRankPage,
  TitleTweakPage,
  UnauthorizedPage,
} from './pages';

interface ToolRoute {
  path: string;
  toolKey: keyof typeof TOOLS;
  element: JSX.Element;
}

const App: FC = () => {
  const { toolsAccess } = use(UserContext);

  const toolRoutes: ToolRoute[] = [
    { path: TOOL_ROUTES.NEWS, toolKey: 'NEWS', element: <NewsScraperPage /> },
    { path: TOOL_ROUTES.PAA, toolKey: 'PAA', element: <PAAScraperPage /> },
    { path: TOOL_ROUTES.GMAP, toolKey: 'GMAP', element: <GMAPScraperPage /> },
    {
      path: `${TOOL_ROUTES.GMAP}/:recordId`,
      toolKey: 'GMAP',
      element: <GMAPScraperPage />,
    },
    {
      path: TOOL_ROUTES.JEDI_INSIGHTS,
      toolKey: 'JEDI_INSIGHTS',
      element: <JediInsightsPage />,
    },
    { path: TOOL_ROUTES.SERP_RANK, toolKey: 'SERP_RANK', element: <SERPRankPage /> },
    { path: TOOL_ROUTES.HUNTER, toolKey: 'HUNTER', element: <HunterPage /> },
    { path: TOOL_ROUTES.HARVESTER, toolKey: 'HARVESTER', element: <P1HarvesterPage /> },
    {
      path: TOOL_ROUTES.CROSS_SITE_POSTING,
      toolKey: 'CROSS_SITE_POSTING',
      element: <CrossSitePostingPage />,
    },
    { path: TOOL_ROUTES.KOMPASS, toolKey: 'KOMPASS', element: <KompassPage /> },
    { path: TOOL_ROUTES.LOOM, toolKey: 'LOOM', element: <LoomPage /> },
    { path: TOOL_ROUTES.CHRONOS, toolKey: 'CHRONOS', element: <ChronosPage /> },
    { path: TOOL_ROUTES.MONITORING, toolKey: 'MONITORING', element: <MonitoringPage /> },
    { path: TOOL_ROUTES.CHAT, toolKey: 'CHAT', element: <ChatPage /> },
  ];

  const isAuthorized = (tool: keyof typeof TOOLS) => toolsAccess.includes(TOOLS[tool]);

  return (
    <Router basename="/frontend-v2">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />

          {/*  Private tool routes */}
          {toolRoutes.map(({ path, toolKey, element }) => (
            <Route
              key={path}
              path={path}
              element={isAuthorized(toolKey) ? element : <UnauthorizedPage />}
            />
          ))}

          {/*  Public tool routes */}
          <Route path={TOOL_ROUTES.GEO_TAGGER} element={<GeoTaggerPage />} />
          <Route path={TOOL_ROUTES.TITLE_TWEAK} element={<TitleTweakPage />} />
          <Route path={TOOL_ROUTES.HTML_CLEANER} element={<HtmlCleanerPage />} />
          <Route path={TOOL_ROUTES.DUPE_KILLER} element={<DupeKillerPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
