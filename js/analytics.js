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
  }

  init() {
    this.createStreakChart();
    this.createWeightChart();
    this.createWellbeingChart();
    this.renderWeeklyStreak();
    this.updateStats();
    this.bindEvents();
  }

  refresh() {
    this.updateStreakChart();
    this.updateWeightChart();
    this.updateWellbeingChart();
    this.renderWeeklyStreak();
    this.updateStats();
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
  }

  destroy() {
    Object.values(this.charts).forEach(c => c?.destroy?.());
    this.charts = {};
  }

  // ---- Stats Summary ----

  updateStats() {
    const completed = this.store.state.fasts.filter(f => f.completed);

    const totalFastsEl = document.getElementById('stat-total-fasts');
    if (totalFastsEl) totalFastsEl.textContent = completed.length;

    const avgHoursEl = document.getElementById('stat-avg-hours');
    const completionEl = document.getElementById('stat-completion');

    if (completed.length > 0) {
      const avgMs = completed.reduce((sum, f) => sum + (f.actualMs || 0), 0) / completed.length;
      const avgH = Math.round(avgMs / 3600000);
      if (avgHoursEl) avgHoursEl.textContent = avgH + 'h';

      const rate = Math.round((completed.length / (this.store.state.fasts.length || 1)) * 100);
      if (completionEl) completionEl.textContent = rate + '%';
    } else {
      if (avgHoursEl) avgHoursEl.textContent = '0h';
      if (completionEl) completionEl.textContent = '0%';
    }

    // Today's Focus
    const todayHrsEl = document.getElementById('analytics-today-hours');
    const todayWaterEl = document.getElementById('analytics-today-water');
    if (todayHrsEl) todayHrsEl.textContent = this.store.getTodayHours() + 'h';
    if (todayWaterEl) todayWaterEl.textContent = this.store.getTodayWater() + ' glasses';
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
    this.charts.weight.update();
  }

  getWeightData() {
    const weights = this.store.state.weight.slice(-30);
    return {
      labels: weights.map(w => {
        const d = new Date(w.timestamp || Date.now());
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      values: weights.map(w => w.value)
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
          label: 'This Week',
          data: data.current,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          pointBackgroundColor: '#66ffaa'
        }, {
          label: 'Last Week',
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
    this.charts.wellbeing.data.datasets[1].data = data.previous;
    this.charts.wellbeing.update();
  }

  getWellbeingData() {
    const metrics = this.store.state.metrics;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    const thisWeek = metrics.filter(m => (m.timestamp || now) > now - weekMs);
    const lastWeek = metrics.filter(m => {
      const t = m.timestamp || now;
      return t > now - weekMs * 2 && t <= now - weekMs;
    });

    const avg = (arr, key) => arr.length > 0
      ? Math.round(arr.reduce((s, m) => s + m[key], 0) / arr.length * 10) / 10
      : 5;

    return {
      current: [avg(thisWeek, 'mood'), avg(thisWeek, 'sleep'), avg(thisWeek, 'energy')],
      previous: [avg(lastWeek, 'mood'), avg(lastWeek, 'sleep'), avg(lastWeek, 'energy')]
    };
  }
}
