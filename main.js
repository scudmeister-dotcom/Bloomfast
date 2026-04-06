/* ============================================================
   Main — Application Orchestration
   ============================================================ */

import { store } from './js/store.js';
import { FastingTimer, PLANS } from './js/timer.js';
import { getRandomPlant, PLANT_SPECIES } from './js/plant.js';
import { CollectionGallery } from './js/collection-gallery.js';
import { AnalyticsDashboard } from './js/analytics.js';
import { showToast } from './js/social.js';
import { NotificationManager } from './js/notifications.js';
import { DECORATIONS_CATALOG } from './js/garden.js';
import { buildCoachPool } from './js/coach-messages.js';

// ---- Globals ----
let timer, collectionGallery, analytics, social, notifications;
let selectedPlan = null;

// ---- Garden Scene / Plant Growth ----
const PLANT_STAGE_DATA = {
  sunflower: {
    stages: [
      { maxProgress: 0.08, videoSrc: 'assets/stages/sunflower_1.mp4', scale: 0.25, label: 'Germinating...' },
      { maxProgress: 0.20, videoSrc: 'assets/stages/sunflower_2.mp4', scale: 0.50, label: 'Sprouting...' },
      { maxProgress: 0.35, videoSrc: 'assets/stages/sunflower_3.mp4', scale: 0.70, label: 'Seedling' },
      { maxProgress: 0.55, videoSrc: 'assets/stages/sunflower_4.mp4', scale: 0.80, label: 'Growing...' },
      { maxProgress: 0.72, videoSrc: 'assets/stages/sunflower_5.mp4', scale: 0.88, label: 'Budding...' },
      { maxProgress: 0.90, videoSrc: 'assets/stages/sunflower_6.mp4', scale: 0.94, label: 'Almost there...' },
      { maxProgress: 1.00, videoSrc: 'assets/stages/sunflower_7.mp4', scale: 1.00, label: 'In Full Bloom 🌻' },
    ]
  }
};

function getPlantBaseId(plantType) {
  return plantType?.id?.replace(/_(sprout|bud|bloom|radiant)$/i, '') || '';
}

let _currentStageIndex = -1;
let _chromaRafId = null;
let _debugPreviewOpen = false;
let _applyPreviewProgress = null; // set by bindTimerControls once defined

// Offscreen canvas used to chroma-key without affecting layout canvas dimensions
const _offscreen = document.createElement('canvas');
const _offCtx    = _offscreen.getContext('2d');

function startChromaKey(video, canvas) {
  const ctx = canvas.getContext('2d');

  function renderFrame() {
    if (!video.src || video.paused || video.ended) {
      _chromaRafId = requestAnimationFrame(renderFrame);
      return;
    }
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;

    // Draw + key on offscreen
    if (_offscreen.width !== w) _offscreen.width = w;
    if (_offscreen.height !== h) _offscreen.height = h;
    _offCtx.clearRect(0, 0, w, h);
    _offCtx.drawImage(video, 0, 0, w, h);
    const imageData = _offCtx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const brightness  = max / 255;
      if (brightness > 0.72 && saturation < 0.18) d[i+3] = 0;
    }
    _offCtx.putImageData(imageData, 0, 0);

    // Find the lowest row that has any visible pixel
    let lowestRow = 0;
    for (let y = h - 1; y >= 0; y--) {
      let hasPixel = false;
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 20) { hasPixel = true; break; }
      }
      if (hasPixel) { lowestRow = y; break; }
    }

    // Scale + pin bottom anchor so all stages share the same ground point
    const scale   = canvas._stageScale ?? 1;
    const srcH    = lowestRow + 1;          // only the visible portion
    const dstW    = Math.round(w * scale);
    const dstH    = Math.round(srcH * scale);
    canvas.width  = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    // Draw scaled image anchored to bottom-center
    const x = Math.round((w - dstW) / 2);
    const y = h - dstH;
    ctx.drawImage(_offscreen, 0, 0, w, srcH, x, y, dstW, dstH);
    _chromaRafId = requestAnimationFrame(renderFrame);
  }
  if (_chromaRafId) cancelAnimationFrame(_chromaRafId);
  _chromaRafId = requestAnimationFrame(renderFrame);
}

function showGardenScene(plantType, progress = 0) {
  const video  = document.getElementById('plant-stage-video');
  const canvas = document.getElementById('plant-stage-canvas');
  if (!video || !canvas) return;
  _currentStageIndex = -1; // force first load
  startChromaKey(video, canvas);
  updateGardenScene(progress, plantType);
}

function hideGardenScene() {
  const video = document.getElementById('plant-stage-video');
  if (video) { video.pause(); video.src = ''; }
  if (_chromaRafId) { cancelAnimationFrame(_chromaRafId); _chromaRafId = null; }
  _currentStageIndex = -1;
}

