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
import { buildCoachPool } from './js/coach-messages.js';

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

  // Metrics history toggle
  document.getElementById('btn-toggle-metrics-history')?.addEventListener('click', () => {
    const list = document.getElementById('metrics-history-list');
    const btn  = document.getElementById('btn-toggle-metrics-history');
    const open = list?.hasAttribute('hidden');
    if (open) { list.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
    else       { list.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
  });

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
    refreshAllSliderFills();
    generateCoachingInsights();
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
  document.getElementById('btn-debug-coach')?.addEventListener('click', () => generateCoachingInsights(true));
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
      ml: Math.round(count * 236.6),
      fastPlan: store.state.activeFast?.planName ?? selectedPlan ?? 'unknown',
      earlyEnd: !success
    });
  }
  store.state.water.today = 0;
  store.save();
  renderWaterGlasses();
}

function showActiveFastUI() {
  document.querySelector('.plant-area').style.display = 'flex';
  document.getElementById('plan-selector')?.classList.add('hidden');
  document.getElementById('water-tracker-card')?.classList.remove('hidden');
  const actionBtn = document.getElementById('btn-fast-action');
  if (actionBtn) { actionBtn.innerHTML = '<span>🏁</span> Complete Fast'; actionBtn.classList.remove('btn-glow'); }

  // Mystery labels
  document.getElementById('plant-species-label').textContent = '🌱 A mystery seed is growing...';
}

function showIdleTimerUI() {
  document.getElementById('plan-selector')?.classList.remove('hidden');
  document.getElementById('water-tracker-card')?.classList.add('hidden');
  const actionBtn = document.getElementById('btn-fast-action');
  if (actionBtn) { actionBtn.innerHTML = '<span>🌱</span> Plant a Seed'; actionBtn.classList.add('btn-glow'); }
  document.getElementById('timer-display').textContent = '00:00:00';
  document.getElementById('timer-subtitle').textContent = 'Select a fasting plan to start';
  document.getElementById('timer-progress-fill').style.width = '0%';
  document.getElementById('plant-species-label').textContent = '';
  document.getElementById('growth-stage-label').textContent = 'Plant a seed to begin';
  document.getElementById('tab-timer').style.backgroundColor = '';
  document.querySelector('.plant-area').style.display = 'none';
  hidePlantSVG();
  updateTimerDecoration(0);
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
      ${waterCount > 0 ? `<div class="plant-reveal-water">💧 You logged <strong>${waterCount}</strong> glass${waterCount !== 1 ? 'es' : ''} (${waterAmountStr(waterCount)}) of water during this fast!</div>` : ''}
      <p style="color: var(--text-secondary); font-size: var(--fs-sm); margin-top: var(--space-md);">
        This ${plantType?.name || 'plant'} has been added to your Botanical Collection! 🪴
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
function waterAmountStr(glasses) {
  if ((store.state.waterUnit || 'floz') === 'ml') {
    return `${Math.round(glasses * 236.6)} ml`;
  }
  return `${glasses * 8} fl oz`;
}

function bindWaterTracker() {
  document.getElementById('btn-log-water')?.addEventListener('click', logWater);

  document.querySelectorAll('.water-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.setWaterUnit(btn.dataset.unit);
      document.querySelectorAll('.water-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderWaterGlasses();
    });
  });

  // Restore saved unit preference on load
  const savedUnit = store.state.waterUnit || 'floz';
  document.querySelectorAll('.water-unit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.unit === savedUnit);
  });
}

