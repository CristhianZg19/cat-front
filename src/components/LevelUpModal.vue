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
  background: rgba(80, 35, 58, 0.24);
  backdrop-filter: blur(12px);
}

.level-modal {
  width: min(430px, 100%);
  padding: 24px;
  border: 1px solid rgba(211, 92, 145, 0.18);
  border-radius: 8px;
  background: rgba(255, 246, 251, 0.96);
  box-shadow: 0 24px 90px rgba(194, 79, 132, 0.25);
  text-align: center;
  animation: level-in 330ms cubic-bezier(0.2, 0.78, 0.25, 1);
}

.level-modal__eyebrow {
  margin: 0 0 12px;
  color: #e84f91;
  font-size: 0.88rem;
  font-weight: 850;
}

.level-modal h2 {
  margin: 0;
  color: #33212b;
  font-size: clamp(1.45rem, 6vw, 2rem);
  letter-spacing: 0;
}

.level-modal__label {
  margin: 18px 0 8px;
  color: #7a5568;
}

.level-modal strong {
  display: block;
  color: #b34073;
  font-size: clamp(1.2rem, 5vw, 1.55rem);
}

.level-modal__message {
  margin: 18px 0 22px;
  color: #5b3f4d;
  line-height: 1.55;
}

.level-modal button {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #e84f91, #ff87b5);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(216, 95, 150, 0.3);
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
