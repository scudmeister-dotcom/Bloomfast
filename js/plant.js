/* ============================================================
   Plant — Canvas-based Procedural Plant Renderer
   ============================================================ */

// Plant species library with drawing parameters
const BASE_SPECIES = [
  // ===== FLOWERS (10) =====
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', image: 'assets/plants/sunflower.png', category: 'Flowers', style: 'flower', petalCount: 16, petalLength: 35, hasFace: false, defaultCenter: '#8B4513', defaultStem: '#2d8a4e', defaultLeaf: '#3cb371', funFact: 'Sunflowers exhibit heliotropism, tracking the sun across the sky.' },
  { id: 'sampaguita', name: 'Sampaguita', emoji: '🤍', image: 'assets/plants/sampaguita.png', category: 'Flowers', style: 'flower', petalCount: 8, petalLength: 22, hasFace: false, defaultCenter: '#f5e6a8', defaultStem: '#2d7a3e', defaultLeaf: '#4caf50', funFact: 'Sampaguita is the national flower of the Philippines, symbolizing purity.' },
  { id: 'rose', name: 'Rose', emoji: '🌹', image: 'assets/plants/rose.png', category: 'Flowers', style: 'flower', petalCount: 12, petalLength: 25, hasFace: false, defaultCenter: '#3e2723', defaultStem: '#1b5e20', defaultLeaf: '#388e3c', funFact: 'Roses are one of the oldest cultivated flowers, dating back over 5,000 years.' },
  { id: 'orchid', name: 'Orchid', emoji: '🪻', image: 'assets/plants/orchid.png', category: 'Flowers', style: 'flower', petalCount: 5, petalLength: 30, hasFace: false, defaultCenter: '#7b1fa2', defaultStem: '#2d6a3e', defaultLeaf: '#4a8f5c', funFact: 'Orchids have the smallest seeds in the world, appearing like fine dust.' },
  { id: 'lotus', name: 'Lotus', emoji: '🪷', image: 'assets/plants/lotus.png', category: 'Flowers', style: 'flower', petalCount: 10, petalLength: 28, hasFace: false, defaultCenter: '#fce4ec', defaultStem: '#2e7d32', defaultLeaf: '#388e3c', funFact: 'Lotus seeds can survive for more than a thousand years and still sprout!' },
  { id: 'tulip', name: 'Tulip', emoji: '🌷', image: 'assets/plants/tulip.png', category: 'Flowers', style: 'flower', petalCount: 6, petalLength: 30, hasFace: false, defaultCenter: '#ffe082', defaultStem: '#4caf50', defaultLeaf: '#81c784', funFact: 'In the 1600s, tulip bulbs in the Netherlands became so valuable they were used as currency.' },
  { id: 'dahlia', name: 'Dahlia', emoji: '🌸', image: 'assets/plants/dahlia.png', category: 'Flowers', style: 'flower', petalCount: 20, petalLength: 22, hasFace: false, defaultCenter: '#c2185b', defaultStem: '#388e3c', defaultLeaf: '#4caf50', funFact: 'Dahlias were originally grown as food crops by the Aztecs before becoming ornamental favorites.' },
  { id: 'peony', name: 'Peony', emoji: '🌺', image: 'assets/plants/peony.png', category: 'Flowers', style: 'flower', petalCount: 15, petalLength: 26, hasFace: false, defaultCenter: '#f8bbd0', defaultStem: '#2e7d32', defaultLeaf: '#4caf50', funFact: 'Peonies can live for over 100 years and are considered symbols of romance and prosperity.' },
  { id: 'iris', name: 'Iris', emoji: '💜', image: 'assets/plants/iris.png', category: 'Flowers', style: 'flower', petalCount: 6, petalLength: 28, hasFace: false, defaultCenter: '#4a148c', defaultStem: '#33691e', defaultLeaf: '#558b2f', funFact: 'The iris is named after the Greek goddess of the rainbow, connecting heaven and earth.' },
  { id: 'magnolia', name: 'Magnolia', emoji: '🤍', image: 'assets/plants/magnolia.png', category: 'Flowers', style: 'flower', petalCount: 8, petalLength: 32, hasFace: false, defaultCenter: '#fce4ec', defaultStem: '#5d4037', defaultLeaf: '#2e7d32', funFact: 'Magnolias are among the most ancient flowering plants, existing before bees evolved.' },
  { id: 'hibiscus', name: 'Hibiscus', emoji: '🌺', image: 'assets/plants/hibiscus.png', category: 'Flowers', style: 'flower', petalCount: 5, petalLength: 30, hasFace: false, defaultCenter: '#e65100', defaultStem: '#33691e', defaultLeaf: '#558b2f', funFact: 'Hibiscus tea is consumed worldwide and can help lower blood pressure naturally.' },

  // ===== TREES (7) =====
  { id: 'cherry_blossom', name: 'Cherry Blossom', emoji: '🌸', image: 'assets/plants/cherry_blossom.png', category: 'Trees', style: 'tree', petalCount: 5, petalLength: 18, hasFace: false, defaultCenter: '#ff69b4', defaultStem: '#5d4037', defaultLeaf: '#4caf50', funFact: 'Cherry blossoms bloom for only about a week, making them a symbol of fleeting beauty.' },
  { id: 'bonsai', name: 'Bonsai', emoji: '🌳', image: 'assets/plants/bonsai.png', category: 'Trees', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#43a047', defaultStem: '#5d4037', defaultLeaf: '#2e7d32', funFact: 'The art of bonsai originated in China over 1,000 years ago.' },
  { id: 'willow', name: 'Weeping Willow', emoji: '🌿', image: 'assets/plants/willow.png', category: 'Trees', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#689f38', defaultStem: '#5d4037', defaultLeaf: '#8bc34a', funFact: 'Willow bark contains salicin, the natural precursor to aspirin, used for millennia as pain relief.' },
  { id: 'maple', name: 'Japanese Maple', emoji: '🍁', image: 'assets/plants/maple.png', category: 'Trees', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#d32f2f', defaultStem: '#4e342e', defaultLeaf: '#c62828', funFact: 'Japanese maples can live for over 300 years and their leaves turn brilliant red in autumn.' },
  { id: 'olive', name: 'Olive Tree', emoji: '🫒', image: 'assets/plants/olive_tree.png', category: 'Trees', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#827717', defaultStem: '#5d4037', defaultLeaf: '#9e9d24', funFact: 'Olive trees can live thousands of years. Some in the Mediterranean are over 3,000 years old.' },
  { id: 'birch', name: 'Silver Birch', emoji: '🌳', image: 'assets/plants/birch.png', category: 'Trees', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#e0e0e0', defaultStem: '#f5f5f5', defaultLeaf: '#66bb6a', funFact: 'Birch bark was used as paper by ancient cultures and is naturally waterproof.' },
  { id: 'redwood', name: 'Redwood', emoji: '🌲', image: 'assets/plants/redwood.png', category: 'Trees', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#6d4c41', defaultStem: '#4e342e', defaultLeaf: '#2e7d32', funFact: 'Coast redwoods are the tallest living organisms on Earth, reaching over 380 feet.' },

  // ===== SUCCULENTS (7) =====
  { id: 'cactus', name: 'Barrel Cactus', emoji: '🌵', image: 'assets/plants/cactus.png', category: 'Succulents', style: 'cactus', petalCount: 6, petalLength: 14, hasFace: false, defaultCenter: '#fff176', defaultStem: '#2e7d32', defaultLeaf: '#388e3c', funFact: 'Cacti store water in their thick stems to survive harsh droughts. Some can live 200 years.' },
  { id: 'succulent', name: 'Succulent', emoji: '💎', image: 'assets/plants/succulent.png', category: 'Succulents', style: 'succulent', petalCount: 8, petalLength: 20, hasFace: false, defaultCenter: '#00bcd4', defaultStem: '#4db6ac', defaultLeaf: '#80cbc4', funFact: 'You can grow a whole new succulent plant from a single fallen leaf.' },
  { id: 'aloe_vera', name: 'Aloe Vera', emoji: '🌿', image: 'assets/plants/aloe_vera.png', category: 'Succulents', style: 'succulent', petalCount: 10, petalLength: 22, hasFace: false, defaultCenter: '#4caf50', defaultStem: '#388e3c', defaultLeaf: '#66bb6a', funFact: 'Aloe vera gel contains over 75 active compounds including vitamins, enzymes, and amino acids.' },
  { id: 'jade_plant', name: 'Jade Plant', emoji: '💚', image: 'assets/plants/jade_plant.png', category: 'Succulents', style: 'succulent', petalCount: 6, petalLength: 18, hasFace: false, defaultCenter: '#2e7d32', defaultStem: '#5d4037', defaultLeaf: '#43a047', funFact: 'Jade plants are symbols of luck and prosperity. They can live for decades.' },
  { id: 'echeveria', name: 'Echeveria', emoji: '🌸', image: 'assets/plants/echeveria.png', category: 'Succulents', style: 'succulent', petalCount: 12, petalLength: 16, hasFace: false, defaultCenter: '#7986cb', defaultStem: '#78909c', defaultLeaf: '#90a4ae', funFact: 'Echeveria rosettes are arranged in a perfect Fibonacci spiral pattern.' },
  { id: 'agave', name: 'Agave', emoji: '🌿', image: 'assets/plants/agave.png', category: 'Succulents', style: 'succulent', petalCount: 8, petalLength: 24, hasFace: false, defaultCenter: '#546e7a', defaultStem: '#455a64', defaultLeaf: '#78909c', funFact: 'Agave plants only flower once in their lifetime, sometimes after 80 years of growth.' },
  { id: 'haworthia', name: 'Haworthia', emoji: '💎', image: 'assets/plants/haworthia.png', category: 'Succulents', style: 'succulent', petalCount: 6, petalLength: 14, hasFace: false, defaultCenter: '#66bb6a', defaultStem: '#4caf50', defaultLeaf: '#81c784', funFact: 'Haworthia plants have translucent "windows" on their leaves to let light reach inner cells.' },

  // ===== HERBS (7) =====
  { id: 'lavender', name: 'Lavender', emoji: '💜', image: 'assets/plants/lavender.png', category: 'Herbs', style: 'spike', petalCount: 20, petalLength: 8, hasFace: false, defaultCenter: '#7e57c2', defaultStem: '#558b2f', defaultLeaf: '#7cb342', funFact: 'Lavender has been used for over 2,500 years as a natural remedy.' },
  { id: 'fern', name: 'Fern', emoji: '🌿', image: 'assets/plants/fern.png', category: 'Herbs', style: 'spike', petalCount: 15, petalLength: 8, hasFace: false, defaultCenter: '#9ccc65', defaultStem: '#558b2f', defaultLeaf: '#7cb342', funFact: 'Ferns are ancient; they existed before dinosaurs and reproduce via spores.' },
  { id: 'basil', name: 'Basil', emoji: '🌿', image: 'assets/plants/basil.png', category: 'Herbs', style: 'spike', petalCount: 12, petalLength: 6, hasFace: false, defaultCenter: '#4caf50', defaultStem: '#2e7d32', defaultLeaf: '#43a047', funFact: 'In ancient Greece, basil was considered the "royal herb" and only kings were allowed to cut it.' },
  { id: 'rosemary', name: 'Rosemary', emoji: '🌿', image: 'assets/plants/rosemary.png', category: 'Herbs', style: 'spike', petalCount: 16, petalLength: 7, hasFace: false, defaultCenter: '#5c6bc0', defaultStem: '#33691e', defaultLeaf: '#558b2f', funFact: 'Rosemary is linked to memory improvement. Ancient Greek students wore garlands of it during exams.' },
  { id: 'mint', name: 'Mint', emoji: '🌱', image: 'assets/plants/mint.png', category: 'Herbs', style: 'spike', petalCount: 10, petalLength: 6, hasFace: false, defaultCenter: '#66bb6a', defaultStem: '#388e3c', defaultLeaf: '#81c784', funFact: 'Mint is one of the most invasive herbs — it can take over an entire garden in a single season.' },
  { id: 'sage', name: 'Sage', emoji: '🍃', image: 'assets/plants/sage.png', category: 'Herbs', style: 'spike', petalCount: 14, petalLength: 7, hasFace: false, defaultCenter: '#78909c', defaultStem: '#546e7a', defaultLeaf: '#78909c', funFact: 'The name "sage" comes from the Latin "salvare," meaning "to save," reflecting its medicinal history.' },
  { id: 'thyme', name: 'Thyme', emoji: '🌱', image: 'assets/plants/thyme.png', category: 'Herbs', style: 'spike', petalCount: 18, petalLength: 5, hasFace: false, defaultCenter: '#c5e1a5', defaultStem: '#558b2f', defaultLeaf: '#7cb342', funFact: 'Ancient Egyptians used thyme for embalming, and Greek soldiers bathed in it for courage.' },

  // ===== EXOTIC (7) =====
  { id: 'mushroom', name: 'Mushroom', emoji: '🍄', image: 'assets/plants/mushroom.png', category: 'Exotic', style: 'mushroom', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#ffffff', defaultStem: '#e0e0e0', defaultLeaf: '#ff5252', funFact: 'Mushrooms are more closely related to humans than they are to plants!' },
  { id: 'flytrap', name: 'Venus Flytrap', emoji: '🪴', image: 'assets/plants/flytrap.png', category: 'Exotic', style: 'carnivorous', petalCount: 2, petalLength: 30, hasFace: true, defaultCenter: '#e53935', defaultStem: '#388e3c', defaultLeaf: '#4caf50', funFact: 'Flytraps require two touches within 20 seconds to snap shut.' },
  { id: 'corpse_flower', name: 'Corpse Flower', emoji: '🌺', image: 'assets/plants/corpse_flower.png', category: 'Exotic', style: 'flower', petalCount: 1, petalLength: 40, hasFace: false, defaultCenter: '#880e4f', defaultStem: '#388e3c', defaultLeaf: '#4caf50', funFact: 'The corpse flower blooms for only 24-48 hours and smells like rotting flesh to attract pollinators.' },
  { id: 'pitcher_plant', name: 'Pitcher Plant', emoji: '🪴', image: 'assets/plants/pitcher_plant.png', category: 'Exotic', style: 'carnivorous', petalCount: 3, petalLength: 25, hasFace: false, defaultCenter: '#8bc34a', defaultStem: '#33691e', defaultLeaf: '#689f38', funFact: 'Pitcher plants drown insects in pools of digestive enzymes inside their tubular leaves.' },
  { id: 'bird_of_paradise', name: 'Bird of Paradise', emoji: '🧡', image: 'assets/plants/bird_of_paradise.png', category: 'Exotic', style: 'flower', petalCount: 5, petalLength: 35, hasFace: false, defaultCenter: '#e65100', defaultStem: '#2e7d32', defaultLeaf: '#388e3c', funFact: 'Bird of Paradise flowers resemble tropical birds in flight and are pollinated by sunbirds.' },
  { id: 'dragon_fruit', name: 'Dragon Fruit Cactus', emoji: '🐉', image: 'assets/plants/dragon_fruit.png', category: 'Exotic', style: 'cactus', petalCount: 8, petalLength: 20, hasFace: false, defaultCenter: '#e91e63', defaultStem: '#2e7d32', defaultLeaf: '#388e3c', funFact: 'Dragon fruit cactus blooms only at night, earning it the nickname "moonflower."' },
  { id: 'baobab', name: 'Baobab', emoji: '🌳', image: 'assets/plants/baobab.png', category: 'Exotic', style: 'tree', petalCount: 0, petalLength: 0, hasFace: false, defaultCenter: '#8d6e63', defaultStem: '#6d4c41', defaultLeaf: '#a5d6a7', funFact: 'Baobab trees can store up to 32,000 gallons of water in their trunks to survive droughts.' },
];

const VARIANTS = [
  { prefix: 'Common', rarity: 'common', hueRotate: 0, petal: null },
  { prefix: 'Uncommon', rarity: 'uncommon', hueRotate: 45, petal: '#ffd700' },
  { prefix: 'Epic', rarity: 'epic', hueRotate: 200, petal: '#1e88e5' },
  { prefix: 'Legendary', rarity: 'legendary', hueRotate: 0, petal: '#fff', isRainbow: true },
];

export const PLANT_SPECIES = [];

BASE_SPECIES.forEach(base => {
  VARIANTS.forEach(variant => {
    let finalPetal = variant.petal || base.defaultLeaf;
    if (base.style === 'flower' || base.style === 'tree' || base.style === 'mushroom') {
      finalPetal = variant.petal || (base.style === 'mushroom' ? '#ff5252' : base.defaultCenter);
    }

    let emojiFilter = `hue-rotate(${variant.hueRotate}deg)`;
    if (variant.filter) emojiFilter += ` ${variant.filter}`;

    PLANT_SPECIES.push({
      id: `${base.id}_${variant.prefix.toLowerCase()}`,
      name: `${variant.prefix} ${base.name}`,
      emoji: base.emoji,
      image: base.image,
      category: base.category,
      rarity: variant.rarity,
      style: base.style,
      petalCount: base.petalCount,
      petalLength: base.petalLength,
      hasFace: base.hasFace,
      funFact: base.funFact,
      emojiFilter: emojiFilter,
      colors: {
        stem: base.defaultStem,
        leaf: base.defaultLeaf,
        center: base.defaultCenter,
        petal: finalPetal
      },
      isRainbow: variant.isRainbow || false
    });
  });
});

/**
 * Get a random plant that hasn't been collected yet.
 * @param {Set|Array} [excludeIds] - IDs of already-owned plants to skip
 * @returns {Object|null} A plant species object, or null if all collected
 */
export function getRandomPlant(excludeIds) {
  const excluded = excludeIds instanceof Set ? excludeIds : new Set(excludeIds || []);
  const available = PLANT_SPECIES.filter(p => !excluded.has(p.id));

  if (available.length === 0) return null;

  const weights = { common: 50, uncommon: 30, rare: 15, legendary: 5 };
  const pool = [];
  available.forEach(p => {
    const w = weights[p.rarity] || 10;
    for (let i = 0; i < w; i++) pool.push(p);
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Standardized growth templates per category.
 * The timer shows one of these while the plant grows — the user sees the
 * category silhouette (flower, tree, etc.) but NOT the exact species.
 */
export const CATEGORY_GROWTH_TEMPLATES = {
  Flowers: {
    style: 'flower', petalCount: 8, petalLength: 25, hasFace: false,
    colors: { stem: '#2d8a4e', leaf: '#3cb371', center: '#8d6e63', petal: '#e8b4b8' }
  },
  Trees: {
    style: 'tree', petalCount: 0, petalLength: 0, hasFace: false,
    colors: { stem: '#5d4037', leaf: '#4caf50', center: '#43a047', petal: '#43a047' }
  },
  Succulents: {
    style: 'succulent', petalCount: 8, petalLength: 18, hasFace: false,
    colors: { stem: '#4db6ac', leaf: '#80cbc4', center: '#00bcd4', petal: '#80cbc4' }
  },
  Herbs: {
    style: 'spike', petalCount: 16, petalLength: 8, hasFace: false,
    colors: { stem: '#558b2f', leaf: '#7cb342', center: '#7e57c2', petal: '#9575cd' }
  },
  Exotic: {
    style: 'mushroom', petalCount: 0, petalLength: 0, hasFace: false,
    colors: { stem: '#e0e0e0', leaf: '#ff5252', center: '#ffffff', petal: '#ff5252' }
  }
};

/**
 * Get the growth template for a plant's category.
 * @param {Object} plant - A PLANT_SPECIES entry
 * @returns {Object} A template suitable for PlantRenderer.setPlant()
 */
export function getCategoryTemplate(plant) {
  return CATEGORY_GROWTH_TEMPLATES[plant.category] || CATEGORY_GROWTH_TEMPLATES.Flowers;
}

export class PlantRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animFrame = null;
    this.time = 0;
    this.plant = null;
    this.progress = 0;
    this.particles = [];
    this.baseScale = 1;
  }

  setPlant(plant) {
    this.plant = plant;
    this.particles = [];
  }

  setProgress(progress) {
    this.progress = Math.min(1, Math.max(0, progress));
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

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw background gradient
    this.drawBackground(w, h);

    // Draw soil
    this.drawSoil(w, h);

    if (!this.plant || this.progress < 0.01) {
      // Draw seed
      this.drawSeed(w, h);
      return;
    }

    // Draw plant based on style
    const cx = w / 2;
    const groundY = h * 0.78;

    ctx.save();
    ctx.translate(cx, groundY);

    switch (this.plant.style) {
      case 'mushroom': this.drawMushroom(); break;
      case 'cactus': this.drawCactus(); break;
      case 'tree': this.drawTree(); break;
      case 'succulent': this.drawSucculent(); break;
      case 'spike': this.drawSpike(); break;
      case 'carnivorous': this.drawCarnivorous(); break;
      default: this.drawFlower(); break;
    }

    ctx.restore();

    // Draw particles
    this.updateAndDrawParticles(w, h);

    // Draw rarity glow for rare+ plants
    if (this.progress > 0.8 && (this.plant.rarity === 'rare' || this.plant.rarity === 'legendary')) {
      this.drawRarityGlow(cx, groundY);
    }
  }

  drawBackground(w, h) {
    const { ctx } = this;
    // Dark gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1a0f');
    grad.addColorStop(0.6, '#0d2818');
    grad.addColorStop(1, '#1a3a25');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    const starCount = 30;
    for (let i = 0; i < starCount; i++) {
      const sx = (Math.sin(i * 123.456) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 789.012) * 0.5 + 0.5) * h * 0.5;
      const brightness = 0.3 + 0.4 * Math.sin(this.time * 2 + i);
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSoil(w, h) {
    const { ctx } = this;
    const soilY = h * 0.78;

    // Soil mound
    const grad = ctx.createRadialGradient(w / 2, h, w * 0.5, w / 2, soilY, w * 0.7);
    grad.addColorStop(0, '#3e2723');
    grad.addColorStop(0.5, '#2c1e17');
    grad.addColorStop(1, '#1a120d');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.ellipse(w / 2, soilY + 20, w * 0.45, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soil texture (small dots)
    for (let i = 0; i < 40; i++) {
      const dx = w / 2 + (Math.sin(i * 7.7) * w * 0.35);
      const dy = soilY + 10 + Math.cos(i * 3.3) * 25;
      ctx.fillStyle = `rgba(90, 60, 40, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSeed(w, h) {
    const { ctx } = this;
    const cx = w / 2;
    const cy = h * 0.78;

    // Seed
    const pulse = 1 + 0.03 * Math.sin(this.time * 3);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#8d6e4c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6d4e2c';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // "Plant a seed" text
    ctx.fillStyle = 'rgba(160, 191, 173, 0.5)';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('🌰 Waiting to sprout...', cx, cy + 50);
  }

  drawFlower() {
    const { ctx, plant, progress } = this;
    const p = progress;
    const sway = Math.sin(this.time * 1.5) * 3 * p;

    // Stem
    const stemH = Math.min(p * 1.3, 1) * 180;
    if (stemH > 0) {
      ctx.strokeStyle = plant.colors.stem;
      ctx.lineWidth = 4 + p * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);

      // Curved stem
      const cp1x = sway * 0.5;
      const cp1y = -stemH * 0.4;
      const cp2x = sway;
      const cp2y = -stemH * 0.8;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, sway, -stemH);
      ctx.stroke();

      // Leaves
      if (p > 0.2) {
        const leafSize = Math.min((p - 0.2) / 0.3, 1) * 25;
        this.drawLeaf(sway * 0.3, -stemH * 0.3, leafSize, 0.5, plant.colors.leaf);
        if (p > 0.35) {
          this.drawLeaf(sway * 0.6, -stemH * 0.55, leafSize * 0.9, -0.5, plant.colors.leaf);
        }
      }
    }

    // Flower head
    if (p > 0.5) {
      const flowerP = Math.min((p - 0.5) / 0.5, 1);
      const flowerX = sway;
      const flowerY = -stemH;

      ctx.save();
      ctx.translate(flowerX, flowerY);

      // Petals
      const petalCount = plant.petalCount;
      const petalLen = plant.petalLength * flowerP;
      const petalW = petalLen * 0.4;
      ctx.fillStyle = plant.colors.petal;
      ctx.globalAlpha = 0.6 + 0.4 * flowerP;

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 + this.time * 0.1;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(petalLen * 0.5, 0, petalLen * 0.5, petalW, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Center
      ctx.globalAlpha = 1;
      ctx.fillStyle = plant.colors.center;
      ctx.beginPath();
      ctx.arc(0, 0, 8 + flowerP * 8, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle for full bloom
      if (p > 0.95) {
        this.emitParticles(flowerX + this.canvas.width / 2, flowerY + this.canvas.height * 0.78, plant.colors.petal);
      }

      ctx.restore();
    }
  }

  drawMushroom() {
    const { ctx, plant, progress } = this;
    const p = progress;

    // Stem
    const stemH = Math.min(p * 1.5, 1) * 100;
    const stemW = 15 + p * 10;

    if (stemH > 5) {
      ctx.fillStyle = plant.colors.stem;
      ctx.beginPath();
      ctx.moveTo(-stemW / 2, 0);
      ctx.lineTo(-stemW / 3, -stemH);
      ctx.lineTo(stemW / 3, -stemH);
      ctx.lineTo(stemW / 2, 0);
      ctx.closePath();
      ctx.fill();
    }

    // Cap
    if (p > 0.3) {
      const capP = Math.min((p - 0.3) / 0.7, 1);
      const capW = 45 * capP + 20;
      const capH = 30 * capP + 10;

      ctx.save();
      ctx.translate(0, -stemH);

      // Glow for bioluminescent
      if (plant.colors.glow) {
        const glowSize = capW + 20 + Math.sin(this.time * 2) * 8;
        const glowGrad = ctx.createRadialGradient(0, -capH / 2, 5, 0, -capH / 2, glowSize);
        glowGrad.addColorStop(0, plant.colors.glow + '60');
        glowGrad.addColorStop(0.5, plant.colors.glow + '20');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(-glowSize, -capH - glowSize, glowSize * 2, glowSize * 2);
      }

      // Cap shape
      ctx.fillStyle = plant.colors.petal;
      ctx.beginPath();
      ctx.ellipse(0, 0, capW, capH * 0.4, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Spots
      if (capP > 0.5) {
        ctx.fillStyle = plant.colors.center;
        const spots = [[- capW * 0.3, -capH * 0.15, 5], [capW * 0.2, -capH * 0.2, 4], [0, -capH * 0.3, 6]];
        spots.forEach(([sx, sy, sr]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, sr * capP, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();

      // Emit particles for legendary
      if (p > 0.8 && plant.rarity === 'legendary') {
        this.emitParticles(this.canvas.width / 2, this.canvas.height * 0.78 - stemH, plant.colors.glow || plant.colors.petal);
      }
    }
  }

  drawCactus() {
    const { ctx, plant, progress } = this;
    const p = progress;
    const sway = Math.sin(this.time * 0.8) * 1;

    // Main body
    const bodyH = Math.min(p * 1.2, 1) * 140;
    const bodyW = 30 + p * 10;

    if (bodyH > 5) {
      // Round top cactus
      ctx.fillStyle = plant.colors.stem;
      ctx.beginPath();
      ctx.moveTo(-bodyW / 2, 0);
      ctx.lineTo(-bodyW / 2, -bodyH + bodyW);
      ctx.arc(0, -bodyH + bodyW, bodyW / 2, Math.PI, 0);
      ctx.lineTo(bodyW / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Vertical ribs
      ctx.strokeStyle = plant.colors.leaf;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (let i = -2; i <= 2; i++) {
        const rx = i * (bodyW / 5);
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, -bodyH + bodyW);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Arms
      if (p > 0.5) {
        const armP = Math.min((p - 0.5) / 0.3, 1);
        // Right arm
        ctx.fillStyle = plant.colors.stem;
        const armY = -bodyH * 0.5;
        ctx.beginPath();
        ctx.moveTo(bodyW / 2, armY);
        ctx.lineTo(bodyW / 2 + 25 * armP, armY);
        ctx.lineTo(bodyW / 2 + 25 * armP, armY - 30 * armP);
        ctx.lineTo(bodyW / 2 + 25 * armP - 12, armY - 30 * armP);
        ctx.arc(bodyW / 2 + 25 * armP - 6, armY - 30 * armP, 6, Math.PI, 0);
        ctx.lineTo(bodyW / 2 + 25 * armP, armY);
        ctx.lineTo(bodyW / 2, armY - 12);
        ctx.closePath();
        ctx.fill();
      }

      // Spines
      if (plant.colors.spine && p > 0.2) {
        ctx.strokeStyle = plant.colors.spine;
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const sy = -bodyH * (0.1 + (i / 12) * 0.8);
          const side = i % 2 === 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(side * bodyW / 2, sy);
          ctx.lineTo(side * (bodyW / 2 + 6), sy - 3);
          ctx.stroke();
        }
      }

      // Flower on top
      if (p > 0.75) {
        const flowerP = Math.min((p - 0.75) / 0.25, 1);
        ctx.save();
        ctx.translate(sway, -bodyH);

        ctx.fillStyle = plant.colors.petal;
        for (let i = 0; i < plant.petalCount; i++) {
          const a = (i / plant.petalCount) * Math.PI * 2;
          ctx.save();
          ctx.rotate(a);
          ctx.beginPath();
          ctx.ellipse(plant.petalLength * 0.5 * flowerP, 0, plant.petalLength * 0.5 * flowerP, 5 * flowerP, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = plant.colors.center;
        ctx.beginPath();
        ctx.arc(0, 0, 5 * flowerP, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  drawTree() {
    const { ctx, plant, progress } = this;
    const p = progress;
    const sway = Math.sin(this.time * 0.7) * 2;

    // Trunk
    const trunkH = Math.min(p * 1.2, 1) * 120;
    const trunkW = 12 + p * 6;

    if (trunkH > 3) {
      ctx.fillStyle = plant.colors.stem;
      ctx.beginPath();
      ctx.moveTo(-trunkW / 2, 0);
      ctx.lineTo(-trunkW / 3 + sway * 0.3, -trunkH);
      ctx.lineTo(trunkW / 3 + sway * 0.3, -trunkH);
      ctx.lineTo(trunkW / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Bark texture
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 5; i++) {
        const by = -(trunkH / 6) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(-trunkW / 3, by);
        ctx.lineTo(trunkW / 4, by - 5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Canopy / branches with blossoms
    if (p > 0.3) {
      const canopyP = Math.min((p - 0.3) / 0.7, 1);
      ctx.save();
      ctx.translate(sway * 0.5, -trunkH);

      // Draw layered canopy
      const layers = [
        { x: 0, y: -30, r: 40 },
        { x: -25, y: -10, r: 30 },
        { x: 25, y: -15, r: 32 },
        { x: -10, y: -45, r: 28 },
        { x: 15, y: -40, r: 25 }
      ];

      layers.forEach((l, i) => {
        const layerR = l.r * canopyP;
        ctx.fillStyle = plant.colors.leaf;
        ctx.globalAlpha = 0.7 + i * 0.06;
        ctx.beginPath();
        ctx.arc(l.x, l.y, layerR, 0, Math.PI * 2);
        ctx.fill();
      });

      // Blossoms on Cherry Blossom type
      if (plant.name === 'Cherry Blossom' && p > 0.6) {
        const blossomP = Math.min((p - 0.6) / 0.4, 1);
        ctx.globalAlpha = blossomP;
        ctx.fillStyle = plant.colors.petal;
        for (let i = 0; i < 20; i++) {
          const bx = Math.sin(i * 5.5) * 50;
          const by = Math.cos(i * 3.3) * 40 - 25;
          ctx.beginPath();
          ctx.arc(bx, by, 3 + blossomP * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Falling petals
        if (p > 0.9) {
          for (let i = 0; i < 5; i++) {
            const fx = Math.sin(this.time * 0.5 + i * 2) * 60;
            const fy = ((this.time * 20 + i * 50) % 200) - 50;
            ctx.globalAlpha = 1 - fy / 200;
            ctx.beginPath();
            ctx.ellipse(fx, fy, 4, 2, this.time + i, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  drawSucculent() {
    const { ctx, plant, progress } = this;
    const p = progress;

    // Base leaves in rosette pattern
    const leafCount = plant.petalCount;
    const maxSize = plant.petalLength * Math.min(p * 1.3, 1);

    // Glow effect
    if (plant.colors.glow && p > 0.5) {
      const glowGrad = ctx.createRadialGradient(0, -30, 5, 0, -30, 80);
      glowGrad.addColorStop(0, plant.colors.glow + '40');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(-80, -110, 160, 160);
    }

    for (let ring = 2; ring >= 0; ring--) {
      const ringP = Math.min(p * 3 - ring * 0.5, 1);
      if (ringP <= 0) continue;

      const ringSize = maxSize * (1 - ring * 0.25) * ringP;
      const ringOffset = ring * 0.3;

      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2 + ringOffset + Math.PI / 2;
        ctx.save();
        ctx.translate(0, -20 - ring * 8);
        ctx.rotate(angle);

        // Leaf shape
        const lw = ringSize * 0.45;
        const lh = ringSize;
        ctx.fillStyle = ring === 0 ? plant.colors.petal : (ring === 1 ? plant.colors.leaf : plant.colors.stem);
        ctx.globalAlpha = 0.8 + ring * 0.1;
        ctx.beginPath();
        ctx.ellipse(lh * 0.4, 0, lh * 0.5, lw, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crystal edge highlight
        if (plant.rarity === 'legendary') {
          ctx.strokeStyle = plant.colors.petal;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.time * 3 + i);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    if (p > 0.9 && plant.rarity === 'legendary') {
      this.emitParticles(this.canvas.width / 2, this.canvas.height * 0.78 - 30, plant.colors.glow);
    }
  }

  drawSpike() {
    const { ctx, plant, progress } = this;
    const p = progress;
    const sway = Math.sin(this.time * 1.2) * 2;

    // Main stem
    const stemH = Math.min(p * 1.2, 1) * 160;

    if (stemH > 3) {
      ctx.strokeStyle = plant.colors.stem;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(sway * 0.3, -stemH * 0.3, sway * 0.7, -stemH * 0.7, sway, -stemH);
      ctx.stroke();

      // Leaves
      if (p > 0.15) {
        this.drawLeaf(sway * 0.2, -stemH * 0.2, 18 * p, 0.6, plant.colors.leaf);
        this.drawLeaf(sway * 0.4, -stemH * 0.4, 16 * p, -0.5, plant.colors.leaf);
      }
    }

    // Flower spike
    if (p > 0.4) {
      const spikeP = Math.min((p - 0.4) / 0.6, 1);
      const spikeH = stemH * 0.4;
      const spikeStart = -stemH + spikeH;

      ctx.fillStyle = plant.colors.petal;
      for (let i = 0; i < plant.petalCount * spikeP; i++) {
        const sy = spikeStart - (i / plant.petalCount) * spikeH;
        const sx = sway + Math.sin(i * 0.8) * 3;
        const size = 3 + (1 - i / plant.petalCount) * 4;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawCarnivorous() {
    const { ctx, plant, progress } = this;
    const p = progress;

    // Multiple stems with traps
    const stems = [
      { angle: -0.3, height: 130 },
      { angle: 0.2, height: 110 },
      { angle: -0.1, height: 90 }
    ];

    stems.forEach((stem, idx) => {
      if (p < idx * 0.15) return;
      const stemP = Math.min((p - idx * 0.15) / 0.6, 1);
      const h = stem.height * stemP;

      ctx.save();

      // Stem
      ctx.strokeStyle = plant.colors.stem;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const endX = Math.sin(stem.angle) * h;
      const endY = -h;
      ctx.bezierCurveTo(endX * 0.3, endY * 0.3, endX * 0.7, endY * 0.7, endX, endY);
      ctx.stroke();

      // Trap head
      if (stemP > 0.6) {
        const trapP = Math.min((stemP - 0.6) / 0.4, 1);
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(stem.angle);

        // Jaw animation
        const jawAngle = 0.2 + Math.sin(this.time * 2 + idx) * 0.1;

        // Upper jaw
        ctx.fillStyle = plant.colors.petal;
        ctx.beginPath();
        ctx.arc(0, 0, 18 * trapP, -Math.PI + jawAngle, 0 - jawAngle);
        ctx.closePath();
        ctx.fill();

        // Lower jaw
        ctx.fillStyle = plant.colors.center;
        ctx.beginPath();
        ctx.arc(0, 0, 18 * trapP, jawAngle, Math.PI - jawAngle);
        ctx.closePath();
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#fff';
        const teethCount = 5;
        for (let t = 0; t < teethCount; t++) {
          const ta = -Math.PI + jawAngle + (t / teethCount) * (Math.PI - jawAngle * 2);
          const tx = Math.cos(ta) * 16 * trapP;
          const ty = Math.sin(ta) * 16 * trapP;
          ctx.beginPath();
          ctx.arc(tx, ty, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
    });
  }

  drawLeaf(x, y, size, dir, color) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size * 0.5, -size * 0.3, size, -size * 0.1, size, 0);
    ctx.bezierCurveTo(size, size * 0.1, size * 0.5, size * 0.3, 0, 0);
    ctx.fill();

    // Leaf vein
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 0.8, 0);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  emitParticles(x, y, color) {
    if (Math.random() > 0.15) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1,
      life: 1,
      color,
      size: 1 + Math.random() * 3
    });
  }

  updateAndDrawParticles(w, h) {
    const { ctx } = this;
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      if (p.life <= 0) return false;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });
    ctx.globalAlpha = 1;
  }

  drawRarityGlow(cx, groundY) {
    const { ctx } = this;
    const pulse = 0.3 + 0.2 * Math.sin(this.time * 2);
    const glowGrad = ctx.createRadialGradient(cx, groundY - 80, 20, cx, groundY - 80, 120);

    const glowColor = this.plant.rarity === 'legendary' ? '241, 196, 15' : '149, 117, 205';
    glowGrad.addColorStop(0, `rgba(${glowColor}, ${pulse * 0.3})`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(cx - 120, groundY - 200, 240, 240);
  }

  // Draw a small plant icon for the garden view
  static drawMiniPlant(ctx, plant, x, y, size = 40) {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 40;
    ctx.scale(s, s);

    // Simple representation based on style
    switch (plant.type?.style || plant.style) {
      case 'mushroom':
        // Stem
        ctx.fillStyle = plant.type?.colors?.stem || '#b8d4e3';
        ctx.fillRect(-5, -5, 10, 20);
        // Cap
        ctx.fillStyle = plant.type?.colors?.petal || '#00e5ff';
        ctx.beginPath();
        ctx.ellipse(0, -8, 18, 12, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        break;

      case 'cactus':
        ctx.fillStyle = plant.type?.colors?.stem || '#2e7d32';
        ctx.beginPath();
        ctx.moveTo(-8, 15);
        ctx.lineTo(-8, -10);
        ctx.arc(0, -10, 8, Math.PI, 0);
        ctx.lineTo(8, 15);
        ctx.closePath();
        ctx.fill();
        // Flower
        ctx.fillStyle = plant.type?.colors?.petal || '#ff6b6b';
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'tree':
        // Trunk
        ctx.fillStyle = plant.type?.colors?.stem || '#5d4037';
        ctx.fillRect(-3, -5, 6, 20);
        // Canopy
        ctx.fillStyle = plant.type?.colors?.leaf || '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, -15, 16, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        // Generic flower
        // Stem
        ctx.strokeStyle = plant.type?.colors?.stem || '#2d8a4e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, -10);
        ctx.stroke();
        // Petals
        ctx.fillStyle = plant.type?.colors?.petal || '#ffd700';
        const pc = plant.type?.petalCount || 6;
        for (let i = 0; i < pc; i++) {
          ctx.save();
          ctx.translate(0, -15);
          ctx.rotate((i / pc) * Math.PI * 2);
          ctx.beginPath();
          ctx.ellipse(8, 0, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // Center
        ctx.fillStyle = plant.type?.colors?.center || '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -15, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}
