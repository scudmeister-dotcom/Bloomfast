/* ============================================================
   Timer — Fasting Timer Logic & Schedule Definitions
   ============================================================ */

export const PLANS = {
  '16:8':  { name: '16:8',  fastHours: 16, eatHours: 8,  desc: '16 hour fast, 8 hour eating window' },
  '18:6':  { name: '18:6',  fastHours: 18, eatHours: 6,  desc: '18 hour fast, 6 hour eating window' },
  '20:4':  { name: '20:4',  fastHours: 20, eatHours: 4,  desc: '20 hour fast, 4 hour eating window' },
  'OMAD':  { name: 'OMAD',  fastHours: 23, eatHours: 1,  desc: 'One Meal A Day — 23 hour fast' },
  'ADF':   { name: 'ADF',   fastHours: 36, eatHours: 12, desc: 'Alternate Day Fasting — 36 hour fast' },
  'custom': { name: 'Custom', fastHours: 12, eatHours: 12, desc: 'Set your own fasting window' }
};

// Body status milestones mapped to hours into fast
export const BODY_MILESTONES = [
  { hour: 0,  label: 'Fast begins — digestion starts winding down' },
  { hour: 4,  label: 'Blood sugar stabilizing' },
  { hour: 8,  label: 'Body begins using stored glucose' },
  { hour: 12, label: 'Entering early ketosis — fat burning begins' },
  { hour: 16, label: 'Autophagy activating — cellular cleanup' },
  { hour: 20, label: 'Growth hormone surge — deep repair mode' },
  { hour: 24, label: 'Full autophagy — maximum cellular renewal' }
];

export class FastingTimer {
  constructor(store) {
    this.store = store;
    this.tickInterval = null;
    this.onTick = null;
    this.onComplete = null;
  }

  get activeFast() {
    return this.store.state.activeFast;
  }

  get isRunning() {
    return !!this.activeFast && !this.activeFast.completed;
  }

  get elapsedMs() {
    if (!this.activeFast) return 0;
    return Date.now() - this.activeFast.startTime;
  }

  get remainingMs() {
    if (!this.activeFast) return 0;
    return Math.max(0, this.activeFast.goalMs - this.elapsedMs);
  }

  get progress() {
    if (!this.activeFast) return 0;
    return Math.min(1, this.elapsedMs / this.activeFast.goalMs);
  }

  get elapsedHours() {
    return this.elapsedMs / 3600000;
  }

  get growthStage() {
    const p = this.progress;
    if (p < 0.01) return 'seed';
    if (p < 0.25) return 'sprout';
    if (p < 0.50) return 'vegetative';
    if (p < 0.75) return 'budding';
    if (p < 1.0)  return 'blooming';
    return 'full-bloom';
  }

  get growthStageLabel() {
    const labels = {
      'seed': '🌰 Seed',
      'sprout': '🌱 Sprout',
      'vegetative': '🌿 Vegetative',
      'budding': '🌼 Budding',
      'blooming': '🌸 Blooming',
      'full-bloom': '🌺 Full Bloom'
    };
    return labels[this.growthStage] || '';
  }

  start(planName, goalMs, plantType) {
    this.store.startFast(planName, goalMs, plantType);
    this.beginTicking();
  }

  beginTicking() {
    this.stopTicking();
    this.tickInterval = setInterval(() => {
      if (this.onTick) this.onTick(this);
    }, 1000);
  }

  stopTicking() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  cancel() {
    this.store.cancelFast();
    this.stopTicking();
  }

  // Resume on page load
  resume() {
    if (this.isRunning) {
      this.beginTicking();
      return true;
    }
    return false;
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  formatTimeElapsed() {
    return this.formatTime(this.elapsedMs);
  }

  formatTimeRemaining() {
    return this.formatTime(this.remainingMs);
  }
}
