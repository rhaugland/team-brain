const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SKILLS_PATH = path.join(DATA_DIR, 'skills.json');
const LEARNINGS_PATH = path.join(DATA_DIR, 'learnings.json');

let originalSkills, originalLearnings;

describe('deduplicateSkills', () => {
  const { deduplicateSkills } = require('./extract');

  it('filters out skills that already exist for the same person', () => {
    const existing = [
      { person: 'Ryan', skill: 'Next.js middleware auth patterns', project: 'Slushie', date: '2026-05-28', source: 'test' }
    ];
    const newSkills = [
      { skill: 'Next.js middleware auth patterns', source: 'browsing' },
      { skill: 'Stripe Connect payouts', source: 'browsing' }
    ];
    const result = deduplicateSkills(existing, newSkills, 'Ryan');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].skill, 'Stripe Connect payouts');
  });

  it('is case-insensitive', () => {
    const existing = [
      { person: 'Ryan', skill: 'Docker Compose', project: 'test', date: '2026-05-28', source: 'test' }
    ];
    const newSkills = [
      { skill: 'docker compose', source: 'browsing' }
    ];
    const result = deduplicateSkills(existing, newSkills, 'Ryan');
    assert.strictEqual(result.length, 0);
  });

  it('allows same skill for different people', () => {
    const existing = [
      { person: 'Ryan', skill: 'Docker Compose', project: 'test', date: '2026-05-28', source: 'test' }
    ];
    const newSkills = [
      { skill: 'Docker Compose', source: 'browsing' }
    ];
    const result = deduplicateSkills(existing, newSkills, 'Sarah');
    assert.strictEqual(result.length, 1);
  });
});

describe('deduplicateLearnings', () => {
  const { deduplicateLearnings } = require('./extract');

  it('filters out learnings with identical text', () => {
    const existing = [
      { learning: 'Use db push instead of migrate for PlanetScale', person: 'Ryan', project: 'test', date: '2026-05-28', context: '', importance: 'high' }
    ];
    const newLearnings = [
      { learning: 'Use db push instead of migrate for PlanetScale', context: 'browsing', importance: 'high' }
    ];
    const result = deduplicateLearnings(existing, newLearnings);
    assert.strictEqual(result.length, 0);
  });

  it('keeps genuinely new learnings', () => {
    const existing = [
      { learning: 'Use db push for PlanetScale', person: 'Ryan', project: 'test', date: '2026-05-28', context: '', importance: 'high' }
    ];
    const newLearnings = [
      { learning: 'Always pin Docker base image versions to avoid build breaks', context: 'browsing', importance: 'medium' }
    ];
    const result = deduplicateLearnings(existing, newLearnings);
    assert.strictEqual(result.length, 1);
  });
});

describe('formatEntries', () => {
  const { formatSkillEntry, formatLearningEntry } = require('./extract');

  it('formats a skill entry with all required fields', () => {
    const entry = formatSkillEntry({ skill: 'Kubernetes networking', source: 'Spent 30 min on K8s docs' }, 'Ryan', '2026-05-28');
    assert.deepStrictEqual(entry, {
      person: 'Ryan',
      skill: 'Kubernetes networking',
      project: 'browsing',
      date: '2026-05-28',
      source: 'Spent 30 min on K8s docs'
    });
  });

  it('formats a learning entry with all required fields', () => {
    const entry = formatLearningEntry({ learning: 'Use Bun for faster installs', context: 'browsing', importance: 'medium' }, 'Ryan', '2026-05-28');
    assert.deepStrictEqual(entry, {
      learning: 'Use Bun for faster installs',
      context: 'browsing',
      project: 'browsing',
      person: 'Ryan',
      date: '2026-05-28',
      importance: 'medium'
    });
  });
});
