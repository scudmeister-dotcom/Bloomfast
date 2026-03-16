import { PLANT_SPECIES } from './plant.js';

export class CollectionGallery {
  constructor(store) {
    this.store = store;
    this.container = document.getElementById('botanical-grid');
    this.progressText = document.getElementById('collection-progress-text');
    this.progressBar = document.getElementById('collection-progress-bar');
    this.categoryFilter = 'all';
    this.rarityFilter = 'all';
    this.acquiredOnly = false;
    
    // Aesthetic State
    this.theme = 'parchment'; // parchment, frost, moss
    this.layout = 'scholar';   // scholar, minimalist, artist
    
    this.init();
  }

  init() {
    this.bindFilters();
    this.addStyleSwitcher();
    this.render();
  }

  bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.categoryFilter = e.target.dataset.category;
        this.render();
      });
    });

    const raritySelect = document.getElementById('rarity-filter');
    if (raritySelect) {
      raritySelect.addEventListener('change', (e) => {
        this.rarityFilter = e.target.value;
        this.render();
      });
    }

    const acquiredToggle = document.getElementById('earned-only-filter');
    if (acquiredToggle) {
      acquiredToggle.addEventListener('change', (e) => {
        this.acquiredOnly = e.target.checked;
        this.render();
      });
    }
  }

  addStyleSwitcher() {
    // Style switching removed in favor of minimalist polaroid design.
  }

  getEarnedPlants() {
    // Build map: fasts data has priority (it has planName, actualMs)
    // Garden entries are fallback (starter plants only have completedAt)
    const earnedMap = {};

    // 1. First, add garden entries (these may lack detailed fast info)
    this.store.state.garden.plants.forEach(p => {
      if (!p.type?.id) return;
      earnedMap[p.type.id] = {
        firstEarned: {
          endTime: p.completedAt,
          planName: p.planName || null,
          actualMs: p.actualMs || 0,
          isStarter: p.isStarter
        }
      };
    });

    // 2. Then overwrite with fasts data (richer info — always preferred)
    this.store.state.fasts
      .filter(f => f.completed && f.plantType)
      .forEach(f => {
        const id = f.plantType.id || PLANT_SPECIES.find(p => p.name === f.plantType.name)?.id;
        if (!id) return;
        earnedMap[id] = {
          firstEarned: {
            endTime: f.endTime,
            planName: f.planName,
            actualMs: f.actualMs || (f.endTime - f.startTime) || 0,
            isStarter: false
          }
        };
      });

    return earnedMap;
  }

  render() {
    if (!this.container) return;

    const earnedMap = this.getEarnedPlants();

    const totalDiscovered = Object.keys(earnedMap).length;
    if (this.progressText) this.progressText.textContent = `${totalDiscovered} / ${PLANT_SPECIES.length} Discovered`;
    if (this.progressBar) this.progressBar.style.width = `${(totalDiscovered / PLANT_SPECIES.length) * 100}%`;

    let filtered = PLANT_SPECIES.filter(p => {
      if (this.categoryFilter !== 'all' && p.category !== this.categoryFilter) return false;
      if (this.rarityFilter !== 'all' && p.rarity !== this.rarityFilter) return false;
      if (this.acquiredOnly && !earnedMap[p.id]) return false;
      return true;
    });

    const rarityColor = {
      common: '#7c8a7c',
      uncommon: '#4c6a4c',
      epic: '#8e44ad',
      legendary: '#d4af37'
    };
    const rarityBg = {
      common: '#f8f9f8',
      uncommon: '#f0f5f0',
      epic: '#f5f0f8',
      legendary: '#faf8f0'
    };

    this.container.innerHTML = '';

    // Assign sequential specimen numbers within the filtered set
    const speciesIndex = {};
    let specNum = 1;
    PLANT_SPECIES.forEach(p => { speciesIndex[p.id] = specNum++; });

    filtered.forEach(plant => {
      const isEarned = !!earnedMap[plant.id];
      const stats = earnedMap[plant.id];
      const stampNo = String(speciesIndex[plant.id] || 0).padStart(3, '0');

      const el = document.createElement('div');
      el.className = 'botanical-card-container';

      if (isEarned) {
        const dateStr = new Date(stats.firstEarned.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const hours = Math.floor((stats.firstEarned.actualMs || 0) / 3600000);
        const mins = Math.floor(((stats.firstEarned.actualMs || 0) % 3600000) / 60000);
        const durationStr = `${hours}h ${mins}m`;

        // Legend-only extras
        const isLegendary = plant.rarity === 'legendary';
        const sparkleHtml = isLegendary ? `
          <div class="legend-sparkle-field">
            <div class="legend-sparkle"></div>
            <div class="legend-sparkle"></div>
            <div class="legend-sparkle"></div>
            <div class="legend-sparkle"></div>
            <div class="legend-sparkle"></div>
            <div class="legend-sparkle"></div>
          </div>` : '';
        const borderWrapOpen = isLegendary ? `<div class="legendary-border-wrap"><div class="border-inner"></div></div>` : '';

        el.innerHTML = `
          <div class="botanical-card style-specimen rarity-${plant.rarity}">
            ${borderWrapOpen}
            <div class="card-face card-front">
              ${sparkleHtml}
              <div class="specimen-stamp-no">No. ${stampNo}</div>
              <div class="specimen-header">Specimen Card</div>
              <div class="img-wrap">
                <img src="${plant.image}" class="card-art" alt="${plant.name}">
              </div>
              <div class="info">
                <div class="name">${plant.name}</div>
                <div class="rarity">${plant.rarity}</div>
              </div>
            </div>
            <div class="card-face card-back" style="border-color:${rarityColor[plant.rarity]}">
              <div class="specimen-stamp-no">No. ${stampNo}</div>
              <div class="specimen-header">Specimen Record</div>
              <div class="name">${plant.name}</div>
              <div class="specimen-stats">
                <div class="card-stat">Discovered: <strong>${dateStr}</strong></div>
                <div class="card-stat">Fast Plan: <strong>${stats.firstEarned.planName || 'Starter'}</strong></div>
                <div class="card-stat">Duration: <strong>${durationStr}</strong></div>
              </div>
              <div class="card-fact">${plant.funFact}</div>
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="botanical-card style-specimen card-undiscovered rarity-common">
            <div class="card-face card-front">
              <div class="specimen-stamp-no">No. ${stampNo}</div>
              <div class="specimen-header">Specimen Card</div>
              <div class="img-wrap">
                <img src="${plant.image}" class="card-art undiscovered-art" alt="?">
              </div>
              <div class="info">
                <div class="name">Undiscovered</div>
                <div class="rarity">???</div>
              </div>
            </div>
          </div>
        `;
      }

      const cardInner = el.querySelector('.botanical-card');
      if (isEarned && cardInner) {
        el.addEventListener('click', () => {
          cardInner.classList.toggle('flipped');
        });
      }

      this.container.appendChild(el);
    });
  }
}
