/* ============================================================
   Main — Application Orchestration
   ============================================================ */

import { store } from './js/store.js';
import { FastingTimer, PLANS } from './js/timer.js';
import { PlantRenderer, getRandomPlant, PLANT_SPECIES } from './js/plant.js';
import { CollectionGallery } from './js/collection-gallery.js';
import { AnalyticsDashboard } from './js/analytics.js';
import { HabitsManager } from './js/habits.js';
import { showToast } from './js/social.js';
import { NotificationManager } from './js/notifications.js';
import { DECORATIONS_CATALOG } from './js/garden.js';

// ---- Globals ----
let timer, plantRenderer, collectionGallery, analytics, habits, social, notifications;
let selectedPlan = null;
let currentTab = 'timer';

// ---- Initialize ----
function init() {
  // Create managers
  timer = new FastingTimer(store);
  plantRenderer = new PlantRenderer(document.getElementById('plant-canvas'));
  notifications = new NotificationManager(store);
  habits = new HabitsManager(store);
  notifications = new NotificationManager(store);
  habits = new HabitsManager(store);

  // Bind navigation
  bindNavigation();

  // Bind timer controls
  bindTimerControls();

  // Bind water tracker
  bindWaterTracker();

  // Bind analytics controls
  bindAnalyticsControls();

  // Bind wellness tab
  bindWellnessTab();

  // Bind settings
  bindSettings();

  // Bind mobile
  bindMobile();

  // Initialize water glasses display
  renderWaterGlasses();

  // Timer callbacks
  timer.onTick = onTimerTick;
  timer.onComplete = onFastComplete;

  // Resume active fast if any
  if (timer.resume()) {
    showActiveFastUI();
    plantRenderer.setPlant(store.state.activeFast.plantType);
    plantRenderer.setProgress(timer.progress);
    plantRenderer.startAnimation();
  } else {
    plantRenderer.startAnimation();
  }

  // Init habits
  habits.init();

    // social removed

  // Init notifications
  notifications.init();

  // Init metric sliders display
  bindMetricSliders();

  // Init decoration panel
  initDecorPanel();

  // Bind modal close
  bindModal();

  // Bind test plants button
  bindTestPlants();

  // Subscribe to state changes
  store.subscribe(() => {
    renderWaterGlasses();
    updateWellnessUI(); // Add this to reactive updates
  });
}

// ---- Navigation ----
function bindNavigation() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  // Deactivate all
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  // Activate selected
  const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  const panel = document.getElementById(`tab-${tabName}`);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');

  // Tab-specific initialization
  if (tabName === 'garden') {
    if (!collectionGallery) {
      collectionGallery = new CollectionGallery(store);
    }
    collectionGallery.render();
  }

  if (tabName === 'analytics') {
    if (!analytics) {
      analytics = new AnalyticsDashboard(store);
      analytics.init();
    } else {
      analytics.refresh();
    }
  }

  if (tabName === 'wellness') {
    updateWellnessUI();
  }

  if (tabName === 'social') {
    social.updateProfile();
  }

  currentTab = tabName;
}

// ---- Timer Controls ----
function bindTimerControls() {
  // Plan selection
  document.querySelectorAll('.plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.plan-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPlan = btn.dataset.plan;

      // Show custom input if needed
      const customArea = document.getElementById('custom-input-area');
      if (selectedPlan === 'custom') {
        customArea?.classList.remove('hidden');
      } else {
        customArea?.classList.add('hidden');
      }
    });
  });

  // Start fast
  document.getElementById('btn-start-fast')?.addEventListener('click', startFast);

  // Stop fast
  const stopBtn = document.getElementById('btn-stop-fast');
  if (stopBtn) {
    stopBtn.onclick = (e) => {
      e.preventDefault();
      customConfirm(
        'End Fast Early?',
        'Are you sure you want to end your fast early? The plant won\'t be added to your garden.',
        () => {
          timer.cancel();
          plantRenderer.setProgress(0);
          plantRenderer.setPlant(null);

          // Reset hydration
          store.state.water.today = 0;
          store.save();
          renderWaterGlasses();

          showIdleTimerUI();
          showToast('Fast ended early. Hydration reset. 🌸');
        }
      );
    };
  }
}

