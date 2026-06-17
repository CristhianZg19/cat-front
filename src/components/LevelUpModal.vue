<template>
  <div class="modal-backdrop" role="presentation">
    <article class="level-modal" role="dialog" aria-modal="true" aria-labelledby="level-title">
      <p class="level-modal__eyebrow">🎉 Nuevo nivel desbloqueado</p>
      <h2 id="level-title">🌙 Felicitaciones {{ userName }}</h2>
      <p class="level-modal__label">Ahora eres una:</p>
      <strong>{{ level.title }}</strong>
      <p class="level-modal__message">{{ level.message }}</p>

      <button type="button" @click="$emit('close')">
        Seguir acariciando a Luna
      </button>
    </article>
  </div>
</template>

<script setup>
defineEmits(['close']);

defineProps({
  userName: {
    type: String,
    required: true,
  },
  level: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 21;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(42, 31, 39, 0.24);
  backdrop-filter: blur(12px);
}

.level-modal {
  width: min(430px, 100%);
  padding: 24px;
  border: 1px solid rgba(112, 62, 86, 0.14);
  border-radius: 8px;
  background: rgba(255, 250, 253, 0.95);
  box-shadow: 0 24px 90px rgba(61, 40, 51, 0.24);
  text-align: center;
  animation: level-in 330ms cubic-bezier(0.2, 0.78, 0.25, 1);
}

.level-modal__eyebrow {
  margin: 0 0 12px;
  color: #d85f86;
  font-size: 0.88rem;
  font-weight: 850;
}

.level-modal h2 {
  margin: 0;
  color: #2f242c;
  font-size: clamp(1.45rem, 6vw, 2rem);
  letter-spacing: 0;
}

.level-modal__label {
  margin: 18px 0 8px;
  color: #6c5a64;
}

.level-modal strong {
  display: block;
  color: #8a4662;
  font-size: clamp(1.2rem, 5vw, 1.55rem);
}

.level-modal__message {
  margin: 18px 0 22px;
  color: #4d4048;
  line-height: 1.55;
}

.level-modal button {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 8px;
  background: #d85f86;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(216, 95, 134, 0.26);
}

@keyframes level-in {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }

  62% {
    transform: translateY(-4px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
