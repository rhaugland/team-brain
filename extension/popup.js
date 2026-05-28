const COMPANION_URL = 'http://localhost:3847';

const statusText = document.getElementById('status-text');
const toggleBtn = document.getElementById('toggle-btn');
const signalCount = document.getElementById('signal-count');
const extractBtn = document.getElementById('extract-btn');
const lastExtraction = document.getElementById('last-extraction');

async function updateUI() {
  // Get paused state
  const { paused } = await chrome.storage.local.get('paused');
  statusText.textContent = paused ? 'Paused' : 'Tracking';
  statusText.className = paused ? 'paused' : 'active';
  toggleBtn.textContent = paused ? 'Resume' : 'Pause';

  // Get local signal count
  const { signals } = await chrome.storage.local.get('signals');
  const localCount = (signals || []).length;

  // Try to get companion status
  try {
    const res = await fetch(`${COMPANION_URL}/status`);
    const status = await res.json();
    signalCount.textContent = localCount + status.bufferedSignals;

    if (status.lastExtraction) {
      const date = new Date(status.lastExtraction);
      const timeStr = date.toLocaleString();
      lastExtraction.textContent =
        `Last: ${timeStr} — ${status.lastCounts.skills} skills, ${status.lastCounts.learnings} learnings`;
    }
  } catch {
    signalCount.textContent = localCount;
    lastExtraction.textContent = 'Companion not running';
  }
}

toggleBtn.addEventListener('click', async () => {
  const { paused } = await chrome.storage.local.get('paused');
  await chrome.storage.local.set({ paused: !paused });
  updateUI();
});

extractBtn.addEventListener('click', async () => {
  extractBtn.disabled = true;
  extractBtn.textContent = 'Extracting...';

  try {
    // Flush signals first
    const { signals } = await chrome.storage.local.get('signals');
    if (signals && signals.length > 0) {
      await fetch(`${COMPANION_URL}/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals })
      });
      await chrome.storage.local.set({ signals: [] });
    }

    // Trigger extraction
    const res = await fetch(`${COMPANION_URL}/extract`, { method: 'POST' });
    const result = await res.json();

    extractBtn.textContent = `Done! ${result.skills} skills, ${result.learnings} learnings`;
    setTimeout(() => {
      extractBtn.textContent = 'Extract now';
      extractBtn.disabled = false;
      updateUI();
    }, 3000);
  } catch {
    extractBtn.textContent = 'Failed — companion not running';
    setTimeout(() => {
      extractBtn.textContent = 'Extract now';
      extractBtn.disabled = false;
    }, 3000);
  }
});

updateUI();
