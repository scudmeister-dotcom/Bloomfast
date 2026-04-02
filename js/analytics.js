/* ============================================================
   Analytics — Chart.js Integrations & Data Visualization
   ============================================================ */

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Chart.js global defaults for dark theme
Chart.defaults.color = '#a0bfad';
Chart.defaults.borderColor = 'rgba(76, 175, 80, 0.1)';
Chart.defaults.font.family = 'Inter, sans-serif';

export class AnalyticsDashboard {
  constructor(store) {
    this.store = store;
    this.charts = {};
    this.weightUnit = 'lbs';
    this.weightTimeframe = '1m';
    this.gardenTimeframe = '1m';
    this.wellbeingTimeframe = '1w';
    this.avgDurationTimeframe = '1w';
    this.bloomRateTimeframe = '1w';
    this.weightOffsetDays = 0;
    this.gardenOffsetDays = 0;
    this.wellbeingOffsetDays = 0;
  }

  setWeightUnit(unit) {
    this.weightUnit = unit;
    this.updateWeightChart();
  }

  setWeightTimeframe(timeframe) {
    this.weightTimeframe = timeframe;
    this.weightOffsetDays = 0;
    this.updateWeightChart();
    this.updateWeightNav();
  }

  setGardenTimeframe(timeframe) {
    this.gardenTimeframe = timeframe;
    this.gardenOffsetDays = 0;
    this.renderFastLog();
    this.updateGardenNav();
  }

  setWellbeingTimeframe(timeframe) {
    this.wellbeingTimeframe = timeframe;
    this.wellbeingOffsetDays = 0;
    this.updateWellbeingChart();
    this.updateWellbeingNav();
  }

  getDaysForTimeframe(tf) {
    if (tf === '1d') return 1;
    if (tf === '1w') return 7;
    if (tf === '1m') return 30;
    if (tf === '3m') return 90;
    if (tf === '6m') return 180;
    if (tf === '1y') return 365;
    return 0;
  }

  stepWeightTimeframe(direction) {
    if (this.weightTimeframe === 'all') return;
    const days = this.getDaysForTimeframe(this.weightTimeframe);
    this.weightOffsetDays += (direction === 'prev' ? days : -days);
    if (this.weightOffsetDays < 0) this.weightOffsetDays = 0;
    this.updateWeightChart();
    this.updateWeightNav();
  }

  stepGardenTimeframe(direction) {
    if (this.gardenTimeframe === 'all') return;
    const days = this.getDaysForTimeframe(this.gardenTimeframe);
    this.gardenOffsetDays += (direction === 'prev' ? days : -days);
    if (this.gardenOffsetDays < 0) this.gardenOffsetDays = 0;
    this.renderFastLog();
    this.updateGardenNav();
  }

  stepWellbeingTimeframe(direction) {
    if (this.wellbeingTimeframe === 'all') return;
    const days = this.getDaysForTimeframe(this.wellbeingTimeframe);
    this.wellbeingOffsetDays += (direction === 'prev' ? days : -days);
    if (this.wellbeingOffsetDays < 0) this.wellbeingOffsetDays = 0;
    this.updateWellbeingChart();
    this.updateWellbeingNav();
  }
  
  updateWeightNav() {
    const prevBtn = document.querySelector('.weight-nav-prev');
    const nextBtn = document.querySelector('.weight-nav-next');
    if (!prevBtn || !nextBtn) return;
    
    if (this.weightTimeframe === 'all') {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    } else {
      prevBtn.disabled = false;
      nextBtn.disabled = this.weightOffsetDays <= 0;
    }
  }

  updateGardenNav() {
    const prevBtn = document.querySelector('.garden-nav-prev');
    const nextBtn = document.querySelector('.garden-nav-next');
    if (!prevBtn || !nextBtn) return;
    
    if (this.gardenTimeframe === 'all') {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    } else {
      prevBtn.disabled = false;
      nextBtn.disabled = this.gardenOffsetDays <= 0;
    }
  }

