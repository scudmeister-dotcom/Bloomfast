/* ============================================================
   Main — Application Orchestration
   ============================================================ */

import { store } from './js/store.js';
import { FastingTimer, PLANS } from './js/timer.js';
import { PlantRenderer, getRandomPlant, PLANT_SPECIES } from './js/plant.js';
import { PlantSVGRenderer } from './js/plant-svg.js';
import { CollectionGallery } from './js/collection-gallery.js';
import { AnalyticsDashboard } from './js/analytics.js';
import { showToast } from './js/social.js';
import { NotificationManager } from './js/notifications.js';
import { DECORATIONS_CATALOG } from './js/garden.js';

// ---- Globals ----
let timer, plantRenderer, plantSVG, collectionGallery, analytics, social, notifications;
let selectedPlan = null;

// ---- Plant SVG Helpers ----
function showPlantSVG(category, progress) {
  document.getElementById('plant-canvas').style.display = 'none';
  // show() BEFORE setCategory() — renderers call getTotalLength() in _build(),
  // which returns 0 on display:none elements, causing strokes to stay fully visible.
  plantSVG.show();
  plantSVG.setCategory(category);
  plantSVG.setProgress(progress ?? 0);
}

function hidePlantSVG() {
  plantSVG.hide();
  document.getElementById('plant-canvas').style.display = '';
}

// ---- Initialize ----
function init() {
  // Create managers
  timer = new FastingTimer(store);
  plantRenderer = new PlantRenderer(document.getElementById('plant-canvas'));
  plantSVG = new PlantSVGRenderer(document.getElementById('plant-svg'));
  notifications = new NotificationManager(store);

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

  // Bind color palette theme switcher
  bindThemeSwitcher();

  // Initialize water glasses display
  renderWaterGlasses();

  // Timer callbacks
  timer.onTick = onTimerTick;
  timer.onComplete = onFastComplete;

  // Resume active fast if any
  if (timer.resume()) {
    showActiveFastUI();
    showPlantSVG(store.state.activeFast.plantType.category, timer.progress);
    plantRenderer.startAnimation();
  } else {
    plantRenderer.startAnimation();
  }

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

  // Debug: Unlock All Cards
  document.getElementById('btn-debug-unlock-all')?.addEventListener('click', () => {
    customConfirm(
      'Unlock All Cards?',
      'This will instantly add all 156 plant species and variations to your collection for debugging. This cannot be easily undone except by resetting all data.',
      () => {
        store.unlockAll();
        showToast('🔓 All 156 species unlocked! Refreshing garden...');
        if (collectionGallery) collectionGallery.render();
      }
    );
  });

  // Subscribe to state changes
  store.subscribe(() => {
    renderWaterGlasses();
    updateWellnessUI();
  });

  // Auto-generate coach insights on load
  setTimeout(() => generateCoachingInsights(), 500);

  // Render wellness date
  renderWellnessDate();
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
    renderWellnessDate();
    updateWellnessUI();
  }

  if (tabName === 'social') {
    social.updateProfile();
  }

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

  // Single fast action button — starts or stops depending on state
  document.getElementById('btn-fast-action')?.addEventListener('click', () => {
    if (!timer.isRunning) {
      startFast();
    } else {
      const isGoalMet = timer.elapsedMs >= timer.activeFast.goalMs;
      const title = isGoalMet ? 'Finish Fast?' : 'End Fast Early?';
      const msg = isGoalMet
        ? 'Great job! Ready to harvest your plant and end the fast?'
        : "Are you sure you want to end your fast early? The plant won't be added to your garden.";

      customConfirm(title, msg, () => {
        const { success, plant } = store.completeFast();
        timer.stopTicking();
        plantRenderer.setProgress(0);
        plantRenderer.setPlant(null);

        if (!success) {
          logAndResetWater(false);
          showIdleTimerUI();
          showToast('Fast ended early. 🌸');
        } else {
          onFastComplete({ plant });
        }
      });
    }
  });

  // Debug Timer Controls
  document.getElementById('btn-debug-add-1h')?.addEventListener('click', () => {
    if (!timer.isRunning) {
      showToast('Start a fast first to adjust time!');
      return;
    }
    store.adjustActiveFast(1);
    showToast('⏩ Added 1 hour to active fast');
    // Tick manually to update UI immediately
    if (timer.tickInterval) onTimerTick(timer);
  });

  document.getElementById('btn-debug-sub-1h')?.addEventListener('click', () => {
    if (!timer.isRunning) {
      showToast('Start a fast first to adjust time!');
      return;
    }
    store.adjustActiveFast(-1);
    showToast('⏪ Subtracted 1 hour from active fast');
    if (timer.tickInterval) onTimerTick(timer);
  });

  document.getElementById('btn-debug-fast-forward')?.addEventListener('click', () => {
    if (!timer.isRunning) {
      showToast('Start a fast first to adjust time!');
      return;
    }
    // Calculate how many hours to reach 99%
    const goalHours = timer.activeFast.goalMs / 3600000;
    const currentElapsedHours = (Date.now() - timer.activeFast.startTime) / 3600000;
    const targetHours = goalHours * 0.99;
    const diff = targetHours - currentElapsedHours;
    
    store.adjustActiveFast(diff);
    showToast('🚀 Fast forwarded to 99% completion!');
    if (timer.tickInterval) onTimerTick(timer);
  });

  // Animation preview helpers (debug)
  function startPreview(category) {
    if (window._previewInterval) clearInterval(window._previewInterval);
    showPlantSVG(category, 0);
    let p = 0;
    window._previewInterval = setInterval(() => {
      p += 0.015;
      plantSVG.setProgress(Math.min(1, p));
      if (p >= 1) { clearInterval(window._previewInterval); window._previewInterval = null; }
    }, 100);
  }
  document.getElementById('btn-debug-zen')?.addEventListener('click', () => startPreview('Zen'));
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

  // Build set of already-earned plant IDs to avoid duplicates
  const earnedIds = new Set();
  store.state.garden.plants.forEach(p => {
    if (p.type?.id) earnedIds.add(p.type.id);
  });
  store.state.fasts.filter(f => f.completed && f.plantType?.id).forEach(f => {
    earnedIds.add(f.plantType.id);
  });

  const plantType = getRandomPlant(earnedIds);

  const allCollectedAtStart = !plantType;
  if (allCollectedAtStart) {
    showToast('✦ Legendary. Your constellation is complete.');
  }

  // Reset hydration at the start of every new fast
  logAndResetWater(false);

  timer.start(selectedPlan, goalMs, plantType);
  console.log('[Bloomfast] Plant selected:', plantType?.name ?? 'Zen Garden (all collected)', '| Category:', plantType?.category ?? 'Zen');

  // Show SVG growth animation — Zen Garden if all plants collected
  showPlantSVG(plantType?.category ?? 'Zen', 0);

  // Update UI — hide species info, show mystery
  showActiveFastUI();

  document.getElementById('plant-species-label').textContent = allCollectedAtStart
    ? '✦ Your constellation — all plants collected'
    : '🌱 A mystery seed is growing...';
  document.getElementById('growth-stage-label').textContent = timer.growthStageLabel;

  // Notification
  notifications.notifyFastStart();

  if (!allCollectedAtStart) showToast('🌱 Fast started! A mystery seed has been planted...');
  setTimeout(() => generateCoachingInsights(), 300);
}

