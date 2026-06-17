<template>
  <section class="memories" aria-labelledby="luna-memories-title">
    <h2 id="luna-memories-title">📖 Recuerdos de Luna</h2>

    <div class="memories__list">
      <article
        v-for="memory in memories"
        :key="memory.id"
        class="memory"
        :class="{ 'memory--featured': memory.image }"
      >
        <img
          v-if="memory.image"
          class="memory__image"
          :src="memory.image"
          :alt="memory.imageAlt || memory.title || 'Recuerdo de Luna'"
          loading="lazy"
        />

        <div class="memory__content">
          <span>Nivel {{ memory.level }}</span>
          <h3 v-if="memory.title">{{ memory.title }}</h3>
          <p>{{ memory.text }}</p>
        </div>
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

.memory--featured {
  display: grid;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 250, 253, 0.82);
}

.memory__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  object-fit: cover;
  object-position: center;
  box-shadow: 0 12px 32px rgba(127, 69, 98, 0.16);
}

.memory__content {
  padding: 2px;
}

.memory span {
  color: #b34073;
  font-size: 0.75rem;
  font-weight: 800;
}

.memory h3 {
  margin: 5px 0 0;
  color: #33212b;
  font-size: 0.96rem;
  line-height: 1.25;
}

.memory p {
  margin: 5px 0 0;
  color: #5b3f4d;
  font-size: 0.9rem;
  line-height: 1.45;
}
</style>
