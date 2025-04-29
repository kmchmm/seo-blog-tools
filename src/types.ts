export enum IBtnType {
  PRIMARY = 'primary',
  PAGINATION = 'pagination',
  SEARCH = 'search',
  GENERATE = 'generate',
}

export enum TOOL_ROUTES {
  NEWS = '/scrape/news',
  PAA = '/scrape/paa',
  GMAP = '/scrape/gmap',

  JEDI_INSIGHTS = '/seo/jedi-insights',
  SERP_RANK = '/seo/serp-checker',
  HUNTER = '/seo/hunter',
  HARVESTER = '/seo/harvester',
  GEO_TAGGER = '/seo/geo-tagger',

  CROSS_SITE_POSTING = '/publishing/cross-site-posting',
  KOMPASS = '/publishing/text-kompass',
  LOOM = '/publishing/link-loom',

  CHRONOS = '/hr/chronos/admin',
  MONITORING = '/hr/hub/monitoring',

  CHAT = '/extra/chat-app',

  TITLE_TWEAK = '/publishing/lexi-tweak',
  HTML_CLEANER = '/publishing/html-cleaner',
  DUPE_KILLER = '/publishing/dupe-killer',
}

// as recorded in supabase
export enum TOOLS {
  NEWS = 'octo-news-scraper',
  PAA = 'octo-gpaa-scraper',
  GMAP = 'octo-gmaps-scraper',

  JEDI_INSIGHTS = 'jedi-insights',
  SERP_RANK = 'clair',
  HUNTER = 'hunter',
  HARVESTER = 'harvester',

  CROSS_SITE_POSTING = 'cross-site-poster',
  KOMPASS = 'kompass',
  LOOM = 'loom',

  CHRONOS = 'hr-chronos-admin',
  MONITORING = 'hr-hub-monitoring',

  CHAT = 'chat-app',

  TITLE_TWEAK = 'lexi-tweak',
  HTML_CLEANER = 'html-cleaner',
  DUPE_KILLER = 'dupe-killer',
}

export interface scrapeData {
  address: string;
  county: string;
  details: string;
  phone_number: string;
  rating: string;
  rating_count: string;
  title: string;
  type: string;
  website: string;
}

export interface modifiedScrapeData extends scrapeData {
  id: string;
}

export interface MapRecordProps extends modifiedScrapeData {
  loading: boolean;
  deleteGMapRequest: Function;
}
