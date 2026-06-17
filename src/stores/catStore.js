import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { registerLunaPet, registerLunaUser } from '../services/catApi';
import {
  getCurrentAffinityLevel,
  getNextAffinityLevel,
  getUnlockedLevelNumbers,
  getUnlockedMemoryIds,
  LUNA_MEMORIES,
  PETS_REQUIRED_TO_WAKE,
} from '../domain/lunaAffinity';

const STORAGE_KEY = 'sleepy-cat-luna-state-v2';
const LEGACY_STORAGE_KEY = 'sleepy-cat-state-v1';
const BACKEND_THROTTLE_MS = 500;

let pendingBackendAffinity = 0;
let backendFlushTimer = null;
let lastBackendFlushAt = 0;
let isBackendFlushRunning = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const generateDeviceId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `luna-${crypto.randomUUID()}`;
  }

  return `luna-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readStorage = (key) => {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
};

const loadState = () => {
  const state = readStorage(STORAGE_KEY);

  if (Object.keys(state).length > 0) {
    return state;
  }

  const legacyState = readStorage(LEGACY_STORAGE_KEY);

  if (Object.keys(legacyState).length === 0) {
    return {};
  }

  return {
    affinityPoints: Math.max(
      Number(legacyState.totalPets) || 0,
      Number(legacyState.happiness) || 0,
    ),
    catState: legacyState.catState,
  };
};

const saveState = (state) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const normalizeServerProfile = (profile) => {
  if (!profile) {
    return null;
  }

  return {
    userName: profile.userName,
    deviceId: profile.deviceId,
    affinityPoints: Number(profile.affinityPoints) || 0,
    currentLevel: Number(profile.currentLevel) || 1,
    unlockedMemories: Array.isArray(profile.unlockedMemories) ? profile.unlockedMemories : [],
    unlockedLevels: Array.isArray(profile.unlockedLevels) ? profile.unlockedLevels : [],
  };
};

export const useCatStore = defineStore('cat', () => {
  const savedState = loadState();

  const userName = ref(String(savedState.userName ?? '').trim());
  const deviceId = ref(savedState.deviceId || generateDeviceId());
  const affinityPoints = ref(Math.max(0, Number(savedState.affinityPoints) || 0));
  const catState = ref(
    savedState.catState === 'awake' || affinityPoints.value >= PETS_REQUIRED_TO_WAKE ? 'awake' : 'sleeping',
  );
  const unlockedLevels = ref(
    Array.isArray(savedState.unlockedLevels)
      ? savedState.unlockedLevels
      : getUnlockedLevelNumbers(affinityPoints.value),
  );
  const unlockedMemoryIds = ref(
    Array.isArray(savedState.unlockedMemoryIds)
      ? savedState.unlockedMemoryIds
      : getUnlockedMemoryIds(getCurrentAffinityLevel(affinityPoints.value).level),
  );

  const isRegistered = computed(() => Boolean(userName.value && deviceId.value));
  const isAwake = computed(() => catState.value === 'awake');
  const hasInteracted = computed(() => affinityPoints.value > 0);
  const currentLevel = computed(() => getCurrentAffinityLevel(affinityPoints.value));
  const currentLevelNumber = computed(() => currentLevel.value.level);
  const currentLevelTitle = computed(() => currentLevel.value.title);
  const nextLevel = computed(() => getNextAffinityLevel(currentLevelNumber.value));
  const progressToNextLevel = computed(() => {
    if (!nextLevel.value) {
      return 100;
    }

    const previousRequired = currentLevel.value.required;
    const nextRequired = nextLevel.value.required;
    const progress = ((affinityPoints.value - previousRequired) / (nextRequired - previousRequired)) * 100;

    return clamp(Math.round(progress), 0, 100);
  });
  const remainingAffinityToWake = computed(() => Math.max(PETS_REQUIRED_TO_WAKE - affinityPoints.value, 0));
  const unlockedMemories = computed(() =>
    LUNA_MEMORIES.filter((memory) => unlockedMemoryIds.value.includes(memory.id)),
  );

  const persist = () => {
    saveState({
      userName: userName.value,
      deviceId: deviceId.value,
      affinityPoints: affinityPoints.value,
      catState: catState.value,
      unlockedLevels: unlockedLevels.value,
      unlockedMemoryIds: unlockedMemoryIds.value,
    });
  };

  const applyLocalUnlocks = () => {
    const nextUnlockedLevels = getUnlockedLevelNumbers(affinityPoints.value);
    const nextUnlockedMemories = getUnlockedMemoryIds(currentLevelNumber.value);

    unlockedLevels.value = Array.from(new Set([...unlockedLevels.value, ...nextUnlockedLevels]));
    unlockedMemoryIds.value = Array.from(new Set([...unlockedMemoryIds.value, ...nextUnlockedMemories]));
  };

  const applyServerProfile = (profile) => {
    const normalizedProfile = normalizeServerProfile(profile);

    if (!normalizedProfile) {
      return;
    }

    if (normalizedProfile.userName) {
      userName.value = normalizedProfile.userName;
    }

    if (normalizedProfile.deviceId) {
      deviceId.value = normalizedProfile.deviceId;
    }

    if (normalizedProfile.affinityPoints > affinityPoints.value) {
      affinityPoints.value = normalizedProfile.affinityPoints;
    }

    applyLocalUnlocks();
  };

  const flushBackendAffinity = async () => {
    if (isBackendFlushRunning || pendingBackendAffinity <= 0 || !isRegistered.value) {
      return;
    }

    const count = pendingBackendAffinity;
    pendingBackendAffinity = 0;
    isBackendFlushRunning = true;
    lastBackendFlushAt = Date.now();

    try {
      const response = await registerLunaPet({
        userName: userName.value,
        deviceId: deviceId.value,
        count,
      });

      applyServerProfile(response.profile);
    } catch {
      pendingBackendAffinity += count;
    } finally {
      isBackendFlushRunning = false;

      if (pendingBackendAffinity > 0) {
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
      flushBackendAffinity();
    }, delay);
  };

  const queueBackendAffinity = () => {
    pendingBackendAffinity += 1;
    scheduleBackendFlush();
  };

  const registerUser = async (name) => {
    const cleanName = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);

    if (!cleanName) {
      return false;
    }

    userName.value = cleanName;
    applyLocalUnlocks();
    persist();

    try {
      const response = await registerLunaUser({
        userName: userName.value,
        deviceId: deviceId.value,
        affinityPoints: affinityPoints.value,
      });

      applyServerProfile(response.profile);
    } catch {
      // Luna keeps the local friendship safe even if the server is unavailable.
    }

    return true;
  };

  const registerAffinityInteraction = () => {
    if (!isRegistered.value) {
      return [];
    }

    const events = [];
    const previousLevel = currentLevel.value;

    affinityPoints.value += 1;
    const newMemoryIds = getUnlockedMemoryIds(currentLevelNumber.value).filter(
      (memoryId) => !unlockedMemoryIds.value.includes(memoryId),
    );

    applyLocalUnlocks();
    queueBackendAffinity();

    if (catState.value === 'sleeping' && affinityPoints.value >= PETS_REQUIRED_TO_WAKE) {
      catState.value = 'awake';
      events.push({
        type: 'wake',
        message: `Miau... ya reconozco tus caricias, ${userName.value}. Me siento tranquila contigo.`,
      });
    }

    if (currentLevelNumber.value > previousLevel.level) {
      events.push({
        type: 'level-up',
        level: currentLevel.value,
      });
    }

    if (newMemoryIds.length > 0) {
      events.push({ type: 'memory' });
    }

    if (currentLevelNumber.value === 10 && previousLevel.level < 10) {
      events.push({
        type: 'bond-complete',
        message: `Gracias por quedarte conmigo, ${userName.value}. Mis días son más felices contigo.`,
      });
    }

    return events;
  };

  watch(
    [userName, deviceId, affinityPoints, catState, unlockedLevels, unlockedMemoryIds],
    persist,
    { deep: true },
  );

  applyLocalUnlocks();

  return {
    PETS_REQUIRED_TO_WAKE,
    userName,
    deviceId,
    affinityPoints,
    catState,
    unlockedLevels,
    unlockedMemories,
    isRegistered,
    isAwake,
    hasInteracted,
    currentLevel,
    currentLevelNumber,
    currentLevelTitle,
    nextLevel,
    progressToNextLevel,
    remainingAffinityToWake,
    registerUser,
    registerAffinityInteraction,
  };
});
