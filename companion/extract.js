const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SKILLS_PATH = path.join(DATA_DIR, 'skills.json');
const LEARNINGS_PATH = path.join(DATA_DIR, 'learnings.json');
const BUFFER_PATH = path.join(DATA_DIR, '.buffer.json');

function deduplicateSkills(existing, newSkills, person) {
  const personSkills = existing
    .filter(s => s.person.toLowerCase() === person.toLowerCase())
    .map(s => s.skill.toLowerCase());

  return newSkills.filter(s => !personSkills.includes(s.skill.toLowerCase()));
}

function deduplicateLearnings(existing, newLearnings) {
  const existingTexts = existing.map(l => l.learning.toLowerCase());
  return newLearnings.filter(l => !existingTexts.includes(l.learning.toLowerCase()));
}

function formatSkillEntry(raw, person, date) {
  return {
    person,
    skill: raw.skill,
    project: 'browsing',
    date,
    source: raw.source
  };
}

function formatLearningEntry(raw, person, date) {
  return {
    learning: raw.learning,
    context: raw.context,
    project: 'browsing',
    person,
    date,
    importance: raw.importance
  };
}

function getPerson() {
  try {
    return execSync('git config user.name', { encoding: 'utf-8' }).trim();
  } catch {
    return execSync('whoami', { encoding: 'utf-8' }).trim();
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

const EXTRACTION_PROMPT = `You are analyzing one day of browsing activity for a consulting team member.
Their name is: {person}
Today's date is: {date}

Here are their browsing signals (filtered to likely work-related content):

{signals}

From these signals, extract:

1. SKILLS — technologies, tools, or domains this person engaged with meaningfully.
   - Only count sustained engagement (multiple pages on the same topic, or 10+ minutes on a single resource)
   - Be specific: "Stripe Connect payouts" not just "Stripe"
   - Skip casual browsing — only things that indicate real knowledge building

2. LEARNINGS — any tactical insights you can infer from the browsing patterns.
   - If they visited an error/troubleshooting page followed by a solution page, that's a learning
   - If they spent time on a "migration guide" or "breaking changes" page, note the migration
   - Only include learnings that would help other team members

Return JSON only, no markdown fences:
{"skills": [{"skill": "...", "source": "..."}], "learnings": [{"learning": "...", "context": "...", "importance": "high|medium"}]}

If nothing notable was learned today, return: {"skills": [], "learnings": []}
Do not manufacture entries.`;

async function runExtraction() {
  const buffer = readJSON(BUFFER_PATH);
  if (buffer.length === 0) {
    return { skills: 0, learnings: 0, skipped: 0 };
  }

  const person = getPerson();
  const date = getToday();

  const prompt = EXTRACTION_PROMPT
    .replace('{person}', person)
    .replace('{date}', date)
    .replace('{signals}', JSON.stringify(buffer, null, 2));

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  let extracted;
  try {
    extracted = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      extracted = JSON.parse(match[0]);
    } else {
      throw new Error('Could not parse Claude response as JSON');
    }
  }

  const existingSkills = readJSON(SKILLS_PATH);
  const existingLearnings = readJSON(LEARNINGS_PATH);

  const newSkills = deduplicateSkills(existingSkills, extracted.skills || [], person);
  const newLearnings = deduplicateLearnings(existingLearnings, extracted.learnings || []);

  const formattedSkills = newSkills.map(s => formatSkillEntry(s, person, date));
  const formattedLearnings = newLearnings.map(l => formatLearningEntry(l, person, date));

  const skippedCount =
    ((extracted.skills || []).length - newSkills.length) +
    ((extracted.learnings || []).length - newLearnings.length);

  if (formattedSkills.length > 0) {
    writeJSON(SKILLS_PATH, [...existingSkills, ...formattedSkills]);
  }
  if (formattedLearnings.length > 0) {
    writeJSON(LEARNINGS_PATH, [...existingLearnings, ...formattedLearnings]);
  }

  // Clear buffer
  writeJSON(BUFFER_PATH, []);

  return {
    skills: formattedSkills.length,
    learnings: formattedLearnings.length,
    skipped: skippedCount
  };
}

module.exports = {
  deduplicateSkills,
  deduplicateLearnings,
  formatSkillEntry,
  formatLearningEntry,
  readJSON,
  writeJSON,
  runExtraction,
  BUFFER_PATH
};
