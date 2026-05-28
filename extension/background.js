importScripts('classifier.js');

const COMPANION_URL = 'http://localhost:3847';
const MIN_DWELL_MS = 30000; // 30 seconds
const FLUSH_INTERVAL_MS = 3600000; // 1 hour

// Track active tab timing
let activeTab = { tabId: null, url: null, title: null, startTime: null };
let signals = [];

// --- Tab tracking ---

function finalizeActiveTab() {
  if (!activeTab.tabId || !activeTab.url || !activeTab.startTime) return;

  const timeSpent = Math.round((Date.now() - activeTab.startTime) / 1000);
  if (timeSpent < MIN_DWELL_MS / 1000) return;

  let domain;
  try {
    domain = new URL(activeTab.url).hostname.replace(/^www\./, '');
  } catch {
    return;
  }

  const category = classifyUrl(activeTab.url, activeTab.title);
  if (category === 'skip') return;

  signals.push({
    url: activeTab.url,
    title: activeTab.title || '',
    domain,
    category,
    timeSpent,
    timestamp: new Date().toISOString()
  });

  // Persist signals to storage
  chrome.storage.local.set({ signals });
}

function startTracking(tabId, url, title) {
  finalizeActiveTab();
  activeTab = { tabId, url, title, startTime: Date.now() };
}

// Tab activated (switched to)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const paused = (await chrome.storage.local.get('paused')).paused;
  if (paused) return;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      startTracking(tab.id, tab.url, tab.title);
    }
  } catch {
    // Tab may have closed
  }
});

// Tab updated (URL change in current tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const paused = (await chrome.storage.local.get('paused')).paused;
  if (paused) return;

  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    startTracking(tabId, tab.url, tab.title);
  }
});

// Window focus changed
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    finalizeActiveTab();
    activeTab = { tabId: null, url: null, title: null, startTime: null };
    return;
  }

  const paused = (await chrome.storage.local.get('paused')).paused;
  if (paused) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab && tab.url) {
      startTracking(tab.id, tab.url, tab.title);
    }
  } catch {
    // No active tab
  }
});

// --- Flush signals to companion ---

async function flushSignals() {
  // Finalize current tab first
  finalizeActiveTab();
  if (activeTab.tabId) {
    activeTab.startTime = Date.now(); // Reset timer for current tab
  }

  // Get signals from storage (in case service worker was restarted)
  const stored = (await chrome.storage.local.get('signals')).signals || [];
  const toFlush = [...stored, ...signals.filter(s => !stored.includes(s))];

  if (toFlush.length === 0) return;

  try {
    const res = await fetch(`${COMPANION_URL}/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signals: toFlush })
    });

    if (res.ok) {
      signals = [];
      await chrome.storage.local.set({ signals: [] });
    }
  } catch {
    // Companion not running — signals stay in local storage
  }
}

// Set up hourly alarm for flushing
chrome.alarms.create('flush-signals', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush-signals') {
    flushSignals();
  }
});

// Restore signals from storage on startup
chrome.storage.local.get('signals', (result) => {
  if (result.signals) {
    signals = result.signals;
  }
});