function updateGardenScene(progress, plantType) {
  const baseId = getPlantBaseId(plantType);
  const data   = PLANT_STAGE_DATA[baseId];
  const video  = document.getElementById('plant-stage-video');
  if (!video) return;

  if (data) {
    const stageIdx = data.stages.findIndex(s => progress <= s.maxProgress);
    const idx = stageIdx === -1 ? data.stages.length - 1 : stageIdx;
    if (idx !== _currentStageIndex) {
      _currentStageIndex = idx;
      const stage = data.stages[idx];
      video.src = stage.videoSrc;
      video.load();
      video.play().catch(err => console.warn('[Garden] video play failed:', err));
      const canvas = document.getElementById('plant-stage-canvas');
      if (canvas) canvas._stageScale = stage.scale ?? 1;
    }
    const label = document.getElementById('growth-stage-label');
    if (label) label.textContent = data.stages[idx].label;
  } else {
    // No video data for this species yet — show garden with no plant video
    if (_currentStageIndex !== -1) {
      video.pause(); video.src = '';
      _currentStageIndex = -1;
    }
  }
}

// ---- Initialize ----
// ============================================================
// Garden Scene Workshop — ambience effects + scene presets
// ============================================================

// Master flags — toggled by the workshop panel or scene presets
const AMBIENCE_FLAGS = {
  dayNightTint:  false,
  fireflies:     false,
  lightRays:     true,
  rain:          false,
  snow:          false,
  fog:           false,
  clouds:        false,
  leaves:        false,
  pollen:        false,
  butterflies:   false,
  moonlight:     false,
  candleFlicker: false,
  goldenHour:    false,
  windSway:      false,
};

const EFFECT_LABELS = {
  dayNightTint:  '🌓 Day/Night Tint',
  fireflies:     '✨ Fireflies',
  lightRays:     '🌤 Light Rays',
  rain:          '🌧 Rain',
  snow:          '❄️ Snow',
  fog:           '🌫 Fog',
  clouds:        '☁️ Clouds',
  leaves:        '🍂 Falling Leaves',
  pollen:        '🌿 Pollen Drift',
  butterflies:   '🦋 Butterflies',
  moonlight:     '🌕 Moonlight',
  candleFlicker: '🕯 Candle Flicker',
  goldenHour:    '🌅 Golden Hour',
  windSway:      '🌬 Wind Sway',
};

const SCENE_PRESETS = {
  clearDay:   { label: '☀️ Clear Day',      dayNightTint: false, fireflies: false, lightRays: true,  rain: false, snow: false, fog: false, clouds: false, leaves: false, pollen: true,  butterflies: true,  moonlight: false, candleFlicker: false, goldenHour: false, windSway: false },
  goldenHour: { label: '🌅 Golden Hour',    dayNightTint: false, fireflies: false, lightRays: false, rain: false, snow: false, fog: false, clouds: true,  leaves: false, pollen: false, butterflies: false, moonlight: false, candleFlicker: false, goldenHour: true,  windSway: false },
  night:      { label: '🌙 Night',          dayNightTint: true,  fireflies: true,  lightRays: false, rain: false, snow: false, fog: false, clouds: false, leaves: false, pollen: false, butterflies: false, moonlight: true,  candleFlicker: false, goldenHour: false, windSway: false },
  cozyNight:  { label: '🕯 Cozy Night',     dayNightTint: true,  fireflies: true,  lightRays: false, rain: false, snow: false, fog: false, clouds: false, leaves: false, pollen: false, butterflies: false, moonlight: false, candleFlicker: true,  goldenHour: false, windSway: false },
  rainy:      { label: '🌧 Rainy Day',      dayNightTint: false, fireflies: false, lightRays: false, rain: true,  snow: false, fog: true,  clouds: true,  leaves: false, pollen: false, butterflies: false, moonlight: false, candleFlicker: false, goldenHour: false, windSway: true  },
  autumn:     { label: '🍂 Autumn',         dayNightTint: false, fireflies: false, lightRays: true,  rain: false, snow: false, fog: false, clouds: false, leaves: true,  pollen: false, butterflies: false, moonlight: false, candleFlicker: false, goldenHour: true,  windSway: true  },
  winter:     { label: '❄️ Winter',         dayNightTint: false, fireflies: false, lightRays: false, rain: false, snow: true,  fog: true,  clouds: true,  leaves: false, pollen: false, butterflies: false, moonlight: false, candleFlicker: false, goldenHour: false, windSway: false },
  misty:      { label: '🌫 Misty Morning',  dayNightTint: false, fireflies: false, lightRays: true,  rain: false, snow: false, fog: true,  clouds: false, leaves: false, pollen: true,  butterflies: false, moonlight: false, candleFlicker: false, goldenHour: false, windSway: false },
};

// Internal state for continuous effects
let _weatherRaf = null;
let _candleRaf  = null;
let _weatherCtx = null;
let _rainDrops  = [];
let _snowFlakes = [];

function initGardenAmbience() {
  if (AMBIENCE_FLAGS.fireflies) spawnFireflies();
  updateDayNight();
  if (AMBIENCE_FLAGS.dayNightTint) setInterval(updateDayNight, 60 * 1000);
  const rays = document.getElementById('garden-light-rays');
  if (rays) rays.style.display = AMBIENCE_FLAGS.lightRays ? '' : 'none';
}

// Apply a full scene preset, then re-render all effects
function applyScene(presetKey) {
  const preset = SCENE_PRESETS[presetKey];
  if (!preset) return;
  Object.keys(AMBIENCE_FLAGS).forEach(k => {
    if (k in preset) AMBIENCE_FLAGS[k] = preset[k];
  });
  applyAllEffects();
  syncWorkshopToggles();
}

