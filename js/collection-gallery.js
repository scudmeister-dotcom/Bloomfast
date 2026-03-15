import { PLANT_SPECIES } from './plant.js';

export class CollectionGallery {
  constructor(store) {
    this.store = store;
    this.container = document.getElementById('botanical-grid');
    this.progressText = document.getElementById('collection-progress-text');
    this.progressBar = document.getElementById('collection-progress-bar');
    this.categoryFilter = 'all';
    this.rarityFilter = 'all';
    
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
  }

  addStyleSwitcher() {
    const controls = document.querySelector('.collection-controls');
    if (!controls) return;

    const switcher = document.createElement('div');
    switcher.className = 'style-switcher-wrap dev-controls';
    switcher.style.display = 'flex';
    switcher.style.gap = '8px';
    
    switcher.innerHTML = `
      <select id="card-theme-select" class="form-select" style="max-width: 150px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 4px 8px;">
        <option value="parchment" ${this.theme === 'parchment' ? 'selected' : ''}>Parchment Theme</option>
        <option value="frost" ${this.theme === 'frost' ? 'selected' : ''}>Frost Theme</option>
        <option value="moss" ${this.theme === 'moss' ? 'selected' : ''}>Moss Theme</option>
      </select>
      <select id="card-layout-select" class="form-select" style="max-width: 150px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 4px 8px;">
        <option value="scholar" ${this.layout === 'scholar' ? 'selected' : ''}>Scholar Layout</option>
        <option value="minimalist" ${this.layout === 'minimalist' ? 'selected' : ''}>Minimalist Layout</option>
        <option value="artist" ${this.layout === 'artist' ? 'selected' : ''}>Artist Layout</option>
      </select>
    `;

    controls.appendChild(switcher);

    document.getElementById('card-theme-select').addEventListener('change', (e) => {
      this.theme = e.target.value;
      this.render();
    });
    document.getElementById('card-layout-select').addEventListener('change', (e) => {
      this.layout = e.target.value;
      this.render();
    });
  }

  getEarnedPlants() {
    // 1. Get from fasts
    const fromFasts = this.store.state.fasts
      .filter(f => f.completed && f.plantType)
      .map(f => {
        const matchedId = f.plantType.id || PLANT_SPECIES.find(p => p.name === f.plantType.name)?.id || 'sunflower_classic';
        return { id: matchedId, fastInfo: f };
      });

    // 2. Get from garden (includes starter plants)
    const fromGarden = this.store.state.garden.plants.map(p => {
      return { id: p.type.id, fastInfo: { endTime: p.completedAt, isStarter: p.isStarter } };
    });

    // Merge and deduplicate by id is handled by the caller (render)
    return [...fromFasts, ...fromGarden];
  }