function startFast() {
  if (!selectedPlan) {
    showToast('Please select a fasting plan first!');
    return;
  }

  let goalHours;
  if (selectedPlan === 'custom') {
    goalHours = parseInt(document.getElementById('custom-hours')?.value) || 12;
  } else {
    goalHours = PLANS[selectedPlan]?.fastHours || 16;
  }

  const goalMs = goalHours * 60 * 60 * 1000;
  const plantType = getRandomPlant();

  timer.start(selectedPlan, goalMs, plantType);

  // Setup plant renderer — user sees the plant but NOT the species name
  plantRenderer.setPlant(plantType);
  plantRenderer.setProgress(0);

  // Update UI — hide species info, show mystery
  showActiveFastUI();

  // Don't reveal plant type — it's a mystery!
  document.getElementById('plant-species-label').textContent = '🌱 A mystery seed is growing...';
  document.getElementById('growth-stage-label').textContent = timer.growthStageLabel;

  // Notification
  notifications.notifyFastStart();

  showToast('🌱 Fast started! A mystery seed has been planted...');
}

function showActiveFastUI() {
  document.getElementById('plan-selector')?.classList.add('hidden');
  document.getElementById('btn-start-fast')?.classList.add('hidden');
  document.getElementById('btn-stop-fast')?.classList.remove('hidden');
  document.getElementById('body-status-timeline')?.classList.remove('hidden');

  // Mystery labels
  document.getElementById('plant-species-label').textContent = '🌱 A mystery seed is growing...';
}

function showIdleTimerUI() {
  document.getElementById('plan-selector')?.classList.remove('hidden');
  document.getElementById('btn-start-fast')?.classList.remove('hidden');
  document.getElementById('btn-stop-fast')?.classList.add('hidden');
  document.getElementById('body-status-timeline')?.classList.add('hidden');
  document.getElementById('timer-display').textContent = '00:00:00';
  document.getElementById('timer-subtitle').textContent = 'Select a fasting plan to start';
  document.getElementById('timer-progress-fill').style.width = '0%';
  document.getElementById('plant-species-label').textContent = '';
  document.getElementById('growth-stage-label').textContent = 'Plant a seed to begin';
}

// ---- Timer Tick ----
let lastMilestoneHour = -1;

function onTimerTick(t) {
  // Update timer display
  document.getElementById('timer-display').textContent = t.formatTimeElapsed();
  document.getElementById('timer-subtitle').textContent = `${t.formatTimeRemaining()} remaining`;
  document.getElementById('timer-progress-fill').style.width = `${t.progress * 100}%`;

  // Update growth stage (don't reveal species)
  document.getElementById('growth-stage-label').textContent = t.growthStageLabel;

  // Update plant renderer
  plantRenderer.setProgress(t.progress);

  // Update body milestones
  updateMilestones(t.elapsedHours);

  // Check for milestone notifications
  const currentHour = Math.floor(t.elapsedHours);
  if (currentHour > lastMilestoneHour && currentHour > 0) {
    lastMilestoneHour = currentHour;
    const milestones = [4, 8, 12, 16, 20, 24, 36];
    if (milestones.includes(currentHour)) {
      const milestone = document.querySelector(`.milestone[data-hour="${currentHour}"]`);
      const desc = milestone?.querySelector('.milestone-desc')?.textContent;
      if (desc) {
        notifications.notifyMilestone(desc);
        showToast(`🎯 ${currentHour}h milestone: ${desc}`);
      }
    }
  }
}

function updateMilestones(elapsedHours) {
  document.querySelectorAll('.milestone').forEach(m => {
    const hour = parseInt(m.dataset.hour);
    if (elapsedHours >= hour) {
      m.classList.add('reached');
    } else {
      m.classList.remove('reached');
    }
  });
}

