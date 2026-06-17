<template>
  <aside class="affinity" aria-label="Afinidad con Luna">
    <div class="affinity__name">{{ userName }}</div>

    <div class="affinity__level">
      <span>Nivel {{ currentLevelNumber }}</span>
      <strong>{{ currentLevelTitle }}</strong>
    </div>

    <div class="affinity__meter" aria-hidden="true">
      <span :style="{ width: `${progressToNextLevel}%` }" />
    </div>

    <div class="affinity__meta">
      <span>{{ affinityPoints }} puntos de afinidad</span>
      <span v-if="nextLevel">{{ progressToNextLevel }}% para el siguiente nivel</span>
      <span v-else>Vínculo completo con Luna</span>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  userName: {
    type: String,
    required: true,
  },
  currentLevelNumber: {
    type: Number,
    required: true,
  },
  currentLevelTitle: {
    type: String,
    required: true,
  },
  affinityPoints: {
    type: Number,
    required: true,
  },
  progressToNextLevel: {
    type: Number,
    required: true,
  },
  nextLevel: {
    type: Object,
    default: null,
  },
});
</script>

<style scoped>
.affinity {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  left: 50%;
  z-index: 6;
  width: min(440px, calc(100vw - 32px));
  padding: 14px 16px 13px;
  border: 1px solid rgba(108, 59, 82, 0.14);
  border-radius: 8px;
  background: rgba(255, 250, 253, 0.78);
  box-shadow: 0 20px 60px rgba(91, 52, 70, 0.13);
  transform: translateX(-50%);
  backdrop-filter: blur(16px);
}

.affinity__name {
  margin-bottom: 6px;
  color: #8a4662;
  font-size: 0.86rem;
  font-weight: 800;
}

.affinity__level,
.affinity__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.affinity__level {
  color: #2f242c;
  font-size: 0.9rem;
}

.affinity__level strong {
  text-align: right;
  font-size: 0.94rem;
}

.affinity__meter {
  height: 9px;
  margin: 11px 0 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(123, 84, 101, 0.16);
}

.affinity__meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #e96c8f, #f3a16f 48%, #77b99b);
  transition: width 220ms ease;
}

.affinity__meta {
  color: #695763;
  font-size: 0.76rem;
}

@media (max-width: 420px) {
  .affinity__level,
  .affinity__meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .affinity__level strong {
    text-align: left;
  }
}
</style>
