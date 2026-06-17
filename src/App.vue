<template>
  <main
    class="app-shell"
    :class="{ 'app-shell--awake': store.isAwake, 'app-shell--with-hud': showHud }"
  >
    <Transition name="hud">
      <AffinityBar
        v-if="showHud"
        :user-name="store.userName"
        :current-level-number="store.currentLevelNumber"
        :current-level-title="store.currentLevelTitle"
        :affinity-points="store.affinityPoints"
        :progress-to-next-level="store.progressToNextLevel"
        :next-level="store.nextLevel"
      />
    </Transition>

    <div class="luna-content">
      <CatView
        @message="showMessage"
        @level-up="showLevelUp"
        @memory="showMemoryToast"
      />

      <Transition name="memory-panel">
        <LunaMemories
          v-if="store.isRegistered && store.unlockedMemories.length"
          :memories="store.unlockedMemories"
        />
      </Transition>
    </div>

    <Transition name="message">
      <p v-if="activeMessage" class="cat-message">{{ activeMessage }}</p>
    </Transition>

    <div class="luna-toast-stack" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="toast in lunaToasts" :key="toast.id" class="luna-toast">
          {{ toast.title }}
        </div>
      </TransitionGroup>
    </div>

    <Transition name="modal">
      <UserRegistrationModal
        v-if="!store.isRegistered"
        @submit="registerUser"
      />
    </Transition>

    <Transition name="modal">
      <LevelUpModal
        v-if="activeLevel"
        :user-name="store.userName"
        :level="activeLevel"
        @close="activeLevel = null"
      />
    </Transition>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import AffinityBar from './components/AffinityBar.vue';
import CatView from './components/CatView.vue';
import LevelUpModal from './components/LevelUpModal.vue';
import LunaMemories from './components/LunaMemories.vue';
import UserRegistrationModal from './components/UserRegistrationModal.vue';
import { useCatStore } from './stores/catStore';

const store = useCatStore();
const activeMessage = ref('');
const activeLevel = ref(null);
const lunaToasts = ref([]);
let messageTimer = null;
let toastId = 0;

const showHud = computed(() => store.isRegistered);

const showMessage = (message) => {
  activeMessage.value = message;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    activeMessage.value = '';
  }, 3600);
};

const showToast = (title) => {
  const toast = {
    id: `${Date.now()}-${toastId++}`,
    title,
  };

  lunaToasts.value = [...lunaToasts.value, toast];

  setTimeout(() => {
    lunaToasts.value = lunaToasts.value.filter((item) => item.id !== toast.id);
  }, 3600);
};

const registerUser = async (name) => {
  const wasRegistered = await store.registerUser(name);

  if (wasRegistered) {
    showMessage(`Gracias por quedarte conmigo, ${store.userName}. Acaríciame suavecito cuando quieras.`);
  }
};

const showLevelUp = (level) => {
  activeLevel.value = level;
};

const showMemoryToast = () => {
  showToast('🌙 Te compartí un recuerdo nuevo');
};
</script>
