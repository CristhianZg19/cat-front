<template>
  <section ref="stageRef" class="cat-stage" aria-label="Luna">
    <div
      class="cat-touch-zone"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerEnd"
      @pointercancel="handlePointerEnd"
      @pointerleave="handlePointerEnd"
    >
      <div ref="followRef" class="cat-follow">
        <div ref="breathRef" class="cat-breath">
          <div ref="pulseRef" class="cat-pulse">
            <img
              ref="sleepingImageRef"
              class="cat-image cat-image--sleeping"
              src="../assets/cat-sleeping.png"
              alt="Luna dormida"
              draggable="false"
            />
            <img
              ref="awakeImageRef"
              class="cat-image cat-image--awake"
              src="../assets/cat-awake.png"
              alt="Luna despierta"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>

    <FloatingHearts :hearts="hearts" />
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import FloatingHearts from './FloatingHearts.vue';
import { useCatStore } from '../stores/catStore';
import { playOptionalSound } from '../services/sound';

const emit = defineEmits(['message', 'level-up', 'memory']);

const store = useCatStore();
const stageRef = ref(null);
const followRef = ref(null);
const breathRef = ref(null);
const pulseRef = ref(null);
const sleepingImageRef = ref(null);
const awakeImageRef = ref(null);
const hearts = ref([]);

const STROKE_DISTANCE_REQUIRED = 26;
const STROKE_INTERVAL_REQUIRED = 90;
const HEART_COLORS = ['#e96c74', '#f2a867', '#c75d78', '#76b890'];

let isStroking = false;
let activePointerId = null;
let lastPoint = null;
let strokeDistance = 0;
let lastPetAt = 0;
let heartId = 0;
let breathingTween = null;
let blinkTimer = null;
let lastPurrAt = 0;

const getTouchPoint = (event) => {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];

  if (!touch) {
    return null;
  }

  return {
    x: touch.clientX,
    y: touch.clientY,
  };
};

const getPointerPoint = (event) => ({
  x: event.clientX,
  y: event.clientY,
});

const getDistance = (from, to) => Math.hypot(to.x - from.x, to.y - from.y);

const isPointInsideStage = (point) => {
  const rect = stageRef.value?.getBoundingClientRect();

  if (!rect) {
    return false;
  }

  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
};

const createHeart = (point, options = {}) => {
  const rect = stageRef.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  const heart = {
    id: `${Date.now()}-${heartId++}`,
    x: options.x ?? point.x - rect.left,
    y: options.y ?? point.y - rect.top,
    drift: options.drift ?? Math.round((Math.random() - 0.5) * 88),
    scale: options.scale ?? (0.86 + Math.random() * 0.42).toFixed(2),
    duration: options.duration ?? Math.round(1250 + Math.random() * 550),
    color: options.color ?? HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
  };

  hearts.value = [...hearts.value, heart];

  setTimeout(() => {
    hearts.value = hearts.value.filter((item) => item.id !== heart.id);
  }, heart.duration + 80);
};

const createHeartRain = () => {
  const rect = stageRef.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  Array.from({ length: 34 }).forEach((_, index) => {
    setTimeout(() => {
      createHeart(
        { x: rect.left + Math.random() * rect.width, y: rect.bottom - Math.random() * rect.height * 0.22 },
        {
          x: Math.random() * rect.width,
          y: rect.height + 20,
          drift: Math.round((Math.random() - 0.5) * 140),
          scale: (0.82 + Math.random() * 0.72).toFixed(2),
          duration: Math.round(1500 + Math.random() * 900),
        },
      );
    }, index * 42);
  });
};

const vibrateSoftly = () => {
  if (navigator.vibrate) {
    navigator.vibrate(12);
  }
};

const playPurr = () => {
  if (Date.now() - lastPurrAt < 1400) {
    return;
  }

  lastPurrAt = Date.now();
  playOptionalSound('/sounds/ronroneo.mp3', { volume: 0.28 });
};

const applyFollow = (point) => {
  if (!store.isAwake || !followRef.value) {
    return;
  }

  const rect = stageRef.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  const horizontal = Math.max(-1, Math.min(1, (point.x - (rect.left + rect.width / 2)) / (rect.width / 2)));
  const vertical = Math.max(-1, Math.min(1, (point.y - (rect.top + rect.height / 2)) / (rect.height / 2)));

  gsap.to(followRef.value, {
    x: horizontal * 10,
    y: vertical * 5,
    rotate: horizontal * 3,
    duration: 0.22,
    ease: 'power3.out',
    overwrite: 'auto',
  });
};

const resetFollow = () => {
  if (!followRef.value) {
    return;
  }

  gsap.to(followRef.value, {
    x: 0,
    y: 0,
    rotate: 0,
    duration: 0.75,
    ease: 'elastic.out(1, 0.45)',
    overwrite: 'auto',
  });
};

const pulseSatisfaction = () => {
  if (!pulseRef.value) {
    return;
  }

  gsap.fromTo(
    pulseRef.value,
    { scale: 1, y: 0 },
    {
      scale: 1.045,
      y: -4,
      duration: 0.14,
      yoyo: true,
      repeat: 1,
      ease: 'sine.out',
      overwrite: 'auto',
    },
  );
};

