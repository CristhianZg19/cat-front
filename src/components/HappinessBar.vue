<template>
  <aside class="happiness" aria-label="Felicidad del gato">
    <div class="happiness__top">
      <span>{{ mood }}</span>
      <strong>{{ happiness }}/100</strong>
    </div>

    <div class="happiness__meter" aria-hidden="true">
      <span :style="{ width: `${happinessPercent}%` }" />
    </div>

    <div class="happiness__meta">
      <span>{{ totalPets }} caricias</span>
      <span v-if="catState === 'sleeping'">{{ remainingPetsToWake }} para despertar</span>
      <span v-else>Despierto</span>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  happiness: {
    type: Number,
    required: true,
  },
  happinessPercent: {
    type: Number,
    required: true,
  },
  totalPets: {
    type: Number,
    required: true,
  },
  remainingPetsToWake: {
    type: Number,
    required: true,
  },
  catState: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.happiness {
  position: fixed;
  top: max(18px, env(safe-area-inset-top));
  left: 50%;
  z-index: 6;
  width: min(420px, calc(100vw - 32px));
  padding: 14px 16px 13px;
  border: 1px solid rgba(82, 54, 39, 0.12);
  border-radius: 8px;
  background: rgba(255, 250, 244, 0.72);
  box-shadow: 0 20px 60px rgba(80, 52, 35, 0.12);
  transform: translateX(-50%);
  backdrop-filter: blur(16px);
}

.happiness__top,
.happiness__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.happiness__top {
  color: #2b221a;
  font-size: 0.95rem;
}

.happiness__top strong {
  font-size: 0.98rem;
}

.happiness__meter {
  height: 9px;
  margin: 11px 0 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(117, 91, 71, 0.16);
}

.happiness__meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #e96c74, #f2a867 46%, #76b890);
  transition: width 220ms ease;
}

.happiness__meta {
  color: #695d51;
  font-size: 0.78rem;
}
</style>
