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

    <div v-if="showHud" class="luna-menu">
      <button
        class="luna-menu__trigger"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-label="Abrir opciones de Luna"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span />
        <span />
        <span />
      </button>

      <Transition name="menu">
        <div v-if="isMenuOpen" class="luna-menu__panel">
          <button type="button" @click="openResetModal">
            Volver a empezar desde Nivel 1
          </button>
        </div>
      </Transition>
    </div>

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

    <Transition name="modal">
      <div v-if="isResetModalOpen" class="reset-backdrop" role="presentation" @click.self="closeResetModal">
        <article class="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <p class="reset-modal__eyebrow">Reiniciar amistad</p>
          <h2 id="reset-title">Volver al Nivel 1</h2>
          <p>
            Se volverá a iniciar la afinidad con Luna desde cero. Tu nombre se conserva,
            pero los puntos, niveles y recuerdos desbloqueados empezarán otra vez.
          </p>

          <div class="reset-modal__actions">
            <button class="reset-modal__secondary" type="button" :disabled="isResetting" @click="closeResetModal">
              Cancelar
            </button>
            <button class="reset-modal__primary" type="button" :disabled="isResetting" @click="confirmReset">
              {{ isResetting ? 'Reiniciando...' : 'Sí, volver al Nivel 1' }}
            </button>
          </div>
        </article>
      </div>
    </Transition>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
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
const isMenuOpen = ref(false);
const isResetModalOpen = ref(false);
const isResetting = ref(false);
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

const openResetModal = () => {
  isMenuOpen.value = false;
  isResetModalOpen.value = true;
};

const closeResetModal = () => {
  if (isResetting.value) {
    return;
  }

  isResetModalOpen.value = false;
};

const confirmReset = async () => {
  if (isResetting.value) {
    return;
  }

  isResetting.value = true;
  const wasReset = await store.resetProgress();
  isResetting.value = false;

  if (!wasReset) {
    showMessage('No pude reiniciar ahora. Intenta otra vez en un momento.');
    return;
  }

  activeLevel.value = null;
  isResetModalOpen.value = false;
  showMessage(`Listo, ${store.userName}. Luna volvió al Nivel 1 para empezar de nuevo contigo.`);
};

onMounted(() => {
  store.loadProgress();
});

watch(
  () => store.sleepNoticeCount,
  (noticeCount, previousNoticeCount) => {
    if (noticeCount > previousNoticeCount) {
      showMessage('🌙 Luna volvió a quedarse dormidita...');
    }
  },
);
</script>

<style scoped>
.luna-menu {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  right: 14px;
  z-index: 12;
}

.luna-menu__trigger {
  display: grid;
  align-content: center;
  gap: 4px;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(211, 92, 145, 0.2);
  border-radius: 8px;
  background: rgba(255, 247, 252, 0.92);
  box-shadow: 0 14px 36px rgba(196, 76, 132, 0.18);
  cursor: pointer;
  backdrop-filter: blur(14px);
}

.luna-menu__trigger span {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: #b34073;
}

.luna-menu__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(252px, calc(100vw - 28px));
  padding: 8px;
  border: 1px solid rgba(211, 92, 145, 0.18);
  border-radius: 8px;
  background: rgba(255, 247, 252, 0.96);
  box-shadow: 0 20px 58px rgba(196, 76, 132, 0.2);
  backdrop-filter: blur(16px);
}

.luna-menu__panel button {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 228, 241, 0.76);
  color: #8b315c;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  text-align: left;
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.reset-backdrop {
  position: fixed;
  inset: 0;
  z-index: 22;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(80, 35, 58, 0.24);
  backdrop-filter: blur(12px);
}

.reset-modal {
  width: min(430px, 100%);
  padding: 22px;
  border: 1px solid rgba(211, 92, 145, 0.18);
  border-radius: 8px;
  background: rgba(255, 246, 251, 0.97);
  box-shadow: 0 24px 90px rgba(194, 79, 132, 0.25);
  text-align: center;
}

.reset-modal__eyebrow {
  margin: 0 0 10px;
  color: #e84f91;
  font-size: 0.84rem;
  font-weight: 850;
}

.reset-modal h2 {
  margin: 0;
  color: #33212b;
  font-size: clamp(1.45rem, 6vw, 1.9rem);
  letter-spacing: 0;
}

.reset-modal p {
  margin: 14px 0 20px;
  color: #5b3f4d;
  font-size: 0.96rem;
  line-height: 1.5;
}

.reset-modal__actions {
  display: grid;
  gap: 10px;
}

.reset-modal__actions button {
  min-height: 46px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 850;
}

.reset-modal__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.reset-modal__secondary {
  border: 1px solid rgba(211, 92, 145, 0.22);
  background: rgba(255, 255, 255, 0.74);
  color: #8b315c;
}

.reset-modal__primary {
  border: 0;
  background: linear-gradient(135deg, #e84f91, #ff87b5);
  box-shadow: 0 12px 28px rgba(216, 95, 150, 0.28);
  color: #fff;
}

@media (max-width: 420px) {
  .luna-menu {
    right: 10px;
  }

  .luna-menu__trigger {
    width: 38px;
    height: 38px;
  }
}
</style>
