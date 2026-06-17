import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import {
  getLunaProgress,
  registerLunaPet,
  registerLunaUser,
  resetLunaProgress,
  syncLunaVisualState,
} from '../services/catApi';
import {
  getCurrentAffinityLevel,
  getNextAffinityLevel,
  getUnlockedLevelNumbers,
  getUnlockedMemoryIds,
  INACTIVITY_SLEEP_MS,
  LUNA_MEMORIES,
  PETS_REQUIRED_TO_WAKE,
} from '../domain/lunaAffinity';

const STORAGE_KEY = 'sleepy-cat-luna-state-v2';
const LEGACY_STORAGE_KEY = 'sleepy-cat-state-v1';
const BACKEND_THROTTLE_MS = 500;
const STATE_SYNC_THROTTLE_MS = 500;

let pendingBackendAffinity = 0;
let backendFlushTimer = null;
let lastBackendFlushAt = 0;
let isBackendFlushRunning = false;
let localSleepTimer = null;
let pendingVisualState = null;
let visualStateFlushTimer = null;
let lastVisualStateFlushAt = 0;
let isVisualStateFlushRunning = false;
let syncGeneration = 0;

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

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
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
    catVisualState: legacyState.catState === 'awake' ? 'awake' : 'sleeping',
  };
};

const saveState = (state) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clearTimer = (timer) => {
  if (timer) {
    clearTimeout(timer);
  }

  return null;
};

const getResponseProfile = (response) => response?.data ?? response?.profile ?? null;

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
    catVisualState: profile.catVisualState === 'awake' ? 'awake' : 'sleeping',
    lastActivityAt: normalizeDate(profile.lastActivityAt),
    lastSleepAt: normalizeDate(profile.lastSleepAt),
    lastWakeUpAt: normalizeDate(profile.lastWakeUpAt),
  };
};

