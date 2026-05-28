const KEEP_DOMAINS = [
  'github.com', 'gitlab.com', 'bitbucket.org', 'codepen.io', 'codesandbox.io',
  'stackoverflow.com', 'stackexchange.com',
  'developer.mozilla.org', 'mdn.io',
  'npmjs.com', 'pypi.org', 'crates.io',
  'udemy.com', 'coursera.org', 'egghead.io', 'frontendmasters.com',
  'medium.com', 'dev.to', 'hashnode.dev'
];

const KEEP_DOMAIN_PREFIXES = ['docs.', 'developer.', 'api.', 'learn.', 'wiki.'];

const KEEP_URL_PATTERNS = ['/docs/', '/api/', '/reference/', '/guide/', '/tutorial/', '/getting-started/', '/quickstart/', '/handbook/'];

const SKIP_DOMAINS = [
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com',
  'mail.google.com', 'outlook.com', 'outlook.live.com',
  'amazon.com', 'ebay.com', 'etsy.com',
  'netflix.com', 'hulu.com', 'disneyplus.com', 'spotify.com',
  'cnn.com', 'foxnews.com', 'bbc.com', 'nytimes.com',
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'venmo.com',
  'google.com/search'
];

const YOUTUBE_TECH_KEYWORDS = [
  'tutorial', 'programming', 'coding', 'developer', 'javascript', 'python',
  'react', 'node', 'api', 'database', 'deploy', 'docker', 'kubernetes',
  'aws', 'cloud', 'devops', 'typescript', 'rust', 'go ', 'golang',
  'machine learning', 'ai ', 'frontend', 'backend', 'fullstack',
  'web dev', 'software', 'engineer', 'architecture', 'system design',
  'nextjs', 'next.js', 'vue', 'angular', 'svelte', 'tailwind',
  'postgres', 'mongodb', 'redis', 'graphql', 'rest api', 'microservice'
];

const REDDIT_PROGRAMMING_SUBS = [
  '/r/programming', '/r/webdev', '/r/javascript', '/r/reactjs', '/r/node',
  '/r/python', '/r/rust', '/r/golang', '/r/devops', '/r/aws',
  '/r/typescript', '/r/nextjs', '/r/sveltejs', '/r/learnprogramming',
  '/r/cscareerquestions', '/r/ExperiencedDevs'
];

function classifyUrl(url, title) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return 'skip';
  }

  const domain = parsed.hostname.replace(/^www\./, '');
  const pathname = parsed.pathname.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Check skip list first
  for (const skip of SKIP_DOMAINS) {
    if (skip.includes('/')) {
      if ((domain + pathname).includes(skip)) return 'skip';
    } else {
      if (domain === skip || domain.endsWith('.' + skip)) return 'skip';
    }
  }

  // Reddit: only keep programming subreddits
  if (domain === 'reddit.com' || domain.endsWith('.reddit.com')) {
    for (const sub of REDDIT_PROGRAMMING_SUBS) {
      if (pathname.startsWith(sub.toLowerCase())) return 'code-platform';
    }
    return 'skip';
  }

  // YouTube: only keep tech-related
  if (domain === 'youtube.com' || domain === 'youtu.be') {
    for (const keyword of YOUTUBE_TECH_KEYWORDS) {
      if (lowerTitle.includes(keyword)) return 'video-learning';
    }
    return 'skip';
  }

  // LinkedIn: only keep articles
  if (domain === 'linkedin.com' || domain.endsWith('.linkedin.com')) {
    if (pathname.startsWith('/pulse/') || pathname.startsWith('/posts/')) return 'unknown';
    return 'skip';
  }

  // Check keep domains
  for (const keep of KEEP_DOMAINS) {
    if (domain === keep || domain.endsWith('.' + keep)) return 'code-platform';
  }

  // Check domain prefixes (docs.*, developer.*, etc.)
  for (const prefix of KEEP_DOMAIN_PREFIXES) {
    if (domain.startsWith(prefix)) return 'technical-docs';
  }

  // Check URL patterns
  for (const pattern of KEEP_URL_PATTERNS) {
    if (pathname.includes(pattern)) return 'technical-docs';
  }

  return 'unknown';
}

// Export for use in background.js (service worker importScripts)
if (typeof module !== 'undefined') {
  module.exports = { classifyUrl };
}