  render() {
    if (!this.container) return;

    const earned = this.getEarnedPlants();
    const earnedMap = {};
    earned.forEach(e => {
      if (!earnedMap[e.id]) {
        earnedMap[e.id] = { count: 0, firstEarned: e.fastInfo };
      }
      earnedMap[e.id].count++;
    });

    const totalDiscovered = Object.keys(earnedMap).length;
    if (this.progressText) this.progressText.textContent = `${totalDiscovered} / ${PLANT_SPECIES.length} Discovered`;
    if (this.progressBar) this.progressBar.style.width = `${(totalDiscovered / PLANT_SPECIES.length) * 100}%`;

    let filtered = PLANT_SPECIES.filter(p => {
      if (this.categoryFilter !== 'all' && p.category !== this.categoryFilter) return false;
      if (this.rarityFilter !== 'all' && p.rarity !== this.rarityFilter) return false;
      return true;
    });

    this.container.innerHTML = '';

    filtered.forEach(plant => {
      const isEarned = !!earnedMap[plant.id];
      const stats = earnedMap[plant.id];

      const el = document.createElement('div');
      el.className = `botanical-card-container card-bg-${this.theme} layout-${this.layout} ${isEarned ? '' : 'card-undiscovered'}`;

      let innerHTML = '';

      if (isEarned) {
        const dateStr = new Date(stats.firstEarned.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const hours = Math.floor((stats.firstEarned.actualMs || 0) / 3600000);
        const mins = Math.floor(((stats.firstEarned.actualMs || 0) % 3600000) / 60000);
        const durationStr = `${hours}h ${mins}m`;
        const blobColor = plant.colors.petal || plant.colors.leaf;

        // Front face is mostly constant
        const frontHTML = `
          <div class="card-face card-front">
            <div class="watercolor-blob" style="background-color: ${blobColor}"></div>
            <div class="card-art-wrap">
              <img src="${plant.image}" class="botanical-art" style="width: 140px; height: 140px; object-fit: contain;">
            </div>
            <div class="card-info">
              <div class="card-name">${plant.name}</div>
              <div class="card-rarity ${plant.rarity}">${plant.rarity}</div>
            </div>
            <div class="card-count-badge">x${stats.count}</div>
          </div>
        `;

        // Back face changes by layout
        let backContent = '';
        switch (this.layout) {
          case 'minimalist':
            backContent = `
              <div class="card-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 80%;">
                <div class="stat-box" style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 0.7rem; opacity: 0.6;">Total</div>
                  <div style="font-weight: 800;">${stats.count}</div>
                </div>
                <div class="stat-box" style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 0.7rem; opacity: 0.6;">Yield</div>
                  <div style="font-weight: 800;">${durationStr}</div>
                </div>
              </div>
              <div style="margin-top: 20px; font-size: 0.8rem; font-weight: 700; opacity: 0.5;">${plant.category}</div>
            `;
            break;
          case 'artist':
            backContent = `
              <div class="card-back-art" style="background-image: url('${plant.image}'); filter: blur(5px) opacity(0.2); position: absolute; top:0; left:0; width:100%; height:100%; background-size: cover;"></div>
              <div class="card-back-content" style="position: relative; z-index: 1; padding: 20px; width: 100%; box-sizing: border-box;">
                <h4 style="margin:0; font-family: 'Outfit'; font-weight: 800; color:${blobColor}">${plant.name}</h4>
                <p style="font-size: 0.8rem; font-style: italic; line-height: 1.4; margin-top: 15px;">${plant.funFact}</p>
                <div style="font-size: 0.65rem; margin-top: 20px; opacity: 0.6;">First cataloged: ${dateStr}</div>
              </div>
            `;
            break;
          case 'scholar':
          default:
            backContent = `
              <div style="text-align:center; font-weight:bold; margin-bottom:12px; font-size:1rem; color:${blobColor}">${plant.name}</div>
              <div class="card-date" style="font-size: 0.8rem; width: 100%; padding: 0 10px; box-sizing: border-box;"><span>First Grown:</span> <span style="font-weight:bold;">${dateStr}</span></div>
              <div class="card-plan" style="font-size: 0.8rem; width: 100%; padding: 0 10px; box-sizing: border-box;"><span>Fast Plan:</span> <span style="font-weight:bold;">${stats.firstEarned.planName || 'Custom'}</span></div>
              <div class="card-plan" style="font-size: 0.8rem; width: 100%; padding: 0 10px; box-sizing: border-box; margin-bottom: 12px;"><span>Duration:</span> <span style="font-weight:bold;">${durationStr}</span></div>
              <div class="card-fact-title" style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.6; margin-top: 10px;">Botanical Notes</div>
              <div class="card-fact" style="font-size: 0.85rem; padding: 10px; line-height: 1.4;">${plant.funFact}</div>
            `;
            break;
        }

        innerHTML = `
          <div class="botanical-card rarity-${plant.rarity}">
            ${frontHTML}
            <div class="card-face card-back" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden;">
              ${backContent}
            </div>
          </div>
        `;
      } else {
        innerHTML = `
          <div class="botanical-card card-undiscovered rarity-common">
            <div class="card-face card-front" style="justify-content:center; opacity:0.6;">
              <div class="watercolor-blob" style="background-color: #ffffff; opacity: 0.05;"></div>
              <div class="card-art-wrap">
                <img src="${plant.image}" class="card-art undiscovered-art" style="width: 120px; height: 120px; object-fit: contain; filter: brightness(0) opacity(0.2);">
              </div>
              <div class="card-name" style="font-size:0.9rem;">Undiscovered</div>
              <div class="card-rarity">???</div>
            </div>
          </div>
        `;
      }

      el.innerHTML = innerHTML;

      if (isEarned) {
        const cardInner = el.querySelector('.botanical-card');
        el.addEventListener('click', () => {
          cardInner.classList.toggle('flipped');
        });
      }

      this.container.appendChild(el);
    });
  }
}