  updateWellbeingNav() {
    const prevBtn = document.querySelector('.wellbeing-nav-prev');
    const nextBtn = document.querySelector('.wellbeing-nav-next');
    if (!prevBtn || !nextBtn) return;
    
    if (this.wellbeingTimeframe === 'all') {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    } else {
      prevBtn.disabled = false;
      nextBtn.disabled = this.wellbeingOffsetDays <= 0;
    }
  }

  init() {
    this.createWeightChart();
    this.updateWeightNav();
    this.updateStats();
    this.renderFastLog();
    this.updateGardenNav();
    this.bindEvents();
  }

  // Called when the wellness tab becomes visible so the canvas has real dimensions
  initWellbeingChart() {
    if (!this.charts.wellbeing) {
      this.createWellbeingChart();
      this.renderWellbeingStats(this.getWellbeingData());
    } else {
      this.charts.wellbeing.resize();
      this.updateWellbeingChart();
    }
  }

  refresh() {
    this.updateWeightChart();
    this.updateStats();
    this.renderFastLog();
  }

  bindEvents() {
    const resetBtn = document.getElementById('btn-reset-stats');
    if (resetBtn) {
      resetBtn.onclick = (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('bloom:confirm', {
          detail: {
            title: 'Reset All Stats?',
            message: 'Are you sure you want to reset all fasting statistics and your garden? This cannot be undone.',
            onConfirm: () => {
              this.store.resetStatistics();
              window.location.reload();
            }
          }
        }));
      };
    }