// ---- Fast Complete — Plant Reveal! ----
function onFastComplete(result) {
  lastMilestoneHour = -1;

  const plantData = result?.plant || result;
  const plantType = plantData?.type || store.state.fasts[store.state.fasts.length - 1]?.plantType;
  const plantName = plantType?.name || 'plant';
  const funFact = plantType?.funFact || 'Every plant you grow represents your dedication to a healthier you!';

  // Log hydration data before reset
  const waterCount = store.state.water.today;
  if (waterCount > 0) {
    if (!store.state.water.history) store.state.water.history = [];
    store.state.water.history.push({
      date: new Date().toDateString(),
      glasses: waterCount,
      flOz: waterCount * 8,
      fastPlan: selectedPlan || 'unknown'
    });
  }

  // Reset hydration for next fast
  store.state.water.today = 0;
  store.save();
  renderWaterGlasses();

  // Show the plant reveal modal
  showPlantRevealModal(plantType, funFact);

  notifications.notifyFastComplete(plantName);

  // Keep the Full Bloom visible for a moment, then reset
  setTimeout(() => {
    showIdleTimerUI();
    plantRenderer.setProgress(0);
    plantRenderer.setPlant(null);
  }, 5000);

  // Update collection gallery
  if (collectionGallery) {
    collectionGallery.render();
  }

  // Refresh analytics weekly streak
  if (analytics) {
    analytics.refresh();
  }
}

function showPlantRevealModal(plantType, funFact) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  if (!modalOverlay || !modalContent) return;

  const rarityColors = {
    common: '#a0bfad',
    uncommon: '#4caf50',
    rare: '#ba68c8',
    legendary: '#f1c40f'
  };

  modalContent.innerHTML = `
    <div class="plant-reveal">
      <div class="plant-reveal-emoji" style="${plantType?.emojiFilter ? 'filter: ' + plantType.emojiFilter : ''}">${plantType?.emoji || '🌱'}</div>
      <div class="plant-reveal-name">${plantType?.name || 'Mystery Plant'}</div>
      <div class="plant-reveal-rarity ${plantType?.rarity || 'common'}" style="color: ${rarityColors[plantType?.rarity] || '#a0bfad'}">
        ✦ ${(plantType?.rarity || 'common').toUpperCase()} ✦
      </div>
      <div class="plant-reveal-fact">
        🌿 <strong>Fun Fact:</strong> ${funFact}
      </div>
      <p style="color: var(--text-secondary); font-size: var(--fs-sm); margin-top: var(--space-md);">
        This ${plantType?.name || 'plant'} has been added to your Botanical Collection! 🏛️
      </p>
      <button class="btn btn-primary" id="btn-close-reveal">View My Collection</button>
    </div>
  `;

  modalOverlay.classList.remove('hidden');

  document.getElementById('btn-close-reveal')?.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    switchTab('garden');
  });
}

// ---- Modal ----
function bindModal() {
  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('modal-overlay')?.classList.add('hidden');
  });
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
      document.getElementById('modal-overlay')?.classList.add('hidden');
    }
  });
}

// ---- Water Tracker ----
function bindWaterTracker() {
  document.getElementById('btn-log-water')?.addEventListener('click', logWater);
  document.getElementById('mobile-water-btn')?.addEventListener('click', logWater);
}

function logWater() {
  store.logWater();
  renderWaterGlasses();

  // Trigger garden watering if garden is active
  if (gardenGame && gardenGame.scene) {
    gardenGame.scene.doWater(448, 256);
  }

  const count = store.state.water.today;
  const flOz = count * 8;
  showToast(`💧 Water logged! (${count}/8 glasses — ${flOz} fl oz)`);
}

function renderWaterGlasses() {
  const container = document.getElementById('water-glasses');
  if (!container) return;

  const count = store.state.water.today;
  container.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    const glass = document.createElement('div');
    glass.className = 'water-glass' + (i < count ? ' filled' : '');
    container.appendChild(glass);
  }

  const countNum = document.getElementById('water-count-num');
  if (countNum) countNum.textContent = count;

  const ozNum = document.getElementById('water-oz-num');
  if (ozNum) ozNum.textContent = count * 8;
}