export const useCatStore = defineStore('cat', () => {
  const savedState = loadState();

  const userName = ref(String(savedState.userName ?? '').trim());
  const deviceId = ref(savedState.deviceId || generateDeviceId());
  const affinityPoints = ref(Math.max(0, Number(savedState.affinityPoints) || 0));
  const catVisualState = ref(savedState.catVisualState === 'awake' ? 'awake' : 'sleeping');
  const lastActivityAt = ref(normalizeDate(savedState.lastActivityAt));
  const lastSleepAt = ref(normalizeDate(savedState.lastSleepAt));
  const lastWakeUpAt = ref(normalizeDate(savedState.lastWakeUpAt));
  const sleepNoticeCount = ref(0);
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
  const isAwake = computed(() => catVisualState.value === 'awake');
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
      catVisualState: catVisualState.value,
      lastActivityAt: lastActivityAt.value,
      lastSleepAt: lastSleepAt.value,
      lastWakeUpAt: lastWakeUpAt.value,
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

  const applyServerProfile = (profile, { force = false } = {}) => {
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

    if (force || normalizedProfile.affinityPoints > affinityPoints.value) {
      affinityPoints.value = normalizedProfile.affinityPoints;
    }

    catVisualState.value = normalizedProfile.catVisualState;
    lastActivityAt.value = normalizedProfile.lastActivityAt ?? lastActivityAt.value;
    lastSleepAt.value = normalizedProfile.lastSleepAt ?? lastSleepAt.value;
    lastWakeUpAt.value = normalizedProfile.lastWakeUpAt ?? lastWakeUpAt.value;

    applyLocalUnlocks();
  };

  const flushVisualState = async () => {
    if (isVisualStateFlushRunning || !pendingVisualState || !isRegistered.value) {
      return;
    }

    const state = pendingVisualState;
    pendingVisualState = null;
    isVisualStateFlushRunning = true;
    lastVisualStateFlushAt = Date.now();
    const generation = syncGeneration;

    try {
      const response = await syncLunaVisualState({
        deviceId: deviceId.value,
        catVisualState: state,
      });

      if (generation === syncGeneration) {
        applyServerProfile(getResponseProfile(response));
      }
    } catch {
      if (generation === syncGeneration) {
        pendingVisualState = state;
      }
    } finally {
      isVisualStateFlushRunning = false;

      if (pendingVisualState) {
        scheduleVisualStateFlush();
      }
    }
  };

  const clearPendingSync = () => {
    syncGeneration += 1;
    pendingBackendAffinity = 0;
    backendFlushTimer = clearTimer(backendFlushTimer);
    isBackendFlushRunning = false;
    pendingVisualState = null;
    visualStateFlushTimer = clearTimer(visualStateFlushTimer);
    isVisualStateFlushRunning = false;
  };

  const applyResetProfile = (profile = null) => {
    const now = new Date().toISOString();

    affinityPoints.value = 0;
    catVisualState.value = 'sleeping';
    lastActivityAt.value = now;
    lastSleepAt.value = now;
    lastWakeUpAt.value = null;
    unlockedLevels.value = getUnlockedLevelNumbers(0);
    unlockedMemoryIds.value = getUnlockedMemoryIds(1);

    if (profile) {
      applyServerProfile(profile, { force: true });
    }
  };

  const scheduleVisualStateFlush = (immediate = false) => {
    if (visualStateFlushTimer) {
      return;
    }

    const delay = immediate
      ? 0
      : Math.max(0, STATE_SYNC_THROTTLE_MS - (Date.now() - lastVisualStateFlushAt));

    visualStateFlushTimer = setTimeout(() => {
      visualStateFlushTimer = null;
      flushVisualState();
    }, delay);
  };

  const queueVisualStateSync = (state, immediate = false) => {
    if (!isRegistered.value || (state !== 'sleeping' && state !== 'awake')) {
      return;
    }

    pendingVisualState = state;
    scheduleVisualStateFlush(immediate);
  };

  const putLunaToSleep = ({ sync = true, notify = false } = {}) => {
    if (catVisualState.value === 'sleeping') {
      return;
    }

    catVisualState.value = 'sleeping';
    lastSleepAt.value = new Date().toISOString();

    if (sync) {
      queueVisualStateSync('sleeping', true);
    }

    if (notify) {
      sleepNoticeCount.value += 1;
    }
  };

  const scheduleLocalSleep = () => {
    if (localSleepTimer) {
      clearTimeout(localSleepTimer);
      localSleepTimer = null;
    }

    if (!isRegistered.value || catVisualState.value !== 'awake') {
      return;
    }

    const lastActivityTime = lastActivityAt.value ? new Date(lastActivityAt.value).getTime() : Date.now();
    const inactiveTime = Date.now() - lastActivityTime;
    const delay = Math.max(0, INACTIVITY_SLEEP_MS - inactiveTime);

    localSleepTimer = setTimeout(() => {
      localSleepTimer = null;
      putLunaToSleep({ sync: true, notify: true });
    }, delay);
  };

  const registerVisualActivity = ({ sync = true } = {}) => {
    if (!isRegistered.value) {
      return;
    }

    const now = new Date().toISOString();
    const wasSleeping = catVisualState.value !== 'awake';

    catVisualState.value = 'awake';
    lastActivityAt.value = now;

    if (wasSleeping) {
      lastWakeUpAt.value = now;
    }

    if (sync) {
      queueVisualStateSync('awake');
    }
  };

  const flushBackendAffinity = async () => {
    if (isBackendFlushRunning || pendingBackendAffinity <= 0 || !isRegistered.value) {
      return;
    }

    const count = pendingBackendAffinity;
    pendingBackendAffinity = 0;
    isBackendFlushRunning = true;
    lastBackendFlushAt = Date.now();
    const generation = syncGeneration;

    try {
      const response = await registerLunaPet({
        userName: userName.value,
        deviceId: deviceId.value,
        count,
      });

      if (generation === syncGeneration) {
        applyServerProfile(getResponseProfile(response));
      }
    } catch {
      if (generation === syncGeneration) {
        pendingBackendAffinity += count;
      }
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

  const loadProgress = async () => {
    if (!isRegistered.value) {
      return false;
    }

    try {
      const response = await getLunaProgress(deviceId.value);
      applyServerProfile(getResponseProfile(response));
      return true;
    } catch {
      return false;
    }
  };

  const registerUser = async (name) => {
    const cleanName = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);

    if (!cleanName) {
      return false;
    }

    userName.value = cleanName;
    lastActivityAt.value = lastActivityAt.value ?? new Date().toISOString();
    applyLocalUnlocks();
    persist();

    try {
      const response = await registerLunaUser({
        userName: userName.value,
        deviceId: deviceId.value,
        affinityPoints: affinityPoints.value,
      });

      applyServerProfile(getResponseProfile(response));
    } catch {
      // Luna keeps the local friendship safe even if the server is unavailable.
    }

    return true;
  };

  const resetProgress = async () => {
    if (!isRegistered.value) {
      return false;
    }

    clearPendingSync();

    try {
      const response = await resetLunaProgress({
        userName: userName.value,
        deviceId: deviceId.value,
      });

      applyResetProfile(getResponseProfile(response));
      persist();
      return true;
    } catch (error) {
      if (error?.response?.status === 404) {
        applyResetProfile();
        persist();
        return true;
      }

      return false;
    }
  };

  const registerAffinityInteraction = () => {
    if (!isRegistered.value) {
      return [];
    }

    const events = [];
    const previousLevel = currentLevel.value;
    const wasSleeping = catVisualState.value !== 'awake';

    registerVisualActivity({ sync: false });
    affinityPoints.value += 1;

    const newMemoryIds = getUnlockedMemoryIds(currentLevelNumber.value).filter(
      (memoryId) => !unlockedMemoryIds.value.includes(memoryId),
    );

    applyLocalUnlocks();
    queueBackendAffinity();

    if (wasSleeping) {
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
    [
      userName,
      deviceId,
      affinityPoints,
      catVisualState,
      lastActivityAt,
      lastSleepAt,
      lastWakeUpAt,
      unlockedLevels,
      unlockedMemoryIds,
    ],
    persist,
    { deep: true },
  );

  watch([isRegistered, catVisualState, lastActivityAt], scheduleLocalSleep, { immediate: true });

  applyLocalUnlocks();

  return {
    INACTIVITY_SLEEP_MS,
    PETS_REQUIRED_TO_WAKE,
    userName,
    deviceId,
    affinityPoints,
    catVisualState,
    catState: catVisualState,
    lastActivityAt,
    lastSleepAt,
    lastWakeUpAt,
    sleepNoticeCount,
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
    loadProgress,
    putLunaToSleep,
    registerUser,
    resetProgress,
    registerVisualActivity,
    registerAffinityInteraction,
  };
});