    // Avg Duration timeframe toggle
    document.querySelectorAll('.stat-tf-btn:not(.stat-tf-btn--bloom)').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stat-tf-btn:not(.stat-tf-btn--bloom)').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.avgDurationTimeframe = btn.dataset.tf;
        this.updateStats();
      });
    });

    // Bloom Rate timeframe toggle
    document.querySelectorAll('.stat-tf-btn--bloom').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stat-tf-btn--bloom').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.bloomRateTimeframe = btn.dataset.tf;
        this.updateStats();
      });
    });
  }

  destroy() {
    Object.values(this.charts).forEach(c => c?.destroy?.());
    this.charts = {};
  }

  // ---- Fast History Log ----

  renderFastLog() {
    const container = document.getElementById('fast-log-list');
    if (!container) return;

    let fasts = [...this.store.state.fasts];

    if (this.gardenTimeframe && this.gardenTimeframe !== 'all' && fasts.length > 0) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = this.getDaysForTimeframe(this.gardenTimeframe) || 30;
      const maxTime = Math.max(...fasts.map(f => f.endTime || 0), Date.now());
      const windowEnd = maxTime - (this.gardenOffsetDays * msPerDay);
      const windowStart = windowEnd - (days * msPerDay);
      
      fasts = fasts.filter(f => {
        const t = f.endTime || maxTime;
        return t >= windowStart && t <= windowEnd;
      });
    }

    fasts = fasts.reverse(); // newest first

    if (fasts.length === 0) {
      container.innerHTML = '<div class="fast-log-empty">No fasts recorded yet. Plant your first seed!</div>';
      return;
    }

    const fmt = ms => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const rows = fasts.map(f => {
      const dateObj = new Date(f.endTime);
      const dateStrForWater = dateObj.toDateString();
      const date = f.endTime ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
      const plan = f.planName || '—';
      const actual = fmt(f.actualMs || 0);
      const goal   = fmt(f.goalMs   || 0);
      const statusClass = f.success ? 'complete' : 'early';
      const statusLabel = f.success ? '✓ Complete' : 'Ended early';

      let waterCount = 0;
      if (dateStrForWater === this.store.state.water.date) {
        waterCount = this.store.state.water.today;
      } else {
        const hEntry = (this.store.state.water.history || []).find(h => h.date === dateStrForWater);
        if (hEntry) waterCount = hEntry.glasses;
      }

      const metaParts = [
        `<span class="fast-log-plan">${plan}</span>`,
        `<span class="fast-log-duration">${actual} / ${goal}</span>`,
        waterCount > 0 ? `<span class="fast-log-water">${waterCount} 💧</span>` : '',
      ].filter(Boolean).join('<span class="fast-log-sep">·</span>');

      const rewardHtml = (f.success && f.plantType)
        ? `<div class="fast-log-reward">
            <img src="${f.plantType.image}" class="fast-log-reward-img" alt="${f.plantType.name}">
            <span class="fast-log-reward-name">${f.plantType.name}</span>
          </div>`
        : '';

      return `
        <div class="fast-log-row">
          <div class="fast-log-top">
            <span class="fast-log-date">${date}</span>
            <span class="fast-log-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="fast-log-meta">${metaParts}</div>
          ${rewardHtml}
        </div>`;
    }).join('');

    container.innerHTML = rows;
  }

  // ---- Stats Summary ----

  updateStats() {
    const allFasts = this.store.state.fasts;

    // Seeds Planted: every fast attempt, all time
    const totalFastsEl = document.getElementById('stat-total-fasts');
    if (totalFastsEl) totalFastsEl.textContent = allFasts.length;

    // Bloom Rate: % of successful fasts, filtered by selected timeframe
    const completionEl = document.getElementById('stat-completion');
    if (completionEl) {
      let fastsForRate = allFasts;
      if (this.bloomRateTimeframe !== 'all') {
        const cutoff = Date.now() - this.getDaysForTimeframe(this.bloomRateTimeframe) * 24 * 60 * 60 * 1000;
        fastsForRate = allFasts.filter(f => (f.endTime || 0) >= cutoff);
      }
      const successCount = fastsForRate.filter(f => f.success).length;
      const rate = fastsForRate.length > 0 ? Math.round((successCount / fastsForRate.length) * 100) : 0;
      completionEl.textContent = rate + '%';
    }

    // Total Blooms: all plants collected (including starter), all time
    const totalPlantsEl = document.getElementById('stat-total-plants');
    if (totalPlantsEl) totalPlantsEl.textContent = this.store.state.garden.plants.length;

    // Avg Duration: only fasts >= 1 hour, filtered by selected timeframe
    const avgHoursEl = document.getElementById('stat-avg-hours');
    if (avgHoursEl) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const ONE_HOUR = 3600000;
      let fastsForAvg = allFasts.filter(f => (f.actualMs || 0) >= ONE_HOUR);

      if (this.avgDurationTimeframe !== 'all' && fastsForAvg.length > 0) {
        const days = this.getDaysForTimeframe(this.avgDurationTimeframe);
        const cutoff = Date.now() - days * msPerDay;
        fastsForAvg = fastsForAvg.filter(f => (f.endTime || 0) >= cutoff);
      }

      if (fastsForAvg.length > 0) {
        const avgMs = fastsForAvg.reduce((sum, f) => sum + f.actualMs, 0) / fastsForAvg.length;
        const h = Math.floor(avgMs / ONE_HOUR);
        const m = Math.floor((avgMs % ONE_HOUR) / 60000);
        avgHoursEl.textContent = m > 0 ? `${h}h ${m}m` : `${h}h`;
      } else {
        avgHoursEl.textContent = '—';
      }
    }

    // Weekly Focus
    const weekHrsEl = document.getElementById('analytics-today-hours');
    const weekWaterEl = document.getElementById('analytics-today-water');
    if (weekHrsEl) {
      const weeklyHours = this.store.getWeeklyHours();
      const totalWeekHours = Object.values(weeklyHours).reduce((a, b) => a + b, 0);
      weekHrsEl.textContent = Math.round(totalWeekHours * 10) / 10 + 'h';
    }
    if (weekWaterEl) {
      const startOfWeek = this.store.getStartOfCurrentWeek();
      const historyGlasses = (this.store.state.water.history || [])
        .filter(h => new Date(h.date) >= startOfWeek)
        .reduce((sum, h) => sum + (h.glasses || 0), 0);
      const totalGlasses = historyGlasses + (this.store.state.water.today || 0);
      weekWaterEl.textContent = totalGlasses + ' glasses';
    }
  }

  // ---- Weekly Streak (replaces heatmap) ----

  renderWeeklyStreak() {
    const container = document.getElementById('weekly-streak-bar');
    if (!container) return;

    container.innerHTML = '';
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyHours = this.store.getWeeklyHours();

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon .. 6=Sun

    dayNames.forEach((name, i) => {
      const hours = weeklyHours[name] || 0;
      const dayEl = document.createElement('div');
      dayEl.className = 'streak-day';

      const label = document.createElement('span');
      label.className = 'streak-day-label';
      label.textContent = name;

      const dot = document.createElement('div');
      dot.className = 'streak-day-dot';
      
      if (hours > 0) {
        dot.classList.add('completed');
        dot.textContent = '✓';
      } else {
        dot.textContent = '';
      }

      if (i === todayIndex) {
        dot.classList.add('today');
        if (hours === 0) dot.textContent = '📍';
      }

      dayEl.appendChild(label);
      dayEl.appendChild(dot);
      container.appendChild(dayEl);
    });
  }

  // ---- Streak Chart (line) ----

  createStreakChart() {
    const canvas = document.getElementById('chart-streaks');
    if (!canvas) return;

    const data = this.getStreakData();

    this.charts.streak = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Fasting Hours',
          data: data.values,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#66ffaa',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(76,175,80,0.06)' }
          },
          x: {
            grid: { color: 'rgba(76,175,80,0.06)' }
          }
        }
      }
    });
  }

  updateStreakChart() {
    if (!this.charts.streak) return;
    const data = this.getStreakData();
    this.charts.streak.data.labels = data.labels;
    this.charts.streak.data.datasets[0].data = data.values;
    this.charts.streak.update();
  }

  getStreakData() {
    const fasts = this.store.state.fasts.filter(f => f.completed);
    const last30 = fasts.slice(-30);
    return {
      labels: last30.map((f) => {
        const d = new Date(f.endTime);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      values: last30.map(f => Math.round((f.actualMs || 0) / 3600000 * 10) / 10)
    };
  }

  // ---- Weight Chart (line) ----



  // ---- Weight Chart (line) ----

  createWeightChart() {
    const canvas = document.getElementById('chart-weight');
    if (!canvas) return;

    const data = this.getWeightData();

    this.charts.weight = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Weight (lbs)',
          data: data.values,
          borderColor: '#f1c40f',
          backgroundColor: 'rgba(241, 196, 15, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#f1c40f',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            grid: { color: 'rgba(76,175,80,0.06)' }
          },
          x: {
            grid: { color: 'rgba(76,175,80,0.06)' }
          }
        }
      }
    });
  }

  updateWeightChart() {
    if (!this.charts.weight) return;
    const data = this.getWeightData();
    this.charts.weight.data.labels = data.labels;
    this.charts.weight.data.datasets[0].data = data.values;
    this.charts.weight.data.datasets[0].label = `Weight (${this.weightUnit})`;
    this.charts.weight.update();
  }

  getWeightData() {
    let weights = this.store.state.weight;

    if (this.weightTimeframe !== 'all' && weights.length > 0) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = this.getDaysForTimeframe(this.weightTimeframe) || 30;
      const maxTime = Math.max(...weights.map(w => w.timestamp || 0), Date.now());
      const windowEnd = maxTime - (this.weightOffsetDays * msPerDay);
      const windowStart = windowEnd - (days * msPerDay);
      
      weights = weights.filter(w => {
        const t = w.timestamp || maxTime;
        return t >= windowStart && t <= windowEnd;
      });
    }

    const convert = v => this.weightUnit === 'kg' ? Math.round(v / 2.20462 * 10) / 10 : v;
    return {
      labels: weights.map(w => {
        const d = new Date(w.timestamp || Date.now());
        const yy = d.getFullYear().toString().slice(-2);
        return `${d.getMonth() + 1}/${d.getDate()}/${yy}`;
      }),
      values: weights.map(w => convert(w.value))
    };
  }

  // ---- Well-being Radar Chart ----

  createWellbeingChart() {
    const canvas = document.getElementById('chart-wellbeing');
    if (!canvas) return;

    const data = this.getWellbeingData();

    this.charts.wellbeing = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Mood', 'Sleep', 'Energy'],
        datasets: [{
          label: data.currentLabel,
          data: data.current,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          pointBackgroundColor: '#66ffaa'
        }, {
          label: data.previousLabel,
          data: data.previous,
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
          pointBackgroundColor: '#c39bd3'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          r: {
            min: 0,
            max: 10,
            grid: { color: 'rgba(76,175,80,0.1)' },
            angleLines: { color: 'rgba(76,175,80,0.1)' },
            ticks: { display: false }
          }
        }
      }
    });
  }

  updateWellbeingChart() {
    if (!this.charts.wellbeing) return;
    const data = this.getWellbeingData();
    this.charts.wellbeing.data.datasets[0].data = data.current;
    this.charts.wellbeing.data.datasets[0].label = data.currentLabel;
    this.charts.wellbeing.data.datasets[1].data = data.previous;
    this.charts.wellbeing.data.datasets[1].label = data.previousLabel;
    this.charts.wellbeing.update();
    this.renderWellbeingStats(data);
  }

  renderWellbeingStats(data) {
    const row = document.getElementById('wellbeing-stats-row');
    if (!row) return;

    row.innerHTML = data.perMetric.map(m => {
      const delta = Math.round((m.current - m.previous) * 10) / 10;
      const sign = delta > 0 ? '+' : '';
      const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
      const deltaClass = delta > 0 ? 'wb-delta-up' : delta < 0 ? 'wb-delta-down' : 'wb-delta-flat';
      const deltaHtml = m.hasPrev
        ? `<span class="wb-delta ${deltaClass}">${sign}${delta} ${arrow}</span>`
        : '';

      return `
        <div class="wb-stat">
          <div class="wb-stat-label">${m.label}</div>
          <div class="wb-stat-value">${m.current}</div>
          ${deltaHtml}
        </div>`;
    }).join('');
  }

  getWellbeingData() {
    const metrics = this.store.state.metrics;
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = this.getDaysForTimeframe(this.wellbeingTimeframe) || 7;
    
    let maxTime = Date.now();
    if (metrics.length > 0) {
      maxTime = Math.max(...metrics.map(m => m.timestamp || 0), Date.now());
    }

    const windowEnd = maxTime - (this.wellbeingOffsetDays * msPerDay);
    const windowStart = windowEnd - (days * msPerDay);
    const prevWindowStart = windowStart - (days * msPerDay);

    const currentPeriod = metrics.filter(m => {
      const t = m.timestamp || maxTime;
      return t > windowStart && t <= windowEnd;
    });

    const previousPeriod = metrics.filter(m => {
      const t = m.timestamp || maxTime;
      return t > prevWindowStart && t <= windowStart;
    });

    const avg = (arr, key) => arr.length > 0
      ? Math.round(arr.reduce((s, m) => s + m[key], 0) / arr.length * 10) / 10
      : 5;

    // Generate human-readable date range labels
    const fmtDate = (ts, tf) => {
      const d = new Date(ts);
      if (tf === '1w') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (tf === '1m') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (tf === '1y') return d.toLocaleDateString('en-US', { year: 'numeric' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const rangeLabel = (start, end, tf) => {
      if (tf === '1m') return fmtDate(end, tf);
      if (tf === '1y') return fmtDate(end, tf);
      return `${fmtDate(start + msPerDay, tf)} – ${fmtDate(end, tf)}`;
    };

    const currentLabel = rangeLabel(windowStart, windowEnd, this.wellbeingTimeframe);
    const previousLabel = rangeLabel(prevWindowStart, windowStart, this.wellbeingTimeframe);

    const metrics_keys = ['mood', 'sleep', 'energy'];
    const currentAvgs = metrics_keys.map(k => avg(currentPeriod, k));
    const previousAvgs = metrics_keys.map(k => avg(previousPeriod, k));

    return {
      current: currentAvgs,
      previous: previousAvgs,
      currentLabel,
      previousLabel,
      perMetric: [
        { label: 'Mood',   current: currentAvgs[0], previous: previousAvgs[0], hasPrev: previousPeriod.length > 0 },
        { label: 'Sleep',  current: currentAvgs[1], previous: previousAvgs[1], hasPrev: previousPeriod.length > 0 },
        { label: 'Energy', current: currentAvgs[2], previous: previousAvgs[2], hasPrev: previousPeriod.length > 0 },
      ]
    };
  }
}
