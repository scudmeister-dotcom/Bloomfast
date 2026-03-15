/* ============================================================
   Garden — Isometric Garden Renderer with Drag & Drop
   ============================================================ */

import { PlantRenderer } from './plant.js';

const DECORATIONS_CATALOG = [
  { type: 'stepping-stone', emoji: '🪨', label: 'Stone Path', unlockAt: 0 },
  { type: 'lantern', emoji: '🏮', label: 'Lantern', unlockAt: 2 },
  { type: 'bench', emoji: '🪑', label: 'Park Bench', unlockAt: 4 },
  { type: 'pond', emoji: '🐟', label: 'Koi Pond', unlockAt: 6 },
  { type: 'geode', emoji: '🔮', label: 'Glowing Geode', unlockAt: 8 },
  { type: 'crystal', emoji: '💎', label: 'Quartz Crystal', unlockAt: 10 },
  { type: 'fountain', emoji: '⛲', label: 'Fountain', unlockAt: 14 },
  { type: 'butterfly', emoji: '🦋', label: 'Butterfly Jar', unlockAt: 18 },
  { type: 'fairy-light', emoji: '✨', label: 'Fairy Lights', unlockAt: 22 },
  { type: 'birdhouse', emoji: '🏠', label: 'Birdhouse', unlockAt: 26 }
];

const GARDEN_TIERS = [
  { name: 'Balcony', minPlants: 0, width: 900, height: 600 },
  { name: 'Yard', minPlants: 5, width: 1100, height: 700 },
  { name: 'Garden', minPlants: 15, width: 1400, height: 850 },
  { name: 'Estate', minPlants: 30, width: 1800, height: 1000 }
];

export class GardenRenderer {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.store = store;
    this.animFrame = null;
    this.time = 0;
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.activeTool = 'move';
    this.waterDrops = [];
    this.weeds = [];
    this.sparkles = [];