const startBreathing = () => {
  if (!breathRef.value || store.isAwake) {
    return;
  }

  breathingTween?.kill();
  breathingTween = gsap.to(breathRef.value, {
    scale: 1.03,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

const stopBreathing = () => {
  breathingTween?.kill();
  breathingTween = null;

  if (breathRef.value) {
    gsap.to(breathRef.value, {
      scale: 1,
      y: 0,
      duration: 0.22,
      ease: 'power2.out',
    });
  }
};

const clearBlinkTimer = () => {
  if (blinkTimer) {
    clearTimeout(blinkTimer);
    blinkTimer = null;
  }
};

const scheduleBlink = () => {
  clearBlinkTimer();

  if (!store.isAwake) {
    return;
  }

  blinkTimer = setTimeout(() => {
    if (!sleepingImageRef.value || !store.isAwake) {
      scheduleBlink();
      return;
    }

    gsap
      .timeline({
        onComplete: scheduleBlink,
      })
      .to(sleepingImageRef.value, {
        autoAlpha: 1,
        duration: 0.055,
        ease: 'none',
      })
      .to(sleepingImageRef.value, {
        autoAlpha: 0,
        duration: 0.09,
        ease: 'none',
      }, '+=0.08');
  }, 5000 + Math.random() * 3000);
};

const wakeUpAnimation = async () => {
  await nextTick();
  stopBreathing();
  clearBlinkTimer();
  playOptionalSound('/sounds/despertar.mp3', { volume: 0.5 });

  gsap
    .timeline({
      onComplete: scheduleBlink,
    })
    .to(
      sleepingImageRef.value,
      {
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power2.out',
      },
      0,
    )
    .to(
      awakeImageRef.value,
      {
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power2.out',
      },
      0,
    )
    .fromTo(
      breathRef.value,
      { scale: 1, y: 0 },
      {
        scale: 1.08,
        y: -10,
        duration: 0.28,
        ease: 'power2.out',
      },
      0.12,
    )
    .to(breathRef.value, {
      scale: 1,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.45)',
    });
};

const dispatchStoreEvents = (events) => {
  events.forEach((event) => {
    if (event.message) {
      emit('message', event.message);
    }

    if (event.type === 'bond-complete') {
      createHeartRain();
    }

    if (event.type === 'level-up') {
      emit('level-up', event.level);
    }

    if (event.type === 'memory') {
      emit('memory');
    }
  });
};

const countPet = (point) => {
  if (!store.isRegistered) {
    return;
  }

  createHeart(point);
  vibrateSoftly();
  pulseSatisfaction();
  playPurr();

  const events = store.registerAffinityInteraction();
  dispatchStoreEvents(events);
};

const beginStroke = (point) => {
  if (!point || !isPointInsideStage(point)) {
    return;
  }

  isStroking = true;
  lastPoint = point;
  strokeDistance = 0;
  lastPetAt = Date.now();
  applyFollow(point);
};

const moveStroke = (point) => {
  if (!isStroking || !lastPoint || !point || !isPointInsideStage(point)) {
    return;
  }

  const distance = getDistance(lastPoint, point);

  if (distance < 1.5) {
    return;
  }

  strokeDistance += distance;
  lastPoint = point;
  applyFollow(point);

  if (strokeDistance >= STROKE_DISTANCE_REQUIRED && Date.now() - lastPetAt >= STROKE_INTERVAL_REQUIRED) {
    countPet(point);
    strokeDistance = 0;
    lastPetAt = Date.now();
  }
};

const endStroke = () => {
  if (isStroking && lastPoint && strokeDistance >= STROKE_DISTANCE_REQUIRED) {
    countPet(lastPoint);
  }

  isStroking = false;
  activePointerId = null;
  lastPoint = null;
  strokeDistance = 0;
  resetFollow();
};

const handleTouchStart = (event) => {
  event.preventDefault();
  beginStroke(getTouchPoint(event));
};

const handleTouchMove = (event) => {
  event.preventDefault();
  moveStroke(getTouchPoint(event));
};

const handleTouchEnd = () => {
  endStroke();
};

const handlePointerDown = (event) => {
  if (event.pointerType === 'touch') {
    return;
  }

  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  beginStroke(getPointerPoint(event));
};

const handlePointerMove = (event) => {
  if (event.pointerType === 'touch' || activePointerId !== event.pointerId) {
    return;
  }

  moveStroke(getPointerPoint(event));
};

const handlePointerEnd = (event) => {
  if (event.pointerType === 'touch' || activePointerId !== event.pointerId) {
    return;
  }

  endStroke();
};

onMounted(() => {
  gsap.set(sleepingImageRef.value, { autoAlpha: store.isAwake ? 0 : 1 });
  gsap.set(awakeImageRef.value, { autoAlpha: store.isAwake ? 1 : 0 });

  if (store.isAwake) {
    scheduleBlink();
    return;
  }

  startBreathing();
});

watch(
  () => store.catState,
  (state) => {
    if (state === 'awake') {
      wakeUpAnimation();
    } else {
      startBreathing();
    }
  },
);

onBeforeUnmount(() => {
  breathingTween?.kill();
  clearBlinkTimer();
  gsap.killTweensOf([followRef.value, breathRef.value, pulseRef.value, sleepingImageRef.value, awakeImageRef.value]);
});
</script>

<style scoped>
.cat-stage {
  position: relative;
  width: min(88vw, 760px);
  aspect-ratio: 1280 / 921;
  margin: 0 auto;
  touch-action: none;
  isolation: isolate;
}

.cat-touch-zone,
.cat-follow,
.cat-breath,
.cat-pulse {
  position: absolute;
  inset: 0;
}

.cat-touch-zone {
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.cat-touch-zone:active {
  cursor: grabbing;
}

.cat-follow,
.cat-breath,
.cat-pulse {
  transform-origin: 50% 58%;
  will-change: transform;
}

.cat-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 26px 46px rgba(77, 49, 32, 0.18));
}

.cat-image--sleeping {
  z-index: 2;
}

.cat-image--awake {
  z-index: 1;
}

@media (max-width: 560px) {
  .cat-stage {
    width: min(94vw, 520px);
  }
}
</style>
