/* ============================================================
   Habits — Vice/Habit Toggles with Add/Remove
   ============================================================ */

export class HabitsManager {
  constructor(store) {
    this.store = store;
  }

  init() {
    this.loadHabitStates();
    this.bindEvents();
  }

  bindEvents() {
    // Habit toggle checkboxes
    document.querySelectorAll('#habit-toggles input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => this.saveHabitStates());
    });

    // Add custom habit
    document.getElementById('btn-add-habit')?.addEventListener('click', () => {
      const input = document.getElementById('custom-habit-input');
      const label = input.value.trim();
      if (label) {
        this.addCustomHabit(label);
        input.value = '';
      }
    });

    // Bind remove buttons for default habits
    document.querySelectorAll('.habit-remove-btn[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeHabit(btn.dataset.remove);
      });
    });
  }

  loadHabitStates() {
    const habits = this.store.state.habits.active;

    // Check which default habits have been removed
    const removed = this.store.state.habits.removed || [];
    removed.forEach(id => {
      const row = document.querySelector(`.habit-toggle-row[data-habit-id="${id}"]`);
      if (row) row.remove();
    });

    habits.forEach(h => {
      const cb = document.querySelector(`input[data-habit="${h.id}"]`);
      if (cb) cb.checked = h.enabled;
    });

    // Render custom habits
    const container = document.getElementById('habit-toggles');
    if (this.store.state.habits.custom) {
      this.store.state.habits.custom.forEach(h => {
        this.renderCustomHabit(container, h);
      });
    }
  }

  saveHabitStates() {
    const habits = [];
    document.querySelectorAll('#habit-toggles input[type="checkbox"]').forEach(cb => {
      habits.push({
        id: cb.dataset.habit,
        enabled: cb.checked
      });
    });
    this.store.updateHabits(habits);
  }

  removeHabit(habitId) {
    // Remove from DOM
    const row = document.querySelector(`.habit-toggle-row[data-habit-id="${habitId}"]`);
    if (row) {
      row.style.transition = 'all 0.3s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(-20px)';
      setTimeout(() => row.remove(), 300);
    }

    // Save removal to store
    if (!this.store.state.habits.removed) {
      this.store.state.habits.removed = [];
    }
    if (!this.store.state.habits.removed.includes(habitId)) {
      this.store.state.habits.removed.push(habitId);
    }

    // Also remove from custom habits if it's a custom one
    if (this.store.state.habits.custom) {
      this.store.state.habits.custom = this.store.state.habits.custom.filter(h => h.id !== habitId);
    }

    this.store.save();
    this.saveHabitStates();
  }

  addCustomHabit(label) {
    const habit = this.store.addCustomHabit(label);
    const container = document.getElementById('habit-toggles');
    this.renderCustomHabit(container, habit);
  }

  renderCustomHabit(container, habit) {
    // Check if already rendered
    if (document.querySelector(`.habit-toggle-row[data-habit-id="${habit.id}"]`)) return;

    const row = document.createElement('div');
    row.className = 'habit-toggle-row';
    row.dataset.habitId = habit.id;
    row.innerHTML = `
      <label class="habit-toggle">
        <input type="checkbox" data-habit="${habit.id}" ${habit.enabled ? 'checked' : ''} />
        <span class="toggle-switch"></span>
        <span class="habit-label">${habit.emoji || '🎯'} ${habit.label}</span>
      </label>
      <button class="habit-remove-btn" data-remove="${habit.id}" title="Remove habit">✕</button>
    `;
    row.querySelector('input').addEventListener('change', () => this.saveHabitStates());
    row.querySelector('.habit-remove-btn').addEventListener('click', () => this.removeHabit(habit.id));
    container.appendChild(row);
  }

  getActiveHabits() {
    const active = [];
    document.querySelectorAll('#habit-toggles input[type="checkbox"]:checked').forEach(cb => {
      const label = cb.closest('.habit-toggle')?.querySelector('.habit-label')?.textContent;
      active.push({ id: cb.dataset.habit, label });
    });
    return active;
  }
}