// ---- Analytics Controls ----
function bindAnalyticsControls() {
  document.getElementById('btn-export-data')?.addEventListener('click', () => {
    store.exportJSON();
    showToast('📥 Data exported as JSON');
  });

  document.getElementById('btn-log-weight')?.addEventListener('click', () => {
    const input = document.getElementById('weight-input');
    const value = parseFloat(input?.value);
    if (!value || value <= 0) {
      showToast('Please enter a valid weight');
      return;
    }
    store.logWeight(value);
    if (input) input.value = '';
    showToast(`⚖️ Weight logged: ${value} lbs`);

    if (analytics) analytics.refresh();
  });
}

// ---- Wellness Tab ----
// ---- Wellness Tab ----
function bindWellnessTab() {
  // Save journal
  document.getElementById('btn-save-journal')?.addEventListener('click', () => {
    saveJournal();
  });

  // Log metrics
  document.getElementById('btn-log-metrics')?.addEventListener('click', () => {
    const mood = parseInt(document.getElementById('metric-mood')?.value) || 5;
    const sleep = parseInt(document.getElementById('metric-sleep')?.value) || 5;
    const energy = parseInt(document.getElementById('metric-energy')?.value) || 5;
    store.saveMetrics(mood, sleep, energy);
    showToast('📊 Metrics saved! (Avg: ' + ((mood + sleep + energy) / 3).toFixed(1) + ')');
    updateWellnessUI();
  });

  // Edit metrics
  document.getElementById('btn-edit-metrics')?.addEventListener('click', () => {
    document.getElementById('metrics-saved-overlay')?.classList.add('hidden');
  });

  // Edit journal
  document.getElementById('btn-edit-journal')?.addEventListener('click', () => {
    document.getElementById('journal-saved-overlay')?.classList.add('hidden');
    // Put text back in textarea
    const textarea = document.getElementById('journal-entry');
    const todayJournal = store.getTodayJournal();
    if (textarea && todayJournal) {
      textarea.value = todayJournal.text;
    }
  });

  // AI Coaching
  document.getElementById('btn-get-coaching')?.addEventListener('click', () => {
    if (!store.canUseCoach()) {
      showToast('🤖 Bloom Coach is resting. (Limit: 5/day)');
      return;
    }
    generateCoachingInsights();
    store.incrementCoachUsage();
  });
}

function updateWellnessUI() {
  const today = new Date().toDateString();
  
  // Metrics Overlay
  const metricsOverlay = document.getElementById('metrics-saved-overlay');
  if (metricsOverlay) {
    if (store.state.lastMetricsSaveDate === today) {
      metricsOverlay.classList.remove('hidden');
    } else {
      metricsOverlay.classList.add('hidden');
    }
  }

  // Journal Overlay
  const journalOverlay = document.getElementById('journal-saved-overlay');
  if (journalOverlay) {
    if (store.state.lastJournalSaveDate === today) {
      journalOverlay.classList.remove('hidden');
    } else {
      journalOverlay.classList.add('hidden');
    }
  }

  // Update chart average
  updateWellbeingAvg();
  renderMetricsHistory();
  renderPastEntries();
}

function updateWellbeingAvg() {
  const metrics = store.state.metrics.slice(-7);
  const badge = document.getElementById('wellbeing-avg-badge');
  if (!badge) return;

  if (metrics.length === 0) {
    badge.textContent = 'Avg: --';
    return;
  }

  const avg = metrics.reduce((acc, m) => acc + (m.mood + m.sleep + m.energy) / 3, 0) / metrics.length;
  badge.textContent = `Weekly Avg: ${avg.toFixed(1)}`;
}

function saveJournal() {
  const textarea = document.getElementById('journal-entry');
  if (!textarea) return;

  const text = textarea.value.trim();
  if (!text) return;

  store.saveJournal(text);
  textarea.value = ''; // Clear after save

  // Show saved message
  const msg = document.getElementById('journal-saved-msg');
  if (msg) {
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }

  renderPastEntries();
}