// Re-apply every effect based on current AMBIENCE_FLAGS
function applyAllEffects() {
  // Day/night tint + fireflies
  updateDayNight();

  // Light rays
  const rays = document.getElementById('garden-light-rays');
  if (rays) rays.style.display = AMBIENCE_FLAGS.lightRays ? '' : 'none';

  // Weather canvas (rain / snow — mutually exclusive, rain wins)
  stopWeather();
  if (AMBIENCE_FLAGS.rain)       startRain();
  else if (AMBIENCE_FLAGS.snow)  startSnow();

  // Fog
  applyFog(AMBIENCE_FLAGS.fog);

  // Clouds
  applyClouds(AMBIENCE_FLAGS.clouds);

  // Particles
  applyParticles();

  // Vignette (moonlight / candle / golden hour — stackable)
  applyVignette();

  // Wind sway on plant canvas
  const canvas = document.getElementById('plant-stage-canvas');
  if (canvas) {
    if (AMBIENCE_FLAGS.windSway) canvas.classList.add('wind-sway');
    else canvas.classList.remove('wind-sway');
  }
}

// ---- Day/Night ----
function updateDayNight() {
  const el = document.getElementById('garden-day-night');
  const fireflies = document.getElementById('garden-fireflies');

  if (!AMBIENCE_FLAGS.dayNightTint) {
    if (el) el.style.background = 'transparent';
    if (fireflies) fireflies.style.opacity = '0';
    return;
  }
  if (!el) return;

  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  let bg = 'transparent';
  let showFireflies = false;

  if (hour >= 5 && hour < 7) {
    const t = (hour - 5) / 2;
    bg = `rgba(255, 160, 80, ${0.35 - t * 0.25})`;
  } else if (hour >= 7 && hour < 17) {
    bg = 'transparent';
  } else if (hour >= 17 && hour < 19.5) {
    const t = (hour - 17) / 2.5;
    bg = `rgba(220, 100, 30, ${t * 0.35})`;
  } else if (hour >= 19.5 || hour < 5) {
    bg = 'rgba(10, 20, 60, 0.52)';
    showFireflies = AMBIENCE_FLAGS.fireflies;
  }

  el.style.background = bg;
  if (fireflies) {
    fireflies.style.opacity = showFireflies ? '1' : '0';
    if (showFireflies && !fireflies.children.length) spawnFireflies();
  }
}

// ============================================================
// Pixel Art Sprite Helpers
// ============================================================

// Build a CSS box-shadow string from a 2D pixel grid.
// The element itself must be PX × PX with transparent background;
// every "on" cell becomes a shadow offset from (0,0).
function pixelBoxShadow(sprite, px, color) {
  const shadows = [];
  sprite.forEach((row, ry) => {
    row.forEach((on, rx) => {
      if (on) shadows.push(`${rx * px}px ${ry * px}px 0 0 ${color}`);
    });
  });
  return shadows.join(',');
}

// Create a positioned pixel-art div from a sprite grid.
function createPixelEl(sprite, px, color, extraClass) {
  const el = document.createElement('div');
  el.className = extraClass || '';
  el.style.cssText = `
    position:absolute;
    width:${px}px; height:${px}px;
    background:transparent;
    box-shadow:${pixelBoxShadow(sprite, px, color)};
    image-rendering:pixelated;
  `;
  return el;
}