// ---- Hydration helpers ----
function logAndResetWater(success) {
  const count = store.state.water.today;
  if (count > 0) {
    if (!store.state.water.history) store.state.water.history = [];
    store.state.water.history.push({
      date: new Date().toDateString(),
      glasses: count,
      flOz: count * 8,
      fastPlan: store.state.activeFast?.planName ?? selectedPlan ?? 'unknown',
      earlyEnd: !success
    });
  }
  store.state.water.today = 0;
  store.save();
  renderWaterGlasses();
}

function showActiveFastUI() {
  document.getElementById('plan-selector')?.classList.add('hidden');
  document.getElementById('body-status-timeline')?.classList.remove('hidden');
  document.getElementById('timer-coach-card')?.classList.add('hidden');
  document.getElementById('water-tracker-card')?.classList.remove('hidden');
  const actionBtn = document.getElementById('btn-fast-action');
  if (actionBtn) { actionBtn.innerHTML = '<span>🏁</span> Complete Fast'; actionBtn.classList.remove('btn-glow'); }

  // Mystery labels
  document.getElementById('plant-species-label').textContent = '🌱 A mystery seed is growing...';
}

function showIdleTimerUI() {
  document.getElementById('plan-selector')?.classList.remove('hidden');
  document.getElementById('body-status-timeline')?.classList.add('hidden');
  document.getElementById('timer-coach-card')?.classList.remove('hidden');
  document.getElementById('water-tracker-card')?.classList.add('hidden');
  const actionBtn = document.getElementById('btn-fast-action');
  if (actionBtn) { actionBtn.innerHTML = '<span>🌱</span> Plant a Seed'; actionBtn.classList.add('btn-glow'); }
  document.getElementById('timer-display').textContent = '00:00:00';
  document.getElementById('timer-subtitle').textContent = 'Select a fasting plan to start';
  document.getElementById('timer-progress-fill').style.width = '0%';
  document.getElementById('plant-species-label').textContent = '';
  document.getElementById('growth-stage-label').textContent = 'Plant a seed to begin';
  document.getElementById('tab-timer').style.backgroundColor = '';
  hidePlantSVG();
}

