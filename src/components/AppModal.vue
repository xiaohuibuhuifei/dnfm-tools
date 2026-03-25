<script setup>
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  width: {
    type: String,
    default: 'min(720px, calc(100vw - 1.5rem))',
  },
})

const emit = defineEmits(['close'])

function handleKeydown(event) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof window === 'undefined') {
      return
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeydown)
      return
    }

    window.removeEventListener('keydown', handleKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <teleport to="body">
    <div v-if="props.open" class="modal-overlay" @click="emit('close')">
      <section class="modal-panel" :style="{ '--modal-width': props.width }" @click.stop>
        <header class="modal-header">
          <h2>{{ props.title }}</h2>
          <button class="modal-close" type="button" aria-label="关闭弹窗" @click="emit('close')">×</button>
        </header>

        <div class="modal-body">
          <slot />
        </div>
      </section>
    </div>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  background: rgba(17, 27, 38, 0.48);
  backdrop-filter: blur(6px);
}

.modal-panel {
  width: var(--modal-width);
  max-height: min(85vh, 960px);
  overflow: auto;
  padding: 1.15rem;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 242, 234, 0.98));
  box-shadow: 0 26px 60px rgba(18, 31, 44, 0.22);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
}

.modal-close {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: rgba(25, 43, 61, 0.08);
  color: var(--ink);
  font-size: 1.25rem;
  line-height: 1;
}

.modal-body {
  margin-top: 1rem;
}
</style>