// Pixel art sprite definitions — each row is an array of 0/1
const PX_SPRITES = {
  // 14-wide × 6-tall classic 8-bit cloud
  cloud: [
    [0,0,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,0,0,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
  ],
  // Smaller secondary cloud
  cloudSm: [
    [0,0,1,1,0,0,0,0,0,0],
    [0,1,1,1,1,0,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
  ],
  // 5×5 autumn leaf (right-leaning)
  leafA: [
    [0,0,1,1,0],
    [0,1,1,1,1],
    [1,1,1,1,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
  ],
  // 4×5 leaf (left-leaning)
  leafB: [
    [0,1,1,0],
    [1,1,1,1],
    [0,1,1,1],
    [0,0,1,1],
    [0,0,1,0],
  ],
  // 7×5 pixel butterfly (top-down)
  butterfly: [
    [1,1,0,0,0,1,1],
    [1,1,1,0,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
  ],
};

// Leaf color palettes (flat pixel art colors)
const LEAF_COLORS  = ['#cc4400','#883300','#ddaa00','#995500'];
const BUTTERFLY_COLORS = ['#f599c8','#88ddee','#f0cc66'];

// ---- Fireflies — hard pixel squares, no glow ----
function spawnFireflies() {
  const container = document.getElementById('garden-fireflies');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const ff = document.createElement('div');
    ff.className = 'firefly';
    ff.style.cssText = `
      left: ${20 + Math.random() * 60}%;
      top:  ${25 + Math.random() * 45}%;
      --ff-dur:   ${5 + Math.random() * 5}s;
      --ff-blink: ${2 + Math.random() * 2}s;
      --ff-delay: ${-Math.random() * 6}s;
      --ff-x1: ${(Math.random() - 0.5) * 30}px;
      --ff-y1: ${-5 - Math.random() * 25}px;
      --ff-x2: ${(Math.random() - 0.5) * 30}px;
      --ff-y2: ${-10 - Math.random() * 30}px;
      --ff-x3: ${(Math.random() - 0.5) * 30}px;
      --ff-y3: ${-5 - Math.random() * 20}px;
    `;
    container.appendChild(ff);
  }
  container.style.opacity = '0';
  container.style.transition = 'opacity 3s ease';
}

// ---- Rain / Snow (shared canvas — pixel block rendering) ----
function getWeatherCanvas() {
  const c = document.getElementById('garden-weather-canvas');
  if (!c) return null;
  const scene = document.getElementById('garden-scene');
  if (scene) { c.width = scene.offsetWidth; c.height = scene.offsetHeight; }
  return c;
}

function stopWeather() {
  if (_weatherRaf) { cancelAnimationFrame(_weatherRaf); _weatherRaf = null; }
  const c = document.getElementById('garden-weather-canvas');
  if (c && _weatherCtx) _weatherCtx.clearRect(0, 0, c.width, c.height);
  _rainDrops = []; _snowFlakes = [];
}

function startRain() {
  const c = getWeatherCanvas();
  if (!c) return;
  _weatherCtx = c.getContext('2d');
  _weatherCtx.imageSmoothingEnabled = false;
  const PX = 2; // 2×2 pixel grid unit
  // Three opacity tiers for depth — all flat (no per-drop random alpha)
  const TIERS = [
    { color: '#aed4f1', count: 25, speed: 6,  len: 5 },
    { color: '#88b8d8', count: 25, speed: 9,  len: 7 },
    { color: '#6699bb', count: 20, speed: 12, len: 9 },
  ];
  TIERS.forEach(t => {
    for (let i = 0; i < t.count; i++) {
      _rainDrops.push({
        x: Math.floor(Math.random() * (c.width  / PX)) * PX,
        y: Math.floor(Math.random() * (c.height / PX)) * PX,
        len: t.len * PX,
        speed: t.speed,
        color: t.color
      });
    }
  });

  function tick() {
    _weatherCtx.clearRect(0, 0, c.width, c.height);
    _rainDrops.forEach(d => {
      _weatherCtx.fillStyle = d.color;
      // Draw as a column of PX-sized squares — no anti-aliasing
      for (let j = 0; j < d.len; j += PX) {
        _weatherCtx.fillRect(Math.round(d.x), Math.round(d.y + j), PX, PX);
      }
      d.y += d.speed;
      d.x -= Math.floor(d.speed * 0.25); // slight diagonal angle
      if (d.y > c.height) {
        d.y = -d.len;
        d.x = Math.floor(Math.random() * (c.width / PX)) * PX;
      }
      if (d.x < 0) d.x += c.width;
    });
    _weatherRaf = requestAnimationFrame(tick);
  }
  tick();
}

function startSnow() {
  const c = getWeatherCanvas();
  if (!c) return;
  _weatherCtx = c.getContext('2d');
  _weatherCtx.imageSmoothingEnabled = false;
  // Two sizes: 2×2 and 3×3 pixel squares
  const SIZES = [
    { px: 2, count: 30, speed: 0.5, color: '#ffffff' },
    { px: 3, count: 20, speed: 0.8, color: '#e8eef2' },
    { px: 4, count: 10, speed: 1.1, color: '#d0dde6' },
  ];
  SIZES.forEach(s => {
    for (let i = 0; i < s.count; i++) {
      _snowFlakes.push({
        x: Math.floor(Math.random() * (c.width  / s.px)) * s.px,
        y: Math.floor(Math.random() * (c.height / s.px)) * s.px,
        px: s.px,
        speed: s.speed,
        drift: (Math.random() > 0.5 ? 1 : -1) * s.px * 0.25,
        driftTimer: 0,
        driftPeriod: 60 + Math.floor(Math.random() * 80),
        color: s.color
      });
    }
  });

  function tick() {
    _weatherCtx.clearRect(0, 0, c.width, c.height);
    _snowFlakes.forEach(f => {
      _weatherCtx.fillStyle = f.color;
      _weatherCtx.fillRect(Math.round(f.x), Math.round(f.y), f.px, f.px);
      f.y += f.speed;
      // Pixel-step drift — only move horizontally on certain frames
      f.driftTimer++;
      if (f.driftTimer >= f.driftPeriod) {
        f.x += f.drift > 0 ? f.px : -f.px;
        f.drift = -f.drift; // reverse drift direction
        f.driftTimer = 0;
      }
      if (f.y > c.height) {
        f.y = -f.px;
        f.x = Math.floor(Math.random() * (c.width / f.px)) * f.px;
      }
    });
    _weatherRaf = requestAnimationFrame(tick);
  }
  tick();
}

// ---- Fog — pixel dither pattern (repeating dot grid) ----
function applyFog(on) {
  const el = document.getElementById('garden-fog');
  if (!el) return;
  if (!on) { el.style.display = 'none'; return; }
  el.style.display = '';
  if (!el.children.length) {
    // Two overlapping dither layers scrolling at different speeds
    el.innerHTML = `<div class="fog-layer fog-layer-1"></div><div class="fog-layer fog-layer-2"></div>`;
  }
}

// ---- Clouds — pixel art box-shadow sprites ----
function applyClouds(on) {
  const el = document.getElementById('garden-clouds');
  if (!el) return;
  el.innerHTML = '';
  if (!on) { el.style.display = 'none'; return; }
  el.style.display = '';

  const configs = [
    { sprite: 'cloud',   px: 8, color: '#d8e8f0', top: '4%',  opacity: 0.80, dur: '40s', delay: '0s'   },
    { sprite: 'cloudSm', px: 6, color: '#ccdde8', top: '14%', opacity: 0.60, dur: '58s', delay: '-20s'  },
    { sprite: 'cloud',   px: 6, color: '#e0edf5', top: '2%',  opacity: 0.50, dur: '50s', delay: '-32s'  },
    { sprite: 'cloudSm', px: 5, color: '#c8d8e2', top: '20%', opacity: 0.45, dur: '65s', delay: '-12s'  },
  ];

  configs.forEach(cfg => {
    const wrap = document.createElement('div');
    wrap.className = 'pixel-cloud-wrap';
    wrap.style.cssText = `top:${cfg.top}; opacity:${cfg.opacity}; animation-duration:${cfg.dur}; animation-delay:${cfg.delay};`;
    const dot = createPixelEl(PX_SPRITES[cfg.sprite], cfg.px, cfg.color, 'pixel-cloud');
    wrap.appendChild(dot);
    el.appendChild(wrap);
  });
}

// ---- Particles — pixel art leaves, pollen squares, butterfly sprites ----
function applyParticles() {
  const el = document.getElementById('garden-particles');
  if (!el) return;
  el.innerHTML = '';

  if (AMBIENCE_FLAGS.leaves) {
    for (let i = 0; i < 10; i++) {
      const sprite = Math.random() > 0.5 ? PX_SPRITES.leafA : PX_SPRITES.leafB;
      const color  = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      const px     = Math.random() > 0.5 ? 4 : 3;
      const leaf   = createPixelEl(sprite, px, color, 'falling-leaf');
      leaf.style.left         = `${5 + Math.random() * 88}%`;
      leaf.style.animationDuration  = `${7 + Math.random() * 7}s`;
      leaf.style.animationDelay     = `${-Math.random() * 12}s`;
      leaf.style.setProperty('--leaf-spin', `${(Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360)}deg`);
      el.appendChild(leaf);
    }
  }

  if (AMBIENCE_FLAGS.pollen) {
    for (let i = 0; i < 20; i++) {
      const d = document.createElement('div');
      d.className = 'pollen-dot';
      // Alternate between 2px and 3px squares for size variety
      const sz = Math.random() > 0.6 ? 3 : 2;
      d.style.cssText = `
        left:${Math.random() * 100}%;
        top:${20 + Math.random() * 70}%;
        width:${sz}px; height:${sz}px;
        animation-duration:${7 + Math.random() * 9}s;
        animation-delay:${-Math.random() * 10}s;
      `;
      el.appendChild(d);
    }
  }

  if (AMBIENCE_FLAGS.butterflies) {
    for (let i = 0; i < 3; i++) {
      const color = BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length];
      const bf    = createPixelEl(PX_SPRITES.butterfly, 4, color, 'butterfly');
      bf.style.left             = `${15 + Math.random() * 60}%`;
      bf.style.top              = `${15 + Math.random() * 45}%`;
      bf.style.animationDuration      = `${9 + Math.random() * 6}s`;
      bf.style.animationDelay         = `${-Math.random() * 8}s`;
      bf.style.setProperty('--bf-x', `${(Math.random() - 0.5) * 80}px`);
      bf.style.setProperty('--bf-y', `${(Math.random() - 0.5) * 40}px`);
      el.appendChild(bf);
    }
  }
}

// ---- Vignette — pixel-palette flat color bands instead of smooth gradients ----
function applyVignette() {
  if (_candleRaf) { cancelAnimationFrame(_candleRaf); _candleRaf = null; }
  const el = document.getElementById('garden-vignette');
  if (!el) return;

  // Build a multi-stop stepped gradient (no smooth transition = pixel palette feel)
  const layers = [];

  if (AMBIENCE_FLAGS.goldenHour) {
    // Warm banded light from top-right — 4 discrete steps
    layers.push(`linear-gradient(160deg,
      #ff990066 0%, #ff990066 12%,
      #ffaa2244 12%, #ffaa2244 26%,
      #ffbb4422 26%, #ffbb4422 42%,
      transparent 42%)`);
  }
  if (AMBIENCE_FLAGS.moonlight) {
    // Cold top-right spot — 3 steps
    layers.push(`radial-gradient(ellipse 38% 38% at 78% 4%,
      #b8d0ff55 0%, #b8d0ff55 35%,
      #b8d0ff22 35%, #b8d0ff22 65%,
      transparent 65%)`);
  }
  if (AMBIENCE_FLAGS.candleFlicker) {
    animateCandle(el, layers);
    return;
  }

  el.style.background = layers.length ? layers.join(', ') : 'none';
}

// Candle: discrete amber steps that jump randomly (pixel art flicker)
function animateCandle(el, baseLayers) {
  const FLICKER_STATES = [
    { h: '28%', alpha: '55' },
    { h: '32%', alpha: '44' },
    { h: '24%', alpha: '66' },
    { h: '30%', alpha: '50' },
    { h: '26%', alpha: '60' },
  ];
  let frameCount = 0;
  function tick() {
    frameCount++;
    // Only update every 4–8 frames for a stepped flicker feel
    if (frameCount % (4 + Math.floor(Math.random() * 5)) === 0) {
      const s = FLICKER_STATES[Math.floor(Math.random() * FLICKER_STATES.length)];
      const candleLayer = `radial-gradient(ellipse 52% ${s.h} at 50% 105%,
        #ff8800${s.alpha} 0%, #ff8800${s.alpha} 30%,
        #ff660022 30%, #ff660022 60%,
        transparent 60%)`;
      el.style.background = [...baseLayers, candleLayer].join(', ');
    }
    _candleRaf = requestAnimationFrame(tick);
  }
  tick();
}

// ============================================================
// Scene Workshop Debug Panel
// ============================================================

function initSceneWorkshop() {
  const workshopBtn = document.getElementById('btn-scene-workshop');
  const workshopPanel = document.getElementById('scene-workshop');
  const presetContainer = document.getElementById('scene-preset-btns');
  const toggleContainer = document.getElementById('scene-effect-toggles');
  if (!workshopBtn || !workshopPanel) return;

  // Build preset buttons
  Object.entries(SCENE_PRESETS).forEach(([key, preset]) => {
    const btn = document.createElement('button');
    btn.textContent = preset.label;
    btn.className = 'scene-preset-btn';
    btn.dataset.scene = key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scene-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyScene(key);
    });
    presetContainer.appendChild(btn);
  });

  // Build individual effect toggles
  Object.entries(EFFECT_LABELS).forEach(([key, label]) => {
    const wrap = document.createElement('label');
    wrap.className = 'scene-toggle-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = AMBIENCE_FLAGS[key];
    cb.dataset.effect = key;
    cb.addEventListener('change', () => {
      AMBIENCE_FLAGS[key] = cb.checked;
      document.querySelectorAll('.scene-preset-btn').forEach(b => b.classList.remove('active'));
      applyAllEffects();
    });
    wrap.appendChild(cb);
    wrap.appendChild(document.createTextNode(' ' + label));
    toggleContainer.appendChild(wrap);
  });

  // Toggle panel visibility
  workshopBtn.addEventListener('click', () => {
    const open = workshopPanel.style.display !== 'none';
    workshopPanel.style.display = open ? 'none' : '';
    workshopBtn.textContent = open ? '🎨 Scene Workshop' : '✕ Close Workshop';
  });
}