// ---- Seasonal Helpers ----
function getSeasonMessage(progress) {
  if (progress <= 0)    return 'Plant a seed to begin';
  if (progress < 0.20)  return '🌰 The seed is resting';
  if (progress < 0.40)  return '🌱 Roots are reaching';
  if (progress < 0.60)  return '🌿 Something stirs underground';
  if (progress < 0.80)  return '🌼 Breaking through the soil';
  if (progress < 1.0)   return '🌸 Reaching for the light';
  return '🌺 In full bloom';
}

// Color key arrays per category: [progress, hue, saturation%, lightness%]
// All start in dark green tones, each ends with a signature hue.
// All categories stay identical dark-green until p=0.40 — the type is a mystery
// until the plant has been visibly growing for a while.
const CATEGORY_GRADIENT_KEYS = {
  Flowers: [
    [0,    150, 28,  7 ],  // dark forest green — same for ALL types
    [0.40, 150, 28,  7 ],  // still neutral at 40%
    [0.62, 310, 30,  9 ],  // soft pink hint
    [0.82, 332, 42, 10 ],  // rose
    [1.0,  345, 52, 12 ],  // full pink bloom
  ],
  Trees: [
    [0,    150, 28,  7 ],
    [0.40, 150, 28,  7 ],
    [0.62,  96, 34,  8 ],  // yellow-green canopy hint
    [0.82,  56, 40,  9 ],  // golden
    [1.0,   32, 50, 10 ],  // warm amber
  ],
  Succulents: [
    [0,    150, 28,  7 ],
    [0.40, 150, 28,  7 ],
    [0.62, 174, 36,  8 ],  // jade-teal hint
    [0.82, 185, 46,  9 ],  // teal
    [1.0,  192, 56, 11 ],  // deep ocean teal
  ],
  Herbs: [
    [0,    150, 28,  7 ],
    [0.40, 150, 28,  7 ],
    [0.62, 224, 28,  9 ],  // blue-lavender hint
    [0.82, 256, 36, 10 ],  // soft indigo
    [1.0,  270, 46, 12 ],  // lavender purple
  ],
  Exotic: [
    [0,    150, 28,  7 ],
    [0.40, 150, 28,  7 ],
    [0.60,  52, 24,  8 ],  // amber-olive hint
    [0.80,  14, 42,  9 ],  // brick red
    [1.0,    4, 56, 10 ],  // deep crimson
  ],
};

function updateSeasonBackground(progress, category) {
  const tab = document.getElementById('tab-timer');
  if (!tab) return;
  const keys = CATEGORY_GRADIENT_KEYS[category] || CATEGORY_GRADIENT_KEYS.Trees;
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (progress >= keys[i][0] && progress <= keys[i + 1][0]) {
      a = keys[i]; b = keys[i + 1]; break;
    }
  }
  const t = a[0] === b[0] ? 0 : (progress - a[0]) / (b[0] - a[0]);
  const lerp = (x, y) => x + (y - x) * t;
  tab.style.backgroundColor = `hsl(${Math.round(lerp(a[1], b[1]))}, ${Math.round(lerp(a[2], b[2]))}%, ${Math.round(lerp(a[3], b[3]))}%)`;
}

// ---- Timer Tick ----
let lastMilestoneHour = -1;

function onTimerTick(t) {
  // Update timer display
  document.getElementById('timer-display').textContent = t.formatTimeElapsed();
  
  const isOvertime = t.elapsedMs >= t.activeFast.goalMs;
  if (isOvertime) {
    document.getElementById('timer-subtitle').textContent = `Goal reached! +${t.formatTime(t.elapsedMs - t.activeFast.goalMs)} overtime`;
    document.getElementById('timer-subtitle').style.color = 'var(--accent-green)';
  } else {
    document.getElementById('timer-subtitle').textContent = `${t.formatTimeRemaining()} remaining`;
    document.getElementById('timer-subtitle').style.color = '';
  }
  
  document.getElementById('timer-progress-fill').style.width = `${Math.min(1, t.progress) * 100}%`;

  // Update growth stage with poetic seasonal message
  document.getElementById('growth-stage-label').textContent = getSeasonMessage(t.progress);
  updateSeasonBackground(t.progress, t.activeFast?.plantType?.category);

  // Update plant SVG
  plantSVG.setProgress(Math.min(1, t.progress));
  updateTimerDecoration(t.progress);

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
  const funFact = plantType?.funFact || 'Every fast you complete is a testament to your dedication!';
  const allCollected = !plantType;

  // Log hydration data before reset
  const waterCount = store.state.water.today;
  logAndResetWater(true);

  // Show the plant reveal modal (skip if no plant awarded)
  if (!allCollected) {
    showPlantRevealModal(plantType, funFact, waterCount);
  } else {
    showToast('🏆 Fast complete! Your streak grows stronger. Botanical Master!');
    setTimeout(() => {
      showIdleTimerUI();
      hidePlantSVG();
    }, 2000);
  }

  if (!allCollected) notifications.notifyFastComplete(plantName);

  if (!allCollected) {
    // Keep the Full Bloom visible for a moment, then reset
    setTimeout(() => {
      showIdleTimerUI();
      plantRenderer.setProgress(0);
      plantRenderer.setPlant(null);
    }, 5000);
  }

  // Update collection gallery
  if (collectionGallery) {
    collectionGallery.render();
  }

  // Refresh analytics weekly streak
  if (analytics) {
    analytics.refresh();
  }
}

