/* ============================================================
   Store — Centralized State Management via localStorage
   ============================================================ */

import { PLANT_SPECIES } from './plant.js';

const STORAGE_KEY = 'amadors_fasting_app';

const defaultState = {
  // Current / active fast
  activeFast: null, // { startTime, goalMs, planName, plantType, completed }

  // Completed fasts history
  fasts: [],

  // Garden plants (completed fasts become plants)
  garden: {
    plants: [],      // [{ id, type, x, y, completedAt, rarity }]
    decorations: [], // [{ id, type, x, y }]
    tier: 'balcony', // balcony | yard | garden | estate
    lastActive: null
  },

  // Water tracking
  water: {
    today: 0,
    date: new Date().toDateString(),
    history: [] // [{ date, glasses, flOz, fastPlan }]
  },

  // Habits
  habits: {
    active: [],  // [{ id, label, emoji, enabled }]
    custom: []
  },

  // Journal (detailed history)
  journal: [], // [{ timestamp, date, text, metrics: { mood, sleep, energy }, fastSeconds }]
  lastJournalSaveDate: null,

  // Archived journal — entries older than 90 days are compressed into monthly summaries
  journalArchive: [], // [{ monthKey: '2025-03', label: 'March 2025', entryCount, avgMood, avgSleep, avgEnergy, totalFastHours, highlights: [string] }]

  // Metrics (mood, sleep, energy)
  metrics: [], // [{ timestamp, mood, sleep, energy }]
  lastMetricsSaveDate: null, // "Mon Mar 15 2026"

  // AI Coach limits
  coachUsage: {
    count: 0,
    lastDate: null
  },

  // Weight log
  weight: [], // [{ date, value }]

  // User profile
  profile: {
    name: 'Amador',
    avatar: '🌿'
  },

  // Notification settings
  notifications: {
    fastStart: true,
    fastComplete: true,
    hydrate: true,
    hydrateFrequency: 2 // 2 hours default
  },

  // Stats
  streakCount: 0,

  // Weekly log history
  weeklyLog: [], // [{ weekStarting: 'date', dailyHours: { Mon: 0, ... }, totalHours: 0 }]

  // Garden inventory
  inventory: {
    water: 5,
    fertilizer: 2
  },

  // Water display unit preference
  waterUnit: 'floz', // 'floz' | 'ml'

  // Bloom Coach — tracks recently shown message titles to avoid repeats
  coachSeenTitles: [] // last 60 titles shown
};

class Store {
  constructor() {
    this.state = this.load();
    this.listeners = new Set();

    // Starter Card logic
    if (this.state.garden.plants.length === 0) {
      const sunflower = PLANT_SPECIES.find(p => p.id === 'sunflower_classic');
      if (sunflower) {
        this.state.garden.plants.push({
          id: 'starter_sunflower',
          type: sunflower,
          x: 450,
          y: 300,
          completedAt: Date.now(),
          rarity: 'common',
          isStarter: true
        });
      }
    }

    // Daily reset for water — always log previous day (even 0 glasses)
    const today = new Date().toDateString();
    if (this.state.water.date !== today) {
      if (!this.state.water.history) this.state.water.history = [];
      this.state.water.history.push({
        date: this.state.water.date,
        glasses: this.state.water.today,
        flOz: this.state.water.today * 8
      });
      this.state.water.today = 0;
      this.state.water.date = today;
      this.save();
    }

    // Weekly reset
    this.checkWeeklyReset();

    // Archive journal entries older than 90 days
    this.pruneJournal();
  }

  checkWeeklyReset() {
    const startOfThisWeek = this.getStartOfCurrentWeek().toDateString();
    if (this.state.lastWeeklyReset && this.state.lastWeeklyReset !== startOfThisWeek) {
      const previousWeekHours = this.getWeeklyHours();
      this.state.weeklyLog.push({
        weekStarting: this.state.lastWeeklyReset,
        dailyHours: previousWeekHours,
        totalHours: Object.values(previousWeekHours).reduce((a, b) => a + b, 0)
      });
    }
    this.state.lastWeeklyReset = startOfThisWeek;
    this.save();
  }