    this.setupInteraction();
    this.generateWeeds();
  }

  get gardenData() {
    return this.store.state.garden;
  }

  get currentTier() {
    const plantCount = this.gardenData.plants.length;
    let tier = GARDEN_TIERS[0];
    for (const t of GARDEN_TIERS) {
      if (plantCount >= t.minPlants) tier = t;
    }
    return tier;
  }

  setupInteraction() {
    const canvas = this.canvas;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (this.activeTool === 'move') {
        // Check plants
        const plant = this.findPlantAt(mx, my);
        if (plant) {
          this.dragTarget = { type: 'plant', item: plant };
          this.dragOffset = { x: mx - plant.x, y: my - plant.y };
          canvas.style.cursor = 'grabbing';
          return;
        }
        // Check decorations
        const decor = this.findDecorationAt(mx, my);
        if (decor) {
          this.dragTarget = { type: 'decor', item: decor };
          this.dragOffset = { x: mx - decor.x, y: my - decor.y };
          canvas.style.cursor = 'grabbing';
          return;
        }
      } else if (this.activeTool === 'water') {
        this.addWaterDrop(mx, my);
      } else if (this.activeTool === 'weed') {
        this.pullWeed(mx, my);
      } else if (this.activeTool === 'decor') {
        // Placing decoration (handled externally)
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.dragTarget) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (this.dragTarget.type === 'plant') {
        this.dragTarget.item.x = mx - this.dragOffset.x;
        this.dragTarget.item.y = my - this.dragOffset.y;
      } else if (this.dragTarget.type === 'decor') {
        this.dragTarget.item.x = mx - this.dragOffset.x;
        this.dragTarget.item.y = my - this.dragOffset.y;
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (this.dragTarget) {
        if (this.dragTarget.type === 'plant') {
          this.store.movePlant(this.dragTarget.item.id, this.dragTarget.item.x, this.dragTarget.item.y);
        } else if (this.dragTarget.type === 'decor') {
          this.store.moveDecoration(this.dragTarget.item.id, this.dragTarget.item.x, this.dragTarget.item.y);
        }
        this.dragTarget = null;
        this.canvas.style.cursor = 'grab';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      this.dragTarget = null;
      this.canvas.style.cursor = 'grab';
    });
  }

  findPlantAt(x, y) {
    // Reverse order so top-most (last drawn) is found first
    const plants = [...this.gardenData.plants].reverse();
    for (const p of plants) {
      if (Math.abs(x - p.x) < 30 && Math.abs(y - p.y) < 40) return p;
    }
    return null;
  }

  findDecorationAt(x, y) {
    const decors = [...this.gardenData.decorations].reverse();
    for (const d of decors) {
      if (Math.abs(x - d.x) < 25 && Math.abs(y - d.y) < 25) return d;
    }
    return null;
  }

  generateWeeds() {
    // Generate weeds based on inactivity
    const lastActive = this.gardenData.lastActive;
    if (!lastActive) return;

    const daysSince = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
    const weedCount = Math.min(Math.floor(daysSince / 2), 8);

    this.weeds = [];
    for (let i = 0; i < weedCount; i++) {
      this.weeds.push({
        x: 100 + Math.random() * (this.canvas.width - 200),
        y: 200 + Math.random() * (this.canvas.height - 300),
        size: 0.5 + Math.random() * 0.5,
        alive: true
      });
    }
  }

  addWaterDrop(x, y) {
    for (let i = 0; i < 8; i++) {
      this.waterDrops.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vy: 1 + Math.random() * 2,
        life: 1,
        size: 2 + Math.random() * 3
      });
    }
    // Add sparkle to nearby plants
    this.gardenData.plants.forEach(p => {
      if (Math.abs(p.x - x) < 60 && Math.abs(p.y - y) < 60) {
        for (let i = 0; i < 5; i++) {
          this.sparkles.push({
            x: p.x + (Math.random() - 0.5) * 30,
            y: p.y - 10 - Math.random() * 30,
            vy: -0.5 - Math.random(),
            life: 1,
            size: 2 + Math.random() * 2
          });
        }
      }
    });
  }

  pullWeed(x, y) {
    for (const weed of this.weeds) {
      if (weed.alive && Math.abs(weed.x - x) < 25 && Math.abs(weed.y - y) < 25) {
        weed.alive = false;
        // Poof particles
        for (let i = 0; i < 6; i++) {
          this.sparkles.push({
            x: weed.x + (Math.random() - 0.5) * 20,
            y: weed.y + (Math.random() - 0.5) * 20,
            vy: -1 - Math.random(),
            life: 1,
            size: 3
          });
        }
        break;
      }
    }
  }

  setTool(tool) {
    this.activeTool = tool;
    this.canvas.style.cursor = tool === 'move' ? 'grab' : 'crosshair';
  }

  startAnimation() {
    const loop = () => {
      this.time += 0.016;
      this.render();
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  stopAnimation() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  render() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    this.drawGardenBackground(w, h);

    // Draw isometric grid
    this.drawGrid(w, h);

    // Draw decorations (behind plants)
    this.gardenData.decorations.forEach(d => this.drawDecoration(d));

    // Draw weeds
    this.weeds.filter(w => w.alive).forEach(weed => this.drawWeed(weed));

    // Draw plants (sorted by y for depth)
    const sortedPlants = [...this.gardenData.plants].sort((a, b) => a.y - b.y);
    sortedPlants.forEach(plant => {
      PlantRenderer.drawMiniPlant(ctx, plant, plant.x, plant.y, 45);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(plant.x, plant.y + 18, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Water drops
    this.waterDrops = this.waterDrops.filter(d => {
      d.y += d.vy;
      d.life -= 0.02;
      if (d.life <= 0) return false;
      ctx.fillStyle = `rgba(52, 152, 219, ${d.life})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // Sparkles
    this.sparkles = this.sparkles.filter(s => {
      s.y += s.vy;
      s.life -= 0.015;
      if (s.life <= 0) return false;
      ctx.fillStyle = `rgba(255, 255, 150, ${s.life})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // Empty garden message
    if (this.gardenData.plants.length === 0 && this.gardenData.decorations.length === 0) {
      ctx.fillStyle = 'rgba(160, 191, 173, 0.5)';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🌱 Complete your first fast to add a plant!', w / 2, h / 2);
    }
  }

  drawGardenBackground(w, h) {
    const { ctx } = this;

    // Ground
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1a10');
    grad.addColorStop(0.3, '#0d2215');
    grad.addColorStop(1, '#1a3520');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grass texture
    ctx.fillStyle = 'rgba(76, 175, 80, 0.03)';
    for (let i = 0; i < 100; i++) {
      const gx = (Math.sin(i * 37.7) * 0.5 + 0.5) * w;
      const gy = (Math.cos(i * 13.3) * 0.5 + 0.5) * h;
      ctx.beginPath();
      ctx.arc(gx, gy, 20 + Math.random() * 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGrid(w, h) {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.04)';
    ctx.lineWidth = 1;

    const gridSize = 60;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  drawDecoration(decor) {
    const { ctx } = this;
    const item = DECORATIONS_CATALOG.find(d => d.type === decor.type);
    if (!item) return;

    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.emoji, decor.x, decor.y);
  }

  drawWeed(weed) {
    const { ctx } = this;
    const s = weed.size;
    ctx.save();
    ctx.translate(weed.x, weed.y);
    ctx.scale(s, s);

    // Weed stems
    ctx.strokeStyle = '#556b2f';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (i - 1) * 0.4 + Math.sin(this.time * 2 + i) * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = '#556b2f';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 15, Math.sin(angle) * 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  placeDecoration(type, x, y) {
    this.store.addDecoration(type, x, y);
  }

  getAvailableDecorations() {
    const plantCount = this.gardenData.plants.length;
    return DECORATIONS_CATALOG.map(d => ({
      ...d,
      unlocked: plantCount >= d.unlockAt
    }));
  }

  getTierLabel() {
    return this.currentTier.name;
  }
}

export { DECORATIONS_CATALOG };