function syncWorkshopToggles() {
  document.querySelectorAll('[data-effect]').forEach(cb => {
    cb.checked = !!AMBIENCE_FLAGS[cb.dataset.effect];
  });
}

function init() {
  // Create managers
  timer = new FastingTimer(store);
  notifications = new NotificationManager(store);

  // Init garden ambience
  initGardenAmbience();
  initSceneWorkshop();

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

  window.addEventListener('bloom:go-to-journal', (e) => {
    const targetDate = e.detail?.date ? new Date(e.detail.date) : new Date();
    // Calculate how many weeks back this date is
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentSunday = new Date(now);
    currentSunday.setDate(now.getDate() - now.getDay());
    targetDate.setHours(0, 0, 0, 0);
    const targetSunday = new Date(targetDate);
    targetSunday.setDate(targetDate.getDate() - targetDate.getDay());
    journalWeekOffset = Math.max(0, Math.round((currentSunday - targetSunday) / (7 * 24 * 60 * 60 * 1000)));
    switchTab('wellness');
    setTimeout(() => {
      // Open journal history if collapsed and scroll to it
      const list = document.getElementById('past-entries-list');
      const btn = document.getElementById('btn-toggle-journal-history');
      if (list?.hasAttribute('hidden')) {
        list.removeAttribute('hidden');
        btn?.setAttribute('aria-expanded', 'true');
      }
      renderPastEntries();
      document.getElementById('past-entries-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  });

  // Resume active fast if any
  if (timer.resume()) {
    showActiveFastUI();
    showGardenScene(store.state.activeFast.plantType, timer.progress);
  } else {
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
  // Stop any pulsing card highlight when leaving the garden tab
  document.querySelectorAll('.botanical-card-container.card-highlight')
    .forEach(el => el.classList.remove('card-highlight'));

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
    if (!analytics) {
      analytics = new AnalyticsDashboard(store);
      analytics.bindEvents();
    }
    analytics.initWellbeingChart();
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
        if (!success) {
          logAndResetWater(false);
          showIdleTimerUI();
          showReflectionPrompt();
        } else {
          onFastComplete({ plant });
        }
      });
    }
  });

  // Debug Timer Controls
  // Show timer arrows whenever debug panel is visible
  const debugTimeUp   = document.getElementById('btn-debug-time-up');
  const debugTimeDown = document.getElementById('btn-debug-time-down');
  if (debugTimeUp)   debugTimeUp.style.display   = 'block';
  if (debugTimeDown) debugTimeDown.style.display = 'block';

  function adjustTimerByMinutes(minutes) {
    if (!timer.isRunning) { showToast('Start a fast first!'); return; }
    store.adjustActiveFast(minutes / 60);
    if (_debugPreviewOpen && store.state.activeFast) {
      const planHours = selectedPlan && PLANS[selectedPlan] ? PLANS[selectedPlan].fastHours : 16;
      const elapsed   = Date.now() - store.state.activeFast.startTime;
      const progress  = Math.min(1, elapsed / (planHours * 3600000));
      applyPreviewProgress(progress);
    } else {
      onTimerTick(timer);
    }
  }

  debugTimeUp?.addEventListener('click',   () => adjustTimerByMinutes(5 / 60));
  debugTimeDown?.addEventListener('click', () => adjustTimerByMinutes(-5 / 60));

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

  document.getElementById('btn-debug-coach')?.addEventListener('click', () => generateCoachingInsights(true));

  // Stage display preview
  const stagePreviewBtn    = document.getElementById('btn-debug-stage-preview');
  const stagePreviewPanel  = document.getElementById('stage-preview-controls');
  const stagePreviewSlider = document.getElementById('stage-preview-slider');
  const stagePreviewPct    = document.getElementById('stage-preview-pct');
  const stagePreviewLabel  = document.getElementById('stage-preview-label');
  const stageMarkers       = document.getElementById('stage-preview-markers');
  const stageTransBtns     = document.getElementById('stage-transition-btns');

  const sunflowerType = PLANT_SPECIES.find(p => p.id === 'sunflower_sprout');
  const sfData = PLANT_STAGE_DATA['sunflower'];

  // ---- helpers ----
  function getPlanHours() {
    return (selectedPlan && PLANS[selectedPlan]) ? PLANS[selectedPlan].fastHours : 16;
  }

  function fmt(ms) {
    const s = Math.floor(Math.abs(ms) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  // Apply a progress value [0..1] → update garden, slider, and timer display together
  // syncTimer: true when user is scrubbing (adjusts the real fast start time)
  //            false when tick is driving (display only, real timer untouched)
  function applyPreviewProgress(progress, syncTimer = true) {
    progress = Math.min(1, Math.max(0, progress));

    // Update slider position
    stagePreviewSlider.value = Math.round(progress * 1000);

    // Update stage label
    const stageIdx = sfData.stages.findIndex(s => progress <= s.maxProgress);
    const idx = stageIdx === -1 ? sfData.stages.length - 1 : stageIdx;
    stagePreviewPct.textContent   = `${Math.round(progress * 100)}%`;
    stagePreviewLabel.textContent = `Stage ${idx + 1} — ${sfData.stages[idx].label}`;

    // Update garden animation
    updateGardenScene(progress, sunflowerType);

    // Update timer UI
    const goalMs    = getPlanHours() * 3600 * 1000;
    const elapsedMs = Math.round(progress * goalMs);
    const remainMs  = Math.max(0, goalMs - elapsedMs);
    document.getElementById('timer-display').textContent = fmt(elapsedMs);
    document.getElementById('timer-progress-fill').style.width = `${progress * 100}%`;
    document.getElementById('growth-stage-label').textContent  = getSeasonMessage(progress);
    const subtitle = document.getElementById('timer-subtitle');
    if (progress >= 1) {
      subtitle.textContent  = 'Goal reached!';
      subtitle.style.color  = 'var(--accent-green)';
    } else {
      subtitle.textContent = `${fmt(remainMs)} remaining`;
      subtitle.style.color = '';
    }

    // Only sync the real fast timer when the user is scrubbing, not on every tick
    if (syncTimer && timer.isRunning && store.state.activeFast) {
      const currentElapsedMs = Date.now() - store.state.activeFast.startTime;
      const diffHours = (elapsedMs - currentElapsedMs) / 3600000;
      store.adjustActiveFast(diffHours);
    }
  }
  // Expose to onTimerTick (which is top-level and can't close over this function)
  _applyPreviewProgress = (p) => applyPreviewProgress(p, false);

  function buildStageDebugUI() {
    stageMarkers.innerHTML = '';
    stageTransBtns.innerHTML = '';
    sfData.stages.forEach((s, i) => {
      // Pip marker at each threshold
      const pip = document.createElement('div');
      pip.style.cssText = `position:absolute; left:${s.maxProgress * 100}%; top:0; width:2px; height:100%; background:#66ffaa88; transform:translateX(-50%);`;
      stageMarkers.appendChild(pip);

      if (i === sfData.stages.length - 1) return;
      // Jump to the exact start of the next stage
      const jumpProg = s.maxProgress + 0.0001;
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline';
      btn.style.cssText = 'border-color:#66ffaa55; color:#66ffaa; font-size:0.7rem; padding:2px 8px;';
      btn.textContent = `S${i + 1}→S${i + 2}`;
      btn.addEventListener('click', () => applyPreviewProgress(jumpProg));
      stageTransBtns.appendChild(btn);
    });
  }

  // Open / close
  stagePreviewBtn?.addEventListener('click', () => {
    const isOpen = stagePreviewPanel.style.display !== 'none';
    const workshopBtnEl = document.getElementById('btn-scene-workshop');
    if (isOpen) {
      _debugPreviewOpen = false;
      stagePreviewPanel.style.display = 'none';
      if (workshopBtnEl) workshopBtnEl.style.display = 'none';
      document.getElementById('scene-workshop').style.display = 'none';
      hideGardenScene();
      document.querySelector('.plant-area').style.display = 'none';
      stagePreviewBtn.textContent = '🌻 Preview Growth';
    } else {
      _debugPreviewOpen = true;
      buildStageDebugUI();
      stagePreviewPanel.style.display = '';
      if (workshopBtnEl) workshopBtnEl.style.display = '';
      document.querySelector('.plant-area').style.display = 'flex';
      document.getElementById('timer-card-wrap')?.style.setProperty('display', 'block');
      showGardenScene(sunflowerType, 0);
      applyPreviewProgress(0);
      stagePreviewBtn.textContent = '✕ Close Preview';
    }
  });

  // Slider → everything else
  stagePreviewSlider?.addEventListener('input', () => {
    applyPreviewProgress(stagePreviewSlider.value / 1000);
  });

  // Step arrows (5 seconds)
  function getStepSize() {
    return 5 / (getPlanHours() * 3600); // as progress fraction
  }

  document.getElementById('stage-step-back')?.addEventListener('click', () => {
    applyPreviewProgress(stagePreviewSlider.value / 1000 - getStepSize());
  });
  document.getElementById('stage-step-fwd')?.addEventListener('click', () => {
    applyPreviewProgress(stagePreviewSlider.value / 1000 + getStepSize());
  });
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

  showGardenScene(plantType, 0);

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
  hideGardenScene();
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
  if (_debugPreviewOpen) {
    _applyPreviewProgress?.(Math.min(1, t.progress));
    return;
  }

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

  // Update plant growth display (skip if debug preview is active)
  if (!_debugPreviewActive) {
    const activePlantType = store.state.activeFast?.plantType;
    updateGardenScene(Math.min(1, t.progress), activePlantType);
  }
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
    }, 2000);
  }

  if (!allCollected) notifications.notifyFastComplete(plantName);

  if (!allCollected) {
    // Keep the Full Bloom visible for a moment, then reset
    setTimeout(() => {
      showIdleTimerUI();
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
      <div class="reflection-bonus-hint">
        ✨ Fill out your Body Metrics or Mindfulness Journal today and a link will appear on the back of this card.
      </div>
      <div class="reveal-action-row">
        <button class="btn btn-outline" id="btn-close-reveal" data-plant-id="${plantType?.id || ''}">View Collection</button>
        <button class="btn btn-primary" id="btn-reveal-reflect">🌿 Reflect in Inner Garden</button>
      </div>
    </div>
  `;

  modalOverlay.classList.remove('hidden');

  document.getElementById('btn-close-reveal')?.addEventListener('click', (e) => {
    modalOverlay.classList.add('hidden');
    const plantId = e.currentTarget.dataset.plantId;
    switchTab('garden');
    if (plantId) {
      setTimeout(() => {
        const card = document.querySelector(`.botanical-card-container[data-plant-id="${plantId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            card.classList.add('card-highlight');

            const stopPulse = () => {
              card.classList.remove('card-highlight');
              document.removeEventListener('click', stopPulse);
            };

            // Stop on any click anywhere (including the card itself)
            document.addEventListener('click', stopPulse);
          }, 400);
        }
      }, 150);
    }
  });

  document.getElementById('btn-reveal-reflect')?.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    switchTab('wellness');
  });
}