function renderPastEntries() {
  const container = document.getElementById('past-entries-list');
  if (!container) return;

  const entries = store.state.journal.slice(0, 15);

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-msg">No journal entries yet. Start writing!</p>';
    return;
  }

  container.innerHTML = entries.map((entry, idx) => {
    const d = new Date(entry.timestamp);
    const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const hasFast = entry.fastSeconds > 0;
    const fastHours = (entry.fastSeconds / 3600).toFixed(1);

    return `
      <div class="journal-item">
        <div class="journal-header" style="display:flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display:flex; align-items:center; gap:10px;">
            <strong style="color:var(--accent);">${dateStr}</strong>
            <span style="font-size: 0.8rem; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${entry.text}</span>
          </div>
          <div style="display:flex; gap:8px;">
            ${entry.metrics ? '<span>😊</span>' : ''}
            ${hasFast ? '<span>🌱</span>' : ''}
            <span class="expand-icon" style="font-size:0.7rem; opacity:0.4;">▼</span>
          </div>
        </div>
        <div class="journal-details hidden" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
          <div class="journal-meta-row" style="display:flex; gap:15px; margin-bottom:12px;">
            ${entry.metrics ? `
              <div class="journal-meta-item">😊 ${entry.metrics.mood}</div>
              <div class="journal-meta-item">😴 ${entry.metrics.sleep}</div>
              <div class="journal-meta-item">⚡ ${entry.metrics.energy}</div>
            ` : ''}
            ${hasFast ? `<div class="journal-meta-item">⏱️ ${fastHours}h fast</div>` : ''}
          </div>
          <p style="white-space: pre-wrap; line-height:1.5;">${escapeHtml(entry.text)}</p>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners for expansion
  container.querySelectorAll('.journal-item').forEach(item => {
    item.addEventListener('click', () => {
      const details = item.querySelector('.journal-details');
      const icon = item.querySelector('.expand-icon');
      details.classList.toggle('hidden');
      icon.textContent = details.classList.contains('hidden') ? '▼' : '▲';
    });
  });
}

function renderMetricsHistory() {
  const container = document.getElementById('metrics-history-list');
  if (!container) return;

  const metricsArr = store.state.metrics.slice(-14).reverse();
  if (metricsArr.length === 0) {
    container.innerHTML = '<p class="empty-msg">No metrics logged yet.</p>';
    return;
  }

  container.innerHTML = metricsArr.map(m => {
    const d = new Date(m.timestamp);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const avg = ((m.mood + m.sleep + m.energy) / 3).toFixed(1);
    return `
      <div class="journal-item" style="padding: 10px 15px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${dateStr}</strong>
          <div style="display:flex; gap:12px; font-size:0.85rem;">
            <span>😊 ${m.mood}</span>
            <span>😴 ${m.sleep}</span>
            <span>⚡ ${m.energy}</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:10px; font-size:0.75rem;">Avg: ${avg}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- AI Coach ----
function generateCoachingInsights() {
  const output = document.getElementById('ai-coach-output');
  if (!output) return;

  const entries = store.state.journal.slice(-7);
  const metrics = store.state.metrics.slice(-7);
  const fasts = store.state.fasts.filter(f => f.completed).slice(-7);

  if (entries.length === 0 && metrics.length === 0 && fasts.length === 0) {
    output.innerHTML = '<p class="empty-msg">📝 Start tracking to unlock insights!</p>';
    return;
  }

  const pool = [];

  // Fasting Insights
  if (fasts.length > 0) {
    const streak = store.state.streakCount;
    if (streak >= 3) {
      pool.push({ title: '🔥 Consistency Hero', text: `You're on a ${streak}-day streak! Your body is likely shifting into metabolic flexibility mode.` });
    }
  }

  // Journal-based insights (Keyword analysis)
  const recentJournal = store.state.journal[0]?.text?.toLowerCase() || "";
  if (recentJournal.includes("tired") || recentJournal.includes("sleep")) {
    pool.push({ title: '😴 Rest Prioritization', text: "Your recent entry mentions fatigue. Ensure you're hitting your sleep goals; deep sleep supports autophagy." });
  }
  if (recentJournal.includes("hungry") || recentJournal.includes("craving")) {
    pool.push({ title: '🌊 Hydration Check', text: "Cravings detected. Often the body confuses thirst for hunger. Try a sparkling mineral water." });
  }
  if (recentJournal.includes("victory") || recentJournal.includes("happy") || recentJournal.includes("great")) {
    pool.push({ title: '🌟 Positive Momentum', text: "You're celebrating victories! This mindset strengthens your discipline. Keep growing!" });
  }

  // Fasting Insights
  const completed = store.state.fasts.filter(f => f.completed);
  if (completed.length > 5) {
    pool.push({ title: '🔥 Fat Adapted', text: "With over 5 fasts completed, your metabolic flexibility is improving. You're becoming a more efficient fat burner." });
  }

  // Variety - pick a random "Did you know?" if pool is small
  const trivia = [
    { title: '💡 Did you know?', text: "Autophagy (cellular cleanup) typically peaks between 24-48 hours of fasting." },
    { title: '🧬 Genetic Health', text: "Fasting triggers SIRT1 genes, which are associated with longevity and DNA repair." },
    { title: '🧠 Brain Fuel', text: "BDNF (brain-derived neurotrophic factor) increases during fasts, supporting new neuron growth." }
  ];

  const finalInsights = [];
  // Ensure variety: prioritize unique pool items
  const uniquePool = [...new Map(pool.map(item => [item.title, item])).values()];
  
  while (finalInsights.length < 3) {
    if (uniquePool.length > 0) {
      finalInsights.push(uniquePool.shift());
    } else {
      const item = trivia[Math.floor(Math.random() * trivia.length)];
      if (!finalInsights.find(ins => ins.title === item.title)) finalInsights.push(item);
      else break;
    }
  }

  output.innerHTML = finalInsights.map(insight => `
    <div class="coach-insight" style="background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; margin-bottom:10px; border-left: 3px solid var(--accent);">
      <h4 style="margin:0 0 5px 0; color:var(--accent);">${insight.title}</h4>
      <p style="margin:0; font-size:0.9rem; line-height:1.4;">${insight.text}</p>
    </div>
  `).join('');
}

function bindMetricSliders() {
  ['mood', 'sleep', 'energy'].forEach(metric => {
    const slider = document.getElementById(`metric-${metric}`);
    const display = document.getElementById(`metric-${metric}-val`);
    if (slider && display) {
      slider.addEventListener('input', () => {
        display.textContent = slider.value;
      });
    }
  });
}

// ---- Garden Tools ----
function bindGardenTools() {
  document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toolbar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tool = btn.dataset.tool;
      if (gardenGame) gardenGame.setTool(tool);

      // Toggle decor panel
      const decorPanel = document.getElementById('decor-panel');
      if (tool === 'decor') {
        decorPanel?.classList.remove('hidden');
      } else {
        decorPanel?.classList.add('hidden');
      }
    });
  });
}