function showPlantRevealModal(plantType, funFact, waterCount) {
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
      ${waterCount > 0 ? `<div class="plant-reveal-water">💧 You logged <strong>${waterCount}</strong> glass${waterCount !== 1 ? 'es' : ''} of water during this fast!</div>` : ''}
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

// ---- Timer Vine Decoration ----
function updateTimerDecoration(progress) {
  const p = Math.min(1, Math.max(0, progress ?? 0));
  const vineSets    = ['vine-L1','vine-L2','vine-L3','vine-L4','vine-R1','vine-R2','vine-R3','vine-R4'];
  const thresholds  = [0.20, 0.40, 0.60, 0.80, 0.20, 0.40, 0.60, 0.80];
  vineSets.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('opacity', Math.min(1, Math.max(0, (p - thresholds[i]) / 0.10)).toFixed(3));
  });
}


// ---- Theme Switcher ----
function bindThemeSwitcher() {
  const savedTheme = localStorage.getItem('bloomfast-theme') || 'forest';
  applyTheme(savedTheme);

  // Toggle palette open/closed
  document.getElementById('palette-toggle')?.addEventListener('click', () => {
    const swatches = document.getElementById('palette-swatches');
    const toggle   = document.getElementById('palette-toggle');
    swatches?.classList.toggle('open');
    toggle?.classList.toggle('open');
  });

  document.querySelectorAll('.palette-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('bloomfast-theme', theme);
      // Close the palette after picking
      document.getElementById('palette-swatches')?.classList.remove('open');
      document.getElementById('palette-toggle')?.classList.remove('open');
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'forest' ? '' : theme);
  document.querySelectorAll('.palette-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// ---- Water Tracker ----
function bindWaterTracker() {
  document.getElementById('btn-log-water')?.addEventListener('click', logWater);
}

function logWater() {
  if (!timer.isRunning) {
    showToast('Start a fast to log water! 💧');
    return;
  }
  store.logWater();
  renderWaterGlasses();

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

  const logBtn = document.getElementById('btn-log-water');
  const fastActive = timer?.isRunning ?? false;
  if (logBtn) logBtn.disabled = !fastActive;

}

// ---- Analytics Controls ----
let weightUnit = 'lbs'; // module-level toggle state

function bindAnalyticsControls() {
  // Weight unit toggle
  document.querySelectorAll('.weight-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      weightUnit = btn.dataset.unit;
      document.querySelectorAll('.weight-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const input = document.getElementById('weight-input');
      if (input) input.placeholder = `Weight (${weightUnit})`;
      if (analytics) analytics.setWeightUnit(weightUnit);
    });
  });

  document.getElementById('btn-export-data')?.addEventListener('click', () => {
    store.exportJSON();
    showToast('📥 Data exported as JSON');
  });

  document.getElementById('btn-log-weight')?.addEventListener('click', () => {
    const input = document.getElementById('weight-input');
    const dateInput = document.getElementById('weight-date');
    const value = parseFloat(input?.value);
    
    if (!value || value <= 0) {
      showToast('Please enter a valid weight');
      return;
    }

    let timestamp = Date.now();
    if (dateInput && dateInput.value) {
      // Use the selected date at noon to avoid timezone issues
      const [year, month, day] = dateInput.value.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
      timestamp = d.getTime();
    }

    const lbsValue = weightUnit === 'kg' ? Math.round(value * 2.20462 * 10) / 10 : value;
    store.logWeight(lbsValue, timestamp);
    if (input) input.value = '';
    showToast(`⚖️ Weight logged: ${value} ${weightUnit}`);

    if (analytics) analytics.refresh();
  });

  document.getElementById('btn-debug-mock-data')?.addEventListener('click', () => {
    customConfirm(
      'Generate Mock Data?',
      'This will inject 30 days of sample fasts, weights, and metrics. It will NOT overwrite your existing data but will add to it.',
      () => {
        store.injectMockData();
        showToast('🧪 Mock data injected! Refreshing dashboards...');
        if (analytics) analytics.refresh();
        if (collectionGallery) collectionGallery.render();
      }
    );
  });
}

