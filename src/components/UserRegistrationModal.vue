<template>
  <div class="modal-backdrop" role="presentation">
    <form class="register-modal" @submit.prevent="submitName">
      <h1>🌙 Luna quiere conocerte</h1>
      <p>Antes de comenzar, dime cómo te llamas para poder hablar contigo.</p>

      <label for="luna-user-name">Nombre</label>
      <input
        id="luna-user-name"
        v-model.trim="name"
        autocomplete="given-name"
        maxlength="40"
        placeholder="Tu nombre"
        type="text"
      />

      <button type="submit" :disabled="!name || isSubmitting">
        Comenzar
      </button>
    </form>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';

const emit = defineEmits(['submit']);
const name = ref('');
const isSubmitting = ref(false);

const submitName = async () => {
  if (!name.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  await emit('submit', name.value);
  isSubmitting.value = false;
};

onMounted(async () => {
  await nextTick();
  document.querySelector('#luna-user-name')?.focus();
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(80, 35, 58, 0.26);
  backdrop-filter: blur(12px);
}

.register-modal {
  width: min(390px, 100%);
  padding: 24px;
  border: 1px solid rgba(211, 92, 145, 0.18);
  border-radius: 8px;
  background: rgba(255, 246, 251, 0.96);
  box-shadow: 0 24px 90px rgba(194, 79, 132, 0.24);
  animation: modal-in 260ms cubic-bezier(0.2, 0.78, 0.25, 1);
}

.register-modal h1 {
  margin: 0 0 10px;
  color: #33212b;
  font-size: clamp(1.5rem, 7vw, 2rem);
  letter-spacing: 0;
}

.register-modal p {
  margin: 0 0 20px;
  color: #7a5568;
  line-height: 1.5;
}

.register-modal label {
  display: block;
  margin-bottom: 7px;
  color: #b34073;
  font-size: 0.84rem;
  font-weight: 800;
}

.register-modal input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(211, 92, 145, 0.24);
  border-radius: 8px;
  outline: none;
  background: rgba(255, 255, 255, 0.82);
  color: #33212b;
}

.register-modal input:focus {
  border-color: #d86891;
  box-shadow: 0 0 0 4px rgba(216, 104, 145, 0.16);
}

.register-modal button {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #e84f91, #ff87b5);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(216, 95, 150, 0.3);
}

.register-modal button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
