/* ============================================================
   Social — Garden Visits & Fasting Circles (Mock UI Logic)
   ============================================================ */

export class SocialManager {
  constructor(store) {
    this.store = store;
  }

  init() {
    this.updateProfile();
    this.bindEvents();
  }

  updateProfile() {
    const profile = this.store.state.profile;
    const fasts = this.store.state.fasts.filter(f => f.completed);
    const plants = this.store.state.garden.plants;

    const nameInput = document.getElementById('profile-name');
    if (nameInput) nameInput.value = profile.name;

    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.textContent = profile.avatar;

    const plantsEl = document.getElementById('profile-plants');
    if (plantsEl) plantsEl.textContent = plants.length;

    const fastsEl = document.getElementById('profile-fasts');
    if (fastsEl) fastsEl.textContent = fasts.length;

    const streakEl = document.getElementById('profile-streak-display');
    if (streakEl) streakEl.textContent = this.store.state.streakCount;
  }

  bindEvents() {
    // Profile name change
    const nameInput = document.getElementById('profile-name');
    nameInput?.addEventListener('change', () => {
      this.store.state.profile.name = nameInput.value.trim() || 'Amador';
      this.store.save();
    });

    // Create circle button (mock)
    document.getElementById('btn-create-circle')?.addEventListener('click', () => {
      showToast('🔗 Fasting Circles coming soon with online features!');
    });

    // Visit garden buttons (mock)
    document.querySelectorAll('.friend-card .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.closest('.friend-card')?.querySelector('.friend-name')?.textContent;
        showToast(`🏡 Visiting ${name}'s garden... (coming soon!)`);
      });
    });

    // Send water/fertilizer (mock)
    document.querySelectorAll('.circle-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.textContent.includes('Water') ? '💧 Water' : '🪴 Fertilizer';
        showToast(`${action} sent to your circle! They'll love it 🌟`);
      });
    });
  }
}

// Toast helper (will be defined in main.js, but exported here for convenience)
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

export { showToast };
