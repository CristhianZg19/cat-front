<template>
  <section class="memories" aria-labelledby="luna-memories-title">
    <h2 id="luna-memories-title">📖 Recuerdos de Luna</h2>

    <div class="memories__list">
      <article v-for="memory in memories" :key="memory.id" class="memory">
        <span>Nivel {{ memory.level }}</span>
        <p>{{ memory.text }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  memories: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.memories {
  width: min(560px, calc(100vw - 32px));
  margin: 12px auto 0;
  padding: 16px;
  border: 1px solid rgba(108, 59, 82, 0.12);
  border-radius: 8px;
  background: rgba(255, 250, 253, 0.68);
  box-shadow: 0 18px 50px rgba(91, 52, 70, 0.1);
  backdrop-filter: blur(14px);
}

.memories h2 {
  margin: 0 0 12px;
  color: #2f242c;
  font-size: 1rem;
  letter-spacing: 0;
}

.memories__list {
  display: grid;
  gap: 10px;
}

.memory {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
}

.memory span {
  color: #8a4662;
  font-size: 0.75rem;
  font-weight: 800;
}

.memory p {
  margin: 5px 0 0;
  color: #4d4048;
  font-size: 0.9rem;
  line-height: 1.45;
}
</style>