function updateGardenStats() {
  const plantCount = document.getElementById('garden-plant-count');
  const tierLabel = document.getElementById('garden-tier-label');
  if (plantCount) plantCount.textContent = store.state.garden.plants.length;
  if (tierLabel && gardenGame) tierLabel.textContent = gardenGame.getTierLabel();
}

function updateInventoryBadges() {
  if (!store.state.inventory) store.state.inventory = { water: 0, fertilizer: 0 };
  const waterBadge = document.getElementById('badge-water');
  const fertBadge = document.getElementById('badge-fertilizer');
  if (waterBadge) waterBadge.textContent = store.state.inventory.water;
  if (fertBadge) fertBadge.textContent = store.state.inventory.fertilizer;
}

function initDecorPanel() {
  const grid = document.getElementById('decor-grid');
  if (!grid) return;

  const plantCount = store.state.garden.plants.length;

  DECORATIONS_CATALOG.forEach(decor => {
    const isUnlocked = plantCount >= decor.unlockAt;
    const item = document.createElement('div');
    item.className = 'decor-item' + (isUnlocked ? '' : ' locked');
    item.innerHTML = `
      <span class="decor-emoji">${decor.emoji}</span>
      <span>${decor.label}</span>
      ${!isUnlocked ? `<span style="font-size:0.6rem;color:var(--text-muted)">${decor.unlockAt} plants</span>` : ''}
    `;

    if (isUnlocked) {
      item.addEventListener('click', () => {
        if (gardenGame) {
          gardenGame.placeDecoration(decor.type);
          showToast(`${decor.emoji} ${decor.label} placed in your garden!`);
          updateGardenStats();
        }
      });
    }

    grid.appendChild(item);
  });
}

