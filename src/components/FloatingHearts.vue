<template>
  <div class="heart-layer" aria-hidden="true">
    <span
      v-for="heart in hearts"
      :key="heart.id"
      class="floating-heart"
      :style="{
        left: `${heart.x}px`,
        top: `${heart.y}px`,
        '--drift': `${heart.drift}px`,
        '--scale': heart.scale,
        '--duration': `${heart.duration}ms`,
        color: heart.color,
      }"
    >
      ♥
    </span>
  </div>
</template>

<script setup>
defineProps({
  hearts: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.heart-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 4;
}

.floating-heart {
  position: absolute;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  font-size: calc(20px * var(--scale));
  line-height: 1;
  filter: drop-shadow(0 8px 12px rgba(143, 65, 68, 0.18));
  transform: translate(-50%, -50%);
  animation: heart-float var(--duration) cubic-bezier(0.2, 0.72, 0.25, 1) forwards;
  will-change: transform, opacity;
}

@keyframes heart-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -20%) scale(0.74);
  }

  14% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--drift)), -188px) scale(1.15);
  }
}
</style>
