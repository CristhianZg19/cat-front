import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { registerCatPet } from '../services/catApi';

export const PETS_REQUIRED = 30;
const MAX_HAPPINESS = 100;
const STORAGE_KEY = 'sleepy-cat-state-v1';
const BACKEND_THROTTLE_MS = 500;

const ACHIEVEMENTS = [
  { id: 'first-wake', title: '🏆 Primer despertar' },
  { id: 'fifty-pets', title: '🏆 50 caricias' },
  { id: 'hundred-pets', title: '🏆 100 caricias' },
  { id: 'best-friend', title: '🏆 Mejor amigo del gato' },
];

let pendingBackendPets = 0;
let backendFlushTimer = null;
let lastBackendFlushAt = 0;
let isBackendFlushRunning = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const loadState = () => {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
};

const saveState = (state) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const getAchievement = (id) => ACHIEVEMENTS.find((achievement) => achievement.id === id);

export const useCatStore = defineStore('cat', () => {
  const savedState = loadState();

  const happiness = ref(clamp(Number(savedState.happiness) || 0, 0, MAX_HAPPINESS));
  const totalPets = ref(Math.max(0, Number(savedState.totalPets) || 0));
  const catState = ref(
    savedState.catState === 'awake' || happiness.value >= PETS_REQUIRED ? 'awake' : 'sleeping',
  );
  const unlockedAchievements = ref(
    Array.isArray(savedState.unlockedAchievements) ? savedState.unlockedAchievements : [],
  );

  const isAwake = computed(() => catState.value === 'awake');
  const hasInteracted = computed(() => totalPets.value > 0);
  const progressToWake = computed(() => clamp((happiness.value / PETS_REQUIRED) * 100, 0, 100));
  const happinessPercent = computed(() => clamp(happiness.value, 0, MAX_HAPPINESS));
  const remainingPetsToWake = computed(() => Math.max(PETS_REQUIRED - happiness.value, 0));
  const mood = computed(() => {
    if (catState.value === 'sleeping' || happiness.value < PETS_REQUIRED) {
      return 'Dormido';
    }

    if (happiness.value < 60) {
      return 'Feliz';
    }

    return 'Muy feliz';
  });

  const unlockAchievement = (id) => {
    if (unlockedAchievements.value.includes(id)) {
      return null;
    }

    const achievement = getAchievement(id);

    if (!achievement) {
      return null;
    }

    unlockedAchievements.value = [...unlockedAchievements.value, id];
    return achievement;
  };

  const flushBackendPets = async () => {
    if (isBackendFlushRunning || pendingBackendPets <= 0) {
      return;
    }

    pendingBackendPets = 0;
    isBackendFlushRunning = true;
    lastBackendFlushAt = Date.now();

    try {
      await registerCatPet();
    } catch {
      // The cat should keep playing even if the network or database is unavailable.
    } finally {
      isBackendFlushRunning = false;

      if (pendingBackendPets > 0) {
        scheduleBackendFlush();
      }
    }
  };

  const scheduleBackendFlush = () => {
    if (backendFlushTimer) {
      return;
    }

    const delay = Math.max(0, BACKEND_THROTTLE_MS - (Date.now() - lastBackendFlushAt));

    backendFlushTimer = setTimeout(() => {
      backendFlushTimer = null;
      flushBackendPets();
    }, delay);
  };

  const queueBackendPet = () => {
    pendingBackendPets += 1;
    scheduleBackendFlush();
  };

  const registerPetInteraction = () => {
    const events = [];

    totalPets.value += 1;
    happiness.value = clamp(happiness.value + 1, 0, MAX_HAPPINESS);
    queueBackendPet();

    if (catState.value === 'sleeping' && happiness.value >= PETS_REQUIRED) {
      catState.value = 'awake';
      events.push({ type: 'wake', message: '🐱 Miau... me despertaste' });

      const achievement = unlockAchievement('first-wake');
      if (achievement) {
        events.push({ type: 'achievement', achievement });
      }
    }

    if (totalPets.value >= 50) {
      const achievement = unlockAchievement('fifty-pets');
      if (achievement) {
        events.push({ type: 'achievement', achievement });
      }
    }

    if (totalPets.value >= 100) {
      const achievement = unlockAchievement('hundred-pets');
      if (achievement) {
        events.push({ type: 'achievement', achievement });
      }
    }

    if (happiness.value >= MAX_HAPPINESS) {
      const achievement = unlockAchievement('best-friend');
      if (achievement) {
        events.push({ type: 'adopted', message: '🐱 Te he adoptado como humano' });
        events.push({ type: 'achievement', achievement });
      }
    }

    return events;
  };

  watch(
    [happiness, totalPets, catState, unlockedAchievements],
    () => {
      saveState({
        happiness: happiness.value,
        totalPets: totalPets.value,
        catState: catState.value,
        unlockedAchievements: unlockedAchievements.value,
      });
    },
    { deep: true },
  );

  return {
    PETS_REQUIRED,
    happiness,
    totalPets,
    catState,
    unlockedAchievements,
    isAwake,
    hasInteracted,
    progressToWake,
    happinessPercent,
    remainingPetsToWake,
    mood,
    registerPetInteraction,
  };
});