function showReflectionPrompt() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="plant-reveal">
      <div class="plant-reveal-emoji">🌿</div>
      <div class="plant-reveal-name">Fast Complete</div>
      <p style="color: var(--text-secondary); font-size: var(--fs-sm); margin: var(--space-md) 0;">
        Take a moment to reflect in your Inner Garden — it only takes a minute.
      </p>
      <div class="reflection-bonus-hint">
        ✨ Fill out your Body Metrics or Mindfulness Journal today and a link will appear on the back of your specimen card.
      </div>
      <p style="color: var(--text-muted); font-size: 0.72rem; margin-top: var(--space-sm);">No pressure — you can always skip.</p>
      <div class="reveal-action-row">
        <button class="btn btn-outline" id="btn-reflect-skip">Skip</button>
        <button class="btn btn-primary" id="btn-reflect-yes">🌿 Reflect in Inner Garden</button>
      </div>
    </div>
  `;

  modalOverlay.classList.remove('hidden');

  document.getElementById('btn-reflect-skip')?.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
  });

  document.getElementById('btn-reflect-yes')?.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    switchTab('wellness');
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

    const card = document.querySelector('.profile-name-card');
    const setEditMode = () => {
      nameInput.readOnly = false;
      nameInput.classList.remove('is-locked');
      nameBtn.innerHTML = 'Save';
      nameBtn.classList.remove('btn-outline', 'btn-edit-checkin');
      nameBtn.classList.add('btn-primary');
      card?.classList.remove('profile-name-locked');
      nameInput.focus();
      nameInput.select();
    };
    const setSavedMode = () => {
      nameInput.readOnly = true;
      nameInput.classList.add('is-locked');
      nameBtn.innerHTML = '✏️ Edit';
      nameBtn.classList.remove('btn-primary');
      nameBtn.classList.add('btn-outline', 'btn-edit-checkin');
      card?.classList.add('profile-name-locked');
    };

    // Start in saved mode if a name already exists
    if (savedName) setSavedMode(); else setEditMode();

    nameBtn.addEventListener('click', () => {
      if (nameBtn.classList.contains('btn-outline')) {
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

