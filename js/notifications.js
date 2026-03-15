/* ============================================================
   Notifications — Browser Notification API Integration
   ============================================================ */

export class NotificationManager {
  constructor(store) {
    this.store = store;
    this.hydrationInterval = null;
  }

  init() {
    document.getElementById('btn-enable-notif')?.addEventListener('click', () => {
      this.requestPermission();
    });

    // Start hydration reminders if enabled
    if (this.store.state.notifications.hydrate) {
      this.startHydrationReminders();
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      this.showToast('⚠️ Browser notifications not supported');
      return false;
    }

    const result = await Notification.requestPermission();
    if (result === 'granted') {
      this.showToast('🔔 Notifications enabled!');
      this.send('Welcome! 🌱', 'Notifications are now active. Happy fasting!');
      return true;
    }
    this.showToast('⚠️ Notification permission denied');
    return false;
  }

  send(title, body, icon = '🌱') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
        badge: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌱</text></svg>`,
        silent: false
      });
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }

  notifyFastStart() {
    if (!this.store.state.notifications.fastStart) return;
    this.send('Fast Started! 🌰', 'Your seed has been planted. Time to grow!');
  }

  notifyFastComplete(plantName) {
    if (!this.store.state.notifications.fastComplete) return;
    this.send('Fast Complete! 🌺', `Your ${plantName} is fully grown! Check your garden.`, '🌺');
  }

  notifyMilestone(milestone) {
    this.send('Milestone Reached! 🎯', milestone, '🎯');
  }

  startHydrationReminders() {
    this.stopHydrationReminders();
    // Remind every 90 minutes
    this.hydrationInterval = setInterval(() => {
      if (this.store.state.notifications.hydrate) {
        this.send('Hydration Reminder 💧', 'Time to drink some water! Your garden needs it too.', '💧');
      }
    }, 90 * 60 * 1000);
  }

  stopHydrationReminders() {
    if (this.hydrationInterval) {
      clearInterval(this.hydrationInterval);
      this.hydrationInterval = null;
    }
  }

  showToast(message) {
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
}