  pruneJournal() {
    const cutoffMs = 90 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - cutoffMs;
    const toArchive = this.state.journal.filter(j => j.timestamp < cutoff);
    if (toArchive.length === 0) return;

    this.state.journal = this.state.journal.filter(j => j.timestamp >= cutoff);

    // Group old entries by year-month
    const byMonth = {};
    toArchive.forEach(j => {
      const d = new Date(j.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(j);
    });

    for (const [key, entries] of Object.entries(byMonth)) {
      const withMetrics = entries.filter(e => e.metrics);
      const avg = field => withMetrics.length
        ? (withMetrics.reduce((s, e) => s + (e.metrics[field] || 0), 0) / withMetrics.length).toFixed(1)
        : null;

      const totalFastHours = (entries.reduce((s, e) => s + (e.fastSeconds || 0), 0) / 3600).toFixed(1);
      const highlights = entries
        .filter(e => e.text?.trim().length > 0)
        .slice(0, 3)
        .map(e => e.text.trim().slice(0, 80) + (e.text.trim().length > 80 ? '…' : ''));

      const [year, month] = key.split('-');
      const label = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const summary = {
        monthKey: key, label,
        entryCount: entries.length,
        avgMood: avg('mood'), avgSleep: avg('sleep'), avgEnergy: avg('energy'),
        totalFastHours, highlights
      };

      const idx = this.state.journalArchive.findIndex(a => a.monthKey === key);
      if (idx >= 0) this.state.journalArchive[idx] = summary;
      else this.state.journalArchive.push(summary);
    }

    this.state.journalArchive.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    this.save();
  }

  getStartOfCurrentWeek() {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return this.deepMerge(JSON.parse(JSON.stringify(defaultState)), parsed);
      }
    } catch (e) { console.warn('Load error:', e); }
    return JSON.parse(JSON.stringify(defaultState));
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) { console.warn('Save error:', e); }
    this.notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  // --- Fasting ---
  startFast(planName, goalMs, plantType) {
    this.state.activeFast = { startTime: Date.now(), goalMs, planName, plantType, completed: false };
    this.save();
  }

  completeFast() {
    if (!this.state.activeFast) return null;
    const endTime = Date.now();
    const actualMs = endTime - this.state.activeFast.startTime;
    const success = actualMs >= this.state.activeFast.goalMs;
    
    const fast = { 
      ...this.state.activeFast, 
      completed: true, 
      endTime,
      actualMs,
      success
    };
    this.state.fasts.push(fast);

    let plant = null;

    if (success) {
      this.updateStreak();
      if (fast.plantType) {
        plant = {
          id: Date.now().toString(36),
          type: fast.plantType,
          x: 100 + Math.random() * 600,
          y: 100 + Math.random() * 400,
          completedAt: fast.endTime,
          rarity: fast.plantType.rarity || 'common'
        };
        this.state.garden.plants.push(plant);
      }
    }
    
    this.state.activeFast = null;
    this.save();
    return { success, plant, fast };
  }

  cancelFast() {
    this.state.activeFast = null;
    this.save();
  }

  resetStatistics() {
    this.state.fasts = [];
    this.state.streakCount = 0;
    this.state.garden.plants = [];
    this.state.weeklyLog = [];
    this.state.weight = [];
    this.state.metrics = [];
    this.state.journal = [];
    this.state.journalArchive = [];
    this.state.lastMetricsSaveDate = null;
    this.state.lastJournalSaveDate = null;
    this.save();
  }

  updateStreak() {
    const completed = this.state.fasts.filter(f => f.completed);
    if (completed.length === 0) { this.state.streakCount = 0; return; }
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const dayStr = checkDate.toDateString();
      if (completed.some(f => new Date(f.endTime).toDateString() === dayStr)) streak++;
      else if (i > 0) break;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    this.state.streakCount = streak;
  }

  getWeeklyHours() {
    const startOfWeek = this.getStartOfCurrentWeek();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const log = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    this.state.fasts.filter(f => f.completed).forEach(f => {
      const fDate = new Date(f.endTime);
      if (fDate >= startOfWeek) log[days[fDate.getDay()]] += (f.actualMs || 0) / 3600000;
    });
    for (const d in log) log[d] = Math.round(log[d] * 10) / 10;
    return log;
  }

  getTodayHours() {
    const today = new Date().toDateString();
    const hours = this.state.fasts
      .filter(f => f.completed && new Date(f.endTime).toDateString() === today)
      .reduce((acc, f) => acc + (f.actualMs || 0) / 3600000, 0);
    return Math.round(hours * 10) / 10;
  }

  getTodayWater() {
    return this.state.water.today;
  }

  // --- Wellness ---
  saveMetrics(mood, sleep, energy) {
    const today = new Date().toDateString();
    // Remove any previous entry from today if editing
    this.state.metrics = this.state.metrics.filter(m => new Date(m.timestamp).toDateString() !== today);
    this.state.metrics.push({ timestamp: Date.now(), mood, sleep, energy });
    this.state.lastMetricsSaveDate = today;
    this.save();
  }

  getTodayMetrics() {
    const today = new Date().toDateString();
    if (this.state.lastMetricsSaveDate === today) {
      return this.state.metrics.find(m => new Date(m.timestamp).toDateString() === today);
    }
    return null;
  }

  saveJournal(text) {
    const today = new Date().toDateString();
    const metrics = this.getTodayMetrics();
    const todayFast = this.state.fasts.find(f => f.completed && new Date(f.endTime).toDateString() === today);
    const fastSeconds = todayFast ? Math.floor(todayFast.actualMs / 1000) : 0;

    // Remove old today entry
    this.state.journal = this.state.journal.filter(j => new Date(j.timestamp).toDateString() !== today);
    this.state.journal.unshift({ 
      timestamp: Date.now(), 
      date: today,
      text, 
      metrics: metrics ? { mood: metrics.mood, sleep: metrics.sleep, energy: metrics.energy } : null,
      fastSeconds 
    });
    this.state.lastJournalSaveDate = today;
    this.save();
  }

  getTodayJournal() {
    const today = new Date().toDateString();
    if (this.state.lastJournalSaveDate === today) {
      return this.state.journal.find(j => j.date === today);
    }
    return null;
  }

  // AI Coach Usage
  canUseCoach() {
    const today = new Date().toDateString();
    if (this.state.coachUsage.lastDate !== today) {
      this.state.coachUsage = { count: 0, lastDate: today };
      this.save();
    }
    return this.state.coachUsage.count < 5;
  }

  incrementCoachUsage() {
    this.state.coachUsage.count++;
    this.save();
  }

  // --- Other ---
  logWater() {
    this.state.water.today++;
    this.save();
  }

  logWeight(value, timestamp = Date.now()) {
    const entry = { timestamp, value };
    const dateStr = new Date(timestamp).toDateString();
    this.state.weight = this.state.weight.filter(w => new Date(w.timestamp).toDateString() !== dateStr);
    this.state.weight.push(entry);
    this.state.weight.sort((a, b) => a.timestamp - b.timestamp);
    this.state.lastWeightSaveDate = dateStr;
    this.save();
  }

  getTodayWeight() {
    const today = new Date().toDateString();
    if (this.state.lastWeightSaveDate === today) {
      return this.state.weight.find(w => new Date(w.timestamp).toDateString() === today) || null;
    }
    return null;
  }

  setWaterUnit(unit) {
    this.state.waterUnit = unit;
    this.save();
  }

  adjustActiveFast(hours) {
    if (!this.state.activeFast) return;
    // Moving startTime BACKWARDS in time increases elapsed time
    this.state.activeFast.startTime -= (hours * 60 * 60 * 1000);
    this.save();
  }

  injectMockData() {
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Find base time to append data sequentially forward
    let latestFastTime = this.state.fasts.length > 0 
      ? Math.max(...this.state.fasts.map(f => f.endTime)) 
      : Date.now() - 30 * dayMs;
      
    let latestWeightTime = this.state.weight.length > 0 
      ? Math.max(...this.state.weight.map(w => w.timestamp)) 
      : Date.now() - 30 * dayMs;
      
    let latestMetricsTime = this.state.metrics.length > 0
      ? Math.max(...this.state.metrics.map(m => m.timestamp))
      : Date.now() - 7 * dayMs;

    // 1. Add some past fasts (pick unique plants)
    const usedIds = new Set();
    this.state.garden.plants.forEach(p => { if (p.type?.id) usedIds.add(p.type.id); });
    this.state.fasts.filter(f => f.completed && f.plantType?.id).forEach(f => usedIds.add(f.plantType.id));

    // Append 10 fasts over next 30 days
    for (let i = 1; i <= 10; i++) {
      const endTime = latestFastTime + (i * 3 * dayMs); // spread over ~30 days
      const startTime = endTime - (16 * 60 * 60 * 1000); // 16h fast
      const planName = '16:8';
      const available = PLANT_SPECIES.filter(p => !usedIds.has(p.id));
      if (available.length === 0) break;
      const plantType = available[Math.floor(Math.random() * available.length)];
      usedIds.add(plantType.id);
      
      this.state.fasts.push({
        startTime,
        endTime,
        actualMs: endTime - startTime,
        goalMs: 16 * 60 * 60 * 1000,
        planName,
        plantType,
        completed: true
      });

      this.state.garden.plants.push({
        id: 'mock_' + Date.now().toString(36) + i,
        type: plantType,
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        completedAt: endTime,
        rarity: plantType.rarity || 'common'
      });
    }

    // 2. Add some weight trend (use logWeight to prevent same-date duplicates forever)
    let startWeight = this.state.weight.length > 0 
      ? this.state.weight[this.state.weight.length - 1].value 
      : 185;

    for (let i = 1; i <= 30; i++) {
      this.logWeight(
        startWeight - i * 0.2 + (Math.random() * 0.5),
        latestWeightTime + (i * dayMs)
      );
    }

    // 3. Add some metrics
    for (let i = 1; i <= 7; i++) {
      const mTime = latestMetricsTime + (i * dayMs);
      const todayStr = new Date(mTime).toDateString();
      this.state.metrics = this.state.metrics.filter(m => new Date(m.timestamp).toDateString() !== todayStr);
      this.state.metrics.push({
        timestamp: mTime,
        mood: 6 + Math.floor(Math.random() * 4),
        sleep: 5 + Math.floor(Math.random() * 5),
        energy: 4 + Math.floor(Math.random() * 6)
      });
    }

    this.updateStreak();
    this.save();
  }

  unlockAll() {
    PLANT_SPECIES.forEach(species => {
      // Check if already in garden
      const exists = this.state.garden.plants.some(p => p.type.id === species.id);
      if (!exists) {
        this.state.garden.plants.push({
          id: 'debug_' + species.id,
          type: species,
          x: Math.random() * 800,
          y: Math.random() * 500,
          completedAt: Date.now(),
          rarity: species.rarity || 'common'
        });
      }
    });
    this.save();
  }
}

export const store = new Store();
