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
  background: rgba(42, 31, 39, 0.28);
  backdrop-filter: blur(12px);
}

.register-modal {
  width: min(390px, 100%);
  padding: 24px;
  border: 1px solid rgba(112, 62, 86, 0.14);
  border-radius: 8px;
  background: rgba(255, 250, 253, 0.94);
  box-shadow: 0 24px 90px rgba(61, 40, 51, 0.22);
  animation: modal-in 260ms cubic-bezier(0.2, 0.78, 0.25, 1);
}

.register-modal h1 {
  margin: 0 0 10px;
  color: #2f242c;
  font-size: clamp(1.5rem, 7vw, 2rem);
  letter-spacing: 0;
}

.register-modal p {
  margin: 0 0 20px;
  color: #6c5a64;
  line-height: 1.5;
}

.register-modal label {
  display: block;
  margin-bottom: 7px;
  color: #8a4662;
  font-size: 0.84rem;
  font-weight: 800;
}

.register-modal input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(113, 70, 88, 0.22);
  border-radius: 8px;
  outline: none;
  background: rgba(255, 255, 255, 0.82);
  color: #2f242c;
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
  background: #d85f86;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(216, 95, 134, 0.26);
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