function logWater() {
  if (!timer.isRunning) {
    showToast('Start a fast to log water! 💧');
    return;
  }
  store.logWater();
  renderWaterGlasses();

  const count = store.state.water.today;
  showToast(`💧 Water logged! (${count}/8 glasses — ${waterAmountStr(count)})`);
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
  if (ozNum) ozNum.textContent = waterAmountStr(count);

  const unitLabel = document.getElementById('water-log-unit-label');
  if (unitLabel) unitLabel.textContent = waterAmountStr(1);

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

  // Weight timeframe toggle
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (analytics) {
        analytics.setWeightTimeframe(btn.dataset.timeframe);
      }
    });
  });

  document.querySelector('.weight-nav-prev')?.addEventListener('click', () => {
    if (analytics) analytics.stepWeightTimeframe('prev');
  });
  document.querySelector('.weight-nav-next')?.addEventListener('click', () => {
    if (analytics) analytics.stepWeightTimeframe('next');
  });

  // Garden timeframe toggle
  document.querySelectorAll('.garden-timeframe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.garden-timeframe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (analytics) {
        analytics.setGardenTimeframe(btn.dataset.timeframe);
      }
    });
  });

  document.querySelector('.garden-nav-prev')?.addEventListener('click', () => {
    if (analytics) analytics.stepGardenTimeframe('prev');
  });
  document.querySelector('.garden-nav-next')?.addEventListener('click', () => {
    if (analytics) analytics.stepGardenTimeframe('next');
  });

  // Wellbeing timeframe toggle
  document.querySelectorAll('.wellbeing-timeframe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wellbeing-timeframe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (analytics) {
        analytics.setWellbeingTimeframe(btn.dataset.timeframe);
      }
    });
  });

  document.querySelector('.wellbeing-nav-prev')?.addEventListener('click', () => {
    if (analytics) analytics.stepWellbeingTimeframe('prev');
  });
  document.querySelector('.wellbeing-nav-next')?.addEventListener('click', () => {
    if (analytics) analytics.stepWellbeingTimeframe('next');
  });

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

    const lbsValue = weightUnit === 'kg' ? Math.round(value * 2.20462 * 10) / 10 : value;
    store.logWeight(lbsValue, Date.now());
    if (input) input.value = '';
    showToast(`⚖️ Weight logged: ${value} ${weightUnit}`);

    document.getElementById('weight-section')?.classList.add('daily-checkin-locked');
    document.getElementById('btn-edit-weight')?.classList.remove('hidden');

    if (analytics) analytics.refresh();
  });

  document.getElementById('btn-edit-weight')?.addEventListener('click', () => {
    document.getElementById('weight-section')?.classList.remove('daily-checkin-locked');
    document.getElementById('btn-edit-weight')?.classList.add('hidden');
    const saved = store.getTodayWeight();
    if (saved) {
      const display = weightUnit === 'kg'
        ? Math.round(saved.value / 2.20462 * 10) / 10
        : saved.value;
      const input = document.getElementById('weight-input');
      if (input) input.value = display;
    }
    updateRitualProgress();
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
  // Profile name
  const nameInput = document.getElementById('profile-name-input');
  const nameBtn   = document.getElementById('btn-save-profile-name');
  if (nameInput && nameBtn) {
    const savedName = store.state.profile?.name || '';
    nameInput.value = savedName;

    const setEditMode = () => {
      nameInput.readOnly = false;
      nameInput.classList.remove('is-locked');
      nameBtn.textContent = 'Save';
      nameBtn.classList.remove('btn-secondary');
      nameBtn.classList.add('btn-primary');
      nameInput.focus();
      nameInput.select();
    };
    const setSavedMode = () => {
      nameInput.readOnly = true;
      nameInput.classList.add('is-locked');
      nameBtn.textContent = 'Edit';
      nameBtn.classList.remove('btn-primary');
      nameBtn.classList.add('btn-secondary');
    };

    // Start in saved mode if a name already exists
    if (savedName) setSavedMode(); else setEditMode();

    nameBtn.addEventListener('click', () => {
      if (nameBtn.textContent === 'Edit') {
        setEditMode();
      } else {
        const val = nameInput.value.trim();
        if (!val) return;
        store.state.profile.name = val;
        store.save();
        setSavedMode();
        showToast(`🌿 Hi, ${val}!`);
      }
    });

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') nameBtn.click();
    });
  }

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
        if (slider && saved[m] != null) { slider.value = saved[m]; if (display) display.textContent = saved[m]; updateSliderFill(slider); }
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
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const el = document.getElementById('wellness-date-display');
  if (el) el.textContent = dateStr;
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

  // Weight Section
  const weightDone = store.state.lastWeightSaveDate === today;
  const weightSection = document.getElementById('weight-section');
  if (weightSection) {
    if (weightDone) {
      weightSection.classList.add('daily-checkin-locked');
      document.getElementById('btn-edit-weight')?.classList.remove('hidden');
    } else {
      weightSection.classList.remove('daily-checkin-locked');
      document.getElementById('btn-edit-weight')?.classList.add('hidden');
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

// ---- Week helpers ----
let metricsWeekOffset = 0;
let journalWeekOffset = 0;

function getWeekBounds(offset) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay() - offset * 7);
  const nextSunday = new Date(sunday);
  nextSunday.setDate(sunday.getDate() + 7);
  return { start: sunday, end: nextSunday };
}