// ---- Wellness Tab ----
function bindWellnessTab() {
  // Save metrics
  document.getElementById('btn-log-metrics')?.addEventListener('click', () => {
    const mood   = parseInt(document.getElementById('metric-mood')?.value)   || 5;
    const sleep  = parseInt(document.getElementById('metric-sleep')?.value)  || 5;
    const energy = parseInt(document.getElementById('metric-energy')?.value) || 5;
    store.saveMetrics(mood, sleep, energy);
    showToast('🌿 Body metrics saved!');
    updateWellnessUI();
  });

  // Edit metrics — unlock and repopulate sliders
  document.getElementById('btn-edit-metrics')?.addEventListener('click', () => {
    document.getElementById('wellness-metrics-section')?.classList.remove('daily-checkin-locked');
    document.getElementById('btn-edit-metrics')?.classList.add('hidden');
    const saved = store.getTodayMetrics();
    if (saved) {
      ['mood', 'sleep', 'energy'].forEach(m => {
        const slider  = document.getElementById(`metric-${m}`);
        const display = document.getElementById(`metric-${m}-val`);
        if (slider && saved[m] != null) { slider.value = saved[m]; if (display) display.textContent = saved[m]; }
      });
    }
    updateRitualProgress();
    showToast('✏️ Update your metrics and save again.');
  });

  // Save journal
  document.getElementById('btn-save-journal')?.addEventListener('click', () => {
    const text = document.getElementById('journal-entry')?.value.trim();
    if (!text) { showToast('Write something first! ✍️'); return; }
    saveJournal();
    showToast('📖 Journal entry saved!');
    updateWellnessUI();
  });

  // Journal history toggle
  document.getElementById('btn-toggle-journal-history')?.addEventListener('click', () => {
    const list = document.getElementById('past-entries-list');
    const btn  = document.getElementById('btn-toggle-journal-history');
    const open = list?.hasAttribute('hidden');
    if (open) { list.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
    else       { list.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
  });

  // Edit journal — unlock and restore text
  document.getElementById('btn-edit-journal')?.addEventListener('click', () => {
    document.getElementById('wellness-journal-section')?.classList.remove('daily-checkin-locked');
    document.getElementById('btn-edit-journal')?.classList.add('hidden');
    const textarea = document.getElementById('journal-entry');
    const saved = store.getTodayJournal();
    if (textarea && saved) textarea.value = saved.text;
    updateRitualProgress();
    showToast('✏️ Edit your entry and save again.');
  });
}

function renderWellnessDate() {
  const now = new Date();
  const monthFlowers = ['🌾','🌹','🌱','🌸','🌺','🌻','🌻','🌿','🍂','🍁','🌾','🌲'];
  const flower = monthFlowers[now.getMonth()];
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const el = document.getElementById('wellness-date-display');
  const flowerEl = document.getElementById('wellness-date-flower');
  if (el) el.textContent = dateStr;
  if (flowerEl) flowerEl.textContent = flower;
}

function updateWellnessUI() {
  const today = new Date().toDateString();
  const metricsDone = store.state.lastMetricsSaveDate === today;
  const journalDone = store.state.lastJournalSaveDate === today;

  // Metrics Section
  const metricsSection = document.getElementById('wellness-metrics-section');
  if (metricsSection) {
    if (metricsDone) {
      metricsSection.classList.add('daily-checkin-locked');
      document.getElementById('btn-edit-metrics')?.classList.remove('hidden');
    } else {
      metricsSection.classList.remove('daily-checkin-locked');
      document.getElementById('btn-edit-metrics')?.classList.add('hidden');
    }
  }

  // Journal Section
  const journalSection = document.getElementById('wellness-journal-section');
  if (journalSection) {
    if (journalDone) {
      journalSection.classList.add('daily-checkin-locked');
      document.getElementById('btn-edit-journal')?.classList.remove('hidden');
    } else {
      journalSection.classList.remove('daily-checkin-locked');
      document.getElementById('btn-edit-journal')?.classList.add('hidden');
    }
  }

  // Ritual Progress — based on which sections are currently locked (submitted & not editing)
  updateRitualProgress();

  // Update chart average
  updateWellbeingAvg();
  renderMetricsHistory();
  renderPastEntries();
}

function updateRitualProgress() {
  const metricsLocked = document.getElementById('wellness-metrics-section')?.classList.contains('daily-checkin-locked');
  const journalLocked = document.getElementById('wellness-journal-section')?.classList.contains('daily-checkin-locked');
  const pct = (metricsLocked ? 50 : 0) + (journalLocked ? 50 : 0);
  const fill = document.getElementById('ritual-progress-fill');
  const label = document.getElementById('ritual-progress-pct');
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
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

  const entries = store.state.journal.slice(0, 20);

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-msg vine-empty">No journal entries yet. Start writing!</p>';
    return;
  }

  // Build a lookup map: dateString → glasses
  const waterByDate = {};
  (store.state.water.history || []).forEach(h => { waterByDate[h.date] = h.glasses || 0; });
  waterByDate[new Date().toDateString()] = store.state.water.today || 0;

  const nodeEmojis = ['🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '🍀', '🌸', '🌺', '🌼'];

  container.innerHTML = entries.map((entry, i) => {
    const d = new Date(entry.timestamp);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const entryDate = d.toDateString();
    const hasFast = entry.fastSeconds > 0;
    const fastHours = hasFast ? (entry.fastSeconds / 3600).toFixed(1) : null;
    const glasses = waterByDate[entryDate] ?? 0;
    const emoji = nodeEmojis[i % nodeEmojis.length];

    const fastBadge = fastHours ? `<span class="jlog-badge jlog-badge-fast">🌱 ${fastHours}h fast</span>` : '';
    const waterBadge = `<span class="jlog-badge jlog-badge-water">💧 ${glasses} glass${glasses !== 1 ? 'es' : ''}</span>`;

    return `
      <div class="vine-entry" style="--vine-i:${i}">
        <div class="vine-dot">${emoji}</div>
        <div class="vine-entry-content">
          <div class="jlog-date">${dateStr}</div>
          <div class="jlog-badges">${fastBadge}${waterBadge}</div>
          <p class="jlog-text">${escapeHtml(entry.text)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function renderMetricsHistory() {
  const container = document.getElementById('metrics-history-list');
  if (!container) return;

  const metricsArr = store.state.metrics.slice(-30).reverse();
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

  const name = store.state.profile?.name || 'there';
  const allFasts = store.state.fasts;
  const completed = allFasts.filter(f => f.completed);
  const recentMetrics = store.state.metrics.slice(-7);
  const allJournal = store.state.journal;
  const recentJournal = allJournal.slice(0, 5);
  const streak = store.state.streakCount || 0;
  const weights = store.state.weight;

  const hasAnyData = completed.length > 0 || recentMetrics.length > 0 || allJournal.length > 0;
  if (!hasAnyData) {
    output.innerHTML = `<p class="empty-msg">🌱 Hey ${name}! Log your first fast, metrics, or journal entry and I'll start personalizing your insights.</p>`;
    return;
  }

  const pool = [];

  // ---- Fasting patterns ----
  if (completed.length > 0) {
    const avgMs = completed.reduce((s, f) => s + (f.actualMs || 0), 0) / completed.length;
    const avgH = Math.round(avgMs / 3600000 * 10) / 10;

    if (streak >= 7) {
      pool.push({ title: '🌺 7-Day Bloomer', text: `${name}, you've fasted ${streak} days in a row! At this level your body is deep into metabolic flexibility. You're building something lasting.` });
    } else if (streak >= 3) {
      pool.push({ title: '🌿 Growing Streak', text: `${streak} days in a row, ${name}. Consistency is your superpower right now — keep nurturing it like a seedling that needs daily sunlight.` });
    } else if (streak === 1) {
      pool.push({ title: '🌱 First Step', text: `You started today, ${name}. Every garden begins with a single seed. Show up again tomorrow and a streak begins.` });
    }

    if (completed.length >= 10) {
      pool.push({ title: '🌳 Root System Strong', text: `${completed.length} completed fasts — you're no longer experimenting, you're practicing. Your average is ${avgH}h, a solid foundation for deep metabolic health.` });
    } else if (completed.length >= 3) {
      pool.push({ title: '🌿 Pattern Forming', text: `${completed.length} fasts completed with an average of ${avgH}h. The habit loop is taking shape — your body is learning to expect and adapt to fasting windows.` });
    }

    // Completion rate
    const rate = Math.round((completed.length / (allFasts.length || 1)) * 100);
    if (allFasts.length >= 3 && rate < 60) {
      pool.push({ title: '🌻 Early Endings', text: `About ${100 - rate}% of your fasts end early. That's okay — observe what time of day cravings hit hardest and try shifting your eating window to protect those hours.` });
    } else if (allFasts.length >= 3 && rate >= 85) {
      pool.push({ title: `🏆 Bloom Rate ${rate}%`, text: `${rate}% of your fasts reach full bloom, ${name}. That level of follow-through is rare. Your garden reflects it.` });
    }

    // Most used plan
    const planCounts = {};
    allFasts.forEach(f => { if (f.planName) planCounts[f.planName] = (planCounts[f.planName] || 0) + 1; });
    const favPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0];
    if (favPlan && favPlan[1] >= 3) {
      pool.push({ title: `🗓️ Your Rhythm: ${favPlan[0]}`, text: `You've leaned on ${favPlan[0]} ${favPlan[1]} times. Consistency with a single protocol is more effective than switching — your body thrives on predictable fasting windows.` });
    }
  }

  // ---- Wellness metrics ----
  if (recentMetrics.length >= 3) {
    const avg = key => Math.round(recentMetrics.reduce((s, m) => s + (m[key] || 0), 0) / recentMetrics.length * 10) / 10;
    const avgMood = avg('mood'), avgSleep = avg('sleep'), avgEnergy = avg('energy');

    // Trend: compare first half vs second half
    const half = Math.floor(recentMetrics.length / 2);
    const old = recentMetrics.slice(0, half);
    const fresh = recentMetrics.slice(half);
    const trendAvg = (arr, key) => arr.length ? arr.reduce((s, m) => s + (m[key] || 0), 0) / arr.length : 0;

    const moodTrend = trendAvg(fresh, 'mood') - trendAvg(old, 'mood');
    const energyTrend = trendAvg(fresh, 'energy') - trendAvg(old, 'energy');
    const sleepTrend = trendAvg(fresh, 'sleep') - trendAvg(old, 'sleep');

    if (moodTrend >= 1) {
      pool.push({ title: '😊 Mood Rising', text: `Your mood scores have been climbing, ${name}. Fasting often reduces inflammation which directly impacts emotional regulation. You're feeling the effect.` });
    } else if (moodTrend <= -1.5) {
      pool.push({ title: '💙 Mood Check-in', text: `Your mood has dipped recently. Make sure you're eating nutrient-dense meals in your window — micronutrient deficiencies can mask as low mood.` });
    }

    if (energyTrend >= 1) {
      pool.push({ title: '⚡ Energy Blooming', text: `Energy trending up over your last ${recentMetrics.length} check-ins (avg ${avgEnergy}/10). Your mitochondria are adapting — this is fat adaptation in action.` });
    } else if (avgEnergy <= 4) {
      pool.push({ title: '⚡ Low Energy Signal', text: `Average energy at ${avgEnergy}/10, ${name}. Try extending your eating window slightly or adding more protein and healthy fats during your window.` });
    }

    if (avgSleep <= 5) {
      pool.push({ title: '🌙 Sleep is the Root', text: `Sleep averaging ${avgSleep}/10. Deep sleep is when autophagy peaks and growth hormone surges — your fasting benefits are amplified by quality rest.` });
    } else if (sleepTrend >= 1) {
      pool.push({ title: '🌙 Sleep Improving', text: `Sleep quality trending upward! Many people find fasting improves sleep by stabilizing blood sugar overnight. You may be experiencing this firsthand.` });
    }

    // Best and worst metric
    const pairs = [['mood', avgMood], ['sleep', avgSleep], ['energy', avgEnergy]];
    pairs.sort((a, b) => b[1] - a[1]);
    if (pairs[0][1] >= 7) {
      const labels = { mood: 'mood 😊', sleep: 'sleep 🌙', energy: 'energy ⚡' };
      pool.push({ title: `✨ Strong ${pairs[0][0].charAt(0).toUpperCase() + pairs[0][0].slice(1)}`, text: `Your ${labels[pairs[0][0]]} is your brightest metric at ${pairs[0][1]}/10. Protect what's driving it — note the habits on those high-${pairs[0][0]} days.` });
    }
  } else if (recentMetrics.length === 0 && completed.length >= 2) {
    pool.push({ title: '📊 Track Your Bloom', text: `${name}, you've completed fasts but haven't logged wellness metrics yet. Mood, sleep, and energy data will help me give you much sharper insights.` });
  }

  // ---- Journal patterns ----
  const combinedJournal = recentJournal.map(j => j.text?.toLowerCase() || '').join(' ');
  if (combinedJournal) {
    if (combinedJournal.match(/tired|exhausted|fatigue|drained/)) {
      pool.push({ title: '😴 Fatigue Pattern', text: `Your journal mentions fatigue more than once. Consider whether your eating window provides enough calories and iron-rich foods — fatigue is the #1 sign of under-fueling.` });
    }
    if (combinedJournal.match(/hungry|craving|starving|weak/)) {
      pool.push({ title: '💧 Hunger vs. Thirst', text: `Cravings show up in your recent entries. Your brain can't distinguish hunger from thirst — try 500ml of water when a craving hits. It works more often than you'd expect.` });
    }
    if (combinedJournal.match(/great|amazing|strong|proud|accomplished|won|best/)) {
      pool.push({ title: '🌟 Victory Mindset', text: `Your journal is full of wins, ${name}. Documenting victories isn't just motivating — it rewires how your brain perceives the challenge. Keep writing them down.` });
    }
    if (combinedJournal.match(/stress|anxious|overwhelm|hard|difficult/)) {
      pool.push({ title: '🌿 Stress & Fasting', text: `Your entries mention stress. High cortisol can make fasting feel harder and slow fat adaptation. Even 5 minutes of breathing before your window opens can help.` });
    }
    if (combinedJournal.match(/coffee|caffeine|tea/)) {
      pool.push({ title: '☕ Caffeine Timing', text: `Coffee and tea appear in your journal. Black coffee doesn't break a fast and can even boost autophagy — just avoid it within 6 hours of sleep to protect your sleep quality.` });
    }
  }

  // ---- Hydration ----
  const waterHistory = store.state.water.history || [];
  if (waterHistory.length >= 3) {
    const avgGlasses = waterHistory.slice(-7).reduce((s, h) => s + (h.glasses || 0), 0) / Math.min(waterHistory.length, 7);
    if (avgGlasses < 4) {
      pool.push({ title: '💧 Hydration Gap', text: `Your average hydration is under 4 glasses per fasting window, ${name}. Dehydration mimics hunger, slows autophagy, and tanks energy. Aim for 8 glasses.` });
    } else if (avgGlasses >= 7) {
      pool.push({ title: '💧 Hydration Champion', text: `Averaging ${Math.round(avgGlasses)} glasses per fast — your cells are thanking you. Proper hydration amplifies every fasting benefit from cognitive clarity to fat oxidation.` });
    }
  }

  // ---- Weight trend ----
  if (weights.length >= 5) {
    const recent5 = weights.slice(-5);
    const first = recent5[0].value, last = recent5[recent5.length - 1].value;
    const diff = Math.round((last - first) * 10) / 10;
    if (diff < -1) {
      pool.push({ title: `⚖️ ${Math.abs(diff)} lbs Down`, text: `You've dropped ${Math.abs(diff)} lbs over your last few weigh-ins, ${name}. Steady, gradual loss is the most sustainable — your body is adapting, not just shrinking.` });
    } else if (diff > 1) {
      pool.push({ title: '⚖️ Weight Check', text: `The scale has moved up slightly. This could be muscle gain, water retention, or eating window timing. Look at sleep and stress scores — they're often the real driver.` });
    } else {
      pool.push({ title: '⚖️ Holding Steady', text: `Your weight has been stable. If loss is your goal, try tightening your eating window by 1 hour or cutting processed foods — small changes compound quickly with fasting.` });
    }
  }

  // ---- Trivia fallback (unique, rotate based on total fasts) ----
  const trivia = [
    { title: '🌸 Autophagy Window', text: "Cellular cleanup (autophagy) typically activates around 12-16h and peaks between 24-48h. Every fast you complete nudges that process further." },
    { title: '🧬 Longevity Signal', text: "Fasting activates SIRT1 genes linked to longevity and DNA repair. Think of each fast as sending a renewal signal to your cells." },
    { title: '🧠 Brain Bloom', text: "BDNF — brain-derived neurotrophic factor — rises during fasting. It supports new neuron growth and is associated with sharper focus and better mood." },
    { title: '🌿 Gut Rest', text: "During a fast your gut microbiome shifts. Beneficial bacteria thrive while harmful strains are starved — fasting is one of the most powerful gut health tools available." },
    { title: '🔥 Fat as Fuel', text: "Once glycogen stores deplete (around 12-16h), your body switches to burning fat for fuel. This metabolic switch is the core of fasting's body composition benefits." },
  ];

  // Shuffle trivia so it doesn't always show the same one
  const triviaIndex = (completed.length + new Date().getDay()) % trivia.length;

  const uniquePool = [...new Map(pool.map(item => [item.title, item])).values()];
  const finalInsights = uniquePool.slice(0, 3);
  while (finalInsights.length < 3) {
    const t = trivia[(triviaIndex + finalInsights.length) % trivia.length];
    if (!finalInsights.find(i => i.title === t.title)) finalInsights.push(t);
    else break;
  }

  output.innerHTML = finalInsights.map(insight => `
    <div class="coach-insight">
      <h4>${insight.title}</h4>
      <p>${insight.text}</p>
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

function updateGardenStats() {
  const plantCount = document.getElementById('garden-plant-count');
  if (plantCount) plantCount.textContent = store.state.garden.plants.length;
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
        showToast(`${decor.emoji} ${decor.label} placed in your garden!`);
        updateGardenStats();
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

    updateGardenStats();

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