// ---- Test Plants (adds sample plants for garden testing) ----
function bindTestPlants() {
  document.getElementById('btn-add-test-plants')?.addEventListener('click', () => {
    const speciesSample = PLANT_SPECIES.slice(0, 5);
    speciesSample.forEach((species, i) => {
      const plant = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + i,
        type: species,
        name: species.name,
        x: 100 + i * 160,
        y: 180 + (i % 2) * 120,
        plantedAt: Date.now() - (i + 1) * 3600000,
        completedAt: Date.now(),
        rarity: species.rarity
      };
      store.state.garden.plants.push(plant);

      // Also add a fake completed fast so analytics shows data
      store.state.fasts.push({
        startTime: Date.now() - (i + 1) * 20 * 3600000,
        endTime: Date.now() - i * 3600000,
        goalMs: 16 * 3600000,
        actualMs: 16 * 3600000,
        completed: true,
        plan: '16:8',
        plantType: species
      });
    });

    store.save();

    showToast(`🧪 Added ${speciesSample.length} test plants to your garden!`);

    // Refresh garden
    if (gardenGame) {
      gardenGame.refreshPlants();
      updateGardenStats();
    }

    // Refresh analytics
    if (analytics) analytics.refresh();
  });
}

// ---- Settings ----
function bindSettings() {
  const hydrateNotif = document.getElementById('setting-notif-hydrate');
  const hydrateFreq = document.getElementById('setting-hydrate-freq');

  if (hydrateNotif) {
    hydrateNotif.checked = store.state.notifications.hydrate;
    hydrateNotif.addEventListener('change', () => {
      store.state.notifications.hydrate = hydrateNotif.checked;
      store.save();
    });
  }

  if (hydrateFreq) {
    hydrateFreq.value = store.state.notifications.hydrateFrequency || 2;
    hydrateFreq.addEventListener('change', () => {
      store.state.notifications.hydrateFrequency = parseInt(hydrateFreq.value);
      store.save();
    });
  }

  document.getElementById('btn-enable-notif')?.addEventListener('click', () => {
    // This usually requires a user interaction, which we have here
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") showToast("🚀 Notifications enabled!");
      });
    }
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "bloom_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('📥 Data exported as JSON');
  });

  document.getElementById('btn-clear-data')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('bloom:confirm', {
      detail: {
        title: 'Clear All Data?',
        message: 'This will erase everything. Fasts, Journal, and Garden will be gone forever.',
        onConfirm: () => {
          localStorage.clear();
          location.reload();
        }
      }
    }));
  });
}

// ---- Mobile ----
function bindMobile() {
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Close sidebar on outside click
  document.getElementById('main-content')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
  });
}

// ---- Utility ----
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---- Custom Confirm Modal ----
function customConfirm(title, message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-msg');
  const btnCancel = document.getElementById('btn-confirm-cancel');
  const btnProceed = document.getElementById('btn-confirm-proceed');

  if (!modal || !titleEl || !msgEl || !btnCancel || !btnProceed) return;

  titleEl.textContent = title;
  msgEl.textContent = message;
  modal.classList.remove('hidden');

  const close = () => modal.classList.add('hidden');

  btnCancel.onclick = () => {
    close();
  };

  btnProceed.onclick = () => {
    onConfirm();
    close();
  };
}

// Global confirm listener for modules
window.addEventListener('bloom:confirm', (e) => {
  const { title, message, onConfirm } = e.detail;
  customConfirm(title, message, onConfirm);
});

// ---- Start ----
document.addEventListener('DOMContentLoaded', init);