function weekNavLabel(offset) {
  const { start, end } = getWeekBounds(offset);
  const last = new Date(end.getTime() - 86400000);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const year = start.getFullYear();
  return `${fmt(start)} – ${fmt(last)}, ${year}`;
}

function weekNavHtml(offset, hasOlder, prefix) {
  return `
    <div class="week-nav">
      <button class="week-nav-btn" data-dir="older" data-prefix="${prefix}" ${!hasOlder ? 'disabled' : ''}>&#8592; Older</button>
      <span class="week-nav-label">${weekNavLabel(offset)}</span>
      <button class="week-nav-btn" data-dir="newer" data-prefix="${prefix}" ${offset === 0 ? 'disabled' : ''}>Newer &#8594;</button>
    </div>`;
}

function bindWeekNav(container, renderFn) {
  container.querySelectorAll('.week-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prefix = btn.dataset.prefix;
      if (prefix === 'metrics') {
        if (btn.dataset.dir === 'older') metricsWeekOffset++;
        else if (metricsWeekOffset > 0) metricsWeekOffset--;
      } else {
        if (btn.dataset.dir === 'older') journalWeekOffset++;
        else if (journalWeekOffset > 0) journalWeekOffset--;
      }
      renderFn();
    });
  });
}

function renderPastEntries() {
  const container = document.getElementById('past-entries-list');
  if (!container) return;

  const allEntries = store.state.journal;
  const archives = store.state.journalArchive || [];

  if (allEntries.length === 0 && archives.length === 0) {
    container.innerHTML = '<p class="empty-msg vine-empty">No journal entries yet. Start writing!</p>';
    return;
  }

  const { start, end } = getWeekBounds(journalWeekOffset);
  const entries = allEntries.filter(e => {
    const d = new Date(e.timestamp);
    return d >= start && d < end;
  });

  const hasOlder = allEntries.some(e => new Date(e.timestamp) < start);

  const waterByDate = {};
  (store.state.water.history || []).forEach(h => { waterByDate[h.date] = h.glasses || 0; });
  waterByDate[new Date().toDateString()] = store.state.water.today || 0;

  const nodeEmojis = ['🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '🍀', '🌸', '🌺', '🌼'];

  const entriesHtml = entries.length === 0
    ? '<p class="empty-msg vine-empty">No entries this week.</p>'
    : entries.map((entry, i) => {
        const d = new Date(entry.timestamp);
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
          </div>`;
      }).join('');

  const archiveHtml = archives.length === 0 ? '' : `
    <div class="jarchive-section">
      <div class="jarchive-heading">📦 Monthly Archives</div>
      ${archives.map(a => {
        const metricsStr = [
          a.avgMood   != null ? `😊 ${a.avgMood}` : '',
          a.avgSleep  != null ? `😴 ${a.avgSleep}` : '',
          a.avgEnergy != null ? `⚡ ${a.avgEnergy}` : ''
        ].filter(Boolean).join('  ');
        const fastStr = parseFloat(a.totalFastHours) > 0 ? `🌱 ${a.totalFastHours}h fasted` : '';
        const highlightsHtml = a.highlights.length
          ? `<ul class="jarchive-highlights">${a.highlights.map(h => `<li>"${escapeHtml(h)}"</li>`).join('')}</ul>`
          : '';
        return `
          <div class="jarchive-card">
            <div class="jarchive-card-header">
              <span class="jarchive-month">${a.label}</span>
              <span class="jarchive-count">${a.entryCount} entr${a.entryCount !== 1 ? 'ies' : 'y'}</span>
            </div>
            <div class="jarchive-stats">${metricsStr}${fastStr ? `  ${fastStr}` : ''}</div>
            ${highlightsHtml}
          </div>`;
      }).join('')}
    </div>`;

  container.innerHTML = weekNavHtml(journalWeekOffset, hasOlder, 'journal') + entriesHtml + archiveHtml;
  bindWeekNav(container, renderPastEntries);
}

function renderMetricsHistory() {
  const container = document.getElementById('metrics-history-list');
  if (!container) return;

  const allMetrics = [...store.state.metrics].reverse();

  if (allMetrics.length === 0) {
    container.innerHTML = '<p class="empty-msg">No metrics logged yet.</p>';
    return;
  }

  const { start, end } = getWeekBounds(metricsWeekOffset);
  const weekMetrics = allMetrics.filter(m => {
    const d = new Date(m.timestamp);
    return d >= start && d < end;
  });

  const hasOlder = allMetrics.some(m => new Date(m.timestamp) < start);

  const rowsHtml = weekMetrics.length === 0
    ? '<p class="empty-msg">No metrics this week.</p>'
    : weekMetrics.map(m => {
        const d = new Date(m.timestamp);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
          <div class="metric-history-row">
            <span class="metric-history-date">${dateStr}</span>
            <div class="metric-history-scores">
              <span>😊 ${m.mood}</span>
              <span>😴 ${m.sleep}</span>
              <span>⚡ ${m.energy}</span>
            </div>
          </div>`;
      }).join('');

  container.innerHTML = weekNavHtml(metricsWeekOffset, hasOlder, 'metrics') + rowsHtml;
  bindWeekNav(container, renderMetricsHistory);
}

// ---- AI Coach ----
function generateCoachingInsights(forceNew = false) {
  const output = document.getElementById('ai-coach-output');
  if (!output) return;

  const shuffle = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const name = store.state.profile?.name || 'there';
  const completed = store.state.fasts.filter(f => f.completed);
  const hasAnyData = completed.length > 0 || store.state.metrics.length > 0 || store.state.journal.length > 0;
  if (!hasAnyData) {
    output.innerHTML = `<p class="empty-msg">🌱 Hey ${name}! Log your first fast, metrics, or journal entry and I'll start personalizing your insights.</p>`;
    return;
  }

  const todayStr = new Date().toDateString();

  // Return cached tip if it's still today and we're not forcing a new one
  if (!forceNew && store.state.coachDailyTip?.date === todayStr) {
    const cached = store.state.coachDailyTip;
    output.innerHTML = `<div class="coach-insight"><h4>${cached.title}</h4><p>${cached.text}</p></div>`;
    return;
  }

  const { pool, trivia } = buildCoachPool(store);

  // Dedupe by title, prioritise unseen
  const allCandidates = [...new Map(
    [...shuffle(pool), ...shuffle(trivia)].map(item => [item.title, item])
  ).values()];

  const seen = new Set(store.state.coachSeenTitles || []);
  const unseen = allCandidates.filter(i => !seen.has(i.title));
  const seenList = shuffle(allCandidates.filter(i => seen.has(i.title)));
  const pick = [...unseen, ...seenList][0];

  if (!pick) return;

  // Cache today's tip
  store.state.coachDailyTip = { date: todayStr, title: pick.title, text: pick.text };

  // Record in seen history (keep last 60)
  if (!store.state.coachSeenTitles) store.state.coachSeenTitles = [];
  store.state.coachSeenTitles.push(pick.title);
  if (store.state.coachSeenTitles.length > 60) store.state.coachSeenTitles = store.state.coachSeenTitles.slice(-60);
  store.save();

  output.innerHTML = `<div class="coach-insight"><h4>${pick.title}</h4><p>${pick.text}</p></div>`;
}

function updateSliderFill(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--fill-pct', `${pct}%`);
}

function refreshAllSliderFills() {
  document.querySelectorAll('.metric-slider').forEach(updateSliderFill);
}

function bindMetricSliders() {
  // Document-level delegation — works regardless of tab visibility or init timing
  document.addEventListener('input', (e) => {
    if (!e.target.matches('.metric-slider')) return;
    const display = document.getElementById(`${e.target.id}-val`);
    if (display) display.textContent = e.target.value;
    updateSliderFill(e.target);
  });
  refreshAllSliderFills();
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

