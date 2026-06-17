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
  position: relative;
  z-index: 2;
  width: min(440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 16px 18px 15px;
  border: 1px solid rgba(211, 92, 145, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 247, 252, 0.94), rgba(255, 239, 248, 0.9));
  box-shadow: 0 22px 64px rgba(196, 76, 132, 0.16);
  backdrop-filter: blur(16px);
}

.affinity__name {
  margin-bottom: 6px;
  color: #b34073;
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
  color: #33212b;
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
  background: rgba(211, 146, 176, 0.24);
}

.affinity__meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f05b99, #ff8fbc 55%, #ffc4da);
  transition: width 220ms ease;
}

.affinity__meta {
  color: #7a5568;
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
