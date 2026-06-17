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
  margin: 0 auto;
  padding: 16px;
  border: 1px solid rgba(211, 92, 145, 0.15);
  border-radius: 8px;
  background: rgba(255, 246, 251, 0.78);
  box-shadow: 0 18px 54px rgba(196, 76, 132, 0.13);
  backdrop-filter: blur(14px);
}

.memories h2 {
  margin: 0 0 12px;
  color: #33212b;
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
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(211, 92, 145, 0.08);
}

.memory span {
  color: #b34073;
  font-size: 0.75rem;
  font-weight: 800;
}

.memory p {
  margin: 5px 0 0;
  color: #5b3f4d;
  font-size: 0.9rem;
  line-height: 1.45;
}
</style>
