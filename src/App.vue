<template>
  <main class="app-shell" :class="{ 'app-shell--awake': store.isAwake, 'app-shell--with-hud': showHud }">
    <Transition name="hud">
      <HappinessBar
        v-if="showHud"
        :happiness="store.happiness"
        :happiness-percent="store.happinessPercent"
        :total-pets="store.totalPets"
        :remaining-pets-to-wake="store.remainingPetsToWake"
        :cat-state="store.catState"
        :mood="store.mood"
      />
    </Transition>

    <CatView @message="showMessage" @achievement="showAchievement" />

    <Transition name="message">
      <p v-if="activeMessage" class="cat-message">{{ activeMessage }}</p>
    </Transition>

    <div class="achievement-stack" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="toast in achievementToasts" :key="toast.id" class="achievement-toast">
          {{ toast.title }}
        </div>
      </TransitionGroup>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import CatView from './components/CatView.vue';
import HappinessBar from './components/HappinessBar.vue';
import { useCatStore } from './stores/catStore';

const store = useCatStore();
const activeMessage = ref('');
const achievementToasts = ref([]);
let messageTimer = null;
let toastId = 0;

const showHud = computed(() => store.hasInteracted || store.isAwake);

const showMessage = (message) => {
  activeMessage.value = message;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    activeMessage.value = '';
  }, 3200);
};

const showAchievement = (title) => {
  const toast = {
    id: `${Date.now()}-${toastId++}`,
    title,
  };

  achievementToasts.value = [...achievementToasts.value, toast];

  setTimeout(() => {
    achievementToasts.value = achievementToasts.value.filter((item) => item.id !== toast.id);
  }, 3600);
};
</script>
